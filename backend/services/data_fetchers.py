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
