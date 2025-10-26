"""Import-safe stub for ws_client_unified used during triage."""
from fastapi import APIRouter

router = APIRouter(prefix="/ws/unified", tags=["ws_client_unified"])


@router.get("/health")
def health():
    return {"success": True, "data": {"status": "ok", "component": "ws_client_unified"}, "error": None}


@router.get("/_ping")
def _ping():
    return {"ok": True}


__all__ = ["router"]
