import os
import pytest

from backend.services.mlb_stats_api_client import MLBStatsAPIClient


def test_normalization_disabled_by_default():
    os.environ.pop("MLB_CONFIDENCE_NORMALIZATION", None)
    client = MLBStatsAPIClient()
    # low value should remain unchanged when normalization is off
    assert client._normalize_confidence(15.45) == 15.45
    assert client._normalize_confidence(50.0) == 50.0


def test_normalization_enabled_lifts_low_values():
    os.environ["MLB_CONFIDENCE_NORMALIZATION"] = "true"
    client = MLBStatsAPIClient()
    # low values are lifted
    assert client._normalize_confidence(5.0) > 5.0
    assert client._normalize_confidence(5.0) >= 15.0
    assert client._normalize_confidence(15.45) >= 23.45
    assert client._normalize_confidence(25.0) >= 30.0
    # higher values remain mostly unchanged
    assert client._normalize_confidence(40.0) == 40.0


if __name__ == "__main__":
    pytest.main([__file__])
