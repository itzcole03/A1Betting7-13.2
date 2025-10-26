"""
Import-safe shim for dependency health routes used during triage.

Exports a tiny APIRouter with health endpoints so imports succeed while
we triage corrupted route modules. Restore full implementations later.
"""

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter

try:
    from backend.core.response_models import ResponseBuilder
except Exception:

    class ResponseBuilder:
        @staticmethod
        def success(data=None):
            return {"success": True, "data": data, "error": None}


router = APIRouter(prefix="/dependencies", tags=["dependencies"])


@router.get("/health")
async def get_dependency_health() -> Dict[str, Any]:
    return ResponseBuilder.success(
        {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
    )


@router.get("/health/summary")
async def get_dependency_health_summary() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "ok", "health_score": 1.0})


@router.post("/integrity/verify")
async def trigger_integrity_verification() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "verification_started"})
