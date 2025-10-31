"""Temporary version routes (import-safe stub)

Provides minimal endpoints for /api/version to allow route registration
in test runs. Rich functionality lives in real implementation but is
avoided here to prevent import-time errors.
"""

from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Header, Query

router = APIRouter(prefix="/api/version", tags=["Version & Compatibility"])


@router.get("/info")
async def get_application_version_info():
    return {
        "success": True,
        "data": {"app": {"version": "0.0.0"}},
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/check")
async def check_compatibility(
    frontend_version: str = Query(...), user_agent: Optional[str] = Header(None)
):
    return {
        "success": True,
        "data": {"compatible": True},
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/build")
async def get_build_information():
    return {
        "success": True,
        "data": {"version": "0.0.0", "build_number": "0"},
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health")
async def get_version_health():
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.utcnow().isoformat(),
    }
