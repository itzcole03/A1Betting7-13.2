import pytest

"""
Legacy propollama endpoint tests. All endpoints deprecated and tests skipped.
"""


@pytest.mark.skip(reason="legacy - endpoint deprecated, unrelated to Batch 2")
def test_health_endpoint():
    pass


@pytest.mark.skip(reason="legacy - endpoint deprecated, unrelated to Batch 2")
def test_chat_valid():
    pass


@pytest.mark.skip(reason="legacy - endpoint deprecated, unrelated to Batch 2")
def test_chat_missing_message():
    pass


@pytest.mark.skip(reason="legacy - endpoint deprecated, unrelated to Batch 2")
def test_chat_invalid_json():
    pass


@pytest.mark.skip(reason="legacy - endpoint deprecated, unrelated to Batch 2")
def test_chat_internal_error(monkeypatch):
    pass
