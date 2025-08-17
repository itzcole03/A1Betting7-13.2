"""
Prometheus Metrics Exposition - Feature-flagged endpoint for metrics export
Provides Prometheus-compatible metrics endpoint when METRICS_PROMETHEUS_ENABLED is true.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Response, HTTPException

# Core services
from backend.services.metrics.unified_metrics_collector import get_metrics_collector

# Configuration
try:
    from backend.services.unified_config import get_config
    config = get_config()
    PROMETHEUS_ENABLED = getattr(config, 'METRICS_PROMETHEUS_ENABLED', False)
except ImportError:
    PROMETHEUS_ENABLED = False

# Logging
try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("prometheus_exporter")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

router = APIRouter()


def format_prometheus_metric(name: str, metric_type: str, help_text: str, value: float, labels: Optional[Dict[str, str]] = None) -> str:
    """
    Format a single metric in Prometheus exposition format.
    
    Args:
        name: Metric name
        metric_type: Metric type (counter, gauge, histogram)
        help_text: Help description
        value: Metric value
        labels: Optional labels dictionary
        
    Returns:
        Formatted Prometheus metric string
    """
    lines = []
    lines.append(f"# HELP {name} {help_text}")
    lines.append(f"# TYPE {name} {metric_type}")
    
    if labels:
        label_str = ",".join([f'{k}="{v}"' for k, v in labels.items()])
        lines.append(f"{name}{{{label_str}}} {value}")
    else:
        lines.append(f"{name} {value}")
    
    return "\n".join(lines)


def format_prometheus_histogram(name: str, help_text: str, histogram: Dict[str, int], total_count: int) -> str:
    """
    Format histogram data in Prometheus exposition format.
    
    Args:
        name: Base metric name
        help_text: Help description
        histogram: Histogram bucket counts
        total_count: Total sample count
        
    Returns:
        Formatted Prometheus histogram string
    """
    lines = []
    lines.append(f"# HELP {name} {help_text}")
    lines.append(f"# TYPE {name} histogram")
    
    # Bucket entries
    cumulative_count = 0
    for bucket, count in histogram.items():
        if bucket == "+Inf":
            lines.append(f'{name}_bucket{{le="+Inf"}} {total_count}')
        else:
            cumulative_count += count
            lines.append(f'{name}_bucket{{le="{bucket}"}} {cumulative_count}')
    
    # Summary statistics
    lines.append(f"{name}_count {total_count}")
    # Note: _sum would require tracking sum of all latencies, which we don't store
    lines.append(f"{name}_sum NaN")
    
    return "\n".join(lines)


def generate_prometheus_metrics() -> str:
    """
    Generate Prometheus exposition format from unified metrics collector.
    
    Returns:
        Complete Prometheus metrics string
    """
    metrics_collector = get_metrics_collector()
    snapshot = metrics_collector.snapshot()
    
    metrics_lines = []
    
    # Request metrics
    metrics_lines.append(format_prometheus_metric(
        "a1betting_requests_total",
        "counter",
        "Total number of HTTP requests processed",
        snapshot.get("total_requests", 0)
    ))
    
    metrics_lines.append(format_prometheus_metric(
        "a1betting_request_errors_rate",
        "gauge",
        "Current error rate for HTTP requests",
        snapshot.get("error_rate", 0.0)
    ))
    
    # Latency metrics
    metrics_lines.append(format_prometheus_metric(
        "a1betting_request_duration_average_ms",
        "gauge",
        "Average request duration in milliseconds",
        snapshot.get("avg_latency_ms", 0.0)
    ))
    
    # Percentile metrics
    for percentile in ["p50", "p90", "p95", "p99"]:
        value = snapshot.get(f"{percentile}_latency_ms", 0.0)
        metrics_lines.append(format_prometheus_metric(
            f"a1betting_request_duration_{percentile}_ms",
            "gauge",
            f"{percentile.upper()} percentile request duration in milliseconds",
            value
        ))
    
    # Histogram (if available)
    histogram = snapshot.get("histogram", {})
    if histogram:
        histogram_str = format_prometheus_histogram(
            "a1betting_request_duration_ms",
            "Request duration histogram in milliseconds",
            histogram,
            snapshot.get("total_requests", 0)
        )
        metrics_lines.append(histogram_str)
    
    # Event loop metrics
    event_loop = snapshot.get("event_loop", {})
    if event_loop:
        metrics_lines.append(format_prometheus_metric(
            "a1betting_event_loop_lag_average_ms",
            "gauge",
            "Average event loop lag in milliseconds",
            event_loop.get("avg_lag_ms", 0.0)
        ))
        
        metrics_lines.append(format_prometheus_metric(
            "a1betting_event_loop_lag_p95_ms",
            "gauge",
            "95th percentile event loop lag in milliseconds",
            event_loop.get("p95_lag_ms", 0.0)
        ))
        
        metrics_lines.append(format_prometheus_metric(
            "a1betting_event_loop_samples_total",
            "gauge",
            "Number of event loop lag samples collected",
            event_loop.get("sample_count", 0)
        ))
    
    # Cache metrics
    cache_stats = snapshot.get("cache", {})
    if cache_stats:
        for metric in ["hits", "misses", "evictions"]:
            metrics_lines.append(format_prometheus_metric(
                f"a1betting_cache_{metric}_total",
                "counter",
                f"Total cache {metric}",
                cache_stats.get(metric, 0)
            ))
        
        metrics_lines.append(format_prometheus_metric(
            "a1betting_cache_hit_rate",
            "gauge",
            "Current cache hit rate",
            cache_stats.get("hit_rate", 0.0)
        ))
    
    # WebSocket metrics
    websocket_stats = snapshot.get("websocket", {})
    if websocket_stats:
        metrics_lines.append(format_prometheus_metric(
            "a1betting_websocket_connections_estimate",
            "gauge",
            "Estimated current WebSocket connections",
            websocket_stats.get("open_connections_estimate", 0)
        ))
        
        metrics_lines.append(format_prometheus_metric(
            "a1betting_websocket_messages_sent_total",
            "counter",
            "Total WebSocket messages sent",
            websocket_stats.get("messages_sent", 0)
        ))
    
    # Metadata
    metrics_lines.append(format_prometheus_metric(
        "a1betting_metrics_timestamp_seconds",
        "gauge",
        "Timestamp of last metrics collection",
        snapshot.get("timestamp", 0)
    ))
    
    return "\n\n".join(metrics_lines) + "\n"


@router.get("/internal/metrics")
async def prometheus_metrics():
    """
    Prometheus metrics endpoint - feature flagged.
    
    Returns metrics in Prometheus exposition format when METRICS_PROMETHEUS_ENABLED is true.
    Safe for small scale deployments; consider official prometheus_client integration for larger scale.
    
    Returns:
        Text response with Prometheus-formatted metrics
    """
    if not PROMETHEUS_ENABLED:
        raise HTTPException(
            status_code=404,
            detail="Prometheus metrics endpoint is disabled. Set METRICS_PROMETHEUS_ENABLED=true to enable."
        )
    
    try:
        metrics_text = generate_prometheus_metrics()
        
        logger.debug("Generated Prometheus metrics", extra={
            "category": "metrics",
            "action": "prometheus_export",
            "metrics_size": len(metrics_text)
        })
        
        return Response(
            content=metrics_text,
            media_type="text/plain; charset=utf-8"
        )
        
    except Exception as e:
        logger.error("Failed to generate Prometheus metrics", extra={
            "category": "metrics",
            "action": "prometheus_export_error",
            "error": str(e)
        })
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate metrics: {str(e)}"
        )


@router.get("/metrics")
async def metrics_alias():
    """
    Alternative metrics endpoint following Prometheus convention.
    
    This endpoint follows the standard /metrics path convention used by many monitoring systems.
    """
    return await prometheus_metrics()


# Note: Safe for small scale deployments
# For larger scale production deployments, consider migrating to the official prometheus_client library
# which provides more efficient metric collection and standardized metric types.