import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/api/propollama/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "PropOllama API is healthy" in data["message"]


def test_chat_valid():
    payload = {"message": "Test message"}
    resp = client.post("/api/propollama/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "You said: Test message" in data["response"]
    assert data["model_used"] == "PropOllama_Enhanced_LLM_v6.0"
    assert "timestamp" in data


def test_chat_missing_message():
    payload = {"context": {"topic": "betting"}}
    resp = client.post("/api/propollama/chat", json=payload)
    assert resp.status_code == 422
    data = resp.json()
    assert "detail" in data
    assert any(
        "message" in str(d) or "field required" in str(d) for d in data["detail"]
    )


def test_chat_invalid_json():
    resp = client.post("/api/propollama/chat", data="not a json")
    assert resp.status_code in (422, 400, 500)
    # Accepts any error code for malformed input


def test_chat_internal_error(monkeypatch):
    # Simulate internal error by patching request.json to raise Exception
    from backend.routes import propollama

    async def raise_exc(*args, **kwargs):
        raise Exception("Simulated error")

    monkeypatch.setattr("backend.routes.propollama.Request.json", raise_exc)
    payload = {"message": "Test"}
    resp = client.post("/api/propollama/chat", json=payload)
    assert resp.status_code == 500
    data = resp.json()
    assert "error" in data["detail"]
    assert "Internal Server Error" in data["detail"]["error"]
