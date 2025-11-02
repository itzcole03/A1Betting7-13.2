"""
Betting Routes

This module contains all betting-related endpoints including opportunities and arbitrage.
"""

import hashlib
import json
import logging
import re
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.core.exceptions import BusinessLogicException
from backend.models.api_models import (
    ArbitrageOpportunity,
    BettingOpportunity,
    RiskProfileModel,
    RiskProfilesResponse,
)

from ..core.exceptions import AuthenticationException, BusinessLogicException

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..services.cache import redis_cache

# Temporarily commenting out corrupted data_fetchers
# from services.data_fetchers import fetch_betting_opportunities_internal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Betting"])

try:  # pragma: no cover - defensive import for optional odds ingestion
    from backend.odds.odds_snapshot_store import odds_snapshot_store
except (
    Exception
):  # pragma: no cover - odds ingestion not available in some test contexts
    odds_snapshot_store = None  # type: ignore

try:  # pragma: no cover - optional ingestion refresh helper
    from backend.odds.odds_ingestion_service import (
        refresh_market as refresh_odds_market,
    )
except Exception:  # pragma: no cover - odds ingestion not wired
    refresh_odds_market = None  # type: ignore

BETTING_CACHE_PREFIX = "a1betting:betting_opps"
BETTING_CACHE_TTL = 300  # seconds


def _build_betting_cache_key(filters: Dict[str, Any]) -> str:
    """Generate a deterministic cache key for betting opportunity filters."""

    serialized = json.dumps(filters, sort_keys=True)
    digest = hashlib.md5(serialized.encode("utf-8")).hexdigest()
    return f"{BETTING_CACHE_PREFIX}:{digest}"


def _american_to_decimal(american: int) -> float:
    """Convert American odds to decimal odds."""
    return (american / 100) + 1 if american > 0 else (100 / abs(american)) + 1


def _format_event_description(
    selection_key: str,
    player: Optional[str],
    market: str,
    line: Optional[float],
) -> str:
    """Build a human-friendly event description for arbitrage rows."""
    resolved_player = player
    if not resolved_player and selection_key:
        parts = selection_key.split(":")
        if len(parts) >= 3:
            resolved_player = parts[2]

    if resolved_player:
        resolved_player = (
            re.sub(r"(?<!^)(?=[A-Z])", " ", resolved_player).replace("_", " ").strip()
        )

    market_label = market.replace("_", " ").title() if market else ""
    line_label = f"Line {line}" if line is not None else ""

    segments = [
        segment for segment in (resolved_player, market_label, line_label) if segment
    ]
    return " - ".join(segments) if segments else selection_key


def _compute_real_arbitrage_opportunities(
    snapshots: List[Any],
    sport: str,
    market: str,
    min_margin_pct: float,
) -> List[Dict[str, Any]]:
    """Compute arbitrage opportunities from odds snapshots using two-way pairing."""

    grouped: Dict[str, List[Any]] = defaultdict(list)
    for snap in snapshots:
        grouped[snap.selection_key].append(snap)

    opportunities: List[Dict[str, Any]] = []

    for selection_key, entries in grouped.items():
        overs = [entry for entry in entries if getattr(entry, "side", "over") == "over"]
        unders = [
            entry for entry in entries if getattr(entry, "side", "over") == "under"
        ]
        if not overs or not unders:
            continue

        for over in overs:
            for under in unders:
                if over.book == under.book:
                    continue
                if over.line != under.line:
                    continue

                d_over = _american_to_decimal(over.american_odds)
                d_under = _american_to_decimal(under.american_odds)
                inverse_sum = (1 / d_over) + (1 / d_under)
                if inverse_sum >= 1:
                    continue

                margin_pct = (1 - inverse_sum) * 100
                if margin_pct < min_margin_pct:
                    continue

                target_return = 100 / inverse_sum
                stake_over = target_return / d_over
                stake_under = target_return / d_under

                opportunities.append(
                    {
                        "selection_key": selection_key,
                        "sport": sport,
                        "market": market,
                        "line": over.line,
                        "player": over.player or under.player,
                        "over_book": over.book,
                        "under_book": under.book,
                        "over_american": over.american_odds,
                        "under_american": under.american_odds,
                        "margin_pct": margin_pct,
                        "stake_over": stake_over,
                        "stake_under": stake_under,
                        "total_stake": stake_over + stake_under,
                        "guaranteed_return": target_return,
                        "guaranteed_profit": target_return - (stake_over + stake_under),
                        "last_updated": max(over.captured_at, under.captured_at),
                    }
                )

    opportunities.sort(key=lambda item: item["margin_pct"], reverse=True)
    return opportunities


def _coerce_iso_timestamp(value: Any) -> Optional[str]:
    """Convert datetime-like values to ISO strings for response payloads."""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat"):
        try:
            return (
                value.isoformat()
            )  # pragma: no cover - defensive path for custom types
        except Exception:  # noqa: BLE001 - best effort conversion
            return None
    return None


async def fetch_betting_opportunities_internal() -> List[Dict[str, Any]]:
    """Internal function to fetch betting opportunities from various sources"""
    try:
        # Mock implementation with realistic test data
        opportunities = [
            {
                "id": "bet_001",
                "sport": "NBA",
                "event": "Lakers vs Warriors",
                "market": "spread",
                "odds": 1.95,
                "probability": 0.52,
                "expected_value": 0.08,
                "kelly_fraction": 0.05,
                "confidence": 0.85,
                "risk_level": "medium",
                "recommendation": "place_bet",
            },
            {
                "id": "bet_002",
                "sport": "NFL",
                "event": "Patriots vs Bills",
                "market": "moneyline",
                "odds": 2.10,
                "probability": 0.48,
                "expected_value": 0.12,
                "kelly_fraction": 0.07,
                "confidence": 0.78,
                "risk_level": "high",
                "recommendation": "monitor",
            },
            {
                "id": "bet_003",
                "sport": "MLB",
                "event": "Yankees vs Red Sox",
                "market": "total",
                "odds": 1.75,
                "probability": 0.57,
                "expected_value": 0.05,
                "kelly_fraction": 0.04,
                "confidence": 0.82,
                "risk_level": "low",
                "recommendation": "place_bet",
            },
        ]

        logger.info("Fetched %d betting opportunities", len(opportunities))
        return opportunities

    except Exception as e:
        logger.exception("Error in fetch_betting_opportunities_internal: %s", e)
        # Return empty list on error rather than raise
        return []


@router.get(
    "/betting-opportunities",
    response_model=StandardAPIResponse[List[BettingOpportunity]],
)
async def get_betting_opportunities(
    sport: Optional[str] = None,
    limit: int = 10,
) -> Dict[str, Any]:
    """Get betting opportunities with optional sport filtering"""
    try:
        # Create cache filters
        filters = {"sport": sport, "limit": limit}
        cache_key = _build_betting_cache_key(filters)

        cached_payload = await redis_cache.get(cache_key)
        if isinstance(cached_payload, dict) and cached_payload.get("opportunities"):
            logger.debug("Betting opportunities cache hit for filters=%s", filters)
            return ResponseBuilder.success(cached_payload["opportunities"])

        # Cache miss - fetch opportunities
        opportunities = await fetch_betting_opportunities_internal()

        # Filter by sport if specified
        if sport:
            opportunities = [
                opp
                for opp in opportunities
                if opp.get("sport", "").lower() == sport.lower()
            ]

        # Apply limit
        opportunities = opportunities[:limit]

        # Cache the results (best-effort)
        cache_payload = {
            "filters": filters,
            "opportunities": opportunities,
            "count": len(opportunities),
            "cached_at": datetime.utcnow().isoformat(),
        }
        try:
            await redis_cache.set(cache_key, cache_payload, ttl=BETTING_CACHE_TTL)
        except Exception as cache_error:  # pragma: no cover - defensive
            logger.debug("Betting opportunities cache set failed: %s", cache_error)

        return ResponseBuilder.success(opportunities)

    except Exception as e:
        logger.exception("Error fetching betting opportunities: %s", e)
        raise BusinessLogicException("Failed to fetch betting opportunities")


@router.get(
    "/arbitrage-opportunities",
    response_model=StandardAPIResponse[List[ArbitrageOpportunity]],
)
async def get_arbitrage_opportunities(
    limit: int = Query(5, ge=1, le=50),
    sport: str = Query("MLB", description="Sport to evaluate for arbitrage"),
    market: str = Query("player_props", description="Market to evaluate for arbitrage"),
    min_margin_pct: float = Query(
        0.25, ge=0.0, description="Minimum profit margin percentage to include"
    ),
) -> Dict[str, Any]:
    """Get arbitrage opportunities across different bookmakers"""
    try:
        if odds_snapshot_store is None:
            logger.warning(
                "Odds snapshot store unavailable; returning empty arbitrage list"
            )
            return ResponseBuilder.success([])

        snapshots = await odds_snapshot_store.get_latest(
            sport=sport, market=market, limit=4000
        )

        if not snapshots and refresh_odds_market is not None:
            try:
                snapshots = await refresh_odds_market(sport, market)
            except Exception as refresh_error:  # pragma: no cover - defensive log path
                logger.warning("Failed to refresh odds snapshots: %s", refresh_error)
                snapshots = []

        if not snapshots:
            logger.info(
                "No arbitrage opportunities available for sport=%s market=%s",
                sport,
                market,
            )
            return ResponseBuilder.success([])

        raw_opportunities = _compute_real_arbitrage_opportunities(
            snapshots,
            sport=sport,
            market=market,
            min_margin_pct=min_margin_pct,
        )

        formatted: List[Dict[str, Any]] = []
        for opportunity in raw_opportunities[:limit]:
            event_description = _format_event_description(
                opportunity["selection_key"],
                opportunity.get("player"),
                market,
                opportunity.get("line"),
            )

            over_decimal = _american_to_decimal(opportunity["over_american"])
            under_decimal = _american_to_decimal(opportunity["under_american"])

            formatted.append(
                {
                    "id": f"arb::{opportunity['selection_key']}::{opportunity['over_book']}::{opportunity['under_book']}",
                    "sport": sport,
                    "event": event_description,
                    "bookmaker_a": opportunity["over_book"],
                    "bookmaker_b": opportunity["under_book"],
                    "odds_a": round(over_decimal, 4),
                    "odds_b": round(under_decimal, 4),
                    "profit_margin": round(opportunity["margin_pct"] / 100, 6),
                    "required_stake": round(opportunity["total_stake"], 2),
                    # Extended metadata consumed by the arbitrage dashboard
                    "selection_key": opportunity["selection_key"],
                    "market": opportunity.get("market", market),
                    "player": opportunity.get("player"),
                    "line": opportunity.get("line"),
                    "over_book": opportunity["over_book"],
                    "under_book": opportunity["under_book"],
                    "over_american": opportunity["over_american"],
                    "under_american": opportunity["under_american"],
                    "margin_pct": round(opportunity["margin_pct"], 4),
                    "stake_over": round(opportunity["stake_over"], 2),
                    "stake_under": round(opportunity["stake_under"], 2),
                    "total_stake": round(opportunity["total_stake"], 2),
                    "guaranteed_return": round(opportunity["guaranteed_return"], 2),
                    "guaranteed_profit": round(opportunity["guaranteed_profit"], 2),
                    "last_updated": _coerce_iso_timestamp(
                        opportunity.get("last_updated")
                    ),
                }
            )

        logger.info(
            "Returning %d arbitrage opportunities (requested limit=%d)",
            len(formatted),
            limit,
        )
        return ResponseBuilder.success(formatted)

    except Exception as e:
        logger.exception("Error fetching arbitrage opportunities: %s", e)
        raise BusinessLogicException("Failed to fetch arbitrage opportunities")


@router.get(
    "/risk-profiles",
    response_model=StandardAPIResponse[RiskProfilesResponse],
)
async def get_risk_profiles() -> Dict[str, Any]:
    """Get available risk profiles for betting strategies"""
    try:
        profiles = [
            RiskProfileModel(
                id="conservative",
                max_kelly_fraction=0.05,
                min_win_probability=0.65,
                min_expected_value=0.02,
            ),
            RiskProfileModel(
                id="moderate",
                max_kelly_fraction=0.15,
                min_win_probability=0.55,
                min_expected_value=0.05,
            ),
            RiskProfileModel(
                id="aggressive",
                max_kelly_fraction=0.25,
                min_win_probability=0.45,
                min_expected_value=0.08,
            ),
        ]
        # Use lazy logging formatting to avoid f-strings at import-time
        logger.info("Returning %d risk profiles", len(profiles))
        return ResponseBuilder.success(RiskProfilesResponse(profiles=profiles))

    except Exception as e:
        logger.exception("Error fetching risk profiles: %s", e)
        raise BusinessLogicException("Failed to fetch risk profiles")
