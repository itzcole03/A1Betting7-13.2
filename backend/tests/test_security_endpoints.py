import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_security_headers():
    response = client.get("/healthz")
    headers = response.headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert "Content-Security-Policy" in headers


# JWT authentication and API key tests would require test setup with valid tokens and keys
# Add those as soon as the backend supports test tokens/keys in a test environment
