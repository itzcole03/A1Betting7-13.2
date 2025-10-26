"""Import-safe stub for priority2_realtime_routes used during triage.

Provides a tiny APIRouter with canonical /health and /_ping so the
module can be imported safely during tests. Restore full implementation
from source control after triage.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/priority2-realtime", tags=["priority2-realtime"])


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"service": "priority2_realtime", "status": "ok"},
        "error": None,
    }


@router.get("/_ping")
def _ping():
    return {"ok": True}


__all__ = ["router"]
