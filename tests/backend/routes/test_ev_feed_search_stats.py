import os
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_ev_feed_stats_and_search(monkeypatch):
    monkeypatch.delenv("POSITIVE_EV_FEED_DISABLED", raising=False)
    # Seed minimal opportunities by invoking generation helper directly
    from backend.services.ev_feed_service import ev_feed_service
    if not ev_feed_service.last_generation_time:
        opps = await ev_feed_service._generate_ev_opportunities()
        await ev_feed_service._store_opportunities(opps)
        await ev_feed_service._update_stats(opps, 50)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        stats_resp = await ac.get("/api/ev/feed/stats")
        assert stats_resp.status_code in (200, 404)  # allow empty
        if stats_resp.status_code == 200:
            data = stats_resp.json()
            assert "total_opportunities" in data
            if data.get("total_opportunities"):
                assert "max_edge" in data

        # Use a player substring likely in mock data
        search_resp = await ac.get("/api/ev/feed/search", params={"player": "a", "min_edge": 0})
        assert search_resp.status_code == 200
    payload = search_resp.json()
    assert payload.get("success") is True
    data = payload.get("data", {})
    assert "opportunities" in data

@pytest.mark.asyncio
async def test_ev_feed_disabled(monkeypatch):
    monkeypatch.setenv("POSITIVE_EV_FEED_DISABLED", "1")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/api/ev/feed/search", params={"player": "test"})
        assert r.status_code == 503
