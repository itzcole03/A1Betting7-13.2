"""Import-safe stub for system_capabilities used during triage.

Provides a minimal APIRouter with canonical /health and /_ping so the
module can be imported safely during tests. Restore full implementation
from source control after triage.
"""
from typing import Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(prefix="/api/system", tags=["system-capabilities"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {"success": True, "data": {"status": "healthy", "service": "system_capabilities"}, "timestamp": datetime.now(timezone.utc).isoformat(), "error": None}


@router.get("/_ping")
def _ping():
    return {"ok": True}


__all__ = ["router"]
