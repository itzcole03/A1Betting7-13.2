"""Import-safe shim for comprehensive_sportradar_routes.

This minimal shim preserves the module contract (exports `router`) while
avoiding heavy imports or import-time side-effects so pytest test collection
can safely import the backend package.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter

logger = logging.getLogger("propollama")

try:
    from backend.core.response_models import ResponseBuilder
except Exception:

    class _FallbackResponseBuilder:
        @staticmethod
        def success(data: Any = None) -> Dict[str, Any]:
            return {"success": True, "data": data, "error": None}

    ResponseBuilder = _FallbackResponseBuilder


router = APIRouter(prefix="/api/v1/sportradar", tags=["SportRadar APIs"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "ok"})
