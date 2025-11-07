"""
Odds Aggregation Prometheus Metrics

Comprehensive metrics collection for the enhanced odds aggregation system with 
proper guards for environments where Prometheus is not available.

Key Metrics:
- Provider confidence scores and trend analysis
- Circuit breaker state transitions and recovery times
- Fallback execution metrics and success rates
- Provider performance analytics and latency tracking
- Schema validation metrics and error rates
- Request volume and throughput analytics
"""

import logging
import time
from typing import Optional, Dict, Any, List
from contextlib import contextmanager

logger = logging.getLogger("odds_aggregation_metrics")

# Optional Prometheus imports with graceful fallback
try:
    from prometheus_client import (
        Counter, Histogram, Gauge, Enum, Info,
        CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
    )
    PROMETHEUS_AVAILABLE = True
    logger.info("Prometheus client available - metrics collection enabled")
except ImportError:
    PROMETHEUS_AVAILABLE = False
    logger.warning("Prometheus client not available - metrics collection disabled")
    
    # Create mock classes for when Prometheus is not available
    class MockMetric:
        def __init__(self, *args, **kwargs): pass
        def inc(self, *args, **kwargs): pass
        def dec(self, *args, **kwargs): pass
        def set(self, *args, **kwargs): pass
        def observe(self, *args, **kwargs): pass
        def info(self, *args, **kwargs): pass
        def state(self, *args, **kwargs): pass
        def labels(self, *args, **kwargs): return self
    
    Counter = Histogram = Gauge = Enum = Info = MockMetric
    CollectorRegistry = lambda: None
    generate_latest = lambda registry: b""
    CONTENT_TYPE_LATEST = "text/plain"


class OddsAggregationMetrics:
    """
    Comprehensive metrics collection for odds aggregation system.
    
    Provides detailed monitoring of:
    - Provider confidence and reliability metrics
    - Circuit breaker performance and state tracking
    - Fallback execution analytics and success rates
    - Request processing performance and error rates
    """
    
    def __init__(self, enabled: bool = True):
        """Initialize metrics collection with optional disable capability"""
        self.enabled = enabled and PROMETHEUS_AVAILABLE
        self.registry = CollectorRegistry() if self.enabled else None
        
        if self.enabled:
            logger.info("Initializing Prometheus metrics for odds aggregation")
            self._initialize_metrics()
        else:
            logger.info("Metrics collection disabled - using mock implementations")
            self._initialize_mock_metrics()
    
    def _initialize_metrics(self):
        """Initialize all Prometheus metrics"""
        
        # Provider Confidence Metrics
        self.provider_confidence_score = Gauge(
            'odds_aggregation_provider_confidence_score',
            'Current confidence score for each provider (0-1)',
            ['provider_id', 'context'],
            registry=self.registry
        )
        
        self.provider_confidence_trend = Histogram(
            'odds_aggregation_provider_confidence_trend',
            'Confidence score changes over time',
            ['provider_id', 'context', 'direction'],
            buckets=[0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 1.0],
            registry=self.registry
        )
        
        # Circuit Breaker Metrics
        self.circuit_breaker_state = Enum(
            'odds_aggregation_circuit_breaker_state',
            'Current circuit breaker state',
            ['provider_id'],
            states=['closed', 'open', 'half_open'],
            registry=self.registry
        )
        
        self.circuit_breaker_transitions = Counter(
            'odds_aggregation_circuit_breaker_transitions_total',
            'Circuit breaker state transitions',
            ['provider_id', 'from_state', 'to_state'],
            registry=self.registry
        )
        
        self.circuit_breaker_recovery_time = Histogram(
            'odds_aggregation_circuit_breaker_recovery_seconds',
            'Time for circuit breaker to recover (close)',
            ['provider_id'],
            buckets=[1, 5, 10, 30, 60, 300, 600, 1800],
            registry=self.registry
        )
        
        # Fallback Execution Metrics
        self.fallback_executions = Counter(
            'odds_aggregation_fallback_executions_total',
            'Total fallback executions',
            ['context', 'original_provider', 'fallback_provider', 'reason', 'success'],
            registry=self.registry
        )
        
        self.fallback_latency = Histogram(
            'odds_aggregation_fallback_latency_seconds',
            'Fallback execution latency',
            ['context', 'reason'],
            buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0],
            registry=self.registry
        )
        
        self.active_fallback_contexts = Gauge(
            'odds_aggregation_active_fallback_contexts',
            'Number of active fallback contexts',
            registry=self.registry
        )
        
        # Provider Performance Metrics
        self.provider_requests = Counter(
            'odds_aggregation_provider_requests_total',
            'Total requests to providers',
            ['provider_id', 'status'],
            registry=self.registry
        )
        
        self.provider_latency = Histogram(
            'odds_aggregation_provider_latency_seconds',
            'Provider response latency',
            ['provider_id'],
            buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
            registry=self.registry
        )
        
        self.provider_success_rate = Gauge(
            'odds_aggregation_provider_success_rate',
            'Provider success rate (0-1)',
            ['provider_id', 'window'],
            registry=self.registry
        )
        
        # Schema Validation Metrics
        self.schema_validations = Counter(
            'odds_aggregation_schema_validations_total',
            'Schema validation attempts',
            ['provider_id', 'schema_type', 'result'],
            registry=self.registry
        )
        
        self.schema_validation_errors = Counter(
            'odds_aggregation_schema_validation_errors_total',
            'Schema validation errors by type',
            ['provider_id', 'error_type', 'severity'],
            registry=self.registry
        )
        
        # System Performance Metrics
        self.request_volume = Counter(
            'odds_aggregation_requests_total',
            'Total odds aggregation requests',
            ['endpoint', 'method', 'status'],
            registry=self.registry
        )
        
        self.processing_time = Histogram(
            'odds_aggregation_processing_seconds',
            'Request processing time',
            ['endpoint'],
            buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0],
            registry=self.registry
        )
        
        self.system_health = Gauge(
            'odds_aggregation_system_health_score',
            'Overall system health score (0-1)',
            registry=self.registry
        )
        
        # Information Metrics
        self.system_info = Info(
            'odds_aggregation_system',
            'System information',
            registry=self.registry
        )
        
        logger.info("Prometheus metrics initialized successfully")
    
    def _initialize_mock_metrics(self):
        """Initialize mock metrics when Prometheus is not available"""
        
        # Create local mock metric class
        class MockMetric:
            def __init__(self, *args, **kwargs): pass
            def inc(self, *args, **kwargs): pass
            def dec(self, *args, **kwargs): pass
            def set(self, *args, **kwargs): pass
            def observe(self, *args, **kwargs): pass
            def info(self, *args, **kwargs): pass
            def state(self, *args, **kwargs): pass
            def labels(self, *args, **kwargs): return self
        
        self.provider_confidence_score = MockMetric()
        self.provider_confidence_trend = MockMetric()
        self.circuit_breaker_state = MockMetric()
        self.circuit_breaker_transitions = MockMetric()
        self.circuit_breaker_recovery_time = MockMetric()
        self.fallback_executions = MockMetric()
        self.fallback_latency = MockMetric()
        self.active_fallback_contexts = MockMetric()
        self.provider_requests = MockMetric()
        self.provider_latency = MockMetric()
        self.provider_success_rate = MockMetric()
        self.schema_validations = MockMetric()
        self.schema_validation_errors = MockMetric()
        self.request_volume = MockMetric()
        self.processing_time = MockMetric()
        self.system_health = MockMetric()
        self.system_info = MockMetric()
    
    # Provider Confidence Metrics
    def record_confidence_score(self, provider_id: str, context: str, score: float):
        """Record current confidence score for a provider"""
        if self.enabled:
            self.provider_confidence_score.labels(
                provider_id=provider_id,
                context=context
            ).set(score)
    
    def record_confidence_change(self, provider_id: str, context: str, 
                               old_score: float, new_score: float):
        """Record confidence score change"""
        if self.enabled:
            change = abs(new_score - old_score)
            direction = "increase" if new_score > old_score else "decrease"
            self.provider_confidence_trend.labels(
                provider_id=provider_id,
                context=context,
                direction=direction
            ).observe(change)
    
    # Circuit Breaker Metrics
    def record_circuit_breaker_state(self, provider_id: str, state: str):
        """Record current circuit breaker state"""
        if self.enabled:
            self.circuit_breaker_state.labels(provider_id=provider_id).state(state)
    
    def record_circuit_breaker_transition(self, provider_id: str, 
                                        from_state: str, to_state: str):
        """Record circuit breaker state transition"""
        if self.enabled:
            self.circuit_breaker_transitions.labels(
                provider_id=provider_id,
                from_state=from_state,
                to_state=to_state
            ).inc()
    
    def record_circuit_breaker_recovery(self, provider_id: str, recovery_time: float):
        """Record circuit breaker recovery time"""
        if self.enabled:
            self.circuit_breaker_recovery_time.labels(
                provider_id=provider_id
            ).observe(recovery_time)
    
    # Fallback Execution Metrics
    def record_fallback_execution(self, context: str, original_provider: str,
                                 fallback_provider: str, reason: str, 
                                 success: bool, latency: float):
        """Record fallback execution"""
        if self.enabled:
            self.fallback_executions.labels(
                context=context,
                original_provider=original_provider,
                fallback_provider=fallback_provider,
                reason=reason,
                success=str(success).lower()
            ).inc()
            
            self.fallback_latency.labels(
                context=context,
                reason=reason
            ).observe(latency)
    
    def update_active_fallback_contexts(self, count: int):
        """Update count of active fallback contexts"""
        if self.enabled:
            self.active_fallback_contexts.set(count)
    
    # Provider Performance Metrics
    def record_provider_request(self, provider_id: str, status: str, latency: float):
        """Record provider request"""
        if self.enabled:
            self.provider_requests.labels(
                provider_id=provider_id,
                status=status
            ).inc()
            
            self.provider_latency.labels(
                provider_id=provider_id
            ).observe(latency)
    
    def update_provider_success_rate(self, provider_id: str, window: str, rate: float):
        """Update provider success rate for a time window"""
        if self.enabled:
            self.provider_success_rate.labels(
                provider_id=provider_id,
                window=window
            ).set(rate)
    
    # Schema Validation Metrics
    def record_schema_validation(self, provider_id: str, schema_type: str, 
                                result: str, error_type: Optional[str] = None,
                                severity: Optional[str] = None):
        """Record schema validation result"""
        if self.enabled:
            self.schema_validations.labels(
                provider_id=provider_id,
                schema_type=schema_type,
                result=result
            ).inc()
            
            if error_type and severity:
                self.schema_validation_errors.labels(
                    provider_id=provider_id,
                    error_type=error_type,
                    severity=severity
                ).inc()
    
    # System Performance Metrics
    def record_request(self, endpoint: str, method: str, status: str, 
                      processing_time: float):
        """Record system request"""
        if self.enabled:
            self.request_volume.labels(
                endpoint=endpoint,
                method=method,
                status=status
            ).inc()
            
            self.processing_time.labels(
                endpoint=endpoint
            ).observe(processing_time)
    
    def update_system_health(self, score: float):
        """Update overall system health score"""
        if self.enabled:
            self.system_health.set(score)
    
    def update_system_info(self, info: Dict[str, str]):
        """Update system information"""
        if self.enabled:
            self.system_info.info(info)
    
    @contextmanager
    def measure_request_time(self, endpoint: str):
        """Context manager to measure request processing time"""
        start_time = time.time()
        try:
            yield
            status = "success"
        except Exception:
            status = "error"
            raise
        finally:
            if self.enabled:
                processing_time = time.time() - start_time
                self.processing_time.labels(endpoint=endpoint).observe(processing_time)
    
    def get_metrics(self) -> bytes:
        """Get Prometheus metrics in text format"""
        if self.enabled and self.registry:
            return generate_latest(self.registry)
        return b"# Prometheus metrics not available\n"
    
    def get_metrics_content_type(self) -> str:
        """Get content type for metrics response"""
        return CONTENT_TYPE_LATEST
    
    def is_enabled(self) -> bool:
        """Check if metrics collection is enabled"""
        return self.enabled
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get health summary for monitoring"""
        return {
            "metrics_enabled": self.enabled,
            "prometheus_available": PROMETHEUS_AVAILABLE,
            "registry_initialized": self.registry is not None
        }


# Global metrics instance
_metrics_instance: Optional[OddsAggregationMetrics] = None

def get_metrics() -> OddsAggregationMetrics:
    """Get the global metrics instance"""
    global _metrics_instance
    if _metrics_instance is None:
        _metrics_instance = OddsAggregationMetrics()
    return _metrics_instance

def initialize_metrics(enabled: bool = True) -> OddsAggregationMetrics:
    """Initialize global metrics instance"""
    global _metrics_instance
    _metrics_instance = OddsAggregationMetrics(enabled=enabled)
    return _metrics_instance

def is_prometheus_available() -> bool:
    """Check if Prometheus client is available"""
    return PROMETHEUS_AVAILABLE