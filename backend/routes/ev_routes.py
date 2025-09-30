"""EV (Expected Value) opportunities API routes - Phase 1 foundation.

Provides a lightweight read-only endpoint that surfaces Positive EV
opportunities derived from existing projections (or sample fallback).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from backend.betting.ev_calculator import compute_ev
from backend.betting.ev_data_adapter import fetch_candidate_markets
from backend.betting.kelly import compute_kelly_fraction
from backend.services.unified_error_handler import unified_error_handler  # type: ignore

try:
    from backend.services.unified_logging import unified_logging  # type: ignore
    logger = unified_logging.get_logger("ev.routes")  # type: ignore
except Exception:  # pragma: no cover - fallback
    import logging

    logger = logging.getLogger("ev.routes")


router = APIRouter(tags=["EV"])


class EVOpportunity(BaseModel):
    id: str
    sport: str
    player: str | None
    market: str
    line: float
    fair_odds: int
    market_odds: int
    edge_pct: float
    implied_prob: float
    fair_prob: float
    source_book: str
    timestamp: datetime


@router.get("/opportunities")
async def get_ev_opportunities(
    sport: Optional[str] = None,
    min_edge: float = Query(2.0, ge=0.0),
    limit: int = Query(25, ge=1, le=100),
    include_kelly: bool = Query(False),
    bankroll: float = Query(0.0, ge=0.0),
):
    """Return Positive EV opportunities.

    The list is deterministic for a given runtime and filters by *edge_pct*.
    Results are ordered by descending edge then id for stable pagination.
    """
    try:
        candidates = await fetch_candidate_markets(sport=sport)
        # Store as list of dicts to allow conditional Kelly enrichment without re-parsing
        opportunities: List[dict] = []
        now = datetime.now(timezone.utc)
        for c in candidates:
            ev = compute_ev(c.fair_prob, c.market_odds)
            record = EVOpportunity(
                id=c.id,
                sport=c.sport,
                player=c.player,
                market=c.market,
                line=c.line,
                fair_odds=int(ev["fair_odds"]),
                market_odds=c.market_odds,
                edge_pct=ev["edge_pct"],
                implied_prob=ev["implied_prob"],
                fair_prob=ev["fair_prob"],
                source_book=c.source_book,
                timestamp=now,
            )
            if record.edge_pct >= min_edge:
                data = record.dict()
                if include_kelly and bankroll > 0 and data["edge_pct"] > 0:
                    try:
                        k = compute_kelly_fraction(
                            fair_prob=data["fair_prob"],
                            market_american=data["market_odds"],
                            bankroll=bankroll,
                        )
                        data["kelly_fraction"] = k["kelly_fraction"]
                        data["recommended_stake"] = k["recommended_stake"]
                    except Exception as ke:  # pragma: no cover minimal
                        logger.debug(f"Kelly calc failed: {ke}")
                opportunities.append(data)  # store as dict now
        # Order by edge desc then id for deterministic ordering
        opportunities.sort(key=lambda x: (-x["edge_pct"], x["id"]))
        if len(opportunities) > limit:
            opportunities = opportunities[:limit]
        return {
            "data": opportunities,
            "count": len(opportunities),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:  # pragma: no cover - exercised via integration test
        logger.error(f"EV route error: {e}")
        return unified_error_handler.handle_error(e, context=None)


@router.get("/summary")
async def get_ev_summary(sport: Optional[str] = None):
    """Aggregate summary metrics for current EV opportunities."""
    try:
        candidates = await fetch_candidate_markets(sport=sport)
        edges: List[float] = []
        for c in candidates:
            ev = compute_ev(c.fair_prob, c.market_odds)
            edges.append(ev["edge_pct"])
        if not edges:
            return {
                "total": 0,
                "edges_gt_2": 0,
                "edges_gt_5": 0,
                "avg_edge": 0.0,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
        return {
            "total": len(edges),
            "edges_gt_2": sum(1 for e in edges if e >= 2),
            "edges_gt_5": sum(1 for e in edges if e >= 5),
            "avg_edge": sum(edges) / len(edges),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:  # pragma: no cover
        logger.error(f"EV summary error: {e}")
        return unified_error_handler.handle_error(e, context=None)


__all__ = ["router", "EVOpportunity"]
