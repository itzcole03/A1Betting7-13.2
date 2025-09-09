import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

class DummyArb:
    player_name = "Test Player"
    bet_type = "Points"
    line = 25.5
    over_odds = -110
    over_provider = "BookA"
    under_odds = 105
    under_provider = "BookB"
    guaranteed_profit_percentage = 2.5

@pytest.mark.asyncio
async def test_arbitrage_leg_ev_details(monkeypatch):
    # Patch sportsbook service getter to return object with get_arbitrage_opportunities
    from backend.routes import multiple_sportsbook_routes as msr

    class MockService:
        async def get_arbitrage_opportunities(self, sport: str, min_profit: float = 2.0):
            return [DummyArb()]

    async def _mock_get_service():
        return MockService()

    monkeypatch.setattr(msr, 'get_sportsbook_service', _mock_get_service)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/sportsbook/arbitrage", params={"sport": "mlb", "min_profit": 2.0})
        assert resp.status_code == 200
        body = resp.json()
        # ResponseBuilder provides 'success' boolean
        assert body.get("success") is True
        items = body.get("data") or []
        assert items, "Expected at least one arbitrage item"
        first = items[0]
        # Optional enrichment field should be present with both legs
        assert 'leg_ev_details' in first
        assert 'over' in first['leg_ev_details']
        assert 'under' in first['leg_ev_details']
        assert first['leg_ev_details']['over']['edgePct'] is not None
        assert first['leg_ev_details']['under']['edgePct'] is not None
