import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from pipeline import step_draft, step_eval, run_pipeline


def _mock_response(text: str) -> MagicMock:
    resp = MagicMock()
    resp.text = text
    return resp


@pytest.mark.asyncio
async def test_step_draft_returns_text():
    mock = _mock_response("# Generated Document\n\nContent body.")
    with patch("pipeline.client.aio.models.generate_content", new=AsyncMock(return_value=mock)):
        result = await step_draft({"topic": "AI", "doc_type": "일반 문서", "instructions": ""})
    assert result == "# Generated Document\n\nContent body."


@pytest.mark.asyncio
async def test_step_eval_parses_plain_json():
    eval_data = {"overall": 8, "clarity": 7, "structure": 9, "completeness": 8, "feedback": "Good"}
    mock = _mock_response(json.dumps(eval_data))
    with patch("pipeline.client.aio.models.generate_content", new=AsyncMock(return_value=mock)):
        result = await step_eval("# Draft", {"topic": "AI", "doc_type": "일반 문서"})
    assert result["overall"] == 8
    assert result["feedback"] == "Good"


@pytest.mark.asyncio
async def test_step_eval_parses_markdown_codeblock():
    """step_eval strips ```json ... ``` wrapper before parsing."""
    eval_data = {"overall": 7, "clarity": 6, "structure": 8, "completeness": 7}
    wrapped = f"```json\n{json.dumps(eval_data)}\n```"
    mock = _mock_response(wrapped)
    with patch("pipeline.client.aio.models.generate_content", new=AsyncMock(return_value=mock)):
        result = await step_eval("# Draft", {"topic": "Test", "doc_type": "이메일"})
    assert result["overall"] == 7


@pytest.mark.asyncio
async def test_step_eval_clamps_score_above_10():
    """Scores above 10 returned by LLM are clamped to 10."""
    eval_data = {"overall": 12, "clarity": 11, "structure": 15, "completeness": 10}
    mock = _mock_response(json.dumps(eval_data))
    with patch("pipeline.client.aio.models.generate_content", new=AsyncMock(return_value=mock)):
        result = await step_eval("# Draft", {"topic": "AI", "doc_type": "일반 문서"})
    assert result["overall"] == 10
    assert result["clarity"] == 10
    assert result["structure"] == 10


@pytest.mark.asyncio
async def test_step_eval_clamps_score_below_1():
    """Scores below 1 returned by LLM are clamped to 1."""
    eval_data = {"overall": 0, "clarity": -3, "structure": 1, "completeness": 0}
    mock = _mock_response(json.dumps(eval_data))
    with patch("pipeline.client.aio.models.generate_content", new=AsyncMock(return_value=mock)):
        result = await step_eval("# Draft", {"topic": "AI", "doc_type": "일반 문서"})
    assert result["overall"] == 1
    assert result["clarity"] == 1


@pytest.mark.asyncio
async def test_step_eval_raises_on_invalid_json():
    """step_eval raises ValueError when LLM returns non-JSON."""
    mock = _mock_response("이건 JSON이 아닙니다.")
    with patch("pipeline.client.aio.models.generate_content", new=AsyncMock(return_value=mock)):
        with pytest.raises(ValueError):
            await step_eval("# Draft", {"topic": "AI", "doc_type": "일반 문서"})


@pytest.mark.asyncio
async def test_run_pipeline_emits_complete_event():
    draft_mock = _mock_response("# Draft content")
    eval_data = {"overall": 8, "clarity": 7, "structure": 9, "completeness": 8}
    eval_mock = _mock_response(json.dumps(eval_data))

    with patch(
        "pipeline.client.aio.models.generate_content",
        new=AsyncMock(side_effect=[draft_mock, eval_mock]),
    ):
        events = [event async for event in run_pipeline("AI 트렌드", "기술 보고서", "")]

    assert events[-1]["step"] == "complete"
    assert events[-1]["result"]["content"] == "# Draft content"
    assert events[-1]["result"]["scores"]["overall"] == 8


@pytest.mark.asyncio
async def test_run_pipeline_step_sequence():
    """run_pipeline yields running→done pairs for all 4 steps before complete."""
    draft_mock = _mock_response("draft")
    eval_data = {"overall": 5, "clarity": 5, "structure": 5, "completeness": 5}
    eval_mock = _mock_response(json.dumps(eval_data))

    with patch(
        "pipeline.client.aio.models.generate_content",
        new=AsyncMock(side_effect=[draft_mock, eval_mock]),
    ):
        events = [event async for event in run_pipeline("topic", "일반 문서", "")]

    step_events = [e for e in events if e["step"] != "complete"]
    complete_events = [e for e in events if e["step"] == "complete"]

    assert len(complete_events) == 1
    assert len(step_events) == 8
    statuses = [e["status"] for e in step_events]
    assert statuses == ["running", "done", "running", "done", "running", "done", "running", "done"]
