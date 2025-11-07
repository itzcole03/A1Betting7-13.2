import asyncio

import pytest

from backend.services.core.unified_data_service import UnifiedDataService


@pytest.mark.asyncio
async def test_get_player_data_compat(monkeypatch):
    svc = UnifiedDataService()

    async def fake_get_player_data_optimized(
        player_name, stat_types, force_refresh=False
    ):
        return {"player_id": 123, "name": player_name, "stat_types": stat_types}

    monkeypatch.setattr(
        svc, "get_player_data_optimized", fake_get_player_data_optimized
    )

    res = await svc.get_player_data("John Doe", ["points", "assists"])
    assert isinstance(res, dict)
    assert res["player_id"] == 123
    assert res["name"] == "John Doe"


@pytest.mark.asyncio
async def test_fetch_performance_and_prizepicks_compat(monkeypatch):
    svc = UnifiedDataService()

    async def fake_fetch_real_performance_stats(user_id=None):
        return {"today_profit": 10.5, "user_id": user_id}

    async def fake_fetch_real_prizepicks_props():
        return [{"id": "p1"}, {"id": "p2"}]

    monkeypatch.setattr(
        svc, "fetch_real_performance_stats", fake_fetch_real_performance_stats
    )
    monkeypatch.setattr(
        svc, "fetch_real_prizepicks_props", fake_fetch_real_prizepicks_props
    )

    perf = await svc.fetch_performance(42)
    assert perf["today_profit"] == 10.5
    assert perf["user_id"] == 42

    props = await svc.fetch_prizepicks()
    assert isinstance(props, list)
    assert props[0]["id"] == "p1"


@pytest.mark.asyncio
async def test_fetch_live_odds_compat(monkeypatch):
    svc = UnifiedDataService()

    async def fake_get_validated_live_odds(api_url):
        return [{"event": "game1"}]

    monkeypatch.setattr(svc, "get_validated_live_odds", fake_get_validated_live_odds)

    res = await svc.fetch_live_odds("https://example.com/odds")
    assert isinstance(res, list)
    assert res[0]["event"] == "game1"
