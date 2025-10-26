"""Import-safe Real-Time Analysis router (minimal stub).

This file is intentionally minimal to avoid import-time dependencies and
syntax issues during test collection. It exposes a small router with a
few lightweight endpoints used by tests and health checks.
"""

from typing import Dict, List

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/analysis", tags=["Real-Time Analysis"])


@router.get("/ping")
async def ping() -> Dict[str, str]:
    return {"status": "ok", "service": "real_time_analysis_stub"}


@router.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "healthy"}


@router.get("/supported_sports")
async def supported_sports() -> List[str]:
    # Minimal list for tests that query supported sports
    return ["nba", "nfl", "mlb"]
