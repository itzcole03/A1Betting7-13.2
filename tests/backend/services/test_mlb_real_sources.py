import math
from datetime import datetime, timezone

import pytest

from backend.services.mlb_stats_api_client import MLBStatsAPIClient
from backend.services.propfinder_data_service import (
    PropFinderDataService,
)


def _build_sample_prop_payload():
    return {
        "player_name": "Test Player",
        "stat_type": "hits",
        "line": 1.5,
        "odds": -112,
        "confidence": 64.0,
        "team_name": "BOS",
        "opponent": "NYY",
        "matchup": "BOS @ NYY",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "implied_probability": 52.0,
        "ai_probability": 60.0,
        "edge": 8.0,
        "bookmakers": [
            {"name": "Season Benchmark", "odds": -112, "line": 1.5},
            {"name": "Recent Form Model", "odds": -105, "line": 1.5},
        ],
        "line_movement": {"open": 1.2, "current": 1.5, "direction": "up"},
        "recent_form_values": [1.0, 1.2, 1.4, 1.5, 1.7],
        "matchup_history": {"games": 12, "average": 1.3, "hitRate": 68},
        "sharp_money": "heavy",
        "tags": ["Hits", "Real MLB Data"],
        "volume": 420,
        "expected_value_per_100": 8.0,
        "vig_percent": 1.6,
        "arbitrage_profit_pct": 0.0,
        "opening_odds": -118,
        "latest_odds": -110,
    }


def test_build_mlb_opportunity_uses_enriched_payload():
    service = PropFinderDataService()
    prop_payload = _build_sample_prop_payload()

    opportunity = service._build_mlb_opportunity_from_stats(prop_payload)

    assert math.isclose(opportunity.impliedProbability, 52.0, rel_tol=1e-6)
    assert math.isclose(opportunity.aiProbability, 60.0, rel_tol=1e-6)
    assert math.isclose(opportunity.edge, 8.0, rel_tol=1e-6)
    assert opportunity.bookmakers and opportunity.bookmakers[0].name == "Season Benchmark"
    assert opportunity.lineMovement.open == pytest.approx(1.2)
    assert opportunity.lineMovement.current == pytest.approx(1.5)
    assert opportunity.movementDirection == "up"
    assert opportunity.matchupHistory.games == 12
    assert opportunity.matchupHistory.hitRate == 68
    assert opportunity.sharpMoney.value == "heavy"
    assert opportunity.recentForm[:3] == [1.0, 1.2, 1.4]
    assert opportunity.evTier == "Tier 1"
    assert opportunity.latestOdds == -110
    assert opportunity.oddsChange == 8


def test_build_prop_payload_derives_probabilities():
    client = MLBStatsAPIClient()

    player = {"fullName": "Sample Hitter", "id": 999, "positionCode": "C"}
    season_stats = {
        "games_played": 120,
        "hits": 150,
        "rbis": 85,
        "runs": 88,
        "home_runs": 28,
        "stolen_bases": 12,
        "avg": 0.285,
    }
    recent_samples = [1.6, 1.4, 1.7, 1.5, 1.8]
    event_meta = {
        "game_id": "game_1",
        "event_name": "Sample @ Example",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "status": "Scheduled",
        "venue": "Sample Park",
    }

    prop = client._build_prop_payload(
        player=player,
        stat_type="hits",
        season_stats=season_stats,
        recent_samples=recent_samples,
        matchup="Sample @ Example",
        event=event_meta,
        team_name="SMP",
        opponent_name="EXM",
        position="C",
    )

    assert prop is not None
    assert prop["line"] in {1.0, 1.5}
    assert len(prop["bookmakers"]) == 2
    assert prop["bookmakers"][0]["name"] == "Season Benchmark"
    assert prop["ai_probability"] + 1e-6 >= prop["implied_probability"]
    assert abs(prop["edge"] - (prop["ai_probability"] - prop["implied_probability"])) < 1e-6
    assert prop["line_movement"]["direction"] in {"up", "down", "stable"}
