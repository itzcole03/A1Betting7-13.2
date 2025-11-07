"""Import-safe shim for consolidated_admin routes.

This minimal module provides an APIRouter with a simple ping endpoint so
test collection and imports succeed while we triage and restore full
implementations incrementally.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter

try:
    from backend.core.response_models import ResponseBuilder
except Exception:

    class _FallbackResponseBuilder:
        @staticmethod
        def success(data: Any = None) -> Dict[str, Any]:
            return {"success": True, "data": data, "error": None}

    ResponseBuilder = _FallbackResponseBuilder


router = APIRouter(prefix="/api/v1/admin", tags=["Admin-Consolidated"])


@router.get("/ping")
async def ping() -> Dict[str, Any]:
    return ResponseBuilder.success(
        {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    )
