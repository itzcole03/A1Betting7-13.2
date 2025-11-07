"""Import-safe stub for versioned_api_routes used during triage.

This module provides a tiny APIRouter exposing /health and /_ping so the
package imports cleanly. Restore full versioning implementation later.
"""

from fastapi import APIRouter

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/versioned", tags=["versioned_api"])


def _success(payload, message=None):
    return ResponseBuilder.success(payload, message=message)


@router.get("/health")
def health():
    payload = {"status": "ok", "component": "versioned_api"}
    return _success(payload, message="Versioned API shim is healthy")


@router.get("/_ping")
def _ping():
    return _success({"pong": True})


__all__ = ["router"]
