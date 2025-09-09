import math
from backend.services.ev_valuation_service import compute_implied_prob, compute_ev

def test_implied_prob_positive():
    prob = compute_implied_prob(150)
    assert prob is not None
    assert round(prob, 5) == round(100/(150+100),5)

def test_implied_prob_negative():
    prob = compute_implied_prob(-120)
    assert prob is not None
    assert round(prob,5) == round(120/(120+100),5)

def test_compute_ev_positive_expected():
    # Model prob 0.6 vs +120 odds
    r = compute_ev(0.6, 120)
    assert r is not None
    assert "expected_value" in r
    assert r["expected_value"] != 0

def test_compute_ev_invalid_prob():
    assert compute_ev(1.2, 150) is None
    assert compute_ev(0, 150) is None

def test_compute_ev_symmetric():
    r1 = compute_ev(0.5, -110)
    r2 = compute_ev(0.5, 110)
    assert r1 and r2
