from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.cache_management_routes import router


def _get_client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_health_returns_response_builder_envelope():
    client = _get_client()

    response = client.get("/api/cache/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    assert payload["message"] == "Cache management shim is healthy"
    assert payload["data"] == {"status": "ok"}
    meta = payload["meta"]
    assert isinstance(meta, dict)
    assert meta.get("version") == "1.0.0"
