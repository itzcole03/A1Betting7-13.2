"""Import-safe shim for cache management routes.

This minimal shim preserves the module contract (exports `router`) while
avoiding heavy imports or import-time side-effects so pytest test collection
can safely import the backend package.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter

from backend.core.response_models import ResponseBuilder

logger = logging.getLogger("propollama")


router = APIRouter(prefix="/api/cache", tags=["Cache Management"])


def _success(payload: Any, message: str | None = None) -> Dict[str, Any]:
    return ResponseBuilder.success(payload, message=message)


@router.get("/health")
async def health() -> Dict[str, Any]:
    return _success({"status": "ok"}, message="Cache management shim is healthy")
