"""Performance routes (temporary import-safe stub).

This file is intentionally minimal to avoid import-time side-effects
while triage and pytest collection are in progress. It should be
replaced by the production implementation once routes are repaired.
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter

# Stub version marker
PERFORMANCE_STUB_VERSION = "v1-triage"

router = APIRouter(prefix="/api/performance", tags=["performance"])


@router.get("/stats")
async def get_performance_stats(
    current_user: Optional[Any] = None, db: Optional[Any] = None
) -> Dict[str, Any]:
    # Minimal, deterministic response for tests/imports
    return {
        "today_profit": 0.0,
        "weekly_profit": 0.0,
        "monthly_profit": 0.0,
        "total_bets": 0,
        "win_rate": 0.0,
        "avg_odds": 0.0,
        "roi_percent": 0.0,
        "active_bets": 0,
    }


@router.get("/transactions")
async def get_transactions(
    current_user: Optional[Any] = None, db: Optional[Any] = None
) -> Dict[str, Any]:
    return {"transactions": [], "total_count": 0}


@router.get("/active-bets")
async def get_active_bets(
    current_user: Optional[Any] = None, db: Optional[Any] = None
) -> Dict[str, Any]:
    return {"active_bets": [], "total_count": 0}
