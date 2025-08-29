import pytest

from backend.routes.consolidated_ml import _extract_decimal_odds_from_request, _maybe_add_ev_to_unified


class DummyReq:
    def __init__(self, data=None, features=None):
        self.data = data
        self.features = features


def test_extract_decimal_from_data_decimal():
    req = DummyReq(data={"odds": 2.5})
    val = _extract_decimal_odds_from_request(req)
    assert val == 2.5


def test_extract_decimal_from_data_american():
    # american odds -150 should convert to decimal 1.666...
    req = DummyReq(data={"american_odds": -150})
    val = _extract_decimal_odds_from_request(req)
    assert val is not None
    assert abs(val - 1.6666667) < 1e-4


def test_maybe_add_ev_sets_fields():
    req = DummyReq(data={"odds": 2.5})
    unified = {"request_id": "r1", "prediction": 0.6, "confidence": 60}
    # call function (it mutates unified)
    _maybe_add_ev_to_unified(req, unified)
    assert "ev" in unified and "ev_pct" in unified and "odds_decimal" in unified
