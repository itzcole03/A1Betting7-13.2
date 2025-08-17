"""
Observability - Metrics, logging, and monitoring for the modeling system
"""

import logging
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, AsyncGenerator

import asyncio
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


@dataclass
class ModelingMetrics:
    """Metrics for the modeling system"""
    # Valuation metrics
    valuations_total: int = 0
    valuations_success: int = 0
    valuations_failed: int = 0
    valuation_avg_duration_ms: float = 0.0
    valuation_cache_hits: int = 0
    valuation_cache_misses: int = 0
    
    # Edge detection metrics
    edges_detected_total: int = 0
    edges_active: int = 0
    edges_retired: int = 0
    edge_detection_avg_duration_ms: float = 0.0
    
    # Model prediction metrics
    predictions_total: int = 0
    predictions_by_model: Dict[str, int] = field(default_factory=dict)
    avg_prediction_confidence: float = 0.0
    
    # API metrics
    api_requests_total: int = 0
    api_requests_by_endpoint: Dict[str, int] = field(default_factory=dict)
    api_avg_response_time_ms: float = 0.0
    api_errors_total: int = 0
    
    # System metrics
    database_connections_active: int = 0
    database_query_avg_duration_ms: float = 0.0
    memory_usage_mb: float = 0.0
    
    # Last updated timestamp
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class ModelingObservability:
    """
    Observability service for the modeling system.
    Tracks metrics, performance, and system health.
    """
    
    def __init__(self):
        self.metrics = ModelingMetrics()
        self._duration_samples = defaultdict(deque)  # For calculating averages
        self._sample_size = 100  # Keep last N samples for averages
        self._health_checks = {}
        self._start_time = datetime.now(timezone.utc)
        
    def track_valuation_start(self, prop_id: int) -> str:
        """
        Track the start of a valuation operation.
        
        Args:
            prop_id: Prop being valuated
            
        Returns:
            str: Operation ID for tracking
        """
        operation_id = f"valuation_{prop_id}_{int(time.time() * 1000)}"
        logger.debug(f"Starting valuation tracking: {operation_id}")
        return operation_id
    
    def track_valuation_success(self, operation_id: str, duration_ms: float, cached: bool = False):
        """
        Track successful valuation completion.
        
        Args:
            operation_id: Operation identifier
            duration_ms: Operation duration in milliseconds
            cached: Whether result was from cache
        """
        self.metrics.valuations_total += 1
        self.metrics.valuations_success += 1
        
        if cached:
            self.metrics.valuation_cache_hits += 1
        else:
            self.metrics.valuation_cache_misses += 1
        
        # Update average duration
        self._update_duration_average('valuation', duration_ms)
        
        logger.debug(f"Valuation success: {operation_id}, duration: {duration_ms:.2f}ms, cached: {cached}")
    
    def track_valuation_failure(self, operation_id: str, duration_ms: float, error: str):
        """
        Track failed valuation.
        
        Args:
            operation_id: Operation identifier  
            duration_ms: Operation duration in milliseconds
            error: Error description
        """
        self.metrics.valuations_total += 1
        self.metrics.valuations_failed += 1
        
        logger.warning(f"Valuation failure: {operation_id}, duration: {duration_ms:.2f}ms, error: {error}")
    
    def track_edge_detected(self, edge_id: Optional[int], prop_id: int, edge_score: float, duration_ms: float):
        """
        Track edge detection.
        
        Args:
            edge_id: Edge identifier (None if not stored)
            prop_id: Prop identifier
            edge_score: Edge score
            duration_ms: Detection duration
        """
        self.metrics.edges_detected_total += 1
        
        if edge_id:
            self.metrics.edges_active += 1
        
        # Update average duration
        self._update_duration_average('edge_detection', duration_ms)
        
        logger.info(f"Edge detected: prop={prop_id}, score={edge_score:.4f}, duration={duration_ms:.2f}ms")
    
    def track_edge_retired(self, edge_id: int, prop_id: int):
        """
        Track edge retirement.
        
        Args:
            edge_id: Edge identifier
            prop_id: Prop identifier
        """
        self.metrics.edges_retired += 1
        
        if self.metrics.edges_active > 0:
            self.metrics.edges_active -= 1
        
        logger.info(f"Edge retired: edge_id={edge_id}, prop_id={prop_id}")
    
    def track_model_prediction(self, model_name: str, confidence: float):
        """
        Track model prediction.
        
        Args:
            model_name: Name of the model used
            confidence: Prediction confidence
        """
        self.metrics.predictions_total += 1
        
        if model_name not in self.metrics.predictions_by_model:
            self.metrics.predictions_by_model[model_name] = 0
        self.metrics.predictions_by_model[model_name] += 1
        
        # Update average confidence
        self._update_confidence_average(confidence)
        
        logger.debug(f"Model prediction: model={model_name}, confidence={confidence:.4f}")
    
    def track_api_request(self, endpoint: str, duration_ms: float, success: bool):
        """
        Track API request.
        
        Args:
            endpoint: API endpoint
            duration_ms: Request duration
            success: Whether request succeeded
        """
        self.metrics.api_requests_total += 1
        
        if endpoint not in self.metrics.api_requests_by_endpoint:
            self.metrics.api_requests_by_endpoint[endpoint] = 0
        self.metrics.api_requests_by_endpoint[endpoint] += 1
        
        if not success:
            self.metrics.api_errors_total += 1
        
        # Update average response time
        self._update_duration_average('api_response', duration_ms)
        
        logger.debug(f"API request: endpoint={endpoint}, duration={duration_ms:.2f}ms, success={success}")
    
    def track_database_query(self, duration_ms: float):
        """
        Track database query performance.
        
        Args:
            duration_ms: Query duration in milliseconds
        """
        # Update average duration
        self._update_duration_average('database_query', duration_ms)
        
        logger.debug(f"Database query: duration={duration_ms:.2f}ms")
    
    def update_system_metrics(self, connections: int, memory_mb: float):
        """
        Update system-level metrics.
        
        Args:
            connections: Active database connections
            memory_mb: Memory usage in MB
        """
        self.metrics.database_connections_active = connections
        self.metrics.memory_usage_mb = memory_mb
        self.metrics.last_updated = datetime.now(timezone.utc)
        
        logger.debug(f"System metrics updated: connections={connections}, memory={memory_mb:.1f}MB")
    
    def register_health_check(self, name: str, check_func):
        """
        Register a health check function.
        
        Args:
            name: Health check name
            check_func: Async function that returns (healthy: bool, details: dict)
        """
        self._health_checks[name] = check_func
        logger.info(f"Registered health check: {name}")
    
    async def run_health_checks(self) -> Dict[str, Any]:
        """
        Run all registered health checks.
        
        Returns:
            dict: Health check results
        """
        results = {
            "overall_status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": int((datetime.now(timezone.utc) - self._start_time).total_seconds()),
            "checks": {}
        }
        
        overall_healthy = True
        
        for name, check_func in self._health_checks.items():
            try:
                healthy, details = await check_func()
                results["checks"][name] = {
                    "status": "healthy" if healthy else "unhealthy",
                    "details": details
                }
                
                if not healthy:
                    overall_healthy = False
                    
            except Exception as e:
                results["checks"][name] = {
                    "status": "error",
                    "error": str(e)
                }
                overall_healthy = False
                logger.error(f"Health check failed for {name}: {e}")
        
        if not overall_healthy:
            results["overall_status"] = "degraded"
        
        return results
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get current metrics summary.
        
        Returns:
            dict: Metrics summary
        """
        # Calculate success rates
        valuation_success_rate = 0.0
        if self.metrics.valuations_total > 0:
            valuation_success_rate = (self.metrics.valuations_success / self.metrics.valuations_total) * 100
        
        api_error_rate = 0.0
        if self.metrics.api_requests_total > 0:
            api_error_rate = (self.metrics.api_errors_total / self.metrics.api_requests_total) * 100
        
        # Calculate cache hit rate
        total_valuation_requests = self.metrics.valuation_cache_hits + self.metrics.valuation_cache_misses
        cache_hit_rate = 0.0
        if total_valuation_requests > 0:
            cache_hit_rate = (self.metrics.valuation_cache_hits / total_valuation_requests) * 100
        
        summary = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": int((datetime.now(timezone.utc) - self._start_time).total_seconds()),
            
            # Valuation metrics
            "valuations": {
                "total": self.metrics.valuations_total,
                "success": self.metrics.valuations_success,
                "failed": self.metrics.valuations_failed,
                "success_rate_percent": round(valuation_success_rate, 2),
                "avg_duration_ms": round(self.metrics.valuation_avg_duration_ms, 2),
                "cache_hit_rate_percent": round(cache_hit_rate, 2)
            },
            
            # Edge detection metrics
            "edges": {
                "detected_total": self.metrics.edges_detected_total,
                "active": self.metrics.edges_active,
                "retired": self.metrics.edges_retired,
                "avg_detection_duration_ms": round(self.metrics.edge_detection_avg_duration_ms, 2)
            },
            
            # Model prediction metrics
            "predictions": {
                "total": self.metrics.predictions_total,
                "by_model": dict(self.metrics.predictions_by_model),
                "avg_confidence": round(self.metrics.avg_prediction_confidence, 4)
            },
            
            # API metrics
            "api": {
                "requests_total": self.metrics.api_requests_total,
                "by_endpoint": dict(self.metrics.api_requests_by_endpoint),
                "error_rate_percent": round(api_error_rate, 2),
                "avg_response_time_ms": round(self.metrics.api_avg_response_time_ms, 2)
            },
            
            # System metrics
            "system": {
                "database_connections": self.metrics.database_connections_active,
                "database_avg_query_ms": round(self.metrics.database_query_avg_duration_ms, 2),
                "memory_usage_mb": round(self.metrics.memory_usage_mb, 1)
            }
        }
        
        return summary
    
    @asynccontextmanager
    async def track_operation(self, operation_name: str, **context) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Context manager for tracking operation duration and success.
        
        Args:
            operation_name: Name of the operation
            **context: Additional context data
            
        Yields:
            dict: Context data for the operation
        """
        start_time = time.time()
        operation_context = {"operation": operation_name, **context}
        
        try:
            logger.debug(f"Starting operation: {operation_name}")
            yield operation_context
            
            # Track success
            duration_ms = (time.time() - start_time) * 1000
            logger.debug(f"Operation completed: {operation_name}, duration: {duration_ms:.2f}ms")
            
        except Exception as e:
            # Track failure
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Operation failed: {operation_name}, duration: {duration_ms:.2f}ms, error: {e}")
            raise
    
    def _update_duration_average(self, operation_type: str, duration_ms: float):
        """
        Update rolling average for operation duration.
        
        Args:
            operation_type: Type of operation
            duration_ms: Duration in milliseconds
        """
        samples = self._duration_samples[operation_type]
        samples.append(duration_ms)
        
        # Keep only last N samples
        while len(samples) > self._sample_size:
            samples.popleft()
        
        # Update average in metrics
        avg = sum(samples) / len(samples)
        
        if operation_type == 'valuation':
            self.metrics.valuation_avg_duration_ms = avg
        elif operation_type == 'edge_detection':
            self.metrics.edge_detection_avg_duration_ms = avg
        elif operation_type == 'api_response':
            self.metrics.api_avg_response_time_ms = avg
        elif operation_type == 'database_query':
            self.metrics.database_query_avg_duration_ms = avg
    
    def _update_confidence_average(self, confidence: float):
        """
        Update rolling average for prediction confidence.
        
        Args:
            confidence: New confidence value
        """
        samples = self._duration_samples['confidence']
        samples.append(confidence)
        
        # Keep only last N samples
        while len(samples) > self._sample_size:
            samples.popleft()
        
        # Update average in metrics
        self.metrics.avg_prediction_confidence = sum(samples) / len(samples)


# Global observability instance
modeling_observability = ModelingObservability()


# Convenience functions for integration
def track_valuation_start(prop_id: int) -> str:
    """Track valuation start"""
    return modeling_observability.track_valuation_start(prop_id)

def track_valuation_success(operation_id: str, duration_ms: float, cached: bool = False):
    """Track valuation success"""
    modeling_observability.track_valuation_success(operation_id, duration_ms, cached)

def track_valuation_failure(operation_id: str, duration_ms: float, error: str):
    """Track valuation failure"""
    modeling_observability.track_valuation_failure(operation_id, duration_ms, error)

def track_edge_detected(edge_id: Optional[int], prop_id: int, edge_score: float, duration_ms: float):
    """Track edge detection"""
    modeling_observability.track_edge_detected(edge_id, prop_id, edge_score, duration_ms)

def track_model_prediction(model_name: str, confidence: float):
    """Track model prediction"""
    modeling_observability.track_model_prediction(model_name, confidence)

def track_api_request(endpoint: str, duration_ms: float, success: bool):
    """Track API request"""
    modeling_observability.track_api_request(endpoint, duration_ms, success)


# Health check functions
async def valuation_engine_health_check() -> tuple[bool, Dict[str, Any]]:
    """Health check for valuation engine"""
    try:
        # Try to import and test basic functionality
        from backend.services.valuation.valuation_engine import valuation_engine
        
        # TODO: Add more comprehensive health check
        return True, {"status": "operational", "components": ["model_registry", "distributions", "payout"]}
    except Exception as e:
        return False, {"error": str(e)}

async def edge_service_health_check() -> tuple[bool, Dict[str, Any]]:
    """Health check for edge service"""
    try:
        from backend.services.edges.edge_service import edge_service
        
        # TODO: Add more comprehensive health check
        return True, {"status": "operational", "thresholds": {"ev_min": 0.05, "prob_range": "0.52-0.75"}}
    except Exception as e:
        return False, {"error": str(e)}

async def database_health_check() -> tuple[bool, Dict[str, Any]]:
    """Health check for database connectivity"""
    try:
        # Try to import database dependencies
        from backend.enhanced_database import get_db_session
        
        # TODO: Add actual database connectivity test
        return True, {"status": "available", "note": "TODO: Add connectivity test"}
    except Exception as e:
        return False, {"error": str(e), "available": False}


# Register health checks
modeling_observability.register_health_check("valuation_engine", valuation_engine_health_check)
modeling_observability.register_health_check("edge_service", edge_service_health_check)
modeling_observability.register_health_check("database", database_health_check)