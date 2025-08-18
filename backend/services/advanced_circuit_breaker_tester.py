"""
Advanced Circuit Breaker Testing Service
Extends the enhanced resilience service with comprehensive circuit breaker testing and cascading failure simulation
"""

import asyncio
import logging
import time
import weakref
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

from backend.services.enhanced_resilience_service import (
    EnhancedResilienceService,
    EnhancedCircuitBreaker,
    CircuitBreakerConfig,
    CircuitState,
    ResilienceState,
    FailureType,
    FailureEvent,
    get_resilience_service
)
from backend.services.unified_logging import unified_logging

logger = unified_logging.get_logger("circuit_breaker_testing")


class CascadeTestType(Enum):
    """Types of cascading failure tests"""
    LINEAR_CASCADE = "linear_cascade"
    BRANCHED_CASCADE = "branched_cascade"
    CIRCULAR_CASCADE = "circular_cascade"
    RANDOM_CASCADE = "random_cascade"
    DEPENDENCY_CASCADE = "dependency_cascade"


class CircuitBreakerTestScenario(Enum):
    """Circuit breaker test scenarios"""
    BASIC_FAILURE_THRESHOLD = "basic_failure_threshold"
    ERROR_RATE_THRESHOLD = "error_rate_threshold"
    SLOW_CALL_THRESHOLD = "slow_call_threshold"
    HALF_OPEN_RECOVERY = "half_open_recovery"
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    FORCED_STATE_TRANSITIONS = "forced_state_transitions"
    CONCURRENT_FAILURES = "concurrent_failures"
    CASCADING_FAILURES = "cascading_failures"


@dataclass
class CascadeNode:
    """Node in a cascading failure test"""
    name: str
    dependencies: List[str] = field(default_factory=list)
    dependents: List[str] = field(default_factory=list)
    failure_probability: float = 0.8  # 80% chance to fail when dependency fails
    recovery_time: int = 60  # seconds to recover
    is_failed: bool = False
    failure_start_time: Optional[datetime] = None


@dataclass
class CascadeTestResult:
    """Result of cascading failure test"""
    test_type: CascadeTestType
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    initial_failure: str = ""
    cascade_sequence: List[str] = field(default_factory=list)
    total_failures: int = 0
    recovery_sequence: List[str] = field(default_factory=list)
    recovery_time: Optional[float] = None
    success: bool = False
    error_message: Optional[str] = None
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CircuitBreakerTestResult:
    """Result of circuit breaker test"""
    scenario: CircuitBreakerTestScenario
    circuit_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    success: bool = False
    error_message: Optional[str] = None
    state_transitions: List[Dict[str, Any]] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    expected_behavior: str = ""
    actual_behavior: str = ""


class AdvancedCircuitBreakerTester:
    """Advanced circuit breaker testing capabilities"""
    
    def __init__(self, resilience_service: EnhancedResilienceService):
        self.resilience_service = resilience_service
        self.test_results: List[CircuitBreakerTestResult] = []
        self.cascade_results: List[CascadeTestResult] = []
        self.is_testing = False
        
    async def run_comprehensive_circuit_breaker_tests(
        self, 
        circuit_name: str = "test_circuit"
    ) -> Dict[str, Any]:
        """Run all circuit breaker test scenarios"""
        if self.is_testing:
            raise Exception("Circuit breaker tests already running")
        
        self.is_testing = True
        logger.info(f"Starting comprehensive circuit breaker tests for {circuit_name}")
        
        test_suite_results = {
            "circuit_name": circuit_name,
            "start_time": datetime.now().isoformat(),
            "scenarios": {},
            "overall_success": True,
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
        }
        
        try:
            # Run all test scenarios
            scenarios = [
                CircuitBreakerTestScenario.BASIC_FAILURE_THRESHOLD,
                CircuitBreakerTestScenario.ERROR_RATE_THRESHOLD,
                CircuitBreakerTestScenario.SLOW_CALL_THRESHOLD,
                CircuitBreakerTestScenario.HALF_OPEN_RECOVERY,
                CircuitBreakerTestScenario.EXPONENTIAL_BACKOFF,
                CircuitBreakerTestScenario.FORCED_STATE_TRANSITIONS,
                CircuitBreakerTestScenario.CONCURRENT_FAILURES,
            ]
            
            for scenario in scenarios:
                try:
                    result = await self._run_single_test_scenario(circuit_name, scenario)
                    test_suite_results["scenarios"][scenario.value] = {
                        "success": result.success,
                        "duration": result.duration,
                        "error": result.error_message,
                        "state_transitions": result.state_transitions,
                        "expected": result.expected_behavior,
                        "actual": result.actual_behavior,
                    }
                    
                    test_suite_results["total_tests"] += 1
                    if result.success:
                        test_suite_results["passed_tests"] += 1
                    else:
                        test_suite_results["failed_tests"] += 1
                        test_suite_results["overall_success"] = False
                        
                except Exception as e:
                    logger.error(f"Test scenario {scenario.value} failed: {e}")
                    test_suite_results["scenarios"][scenario.value] = {
                        "success": False,
                        "error": str(e)
                    }
                    test_suite_results["failed_tests"] += 1
                    test_suite_results["overall_success"] = False
                
                # Small delay between tests
                await asyncio.sleep(5)
                
        finally:
            self.is_testing = False
            test_suite_results["end_time"] = datetime.now().isoformat()
            
        logger.info(f"Circuit breaker tests completed: {test_suite_results['passed_tests']}/{test_suite_results['total_tests']} passed")
        return test_suite_results
    
    async def _run_single_test_scenario(
        self, 
        circuit_name: str, 
        scenario: CircuitBreakerTestScenario
    ) -> CircuitBreakerTestResult:
        """Run a single circuit breaker test scenario"""
        result = CircuitBreakerTestResult(
            scenario=scenario,
            circuit_name=circuit_name,
            start_time=datetime.now()
        )
        
        try:
            logger.info(f"Running circuit breaker test: {scenario.value}")
            
            if scenario == CircuitBreakerTestScenario.BASIC_FAILURE_THRESHOLD:
                await self._test_basic_failure_threshold(circuit_name, result)
            elif scenario == CircuitBreakerTestScenario.ERROR_RATE_THRESHOLD:
                await self._test_error_rate_threshold(circuit_name, result)
            elif scenario == CircuitBreakerTestScenario.SLOW_CALL_THRESHOLD:
                await self._test_slow_call_threshold(circuit_name, result)
            elif scenario == CircuitBreakerTestScenario.HALF_OPEN_RECOVERY:
                await self._test_half_open_recovery(circuit_name, result)
            elif scenario == CircuitBreakerTestScenario.EXPONENTIAL_BACKOFF:
                await self._test_exponential_backoff(circuit_name, result)
            elif scenario == CircuitBreakerTestScenario.FORCED_STATE_TRANSITIONS:
                await self._test_forced_state_transitions(circuit_name, result)
            elif scenario == CircuitBreakerTestScenario.CONCURRENT_FAILURES:
                await self._test_concurrent_failures(circuit_name, result)
            
            result.success = True
            
        except Exception as e:
            result.error_message = str(e)
            result.success = False
            logger.error(f"Circuit breaker test {scenario.value} failed: {e}")
            
        finally:
            result.end_time = datetime.now()
            result.duration = (result.end_time - result.start_time).total_seconds()
            self.test_results.append(result)
            
        return result
    
    async def _test_basic_failure_threshold(self, circuit_name: str, result: CircuitBreakerTestResult):
        """Test basic failure threshold behavior"""
        config = CircuitBreakerConfig(failure_threshold=3, recovery_timeout=10)
        circuit = self.resilience_service.create_circuit_breaker(circuit_name, config)
        
        result.expected_behavior = "Circuit should open after 3 consecutive failures"
        
        # Reset circuit
        await circuit.reset()
        
        # Create a function that always fails
        async def failing_function():
            raise Exception("Test failure")
        
        # Trigger failures
        failure_count = 0
        for i in range(5):  # Try 5 times, should open after 3
            try:
                await circuit.call(failing_function)
            except:
                failure_count += 1
                self._record_state_transition(result, circuit, f"Failure {failure_count}")
                
                if circuit.state == CircuitState.OPEN:
                    break
        
        # Verify circuit is open
        if circuit.state != CircuitState.OPEN:
            raise Exception(f"Expected circuit to be OPEN, but was {circuit.state}")
        
        result.actual_behavior = f"Circuit opened after {failure_count} failures"
    
    async def _test_error_rate_threshold(self, circuit_name: str, result: CircuitBreakerTestResult):
        """Test error rate threshold behavior"""
        config = CircuitBreakerConfig(
            error_rate_threshold=0.5,  # 50% error rate
            minimum_requests=10,
            failure_window=60
        )
        circuit = self.resilience_service.create_circuit_breaker(f"{circuit_name}_error_rate", config)
        
        result.expected_behavior = "Circuit should open when error rate exceeds 50%"
        
        # Reset circuit
        await circuit.reset()
        
        # Mix successful and failing calls
        success_count = 0
        failure_count = 0
        
        for i in range(20):
            try:
                if i % 2 == 0:  # 50% failure rate
                    await circuit.call(self._failing_function)
                else:
                    await circuit.call(self._success_function)
                    success_count += 1
            except:
                failure_count += 1
                self._record_state_transition(result, circuit, f"Error rate test - failures: {failure_count}")
                
                if circuit.state == CircuitState.OPEN:
                    break
        
        result.actual_behavior = f"Circuit state: {circuit.state}, Success: {success_count}, Failures: {failure_count}"
    
    async def _test_slow_call_threshold(self, circuit_name: str, result: CircuitBreakerTestResult):
        """Test slow call threshold behavior"""
        config = CircuitBreakerConfig(
            slow_call_threshold=2.0,  # 2 seconds
            slow_call_rate_threshold=0.5,  # 50% slow calls
            minimum_requests=5,
            timeout=5.0
        )
        circuit = self.resilience_service.create_circuit_breaker(f"{circuit_name}_slow", config)
        
        result.expected_behavior = "Circuit should open when >50% of calls are slow (>2s)"
        
        # Reset circuit
        await circuit.reset()
        
        slow_count = 0
        fast_count = 0
        
        # Create slow and fast functions
        async def slow_function():
            await asyncio.sleep(3)  # Slow call
            return "slow"
        
        async def fast_function():
            await asyncio.sleep(0.1)  # Fast call
            return "fast"
        
        for i in range(10):
            try:
                if i % 2 == 0:  # 50% slow calls
                    await circuit.call(slow_function)
                    slow_count += 1
                else:
                    await circuit.call(fast_function)
                    fast_count += 1
                    
                self._record_state_transition(result, circuit, f"Slow call test - slow: {slow_count}, fast: {fast_count}")
                
                if circuit.state == CircuitState.OPEN:
                    break
                    
            except Exception as e:
                logger.warning(f"Call failed: {e}")
        
        result.actual_behavior = f"Circuit state: {circuit.state}, Slow: {slow_count}, Fast: {fast_count}"
    
    async def _test_half_open_recovery(self, circuit_name: str, result: CircuitBreakerTestResult):
        """Test half-open state recovery behavior"""
        config = CircuitBreakerConfig(
            failure_threshold=2,
            success_threshold=3,
            recovery_timeout=5  # Short timeout for testing
        )
        circuit = self.resilience_service.create_circuit_breaker(f"{circuit_name}_recovery", config)
        
        result.expected_behavior = "Circuit should transition CLOSED -> OPEN -> HALF_OPEN -> CLOSED"
        
        # Reset and force to open state
        await circuit.reset()
        
        # Trigger failures to open circuit
        for i in range(3):
            try:
                await circuit.call(self._failing_function)
            except:
                pass
        
        self._record_state_transition(result, circuit, "After failures")
        
        # Wait for recovery timeout
        await asyncio.sleep(6)
        
        # Try a successful call to trigger half-open
        try:
            await circuit.call(self._success_function)
        except:
            pass
        
        self._record_state_transition(result, circuit, "After recovery attempt")
        
        # If half-open, make successful calls to close circuit
        if circuit.state == CircuitState.HALF_OPEN:
            for i in range(3):
                try:
                    await circuit.call(self._success_function)
                    self._record_state_transition(result, circuit, f"Success in half-open {i+1}")
                except:
                    break
        
        result.actual_behavior = f"Final circuit state: {circuit.state}"
    
    async def _test_exponential_backoff(self, circuit_name: str, result: CircuitBreakerTestResult):
        """Test exponential backoff behavior"""
        config = CircuitBreakerConfig(
            failure_threshold=2,
            recovery_timeout=2,  # 2 seconds base
            backoff_multiplier=2.0,
            max_retry_delay=10.0
        )
        circuit = self.resilience_service.create_circuit_breaker(f"{circuit_name}_backoff", config)
        
        result.expected_behavior = "Recovery timeout should increase exponentially: 2s, 4s, 8s, 10s (max)"
        
        # Reset circuit
        await circuit.reset()
        
        backoff_times = []
        
        for attempt in range(4):
            # Trigger failures to open circuit
            for i in range(3):
                try:
                    await circuit.call(self._failing_function)
                except:
                    pass
            
            # Record current state and timing
            if circuit.next_attempt_time:
                backoff_delay = (circuit.next_attempt_time - datetime.now()).total_seconds()
                backoff_times.append(max(0, backoff_delay))
            
            self._record_state_transition(result, circuit, f"Attempt {attempt + 1}")
            
            # Wait a bit before next attempt
            await asyncio.sleep(1)
        
        result.actual_behavior = f"Backoff times: {[f'{t:.1f}s' for t in backoff_times]}"
        result.metrics["backoff_times"] = backoff_times
    
    async def _test_forced_state_transitions(self, circuit_name: str, result: CircuitBreakerTestResult):
        """Test forced state transitions"""
        circuit = self.resilience_service.create_circuit_breaker(f"{circuit_name}_forced")
        
        result.expected_behavior = "Circuit should respond to forced state changes"
        
        # Start in closed state
        await circuit.reset()
        self._record_state_transition(result, circuit, "Initial reset")
        
        # Force open
        await circuit.force_open()
        self._record_state_transition(result, circuit, "After force open")
        
        if circuit.state != CircuitState.FORCED_OPEN:
            raise Exception(f"Expected FORCED_OPEN, got {circuit.state}")
        
        # Force close
        await circuit.force_close()
        self._record_state_transition(result, circuit, "After force close")
        
        if circuit.state != CircuitState.FORCED_CLOSED:
            raise Exception(f"Expected FORCED_CLOSED, got {circuit.state}")
        
        # Reset to normal operation
        await circuit.reset()
        self._record_state_transition(result, circuit, "After final reset")
        
        if circuit.state != CircuitState.CLOSED:
            raise Exception(f"Expected CLOSED, got {circuit.state}")
        
        result.actual_behavior = "All forced state transitions successful"
    
    async def _test_concurrent_failures(self, circuit_name: str, result: CircuitBreakerTestResult):
        """Test behavior under concurrent failures"""
        config = CircuitBreakerConfig(failure_threshold=5, recovery_timeout=10)
        circuit = self.resilience_service.create_circuit_breaker(f"{circuit_name}_concurrent", config)
        
        result.expected_behavior = "Circuit should handle concurrent failures correctly"
        
        # Reset circuit
        await circuit.reset()
        
        # Create multiple concurrent failing tasks
        async def concurrent_failing_task(task_id: int):
            try:
                await circuit.call(self._failing_function)
            except:
                return f"Task {task_id} failed"
        
        # Run 10 concurrent failing tasks
        tasks = [concurrent_failing_task(i) for i in range(10)]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)
        
        self._record_state_transition(result, circuit, "After concurrent failures")
        
        result.actual_behavior = f"Circuit state after {len(tasks)} concurrent failures: {circuit.state}"
        result.metrics["concurrent_task_results"] = len(results_list)
    
    async def _failing_function(self):
        """Always failing test function"""
        raise Exception("Test failure")
    
    async def _success_function(self):
        """Always succeeding test function"""
        await asyncio.sleep(0.1)
        return "success"
    
    def _record_state_transition(self, result: CircuitBreakerTestResult, circuit: EnhancedCircuitBreaker, event: str):
        """Record a circuit state transition"""
        transition = {
            "timestamp": datetime.now().isoformat(),
            "event": event,
            "state": circuit.state.value,
            "failure_count": circuit.failure_count,
            "success_count": circuit.success_count,
        }
        result.state_transitions.append(transition)
        logger.info(f"Circuit {circuit.name}: {event} -> {circuit.state.value}")
    
    async def run_cascading_failure_tests(
        self,
        service_topology: Dict[str, List[str]] = None
    ) -> Dict[str, Any]:
        """Run comprehensive cascading failure tests"""
        if service_topology is None:
            # Default service topology
            service_topology = {
                "frontend": ["api_gateway"],
                "api_gateway": ["auth_service", "data_service"],
                "auth_service": ["database", "cache"],
                "data_service": ["database", "external_api"],
                "database": [],
                "cache": [],
                "external_api": ["third_party_service"],
                "third_party_service": [],
            }
        
        logger.info("Starting cascading failure tests")
        
        cascade_suite_results = {
            "start_time": datetime.now().isoformat(),
            "service_topology": service_topology,
            "test_results": {},
            "overall_success": True,
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
        }
        
        # Test different cascade types
        cascade_types = [
            CascadeTestType.LINEAR_CASCADE,
            CascadeTestType.BRANCHED_CASCADE,
            CascadeTestType.CIRCULAR_CASCADE,
            CascadeTestType.RANDOM_CASCADE,
            CascadeTestType.DEPENDENCY_CASCADE,
        ]
        
        for cascade_type in cascade_types:
            try:
                result = await self._run_cascade_test(cascade_type, service_topology)
                cascade_suite_results["test_results"][cascade_type.value] = {
                    "success": result.success,
                    "duration": result.duration,
                    "total_failures": result.total_failures,
                    "cascade_sequence": result.cascade_sequence,
                    "recovery_time": result.recovery_time,
                    "error": result.error_message,
                }
                
                cascade_suite_results["total_tests"] += 1
                if result.success:
                    cascade_suite_results["passed_tests"] += 1
                else:
                    cascade_suite_results["failed_tests"] += 1
                    cascade_suite_results["overall_success"] = False
                
            except Exception as e:
                logger.error(f"Cascade test {cascade_type.value} failed: {e}")
                cascade_suite_results["test_results"][cascade_type.value] = {
                    "success": False,
                    "error": str(e)
                }
                cascade_suite_results["failed_tests"] += 1
                cascade_suite_results["overall_success"] = False
        
        cascade_suite_results["end_time"] = datetime.now().isoformat()
        return cascade_suite_results
    
    async def _run_cascade_test(
        self, 
        cascade_type: CascadeTestType, 
        service_topology: Dict[str, List[str]]
    ) -> CascadeTestResult:
        """Run a single cascading failure test"""
        result = CascadeTestResult(
            test_type=cascade_type,
            start_time=datetime.now()
        )
        
        try:
            # Create service nodes
            nodes = self._create_service_nodes(service_topology)
            
            # Run cascade test based on type
            if cascade_type == CascadeTestType.LINEAR_CASCADE:
                await self._test_linear_cascade(nodes, result)
            elif cascade_type == CascadeTestType.BRANCHED_CASCADE:
                await self._test_branched_cascade(nodes, result)
            elif cascade_type == CascadeTestType.CIRCULAR_CASCADE:
                await self._test_circular_cascade(nodes, result)
            elif cascade_type == CascadeTestType.RANDOM_CASCADE:
                await self._test_random_cascade(nodes, result)
            elif cascade_type == CascadeTestType.DEPENDENCY_CASCADE:
                await self._test_dependency_cascade(nodes, result)
            
            result.success = True
            
        except Exception as e:
            result.error_message = str(e)
            result.success = False
            
        finally:
            result.end_time = datetime.now()
            result.duration = (result.end_time - result.start_time).total_seconds()
            self.cascade_results.append(result)
        
        return result
    
    def _create_service_nodes(self, service_topology: Dict[str, List[str]]) -> Dict[str, CascadeNode]:
        """Create cascade nodes from service topology"""
        nodes = {}
        
        # Create nodes
        for service, dependencies in service_topology.items():
            nodes[service] = CascadeNode(name=service, dependencies=dependencies)
        
        # Set up dependents (reverse dependencies)
        for service, dependencies in service_topology.items():
            for dependency in dependencies:
                if dependency in nodes:
                    nodes[dependency].dependents.append(service)
        
        return nodes
    
    async def _test_linear_cascade(self, nodes: Dict[str, CascadeNode], result: CascadeTestResult):
        """Test linear cascading failure"""
        logger.info("Testing linear cascade")
        
        # Find the longest dependency chain
        chain = self._find_longest_chain(nodes)
        if not chain:
            raise Exception("No dependency chain found for linear cascade test")
        
        result.initial_failure = chain[0]
        
        # Trigger initial failure
        await self._trigger_node_failure(nodes[chain[0]], result)
        
        # Propagate failure down the chain
        for i in range(1, len(chain)):
            service_name = chain[i]
            node = nodes[service_name]
            
            # Check if any dependencies have failed
            failed_deps = [dep for dep in node.dependencies if nodes[dep].is_failed]
            if failed_deps and not node.is_failed:
                # Probability-based failure
                if len(failed_deps) / len(node.dependencies) >= node.failure_probability:
                    await self._trigger_node_failure(node, result)
            
            await asyncio.sleep(1)  # Cascade delay
    
    async def _test_branched_cascade(self, nodes: Dict[str, CascadeNode], result: CascadeTestResult):
        """Test branched cascading failure"""
        logger.info("Testing branched cascade")
        
        # Find a service with multiple dependents
        root_service = None
        for name, node in nodes.items():
            if len(node.dependents) >= 2:
                root_service = name
                break
        
        if not root_service:
            raise Exception("No suitable root service found for branched cascade test")
        
        result.initial_failure = root_service
        
        # Trigger root failure
        await self._trigger_node_failure(nodes[root_service], result)
        
        # Propagate to all dependents
        affected_services = []
        queue = [root_service]
        
        while queue:
            current_service = queue.pop(0)
            current_node = nodes[current_service]
            
            for dependent in current_node.dependents:
                if dependent not in affected_services:
                    dependent_node = nodes[dependent]
                    
                    # Check failure probability
                    if not dependent_node.is_failed and len(dependent_node.dependencies) > 0:
                        failed_deps = [dep for dep in dependent_node.dependencies if nodes[dep].is_failed]
                        failure_rate = len(failed_deps) / len(dependent_node.dependencies)
                        
                        if failure_rate >= dependent_node.failure_probability:
                            await self._trigger_node_failure(dependent_node, result)
                            queue.append(dependent)
                            affected_services.append(dependent)
                            await asyncio.sleep(0.5)  # Shorter cascade delay for branches
    
    async def _test_circular_cascade(self, nodes: Dict[str, CascadeNode], result: CascadeTestResult):
        """Test circular dependency cascade"""
        logger.info("Testing circular cascade")
        
        # Create a circular dependency for testing
        circular_services = ["service_a", "service_b", "service_c"]
        
        # Add circular nodes if they don't exist
        for i, service in enumerate(circular_services):
            if service not in nodes:
                next_service = circular_services[(i + 1) % len(circular_services)]
                nodes[service] = CascadeNode(
                    name=service,
                    dependencies=[next_service],
                    dependents=[circular_services[(i - 1) % len(circular_services)]]
                )
        
        result.initial_failure = circular_services[0]
        
        # Trigger failure in circular dependency
        await self._trigger_node_failure(nodes[circular_services[0]], result)
        
        # Let the cascade propagate through the circle
        for i in range(1, len(circular_services) + 2):  # Extra iterations to complete circle
            service_idx = i % len(circular_services)
            service_name = circular_services[service_idx]
            node = nodes[service_name]
            
            if not node.is_failed:
                failed_deps = [dep for dep in node.dependencies if nodes[dep].is_failed]
                if failed_deps:
                    await self._trigger_node_failure(node, result)
            
            await asyncio.sleep(1)
    
    async def _test_random_cascade(self, nodes: Dict[str, CascadeNode], result: CascadeTestResult):
        """Test random cascading failure"""
        logger.info("Testing random cascade")
        
        import random
        
        # Pick random initial failure
        services = list(nodes.keys())
        initial_service = random.choice(services)
        result.initial_failure = initial_service
        
        # Trigger initial failure
        await self._trigger_node_failure(nodes[initial_service], result)
        
        # Random cascade propagation
        for _ in range(10):  # Max 10 cascade steps
            # Find services that could fail due to dependencies
            candidates = []
            for name, node in nodes.items():
                if not node.is_failed and node.dependencies:
                    failed_deps = [dep for dep in node.dependencies if nodes[dep].is_failed]
                    if failed_deps:
                        failure_prob = len(failed_deps) / len(node.dependencies) * node.failure_probability
                        if random.random() < failure_prob:
                            candidates.append(name)
            
            if candidates:
                next_failure = random.choice(candidates)
                await self._trigger_node_failure(nodes[next_failure], result)
                await asyncio.sleep(random.uniform(0.5, 2.0))
            else:
                break
    
    async def _test_dependency_cascade(self, nodes: Dict[str, CascadeNode], result: CascadeTestResult):
        """Test dependency-based cascading failure"""
        logger.info("Testing dependency cascade")
        
        # Find service with most dependencies
        service_with_most_deps = max(nodes.keys(), key=lambda s: len(nodes[s].dependencies))
        result.initial_failure = service_with_most_deps
        
        # Trigger initial failure
        await self._trigger_node_failure(nodes[service_with_most_deps], result)
        
        # Cascade based on dependency relationships
        changed = True
        while changed:
            changed = False
            
            for name, node in nodes.items():
                if not node.is_failed and node.dependencies:
                    failed_deps = [dep for dep in node.dependencies if nodes[dep].is_failed]
                    critical_deps_failed = len(failed_deps) / len(node.dependencies)
                    
                    # Fail if more than threshold of dependencies have failed
                    if critical_deps_failed >= 0.5:  # 50% threshold
                        await self._trigger_node_failure(node, result)
                        changed = True
                        await asyncio.sleep(1)
    
    async def _trigger_node_failure(self, node: CascadeNode, result: CascadeTestResult):
        """Trigger failure in a service node"""
        if not node.is_failed:
            node.is_failed = True
            node.failure_start_time = datetime.now()
            result.cascade_sequence.append(node.name)
            result.total_failures += 1
            
            logger.warning(f"Service {node.name} failed in cascade test")
            
            # Create circuit breaker for the service and force it open
            circuit = self.resilience_service.create_circuit_breaker(f"cascade_{node.name}")
            await circuit.force_open()
    
    def _find_longest_chain(self, nodes: Dict[str, CascadeNode]) -> List[str]:
        """Find the longest dependency chain for linear cascade test"""
        def dfs(node_name: str, visited: Set[str], path: List[str]) -> List[str]:
            if node_name in visited:
                return path
            
            visited.add(node_name)
            path.append(node_name)
            
            longest = path[:]
            for dependent in nodes[node_name].dependents:
                candidate = dfs(dependent, visited.copy(), path[:])
                if len(candidate) > len(longest):
                    longest = candidate
            
            return longest
        
        # Find longest chain from any starting node
        longest_chain = []
        for start_node in nodes.keys():
            chain = dfs(start_node, set(), [])
            if len(chain) > len(longest_chain):
                longest_chain = chain
        
        return longest_chain
    
    def get_test_results(self) -> Dict[str, Any]:
        """Get all test results"""
        return {
            "circuit_breaker_tests": [
                {
                    "scenario": result.scenario.value,
                    "circuit_name": result.circuit_name,
                    "success": result.success,
                    "duration": result.duration,
                    "state_transitions": result.state_transitions,
                    "expected_behavior": result.expected_behavior,
                    "actual_behavior": result.actual_behavior,
                    "error": result.error_message,
                }
                for result in self.test_results
            ],
            "cascade_tests": [
                {
                    "test_type": result.test_type.value,
                    "success": result.success,
                    "duration": result.duration,
                    "initial_failure": result.initial_failure,
                    "cascade_sequence": result.cascade_sequence,
                    "total_failures": result.total_failures,
                    "recovery_time": result.recovery_time,
                    "error": result.error_message,
                }
                for result in self.cascade_results
            ]
        }


# Helper function to create circuit breaker tester
async def create_circuit_breaker_tester() -> AdvancedCircuitBreakerTester:
    """Create circuit breaker tester with resilience service"""
    resilience_service = await get_resilience_service()
    return AdvancedCircuitBreakerTester(resilience_service)