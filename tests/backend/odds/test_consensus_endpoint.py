import pytest
from fastapi.testclient import TestClient
from backend.core.app import create_app

@pytest.fixture(scope="module")
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c


def test_consensus_flow(client):
    r = client.post("/v1/odds/api/odds-mvp/refresh", params={"sport": "MLB", "market": "player_props"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("refreshed", 0) > 0

    snaps = client.get("/v1/odds/api/odds-mvp/snapshots", params={"sport": "MLB", "market": "player_props"})
    assert snaps.status_code == 200
    snaps_data = snaps.json()
    assert snaps_data["count"] > 0

    cons = client.get("/v1/odds/api/odds-mvp/consensus", params={"sport": "MLB", "market": "player_props"})
    assert cons.status_code == 200
    payload = cons.json()
    assert payload["count"] >= 1
    first = payload["data"][0]
    assert "consensus_implied_prob" in first
    assert "consensus_american" in first
    assert first["books"] >= 1
