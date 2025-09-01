from backend.services.ev_service import compute_ev, american_to_decimal, parse_odds


def test_american_to_decimal_positive():
    assert american_to_decimal(150) == 2.5


def test_american_to_decimal_negative():
    assert round(american_to_decimal(-200), 6) == round((100.0 / 200.0) + 1.0, 6)


def test_parse_decimal():
    assert parse_odds(2.5) == 2.5


def test_compute_ev_positive():
    ev, pct = compute_ev(0.6, 2.5, stake=1.0)
    assert ev > 0
    assert pct > 0


def test_compute_ev_negative():
    ev, pct = compute_ev(0.2, 1.5, stake=1.0)
    assert ev < 0
    assert pct < 0
