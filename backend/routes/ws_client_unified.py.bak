"""Import-safe stub for ws_client_unified used during triage."""

from fastapi import APIRouter

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/ws/unified", tags=["ws_client_unified"])


def _success(payload, message=None):
    return ResponseBuilder.success(payload, message=message)


@router.get("/health")
def health():
    payload = {"status": "ok", "component": "ws_client_unified"}
    return _success(payload, message="Unified WebSocket client shim is healthy")


@router.get("/_ping")
def _ping():
    return _success({"pong": True})


__all__ = ["router"]
