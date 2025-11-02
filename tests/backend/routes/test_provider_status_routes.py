from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.provider_status_routes import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_get_all_provider_status_returns_standard_envelope():
    client = _client()

    response = client.get("/api/odds/providers/status", params={"limit": 5})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    assert payload["message"] == "Provider status shim is active"
    assert payload["data"] == {"providers": [], "limit": 5}
    assert "meta" in payload and payload["meta"].get("version") == "1.0.0"


def test_get_provider_status_returns_not_found_envelope():
    client = _client()

    response = client.get("/api/odds/providers/status/nonexistent")

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["status"] == "error"
    assert payload["message"] == "Provider nonexistent not found"
    error = payload["error"]
    assert error["code"] == "E4040_NOT_FOUND"
    assert error["message"] == "Provider nonexistent not found"
    assert error["details"] == {"provider_id": "nonexistent"}
