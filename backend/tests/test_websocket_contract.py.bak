import asyncio
import json

import pytest
import pytest_asyncio
from fastapi import FastAPI, WebSocket
from fastapi.testclient import TestClient

from backend.api_integration import api_router

app = FastAPI()
app.include_router(api_router)


@pytest_asyncio.fixture
async def websocket_client():
    from fastapi.testclient import TestClient

    client = TestClient(app)
    yield client


def validate_contract(msg):
    assert isinstance(msg, dict)
    assert "success" in msg
    assert "data" in msg
    assert "error" in msg
    assert "meta" in msg
    if msg["success"]:
        assert msg["error"] is None
        assert msg["data"] is not None
    else:
        assert msg["data"] is None
        assert msg["error"] is not None
        assert "code" in msg["error"]
        assert "message" in msg["error"]


@pytest.mark.asyncio
async def test_ws_odds_contract(websocket_client):
    with websocket_client.websocket_connect("/api/ws/odds") as ws:
        msg = ws.receive_json()
        validate_contract(msg)
        # Simulate error by forcibly closing connection
        ws.close()


@pytest.mark.asyncio
async def test_ws_predictions_contract(websocket_client):
    with websocket_client.websocket_connect("/api/ws/predictions") as ws:
        msg = ws.receive_json()
        validate_contract(msg)
        ws.close()


@pytest.mark.asyncio
async def test_ws_notifications_contract(websocket_client):
    with websocket_client.websocket_connect(
        "/api/ws/notifications?user_id=testuser"
    ) as ws:
        msg = ws.receive_json()
        validate_contract(msg)
        ws.close()
