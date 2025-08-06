from fastapi.testclient import TestClient

from backend.test_app import app


def test_test_endpoint():
    client = TestClient(app)
    response = client.get("/test")
    assert response.status_code == 200
    assert response.json()["message"] == "Test endpoint is working"
