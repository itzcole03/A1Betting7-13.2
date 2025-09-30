from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_clv_update_idempotent():
    # Place a bet
    payload = {
        "sport": "MLB",
        "player": "Sample Player",
        "market": "Hits",
        "line": 1.5,
        "side": "over",
        "stake": 25,
        "placed_odds": -105,
    }
    r = client.post("/api/bets", json=payload)
    assert r.status_code == 200
    bet_id = r.json()["id"]

    # First closing update should compute CLV (may be 0 if using placed odds fallback)
    r1 = client.post("/api/bets/closing-update", json={"ids": [bet_id]})
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["updated"] == 1

    # Second closing update should not recompute (updated=0)
    r2 = client.post("/api/bets/closing-update", json={"ids": [bet_id]})
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["updated"] == 0
