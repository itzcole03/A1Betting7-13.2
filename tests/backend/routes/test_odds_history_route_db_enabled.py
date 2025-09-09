import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.core.app import create_app
from backend.database import create_tables_async


@pytest.fixture(scope="module")
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c


def test_odds_history_uses_db_when_enabled(client: TestClient, monkeypatch):
    monkeypatch.setenv("ENABLE_ODDS_SNAPSHOTS", "true")

    # Ensure tables exist
    import anyio

    anyio.run(create_tables_async)

    # Clean existing snapshots for deterministic test (idempotent)
    from sqlmodel import delete
    from backend.database import async_engine
    from sqlmodel.ext.asyncio.session import AsyncSession
    from backend.models.odds_snapshot_sqlmodel import OddsSnapshotRecord

    prop_id = "synthetic:mlb:hits:player-db"
    sportsbook = "DraftKings"
    sport = "MLB"

    async def _clear():
        from sqlalchemy import text
        async with AsyncSession(async_engine) as session:
            await session.execute(
                text("DELETE FROM oddssnapshotrecord WHERE prop_id = :p AND sportsbook = :b"),
                {"p": prop_id, "b": sportsbook},
            )
            await session.commit()

    anyio.run(_clear)

    # Seed a couple of snapshots directly through the service
    from backend.services.odds_snapshot_service import get_odds_snapshot_service

    svc = get_odds_snapshot_service()

    # Seed snapshots in the recent past to ensure they fall within the route's end_time window
    base = datetime.now(timezone.utc).replace(second=0, microsecond=0) - timedelta(minutes=2)

    async def _seed():
        await svc.store_snapshot(
            prop_id=prop_id,
            sportsbook=sportsbook,
            sport=sport,
            line=1.5,
            over_odds=-110,
            under_odds=100,
            captured_at=base,
        )
        await svc.store_snapshot(
            prop_id=prop_id,
            sportsbook=sportsbook,
            sport=sport,
            line=1.6,
            over_odds=-112,
            under_odds=102,
            captured_at=base + timedelta(minutes=1),
        )

    anyio.run(_seed)

    # Query the route; it should prefer DB snapshots and return 2 entries
    resp = client.get(
        "/api/odds/history",
        params={
            "prop_id": prop_id,
            "sportsbook": sportsbook,
            "hours_back": 24,
            "limit": 50,
        },
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert payload.get("success") is True
    data = payload.get("data") or {}
    assert data.get("prop_id") == prop_id
    assert data.get("sportsbook") == sportsbook
    snaps = data.get("snapshots") or []
    assert isinstance(snaps, list)
    assert len(snaps) == 2

    # ascending order by captured_at
    def ts(x):
        raw = x.get("captured_at") or x.get("timestamp")
        if isinstance(raw, (int, float)):
            return float(raw)
        if isinstance(raw, str):
            from datetime import datetime

            return datetime.fromisoformat(raw.replace("Z", "+00:00")).timestamp()
        return 0.0

    assert snaps == sorted(snaps, key=ts)
