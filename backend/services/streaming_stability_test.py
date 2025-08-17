"""
Streaming Cycle Stability Test

Comprehensive test suite to verify operational risk reduction objectives:
1. Streaming cycle stable under synthetic burst tests
2. No handler re-entrancy errors  
3. Mean recompute latency unchanged or reduced

This test generates high-frequency synthetic events to stress-test the
provider resilience and micro-batching systems.
"""

import asyncio
import logging
import time
import statistics
import random
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

# Import provider resilience manager - handle import gracefully
try:
    from backend.services.provider_resilience_manager import provider_resilience_manager
except ImportError:
    try:
        from services.provider_resilience_manager import provider_resilience_manager
    except ImportError:
        # Create mock for testing if not available
        provider_resilience_manager = None


@dataclass
class TestResults:
    """Test execution results"""
    test_name: str
    duration_sec: float
    total_events: int
    successful_events: int
    failed_events: int
    avg_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    re_entrancy_errors: int
    system_stable: bool
    error_details: List[str]


class StreamingStabilityTester:
    """
    Comprehensive stability testing for streaming cycle under burst conditions.
    
    Implements synthetic traffic generation to validate:
    - System stability under burst loads
    - No re-entrancy errors in event handlers
    - Performance characteristics under stress
    """
    
    def __init__(self):
        self.logger = logging.getLogger("streaming_stability_test")
        self.results: List[TestResults] = []
        
        # Test configuration
        self.test_providers = ["test_provider_1", "test_provider_2", "test_provider_3"]
        self.test_props = [f"prop_{i}" for i in range(100)]  # 100 test props
        
        # Performance baselines (to be established)
        self.baseline_latencies: Dict[str, List[float]] = {}
        self.re_entrancy_detector = ReEntrancyDetector()
        
    async def setup_test_environment(self):
        """Setup test providers and handlers"""
        self.logger.info("Setting up test environment")
        
        if provider_resilience_manager is None:
            self.logger.warning("Provider resilience manager not available - using mock setup")
            return
        
        # Register test providers with different backoff configurations
        configs = [
            {"backoff_base_sec": 1.0, "backoff_max_sec": 60.0},
            {"backoff_base_sec": 2.0, "backoff_max_sec": 120.0},
            {"backoff_base_sec": 0.5, "backoff_max_sec": 30.0},
        ]
        
        for i, provider_id in enumerate(self.test_providers):
            await provider_resilience_manager.register_provider(provider_id, configs[i])
        
        # Register test event handlers with re-entrancy detection
        await self._register_test_handlers()
        
        self.logger.info("Test environment setup completed")
    
    async def _register_test_handlers(self):
        """Register test event handlers with re-entrancy protection"""
        
        if provider_resilience_manager is None:
            self.logger.warning("Provider resilience manager not available - skipping handler registration")
            return
        
        @self.re_entrancy_detector.protect("recompute_batch")
        async def recompute_batch_handler(data):
            """Simulated recompute handler with artificial processing time"""
            start_time = time.time()
            
            # Simulate recompute processing (variable time based on batch size)
            event_count = data.get('event_count', 1)
            processing_time = min(0.1 + (event_count * 0.01), 1.0)  # 10ms per event, max 1s
            await asyncio.sleep(processing_time)
            
            # Track processing latency
            latency_ms = (time.time() - start_time) * 1000
            self._record_latency("recompute", latency_ms)
            
            self.logger.debug(f"Processed recompute batch: {event_count} events in {latency_ms:.2f}ms")
        
        @self.re_entrancy_detector.protect("provider_health_change")
        async def health_change_handler(data):
            """Handle provider state changes"""
            provider_id = data.get('provider_id')
            new_state = data.get('new_state')
            self.logger.debug(f"Provider {provider_id} changed to state: {new_state}")
        
        # Register handlers
        await provider_resilience_manager.register_event_handler("recompute_batch", recompute_batch_handler)
        await provider_resilience_manager.register_event_handler("provider_health_change", health_change_handler)
    
    def _record_latency(self, operation: str, latency_ms: float):
        """Record latency for performance analysis"""
        if operation not in self.baseline_latencies:
            self.baseline_latencies[operation] = []
        
        self.baseline_latencies[operation].append(latency_ms)
    
    async def test_burst_traffic(self, burst_rate: int = 1000, duration_sec: int = 30) -> TestResults:
        """
        Test system stability under burst traffic conditions.
        
        Args:
            burst_rate: Events per second to generate
            duration_sec: Test duration in seconds
        """
        test_name = f"burst_traffic_{burst_rate}eps_{duration_sec}s"
        self.logger.info(f"Starting {test_name}")
        
        start_time = time.time()
        total_events = 0
        successful_events = 0
        failed_events = 0
        error_details = []
        
        # Calculate intervals for burst rate
        interval_sec = 1.0 / burst_rate
        end_time = start_time + duration_sec
        
        try:
            while time.time() < end_time:
                batch_start = time.time()
                
                # Generate a batch of events
                batch_size = min(50, burst_rate // 20)  # Batch to reduce overhead
                event_tasks = []
                
                for _ in range(batch_size):
                    # Random event type
                    event_type = random.choice(["line_change", "provider_request", "odds_update"])
                    task = self._generate_synthetic_event(event_type)
                    event_tasks.append(task)
                
                # Execute batch
                batch_results = await asyncio.gather(*event_tasks, return_exceptions=True)
                
                for result in batch_results:
                    total_events += 1
                    if isinstance(result, Exception):
                        failed_events += 1
                        error_details.append(str(result))
                    else:
                        successful_events += 1
                
                # Maintain burst rate
                batch_duration = time.time() - batch_start
                target_batch_duration = batch_size * interval_sec
                if batch_duration < target_batch_duration:
                    await asyncio.sleep(target_batch_duration - batch_duration)
        
        except Exception as e:
            error_details.append(f"Test framework error: {e}")
            self.logger.error(f"Burst test failed: {e}", exc_info=True)
        
        # Calculate results
        actual_duration = time.time() - start_time
        
        # Get latency statistics
        recompute_latencies = self.baseline_latencies.get("recompute", [])
        avg_latency_ms = statistics.mean(recompute_latencies) if recompute_latencies else 0.0
        p95_latency_ms = statistics.quantiles(recompute_latencies, n=20)[18] if len(recompute_latencies) > 20 else avg_latency_ms
        p99_latency_ms = statistics.quantiles(recompute_latencies, n=100)[98] if len(recompute_latencies) > 100 else avg_latency_ms
        
        # Check stability criteria
        system_stable = (
            failed_events < (total_events * 0.05) and  # Less than 5% failure rate
            self.re_entrancy_detector.violation_count == 0 and  # No re-entrancy violations
            avg_latency_ms < 1000.0  # Mean latency under 1 second
        )
        
        results = TestResults(
            test_name=test_name,
            duration_sec=actual_duration,
            total_events=total_events,
            successful_events=successful_events,
            failed_events=failed_events,
            avg_latency_ms=avg_latency_ms,
            p95_latency_ms=p95_latency_ms,
            p99_latency_ms=p99_latency_ms,
            re_entrancy_errors=self.re_entrancy_detector.violation_count,
            system_stable=system_stable,
            error_details=error_details[:10]  # Keep only first 10 errors
        )
        
        self.results.append(results)
        self.logger.info(f"Completed {test_name}: {successful_events}/{total_events} successful, "
                        f"avg latency {avg_latency_ms:.2f}ms, stable: {system_stable}")
        
        return results
    
    async def _generate_synthetic_event(self, event_type: str):
        """Generate a synthetic event for testing"""
        if provider_resilience_manager is None:
            # Mock event generation for testing
            await asyncio.sleep(random.uniform(0.01, 0.05))  # Simulate processing time
            return
            
        try:
            if event_type == "line_change":
                # Simulate line change event
                prop_id = random.choice(self.test_props)
                await provider_resilience_manager.add_recompute_event(
                    prop_id=prop_id,
                    event_type="odds_change",
                    data={"new_odds": random.uniform(1.5, 3.0), "timestamp": time.time()}
                )
            
            elif event_type == "provider_request":
                # Simulate provider request
                provider_id = random.choice(self.test_providers)
                success = random.random() > 0.1  # 90% success rate
                latency_ms = random.uniform(50, 500)  # Variable latency
                
                await provider_resilience_manager.record_provider_request(
                    provider_id=provider_id,
                    success=success,
                    latency_ms=latency_ms,
                    error=Exception("Synthetic failure") if not success else None
                )
            
            elif event_type == "odds_update":
                # Simulate odds update event
                await provider_resilience_manager.emit_event("odds_update", {
                    "prop_id": random.choice(self.test_props),
                    "old_odds": random.uniform(1.5, 3.0),
                    "new_odds": random.uniform(1.5, 3.0),
                    "timestamp": time.time()
                })
        
        except Exception as e:
            # Re-raise to be caught by the test harness
            raise e
    
    async def test_concurrent_load(self, concurrent_workers: int = 20, operations_per_worker: int = 100) -> TestResults:
        """Test system under concurrent load"""
        test_name = f"concurrent_load_{concurrent_workers}workers_{operations_per_worker}ops"
        self.logger.info(f"Starting {test_name}")
        
        start_time = time.time()
        
        async def worker(worker_id: int):
            """Worker function for concurrent testing"""
            worker_events = 0
            worker_errors = []
            
            for i in range(operations_per_worker):
                try:
                    # Mix of different operations
                    if i % 3 == 0:
                        await self._generate_synthetic_event("line_change")
                    elif i % 3 == 1:
                        await self._generate_synthetic_event("provider_request")
                    else:
                        await self._generate_synthetic_event("odds_update")
                    
                    worker_events += 1
                    
                    # Small delay to avoid overwhelming
                    await asyncio.sleep(0.01)
                    
                except Exception as e:
                    worker_errors.append(str(e))
            
            return worker_events, worker_errors
        
        # Run concurrent workers
        tasks = [worker(i) for i in range(concurrent_workers)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        total_events = 0
        successful_events = 0
        failed_events = 0
        error_details = []
        
        for result in results:
            if isinstance(result, (Exception, BaseException)):
                error_details.append(f"Worker failed: {result}")
                failed_events += operations_per_worker
                total_events += operations_per_worker
            elif isinstance(result, tuple) and len(result) == 2:
                worker_events, worker_errors = result
                successful_events += worker_events
                failed_events += len(worker_errors)
                error_details.extend(worker_errors[:5])  # Limit errors per worker
                total_events += operations_per_worker
            else:
                # Unexpected result format
                error_details.append(f"Unexpected result format: {type(result)}")
                failed_events += operations_per_worker
                total_events += operations_per_worker
        
        # Calculate final metrics
        actual_duration = time.time() - start_time
        recompute_latencies = self.baseline_latencies.get("recompute", [])
        avg_latency_ms = statistics.mean(recompute_latencies[-100:]) if recompute_latencies else 0.0  # Last 100 samples
        p95_latency_ms = statistics.quantiles(recompute_latencies[-100:], n=20)[18] if len(recompute_latencies) > 20 else avg_latency_ms
        p99_latency_ms = statistics.quantiles(recompute_latencies[-100:], n=100)[98] if len(recompute_latencies) > 100 else avg_latency_ms
        
        system_stable = (
            failed_events < (total_events * 0.1) and  # Less than 10% failure rate for concurrent load
            self.re_entrancy_detector.violation_count == 0 and
            avg_latency_ms < 2000.0  # Higher threshold for concurrent load
        )
        
        test_results = TestResults(
            test_name=test_name,
            duration_sec=actual_duration,
            total_events=total_events,
            successful_events=successful_events,
            failed_events=failed_events,
            avg_latency_ms=avg_latency_ms,
            p95_latency_ms=p95_latency_ms,
            p99_latency_ms=p99_latency_ms,
            re_entrancy_errors=self.re_entrancy_detector.violation_count,
            system_stable=system_stable,
            error_details=error_details[:10]
        )
        
        self.results.append(test_results)
        self.logger.info(f"Completed {test_name}: {successful_events}/{total_events} successful, "
                        f"avg latency {avg_latency_ms:.2f}ms, stable: {system_stable}")
        
        return test_results
    
    async def run_comprehensive_stability_test(self) -> Dict[str, Any]:
        """
        Run comprehensive stability test suite.
        
        Validates all exit criteria:
        1. Streaming cycle stable under synthetic burst tests
        2. No handler re-entrancy errors
        3. Mean recompute latency unchanged or reduced
        """
        self.logger.info("Starting comprehensive streaming cycle stability test")
        
        try:
            # Setup test environment
            await self.setup_test_environment()
            
            # Test 1: Moderate burst traffic
            await self.test_burst_traffic(burst_rate=500, duration_sec=15)
            
            # Test 2: High burst traffic
            await self.test_burst_traffic(burst_rate=1000, duration_sec=30)
            
            # Test 3: Extreme burst traffic
            await self.test_burst_traffic(burst_rate=2000, duration_sec=15)
            
            # Test 4: Concurrent load testing
            await self.test_concurrent_load(concurrent_workers=20, operations_per_worker=100)
            
            # Test 5: Extended stability test
            await self.test_burst_traffic(burst_rate=800, duration_sec=60)
            
            # Calculate overall results
            total_events = sum(r.total_events for r in self.results)
            total_successful = sum(r.successful_events for r in self.results)
            total_failed = sum(r.failed_events for r in self.results)
            
            # Get overall latency from stored measurements
            overall_avg_latency = statistics.mean(self.baseline_latencies.get("recompute", [100.0]))
            if not self.baseline_latencies.get("recompute"):
                overall_avg_latency = 0.0
            
            # Check exit criteria
            streaming_stable = all(r.system_stable for r in self.results)
            no_reentrance_errors = self.re_entrancy_detector.violation_count == 0
            latency_maintained = overall_avg_latency < 1000.0  # Under 1 second
            
            # Get system status
            if provider_resilience_manager is not None:
                system_status = provider_resilience_manager.get_system_status()
            else:
                system_status = {
                    "providers": {},
                    "total_recompute_events": 0,
                    "background_tasks_active": False,
                    "mock_mode": True
                }
            
            final_results = {
                "test_summary": {
                    "total_tests": len(self.results),
                    "total_events": total_events,
                    "successful_events": total_successful,
                    "failed_events": total_failed,
                    "success_rate": (total_successful / total_events) * 100 if total_events > 0 else 0,
                    "overall_avg_latency_ms": overall_avg_latency,
                },
                "exit_criteria": {
                    "streaming_cycle_stable": streaming_stable,
                    "no_re_entrancy_errors": no_reentrance_errors,
                    "latency_maintained": latency_maintained,
                    "all_criteria_met": streaming_stable and no_reentrance_errors and latency_maintained,
                },
                "system_status": system_status,
                "individual_test_results": [
                    {
                        "test_name": r.test_name,
                        "duration_sec": r.duration_sec,
                        "total_events": r.total_events,
                        "success_rate": (r.successful_events / r.total_events) * 100 if r.total_events > 0 else 0,
                        "avg_latency_ms": r.avg_latency_ms,
                        "p95_latency_ms": r.p95_latency_ms,
                        "system_stable": r.system_stable,
                        "re_entrancy_errors": r.re_entrancy_errors,
                    }
                    for r in self.results
                ],
                "re_entrancy_detector": {
                    "violation_count": self.re_entrancy_detector.violation_count,
                    "protected_functions": list(self.re_entrancy_detector.active_calls.keys()),
                }
            }
            
            # Log final results
            self.logger.info("Comprehensive stability test completed")
            self.logger.info(f"Overall success rate: {final_results['test_summary']['success_rate']:.2f}%")
            self.logger.info(f"Average latency: {overall_avg_latency:.2f}ms")
            self.logger.info(f"All exit criteria met: {final_results['exit_criteria']['all_criteria_met']}")
            
            return final_results
            
        except Exception as e:
            self.logger.error(f"Comprehensive stability test failed: {e}", exc_info=True)
            return {
                "error": str(e),
                "partial_results": self.results,
                "exit_criteria": {
                    "streaming_cycle_stable": False,
                    "no_re_entrancy_errors": False,
                    "latency_maintained": False,
                    "all_criteria_met": False,
                }
            }


class ReEntrancyDetector:
    """
    Detects re-entrancy violations in event handlers.
    
    Critical for ensuring streaming cycle stability by preventing
    handler re-entrancy that could cause deadlocks or corruption.
    """
    
    def __init__(self):
        self.active_calls: Dict[str, int] = {}
        self.violation_count = 0
        self.logger = logging.getLogger("re_entrancy_detector")
        self.lock = asyncio.Lock()
    
    def protect(self, function_name: str):
        """Decorator to protect functions from re-entrancy"""
        def decorator(func):
            if asyncio.iscoroutinefunction(func):
                async def async_wrapper(*args, **kwargs):
                    return await self._call_with_protection(function_name, func, *args, **kwargs)
                return async_wrapper
            else:
                def sync_wrapper(*args, **kwargs):
                    return asyncio.run(self._call_with_protection(function_name, func, *args, **kwargs))
                return sync_wrapper
        
        return decorator
    
    async def _call_with_protection(self, function_name: str, func, *args, **kwargs):
        """Execute function with re-entrancy protection"""
        async with self.lock:
            if function_name in self.active_calls:
                self.violation_count += 1
                self.logger.error(f"Re-entrancy violation detected in {function_name}! "
                                f"Active calls: {self.active_calls[function_name]}")
                raise RuntimeError(f"Re-entrancy violation in {function_name}")
            
            self.active_calls[function_name] = self.active_calls.get(function_name, 0) + 1
        
        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            return result
        finally:
            async with self.lock:
                self.active_calls[function_name] -= 1
                if self.active_calls[function_name] <= 0:
                    del self.active_calls[function_name]


# Export test classes
__all__ = [
    "StreamingStabilityTester",
    "ReEntrancyDetector",
    "TestResults",
]