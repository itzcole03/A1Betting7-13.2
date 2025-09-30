from backend.betting.odds_normalizer import to_implied_prob


def almost_equal(a: float, b: float, tol: float = 1e-6):
    assert abs(a - b) <= tol, f"{a} != {b} within {tol}"


def test_to_implied_prob_positive_odds():
    almost_equal(to_implied_prob(100), 0.5)
    almost_equal(to_implied_prob(150), 100 / 250)
    almost_equal(to_implied_prob(250), 100 / 350)


def test_to_implied_prob_negative_odds():
    almost_equal(to_implied_prob(-120), 120 / 220)
    almost_equal(to_implied_prob(-300), 300 / 400)


def test_to_implied_prob_zero_error():
    import pytest

    with pytest.raises(ValueError):
        to_implied_prob(0)
