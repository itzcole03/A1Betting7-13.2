"""
Import-safe PrizePicks routes shim.

Provides minimal endpoints that follow the canonical JSON envelope
pattern and avoid import-time side effects so pytest can collect tests.

This module intentionally keeps top-level imports minimal and
falls back to a lightweight `ok` envelope if the project's
ResponseBuilder helper isn't available at import time.
"""

from typing import Any, List

from fastapi import APIRouter

try:
    # Preferred: use the project's response builder when available
    from backend.core.response_models import ResponseBuilder
except Exception:
    ResponseBuilder = None

try:
    from backend.core.app import ok
except Exception:
    # Fallback minimal envelope used only during tests/import-time
    def ok(payload: Any = None, status_code: int = 200):
        return {"success": True, "data": payload, "error": None}


router = APIRouter(prefix="/api/prizepicks", tags=["prizepicks"])


@router.get("/health")
def health():
    """Simple health endpoint to verify router is importable and reachable."""
    payload = {"status": "ok", "service": "prizepicks"}
    if ResponseBuilder:
        return ResponseBuilder.success(payload)
    return ok(payload)


@router.get("/props")
def list_prizepicks_props() -> List[dict]:
    """Return a small deterministic empty list for tests.

    Real implementation should be import-safe (lazy imports) and
    return a canonical envelope (ResponseBuilder.success / ok).
    """
    data: List[dict] = []
    if ResponseBuilder:
        return ResponseBuilder.success(data)
    return ok(data)
