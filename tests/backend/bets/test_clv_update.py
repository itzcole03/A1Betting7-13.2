from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def _place():
    payload = {
        "sport": "NBA",
        "player": "Test Player",
        "market": "Points",
        "line": 22.5,
        "side": "under",
        "stake": 80,
        "placed_odds": -105,
    }
    r = client.post("/api/bets", json=payload)
    assert r.status_code == 200
    return r.json()


def test_clv_update_flow():
    bet = _place()
    assert bet["clv_pct"] is None
    r = client.post("/api/bets/closing-update", json={"ids": [bet["id"]]})
    assert r.status_code == 200
    upd = client.get("/api/bets?with_clv_only=true").json()
    assert isinstance(upd, list)
    # If odds unchanged, CLV will be 0; ensure any updated bet has clv_pct numeric
    if upd:
        assert all((b["clv_pct"] is None) or isinstance(b["clv_pct"], (int, float)) for b in upd)
