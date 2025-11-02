"""Deprecated compatibility shim for the retired realtime websocket API."""

from fastapi import APIRouter, WebSocket
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/ws", tags=["WebSocket"])

_DEPRECATION = "realtime_websocket_routes has been retired; use ws/ws_client_enhanced for notifications"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "ws_client_enhanced"},
        status_code=410,
    )


@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket):
    """Reject legacy websocket connections with a close frame explaining the migration."""
    await websocket.close(code=1000, reason=_DEPRECATION)


@router.get("/health")
def ws_health() -> JSONResponse:
    """Return a standard deprecation payload for legacy health checks."""
    return _deprecated_response()
