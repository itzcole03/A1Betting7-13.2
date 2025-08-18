"""
Anomaly Analyzer - System anomaly detection and classification
Analyzes system metrics to identify performance and operational anomalies
"""

import time
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timezone

try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("anomaly_analyzer")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


class AnomalyRule:
    """Represents a single anomaly detection rule"""
    
    def __init__(
        self, 
        code: str, 
        severity: str, 
        description: str, 
        predicate: Callable[[Dict[str, Any]], bool],
        recommendation: str = ""
    ):
        self.code = code
        self.severity = severity  # "info", "warning", "critical"
        self.description = description
        self.predicate = predicate
        self.recommendation = recommendation


# Global anomaly detection rules
ANOMALY_RULES = [
    AnomalyRule(
        code="HIGH_CPU",
        severity="warning",
        description="CPU usage is critically high",
        predicate=lambda snapshot: snapshot.get("performance", {}).get("cpu_percent", 0) > 85,
        recommendation="Review system load and consider scaling resources"
    ),
    
    AnomalyRule(
        code="HIGH_P95_LATENCY", 
        severity="warning",
        description="95th percentile latency is elevated",
        predicate=lambda snapshot: snapshot.get("performance", {}).get("p95_request_latency_ms", 0) > 1500,
        recommendation="Investigate slow endpoints and database queries"
    ),
    
    AnomalyRule(
        code="SLOW_INGEST",
        severity="warning", 
        description="Data ingestion latency is high",
        predicate=lambda snapshot: snapshot.get("ingestion", {}).get("ingest_latency_ms", 0) > 5000,
        recommendation="Check ingestion pipeline and data source availability"
    ),
    
    AnomalyRule(
        code="LOW_CACHE_HIT_RATE",
        severity="info",
        description="Cache hit rate is below optimal threshold",
        predicate=lambda snapshot: _check_low_cache_hit_rate(snapshot),
        recommendation="Review cache keys and TTL settings"
    ),
    
    AnomalyRule(
        code="NO_ACTIVE_EDGES",
        severity="critical",
        description="No active edges while ingestion is running",
        predicate=lambda snapshot: _check_no_active_edges(snapshot),
        recommendation="Restart edge engine or check edge creation pipeline"
    ),
    
    AnomalyRule(
        code="PROVIDER_OUTAGE",
        severity="critical",
        description="One or more data providers are experiencing outages",
        predicate=lambda snapshot: _check_provider_outage(snapshot),
        recommendation="Check provider connectivity and consider failover strategies"
    ),
    
    AnomalyRule(
        code="PROVIDER_DEGRADED",
        severity="warning",
        description="Data providers showing degraded performance",
        predicate=lambda snapshot: _check_provider_degradation(snapshot),
        recommendation="Monitor provider performance and check SLA compliance"
    ),
    
    AnomalyRule(
        code="HIGH_PROVIDER_LATENCY",
        severity="warning",
        description="Provider response latency exceeds SLA thresholds",
        predicate=lambda snapshot: _check_high_provider_latency(snapshot),
        recommendation="Review provider endpoints and network connectivity"
    ),
    
    # New anomaly rules for extended reliability monitoring
    AnomalyRule(
        code="STALLED_VALUATION_PIPE",
        severity="critical",
        description="High event volume but low recomputation rate indicates stalled valuation pipeline",
        predicate=lambda snapshot: _check_stalled_valuation_pipeline(snapshot),
        recommendation="Check valuation service health, restart pipeline components, review recomputation queue"
    ),
    
    AnomalyRule(
        code="EXCESSIVE_RATIONALE_FAILURE",
        severity="warning",
        description="Rationale generation service showing high failure rates",
        predicate=lambda snapshot: _check_excessive_rationale_failures(snapshot),
        recommendation="Review LLM service availability, check token limits, investigate rationale pipeline errors"
    ),
    
    AnomalyRule(
        code="CORRELATION_PSD_DEGRADATION",
        severity="warning", 
        description="Correlation PSD (Power Spectral Density) analysis showing performance degradation",
        predicate=lambda snapshot: _check_correlation_psd_degradation(snapshot),
        recommendation="Review correlation analysis pipeline, check data quality, investigate statistical model drift"
    )
]


def _check_low_cache_hit_rate(snapshot: Dict[str, Any]) -> bool:
    """Check if cache hit rate is below threshold with sufficient traffic"""
    cache_stats = snapshot.get("cache", {})
    hit_rate = cache_stats.get("hit_rate", 1.0)
    hits = cache_stats.get("hits", 0)
    misses = cache_stats.get("misses", 0)
    total_operations = hits + misses
    
    return hit_rate < 0.2 and total_operations > 100


def _check_no_active_edges(snapshot: Dict[str, Any]) -> bool:
    """Check if no active edges while ingestion recently ran"""
    edge_stats = snapshot.get("edge_engine", {})
    ingestion_stats = snapshot.get("ingestion", {})
    
    active_edges = edge_stats.get("active_edges", 1)  # Default to 1 to avoid false positives
    last_edge_created_ts = edge_stats.get("last_edge_created_ts")
    last_ingest_ts = ingestion_stats.get("last_ingest_ts")
    
    # Only flag if we have zero edges
    if active_edges > 0:
        return False
    
    # Check if ingestion ran recently but no edges were created for >5 minutes
    current_time = time.time()
    edge_threshold = 5 * 60  # 5 minutes
    
    if last_edge_created_ts:
        try:
            # Parse ISO timestamp if it's a string
            if isinstance(last_edge_created_ts, str):
                edge_time = datetime.fromisoformat(last_edge_created_ts.replace('Z', '+00:00')).timestamp()
            else:
                edge_time = last_edge_created_ts
            
            if current_time - edge_time > edge_threshold:
                # Check if ingestion ran recently (within last 30 minutes)
                if last_ingest_ts:
                    if isinstance(last_ingest_ts, str):
                        ingest_time = datetime.fromisoformat(last_ingest_ts.replace('Z', '+00:00')).timestamp()
                    else:
                        ingest_time = last_ingest_ts
                    
                    ingest_threshold = 30 * 60  # 30 minutes
                    if current_time - ingest_time < ingest_threshold:
                        return True
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse timestamps for edge anomaly check: {e}")
            return False
    
    return False


def _check_provider_outage(snapshot: Dict[str, Any]) -> bool:
    """Check if any providers are in outage state (circuit open)"""
    providers = snapshot.get("providers", {})
    if not providers:
        return False
    
    for provider_id, provider_data in providers.items():
        health_summary = provider_data.get("health_summary", {})
        if health_summary.get("health_status") == "outage":
            return True
        
        # Also check circuit breaker state
        circuit_info = health_summary.get("circuit_breaker", {})
        if circuit_info.get("state") == "open":
            return True
    
    return False


def _check_provider_degradation(snapshot: Dict[str, Any]) -> bool:
    """Check if providers are showing degraded performance"""
    providers = snapshot.get("providers", {})
    if not providers:
        return False
    
    degraded_count = 0
    total_count = 0
    
    for provider_id, provider_data in providers.items():
        total_count += 1
        health_summary = provider_data.get("health_summary", {})
        
        # Check for degraded status
        if health_summary.get("health_status") == "degraded":
            degraded_count += 1
            continue
            
        # Check SLA metrics
        sla_metrics = health_summary.get("sla_metrics", {})
        success_percentage = sla_metrics.get("success_percentage", 100)
        p95_latency = sla_metrics.get("p95_latency_ms", 0)
        
        # Consider degraded if success rate < 95% or p95 latency > 2000ms
        if success_percentage < 95.0 or p95_latency > 2000:
            degraded_count += 1
    
    # Flag as degraded if more than 30% of providers are degraded
    if total_count > 0:
        degradation_percentage = degraded_count / total_count
        return degradation_percentage > 0.3
    
    return False


def _check_high_provider_latency(snapshot: Dict[str, Any]) -> bool:
    """Check if provider latencies exceed SLA thresholds"""
    providers = snapshot.get("providers", {})
    if not providers:
        return False
    
    high_latency_count = 0
    total_count = 0
    
    for provider_id, provider_data in providers.items():
        total_count += 1
        health_summary = provider_data.get("health_summary", {})
        sla_metrics = health_summary.get("sla_metrics", {})
        
        p95_latency = sla_metrics.get("p95_latency_ms", 0)
        
        # Consider high latency if p95 > 3000ms (3 seconds)
        if p95_latency > 3000:
            high_latency_count += 1
    
    # Flag if more than 50% of providers have high latency
    if total_count > 0:
        high_latency_percentage = high_latency_count / total_count
        return high_latency_percentage > 0.5
    
    return False


# New anomaly check functions for extended reliability monitoring
def _check_stalled_valuation_pipeline(snapshot: Dict[str, Any]) -> bool:
    """Check if valuation pipeline is stalled (high events but low recomputes)"""
    streaming_stats = snapshot.get("streaming", {})
    
    events_per_min = streaming_stats.get("events_per_min", 0)
    recompute_backlog = streaming_stats.get("recompute_backlog", 0)
    
    # Detect stalled pipeline: high event rate but growing backlog
    # High events (>100/min) but backlog growing (>1000) indicates processing issues
    if events_per_min > 100 and recompute_backlog > 1000:
        return True
    
    # Alternative check: very low recompute rate compared to event rate
    # If events are flowing but almost no recomputing happening
    if events_per_min > 50 and recompute_backlog > events_per_min * 10:
        return True
    
    return False


def _check_excessive_rationale_failures(snapshot: Dict[str, Any]) -> bool:
    """Check if rationale generation is showing high failure rates"""
    rationale_stats = snapshot.get("rationale", {})
    
    total_requests = rationale_stats.get("requests", 0)
    cache_hit_rate = rationale_stats.get("cache_hit_rate", 1.0)
    
    # Check for low cache hit rate with sufficient traffic (indicating errors)
    if total_requests > 10 and cache_hit_rate < 0.3:
        return True
    
    # Check average token usage - very low might indicate failed generations
    token_samples = rationale_stats.get("avg_tokens", 0)
    if total_requests > 5 and token_samples < 50:
        return True
    
    # Check if we have rationale-specific error indicators
    if "generation_errors" in rationale_stats:
        error_rate = rationale_stats.get("generation_errors", 0) / max(1, total_requests)
        if error_rate > 0.2:  # 20% error rate
            return True
    
    return False


def _check_correlation_psd_degradation(snapshot: Dict[str, Any]) -> bool:
    """Check if correlation PSD analysis is degrading"""
    optimization_stats = snapshot.get("optimization", {})
    
    partial_refresh_count = optimization_stats.get("partial_refresh_count", 0)
    avg_refresh_latency_ms = optimization_stats.get("avg_refresh_latency_ms", 0)
    
    # Check for excessive partial refreshes (may indicate correlation issues)
    if partial_refresh_count > 50:
        return True
    
    # Check for high refresh latency (may indicate computation struggles)
    if avg_refresh_latency_ms > 5000:  # 5 seconds
        return True
    
    # Check optimization metrics for degradation indicators
    if "cache_efficiency" in optimization_stats:
        cache_efficiency = optimization_stats.get("cache_efficiency", "excellent")
        if cache_efficiency in ["needs_improvement", "poor"]:
            return True
    
    return False


def analyze_anomalies(snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Analyze system snapshot for anomalies based on predefined rules.
    
    Args:
        snapshot: System metrics and health snapshot
        
    Returns:
        List of detected anomalies with details
    """
    anomalies = []
    current_time = datetime.now(timezone.utc)
    
    try:
        # Evaluate each anomaly rule
        for rule in ANOMALY_RULES:
            try:
                if rule.predicate(snapshot):
                    anomaly = {
                        "code": rule.code,
                        "severity": rule.severity,
                        "description": rule.description,
                        "recommendation": rule.recommendation,
                        "detected_at": current_time.isoformat(),
                        "context": _extract_anomaly_context(snapshot, rule.code)
                    }
                    anomalies.append(anomaly)
                    
                    logger.warning(f"Anomaly detected: {rule.code} - {rule.description}")
                    
            except Exception as e:
                logger.error(f"Error evaluating anomaly rule {rule.code}: {e}")
                # Continue with other rules
                
    except Exception as e:
        logger.error(f"Error in anomaly analysis: {e}")
        # Return empty list rather than crashing
        
    return anomalies


def _extract_anomaly_context(snapshot: Dict[str, Any], anomaly_code: str) -> Dict[str, Any]:
    """
    Extract relevant context information for specific anomaly types.
    
    Args:
        snapshot: System metrics snapshot
        anomaly_code: Code of detected anomaly
        
    Returns:
        Context dictionary with relevant metrics
    """
    context = {}
    
    try:
        if anomaly_code == "HIGH_CPU":
            context = {
                "cpu_percent": snapshot.get("performance", {}).get("cpu_percent", 0),
                "rss_mb": snapshot.get("performance", {}).get("rss_mb", 0),
                "active_connections": snapshot.get("websocket", {}).get("active_connections", 0)
            }
            
        elif anomaly_code == "HIGH_P95_LATENCY":
            performance = snapshot.get("performance", {})
            context = {
                "p95_request_latency_ms": performance.get("p95_request_latency_ms", 0),
                "avg_request_latency_ms": performance.get("avg_request_latency_ms", 0),
                "total_requests": snapshot.get("metrics", {}).get("total_requests", 0)
            }
            
        elif anomaly_code == "SLOW_INGEST":
            ingestion = snapshot.get("ingestion", {})
            context = {
                "ingest_latency_ms": ingestion.get("ingest_latency_ms", 0),
                "recent_failures": ingestion.get("recent_failures", 0),
                "last_ingest_ts": ingestion.get("last_ingest_ts")
            }
            
        elif anomaly_code == "LOW_CACHE_HIT_RATE":
            cache = snapshot.get("cache", {})
            context = {
                "hit_rate": cache.get("hit_rate", 0),
                "hits": cache.get("hits", 0),
                "misses": cache.get("misses", 0),
                "total_operations": cache.get("hits", 0) + cache.get("misses", 0)
            }
            
        elif anomaly_code == "NO_ACTIVE_EDGES":
            context = {
                "active_edges": snapshot.get("edge_engine", {}).get("active_edges", 0),
                "last_edge_created_ts": snapshot.get("edge_engine", {}).get("last_edge_created_ts"),
                "last_ingest_ts": snapshot.get("ingestion", {}).get("last_ingest_ts"),
                "edges_per_min_rate": snapshot.get("edge_engine", {}).get("edges_per_min_rate", 0)
            }
        
        elif anomaly_code == "PROVIDER_OUTAGE":
            providers = snapshot.get("providers", {})
            outage_providers = []
            for provider_id, provider_data in providers.items():
                health_summary = provider_data.get("health_summary", {})
                if health_summary.get("health_status") == "outage":
                    outage_providers.append({
                        "provider_id": provider_id,
                        "circuit_state": health_summary.get("circuit_breaker", {}).get("state"),
                        "consecutive_failures": health_summary.get("circuit_breaker", {}).get("consecutive_failures", 0)
                    })
            context = {
                "outage_providers": outage_providers,
                "total_providers": len(providers),
                "affected_count": len(outage_providers)
            }
        
        elif anomaly_code == "PROVIDER_DEGRADED":
            providers = snapshot.get("providers", {})
            degraded_providers = []
            for provider_id, provider_data in providers.items():
                health_summary = provider_data.get("health_summary", {})
                sla_metrics = health_summary.get("sla_metrics", {})
                if (health_summary.get("health_status") == "degraded" or 
                    sla_metrics.get("success_percentage", 100) < 95.0 or
                    sla_metrics.get("p95_latency_ms", 0) > 2000):
                    degraded_providers.append({
                        "provider_id": provider_id,
                        "success_percentage": sla_metrics.get("success_percentage", 100),
                        "p95_latency_ms": sla_metrics.get("p95_latency_ms", 0)
                    })
            context = {
                "degraded_providers": degraded_providers,
                "total_providers": len(providers),
                "degraded_count": len(degraded_providers),
                "degradation_percentage": len(degraded_providers) / len(providers) * 100 if providers else 0
            }
            
        elif anomaly_code == "HIGH_PROVIDER_LATENCY":
            providers = snapshot.get("providers", {})
            high_latency_providers = []
            for provider_id, provider_data in providers.items():
                health_summary = provider_data.get("health_summary", {})
                sla_metrics = health_summary.get("sla_metrics", {})
                p95_latency = sla_metrics.get("p95_latency_ms", 0)
                if p95_latency > 3000:
                    high_latency_providers.append({
                        "provider_id": provider_id,
                        "p95_latency_ms": p95_latency
                    })
            context = {
                "high_latency_providers": high_latency_providers,
                "total_providers": len(providers),
                "high_latency_count": len(high_latency_providers),
                "max_latency_ms": max([p["p95_latency_ms"] for p in high_latency_providers]) if high_latency_providers else 0
            }
            
    except Exception as e:
        logger.error(f"Error extracting context for anomaly {anomaly_code}: {e}")
        context = {"error": "context_extraction_failed"}
        
    return context


def get_anomaly_summary(anomalies: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate summary statistics for detected anomalies.
    
    Args:
        anomalies: List of detected anomalies
        
    Returns:
        Summary with counts by severity level
    """
    summary = {
        "total_anomalies": len(anomalies),
        "by_severity": {
            "critical": 0,
            "warning": 0,
            "info": 0
        },
        "codes": []
    }
    
    for anomaly in anomalies:
        severity = anomaly.get("severity", "unknown")
        if severity in summary["by_severity"]:
            summary["by_severity"][severity] += 1
        summary["codes"].append(anomaly.get("code"))
    
    return summary