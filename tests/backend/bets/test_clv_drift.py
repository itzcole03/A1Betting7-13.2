from fastapi.testclient import TestClient
from backend.main import app
from backend.betting.odds_drift_sim import simulate_current_american, DRIFT_MAX

client = TestClient(app)


def _place():
    r = client.post(
        "/api/bets",
        json={
            "sport": "MLB",
            "player": "Drift Test",
            "market": "Hits",
            "line": 1.5,
            "side": "over",
            "stake": 50,
            "placed_odds": -110,
        },
    )
    assert r.status_code == 200
    return r.json()


def test_clv_non_zero_with_drift():
    bet = _place()
    r = client.post("/api/bets/closing-update", json={"ids": [bet["id"]]})
    assert r.status_code == 200
    listing = client.get("/api/bets?with_clv_only=true").json()
    target = next(x for x in listing if x["id"] == bet["id"])
    assert target["clv_pct"] is not None


def test_clv_idempotent_with_drift():
    bet = _place()
    client.post("/api/bets/closing-update", json={"ids": [bet["id"]]})
    first = client.get("/api/bets").json()
    c1 = next(x for x in first if x["id"] == bet["id"])["clv_pct"]
    client.post("/api/bets/closing-update", json={"ids": [bet["id"]]})
    second = client.get("/api/bets").json()
    c2 = next(x for x in second if x["id"] == bet["id"])["clv_pct"]
    assert c1 == c2


def test_drift_bounds():
    placed = -110
    bet_id = "BOUNDTEST"
    current = simulate_current_american(placed, bet_id)
    # Drift must be within +/- DRIFT_MAX of placed odds, respecting bounds
    diff = abs(current - placed)
    assert diff <= DRIFT_MAX
    assert current != 0
    assert -400 <= current <= 400
