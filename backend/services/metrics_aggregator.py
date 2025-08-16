"""
Metrics Aggregator System

Provides comprehensive metrics collection for:
- Fallback occurrences by category
- Validation failures by category (navigation, connectivity, data freshness)
- Performance metrics aggregation
- Business logic metrics
- Integration with existing Prometheus metrics

Categories tracked:
- Navigation: routing failures, component loading issues
- Connectivity: API timeouts, network errors, WebSocket disconnections  
- Data Freshness: stale data detection, cache misses, outdated predictions
- Fallback: service degradation, mock data usage, backup system activation
"""

import time
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
from dataclasses import dataclass, field
from collections import defaultdict, deque
import threading
import logging
import json

logger = logging.getLogger(__name__)


class MetricCategory(Enum):
    """Categories for metric classification"""
    NAVIGATION = "navigation"
    CONNECTIVITY = "connectivity"
    DATA_FRESHNESS = "data_freshness" 
    FALLBACK = "fallback"
    VALIDATION = "validation"
    PERFORMANCE = "performance"
    BUSINESS = "business"


class MetricType(Enum):
    """Types of metrics"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


@dataclass
class MetricEntry:
    """Individual metric entry"""
    name: str
    category: MetricCategory
    metric_type: MetricType
    value: float
    tags: Dict[str, str] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'name': self.name,
            'category': self.category.value,
            'type': self.metric_type.value,
            'value': self.value,
            'tags': self.tags,
            'timestamp': self.timestamp
        }


class MetricsBuffer:
    """Thread-safe buffer for metric entries"""
    
    def __init__(self, max_size: int = 10000):
        self.max_size = max_size
        self.entries: deque = deque(maxlen=max_size)
        self.lock = threading.Lock()
        self.counters: Dict[str, float] = defaultdict(float)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, List[float]] = defaultdict(list)
        
    def add_entry(self, entry: MetricEntry):
        """Add metric entry to buffer"""
        with self.lock:
            self.entries.append(entry)
            
            # Update internal aggregations
            key = f"{entry.category.value}.{entry.name}"
            
            if entry.metric_type == MetricType.COUNTER:
                self.counters[key] += entry.value
            elif entry.metric_type == MetricType.GAUGE:
                self.gauges[key] = entry.value
            elif entry.metric_type == MetricType.HISTOGRAM:
                self.histograms[key].append(entry.value)
                # Keep only recent values for histograms
                if len(self.histograms[key]) > 1000:
                    self.histograms[key] = self.histograms[key][-1000:]
                    
    def get_entries(self, since: Optional[float] = None) -> List[MetricEntry]:
        """Get entries since timestamp"""
        with self.lock:
            if since is None:
                return list(self.entries)
            
            return [entry for entry in self.entries if entry.timestamp >= since]
    
    def get_counters(self) -> Dict[str, float]:
        """Get current counter values"""
        with self.lock:
            return dict(self.counters)
    
    def get_gauges(self) -> Dict[str, float]:
        """Get current gauge values"""
        with self.lock:
            return dict(self.gauges)
            
    def clear(self):
        """Clear all metrics"""
        with self.lock:
            self.entries.clear()
            self.counters.clear()
            self.gauges.clear()
            self.histograms.clear()


class MetricsAggregator:
    """
    Central metrics aggregator system
    
    Collects and aggregates metrics from various sources:
    - Fallback occurrences
    - Validation failures
    - Performance data
    - Business metrics
    """
    
    def __init__(self, buffer_size: int = 10000):
        self.buffer = MetricsBuffer(buffer_size)
        self.start_time = time.time()
        self.fallback_counts = defaultdict(int)
        self.validation_failure_counts = defaultdict(lambda: defaultdict(int))
        self.performance_stats = {}
        
        # Track metrics by category for easy reporting
        self.category_stats = {
            category: {
                'count': 0,
                'last_seen': None,
                'rate_per_minute': 0.0
            } for category in MetricCategory
        }
        
    def record_fallback(
        self, 
        fallback_type: str, 
        reason: str, 
        service: str = "unknown",
        severity: str = "info"
    ):
        """
        Record a fallback occurrence
        
        Args:
            fallback_type: Type of fallback (service_degradation, mock_data, backup_system)
            reason: Human-readable reason for fallback
            service: Service that triggered fallback
            severity: Severity level (info, warning, error, critical)
        """
        entry = MetricEntry(
            name="fallback_occurrence",
            category=MetricCategory.FALLBACK,
            metric_type=MetricType.COUNTER,
            value=1.0,
            tags={
                'fallback_type': fallback_type,
                'reason': reason,
                'service': service,
                'severity': severity
            }
        )
        
        self.buffer.add_entry(entry)
        self.fallback_counts[f"{service}.{fallback_type}"] += 1
        self._update_category_stats(MetricCategory.FALLBACK)
        
        logger.info(
            f"Fallback recorded: {fallback_type} in {service}",
            extra={
                'event_type': 'fallback_occurrence',
                'fallback_type': fallback_type,
                'reason': reason,
                'service': service,
                'severity': severity
            }
        )
    
    def record_validation_failure(
        self,
        category: str,
        failure_type: str,
        details: str = "",
        field: Optional[str] = None,
        value: Optional[str] = None
    ):
        """
        Record a validation failure by category
        
        Args:
            category: Category of validation (navigation, connectivity, data_freshness)
            failure_type: Specific type of failure
            details: Additional details about failure
            field: Field that failed validation (if applicable)
            value: Value that failed validation (if applicable)
        """
        # Map category string to enum
        category_map = {
            'navigation': MetricCategory.NAVIGATION,
            'connectivity': MetricCategory.CONNECTIVITY,
            'data_freshness': MetricCategory.DATA_FRESHNESS,
            'validation': MetricCategory.VALIDATION
        }
        
        metric_category = category_map.get(category, MetricCategory.VALIDATION)
        
        entry = MetricEntry(
            name="validation_failure",
            category=metric_category,
            metric_type=MetricType.COUNTER,
            value=1.0,
            tags={
                'validation_category': category,
                'failure_type': failure_type,
                'details': details[:100],  # Truncate details
                'field': field or 'unknown',
                'has_value': str(value is not None)
            }
        )
        
        self.buffer.add_entry(entry)
        self.validation_failure_counts[category][failure_type] += 1
        self._update_category_stats(metric_category)
        
        logger.warning(
            f"Validation failure: {category}/{failure_type}",
            extra={
                'event_type': 'validation_failure',
                'validation_category': category,
                'failure_type': failure_type,
                'details': details,
                'field': field,
                'value': value
            }
        )
        
    def record_navigation_failure(
        self,
        route: str,
        error_type: str,
        error_message: str = "",
        component: Optional[str] = None
    ):
        """Record navigation-specific failures"""
        self.record_validation_failure(
            category="navigation",
            failure_type=error_type,
            details=f"Route: {route}, Component: {component}, Error: {error_message}",
            field="route",
            value=route
        )
    
    def record_connectivity_failure(
        self,
        service: str,
        endpoint: str,
        error_type: str,
        status_code: Optional[int] = None,
        timeout_ms: Optional[float] = None
    ):
        """Record connectivity-specific failures"""
        details_parts = [f"Service: {service}", f"Endpoint: {endpoint}"]
        if status_code:
            details_parts.append(f"Status: {status_code}")
        if timeout_ms:
            details_parts.append(f"Timeout: {timeout_ms}ms")
            
        self.record_validation_failure(
            category="connectivity",
            failure_type=error_type,
            details=", ".join(details_parts),
            field="endpoint",
            value=endpoint
        )
    
    def record_data_freshness_failure(
        self,
        data_type: str,
        age_seconds: float,
        threshold_seconds: float,
        source: str = "unknown"
    ):
        """Record data freshness failures"""
        self.record_validation_failure(
            category="data_freshness",
            failure_type="stale_data",
            details=f"Data age: {age_seconds}s exceeds threshold: {threshold_seconds}s",
            field="data_type",
            value=data_type
        )
        
        # Also record as performance metric
        entry = MetricEntry(
            name="data_age_seconds",
            category=MetricCategory.DATA_FRESHNESS,
            metric_type=MetricType.HISTOGRAM,
            value=age_seconds,
            tags={
                'data_type': data_type,
                'source': source,
                'is_stale': str(age_seconds > threshold_seconds)
            }
        )
        
        self.buffer.add_entry(entry)
    
    def record_performance_metric(
        self,
        name: str,
        value: float,
        unit: str = "ms",
        tags: Optional[Dict[str, str]] = None
    ):
        """Record a performance metric"""
        entry = MetricEntry(
            name=name,
            category=MetricCategory.PERFORMANCE,
            metric_type=MetricType.HISTOGRAM,
            value=value,
            tags={
                'unit': unit,
                **(tags or {})
            }
        )
        
        self.buffer.add_entry(entry)
        self._update_category_stats(MetricCategory.PERFORMANCE)
        
    def record_business_metric(
        self,
        name: str,
        value: float,
        metric_type: MetricType = MetricType.COUNTER,
        tags: Optional[Dict[str, str]] = None
    ):
        """Record a business logic metric"""
        entry = MetricEntry(
            name=name,
            category=MetricCategory.BUSINESS,
            metric_type=metric_type,
            value=value,
            tags=tags or {}
        )
        
        self.buffer.add_entry(entry)
        self._update_category_stats(MetricCategory.BUSINESS)
    
    def _update_category_stats(self, category: MetricCategory):
        """Update category statistics"""
        stats = self.category_stats[category]
        stats['count'] += 1
        stats['last_seen'] = time.time()
        
        # Calculate rate per minute
        elapsed_minutes = (time.time() - self.start_time) / 60.0
        if elapsed_minutes > 0:
            stats['rate_per_minute'] = stats['count'] / elapsed_minutes
            
    def get_fallback_summary(self) -> Dict[str, Any]:
        """Get summary of fallback occurrences"""
        return {
            'total_fallbacks': sum(self.fallback_counts.values()),
            'by_service': dict(self.fallback_counts),
            'categories': {
                category.value: stats for category, stats in self.category_stats.items()
                if category == MetricCategory.FALLBACK
            }
        }
    
    def get_validation_failure_summary(self) -> Dict[str, Any]:
        """Get summary of validation failures"""
        total_failures = sum(
            sum(failures.values()) 
            for failures in self.validation_failure_counts.values()
        )
        
        return {
            'total_failures': total_failures,
            'by_category': {
                category: dict(failures) 
                for category, failures in self.validation_failure_counts.items()
            },
            'category_stats': {
                category.value: stats for category, stats in self.category_stats.items()
                if category in [MetricCategory.NAVIGATION, MetricCategory.CONNECTIVITY, 
                               MetricCategory.DATA_FRESHNESS, MetricCategory.VALIDATION]
            }
        }
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary"""
        uptime_seconds = time.time() - self.start_time
        
        return {
            'uptime_seconds': uptime_seconds,
            'fallbacks': self.get_fallback_summary(),
            'validation_failures': self.get_validation_failure_summary(),
            'category_stats': {
                category.value: stats for category, stats in self.category_stats.items()
            },
            'buffer_stats': {
                'total_entries': len(self.buffer.entries),
                'buffer_size': self.buffer.max_size,
                'counters': self.buffer.get_counters(),
                'gauges': self.buffer.get_gauges()
            }
        }
    
    def get_metrics_for_export(self, since: Optional[float] = None) -> List[Dict[str, Any]]:
        """Get metrics formatted for export to external systems"""
        entries = self.buffer.get_entries(since)
        return [entry.to_dict() for entry in entries]
    
    def flush_metrics(self) -> Dict[str, Any]:
        """Flush metrics and return for sending to external endpoint"""
        metrics_data = self.get_metrics_for_export()
        summary = self.get_metrics_summary()
        
        # Don't clear buffer in case we need to retry
        return {
            'timestamp': time.time(),
            'metrics': metrics_data,
            'summary': summary
        }


# Global metrics aggregator instance
_metrics_aggregator: Optional[MetricsAggregator] = None


def get_metrics_aggregator() -> MetricsAggregator:
    """Get or create the global metrics aggregator"""
    global _metrics_aggregator
    if _metrics_aggregator is None:
        _metrics_aggregator = MetricsAggregator()
    return _metrics_aggregator


def set_metrics_aggregator(aggregator: MetricsAggregator):
    """Set the global metrics aggregator"""
    global _metrics_aggregator
    _metrics_aggregator = aggregator


# Convenience functions for common metric recording
def record_fallback(fallback_type: str, reason: str, service: str = "unknown", severity: str = "info"):
    """Record a fallback occurrence"""
    get_metrics_aggregator().record_fallback(fallback_type, reason, service, severity)


def record_validation_failure(category: str, failure_type: str, details: str = "", field: Optional[str] = None):
    """Record a validation failure"""
    get_metrics_aggregator().record_validation_failure(category, failure_type, details, field)


def record_navigation_failure(route: str, error_type: str, error_message: str = "", component: Optional[str] = None):
    """Record navigation failure"""
    get_metrics_aggregator().record_navigation_failure(route, error_type, error_message, component)


def record_connectivity_failure(service: str, endpoint: str, error_type: str, status_code: Optional[int] = None):
    """Record connectivity failure"""
    get_metrics_aggregator().record_connectivity_failure(service, endpoint, error_type, status_code)


def record_data_freshness_failure(data_type: str, age_seconds: float, threshold_seconds: float, source: str = "unknown"):
    """Record data freshness failure"""
    get_metrics_aggregator().record_data_freshness_failure(data_type, age_seconds, threshold_seconds, source)


def record_performance_metric(name: str, value: float, unit: str = "ms", tags: Optional[Dict[str, str]] = None):
    """Record performance metric"""
    get_metrics_aggregator().record_performance_metric(name, value, unit, tags)


def record_business_metric(name: str, value: float, metric_type: MetricType = MetricType.COUNTER, tags: Optional[Dict[str, str]] = None):
    """Record business metric"""
    get_metrics_aggregator().record_business_metric(name, value, metric_type, tags)