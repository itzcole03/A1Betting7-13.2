"""Canonical `/ws/client` WebSocket handshake used by smoke tests."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from backend.core.response_models import ResponseBuilder
from backend.utils.enhanced_logging import get_logger

router = APIRouter()

logger = get_logger("ws_client_enhanced")

SUPPORTED_VERSIONS = {1}
VALID_ROLES = {"frontend", "admin", "test"}
HEARTBEAT_INTERVAL_MS = 25_000
FEATURE_FLAGS = [
    "heartbeat",
    "structured_messages",
    "error_codes",
    "graceful_reconnect",
]


def _utc_timestamp() -> str:
    """Return an ISO-8601 timestamp with a Z suffix."""

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.get("/ws/client")
async def websocket_client_probe(
    client_id: str = Query(..., min_length=1),
    version: int = Query(1, ge=1),
    role: str = Query("frontend"),
):
    """HTTP probe mirrors the WebSocket query contract for validation tests."""

    if version not in SUPPORTED_VERSIONS:
        return ResponseBuilder.error(
            message="Unsupported version",
            code="UNSUPPORTED_VERSION",
            status_code=400,
        )

    if role not in VALID_ROLES:
        return ResponseBuilder.error(
            message="Invalid role",
            code="INVALID_ROLE",
            status_code=400,
        )

    return ResponseBuilder.success(
        {
            "client_id": client_id,
            "accepted_version": version,
            "role": role,
            "heartbeat_interval_ms": HEARTBEAT_INTERVAL_MS,
        }
    )


@dataclass
class _ConnectionState:
    client_id: str
    connected_at: datetime
    heartbeat_count: int = 0
    last_heartbeat: datetime | None = None

    def as_status(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "type": "status",
            "client_id": self.client_id,
            "connection_uptime_seconds": int((now - self.connected_at).total_seconds()),
            "heartbeat_count": self.heartbeat_count,
            "last_heartbeat": (self.last_heartbeat or self.connected_at)
            .astimezone(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "timestamp": _utc_timestamp(),
        }


@router.websocket("/ws/client")
async def websocket_client_endpoint(
    websocket: WebSocket,
    client_id: str = Query(..., min_length=1),
    version: int = Query(1),
    role: str = Query("frontend"),
):
    """Serve the test-focused WebSocket handshake with structured responses."""

    if version not in SUPPORTED_VERSIONS:
        await websocket.close(code=4400, reason="Unsupported version")
        return

    if role not in VALID_ROLES:
        await websocket.close(code=4401, reason="Invalid role")
        return

    await websocket.accept()

    request_id = str(uuid.uuid4())
    conn_state = _ConnectionState(
        client_id=client_id, connected_at=datetime.now(timezone.utc)
    )

    hello_payload = {
        "type": "hello",
        "accepted_version": version,
        "client_id": client_id,
        "server_time": _utc_timestamp(),
        "features": FEATURE_FLAGS,
        "request_id": request_id,
        "heartbeat_interval_ms": HEARTBEAT_INTERVAL_MS,
    }

    await websocket.send_json(hello_payload)
    logger.info(
        "WebSocket client connected", extra={"client_id": client_id, "role": role}
    )

    try:
        while True:
            try:
                raw_message = await websocket.receive_text()
            except WebSocketDisconnect:
                break

            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error_code": "INVALID_JSON",
                        "message": "Invalid JSON format received",
                        "timestamp": _utc_timestamp(),
                    }
                )
                continue

            msg_type = str(message.get("type", "")).lower()
            if msg_type == "ping":
                conn_state.heartbeat_count += 1
                conn_state.last_heartbeat = datetime.now(timezone.utc)
                await websocket.send_json(
                    {
                        "type": "pong",
                        "client_id": client_id,
                        "timestamp": _utc_timestamp(),
                    }
                )
            elif msg_type == "status":
                await websocket.send_json(conn_state.as_status())
            elif msg_type == "pong":
                conn_state.last_heartbeat = datetime.now(timezone.utc)
            else:
                await websocket.send_json(
                    {
                        "type": "echo",
                        "client_id": client_id,
                        "original_message": message,
                        "timestamp": _utc_timestamp(),
                    }
                )
    finally:
        await websocket.close(code=1000)
        logger.info("WebSocket client disconnected", extra={"client_id": client_id})
