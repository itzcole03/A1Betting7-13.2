import os
import pytest
import httpx
from backend.core.app import create_app
from backend.services.ev_feed_service import ev_feed_service
from backend.models.ev_models import EVOpportunity, SportType, MarketType

@pytest.fixture
async def test_client():
    app = create_app()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

async def _seed_entries(count: int = 3):
    for i in range(count):
        opp = EVOpportunity(
            id=f"test-{i}",
            player=f"Player {i}",
            market="Points Over 10.5",
            sport=SportType.MLB,
            market_type=MarketType.MONEYLINE,
            our_fair_odds=+105.0,
            market_odds=+110,
            ev_percent=3.5 + i * 0.2,
            source_book="TestBook",
            game_info="A @ B"
        )
        await ev_feed_service.add_feed_entry(opp)  # async method

@pytest.mark.asyncio
async def test_debug_route_404_when_flag_off(test_client, monkeypatch):
    monkeypatch.delenv("EV_FEED_DEBUG", raising=False)
    resp = await test_client.get("/api/ev/feed/debug/latest")
    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_debug_route_returns_entries_when_flag_on(test_client, monkeypatch):
    monkeypatch.setenv("EV_FEED_DEBUG", "1")
    await _seed_entries(4)
    resp = await test_client.get("/api/ev/feed/debug/latest")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    entries = data.get("data", {}).get("entries", [])
    assert 1 <= len(entries) <= 5
    for e in entries:
        assert "edge_tier" in e

@pytest.mark.asyncio
async def test_debug_route_limit_capped(test_client, monkeypatch):
    monkeypatch.setenv("EV_FEED_DEBUG", "1")
    await _seed_entries(25)
    resp = await test_client.get("/api/ev/feed/debug/latest?limit=25")
    assert resp.status_code == 200
    payload = resp.json()
    entries = payload.get("data", {}).get("entries", [])
    # Provided >20, expect effective limit cap to 20
    assert payload.get("data", {}).get("effective_limit") == 20
    assert len(entries) <= 20
