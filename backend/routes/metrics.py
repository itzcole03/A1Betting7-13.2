"""Performance metrics endpoints."""

from typing import Dict

from fastapi import APIRouter
from pydantic import BaseModel

from backend.utils.metrics_collector import metrics_collector

router = APIRouter()


class EndpointStats(BaseModel):
    """Endpoint statistics model"""

    total_requests: int
    avg_duration: float
    p95_duration: float
    error_rate: float
    cache_hit_rate: float


class ModelStats(BaseModel):
    """Model usage statistics model"""

    uses: int
    usage_rate: float


class SystemStats(BaseModel):
    """Overall system statistics model"""

    total_requests: int
    error_rate: float
    cache_hit_rate: float
    avg_response_time: float


@router.get("/stats/system", response_model=SystemStats)
async def get_system_stats() -> Dict[str, float]:
    """Get overall system statistics"""
    return metrics_collector.get_overall_stats()


@router.get("/stats/endpoint/{endpoint}", response_model=EndpointStats)
async def get_endpoint_stats(endpoint: str) -> Dict[str, float]:
    """Get statistics for a specific endpoint"""
    return metrics_collector.get_endpoint_stats(endpoint)


@router.get("/stats/models")
async def get_model_stats() -> Dict[str, Dict[str, float]]:
    """Get model usage statistics"""
    return metrics_collector.get_model_stats()


@router.get("/stats/endpoints")
async def get_all_endpoint_stats() -> Dict[str, Dict[str, float]]:
    """Get statistics for all endpoints"""
    stats = {}
    for endpoint in metrics_collector.total_requests.keys():
        stats[endpoint] = metrics_collector.get_endpoint_stats(endpoint)
    return stats
