import asyncio

import pytest

from backend.services import propfinder_data_service
from backend.services.propfinder_data_service import PropFinderDataService


class DummyCache:
    def __init__(self):
        self.get_calls = []
        self.set_calls = []

    async def get(self, key):
        self.get_calls.append(key)
        return None

    async def set(self, key, data, ttl=None):
        self.set_calls.append((key, data, ttl))


@pytest.mark.asyncio
async def test_background_refresh_schedules_and_sets_cache(monkeypatch):
    service = PropFinderDataService()

    # Replace unified_cache_service with a dummy async cache
    dummy_cache = DummyCache()
    monkeypatch.setattr(propfinder_data_service, "unified_cache_service", dummy_cache)

    # Make MLB/NBA fetches return empty so background refresh uses fallback
    async def _fake_mlb():
        return []

    async def _fake_nba():
        return []

    monkeypatch.setattr(service, "_get_mlb_opportunities", _fake_mlb)
    monkeypatch.setattr(service, "_get_nba_opportunities", _fake_nba)

    # Call the API method which should schedule a background refresh and return fallback
    results = await service.get_prop_opportunities()

    assert isinstance(results, list)
    # Background task should be scheduled
    assert getattr(service, "_refresh_task", None) is not None

    # Wait for the background task to complete (timeout to avoid hangs)
    try:
        await asyncio.wait_for(service._refresh_task, timeout=5)
    except asyncio.TimeoutError:
        pytest.fail("Background refresh task did not complete in time")

    # After background refresh completes, cache.set should have been called
    assert len(dummy_cache.set_calls) >= 1
