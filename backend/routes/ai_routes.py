"""AI routes - import-safe shim.

Consolidated lightweight implementation to avoid parse-time failures.
Exports `router` and a few simple endpoints used by tests.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)

try:
    from backend.core.response_models import ResponseBuilder
except Exception:

    class _FallbackResponseBuilder:
        @staticmethod
        def success(data: Any = None) -> Dict[str, Any]:
            return {"success": True, "data": data, "error": None}

    ResponseBuilder = _FallbackResponseBuilder


router = APIRouter(prefix="/v1/ai", tags=["AI"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "ok"})


@router.get("/explain")
async def explain_stub(
    q: Optional[str] = Query(None), limit: int = Query(1)
) -> Dict[str, Any]:
    """Simple explain stub returning placeholder content."""
    return ResponseBuilder.success({"explanation": None, "limit": limit, "query": q})
