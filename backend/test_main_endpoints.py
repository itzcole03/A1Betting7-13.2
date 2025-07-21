import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


# --- /features endpoint tests ---
def test_features_valid():
    payload = {
        "game_id": 1,
        "team_stats": {"points": 100, "rebounds": 50},
        "player_stats": {"player1_points": 30, "player1_fgm": 10},
    }
    response = client.post("/features", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert data["features"]["points_per_game"] == 100
    assert data["features"]["rebounds_per_game"] == 50


def test_features_empty_stats():
    payload = {"game_id": 1, "team_stats": {}, "player_stats": {}}
    response = client.post("/features", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert data["features"] == {}


def test_features_invalid_payload():
    payload = {"game_id": 1, "team_stats": "not_a_dict", "player_stats": {}}
    response = client.post("/features", json=payload)
    assert response.status_code == 422  # Unprocessable Entity


# --- /predict endpoint tests ---
def test_predict_valid():
    payload = {
        "game_id": 1,
        "team_stats": {"points": 120, "rebounds": 40},
        "player_stats": {"player1_points": 25, "player1_fgm": 8},
    }
    response = client.post(
        "/predict", json=payload, headers={"x-api-key": "test_api_key"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert isinstance(data["prediction"], float)


def test_predict_empty_stats():
    payload = {"game_id": 1, "team_stats": {}, "player_stats": {}}
    response = client.post(
        "/predict", json=payload, headers={"x-api-key": "test_api_key"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert isinstance(data["prediction"], float)


def test_predict_invalid_payload():
    payload = {"game_id": 1, "team_stats": {}, "player_stats": "not_a_dict"}
    response = client.post(
        "/predict", json=payload, headers={"x-api-key": "test_api_key"}
    )
    assert response.status_code == 422


# --- Error handling edge case ---
def test_features_large_numbers():
    payload = {
        "game_id": 1,
        "team_stats": {"points": 1e9, "rebounds": -1e9},
        "player_stats": {"player1_points": 1e6, "player1_fgm": -1e6},
    }
    response = client.post("/features", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "features" in data


def test_predict_large_numbers():
    payload = {
        "game_id": 1,
        "team_stats": {"points": 1e9, "rebounds": -1e9},
        "player_stats": {"player1_points": 1e6, "player1_fgm": -1e6},
    }
    response = client.post(
        "/predict", json=payload, headers={"x-api-key": "test_api_key"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data


# --- Fallback logic test (mocked) ---
def test_fallback_services_flag():
    from backend.main import FALLBACK_SERVICES

    assert isinstance(FALLBACK_SERVICES, dict)
    # Simulate fallback
    FALLBACK_SERVICES["database"] = True
    assert any(FALLBACK_SERVICES.values())
    FALLBACK_SERVICES["database"] = False


# --- Health endpoint tests ---
def test_health_status():
    response = client.get("/api/health/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "performance" in data
    assert "models" in data
    assert "api_metrics" in data


def test_health_comprehensive():
    response = client.get("/api/health/comprehensive")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "performance" in data
    assert "models" in data
    assert "api_metrics" in data
    assert "autonomous" in data


def test_health_database():
    response = client.get("/api/health/database")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "fallback_services" in data


# --- Autonomous endpoints ---
def test_autonomous_status():
    response = client.get("/api/autonomous/status")
    assert response.status_code == 200
    data = response.json()
    assert "autonomous_mode" in data
    assert "system_status" in data


def test_autonomous_health():
    response = client.get("/api/autonomous/health")
    assert response.status_code == 200
    data = response.json()
    assert "health_status" in data


def test_autonomous_metrics():
    response = client.get("/api/autonomous/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data


def test_autonomous_heal():
    response = client.post("/api/autonomous/heal")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


def test_autonomous_capabilities():
    response = client.get("/api/autonomous/capabilities")
    assert response.status_code == 200
    data = response.json()
    assert "capabilities" in data
    assert "autonomous_mode" in data
    assert "autonomous_interval" in data


# --- Middleware header test ---
def test_process_time_header():
    response = client.get("/")
    assert response.status_code == 200
    assert "X-Process-Time" in response.headers
