import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_invalid_route_returns_404():
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_error_response_helper():
    # Simulate error response helper usage
    from backend.main import error_response

    resp = error_response("Test error", status_code=400, details="Bad request")
    assert resp.status_code == 400
    assert resp.body
