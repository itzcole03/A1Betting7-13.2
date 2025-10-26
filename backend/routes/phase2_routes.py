"""Import-safe stub for phase2_routes used during triage.
Full implementation should be restored later.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/phase2", tags=["phase2"])


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"status": "ok", "service": "phase2"},
        "error": None,
    }


@router.get("/_ping")
def ping():
    return {"ok": True}


__all__ = ["router"]
