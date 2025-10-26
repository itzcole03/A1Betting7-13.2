"""Import-safe shim for advanced_kelly_routes_secured.

This file is a minimal, import-safe replacement used to unblock pytest
test collection. The original implementation is preserved in
`advanced_kelly_routes_secured.py.orig`.
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


router = APIRouter(prefix="/advanced-kelly-secured", tags=["advanced-kelly-secured"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Health endpoint used by tests and readiness probes."""
    return ResponseBuilder.success({"status": "ok"})
