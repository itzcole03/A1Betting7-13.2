"""
MLB Extras Routes - Minimal working version for Phase 5 consolidation
Syntax errors resolved to enable consolidated route registration
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def mlb_status():
    """MLB extras status endpoint."""
    return {
        "success": True,
        "data": {
            "status": "ok",
            "message": "MLB extras simplified for Phase 5 consolidation"
        },
        "error": None
    }
