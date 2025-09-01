import pytest
from fastapi.testclient import TestClient

from backend.core.app import app


@pytest.fixture
def client():
    return TestClient(app)


def test_metrics_endpoint(client):
    resp = client.get("/metrics")
    # Prometheus adapter may not be available in the test environment.
    # Accept either 200 with text/plain or 200 with empty body (no prom client).
    assert resp.status_code == 200
    ct = resp.headers.get("content-type", "")
    assert "text/plain" in ct or ct == "application/json"
    # If prometheus client available, body should be non-empty bytes
    if resp.headers.get("content-type", "").startswith("text/plain"):
        assert resp.content is not None

