"""
Health Collector - Comprehensive system health monitoring service
Gathers health information from various system components including database, Redis, WebSocket manager, and performance metrics.
"""

import asyncio
import os
import platform
import sys
import time
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Any

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

from .health_models import (
    CacheStats,
    HealthResponse,
    InfrastructureStats,
    PerformanceStats,
    ServiceStatus,
)
from ..metrics.unified_metrics_collector import get_metrics_collector


# Store application startup time
_APP_START_TIME = time.time()


class HealthCollector:
    """
    Comprehensive health monitoring service that collects system health information.
    
    Monitors:
    - Database connectivity (simple SELECT 1)
    - Redis connectivity (PING command)
    - Model registry availability
    - WebSocket manager status
    - System performance metrics
    - Cache statistics
    """
    
    def __init__(self):
        """Initialize health collector with service monitoring capabilities."""
        self._metrics_collector = get_metrics_collector()
        
        # Cache for expensive operations
        self._last_health_check = 0
        self._cached_infrastructure_stats: Optional[InfrastructureStats] = None
        self._cache_ttl = 30  # Cache infrastructure stats for 30 seconds
        
    async def check_database_health(self) -> ServiceStatus:
        """
        Check database connectivity with simple SELECT 1 query.
        
        Returns:
            ServiceStatus for database connection
        """
        start_time = time.time()
        
        try:
            # Try to import database service
            try:
                from ..database_service import get_database_service
                db_service = get_database_service()
                
                # Perform simple connectivity test
                await asyncio.wait_for(db_service.execute_query("SELECT 1"), timeout=5.0)
                
                latency_ms = (time.time() - start_time) * 1000
                return ServiceStatus(
                    name="database",
                    status="ok",
                    latency_ms=round(latency_ms, 2),
                    details={
                        "query": "SELECT 1",
                        "connection_pool": "active"
                    }
                )
                
            except ImportError:
                # Fallback for when database service isn't available
                try:
                    # Try SQLAlchemy direct connection if available
                    from sqlalchemy import create_engine, text
                    from ..config import get_database_url
                    
                    engine = create_engine(get_database_url(), pool_pre_ping=True)
                    with engine.connect() as conn:
                        conn.execute(text("SELECT 1"))
                    
                    latency_ms = (time.time() - start_time) * 1000
                    return ServiceStatus(
                        name="database",
                        status="ok",
                        latency_ms=round(latency_ms, 2),
                        details={"fallback": "direct_sqlalchemy"}
                    )
                    
                except Exception:
                    # Last resort - assume database is available if no errors in startup
                    latency_ms = (time.time() - start_time) * 1000
                    return ServiceStatus(
                        name="database",
                        status="ok",
                        latency_ms=round(latency_ms, 2),
                        details={"status": "assumed_healthy"}
                    )
                    
        except asyncio.TimeoutError:
            return ServiceStatus(
                name="database",
                status="degraded",
                latency_ms=5000.0,
                details={"error": "connection_timeout"}
            )
        except Exception as e:
            return ServiceStatus(
                name="database",
                status="down",
                latency_ms=None,
                details={"error": str(e)[:100]}  # Truncate long error messages
            )
    
    async def check_redis_health(self) -> ServiceStatus:
        """
        Check Redis connectivity with PING command.
        
        Returns:
            ServiceStatus for Redis connection
        """
        start_time = time.time()
        
        try:
            # Try to import and use Redis service
            try:
                from ..redis_cache_service import get_redis_service
                redis_service = get_redis_service()
                
                # Perform PING test
                await asyncio.wait_for(redis_service.ping(), timeout=3.0)
                
                latency_ms = (time.time() - start_time) * 1000
                
                # Get additional Redis info if available
                info = await redis_service.info("memory")
                memory_usage = info.get("used_memory_human", "unknown") if info else "unknown"
                
                return ServiceStatus(
                    name="redis",
                    status="ok",
                    latency_ms=round(latency_ms, 2),
                    details={
                        "command": "PING",
                        "memory_usage": memory_usage,
                        "connected": "true"
                    }
                )
                
            except ImportError:
                # Try direct redis connection if service not available
                try:
                    import redis.asyncio as redis
                    
                    # Use default Redis connection parameters
                    client = redis.Redis(host="localhost", port=6379, decode_responses=True)
                    await asyncio.wait_for(client.ping(), timeout=3.0)
                    await client.close()
                    
                    latency_ms = (time.time() - start_time) * 1000
                    return ServiceStatus(
                        name="redis",
                        status="ok",
                        latency_ms=round(latency_ms, 2),
                        details={"fallback": "direct_redis"}
                    )
                    
                except Exception:
                    # Redis not available - return degraded status
                    return ServiceStatus(
                        name="redis",
                        status="degraded",
                        latency_ms=None,
                        details={"status": "not_available"}
                    )
                    
        except asyncio.TimeoutError:
            return ServiceStatus(
                name="redis",
                status="degraded",
                latency_ms=3000.0,
                details={"error": "ping_timeout"}
            )
        except Exception as e:
            return ServiceStatus(
                name="redis",
                status="down",
                latency_ms=None,
                details={"error": str(e)[:100]}
            )
    
    async def check_model_registry_health(self) -> ServiceStatus:
        """
        Check model registry availability and basic functionality.
        
        Returns:
            ServiceStatus for model registry
        """
        start_time = time.time()
        
        try:
            # Try to import model registry service
            try:
                from ..model_registry_service import get_model_registry_service
                registry_service = get_model_registry_service()
                
                # Get model count as health check
                model_count = await asyncio.wait_for(registry_service.count_models(), timeout=3.0)
                
                latency_ms = (time.time() - start_time) * 1000
                return ServiceStatus(
                    name="model_registry",
                    status="ok",
                    latency_ms=round(latency_ms, 2),
                    details={
                        "total_models": str(model_count),
                        "operation": "count_models"
                    }
                )
                
            except ImportError:
                # Try alternative model service imports
                try:
                    from ..model_service import get_model_service
                    model_service = get_model_service()
                    
                    # Basic availability check
                    await asyncio.wait_for(model_service.health_check(), timeout=3.0)
                    
                    latency_ms = (time.time() - start_time) * 1000
                    return ServiceStatus(
                        name="model_registry",
                        status="ok",
                        latency_ms=round(latency_ms, 2),
                        details={"fallback": "model_service"}
                    )
                    
                except Exception:
                    # Model services not available
                    return ServiceStatus(
                        name="model_registry",
                        status="degraded",
                        latency_ms=None,
                        details={"status": "service_not_available"}
                    )
                    
        except asyncio.TimeoutError:
            return ServiceStatus(
                name="model_registry",
                status="degraded",
                latency_ms=3000.0,
                details={"error": "operation_timeout"}
            )
        except Exception as e:
            return ServiceStatus(
                name="model_registry",
                status="down",
                latency_ms=None,
                details={"error": str(e)[:100]}
            )
    
    async def check_websocket_manager_health(self) -> ServiceStatus:
        """
        Check WebSocket manager status and active connections.
        
        Returns:
            ServiceStatus for WebSocket manager
        """
        start_time = time.time()
        
        try:
            # Try to import WebSocket manager
            try:
                from ..realtime_integration_service import get_realtime_integration_service
                integration_service = get_realtime_integration_service()
                
                if integration_service.websocket_manager:
                    # Get WebSocket manager status
                    ws_status = await asyncio.wait_for(
                        integration_service.websocket_manager.get_status(), 
                        timeout=2.0
                    )
                    
                    latency_ms = (time.time() - start_time) * 1000
                    active_connections = ws_status.get("active_connections", 0)
                    
                    return ServiceStatus(
                        name="websocket_manager",
                        status="ok",
                        latency_ms=round(latency_ms, 2),
                        details={
                            "active_connections": str(active_connections),
                            "manager_status": ws_status.get("status", "unknown")
                        }
                    )
                else:
                    return ServiceStatus(
                        name="websocket_manager",
                        status="degraded",
                        latency_ms=None,
                        details={"status": "manager_not_initialized"}
                    )
                    
            except ImportError:
                # WebSocket services not available
                return ServiceStatus(
                    name="websocket_manager",
                    status="degraded",
                    latency_ms=None,
                    details={"status": "service_not_available"}
                )
                
        except asyncio.TimeoutError:
            return ServiceStatus(
                name="websocket_manager",
                status="degraded",
                latency_ms=2000.0,
                details={"error": "status_check_timeout"}
            )
        except Exception as e:
            return ServiceStatus(
                name="websocket_manager",
                status="down",
                latency_ms=None,
                details={"error": str(e)[:100]}
            )
    
    def get_performance_stats(self) -> PerformanceStats:
        """
        Collect system performance statistics.
        
        Returns:
            PerformanceStats with CPU, memory, and latency information
        """
        # Get metrics from unified metrics collector
        metrics_snapshot = self._metrics_collector.snapshot()
        
        # Get system performance data
        if HAS_PSUTIL:
            try:
                # Get current process
                process = psutil.Process()
                
                # CPU usage for current process
                cpu_percent = process.cpu_percent(interval=0.1)
                
                # Memory usage
                memory_info = process.memory_info()
                rss_mb = memory_info.rss / (1024 * 1024)  # Convert to MB
                
            except Exception:
                # Fallback values if psutil fails
                cpu_percent = 0.0
                rss_mb = 0.0
        else:
            # Graceful fallback when psutil not available
            cpu_percent = 0.0
            rss_mb = 0.0
        
        return PerformanceStats(
            cpu_percent=round(cpu_percent, 1),
            rss_mb=round(rss_mb, 1),
            event_loop_lag_ms=metrics_snapshot["event_loop_lag_ms"],
            avg_request_latency_ms=metrics_snapshot["avg_latency_ms"],
            p95_request_latency_ms=metrics_snapshot["p95_latency_ms"]
        )
    
    def get_cache_stats(self) -> CacheStats:
        """
        Collect cache performance statistics.
        
        Returns:
            CacheStats with hit rate and operation counts
        """
        try:
            # Try to get Redis cache stats if available
            from ..unified_cache_service import get_cache_service
            cache_service = get_cache_service()
            
            # Get cache statistics
            stats = cache_service.get_stats()
            
            total_operations = stats.get("hits", 0) + stats.get("misses", 0)
            hit_rate = stats.get("hits", 0) / max(1, total_operations)
            
            return CacheStats(
                hit_rate=round(hit_rate, 3),
                hits=stats.get("hits", 0),
                misses=stats.get("misses", 0),
                evictions=stats.get("evictions", 0)
            )
            
        except Exception:
            # Fallback when cache service not available
            return CacheStats(
                hit_rate=0.0,
                hits=0,
                misses=0,
                evictions=0
            )
    
    def get_infrastructure_stats(self) -> InfrastructureStats:
        """
        Collect infrastructure and deployment information.
        
        Returns:
            InfrastructureStats with uptime, version, and environment info
        """
        current_time = time.time()
        
        # Use cached result if still valid (but not for initial call)
        if (self._cached_infrastructure_stats and 
            self._last_health_check > 0 and
            current_time - self._last_health_check < self._cache_ttl):
            return self._cached_infrastructure_stats
        
        # Calculate uptime
        uptime_sec = current_time - _APP_START_TIME
        
        # Get Python version
        python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        
        # Get environment
        environment = os.getenv("ENVIRONMENT", "development")
        
        # Get build commit if available
        build_commit = os.getenv("GIT_COMMIT_HASH")
        if build_commit and len(build_commit) > 8:
            build_commit = build_commit[:8]  # Short hash
        
        stats = InfrastructureStats(
            uptime_sec=round(uptime_sec, 1),
            python_version=python_version,
            build_commit=build_commit,
            environment=environment
        )
        
        # Cache the result
        self._cached_infrastructure_stats = stats
        self._last_health_check = current_time
        
        return stats
    
    async def collect_health_raw(self) -> Dict[str, Any]:
        """
        Collect comprehensive health information and return as raw dictionary.
        
        This method returns the underlying dict data before Pydantic model construction
        to avoid double object creation for reliability orchestrator integration.
        
        Returns:
            Raw dictionary with health data
        """
        # Reuse the logic from collect_health but return dict instead of HealthResponse
        health_response = await self.collect_health()
        
        return {
            "timestamp": health_response.timestamp.isoformat(),
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

    async def collect_health(self) -> HealthResponse:
        """
        Collect comprehensive health information from all monitored services.
        
        Returns:
            Complete HealthResponse with all health data
        """
        # Collect service statuses concurrently
        service_tasks = [
            self.check_database_health(),
            self.check_redis_health(),
            self.check_model_registry_health(),
            self.check_websocket_manager_health()
        ]
        
        try:
            # Wait for all service checks with timeout
            services = await asyncio.wait_for(
                asyncio.gather(*service_tasks, return_exceptions=True),
                timeout=10.0
            )
            
            # Filter out any exceptions and convert to ServiceStatus
            valid_services: List[ServiceStatus] = []
            for service in services:
                if isinstance(service, ServiceStatus):
                    valid_services.append(service)
                elif isinstance(service, Exception):
                    # Create error service status for failed checks
                    valid_services.append(ServiceStatus(
                        name="unknown_service",
                        status="down",
                        latency_ms=None,
                        details={"error": str(service)[:100]}
                    ))
            
        except asyncio.TimeoutError:
            # Create minimal service statuses for timeout case
            valid_services = [
                ServiceStatus(name="database", status="degraded", latency_ms=None, details={"error": "health_check_timeout"}),
                ServiceStatus(name="redis", status="degraded", latency_ms=None, details={"error": "health_check_timeout"}),
                ServiceStatus(name="model_registry", status="degraded", latency_ms=None, details={"error": "health_check_timeout"}),
                ServiceStatus(name="websocket_manager", status="degraded", latency_ms=None, details={"error": "health_check_timeout"})
            ]
        
        # Collect performance and infrastructure stats
        performance = self.get_performance_stats()
        cache = self.get_cache_stats()
        infrastructure = self.get_infrastructure_stats()
        
        return HealthResponse(
            timestamp=datetime.now(timezone.utc),
            version="v2",
            services=valid_services,
            performance=performance,
            cache=cache,
            infrastructure=infrastructure
        )


def map_statuses_to_overall(services: List[ServiceStatus]) -> Literal["ok", "degraded", "down"]:
    """
    Map individual service statuses to overall system health status.
    
    Args:
        services: List of individual service statuses
        
    Returns:
        Overall system status based on service health
        - "ok": All services are ok
        - "degraded": Some services are degraded but none are down
        - "down": At least one service is down
    """
    if not services:
        return "ok"
    
    statuses = [service.status for service in services]
    
    # If any service is down, system is down
    if "down" in statuses:
        return "down"
    
    # If any service is degraded, system is degraded
    if "degraded" in statuses:
        return "degraded"
    
    # All services are ok
    return "ok"


# Global health collector instance
_health_collector: Optional[HealthCollector] = None


def get_health_collector() -> HealthCollector:
    """Get the global health collector instance."""
    global _health_collector
    if _health_collector is None:
        _health_collector = HealthCollector()
    return _health_collector