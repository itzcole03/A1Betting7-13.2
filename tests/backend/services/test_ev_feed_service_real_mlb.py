import pytest

from backend.models.ev_models import SportType
from backend.services.ev_feed_service import EVFeedService


class _DummyMLBClient:
    def __init__(self, props):
        self._props = props

    async def generate_player_props_data(self):
        return self._props


@pytest.fixture
def sample_mlb_prop():
    return {
        "event_id": "game_321",
        "player_name": "Sample Slugger",
        "stat_type": "hits",
        "line": 1.5,
        "ai_probability": 65.0,
        "implied_probability": 52.0,
        "edge": 13.0,
        "team_name": "BOS",
        "opponent": "NYY",
        "matchup": "BOS @ NYY",
        "start_time": "2025-10-08T19:05:00Z",
        "provider_id": "mlb_stats_api",
        "bookmakers": [
            {"name": "SampleBook", "odds": -105, "line": 1.5},
            {"name": "Recent Form Model", "odds": -150, "line": 1.5},
        ],
    }


@pytest.mark.asyncio
async def test_fetch_mlb_props_normalizes_real_data(monkeypatch, sample_mlb_prop):
    monkeypatch.setattr(
        "backend.services.ev_feed_service.MLBStatsAPIClient",
        lambda: _DummyMLBClient([sample_mlb_prop]),
    )

    service = EVFeedService()
    props = await service._fetch_mlb_props()

    assert props, "Expected MLB stats props to be available"
    mlb_prop = props[0]
    assert mlb_prop["player"] == "Sample Slugger"
    assert mlb_prop["market"].startswith("Hits Over")
    assert mlb_prop["odds_data"]["SampleBook"] == -105
    assert mlb_prop["model_probability"] == pytest.approx(0.65)
    assert mlb_prop["implied_probability"] == pytest.approx(0.52)


@pytest.mark.asyncio
async def test_process_sport_props_generates_ev_from_mlb(monkeypatch, sample_mlb_prop):
    monkeypatch.setattr(
        "backend.services.ev_feed_service.MLBStatsAPIClient",
        lambda: _DummyMLBClient([sample_mlb_prop]),
    )

    service = EVFeedService()
    props = await service._fetch_mlb_props()
    opportunities = await service._process_sport_props(props, SportType.MLB)

    assert opportunities, "Expected at least one +EV opportunity"
    sample_opp = next((opp for opp in opportunities if opp.source_book == "SampleBook"), None)
    assert sample_opp is not None
    assert sample_opp.sport == SportType.MLB
    assert sample_opp.market_odds == -105
    assert sample_opp.ev_percent >= service.MIN_EV_THRESHOLD