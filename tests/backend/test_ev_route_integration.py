import pytest
from fastapi.testclient import TestClient

from backend.core.app import app


def test_ev_calc_route_decimal():
    client = TestClient(app)
    payload = {"probability": 0.6, "odds": 2.0, "stake": 1.0}
    resp = client.post("/api/ev/calc", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["ev"] == pytest.approx(0.2)


def test_ev_calc_route_american():
    client = TestClient(app)
    payload = {"probability": 0.6, "odds": -150, "odds_format": "american", "stake": 1.0}
    resp = client.post("/api/ev/calc", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    # American -150 -> decimal ~1.666667, EV = 0.6*(0.666667) - 0.4 = 0.4 - 0.4 = 0.0
    assert abs(data["ev"]) < 1e-6
