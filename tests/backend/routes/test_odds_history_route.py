import pytest
from fastapi.testclient import TestClient

from backend.core.app import create_app


@pytest.fixture(scope="module")
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c


def test_odds_history_sorted_and_enveloped(client: TestClient):
    # Use a likely synthetic prop id and sportsbook
    resp = client.get(
        "/api/odds/history",
        params={"prop_id": "synthetic:mlb:hits:player123", "sportsbook": "DraftKings", "hours_back": 24, "limit": 50},
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert payload.get("success") is True
    data = payload.get("data") or {}
    assert "snapshots" in data
    snaps = data.get("snapshots") or []
    # Ensure ascending order if present
    def ts(x):
        raw = x.get("captured_at") or x.get("timestamp")
        if isinstance(raw, (int, float)):
            return float(raw)
        if isinstance(raw, str):
            from datetime import datetime
            return datetime.fromisoformat(raw.replace("Z", "+00:00")).timestamp()
        return 0.0

    assert snaps == sorted(snaps, key=ts)
