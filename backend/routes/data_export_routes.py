from fastapi import APIRouter

"""
Minimal import-safe shim for data export routes.

This file intentionally contains a lightweight router used during
triage so the codebase can import without syntax errors. Full
implementation should be restored after tests can run.
"""

router = APIRouter(prefix="/api/v1/data-export", tags=["data-export"])


@router.get("/ping")
async def ping() -> dict:
    """Health check for the data-export feature (triage shim)."""
    return {"success": True, "data": {"status": "ok"}, "error": None}


@router.get("/fields/{data_type}")
async def get_available_fields(data_type: str) -> dict:
    """Return an empty stub for available fields while triage is active."""
    # Full implementation intentionally omitted during triage.
    return {"success": True, "data": {}, "error": None}
