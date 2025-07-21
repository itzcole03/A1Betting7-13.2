import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_api_health_status():
    response = client.get("/api/health/status")
    assert response.status_code == 200
    assert "status" in response.json()
    assert "timestamp" in response.json()


def test_api_health_comprehensive():
    response = client.get("/api/health/comprehensive")
    assert response.status_code == 200
    assert "performance" in response.json()
    assert "models" in response.json()
    assert "api_metrics" in response.json()


def test_api_health_database():
    response = client.get("/api/health/database")
    assert response.status_code == 200
    assert "status" in response.json()
    assert "timestamp" in response.json()


def test_api_health_data_sources():
    response = client.get("/api/health/data-sources")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert "prizepicks" in response.json() or "data_sources" in response.json()
