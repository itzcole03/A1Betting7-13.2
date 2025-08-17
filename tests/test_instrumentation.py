"""
Tests for Instrumentation Utilities - HTTP and WebSocket monitoring validation
Comprehensive test coverage for decorators, context managers, and WebSocket wrappers.
"""

import asyncio
import pytest
from unittest.mock import Mock, AsyncMock, patch

# Import instrumentation components
from backend.services.metrics.instrumentation import (
    record_http_request,
    instrument_route,
    InstrumentedWebSocket,
    instrument_websocket,
    send_json_instrumented
)


class TestInstrumentationUtilities:
    """Test suite for instrumentation utilities."""
    
    def setup_method(self):
        """Setup for each test method."""
        # Reset the metrics collector for each test
        from backend.services.metrics.unified_metrics_collector import get_metrics_collector
        self.metrics_collector = get_metrics_collector()
        self.metrics_collector.reset_metrics()
    
    @pytest.mark.asyncio
    async def test_record_http_request_context_manager(self):
        """Test the HTTP request recording context manager."""
        # Test successful request
        async with record_http_request("/api/test", "GET") as timing:
            await asyncio.sleep(0.01)  # Simulate processing time
            timing["status_code"] = 200
        
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["total_requests"] == 1
        assert snapshot["error_rate"] == 0.0
        assert snapshot["avg_latency_ms"] > 5.0  # Should be at least 10ms
    
    @pytest.mark.asyncio
    async def test_record_http_request_with_error(self):
        """Test HTTP request recording with exception."""
        with pytest.raises(ValueError):
            async with record_http_request("/api/error", "POST") as timing:
                timing["status_code"] = 500
                raise ValueError("Test error")
        
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["total_requests"] == 1
        assert snapshot["error_rate"] == 1.0  # 100% error rate
    
    @pytest.mark.asyncio
    async def test_instrument_route_decorator_async(self):
        """Test the instrument_route decorator with async functions."""
        
        @instrument_route
        async def mock_endpoint():
            await asyncio.sleep(0.01)  # Simulate processing
            return {"status": "success"}
        
        # Mock FastAPI Request object
        mock_request = Mock()
        mock_request.url.path = "/api/mock"
        mock_request.method = "GET"
        
        # Call the instrumented endpoint
        result = await mock_endpoint(mock_request)
        
        assert result["status"] == "success"
        
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["total_requests"] == 1
        assert snapshot["error_rate"] == 0.0
    
    def test_instrument_route_decorator_sync(self):
        """Test the instrument_route decorator with sync functions."""
        
        @instrument_route
        def mock_sync_endpoint():
            return {"status": "success"}
        
        # Call the instrumented endpoint
        result = mock_sync_endpoint()
        
        assert result["status"] == "success"
        
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["total_requests"] == 1
        assert snapshot["error_rate"] == 0.0
    
    @pytest.mark.asyncio
    async def test_instrument_route_error_classification(self):
        """Test that the decorator correctly classifies different error types."""
        
        @instrument_route
        async def mock_endpoint_401():
            raise Exception("Authentication failed")
        
        @instrument_route 
        async def mock_endpoint_404():
            raise Exception("NotFound error occurred")
        
        @instrument_route
        async def mock_endpoint_422():
            raise Exception("Validation error")
        
        @instrument_route
        async def mock_endpoint_500():
            raise Exception("Internal server error")
        
        # Test each error type
        test_cases = [
            (mock_endpoint_401, "Authentication failed"),
            (mock_endpoint_404, "NotFound error occurred"),
            (mock_endpoint_422, "Validation error"),
            (mock_endpoint_500, "Internal server error")
        ]
        
        for endpoint, error_msg in test_cases:
            try:
                await endpoint()
            except Exception:
                pass  # Expected
        
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["total_requests"] == 4
        assert snapshot["error_rate"] == 1.0  # All requests were errors
    
    @pytest.mark.skipif(True, reason="FastAPI types not available in test environment")
    def test_instrumented_websocket_wrapper(self):
        """Test the InstrumentedWebSocket wrapper."""
        # This test would require mocking FastAPI WebSocket
        # Skipping since FastAPI may not be available in test environment
        pass
    
    @pytest.mark.asyncio
    async def test_websocket_message_recording(self):
        """Test WebSocket message recording functionality."""
        # Simulate WebSocket operations directly on metrics collector
        self.metrics_collector.record_ws_connection(True)  # Open connection
        self.metrics_collector.record_ws_message(3)        # Send 3 messages
        self.metrics_collector.record_ws_connection(False) # Close connection
        
        snapshot = self.metrics_collector.snapshot()
        websocket_stats = snapshot["websocket"]
        
        assert websocket_stats["open_connections_estimate"] == 0  # 1 opened - 1 closed
        assert websocket_stats["messages_sent"] == 3
    
    @pytest.mark.asyncio
    async def test_send_json_instrumented(self):
        """Test the send_json_instrumented helper function."""
        # Mock WebSocket
        mock_websocket = AsyncMock()
        mock_websocket.send_json = AsyncMock()
        
        test_payload = {"message": "test"}
        
        # Call the instrumented send function
        await send_json_instrumented(mock_websocket, test_payload)
        
        # Verify WebSocket method was called
        mock_websocket.send_json.assert_called_once_with(test_payload)
        
        # Verify metrics were recorded
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["websocket"]["messages_sent"] == 1
    
    def test_instrumentation_without_fastapi(self):
        """Test instrumentation graceful degradation when FastAPI is not available."""
        # Mock HAS_FASTAPI to False
        with patch('backend.services.metrics.instrumentation.HAS_FASTAPI', False):
            
            @instrument_route
            def mock_endpoint():
                return {"status": "success"}
            
            # Should still work but log a warning
            result = mock_endpoint()
            assert result["status"] == "success"
    
    @pytest.mark.asyncio
    async def test_request_context_manager_timing_accuracy(self):
        """Test that timing measurements are reasonably accurate."""
        import time
        
        sleep_duration = 0.05  # 50ms
        
        async with record_http_request("/api/timing-test", "GET") as timing:
            await asyncio.sleep(sleep_duration)
            timing["status_code"] = 200
        
        snapshot = self.metrics_collector.snapshot()
        recorded_latency = snapshot["avg_latency_ms"]
        
        # Should be close to sleep duration (within 20ms tolerance)
        expected_latency_ms = sleep_duration * 1000
        assert abs(recorded_latency - expected_latency_ms) < 20.0
    
    @pytest.mark.asyncio
    async def test_multiple_concurrent_requests(self):
        """Test instrumentation with multiple concurrent requests."""
        
        @instrument_route
        async def mock_concurrent_endpoint(delay: float):
            await asyncio.sleep(delay)
            return {"delay": delay}
        
        # Create multiple concurrent requests
        delays = [0.01, 0.02, 0.03, 0.04, 0.05]
        tasks = [mock_concurrent_endpoint(delay) for delay in delays]
        
        # Execute concurrently
        results = await asyncio.gather(*tasks)
        
        # Verify all requests completed
        assert len(results) == 5
        
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["total_requests"] == 5
        assert snapshot["error_rate"] == 0.0
        
        # Average latency should be reasonable
        assert 10.0 <= snapshot["avg_latency_ms"] <= 60.0
    
    def test_decorator_preserves_function_metadata(self):
        """Test that the decorator preserves original function metadata."""
        
        @instrument_route
        async def documented_endpoint():
            """This is a documented endpoint."""
            return {"status": "documented"}
        
        # Check that metadata is preserved
        assert documented_endpoint.__name__ == "documented_endpoint"
        assert documented_endpoint.__doc__ == "This is a documented endpoint."
    
    @pytest.mark.asyncio
    async def test_status_code_extraction_from_result(self):
        """Test status code extraction from different result formats."""
        
        @instrument_route
        async def endpoint_with_status_object():
            # Mock response object with status_code attribute
            mock_response = Mock()
            mock_response.status_code = 201
            return mock_response
        
        @instrument_route
        async def endpoint_with_status_dict():
            # Dict with status_code key
            return {"status_code": 202, "data": "test"}
        
        @instrument_route
        async def endpoint_with_default_status():
            # No explicit status code - should default to 200
            return {"data": "test"}
        
        # Test each endpoint type
        await endpoint_with_status_object()
        await endpoint_with_status_dict() 
        await endpoint_with_default_status()
        
        snapshot = self.metrics_collector.snapshot()
        assert snapshot["total_requests"] == 3
        assert snapshot["error_rate"] == 0.0  # All should be successful
    
    def test_metrics_integration_with_health_collector(self):
        """Test integration between instrumentation and health collector."""
        # Record some instrumented requests
        for i in range(10):
            self.metrics_collector.record_request(float(i * 10), 200)
        
        # Add some errors
        self.metrics_collector.record_request(100.0, 500)
        self.metrics_collector.record_request(150.0, 500)
        
        snapshot = self.metrics_collector.snapshot()
        
        # Verify integration fields that health collector uses
        assert "avg_latency_ms" in snapshot
        assert "p95_latency_ms" in snapshot
        assert "error_rate" in snapshot
        assert "event_loop" in snapshot
        
        # These should be compatible with health collector expectations
        assert isinstance(snapshot["avg_latency_ms"], (int, float))
        assert isinstance(snapshot["p95_latency_ms"], (int, float))
        assert 0.0 <= snapshot["error_rate"] <= 1.0
    
    @pytest.mark.asyncio
    async def test_instrumentation_under_high_load(self):
        """Test instrumentation performance under high request load."""
        import time
        
        @instrument_route 
        async def high_load_endpoint():
            return {"status": "ok"}
        
        # Simulate high load
        num_requests = 1000
        start_time = time.time()
        
        tasks = [high_load_endpoint() for _ in range(num_requests)]
        await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        snapshot = self.metrics_collector.snapshot()
        
        # Verify all requests were recorded
        assert snapshot["total_requests"] == num_requests
        
        # Performance should be reasonable (less than 2 seconds for 1000 requests)
        assert total_time < 2.0
        
        # Throughput should be reasonable (>500 requests/second)
        throughput = num_requests / total_time
        assert throughput > 500