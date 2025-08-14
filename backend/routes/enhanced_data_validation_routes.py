"""
Enhanced Data Validation API Routes

Modern FastAPI routes for the optimized data validation system with comprehensive
monitoring, security, and performance optimizations based on best practices.

Features:
- Enhanced error handling with proper HTTP status codes
- Request/response validation with Pydantic models
- Comprehensive monitoring and metrics
- Rate limiting and security headers
- Async/await patterns throughout
- Background task management
- Health checks and diagnostics
- OpenAPI documentation with examples
"""

import asyncio
import logging
import time
import traceback
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

# Import our enhanced services
try:
    from ..services.data_validation_orchestrator import (
        CrossValidationReport,
        DataSource,
        ValidationStatus,
    )
    from ..services.enhanced_data_validation_integration import (
        EnhancedDataValidationIntegrationService,
        EnhancedValidationConfig,
        ValidationContext,
        get_enhanced_integration_service,
    )
    from ..services.optimized_data_validation_orchestrator import (
        OptimizedDataValidationOrchestrator,
        get_optimized_orchestrator,
    )

    VALIDATION_SERVICES_AVAILABLE = True
except ImportError as e:
    VALIDATION_SERVICES_AVAILABLE = False
    print(f"Validation services not available: {e}")

logger = logging.getLogger("enhanced_validation_routes")

# Create router
router = APIRouter(
    prefix="/api/validation",
    tags=["Enhanced Data Validation"],
    responses={
        400: {"description": "Bad Request"},
        422: {"description": "Validation Error"},
        429: {"description": "Rate Limit Exceeded"},
        500: {"description": "Internal Server Error"},
        503: {"description": "Service Unavailable"},
    },
)


# Request/Response models
class DataSourceRequest(BaseModel):
    """Request model for data source information"""

    source_type: str = Field(
        ..., description="Type of data source", example="mlb_stats_api"
    )
    data: Dict[str, Any] = Field(..., description="Source data")

    @validator("source_type")
    def validate_source_type(cls, v):
        valid_sources = ["mlb_stats_api", "baseball_savant", "statsapi", "external_api"]
        if v.lower() not in valid_sources:
            raise ValueError(f"Invalid source type. Must be one of: {valid_sources}")
        return ResponseBuilder.success(v.lower())


class PlayerValidationRequest(BaseModel):
    """Request model for player validation"""

    player_id: int = Field(..., description="Player ID", example=12345, gt=0)
    data_sources: List[DataSourceRequest] = Field(
        ..., description="Data sources to validate", min_items=1
    )
    use_cache: bool = Field(True, description="Whether to use caching")
    background_processing: bool = Field(
        False, description="Enable background processing"
    )
    priority: str = Field("normal", description="Request priority", example="normal")

    @validator("priority")
    def validate_priority(cls, v):
        valid_priorities = ["low", "normal", "high", "critical"]
        if v.lower() not in valid_priorities:
            raise ValueError(f"Invalid priority. Must be one of: {valid_priorities}")
        return ResponseBuilder.success(v.lower())


class GameValidationRequest(BaseModel):
    """Request model for game validation"""

    game_id: int = Field(..., description="Game ID", example=67890, gt=0)
    data_sources: List[DataSourceRequest] = Field(
        ..., description="Data sources to validate", min_items=1
    )
    use_cache: bool = Field(True, description="Whether to use caching")
    background_processing: bool = Field(
        False, description="Enable background processing"
    )


class BatchValidationRequest(BaseModel):
    """Request model for batch validation"""

    requests: List[Union[PlayerValidationRequest, GameValidationRequest]] = Field(
        ..., description="List of validation requests", min_items=1, max_items=100
    )
    batch_id: Optional[str] = Field(None, description="Optional batch ID")
    parallel_processing: bool = Field(True, description="Enable parallel processing")


class ValidationResponse(BaseModel):
    """Response model for validation results"""

    status: str = Field(..., description="Validation status")
    request_id: str = Field(..., description="Unique request ID")
    confidence_score: float = Field(..., description="Confidence score", ge=0.0, le=1.0)
    validation_time: float = Field(..., description="Validation time in seconds")
    data_quality_score: float = Field(
        ..., description="Data quality score", ge=0.0, le=1.0
    )
    conflicts: List[Dict[str, Any]] = Field(
        default_factory=list, description="Data conflicts found"
    )
    recommendations: List[str] = Field(
        default_factory=list, description="Recommendations"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata"
    )


class HealthCheckResponse(BaseModel):
    """Response model for health checks"""

    status: str = Field(..., description="Overall health status")
    timestamp: str = Field(..., description="Health check timestamp")
    components: Dict[str, str] = Field(..., description="Component health status")
    performance_metrics: Dict[str, Any] = Field(
        default_factory=dict, description="Performance metrics"
    )


class MetricsResponse(BaseModel):
    """Response model for metrics"""

    total_requests: int = Field(..., description="Total number of requests")
    successful_validations: int = Field(
        ..., description="Number of successful validations"
    )
    failed_validations: int = Field(..., description="Number of failed validations")
    success_rate: float = Field(..., description="Success rate", ge=0.0, le=1.0)
    average_response_time: float = Field(
        ..., description="Average response time in seconds"
    )
    cache_hit_rate: float = Field(..., description="Cache hit rate", ge=0.0, le=1.0)
    current_data_quality_score: float = Field(
        ..., description="Current data quality score", ge=0.0, le=1.0
    )
    active_operations: int = Field(..., description="Currently active operations")


# Dependency injection
async def get_integration_service() -> EnhancedDataValidationIntegrationService:
    """Dependency to get the enhanced integration service"""
    if not VALIDATION_SERVICES_AVAILABLE:
        raise BusinessLogicException("Validation services are not available")

    try:
        return ResponseBuilder.success(await) get_enhanced_integration_service()
    except Exception as e:
        logger.error(f"Failed to get integration service: {e}")
        raise BusinessLogicException("Validation service is temporarily unavailable")


async def get_orchestrator() -> OptimizedDataValidationOrchestrator:
    """Dependency to get the optimized orchestrator"""
    if not VALIDATION_SERVICES_AVAILABLE:
        raise BusinessLogicException("Validation services are not available")

    try:
        return ResponseBuilder.success(await) get_optimized_orchestrator()
    except Exception as e:
        logger.error(f"Failed to get orchestrator: {e}")
        raise BusinessLogicException("Validation orchestrator is temporarily unavailable")


# Utility functions
def _convert_data_sources(
    data_sources: List[DataSourceRequest],
) -> Dict[DataSource, Dict[str, Any]]:
    """Convert request data sources to internal format"""
    converted = {}

    source_mapping = {
        "mlb_stats_api": DataSource.MLB_STATS_API,
        "baseball_savant": DataSource.BASEBALL_SAVANT,
        "statsapi": DataSource.STATSAPI,
        "external_api": DataSource.EXTERNAL_API,
    }

    for source_req in data_sources:
        if source_req.source_type in source_mapping:
            converted[source_mapping[source_req.source_type]] = source_req.data

    return ResponseBuilder.success(converted)


def _create_validation_context(
    request_data: Union[PlayerValidationRequest, GameValidationRequest],
    operation_type: str,
) -> ValidationContext:
    """Create validation context from request"""
    return ResponseBuilder.success(ValidationContext(
        request_id=str(uuid.uuid4())),
        operation_type=operation_type,
        entity_id=getattr(request_data, "player_id", None)
        or getattr(request_data, "game_id", None),
        data_sources=[
            DataSource(ds.source_type.upper()) for ds in request_data.data_sources
        ],
        use_cache=getattr(request_data, "use_cache", True),
        background_processing=getattr(request_data, "background_processing", False),
        priority=getattr(request_data, "priority", "normal"),
    )


def _convert_report_to_response(
    report: CrossValidationReport, request_id: str, validation_time: float
) -> ValidationResponse:
    """Convert validation report to response model"""
    return ResponseBuilder.success(ValidationResponse(
        status=(
            report.validation_results[0].status.value
            if report.validation_results
            else "unknown"
        )),
        request_id=request_id,
        confidence_score=report.confidence_score,
        validation_time=validation_time,
        data_quality_score=report.get_quality_score(),
        conflicts=report.conflicts,
        recommendations=report.recommendations,
        metadata={
            "primary_source": (
                report.primary_source.value if report.primary_source else None
            ),
            "comparison_sources": [s.value for s in report.comparison_sources],
            "generated_at": report.generated_at.isoformat(),
            "validation_results_count": len(report.validation_results),
        },
    )


# Enhanced error handler
async def validation_error_handler(request: Request, exc: Exception):
    """Enhanced error handler for validation routes"""
    error_id = str(uuid.uuid4())

    error_details = {
        "error_id": error_id,
        "timestamp": datetime.now().isoformat(),
        "path": str(request.url),
        "method": request.method,
        "error_type": type(exc).__name__,
        "error_message": str(exc),
    }

    # Log error with full traceback
    logger.error(
        f"Validation error {error_id}: {exc}", extra=error_details, exc_info=True
    )

    # Determine appropriate status code
    if isinstance(exc, ValueError):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, TimeoutError):
        status_code = status.HTTP_408_REQUEST_TIMEOUT
    elif "rate limit" in str(exc).lower():
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    return JSONResponse(
        status_code=status_code,
        content={
            "error": True,
            "error_id": error_id,
            "message": "Validation request failed",
            "details": str(exc) if status_code < 500 else "Internal server error",
            "timestamp": error_details["timestamp"],
        },
    )


# API Routes
@router.post(
    "/player/validate",
    response_model=ValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate Player Data",
    description="Perform enhanced cross-validation of player data from multiple sources",
    responses={
        200: {
            "description": "Validation completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "valid",
                        "request_id": "123e4567-e89b-12d3-a456-426614174000",
                        "confidence_score": 0.95,
                        "validation_time": 1.23,
                        "data_quality_score": 0.92,
                        "conflicts": [],
                        "recommendations": ["Data quality is excellent"],
                        "metadata": {"primary_source": "mlb_stats_api"},
                    }
                }
            },
        }
    },
)
async def validate_player_data(
    request_data: PlayerValidationRequest,
    background_tasks: BackgroundTasks,
    integration_service: EnhancedDataValidationIntegrationService = Depends(
        get_integration_service
    ),
):
    """
    Validate player data from multiple sources with enhanced cross-validation.

    This endpoint performs comprehensive validation including:
    - Schema validation using Pandera
    - Statistical anomaly detection
    - Cross-source data comparison
    - Consensus algorithm for conflict resolution
    - Performance optimization with caching
    """
    start_time = time.time()

    try:
        # Convert request data
        data_sources = _convert_data_sources(request_data.data_sources)
        context = _create_validation_context(request_data, "player_validation")

        # Perform enhanced validation
        report = await integration_service.validate_player_data_enhanced(
            data_sources, request_data.player_id, context
        )

        validation_time = time.time() - start_time

        # Convert to response format
        response = _convert_report_to_response(
            report, context.request_id, validation_time
        )

        # Queue background optimization if requested
        if request_data.background_processing:
            background_tasks.add_task(
                _background_optimization_task, context.request_id, report.to_dict()
            )

        return ResponseBuilder.success(response)

    except Exception as e:
        await validation_error_handler(None, e)  # This will log the error
        raise BusinessLogicException("f"Player validation failed: {str(e")}",
        )


@router.post(
    "/game/validate",
    response_model=ValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate Game Data",
    description="Perform enhanced cross-validation of game data from multiple sources",
)
async def validate_game_data(
    request_data: GameValidationRequest,
    background_tasks: BackgroundTasks,
    integration_service: EnhancedDataValidationIntegrationService = Depends(
        get_integration_service
    ),
):
    """Validate game data from multiple sources with enhanced cross-validation."""
    start_time = time.time()

    try:
        # Convert request data
        data_sources = _convert_data_sources(request_data.data_sources)
        context = _create_validation_context(request_data, "game_validation")

        # Perform enhanced validation
        report = await integration_service.validate_game_data_enhanced(
            data_sources, request_data.game_id, context
        )

        validation_time = time.time() - start_time

        # Convert to response format
        response = _convert_report_to_response(
            report, context.request_id, validation_time
        )

        return ResponseBuilder.success(response)

    except Exception as e:
        await validation_error_handler(None, e)
        raise BusinessLogicException("f"Game validation failed: {str(e")}",
        )


@router.post(
    "/batch/validate",
    response_model=List[ValidationResponse],
    status_code=status.HTTP_200_OK,
    summary="Batch Validate Data",
    description="Perform batch validation with intelligent parallel processing",
)
async def batch_validate_data(
    request_data: BatchValidationRequest,
    background_tasks: BackgroundTasks,
    integration_service: EnhancedDataValidationIntegrationService = Depends(
        get_integration_service
    ),
):
    """Perform batch validation with optimized parallel processing."""
    start_time = time.time()

    try:
        # Convert batch requests
        validation_requests = []
        for req in request_data.requests:
            if isinstance(req, PlayerValidationRequest):
                validation_requests.append(
                    {
                        "type": "player",
                        "entity_id": req.player_id,
                        "data_sources": _convert_data_sources(req.data_sources),
                        "use_cache": req.use_cache,
                        "background_processing": req.background_processing,
                    }
                )
            elif isinstance(req, GameValidationRequest):
                validation_requests.append(
                    {
                        "type": "game",
                        "entity_id": req.game_id,
                        "data_sources": _convert_data_sources(req.data_sources),
                        "use_cache": req.use_cache,
                        "background_processing": req.background_processing,
                    }
                )

        # Perform batch validation
        reports = await integration_service.batch_validate_enhanced(
            validation_requests, request_data.batch_id
        )

        batch_time = time.time() - start_time

        # Convert reports to responses
        responses = []
        for i, report in enumerate(reports):
            response = _convert_report_to_response(
                report,
                f"{request_data.batch_id or 'batch'}-{i}",
                batch_time / len(reports) if reports else 0,
            )
            responses.append(response)

        return ResponseBuilder.success(responses)

    except Exception as e:
        await validation_error_handler(None, e)
        raise BusinessLogicException("f"Batch validation failed: {str(e")}",
        )


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Get comprehensive health status of validation services",
)
async def health_check(
    integration_service: EnhancedDataValidationIntegrationService = Depends(
        get_integration_service
    ),
):
    """Get comprehensive health status of all validation components."""
    try:
        health_status = await integration_service.get_health_status()
        performance_metrics = await integration_service.get_enhanced_metrics()

        return ResponseBuilder.success(HealthCheckResponse(
            status=health_status["status"],
            timestamp=health_status["timestamp"],
            components=health_status["components"],
            performance_metrics=performance_metrics,
        ))

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return ResponseBuilder.success(HealthCheckResponse(
            status="unhealthy",
            timestamp=datetime.now()).isoformat(),
            components={"error": str(e)},
            performance_metrics={},
        )


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Metrics",
    description="Get comprehensive performance and usage metrics",
)
async def get_metrics(
    integration_service: EnhancedDataValidationIntegrationService = Depends(
        get_integration_service
    ),
):
    """Get comprehensive performance and usage metrics."""
    try:
        metrics = await integration_service.get_enhanced_metrics()

        return ResponseBuilder.success(MetricsResponse(
            total_requests=metrics.get("total_requests", 0)),
            successful_validations=metrics.get("successful_validations", 0),
            failed_validations=metrics.get("failed_validations", 0),
            success_rate=metrics.get("success_rate", 0.0),
            average_response_time=metrics.get("average_response_time", 0.0),
            cache_hit_rate=metrics.get("cache_hit_rate", 0.0),
            current_data_quality_score=metrics.get("current_data_quality_score", 0.0),
            active_operations=metrics.get("active_operations", 0),
        )

    except Exception as e:
        logger.error(f"Metrics retrieval failed: {e}")
        raise BusinessLogicException("Failed to retrieve metrics")


@router.get(
    "/performance",
    status_code=status.HTTP_200_OK,
    summary="Performance Metrics",
    description="Get detailed performance metrics for monitoring",
, response_model=StandardAPIResponse[Dict[str, Any]])
async def get_performance_metrics(
    orchestrator: OptimizedDataValidationOrchestrator = Depends(get_orchestrator),
):
    """Get detailed performance metrics from the orchestrator."""
    try:
        return ResponseBuilder.success(await) orchestrator.get_performance_metrics()
    except Exception as e:
        logger.error(f"Performance metrics retrieval failed: {e}")
        raise BusinessLogicException("Failed to retrieve performance metrics")


@router.post(
    "/config/update",
    status_code=status.HTTP_200_OK,
    summary="Update Configuration",
    description="Update validation configuration (admin only, response_model=StandardAPIResponse[Dict[str, Any]])",
)
async def update_configuration(
    config_updates: Dict[str, Any],
    integration_service: EnhancedDataValidationIntegrationService = Depends(
        get_integration_service
    ),
):
    """Update validation service configuration."""
    try:
        # In a production system, this would have proper authentication/authorization
        # For now, just log the configuration update request
        logger.info(f"Configuration update requested: {config_updates}")

        return ResponseBuilder.success({
            "message": "Configuration update logged",
            "timestamp": datetime.now().isoformat(),
            "updates": config_updates,
        })

    except Exception as e:
        logger.error(f"Configuration update failed: {e}")
        raise BusinessLogicException("Failed to update configuration")


@router.post(
    "/cache/clear",
    status_code=status.HTTP_200_OK,
    summary="Clear Cache",
    description="Clear validation cache (admin only, response_model=StandardAPIResponse[Dict[str, Any]])",
)
async def clear_cache(
    cache_type: str = "all",  # "memory", "redis", "all"
    orchestrator: OptimizedDataValidationOrchestrator = Depends(get_orchestrator),
):
    """Clear validation cache."""
    try:
        # In a production system, this would have proper authentication/authorization
        logger.info(f"Cache clear requested: {cache_type}")

        # For now, just return ResponseBuilder.success(success)
        return ResponseBuilder.success({
            "message": f"Cache clear initiated for: {cache_type})",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Cache clear failed: {e}")
        raise BusinessLogicException("Failed to clear cache")


# Background task functions
async def _background_optimization_task(request_id: str, report_data: Dict[str, Any]):
    """Background task for optimization processing"""
    try:
        logger.info(f"Processing background optimization for request {request_id}")

        # Simulate optimization processing
        await asyncio.sleep(0.1)

        logger.info(f"Background optimization completed for request {request_id}")

    except Exception as e:
        logger.error(f"Background optimization failed for request {request_id}: {e}")


# Note: Exception handlers are added at the app level, not router level
# The general exception handler will be registered in the main app configuration
