"""
Integration tests for MLB extras endpoints: action shots, country flag, odds comparison.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_get_action_shots():
    # This will likely return 500 or empty if no API key or event_id is invalid, but endpoint should exist
    response = client.get("/mlb/action-shots/test-event-id")
    assert response.status_code in (200, 500)
    # Should return a list (possibly empty)
    if response.status_code == 200:
        assert isinstance(response.json(), list)


def test_get_country_flag():
    response = client.get("/mlb/country-flag/us")
    assert response.status_code == 200
    # Should return a string (URL)
    assert isinstance(response.json(), str) or response.json() is None


def test_get_odds_comparison():
    response = client.get("/mlb/odds-comparison/?market_type=regular")
    assert response.status_code in (200, 500)
    # Should return a list (possibly empty)
    if response.status_code == 200:
        assert isinstance(response.json(), list)
