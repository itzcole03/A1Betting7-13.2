"""
Test suite for the production-ready health diagnostics endpoint
Tests the comprehensive health monitoring functionality including service status and performance metrics.
"""

import asyncio
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient


def test_health_models_validation():
    """Test that health models validate correctly with proper data."""
    from backend.services.health.health_models import (
        ServiceStatus,
        PerformanceStats,
        CacheStats,
        InfrastructureStats,
        HealthResponse,
    )

    # Test ServiceStatus validation
    service = ServiceStatus(
        name="test_service",
        status="ok",
        latency_ms=15.5,
        details={"connection": "active"}
    )
    assert service.name == "test_service"
    assert service.status == "ok"
    assert service.latency_ms == 15.5
    assert service.details == {"connection": "active"}

    # Test with invalid status
    with pytest.raises(ValueError):
        ServiceStatus(name="test", status="invalid_status", latency_ms=10.0)

    # Test PerformanceStats validation
    perf = PerformanceStats(
        cpu_percent=25.5,
        rss_mb=128.0,
        event_loop_lag_ms=2.1,
        avg_request_latency_ms=45.2,
        p95_request_latency_ms=125.7
    )
    assert perf.cpu_percent == 25.5
    assert perf.rss_mb == 128.0

    # Test with negative values (should fail)
    with pytest.raises(ValueError):
        PerformanceStats(
            cpu_percent=-5.0,  # Invalid negative value
            rss_mb=128.0,
            event_loop_lag_ms=2.1,
            avg_request_latency_ms=45.2,
            p95_request_latency_ms=125.7
        )

    # Test CacheStats
    cache = CacheStats(hit_rate=0.85, hits=100, misses=20, evictions=5)
    assert cache.hit_rate == 0.85
    assert cache.hits == 100

    # Test InfrastructureStats
    infra = InfrastructureStats(
        uptime_sec=3600.0,
        python_version="3.12.5",
        build_commit="abc123de",
        environment="test"
    )
    assert infra.uptime_sec == 3600.0
    assert infra.python_version == "3.12.5"

    # Test complete HealthResponse
    health = HealthResponse(
        timestamp=datetime.now(),
        version="v2",
        services=[service],
        performance=perf,
        cache=cache,
        infrastructure=infra
    )
    assert health.version == "v2"
    assert len(health.services) == 1
    assert health.services[0].name == "test_service"


def test_unified_metrics_collector():
    """Test the unified metrics collector functionality."""
    from backend.services.metrics.unified_metrics_collector import UnifiedMetricsCollector

    collector = UnifiedMetricsCollector()

    # Test recording latency
    collector.record_request_latency(50.0)
    collector.record_request_latency(100.0)
    collector.record_request_latency(75.0)

    # Test latency stats
    stats = collector.get_latency_stats()
    assert stats["avg_latency_ms"] == 75.0  # (50 + 100 + 75) / 3
    assert "p95_latency_ms" in stats
    assert stats["p95_latency_ms"] > 0

    # Test request counters
    collector.record_successful_request()
    collector.record_successful_request()
    collector.record_failed_request()

    counters = collector.get_request_counters()
    assert counters["total_requests"] == 3  # From latency recordings
    assert counters["successful_requests"] == 2
    assert counters["failed_requests"] == 1

    # Test snapshot
    snapshot = collector.snapshot()
    assert "avg_latency_ms" in snapshot
    assert "p95_latency_ms" in snapshot
    assert "event_loop_lag_ms" in snapshot
    assert "total_requests" in snapshot
    assert "success_rate" in snapshot

    # Test reset
    collector.reset_metrics()
    stats = collector.get_latency_stats()
    assert stats["avg_latency_ms"] == 0.0


def test_map_statuses_to_overall():
    """Test the status mapping helper function."""
    from backend.services.health.health_collector import map_statuses_to_overall
    from backend.services.health.health_models import ServiceStatus

    # Test all services OK
    services = [
        ServiceStatus(name="db", status="ok", latency_ms=10.0),
        ServiceStatus(name="redis", status="ok", latency_ms=5.0),
    ]
    assert map_statuses_to_overall(services) == "ok"

    # Test some services degraded
    services = [
        ServiceStatus(name="db", status="ok", latency_ms=10.0),
        ServiceStatus(name="redis", status="degraded", latency_ms=50.0),
    ]
    assert map_statuses_to_overall(services) == "degraded"

    # Test some services down
    services = [
        ServiceStatus(name="db", status="ok", latency_ms=10.0),
        ServiceStatus(name="redis", status="down", latency_ms=None),
    ]
    assert map_statuses_to_overall(services) == "down"

    # Test empty services list
    assert map_statuses_to_overall([]) == "ok"


@pytest.mark.asyncio
async def test_health_collector_basic_functionality():
    """Test basic health collector functionality with mocked dependencies."""
    from backend.services.health.health_collector import HealthCollector

    collector = HealthCollector()

    # Test infrastructure stats (should work without dependencies)
    infra_stats = collector.get_infrastructure_stats()
    assert infra_stats.uptime_sec >= 0  # Allow zero for immediate test runs
    assert infra_stats.python_version.startswith("3.")
    assert infra_stats.environment in ["development", "test", "staging", "production"]

    # Test performance stats (should work even without psutil)
    perf_stats = collector.get_performance_stats()
    assert perf_stats.cpu_percent >= 0
    assert perf_stats.rss_mb >= 0
    assert perf_stats.event_loop_lag_ms >= 0
    assert perf_stats.avg_request_latency_ms >= 0
    assert perf_stats.p95_request_latency_ms >= 0

    # Test cache stats (should return zeros when no cache available)
    cache_stats = collector.get_cache_stats()
    assert cache_stats.hit_rate >= 0.0
    assert cache_stats.hits >= 0
    assert cache_stats.misses >= 0
    assert cache_stats.evictions >= 0


@pytest.fixture
def mock_app():
    """Create a test FastAPI app with the diagnostics router."""
    from fastapi import FastAPI
    from backend.routes.diagnostics import router

    app = FastAPI()
    app.include_router(router, prefix="/api/v2/diagnostics")
    return app


def test_health_endpoint_response_structure(mock_app):
    """Test that the health endpoint returns the correct response structure."""
    client = TestClient(mock_app)

    response = client.get("/api/v2/diagnostics/health")

    # Should return 200 OK
    assert response.status_code == 200

    # Check response headers
    assert response.headers.get("Cache-Control") == "no-store"
    assert response.headers.get("X-Health-Version") == "v2"

    # Check response structure
    data = response.json()
    
    # Required top-level fields
    required_fields = ["timestamp", "version", "services", "performance", "cache", "infrastructure"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"

    # Check version
    assert data["version"] == "v2"

    # Check services is a list
    assert isinstance(data["services"], list)
    
    # Check each service has required fields
    for service in data["services"]:
        assert "name" in service
        assert "status" in service
        assert service["status"] in ["ok", "degraded", "down"]
        assert "details" in service
        # latency_ms is optional

    # Check performance stats
    perf = data["performance"]
    perf_fields = ["cpu_percent", "rss_mb", "event_loop_lag_ms", "avg_request_latency_ms", "p95_request_latency_ms"]
    for field in perf_fields:
        assert field in perf
        assert isinstance(perf[field], (int, float))
        assert perf[field] >= 0

    # Check cache stats
    cache = data["cache"]
    cache_fields = ["hit_rate", "hits", "misses", "evictions"]
    for field in cache_fields:
        assert field in cache
        assert isinstance(cache[field], (int, float))
        assert cache[field] >= 0
    assert 0 <= cache["hit_rate"] <= 1

    # Check infrastructure stats
    infra = data["infrastructure"]
    infra_fields = ["uptime_sec", "python_version", "environment"]
    for field in infra_fields:
        assert field in infra
    assert infra["uptime_sec"] >= 0
    assert infra["python_version"].count(".") >= 2  # Format like "3.12.5"


def test_health_endpoint_status_validation(mock_app):
    """Test that the health endpoint only returns valid status values."""
    client = TestClient(mock_app)

    response = client.get("/api/v2/diagnostics/health")
    assert response.status_code == 200

    data = response.json()
    
    # Validate all service statuses are in allowed set
    valid_statuses = {"ok", "degraded", "down"}
    for service in data["services"]:
        assert service["status"] in valid_statuses, f"Invalid status: {service['status']} for service: {service['name']}"


def test_health_endpoint_concurrent_requests(mock_app):
    """Test that the health endpoint handles concurrent requests properly."""
    import threading
    import time

    client = TestClient(mock_app)
    results = []
    errors = []

    def make_request():
        try:
            response = client.get("/api/v2/diagnostics/health")
            results.append(response.status_code)
        except Exception as e:
            errors.append(str(e))

    # Make 10 concurrent requests
    threads = []
    for _ in range(10):
        thread = threading.Thread(target=make_request)
        threads.append(thread)
        thread.start()

    # Wait for all requests to complete
    for thread in threads:
        thread.join()

    # All requests should succeed
    assert len(errors) == 0, f"Errors occurred: {errors}"
    assert len(results) == 10
    assert all(status == 200 for status in results)


if __name__ == "__main__":
    # Run basic functionality tests
    print("Running health endpoint tests...")
    test_health_models_validation()
    print("✅ Health models validation passed")
    
    test_unified_metrics_collector()
    print("✅ Unified metrics collector tests passed")
    
    test_map_statuses_to_overall()
    print("✅ Status mapping tests passed")
    
    # Run async test
    asyncio.run(test_health_collector_basic_functionality())
    print("✅ Health collector basic functionality passed")
    
    print("All tests passed! 🎉")