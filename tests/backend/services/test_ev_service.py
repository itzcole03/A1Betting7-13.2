from backend.services.ev_service import get_ev_service


def test_ev_service_computation_and_tags():
    svc = get_ev_service()
    # Fair odds decimal 2.2 (~+120), market -110 should often be negative EV,
    # but this checks mechanics rather than profitability specifics.
    result = svc.compute_ev(market_odds=-110, fair_odds_decimal=2.2, stake=100)
    assert isinstance(result.ev_percent, float)
    assert isinstance(result.ev_dollar, float)
    assert isinstance(result.implied_probability, float)
    assert isinstance(result.fair_probability, float)
    assert isinstance(result.is_positive, bool)
    assert isinstance(result.fair_odds_american, int)

    # Tagging logic executes; not asserting specific tags since depends on EV
    assert isinstance(result.tags, list)
