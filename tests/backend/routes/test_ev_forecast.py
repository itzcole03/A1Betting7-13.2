import os
import time
from fastapi.testclient import TestClient

# Ensure testing flags are set before app import
os.environ["TESTING"] = "1"
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from typing import Any, cast
from backend.main import app
from backend.services.ev_feed_service import ev_feed_service
from backend.models.ev_models import EVOpportunity, SportType, MarketType


client = TestClient(app)


def _make_opp(ev_percent: float, ts: float, idx: int = 0) -> EVOpportunity:
    return EVOpportunity(
        id=f"TEST_{idx}_{int(ts)}",
        player="Test Player",
        market="Points Over 20.5",
        sport=SportType.NBA,
        market_type=MarketType.PLAYER_PROPS,
        our_fair_odds=-110,
        market_odds=-105,
        ev_percent=ev_percent,
        source_book="TestBook",
        game_info="Team A @ Team B",
        confidence_score=None,
        volume_indicator=None,
        line_movement=None,
    )


def test_ev_forecast_rising_sequence_produces_positive_prediction():
    # Use a fake in-memory Redis to avoid unified cache dependency
    class _FakeRedis:
        def __init__(self):
            self.store = {}

        async def set(self, key, value, ex=None):
            self.store[key] = value
            return True

        async def get(self, key):
            return self.store.get(key)

        async def ping(self):
            return True

    ev_feed_service.redis_client = cast(Any, _FakeRedis())

    # Prepare a rising EV sequence over 5 snapshots
    base_ts = time.time() - 5 * 60
    ev_values = [2.0, 2.5, 3.0, 3.5, 4.0]

    # Record snapshots for a stable key (same player/market/book)
    for i, ev in enumerate(ev_values):
        opp = _make_opp(ev, base_ts + i * 60, idx=i)
        # record snapshot with explicit timestamp
        # Use same identity each time via stable key computation (player/market/book)
        # Here ids differ but snapshot key uses player/market/book
        import anyio
        anyio.run(ev_feed_service.record_ev_snapshot, opp, base_ts + i * 60)

    # Add a current opportunity at 4.0, and seed feed cache so forecast considers it
    current_opp = _make_opp(4.0, time.time(), idx=999)
    import anyio
    anyio.run(ev_feed_service.record_ev_snapshot, current_opp, time.time())
    # Seed the feed with this opportunity so compute_forecasts iterates it
    anyio.run(ev_feed_service._store_opportunities, [current_opp])

    # Call forecast endpoint
    resp = client.get("/api/ev/forecast?min_ev=0&limit=10")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "items" in data
    items = data["items"]
    # Find our player/market/book entry
    matching = [it for it in items if it["player"] == "Test Player" and it["source_book"] == "TestBook"]
    assert matching, f"No forecast found in items: {items}"
    first = matching[0]
    assert first["slope_per_min"] > 0
    assert first["predictedEvNext5m"] > first["current_ev"]
