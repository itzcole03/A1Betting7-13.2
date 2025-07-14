import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_get_prizepicks_props():
    response = client.get("/api/prizepicks/props")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_prizepicks_recommendations():
    response = client.get("/api/prizepicks/recommendations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_comprehensive_projections():
    response = client.get("/api/prizepicks/comprehensive-projections")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_optimize_lineup_error():
    response = client.post("/api/prizepicks/lineup/optimize", json={"entries": []})
    assert response.status_code == 400
    assert "At least 2 entries required" in response.text


def test_get_prizepicks_health():
    response = client.get("/api/prizepicks/health")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)
