"""
Unit and integration tests for /api/v1/users endpoints
"""

from fastapi.testclient import TestClient

from backend.core.app import core_app

client = TestClient(core_app)


def test_get_user_placeholder():
    response = client.get("/api/v1/users/123")
    assert response.status_code == 200
    assert response.json()["user_id"] == 123
    assert response.json()["message"].startswith("User endpoint")
