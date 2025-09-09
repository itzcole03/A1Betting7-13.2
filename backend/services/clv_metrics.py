"""
CLV Metrics Service

Centralized CLV metrics collection with lazy Prometheus imports and graceful degradation.
Provides consistent interface for recording CLV operations and exposing diagnostics.
"""

import time
import logging
from typing import Dict, Optional, Any
from contextlib import contextmanager

from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)

# Graceful handling of prometheus_client dependency
try:
    from prometheus_client import (
        Counter, 
        Histogram, 
        Gauge, 
        Summary,
        CollectorRegistry,
        REGISTRY
    )
    PROMETHEUS_AVAILABLE = True
except ImportError:
    # Create mock classes if prometheus_client is not available
    class MockMetric:
        def __init__(self, *args, **kwargs): pass
        def inc(self, *args, **kwargs): pass
        def dec(self, *args, **kwargs): pass
        def observe(self, *args, **kwargs): pass
        def set(self, *args, **kwargs): pass
        def labels(self, **kwargs): return self
    
    Counter = Histogram = Gauge = Summary = MockMetric
    REGISTRY = None
    PROMETHEUS_AVAILABLE = False
    logger.warning("prometheus_client not available - CLV metrics will use mock implementation")


class CLVMetricsService:
    """CLV-specific metrics service with feature flag support"""
    
    _instance: Optional['CLVMetricsService'] = None
    
    def __init__(self, registry=None):
        """Initialize CLV metrics service"""
        self.config = unified_config.get_config()
        self.enabled = self.config.performance.enable_clv_metrics
        
        if not self.enabled:
            logger.info("CLV metrics disabled by feature flag")
            return
            
        self.registry = registry
        if self.registry is None and PROMETHEUS_AVAILABLE:
            # Create a custom registry to avoid conflicts
            from prometheus_client import CollectorRegistry
            self.registry = CollectorRegistry()
        elif self.registry is None:
            self.registry = REGISTRY
            
        self._init_metrics()
        self._reset_counters()
        
    @classmethod
    def get_instance(cls) -> 'CLVMetricsService':
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def _reset_counters(self):
        """Reset internal counters for diagnostics"""
        self._enrichment_count = 0
        self._failure_count = 0
        self._cache_hits = 0
        self._cache_misses = 0
        self._total_duration_ms = 0.0
        
    def _init_metrics(self):
        """Initialize all CLV-specific metrics"""
        if not self.enabled or not PROMETHEUS_AVAILABLE:
            # Create mock metrics for disabled state
            self.clv_success_rate_total = MockMetric()
            self.clv_failure_rate_total = MockMetric()
            self.clv_avg_latency_ms = MockMetric()
            self.clv_opportunities_processed_total = MockMetric()
            self.clv_cache_hits_total = MockMetric()
            self.clv_cache_misses_total = MockMetric()
            return
            
        # CLV success/failure counters
        self.clv_success_rate_total = Counter(
            'clv_success_rate_total',
            'Total CLV enrichment successes',
            ['endpoint'],
            registry=self.registry
        )
        
        self.clv_failure_rate_total = Counter(
            'clv_failure_rate_total',
            'Total CLV enrichment failures',
            ['endpoint'],
            registry=self.registry
        )
        
        # CLV processing latency
        self.clv_avg_latency_ms = Gauge(
            'clv_avg_latency_ms',
            'Average CLV enrichment latency in milliseconds',
            ['endpoint'],
            registry=self.registry
        )
        
        # CLV opportunities processed
        self.clv_opportunities_processed_total = Counter(
            'clv_opportunities_processed_total',
            'Total opportunities processed with CLV data',
            ['endpoint'],
            registry=self.registry
        )
        
        # CLV cache metrics
        self.clv_cache_hits_total = Counter(
            'clv_cache_hits_total',
            'Total CLV cache hits',
            ['endpoint'],
            registry=self.registry
        )
        
        self.clv_cache_misses_total = Counter(
            'clv_cache_misses_total',
            'Total CLV cache misses', 
            ['endpoint'],
            registry=self.registry
        )
        
        logger.info("CLV metrics initialized successfully")
    
    def record_success(self, duration_ms: float, endpoint: str = "propfinder_opportunities"):
        """Record successful CLV enrichment"""
        if not self.enabled:
            return
            
        try:
            self.clv_success_rate_total.labels(endpoint=endpoint).inc()
            self._enrichment_count += 1
            self._total_duration_ms += duration_ms
            self._update_avg_latency(endpoint)
        except Exception as e:
            logger.debug(f"Failed to record CLV success metric: {e}")
    
    def record_failure(self, duration_ms: float, endpoint: str = "propfinder_opportunities"):
        """Record failed CLV enrichment"""
        if not self.enabled:
            return
            
        try:
            self.clv_failure_rate_total.labels(endpoint=endpoint).inc()
            self._failure_count += 1
            self._total_duration_ms += duration_ms
            self._update_avg_latency(endpoint)
        except Exception as e:
            logger.debug(f"Failed to record CLV failure metric: {e}")
    
    def record_batch(self, count: int, duration_ms: float, endpoint: str = "propfinder_opportunities"):
        """Record batch CLV processing"""
        if not self.enabled:
            return
            
        try:
            self.clv_opportunities_processed_total.labels(endpoint=endpoint).inc(count)
        except Exception as e:
            logger.debug(f"Failed to record CLV batch metric: {e}")
    
    def record_cache_hit(self, endpoint: str = "propfinder_opportunities"):
        """Record CLV cache hit"""
        if not self.enabled:
            return
            
        try:
            self.clv_cache_hits_total.labels(endpoint=endpoint).inc()
            self._cache_hits += 1
        except Exception as e:
            logger.debug(f"Failed to record CLV cache hit: {e}")
    
    def record_cache_miss(self, endpoint: str = "propfinder_opportunities"):
        """Record CLV cache miss"""
        if not self.enabled:
            return
            
        try:
            self.clv_cache_misses_total.labels(endpoint=endpoint).inc()
            self._cache_misses += 1
        except Exception as e:
            logger.debug(f"Failed to record CLV cache miss: {e}")
    
    def _update_avg_latency(self, endpoint: str):
        """Update average latency gauge"""
        if not self.enabled or not PROMETHEUS_AVAILABLE:
            return
            
        total_operations = self._enrichment_count + self._failure_count
        if total_operations > 0:
            avg_latency = self._total_duration_ms / total_operations
            try:
                self.clv_avg_latency_ms.labels(endpoint=endpoint).set(avg_latency)
            except Exception as e:
                logger.debug(f"Failed to update CLV avg latency: {e}")
    
    @contextmanager
    def timing_context(self, endpoint: str = "propfinder_opportunities"):
        """Context manager for timing CLV operations"""
        start_time = time.time()
        success = False
        try:
            yield
            success = True
        finally:
            duration_ms = (time.time() - start_time) * 1000
            if success:
                self.record_success(duration_ms, endpoint)
            else:
                self.record_failure(duration_ms, endpoint)
    
    def get_snapshot(self) -> Dict[str, Any]:
        """Get current metrics snapshot for diagnostics"""
        if not self.enabled:
            return {
                "enabled": False,
                "reason": "disabled_by_flag"
            }
        
        total_operations = self._enrichment_count + self._failure_count
        cache_total = self._cache_hits + self._cache_misses
        
        success_rate = (self._enrichment_count / max(total_operations, 1)) * 100
        failure_rate = (self._failure_count / max(total_operations, 1)) * 100
        avg_latency_ms = self._total_duration_ms / max(total_operations, 1)
        cache_hit_rate = (self._cache_hits / max(cache_total, 1)) * 100

        return {
            "enabled": True,
            "success_rate": round(success_rate, 2),
            "failure_rate": round(failure_rate, 2),
            "avg_latency_ms": round(avg_latency_ms, 2),
            "processed_total": total_operations,
            "cache_hit_rate": round(cache_hit_rate, 2),
            "window_size": "runtime",  # For consistency with diagnostics API
            "prometheus_available": PROMETHEUS_AVAILABLE
        }


# Global instance for easy access
clv_metrics = CLVMetricsService.get_instance()


# Compatibility aliases for existing code
def init_metrics():
    """Initialize metrics (idempotent)"""
    global clv_metrics
    if clv_metrics is None:
        clv_metrics = CLVMetricsService.get_instance()


def record_success(duration_ms: float, endpoint: str = "propfinder_opportunities"):
    """Record successful CLV enrichment"""
    clv_metrics.record_success(duration_ms, endpoint)


def record_failure(duration_ms: float, endpoint: str = "propfinder_opportunities"):
    """Record failed CLV enrichment"""
    clv_metrics.record_failure(duration_ms, endpoint)


def record_batch(count: int, duration_ms: float, endpoint: str = "propfinder_opportunities"):
    """Record batch CLV processing"""
    clv_metrics.record_batch(count, duration_ms, endpoint)


def get_snapshot() -> Dict[str, Any]:
    """Get current metrics snapshot"""
    return clv_metrics.get_snapshot()