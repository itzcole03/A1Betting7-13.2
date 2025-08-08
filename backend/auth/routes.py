"""
Auth API routes for A1Betting backend (modular monolith)
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Example placeholder route
define_login = router.post("/login")


def login():
    return {"message": "Login endpoint (to be implemented)"}
