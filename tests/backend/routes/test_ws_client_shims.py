import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.ws_client import router as legacy_ws_client_router
from backend.routes.ws_client_unified import router as unified_ws_client_router


def _build_client(router) -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.mark.parametrize(
    "router,path,component,expected_message",
    [
        (
            legacy_ws_client_router,
            "/ws/client/health",
            "ws_client",
            "WebSocket client shim is healthy",
        ),
        (
            unified_ws_client_router,
            "/ws/unified/health",
            "ws_client_unified",
            "Unified WebSocket client shim is healthy",
        ),
    ],
)
def test_ws_client_health_uses_response_builder(
    router, path, component, expected_message
):
    client = _build_client(router)

    response = client.get(path)

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == expected_message
    assert payload["error"] is None
    assert payload["data"] == {"status": "ok", "component": component}
    meta = payload["meta"]
    assert isinstance(meta, dict)
    assert "timestamp" in meta
    assert meta.get("version") == "1.0.0"


@pytest.mark.parametrize(
    "router,path",
    [
        (legacy_ws_client_router, "/ws/client/_ping"),
        (unified_ws_client_router, "/ws/unified/_ping"),
    ],
)
def test_ws_client_ping_uses_response_builder(router, path):
    client = _build_client(router)

    response = client.get(path)

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    assert payload["data"] == {"pong": True}
    assert payload["message"] == "Request completed successfully"
