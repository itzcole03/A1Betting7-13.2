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
