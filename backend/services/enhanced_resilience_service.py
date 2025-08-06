"""
Enhanced Resilience Service - Priority 2 Implementation
Comprehensive circuit breaker patterns, bulkhead isolation, and system resilience
"""

import asyncio
import logging
import time
import weakref
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

from backend.services.optimized_redis_service import OptimizedRedisService
from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_resilience")


class ResilienceState(Enum):
    """System resilience states"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    CRITICAL = "critical"
    RECOVERING = "recovering"
    FAILED = "failed"


class CircuitState(Enum):
    """Enhanced circuit breaker states"""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Circuit breaker active
    HALF_OPEN = "half_open"  # Testing recovery
    FORCED_OPEN = "forced_open"  # Manually opened
    FORCED_CLOSED = "forced_closed"  # Manually closed


class FailureType(Enum):
    """Types of failures to track"""

    TIMEOUT = "timeout"
    CONNECTION_ERROR = "connection_error"
    HTTP_ERROR = "http_error"
    VALIDATION_ERROR = "validation_error"
    RATE_LIMIT = "rate_limit"
    DEPENDENCY_FAILURE = "dependency_failure"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    UNKNOWN = "unknown"


@dataclass
class FailureEvent:
    """Failure event record"""

    id: str
    service_name: str
    failure_type: FailureType
    error_message: str
    timestamp: datetime = field(default_factory=datetime.now)
    duration: Optional[float] = None
    context: Dict[str, Any] = field(default_factory=dict)
    severity: int = 1  # 1=low, 5=critical
    recovery_time: Optional[float] = None


@dataclass
class CircuitBreakerConfig:
    """Enhanced circuit breaker configuration"""

    # Basic settings
    failure_threshold: int = 5
    success_threshold: int = 3
    timeout: float = 30.0
    recovery_timeout: int = 60

    # Advanced settings
    failure_window: int = 300  # 5 minutes
    minimum_requests: int = 10
    error_rate_threshold: float = 0.5  # 50% error rate
    slow_call_threshold: float = 5.0  # 5 seconds
    slow_call_rate_threshold: float = 0.5  # 50% slow calls

    # Exponential backoff
    max_retry_delay: float = 300.0  # 5 minutes
    backoff_multiplier: float = 1.5

    # Health check settings
    health_check_interval: int = 30
    health_check_timeout: float = 5.0


@dataclass
class BulkheadConfig:
    """Bulkhead isolation configuration"""

    name: str
    max_concurrent_calls: int = 100
    max_queued_calls: int = 1000
    call_timeout: float = 30.0
    queue_timeout: float = 10.0


@dataclass
class ServiceMetrics:
    """Service resilience metrics"""

    service_name: str
    state: ResilienceState = ResilienceState.HEALTHY

    # Circuit breaker metrics
    circuit_state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0

    # Performance metrics
    average_response_time: float = 0.0
    min_response_time: float = float("inf")
    max_response_time: float = 0.0
    slow_calls: int = 0

    # Error metrics
    error_rate: float = 0.0
    failure_types: Dict[FailureType, int] = field(default_factory=dict)
    last_failure: Optional[FailureEvent] = None

    # Timing metrics
    last_success_time: Optional[datetime] = None
    last_failure_time: Optional[datetime] = None
    last_state_change: datetime = field(default_factory=datetime.now)

    # Recovery metrics
    recovery_attempts: int = 0
    total_downtime: float = 0.0


class EnhancedCircuitBreaker:
    """Enhanced circuit breaker with advanced failure detection"""

    def __init__(self, name: str, config: CircuitBreakerConfig):
        self.name = name
        self.config = config
        self.state = CircuitState.CLOSED

        # Tracking
        self.failure_count = 0
        self.success_count = 0
        self.metrics = ServiceMetrics(name)

        # Time tracking
        self.last_failure_time: Optional[datetime] = None
        self.next_attempt_time: Optional[datetime] = None
        self.state_change_time = datetime.now()

        # Sliding window for advanced metrics
        self.request_history = deque(maxlen=1000)
        self.failure_history = deque(maxlen=100)

        # Health check
        self.health_check_func: Optional[Callable] = None
        self.last_health_check: Optional[datetime] = None

    async def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                logger.info(f"Circuit breaker {self.name} transitioning to HALF_OPEN")
            else:
                raise CircuitBreakerOpenError(f"Circuit breaker {self.name} is OPEN")

        if self.state == CircuitState.FORCED_OPEN:
            raise CircuitBreakerOpenError(f"Circuit breaker {self.name} is FORCED_OPEN")

        start_time = time.time()

        try:
            # Execute with timeout
            result = await asyncio.wait_for(
                func(*args, **kwargs), timeout=self.config.timeout
            )

            # Record success
            execution_time = time.time() - start_time
            await self._on_success(execution_time)

            return result

        except asyncio.TimeoutError as e:
            execution_time = time.time() - start_time
            await self._on_failure(FailureType.TIMEOUT, str(e), execution_time)
            raise
        except ConnectionError as e:
            execution_time = time.time() - start_time
            await self._on_failure(FailureType.CONNECTION_ERROR, str(e), execution_time)
            raise
        except Exception as e:
            execution_time = time.time() - start_time
            failure_type = self._classify_error(e)
            await self._on_failure(failure_type, str(e), execution_time)
            raise

    def _classify_error(self, error: Exception) -> FailureType:
        """Classify error type"""
        error_type = type(error).__name__.lower()

        if "timeout" in error_type:
            return FailureType.TIMEOUT
        elif "connection" in error_type:
            return FailureType.CONNECTION_ERROR
        elif "http" in error_type or "status" in error_type:
            return FailureType.HTTP_ERROR
        elif "validation" in error_type:
            return FailureType.VALIDATION_ERROR
        elif "rate" in error_type or "limit" in error_type:
            return FailureType.RATE_LIMIT
        else:
            return FailureType.UNKNOWN

    async def _on_success(self, execution_time: float):
        """Handle successful execution"""
        now = datetime.now()

        # Record request
        self.request_history.append(
            {"timestamp": now, "success": True, "duration": execution_time}
        )

        # Update metrics
        self.metrics.total_requests += 1
        self.metrics.successful_requests += 1
        self.metrics.last_success_time = now

        # Update response time metrics
        self._update_response_time_metrics(execution_time)

        # Check for slow calls
        if execution_time > self.config.slow_call_threshold:
            self.metrics.slow_calls += 1

        # Handle state transitions
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                await self._transition_to_closed()
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0  # Reset failure count on success

        # Update overall metrics
        await self._update_metrics()

    async def _on_failure(
        self, failure_type: FailureType, error_message: str, execution_time: float
    ):
        """Handle failed execution"""
        now = datetime.now()

        # Create failure event
        failure_event = FailureEvent(
            id=f"failure-{int(time.time() * 1000)}",
            service_name=self.name,
            failure_type=failure_type,
            error_message=error_message,
            duration=execution_time,
            severity=self._calculate_failure_severity(failure_type, execution_time),
        )

        # Record failure
        self.failure_history.append(failure_event)
        self.request_history.append(
            {
                "timestamp": now,
                "success": False,
                "duration": execution_time,
                "failure_type": failure_type,
            }
        )

        # Update metrics
        self.metrics.total_requests += 1
        self.metrics.failed_requests += 1
        self.metrics.last_failure_time = now
        self.metrics.last_failure = failure_event
        self.metrics.failure_types[failure_type] = (
            self.metrics.failure_types.get(failure_type, 0) + 1
        )

        self.failure_count += 1

        # Check if circuit should open
        if await self._should_open_circuit():
            await self._transition_to_open()
        elif self.state == CircuitState.HALF_OPEN:
            # Immediately open on any failure during half-open
            await self._transition_to_open()

        await self._update_metrics()

    def _calculate_failure_severity(
        self, failure_type: FailureType, execution_time: float
    ) -> int:
        """Calculate failure severity (1-5)"""
        base_severity = {
            FailureType.TIMEOUT: 3,
            FailureType.CONNECTION_ERROR: 4,
            FailureType.HTTP_ERROR: 2,
            FailureType.VALIDATION_ERROR: 1,
            FailureType.RATE_LIMIT: 2,
            FailureType.DEPENDENCY_FAILURE: 4,
            FailureType.RESOURCE_EXHAUSTION: 5,
            FailureType.UNKNOWN: 3,
        }.get(failure_type, 3)

        # Adjust based on execution time
        if execution_time > self.config.timeout * 0.8:
            base_severity += 1

        return min(5, max(1, base_severity))

    async def _should_open_circuit(self) -> bool:
        """Determine if circuit should open"""
        # Basic failure threshold
        if self.failure_count >= self.config.failure_threshold:
            return True

        # Check minimum requests requirement
        if len(self.request_history) < self.config.minimum_requests:
            return False

        # Check error rate in sliding window
        recent_window = datetime.now() - timedelta(seconds=self.config.failure_window)
        recent_requests = [
            r for r in self.request_history if r["timestamp"] > recent_window
        ]

        if len(recent_requests) < self.config.minimum_requests:
            return False

        error_count = sum(1 for r in recent_requests if not r["success"])
        error_rate = error_count / len(recent_requests)

        if error_rate > self.config.error_rate_threshold:
            return True

        # Check slow call rate
        slow_count = sum(
            1
            for r in recent_requests
            if r["duration"] > self.config.slow_call_threshold
        )
        slow_rate = slow_count / len(recent_requests) if recent_requests else 0

        if slow_rate > self.config.slow_call_rate_threshold:
            return True

        return False

    def _should_attempt_reset(self) -> bool:
        """Check if circuit should attempt reset"""
        if self.next_attempt_time is None:
            return True
        return datetime.now() >= self.next_attempt_time

    async def _transition_to_open(self):
        """Transition to OPEN state"""
        self.state = CircuitState.OPEN
        self.state_change_time = datetime.now()

        # Calculate exponential backoff
        backoff_delay = min(
            self.config.recovery_timeout
            * (self.config.backoff_multiplier**self.metrics.recovery_attempts),
            self.config.max_retry_delay,
        )

        self.next_attempt_time = datetime.now() + timedelta(seconds=backoff_delay)
        self.metrics.recovery_attempts += 1

        logger.warning(
            f"Circuit breaker {self.name} OPENED. "
            f"Failure count: {self.failure_count}, "
            f"Error rate: {self.metrics.error_rate:.2%}, "
            f"Next attempt in {backoff_delay:.1f}s"
        )

    async def _transition_to_closed(self):
        """Transition to CLOSED state"""
        old_state = self.state
        self.state = CircuitState.CLOSED
        self.state_change_time = datetime.now()
        self.failure_count = 0
        self.success_count = 0
        self.next_attempt_time = None

        # Calculate downtime
        if old_state == CircuitState.OPEN and hasattr(self, "last_failure_time"):
            if self.last_failure_time:
                downtime = (datetime.now() - self.last_failure_time).total_seconds()
                self.metrics.total_downtime += downtime

        logger.info(f"Circuit breaker {self.name} CLOSED after successful recovery")

    def _update_response_time_metrics(self, execution_time: float):
        """Update response time metrics"""
        self.metrics.min_response_time = min(
            self.metrics.min_response_time, execution_time
        )
        self.metrics.max_response_time = max(
            self.metrics.max_response_time, execution_time
        )

        # Calculate rolling average
        if self.request_history:
            recent_times = [r["duration"] for r in list(self.request_history)[-100:]]
            self.metrics.average_response_time = sum(recent_times) / len(recent_times)

    async def _update_metrics(self):
        """Update all metrics"""
        # Calculate error rate
        if self.metrics.total_requests > 0:
            self.metrics.error_rate = (
                self.metrics.failed_requests / self.metrics.total_requests
            )

        # Update circuit state in metrics
        self.metrics.circuit_state = self.state
        self.metrics.failure_count = self.failure_count
        self.metrics.success_count = self.success_count

        # Determine overall service state
        if self.state == CircuitState.OPEN:
            self.metrics.state = ResilienceState.FAILED
        elif self.state == CircuitState.HALF_OPEN:
            self.metrics.state = ResilienceState.RECOVERING
        elif self.metrics.error_rate > 0.3:
            self.metrics.state = ResilienceState.CRITICAL
        elif self.metrics.error_rate > 0.1:
            self.metrics.state = ResilienceState.DEGRADED
        else:
            self.metrics.state = ResilienceState.HEALTHY

    async def force_open(self):
        """Manually force circuit open"""
        self.state = CircuitState.FORCED_OPEN
        logger.warning(f"Circuit breaker {self.name} FORCED OPEN")

    async def force_close(self):
        """Manually force circuit closed"""
        self.state = CircuitState.FORCED_CLOSED
        self.failure_count = 0
        logger.warning(f"Circuit breaker {self.name} FORCED CLOSED")

    async def reset(self):
        """Reset circuit breaker to normal operation"""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.next_attempt_time = None
        logger.info(f"Circuit breaker {self.name} RESET")

    def get_metrics(self) -> Dict[str, Any]:
        """Get circuit breaker metrics"""
        return {
            "name": self.name,
            "state": self.state.value,
            "service_state": self.metrics.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "total_requests": self.metrics.total_requests,
            "error_rate": self.metrics.error_rate,
            "average_response_time": self.metrics.average_response_time,
            "slow_calls": self.metrics.slow_calls,
            "recovery_attempts": self.metrics.recovery_attempts,
            "total_downtime": self.metrics.total_downtime,
            "last_failure": (
                self.metrics.last_failure.__dict__
                if self.metrics.last_failure
                else None
            ),
            "last_success_time": (
                self.metrics.last_success_time.isoformat()
                if self.metrics.last_success_time
                else None
            ),
            "last_failure_time": (
                self.metrics.last_failure_time.isoformat()
                if self.metrics.last_failure_time
                else None
            ),
        }


class BulkheadIsolation:
    """Bulkhead pattern for resource isolation"""

    def __init__(self, config: BulkheadConfig):
        self.config = config
        self.semaphore = asyncio.Semaphore(config.max_concurrent_calls)
        self.queue = asyncio.Queue(maxsize=config.max_queued_calls)
        self.active_calls = 0
        self.total_calls = 0
        self.rejected_calls = 0

    @asynccontextmanager
    async def acquire(self):
        """Acquire resource from bulkhead"""
        try:
            # Try to acquire semaphore with timeout
            await asyncio.wait_for(
                self.semaphore.acquire(), timeout=self.config.queue_timeout
            )

            self.active_calls += 1
            self.total_calls += 1

            try:
                yield
            finally:
                self.active_calls -= 1
                self.semaphore.release()

        except asyncio.TimeoutError:
            self.rejected_calls += 1
            raise BulkheadRejectedException(
                f"Bulkhead {self.config.name} rejected call - queue full"
            )

    def get_metrics(self) -> Dict[str, Any]:
        """Get bulkhead metrics"""
        return {
            "name": self.config.name,
            "active_calls": self.active_calls,
            "total_calls": self.total_calls,
            "rejected_calls": self.rejected_calls,
            "available_permits": self.semaphore._value,
            "max_concurrent": self.config.max_concurrent_calls,
            "rejection_rate": (
                self.rejected_calls / self.total_calls if self.total_calls > 0 else 0
            ),
        }


class EnhancedResilienceService:
    """Comprehensive resilience service"""

    def __init__(self, redis_service: OptimizedRedisService):
        self.redis_service = redis_service
        self.circuit_breakers: Dict[str, EnhancedCircuitBreaker] = {}
        self.bulkheads: Dict[str, BulkheadIsolation] = {}
        self.is_running = False
        self.monitoring_task: Optional[asyncio.Task] = None

    async def start(self):
        """Start resilience service"""
        if self.is_running:
            return

        logger.info("Starting enhanced resilience service")
        self.is_running = True

        # Start monitoring
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())

        logger.info("Enhanced resilience service started")

    async def stop(self):
        """Stop resilience service"""
        if not self.is_running:
            return

        logger.info("Stopping enhanced resilience service")
        self.is_running = False

        if self.monitoring_task:
            self.monitoring_task.cancel()

        logger.info("Enhanced resilience service stopped")

    def create_circuit_breaker(
        self, name: str, config: Optional[CircuitBreakerConfig] = None
    ) -> EnhancedCircuitBreaker:
        """Create new circuit breaker"""
        if name in self.circuit_breakers:
            return self.circuit_breakers[name]

        breaker = EnhancedCircuitBreaker(name, config or CircuitBreakerConfig())
        self.circuit_breakers[name] = breaker

        logger.info(f"Created circuit breaker: {name}")
        return breaker

    def create_bulkhead(
        self, name: str, config: Optional[BulkheadConfig] = None
    ) -> BulkheadIsolation:
        """Create new bulkhead"""
        if name in self.bulkheads:
            return self.bulkheads[name]

        bulkhead = BulkheadIsolation(config or BulkheadConfig(name))
        self.bulkheads[name] = bulkhead

        logger.info(f"Created bulkhead: {name}")
        return bulkhead

    @asynccontextmanager
    async def protected_call(
        self,
        service_name: str,
        circuit_config: Optional[CircuitBreakerConfig] = None,
        bulkhead_config: Optional[BulkheadConfig] = None,
    ):
        """Execute call with circuit breaker and bulkhead protection"""
        # Create or get circuit breaker
        circuit_breaker = self.create_circuit_breaker(service_name, circuit_config)

        # Create or get bulkhead if config provided
        bulkhead = None
        if bulkhead_config:
            bulkhead = self.create_bulkhead(f"{service_name}_bulkhead", bulkhead_config)

        # Execute with protection
        if bulkhead:
            async with bulkhead.acquire():

                async def protected_func(func, *args, **kwargs):
                    return await circuit_breaker.call(func, *args, **kwargs)

                yield protected_func
        else:

            async def protected_func(func, *args, **kwargs):
                return await circuit_breaker.call(func, *args, **kwargs)

            yield protected_func

    async def _monitoring_loop(self):
        """Monitor all resilience components"""
        while self.is_running:
            try:
                await self._collect_metrics()
                await self._check_health()
                await asyncio.sleep(60)  # Monitor every minute
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)

    async def _collect_metrics(self):
        """Collect and store metrics"""
        try:
            all_metrics = await self.get_all_metrics()

            # Store in Redis for monitoring
            cache_key = "resilience:metrics"
            await self.redis_service.set(cache_key, all_metrics, ttl=300)

        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")

    async def _check_health(self):
        """Check health of all services"""
        unhealthy_services = []

        for name, breaker in self.circuit_breakers.items():
            if breaker.metrics.state in [
                ResilienceState.CRITICAL,
                ResilienceState.FAILED,
            ]:
                unhealthy_services.append(name)

        if unhealthy_services:
            logger.warning(f"Unhealthy services detected: {unhealthy_services}")

    async def get_all_metrics(self) -> Dict[str, Any]:
        """Get all resilience metrics"""
        return {
            "circuit_breakers": {
                name: breaker.get_metrics()
                for name, breaker in self.circuit_breakers.items()
            },
            "bulkheads": {
                name: bulkhead.get_metrics()
                for name, bulkhead in self.bulkheads.items()
            },
            "system_health": await self._get_system_health(),
        }

    async def _get_system_health(self) -> Dict[str, Any]:
        """Get overall system health"""
        total_services = len(self.circuit_breakers)
        if total_services == 0:
            return {"status": "unknown", "healthy_services": 0, "total_services": 0}

        healthy_count = sum(
            1
            for breaker in self.circuit_breakers.values()
            if breaker.metrics.state == ResilienceState.HEALTHY
        )

        health_percentage = healthy_count / total_services

        if health_percentage >= 0.9:
            status = "healthy"
        elif health_percentage >= 0.7:
            status = "degraded"
        else:
            status = "critical"

        return {
            "status": status,
            "healthy_services": healthy_count,
            "total_services": total_services,
            "health_percentage": health_percentage,
        }


# Custom exceptions
class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open"""

    pass


class BulkheadRejectedException(Exception):
    """Raised when bulkhead rejects a call"""

    pass


# Decorators for easy use
def circuit_breaker(
    name: str,
    config: Optional[CircuitBreakerConfig] = None,
    resilience_service: Optional[EnhancedResilienceService] = None,
):
    """Decorator for circuit breaker protection"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            service = resilience_service or global_resilience_service
            breaker = service.create_circuit_breaker(name, config)
            return await breaker.call(func, *args, **kwargs)

        return wrapper

    return decorator


def bulkhead(
    name: str,
    config: Optional[BulkheadConfig] = None,
    resilience_service: Optional[EnhancedResilienceService] = None,
):
    """Decorator for bulkhead isolation"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            service = resilience_service or global_resilience_service
            bulkhead_instance = service.create_bulkhead(name, config)

            async with bulkhead_instance.acquire():
                return await func(*args, **kwargs)

        return wrapper

    return decorator


def resilient(
    service_name: str,
    circuit_config: Optional[CircuitBreakerConfig] = None,
    bulkhead_config: Optional[BulkheadConfig] = None,
    resilience_service: Optional[EnhancedResilienceService] = None,
):
    """Decorator for full resilience protection"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            service = resilience_service or global_resilience_service

            async with service.protected_call(
                service_name, circuit_config, bulkhead_config
            ) as protected:
                return await protected(func, *args, **kwargs)

        return wrapper

    return decorator


# Global resilience service
global_resilience_service: Optional[EnhancedResilienceService] = None


async def get_resilience_service() -> EnhancedResilienceService:
    """Get global resilience service"""
    global global_resilience_service

    if global_resilience_service is None:
        redis_service = OptimizedRedisService()
        global_resilience_service = EnhancedResilienceService(redis_service)
        await global_resilience_service.start()

    return global_resilience_service
