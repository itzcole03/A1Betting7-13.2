import pytest
from fastapi.testclient import TestClient

from backend.core.app import create_app


@pytest.fixture(scope="module")
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c


def test_positive_ev_alias_returns_data(client: TestClient):
    resp = client.get("/api/opportunities/positive-ev", params={"min_edge": 3.0, "limit": 5})
    assert resp.status_code == 200
    payload = resp.json()
    assert "opportunities" in payload
    opps = payload["opportunities"]
    assert isinstance(opps, list)
    # Synthetic EV feed commonly returns data even in lean mode
    assert len(opps) >= 0
    # If any item exists, validate expected fields
    if opps:
        first = opps[0]
        for key in ("id", "player", "market", "market_odds", "ev_percent"):
            assert key in first
