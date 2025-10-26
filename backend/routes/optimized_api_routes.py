"""
Import-safe stub for optimized_api_routes during triage.
Full implementation should be restored later.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/optimized", tags=["Optimized"])


@router.get("/health")
def health():
    return {"success": True, "data": {"status": "healthy"}, "error": None}


@router.get("/_ping")
def ping():
    return {"status": "pong"}


__all__ = ["router"]
