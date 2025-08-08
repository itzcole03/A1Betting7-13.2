"""
User management API routes for A1Betting backend (modular monolith)
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/users", tags=["users"])

# Example placeholder route
define_get_user = router.get("/{user_id}")


def get_user(user_id: int):
    return {"user_id": user_id, "message": "User endpoint (to be implemented)"}
