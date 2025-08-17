"""
Provider Resilience Testing Module

Implements comprehensive testing scenarios for provider circuit breaker patterns,
forced failure testing, and recovery verification.
"""

import asyncio
import time
import logging
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum

from .provider_resilience_manager import provider_resilience_manager, ProviderState, CircuitBreakerState
from .unified_logging import get_logger


class TestScenario(Enum):
    """Test scenario types"""
    SINGLE_PROVIDER_OUTAGE = "single_provider_outage"
    MULTIPLE_PROVIDER_DEGRADATION = "multiple_provider_degradation"
    CIRCUIT_BREAKER_RECOVERY = "circuit_breaker_recovery"
    LOAD_BALANCING_FAILOVER = "load_balancing_failover"
    SLA_VIOLATION_DETECTION = "sla_violation_detection"


@dataclass
class TestResult:
    """Test execution result"""
    scenario: TestScenario
    success: bool
    duration_sec: float
    details: Dict[str, Any]
    error: Optional[str] = None


class MockProvider:
    """Mock provider for testing scenarios"""
    
    def __init__(self, provider_id: str, failure_mode: str = "none"):
        self.provider_id = provider_id
        self.failure_mode = failure_mode  # "none", "intermittent", "constant", "slow"
        self.request_count = 0
        self.logger = get_logger(f"mock_provider.{provider_id}")
    
    async def make_request(self) -> Dict[str, Any]:
        """Simulate provider request based on failure mode"""
        self.request_count += 1
        start_time = time.time()
        
        try:
            if self.failure_mode == "constant":
                # Always fail
                await asyncio.sleep(0.1)  # Simulate some processing
                raise Exception(f"Provider {self.provider_id} is down")
            
            elif self.failure_mode == "intermittent":
                # Fail 50% of the time
                if self.request_count % 2 == 0:
                    await asyncio.sleep(0.1)
                    raise Exception(f"Provider {self.provider_id} intermittent failure")
                else:
                    await asyncio.sleep(0.05)  # Fast success
                    return {"status": "success", "data": f"data_from_{self.provider_id}"}
            
            elif self.failure_mode == "slow":
                # Slow responses but successful
                await asyncio.sleep(2.0)  # 2 second delay
                return {"status": "success", "data": f"slow_data_from_{self.provider_id}"}
            
            else:  # "none" - normal operation
                await asyncio.sleep(0.05)  # Fast response
                return {"status": "success", "data": f"data_from_{self.provider_id}"}
                
        finally:
            latency_ms = (time.time() - start_time) * 1000
            success = self.failure_mode not in ["constant"] and (
                self.failure_mode != "intermittent" or self.request_count % 2 == 1
            )
            
            # Record request in resilience manager
            error = None if success else Exception(f"Mock failure from {self.provider_id}")
            await provider_resilience_manager.record_provider_request(
                provider_id=self.provider_id,
                success=success,
                latency_ms=latency_ms,
                error=error
            )
    
    def set_failure_mode(self, failure_mode: str):
        """Change failure mode during testing"""
        old_mode = self.failure_mode
        self.failure_mode = failure_mode
        self.logger.info(f"Changed failure mode from {old_mode} to {failure_mode}")


class ProviderResilienceTestSuite:
    """Comprehensive test suite for provider resilience patterns"""
    
    def __init__(self):
        self.logger = get_logger("provider_resilience_test_suite")
        self.mock_providers: Dict[str, MockProvider] = {}
        self.test_results: List[TestResult] = []
    
    async def setup_test_providers(self, provider_count: int = 3):
        """Setup mock providers for testing"""
        self.mock_providers = {}
        
        for i in range(provider_count):
            provider_id = f"test_provider_{i+1}"
            mock_provider = MockProvider(provider_id, "none")
            self.mock_providers[provider_id] = mock_provider
            
            # Register with resilience manager
            await provider_resilience_manager.register_provider(provider_id)
        
        self.logger.info(f"Setup {provider_count} test providers")
    
    async def test_single_provider_outage(self) -> TestResult:
        """
        Test that single provider outage does not block other providers.
        Exit Criteria: Forced failure test - single provider outage does not block others.
        """
        self.logger.info("Starting single provider outage test")
        start_time = time.time()
        
        try:
            # Setup: 3 providers, make one fail
            await self.setup_test_providers(3)
            
            # Make provider_1 fail constantly
            self.mock_providers["test_provider_1"].set_failure_mode("constant")
            
            # Send requests to all providers
            success_results = []
            failure_results = []
            
            for round_num in range(10):  # 10 rounds of requests
                tasks = []
                for provider_id, mock_provider in self.mock_providers.items():
                    tasks.append(self._safe_provider_request(provider_id, mock_provider))
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for provider_id, result in zip(self.mock_providers.keys(), results):
                    if isinstance(result, Exception):
                        failure_results.append((provider_id, str(result)))
                    else:
                        success_results.append((provider_id, result))
                
                await asyncio.sleep(0.1)  # Brief pause between rounds
            
            # Verify results
            provider_1_successes = len([r for r in success_results if r[0] == "test_provider_1"])
            provider_2_successes = len([r for r in success_results if r[0] == "test_provider_2"])
            provider_3_successes = len([r for r in success_results if r[0] == "test_provider_3"])
            
            # Provider 1 should have failed (circuit opened)
            # Providers 2 and 3 should continue working
            test_success = (
                provider_1_successes == 0 and  # Provider 1 blocked by circuit breaker
                provider_2_successes > 5 and   # Provider 2 working normally
                provider_3_successes > 5       # Provider 3 working normally
            )
            
            duration_sec = time.time() - start_time
            
            details = {
                "provider_1_successes": provider_1_successes,
                "provider_2_successes": provider_2_successes,
                "provider_3_successes": provider_3_successes,
                "total_success_requests": len(success_results),
                "total_failure_requests": len(failure_results),
                "provider_states": {
                    pid: provider_resilience_manager.get_provider_state(pid)
                    for pid in self.mock_providers.keys()
                }
            }
            
            result = TestResult(
                scenario=TestScenario.SINGLE_PROVIDER_OUTAGE,
                success=test_success,
                duration_sec=duration_sec,
                details=details
            )
            
            self.logger.info(f"Single provider outage test {'PASSED' if test_success else 'FAILED'}")
            return result
            
        except Exception as e:
            duration_sec = time.time() - start_time
            return TestResult(
                scenario=TestScenario.SINGLE_PROVIDER_OUTAGE,
                success=False,
                duration_sec=duration_sec,
                details={},
                error=str(e)
            )
    
    async def test_circuit_breaker_recovery(self) -> TestResult:
        """
        Test circuit breaker recovery through half-open state.
        Exit Criteria: Circuit re-closes after successful half-open probe.
        """
        self.logger.info("Starting circuit breaker recovery test")
        start_time = time.time()
        
        try:
            # Setup single provider
            await self.setup_test_providers(1)
            provider_id = "test_provider_1"
            mock_provider = self.mock_providers[provider_id]
            
            # Phase 1: Cause failures to open circuit
            mock_provider.set_failure_mode("constant")
            
            # Send enough requests to open circuit
            for _ in range(12):  # Trigger circuit open at 10 failures
                try:
                    await mock_provider.make_request()
                except:
                    pass
                await asyncio.sleep(0.1)
            
            # Verify circuit is open
            state = provider_resilience_manager.get_provider_state(provider_id)
            if not state or state["circuit_state"] != "open":
                raise Exception("Circuit breaker did not open as expected")
            
            # Phase 2: Wait for cooldown and switch to success mode
            mock_provider.set_failure_mode("none")  # Provider recovers
            
            # Wait for retry time (should be in backoff)
            retry_time = state["next_retry_time"]
            current_time = time.time()
            if retry_time > current_time:
                wait_time = min(retry_time - current_time, 5.0)  # Max 5 seconds wait
                await asyncio.sleep(wait_time + 0.1)
            
            # Phase 3: Test half-open transition and recovery
            half_open_attempts = 0
            recovery_attempts = 0
            max_recovery_attempts = 10
            
            while recovery_attempts < max_recovery_attempts:
                recovery_attempts += 1
                
                # Check if we should skip (circuit open) or can try (half-open/closed)
                should_skip, retry_after, circuit_state = await provider_resilience_manager.should_skip_provider(provider_id)
                
                if not should_skip:
                    # Make request - should succeed now
                    try:
                        await mock_provider.make_request()
                        half_open_attempts += 1
                        self.logger.info(f"Half-open attempt {half_open_attempts} succeeded")
                    except Exception as e:
                        self.logger.warning(f"Half-open attempt failed: {e}")
                
                # Check current state
                current_state = provider_resilience_manager.get_provider_state(provider_id)
                if current_state and current_state["circuit_state"] == "closed":
                    # Circuit successfully closed!
                    break
                
                await asyncio.sleep(0.2)
            
            # Verify final state
            final_state = provider_resilience_manager.get_provider_state(provider_id)
            circuit_closed = bool(final_state and final_state.get("circuit_state") == "closed")
            provider_healthy = bool(final_state and final_state.get("provider_state") == "healthy")
            
            test_success = circuit_closed and provider_healthy
            duration_sec = time.time() - start_time
            
            details = {
                "initial_circuit_state": state["circuit_state"] if state else "unknown",
                "final_circuit_state": final_state["circuit_state"] if final_state else "unknown",
                "final_provider_state": final_state["provider_state"] if final_state else "unknown",
                "half_open_attempts": half_open_attempts,
                "recovery_attempts": recovery_attempts,
                "circuit_closed_successfully": circuit_closed,
                "provider_recovered": provider_healthy
            }
            
            result = TestResult(
                scenario=TestScenario.CIRCUIT_BREAKER_RECOVERY,
                success=test_success,
                duration_sec=duration_sec,
                details=details
            )
            
            self.logger.info(f"Circuit breaker recovery test {'PASSED' if test_success else 'FAILED'}")
            return result
            
        except Exception as e:
            duration_sec = time.time() - start_time
            return TestResult(
                scenario=TestScenario.CIRCUIT_BREAKER_RECOVERY,
                success=False,
                duration_sec=duration_sec,
                details={},
                error=str(e)
            )
    
    async def test_sla_metrics_tracking(self) -> TestResult:
        """Test SLA metrics tracking with error categorization"""
        self.logger.info("Starting SLA metrics tracking test")
        start_time = time.time()
        
        try:
            await self.setup_test_providers(1)
            provider_id = "test_provider_1"
            mock_provider = self.mock_providers[provider_id]
            
            # Mix of success and various failure types
            test_scenarios = [
                ("none", 10),      # 10 successes
                ("constant", 2),   # 2 failures
                ("slow", 5),       # 5 slow responses (should succeed but high latency)
                ("intermittent", 6) # 6 requests, 3 success, 3 failures
            ]
            
            total_requests = 0
            expected_successes = 10 + 5 + 3  # Normal + slow + half of intermittent
            expected_failures = 2 + 3        # Constant + half of intermittent
            
            for failure_mode, count in test_scenarios:
                mock_provider.set_failure_mode(failure_mode)
                for _ in range(count):
                    try:
                        await mock_provider.make_request()
                    except:
                        pass
                    total_requests += 1
                    await asyncio.sleep(0.05)
            
            # Get final metrics
            state = provider_resilience_manager.get_provider_state(provider_id)
            
            if not state:
                raise Exception("No provider state found")
            
            # Verify SLA metrics
            success_percentage = state["sla_percentage"]
            p95_latency = state["p95_latency_ms"]
            error_categories = state["error_categories"]
            
            # Check expected values
            expected_percentage = (expected_successes / total_requests) * 100
            sla_correct = bool(abs(success_percentage - expected_percentage) < 5)  # 5% tolerance
            
            # P95 latency should reflect slow requests
            latency_reasonable = bool(p95_latency > 100)  # Should be higher due to slow requests
            
            # Should have error categories
            has_error_categories = bool(len(error_categories) > 0)
            
            test_success = sla_correct and latency_reasonable and has_error_categories
            duration_sec = time.time() - start_time
            
            details = {
                "total_requests": total_requests,
                "expected_successes": expected_successes,
                "expected_failures": expected_failures,
                "actual_success_percentage": success_percentage,
                "expected_success_percentage": expected_percentage,
                "p95_latency_ms": p95_latency,
                "error_categories": error_categories,
                "sla_metrics_correct": sla_correct,
                "latency_tracking_working": latency_reasonable,
                "error_categorization_working": has_error_categories
            }
            
            result = TestResult(
                scenario=TestScenario.SLA_VIOLATION_DETECTION,
                success=test_success,
                duration_sec=duration_sec,
                details=details
            )
            
            self.logger.info(f"SLA metrics tracking test {'PASSED' if test_success else 'FAILED'}")
            return result
            
        except Exception as e:
            duration_sec = time.time() - start_time
            return TestResult(
                scenario=TestScenario.SLA_VIOLATION_DETECTION,
                success=False,
                duration_sec=duration_sec,
                details={},
                error=str(e)
            )
    
    async def _safe_provider_request(self, provider_id: str, mock_provider: MockProvider):
        """Make a safe provider request that handles circuit breaker state"""
        # Check if provider should be skipped
        should_skip, retry_after, circuit_state = await provider_resilience_manager.should_skip_provider(provider_id)
        
        if should_skip:
            # Circuit breaker is blocking requests
            raise Exception(f"Circuit breaker blocking requests for {provider_id}")
        
        # Make the actual request
        return await mock_provider.make_request()
    
    async def run_comprehensive_test_suite(self) -> Dict[str, Any]:
        """Run all resilience tests and return comprehensive results"""
        self.logger.info("Starting comprehensive provider resilience test suite")
        suite_start_time = time.time()
        
        # Clear previous results
        self.test_results = []
        
        # Run all test scenarios
        test_methods = [
            self.test_single_provider_outage,
            self.test_circuit_breaker_recovery,
            self.test_sla_metrics_tracking,
        ]
        
        for test_method in test_methods:
            try:
                self.logger.info(f"Running {test_method.__name__}")
                result = await test_method()
                self.test_results.append(result)
                
                # Brief pause between tests
                await asyncio.sleep(1.0)
                
            except Exception as e:
                self.logger.error(f"Test {test_method.__name__} failed with exception: {e}")
                self.test_results.append(TestResult(
                    scenario=TestScenario.SINGLE_PROVIDER_OUTAGE,  # Default
                    success=False,
                    duration_sec=0,
                    details={},
                    error=str(e)
                ))
        
        # Calculate summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result.success)
        failed_tests = total_tests - passed_tests
        suite_duration = time.time() - suite_start_time
        
        summary = {
            "suite_duration_sec": suite_duration,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            "test_results": [
                {
                    "scenario": result.scenario.value,
                    "success": result.success,
                    "duration_sec": result.duration_sec,
                    "details": result.details,
                    "error": result.error
                }
                for result in self.test_results
            ]
        }
        
        self.logger.info(f"Test suite completed: {passed_tests}/{total_tests} passed ({summary['success_rate']:.1f}%)")
        
        return summary


# Global test suite instance
resilience_test_suite = ProviderResilienceTestSuite()


async def run_resilience_tests() -> Dict[str, Any]:
    """Convenience function to run all resilience tests"""
    return await resilience_test_suite.run_comprehensive_test_suite()


# Export key components
__all__ = [
    "ProviderResilienceTestSuite",
    "TestScenario",
    "TestResult",
    "MockProvider",
    "resilience_test_suite",
    "run_resilience_tests",
]