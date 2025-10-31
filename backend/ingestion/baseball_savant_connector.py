"""Baseball Savant connector.

Adapts `BaseballSavantClient` to the `ProviderConnector` protocol in
`backend.services.unified_data_fetcher`.
"""
import logging
from typing import List
import asyncio

from backend.services import unified_data_fetcher as udf

logger = logging.getLogger(__name__)


class BaseballSavantConnector:
    name = "baseball_savant"

    def __init__(self):
        self._client = None
        self._init_lock = asyncio.Lock()

    async def _ensure_client(self):
        if self._client is not None:
            return
        async with self._init_lock:
            if self._client is not None:
                return
            try:
                from backend.services.baseball_savant_client import BaseballSavantClient

                self._client = BaseballSavantClient()
                logger.info("Baseball Savant client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Baseball Savant client: {e}")
                self._client = None

    async def fetch_events(self) -> List[udf.GameEvent]:
        # Baseball Savant doesn't provide schedule; delegate to mlb_stats if available
        await self._ensure_client()
        try:
            mlb_connector = udf.get_connector("mlb_stats_api")
            if mlb_connector:
                events = await mlb_connector.fetch_events()
                logger.debug(f"Fetched {len(events)} events from MLB Stats API")
                return events
        except Exception as e:
            logger.warning(f"Failed to fetch events from MLB Stats API: {e}")
        return []

    async def fetch_player_props(self, event_id: str) -> List[udf.OddsSnapshot]:
        await self._ensure_client()
        if not self._client:
            logger.warning("Baseball Savant client not available for fetching player props")
            return []

        snapshots: List[udf.OddsSnapshot] = []
        try:
            logger.info("Fetching all active players from Baseball Savant...")
            players = await self._client.get_all_active_players()
            logger.info(f"Retrieved {len(players)} active players from Baseball Savant")

            for p in players[:200]:  # limit to first 200 for performance
                snapshots.append(
                    udf.OddsSnapshot(
                        event_id=event_id,
                        provider=self.name,
                        market="statcast_metric",
                        line=0.0,
                        over_odds=None,
                        under_odds=None,
                        raw=p,
                    )
                )
            logger.info(f"Generated {len(snapshots)} player prop snapshots from Baseball Savant")
        except Exception as e:
            logger.error(f"Error fetching player props from Baseball Savant: {e}", exc_info=True)
            return []
        return snapshots


# Register connector
try:
    connector = BaseballSavantConnector()
    udf.register_connector(connector)
except Exception:
    pass
