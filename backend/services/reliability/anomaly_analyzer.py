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