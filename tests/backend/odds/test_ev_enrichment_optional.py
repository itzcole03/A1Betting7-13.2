import pytest
from fastapi.testclient import TestClient
from backend.core.app import create_app

@pytest.fixture(scope="module")
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c


def ensure_refresh(client):
    r = client.post("/v1/odds/api/odds-mvp/refresh", params={"sport": "MLB", "market": "player_props"})
    assert r.status_code == 200


def test_consensus_without_ev(client):
    ensure_refresh(client)
    r = client.get("/v1/odds/api/odds-mvp/consensus", params={"sport": "MLB", "market": "player_props", "include_ev": False})
    assert r.status_code == 200
    data = r.json()
    assert data["count"] >= 1
    first = data["data"][0]
    # When include_ev is false the field should be None (model includes key)
    assert first.get("ev_edge_pct") in (None, 0)


def test_consensus_with_ev(client):
    ensure_refresh(client)
    r = client.get("/v1/odds/api/odds-mvp/consensus", params={"sport": "MLB", "market": "player_props", "include_ev": True})
    assert r.status_code == 200
    data = r.json()
    assert data["count"] >= 1
    first = data["data"][0]
    # Edge fields may be present or omitted if projection service missing; if present ensure numeric
    if "ev_edge_pct" in first and first["ev_edge_pct"] is not None:
        assert isinstance(first["ev_edge_pct"], (int, float))
        assert "projection_prob" in first and first["projection_prob"] is not None
