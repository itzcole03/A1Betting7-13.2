"""
Lightweight fallback for Odds History routes used in tests when the
real `odds_history_routes` module cannot be imported (e.g., optional
dependencies like aiohttp are absent). This provides
GET /api/odds/history with a deterministic empty response envelope
matching the production ResponseBuilder.success shape.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/odds", tags=["Odds History"])


@router.get("/history")
async def get_odds_history(
    prop_id: str = Query(...),
    sportsbook: str = Query(...),
    hours_back: int = Query(24),
    limit: int = Query(100),
):
    # Return an empty but well-formed response similar to ResponseBuilder.success
    now = datetime.now(timezone.utc).isoformat()
    return {
        "success": True,
        "data": {
            "prop_id": prop_id,
            "sportsbook": sportsbook,
            "total_snapshots": 0,
            "date_range": {"start": now, "end": now},
            "snapshots": [],
        },
        "error": None,
    }
