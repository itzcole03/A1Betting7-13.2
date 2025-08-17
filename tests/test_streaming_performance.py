"""
Streaming Performance Tests

Performance and load testing for the streaming system to validate
scalability and performance characteristics.
"""

import pytest
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
from unittest.mock import Mock, AsyncMock, patch
from concurrent.futures import ThreadPoolExecutor
import threading

# FastAPI testing
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import streaming components
from backend.routes.streaming.streaming_api import router as streaming_router
from backend.services.rationale.portfolio_rationale_service import (
    PortfolioRationaleService,
    RationaleRequest,
    RationaleType
)
from backend.models.streaming import MockProviderState, ProviderStatus


# ============================================================================
# PERFORMANCE TEST FIXTURES
# ============================================================================

@pytest.fixture
def perf_app():
    """Create FastAPI app for performance testing"""
    app = FastAPI(title="Performance Test API")
    app.include_router(streaming_router)
    return app


@pytest.fixture
def perf_client(perf_app):
    """Create test client for performance testing"""
    return TestClient(perf_app)


@pytest.fixture
def mock_fast_services():
    """Mock services optimized for performance testing"""
    
    # Fast mock provider registry
    mock_registry = Mock()
    mock_registry.get_all_provider_status.return_value = {
        f"provider_{i}": {"status": "active"} for i in range(100)
    }
    mock_registry.get_provider.return_value = Mock(
        provider_name="test_provider",
        supports_incremental=True,
        health_check=AsyncMock(return_value=True)
    )
    mock_registry.get_registry_stats.return_value = {
        "total_providers": 100,
        "active_providers": 95,
        "health_check_failures": 5
    }
    
    # Fast mock streamer
    mock_streamer = Mock()
    mock_streamer.get_status.return_value = {
        "is_running": True,
        "active_providers": [f"provider_{i}" for i in range(50)],
        "total_events": 50000,
        "last_cycle_time": datetime.utcnow().isoformat(),
        "events_per_second": 1250.7
    }
    mock_streamer.start = AsyncMock()
    mock_streamer.stop = AsyncMock()
    
    # Fast mock rationale service
    mock_rationale_service = Mock()
    mock_rationale_service.get_status.return_value = {
        "is_available": True,
        "cache_size": 1000,
        "rate_limit_remaining": 5000
    }
    mock_rationale_service.generate_rationale = AsyncMock(return_value=Mock(
        id=123,
        narrative="Fast test narrative",
        confidence=0.85,
        generation_time_ms=250
    ))
    
    return {
        "provider_registry": mock_registry,
        "market_streamer": mock_streamer,
        "rationale_service": mock_rationale_service
    }


# ============================================================================
# API PERFORMANCE TESTS
# ============================================================================

class TestAPIPerformance:
    """Test API endpoint performance under various loads"""
    
    def test_provider_list_performance(self, perf_client, mock_fast_services):
        """Test performance of listing many providers"""
        with patch('backend.routes.streaming.streaming_api.provider_registry', mock_fast_services["provider_registry"]):
            
            start_time = time.time()
            
            # Make multiple concurrent requests
            responses = []
            for _ in range(50):
                response = perf_client.get("/streaming/providers")
                responses.append(response)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Performance assertions
            assert all(r.status_code == 200 for r in responses)
            assert processing_time < 5.0  # Should handle 50 requests in < 5 seconds
            
            requests_per_second = len(responses) / processing_time
            print(f"Provider list performance: {requests_per_second:.1f} requests/second")
    
    def test_concurrent_status_requests(self, perf_client, mock_fast_services):
        """Test concurrent system status requests"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_fast_services["market_streamer"]):
            with patch('backend.routes.streaming.streaming_api.provider_registry', mock_fast_services["provider_registry"]):
                with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_fast_services["rationale_service"]):
                    
                    start_time = time.time()
                    
                    # Use thread pool for true concurrent requests
                    with ThreadPoolExecutor(max_workers=20) as executor:
                        futures = []
                        for _ in range(100):
                            future = executor.submit(perf_client.get, "/streaming/status")
                            futures.append(future)
                        
                        # Wait for all requests to complete
                        responses = [future.result() for future in futures]
                    
                    end_time = time.time()
                    processing_time = end_time - start_time
                    
                    # Performance assertions
                    assert all(r.status_code == 200 for r in responses)
                    assert processing_time < 10.0  # Should handle 100 concurrent requests in < 10 seconds
                    
                    requests_per_second = len(responses) / processing_time
                    print(f"Concurrent status requests: {requests_per_second:.1f} requests/second")
    
    def test_health_check_performance(self, perf_client, mock_fast_services):
        """Test health check endpoint performance"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_fast_services["market_streamer"]):
            with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_fast_services["rationale_service"]):
                
                # Measure single request latency
                start_time = time.perf_counter()
                response = perf_client.get("/streaming/health")
                end_time = time.perf_counter()
                
                single_request_time = (end_time - start_time) * 1000  # Convert to ms
                
                assert response.status_code == 200
                assert single_request_time < 100  # Should respond in < 100ms
                
                print(f"Health check latency: {single_request_time:.2f}ms")


class TestStreamingControlPerformance:
    """Test streaming control performance"""
    
    def test_rapid_start_stop_cycles(self, perf_client, mock_fast_services):
        """Test rapid start/stop control cycles"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_fast_services["market_streamer"]):
            
            start_time = time.time()
            
            # Perform 20 start/stop cycles
            for _ in range(20):
                start_response = perf_client.post("/streaming/control", json={"action": "start"})
                assert start_response.status_code == 200
                
                stop_response = perf_client.post("/streaming/control", json={"action": "stop"})
                assert stop_response.status_code == 200
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            cycles_per_second = 20 / processing_time
            print(f"Start/stop cycles: {cycles_per_second:.1f} cycles/second")
            
            # Performance assertion
            assert processing_time < 10.0  # Should complete 20 cycles in < 10 seconds


# ============================================================================
# MEMORY AND RESOURCE TESTS
# ============================================================================

class TestResourceUsage:
    """Test resource usage patterns"""
    
    def test_memory_usage_with_many_mock_providers(self):
        """Test memory usage when creating many mock provider states"""
        import gc
        
        # Force garbage collection before test
        gc.collect()
        
        # Create many mock provider states
        mock_providers = []
        start_time = time.time()
        
        for i in range(5000):
            mock_provider = MockProviderState(f"provider_{i}")
            mock_provider.status = ProviderStatus.ACTIVE
            mock_provider.total_requests = i * 10
            mock_provider.successful_requests = i * 9
            mock_providers.append(mock_provider)
        
        creation_time = time.time() - start_time
        
        # Convert all to dictionaries (simulating API response)
        start_time = time.time()
        provider_dicts = [provider.to_dict() for provider in mock_providers]
        conversion_time = time.time() - start_time
        
        # Performance assertions
        assert len(mock_providers) == 5000
        assert len(provider_dicts) == 5000
        assert creation_time < 2.0  # Should create 5000 objects in < 2 seconds
        assert conversion_time < 1.0  # Should convert to dict in < 1 second
        
        print(f"Created 5000 mock providers in {creation_time:.3f}s")
        print(f"Converted to dicts in {conversion_time:.3f}s")
        
        # Clean up
        del mock_providers
        del provider_dicts
        gc.collect()
    
    def test_concurrent_provider_operations(self):
        """Test concurrent provider state operations"""
        
        def create_and_process_provider(provider_id: int) -> Dict[str, Any]:
            """Create provider and perform operations"""
            mock_provider = MockProviderState(f"concurrent_provider_{provider_id}")
            mock_provider.status = ProviderStatus.ACTIVE
            mock_provider.last_successful_fetch = datetime.utcnow()
            mock_provider.total_requests = provider_id * 5
            mock_provider.successful_requests = provider_id * 4
            
            # Simulate some processing
            for _ in range(10):
                _ = mock_provider.to_dict()
            
            return mock_provider.to_dict()
        
        start_time = time.time()
        
        # Use thread pool for concurrent operations
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = []
            for i in range(1000):
                future = executor.submit(create_and_process_provider, i)
                futures.append(future)
            
            # Wait for all operations to complete
            results = [future.result() for future in futures]
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Performance assertions
        assert len(results) == 1000
        assert all(isinstance(result, dict) for result in results)
        assert processing_time < 15.0  # Should process 1000 concurrent operations in < 15 seconds
        
        operations_per_second = 1000 / processing_time
        print(f"Concurrent provider operations: {operations_per_second:.1f} ops/second")


# ============================================================================
# ASYNC PERFORMANCE TESTS
# ============================================================================

class TestAsyncPerformance:
    """Test async operation performance"""
    
    @pytest.mark.asyncio
    async def test_rationale_service_load(self):
        """Test rationale service under load"""
        service = PortfolioRationaleService()
        
        # Mock the LLM service for consistent performance
        with patch.object(service, '_call_llm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = {
                "narrative": "Load test narrative",
                "key_points": ["Point 1", "Point 2", "Point 3"],
                "confidence": 0.82
            }
            
            start_time = time.time()
            
            # Generate 100 rationales with controlled concurrency
            semaphore = asyncio.Semaphore(20)  # Limit concurrent operations
            
            async def generate_with_semaphore(request_id: int):
                async with semaphore:
                    request = RationaleRequest(
                        rationale_type=RationaleType.PORTFOLIO_SUMMARY,
                        portfolio_data={"id": request_id, "value": request_id * 1000}
                    )
                    return await service.generate_rationale(request)
            
            # Create tasks for concurrent execution
            tasks = [generate_with_semaphore(i) for i in range(100)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Count successful results
            successful_results = [r for r in results if not isinstance(r, Exception)]
            
            # Performance assertions
            assert len(successful_results) >= 50  # At least 50% should succeed
            assert processing_time < 30.0  # Should complete in < 30 seconds
            
            rationales_per_second = len(successful_results) / processing_time
            print(f"Rationale generation under load: {rationales_per_second:.1f} rationales/second")
            print(f"Success rate: {len(successful_results)/100*100:.1f}%")
    
    @pytest.mark.asyncio
    async def test_concurrent_health_checks(self):
        """Test concurrent health check operations"""
        
        # Create mock providers
        providers = {}
        for i in range(50):
            provider = Mock()
            provider.provider_name = f"health_test_provider_{i}"
            provider.health_check = AsyncMock(return_value=True)
            providers[f"health_test_provider_{i}"] = provider
        
        start_time = time.time()
        
        # Perform concurrent health checks
        health_check_tasks = [
            provider.health_check() for provider in providers.values()
        ]
        
        health_results = await asyncio.gather(*health_check_tasks)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Performance assertions
        assert len(health_results) == 50
        assert all(health_results)  # All should be healthy
        assert processing_time < 5.0  # Should complete in < 5 seconds
        
        health_checks_per_second = len(health_results) / processing_time
        print(f"Concurrent health checks: {health_checks_per_second:.1f} checks/second")


# ============================================================================
# STRESS TESTS
# ============================================================================

class TestStressScenarios:
    """Stress test scenarios for extreme conditions"""
    
    def test_large_response_payload(self, perf_client, mock_fast_services):
        """Test handling of large response payloads"""
        
        # Create mock registry with many providers
        large_provider_data = {f"provider_{i}": {"status": "active"} for i in range(2000)}
        mock_fast_services["provider_registry"].get_all_provider_status.return_value = large_provider_data
        
        with patch('backend.routes.streaming.streaming_api.provider_registry', mock_fast_services["provider_registry"]):
            start_time = time.time()
            
            response = perf_client.get("/streaming/providers")
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["data"]["providers"]) == 2000
            
            # Performance assertion - should handle large payloads efficiently
            assert processing_time < 10.0  # Should return 2000 providers in < 10 seconds
            
            response_size_mb = len(response.content) / 1024 / 1024
            print(f"Large response payload: {response_size_mb:.2f} MB in {processing_time:.3f}s")
    
    def test_rapid_fire_requests(self, perf_client, mock_fast_services):
        """Test rapid fire requests to stress the system"""
        
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_fast_services["market_streamer"]):
            with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_fast_services["rationale_service"]):
                
                start_time = time.time()
                
                # Make rapid fire health check requests
                responses = []
                for _ in range(500):
                    response = perf_client.get("/streaming/health")
                    responses.append(response)
                
                end_time = time.time()
                processing_time = end_time - start_time
                
                # Performance assertions
                assert all(r.status_code == 200 for r in responses)
                assert processing_time < 20.0  # Should handle 500 rapid requests in < 20 seconds
                
                requests_per_second = len(responses) / processing_time
                print(f"Rapid fire requests: {requests_per_second:.1f} requests/second")


# ============================================================================
# TEST CONFIGURATION
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async performance tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


def pytest_configure(config):
    """Configure pytest for performance tests"""
    config.addinivalue_line("markers", "performance: mark test as performance test")
    config.addinivalue_line("markers", "stress: mark test as stress test")
    config.addinivalue_line("markers", "asyncio: mark test as async")


if __name__ == "__main__":
    # Run performance tests
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "-m", "performance",
        "--asyncio-mode=auto"
    ])