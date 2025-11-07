"""Minimal shim for multiple_sportsbook_routes.

Exports get_sportsbook_service and connection_manager placeholders plus router.
"""

from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/sportsbooks", tags=["Multiple Sportsbook"])


def get_sportsbook_service():
    # Placeholder service used by tests; real implementation lives elsewhere.
    class _S:
        pass

    return _S()


connection_manager = None


@router.get("/ping")
async def ping():
    return {"success": True}
