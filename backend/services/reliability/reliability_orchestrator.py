"""
Reliability Orchestrator - Central orchestration for comprehensive reliability reporting
Assembles reliability reports from various system components and monitoring services
"""

import asyncio
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

# Core imports
try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("reliability_orchestrator")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

# Health and metrics services
from backend.services.health.health_collector import get_health_collector, map_statuses_to_overall
from backend.services.metrics.unified_metrics_collector import get_metrics_collector

# Reliability-specific providers
from .edge_stats_provider import get_edge_stats_provider
from .ingestion_stats_provider import get_ingestion_stats_provider
from .websocket_stats_provider import get_websocket_stats_provider
from .anomaly_analyzer import analyze_anomalies


class ReliabilityOrchestrator:
    """
    Central orchestration service for comprehensive reliability monitoring.
    
    Periodically assembles reliability reports from various system components
    including health checks, performance metrics, and specialized providers.
    """
    
    def __init__(self):
        """Initialize reliability orchestrator with service dependencies."""
        self._health_collector = get_health_collector()
        self._metrics_collector = get_metrics_collector()
        self._edge_stats_provider = get_edge_stats_provider()
        self._ingestion_stats_provider = get_ingestion_stats_provider()
        self._websocket_stats_provider = get_websocket_stats_provider()
        
        # Report generation tracking
        self._last_report_time = 0
        self._report_cache: Optional[Dict[str, Any]] = None
        self._cache_ttl = 30  # Cache reports for 30 seconds
    
    async def generate_report(self, include_traces: bool = False) -> Dict[str, Any]:
        """
        Generate comprehensive reliability report from all monitored components.
        
        Args:
            include_traces: Whether to include trace information in report
            
        Returns:
            Complete reliability report dictionary containing:
            - System health snapshot
            - Performance metrics
            - Edge engine statistics
            - Ingestion pipeline metrics
            - WebSocket connection stats
            - Model registry information
            - Detected anomalies
            - Overall status assessment
        """
        start_time = time.time()
        current_time = time.time()
        
        # Use cached report if still valid (for high-frequency requests)
        if (self._report_cache and 
            current_time - self._last_report_time < self._cache_ttl and
            self._report_cache.get('include_traces') == include_traces):
            logger.debug("Returning cached reliability report")
            return self._report_cache
        
        try:
            logger.info("Generating comprehensive reliability report")
            
            # Collect data from all sources concurrently
            collection_tasks = {
                'health': self._collect_health_data(),
                'metrics': self._collect_metrics_data(),
                'edge_engine': self._collect_edge_stats(),
                'ingestion': self._collect_ingestion_stats(),
                'websocket': self._collect_websocket_stats(),
                'model_registry': self._collect_model_registry_stats()
            }
            
            # Execute all data collection tasks with timeout
            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*[
                        self._safe_execute(name, task) 
                        for name, task in collection_tasks.items()
                    ]),
                    timeout=10.0
                )
                
                # Unpack results
                health_data, metrics_data, edge_stats, ingestion_stats, websocket_stats, model_registry_stats = results
                
            except asyncio.TimeoutError:
                logger.warning("Data collection timeout - using partial data")
                # Use safe defaults for timed-out operations
                health_data = await self._get_fallback_health_data()
                metrics_data = self._get_fallback_metrics_data()
                edge_stats = {"active_edges": 0, "last_edge_created_ts": None, "edges_per_min_rate": 0.0}
                ingestion_stats = {"last_ingest_ts": None, "ingest_latency_ms": None, "recent_failures": 0}
                websocket_stats = {"active_connections": 0, "last_broadcast_ts": None, "connection_rate": 0.0}
                model_registry_stats = {"total_models": 0, "active_models": 0, "default_model": None}
            
            # Create comprehensive snapshot for anomaly analysis
            snapshot = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "health": health_data,
                "performance": health_data.get("performance", {}),
                "cache": health_data.get("cache", {}),
                "metrics": metrics_data,
                "edge_engine": edge_stats,
                "ingestion": ingestion_stats,
                "websocket": websocket_stats,
                "model_registry": model_registry_stats
            }
            
            # Analyze anomalies based on collected data
            anomalies = analyze_anomalies(snapshot)
            
            # Determine overall status considering anomalies
            overall_status = self._determine_overall_status(health_data, anomalies)
            
            # Generate notes for operational context
            notes = self._generate_report_notes(snapshot, anomalies)
            
            # Construct final report
            report = {
                "timestamp": snapshot["timestamp"],
                "overall_status": overall_status,
                "health_version": health_data.get("version", "v2"),
                "services": health_data.get("services", []),
                "performance": health_data.get("performance", {}),
                "cache": health_data.get("cache", {}),
                "infrastructure": health_data.get("infrastructure", {}),
                "metrics": metrics_data,
                "edge_engine": edge_stats,
                "ingestion": ingestion_stats,
                "websocket": websocket_stats,
                "model_registry": model_registry_stats,
                "anomalies": anomalies,
                "notes": notes,
                "generation_time_ms": round((time.time() - start_time) * 1000, 2),
                "include_traces": include_traces
            }
            
            # Add traces if requested
            if include_traces:
                report["traces"] = self._generate_trace_placeholder()
            
            # Cache the report
            self._report_cache = report
            self._last_report_time = current_time
            
            # Log structured reliability event
            self._log_reliability_event(report)
            
            logger.info(f"Reliability report generated in {report['generation_time_ms']}ms")
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate reliability report: {e}")
            
            # Return minimal fallback report
            return {
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
                "anomalies": [{"code": "REPORT_GENERATION_FAILED", "severity": "critical", "description": str(e)}],
                "notes": [f"Report generation failed: {str(e)[:100]}"],
                "generation_time_ms": round((time.time() - start_time) * 1000, 2),
                "include_traces": include_traces,
                "error": True
            }
    
    async def _safe_execute(self, name: str, coro) -> Any:
        """
        Safely execute a coroutine with error handling and fallback.
        
        Args:
            name: Name of the operation for logging
            coro: Coroutine to execute
            
        Returns:
            Result of coroutine execution or safe fallback
        """
        try:
            result = await coro
            return result
        except Exception as e:
            logger.warning(f"Safe execution failed for {name}: {e}")
            # Return appropriate fallback based on operation name
            if name == 'health':
                return await self._get_fallback_health_data()
            elif name == 'metrics':
                return self._get_fallback_metrics_data()
            else:
                return {}
    
    async def _collect_health_data(self) -> Dict[str, Any]:
        """Collect health data using existing health collector with raw data support."""
        try:
            # Try to get raw health data first
            if hasattr(self._health_collector, 'collect_health_raw'):
                health_raw = await self._health_collector.collect_health_raw()
                return health_raw
            else:
                # Fallback to standard health collection
                health_response = await self._health_collector.collect_health()
                return {
                    "version": health_response.version,
                    "services": [
                        {
                            "name": service.name,
                            "status": service.status,
                            "latency_ms": service.latency_ms,
                            "details": service.details
                        }
                        for service in health_response.services
                    ],
                    "performance": {
                        "cpu_percent": health_response.performance.cpu_percent,
                        "rss_mb": health_response.performance.rss_mb,
                        "event_loop_lag_ms": health_response.performance.event_loop_lag_ms,
                        "avg_request_latency_ms": health_response.performance.avg_request_latency_ms,
                        "p95_request_latency_ms": health_response.performance.p95_request_latency_ms
                    },
                    "cache": {
                        "hit_rate": health_response.cache.hit_rate,
                        "hits": health_response.cache.hits,
                        "misses": health_response.cache.misses,
                        "evictions": health_response.cache.evictions
                    },
                    "infrastructure": {
                        "uptime_sec": health_response.infrastructure.uptime_sec,
                        "python_version": health_response.infrastructure.python_version,
                        "build_commit": health_response.infrastructure.build_commit,
                        "environment": health_response.infrastructure.environment
                    }
                }
        except Exception as e:
            logger.error(f"Failed to collect health data: {e}")
            return await self._get_fallback_health_data()
    
    async def _collect_metrics_data(self) -> Dict[str, Any]:
        """Collect metrics data from unified metrics collector."""
        try:
            return self._metrics_collector.snapshot()
        except Exception as e:
            logger.error(f"Failed to collect metrics data: {e}")
            return self._get_fallback_metrics_data()
    
    async def _collect_edge_stats(self) -> Dict[str, Any]:
        """Collect edge engine statistics."""
        try:
            return await self._edge_stats_provider.get_edge_stats()
        except Exception as e:
            logger.error(f"Failed to collect edge stats: {e}")
            return {"active_edges": 0, "last_edge_created_ts": None, "edges_per_min_rate": 0.0, "error": str(e)[:50]}
    
    async def _collect_ingestion_stats(self) -> Dict[str, Any]:
        """Collect ingestion pipeline statistics."""
        try:
            return await self._ingestion_stats_provider.get_ingestion_stats()
        except Exception as e:
            logger.error(f"Failed to collect ingestion stats: {e}")
            return {"last_ingest_ts": None, "ingest_latency_ms": None, "recent_failures": 0, "error": str(e)[:50]}
    
    async def _collect_websocket_stats(self) -> Dict[str, Any]:
        """Collect WebSocket connection statistics."""
        try:
            return await self._websocket_stats_provider.get_websocket_stats()
        except Exception as e:
            logger.error(f"Failed to collect websocket stats: {e}")
            return {"active_connections": 0, "last_broadcast_ts": None, "connection_rate": 0.0, "error": str(e)[:50]}
    
    async def _collect_model_registry_stats(self) -> Dict[str, Any]:
        """Collect model registry statistics."""
        try:
            # Try to get model registry service
            try:
                from backend.services.model_registry_service import get_model_registry_service
                registry_service = get_model_registry_service()
                
                # Get model counts and default model info
                total_models = await registry_service.count_models() if hasattr(registry_service, 'count_models') else 0
                
                # Try to get active models
                if hasattr(registry_service, 'get_active_models'):
                    active_models = len(await registry_service.get_active_models())
                else:
                    active_models = total_models  # Assume all models are active
                
                # Try to get default model
                default_model = None
                if hasattr(registry_service, 'get_default_model'):
                    try:
                        default_model_info = await registry_service.get_default_model()
                        if default_model_info:
                            default_model = {
                                "id": getattr(default_model_info, 'model_id', 'unknown'),
                                "version": getattr(default_model_info, 'version', 'unknown')
                            }
                    except Exception:
                        default_model = None
                
                return {
                    "total_models": total_models,
                    "active_models": active_models,
                    "default_model": default_model
                }
                
            except ImportError:
                # Model registry service not available - return stub
                return {
                    "total_models": 0,
                    "active_models": 0,
                    "default_model": None,
                    "status": "service_unavailable"
                }
                
        except Exception as e:
            logger.error(f"Failed to collect model registry stats: {e}")
            return {"total_models": 0, "active_models": 0, "default_model": None, "error": str(e)[:50]}
    
    async def _get_fallback_health_data(self) -> Dict[str, Any]:
        """Get fallback health data when health collector fails."""
        return {
            "version": "v2",
            "services": [{"name": "system", "status": "degraded", "latency_ms": None, "details": {"error": "health_collector_unavailable"}}],
            "performance": {"cpu_percent": 0.0, "rss_mb": 0.0, "event_loop_lag_ms": 0.0, "avg_request_latency_ms": 0.0, "p95_request_latency_ms": 0.0},
            "cache": {"hit_rate": 0.0, "hits": 0, "misses": 0, "evictions": 0},
            "infrastructure": {"uptime_sec": 0.0, "python_version": "unknown", "build_commit": None, "environment": "unknown"}
        }
    
    def _get_fallback_metrics_data(self) -> Dict[str, Any]:
        """Get fallback metrics data when metrics collector fails."""
        return {
            "avg_latency_ms": 0.0,
            "p95_latency_ms": 0.0,
            "event_loop_lag_ms": 0.0,
            "total_requests": 0.0,
            "success_rate": 0.0
        }
    
    def _determine_overall_status(self, health_data: Dict[str, Any], anomalies: List[Dict[str, Any]]) -> str:
        """
        Determine overall system status considering health and anomalies.
        
        Args:
            health_data: Health data from health collector
            anomalies: List of detected anomalies
            
        Returns:
            Overall status: "ok", "degraded", or "down"
        """
        try:
            # Start with health-based status
            services = health_data.get("services", [])
            health_status = map_statuses_to_overall([
                type('ServiceStatus', (), {
                    'status': service.get('status', 'unknown')
                })() for service in services
            ])
            
            # Check anomalies for escalation
            if anomalies:
                has_critical = any(anomaly.get('severity') == 'critical' for anomaly in anomalies)
                has_warning = any(anomaly.get('severity') == 'warning' for anomaly in anomalies)
                
                if has_critical:
                    return "down"
                elif has_warning and health_status == "ok":
                    return "degraded"
            
            return health_status
            
        except Exception as e:
            logger.error(f"Failed to determine overall status: {e}")
            return "degraded"
    
    def _generate_report_notes(self, snapshot: Dict[str, Any], anomalies: List[Dict[str, Any]]) -> List[str]:
        """
        Generate contextual notes for the reliability report.
        
        Args:
            snapshot: Complete system snapshot
            anomalies: Detected anomalies
            
        Returns:
            List of operational notes
        """
        notes = []
        
        try:
            # Add notes about data collection issues
            for component, data in snapshot.items():
                if isinstance(data, dict) and "error" in data:
                    notes.append(f"{component} unavailable: {data['error']}")
            
            # Add notes about anomalies
            if anomalies:
                critical_count = sum(1 for a in anomalies if a.get('severity') == 'critical')
                warning_count = sum(1 for a in anomalies if a.get('severity') == 'warning')
                info_count = sum(1 for a in anomalies if a.get('severity') == 'info')
                
                if critical_count > 0:
                    notes.append(f"{critical_count} critical anomalies detected - immediate attention required")
                if warning_count > 0:
                    notes.append(f"{warning_count} warning-level anomalies detected")
                if info_count > 0:
                    notes.append(f"{info_count} informational anomalies detected")
            
            # Add performance notes
            performance = snapshot.get("performance", {})
            if performance.get("cpu_percent", 0) > 70:
                notes.append(f"High CPU usage: {performance.get('cpu_percent', 0):.1f}%")
            
            p95_latency = performance.get("p95_request_latency_ms", 0)
            if p95_latency > 1000:
                notes.append(f"Elevated P95 latency: {p95_latency:.1f}ms")
            
            # Add cache performance notes
            cache = snapshot.get("cache", {})
            if cache.get("hit_rate", 1.0) < 0.5 and (cache.get("hits", 0) + cache.get("misses", 0)) > 50:
                notes.append(f"Low cache hit rate: {cache.get('hit_rate', 0):.2f}")
            
        except Exception as e:
            logger.error(f"Failed to generate report notes: {e}")
            notes.append(f"Note generation partially failed: {str(e)[:50]}")
        
        return notes
    
    def _generate_trace_placeholder(self) -> List[Dict[str, Any]]:
        """
        Generate placeholder trace information for development.
        
        Returns:
            List of placeholder trace entries
        """
        # TODO: Implement actual trace collection when tracing system is available
        return [
            {
                "trace_id": "placeholder_trace_001",
                "operation": "health_data_collection",
                "duration_ms": 45.2,
                "status": "completed",
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            {
                "trace_id": "placeholder_trace_002", 
                "operation": "metrics_aggregation",
                "duration_ms": 12.8,
                "status": "completed",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    
    def _log_reliability_event(self, report: Dict[str, Any]) -> None:
        """
        Log structured reliability event for monitoring and alerting.
        
        Args:
            report: Complete reliability report
        """
        try:
            # Extract key metrics for structured logging
            event_data = {
                "overall_status": report.get("overall_status"),
                "anomaly_count": len(report.get("anomalies", [])),
                "active_edges": report.get("edge_engine", {}).get("active_edges", 0),
                "cpu_percent": report.get("performance", {}).get("cpu_percent", 0),
                "p95_request_latency_ms": report.get("performance", {}).get("p95_request_latency_ms", 0),
                "cache_hit_rate": report.get("cache", {}).get("hit_rate", 0),
                "active_connections": report.get("websocket", {}).get("active_connections", 0),
                "generation_time_ms": report.get("generation_time_ms", 0)
            }
            
            logger.info("Reliability report generated", extra={"reliability_report": event_data})
            
        except Exception as e:
            logger.error(f"Failed to log reliability event: {e}")


# Global orchestrator instance
_reliability_orchestrator: Optional[ReliabilityOrchestrator] = None


def get_reliability_orchestrator() -> ReliabilityOrchestrator:
    """Get the global reliability orchestrator instance."""
    global _reliability_orchestrator
    if _reliability_orchestrator is None:
        _reliability_orchestrator = ReliabilityOrchestrator()
    return _reliability_orchestrator