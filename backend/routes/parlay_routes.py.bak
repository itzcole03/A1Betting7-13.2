"""Parlay routes - minimal import-safe stub for triage.

This module provides only a couple lightweight endpoints so the package can
be imported during triage. Restore the full implementation later.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/parlay", tags=["Parlay"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Health check for the parlay service (triage stub)."""
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/_ping")
async def ping() -> Dict[str, Any]:
    """Lightweight ping for monitoring tools."""
    return {
        "success": True,
        "data": {"service": "parlay_routes", "status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


__all__ = ["router"]
