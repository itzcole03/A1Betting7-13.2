"""Import-safe stub for versioned_api_routes used during triage.

This module provides a tiny APIRouter exposing /health and /_ping so the
package imports cleanly. Restore full versioning implementation later.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/versioned", tags=["versioned_api"])


@router.get("/health")
def health():
    return {"success": True, "data": {"status": "ok", "component": "versioned_api"}, "error": None}


@router.get("/_ping")
def _ping():
    return {"ok": True}


__all__ = ["router"]
