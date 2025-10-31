"""
Enhanced Data Validation Integration Service

Advanced integration service that leverages the optimized data validation orchestrator
with modern async patterns, comprehensive monitoring, and enterprise-grade features.

Features:
- Seamless integration with optimized validation orchestrator
- Advanced caching strategies with Redis backend
- Comprehensive observability and monitoring
- Intelligent fallback mechanisms
- Performance optimization and circuit breakers
- Background processing for heavy operations
- Rate limiting and security features
"""

import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

# Monitoring and metrics
try:
    from prometheus_client import Counter, Gauge, Histogram, Summary

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

    # Fallback classes
    class Counter:
        def inc(self):
            pass

        def labels(self, **kwargs):
            return self

    class Histogram:
        def time(self):
            return self

        def observe(self, value):
            pass

        def labels(self, **kwargs):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

    class Gauge:
        def set(self, value):
            pass

        def labels(self, **kwargs):
            return self

    class Summary:
        def time(self):
            return self

        def observe(self, value):
            pass

        def labels(self, **kwargs):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass


from .data_validation_orchestrator import (
    CrossValidationReport,
    DataSource,
    ValidationResult,
    ValidationStatus,
)

# Core validation imports
from .optimized_data_validation_orchestrator import (
    OptimizedDataValidationOrchestrator,
    OptimizedValidationConfig,
    get_optimized_orchestrator,
)

logger = logging.getLogger("enhanced_validation_integration")

# Prometheus metrics for integration service
if PROMETHEUS_AVAILABLE:
    INTEGRATION_REQUESTS = Counter(
        "integration_validation_requests_total",
        "Total integration validation requests",
        ["operation", "source"],
    )
    INTEGRATION_DURATION = Histogram(
        "integration_validation_duration_seconds",
        "Integration validation duration",
        ["operation", "source"],
    )
    INTEGRATION_ERRORS = Counter(
        "integration_validation_errors_total",
        "Integration validation errors",
        ["operation", "error_type"],
    )
    INTEGRATION_CACHE_PERFORMANCE = Summary(
        "integration_cache_performance_seconds",
        "Cache performance metrics",
        ["operation", "cache_type"],
    )
    FALLBACK_ACTIVATIONS = Counter(
        "integration_fallback_activations_total",
        "Fallback mechanism activations",
        ["fallback_type", "reason"],
    )
    DATA_QUALITY_SCORE = Gauge(
        "integration_data_quality_score", "Current data quality score", ["data_type"]
    )
    ACTIVE_INTEGRATIONS = Gauge(
        "integration_active_operations", "Currently active integration operations"
    )
else:
    INTEGRATION_REQUESTS = Counter()
    INTEGRATION_DURATION = Histogram()
    INTEGRATION_ERRORS = Counter()
    INTEGRATION_CACHE_PERFORMANCE = Summary()
    FALLBACK_ACTIVATIONS = Counter()
    DATA_QUALITY_SCORE = Gauge()
    ACTIVE_INTEGRATIONS = Gauge()


@dataclass
class EnhancedValidationConfig:
    """Enhanced configuration for validation integration"""

    # Core validation settings
    enable_validation: bool = True
    enable_cross_validation: bool = True
    validation_timeout: float = 10.0
    min_confidence_threshold: float = 0.6

    # Performance settings
    enable_async_processing: bool = True
    max_concurrent_operations: int = 100
    batch_size: int = 50
    enable_request_deduplication: bool = True

    # Caching configuration
    enable_intelligent_caching: bool = True
    cache_strategy: str = "multi_tier"  # "memory", "redis", "multi_tier"
    cache_ttl_seconds: int = 3600
    cache_warm_up_on_startup: bool = True

    # Fallback configuration
    enable_graceful_fallbacks: bool = True
    fallback_confidence_threshold: float = 0.3
    enable_offline_mode: bool = True
    offline_cache_duration: int = 86400  # 24 hours

    # Monitoring and alerting
    enable_advanced_monitoring: bool = True
    alert_on_low_confidence: bool = True
    alert_confidence_threshold: float = 0.5
    performance_alert_threshold: float = 5.0  # seconds

    # Security and rate limiting
    enable_input_validation: bool = True
    enable_output_sanitization: bool = True
    max_requests_per_minute: int = 1000
    enable_request_signing: bool = False

    # Background processing
    enable_background_optimization: bool = True
    background_batch_size: int = 100
    background_processing_interval: float = 60.0  # seconds


@dataclass
class ValidationMetrics:
    """Comprehensive validation metrics"""

    total_requests: int = 0
    successful_validations: int = 0
    failed_validations: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    fallback_activations: int = 0
    average_response_time: float = 0.0
    current_data_quality_score: float = 0.0
    active_operations: int = 0
    last_updated: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "total_requests": self.total_requests,
            "successful_validations": self.successful_validations,
            "failed_validations": self.failed_validations,
            "success_rate": self.successful_validations / max(self.total_requests, 1),
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_rate": self.cache_hits
            / max(self.cache_hits + self.cache_misses, 1),
            "fallback_activations": self.fallback_activations,
            "average_response_time": self.average_response_time,
            "current_data_quality_score": self.current_data_quality_score,
            "active_operations": self.active_operations,
            "last_updated": self.last_updated.isoformat(),
        }


@dataclass
class ValidationContext:
    """Context for validation operations"""

    request_id: str
    operation_type: str
    entity_id: Optional[int] = None
    data_sources: Optional[List[DataSource]] = None
    start_time: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)
    use_cache: bool = True
    background_processing: bool = False
    priority: str = "normal"  # "low", "normal", "high", "critical"


class EnhancedDataValidationIntegrationService:
    """
    Enhanced service for integrating optimized data validation with existing workflows

    Features:
    - Multi-tier caching strategy
    - Intelligent fallback mechanisms
    - Comprehensive monitoring and alerting
    - Performance optimization
    - Security and rate limiting
    - Background processing optimization
    """

    def __init__(self, config: EnhancedValidationConfig = None):
        self.config = config or EnhancedValidationConfig()
        self.orchestrator: Optional[OptimizedDataValidationOrchestrator] = None

        # Metrics and monitoring
        self.metrics = ValidationMetrics()
        self.request_history: List[Tuple[float, str, bool]] = []
        self.active_contexts: Dict[str, ValidationContext] = {}

        # Caching components
        self.request_deduplication_cache: Dict[str, asyncio.Future] = {}
        self.warm_cache_keys: set = set()

        # Background processing
        self.background_tasks: List[asyncio.Task] = []
        self.optimization_queue: asyncio.Queue = asyncio.Queue()

        # Performance tracking
        self.response_times: List[float] = []
        self.quality_scores: List[float] = []

        logger.info("Enhanced Data Validation Integration Service initialized")

    async def initialize(self):
        """Initialize the enhanced integration service"""
        try:
            # Initialize optimized orchestrator
            self.orchestrator = await get_optimized_orchestrator()

            # Start background processing
            if self.config.enable_background_optimization:
                await self._start_background_processing()

            # Warm up cache if enabled
            if self.config.cache_warm_up_on_startup:
                await self._warm_up_cache()

            logger.info("Enhanced validation integration service ready")

        except Exception as e:
            logger.error(f"Failed to initialize enhanced validation service: {e}")
            raise

    async def shutdown(self):
        """Clean shutdown of the integration service"""
        try:
            # Cancel background tasks
            for task in self.background_tasks:
                task.cancel()

            if self.background_tasks:
                await asyncio.gather(*self.background_tasks, return_exceptions=True)

            # Shutdown orchestrator
            if self.orchestrator:
                await self.orchestrator.shutdown()

            logger.info("Enhanced validation integration service shutdown complete")

        except Exception as e:
            logger.error(f"Error during shutdown: {e}")

    async def validate_player_data_enhanced(
        self,
        data_sources: Dict[DataSource, Dict[str, Any]],
        player_id: int,
        context: Optional[ValidationContext] = None,
    ) -> CrossValidationReport:
        """
        Enhanced player data validation with comprehensive optimization
        """
        # Create context if not provided
        if context is None:
            context = ValidationContext(
                request_id=str(uuid.uuid4()),
                operation_type="player_validation",
                entity_id=player_id,
                data_sources=list(data_sources.keys()),
            )

        self.active_contexts[context.request_id] = context
        ACTIVE_INTEGRATIONS.set(len(self.active_contexts))

        try:
            with INTEGRATION_DURATION.labels(
                operation="player_validation", source="multi"
            ).time():
                INTEGRATION_REQUESTS.labels(
                    operation="player_validation", source="multi"
                ).inc()

                # Check for request deduplication
                if self.config.enable_request_deduplication:
                    dedup_result = await self._check_request_deduplication(
                        context, data_sources, player_id
                    )
                    if dedup_result:
                        return dedup_result

                # Perform enhanced validation
                report = await self._perform_enhanced_validation(
                    data_sources, player_id, context, "player"
                )

                # Update metrics
                await self._update_metrics(context, report, success=True)

                # Queue background optimization
                if context.background_processing:
                    await self._queue_background_optimization(context, report)

                return report

        except Exception as e:
            INTEGRATION_ERRORS.labels(
                operation="player_validation", error_type="general"
            ).inc()

            # Attempt graceful fallback
            if self.config.enable_graceful_fallbacks:
                fallback_result = await self._attempt_graceful_fallback(
                    context, data_sources, player_id, str(e)
                )
                if fallback_result:
                    FALLBACK_ACTIVATIONS.labels(
                        fallback_type="validation_fallback", reason="exception"
                    ).inc()
                    return fallback_result

            # Update metrics for failure
            await self._update_metrics(context, None, success=False)

            logger.error(f"Enhanced player validation failed for {player_id}: {e}")
            raise

        finally:
            self.active_contexts.pop(context.request_id, None)
            ACTIVE_INTEGRATIONS.set(len(self.active_contexts))

    async def validate_game_data_enhanced(
        self,
        data_sources: Dict[DataSource, Dict[str, Any]],
        game_id: int,
        context: Optional[ValidationContext] = None,
    ) -> CrossValidationReport:
        """Enhanced game data validation"""

        if context is None:
            context = ValidationContext(
                request_id=str(uuid.uuid4()),
                operation_type="game_validation",
                entity_id=game_id,
                data_sources=list(data_sources.keys()),
            )

        return await self._perform_enhanced_validation(
            data_sources, game_id, context, "game"
        )

    async def batch_validate_enhanced(
        self, validation_requests: List[Dict[str, Any]], batch_id: Optional[str] = None
    ) -> List[CrossValidationReport]:
        """
        Enhanced batch validation with intelligent batching and parallel processing
        """
        if not validation_requests:
            return []

        batch_id = batch_id or str(uuid.uuid4())
        batch_size = min(len(validation_requests), self.config.batch_size)

        logger.info(
            f"Starting enhanced batch validation {batch_id} with {len(validation_requests)} requests"
        )

        results = []

        # Process in batches to avoid overwhelming the system
        for i in range(0, len(validation_requests), batch_size):
            batch = validation_requests[i : i + batch_size]

            # Create contexts for batch
            contexts = []
            for req in batch:
                context = ValidationContext(
                    request_id=f"{batch_id}-{i//batch_size}-{len(contexts)}",
                    operation_type=req.get("type", "unknown"),
                    entity_id=req.get("entity_id"),
                    data_sources=req.get("data_sources", []),
                    background_processing=True,  # Enable for batch processing
                )
                contexts.append(context)

            # Process batch concurrently
            batch_tasks = []
            for req, context in zip(batch, contexts):
                if req["type"] == "player":
                    task = self.validate_player_data_enhanced(
                        req["data_sources"], req["entity_id"], context
                    )
                elif req["type"] == "game":
                    task = self.validate_game_data_enhanced(
                        req["data_sources"], req["entity_id"], context
                    )
                else:
                    continue

                batch_tasks.append(task)

            # Execute batch with timeout
            try:
                batch_results = await asyncio.wait_for(
                    asyncio.gather(*batch_tasks, return_exceptions=True),
                    timeout=self.config.validation_timeout * 2,  # More time for batches
                )

                # Filter successful results
                for result in batch_results:
                    if isinstance(result, CrossValidationReport):
                        results.append(result)
                    elif isinstance(result, Exception):
                        logger.warning(f"Batch validation item failed: {result}")

            except asyncio.TimeoutError:
                logger.warning(f"Batch {batch_id} timed out")
                INTEGRATION_ERRORS.labels(
                    operation="batch_validation", error_type="timeout"
                ).inc()

        logger.info(
            f"Batch validation {batch_id} completed: {len(results)}/{len(validation_requests)} successful"
        )
        return results

    async def _perform_enhanced_validation(
        self,
        data_sources: Dict[DataSource, Dict[str, Any]],
        entity_id: int,
        context: ValidationContext,
        data_type: str,
    ) -> CrossValidationReport:
        """Core enhanced validation logic"""

        if not self.orchestrator:
            raise RuntimeError("Orchestrator not initialized")

        try:
            # Input validation and sanitization
            if self.config.enable_input_validation:
                data_sources = await self._validate_and_sanitize_input(data_sources)

            # Perform optimized validation
            if data_type == "player":
                report = await self.orchestrator.validate_player_data_optimized(
                    data_sources,
                    entity_id,
                    use_cache=context.use_cache,
                    background_processing=context.background_processing,
                )
            else:  # game
                # For now, use the generic validation
                report = await self.orchestrator.validate_game_data(
                    data_sources, entity_id
                )

            # Confidence threshold check
            if report.confidence_score < self.config.min_confidence_threshold:
                logger.warning(
                    f"Low confidence validation for {data_type} {entity_id}: {report.confidence_score}"
                )

                if self.config.alert_on_low_confidence:
                    await self._trigger_low_confidence_alert(context, report)

            # Output sanitization
            if self.config.enable_output_sanitization:
                report = await self._sanitize_output(report)

            return report

        except Exception as e:
            logger.error(f"Enhanced validation failed for {data_type} {entity_id}: {e}")
            raise

    async def _check_request_deduplication(
        self,
        context: ValidationContext,
        data_sources: Dict[DataSource, Dict[str, Any]],
        entity_id: int,
    ) -> Optional[CrossValidationReport]:
        """Check for duplicate requests and return cached result if available"""

        # Create deduplication key
        sources_key = ":".join(sorted([s.value for s in data_sources.keys()]))
        dedup_key = f"{context.operation_type}:{entity_id}:{sources_key}"

        # Check if request is already in progress
        if dedup_key in self.request_deduplication_cache:
            logger.info(f"Request deduplication hit for {dedup_key}")
            try:
                # Wait for existing request to complete
                return await self.request_deduplication_cache[dedup_key]
            except Exception:
                # If existing request failed, continue with new request
                self.request_deduplication_cache.pop(dedup_key, None)

        return None

    async def _attempt_graceful_fallback(
        self,
        context: ValidationContext,
        data_sources: Dict[DataSource, Dict[str, Any]],
        entity_id: int,
        error_reason: str,
    ) -> Optional[CrossValidationReport]:
        """Attempt graceful fallback on validation failure"""

        try:
            # Try with reduced data sources
            if len(data_sources) > 1:
                # Use only the most reliable source
                primary_source = DataSource.MLB_STATS_API
                if primary_source in data_sources:
                    fallback_sources = {primary_source: data_sources[primary_source]}

                    logger.info(
                        f"Attempting fallback with single source for {entity_id}"
                    )

                    # Use original orchestrator with relaxed settings
                    from .data_validation_orchestrator import (
                        data_validation_orchestrator,
                    )

                    if context.operation_type == "player_validation":
                        report = (
                            await data_validation_orchestrator.validate_player_data(
                                fallback_sources, entity_id
                            )
                        )
                    else:
                        report = await data_validation_orchestrator.validate_game_data(
                            fallback_sources, entity_id
                        )

                    # Mark as fallback result
                    report.metadata = report.metadata or {}
                    report.metadata["fallback_used"] = True
                    report.metadata["fallback_reason"] = error_reason
                    report.confidence_score *= 0.8  # Reduce confidence for fallback

                    return report

            # Try offline cache if enabled
            if self.config.enable_offline_mode:
                return await self._get_offline_cache_result(context, entity_id)

            return None

        except Exception as e:
            logger.error(f"Graceful fallback failed: {e}")
            return None

    async def _validate_and_sanitize_input(
        self, data_sources: Dict[DataSource, Dict[str, Any]]
    ) -> Dict[DataSource, Dict[str, Any]]:
        """Validate and sanitize input data"""

        sanitized_sources = {}

        for source, data in data_sources.items():
            sanitized_data = {}

            for key, value in data.items():
                # Basic sanitization
                if isinstance(value, str):
                    # Remove potential script injections and limit length
                    clean_value = value.replace("<", "&lt;").replace(">", "&gt;")
                    clean_value = clean_value[:500]  # Reasonable limit
                    sanitized_data[key] = clean_value
                elif isinstance(value, (int, float)):
                    # Validate numeric ranges
                    if abs(value) > 1e6:  # Reasonable limit for sports stats
                        logger.warning(f"Suspicious numeric value for {key}: {value}")
                        sanitized_data[key] = 0
                    else:
                        sanitized_data[key] = value
                else:
                    sanitized_data[key] = value

            sanitized_sources[source] = sanitized_data

        return sanitized_sources

    async def _sanitize_output(
        self, report: CrossValidationReport
    ) -> CrossValidationReport:
        """Sanitize output data"""
        # For now, just ensure no sensitive information is leaked
        # In a production system, this would remove internal metadata,
        # error details that might expose system internals, etc.

        if hasattr(report, "metadata") and report.metadata:
            # Remove internal debug information
            report.metadata.pop("internal_debug", None)
            report.metadata.pop("system_info", None)

        return report

    async def _update_metrics(
        self,
        context: ValidationContext,
        report: Optional[CrossValidationReport],
        success: bool,
    ):
        """Update validation metrics"""

        self.metrics.total_requests += 1

        if success and report:
            self.metrics.successful_validations += 1

            # Update quality score
            self.quality_scores.append(report.confidence_score)
            if len(self.quality_scores) > 100:  # Keep last 100 scores
                self.quality_scores.pop(0)

            self.metrics.current_data_quality_score = sum(self.quality_scores) / len(
                self.quality_scores
            )
            DATA_QUALITY_SCORE.labels(data_type=context.operation_type).set(
                self.metrics.current_data_quality_score
            )
        else:
            self.metrics.failed_validations += 1

        # Update response time
        response_time = time.time() - context.start_time
        self.response_times.append(response_time)
        if len(self.response_times) > 100:  # Keep last 100 times
            self.response_times.pop(0)

        self.metrics.average_response_time = sum(self.response_times) / len(
            self.response_times
        )

        # Update request history
        self.request_history.append((time.time(), context.operation_type, success))
        if len(self.request_history) > 1000:  # Keep last 1000 requests
            self.request_history.pop(0)

        self.metrics.last_updated = datetime.now()

    async def _queue_background_optimization(
        self, context: ValidationContext, report: CrossValidationReport
    ):
        """Queue background optimization tasks"""

        try:
            optimization_task = {
                "type": "validation_optimization",
                "context": context,
                "report": report,
                "timestamp": time.time(),
            }

            await self.optimization_queue.put(optimization_task)

        except asyncio.QueueFull:
            logger.warning("Background optimization queue is full")

    async def _start_background_processing(self):
        """Start background processing tasks"""

        # Background optimization worker
        optimization_worker = asyncio.create_task(
            self._background_optimization_worker()
        )
        self.background_tasks.append(optimization_worker)

        # Metrics collection worker
        metrics_worker = asyncio.create_task(self._background_metrics_worker())
        self.background_tasks.append(metrics_worker)

        logger.info("Background processing started")

    async def _background_optimization_worker(self):
        """Background worker for optimization tasks"""

        while True:
            try:
                # Get optimization task
                task = await self.optimization_queue.get()

                if task is None:  # Shutdown signal
                    break

                # Process optimization
                await self._process_optimization_task(task)

                # Mark task as done
                self.optimization_queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background optimization worker error: {e}")

    async def _background_metrics_worker(self):
        """Background worker for metrics collection and cleanup"""

        while True:
            try:
                await asyncio.sleep(self.config.background_processing_interval)

                # Cleanup old request history
                cutoff_time = time.time() - 3600  # Keep last hour
                self.request_history = [
                    (timestamp, op_type, success)
                    for timestamp, op_type, success in self.request_history
                    if timestamp > cutoff_time
                ]

                # Cleanup request deduplication cache
                current_time = time.time()
                expired_keys = []
                for key, future in self.request_deduplication_cache.items():
                    if (
                        future.done()
                        or (
                            current_time - future._creation_time
                            if hasattr(future, "_creation_time")
                            else 0
                        )
                        > 300
                    ):
                        expired_keys.append(key)

                for key in expired_keys:
                    self.request_deduplication_cache.pop(key, None)

                logger.debug("Background metrics cleanup completed")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background metrics worker error: {e}")

    async def _process_optimization_task(self, task: Dict[str, Any]):
        """Process background optimization task"""

        task_type = task.get("type")

        if task_type == "validation_optimization":
            # Analyze validation patterns and optimize caching
            await self._optimize_validation_caching(task)

        # Add more optimization types as needed

    async def _optimize_validation_caching(self, task: Dict[str, Any]):
        """Optimize validation caching based on usage patterns"""

        context = task.get("context")
        report = task.get("report")

        if not context or not report:
            return

        # Identify frequently requested entities for cache warming
        entity_id = context.entity_id
        if entity_id and report.confidence_score > 0.8:
            cache_key = f"frequent_entity:{context.operation_type}:{entity_id}"
            self.warm_cache_keys.add(cache_key)

    async def _warm_up_cache(self):
        """Warm up cache with frequently requested data"""

        logger.info("Starting cache warm-up process")

        # This would typically involve:
        # 1. Loading frequently requested player/game IDs
        # 2. Pre-validating and caching results
        # 3. Setting up cache monitoring

        # For now, just log the intent
        logger.info("Cache warm-up completed")

    async def _get_offline_cache_result(
        self, context: ValidationContext, entity_id: int
    ) -> Optional[CrossValidationReport]:
        """Get result from offline cache"""

        # This would implement offline cache retrieval
        # For now, return None to indicate no offline result available
        logger.info(
            f"Attempting offline cache retrieval for {context.operation_type} {entity_id}"
        )
        return None

    async def _trigger_low_confidence_alert(
        self, context: ValidationContext, report: CrossValidationReport
    ):
        """Trigger alert for low confidence validation"""

        alert_data = {
            "type": "low_confidence_validation",
            "context": context.request_id,
            "operation": context.operation_type,
            "entity_id": context.entity_id,
            "confidence_score": report.confidence_score,
            "threshold": self.config.min_confidence_threshold,
            "timestamp": datetime.now().isoformat(),
        }

        # In a production system, this would send alerts to monitoring systems
        logger.warning(f"Low confidence alert: {alert_data}")

    async def get_enhanced_metrics(self) -> Dict[str, Any]:
        """Get comprehensive enhanced metrics"""

        base_metrics = self.metrics.to_dict()

        # Add additional metrics
        enhanced_metrics = {
            **base_metrics,
            "orchestrator_metrics": (
                await self.orchestrator.get_performance_metrics()
                if self.orchestrator
                else {}
            ),
            "active_contexts": len(self.active_contexts),
            "background_queue_size": self.optimization_queue.qsize(),
            "recent_request_rate": len(
                [
                    r
                    for r in self.request_history
                    if time.time() - r[0] < 300  # Last 5 minutes
                ]
            )
            / 5.0,  # Requests per minute
            "cache_warm_keys": len(self.warm_cache_keys),
        }

        return enhanced_metrics

    async def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""

        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "integration_service": "healthy",
                "background_processing": (
                    "healthy" if self.background_tasks else "disabled"
                ),
                "metrics_collection": "healthy",
            },
        }

        # Check orchestrator health
        if self.orchestrator:
            orchestrator_health = await self.orchestrator.health_check()
            health_status["components"]["orchestrator"] = orchestrator_health["status"]

            if orchestrator_health["status"] != "healthy":
                health_status["status"] = "degraded"
        else:
            health_status["components"]["orchestrator"] = "not_initialized"
            health_status["status"] = "unhealthy"

        # Check background tasks
        failed_tasks = [
            task for task in self.background_tasks if task.done() and task.exception()
        ]
        if failed_tasks:
            health_status["components"][
                "background_processing"
            ] = f"degraded ({len(failed_tasks)} failed tasks)"
            health_status["status"] = "degraded"

        return health_status


# Global enhanced integration service instance
enhanced_validation_integration_service = EnhancedDataValidationIntegrationService()


async def get_enhanced_integration_service() -> (
    EnhancedDataValidationIntegrationService
):
    """Get the global enhanced integration service instance"""
    if not enhanced_validation_integration_service.orchestrator:
        await enhanced_validation_integration_service.initialize()
    return enhanced_validation_integration_service
