"""Import-safe stub for risk_personalization_backup used during triage."""

from fastapi import APIRouter

router = APIRouter(
    prefix="/api/risk-personalization-backup", tags=["risk-personalization-backup"]
)


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"status": "ok", "service": "risk_personalization_backup (stub)"},
        "error": None,
    }


"""Minimal import-safe risk_personalization_backup stub for triage.

Restore full implementation from source control after triage is complete.
"""
from fastapi import APIRouter

router = APIRouter(
    prefix="/api/risk-personalization-backup", tags=["risk-personalization-backup"]
)


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"service": "risk-personalization-backup", "status": "ok"},
        "error": None,
    }


@router.get("/_ping")
def ping():
    return {"ok": True}


__all__ = ["router"]
router = APIRouter(
    prefix="/api/risk-personalization-backup", tags=["risk-personalization-backup"]
)
