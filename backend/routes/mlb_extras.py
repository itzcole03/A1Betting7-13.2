import logging
import os
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from backend.services.mlb_provider_client import MLBProviderClient

router = APIRouter()

logger = logging.getLogger("propollama")
from backend.services.comprehensive_prizepicks_service import (
    comprehensive_prizepicks_service,
)


# --- MLB PrizePicks Props Endpoint ---
@router.get("/mlb/prizepicks-props/", response_model=List[Dict[str, Any]])
async def get_mlb_prizepicks_props():
    """Get filtered and mapped MLB PrizePicks props for UI display."""
    logger.info("[ROUTE] /mlb/prizepicks-props/ called")
    result = await comprehensive_prizepicks_service.get_mlb_prizepicks_props_for_ui()
    logger.info(f"[ROUTE] /mlb/prizepicks-props/ returning {len(result)} props")
    return result


# --- MLB PrizePicks Props Endpoint ---


import logging

from backend.services.comprehensive_prizepicks_service import (
    comprehensive_prizepicks_service,
)

logger = logging.getLogger("propollama")


@router.get("/mlb/prizepicks-props/", response_model=List[Dict[str, Any]])
async def get_mlb_prizepicks_props():
    """Get filtered and mapped MLB PrizePicks props for UI display."""
    logger.info("[ROUTE] /mlb/prizepicks-props/ called")
    result = await comprehensive_prizepicks_service.get_mlb_prizepicks_props_for_ui()
    logger.info(f"[ROUTE] /mlb/prizepicks-props/ returning {len(result)} props")
    return result


from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from backend.services.mlb_provider_client import MLBProviderClient

router = APIRouter()


@router.get("/mlb/action-shots/{event_id}", response_model=List[Dict[str, Any]])
async def get_action_shots(event_id: str):
    """Get AP Action Shots for a given MLB event."""
    client = MLBProviderClient()
    return await client.fetch_action_shots_ap(event_id)


@router.get("/mlb/country-flag/{country_code}", response_model=Optional[str])
async def get_country_flag(country_code: str):
    """Get country flag image URL by country code."""
    client = MLBProviderClient()
    return await client.fetch_country_flag(country_code)


@router.get("/mlb/odds-comparison/", response_model=List[Dict[str, Any]])
async def get_odds_comparison(
    market_type: str = Query(
        "regular", enum=["futures", "prematch", "regular", "playerprops"]
    )
):
    """Get odds comparison data for MLB by market type."""

    client = MLBProviderClient()
    return await client.fetch_odds_comparison(market_type)


# --- DEBUG: Flush odds comparison cache for 'regular' market ---
@router.post("/debug/flush-odds-comparison-cache")
async def flush_odds_comparison_cache():
    """Flush the Redis cache for MLB odds comparison (regular market)."""
    import redis.asyncio as redis

    season_year = time.strftime("%Y")
    cache_key = f"mlb:odds_comparison:regular:{season_year}"
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    r = await redis.from_url(redis_url)
    await r.delete(cache_key)
    return {
        "status": "ok",
        "cache_key": cache_key,
        "message": "Flushed odds comparison cache for regular market.",
    }


# TODO: Add these routes to your main FastAPI app in main.py or unified_api.py
