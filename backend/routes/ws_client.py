"""Import-safe stub for ws_client used during triage."""
from fastapi import APIRouter

router = APIRouter(prefix="/ws/client", tags=["ws_client"])


@router.get("/health")
def health():
    return {"success": True, "data": {"status": "ok", "component": "ws_client"}, "error": None}


@router.get("/_ping")
def _ping():
    return {"ok": True}


__all__ = ["router"]
