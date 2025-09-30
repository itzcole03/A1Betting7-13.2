from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_filters_and_with_clv_only():
    # Place multiple bets
    for i in range(2):
        payload = {
            "sport": "MLB",
            "player": f"P{i}",
            "market": "HR",
            "line": 0.5,
            "side": "over",
            "stake": 25,
            "placed_odds": -120,
        }
        r = client.post("/api/bets", json=payload)
        assert r.status_code == 200

    # Update closing lines (may yield 0 CLV if odds unchanged)
    client.post("/api/bets/closing-update", json={"sport": "MLB"})

    all_bets = client.get("/api/bets?sport=MLB").json()
    assert len(all_bets) >= 2

    clv_only = client.get("/api/bets?sport=MLB&with_clv_only=true").json()
    assert isinstance(clv_only, list)
    # All returned must have clv_pct not None
    for b in clv_only:
        assert b["clv_pct"] is not None
