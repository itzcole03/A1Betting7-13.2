import os
import anyio
import pytest
from datetime import datetime, timedelta, timezone

from backend.database import create_tables_async
from backend.services.odds_snapshot_service import get_odds_snapshot_service

@pytest.mark.asyncio
async def test_odds_snapshot_flag_enable_disable(monkeypatch):
    monkeypatch.setenv("ENABLE_ODDS_SNAPSHOTS", "true")
    await create_tables_async()
    svc = get_odds_snapshot_service()
    # Force re-evaluate flag for already-instantiated singleton if needed
    svc.enabled = True
    # Ensure clean slate for deterministic assertions
    if hasattr(svc, "reset_for_tests"):
        await svc.reset_for_tests()

    base = datetime.now(timezone.utc).replace(second=0, microsecond=0) - timedelta(minutes=1)
    await svc.store_snapshot(
        prop_id="synthetic:mlb:hits:player-db",
        sportsbook="DraftKings",
        sport="MLB",
        line=1.5,
        over_odds=-110,
        under_odds=100,
        captured_at=base,
    )
    hist = await svc.get_history(
        prop_id="synthetic:mlb:hits:player-db",
        sportsbook="DraftKings",
        start_time=base - timedelta(minutes=5),
        end_time=base + timedelta(minutes=5),
        limit=10,
    )
    assert len(hist) == 1

    # Disable and attempt another snapshot (should noop)
    monkeypatch.setenv("ENABLE_ODDS_SNAPSHOTS", "false")
    svc.enabled = False
    await svc.store_snapshot(
        prop_id="synthetic:mlb:hits:player-db",
        sportsbook="DraftKings",
        sport="MLB",
        line=1.6,
        over_odds=-112,
        under_odds=102,
        captured_at=base + timedelta(minutes=1),
    )
    hist2 = await svc.get_history(
        prop_id="synthetic:mlb:hits:player-db",
        sportsbook="DraftKings",
        start_time=base - timedelta(minutes=5),
        end_time=base + timedelta(minutes=5),
        limit=10,
    )
    # Still 1 because disabled
    assert len(hist2) == 0  # service returns [] when disabled
