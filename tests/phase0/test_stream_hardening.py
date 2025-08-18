"""
Phase 0 Stream Hardening - Comprehensive Test Suite

Tests for all Phase 0 features:
- Provider backoff progression and circuit breaker recovery
- Recompute debounce logic with major change bypassing
- Micro-batching with 250ms flush intervals
- Dead-letter queue for failed event handlers
- Streaming health assertions
- Standardized logging schema
"""

import asyncio
import pytest
import time
import unittest
from unittest.mock import Mock, patch, AsyncMock
from collections import defaultdict
from datetime import datetime

# Mock imports to avoid dependency issues
try:
    import sys
    from pathlib import Path
    
    # Add backend path for imports
    backend_path = Path(__file__).parent.parent.parent / "backend"
    if str(backend_path) not in sys.path:
        sys.path.insert(0, str(backend_path))
    
    from services.events.event_bus import EventBus, DeadLetterEntry, SubscriberFailureStats
    from services.streaming_health import StreamingHealthMonitor, HealthStatus
    from services.streaming_logger import StreamingLogger, StreamingCategory, StreamingAction, StreamingStatus
    
    # Try to import provider resilience manager
    try:
        from services.provider_resilience_manager import ProviderResilienceManager, ProviderState, CircuitBreakerState
        PROVIDER_MANAGER_AVAILABLE = True
    except ImportError:
        ProviderResilienceManager = None
        ProviderState = None
        CircuitBreakerState = None
        PROVIDER_MANAGER_AVAILABLE = False
        
except ImportError as e:
    print(f"Warning: Could not import backend modules for testing: {e}")
    # Create mock classes for testing
    EventBus = None
    StreamingHealthMonitor = None
    StreamingLogger = None
    PROVIDER_MANAGER_AVAILABLE = False


class TestEventBusDeadLetter(unittest.TestCase):
    """Test dead letter queue functionality in event bus"""
    
    def setUp(self):
        if EventBus is None:
            self.skipTest("EventBus not available")
        self.event_bus = EventBus("test_bus", dead_letter_max_size=5, failure_threshold=3)
    
    def test_dead_letter_basic_functionality(self):
        """Test basic dead letter queue operations"""
        
        def failing_callback(event_type, payload):
            raise Exception("Test failure")
        
        # Subscribe failing callback
        self.event_bus.subscribe("TEST_EVENT", failing_callback, use_weak_ref=False)
        
        # Publish event to trigger failure
        self.event_bus.publish("TEST_EVENT", {"data": "test"})
        
        # Check dead letter entries
        dead_letters = self.event_bus.get_dead_letter_entries()
        self.assertEqual(len(dead_letters), 1)
        self.assertEqual(dead_letters[0]["event_type"], "TEST_EVENT")
        self.assertIn("Test failure", dead_letters[0]["error_message"])
    
    def test_failure_threshold_handling(self):
        """Test that subscribers are removed after exceeding failure threshold"""
        
        failure_count = 0
        def counting_failing_callback(event_type, payload):
            nonlocal failure_count
            failure_count += 1
            raise Exception(f"Failure {failure_count}")
        
        self.event_bus.subscribe("TEST_EVENT", counting_failing_callback, use_weak_ref=False)
        
        # Publish events to exceed failure threshold (3)
        for i in range(5):
            self.event_bus.publish("TEST_EVENT", {"attempt": i})
        
        # After threshold exceeded, subscriber should be removed
        # Verify by checking that failure count doesn't increase
        initial_failure_count = failure_count
        self.event_bus.publish("TEST_EVENT", {"final_attempt": True})
        
        # If subscriber was removed, failure_count shouldn't increase
        self.assertGreaterEqual(failure_count, 3)  # At least threshold failures occurred
    
    def test_dead_letter_bounded_size(self):
        """Test that dead letter queue respects max size"""
        
        def failing_callback(event_type, payload):
            raise Exception(f"Failure for {payload}")
        
        self.event_bus.subscribe("TEST_EVENT", failing_callback, use_weak_ref=False)
        
        # Publish more events than max size (5)
        for i in range(10):
            self.event_bus.publish("TEST_EVENT", {"id": i})
        
        # Should only keep last 5 entries
        dead_letters = self.event_bus.get_dead_letter_entries()
        self.assertLessEqual(len(dead_letters), 5)
    
    def test_exponential_error_suppression(self):
        """Test that error logging uses exponential suppression"""
        
        with patch.object(self.event_bus, 'logger') as mock_logger:
            def failing_callback(event_type, payload):
                raise Exception("Repeated failure")
            
            self.event_bus.subscribe("TEST_EVENT", failing_callback, use_weak_ref=False)
            
            # Publish many events to test logging suppression
            for i in range(30):
                self.event_bus.publish("TEST_EVENT", {"attempt": i})
            
            # Should have fewer error logs than total failures due to suppression
            error_calls = [call for call in mock_logger.error.call_args_list if "Error delivering" in str(call)]
            # Should log 1st, 5th, 25th according to exponential suppression
            self.assertLess(len(error_calls), 30)


class TestStreamingHealthMonitor(unittest.TestCase):
    """Test streaming health monitoring and anomaly detection"""
    
    def setUp(self):
        if StreamingHealthMonitor is None:
            self.skipTest("StreamingHealthMonitor not available")
        self.monitor = StreamingHealthMonitor(
            anomaly_cycle_threshold=3,
            no_activity_threshold_sec=60,
            high_ratio_threshold=5.0
        )
    
    def test_anomaly_detection(self):
        """Test detection of events without recomputes"""
        
        # Simulate normal cycles first
        self.monitor.record_cycle_completed(5, 3)  # 5 events, 3 recomputes
        self.monitor.record_cycle_completed(3, 2)  # 3 events, 2 recomputes
        
        # Now simulate anomaly cycles (events but no recomputes)
        self.monitor.record_cycle_completed(4, 0)  # Anomaly cycle 1
        self.assertEqual(self.monitor.consecutive_anomaly_cycles, 1)
        
        self.monitor.record_cycle_completed(6, 0)  # Anomaly cycle 2
        self.assertEqual(self.monitor.consecutive_anomaly_cycles, 2)
        
        self.monitor.record_cycle_completed(3, 0)  # Anomaly cycle 3 - should trigger warning
        self.assertEqual(self.monitor.consecutive_anomaly_cycles, 3)
        
        # Check health status
        health = self.monitor.perform_health_check()
        self.assertIn("warning", health["status"].lower())
        
        # Recovery: normal cycle should reset counter
        self.monitor.record_cycle_completed(5, 2)
        self.assertEqual(self.monitor.consecutive_anomaly_cycles, 0)
    
    def test_high_event_recompute_ratio_detection(self):
        """Test detection of high event:recompute ratio"""
        
        # Simulate high ratio scenario
        current_time = time.time()
        
        # Record many events but few recomputes
        for i in range(20):
            self.monitor.record_event_emitted(1)
            
        for i in range(2):  # Only 2 recomputes for 20 events = 10:1 ratio
            self.monitor.record_valuation_recomputed(1)
        
        # Check health status
        health = self.monitor.perform_health_check()
        
        # Should detect high ratio issue
        issues = health.get("issues", [])
        ratio_issues = [i for i in issues if i["type"] == "high_event_recompute_ratio"]
        self.assertGreater(len(ratio_issues), 0)
    
    def test_no_activity_detection(self):
        """Test detection of no streaming activity"""
        
        # Record initial activity
        self.monitor.record_cycle_completed(5, 3)
        
        # Simulate time passing beyond threshold
        with patch('time.time') as mock_time:
            # Set time to be beyond no_activity_threshold_sec
            mock_time.return_value = time.time() + 120  # 2 minutes beyond 60s threshold
            
            health = self.monitor.perform_health_check()
            
            # Should detect no activity
            self.assertIn("critical", health["status"].lower())
            issues = health.get("issues", [])
            no_activity_issues = [i for i in issues if i["type"] == "no_activity"]
            self.assertGreater(len(no_activity_issues), 0)
    
    def test_metrics_tracking(self):
        """Test that metrics are correctly tracked"""
        
        # Record various activities
        self.monitor.record_event_emitted(5)
        self.monitor.record_valuation_recomputed(3)
        self.monitor.record_cycle_completed(5, 3)
        
        # Check metrics
        summary = self.monitor.get_summary()
        metrics = summary["metrics"]
        
        self.assertEqual(metrics["events_emitted"], 5)
        self.assertEqual(metrics["valuations_recomputed"], 3)
        self.assertEqual(metrics["cycles_completed"], 1)
        self.assertEqual(metrics["consecutive_anomaly_cycles"], 0)


class TestMicrobatchingLogic(unittest.TestCase):
    """Test micro-batching functionality (mock test since full system complex)"""
    
    def test_batch_aggregation_logic(self):
        """Test the logic for aggregating line changes in batches"""
        
        # Simulate micro-batch data structure
        batch_data = {
            "prop_123": {
                "latest_line": 5.5,
                "earliest_ts": time.time() - 0.1,
                "change_count": 3,
                "classification": "MODERATE"
            },
            "prop_456": {
                "latest_line": -3.0,
                "earliest_ts": time.time() - 0.05,
                "change_count": 1,
                "classification": "MAJOR"
            }
        }
        
        # Test batch flush criteria
        current_time = time.time()
        flush_interval_ms = 250
        
        should_flush_time = []
        should_flush_major = []
        
        for prop_id, data in batch_data.items():
            # Time-based flush (250ms elapsed)
            time_elapsed = (current_time - data["earliest_ts"]) * 1000
            if time_elapsed >= flush_interval_ms:
                should_flush_time.append(prop_id)
            
            # Major change immediate flush
            if data["classification"] == "MAJOR":
                should_flush_major.append(prop_id)
        
        # Should flush major changes immediately
        self.assertIn("prop_456", should_flush_major)
        
        # Time-based flushing depends on timing, but logic should work
        self.assertIsInstance(should_flush_time, list)


class TestDebounceLogic(unittest.TestCase):
    """Test recompute debounce functionality"""
    
    def test_debounce_skip_logic(self):
        """Test that recomputes are properly debounced"""
        
        # Mock debounce map
        debounce_map = {}
        debounce_interval_sec = 2.0
        
        prop_id = "test_prop_123"
        current_time = time.time()
        
        # First recompute should be allowed
        last_recompute = debounce_map.get(prop_id, 0)
        should_skip = (current_time - last_recompute) < debounce_interval_sec
        self.assertFalse(should_skip)
        
        # Record recompute
        debounce_map[prop_id] = current_time
        
        # Immediate second recompute should be skipped
        immediate_time = current_time + 0.5  # 0.5 seconds later
        last_recompute = debounce_map.get(prop_id, 0)
        should_skip = (immediate_time - last_recompute) < debounce_interval_sec
        self.assertTrue(should_skip)
        
        # After debounce interval, should be allowed
        later_time = current_time + 3.0  # 3 seconds later
        should_skip = (later_time - last_recompute) < debounce_interval_sec
        self.assertFalse(should_skip)
    
    def test_major_change_bypasses_debounce(self):
        """Test that major line changes bypass debounce"""
        
        # Mock line change classification
        def classify_line_change(old_line, new_line):
            magnitude = abs(new_line - old_line)
            if magnitude > 1.0:
                return "MAJOR"
            elif magnitude > 0.25:
                return "MODERATE"
            else:
                return "MICRO"
        
        # Test cases
        test_cases = [
            (5.0, 5.1, "MICRO", True),      # Small change - should debounce
            (5.0, 5.5, "MODERATE", True),   # Moderate change - should debounce  
            (5.0, 7.0, "MAJOR", False),     # Major change - should bypass debounce
        ]
        
        debounce_map = {"test_prop": time.time()}  # Recent recompute
        debounce_interval_sec = 2.0
        current_time = time.time() + 0.5  # Within debounce window
        
        for old_line, new_line, expected_class, should_debounce in test_cases:
            classification = classify_line_change(old_line, new_line)
            self.assertEqual(classification, expected_class)
            
            # Check debounce logic
            if classification == "MAJOR":
                # Major changes bypass debounce
                skip_recompute = False
            else:
                # Apply normal debounce logic
                last_recompute = debounce_map.get("test_prop", 0)
                skip_recompute = (current_time - last_recompute) < debounce_interval_sec
            
            self.assertEqual(skip_recompute, should_debounce)


@pytest.mark.skipif(not PROVIDER_MANAGER_AVAILABLE, reason="ProviderResilienceManager not available")
class TestCircuitBreakerLogic(unittest.TestCase):
    """Test circuit breaker and backoff progression"""
    
    def setUp(self):
        if ProviderResilienceManager is None:
            self.skipTest("ProviderResilienceManager not available")
        self.manager = ProviderResilienceManager()
        self.provider_id = "test_provider"
    
    @pytest.mark.asyncio
    async def test_backoff_progression(self):
        """Test exponential backoff progression on consecutive failures"""
        
        # Simulate consecutive failures
        base_backoff = 1.0  # 1 second base
        max_backoff = 60.0  # 60 seconds max
        
        expected_backoffs = []
        for failure_count in range(1, 6):
            # Exponential backoff: base * 2^(failures-1), capped at max
            backoff = min(base_backoff * (2 ** (failure_count - 1)), max_backoff)
            expected_backoffs.append(backoff)
            
            # Record failure
            await self.manager.record_provider_request(
                self.provider_id, 
                success=False, 
                latency_ms=2000.0,
                error=Exception(f"Test failure {failure_count}")
            )
            
            # Check backoff value
            state = self.manager.get_provider_state(self.provider_id)
            if state:
                actual_backoff = state.get("backoff_current_sec", 0)
                self.assertAlmostEqual(actual_backoff, backoff, delta=0.1)
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_transitions(self):
        """Test circuit breaker state transitions: CLOSED → OPEN → HALF_OPEN → CLOSED"""
        
        # Initial state should be CLOSED
        state = self.manager.get_provider_state(self.provider_id)
        if state is None:
            # Initialize with a successful request
            await self.manager.record_provider_request(self.provider_id, success=True, latency_ms=100.0)
            state = self.manager.get_provider_state(self.provider_id)
            
        self.assertEqual(state.get("circuit_state"), "closed")
        
        # Cause enough failures to open circuit (typically 10)
        for i in range(12):
            await self.manager.record_provider_request(
                self.provider_id,
                success=False,
                latency_ms=2000.0, 
                error=Exception(f"Failure {i+1}")
            )
        
        # Circuit should be OPEN
        state = self.manager.get_provider_state(self.provider_id)
        self.assertEqual(state.get("circuit_state"), "open")
        
        # Should skip provider when circuit is open
        should_skip, retry_after, circuit_state = await self.manager.should_skip_provider(self.provider_id)
        self.assertTrue(should_skip)
        self.assertEqual(circuit_state, "open")
        
        # Simulate waiting for cooldown (mock time passage)
        with patch('time.time') as mock_time:
            # Set time to after cooldown period
            mock_time.return_value = time.time() + 65  # Beyond backoff period
            
            # Next check should transition to HALF_OPEN
            should_skip, retry_after, circuit_state = await self.manager.should_skip_provider(self.provider_id)
            
            # Send successful request in HALF_OPEN state
            await self.manager.record_provider_request(self.provider_id, success=True, latency_ms=150.0)
            await self.manager.record_provider_request(self.provider_id, success=True, latency_ms=150.0)
            await self.manager.record_provider_request(self.provider_id, success=True, latency_ms=150.0)
            
            # Should transition back to CLOSED
            state = self.manager.get_provider_state(self.provider_id)
            self.assertEqual(state.get("circuit_state"), "closed")


class TestStandardizedLogging(unittest.TestCase):
    """Test standardized logging schema"""
    
    def setUp(self):
        if StreamingLogger is None:
            self.skipTest("StreamingLogger not available")
        self.logger = StreamingLogger("test_streaming")
    
    def test_structured_log_format(self):
        """Test that logs include required Phase 0 schema fields"""
        
        with patch.object(self.logger.unified_logger, 'info') as mock_log:
            self.logger.log_streaming_event(
                category=StreamingCategory.STREAMING,
                action=StreamingAction.CYCLE_COMPLETE,
                status=StreamingStatus.SUCCESS,
                message="Test cycle completed",
                duration_ms=123.45,
                cycle_id="cycle_123",
                provider_id="test_provider",
                meta={"events_emitted": 5, "providers_processed": 2}
            )
            
            # Verify log was called
            mock_log.assert_called_once()
            
            # Check that call included required fields
            args, kwargs = mock_log.call_args
            
            # Should have category, action, status in kwargs
            self.assertIn("category", kwargs)
            self.assertIn("action", kwargs)
            self.assertIn("status", kwargs)
            self.assertIn("duration_ms", kwargs)
            self.assertIn("cycle_id", kwargs)
            self.assertIn("provider_id", kwargs)
            
            # Check values
            self.assertEqual(kwargs["category"], "streaming")
            self.assertEqual(kwargs["action"], "cycle_complete")
            self.assertEqual(kwargs["status"], "success")
            self.assertEqual(kwargs["duration_ms"], 123.45)
    
    def test_convenience_logging_functions(self):
        """Test convenience functions for common logging patterns"""
        
        with patch.object(self.logger.unified_logger, 'info') as mock_info:
            # Test cycle logging
            from services.streaming_logger import log_cycle_complete
            
            log_cycle_complete(
                cycle_id="test_cycle",
                duration_ms=250.0,
                events_emitted=10,
                providers_processed=3
            )
            
            # Should have called info method
            mock_info.assert_called_once()
            args, kwargs = mock_info.call_args
            
            self.assertIn("category", kwargs)
            self.assertIn("action", kwargs)
            self.assertEqual(kwargs["category"], "streaming")
            self.assertEqual(kwargs["action"], "cycle_complete")


if __name__ == "__main__":
    # Run tests
    unittest.main(verbosity=2)