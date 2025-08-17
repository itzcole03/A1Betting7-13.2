"""Diagnostics endpoints for system health and circuit breaker status."""

from typing import Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Response

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

from backend.utils.llm_engine import llm_engine
from backend.services.health_service import health_service, HealthStatusResponse

# New comprehensive health system
from backend.services.health.health_collector import get_health_collector, map_statuses_to_overall
from backend.services.health.health_models import HealthResponse

# Reliability monitoring system
from backend.services.reliability.reliability_orchestrator import get_reliability_orchestrator

# Metrics instrumentation
from backend.services.metrics.instrumentation import instrument_route

# Unified logging
try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("diagnostics")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/circuit-breaker/ollama", response_model=StandardAPIResponse[Dict[str, Any]])
@instrument_route
async def get_ollama_circuit_breaker_status():
    """Get the status of the Ollama circuit breaker."""
    if hasattr(llm_engine.client, "circuit_breaker"):
        return ResponseBuilder.success(llm_engine.client.circuit_breaker.status())
    return ResponseBuilder.success({"error": "No circuit breaker found on LLM client."})


@router.get("/system", response_model=StandardAPIResponse[Dict[str, Any]])
@instrument_route
async def get_system_diagnostics():
    """Get overall system diagnostics."""
    return ResponseBuilder.success({
        "llm_initialized": getattr(llm_engine, "is_initialized", False),
        "llm_client_type": (
            type(llm_engine.client).__name__ if llm_engine.client else None
        ),
        "circuit_breaker": (
            llm_engine.client.circuit_breaker.status()
            if hasattr(llm_engine.client, "circuit_breaker")
            else None
        ),
        "model_health": getattr(llm_engine.client, "model_health", None),
    })


@router.get("/health", response_model=HealthResponse)
async def get_comprehensive_health(response: Response):
    """
    Production-ready comprehensive health diagnostics endpoint.
    
    Provides detailed system health information including:
    - Service status monitoring (database, Redis, model registry, WebSocket)
    - Performance metrics (CPU, memory, request latency)
    - Cache statistics and hit rates
    - Infrastructure information (uptime, build details)
    
    Returns:
        HealthResponse: Complete health diagnostic information
    """
    # Set response headers
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Health-Version"] = "v2"
    
    try:
        # Collect comprehensive health information
        health_collector = get_health_collector()
        health_data = await health_collector.collect_health()
        
        # Determine overall system status
        overall_status = map_statuses_to_overall(health_data.services)
        
        # Log health summary using structured logging
        health_summary = {
            "overall_status": overall_status,
            "service_count": len(health_data.services),
            "services": {service.name: service.status for service in health_data.services},
            "performance": {
                "cpu_percent": health_data.performance.cpu_percent,
                "rss_mb": health_data.performance.rss_mb,
                "avg_latency_ms": health_data.performance.avg_request_latency_ms
            },
            "cache_hit_rate": health_data.cache.hit_rate,
            "uptime_sec": health_data.infrastructure.uptime_sec
        }
        
        # Use structured logging - fallback to simple string if complex logging not available
        logger.info(f"Health check - Status: {overall_status}, Services: {len(health_data.services)}, Cache Hit Rate: {health_data.cache.hit_rate:.2f}")
        
        return health_data
        
    except Exception as e:
        # Log error using structured logging
        logger.error(f"Health check failed: {str(e)}")
        
        # Return minimal health response on error
        from datetime import datetime, timezone
        from backend.services.health.health_models import ServiceStatus, PerformanceStats, CacheStats, InfrastructureStats
        
        return HealthResponse(
            timestamp=datetime.now(timezone.utc),
            version="v2",
            services=[
                ServiceStatus(name="system", status="down", latency_ms=None, details={"error": "health_check_failed"})
            ],
            performance=PerformanceStats(
                cpu_percent=0.0,
                rss_mb=0.0,
                event_loop_lag_ms=0.0,
                avg_request_latency_ms=0.0,
                p95_request_latency_ms=0.0
            ),
            cache=CacheStats(hit_rate=0.0, hits=0, misses=0, evictions=0),
            infrastructure=InfrastructureStats(
                uptime_sec=0.0,
                python_version="unknown",
                build_commit=None,
                environment="unknown"
            )
        )


@router.get("/reliability")
async def get_reliability_report(response: Response, include_traces: bool = False):
    """
    Comprehensive reliability monitoring endpoint.
    
    Provides aggregated diagnostic report including:
    - Health snapshot from existing health collectors
    - Performance metrics from unified metrics collector  
    - Edge engine statistics (stub implementation)
    - Data ingestion pipeline metrics (stub implementation)
    - WebSocket connection statistics
    - Model registry status and counts
    - Anomaly analysis with severity classification
    - Overall status derivation based on health and anomalies
    
    Query Parameters:
        include_traces: Whether to include trace information (default: false)
    
    Returns:
        JSON reliability report (not wrapped in Pydantic model)
    """
    # Set response headers for reliability monitoring
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Reliability-Version"] = "v1"
    
    try:
        # Get reliability orchestrator and generate report
        reliability_orchestrator = get_reliability_orchestrator()
        report = await reliability_orchestrator.generate_report(include_traces=include_traces)
        
        # Log structured reliability event
        logger.info(
            "Reliability report requested",
            extra={
                "overall_status": report.get("overall_status"),
                "anomaly_count": len(report.get("anomalies", [])),
                "active_edges": report.get("edge_engine", {}).get("active_edges", 0),
                "cpu_percent": report.get("performance", {}).get("cpu_percent", 0),
                "p95_request_latency_ms": report.get("performance", {}).get("p95_request_latency_ms", 0)
            }
        )
        
        # Return raw JSON (not wrapped in StandardAPIResponse)
        return report
        
    except Exception as e:
        logger.error(f"Reliability report generation failed: {e}")
        
        # Return minimal error report
        error_report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "overall_status": "down",
            "health_version": "v2",
            "services": [],
            "performance": {},
            "cache": {},
            "infrastructure": {},
            "metrics": {},
            "edge_engine": {},
            "ingestion": {},
            "websocket": {},
            "model_registry": {},
            "anomalies": [
                {
                    "code": "RELIABILITY_REPORT_FAILED",
                    "severity": "critical", 
                    "description": "Failed to generate reliability report",
                    "recommendation": "Check system logs and service availability"
                }
            ],
            "notes": [f"Report generation failed: {str(e)[:100]}"],
            "include_traces": include_traces,
            "error": True
        }
        
        response.status_code = 500
        return error_report


@router.get("/health/legacy", response_model=HealthStatusResponse)
async def get_legacy_structured_health():
    """
    DEPRECATED: Legacy health endpoint for backward compatibility.
    Use /health for the new comprehensive health diagnostics.
    
    Returns basic health information including:
    - Overall system status (ok/degraded/unhealthy)  
    - Uptime in seconds
    - Individual component health (websocket, cache, model_inference)
    - Build information and timestamps
    """
    return await health_service.compute_health()
