import httpx
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential


# Centralized schema for live odds
class LiveOddsSchema(BaseModel):
    sport_id: str
    event_id: str
    bookmaker: str
    odds: float = Field(gt=0)


# Centralized odds fetcher with retry and validation
@retry(wait=wait_exponential(multiplier=1, min=4, max=10), stop=stop_after_attempt(5))
async def fetch_live_odds_from_api(api_url: str) -> list[LiveOddsSchema]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(api_url)
            response.raise_for_status()
            raw_data = response.json()
            return [LiveOddsSchema(**item) for item in raw_data]
    except httpx.RequestError as exc:
        print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
        raise
    except Exception as e:
        print(f"Data validation failed: {e}")
        raise


"""
Data Fetcher Services

This module contains functions for fetching data from external APIs and databases.
All mock implementations have been replaced with production-ready data services.
Now includes intelligent ensemble system for maximum accuracy predictions.

This is the main entry point that delegates to the unified data fetcher service.
"""

import logging
from typing import Any, Dict, List

from .unified_data_fetcher import unified_data_fetcher

logger = logging.getLogger(__name__)


# Re-export main functions for backwards compatibility
async def fetch_current_prizepicks_props() -> List[Dict[str, Any]]:
    """Fetch current PrizePicks props using unified data fetcher"""
    return await unified_data_fetcher.fetch_current_prizepicks_props()


async def fetch_historical_data(
    sport: str, lookback_days: int = 30
) -> List[Dict[str, Any]]:
    """Fetch historical data using unified data fetcher"""
    return await unified_data_fetcher.fetch_historical_data(sport, lookback_days)


# For modules that import the service directly
data_fetcher = unified_data_fetcher


# Additional convenience functions for backwards compatibility
async def fetch_current_sports_data() -> List[Dict[str, Any]]:
    """Fetch current sports data - wrapper for prizepicks props"""
    return await fetch_current_prizepicks_props()


async def get_in_season_sports() -> List[str]:
    """Get currently in-season sports"""
    return unified_data_fetcher.get_current_season_sports()


# Export the unified fetcher for direct access
__all__ = [
    "fetch_current_prizepicks_props",
    "fetch_historical_data",
    "fetch_current_sports_data",
    "get_in_season_sports",
    "data_fetcher",
    "unified_data_fetcher",
]
