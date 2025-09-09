"""
Tests for Instrumentation Service and Observability

Tests ensure the observability snapshot returns baseline keys even with zero data,
validates tracing functionality, error hashing, and metrics collection.
"""

import asyncio
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, Mock

from backend.services.instrumentation_service import (
    InstrumentationService,
    TraceSpan,
    ErrorHash,
    OperationMetrics,
    instrumentation_service,
    trace_ev_enrichment,
    trace_arbitrage_detection,
    trace_odds_normalization,
    trace_line_movement_snapshot,
    instrument_operation
)


class TestInstrumentationService:
    """Test suite for InstrumentationService"""
    
    @pytest.fixture
    def clean_service(self):
        """Provide a clean instrumentation service for each test"""
        service = InstrumentationService(max_spans=100, max_errors=50)
        service.clear_metrics()
        return service
    
    @pytest.mark.asyncio
    async def test_observability_snapshot_baseline_keys(self, clean_service):
        """Test that observability snapshot returns baseline keys even with zero data"""
        snapshot = await clean_service.get_observability_snapshot()
        
        # Verify baseline structure exists
        assert "timings" in snapshot
        assert "recentErrors" in snapshot
        assert "activeFlags" in snapshot
        
        # Verify all required timing keys are present
        timings = snapshot["timings"]
        required_timing_keys = ["ev_ms_avg", "arbitrage_ms_avg", "odds_norm_ms_avg", "line_movement_ms_avg"]
        for key in required_timing_keys:
            assert key in timings
            assert isinstance(timings[key], (int, float))
            assert timings[key] >= 0.0
        
        # Verify structure types
        assert isinstance(snapshot["recentErrors"], list)
        assert isinstance(snapshot["activeFlags"], dict)
        
        # Verify essential flag keys
        flags = snapshot["activeFlags"]
        essential_flags = ["tracing_enabled", "error_hashing_enabled", "metrics_collection_enabled"]
        for flag in essential_flags:
            assert flag in flags
        
        # With zero data, all timing averages should be 0.0
        for key in required_timing_keys:
            assert timings[key] == 0.0
        
        # Recent errors should be empty with clean service
        assert len(snapshot["recentErrors"]) == 0

    @pytest.mark.asyncio
    async def test_trace_operation_success(self, clean_service):
        """Test successful operation tracing"""
        async with clean_service.trace_operation("test_operation", tags={"test": "value"}) as span:
            assert span.operation == "test_operation"
            assert span.start_time > 0
            assert span.tags["test"] == "value"
            # Simulate some work
            await asyncio.sleep(0.01)
        
        # Verify span was completed
        assert span.end_time is not None
        assert span.duration_ms is not None
        assert span.duration_ms > 0
        assert span.success is True
        assert span.error is None
        
        # Verify metrics were updated
        snapshot = await clean_service.get_observability_snapshot()
        assert "test_operation" in snapshot["operationMetrics"]
        
        op_metrics = snapshot["operationMetrics"]["test_operation"]
        assert op_metrics["total_calls"] == 1
        assert op_metrics["success_rate"] == 1.0
        assert op_metrics["avg_duration_ms"] > 0

    @pytest.mark.asyncio
    async def test_trace_operation_failure(self, clean_service):
        """Test operation tracing with exception"""
        test_error = ValueError("Test error message")
        span = None
        
        with pytest.raises(ValueError):
            async with clean_service.trace_operation("failing_operation") as active_span:
                span = active_span
                assert span.operation == "failing_operation"
                # Simulate failure
                raise test_error
        
        # Verify span captured the error
        assert span is not None
        assert span.success is False
        assert span.error == str(test_error)
        assert span.duration_ms is not None
        
        # Verify error was hashed and tracked
        snapshot = await clean_service.get_observability_snapshot()
        assert len(snapshot["recentErrors"]) > 0
        
        recent_error = snapshot["recentErrors"][0]
        assert recent_error["operation"] == "failing_operation"
        assert recent_error["error_type"] == "ValueError"
        assert recent_error["error_message"] == "Test error message"

    @pytest.mark.asyncio
    async def test_error_hashing_groups_similar_errors(self, clean_service):
        """Test that similar errors are grouped by hash"""
        async def failing_function():
            raise ValueError("Same error message")
        
        # Generate multiple similar errors
        for i in range(3):
            try:
                async with clean_service.trace_operation(f"operation_{i}"):
                    await failing_function()
            except ValueError:
                pass
        
        snapshot = await clean_service.get_observability_snapshot()
        error_summaries = snapshot["errorSummaries"]
        
        # Should have one error hash for the similar errors
        assert len(error_summaries) == 1
        error_summary = error_summaries[0]
        assert error_summary["count"] == 3
        assert error_summary["error_type"] == "ValueError"

    @pytest.mark.asyncio
    async def test_ev_enrichment_tracing(self, clean_service):
        """Test EV enrichment operation tracing"""
        mock_enrichment_func = AsyncMock(return_value={"ev_percentage": 15.5})
        
        result = await clean_service.trace_ev_enrichment(
            player_id="player_123",
            market_type="home_runs",
            enrichment_func=mock_enrichment_func,
            some_arg="test"
        )
        
        assert result["ev_percentage"] == 15.5
        mock_enrichment_func.assert_called_once_with("test")
        
        # Verify trace was recorded
        snapshot = await clean_service.get_observability_snapshot()
        assert snapshot["timings"]["ev_ms_avg"] > 0
        assert "ev_enrichment" in snapshot["operationMetrics"]

    @pytest.mark.asyncio
    async def test_arbitrage_detection_tracing(self, clean_service):
        """Test arbitrage detection operation tracing"""
        odds_data = [
            {"sportsbook": "book1", "odds": 2.1, "event_id": "event1"},
            {"sportsbook": "book2", "odds": 1.9, "event_id": "event1"}
        ]
        
        mock_detection_func = Mock(return_value=[{"profit_percentage": 5.2}])
        
        result = await clean_service.trace_arbitrage_detection(
            odds_data=odds_data,
            detection_func=mock_detection_func
        )
        
        assert len(result) == 1
        assert result[0]["profit_percentage"] == 5.2
        mock_detection_func.assert_called_once_with(odds_data)
        
        # Verify trace was recorded
        snapshot = await clean_service.get_observability_snapshot()
        assert snapshot["timings"]["arbitrage_ms_avg"] > 0
        assert "arbitrage_detection" in snapshot["operationMetrics"]

    @pytest.mark.asyncio
    async def test_odds_normalization_tracing(self, clean_service):
        """Test odds normalization operation tracing"""
        raw_odds = [
            {"source": "api1", "odds": "+150", "format": "american"},
            {"source": "api2", "odds": "2.5", "format": "decimal"}
        ]
        
        mock_normalization_func = Mock(return_value=[
            {"normalized_odds": 2.5, "source": "api1"},
            {"normalized_odds": 2.5, "source": "api2"}
        ])
        
        result = await clean_service.trace_odds_normalization(
            raw_odds=raw_odds,
            normalization_func=mock_normalization_func
        )
        
        assert len(result) == 2
        assert all(item["normalized_odds"] == 2.5 for item in result)
        mock_normalization_func.assert_called_once_with(raw_odds)
        
        # Verify trace was recorded
        snapshot = await clean_service.get_observability_snapshot()
        assert snapshot["timings"]["odds_norm_ms_avg"] > 0
        assert "odds_normalization" in snapshot["operationMetrics"]

    @pytest.mark.asyncio
    async def test_line_movement_snapshot_tracing(self, clean_service):
        """Test line movement snapshot operation tracing"""
        mock_snapshot_func = AsyncMock(return_value={
            "movement_detected": True,
            "magnitude": 0.5,
            "direction": "up"
        })
        
        result = await clean_service.trace_line_movement_snapshot(
            sport="MLB",
            player="Mike Trout",
            market="home_runs",
            snapshot_func=mock_snapshot_func,
            line=2.5,
            odds=110
        )
        
        assert result["movement_detected"] is True
        assert result["magnitude"] == 0.5
        mock_snapshot_func.assert_called_once_with(line=2.5, odds=110)
        
        # Verify trace was recorded
        snapshot = await clean_service.get_observability_snapshot()
        assert snapshot["timings"]["line_movement_ms_avg"] > 0
        assert "line_movement_snapshot" in snapshot["operationMetrics"]

    @pytest.mark.asyncio
    async def test_operation_metrics_percentiles(self, clean_service):
        """Test that operation metrics calculate percentiles correctly"""
        # Generate varying durations for percentile calculation
        durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]  # ms
        
        for duration in durations:
            async with clean_service.trace_operation("perf_test"):
                # Simulate work for specific duration
                await asyncio.sleep(duration / 1000)  # Convert to seconds
        
        snapshot = await clean_service.get_observability_snapshot()
        perf_metrics = snapshot["operationMetrics"]["perf_test"]
        
        assert perf_metrics["total_calls"] == len(durations)
        assert perf_metrics["success_rate"] == 1.0
        assert perf_metrics["p95_duration_ms"] > perf_metrics["avg_duration_ms"]
        assert perf_metrics["p99_duration_ms"] > perf_metrics["p95_duration_ms"]

    @pytest.mark.asyncio
    async def test_feature_flag_updates(self, clean_service):
        """Test feature flag updates"""
        # Test updating existing flag
        success = clean_service.update_flag("tracing_enabled", False)
        assert success is True
        
        snapshot = await clean_service.get_observability_snapshot()
        assert snapshot["activeFlags"]["tracing_enabled"] is False
        
        # Test updating non-existent flag
        success = clean_service.update_flag("non_existent_flag", True)
        assert success is False

    @pytest.mark.asyncio
    async def test_tracing_disabled_fallback(self, clean_service):
        """Test that tracing gracefully handles disabled state"""
        # Disable tracing
        clean_service.update_flag("tracing_enabled", False)
        
        async with clean_service.trace_operation("disabled_test") as span:
            assert span.span_id == "disabled"
        
        # No metrics should be updated when tracing is disabled
        snapshot = await clean_service.get_observability_snapshot()
        assert "disabled_test" not in snapshot["operationMetrics"]

    @pytest.mark.asyncio
    async def test_span_sampling(self, clean_service):
        """Test span sampling functionality"""
        # Set low sampling rate
        clean_service.update_flag("span_sampling_rate", 0.0)
        
        async with clean_service.trace_operation("sampled_test") as span:
            assert span.span_id == "sampled_out"
        
        # No metrics should be updated when sampled out
        snapshot = await clean_service.get_observability_snapshot()
        assert "sampled_test" not in snapshot["operationMetrics"]

    @pytest.mark.asyncio
    async def test_instrumentation_health(self, clean_service):
        """Test instrumentation service health reporting"""
        health = await clean_service.get_health_status()
        
        assert health["status"] == "healthy"
        assert "active_spans" in health
        assert "completed_spans" in health
        assert "tracked_operations" in health
        assert "error_hashes" in health
        assert "recent_errors" in health
        assert "flags" in health
        assert "last_health_check" in health

    def test_decorator_instrumentation(self, clean_service):
        """Test automatic instrumentation via decorator"""
        @instrument_operation("decorated_operation", tags={"type": "test"})
        def sync_function(x, y):
            return x + y
        
        @instrument_operation("async_decorated_operation")
        async def async_function(x, y):
            return x * y
        
        # Test sync function
        result = sync_function(2, 3)
        assert result == 5
        
        # Test async function
        async def test_async():
            result = await async_function(4, 5)
            assert result == 20
        
        asyncio.run(test_async())

    @pytest.mark.asyncio
    async def test_error_stack_normalization(self, clean_service):
        """Test that stack trace normalization works correctly"""
        # Create a function that will generate a stack trace
        async def deep_function():
            def level1():
                def level2():
                    raise RuntimeError("Deep error")
                level2()
            level1()
        
        try:
            async with clean_service.trace_operation("deep_error_test"):
                await deep_function()
        except RuntimeError:
            pass
        
        snapshot = await clean_service.get_observability_snapshot()
        error_summaries = snapshot["errorSummaries"]
        
        assert len(error_summaries) > 0
        error_summary = error_summaries[0]
        assert error_summary["error_type"] == "RuntimeError"
        assert "hash" in error_summary
        assert len(error_summary["hash"]) > 0

    @pytest.mark.asyncio
    async def test_timing_aggregates_update(self, clean_service):
        """Test that timing aggregates are updated correctly"""
        # Perform operations of each type
        async with clean_service.trace_operation("ev_enrichment"):
            await asyncio.sleep(0.01)
        
        async with clean_service.trace_operation("arbitrage_detection"):
            await asyncio.sleep(0.02)
        
        async with clean_service.trace_operation("odds_normalization"):
            await asyncio.sleep(0.015)
        
        async with clean_service.trace_operation("line_movement_snapshot"):
            await asyncio.sleep(0.005)
        
        snapshot = await clean_service.get_observability_snapshot()
        timings = snapshot["timings"]
        
        # All timing averages should be > 0 after operations
        assert timings["ev_ms_avg"] > 0
        assert timings["arbitrage_ms_avg"] > 0
        assert timings["odds_norm_ms_avg"] > 0
        assert timings["line_movement_ms_avg"] > 0

    @pytest.mark.asyncio
    async def test_clear_metrics_functionality(self, clean_service):
        """Test that clear_metrics resets all data"""
        # Generate some data
        async with clean_service.trace_operation("test_clear"):
            pass
        
        try:
            async with clean_service.trace_operation("test_error"):
                raise ValueError("Test error")
        except ValueError:
            pass
        
        # Verify data exists
        snapshot = await clean_service.get_observability_snapshot()
        assert len(snapshot["operationMetrics"]) > 0
        assert len(snapshot["recentErrors"]) > 0
        
        # Clear metrics
        clean_service.clear_metrics()
        
        # Verify data is cleared but baseline structure remains
        snapshot = await clean_service.get_observability_snapshot()
        assert len(snapshot["operationMetrics"]) == 0
        assert len(snapshot["recentErrors"]) == 0
        
        # Baseline keys should still be present
        assert "timings" in snapshot
        timings = snapshot["timings"]
        for key in ["ev_ms_avg", "arbitrage_ms_avg", "odds_norm_ms_avg", "line_movement_ms_avg"]:
            assert key in timings
            assert timings[key] == 0.0


class TestConvenienceFunctions:
    """Test convenience functions for tracing"""
    
    @pytest.mark.asyncio
    async def test_trace_ev_enrichment_convenience(self):
        """Test the convenience function for EV enrichment tracing"""
        mock_func = AsyncMock(return_value={"ev": 0.15})
        
        result = await trace_ev_enrichment("player1", "points", mock_func, arg1="value1")
        
        assert result["ev"] == 0.15
        mock_func.assert_called_once_with(arg1="value1")

    @pytest.mark.asyncio
    async def test_trace_arbitrage_detection_convenience(self):
        """Test the convenience function for arbitrage detection tracing"""
        odds_data = [{"book": "test", "odds": 2.0}]
        mock_func = Mock(return_value={"opportunities": []})
        
        result = await trace_arbitrage_detection(odds_data, mock_func)
        
        assert "opportunities" in result
        mock_func.assert_called_once_with(odds_data)

    @pytest.mark.asyncio
    async def test_trace_odds_normalization_convenience(self):
        """Test the convenience function for odds normalization tracing"""
        raw_odds = [{"odds": "+100"}]
        mock_func = Mock(return_value=[{"normalized": 2.0}])
        
        result = await trace_odds_normalization(raw_odds, mock_func)
        
        assert result[0]["normalized"] == 2.0
        mock_func.assert_called_once_with(raw_odds)

    @pytest.mark.asyncio
    async def test_trace_line_movement_snapshot_convenience(self):
        """Test the convenience function for line movement snapshot tracing"""
        mock_func = AsyncMock(return_value={"snapshot": "data"})
        
        result = await trace_line_movement_snapshot("MLB", "Player", "HR", mock_func, line=2.5)
        
        assert result["snapshot"] == "data"
        mock_func.assert_called_once_with(line=2.5)


class TestInstrumentationIntegration:
    """Integration tests for instrumentation service"""
    
    @pytest.mark.asyncio
    async def test_concurrent_operations(self):
        """Test that concurrent operations are tracked correctly"""
        clean_service = InstrumentationService()
        clean_service.clear_metrics()
        
        async def concurrent_operation(op_id: int):
            async with clean_service.trace_operation(f"concurrent_op_{op_id}"):
                await asyncio.sleep(0.01)
                return op_id
        
        # Run multiple concurrent operations
        tasks = [concurrent_operation(i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == 5
        assert results == list(range(5))
        
        # Verify all operations were tracked
        snapshot = await clean_service.get_observability_snapshot()
        for i in range(5):
            assert f"concurrent_op_{i}" in snapshot["operationMetrics"]

    @pytest.mark.asyncio
    async def test_nested_operations(self):
        """Test that nested operations are tracked independently"""
        clean_service = InstrumentationService()
        clean_service.clear_metrics()
        
        async with clean_service.trace_operation("outer_operation"):
            async with clean_service.trace_operation("inner_operation"):
                await asyncio.sleep(0.01)
        
        snapshot = await clean_service.get_observability_snapshot()
        assert "outer_operation" in snapshot["operationMetrics"]
        assert "inner_operation" in snapshot["operationMetrics"]
        
        # Outer operation should take longer than inner
        outer_time = snapshot["operationMetrics"]["outer_operation"]["avg_duration_ms"]
        inner_time = snapshot["operationMetrics"]["inner_operation"]["avg_duration_ms"]
        assert outer_time > inner_time


if __name__ == "__main__":
    pytest.main([__file__, "-v"])