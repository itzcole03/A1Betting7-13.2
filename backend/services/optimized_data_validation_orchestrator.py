"""
Optimized Enterprise Data Validation Orchestrator

High-performance async data validation system with advanced caching, monitoring,
and optimization features based on modern best practices and web research.

Key Optimizations:
- HTTP connection pooling with aiohttp ClientSession
- Redis-backed caching with TTL and LRU eviction
- Circuit breaker pattern for external API resilience
- Prometheus metrics for observability
- Background processing for heavy operations
- Smart batch validation processing
- Enhanced error handling and security
"""

import asyncio
import hashlib
import json
import logging
import statistics
import time
import uuid
import weakref
from collections import Counter, defaultdict, deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, AsyncGenerator, Dict, List, Optional, Set, Tuple, Union

# Modern async and caching libraries
try:
    import aiohttp
    import redis.asyncio as redis  # Use redis-py instead of aioredis
    ASYNC_LIBS_AVAILABLE = True
except ImportError:
    redis = None
    ASYNC_LIBS_AVAILABLE = False

# Monitoring and metrics
try:
    from prometheus_client import Counter as PrometheusCounter
    from prometheus_client import Gauge, Histogram, start_http_server

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

    # Fallback classes
    class PrometheusCounter:
        def inc(self):
            pass

    class Histogram:
        def time(self):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

    class Gauge:
        def set(self, value):
            pass


# Circuit breaker pattern
try:
    import circuit_breaker

    CIRCUIT_BREAKER_AVAILABLE = True
except ImportError:
    CIRCUIT_BREAKER_AVAILABLE = False

# Validation frameworks
try:
    import pandera as pa
    from pandera import Check, Column, DataFrameSchema

    PANDERA_AVAILABLE = True
except ImportError:
    PANDERA_AVAILABLE = False

    class DataFrameSchema:
        pass

    class Column:
        pass

    class Check:
        pass


try:
    import pandas as pd

    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

from .data_validation_orchestrator import (
    ConsensusAlgorithm,
    CrossValidationReport,
    DataSource,
    MLBDataSchemas,
    StatisticalValidator,
    ValidationResult,
    ValidationStatus,
)

logger = logging.getLogger("optimized_validation")

# Prometheus metrics
if PROMETHEUS_AVAILABLE:
    VALIDATION_REQUESTS = PrometheusCounter(
        "validation_requests_total", "Total validation requests", ["source", "type"]
    )
    VALIDATION_DURATION = Histogram(
        "validation_duration_seconds", "Validation request duration", ["source", "type"]
    )
    VALIDATION_ERRORS = PrometheusCounter(
        "validation_errors_total", "Total validation errors", ["source", "error_type"]
    )
    CACHE_HITS = PrometheusCounter("validation_cache_hits_total", "Cache hits")
    CACHE_MISSES = PrometheusCounter("validation_cache_misses_total", "Cache misses")
    ACTIVE_VALIDATIONS = Gauge(
        "validation_active_requests", "Currently active validation requests"
    )
else:
    VALIDATION_REQUESTS = PrometheusCounter()
    VALIDATION_DURATION = Histogram()
    VALIDATION_ERRORS = PrometheusCounter()
    CACHE_HITS = PrometheusCounter()
    CACHE_MISSES = PrometheusCounter()
    ACTIVE_VALIDATIONS = Gauge()


@dataclass
class OptimizedValidationConfig:
    """Enhanced configuration for optimized validation"""

    # Performance settings
    max_concurrent_validations: int = 50
    validation_timeout: float = 10.0
    connection_pool_size: int = 100
    connection_timeout: float = 5.0

    # Caching settings
    enable_redis_cache: bool = True
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 3600  # 1 hour
    max_cache_size: int = 10000

    # Circuit breaker settings
    failure_threshold: int = 5
    recovery_timeout: int = 60
    expected_exception: Exception = Exception

    # Background processing
    enable_background_processing: bool = True
    max_background_queue_size: int = 1000
    background_workers: int = 4

    # Security settings
    enable_rate_limiting: bool = True
    max_requests_per_minute: int = 1000
    enable_input_sanitization: bool = True

    # Monitoring
    enable_prometheus_metrics: bool = True
    prometheus_port: int = 8001


class CircuitBreakerState(Enum):
    """Circuit breaker states"""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class SimpleCircuitBreaker:
    """Simple circuit breaker implementation for API calls"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED

    def can_execute(self) -> bool:
        """Check if operation can be executed"""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitBreakerState.HALF_OPEN
                return True
            return False
        else:  # HALF_OPEN
            return True

    def record_success(self):
        """Record successful operation"""
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED

    def record_failure(self):
        """Record failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN


class RateLimiter:
    """Simple token bucket rate limiter"""

    def __init__(self, max_requests: int = 1000, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()

    def is_allowed(self) -> bool:
        """Check if request is allowed"""
        now = time.time()

        # Remove old requests
        while self.requests and now - self.requests[0] > self.time_window:
            self.requests.popleft()

        # Check if under limit
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True

        return False


class OptimizedDataValidationOrchestrator:
    """
    High-performance data validation orchestrator with advanced optimizations

    Features:
    - HTTP connection pooling
    - Redis caching with TTL
    - Circuit breaker pattern
    - Prometheus metrics
    - Background processing
    - Rate limiting
    - Enhanced error handling
    """

    def __init__(self, config: OptimizedValidationConfig = None):
        self.config = config or OptimizedValidationConfig()

        # Core components
        self.statistical_validator = StatisticalValidator()
        self.consensus_algorithm = ConsensusAlgorithm()

        # Performance components
        self.http_session: Optional[aiohttp.ClientSession] = None
        self.redis_client = None
        self.circuit_breakers: Dict[DataSource, SimpleCircuitBreaker] = {}
        self.rate_limiter = RateLimiter(self.config.max_requests_per_minute, 60)

        # Background processing
        self.background_queue: asyncio.Queue = asyncio.Queue(
            maxsize=self.config.max_background_queue_size
        )
        self.background_workers: List[asyncio.Task] = []

        # Memory cache for fast access
        self.memory_cache: Dict[str, Tuple[Any, float]] = {}
        self.cache_access_times: Dict[str, float] = {}

        # Request tracking
        self.active_requests: Set[str] = set()
        self.request_history: deque = deque(maxlen=1000)

        # Initialize circuit breakers
        for source in DataSource:
            self.circuit_breakers[source] = SimpleCircuitBreaker(
                self.config.failure_threshold, self.config.recovery_timeout
            )

        # Start Prometheus metrics server
        if self.config.enable_prometheus_metrics and PROMETHEUS_AVAILABLE:
            try:
                start_http_server(self.config.prometheus_port)
                logger.info(
                    f"Prometheus metrics server started on port {self.config.prometheus_port}"
                )
            except Exception as e:
                logger.warning(f"Failed to start Prometheus server: {e}")

    async def initialize(self):
        """Initialize async components"""
        # Initialize HTTP session with connection pooling
        if ASYNC_LIBS_AVAILABLE:
            connector = aiohttp.TCPConnector(
                limit=self.config.connection_pool_size,
                limit_per_host=20,
                ttl_dns_cache=300,
                use_dns_cache=True,
            )

            timeout = aiohttp.ClientTimeout(
                total=self.config.connection_timeout, connect=5.0
            )

            self.http_session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={"User-Agent": "OptimizedDataValidator/1.0"},
            )

        # Initialize Redis connection
        if self.config.enable_redis_cache and ASYNC_LIBS_AVAILABLE and redis is not None:
            try:
                self.redis_client = await redis.from_url(
                    self.config.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    max_connections=20,
                )
                # Test connection
                await self.redis_client.ping()
                logger.info("Redis cache connection established")
            except Exception as e:
                logger.warning(f"Redis connection failed, using memory cache only: {e}")
                self.redis_client = None

        # Start background workers
        if self.config.enable_background_processing:
            for i in range(self.config.background_workers):
                worker = asyncio.create_task(self._background_worker(f"worker-{i}"))
                self.background_workers.append(worker)
            logger.info(f"Started {self.config.background_workers} background workers")

    async def shutdown(self):
        """Clean shutdown of async components"""
        # Close HTTP session
        if self.http_session:
            await self.http_session.close()

        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()

        # Stop background workers
        for worker in self.background_workers:
            worker.cancel()

        if self.background_workers:
            await asyncio.gather(*self.background_workers, return_exceptions=True)

    async def _background_worker(self, worker_id: str):
        """Background worker for heavy validation tasks"""
        logger.info(f"Background worker {worker_id} started")

        while True:
            try:
                # Get task from queue
                task_data = await self.background_queue.get()

                if task_data is None:  # Shutdown signal
                    break

                # Process the validation task
                await self._process_background_validation(task_data)

                # Mark task as done
                self.background_queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background worker {worker_id} error: {e}")
                VALIDATION_ERRORS.inc()

    async def _process_background_validation(self, task_data: Dict[str, Any]):
        """Process a background validation task"""
        try:
            task_type = task_data.get("type")

            if task_type == "heavy_schema_validation":
                await self._perform_heavy_schema_validation(task_data)
            elif task_type == "statistical_analysis":
                await self._perform_statistical_analysis(task_data)
            elif task_type == "historical_baseline_update":
                await self._update_historical_baselines(task_data)

        except Exception as e:
            logger.error(f"Background validation failed: {e}")
            VALIDATION_ERRORS.inc()

    def _generate_cache_key(self, operation: str, **kwargs) -> str:
        """Generate cache key for validation results"""
        # Create deterministic key from operation and parameters
        key_data = f"{operation}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()

    async def _get_cached_result(self, cache_key: str) -> Optional[Any]:
        """Get cached validation result"""
        try:
            # Try Redis first
            if self.redis_client:
                cached_data = await self.redis_client.get(f"validation:{cache_key}")
                if cached_data:
                    CACHE_HITS.inc()
                    return json.loads(cached_data)

            # Try memory cache
            if cache_key in self.memory_cache:
                cached_result, timestamp = self.memory_cache[cache_key]
                if time.time() - timestamp < self.config.cache_ttl:
                    CACHE_HITS.inc()
                    self.cache_access_times[cache_key] = time.time()
                    return cached_result
                else:
                    # Expired
                    del self.memory_cache[cache_key]
                    self.cache_access_times.pop(cache_key, None)

            CACHE_MISSES.inc()
            return None

        except Exception as e:
            logger.warning(f"Cache retrieval failed: {e}")
            return None

    async def _cache_result(self, cache_key: str, result: Any):
        """Cache validation result"""
        try:
            # Cache in Redis
            if self.redis_client:
                await self.redis_client.setex(
                    f"validation:{cache_key}", self.config.cache_ttl, json.dumps(result)
                )

            # Cache in memory with LRU eviction
            if len(self.memory_cache) >= self.config.max_cache_size:
                # Remove least recently used
                lru_key = min(self.cache_access_times, key=self.cache_access_times.get)
                self.memory_cache.pop(lru_key, None)
                self.cache_access_times.pop(lru_key, None)

            self.memory_cache[cache_key] = (result, time.time())
            self.cache_access_times[cache_key] = time.time()

        except Exception as e:
            logger.warning(f"Cache storage failed: {e}")

    async def validate_player_data_optimized(
        self,
        data_sources: Dict[DataSource, Dict[str, Any]],
        player_id: int,
        use_cache: bool = True,
        background_processing: bool = False,
    ) -> CrossValidationReport:
        """
        Optimized player data validation with caching and circuit breakers
        """
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())

        # Enhanced logging for debugging
        logger.info(
            f"🔍 [REQUEST:{request_id[:8]}] Starting validation for player {player_id}"
        )
        logger.debug(
            f"🔍 [REQUEST:{request_id[:8]}] Data sources: {list(data_sources.keys())}"
        )
        logger.debug(
            f"🔍 [REQUEST:{request_id[:8]}] Use cache: {use_cache}, Background: {background_processing}"
        )

        # Log data types and structure for debugging
        for source, data in data_sources.items():
            logger.debug(
                f"🔍 [REQUEST:{request_id[:8]}] Source {source} data type: {type(data)}"
            )
            if isinstance(data, dict):
                logger.debug(
                    f"🔍 [REQUEST:{request_id[:8]}] Source {source} keys: {list(data.keys())}"
                )
            else:
                logger.warning(
                    f"⚠️ [REQUEST:{request_id[:8]}] Source {source} data is not dict: {type(data)} - {data}"
                )

        # Rate limiting check
        if self.config.enable_rate_limiting and not self.rate_limiter.is_allowed():
            logger.error(
                f"❌ [REQUEST:{request_id[:8]}] Rate limit exceeded for player {player_id}"
            )
            raise Exception("Rate limit exceeded")

        self.active_requests.add(request_id)
        ACTIVE_VALIDATIONS.set(len(self.active_requests))

        try:
            # Check cache first
            cache_key = self._generate_cache_key(
                "player_validation",
                player_id=player_id,
                sources=list(data_sources.keys()),
            )

            if use_cache:
                logger.debug(
                    f"🔍 [REQUEST:{request_id[:8]}] Checking cache with key: {cache_key}"
                )
                cached_result = await self._get_cached_result(cache_key)
                if cached_result:
                    logger.info(
                        f"✅ [REQUEST:{request_id[:8]}] Cache hit for player {player_id}"
                    )
                    return CrossValidationReport(**cached_result)
                else:
                    logger.debug(
                        f"🔍 [REQUEST:{request_id[:8]}] Cache miss for player {player_id}"
                    )

            # Start validation timer
            logger.info(
                f"⚡ [REQUEST:{request_id[:8]}] Starting validation process for player {player_id}"
            )
            with VALIDATION_DURATION.labels(source="multi", type="player").time():
                VALIDATION_REQUESTS.labels(source="multi", type="player").inc()

                # Perform validation with circuit breaker protection
                validation_tasks = []
                for source, data in data_sources.items():
                    if self.circuit_breakers[source].can_execute():
                        logger.debug(
                            f"🔍 [REQUEST:{request_id[:8]}] Adding validation task for source {source}"
                        )
                        task = self._validate_with_circuit_breaker(
                            source, data, "player"
                        )
                        validation_tasks.append(task)
                    else:
                        logger.warning(
                            f"⚠️ [REQUEST:{request_id[:8]}] Circuit breaker open for source {source}"
                        )

                if not validation_tasks:
                    logger.error(
                        f"❌ [REQUEST:{request_id[:8]}] All data sources unavailable (circuit breakers open)"
                    )
                    raise Exception(
                        "All data sources are unavailable (circuit breakers open)"
                    )

                logger.info(
                    f"⚡ [REQUEST:{request_id[:8]}] Executing {len(validation_tasks)} validation tasks"
                )
                # Execute validations concurrently with timeout
                validation_results = await asyncio.wait_for(
                    asyncio.gather(*validation_tasks, return_exceptions=True),
                    timeout=self.config.validation_timeout,
                )

                # Filter successful results with enhanced logging
                successful_results = []
                failed_results = []
                for i, r in enumerate(validation_results):
                    if (
                        isinstance(r, ValidationResult)
                        and r.status != ValidationStatus.INVALID
                    ):
                        successful_results.append(r)
                        logger.debug(
                            f"✅ [REQUEST:{request_id[:8]}] Validation task {i} successful: {r.status}"
                        )
                    else:
                        failed_results.append(r)
                        if isinstance(r, Exception):
                            logger.error(
                                f"❌ [REQUEST:{request_id[:8]}] Validation task {i} failed with exception: {r}"
                            )
                        else:
                            logger.warning(
                                f"⚠️ [REQUEST:{request_id[:8]}] Validation task {i} invalid: {r}"
                            )

                if not successful_results:
                    logger.error(
                        f"❌ [REQUEST:{request_id[:8]}] All validations failed for player {player_id}"
                    )
                    logger.error(
                        f"❌ [REQUEST:{request_id[:8]}] Failed results: {failed_results}"
                    )
                    raise Exception("All validations failed")

                # Perform consensus analysis
                logger.info(
                    f"🔄 [REQUEST:{request_id[:8]}] Performing consensus analysis with {len(successful_results)} successful results"
                )
                consensus_data, conflicts = (
                    await self._perform_optimized_cross_validation(
                        data_sources, "player"
                    )
                )

                if conflicts:
                    logger.warning(
                        f"⚠️ [REQUEST:{request_id[:8]}] Found {len(conflicts)} data conflicts for player {player_id}"
                    )
                    for conflict in conflicts:
                        logger.debug(
                            f"⚠️ [REQUEST:{request_id[:8]}] Conflict: {conflict}"
                        )

                confidence_score = self._calculate_optimized_confidence_score(
                    successful_results
                )
                logger.info(
                    f"📊 [REQUEST:{request_id[:8]}] Calculated confidence score: {confidence_score}"
                )

                recommendations = self._generate_optimized_recommendations(
                    successful_results, conflicts
                )

                # Create report with enhanced logging
                logger.debug(
                    f"📋 [REQUEST:{request_id[:8]}] Creating validation report"
                )
                try:
                    report = CrossValidationReport(
                        primary_source=list(data_sources.keys())[0],
                        comparison_sources=list(data_sources.keys()),
                        validation_results=successful_results,
                        consensus_data=consensus_data,
                        confidence_score=confidence_score,
                        conflicts=conflicts,
                        recommendations=recommendations,
                    )
                    logger.info(
                        f"✅ [REQUEST:{request_id[:8]}] Validation report created successfully"
                    )
                except Exception as report_error:
                    logger.error(
                        f"❌ [REQUEST:{request_id[:8]}] Failed to create validation report: {report_error}"
                    )
                    logger.error(
                        f"❌ [REQUEST:{request_id[:8]}] Report data types - consensus: {type(consensus_data)}, conflicts: {type(conflicts)}"
                    )
                    raise

                # Cache result
                if use_cache:
                    try:
                        logger.debug(f"💾 [REQUEST:{request_id[:8]}] Caching result")
                        await self._cache_result(cache_key, report.to_dict())
                        logger.debug(
                            f"✅ [REQUEST:{request_id[:8]}] Result cached successfully"
                        )
                    except Exception as cache_error:
                        logger.warning(
                            f"⚠️ [REQUEST:{request_id[:8]}] Failed to cache result: {cache_error}"
                        )

                # Queue background processing if enabled
                if background_processing and self.config.enable_background_processing:
                    try:
                        logger.debug(
                            f"🔄 [REQUEST:{request_id[:8]}] Queuing background processing"
                        )
                        await self._queue_background_processing(
                            player_id, data_sources, successful_results
                        )
                    except Exception as bg_error:
                        logger.warning(
                            f"⚠️ [REQUEST:{request_id[:8]}] Background processing queue failed: {bg_error}"
                        )

                logger.info(
                    f"✅ [REQUEST:{request_id[:8]}] Validation completed successfully for player {player_id}"
                )
                return report

        except asyncio.TimeoutError:
            VALIDATION_ERRORS.labels(source="multi", error_type="timeout").inc()
            logger.error(
                f"⏰ [REQUEST:{request_id[:8]}] Validation timeout after {self.config.validation_timeout}s for player {player_id}"
            )
            raise Exception(
                f"Validation timeout after {self.config.validation_timeout}s"
            )
        except Exception as e:
            VALIDATION_ERRORS.labels(source="multi", error_type="general").inc()
            logger.error(
                f"❌ [REQUEST:{request_id[:8]}] Optimized validation failed for player {player_id}: {e}"
            )
            logger.error(
                f"❌ [REQUEST:{request_id[:8]}] Exception type: {type(e).__name__}"
            )
            logger.debug(
                f"❌ [REQUEST:{request_id[:8]}] Full traceback:", exc_info=True
            )
            raise
        finally:
            self.active_requests.discard(request_id)
            ACTIVE_VALIDATIONS.set(len(self.active_requests))
            logger.debug(f"🏁 [REQUEST:{request_id[:8]}] Request cleanup completed")

    async def _validate_with_circuit_breaker(
        self, source: DataSource, data: Dict[str, Any], data_type: str
    ) -> ValidationResult:
        """Validate with circuit breaker protection"""
        circuit_breaker = self.circuit_breakers[source]

        logger.debug(f"🔄 Validating {data_type} data from source {source}")
        logger.debug(f"🔄 Circuit breaker state: {circuit_breaker.state}")
        logger.debug(
            f"🔄 Input data type: {type(data)}, keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}"
        )

        try:
            # Perform validation with enhanced logging
            logger.debug(f"⚡ Starting single source validation for {source}")
            result = await self._validate_single_source_optimized(
                source, data, data_type
            )

            # Record success
            logger.debug(
                f"✅ Validation successful for source {source}: {result.status}"
            )
            circuit_breaker.record_success()
            return result

        except Exception as e:
            # Record failure
            logger.error(f"❌ Validation failed for source {source}: {e}")
            logger.error(f"❌ Exception type: {type(e).__name__}")
            logger.debug(f"❌ Data that caused error: {data}")
            circuit_breaker.record_failure()
            VALIDATION_ERRORS.labels(
                source=source.value, error_type="circuit_breaker"
            ).inc()

            # Return failed result
            return ValidationResult(
                status=ValidationStatus.INVALID,
                source=source,
                data=None,
                confidence_score=0.0,
                validation_time=0.0,
                errors=[f"Circuit breaker: {str(e)}"],
                metadata={"circuit_breaker_triggered": True},
            )

    async def _validate_single_source_optimized(
        self, source: DataSource, data: Dict[str, Any], data_type: str
    ) -> ValidationResult:
        """Optimized single source validation with async operations"""
        start_time = time.time()
        errors = []
        warnings = []
        metadata = {"optimized": True}

        logger.debug(f"🔍 [{source}] Starting single source validation for {data_type}")
        logger.debug(f"🔍 [{source}] Input data type: {type(data)}")

        try:
            # Validate input data structure
            if not isinstance(data, dict):
                error_msg = f"Expected dict, got {type(data)}: {data}"
                logger.error(f"❌ [{source}] Invalid input data structure: {error_msg}")
                errors.append(error_msg)
                return ValidationResult(
                    status=ValidationStatus.INVALID,
                    source=source,
                    data=None,
                    confidence_score=0.0,
                    validation_time=time.time() - start_time,
                    errors=errors,
                    metadata=metadata,
                )

            logger.debug(f"🔍 [{source}] Data keys: {list(data.keys())}")

            # Input sanitization
            if self.config.enable_input_sanitization:
                logger.debug(f"🧹 [{source}] Sanitizing input data")
                try:
                    data = self._sanitize_input_data(data)
                    logger.debug(f"✅ [{source}] Data sanitization completed")
                except Exception as sanitization_error:
                    logger.error(
                        f"❌ [{source}] Data sanitization failed: {sanitization_error}"
                    )
                    errors.append(f"Sanitization failed: {sanitization_error}")

            # Quick validation checks first
            logger.debug(f"⚡ [{source}] Performing quick validation")
            quick_validation = await self._perform_quick_validation(data, data_type)
            if not quick_validation["valid"]:
                logger.warning(
                    f"⚠️ [{source}] Quick validation failed: {quick_validation['errors']}"
                )
                errors.extend(quick_validation["errors"])
            else:
                logger.debug(f"✅ [{source}] Quick validation passed")

            # Schema validation in background thread if available
            if PANDERA_AVAILABLE and PANDAS_AVAILABLE:
                logger.debug(f"📋 [{source}] Performing schema validation")
                try:
                    schema_result = await asyncio.to_thread(
                        self._validate_schema_sync, data, data_type
                    )
                    if not schema_result["valid"]:
                        logger.warning(
                            f"⚠️ [{source}] Schema validation failed: {schema_result['errors']}"
                        )
                        errors.extend(schema_result["errors"])
                    else:
                        logger.debug(f"✅ [{source}] Schema validation passed")
                    metadata["schema_validation"] = schema_result
                except Exception as schema_error:
                    logger.error(
                        f"❌ [{source}] Schema validation error: {schema_error}"
                    )
                    errors.append(f"Schema validation error: {schema_error}")

            # Statistical validation
            logger.debug(f"📊 [{source}] Performing statistical validation")
            try:
                stats_result = await self._validate_statistics_optimized(
                    data, data_type
                )
                if stats_result["anomalies"]:
                    logger.warning(
                        f"⚠️ [{source}] Statistical anomalies detected: {stats_result['anomalies']}"
                    )
                    warnings.extend(stats_result["anomalies"])
                else:
                    logger.debug(f"✅ [{source}] Statistical validation passed")
                metadata["statistical_validation"] = stats_result
            except Exception as stats_error:
                logger.error(
                    f"❌ [{source}] Statistical validation error: {stats_error}"
                )
                warnings.append(f"Statistical validation error: {stats_error}")

            # Determine status
            if errors:
                status = ValidationStatus.INVALID
                confidence_score = 0.0
                logger.warning(
                    f"❌ [{source}] Validation failed with {len(errors)} errors"
                )
            elif warnings:
                status = ValidationStatus.SUSPICIOUS
                confidence_score = 0.7
            else:
                status = ValidationStatus.VALID
                confidence_score = 0.95

            validation_time = time.time() - start_time

            return ValidationResult(
                status=status,
                source=source,
                data=data,
                confidence_score=confidence_score,
                validation_time=validation_time,
                errors=errors,
                warnings=warnings,
                metadata=metadata,
            )

        except Exception as e:
            validation_time = time.time() - start_time
            return ValidationResult(
                status=ValidationStatus.INVALID,
                source=source,
                data=None,
                confidence_score=0.0,
                validation_time=validation_time,
                errors=[f"Validation failed: {str(e)}"],
                metadata=metadata,
            )

    def _sanitize_input_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize input data for security"""
        sanitized = {}

        for key, value in data.items():
            # Remove potential script injections
            if isinstance(value, str):
                # Basic sanitization - remove script tags and suspicious patterns
                clean_value = value.replace("<script>", "").replace("</script>", "")
                clean_value = clean_value.replace("javascript:", "")
                sanitized[key] = clean_value[:1000]  # Limit length
            elif isinstance(value, (int, float)):
                # Validate numeric ranges
                if abs(value) > 1e10:  # Reasonable limit
                    sanitized[key] = 0
                else:
                    sanitized[key] = value
            else:
                sanitized[key] = value

        return sanitized

    async def _perform_quick_validation(
        self, data: Dict[str, Any], data_type: str
    ) -> Dict[str, Any]:
        """Perform quick validation checks before heavy operations"""
        errors = []

        # Check required fields
        required_fields = {
            "player": ["player_id", "player_name"],
            "game": ["game_id", "home_team", "away_team"],
        }

        if data_type in required_fields:
            for field in required_fields[data_type]:
                if field not in data or data[field] is None:
                    errors.append(f"Missing required field: {field}")

        # Basic data type validation
        if "player_id" in data and not isinstance(data["player_id"], int):
            errors.append("player_id must be an integer")

        if "game_id" in data and not isinstance(data["game_id"], int):
            errors.append("game_id must be an integer")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "execution_time": 0.001,  # Quick validation
        }

    def _validate_schema_sync(
        self, data: Dict[str, Any], data_type: str
    ) -> Dict[str, Any]:
        """Synchronous schema validation for background thread execution"""
        try:
            if data_type == "player":
                schema = MLBDataSchemas.get_player_stats_schema()
            elif data_type == "game":
                schema = MLBDataSchemas.get_game_data_schema()
            else:
                return {"valid": True, "errors": [], "execution_time": 0.0}

            if schema is None:
                return {"valid": True, "errors": [], "execution_time": 0.0}

            # Convert to DataFrame for validation
            df = pd.DataFrame([data])
            schema.validate(df)

            return {"valid": True, "errors": [], "execution_time": 0.01}

        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Schema validation failed: {str(e)}"],
                "execution_time": 0.01,
            }

    async def _validate_statistics_optimized(
        self, data: Dict[str, Any], data_type: str
    ) -> Dict[str, Any]:
        """Optimized statistical validation with caching"""
        anomalies = []

        try:
            # Cache key for statistical baselines
            baseline_cache_key = f"baseline:{data_type}"

            # Use cached baselines if available
            cached_baselines = await self._get_cached_result(baseline_cache_key)
            if cached_baselines:
                self.statistical_validator.historical_baselines = cached_baselines

            # Perform statistical checks on key metrics
            if data_type == "player":
                for stat in ["avg", "obp", "slg", "home_runs"]:
                    if stat in data:
                        is_outlier, reason = (
                            self.statistical_validator.is_statistical_outlier(
                                stat, float(data[stat])
                            )
                        )
                        if is_outlier:
                            anomalies.append(f"{stat}: {reason}")

            return {"anomalies": anomalies, "execution_time": 0.005}

        except Exception as e:
            return {
                "anomalies": [f"Statistical validation error: {str(e)}"],
                "execution_time": 0.005,
            }

    async def _perform_optimized_cross_validation(
        self, data_sources: Dict[DataSource, Dict[str, Any]], data_type: str
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """Optimized cross-validation with parallel processing"""

        if len(data_sources) < 2:
            # Single source, return as-is
            return list(data_sources.values())[0], []

        consensus_data = {}
        conflicts = []

        # Get all unique keys across sources
        all_keys = set()
        for data in data_sources.values():
            all_keys.update(data.keys())

        # Process keys in parallel batches
        batch_size = 10
        key_batches = [
            list(all_keys)[i : i + batch_size]
            for i in range(0, len(all_keys), batch_size)
        ]

        for batch in key_batches:
            batch_results = await asyncio.gather(
                *[self._resolve_field_consensus(key, data_sources) for key in batch],
                return_exceptions=True,
            )

            for key, result in zip(batch, batch_results):
                if isinstance(result, tuple):
                    consensus_value, conflict_info = result
                    consensus_data[key] = consensus_value
                    if conflict_info:
                        conflicts.append(conflict_info)

        return consensus_data, conflicts

    async def _resolve_field_consensus(
        self, field: str, data_sources: Dict[DataSource, Dict[str, Any]]
    ) -> Tuple[Any, Optional[Dict[str, Any]]]:
        """Resolve consensus for a single field"""

        values = []
        sources = []

        for source, data in data_sources.items():
            if field in data and data[field] is not None:
                values.append(data[field])
                sources.append(source)

        if not values:
            return None, None

        if len(set(values)) == 1:
            # All sources agree
            return values[0], None

        # Handle conflicts based on data type
        if all(isinstance(v, (int, float)) for v in values):
            # Numeric values - use weighted average
            consensus_value = statistics.median(values)  # More robust than mean
        else:
            # Non-numeric - use majority vote
            consensus_value = self.consensus_algorithm.majority_vote(values)

        # Record conflict
        conflict_info = {
            "field": field,
            "values": {source.value: values[i] for i, source in enumerate(sources)},
            "consensus": consensus_value,
            "conflict_type": "value_mismatch",
        }

        return consensus_value, conflict_info

    def _calculate_optimized_confidence_score(
        self, validation_results: List[ValidationResult]
    ) -> float:
        """Calculate optimized confidence score with weighted factors"""
        if not validation_results:
            return 0.0

        # Weight factors
        status_weights = {
            ValidationStatus.VALID: 1.0,
            ValidationStatus.SUSPICIOUS: 0.7,
            ValidationStatus.INVALID: 0.0,
            ValidationStatus.MISSING: 0.3,
            ValidationStatus.CONFLICTED: 0.5,
        }

        # Source reliability weights
        source_weights = {
            DataSource.MLB_STATS_API: 1.0,
            DataSource.BASEBALL_SAVANT: 0.95,
            DataSource.STATSAPI: 0.9,
            DataSource.EXTERNAL_API: 0.8,
        }

        weighted_scores = []
        total_weight = 0

        for result in validation_results:
            status_weight = status_weights.get(result.status, 0.5)
            source_weight = source_weights.get(result.source, 0.7)

            # Factor in validation time (faster is slightly better)
            time_factor = min(1.0, 2.0 / (result.validation_time + 1.0))

            combined_weight = status_weight * source_weight * time_factor
            weighted_scores.append(result.confidence_score * combined_weight)
            total_weight += combined_weight

        if total_weight == 0:
            return 0.0

        return sum(weighted_scores) / total_weight

    def _generate_optimized_recommendations(
        self,
        validation_results: List[ValidationResult],
        conflicts: List[Dict[str, Any]],
    ) -> List[str]:
        """Generate optimized recommendations based on validation results"""
        recommendations = []

        # Check for performance issues
        slow_validations = [r for r in validation_results if r.validation_time > 1.0]
        if slow_validations:
            recommendations.append(
                f"Performance: {len(slow_validations)} validations were slow (>1s)"
            )

        # Check for data quality issues
        error_count = sum(len(r.errors) for r in validation_results)
        if error_count > 0:
            recommendations.append(
                f"Data Quality: {error_count} validation errors detected"
            )

        # Check for conflicts
        if len(conflicts) > 3:
            recommendations.append(
                f"Data Consistency: {len(conflicts)} field conflicts found"
            )

        # Check for missing sources
        failed_sources = [
            r.source for r in validation_results if r.status == ValidationStatus.INVALID
        ]
        if failed_sources:
            recommendations.append(
                f"Source Issues: {len(failed_sources)} sources failed validation"
            )

        return recommendations

    async def _queue_background_processing(
        self,
        entity_id: int,
        data_sources: Dict[DataSource, Dict[str, Any]],
        validation_results: List[ValidationResult],
    ):
        """Queue background processing tasks"""
        try:
            # Queue heavy schema validation
            await self.background_queue.put(
                {
                    "type": "heavy_schema_validation",
                    "entity_id": entity_id,
                    "data_sources": data_sources,
                    "timestamp": time.time(),
                }
            )

            # Queue statistical analysis update
            await self.background_queue.put(
                {
                    "type": "statistical_analysis",
                    "entity_id": entity_id,
                    "validation_results": [r.to_dict() for r in validation_results],
                    "timestamp": time.time(),
                }
            )

        except asyncio.QueueFull:
            logger.warning("Background processing queue is full, skipping tasks")

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        return {
            "active_requests": len(self.active_requests),
            "cache_size": len(self.memory_cache),
            "background_queue_size": self.background_queue.qsize(),
            "circuit_breaker_states": {
                source.value: breaker.state.value
                for source, breaker in self.circuit_breakers.items()
            },
            "recent_requests": len(self.request_history),
            "redis_connected": self.redis_client is not None,
            "http_session_active": self.http_session is not None,
        }

    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check"""
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {},
        }

        # Check Redis connection
        if self.redis_client:
            try:
                await self.redis_client.ping()
                health_status["components"]["redis"] = "healthy"
            except Exception as e:
                health_status["components"]["redis"] = f"unhealthy: {str(e)}"
                health_status["status"] = "degraded"
        else:
            health_status["components"]["redis"] = "disabled"

        # Check HTTP session
        if self.http_session:
            health_status["components"]["http_session"] = "healthy"
        else:
            health_status["components"]["http_session"] = "unhealthy"
            health_status["status"] = "degraded"

        # Check background workers
        active_workers = sum(1 for w in self.background_workers if not w.done())
        health_status["components"][
            "background_workers"
        ] = f"{active_workers}/{len(self.background_workers)} active"

        # Check circuit breakers
        open_breakers = [
            s.value
            for s, b in self.circuit_breakers.items()
            if b.state == CircuitBreakerState.OPEN
        ]
        if open_breakers:
            health_status["components"]["circuit_breakers"] = f"open: {open_breakers}"
            health_status["status"] = "degraded"
        else:
            health_status["components"]["circuit_breakers"] = "healthy"

        return health_status


# Global optimized orchestrator instance
optimized_data_validation_orchestrator = OptimizedDataValidationOrchestrator()


async def get_optimized_orchestrator() -> OptimizedDataValidationOrchestrator:
    """Get the global optimized orchestrator instance"""
    if not optimized_data_validation_orchestrator.http_session:
        await optimized_data_validation_orchestrator.initialize()
    return optimized_data_validation_orchestrator
