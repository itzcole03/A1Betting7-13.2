import os
import time

from fastapi.testclient import TestClient

# Ensure testing flags are set before app import
os.environ["TESTING"] = "1"
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from typing import Any, cast

from backend.main import app
from backend.models.ev_models import EVOpportunity, MarketType, SportType
from backend.services.ev_feed_service import ev_feed_service
from backend.services.unified_cache_service import unified_cache_service

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
    # Mark service initialized to avoid it attempting real Redis in this test.
    ev_feed_service._initialized = True

    # Monkeypatch the unified_cache_service to use an in-memory dict for this test.
    # This avoids attempts to contact a real Redis instance during test runs.
    _orig_get = unified_cache_service.get
    _orig_set = unified_cache_service.set
    _mem_cache = {}

    async def _fake_get(key, default=None):
        return _mem_cache.get(key, default)

    async def _fake_set(key, value, ttl=None):
        _mem_cache[key] = value
        return True

    unified_cache_service.get = _fake_get
    unified_cache_service.set = _fake_set

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

    # Quick sanity check: ensure the feed was written to cache. Depending on
    # whether the service used redis_client (FakeRedis) or unified_cache_service
    # we'll check the appropriate backing store.
    if getattr(ev_feed_service, "redis_client", None):
        # FakeRedis stores in .store
        assert (
            ev_feed_service.REDIS_KEY in ev_feed_service.redis_client.store
        ), "ev feed key not written to FakeRedis.store"
        import json as _json

        raw = ev_feed_service.redis_client.store.get(ev_feed_service.REDIS_KEY)
        assert raw is not None, "FakeRedis returned None for feed key"
        parsed = _json.loads(raw)
        assert any(
            p.get("player") == "Test Player" for p in parsed
        ), f"Stored feed does not include Test Player: {parsed}"
    else:
        parsed = _mem_cache.get(ev_feed_service.REDIS_KEY)
        assert parsed is not None, "In-memory cache returned None for feed key"
        assert any(
            p.get("player") == "Test Player" for p in parsed
        ), f"In-memory feed does not include Test Player: {parsed}"

    # Instead of calling the HTTP endpoint (which runs in TestClient's server
    # thread and may not share in-memory monkeypatch state), call the service
    # method directly in this test process so the in-memory cache and snapshots
    # are visible.
    import anyio

    items = anyio.run(ev_feed_service.compute_forecasts, 0, 10)
    # Find our player/market/book entry
    matching = [
        it
        for it in items
        if it["player"] == "Test Player" and it["source_book"] == "TestBook"
    ]
    assert matching, f"No forecast found in items: {items}"
    first = matching[0]
    assert first["slope_per_min"] > 0
    assert first["predictedEvNext5m"] > first["current_ev"]

    # Restore unified_cache_service to original state to avoid side-effects
    unified_cache_service.get = _orig_get
    unified_cache_service.set = _orig_set
