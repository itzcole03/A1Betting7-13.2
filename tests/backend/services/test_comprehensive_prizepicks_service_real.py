import pytest

from backend.services.comprehensive_prizepicks_service import (
    ComprehensivePrizePicksService,
)


class _DummyMLBClient:
    def __init__(self, payload):
        self._payload = payload

    async def generate_player_props_data(self):
        return self._payload


@pytest.mark.asyncio
async def test_get_current_props_uses_real_mlb_payload(monkeypatch):
    sample_props = [
        {
            "event_id": "game_123",
            "player_name": "Sample Hitter",
            "player_id": 99,
            "stat_type": "hits",
            "line": 1.5,
            "ai_probability": 62.0,
            "implied_probability": 54.0,
            "edge": 8.0,
            "team_name": "BOS",
            "opponent": "NYY",
            "matchup": "BOS @ NYY",
            "start_time": "2025-10-08T19:05:00Z",
            "venue": "Fenway Park",
            "game_status": "Scheduled",
            "provider_id": "mlb_stats_api",
            "bookmakers": [
                {"name": "Season Benchmark", "odds": -120, "line": 1.5},
            ],
        }
    ]

    monkeypatch.setattr(
        "backend.services.comprehensive_prizepicks_service.MLBStatsAPIClient",
        lambda: _DummyMLBClient(sample_props),
    )

    service = ComprehensivePrizePicksService()
    props = await service.get_current_props()

    assert props, "Expected real MLB props to be returned"
    assert props[0]["id"] == "game_123"
    assert props[0]["player_name"] == "Sample Hitter"
    assert props[0]["line_score"] == pytest.approx(1.5)
    assert props[0]["provider_id"] == "mlb_stats_api"
    assert props[0]["recommendation"] == "OVER"
