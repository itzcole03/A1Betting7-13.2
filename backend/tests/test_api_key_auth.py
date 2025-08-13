import pytest

"""
Legacy API key authentication tests. These endpoints are deprecated and currently missing.
All tests are marked as skipped until endpoints are restored.
"""


@pytest.mark.skip(reason="legacy - endpoint missing, unrelated to Batch 2")
def test_predict_requires_api_key():
    pass


@pytest.mark.skip(reason="legacy - endpoint missing, unrelated to Batch 2")
def test_predict_invalid_api_key():
    pass


@pytest.mark.skip(reason="legacy - endpoint missing, unrelated to Batch 2")
def test_predict_valid_api_key():
    pass
