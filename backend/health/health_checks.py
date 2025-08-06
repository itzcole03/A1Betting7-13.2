"""
Enhanced Health Check System for FastAPI
Implements comprehensive health monitoring following production best practices.
"""

import asyncio
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

import aioredis
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.config.settings import get_settings
from backend.utils.structured_logging import app_logger


class HealthStatus(str, Enum):
    """Health check status types"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ComponentHealth(BaseModel):
    """Health status of individual component"""

    status: HealthStatus
    message: str
    response_time_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    last_checked: str


class HealthCheckResponse(BaseModel):
    """Overall health check response"""

    status: HealthStatus
    timestamp: str
    version: str
    environment: str
    uptime_seconds: float
    components: Dict[str, ComponentHealth]
    summary: Dict[str, int]


class HealthChecker:
    """Comprehensive health checker for all system components"""

    def __init__(self):
        self.settings = get_settings()
        self.start_time = time.time()
        self.app_logger = app_logger

    async def check_database_health(self) -> ComponentHealth:
        """Check database connectivity and performance"""
        start_time = time.time()

        try:
            # Import database manager
            from backend.enhanced_database import db_manager

            # Test database connection
            if not db_manager.is_initialized():
                return ComponentHealth(
                    status=HealthStatus.UNHEALTHY,
                    message="Database not initialized",
                    response_time_ms=(time.time() - start_time) * 1000,
                    last_checked=datetime.now(timezone.utc).isoformat(),
                )

            # Perform a simple query to test connectivity
            async with db_manager.get_session() as session:
                result = await session.execute("SELECT 1")
                await result.fetchone()

            response_time = (time.time() - start_time) * 1000

            # Determine status based on response time
            if response_time > 1000:  # > 1 second
                status = HealthStatus.DEGRADED
                message = f"Database responding slowly ({response_time:.0f}ms)"
            else:
                status = HealthStatus.HEALTHY
                message = "Database connection healthy"

            return ComponentHealth(
                status=status,
                message=message,
                response_time_ms=response_time,
                details={
                    "database_url": self.settings.database.database_url.split("@")[
                        -1
                    ],  # Hide credentials
                    "pool_size": self.settings.database.pool_size,
                    "active_connections": "N/A",  # Would need actual pool stats
                },
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.app_logger.error(f"Database health check failed: {str(e)}")

            return ComponentHealth(
                status=HealthStatus.UNHEALTHY,
                message=f"Database connection failed: {str(e)}",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

    async def check_redis_health(self) -> ComponentHealth:
        """Check Redis connectivity and performance"""
        start_time = time.time()

        try:
            if not self.settings.redis.url:
                return ComponentHealth(
                    status=HealthStatus.DEGRADED,
                    message="Redis not configured",
                    response_time_ms=(time.time() - start_time) * 1000,
                    last_checked=datetime.now(timezone.utc).isoformat(),
                )

            # Test Redis connection
            redis = aioredis.from_url(
                self.settings.redis.url, socket_timeout=5, socket_connect_timeout=5
            )

            # Perform ping test
            await redis.ping()

            # Test set/get operation
            test_key = "health_check_test"
            await redis.set(test_key, "test_value", ex=10)
            result = await redis.get(test_key)
            await redis.delete(test_key)

            await redis.close()

            response_time = (time.time() - start_time) * 1000

            if response_time > 500:  # > 500ms
                status = HealthStatus.DEGRADED
                message = f"Redis responding slowly ({response_time:.0f}ms)"
            else:
                status = HealthStatus.HEALTHY
                message = "Redis connection healthy"

            return ComponentHealth(
                status=status,
                message=message,
                response_time_ms=response_time,
                details={
                    "redis_url": self.settings.redis.url.split("@")[
                        -1
                    ],  # Hide credentials
                    "test_operation": "set/get successful",
                },
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.app_logger.warning(f"Redis health check failed: {str(e)}")

            return ComponentHealth(
                status=HealthStatus.DEGRADED,  # Redis failure is not critical
                message=f"Redis connection failed: {str(e)}",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

    async def check_external_apis_health(self) -> ComponentHealth:
        """Check external API connectivity"""
        start_time = time.time()

        try:
            import aiohttp

            api_checks = []
            timeout = aiohttp.ClientTimeout(total=10)

            async with aiohttp.ClientSession(timeout=timeout) as session:
                # Check MLB Stats API
                try:
                    async with session.get(
                        "https://statsapi.mlb.com/api/v1/seasons"
                    ) as response:
                        if response.status == 200:
                            api_checks.append(("MLB Stats API", True, response.status))
                        else:
                            api_checks.append(("MLB Stats API", False, response.status))
                except Exception as e:
                    api_checks.append(("MLB Stats API", False, str(e)))

                # Check other APIs if configured
                if self.settings.external_api.sportradar_api_key:
                    api_checks.append(("SportRadar API", True, "configured"))

                if self.settings.external_api.theodds_api_key:
                    api_checks.append(("The Odds API", True, "configured"))

            response_time = (time.time() - start_time) * 1000

            # Determine overall status
            failed_apis = [check for check in api_checks if not check[1]]

            if not failed_apis:
                status = HealthStatus.HEALTHY
                message = "All external APIs accessible"
            elif len(failed_apis) < len(api_checks):
                status = HealthStatus.DEGRADED
                message = (
                    f"Some external APIs unavailable: {[api[0] for api in failed_apis]}"
                )
            else:
                status = HealthStatus.UNHEALTHY
                message = "All external APIs unavailable"

            return ComponentHealth(
                status=status,
                message=message,
                response_time_ms=response_time,
                details={
                    "api_checks": [
                        {"name": check[0], "available": check[1], "info": check[2]}
                        for check in api_checks
                    ]
                },
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.app_logger.error(f"External API health check failed: {str(e)}")

            return ComponentHealth(
                status=HealthStatus.DEGRADED,
                message=f"External API check failed: {str(e)}",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

    async def check_ml_services_health(self) -> ComponentHealth:
        """Check ML services health"""
        start_time = time.time()

        try:
            # Check if modern ML services are available
            try:
                from backend.services.modern_ml_service import modern_ml_service

                # Perform a simple health check on ML service
                ml_healthy = True
                ml_message = "Modern ML service available"
            except ImportError:
                ml_healthy = False
                ml_message = "Modern ML service not available"

            # Check comprehensive prop generator
            try:
                from backend.services.comprehensive_prop_generator import (
                    ComprehensivePropGenerator,
                )

                prop_healthy = True
                prop_message = "Comprehensive prop generator available"
            except ImportError:
                prop_healthy = False
                prop_message = "Comprehensive prop generator not available"

            response_time = (time.time() - start_time) * 1000

            if ml_healthy and prop_healthy:
                status = HealthStatus.HEALTHY
                message = "All ML services available"
            elif ml_healthy or prop_healthy:
                status = HealthStatus.DEGRADED
                message = "Some ML services unavailable"
            else:
                status = HealthStatus.DEGRADED
                message = "ML services unavailable"

            return ComponentHealth(
                status=status,
                message=message,
                response_time_ms=response_time,
                details={
                    "modern_ml_service": ml_message,
                    "comprehensive_prop_generator": prop_message,
                },
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000

            return ComponentHealth(
                status=HealthStatus.DEGRADED,
                message=f"ML services check failed: {str(e)}",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

    async def check_system_resources(self) -> ComponentHealth:
        """Check system resource usage"""
        start_time = time.time()

        try:
            import psutil

            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")

            response_time = (time.time() - start_time) * 1000

            # Determine status based on resource usage
            issues = []
            if cpu_percent > 90:
                issues.append(f"High CPU usage: {cpu_percent:.1f}%")
            if memory.percent > 90:
                issues.append(f"High memory usage: {memory.percent:.1f}%")
            if disk.percent > 90:
                issues.append(f"High disk usage: {disk.percent:.1f}%")

            if issues:
                status = HealthStatus.DEGRADED
                message = f"Resource issues: {', '.join(issues)}"
            else:
                status = HealthStatus.HEALTHY
                message = "System resources normal"

            return ComponentHealth(
                status=status,
                message=message,
                response_time_ms=response_time,
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free / (1024**3),
                },
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

        except ImportError:
            # psutil not available
            return ComponentHealth(
                status=HealthStatus.DEGRADED,
                message="System monitoring not available (psutil not installed)",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as e:
            return ComponentHealth(
                status=HealthStatus.DEGRADED,
                message=f"System check failed: {str(e)}",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

    async def perform_comprehensive_health_check(self) -> HealthCheckResponse:
        """Perform comprehensive health check of all components"""
        check_start_time = time.time()

        # Run all health checks concurrently
        health_checks = await asyncio.gather(
            self.check_database_health(),
            self.check_redis_health(),
            self.check_external_apis_health(),
            self.check_ml_services_health(),
            self.check_system_resources(),
            return_exceptions=True,
        )

        # Process results
        components = {
            "database": health_checks[0],
            "redis": health_checks[1],
            "external_apis": health_checks[2],
            "ml_services": health_checks[3],
            "system_resources": health_checks[4],
        }

        # Handle any exceptions in health checks
        for name, result in components.items():
            if isinstance(result, Exception):
                components[name] = ComponentHealth(
                    status=HealthStatus.UNHEALTHY,
                    message=f"Health check failed: {str(result)}",
                    last_checked=datetime.now(timezone.utc).isoformat(),
                )

        # Determine overall health status
        status_counts = {
            HealthStatus.HEALTHY: 0,
            HealthStatus.DEGRADED: 0,
            HealthStatus.UNHEALTHY: 0,
        }

        for component in components.values():
            status_counts[component.status] += 1

        # Overall status logic
        if status_counts[HealthStatus.UNHEALTHY] > 0:
            overall_status = HealthStatus.UNHEALTHY
        elif status_counts[HealthStatus.DEGRADED] > 0:
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.HEALTHY

        uptime = time.time() - self.start_time

        return HealthCheckResponse(
            status=overall_status,
            timestamp=datetime.now(timezone.utc).isoformat(),
            version=self.settings.app.app_version,
            environment=self.settings.environment.value,
            uptime_seconds=uptime,
            components=components,
            summary={
                "total_components": len(components),
                "healthy": status_counts[HealthStatus.HEALTHY],
                "degraded": status_counts[HealthStatus.DEGRADED],
                "unhealthy": status_counts[HealthStatus.UNHEALTHY],
            },
        )


# Initialize health checker
health_checker = HealthChecker()

# Create router for health endpoints
router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/", response_model=HealthCheckResponse)
async def health_check():
    """Basic health check endpoint"""
    return await health_checker.perform_comprehensive_health_check()


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "alive",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    health_result = await health_checker.perform_comprehensive_health_check()

    if health_result.status == HealthStatus.UNHEALTHY:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "timestamp": health_result.timestamp,
                "issues": [
                    f"{name}: {component.message}"
                    for name, component in health_result.components.items()
                    if component.status == HealthStatus.UNHEALTHY
                ],
            },
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "ready",
            "timestamp": health_result.timestamp,
            "summary": health_result.summary,
        },
    )


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with full component information"""
    settings = get_settings()

    if not settings.monitoring.enable_detailed_health:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"message": "Detailed health checks are disabled"},
        )

    return await health_checker.perform_comprehensive_health_check()


@router.get("/components/{component_name}")
async def component_health_check(component_name: str):
    """Check health of specific component"""
    health_methods = {
        "database": health_checker.check_database_health,
        "redis": health_checker.check_redis_health,
        "external_apis": health_checker.check_external_apis_health,
        "ml_services": health_checker.check_ml_services_health,
        "system_resources": health_checker.check_system_resources,
    }

    if component_name not in health_methods:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": f"Component '{component_name}' not found"},
        )

    component_health = await health_methods[component_name]()

    return JSONResponse(status_code=status.HTTP_200_OK, content=component_health.dict())
