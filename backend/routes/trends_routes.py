import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from backend.core.exceptions import BusinessLogicException

from ..models.trends_models import (
    MarketTypeFilter,
    SportFilter,
    TrendCacheStatus,
    TrendLeaderboardFilters,
    TrendLeaderboardResponse,
    TrendMetric,
    TrendStatsSummary,
)
from ..services.trends_service import trends_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trends", tags=["trends"])


@router.get("/props", response_model=TrendLeaderboardResponse)
async def get_trends_leaderboard(
    metric: TrendMetric = Query(
        default=TrendMetric.OVER_HIT_RATE,
        description="Metric to rank by: over_hit_rate, avg_ev, arbitrage_count, high_confidence_rate",
    ),
    sport: SportFilter = Query(
        default=SportFilter.ALL, description="Sport filter: ALL, MLB, NBA, NFL, NHL"
    ),
    market_type: MarketTypeFilter = Query(
        default=MarketTypeFilter.ALL,
        description="Market type filter: all, player_props, team_totals, spreads, moneylines",
    ),
    min_samples: int = Query(
        default=5,
        ge=1,
        le=100,
        description="Minimum number of props for inclusion in leaderboard",
    ),
    period_days: int = Query(
        default=30, ge=7, le=365, description="Analysis period in days"
    ),
    limit: int = Query(
        default=50, ge=1, le=500, description="Maximum number of entries to return"
    ),
) -> TrendLeaderboardResponse:
    """
    Get trends leaderboard with specified filters and metrics.

    This endpoint provides prop performance leaderboards with various metrics:
    - **over_hit_rate**: Percentage of over bets that hit
    - **avg_ev**: Average expected value percentage
    - **arbitrage_count**: Number of arbitrage opportunities identified
    - **high_confidence_rate**: Rate of high confidence (>70%) predictions

    Results are cached for 5 minutes to improve performance.
    """
    try:
        filters = TrendLeaderboardFilters(
            metric=metric,
            sport=sport,
            market_type=market_type,
            min_samples=min_samples,
            period_days=period_days,
            limit=limit,
        )
        # Use logger lazy formatting to avoid f-string/parens issues at import-time
        logger.info("Fetching trends leaderboard with filters: %s", filters.dict())

        response = await trends_service.get_trends_leaderboard(filters)

        logger.info("Returning %d leaderboard entries", len(response.data))
        return response

    except Exception as e:
        logger.exception("Error fetching trends leaderboard: %s", e)
        return TrendLeaderboardResponse(
            success=False,
            data=[],
            filters=TrendLeaderboardFilters(),
            total_entries=0,
            error=f"Failed to fetch trends data: {str(e)}",
        )


@router.get("/summary", response_model=TrendStatsSummary)
async def get_trends_summary() -> TrendStatsSummary:
    """
    Get summary statistics for trends data including total players,
    props analyzed, sports covered, and top performers.
    """
    try:
        logger.info("Fetching trends summary")
        summary = await trends_service.get_trends_summary()
        return summary

    except Exception as e:
        logger.exception("Error fetching trends summary: %s", e)
        raise BusinessLogicException("Failed to fetch trends summary", status_code=500)


@router.get("/cache/status", response_model=TrendCacheStatus)
async def get_cache_status() -> TrendCacheStatus:
    """
    Get current cache status for trends data including last computed time,
    next refresh time, cache hit rate, and number of entries cached.
    """
    try:
        logger.info("Fetching trends cache status")
        status = trends_service.get_cache_status()
        return status

    except Exception as e:
        logger.exception("Error fetching cache status: %s", e)
        raise BusinessLogicException("Failed to fetch cache status", status_code=500)


@router.post("/cache/clear")
async def clear_trends_cache() -> Dict[str, Any]:
    """
    Clear the trends cache to force fresh computation on next request.
    Useful for testing or when data has been updated.
    """
    try:
        logger.info("Clearing trends cache")
        success = await trends_service.clear_cache()

        if success:
            return {"success": True, "message": "Trends cache cleared successfully"}
        else:
            return {"success": False, "message": "Failed to clear trends cache"}

    except Exception as e:
        logger.exception("Error clearing trends cache: %s", e)
        raise BusinessLogicException("Failed to clear trends cache", status_code=500)


@router.get("/metrics/available")
async def get_available_metrics() -> Dict[str, Any]:
    """
    Get list of available metrics and their descriptions.
    """
    return {
        "success": True,
        "metrics": {
            "over_hit_rate": {
                "name": "Over Hit Rate",
                "description": "Percentage of over bets that hit",
                "unit": "percentage",
                "higher_is_better": True,
            },
            "avg_ev": {
                "name": "Average Expected Value",
                "description": "Average expected value percentage across all props",
                "unit": "percentage",
                "higher_is_better": True,
            },
            "arbitrage_count": {
                "name": "Arbitrage Opportunities",
                "description": "Number of arbitrage opportunities identified",
                "unit": "count",
                "higher_is_better": True,
            },
            "high_confidence_rate": {
                "name": "High Confidence Rate",
                "description": "Rate of predictions with >70% confidence",
                "unit": "percentage",
                "higher_is_better": True,
            },
        },
        "sports": ["ALL", "MLB", "NBA", "NFL", "NHL"],
        "market_types": ["all", "player_props", "team_totals", "spreads", "moneylines"],
    }
