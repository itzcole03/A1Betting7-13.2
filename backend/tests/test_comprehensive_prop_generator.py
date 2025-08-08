import asyncio
import types

import pytest

from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator


@pytest.mark.asyncio
async def test_circuit_breaker_open(monkeypatch):
    generator = ComprehensivePropGenerator()
    # Force circuit breaker open
    generator.circuit_breaker.state = "OPEN"
    result = await generator.generate_game_props(123456, optimize_performance=True)
    assert result["status"] == "circuit_breaker_open"
    assert result["props"] == []


@pytest.mark.asyncio
async def test_cache_miss_and_error(monkeypatch):
    generator = ComprehensivePropGenerator()

    # Simulate cache always missing and _get_cached_game_info raising error
    async def always_none(*args, **kwargs):
        return None

    monkeypatch.setattr(generator.cache_service, "get_cached_data", always_none)
    monkeypatch.setattr(generator, "_get_cached_game_info", always_none)
    result = await generator.generate_game_props(123456, optimize_performance=True)
    assert result["status"] == "game_info_unavailable"
    assert result["props"] == []


@pytest.mark.asyncio
async def test_error_handling(monkeypatch):
    generator = ComprehensivePropGenerator()

    # Simulate _get_cached_game_info raising an exception
    async def raise_exc(*args, **kwargs):
        raise RuntimeError("Simulated error")

    monkeypatch.setattr(generator, "_get_cached_game_info", raise_exc)
    result = await generator.generate_game_props(123456, optimize_performance=True)
    assert result["status"] == "error"
    assert "error" in result


@pytest.mark.asyncio
async def test_timeout_handling(monkeypatch):
    generator = ComprehensivePropGenerator()

    # Simulate _get_cached_game_info taking too long
    async def slow_func(*args, **kwargs):
        await asyncio.sleep(16)
        return None

    monkeypatch.setattr(generator, "_get_cached_game_info", slow_func)
    # Lower the timeout for test speed
    orig_timeout = asyncio.timeout

    def fast_timeout(timeout):
        return orig_timeout(0.01)

    monkeypatch.setattr(asyncio, "timeout", fast_timeout)
    result = await generator.generate_game_props(123456, optimize_performance=True)
    assert result["status"] in ("timeout", "error")


import pytest

from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator


@pytest.mark.asyncio
async def test_generate_game_props_phase2_stats():
    generator = ComprehensivePropGenerator()
    # Use a valid game_id from /mlb/todays-games endpoint for real data
    game_id = 776879  # Replace with a valid game_id if needed
    result = await generator.generate_game_props(game_id, optimize_performance=True)
    assert isinstance(result, dict)
    assert "props" in result
    assert "phase2_stats" in result
    assert isinstance(result["phase2_stats"], dict)
    assert result["phase2_stats"].get("total_props_generated", 0) > 0
    assert result["phase2_stats"].get("high_confidence_props", 0) > 0
