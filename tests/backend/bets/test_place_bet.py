from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_place_bet_success():
    payload = {
        "sport": "MLB",
        "player": "Sample Player",
        "market": "Hits",
        "line": 1.5,
        "side": "over",
        "stake": 100,
        "placed_odds": -110,
    }
    r = client.post("/api/bets", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["sport"] == "MLB"
    assert data["placed_implied_prob"] > 0
    assert data["clv_pct"] is None


def test_place_bet_validation():
    bad = {
        "sport": "",
        "market": "Hits",
        "line": 1.5,
        "side": "over",
        "stake": 50,
        "placed_odds": 0,
    }
    r = client.post("/api/bets", json=bad)
    assert r.status_code == 422
    detail = r.json().get("detail")
    # Handler may return list of validation error entries
    assert isinstance(detail, (list, dict))
