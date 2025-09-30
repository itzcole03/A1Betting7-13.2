import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_ev_with_kelly_fields():
    r = client.get("/api/ev/opportunities?include_kelly=true&bankroll=5000")
    assert r.status_code == 200
    data = r.json()["data"]
    assert isinstance(data, list)
    # At least one enriched opportunity should have kelly fields (positive edge & bankroll)
    assert any("kelly_fraction" in o for o in data)


def test_ev_without_kelly_when_bankroll_zero():
    r = client.get("/api/ev/opportunities?include_kelly=true&bankroll=0")
    assert r.status_code == 200
    data = r.json()["data"]
    assert all("kelly_fraction" not in o for o in data)


def test_ev_invalid_bankroll():
    r = client.get("/api/ev/opportunities?include_kelly=true&bankroll=-10")
    # FastAPI validation likely 422; accept 400 fallback if future custom validation added
    assert r.status_code in (400, 422)
