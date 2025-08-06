from datetime import datetime, timedelta, timezone

import pytest

from backend.services.real_time_analysis_engine import (
    BetType,
    RealTimeAnalysisEngine,
    RealTimeBet,
    SportCategory,
)


@pytest.fixture
def engine():
    eng = RealTimeAnalysisEngine()
    eng.reload_business_rules()
    return eng


def make_bet(**kwargs):
    bet = RealTimeBet(
        id=kwargs.get("id", "test1"),
        sportsbook=kwargs.get("sportsbook", "testbook"),
        sport=kwargs.get("sport", SportCategory.NBA),
        bet_type=kwargs.get("bet_type", BetType.PLAYER_PROPS),
        player_name=kwargs.get("player_name", "Test Player"),
        team=kwargs.get("team", "A"),
        opponent=kwargs.get("opponent", "B"),
        stat_type=kwargs.get("stat_type", "points"),
        line=kwargs.get("line", 10),
        over_odds=kwargs.get("over_odds", -110),
        under_odds=kwargs.get("under_odds", -110),
        game_time=kwargs.get("game_time", datetime.now(timezone.utc)),
        venue=kwargs.get("venue", "Test Venue"),
        ml_confidence=kwargs.get("ml_confidence", 80.0),
        expected_value=kwargs.get("expected_value", 0.12),
        risk_score=kwargs.get("risk_score", 0.2),
    )
    # Always add features for combo rules
    bet.features = kwargs.get(
        "features",
        [
            str(bet.sport.value).lower(),
            str(bet.bet_type.value).lower(),
            str(bet.player_name).lower(),
            str(bet.stat_type).lower(),
        ],
    )
    return bet


def test_time_windowed_ev_rule(engine):
    # Should be forbidden if expected_value < 0.10 during window
    bet = make_bet(expected_value=0.09, sport=SportCategory.NBA)
    now = datetime(2025, 7, 28, tzinfo=timezone.utc)
    allowed, reasons = engine._is_bet_allowed(bet, now=now)
    assert not allowed
    assert any("expected value" in r.lower() for r in reasons)


def test_time_windowed_risk_rule(engine):
    # Should be forbidden if risk_score > 0.25 during window
    bet = make_bet(risk_score=0.26)
    now = datetime(2025, 7, 28, tzinfo=timezone.utc)
    allowed, reasons = engine._is_bet_allowed(bet, now=now)
    assert not allowed
    assert any("risk score" in r.lower() for r in reasons)


def test_forbidden_combo_dynamic(engine):
    # Should be forbidden if combo matches during window
    bet = make_bet(sport=SportCategory.UFC)
    bet.features = ["ufc", "parlay"]
    now = datetime(2025, 7, 31, tzinfo=timezone.utc)
    active_rules = engine._get_active_rules(now=now)
    assert any(r["id"] == "forbid-ufc-parlays" for r in active_rules)
    allowed, reasons = engine._is_bet_allowed(bet, now=now)
    assert not allowed
    assert any("forbidden combo" in r.lower() for r in reasons)


def test_outside_time_window(engine):
    # Should allow bet if outside time window
    bet = make_bet(expected_value=0.09, sport=SportCategory.NBA)
    now = datetime(2025, 8, 2, tzinfo=timezone.utc)
    active_rules = engine._get_active_rules(now=now)
    assert not any(r["id"] == "nba-ev-boost" for r in active_rules)
    allowed, reasons = engine._is_bet_allowed(bet, now=now)
    assert allowed


def test_user_override_ev_rule(engine):
    # User 123 has a stricter EV rule for NBA during window
    bet = make_bet(expected_value=0.13, sport=SportCategory.NBA)
    now = datetime(2025, 7, 28, tzinfo=timezone.utc)
    allowed, reasons = engine._is_bet_allowed(bet, now=now, user_id="user_123")
    assert not allowed
    assert any("expected value" in r.lower() for r in reasons)


def test_user_override_combo_rule(engine):
    # User 456: UFC parlays always forbidden
    bet = make_bet(sport=SportCategory.UFC)
    bet.features = ["ufc", "parlay"]
    now = datetime(2025, 7, 28, tzinfo=timezone.utc)
    allowed, reasons = engine._is_bet_allowed(bet, now=now, user_id="user_456")
    assert not allowed
    assert any("forbidden combo" in r.lower() for r in reasons)


def test_user_fallback_to_global(engine):
    # User with no override: falls back to global rules
    bet = make_bet(expected_value=0.09, sport=SportCategory.NBA)
    now = datetime(2025, 7, 28, tzinfo=timezone.utc)
    allowed, reasons = engine._is_bet_allowed(bet, now=now, user_id="unknown_user")
    assert not allowed
    assert any("expected value" in r.lower() for r in reasons)


def test_user_override_time_window_expired(engine):
    # User 123: after window, stricter rule no longer applies
    bet = make_bet(expected_value=0.13, sport=SportCategory.NBA)
    now = datetime(2025, 8, 2, tzinfo=timezone.utc)
    allowed, reasons = engine._is_bet_allowed(bet, now=now, user_id="user_123")
    assert allowed
