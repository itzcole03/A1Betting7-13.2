from datetime import datetime, timezone

import pytest

from backend.services.real_time_analysis_engine import (
    BetType,
    RealTimeAnalysisEngine,
    RealTimeBet,
    SportCategory,
)


@pytest.fixture
def engine():
    return RealTimeAnalysisEngine()


def test_business_rules_filtering(engine):
    # Simulate business rules
    engine.business_rules = {
        "forbidden_combos": [["foo", "bar"]],
        "allowed_stat_types": ["Points", "Rebounds"],
    }
    # Bet with forbidden combo
    bet1 = RealTimeBet(
        id="1",
        sportsbook="test",
        sport=SportCategory.NBA,
        bet_type=BetType.PLAYER_PROPS,
        player_name="A",
        team="T1",
        opponent="T2",
        stat_type="Points",
        line=10,
        over_odds=100,
        under_odds=100,
        game_time=datetime.now(timezone.utc),
        venue="V",
        ml_confidence=90,
        expected_value=0.1,
        kelly_fraction=0.1,
        risk_score=0.1,
        arbitrage_opportunity=None,
        shap_explanation=None,
        created_at=datetime.now(timezone.utc),
        analyzed_at=None,
    )
    bet1.features = ["foo", "bar"]
    # Bet with allowed stat_type
    bet2 = RealTimeBet(
        id="2",
        sportsbook="test",
        sport=SportCategory.NBA,
        bet_type=BetType.PLAYER_PROPS,
        player_name="B",
        team="T1",
        opponent="T2",
        stat_type="Points",
        line=10,
        over_odds=100,
        under_odds=100,
        game_time=datetime.now(timezone.utc),
        venue="V",
        ml_confidence=90,
        expected_value=0.1,
        kelly_fraction=0.1,
        risk_score=0.1,
        arbitrage_opportunity=None,
        shap_explanation=None,
        created_at=datetime.now(timezone.utc),
        analyzed_at=None,
    )
    bet2.features = ["baz"]
    # Bet with disallowed stat_type
    bet3 = RealTimeBet(
        id="3",
        sportsbook="test",
        sport=SportCategory.NBA,
        bet_type=BetType.PLAYER_PROPS,
        player_name="C",
        team="T1",
        opponent="T2",
        stat_type="Blocks",
        line=10,
        over_odds=100,
        under_odds=100,
        game_time=datetime.now(timezone.utc),
        venue="V",
        ml_confidence=90,
        expected_value=0.1,
        kelly_fraction=0.1,
        risk_score=0.1,
        arbitrage_opportunity=None,
        shap_explanation=None,
        created_at=datetime.now(timezone.utc),
        analyzed_at=None,
    )
    bet3.features = ["baz"]
    allowed1, reasons1 = engine._is_bet_allowed(bet1)
    allowed2, reasons2 = engine._is_bet_allowed(bet2)
    allowed3, reasons3 = engine._is_bet_allowed(bet3)
    assert not allowed1
    assert any("Forbidden combo" in r for r in reasons1)
    assert allowed2
    assert reasons2 == []
    assert not allowed3
    assert any("not allowed" in r for r in reasons3)
