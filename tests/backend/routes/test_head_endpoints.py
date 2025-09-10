import pytest
from fastapi.testclient import TestClient

# Import the canonical app factory and build a fresh app for tests
try:
    from backend.core.app import create_app
    app = create_app()
except Exception:
    # Fallback to legacy import if needed
    from backend.main import app  # type: ignore

client = TestClient(app)


@pytest.mark.parametrize("path", [
    "/api/health",
    "/api/propfinder/opportunities",
    "/api/props",
    "/api/predictions",
    "/api/analytics",
])
def test_head_endpoints_ok(path):
    r = client.head(path)
    assert r.status_code in (200, 204)
    # HEAD should have no unexpected body
    assert r.text in ("", "null", "{}",)
