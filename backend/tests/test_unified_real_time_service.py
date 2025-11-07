import pytest
import pytest_asyncio

from backend.services.unified_data_service import (
    assess_real_time_data_quality,
    configure_real_time_service,
    ensure_real_time_ready,
    get_real_time_cache_metrics,
    get_real_time_circuit_breaker_status,
    get_real_time_health_metrics,
    get_real_time_health_status,
    get_real_time_player_data,
    get_real_time_rate_limit_status,
    search_real_time_players,
    shutdown_real_time_service,
)


@pytest_asyncio.fixture
async def realtime_ready():
    """Ensure the unified real-time service is initialized with a safe config."""
    await shutdown_real_time_service()
    config = {"redis_url": "redis://localhost:6379/0", "api_endpoints": []}
    await configure_real_time_service(config)
    await ensure_real_time_ready()
    try:
        yield
    finally:
        await shutdown_real_time_service()


@pytest.mark.asyncio
async def test_health_and_metrics_shapes(realtime_ready):
    health = await get_real_time_health_status()
    assert "overall_status" in health
    assert "timestamp" in health

    metrics = await get_real_time_health_metrics()
    assert isinstance(metrics, dict)

    cache_metrics = await get_real_time_cache_metrics()
    assert "redis_connected" in cache_metrics
    assert "priority_queue_depths" in cache_metrics

    rate_metrics = await get_real_time_rate_limit_status()
    assert isinstance(rate_metrics, dict)

    breaker_status = await get_real_time_circuit_breaker_status()
    assert isinstance(breaker_status, dict)


@pytest.mark.asyncio
async def test_player_data_and_search_resilience(realtime_ready):
    data = await get_real_time_player_data("non-existent-player", "MLB")
    assert data is None or isinstance(data, dict)

    results = await search_real_time_players("te", "MLB", 3)
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_quality_assessment_tracks_metrics(realtime_ready):
    payload = {"id": "123", "name": "Test", "team": "TST", "position": "P"}
    result = await assess_real_time_data_quality(payload)

    assert result["quality_level"] in {"high", "medium", "low", "invalid"}
    assert 0.0 <= result["score"] <= 1.0

    cache_metrics = await get_real_time_cache_metrics()
    assert "player_data" in cache_metrics.get("tracked_quality_metrics", [])
