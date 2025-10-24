import datetime

import pytest

from backend.services.propfinder_data_service import (
    MarketType,
    Pick,
    PropFinderDataService,
    Sport,
)


class _DummyMLBClient:
    async def generate_player_props_data(self):  # pragma: no cover - exercised via service call
        game_time = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=3)).isoformat()
        return [
            {
                "id": "mlb_test_player_hits",
                "player_name": "Test Player",
                "team_name": "NYY",
                "opponent": "BOS",
                "stat_type": "hits",
                "line": 1.5,
                "odds": -108,
                "confidence": 82.0,
                "provider_id": "mlb_stats_api",
                "matchup": "NYY @ BOS",
                "game_info": {"game_time": game_time},
                "recent_form": [1.0, 2.0, 1.5, 0.0, 3.0],
            }
        ]


class _DummySavantClient:
    async def get_all_active_players(self):  # pragma: no cover - exercised via service call
        return [
            {
                "id": 4242,
                "name": "Savant Slugger",
                "team": "LAD",
                "position_type": "batter",
                "active": True,
                "stats": {"AVG": 0.305, "PA": 260},
            },
            {
                "id": 4343,
                "name": "Statcast Ace",
                "team": "SEA",
                "position_type": "pitcher",
                "active": True,
                "stats": {"IP": 78.2, "K/9": 10.4},
            },
        ]


@pytest.mark.asyncio
async def test_fetch_mlb_stats_props_builds_real_mlb_opportunities(monkeypatch):
    service = PropFinderDataService()
    service.mlb_stats_client = _DummyMLBClient()  # type: ignore[assignment]

    opportunities = await service._fetch_mlb_stats_props()

    assert opportunities, "Expected MLB opportunities from stats client"
    opp = opportunities[0]

    assert opp.sport == Sport.MLB
    assert opp.market == MarketType.HITS
    assert opp.pick == Pick.OVER
    assert opp.team == "NYY"
    assert opp.opponent == "BOS"
    assert "MLB Stats API" in opp.tags
    # Confidence should be sourced from real prop payload
    assert opp.confidence == pytest.approx(82.0)
    # Derived implied probability uses odds conversion
    assert opp.impliedProbability > 0
    assert opp.edge == pytest.approx(opp.aiProbability - opp.impliedProbability)


@pytest.mark.asyncio
async def test_fetch_baseball_savant_props_generates_opportunities():
    service = PropFinderDataService()
    service.mlb_stats_client = None
    service.baseball_savant_client = _DummySavantClient()  # type: ignore[assignment]

    opportunities = await service._fetch_baseball_savant_props()

    assert opportunities, "Expected Baseball Savant derived opportunities"
    assert all(opp.sport == Sport.MLB for opp in opportunities)
    assert any("Baseball Savant" in opp.tags for opp in opportunities)
    assert all(opp.bookmakers for opp in opportunities)
