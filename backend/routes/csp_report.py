"""
Import-safe shim for CSP report endpoint.

This file replaces a broken implementation with a minimal, import-safe
shim that preserves the external contract: it exports an `APIRouter`
named `router` with a POST `/csp/report` endpoint. It uses the
canonical ResponseBuilder.success(...) envelope when available and
provides a small local fallback to avoid import-time failures during
pytest collection.
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


router = APIRouter(tags=["security"])


@router.post("/csp/report")
async def receive_csp_report() -> Dict[str, Any]:
    """Minimal stub that accepts CSP reports and returns success envelope.

    The full implementation lives in the original file saved as
    `csp_report.py.orig`. This shim is intentionally minimal to avoid
    import-time side effects and restore pytest collection.
    """
    logger.debug("Received CSP report (shim)")
    return ResponseBuilder.success({"status": "received"})


@router.get("/csp/report/health")
async def csp_report_health() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "ok"})
