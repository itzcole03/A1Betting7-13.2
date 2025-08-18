"""
Resilience Test Orchestrator - Comprehensive Testing Coordination
Coordinates chaos engineering, circuit breaker testing, and memory monitoring for comprehensive resilience validation
"""

import asyncio
import json
import logging
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from backend.services.chaos_engineering_service import (
    ChaosEngineeringService, 
    ChaosScenario, 
    ChaosConfig,
    get_chaos_service
)
from backend.services.advanced_circuit_breaker_tester import (
    AdvancedCircuitBreakerTester,
    CircuitBreakerTestScenario,
    CascadeTestType,
    create_circuit_breaker_tester
)
from backend.services.memory_monitoring_service import (
    MemoryMonitoringService,
    SoakTestConfig,
    get_memory_monitor
)
from backend.services.enhanced_resilience_service import get_resilience_service

try:
    from backend.services.unified_logging import unified_logging
    logger = unified_logging.get_logger("resilience_orchestrator")
except (ImportError, AttributeError):
    import logging
    logger = logging.getLogger("resilience_orchestrator")


class TestPhase(Enum):
    """Test execution phases"""
    INITIALIZATION = "initialization"
    BASELINE_ESTABLISHMENT = "baseline_establishment"
    CHAOS_INJECTION = "chaos_injection"
    CIRCUIT_BREAKER_TESTING = "circuit_breaker_testing"
    CASCADING_FAILURE_TESTING = "cascading_failure_testing"
    MEMORY_SOAK_TESTING = "memory_soak_testing"
    RECOVERY_VALIDATION = "recovery_validation"
    FINAL_ANALYSIS = "final_analysis"
    CLEANUP = "cleanup"


class TestResult(Enum):
    """Test result status"""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    SKIP = "skip"
    ERROR = "error"


@dataclass
class ResilienceTestConfig:
    """Configuration for comprehensive resilience testing"""
    
    # Overall test configuration
    total_duration_hours: int = 4
    enable_chaos_testing: bool = True
    enable_circuit_breaker_testing: bool = True
    enable_memory_monitoring: bool = True
    enable_cascading_failure_testing: bool = True
    
    # Chaos testing configuration
    chaos_intensity: str = "medium"  # low, medium, high, extreme
    chaos_scenarios: List[ChaosScenario] = field(default_factory=lambda: [
        ChaosScenario.PROVIDER_TIMEOUT,
        ChaosScenario.VALUATION_EXCEPTION,
        ChaosScenario.LATENCY_SPIKE,
        ChaosScenario.INTERMITTENT_ERRORS
    ])
    
    # Memory monitoring configuration
    memory_growth_threshold_percent: int = 10
    memory_sampling_interval_seconds: int = 30
    
    # Circuit breaker testing
    circuit_breaker_scenarios: List[CircuitBreakerTestScenario] = field(default_factory=lambda: [
        CircuitBreakerTestScenario.BASIC_FAILURE_THRESHOLD,
        CircuitBreakerTestScenario.ERROR_RATE_THRESHOLD,
        CircuitBreakerTestScenario.HALF_OPEN_RECOVERY,
        CircuitBreakerTestScenario.EXPONENTIAL_BACKOFF
    ])
    
    # Service topology for cascading failure tests
    service_topology: Dict[str, List[str]] = field(default_factory=lambda: {
        "frontend": ["api_gateway"],
        "api_gateway": ["auth_service", "data_service", "mlb_service"],
        "auth_service": ["database", "cache"],
        "data_service": ["database", "external_api"],
        "mlb_service": ["mlb_stats_api", "prizepicks_api"],
        "database": [],
        "cache": [],
        "external_api": ["third_party_service"],
        "mlb_stats_api": [],
        "prizepicks_api": [],
        "third_party_service": [],
    })
    
    # Exit criteria
    max_memory_growth_percent: float = 15.0
    max_system_memory_percent: float = 90.0
    min_recovery_success_rate: float = 0.8  # 80%
    max_cascading_failure_propagation: int = 5  # Max 5 services can fail


@dataclass
class PhaseResult:
    """Result of a test phase"""
    phase: TestPhase
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    result: TestResult = TestResult.SKIP
    error_message: Optional[str] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    sub_results: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ResilienceTestReport:
    """Comprehensive resilience test report"""
    test_id: str
    config: ResilienceTestConfig
    start_time: datetime
    end_time: Optional[datetime] = None
    total_duration: Optional[float] = None
    overall_result: TestResult = TestResult.SKIP
    
    # Phase results
    phase_results: List[PhaseResult] = field(default_factory=list)
    
    # Summary metrics
    chaos_events_triggered: int = 0
    circuit_breaker_tests_passed: int = 0
    circuit_breaker_tests_failed: int = 0
    memory_leak_detected: bool = False
    max_memory_usage_mb: float = 0.0
    recovery_success_rate: float = 0.0
    
    # Exit criteria validation
    exit_criteria_met: bool = False
    exit_criteria_details: Dict[str, Any] = field(default_factory=dict)
    
    # Recommendations
    recommendations: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "test_id": self.test_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "total_duration": self.total_duration,
            "overall_result": self.overall_result.value,
            "phase_results": [
                {
                    "phase": pr.phase.value,
                    "start_time": pr.start_time.isoformat(),
                    "end_time": pr.end_time.isoformat() if pr.end_time else None,
                    "duration": pr.duration,
                    "result": pr.result.value,
                    "error_message": pr.error_message,
                    "metrics": pr.metrics,
                    "sub_results": pr.sub_results,
                }
                for pr in self.phase_results
            ],
            "summary_metrics": {
                "chaos_events_triggered": self.chaos_events_triggered,
                "circuit_breaker_tests_passed": self.circuit_breaker_tests_passed,
                "circuit_breaker_tests_failed": self.circuit_breaker_tests_failed,
                "memory_leak_detected": self.memory_leak_detected,
                "max_memory_usage_mb": self.max_memory_usage_mb,
                "recovery_success_rate": self.recovery_success_rate,
            },
            "exit_criteria": {
                "met": self.exit_criteria_met,
                "details": self.exit_criteria_details,
            },
            "recommendations": self.recommendations,
        }


class ResilienceTestOrchestrator:
    """Main orchestrator for comprehensive resilience testing"""
    
    def __init__(self, config: Optional[ResilienceTestConfig] = None):
        self.config = config or ResilienceTestConfig()
        self.test_id = f"resilience_test_{int(time.time())}"
        
        # Service instances
        self.chaos_service: Optional[ChaosEngineeringService] = None
        self.circuit_breaker_tester: Optional[AdvancedCircuitBreakerTester] = None
        self.memory_monitor: Optional[MemoryMonitoringService] = None
        
        # Test state
        self.is_running = False
        self.current_phase: Optional[TestPhase] = None
        self.test_report = ResilienceTestReport(
            test_id=self.test_id,
            config=self.config,
            start_time=datetime.now()
        )
        
        # Background tasks
        self.running_tasks: Set[asyncio.Task] = set()
        
    async def run_comprehensive_resilience_test(self) -> ResilienceTestReport:
        """Run comprehensive resilience test suite"""
        if self.is_running:
            raise Exception("Resilience test already running")
        
        self.is_running = True
        logger.info(f"Starting comprehensive resilience test: {self.test_id}")
        
        try:
            # Execute test phases in sequence
            await self._execute_phase(TestPhase.INITIALIZATION, self._initialize_services)
            await self._execute_phase(TestPhase.BASELINE_ESTABLISHMENT, self._establish_baseline)
            
            if self.config.enable_chaos_testing:
                await self._execute_phase(TestPhase.CHAOS_INJECTION, self._run_chaos_testing)
            
            if self.config.enable_circuit_breaker_testing:
                await self._execute_phase(TestPhase.CIRCUIT_BREAKER_TESTING, self._run_circuit_breaker_testing)
            
            if self.config.enable_cascading_failure_testing:
                await self._execute_phase(TestPhase.CASCADING_FAILURE_TESTING, self._run_cascading_failure_testing)
            
            if self.config.enable_memory_monitoring:
                await self._execute_phase(TestPhase.MEMORY_SOAK_TESTING, self._run_memory_soak_testing)
            
            await self._execute_phase(TestPhase.RECOVERY_VALIDATION, self._validate_recovery)
            await self._execute_phase(TestPhase.FINAL_ANALYSIS, self._perform_final_analysis)
            await self._execute_phase(TestPhase.CLEANUP, self._cleanup)
            
            # Determine overall result
            self._determine_overall_result()
            
        except Exception as e:
            logger.error(f"Resilience test failed: {e}")
            self.test_report.overall_result = TestResult.ERROR
            
            # Add error phase result
            error_phase = PhaseResult(
                phase=TestPhase.FINAL_ANALYSIS,
                start_time=datetime.now(),
                end_time=datetime.now(),
                result=TestResult.ERROR,
                error_message=str(e)
            )
            self.test_report.phase_results.append(error_phase)
            
        finally:
            self.is_running = False
            self.test_report.end_time = datetime.now()
            if self.test_report.start_time and self.test_report.end_time:
                self.test_report.total_duration = (
                    self.test_report.end_time - self.test_report.start_time
                ).total_seconds()
            
            # Clean up any remaining tasks
            await self._cleanup_tasks()
        
        logger.info(f"Resilience test completed: {self.test_report.overall_result.value}")
        return self.test_report
    
    async def _execute_phase(self, phase: TestPhase, phase_func):
        """Execute a test phase"""
        self.current_phase = phase
        
        phase_result = PhaseResult(
            phase=phase,
            start_time=datetime.now()
        )
        
        logger.info(f"Executing phase: {phase.value}")
        
        try:
            await phase_func(phase_result)
            phase_result.result = TestResult.PASS
            
        except Exception as e:
            logger.error(f"Phase {phase.value} failed: {e}")
            phase_result.result = TestResult.ERROR
            phase_result.error_message = str(e)
            
        finally:
            phase_result.end_time = datetime.now()
            phase_result.duration = (
                phase_result.end_time - phase_result.start_time
            ).total_seconds()
            
            self.test_report.phase_results.append(phase_result)
    
    async def _initialize_services(self, phase_result: PhaseResult):
        """Initialize all testing services"""
        logger.info("Initializing testing services")
        
        # Initialize chaos engineering service
        if self.config.enable_chaos_testing:
            chaos_config = self._create_chaos_config()
            self.chaos_service = ChaosEngineeringService(chaos_config)
            await self.chaos_service.start()
            phase_result.metrics["chaos_service_initialized"] = True
        
        # Initialize circuit breaker tester
        if self.config.enable_circuit_breaker_testing:
            self.circuit_breaker_tester = await create_circuit_breaker_tester()
            phase_result.metrics["circuit_breaker_tester_initialized"] = True
        
        # Initialize memory monitoring
        if self.config.enable_memory_monitoring:
            memory_config = SoakTestConfig(
                duration_hours=self.config.total_duration_hours,
                sampling_interval_seconds=self.config.memory_sampling_interval_seconds,
                memory_growth_threshold_percent=self.config.memory_growth_threshold_percent
            )
            self.memory_monitor = await get_memory_monitor(memory_config)
            await self.memory_monitor.start_monitoring()
            phase_result.metrics["memory_monitor_initialized"] = True
        
        phase_result.metrics["services_initialized"] = True
    
    def _create_chaos_config(self) -> ChaosConfig:
        """Create chaos configuration based on intensity"""
        base_config = ChaosConfig()
        
        if self.config.chaos_intensity == "low":
            base_config.timeout_probability = 0.05
            base_config.valuation_exception_rate = 0.2
            base_config.latency_spike_probability = 0.02
        elif self.config.chaos_intensity == "medium":
            base_config.timeout_probability = 0.1
            base_config.valuation_exception_rate = 0.5
            base_config.latency_spike_probability = 0.05
        elif self.config.chaos_intensity == "high":
            base_config.timeout_probability = 0.2
            base_config.valuation_exception_rate = 0.7
            base_config.latency_spike_probability = 0.1
        elif self.config.chaos_intensity == "extreme":
            base_config.timeout_probability = 0.3
            base_config.valuation_exception_rate = 0.9
            base_config.latency_spike_probability = 0.15
        
        return base_config
    
    async def _establish_baseline(self, phase_result: PhaseResult):
        """Establish baseline metrics before testing"""
        logger.info("Establishing baseline metrics")
        
        # Wait for services to stabilize
        await asyncio.sleep(60)
        
        # Collect baseline metrics
        baseline_metrics = {}
        
        if self.memory_monitor:
            status = self.memory_monitor.get_current_status()
            baseline_metrics["memory"] = {
                "current_memory_mb": status.get("current_memory_mb", 0),
                "system_memory_percent": status.get("current_system_memory_percent", 0),
            }
        
        # Get resilience service metrics
        try:
            resilience_service = await get_resilience_service()
            resilience_metrics = await resilience_service.get_all_metrics()
            baseline_metrics["resilience"] = resilience_metrics
        except Exception as e:
            logger.warning(f"Could not collect resilience baseline: {e}")
        
        phase_result.metrics = baseline_metrics
        logger.info("Baseline established successfully")
    
    async def _run_chaos_testing(self, phase_result: PhaseResult):
        """Run chaos engineering tests"""
        if not self.chaos_service:
            raise Exception("Chaos service not initialized")
        
        logger.info("Starting chaos testing phase")
        
        chaos_results = []
        
        # Run chaos scenarios sequentially
        for scenario in self.config.chaos_scenarios:
            try:
                target_service = self._get_target_service_for_scenario(scenario)
                duration = self._get_scenario_duration(scenario)
                
                logger.info(f"Injecting chaos: {scenario.value} on {target_service} for {duration}s")
                
                event = await self.chaos_service.inject_chaos(scenario, target_service, duration)
                chaos_results.append({
                    "scenario": scenario.value,
                    "target_service": target_service,
                    "success": event.success,
                    "duration": event.duration,
                    "error": event.error_message,
                })
                
                self.test_report.chaos_events_triggered += 1
                
                # Wait between chaos events
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Chaos scenario {scenario.value} failed: {e}")
                chaos_results.append({
                    "scenario": scenario.value,
                    "success": False,
                    "error": str(e),
                })
        
        phase_result.sub_results = chaos_results
        phase_result.metrics["chaos_events_triggered"] = len(chaos_results)
        phase_result.metrics["successful_chaos_events"] = len([r for r in chaos_results if r["success"]])
    
    def _get_target_service_for_scenario(self, scenario: ChaosScenario) -> str:
        """Get appropriate target service for chaos scenario"""
        service_mapping = {
            ChaosScenario.PROVIDER_TIMEOUT: "mlb_provider",
            ChaosScenario.VALUATION_EXCEPTION: "prop_analysis",
            ChaosScenario.LATENCY_SPIKE: "database",
            ChaosScenario.MEMORY_PRESSURE: "system",
            ChaosScenario.CPU_SATURATION: "system",
            ChaosScenario.NETWORK_PARTITION: "network",
            ChaosScenario.DATABASE_SLOWDOWN: "database",
            ChaosScenario.CASCADING_FAILURE: "frontend",
            ChaosScenario.RESOURCE_EXHAUSTION: "system",
            ChaosScenario.INTERMITTENT_ERRORS: "api",
        }
        return service_mapping.get(scenario, "unknown_service")
    
    def _get_scenario_duration(self, scenario: ChaosScenario) -> int:
        """Get appropriate duration for chaos scenario"""
        duration_mapping = {
            ChaosScenario.PROVIDER_TIMEOUT: 600,  # 10 minutes
            ChaosScenario.VALUATION_EXCEPTION: 300,  # 5 minutes
            ChaosScenario.LATENCY_SPIKE: 480,  # 8 minutes
            ChaosScenario.MEMORY_PRESSURE: 360,  # 6 minutes
            ChaosScenario.CPU_SATURATION: 240,  # 4 minutes
            ChaosScenario.NETWORK_PARTITION: 180,  # 3 minutes
            ChaosScenario.DATABASE_SLOWDOWN: 420,  # 7 minutes
            ChaosScenario.CASCADING_FAILURE: 900,  # 15 minutes
            ChaosScenario.RESOURCE_EXHAUSTION: 300,  # 5 minutes
            ChaosScenario.INTERMITTENT_ERRORS: 720,  # 12 minutes
        }
        return duration_mapping.get(scenario, 300)
    
    async def _run_circuit_breaker_testing(self, phase_result: PhaseResult):
        """Run circuit breaker tests"""
        if not self.circuit_breaker_tester:
            raise Exception("Circuit breaker tester not initialized")
        
        logger.info("Starting circuit breaker testing phase")
        
        # Run comprehensive circuit breaker tests
        results = await self.circuit_breaker_tester.run_comprehensive_circuit_breaker_tests("resilience_test_circuit")
        
        phase_result.sub_results.append(results)
        phase_result.metrics["total_tests"] = results.get("total_tests", 0)
        phase_result.metrics["passed_tests"] = results.get("passed_tests", 0)
        phase_result.metrics["failed_tests"] = results.get("failed_tests", 0)
        
        self.test_report.circuit_breaker_tests_passed = results.get("passed_tests", 0)
        self.test_report.circuit_breaker_tests_failed = results.get("failed_tests", 0)
    
    async def _run_cascading_failure_testing(self, phase_result: PhaseResult):
        """Run cascading failure tests"""
        if not self.circuit_breaker_tester:
            raise Exception("Circuit breaker tester not initialized")
        
        logger.info("Starting cascading failure testing phase")
        
        # Run cascading failure tests
        cascade_results = await self.circuit_breaker_tester.run_cascading_failure_tests(
            self.config.service_topology
        )
        
        phase_result.sub_results.append(cascade_results)
        phase_result.metrics["cascade_tests"] = cascade_results.get("total_tests", 0)
        phase_result.metrics["cascade_passes"] = cascade_results.get("passed_tests", 0)
        phase_result.metrics["cascade_failures"] = cascade_results.get("failed_tests", 0)
    
    async def _run_memory_soak_testing(self, phase_result: PhaseResult):
        """Run extended memory monitoring"""
        if not self.memory_monitor:
            raise Exception("Memory monitor not initialized")
        
        logger.info("Starting memory soak testing phase")
        
        # Memory monitoring runs continuously, just collect current status
        status = self.memory_monitor.get_current_status()
        
        phase_result.metrics["memory_monitoring"] = status
        phase_result.metrics["monitoring_duration_hours"] = status.get("monitoring_duration_minutes", 0) / 60
        
        # Check if memory growth is concerning
        if status.get("current_memory_mb", 0) > 0:
            self.test_report.max_memory_usage_mb = max(
                self.test_report.max_memory_usage_mb,
                status["current_memory_mb"]
            )
    
    async def _validate_recovery(self, phase_result: PhaseResult):
        """Validate system recovery after chaos testing"""
        logger.info("Validating system recovery")
        
        recovery_metrics = {}
        
        # Wait for systems to recover
        await asyncio.sleep(120)  # 2 minutes recovery time
        
        # Check resilience service status
        try:
            resilience_service = await get_resilience_service()
            metrics = await resilience_service.get_all_metrics()
            
            # Count healthy services
            cb_metrics = metrics.get("circuit_breakers", {})
            healthy_services = sum(
                1 for cb in cb_metrics.values() 
                if cb.get("service_state") == "healthy"
            )
            total_services = len(cb_metrics)
            
            recovery_rate = healthy_services / total_services if total_services > 0 else 1.0
            recovery_metrics["recovery_rate"] = recovery_rate
            recovery_metrics["healthy_services"] = healthy_services
            recovery_metrics["total_services"] = total_services
            
            self.test_report.recovery_success_rate = recovery_rate
            
        except Exception as e:
            logger.warning(f"Could not validate recovery: {e}")
            recovery_metrics["error"] = str(e)
        
        phase_result.metrics = recovery_metrics
    
    async def _perform_final_analysis(self, phase_result: PhaseResult):
        """Perform final analysis and generate recommendations"""
        logger.info("Performing final analysis")
        
        analysis = {}
        
        # Stop memory monitoring and get final report
        if self.memory_monitor:
            memory_report = await self.memory_monitor.stop_monitoring()
            analysis["memory_report"] = memory_report
            
            # Check for memory leaks
            if memory_report.get("memory_analysis", {}).get("memory_leak_detected"):
                self.test_report.memory_leak_detected = True
        
        # Analyze exit criteria
        self._validate_exit_criteria()
        
        # Generate recommendations
        self._generate_recommendations()
        
        phase_result.metrics = analysis
    
    async def _cleanup(self, phase_result: PhaseResult):
        """Clean up test resources"""
        logger.info("Cleaning up test resources")
        
        cleanup_status = {}
        
        # Stop chaos service
        if self.chaos_service:
            try:
                await self.chaos_service.stop()
                cleanup_status["chaos_service_stopped"] = True
            except Exception as e:
                logger.warning(f"Error stopping chaos service: {e}")
                cleanup_status["chaos_service_error"] = str(e)
        
        # Memory monitor should already be stopped in final analysis
        
        phase_result.metrics = cleanup_status
    
    async def _cleanup_tasks(self):
        """Clean up any running background tasks"""
        for task in self.running_tasks:
            if not task.done():
                task.cancel()
        
        if self.running_tasks:
            await asyncio.gather(*self.running_tasks, return_exceptions=True)
        
        self.running_tasks.clear()
    
    def _validate_exit_criteria(self):
        """Validate exit criteria and determine if test passed"""
        criteria = {}
        all_met = True
        
        # Memory growth criteria
        memory_growth_ok = True
        if self.test_report.memory_leak_detected:
            memory_growth_ok = False
            all_met = False
        
        criteria["memory_growth_acceptable"] = memory_growth_ok
        
        # System memory criteria
        system_memory_ok = self.test_report.max_memory_usage_mb < (
            self.config.max_system_memory_percent * 1024  # Rough conversion
        )
        criteria["system_memory_acceptable"] = system_memory_ok
        if not system_memory_ok:
            all_met = False
        
        # Recovery criteria
        recovery_ok = self.test_report.recovery_success_rate >= self.config.min_recovery_success_rate
        criteria["recovery_rate_acceptable"] = recovery_ok
        if not recovery_ok:
            all_met = False
        
        # Circuit breaker test criteria
        total_cb_tests = self.test_report.circuit_breaker_tests_passed + self.test_report.circuit_breaker_tests_failed
        cb_success_rate = (
            self.test_report.circuit_breaker_tests_passed / total_cb_tests 
            if total_cb_tests > 0 else 1.0
        )
        cb_tests_ok = cb_success_rate >= 0.8  # 80% success rate
        criteria["circuit_breaker_tests_acceptable"] = cb_tests_ok
        if not cb_tests_ok:
            all_met = False
        
        self.test_report.exit_criteria_met = all_met
        self.test_report.exit_criteria_details = criteria
    
    def _generate_recommendations(self):
        """Generate recommendations based on test results"""
        recommendations = []
        
        # Memory recommendations
        if self.test_report.memory_leak_detected:
            recommendations.append("Memory leak detected - investigate object lifecycle and cleanup patterns")
            recommendations.append("Implement more frequent garbage collection cycles")
            recommendations.append("Review caching strategies to prevent unbounded growth")
        
        # Recovery recommendations
        if self.test_report.recovery_success_rate < 0.9:
            recommendations.append("System recovery could be improved - review circuit breaker configurations")
            recommendations.append("Consider implementing health checks and automated recovery mechanisms")
        
        # Circuit breaker recommendations
        if self.test_report.circuit_breaker_tests_failed > 0:
            recommendations.append("Some circuit breaker tests failed - review failure thresholds and recovery timeouts")
            recommendations.append("Consider implementing bulkhead isolation patterns")
        
        # Chaos testing recommendations
        if self.test_report.chaos_events_triggered == 0:
            recommendations.append("No chaos events were triggered - consider increasing chaos intensity")
        
        # General recommendations
        if self.test_report.exit_criteria_met:
            recommendations.append("All exit criteria met - system demonstrates good resilience")
            recommendations.append("Consider running longer soak tests to validate stability over extended periods")
        else:
            recommendations.append("Exit criteria not fully met - system requires resilience improvements")
            recommendations.append("Focus on the failing criteria identified in the exit criteria details")
        
        self.test_report.recommendations = recommendations
    
    def _determine_overall_result(self):
        """Determine overall test result"""
        if self.test_report.exit_criteria_met:
            # Check if there were any warnings
            warning_conditions = [
                self.test_report.memory_leak_detected,
                self.test_report.recovery_success_rate < 0.95,
                self.test_report.circuit_breaker_tests_failed > 0,
            ]
            
            if any(warning_conditions):
                self.test_report.overall_result = TestResult.WARNING
            else:
                self.test_report.overall_result = TestResult.PASS
        else:
            self.test_report.overall_result = TestResult.FAIL
    
    def get_current_status(self) -> Dict[str, Any]:
        """Get current test status"""
        return {
            "test_id": self.test_id,
            "is_running": self.is_running,
            "current_phase": self.current_phase.value if self.current_phase else None,
            "phases_completed": len(self.test_report.phase_results),
            "chaos_events_triggered": self.test_report.chaos_events_triggered,
            "memory_leak_detected": self.test_report.memory_leak_detected,
            "recovery_success_rate": self.test_report.recovery_success_rate,
            "exit_criteria_met": self.test_report.exit_criteria_met,
        }


# Global orchestrator instance
global_orchestrator: Optional[ResilienceTestOrchestrator] = None


def create_orchestrator(config: Optional[ResilienceTestConfig] = None) -> ResilienceTestOrchestrator:
    """Create a new resilience test orchestrator"""
    return ResilienceTestOrchestrator(config)


async def run_resilience_test(config: Optional[ResilienceTestConfig] = None) -> ResilienceTestReport:
    """Run a comprehensive resilience test"""
    orchestrator = create_orchestrator(config)
    return await orchestrator.run_comprehensive_resilience_test()