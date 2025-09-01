"""MLB Stats API connector.

This connector adapts the repo's `mlb_stats_api_client` (if present) to the
`ProviderConnector` protocol defined in `backend.services.unified_data_fetcher`.

It uses lazy imports and graceful fallbacks so the app can run without the
client installed or configured.
"""
from typing import List
import asyncio

from backend.services import unified_data_fetcher as udf


class MLBStatsConnector:
    # Match provider identifier used by the client
    name = "mlb_stats_api"

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
                # Import the actual client implemented in the repo and instantiate
                from backend.services.mlb_stats_api_client import MLBStatsAPIClient

                self._client = MLBStatsAPIClient()
            except Exception:
                # Client absent or import error — keep None and let callers handle missing data
                self._client = None

    async def fetch_events(self) -> List[udf.GameEvent]:
        await self._ensure_client()
        if not self._client:
            return []

        events: List[udf.GameEvent] = []
        try:
            # The client implements async methods; await them directly
            raw_events = await self._client.get_todays_games()
            for e in raw_events:
                events.append(
                    udf.GameEvent(
                        id=str(e.get("game_id") or e.get("gamePk") or e.get("id") or ""),
                        home_team=e.get("home_team") or e.get("homeTeam") or "",
                        away_team=e.get("away_team") or e.get("awayTeam") or "",
                        start_time=e.get("start_time") or e.get("game_date") or e.get("gameDate"),
                    )
                )
        except Exception:
            return []
        return events

    async def fetch_player_props(self, event_id: str) -> List[udf.OddsSnapshot]:
        await self._ensure_client()
        if not self._client:
            return []

        snapshots: List[udf.OddsSnapshot] = []
        try:
            # Use client's generator for props; it may return props across events
            raw_props = await self._client.generate_player_props_data()
            for p in raw_props:
                # Filter by event id when provided
                if event_id and str(p.get("event_id")) != str(event_id):
                    continue

                snapshots.append(
                    udf.OddsSnapshot(
                        event_id=str(p.get("event_id") or event_id),
                        provider=self.name,
                        market=p.get("stat_type") or p.get("market") or "playerprop",
                        line=float(p.get("line") or p.get("line_score") or 0.0),
                        over_odds=p.get("over_odds") or p.get("odds"),
                        under_odds=p.get("under_odds"),
                        raw=p,
                    )
                )
        except Exception:
            return []
        return snapshots


# Register connector on import — safe if file imported multiple times
try:
    connector = MLBStatsConnector()
    udf.register_connector(connector)
except Exception:
    # Best-effort registration; don't raise at import time
    pass
