import pytest

from backend.services.enhanced_api_service import EnhancedAPIService


class _DummyMLBClient:
    def __init__(self, games, props):
        self._games = games
        self._props = props

    async def get_todays_games(self):
        return self._games

    async def generate_player_props_data(self):
        return self._props


@pytest.mark.asyncio
async def test_generate_mlb_games_data_uses_real_client(monkeypatch):
    sample_games = [
        {
            "game_id": "555",
            "home_team": "Los Angeles Dodgers",
            "away_team": "San Francisco Giants",
            "home_id": 1,
            "away_id": 2,
            "game_date": "2025-10-08T19:10:00Z",
            "status": "Scheduled",
            "venue": "Dodger Stadium",
        }
    ]
    sample_props: list[dict] = []

    monkeypatch.setattr(
        "backend.services.enhanced_api_service.MLBStatsAPIClient",
        lambda: _DummyMLBClient(sample_games, sample_props),
    )

    service = EnhancedAPIService()
    games = await service._generate_mlb_games_data()

    assert games and games[0]["game_id"] == "555"
    assert games[0]["matchup"] == "San Francisco Giants @ Los Angeles Dodgers"
    assert games[0]["venue"] == "Dodger Stadium"


@pytest.mark.asyncio
async def test_generate_game_props_data_maps_real_props(monkeypatch):
    sample_games: list[dict] = []
    sample_props = [
        {
            "event_id": "game_777",
            "player_name": "Sample Pitcher",
            "stat_type": "strikeouts",
            "line": 6.5,
            "ai_probability": 64.0,
            "implied_probability": 56.0,
            "edge": 8.0,
            "team_name": "SEA",
            "opponent": "HOU",
            "matchup": "SEA @ HOU",
            "start_time": "2025-10-08T20:00:00Z",
            "provider_id": "mlb_stats_api",
        }
    ]

    monkeypatch.setattr(
        "backend.services.enhanced_api_service.MLBStatsAPIClient",
        lambda: _DummyMLBClient(sample_games, sample_props),
    )

    service = EnhancedAPIService()
    props = await service._generate_game_props_data("game_777")

    assert props and props[0]["player"] == "Sample Pitcher"
    assert props[0]["prop_type"] == "strikeouts"
    assert props[0]["confidence"] == pytest.approx(0.64)
    assert props[0]["ev"] == pytest.approx(0.08)
    assert props[0]["provider"] == "mlb_stats_api"


@pytest.mark.asyncio
async def test_generate_prediction_data_prefers_real_props(monkeypatch):
    sample_props = [
        {
            "event_id": "game_123",
            "player_name": "Sample Slugger",
            "stat_type": "hits",
            "line": 1.5,
            "ai_probability": 62.0,
            "implied_probability": 54.0,
            "edge": 8.0,
            "matchup": "BOS @ NYY",
            "start_time": "2025-10-08T19:05:00Z",
            "provider_id": "mlb_stats_api",
            "bookmakers": [],
        }
    ]

    monkeypatch.setattr(
        "backend.services.enhanced_api_service.MLBStatsAPIClient",
        lambda: _DummyMLBClient([], sample_props),
    )

    service = EnhancedAPIService()
    prediction = await service._generate_prediction_data("Sample Slugger", "hits", 1.5)

    assert prediction["prediction"]["probability_over"] == pytest.approx(0.62)
    assert prediction["prediction"]["recommendation"] == "over"
    assert prediction["model_info"]["source"] == "mlb_stats_api"
    assert prediction["model_info"]["provider_event_id"] == "game_123"
