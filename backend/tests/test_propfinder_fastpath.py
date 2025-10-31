import asyncio
import time

import pytest

from backend.services import propfinder_data_service
from backend.services.propfinder_data_service import PropFinderDataService


@pytest.mark.asyncio
async def test_propfinder_fastpath_returns_quickly_and_schedules_bg(monkeypatch):
    service = PropFinderDataService()

    # Replace unified_cache_service to force a cache miss
    class DummyCache:
        async def get(self, key):
            return None

        async def set(self, key, data, ttl=None):
            return None

    dummy_cache = DummyCache()
    monkeypatch.setattr(propfinder_data_service, "unified_cache_service", dummy_cache)

    # Replace the heavy background worker with a lightweight stub so test is quick
    bg_called = asyncio.Event()

    async def fake_background(*args, **kwargs):
        # simulate brief work
        await asyncio.sleep(0.01)
        bg_called.set()

    monkeypatch.setattr(service, "_background_refresh_and_cache", fake_background)

    # Measure synchronous call time
    t0 = time.monotonic()
    results = await service.get_prop_opportunities()
    elapsed = time.monotonic() - t0

    # Should return quickly (fast fallback path); allow generous bound for CI
    assert elapsed < 0.5, f"Fast-path took too long: {elapsed}s"
    assert isinstance(results, list)

    # Background task should have been scheduled and should run to completion
    assert getattr(service, "_refresh_task", None) is not None
    await asyncio.wait_for(bg_called.wait(), timeout=2)
