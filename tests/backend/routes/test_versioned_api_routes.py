from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.versioned_api_routes import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_health_returns_response_builder_envelope():
    client = _client()

    response = client.get("/api/versioned/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    assert payload["message"] == "Versioned API shim is healthy"
    assert payload["data"] == {"status": "ok", "component": "versioned_api"}
    meta = payload["meta"]
    assert isinstance(meta, dict)
    assert meta.get("version") == "1.0.0"
    assert "timestamp" in meta


def test_ping_returns_success_envelope():
    client = _client()

    response = client.get("/api/versioned/_ping")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    assert payload["data"] == {"pong": True}
    assert payload["message"] == "Request completed successfully"
