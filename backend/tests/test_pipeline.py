import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from pipeline import step_context, step_format


@pytest.mark.asyncio
async def test_step_context_captures_fields():
    result = await step_context("AI trends", "기술 보고서", "3 pages")
    assert result["topic"] == "AI trends"
    assert result["doc_type"] == "기술 보고서"
    assert result["instructions"] == "3 pages"
    assert "collected_at" in result


@pytest.mark.asyncio
async def test_step_context_empty_instructions():
    result = await step_context("Topic", "이메일", "")
    assert result["instructions"] == ""


@pytest.mark.asyncio
async def test_step_format_assembles_result():
    eval_result = {
        "overall": 8,
        "clarity": 7,
        "structure": 9,
        "completeness": 8,
        "feedback": "Good document",
    }
    result = await step_format("# Draft content\n\nBody text.", eval_result)
    assert result["content"] == "# Draft content\n\nBody text."
    assert result["scores"] == eval_result
    assert "generated_at" in result


@pytest.mark.asyncio
async def test_step_format_scores_passthrough():
    eval_result = {"overall": 5, "clarity": 5, "structure": 5, "completeness": 5}
    result = await step_format("content", eval_result)
    assert result["scores"]["overall"] == 5
