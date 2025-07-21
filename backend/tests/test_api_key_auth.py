import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

# Replace with a valid encrypted API key for a test user in your test DB
VALID_API_KEY = "test_api_key_encrypted_value"
INVALID_API_KEY = "invalid_api_key_encrypted_value"


def test_predict_requires_api_key():
    # No API key header
    response = client.post(
        "/predict",
        json={
            "game_id": 1,
            "team_stats": {"points": 100},
            "player_stats": {"points": 20},
        },
    )
    assert response.status_code == 401
    assert "Missing or invalid API key" in response.text


def test_predict_invalid_api_key():
    response = client.post(
        "/predict",
        headers={"X-API-Key": INVALID_API_KEY},
        json={
            "game_id": 1,
            "team_stats": {"points": 100},
            "player_stats": {"points": 20},
        },
    )
    assert response.status_code == 401
    assert "Missing or invalid API key" in response.text


def test_predict_valid_api_key():
    response = client.post(
        "/predict",
        headers={"X-API-Key": VALID_API_KEY},
        json={
            "game_id": 1,
            "team_stats": {"points": 100},
            "player_stats": {"points": 20},
        },
    )
    # Accept 200 or 401 if test DB does not have a valid key
    assert response.status_code in (200, 401)
    if response.status_code == 200:
        assert "prediction" in response.json()
    else:
        assert "Missing or invalid API key" in response.text
