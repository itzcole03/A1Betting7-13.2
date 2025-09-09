import os
import pytest

pytestmark = pytest.mark.filterwarnings(
    "ignore::DeprecationWarning:pydantic.*",
)
from fastapi.testclient import TestClient

# Set testing env before importing app
os.environ["TESTING"] = "1"
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from backend.main import app  # noqa: E402

client = TestClient(app)


def test_ev_feed_disabled_flag_returns_503(monkeypatch):
    monkeypatch.setenv("POSITIVE_EV_FEED_DISABLED", "1")

    r1 = client.get("/api/ev/feed")
    assert r1.status_code == 503
    data = r1.json()
    # API errors are standardized; prefer error.message, fallback to detail
    detail_msg = (
        data.get("error", {}).get("message")
        or data.get("detail", "")
        or ""
    ).lower()
    assert "disabled" in detail_msg

    r2 = client.get("/api/ev/forecast")
    assert r2.status_code == 503

    r3 = client.get("/api/ev/feed/stats")
    assert r3.status_code == 503

    # Health endpoint should still be accessible
    r4 = client.get("/api/ev/health")
    assert r4.status_code == 200
    data = r4.json()
    assert data.get("service") == "ev_feed"


def test_ev_feed_enabled_by_default(monkeypatch):
    # Ensure flag not set
    monkeypatch.delenv("POSITIVE_EV_FEED_DISABLED", raising=False)

    r = client.get("/api/ev/feed?limit=1")
    # Service might have empty data but should not be 503
    assert r.status_code != 503, r.text
