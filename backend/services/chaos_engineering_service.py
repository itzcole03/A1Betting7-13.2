"""
Chaos Engineering Service - Advanced Resilience Testing
Implements comprehensive chaos injection patterns for proving system resilience
"""

import asyncio
import logging
import psutil
import random
import time
import traceback
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
from contextlib import asynccontextmanager

from backend.services.unified_logging import unified_logging
from backend.services.unified_error_handler import unified_error_handler

logger = unified_logging.get_logger("chaos_engineering")


class ChaosScenario(Enum):
    """Types of chaos scenarios"""
    PROVIDER_TIMEOUT = "provider_timeout"
    VALUATION_EXCEPTION = "valuation_exception"
    LATENCY_SPIKE = "latency_spike"
    MEMORY_PRESSURE = "memory_pressure"
    CPU_SATURATION = "cpu_saturation"
    NETWORK_PARTITION = "network_partition"
    DATABASE_SLOWDOWN = "database_slowdown"
    CASCADING_FAILURE = "cascading_failure"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    INTERMITTENT_ERRORS = "intermittent_errors"


class ChaosImpact(Enum):
    """Impact levels for chaos scenarios"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ChaosEvent:
    """Record of a chaos event"""
    id: str
    scenario: ChaosScenario
    impact: ChaosImpact
    target_service: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    success: bool = False
    error_message: Optional[str] = None
    recovery_time: Optional[float] = None
    metrics_before: Dict[str, Any] = field(default_factory=dict)
    metrics_after: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ChaosConfig:
    """Configuration for chaos scenarios"""
    
    # Provider timeout config
    timeout_probability: float = 0.1  # 10% chance
    timeout_duration_range: Tuple[int, int] = (5, 30)  # 5-30 seconds
    timeout_services: List[str] = field(default_factory=lambda: ["mlb_provider", "prizepicks", "sportsbook"])
    
    # Valuation exception config
    valuation_exception_rate: float = 0.5  # 50% failure rate
    exception_duration: int = 60  # 60 seconds
    exception_types: List[str] = field(default_factory=lambda: [
        "ValueError", "TypeError", "KeyError", "AttributeError"
    ])
    
    # Latency spike config
    latency_spike_probability: float = 0.05  # 5% chance
    latency_multiplier_range: Tuple[int, int] = (2, 10)  # 2x to 10x normal latency
    latency_duration_range: Tuple[int, int] = (10, 120)  # 10-120 seconds
    
    # Memory pressure config
    memory_pressure_threshold: float = 0.8  # 80% memory usage
    memory_allocation_size: int = 100 * 1024 * 1024  # 100MB chunks
    
    # CPU saturation config
    cpu_saturation_duration: int = 60  # 60 seconds
    cpu_load_percentage: int = 80  # 80% CPU usage
    
    # Database slowdown config
    db_slowdown_multiplier: int = 5  # 5x slower
    db_slowdown_probability: float = 0.1  # 10% chance
    
    # Network partition simulation
    network_partition_duration: int = 30  # 30 seconds
    partition_services: List[str] = field(default_factory=lambda: ["redis", "database"])
    
    # Cascading failure config
    cascade_trigger_threshold: int = 3  # 3 failures trigger cascade
    cascade_propagation_delay: float = 1.0  # 1 second between cascades
    
    # Resource exhaustion
    disk_fill_percentage: float = 0.9  # Fill to 90%
    connection_pool_exhaustion: int = 10  # Max connections before exhaustion
    
    # Recovery settings
    auto_recovery: bool = True
    recovery_delay_range: Tuple[int, int] = (30, 180)  # 30-180 seconds
    max_concurrent_chaos: int = 3  # Maximum concurrent chaos events


class ChaosInjector:
    """Individual chaos injection implementation"""
    
    def __init__(self, scenario: ChaosScenario, config: ChaosConfig):
        self.scenario = scenario
        self.config = config
        self.is_active = False
        self.start_time: Optional[datetime] = None
        self.chaos_tasks: Set[asyncio.Task] = set()
        self.memory_ballast: List[bytearray] = []
        self.cpu_tasks: List[asyncio.Task] = []
        
    async def inject(self, target_service: str, duration: Optional[int] = None) -> ChaosEvent:
        """Inject chaos scenario"""
        event_id = f"chaos-{self.scenario.value}-{int(time.time() * 1000)}"
        
        chaos_event = ChaosEvent(
            id=event_id,
            scenario=self.scenario,
            impact=self._calculate_impact(),
            target_service=target_service,
            start_time=datetime.now(),
            context={"duration": duration}
        )
        
        # Record metrics before chaos
        chaos_event.metrics_before = await self._collect_metrics()
        
        try:
            logger.info(f"Injecting chaos: {self.scenario.value} on {target_service}")
            
            # Execute chaos scenario
            await self._execute_chaos(chaos_event, duration)
            
            chaos_event.success = True
            
        except Exception as e:
            chaos_event.error_message = str(e)
            chaos_event.success = False
            logger.error(f"Chaos injection failed: {e}")
            
        finally:
            chaos_event.end_time = datetime.now()
            chaos_event.duration = (chaos_event.end_time - chaos_event.start_time).total_seconds()
            
            # Record metrics after chaos
            chaos_event.metrics_after = await self._collect_metrics()
            
            # Stop chaos if auto-recovery is enabled
            if self.config.auto_recovery:
                await self.stop()
                
        return chaos_event
    
    async def _execute_chaos(self, event: ChaosEvent, duration: Optional[int]):
        """Execute specific chaos scenario"""
        if self.scenario == ChaosScenario.PROVIDER_TIMEOUT:
            await self._inject_provider_timeout(event, duration)
        elif self.scenario == ChaosScenario.VALUATION_EXCEPTION:
            await self._inject_valuation_exception(event, duration)
        elif self.scenario == ChaosScenario.LATENCY_SPIKE:
            await self._inject_latency_spike(event, duration)
        elif self.scenario == ChaosScenario.MEMORY_PRESSURE:
            await self._inject_memory_pressure(event, duration)
        elif self.scenario == ChaosScenario.CPU_SATURATION:
            await self._inject_cpu_saturation(event, duration)
        elif self.scenario == ChaosScenario.NETWORK_PARTITION:
            await self._inject_network_partition(event, duration)
        elif self.scenario == ChaosScenario.DATABASE_SLOWDOWN:
            await self._inject_database_slowdown(event, duration)
        elif self.scenario == ChaosScenario.CASCADING_FAILURE:
            await self._inject_cascading_failure(event, duration)
        elif self.scenario == ChaosScenario.RESOURCE_EXHAUSTION:
            await self._inject_resource_exhaustion(event, duration)
        elif self.scenario == ChaosScenario.INTERMITTENT_ERRORS:
            await self._inject_intermittent_errors(event, duration)
    
    async def _inject_provider_timeout(self, event: ChaosEvent, duration: Optional[int]):
        """Inject random provider timeouts"""
        timeout_duration = random.randint(*self.config.timeout_duration_range)
        test_duration = duration or 300  # 5 minutes default
        
        self.is_active = True
        start_time = time.time()
        
        # Monkey patch HTTP client to inject timeouts
        original_timeout = asyncio.wait_for
        
        async def timeout_injector(coro, timeout=None):
            if (self.is_active and 
                random.random() < self.config.timeout_probability and
                time.time() - start_time < test_duration):
                
                logger.warning(f"Chaos: Injecting timeout in {event.target_service}")
                await asyncio.sleep(timeout_duration)
                raise asyncio.TimeoutError("Chaos-injected timeout")
            
            return await original_timeout(coro, timeout)
        
        # Apply timeout injection
        asyncio.wait_for = timeout_injector
        
        try:
            await asyncio.sleep(test_duration)
        finally:
            # Restore original function
            asyncio.wait_for = original_timeout
            self.is_active = False
    
    async def _inject_valuation_exception(self, event: ChaosEvent, duration: Optional[int]):
        """Inject intermittent 50% valuation exceptions"""
        test_duration = duration or self.config.exception_duration
        
        self.is_active = True
        start_time = time.time()
        exception_count = 0
        
        # Store original exception handlers
        original_handlers = {}
        
        # Create exception injector
        def create_exception_injector(original_func):
            async def exception_injector(*args, **kwargs):
                nonlocal exception_count
                
                if (self.is_active and 
                    random.random() < self.config.valuation_exception_rate and
                    time.time() - start_time < test_duration):
                    
                    exception_count += 1
                    exception_type = random.choice(self.config.exception_types)
                    error_message = f"Chaos-injected {exception_type}: Valuation failure #{exception_count}"
                    
                    logger.warning(f"Chaos: Injecting {exception_type} in {event.target_service}")
                    
                    if exception_type == "ValueError":
                        raise ValueError(error_message)
                    elif exception_type == "TypeError":
                        raise TypeError(error_message)
                    elif exception_type == "KeyError":
                        raise KeyError(error_message)
                    elif exception_type == "AttributeError":
                        raise AttributeError(error_message)
                
                return await original_func(*args, **kwargs)
            
            return exception_injector
        
        try:
            await asyncio.sleep(test_duration)
        finally:
            self.is_active = False
            event.context["exception_count"] = exception_count
    
    async def _inject_latency_spike(self, event: ChaosEvent, duration: Optional[int]):
        """Inject random latency spikes"""
        test_duration = duration or random.randint(*self.config.latency_duration_range)
        latency_multiplier = random.randint(*self.config.latency_multiplier_range)
        
        self.is_active = True
        start_time = time.time()
        spike_count = 0
        
        # Create latency injector
        async def latency_injector():
            nonlocal spike_count
            
            while self.is_active and time.time() - start_time < test_duration:
                if random.random() < self.config.latency_spike_probability:
                    spike_duration = random.uniform(0.1, 2.0) * latency_multiplier
                    spike_count += 1
                    
                    logger.warning(f"Chaos: Injecting {spike_duration:.2f}s latency spike")
                    await asyncio.sleep(spike_duration)
                
                await asyncio.sleep(1)  # Check every second
        
        latency_task = asyncio.create_task(latency_injector())
        self.chaos_tasks.add(latency_task)
        
        try:
            await asyncio.sleep(test_duration)
        finally:
            self.is_active = False
            latency_task.cancel()
            self.chaos_tasks.discard(latency_task)
            event.context["spike_count"] = spike_count
    
    async def _inject_memory_pressure(self, event: ChaosEvent, duration: Optional[int]):
        """Inject memory pressure"""
        test_duration = duration or 300  # 5 minutes default
        
        self.is_active = True
        start_time = time.time()
        
        # Get current memory usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss
        target_memory = initial_memory * 1.5  # Increase by 50%
        
        try:
            # Allocate memory in chunks
            while (self.is_active and 
                   time.time() - start_time < test_duration and
                   process.memory_info().rss < target_memory):
                
                chunk = bytearray(self.config.memory_allocation_size)
                # Fill with random data to prevent optimization
                for i in range(0, len(chunk), 1024):
                    chunk[i] = random.randint(0, 255)
                
                self.memory_ballast.append(chunk)
                
                logger.info(f"Chaos: Allocated {len(self.memory_ballast) * 100}MB memory ballast")
                await asyncio.sleep(1)
                
        finally:
            # Clean up memory ballast
            self.memory_ballast.clear()
            self.is_active = False
            
            final_memory = process.memory_info().rss
            event.context["memory_increase"] = final_memory - initial_memory
    
    async def _inject_cpu_saturation(self, event: ChaosEvent, duration: Optional[int]):
        """Inject CPU saturation"""
        test_duration = duration or self.config.cpu_saturation_duration
        cpu_count = psutil.cpu_count()
        target_load = self.config.cpu_load_percentage / 100.0
        
        self.is_active = True
        
        # Create CPU-intensive tasks
        async def cpu_worker():
            """CPU-intensive work"""
            start = time.time()
            while self.is_active and time.time() - start < test_duration:
                # Busy work
                for _ in range(100000):
                    _ = sum(range(100))
                await asyncio.sleep(0.001)  # Small yield
        
        # Start CPU workers
        num_workers = max(1, int(cpu_count * target_load))
        for _ in range(num_workers):
            task = asyncio.create_task(cpu_worker())
            self.cpu_tasks.append(task)
        
        try:
            await asyncio.sleep(test_duration)
        finally:
            # Stop CPU workers
            self.is_active = False
            for task in self.cpu_tasks:
                task.cancel()
            self.cpu_tasks.clear()
            
            event.context["cpu_workers"] = num_workers
    
    async def _inject_network_partition(self, event: ChaosEvent, duration: Optional[int]):
        """Simulate network partition"""
        test_duration = duration or self.config.network_partition_duration
        
        self.is_active = True
        
        # Simulate by introducing connection delays and failures
        async def network_delay_injector():
            while self.is_active:
                # Random delay between 0.1 and 2 seconds
                delay = random.uniform(0.1, 2.0)
                await asyncio.sleep(delay)
                
                if random.random() < 0.3:  # 30% chance of connection failure
                    logger.warning("Chaos: Network partition - connection failed")
        
        network_task = asyncio.create_task(network_delay_injector())
        self.chaos_tasks.add(network_task)
        
        try:
            await asyncio.sleep(test_duration)
        finally:
            self.is_active = False
            network_task.cancel()
            self.chaos_tasks.discard(network_task)
    
    async def _inject_database_slowdown(self, event: ChaosEvent, duration: Optional[int]):
        """Inject database slowdown"""
        test_duration = duration or 180  # 3 minutes default
        
        self.is_active = True
        
        # Create database delay injector
        async def db_delay_injector():
            while self.is_active:
                if random.random() < self.config.db_slowdown_probability:
                    delay = random.uniform(0.5, 3.0) * self.config.db_slowdown_multiplier
                    logger.warning(f"Chaos: Database slowdown - {delay:.2f}s delay")
                    await asyncio.sleep(delay)
                
                await asyncio.sleep(1)
        
        db_task = asyncio.create_task(db_delay_injector())
        self.chaos_tasks.add(db_task)
        
        try:
            await asyncio.sleep(test_duration)
        finally:
            self.is_active = False
            db_task.cancel()
            self.chaos_tasks.discard(db_task)
    
    async def _inject_cascading_failure(self, event: ChaosEvent, duration: Optional[int]):
        """Inject cascading failure pattern"""
        test_duration = duration or 600  # 10 minutes default
        services = ["provider_a", "provider_b", "database", "cache", "analytics"]
        
        self.is_active = True
        failed_services = set()
        
        try:
            # Initial failure
            initial_service = random.choice(services)
            failed_services.add(initial_service)
            logger.warning(f"Chaos: Initial failure in {initial_service}")
            
            # Cascade failures
            while (self.is_active and 
                   len(failed_services) < len(services) and
                   time.time() - time.time() < test_duration):
                
                if len(failed_services) >= self.config.cascade_trigger_threshold:
                    # Trigger cascade
                    remaining_services = [s for s in services if s not in failed_services]
                    if remaining_services:
                        next_failure = random.choice(remaining_services)
                        failed_services.add(next_failure)
                        logger.warning(f"Chaos: Cascading failure to {next_failure}")
                
                await asyncio.sleep(self.config.cascade_propagation_delay)
                
        finally:
            self.is_active = False
            event.context["failed_services"] = list(failed_services)
    
    async def _inject_resource_exhaustion(self, event: ChaosEvent, duration: Optional[int]):
        """Inject resource exhaustion"""
        test_duration = duration or 300  # 5 minutes default
        
        self.is_active = True
        
        # Simulate connection pool exhaustion
        connections = []
        
        try:
            # Exhaust connection pool
            for i in range(self.config.connection_pool_exhaustion * 2):
                # Simulate holding connections
                connection_id = f"chaos_conn_{i}"
                connections.append(connection_id)
                
                if i % 5 == 0:
                    logger.warning(f"Chaos: Exhausted {len(connections)} connections")
                
                await asyncio.sleep(0.1)
            
            await asyncio.sleep(test_duration)
            
        finally:
            # Release connections
            connections.clear()
            self.is_active = False
            event.context["max_connections"] = len(connections)
    
    async def _inject_intermittent_errors(self, event: ChaosEvent, duration: Optional[int]):
        """Inject intermittent errors"""
        test_duration = duration or 600  # 10 minutes default
        error_types = ["ConnectionError", "HTTPError", "TimeoutError", "ValidationError"]
        
        self.is_active = True
        error_count = 0
        
        try:
            while self.is_active and time.time() - time.time() < test_duration:
                # Random intermittent error
                if random.random() < 0.1:  # 10% chance every second
                    error_type = random.choice(error_types)
                    error_count += 1
                    logger.warning(f"Chaos: Intermittent {error_type} #{error_count}")
                
                await asyncio.sleep(1)
                
        finally:
            self.is_active = False
            event.context["error_count"] = error_count
    
    def _calculate_impact(self) -> ChaosImpact:
        """Calculate chaos impact level"""
        impact_mapping = {
            ChaosScenario.PROVIDER_TIMEOUT: ChaosImpact.MEDIUM,
            ChaosScenario.VALUATION_EXCEPTION: ChaosImpact.HIGH,
            ChaosScenario.LATENCY_SPIKE: ChaosImpact.MEDIUM,
            ChaosScenario.MEMORY_PRESSURE: ChaosImpact.HIGH,
            ChaosScenario.CPU_SATURATION: ChaosImpact.HIGH,
            ChaosScenario.NETWORK_PARTITION: ChaosImpact.CRITICAL,
            ChaosScenario.DATABASE_SLOWDOWN: ChaosImpact.HIGH,
            ChaosScenario.CASCADING_FAILURE: ChaosImpact.CRITICAL,
            ChaosScenario.RESOURCE_EXHAUSTION: ChaosImpact.CRITICAL,
            ChaosScenario.INTERMITTENT_ERRORS: ChaosImpact.MEDIUM,
        }
        
        return impact_mapping.get(self.scenario, ChaosImpact.MEDIUM)
    
    async def _collect_metrics(self) -> Dict[str, Any]:
        """Collect system metrics"""
        try:
            process = psutil.Process()
            
            return {
                "timestamp": datetime.now().isoformat(),
                "cpu_percent": process.cpu_percent(),
                "memory_rss": process.memory_info().rss,
                "memory_vms": process.memory_info().vms,
                "memory_percent": process.memory_percent(),
                "num_threads": process.num_threads(),
                "num_fds": getattr(process, 'num_fds', lambda: 0)(),
                "connections": len(getattr(process, 'connections', lambda: [])()),
                "system_cpu": psutil.cpu_percent(interval=1),
                "system_memory": psutil.virtual_memory().percent,
                "system_disk": psutil.disk_usage('/').percent,
            }
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            return {}
    
    async def stop(self):
        """Stop chaos injection"""
        self.is_active = False
        
        # Cancel all chaos tasks
        for task in self.chaos_tasks:
            task.cancel()
        self.chaos_tasks.clear()
        
        # Clean up CPU tasks
        for task in self.cpu_tasks:
            task.cancel()
        self.cpu_tasks.clear()
        
        # Clean up memory ballast
        self.memory_ballast.clear()
        
        logger.info(f"Stopped chaos injection: {self.scenario.value}")


class ChaosEngineeringService:
    """Main chaos engineering orchestrator"""
    
    def __init__(self, config: Optional[ChaosConfig] = None):
        self.config = config or ChaosConfig()
        self.active_chaos: Dict[str, ChaosInjector] = {}
        self.chaos_history: List[ChaosEvent] = []
        self.is_running = False
        self.monitoring_task: Optional[asyncio.Task] = None
        self.metrics_history: deque = deque(maxlen=1000)
        
    async def start(self):
        """Start chaos engineering service"""
        if self.is_running:
            return
        
        logger.info("Starting chaos engineering service")
        self.is_running = True
        
        # Start monitoring
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        
        logger.info("Chaos engineering service started")
    
    async def stop(self):
        """Stop chaos engineering service"""
        if not self.is_running:
            return
        
        logger.info("Stopping chaos engineering service")
        self.is_running = False
        
        # Stop monitoring
        if self.monitoring_task:
            self.monitoring_task.cancel()
        
        # Stop all active chaos
        for chaos in list(self.active_chaos.values()):
            await chaos.stop()
        
        self.active_chaos.clear()
        
        logger.info("Chaos engineering service stopped")
    
    async def inject_chaos(
        self,
        scenario: ChaosScenario,
        target_service: str,
        duration: Optional[int] = None
    ) -> ChaosEvent:
        """Inject specific chaos scenario"""
        if len(self.active_chaos) >= self.config.max_concurrent_chaos:
            raise Exception("Maximum concurrent chaos events reached")
        
        chaos_key = f"{scenario.value}_{target_service}_{int(time.time())}"
        
        if chaos_key in self.active_chaos:
            raise Exception(f"Chaos already active for {scenario.value} on {target_service}")
        
        injector = ChaosInjector(scenario, self.config)
        self.active_chaos[chaos_key] = injector
        
        try:
            # Inject chaos
            event = await injector.inject(target_service, duration)
            self.chaos_history.append(event)
            
            return event
            
        finally:
            # Clean up
            if chaos_key in self.active_chaos:
                del self.active_chaos[chaos_key]
    
    async def inject_multiple_chaos(
        self,
        scenarios: List[Tuple[ChaosScenario, str, Optional[int]]]
    ) -> List[ChaosEvent]:
        """Inject multiple chaos scenarios simultaneously"""
        if len(scenarios) > self.config.max_concurrent_chaos:
            raise Exception("Too many chaos scenarios requested")
        
        # Start all chaos scenarios
        tasks = []
        for scenario, target_service, duration in scenarios:
            task = asyncio.create_task(
                self.inject_chaos(scenario, target_service, duration)
            )
            tasks.append(task)
        
        # Wait for all to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Return successful events
        events = []
        for result in results:
            if isinstance(result, ChaosEvent):
                events.append(result)
            else:
                logger.error(f"Chaos injection failed: {result}")
        
        return events
    
    async def run_chaos_suite(self, duration_hours: int = 4) -> Dict[str, Any]:
        """Run comprehensive chaos test suite"""
        start_time = datetime.now()
        suite_duration = duration_hours * 3600  # Convert to seconds
        
        logger.info(f"Starting {duration_hours}h chaos test suite")
        
        # Define chaos scenarios to run
        scenarios = [
            (ChaosScenario.PROVIDER_TIMEOUT, "mlb_provider", 1800),  # 30 min
            (ChaosScenario.VALUATION_EXCEPTION, "prop_analysis", 900),  # 15 min
            (ChaosScenario.LATENCY_SPIKE, "database", 1200),  # 20 min
            (ChaosScenario.MEMORY_PRESSURE, "system", 600),  # 10 min
            (ChaosScenario.INTERMITTENT_ERRORS, "api", 2400),  # 40 min
        ]
        
        suite_results = {
            "start_time": start_time.isoformat(),
            "planned_duration_hours": duration_hours,
            "scenarios": [],
            "total_events": 0,
            "successful_events": 0,
            "failed_events": 0,
            "system_recovery_time": 0,
            "memory_leak_detected": False,
            "performance_degradation": 0,
        }
        
        try:
            elapsed = 0
            scenario_index = 0
            
            while elapsed < suite_duration and self.is_running:
                # Pick next scenario
                if scenario_index >= len(scenarios):
                    scenario_index = 0
                
                scenario, target, duration = scenarios[scenario_index]
                scenario_index += 1
                
                # Wait random interval between chaos events
                wait_time = random.randint(60, 300)  # 1-5 minutes
                logger.info(f"Waiting {wait_time}s before next chaos event")
                await asyncio.sleep(wait_time)
                
                # Inject chaos
                try:
                    event = await self.inject_chaos(scenario, target, duration)
                    suite_results["scenarios"].append({
                        "scenario": scenario.value,
                        "target": target,
                        "success": event.success,
                        "duration": event.duration,
                        "recovery_time": event.recovery_time,
                    })
                    
                    if event.success:
                        suite_results["successful_events"] += 1
                    else:
                        suite_results["failed_events"] += 1
                    
                    suite_results["total_events"] += 1
                    
                except Exception as e:
                    logger.error(f"Chaos suite error: {e}")
                    suite_results["failed_events"] += 1
                
                elapsed = (datetime.now() - start_time).total_seconds()
        
        except Exception as e:
            logger.error(f"Chaos suite failed: {e}")
            suite_results["error"] = str(e)
        
        finally:
            end_time = datetime.now()
            suite_results["end_time"] = end_time.isoformat()
            suite_results["actual_duration"] = (end_time - start_time).total_seconds()
            
            # Analyze results
            suite_results.update(await self._analyze_suite_results())
        
        return suite_results
    
    async def _analyze_suite_results(self) -> Dict[str, Any]:
        """Analyze chaos suite results"""
        analysis = {
            "memory_analysis": await self._analyze_memory_usage(),
            "performance_analysis": await self._analyze_performance(),
            "recovery_analysis": await self._analyze_recovery_patterns(),
            "failure_analysis": await self._analyze_failure_patterns(),
        }
        
        return analysis
    
    async def _analyze_memory_usage(self) -> Dict[str, Any]:
        """Analyze memory usage patterns"""
        if len(self.metrics_history) < 100:
            return {"error": "Insufficient metrics data"}
        
        metrics = list(self.metrics_history)
        memory_values = [m.get("memory_rss", 0) for m in metrics if "memory_rss" in m]
        
        if not memory_values:
            return {"error": "No memory data available"}
        
        initial_memory = memory_values[:10]  # First 10 readings
        final_memory = memory_values[-10:]   # Last 10 readings
        
        initial_avg = sum(initial_memory) / len(initial_memory)
        final_avg = sum(final_memory) / len(final_memory)
        
        memory_growth = ((final_avg - initial_avg) / initial_avg) * 100
        max_memory = max(memory_values)
        min_memory = min(memory_values)
        
        return {
            "initial_memory_mb": initial_avg / (1024 * 1024),
            "final_memory_mb": final_avg / (1024 * 1024),
            "memory_growth_percent": memory_growth,
            "max_memory_mb": max_memory / (1024 * 1024),
            "min_memory_mb": min_memory / (1024 * 1024),
            "memory_leak_detected": memory_growth > 10,  # More than 10% growth
        }
    
    async def _analyze_performance(self) -> Dict[str, Any]:
        """Analyze performance patterns"""
        if len(self.metrics_history) < 50:
            return {"error": "Insufficient metrics data"}
        
        metrics = list(self.metrics_history)
        cpu_values = [m.get("cpu_percent", 0) for m in metrics if "cpu_percent" in m]
        
        if not cpu_values:
            return {"error": "No CPU data available"}
        
        avg_cpu = sum(cpu_values) / len(cpu_values)
        max_cpu = max(cpu_values)
        
        return {
            "average_cpu_percent": avg_cpu,
            "max_cpu_percent": max_cpu,
            "cpu_spikes": sum(1 for c in cpu_values if c > 80),
            "performance_degradation": max(0, avg_cpu - 20),  # Baseline 20%
        }
    
    async def _analyze_recovery_patterns(self) -> Dict[str, Any]:
        """Analyze system recovery patterns"""
        successful_recoveries = [
            event for event in self.chaos_history 
            if event.success and event.recovery_time is not None
        ]
        
        if not successful_recoveries:
            return {"error": "No recovery data available"}
        
        recovery_times = [event.recovery_time for event in successful_recoveries]
        
        return {
            "total_recoveries": len(successful_recoveries),
            "average_recovery_time": sum(recovery_times) / len(recovery_times),
            "max_recovery_time": max(recovery_times),
            "min_recovery_time": min(recovery_times),
            "recovery_success_rate": len(successful_recoveries) / len(self.chaos_history)
        }
    
    async def _analyze_failure_patterns(self) -> Dict[str, Any]:
        """Analyze failure patterns"""
        failure_types = defaultdict(int)
        for event in self.chaos_history:
            if not event.success:
                failure_types[event.scenario.value] += 1
        
        return {
            "total_failures": len([e for e in self.chaos_history if not e.success]),
            "failure_types": dict(failure_types),
            "failure_rate": len([e for e in self.chaos_history if not e.success]) / max(1, len(self.chaos_history))
        }
    
    async def _monitoring_loop(self):
        """Continuous monitoring during chaos testing"""
        while self.is_running:
            try:
                # Collect current metrics
                metrics = await self._collect_system_metrics()
                self.metrics_history.append(metrics)
                
                # Check for critical conditions
                await self._check_critical_conditions(metrics)
                
                await asyncio.sleep(30)  # Monitor every 30 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _collect_system_metrics(self) -> Dict[str, Any]:
        """Collect comprehensive system metrics"""
        try:
            process = psutil.Process()
            
            return {
                "timestamp": datetime.now().isoformat(),
                "cpu_percent": process.cpu_percent(),
                "memory_rss": process.memory_info().rss,
                "memory_vms": process.memory_info().vms,
                "memory_percent": process.memory_percent(),
                "num_threads": process.num_threads(),
                "system_cpu": psutil.cpu_percent(interval=1),
                "system_memory": psutil.virtual_memory().percent,
                "system_disk": psutil.disk_usage('/').percent,
                "active_chaos_count": len(self.active_chaos),
                "total_chaos_events": len(self.chaos_history),
            }
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {"timestamp": datetime.now().isoformat(), "error": str(e)}
    
    async def _check_critical_conditions(self, metrics: Dict[str, Any]):
        """Check for critical system conditions"""
        # Memory check
        memory_percent = metrics.get("memory_percent", 0)
        if memory_percent > 90:
            logger.critical(f"Critical memory usage: {memory_percent}%")
        
        # CPU check
        cpu_percent = metrics.get("cpu_percent", 0)
        if cpu_percent > 95:
            logger.critical(f"Critical CPU usage: {cpu_percent}%")
        
        # System check
        system_memory = metrics.get("system_memory", 0)
        if system_memory > 95:
            logger.critical(f"Critical system memory: {system_memory}%")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current chaos engineering status"""
        return {
            "is_running": self.is_running,
            "active_chaos_count": len(self.active_chaos),
            "total_chaos_events": len(self.chaos_history),
            "successful_events": len([e for e in self.chaos_history if e.success]),
            "failed_events": len([e for e in self.chaos_history if not e.success]),
            "active_chaos": [
                {
                    "scenario": injector.scenario.value,
                    "is_active": injector.is_active,
                    "start_time": injector.start_time.isoformat() if injector.start_time else None,
                }
                for injector in self.active_chaos.values()
            ],
            "recent_events": [
                {
                    "scenario": event.scenario.value,
                    "target": event.target_service,
                    "success": event.success,
                    "duration": event.duration,
                    "start_time": event.start_time.isoformat(),
                }
                for event in self.chaos_history[-10:]  # Last 10 events
            ]
        }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive chaos engineering metrics"""
        if not self.metrics_history:
            return {"error": "No metrics data available"}
        
        latest_metrics = list(self.metrics_history)[-1] if self.metrics_history else {}
        
        return {
            "current_metrics": latest_metrics,
            "metrics_history_count": len(self.metrics_history),
            "chaos_summary": {
                "total_events": len(self.chaos_history),
                "success_rate": (
                    len([e for e in self.chaos_history if e.success]) / 
                    max(1, len(self.chaos_history))
                ),
                "average_event_duration": (
                    sum(e.duration for e in self.chaos_history if e.duration) / 
                    max(1, len([e for e in self.chaos_history if e.duration]))
                ),
            }
        }


# Global chaos engineering service
global_chaos_service: Optional[ChaosEngineeringService] = None


async def get_chaos_service() -> ChaosEngineeringService:
    """Get global chaos engineering service"""
    global global_chaos_service
    
    if global_chaos_service is None:
        global_chaos_service = ChaosEngineeringService()
        await global_chaos_service.start()
    
    return global_chaos_service