"""Baseball Savant connector.

Adapts `BaseballSavantClient` to the `ProviderConnector` protocol in
`backend.services.unified_data_fetcher`.
"""
from typing import List
import asyncio

from backend.services import unified_data_fetcher as udf


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
            except Exception:
                self._client = None

    async def fetch_events(self) -> List[udf.GameEvent]:
        # Baseball Savant doesn't provide schedule; delegate to mlb_stats if available
        await self._ensure_client()
        try:
            mlb_connector = udf.get_connector("mlb_stats_api")
            if mlb_connector:
                return await mlb_connector.fetch_events()
        except Exception:
            pass
        return []

    async def fetch_player_props(self, event_id: str) -> List[udf.OddsSnapshot]:
        await self._ensure_client()
        if not self._client:
            return []

        snapshots: List[udf.OddsSnapshot] = []
        try:
            players = await self._client.get_all_active_players()
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
        except Exception:
            return []
        return snapshots


# Register connector
try:
    connector = BaseballSavantConnector()
    udf.register_connector(connector)
except Exception:
    pass
