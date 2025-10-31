"""Observability events routes - import-safe stub.

Provides small compatibility endpoints so the module imports during triage.
Full implementation can be restored after import-time issues are resolved.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/observability", tags=["Observability"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/stats")
async def stats() -> Dict[str, Any]:
    # Minimal stats stub
    return {"success": True, "data": {"events_published": 0, "active_connections": 0}}


__all__ = ["router"]
