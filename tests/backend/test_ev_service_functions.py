import pytest

from backend.services import ev_service


def test_american_to_decimal_positive():
    assert ev_service.american_to_decimal(150) == pytest.approx(2.5)


def test_american_to_decimal_negative():
    assert ev_service.american_to_decimal(-150) == pytest.approx(1.666667, rel=1e-6)


def test_parse_decimal_odds():
    assert ev_service.parse_odds(2.2) == pytest.approx(2.2)


def test_compute_ev_positive():
    # probability 0.6, decimal odds 2.0 => EV = 0.6*(2-1) + 0.4*(-1) = 0.6 - 0.4 = 0.2
    ev, ev_pct = ev_service.compute_ev(0.6, 2.0, stake=1.0)
    assert ev == pytest.approx(0.2)
    assert ev_pct == pytest.approx(20.0)


def test_compute_ev_invalid_probability():
    with pytest.raises(ValueError):
        ev_service.compute_ev(-0.1, 2.0)
