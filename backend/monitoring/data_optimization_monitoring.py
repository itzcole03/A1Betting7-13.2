"""
Enhanced Data Optimization Monitoring and Metrics
Provides comprehensive monitoring for the new data optimization features
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("propollama")

# Monitoring router
monitoring_router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


class ServiceMetrics(BaseModel):
    """Individual service metrics model"""

    service_name: str
    status: str
    uptime_seconds: float
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time_ms: float
    last_error: Optional[str] = None
    last_error_time: Optional[datetime] = None


class DataOptimizationMetrics(BaseModel):
    """Comprehensive data optimization metrics"""

    timestamp: datetime
    intelligent_cache: ServiceMetrics
    enhanced_pipeline: ServiceMetrics
    data_sources: Dict[str, ServiceMetrics]
    performance_summary: Dict[str, Any]


class MonitoringService:
    """Enhanced monitoring service for data optimization components"""

    def __init__(self):
        self.start_time = time.time()
        self.metrics_history: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []

    async def get_intelligent_cache_metrics(self) -> ServiceMetrics:
        """Get metrics from intelligent cache service"""
        try:
            from backend.services.intelligent_cache_service import (
                intelligent_cache_service,
            )

            stats = await intelligent_cache_service.get_stats()

            return ServiceMetrics(
                service_name="Intelligent Cache",
                status="healthy" if stats.get("cache_hits", 0) > 0 else "idle",
                uptime_seconds=time.time() - self.start_time,
                total_requests=stats.get("total_requests", 0),
                successful_requests=stats.get("cache_hits", 0)
                + stats.get("cache_misses", 0),
                failed_requests=stats.get("cache_errors", 0),
                average_response_time_ms=stats.get("avg_response_time", 0),
                last_error=stats.get("last_error"),
                last_error_time=stats.get("last_error_time"),
            )
        except Exception as e:
            logger.error(f"Failed to get intelligent cache metrics: {e}")
            return ServiceMetrics(
                service_name="Intelligent Cache",
                status="error",
                uptime_seconds=0,
                total_requests=0,
                successful_requests=0,
                failed_requests=1,
                average_response_time_ms=0,
                last_error=str(e),
                last_error_time=datetime.now(),
            )

    async def get_enhanced_pipeline_metrics(self) -> ServiceMetrics:
        """Get metrics from enhanced data pipeline"""
        try:
            from backend.services.enhanced_data_pipeline import enhanced_data_pipeline

            stats = await enhanced_data_pipeline.get_stats()

            return ServiceMetrics(
                service_name="Enhanced Data Pipeline",
                status=(
                    "healthy"
                    if stats.get("circuit_breaker_state") == "closed"
                    else "degraded"
                ),
                uptime_seconds=time.time() - self.start_time,
                total_requests=stats.get("total_requests", 0),
                successful_requests=stats.get("successful_requests", 0),
                failed_requests=stats.get("failed_requests", 0),
                average_response_time_ms=stats.get("avg_response_time", 0),
                last_error=stats.get("last_error"),
                last_error_time=stats.get("last_error_time"),
            )
        except Exception as e:
            logger.error(f"Failed to get enhanced pipeline metrics: {e}")
            return ServiceMetrics(
                service_name="Enhanced Data Pipeline",
                status="error",
                uptime_seconds=0,
                total_requests=0,
                successful_requests=0,
                failed_requests=1,
                average_response_time_ms=0,
                last_error=str(e),
                last_error_time=datetime.now(),
            )

    async def get_data_source_metrics(self) -> Dict[str, ServiceMetrics]:
        """Get metrics from data sources"""
        data_sources = {}

        # MLB provider metrics
        try:
            from backend.services.mlb_provider_client import MLBProviderClient

            provider = MLBProviderClient()

            # Get basic stats - this would need to be implemented in the provider
            data_sources["MLB_Provider"] = ServiceMetrics(
                service_name="MLB Provider",
                status="healthy",  # Could be determined by recent successful calls
                uptime_seconds=time.time() - self.start_time,
                total_requests=0,  # Would come from provider stats
                successful_requests=0,
                failed_requests=0,
                average_response_time_ms=0,
            )
        except Exception as e:
            logger.error(f"Failed to get MLB provider metrics: {e}")
            data_sources["MLB_Provider"] = ServiceMetrics(
                service_name="MLB Provider",
                status="error",
                uptime_seconds=0,
                total_requests=0,
                successful_requests=0,
                failed_requests=1,
                average_response_time_ms=0,
                last_error=str(e),
                last_error_time=datetime.now(),
            )

        return data_sources

    async def get_performance_summary(self) -> Dict[str, Any]:
        """Get overall performance summary"""
        try:
            # Collect various performance metrics
            cache_metrics = await self.get_intelligent_cache_metrics()
            pipeline_metrics = await self.get_enhanced_pipeline_metrics()

            # Calculate overall health score
            total_requests = (
                cache_metrics.total_requests + pipeline_metrics.total_requests
            )
            total_errors = (
                cache_metrics.failed_requests + pipeline_metrics.failed_requests
            )

            error_rate = (
                (total_errors / total_requests * 100) if total_requests > 0 else 0
            )

            health_score = max(0, 100 - error_rate)

            return {
                "overall_health_score": health_score,
                "total_requests_last_hour": total_requests,
                "error_rate_percent": error_rate,
                "average_response_time_ms": (
                    cache_metrics.average_response_time_ms
                    + pipeline_metrics.average_response_time_ms
                )
                / 2,
                "cache_hit_rate_percent": 0,  # Would be calculated from cache metrics
                "data_freshness_score": 100,  # Would be calculated based on data age
                "recommendation": self._get_performance_recommendation(
                    health_score, error_rate
                ),
            }
        except Exception as e:
            logger.error(f"Failed to calculate performance summary: {e}")
            return {
                "overall_health_score": 0,
                "error": str(e),
                "recommendation": "Check service health - metrics collection failed",
            }

    def _get_performance_recommendation(
        self, health_score: float, error_rate: float
    ) -> str:
        """Generate performance recommendations"""
        if health_score >= 95:
            return "System performing optimally"
        elif health_score >= 80:
            return "System performing well with minor optimizations possible"
        elif health_score >= 60:
            return "System performance degraded - investigate error patterns"
        else:
            return "Critical performance issues - immediate attention required"

    async def collect_metrics(self) -> DataOptimizationMetrics:
        """Collect comprehensive metrics from all services"""
        try:
            cache_metrics = await self.get_intelligent_cache_metrics()
            pipeline_metrics = await self.get_enhanced_pipeline_metrics()
            data_source_metrics = await self.get_data_source_metrics()
            performance_summary = await self.get_performance_summary()

            metrics = DataOptimizationMetrics(
                timestamp=datetime.now(),
                intelligent_cache=cache_metrics,
                enhanced_pipeline=pipeline_metrics,
                data_sources=data_source_metrics,
                performance_summary=performance_summary,
            )

            # Store in history (keep last 100 entries)
            self.metrics_history.append(metrics.dict())
            if len(self.metrics_history) > 100:
                self.metrics_history.pop(0)

            return metrics

        except Exception as e:
            logger.error(f"Failed to collect metrics: {e}")
            raise HTTPException(
                status_code=500, detail=f"Metrics collection failed: {e}"
            )


# Global monitoring service instance
monitoring_service = MonitoringService()


@monitoring_router.get("/data-optimization", response_model=DataOptimizationMetrics)
async def get_data_optimization_metrics():
    """Get comprehensive data optimization metrics"""
    return await monitoring_service.collect_metrics()


@monitoring_router.get("/health")
async def get_health_check():
    """Quick health check for monitoring systems"""
    try:
        metrics = await monitoring_service.collect_metrics()
        health_score = metrics.performance_summary.get("overall_health_score", 0)

        return {
            "status": (
                "healthy"
                if health_score >= 80
                else "degraded" if health_score >= 50 else "unhealthy"
            ),
            "health_score": health_score,
            "timestamp": datetime.now(),
            "services": {
                "intelligent_cache": metrics.intelligent_cache.status,
                "enhanced_pipeline": metrics.enhanced_pipeline.status,
            },
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "error", "error": str(e), "timestamp": datetime.now()}


@monitoring_router.get("/metrics/history")
async def get_metrics_history(hours: int = 1):
    """Get historical metrics for the specified time period"""
    try:
        cutoff_time = datetime.now() - timedelta(hours=hours)

        # Filter metrics history by time
        recent_metrics = [
            metric
            for metric in monitoring_service.metrics_history
            if datetime.fromisoformat(
                metric["timestamp"].replace("T", " ").replace("Z", "")
            )
            > cutoff_time
        ]

        return {
            "period_hours": hours,
            "total_data_points": len(recent_metrics),
            "metrics": recent_metrics,
        }
    except Exception as e:
        logger.error(f"Failed to get metrics history: {e}")
        raise HTTPException(
            status_code=500, detail=f"Metrics history retrieval failed: {e}"
        )


@monitoring_router.get("/performance/recommendations")
async def get_performance_recommendations():
    """Get performance optimization recommendations"""
    try:
        metrics = await monitoring_service.collect_metrics()

        recommendations = []

        # Cache optimization recommendations
        if metrics.intelligent_cache.status != "healthy":
            recommendations.append(
                {
                    "category": "cache",
                    "priority": "high",
                    "title": "Cache Performance Issue",
                    "description": "Intelligent cache service is not operating optimally",
                    "action": "Check Redis connection and cache configuration",
                }
            )

        # Pipeline optimization recommendations
        if metrics.enhanced_pipeline.status != "healthy":
            recommendations.append(
                {
                    "category": "pipeline",
                    "priority": "high",
                    "title": "Data Pipeline Issue",
                    "description": "Enhanced data pipeline is experiencing problems",
                    "action": "Check circuit breaker status and data source connectivity",
                }
            )

        # Performance-based recommendations
        health_score = metrics.performance_summary.get("overall_health_score", 0)
        if health_score < 80:
            recommendations.append(
                {
                    "category": "performance",
                    "priority": "medium",
                    "title": "Performance Optimization Needed",
                    "description": f"Overall health score is {health_score}%",
                    "action": "Review error rates and response times for optimization opportunities",
                }
            )

        return {
            "timestamp": datetime.now(),
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
        }

    except Exception as e:
        logger.error(f"Failed to generate recommendations: {e}")
        raise HTTPException(
            status_code=500, detail=f"Recommendations generation failed: {e}"
        )
