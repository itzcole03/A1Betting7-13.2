"""
Tests for the current V1 API endpoints to ensure they are functioning correctly.
This replaces the outdated tests in test_main_enhanced.py.
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "A1Betting Ultra-Enhanced Backend"


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "uptime" in data
    assert "services" in data


def test_comprehensive_health_check():
    response = client.get("/api/health/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "performance" in data
    assert "models" in data
    assert "api_metrics" in data


@patch("backend.main.get_sport_radar_games")
def test_get_betting_opportunities(mock_get_games):
    # Mock the external API call to avoid 403 errors in tests
    mock_get_games.return_value = []
    response = client.get("/api/betting-opportunities")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_arbitrage_opportunities():
    response = client.get("/api/arbitrage-opportunities")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_predictions_shim():
    response = client.get("/api/predictions/prizepicks")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_get_prizepicks_props():
    # This test might still fail if it relies on external services or complex dependencies
    # that are not mocked. For now, we expect it to run without crashing.
    response = client.get("/api/prizepicks/props")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "props" in data
    assert isinstance(data["props"], list)


# More tests can be added here for other v1 endpoints.

# --- Tests for /api/v1/sr/games endpoint ---

# --- Tests for /api/v1/sr/games endpoint ---
import httpx

from backend.api_integration import get_config
from backend.main import app


@patch("httpx.AsyncClient.get")
def test_sr_games_success(mock_get: MagicMock):
    from unittest.mock import MagicMock

    # Use dependency override for config
    mock_config = MagicMock()
    mock_config.sportradar_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "games": [
            {
                "id": "game1",
                "league": "NBA",
                "home": {"id": "h1", "name": "Home"},
                "away": {"id": "a1", "name": "Away"},
                "scheduled": "2025-07-14T12:00:00",
                "status": "scheduled",
            }
        ]
    }
    mock_get.return_value = mock_response
    response = client.get("/api/v1/sr/games?sport=basketball_nba")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["id"] == "game1"


def test_sr_games_missing_api_key():
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.sportradar_api_key = None
    app.dependency_overrides[get_config] = lambda: mock_config
    """
    Test /api/v1/sr/games with missing API key (should return 503).
    """
    mock_config.sportradar_api_key = None
    response = client.get("/api/v1/sr/games?sport=basketball_nba")
    assert response.status_code == 503
    assert "SportRadar API key not configured" in response.text


@patch("httpx.AsyncClient.get")
def test_sr_games_malformed_response(mock_get: MagicMock):
    """
    Test /api/v1/sr/games with malformed API response (missing 'games' key).
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.sportradar_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"unexpected": []}
    mock_get.return_value = mock_response
    response = client.get("/api/v1/sr/games?sport=basketball_nba")
    assert response.status_code == 200
    data = response.json()
    assert data == []  # Defensive: returns empty list


@patch("httpx.AsyncClient.get")
def test_sr_games_api_error(mock_get: MagicMock):
    """
    Test /api/v1/sr/games with API error (non-200 status).
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.sportradar_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.text = "Forbidden"
    mock_get.return_value = mock_response
    response = client.get("/api/v1/sr/games?sport=basketball_nba")
    assert response.status_code == 502
    assert "SportRadar API error" in response.text


# --- Additional edge case tests for /api/v1/sr/games ---


@patch("httpx.AsyncClient.get")
def test_sr_games_timeout_error(mock_get: MagicMock):
    """
    Test /api/v1/sr/games with httpx timeout/network error.
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.sportradar_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_get.side_effect = httpx.TimeoutException("Timeout occurred")
    response = client.get("/api/v1/sr/games?sport=basketball_nba")
    assert response.status_code == 500
    assert "Failed to fetch games" in response.text


@patch("httpx.AsyncClient.get")
def test_sr_games_unexpected_nested_keys(mock_get: MagicMock):
    """
    Test /api/v1/sr/games with unexpected/missing nested keys in API response.
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.sportradar_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 200
    # Missing 'home', 'away', and 'scheduled' keys
    mock_response.json.return_value = {
        "games": [{"id": "game2", "league": "NBA", "status": "scheduled"}]
    }
    mock_get.return_value = mock_response
    response = client.get("/api/v1/sr/games?sport=basketball_nba")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == "game2"
    assert data[0]["homeTeam"]["id"] == "home"
    assert data[0]["awayTeam"]["id"] == "away"
    assert data[0]["status"] == "scheduled"


# --- Tests for /api/v1/odds/{event_id} endpoint ---


@patch("httpx.AsyncClient.get")
def test_odds_success(mock_get: MagicMock):
    """
    Test /api/v1/odds/{event_id} with valid API key and well-formed response.
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.odds_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {
            "id": "event1",
            "bookmakers": [
                {
                    "title": "Bookie",
                    "markets": [
                        {"outcomes": [{"name": "TeamA", "price": 1.5, "point": 10}]}
                    ],
                }
            ],
        }
    ]
    mock_get.return_value = mock_response
    response = client.get("/api/v1/odds/event1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["eventId"] == "event1"


def test_odds_missing_api_key():
    """
    Test /api/v1/odds/{event_id} with missing API key (should return 503).
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.odds_api_key = None
    app.dependency_overrides[get_config] = lambda: mock_config
    response = client.get("/api/v1/odds/event1")
    assert response.status_code == 503
    assert "Odds API key not configured" in response.text


@patch("httpx.AsyncClient.get")
def test_odds_malformed_response(mock_get: MagicMock):
    """
    Test /api/v1/odds/{event_id} with malformed API response (missing bookmakers).
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.odds_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"id": "event1"}]
    mock_get.return_value = mock_response
    response = client.get("/api/v1/odds/event1")
    assert response.status_code == 200
    data = response.json()
    assert data == []  # Defensive: returns empty list


@patch("httpx.AsyncClient.get")
def test_odds_api_error(mock_get: MagicMock):
    """
    Test /api/v1/odds/{event_id} with API error (non-200 status).
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.odds_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.text = "Forbidden"
    mock_get.return_value = mock_response
    response = client.get("/api/v1/odds/event1")
    assert response.status_code == 502
    assert "Odds API error" in response.text


# --- Additional edge case tests for /api/v1/odds/{event_id} ---


@patch("httpx.AsyncClient.get")
def test_odds_timeout_error(mock_get: MagicMock):
    """
    Test /api/v1/odds/{event_id} with httpx timeout/network error.
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.odds_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_get.side_effect = httpx.TimeoutException("Timeout occurred")
    response = client.get("/api/v1/odds/event1")
    assert response.status_code == 500
    assert "Failed to fetch odds" in response.text


@patch("httpx.AsyncClient.get")
def test_odds_unexpected_nested_keys(mock_get: MagicMock):
    """
    Test /api/v1/odds/{event_id} with unexpected/missing nested keys in API response.
    """
    from unittest.mock import MagicMock

    mock_config = MagicMock()
    mock_config.odds_api_key = "test_key"
    app.dependency_overrides[get_config] = lambda: mock_config
    mock_response = MagicMock()
    mock_response.status_code = 200
    # Missing 'bookmakers' key
    mock_response.json.return_value = [{"id": "event2"}]
    mock_get.return_value = mock_response
    response = client.get("/api/v1/odds/event2")
    assert response.status_code == 200
    data = response.json()
    assert data == []  # Defensive: returns empty list
