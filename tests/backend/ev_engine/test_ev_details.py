import math

import pytest

from backend.services.ev_engine import compute_ev_details, EVEngine


def test_compute_ev_details_even_money_no_edge():
    # 50% probability vs +100 odds (decimal 2.0) → EV ~ 0 per $100
    details = compute_ev_details(0.5, 100)
    assert details["implied_prob_market"] == 50.0
    assert details["implied_prob_fair"] == 50.0
    assert details["fair_american_odds"] == 100
    assert details["edge_pct"] == 0.0
    assert abs(details["expected_value_per_100"]) < 1e-6


def test_compute_ev_details_positive_edge():
    # 55% probability vs -110 odds (decimal ~1.909) → positive EV
    details = compute_ev_details(0.55, -110)
    assert details["implied_prob_market"] == round(EVEngine.implied_probability(EVEngine.american_to_decimal(-110)), 2)
    assert details["implied_prob_fair"] == 55.0
    assert isinstance(details["fair_american_odds"], int)
    # Edge should be positive when our prob > market implied
    assert details["edge_pct"] > 0
    # EV per $100 should be > 0
    assert details["expected_value_per_100"] > 0


def test_compute_ev_details_negative_edge():
    # 45% probability vs -110 odds → negative EV
    details = compute_ev_details(0.45, -110)
    assert details["edge_pct"] < 0
    assert details["expected_value_per_100"] < 0


def test_compute_ev_details_invalid_probability():
    with pytest.raises(ValueError):
        compute_ev_details(-0.1, -110)
    with pytest.raises(ValueError):
        compute_ev_details(1.1, 120)
