from fastapi.testclient import TestClient
from backend.main import app
from backend.routes import odds_routes

client = TestClient(app)

def test_arbitrage_summary_legacy_flag_includes_status():
    # Save original flag value
    original = odds_routes.ENABLE_LEGACY_ARBITRAGE_SUMMARY
    odds_routes.ENABLE_LEGACY_ARBITRAGE_SUMMARY = True
    try:
        r = client.post("/api/odds/refresh?sport=MLB&market=player_props")
        assert r.status_code == 200
        resp = client.get("/api/odds/arbitrage/summary?sport=MLB&market=player_props")
        assert resp.status_code == 200
        js = resp.json()
        assert "status" in js, js
        assert js["status"].lower() == "ok"
    finally:
        odds_routes.ENABLE_LEGACY_ARBITRAGE_SUMMARY = original
