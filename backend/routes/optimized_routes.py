"""Optimized Routes - minimal import-safe stub for triage."""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/optimized", tags=["Optimized"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/_ping")
async def ping() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"service": "optimized_routes", "status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


__all__ = ["router"]
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/optimized", tags=["Optimized"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


__all__ = ["router"]
