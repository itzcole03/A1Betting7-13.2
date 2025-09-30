import importlib
import pytest

@pytest.mark.asyncio
async def test_arbitrage_summary_env_flag(monkeypatch):
    monkeypatch.setenv("ENABLE_LEGACY_ARBITRAGE_SUMMARY", "true")
    from backend.routes import odds_routes
    importlib.reload(odds_routes)
    assert odds_routes.ENABLE_LEGACY_ARBITRAGE_SUMMARY is True
    # Generate data via existing POST refresh endpoint using TestClient
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)
    r = client.post("/api/odds/refresh?sport=MLB&market=player_props")
    assert r.status_code == 200
    resp = client.get("/api/odds/arbitrage/summary?sport=MLB&market=player_props")
    assert resp.status_code == 200
    js = resp.json()
    assert "status" in js
    assert js["status"].lower() == "ok"
    # cleanup
    monkeypatch.delenv("ENABLE_LEGACY_ARBITRAGE_SUMMARY", raising=False)
    importlib.reload(odds_routes)
