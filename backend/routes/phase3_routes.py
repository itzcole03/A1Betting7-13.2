"""Import-safe stub for phase3_routes used during triage.
Full implementation should be restored later.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/phase3", tags=["phase3"])


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"status": "ok", "service": "phase3"},
        "error": None,
    }


@router.get("/_ping")
def ping():
    return {"ok": True}


__all__ = ["router"]
