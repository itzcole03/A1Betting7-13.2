"""
Import-safe stub for player_dashboard_routes during triage.
Real implementation should be restored later.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/player-dashboard", tags=["Player Dashboard"])


@router.get("/health")
def health():
    return {"success": True, "data": {"status": "healthy"}, "error": None}


@router.get("/_ping")
def ping():
    return {"status": "pong"}


__all__ = ["router"]
