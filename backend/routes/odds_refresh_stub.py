"""Minimal odds refresh and arbitrage stub used by tests.

Provides:
- POST /api/odds/refresh?sport={sport}&market={market} -> 200
- GET  /api/odds/arbitrage?sport={sport}&market={market}&min_margin=... -> deterministic sample

This avoids importing heavy odds services during tests.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Query

router = APIRouter(tags=["odds"])  # app mounts under /api/odds


@router.post("/refresh")
async def refresh_odds(sport: str = Query(...), market: str = Query(...)):
    # Accept the refresh request and return a simple ack. Tests only assert 200.
    return {
        "status": "ok",
        "success": True,
        "sport": sport,
        "market": market,
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
    }


def _sample_arbs() -> List[dict]:
    return [
        {
            "selection_key": "s1",
            "over_book": "book_a",
            "under_book": "book_b",
            "margin_pct": 0.015,
            "line": 3.5,
            "over_american": -120,
            "under_american": 110,
            "over_book_price": 1.83,
            "under_book_price": 2.05,
        }
    ]


@router.get("/arbitrage")
async def get_arbitrage(
    sport: str = Query(...), market: str = Query(...), min_margin: float = Query(0.01)
):
    # Return a deterministic sample so alias parity tests observe non-empty data.
    data = _sample_arbs()
    return {"count": len(data), "data": data, "status": "ok", "success": True}


__all__ = ["router"]
