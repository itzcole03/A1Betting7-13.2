from backend.betting.ev_calculator import compute_ev, fair_american_from_prob
from backend.betting.odds_normalizer import to_implied_prob


def test_fair_american_from_prob_roundtrip():
    prob = 0.55
    american = fair_american_from_prob(prob)
    # Convert back to implied prob using odds_normalizer formula logic
    implied = to_implied_prob(american)
    # For positive or negative outcomes, ensure difference small
    assert abs(implied - prob) < 0.03  # coarse tolerance due to integer rounding


def test_compute_ev_positive_edge():
    result = compute_ev(fair_prob=0.55, market_american=-110)
    assert result["edge_pct"] > 0
    assert result["fair_odds"] == int(result["fair_odds"])  # int stored as int


def test_compute_ev_negative_edge():
    # fair prob lower than implied probability at -200 (implied 66.666%)
    result = compute_ev(fair_prob=0.5, market_american=-200)
    assert result["edge_pct"] < 0
