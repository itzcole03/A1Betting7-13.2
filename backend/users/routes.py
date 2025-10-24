"""
User management API routes for A1Betting backend (modular monolith)
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/{user_id}")
async def get_user(user_id: int):
    """Placeholder GET /api/v1/users/{user_id}

    Return a minimal JSON payload so tests that exercise this endpoint
    don't receive a 404. Implementations should replace this with a proper
    user lookup when ready.
    """
    return {"user_id": user_id, "message": "User endpoint (to be implemented)"}
