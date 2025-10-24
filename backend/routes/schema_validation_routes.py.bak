"""
Enhanced Schema Validation API Routes

Provides REST API endpoints for accessing schema validation results,
provider statistics, and validation trends.

Features:
- Real-time validation statistics
- Provider performance monitoring  
- Validation trend analysis
- Historical validation data
- Provider quality scoring
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from ..services.enhanced_schema_validation import (
    ValidationLevel,
    ValidationCategory, 
    ValidationWarning,
    ValidationResult,
    get_enhanced_schema_validator
)

logger = logging.getLogger("schema_validation_routes")

router = APIRouter(prefix="/api/odds/validation", tags=["Schema Validation"])


# Pydantic response models
class ValidationWarningResponse(BaseModel):
    level: str
    category: str
    field: str
    message: str
    actual_value: Any
    expected_value: Optional[Any] = None
    provider: Optional[str] = None
    suggestion: Optional[str] = None
    timestamp: float


class ValidationResultResponse(BaseModel):
    is_valid: bool
    has_critical_errors: bool
    has_warnings: bool
    warning_count: int
    warnings: List[ValidationWarningResponse]
    validation_summary: Dict[str, Any]
    provider: str
    timestamp: float
    processed_data_available: bool


class ProviderStatisticsResponse(BaseModel):
    provider: str
    total_validations: int
    success_rate: float
    critical_error_rate: float
    warning_rate: float
    average_validation_time_ms: float
    data_quality_score: float
    last_validation: Optional[float] = None
    common_issues: Dict[str, int]


class ValidationTrendsResponse(BaseModel):
    time_period_hours: int
    total_validations: int
    success_rate: float
    warning_rate: float
    error_rate: float
    average_validation_time_ms: float
    provider_breakdown: Dict[str, Dict[str, int]]
    trend_status: str


class ValidationTestRequest(BaseModel):
    raw_data: Dict[str, Any]
    provider: str
    context: Optional[Dict[str, Any]] = None


@router.post("/test", response_model=ValidationResultResponse)
async def test_validation(request: ValidationTestRequest):
    """
    Test validation on provided raw odds data.
    
    Useful for testing validation rules and seeing what warnings
    would be generated for specific data.
    """
    try:
        validator = get_enhanced_schema_validator()
        
        result = validator.validate_aggregated_odds(
            raw_data=request.raw_data,
            provider=request.provider,
            context=request.context
        )
        
        # Convert to response format
        warnings_response = [
            ValidationWarningResponse(
                level=w.level.value,
                category=w.category.value,
                field=w.field,
                message=w.message,
                actual_value=w.actual_value,
                expected_value=w.expected_value,
                provider=w.provider,
                suggestion=w.suggestion,
                timestamp=w.timestamp
            )
            for w in result.warnings
        ]
        
        return ValidationResultResponse(
            is_valid=result.is_valid,
            has_critical_errors=result.has_critical_errors,
            has_warnings=result.has_warnings,
            warning_count=len(result.warnings),
            warnings=warnings_response,
            validation_summary=result.validation_summary,
            provider=result.provider,
            timestamp=result.timestamp,
            processed_data_available=result.processed_data is not None
        )
        
    except Exception as e:
        logger.error(f"Validation test error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Validation test failed: {str(e)}"
        )


@router.get("/statistics", response_model=Dict[str, Any])
async def get_validation_statistics(
    provider: Optional[str] = Query(None, description="Specific provider to get statistics for")
):
    """
    Get validation statistics for provider(s).
    
    Without provider parameter, returns summary for all providers.
    With provider parameter, returns detailed statistics for that provider.
    """
    try:
        validator = get_enhanced_schema_validator()
        stats = validator.get_provider_statistics(provider)
        
        if "error" in stats:
            raise HTTPException(status_code=404, detail=stats["error"])
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting validation statistics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get validation statistics: {str(e)}"
        )


@router.get("/statistics/{provider}", response_model=ProviderStatisticsResponse)
async def get_provider_statistics(provider: str):
    """Get detailed validation statistics for a specific provider."""
    try:
        validator = get_enhanced_schema_validator()
        stats = validator.get_provider_statistics(provider)
        
        if "error" in stats:
            raise HTTPException(status_code=404, detail=stats["error"])
        
        return ProviderStatisticsResponse(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting provider statistics for {provider}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics for provider {provider}: {str(e)}"
        )


@router.get("/trends", response_model=ValidationTrendsResponse)
async def get_validation_trends(
    hours_back: int = Query(24, ge=1, le=168, description="Hours to look back (1-168)")
):
    """
    Get validation trends over time.
    
    Shows validation success rates, error rates, and performance trends
    over the specified time period.
    """
    try:
        validator = get_enhanced_schema_validator()
        trends = validator.get_validation_trends(hours_back)
        
        if "message" in trends:
            # No data available
            return ValidationTrendsResponse(
                time_period_hours=hours_back,
                total_validations=0,
                success_rate=0.0,
                warning_rate=0.0,
                error_rate=0.0,
                average_validation_time_ms=0.0,
                provider_breakdown={},
                trend_status="no_data"
            )
        
        return ValidationTrendsResponse(**trends)
        
    except Exception as e:
        logger.error(f"Error getting validation trends: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get validation trends: {str(e)}"
        )


@router.get("/health", response_model=Dict[str, Any])
async def get_validation_health():
    """
    Get overall health status of the validation system.
    
    Returns system health, recent performance, and any issues.
    """
    try:
        validator = get_enhanced_schema_validator()
        
        # Get recent trends for health assessment
        recent_trends = validator.get_validation_trends(hours_back=1)
        all_stats = validator.get_provider_statistics()
        
        # Determine health status
        if "message" in recent_trends:
            health_status = "no_data"
            health_score = 0.0
        else:
            success_rate = recent_trends.get("success_rate", 0.0)
            if success_rate >= 0.95:
                health_status = "excellent"
                health_score = 1.0
            elif success_rate >= 0.85:
                health_status = "good" 
                health_score = 0.8
            elif success_rate >= 0.70:
                health_status = "warning"
                health_score = 0.6
            else:
                health_status = "critical"
                health_score = 0.3
        
        return {
            "service": "Enhanced Schema Validation",
            "status": health_status,
            "health_score": health_score,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recent_performance": recent_trends,
            "system_summary": all_stats.get("system_summary", {}),
            "features": {
                "multi_level_validation": True,
                "categorized_warnings": True,
                "provider_statistics": True,
                "historical_tracking": True,
                "automatic_sanitization": True,
                "trend_analysis": True
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting validation health: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get validation health: {str(e)}"
        )


@router.get("/providers", response_model=List[str])
async def get_monitored_providers():
    """Get list of providers currently being monitored by validation system."""
    try:
        validator = get_enhanced_schema_validator()
        stats = validator.get_provider_statistics()
        
        if "all_providers" in stats:
            return list(stats["all_providers"].keys())
        else:
            return []
            
    except Exception as e:
        logger.error(f"Error getting monitored providers: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get monitored providers: {str(e)}"
        )


@router.get("/validation-rules", response_model=Dict[str, Any])
async def get_validation_rules():
    """
    Get the current validation rules and configuration.
    
    Useful for understanding what validations are being performed
    and their thresholds.
    """
    try:
        validator = get_enhanced_schema_validator()
        
        return {
            "validation_levels": [level.value for level in ValidationLevel],
            "validation_categories": [cat.value for cat in ValidationCategory],
            "validation_config": validator.validation_config,
            "features": {
                "schema_structure_validation": "Validates required fields and data types",
                "data_range_validation": "Validates odds and line ranges",
                "data_consistency_validation": "Validates internal data consistency",
                "provider_specific_validation": "Provider-specific rules and expectations",
                "temporal_validation": "Validates data freshness and timestamps",
                "business_logic_validation": "Validates business rules and market consistency"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting validation rules: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get validation rules: {str(e)}"
        )


@router.post("/validate-raw", response_model=ValidationResultResponse)
async def validate_raw_data(request: ValidationTestRequest):
    """
    Validate raw odds data and return detailed results.
    
    This is the main validation endpoint used by the odds aggregation system.
    """
    try:
        validator = get_enhanced_schema_validator()
        
        result = validator.validate_aggregated_odds(
            raw_data=request.raw_data,
            provider=request.provider,
            context=request.context
        )
        
        # Convert warnings to response format
        warnings_response = [
            ValidationWarningResponse(
                level=w.level.value,
                category=w.category.value,
                field=w.field,
                message=w.message,
                actual_value=w.actual_value,
                expected_value=w.expected_value,
                provider=w.provider,
                suggestion=w.suggestion,
                timestamp=w.timestamp
            )
            for w in result.warnings
        ]
        
        return ValidationResultResponse(
            is_valid=result.is_valid,
            has_critical_errors=result.has_critical_errors,
            has_warnings=result.has_warnings,
            warning_count=len(result.warnings),
            warnings=warnings_response,
            validation_summary=result.validation_summary,
            provider=result.provider,
            timestamp=result.timestamp,
            processed_data_available=result.processed_data is not None
        )
        
    except Exception as e:
        logger.error(f"Raw data validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Raw data validation failed: {str(e)}"
        )


# Integration endpoint for the existing odds aggregation service
@router.get("/integration-status", response_model=Dict[str, Any])
async def get_integration_status():
    """
    Get status of schema validation integration with odds aggregation system.
    
    Shows how validation is integrated with existing provider resilience
    and odds normalization systems.
    """
    try:
        validator = get_enhanced_schema_validator()
        
        # Check integration points
        has_provider_stats = len(validator.provider_stats) > 0
        has_recent_validations = len(validator.recent_validations) > 0
        
        return {
            "integration_status": "active" if has_provider_stats else "inactive",
            "provider_monitoring": {
                "active": has_provider_stats,
                "provider_count": len(validator.provider_stats),
                "providers": list(validator.provider_stats.keys())
            },
            "validation_history": {
                "active": has_recent_validations,
                "recent_count": len(validator.recent_validations),
                "max_history": validator.recent_validations.maxlen
            },
            "features_enabled": {
                "enhanced_validation": True,
                "provider_statistics": True,
                "trend_analysis": True,
                "automatic_sanitization": True,
                "integration_with_resilience_manager": True
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting integration status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get integration status: {str(e)}"
        )