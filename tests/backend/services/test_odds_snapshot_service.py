import os
from datetime import datetime, timedelta, timezone

import pytest


@pytest.mark.asyncio
async def test_store_and_get_history_deduped(monkeypatch):
    # Enable snapshot persistence for this test
    monkeypatch.setenv("ENABLE_ODDS_SNAPSHOTS", "true")

    # Ensure tables exist on the in-memory test DB
    from backend.database import create_tables_async

    await create_tables_async()

    from backend.services.odds_snapshot_service import get_odds_snapshot_service

    svc = get_odds_snapshot_service()
    assert svc.enabled is True

    prop_id = "test:mlb:hits:playerX"
    sportsbook = "DraftKings"
    sport = "MLB"

    base = datetime.now(timezone.utc).replace(second=10, microsecond=0)

    # First insert in a minute bucket
    rec1 = await svc.store_snapshot(
        prop_id=prop_id,
        sportsbook=sportsbook,
        sport=sport,
        line=1.5,
        over_odds=-110,
        under_odds=100,
        captured_at=base,
    )
    assert rec1 is not None

    # Second insert within the same minute -> should update existing row
    rec2 = await svc.store_snapshot(
        prop_id=prop_id,
        sportsbook=sportsbook,
        sport=sport,
        line=1.6,  # changed
        over_odds=-112,
        under_odds=102,
        captured_at=base + timedelta(seconds=20),  # same minute bucket
    )
    assert rec2 is not None
    assert rec2.id == rec1.id  # deduped in the same minute

    # History within a small window should return one row with updated values
    # Narrow window to target only the records created in this test
    hist1 = await svc.get_history(
        prop_id=prop_id,
        sportsbook=sportsbook,
        start_time=base - timedelta(seconds=5),
        end_time=base + timedelta(minutes=1, seconds=30),
        limit=50,
    )
    assert isinstance(hist1, list)
    assert len(hist1) == 1
    assert hist1[0]["line"] == 1.6
    assert hist1[0]["over_odds"] == -112
    assert hist1[0]["under_odds"] == 102

    # Insert another snapshot in a different minute bucket
    later = base + timedelta(minutes=2)
    rec3 = await svc.store_snapshot(
        prop_id=prop_id,
        sportsbook=sportsbook,
        sport=sport,
        line=1.7,
        over_odds=-115,
        under_odds=105,
        captured_at=later,
    )
    assert rec3 is not None
    assert rec3.id != rec2.id

    # History should now contain two ascending entries
    # Second window spanning first and second minute buckets inserted here
    hist2 = await svc.get_history(
        prop_id=prop_id,
        sportsbook=sportsbook,
        start_time=base - timedelta(seconds=5),
        end_time=later + timedelta(seconds=30),
        limit=50,
    )
    assert len(hist2) == 2

    # Ensure chronological order
    def ts(d):
        from datetime import datetime

        raw = d.get("captured_at") or d.get("timestamp")
        if isinstance(raw, (int, float)):
            return float(raw)
        if isinstance(raw, str):
            return datetime.fromisoformat(raw.replace("Z", "+00:00")).timestamp()
        return 0.0

    assert hist2 == sorted(hist2, key=ts)
