import pytest

from backend.services.core.unified_data_service import (
    DataSourceType,
    UnifiedDataService,
)


def test_normalize_player_data_variants():
    svc = UnifiedDataService()

    raw1 = {"id": 123, "playerName": "Jane Doe", "teamName": "Sharks"}
    out1 = svc.normalize_player_data(raw1)
    assert out1["player_id"] == 123
    assert out1["name"] == "Jane Doe"
    assert out1["team"] == "Sharks"
    assert "_raw" in out1

    raw2 = {"playerId": 456, "full_name": "J. Smith", "team_abbr": "NY"}
    out2 = svc.normalize_player_data(raw2)
    assert out2["player_id"] == 456
    assert out2["name"] == "J. Smith"
    assert out2["team"] == "NY"

    out3 = svc.normalize_player_data(None)
    assert out3 == {}


@pytest.mark.asyncio
async def test_fetch_with_optimization_simple_and_live(monkeypatch):
    called = {}

    async def fake_fetch(self, source_type, endpoint, params=None, *args, **kwargs):
        called["source_type"] = source_type
        called["endpoint"] = endpoint
        called["params"] = params
        return {"ok": True, "endpoint": endpoint}

    monkeypatch.setattr(UnifiedDataService, "fetch_with_optimization", fake_fetch)

    svc = UnifiedDataService()
    res = await svc.fetch_with_optimization_simple("/api/health", {"a": 1})
    assert res == {"ok": True, "endpoint": "/api/health"}
    assert called["source_type"] == DataSourceType.ODDS_API
    assert called["endpoint"] == "/api/health"
    assert called["params"] == {"a": 1}

    # Test fetch_live_data uses the canonical endpoint
    called.clear()

    async def fake_fetch_simple(self, endpoint, params=None):
        called["endpoint"] = endpoint
        called["params"] = params
        return {"live": True}

    monkeypatch.setattr(
        UnifiedDataService, "fetch_with_optimization_simple", fake_fetch_simple
    )

    res2 = await svc.fetch_live_data("mlb", "regular")
    assert res2 == {"live": True}
    assert called["endpoint"] == "/api/v1/sports/mlb/regular/live"
    assert called["params"] == {}

    @pytest.mark.asyncio
    async def test_default_source_is_configurable(monkeypatch):
        called = {}

        async def fake_fetch(self, source_type, endpoint, params=None, *args, **kwargs):
            called["source_type"] = source_type
            called["endpoint"] = endpoint
            called["params"] = params
            return {"ok": True}

        monkeypatch.setattr(UnifiedDataService, "fetch_with_optimization", fake_fetch)

        svc = UnifiedDataService(default_source=DataSourceType.SPORTSRADAR)
        res = await svc.fetch_with_optimization_simple("/some/endpoint", {})
        assert res == {"ok": True}
        assert called["source_type"] == DataSourceType.SPORTSRADAR
