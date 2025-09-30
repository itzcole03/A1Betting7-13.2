import pytest
import asyncio
from backend.odds.odds_ingestion_service import refresh_market
from backend.odds.odds_snapshot_store import odds_snapshot_store

pytestmark = pytest.mark.asyncio


async def test_refresh_market_generates_snapshots():
    snaps = await refresh_market("MLB", "player_props")
    assert len(snaps) >= 4  # one per book
    latest = await odds_snapshot_store.get_latest(sport="MLB", market="player_props", limit=10)
    assert latest
    assert all(s.sport == "MLB" for s in latest)
    assert any(s.book == "FanDuel" for s in latest)
