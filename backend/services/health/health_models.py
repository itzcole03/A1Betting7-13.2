"""
Health Models - Pydantic models for comprehensive health diagnostics
Defines standardized models for service status, performance metrics, cache statistics, and infrastructure information.
"""

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


class ServiceStatus(BaseModel):
    """Individual service health status model"""
    
    name: str = Field(..., description="Service name identifier")
    status: Literal["ok", "degraded", "down"] = Field(..., description="Current service status")
    latency_ms: Optional[float] = Field(None, description="Service response latency in milliseconds", ge=0)
    details: Dict[str, str] = Field(default_factory=dict, description="Additional service-specific details")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "database",
            "status": "ok",
            "latency_ms": 15.3,
            "details": {
                "connection_pool_size": "10",
                "active_connections": "3"
            }
        }
    })


class PerformanceStats(BaseModel):
    """System performance statistics model"""
    
    cpu_percent: float = Field(..., description="CPU utilization percentage", ge=0, le=100)
    rss_mb: float = Field(..., description="Resident Set Size (RSS) memory in MB", ge=0)
    event_loop_lag_ms: float = Field(..., description="Event loop lag in milliseconds", ge=0)
    avg_request_latency_ms: float = Field(..., description="Average request latency in milliseconds", ge=0)
    p95_request_latency_ms: float = Field(..., description="95th percentile request latency in milliseconds", ge=0)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "cpu_percent": 23.5,
            "rss_mb": 156.8,
            "event_loop_lag_ms": 2.1,
            "avg_request_latency_ms": 45.2,
            "p95_request_latency_ms": 125.7
        }
    })


class CacheStats(BaseModel):
    """Cache performance statistics model"""
    
    hit_rate: float = Field(..., description="Cache hit rate as decimal (0.0-1.0)", ge=0, le=1)
    hits: int = Field(..., description="Total cache hits", ge=0)
    misses: int = Field(..., description="Total cache misses", ge=0)
    evictions: int = Field(..., description="Total cache evictions", ge=0)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "hit_rate": 0.85,
            "hits": 1247,
            "misses": 203,
            "evictions": 15
        }
    })


class InfrastructureStats(BaseModel):
    """Infrastructure and deployment statistics model"""
    
    uptime_sec: float = Field(..., description="System uptime in seconds", ge=0)
    python_version: str = Field(..., description="Python version string")
    build_commit: Optional[str] = Field(None, description="Git commit hash of current build")
    environment: str = Field(..., description="Deployment environment (development, staging, production)")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "uptime_sec": 3600.5,
            "python_version": "3.12.5",
            "build_commit": "abc123de",
            "environment": "production"
        }
    })


class HealthResponse(BaseModel):
    """Complete health status response model"""
    
    timestamp: datetime = Field(..., description="Response timestamp")
    version: str = Field("v2", description="Health API version")
    services: List[ServiceStatus] = Field(..., description="Status of individual services")
    performance: PerformanceStats = Field(..., description="System performance metrics")
    cache: CacheStats = Field(..., description="Cache performance statistics")
    infrastructure: InfrastructureStats = Field(..., description="Infrastructure and deployment information")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "timestamp": "2025-08-17T12:00:00Z",
            "version": "v2",
            "services": [
                {
                    "name": "database",
                    "status": "ok",
                    "latency_ms": 15.3,
                    "details": {"connection_pool_size": "10", "active_connections": "3"}
                },
                {
                    "name": "redis",
                    "status": "ok",
                    "latency_ms": 2.1,
                    "details": {"connected": "true", "memory_usage": "45MB"}
                }
            ],
            "performance": {
                "cpu_percent": 23.5,
                "rss_mb": 156.8,
                "event_loop_lag_ms": 2.1,
                "avg_request_latency_ms": 45.2,
                "p95_request_latency_ms": 125.7
            },
            "cache": {
                "hit_rate": 0.85,
                "hits": 1247,
                "misses": 203,
                "evictions": 15
            },
            "infrastructure": {
                "uptime_sec": 3600.5,
                "python_version": "3.12.5",
                "build_commit": "abc123de",
                "environment": "production"
            }
        }
    })