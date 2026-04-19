import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generate_empty_topic_rejected():
    response = client.post("/generate", json={"topic": "   "})
    assert response.status_code == 422


def test_generate_missing_topic_rejected():
    response = client.post("/generate", json={})
    assert response.status_code == 422


def test_generate_default_doc_type():
    """GenerateRequest default doc_type should be '일반 문서'."""
    from main import GenerateRequest
    req = GenerateRequest(topic="test topic")
    assert req.doc_type == "일반 문서"
    assert req.instructions is None


def test_format_sse():
    from main import format_sse
    result = format_sse({"step": 1, "status": "running"})
    assert result.startswith("data: ")
    assert result.endswith("\n\n")
    assert '"step": 1' in result
