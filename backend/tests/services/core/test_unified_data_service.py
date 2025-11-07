import json

from backend.services.core.unified_data_service import (
    DataSourceType,
    UnifiedDataService,
)


def test_normalize_player_data_variants():
    svc = UnifiedDataService()

    raw1 = {"id": 123, "name": "Jane Doe", "team": "T1"}
    n1 = svc.normalize_player_data(raw1)
    assert n1["player_id"] == 123
    assert n1["name"] == "Jane Doe"
    assert n1["team"] == "T1"

    raw2 = {"playerId": 456, "playerName": "John Q", "teamName": "T2"}
    n2 = svc.normalize_player_data(raw2)
    assert n2["player_id"] == 456
    assert n2["name"] == "John Q"
    assert n2["team"] == "T2"


def test_normalize_player_data_non_dict_returns_empty():
    svc = UnifiedDataService()
    assert svc.normalize_player_data([1, 2, 3]) == {}


def test_default_source_parsing_and_enum():
    svc1 = UnifiedDataService(default_source="draftkings")
    assert isinstance(svc1.default_source, DataSourceType)
    assert svc1.default_source == DataSourceType.DRAFTKINGS

    svc2 = UnifiedDataService(default_source=DataSourceType.ODDS_API)
    assert svc2.default_source == DataSourceType.ODDS_API


def test_render_realtime_signature_stable_and_fallback():
    svc = UnifiedDataService()

    cfg = {"a": 1, "b": "x"}
    s1 = svc._render_realtime_signature(cfg)
    s2 = svc._render_realtime_signature(cfg)
    # Should be json-serializable and identical across calls
    assert isinstance(s1, str)
    assert s1 == s2

    # Non-jsonable value: ensure fallback to repr(sorted(items)) works
    cfg2 = {"a": set([1, 2])}
    s3 = svc._render_realtime_signature(cfg2)
    assert isinstance(s3, str)


import pytest

from backend.services.core.unified_data_service import UnifiedDataService


@pytest.mark.asyncio
async def test_legacy_wrappers_delegate(monkeypatch):
    svc = UnifiedDataService()

    async def fake_player(self, name, stats, force_refresh=False):
        return {"player": name, "stats": stats, "force": force_refresh}

    monkeypatch.setattr(UnifiedDataService, "get_player_data_optimized", fake_player)

    res = await svc.get_player_data("Bob", ["PTS"], True)
    assert res["player"] == "Bob"
    assert res["force"] is True

    async def fake_perf(self, user_id=None):
        return {"user": user_id}

    monkeypatch.setattr(UnifiedDataService, "fetch_real_performance_stats", fake_perf)
    res2 = await svc.fetch_performance(42)
    assert res2["user"] == 42

    async def fake_prizepicks(self):
        return [{"id": "p1"}]

    monkeypatch.setattr(
        UnifiedDataService, "fetch_real_prizepicks_props", fake_prizepicks
    )
    res3 = await svc.fetch_prizepicks()
    assert isinstance(res3, list) and res3[0]["id"] == "p1"

    async def fake_live(self, url):
        return {"ok": True, "url": url}

    monkeypatch.setattr(UnifiedDataService, "get_validated_live_odds", fake_live)
    res4 = await svc.fetch_live_odds("http://example")
    assert res4["ok"] is True
    assert res4["url"] == "http://example"
