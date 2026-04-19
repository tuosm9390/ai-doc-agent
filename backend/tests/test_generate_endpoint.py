import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


async def _mock_pipeline(topic, doc_type, instructions):
    yield {"step": 1, "status": "running", "label": "컨텍스트 수집"}
    yield {"step": 1, "status": "done", "label": "컨텍스트 수집", "elapsed": 0.1}
    yield {
        "step": "complete",
        "result": {
            "content": "# Test Document",
            "scores": {"overall": 8, "clarity": 7, "structure": 9, "completeness": 8},
            "generated_at": 0,
        },
    }


async def _mock_pipeline_error(topic, doc_type, instructions):
    yield {"step": 1, "status": "running", "label": "컨텍스트 수집"}
    raise ValueError("API key missing")


def test_generate_streams_sse_events():
    with patch("main.run_pipeline", new=_mock_pipeline):
        response = client.post("/generate", json={"topic": "AI trends"})

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    lines = [l for l in response.text.split("\n") if l.startswith("data: ")]
    assert len(lines) == 3

    complete_event = json.loads(lines[-1][6:])
    assert complete_event["step"] == "complete"
    assert complete_event["result"]["content"] == "# Test Document"


def test_generate_error_emits_error_event():
    """Exception inside event_stream yields error SSE instead of crashing."""
    with patch("main.run_pipeline", new=_mock_pipeline_error):
        response = client.post("/generate", json={"topic": "AI trends"})

    assert response.status_code == 200
    lines = [l for l in response.text.split("\n") if l.startswith("data: ")]
    error_events = [json.loads(l[6:]) for l in lines if '"error"' in l]
    assert any(e["step"] == "error" for e in error_events)
