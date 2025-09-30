from backend.betting.kelly import compute_kelly_fraction


def test_kelly_positive():
    k = compute_kelly_fraction(fair_prob=0.55, market_american=-110, bankroll=1000)
    assert k["raw_fraction"] > 0
    assert 0 < k["kelly_fraction"] <= k["raw_fraction"]


def test_kelly_capped():
    # Large edge scenario that would exceed cap without limiting
    k = compute_kelly_fraction(fair_prob=0.70, market_american=200, bankroll=1000, fraction_cap=0.05)
    # Implementation preserves raw_fraction (pre-cap) and clamps kelly_fraction
    assert k["raw_fraction"] > 0.05  # raw (unclamped) fraction
    assert abs(k["kelly_fraction"] - 0.05) < 1e-9  # clamped to cap
    assert k["recommended_stake"] == 1000 * 0.05


def test_kelly_zero_when_no_edge():
    k = compute_kelly_fraction(fair_prob=0.45, market_american=-110, bankroll=1000)
    # raw_fraction can be negative pre-clamp; kelly_fraction must be zero
    assert k["raw_fraction"] <= 0
    assert k["kelly_fraction"] == 0
    assert k["recommended_stake"] == 0
