import pytest
from fastapi.testclient import TestClient

from backend.test_app import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "A1Betting Ultra-Enhanced Backend"


def test_api_version():
    response = client.get("/api/version")
    assert response.status_code == 200
    assert response.json()["version"] == "1.0.0"
    assert response.json()["status"] == "ok"


def test_legacy_health():
    response = client.get("/api/health/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "uptime" in data
    assert "services" in data


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "uptime" in data
    assert "services" in data


def test_version():
    response = client.get("/version")
    assert response.status_code == 200
    assert response.json()["version"] == "1.0.0"
    assert response.json()["status"] == "ok"


def test_test_endpoint():
    response = client.get("/test")
    assert response.status_code == 200
    assert response.json()["message"] == "Test endpoint is working"


def test_unified_analysis_post():
    response = client.post("/api/v1/unified/analysis", json={})
    assert response.status_code == 200
    data = response.json()
    print("/api/v1/unified/analysis response:", data)
    assert "enriched_props" in data
    assert isinstance(data["enriched_props"], list)
    assert len(data["enriched_props"]) > 0
    assert "confidence" in data
    assert "analysis" in data
    assert "status" in data


def test_unified_analysis_get():
    response = client.get("/api/v1/unified/analysis")
    assert response.status_code == 200
    assert response.json()["message"] == "GET endpoint for unified analysis is working"
