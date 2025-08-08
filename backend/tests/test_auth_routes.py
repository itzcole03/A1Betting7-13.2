"""
Unit and integration tests for /api/v1/auth endpoints
"""

from fastapi.testclient import TestClient

from backend.core.app import core_app

client = TestClient(core_app)


def test_login_placeholder():
    response = client.post("/api/v1/auth/login")
    assert response.status_code == 200
    assert response.json()["message"].startswith("Login endpoint")
