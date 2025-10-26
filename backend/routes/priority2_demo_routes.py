"""
Import-safe stub for priority2_demo_routes used during triage.
Real implementation should be restored later.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/priority2/demo", tags=["Priority2 Demo"])


@router.get("/health")
def health():
    return {"success": True, "data": {"status": "healthy"}, "error": None}


@router.get("/_ping")
def ping():
    return {"status": "pong"}


__all__ = ["router"]
