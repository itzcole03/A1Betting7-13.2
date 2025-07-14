"""Test suite for backend API endpoints.

This module tests the FastAPI endpoints for feature extraction and prediction.
"""

from fastapi.testclient import TestClient

from backend.main import app

# Create test client with proper configuration
try:
    client = TestClient(app)
except TypeError:
    # Handle newer TestClient versions
    pass

    client = TestClient(app=app)

# Sample test data
SAMPLE_PAYLOAD = {
    "game_id": 12345,
    "team_stats": {"points": 102.0, "rebounds": 45.0},
    "player_stats": {"player1_points": 30.0, "player2_fgm": 12.0},
}


def test_features_endpoint():
    """Test the /features endpoint."""
    response = client.post("/features", json=SAMPLE_PAYLOAD)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    json_data = response.json()
    assert "features" in json_data, "'features' key missing in response JSON"
    assert isinstance(json_data["features"], dict), "'features' is not a dict"

    # Verify features contain expected keys
    features = json_data["features"]
    assert "points" in features, "'points' key missing in features"
    assert "rebounds" in features, "'rebounds' key missing in features"
    assert "player1_points" in features, "'player1_points' key missing in features"
    assert "player2_fgm" in features, "'player2_fgm' key missing in features"


def test_predict_endpoint():
    """Test the /predict endpoint."""
    response = client.post("/predict", json=SAMPLE_PAYLOAD)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    json_data = response.json()
    assert "prediction" in json_data, "'prediction' key missing in response JSON"
    assert isinstance(
        json_data["prediction"], (int, float)
    ), "'prediction' is not int or float"


def test_docs_endpoint():
    """Test that API documentation is accessible."""
    response = client.get("/docs")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"


def test_invalid_input():
    """Test API behavior with invalid input."""
    invalid_payload = {"invalid": "data"}
    response = client.post("/features", json=invalid_payload)
    assert (
        response.status_code == 422
    ), f"Expected 422 for invalid input, got {response.status_code}"


def test_empty_stats():
    """Test API behavior with empty stats."""
    empty_payload = {"game_id": 123, "team_stats": {}, "player_stats": {}}
    response = client.post("/features", json=empty_payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    json_data = response.json()
    assert "features" in json_data, "'features' key missing in response JSON"
    assert isinstance(json_data["features"], dict), "'features' is not a dict"
