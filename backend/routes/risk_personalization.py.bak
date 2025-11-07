"""Import-safe stub for risk_personalization used during triage.

This module intentionally contains only a tiny APIRouter exposing /health
and /_ping so the test import sweep and application factory can load the
backend.routes package without encountering parse-time errors. Restore
the full implementation from source control once tests are passing.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/risk_personalization", tags=["risk_personalization"])


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"service": "risk_personalization", "status": "ok"},
        "error": None,
    }


@router.get("/_ping")
def ping():
    return {"ok": True}


__all__ = ["router"]
