"""Import-safe stub for ws_client used during triage."""

from fastapi import APIRouter

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/ws/client", tags=["ws_client"])


def _success(payload, message=None):
    return ResponseBuilder.success(payload, message=message)


@router.get("/health")
def health():
    payload = {"status": "ok", "component": "ws_client"}
    return _success(payload, message="WebSocket client shim is healthy")


@router.get("/_ping")
def _ping():
    return _success({"pong": True})


__all__ = ["router"]
