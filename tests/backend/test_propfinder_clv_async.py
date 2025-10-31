import asyncio

import pytest


@pytest.mark.asyncio
async def test_run_clv_compute_with_sync_compute(monkeypatch):
    # Patch the compute_clv_batch to be a synchronous function
    async_mod_path = "backend.services.clv_computation"

    def sync_compute(input_list, include_diagnostics=False):
        return [{"id": "1", "clv_metrics": {"clv_estimate": 0.123}}]

    monkeypatch.setattr(
        f"{async_mod_path}.compute_clv_batch", sync_compute, raising=False
    )

    from backend.routes.propfinder_routes import _run_clv_compute

    opportunities = [{"id": "1"}]
    clv_was_enabled, succeeded = await _run_clv_compute(opportunities, None)

    assert clv_was_enabled is True
    assert succeeded is True
    assert isinstance(opportunities[0].get("clv_metrics"), dict)
    assert opportunities[0]["clv_metrics"]["clv_estimate"] == 0.123


@pytest.mark.asyncio
async def test_run_clv_compute_with_async_compute(monkeypatch):
    # Patch the compute_clv_batch to be an async coroutine
    async_mod_path = "backend.services.clv_computation"

    async def async_compute(input_list, include_diagnostics=False):
        await asyncio.sleep(0)  # ensure coroutine
        return [{"id": "1", "clv_metrics": {"clv_estimate": 0.321}}]

    monkeypatch.setattr(
        f"{async_mod_path}.compute_clv_batch", async_compute, raising=False
    )

    from backend.routes.propfinder_routes import _run_clv_compute

    opportunities = [{"id": "1"}]
    clv_was_enabled, succeeded = await _run_clv_compute(opportunities, None)

    assert clv_was_enabled is True
    assert succeeded is True
    assert isinstance(opportunities[0].get("clv_metrics"), dict)
    assert opportunities[0]["clv_metrics"]["clv_estimate"] == 0.321
