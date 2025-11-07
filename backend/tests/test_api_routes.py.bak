import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_api_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["status"] == "healthy"


def test_api_props():
    resp = client.get("/api/props")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert any("player" in p for p in data["data"])


def test_api_activate():
    resp = client.post("/api/v2/sports/activate", json={"sport": "MLB"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["sport"] == "MLB"
    assert data["data"]["activated"] is True


def test_api_predictions():
    resp = client.get("/api/predictions")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert any("player" in p for p in data["data"])


def test_api_analytics():
    resp = client.get("/api/analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "summary" in data["data"]
