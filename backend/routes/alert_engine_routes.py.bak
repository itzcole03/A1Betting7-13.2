"""Import-safe shim for alert_engine_routes.

Exports an APIRouter named `router` and a minimal /health endpoint that
returns the canonical JSON envelope. The original implementation is backed
up to `alert_engine_routes.py.orig`.
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


router = APIRouter(prefix="/alert-engine", tags=["alert-engine"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "ok"})
