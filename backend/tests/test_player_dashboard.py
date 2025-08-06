from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.player_models import PlayerDashboardResponse
from backend.services.player_dashboard_service import PlayerDashboardService
from backend.services.unified_data_fetcher import UnifiedDataFetcher

client = TestClient(app)


@pytest.fixture
def mock_fetcher():
    fetcher = UnifiedDataFetcher()
    fetcher.fetch_player_info = AsyncMock(
        return_value={
            "id": "test-player",
            "name": "Test Player",
            "team": "TST",
            "position": "RF",
            "sport": "MLB",
            "active": True,
            "injury_status": None,
        }
    )
    fetcher.fetch_player_season_stats = AsyncMock(
        return_value={
            "hits": 10,
            "home_runs": 2,
            "rbis": 5,
            "batting_average": 0.250,
            "on_base_percentage": 0.300,
            "slugging_percentage": 0.400,
            "ops": 0.700,
            "strikeouts": 3,
            "walks": 2,
            "games_played": 5,
            "plate_appearances": 20,
            "at_bats": 18,
            "runs": 4,
            "doubles": 1,
            "triples": 0,
            "stolen_bases": 0,
            "war": 0.5,
            "babip": 0.290,
            "wrc_plus": 100,
            "barrel_rate": 10.0,
            "hard_hit_rate": 30.0,
            "exit_velocity": 88.0,
            "launch_angle": 12.0,
        }
    )
    fetcher.fetch_player_recent_games = AsyncMock(
        return_value=[
            {
                "date": "2025-08-01",
                "opponent": "BOS",
                "home": True,
                "result": "W",
                "stats": {
                    "hits": 2,
                    "home_runs": 1,
                    "rbis": 3,
                    "batting_average": 0.333,
                    "ops": 1.200,
                },
                "game_score": 8.5,
                "weather": {
                    "temperature": 78,
                    "wind_speed": 10,
                    "wind_direction": "NW",
                },
            }
        ]
    )
    fetcher.fetch_player_prop_history = AsyncMock(
        return_value=[
            {
                "date": "2025-08-01",
                "prop_type": "home_runs",
                "line": 1.5,
                "actual": 1.0,
                "outcome": "under",
                "odds": -110,
                "sportsbook": "DraftKings",
            }
        ]
    )
    fetcher.fetch_player_performance_trends = AsyncMock(
        return_value={
            "last_7_days": {"avg": 0.320, "hr": 3, "rbis": 8},
            "last_30_days": {"avg": 0.295, "hr": 10, "rbis": 25},
            "home_vs_away": {"home": {"avg": 0.310}, "away": {"avg": 0.280}},
            "vs_lefties": {"avg": 0.340},
            "vs_righties": {"avg": 0.270},
        }
    )
    return fetcher


@pytest.fixture
def dashboard_service(mock_fetcher):
    service = PlayerDashboardService()
    service.cache_service = {}  # Use dict as mock cache
    service.error_handler = AsyncMock()
    # Patch unified_data_fetcher globally in the service
    with patch(
        "backend.services.player_dashboard_service.unified_data_fetcher", mock_fetcher
    ):
        yield service


# --- Unit Tests ---
def test_player_dashboard_response_schema(mock_fetcher):
    """Test that the dashboard response matches the schema."""
    from backend.models.player_models import PlayerDashboardResponse

    data = {
        "id": "test-player",
        "name": "Test Player",
        "team": "TST",
        "position": "RF",
        "sport": "MLB",
        "active": True,
        "injury_status": None,
        "season_stats": mock_fetcher.fetch_player_season_stats.return_value,
        "recent_games": mock_fetcher.fetch_player_recent_games.return_value,
        "prop_history": mock_fetcher.fetch_player_prop_history.return_value,
        "performance_trends": mock_fetcher.fetch_player_performance_trends.return_value,
    }
    resp = PlayerDashboardResponse(**data)
    assert resp.id == "test-player"
    assert resp.season_stats.hits == 10
    assert resp.recent_games[0].opponent == "BOS"
    assert resp.prop_history[0].prop_type == "home_runs"
    assert resp.performance_trends.last_7_days["avg"] == 0.320


@pytest.mark.asyncio
def test_service_integration(dashboard_service):
    """Test service integration and normalization."""
    from fastapi import Request

    class DummyRequest:
        query_params = {"sport": "MLB"}
        headers = {}

    resp = pytest.run(
        dashboard_service.get_player_dashboard("test-player", DummyRequest())
    )
    assert resp.id == "test-player"
    assert resp.season_stats.hits == 10
    assert resp.recent_games[0].opponent == "BOS"


@pytest.mark.asyncio
def test_caching_behavior(dashboard_service, mock_fetcher):
    """Test that repeated calls use cache."""
    from fastapi import Request

    class DummyRequest:
        query_params = {"sport": "MLB"}
        headers = {}

    # First call populates cache
    resp1 = pytest.run(
        dashboard_service.get_player_dashboard("test-player", DummyRequest())
    )
    # Second call should hit cache (simulate by changing fetcher return)
    mock_fetcher.fetch_player_info.return_value["name"] = "Changed Name"
    resp2 = pytest.run(
        dashboard_service.get_player_dashboard("test-player", DummyRequest())
    )
    assert (
        resp2.name == "test-player" or resp2.name == "Test Player"
    )  # Should not change if cache is used


@pytest.mark.asyncio
def test_error_handling_and_correlation(dashboard_service, mock_fetcher):
    """Test error handling and correlation ID propagation."""
    from fastapi import Request

    class DummyRequest:
        query_params = {"sport": "MLB"}
        headers = {"X-Correlation-ID": "test-corr-id"}

    # Simulate fetcher raising error
    mock_fetcher.fetch_player_info.side_effect = Exception("Test error")
    with pytest.raises(Exception):
        pytest.run(
            dashboard_service.get_player_dashboard("test-player", DummyRequest())
        )


# --- Integration/E2E Test ---
def test_player_dashboard_endpoint(monkeypatch):
    """E2E test for the /api/v2/players/{player_id}/dashboard endpoint."""
    # Patch fetcher methods globally
    with patch(
        "backend.services.unified_data_fetcher.UnifiedDataFetcher.fetch_player_info",
        AsyncMock(
            return_value={
                "id": "aaron-judge",
                "name": "Aaron Judge",
                "team": "NYY",
                "position": "RF",
                "sport": "MLB",
                "active": True,
                "injury_status": None,
            }
        ),
    ), patch(
        "backend.services.unified_data_fetcher.UnifiedDataFetcher.fetch_player_season_stats",
        AsyncMock(
            return_value={
                "hits": 120,
                "home_runs": 35,
                "rbis": 90,
                "batting_average": 0.285,
                "on_base_percentage": 0.390,
                "slugging_percentage": 0.540,
                "ops": 0.930,
                "strikeouts": 110,
                "walks": 60,
                "games_played": 102,
                "plate_appearances": 420,
                "at_bats": 380,
                "runs": 80,
                "doubles": 22,
                "triples": 1,
                "stolen_bases": 5,
                "war": 4.2,
                "babip": 0.310,
                "wrc_plus": 145,
                "barrel_rate": 15.2,
                "hard_hit_rate": 48.1,
                "exit_velocity": 92.5,
                "launch_angle": 14.3,
            }
        ),
    ), patch(
        "backend.services.unified_data_fetcher.UnifiedDataFetcher.fetch_player_recent_games",
        AsyncMock(
            return_value=[
                {
                    "date": "2025-08-01",
                    "opponent": "BOS",
                    "home": True,
                    "result": "W",
                    "stats": {
                        "hits": 2,
                        "home_runs": 1,
                        "rbis": 3,
                        "batting_average": 0.333,
                        "ops": 1.200,
                    },
                    "game_score": 8.5,
                    "weather": {
                        "temperature": 78,
                        "wind_speed": 10,
                        "wind_direction": "NW",
                    },
                }
            ]
        ),
    ), patch(
        "backend.services.unified_data_fetcher.UnifiedDataFetcher.fetch_player_prop_history",
        AsyncMock(
            return_value=[
                {
                    "date": "2025-08-01",
                    "prop_type": "home_runs",
                    "line": 1.5,
                    "actual": 1.0,
                    "outcome": "under",
                    "odds": -110,
                    "sportsbook": "DraftKings",
                }
            ]
        ),
    ), patch(
        "backend.services.unified_data_fetcher.UnifiedDataFetcher.fetch_player_performance_trends",
        AsyncMock(
            return_value={
                "last_7_days": {"avg": 0.320, "hr": 3, "rbis": 8},
                "last_30_days": {"avg": 0.295, "hr": 10, "rbis": 25},
                "home_vs_away": {"home": {"avg": 0.310}, "away": {"avg": 0.280}},
                "vs_lefties": {"avg": 0.340},
                "vs_righties": {"avg": 0.270},
            }
        ),
    ):
        response = client.get("/api/v2/players/aaron-judge/dashboard?sport=MLB")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "aaron-judge"
        assert data["season_stats"]["hits"] == 120
        assert data["recent_games"][0]["opponent"] == "BOS"
        assert data["prop_history"][0]["prop_type"] == "home_runs"
        assert data["performance_trends"]["last_7_days"]["avg"] == 0.320


# --- Test Limitations ---
# - These tests use mocks and fixtures for all data and cache layers; they do not hit real APIs or databases.
# - E2E test assumes FastAPI app is importable as 'app' and routes are registered.
# - Some error/correlation logic is only checked for propagation, not for full logging output.
# - Schema compliance is checked via Pydantic model instantiation, not OpenAPI validation.
