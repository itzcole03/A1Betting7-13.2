"""
Legacy Meta Endpoints

Provides API endpoints for legacy endpoint usage telemetry and migration
readiness assessment. Part of the /api/v2/meta/* endpoint family for
operational observability.

Endpoints:
- GET /api/v2/meta/legacy-usage: Comprehensive usage statistics
- GET /api/v2/meta/migration-readiness: Migration readiness score and recommendations
"""

from typing import Dict, Any, Optional
import logging

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from backend.services.legacy_registry import get_legacy_registry

logger = logging.getLogger(__name__)
router = APIRouter()


class LegacyEndpointInfo(BaseModel):
    """Information about a single legacy endpoint"""
    path: str = Field(..., description="Legacy endpoint path")
    count: int = Field(..., description="Number of times accessed")
    forward: Optional[str] = Field(None, description="Modern replacement endpoint")
    last_access_ts: Optional[float] = Field(None, description="Last access timestamp (Unix)")
    last_access_iso: Optional[str] = Field(None, description="Last access in ISO format")


class LegacyUsageResponse(BaseModel):
    """Response model for legacy usage data"""
    enabled: bool = Field(..., description="Whether legacy endpoints are enabled")
    endpoints: list[LegacyEndpointInfo] = Field(..., description="List of legacy endpoints")
    total: int = Field(..., description="Total number of legacy endpoint calls")
    first_recorded_ts: float = Field(..., description="First recorded timestamp (Unix)")
    first_recorded_iso: str = Field(..., description="First recorded in ISO format")
    since_seconds: int = Field(..., description="Seconds since first recording")
    sunset_date: Optional[str] = Field(None, description="Configured sunset date (ISO)")


class MigrationAnalysis(BaseModel):
    """Migration readiness analysis"""
    high_usage_endpoints: list[Dict[str, Any]] = Field(..., description="Endpoints with high usage")
    recommendations: list[str] = Field(..., description="Migration recommendations")


class MigrationReadinessResponse(BaseModel):
    """Response model for migration readiness assessment"""
    score: float = Field(..., description="Migration readiness score (0.0-1.0)")
    readiness_level: str = Field(..., description="Overall readiness level")
    total_calls_last_24h: int = Field(..., description="Total calls in last 24 hours")
    usage_rate_per_hour: float = Field(..., description="Average usage rate per hour")
    threshold_per_hour: int = Field(..., description="High usage threshold per hour")
    analysis: MigrationAnalysis = Field(..., description="Detailed analysis")


@router.get("/legacy-usage", response_model=LegacyUsageResponse, 
           tags=["Legacy Telemetry"])
async def get_legacy_usage():
    """
    Get comprehensive legacy endpoint usage statistics.
    
    Returns detailed telemetry for all registered legacy endpoints including:
    - Usage counts per endpoint
    - Last access timestamps  
    - Forward mapping to modern equivalents
    - Overall usage summary
    
    Used by monitoring dashboards and migration planning tools.
    """
    try:
        registry = get_legacy_registry()
        usage_data = registry.get_usage_data()
        
        # Convert to Pydantic models for validation
        endpoints = [
            LegacyEndpointInfo(
                path=endpoint["path"],
                count=endpoint["count"], 
                forward=endpoint["forward"],
                last_access_ts=endpoint["last_access_ts"],
                last_access_iso=endpoint["last_access_iso"]
            )
            for endpoint in usage_data["endpoints"]
        ]
        
        response = LegacyUsageResponse(
            enabled=usage_data["enabled"],
            endpoints=endpoints,
            total=usage_data["total"],
            first_recorded_ts=usage_data["first_recorded_ts"],
            first_recorded_iso=usage_data["first_recorded_iso"], 
            since_seconds=usage_data["since_seconds"],
            sunset_date=usage_data["sunset_date"]
        )
        
        logger.info(f"Legacy usage data requested: {len(endpoints)} endpoints, {usage_data['total']} total calls")
        return response
        
    except Exception as e:
        logger.error(f"Failed to get legacy usage data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve legacy usage data: {str(e)}")


@router.get("/migration-readiness", response_model=MigrationReadinessResponse,
           tags=["Legacy Telemetry"])  
async def get_migration_readiness(
    threshold: int = Query(50, ge=1, le=1000, description="High usage threshold (calls per hour)")
):
    """
    Assess migration readiness based on legacy endpoint usage patterns.
    
    Parameters:
    - threshold: Calls per hour threshold for considering high usage
    
    Returns migration readiness score (0.0-1.0) with:
    - 1.0 = Ready for migration (low usage)
    - 0.5 = Proceed with caution (moderate usage) 
    - 0.0 = Not ready (high usage)
    
    Includes detailed analysis and recommendations for migration planning.
    """
    try:
        registry = get_legacy_registry()
        readiness_data = registry.get_migration_readiness(threshold=threshold)
        
        # Convert analysis data to Pydantic model
        analysis = MigrationAnalysis(
            high_usage_endpoints=readiness_data["analysis"]["high_usage_endpoints"],
            recommendations=readiness_data["analysis"]["recommendations"]
        )
        
        response = MigrationReadinessResponse(
            score=readiness_data["score"],
            readiness_level=readiness_data["readiness_level"],
            total_calls_last_24h=readiness_data["total_calls_last_24h"],
            usage_rate_per_hour=readiness_data["usage_rate_per_hour"],
            threshold_per_hour=threshold,
            analysis=analysis
        )
        
        logger.info(f"Migration readiness assessed: score={response.score}, level={response.readiness_level}")
        return response
        
    except Exception as e:
        logger.error(f"Failed to assess migration readiness: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assess migration readiness: {str(e)}")


@router.get("/legacy-config", tags=["Legacy Telemetry"])
async def get_legacy_config():
    """
    Get current legacy endpoint configuration and settings.
    
    Returns environment configuration affecting legacy endpoint behavior:
    - Feature flags
    - Sunset dates
    - Threshold settings
    
    Used for operational verification and troubleshooting.
    """
    try:
        registry = get_legacy_registry()
        
        config = {
            "enabled": registry.is_enabled(),
            "sunset_date": registry.get_sunset_date(),
            "environment": {
                "A1_LEGACY_ENABLED": registry._enabled,
                "A1_LEGACY_SUNSET": registry._sunset_date
            },
            "registered_endpoints": len(registry._data),
            "start_time_iso": registry._start_time
        }
        
        logger.debug("Legacy configuration requested")
        return config
        
    except Exception as e:
        logger.error(f"Failed to get legacy configuration: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get legacy configuration: {str(e)}")


# For debugging/testing - clear usage data
@router.delete("/legacy-usage", tags=["Legacy Telemetry", "Testing"])
async def clear_legacy_usage():
    """
    Clear all legacy endpoint usage data.
    
    ⚠️ **WARNING**: This endpoint clears all usage statistics and should only
    be used for testing purposes. In production, this could disrupt migration
    planning and monitoring.
    
    Returns confirmation of data clearing.
    """
    try:
        registry = get_legacy_registry()
        registry.clear_usage_data()
        
        logger.warning("Legacy usage data cleared (should only be used for testing)")
        return {
            "message": "Legacy usage data cleared successfully",
            "warning": "This action cannot be undone and should only be used for testing"
        }
        
    except Exception as e:
        logger.error(f"Failed to clear legacy usage data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear legacy usage data: {str(e)}")