"""
Opportunities Routes - Thin compatibility alias for positive EV feed

Provides GET /api/opportunities/positive-ev that proxies to the existing
EV feed service, applying the same filters and returning the EVFeedResponse.

This avoids duplicating logic and offers a stable path for frontend clients
expecting the opportunities namespace.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.core.exceptions import BusinessLogicException
from backend.models.ev_models import EVFeedResponse, MarketType, SportType
from backend.services.ev_feed_service import ev_feed_service

logger = logging.getLogger("opportunities_routes")
router = APIRouter(prefix="/api/opportunities", tags=["Opportunities"])


@router.get("/positive-ev", response_model=EVFeedResponse)
async def get_positive_ev_opportunities(
    sport: Optional[SportType] = Query(SportType.ALL, description="Sport filter"),
    min_edge: Optional[float] = Query(3.0, description="Minimum EV percentage"),
    market_type: Optional[MarketType] = Query(None, description="Market type filter"),
    source_book: Optional[str] = Query(None, description="Sportsbook filter"),
    limit: Optional[int] = Query(
        100, description="Maximum opportunities", ge=1, le=500
    ),
):
    """
    Compatibility alias that proxies to /api/ev/feed to serve +EV opportunities.
    """
    try:
        resp = await ev_feed_service.get_opportunities(
            min_ev=min_edge or 3.0,
            sport=sport or SportType.ALL,
            market_type=market_type,
            source_book=source_book,
            limit=limit or 100,
        )
        return resp
    except Exception as e:
        logger.error(f"Failed to fetch positive EV opportunities: {e}")
        raise BusinessLogicException("Failed to fetch opportunities", status_code=500)
