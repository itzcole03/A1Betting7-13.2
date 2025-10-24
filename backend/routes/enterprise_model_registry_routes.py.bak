"""
Enterprise Model Registry Routes - Advanced ML Model Management
Provides enhanced model registry with performance monitoring, validation, and feature flags
Complements existing model_registry_routes.py with enterprise features
"""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import logging

from fastapi import APIRouter, HTTPException, Query, Path, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from backend.services.model_registry_service import (
        get_model_registry_service,
        ModelStatus,
        ModelType,
        ModelPerformanceMetrics
    )
    from backend.services.model_validation_harness import get_validation_harness
    MODEL_REGISTRY_AVAILABLE = True
    
    # Use imported types
    ServiceModelStatus = ModelStatus
    ServiceModelType = ModelType
    
except ImportError:
    MODEL_REGISTRY_AVAILABLE = False
    get_model_registry_service = None
    get_validation_harness = None
    ModelStatus = None
    ModelType = None
    
    # Create fallback enums
    from enum import Enum
    
    class ServiceModelStatus(Enum):
        DEVELOPMENT = "development"
        CANARY = "canary"
        STABLE = "stable"
        DEPRECATED = "deprecated"
        RETIRED = "retired"
    
    class ServiceModelType(Enum):
        TRANSFORMER = "transformer"
        ENSEMBLE = "ensemble"
        TRADITIONAL_ML = "traditional_ml"

try:
    from backend.feature_flags import FeatureFlags, UserContext
    FEATURE_FLAGS_AVAILABLE = True
except ImportError:
    FEATURE_FLAGS_AVAILABLE = False
    FeatureFlags = None

try:
    from backend.middleware.caching_middleware import ETagger
    CACHING_AVAILABLE = True
except ImportError:
    CACHING_AVAILABLE = False
    ETagger = None

from backend.core.response_models import ResponseBuilder, StandardAPIResponse
from backend.core.exceptions import BusinessLogicException


logger = logging.getLogger(__name__)


# Pydantic models for Enterprise API
class EnterpriseModelRegistrationRequest(BaseModel):
    name: str = Field(..., description="Model name")
    version: str = Field(..., description="Model version")
    model_type: str = Field(..., description="Model architecture type")
    description: str = Field(..., description="Model description")
    sport: str = Field(..., description="Sport this model is designed for")
    deployment_target: str = Field(default="production", description="Deployment target environment")
    resource_requirements: Dict[str, Any] = Field(default_factory=dict, description="Resource requirements")
    dependencies: List[str] = Field(default_factory=list, description="Model dependencies")
    retention_days: int = Field(default=90, description="Model retention period in days")
    feature_flag_id: Optional[str] = Field(default=None, description="Associated feature flag ID")
    rollout_percentage: float = Field(default=0.0, ge=0.0, le=100.0, description="Rollout percentage")


class ModelUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="Updated model name")
    description: Optional[str] = Field(default=None, description="Updated model description")
    status: Optional[str] = Field(default=None, description="Updated model status")
    rollout_percentage: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Updated rollout percentage")
    retention_days: Optional[int] = Field(default=None, description="Updated retention period")


class EnterpriseModelResponse(BaseModel):
    model_id: str
    name: str
    version: str
    model_type: str
    status: str
    description: str
    sport: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    deployment_target: str
    feature_flag_id: Optional[str]
    rollout_percentage: float
    retention_days: int


class PerformanceMetricsResponse(BaseModel):
    model_id: str
    total_inferences: int
    successful_inferences: int
    failed_inferences: int
    success_rate: float
    average_timing_ms: float
    min_timing_ms: float
    max_timing_ms: float
    percentiles: Dict[str, float]
    error_types: Dict[str, int]
    last_updated: datetime


class ValidationRequest(BaseModel):
    model_id: str
    test_case_ids: Optional[List[str]] = Field(default=None, description="Specific test cases to run")


class ModelHealthResponse(BaseModel):
    model_id: str
    name: str
    version: str
    status: str
    health_status: str
    total_inferences: int
    success_rate: float
    average_timing_ms: float
    percentiles: Dict[str, float]
    error_types: Dict[str, int]
    last_updated: datetime


class FeatureFlagRequest(BaseModel):
    model_id: str
    flag_name: str
    description: str
    rollout_percentage: float = Field(ge=0.0, le=100.0)
    target_user_groups: List[str] = Field(default_factory=list)


# Create enterprise router
enterprise_router = APIRouter(prefix="/api/models/enterprise", tags=["Enterprise Model Registry"])


# Dependency functions
def get_registry():
    """Get model registry service with fallback"""
    if MODEL_REGISTRY_AVAILABLE:
        return get_model_registry_service()
    else:
        raise HTTPException(
            status_code=503,
            detail="Model registry service not available"
        )


def get_harness():
    """Get validation harness with fallback"""
    if MODEL_REGISTRY_AVAILABLE:
        return get_validation_harness()
    else:
        raise HTTPException(
            status_code=503,
            detail="Validation harness service not available"
        )


def get_feature_flags():
    """Get feature flags service with fallback"""
    if FEATURE_FLAGS_AVAILABLE:
        return FeatureFlags.get_instance()
    else:
        raise HTTPException(
            status_code=503,
            detail="Feature flags service not available"
        )


@enterprise_router.get("/registry", response_model=StandardAPIResponse[List[EnterpriseModelResponse]])
async def list_enterprise_models(
    status: Optional[str] = Query(default=None, description="Filter by model status"),
    model_type: Optional[str] = Query(default=None, description="Filter by model type"),
    sport: Optional[str] = Query(default=None, description="Filter by sport"),
    registry = Depends(get_registry)
):
    """List all registered models with optional filtering"""
    try:
        # Convert string parameters to enums if available
        status_enum = None
        model_type_enum = None
        
        if status and MODEL_REGISTRY_AVAILABLE:
            try:
                status_enum = ServiceModelStatus(status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        if model_type and MODEL_REGISTRY_AVAILABLE:
            try:
                model_type_enum = ServiceModelType(model_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid model type: {model_type}")
        
        models = registry.list_models(status=status_enum, model_type=model_type_enum, sport=sport)
        
        # Convert to response format
        response_models = []
        for model in models:
            response_models.append(EnterpriseModelResponse(
                model_id=model.model_id,
                name=model.name,
                version=model.version,
                model_type=model.model_type.value if hasattr(model.model_type, 'value') else str(model.model_type),
                status=model.status.value if hasattr(model.status, 'value') else str(model.status),
                description=model.description,
                sport=model.sport,
                created_at=model.created_at,
                updated_at=model.updated_at,
                created_by=model.created_by,
                deployment_target=model.deployment_target,
                feature_flag_id=model.feature_flag_id,
                rollout_percentage=model.rollout_percentage,
                retention_days=model.retention_days
            ))
        
        return ResponseBuilder.success(
            data=response_models,
            message=f"Found {len(response_models)} models"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        return ResponseBuilder.error(
            message=f"Failed to list models: {str(e)}",
            code="MODEL_LIST_ERROR"
        )


@enterprise_router.get("/registry/{model_id}", response_model=StandardAPIResponse[EnterpriseModelResponse])
async def get_enterprise_model(
    model_id: str = Path(..., description="Model ID to retrieve"),
    registry = Depends(get_registry)
):
    """Get detailed information about a specific model"""
    try:
        model = registry.get_model(model_id)
        if not model:
            return ResponseBuilder.error(
                message=f"Model {model_id} not found",
                code="MODEL_NOT_FOUND"
            )
        
        response_model = EnterpriseModelResponse(
            model_id=model.model_id,
            name=model.name,
            version=model.version,
            model_type=model.model_type.value if hasattr(model.model_type, 'value') else str(model.model_type),
            status=model.status.value if hasattr(model.status, 'value') else str(model.status),
            description=model.description,
            sport=model.sport,
            created_at=model.created_at,
            updated_at=model.updated_at,
            created_by=model.created_by,
            deployment_target=model.deployment_target,
            feature_flag_id=model.feature_flag_id,
            rollout_percentage=model.rollout_percentage,
            retention_days=model.retention_days
        )
        
        return ResponseBuilder.success(
            data=response_model,
            message=f"Retrieved model {model_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to get model {model_id}: {e}")
        return ResponseBuilder.error(
            message=f"Failed to retrieve model: {str(e)}",
            code="MODEL_RETRIEVE_ERROR"
        )


@enterprise_router.get("/registry/{model_id}/metrics", response_model=StandardAPIResponse[PerformanceMetricsResponse])
async def get_enterprise_model_metrics(
    model_id: str = Path(..., description="Model ID to get metrics for"),
    registry = Depends(get_registry)
):
    """Get performance metrics for a specific model"""
    try:
        metrics = registry.get_performance_metrics(model_id)
        if not metrics:
            return ResponseBuilder.error(
                message=f"No metrics found for model {model_id}",
                code="METRICS_NOT_FOUND"
            )
        
        # Calculate derived metrics
        success_rate = (
            metrics.successful_inferences / metrics.total_inferences * 100 
            if metrics.total_inferences > 0 else 0
        )
        
        avg_timing = (
            metrics.total_inference_time_ms / metrics.successful_inferences
            if metrics.successful_inferences > 0 else 0
        )
        
        percentiles = registry.calculate_percentiles(model_id)
        
        response_metrics = PerformanceMetricsResponse(
            model_id=model_id,
            total_inferences=metrics.total_inferences,
            successful_inferences=metrics.successful_inferences,
            failed_inferences=metrics.failed_inferences,
            success_rate=round(success_rate, 2),
            average_timing_ms=round(avg_timing, 2),
            min_timing_ms=metrics.min_inference_time_ms if metrics.min_inference_time_ms != float('inf') else 0,
            max_timing_ms=metrics.max_inference_time_ms,
            percentiles=percentiles,
            error_types=metrics.error_types,
            last_updated=metrics.last_updated
        )
        
        return ResponseBuilder.success(
            data=response_metrics,
            message=f"Retrieved metrics for model {model_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to get metrics for model {model_id}: {e}")
        return ResponseBuilder.error(
            code="METRICS_RETRIEVE_ERROR", 
            message=f"Failed to retrieve metrics: {str(e)}"
        )


@enterprise_router.get("/registry/{model_id}/health", response_model=StandardAPIResponse[ModelHealthResponse])
async def get_enterprise_model_health(
    model_id: str = Path(..., description="Model ID to get health for"),
    registry = Depends(get_registry)
):
    """Get comprehensive health status for a model"""
    try:
        health_summary = registry.get_model_health_summary(model_id)
        if "error" in health_summary:
            return ResponseBuilder.error(
                code="HEALTH_CHECK_ERROR",
                message=health_summary["error"]
            )
        
        health_response = ModelHealthResponse(**health_summary)
        
        return ResponseBuilder.success(
            data=health_response,
            message=f"Health check completed for model {model_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to get health for model {model_id}: {e}")
        return ResponseBuilder.error(
            code="HEALTH_RETRIEVE_ERROR",
            message=f"Failed to retrieve health status: {str(e)}"
        )


@enterprise_router.post("/registry/{model_id}/inference", response_model=StandardAPIResponse[Dict[str, str]])
async def record_enterprise_inference(
    model_id: str = Path(..., description="Model ID"),
    timing_ms: float = Query(..., description="Inference timing in milliseconds"),
    success: bool = Query(default=True, description="Whether inference was successful"),
    error: Optional[str] = Query(default=None, description="Error message if failed"),
    registry = Depends(get_registry)
):
    """Record inference timing and success/failure for a model"""
    try:
        await registry.record_inference_timing(model_id, timing_ms, success, error)
        
        return ResponseBuilder.success(
            data={"message": "Inference recorded successfully"},
            message=f"Recorded inference for model {model_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to record inference for model {model_id}: {e}")
        return ResponseBuilder.error(
            code="INFERENCE_RECORD_ERROR",
            message=f"Failed to record inference: {str(e)}"
        )


@enterprise_router.post("/validation/run", response_model=StandardAPIResponse[Dict[str, Any]])
async def run_enterprise_validation(
    request: ValidationRequest,
    harness = Depends(get_harness)
):
    """Run validation for a specific model"""
    try:
        validation_run = await harness.run_validation(
            request.model_id,
            test_case_ids=request.test_case_ids
        )
        
        result_data = {
            "run_id": validation_run.run_id,
            "status": validation_run.status.value if hasattr(validation_run.status, 'value') else str(validation_run.status),
            "total_tests": validation_run.total_tests,
            "passed_tests": validation_run.passed_tests,
            "failed_tests": validation_run.failed_tests,
            "error_tests": validation_run.error_tests,
            "regression_detected": validation_run.regression_detected,
            "regression_severity": validation_run.regression_severity
        }
        
        return ResponseBuilder.success(
            data=result_data,
            message=f"Validation completed for model {request.model_id}"
        )
        
    except ValueError as e:
        return ResponseBuilder.error(
            code="VALIDATION_REQUEST_ERROR",
            message=str(e)
        )
    except Exception as e:
        logger.error(f"Validation failed for model {request.model_id}: {e}")
        return ResponseBuilder.error(
            code="VALIDATION_ERROR",
            message=f"Validation failed: {str(e)}"
        )


@enterprise_router.post("/validation/nightly", response_model=StandardAPIResponse[Dict[str, Any]])
async def trigger_enterprise_nightly_validation(
    harness = Depends(get_harness)
):
    """Trigger nightly validation for all active models"""
    try:
        # Run nightly validation in background
        results = await harness.schedule_nightly_validation()
        
        summary = {
            "models_processed": len(results),
            "results_summary": {
                "passed": sum(1 for r in results if str(r.status).endswith("passed")),
                "failed": sum(1 for r in results if str(r.status).endswith("failed")),
                "errors": sum(1 for r in results if str(r.status).endswith("error")),
                "regressions_detected": sum(1 for r in results if r.regression_detected)
            }
        }
        
        return ResponseBuilder.success(
            data=summary,
            message="Nightly validation completed"
        )
        
    except Exception as e:
        logger.error(f"Nightly validation failed: {e}")
        return ResponseBuilder.error(
            code="NIGHTLY_VALIDATION_ERROR",
            message=f"Nightly validation failed: {str(e)}"
        )


@enterprise_router.get("/validation/history/{model_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_enterprise_validation_history(
    model_id: str = Path(..., description="Model ID"),
    days: int = Query(default=30, description="Number of days to look back"),
    harness = Depends(get_harness)
):
    """Get validation history for a model"""
    try:
        history = harness.get_validation_history(model_id, days)
        
        history_data = {
            "model_id": model_id,
            "period_days": days,
            "validation_runs": [
                {
                    "run_id": run.run_id,
                    "status": run.status.value if hasattr(run.status, 'value') else str(run.status),
                    "started_at": run.started_at.isoformat(),
                    "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                    "total_tests": run.total_tests,
                    "passed_tests": run.passed_tests,
                    "failed_tests": run.failed_tests,
                    "regression_detected": run.regression_detected,
                    "regression_severity": run.regression_severity
                }
                for run in history
            ]
        }
        
        return ResponseBuilder.success(
            data=history_data,
            message=f"Retrieved validation history for model {model_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to get validation history for model {model_id}: {e}")
        return ResponseBuilder.error(
            code="VALIDATION_HISTORY_ERROR",
            message=f"Failed to retrieve validation history: {str(e)}"
        )


@enterprise_router.get("/validation/regression-report/{model_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_enterprise_regression_report(
    model_id: str = Path(..., description="Model ID"),
    days: int = Query(default=7, description="Number of days to analyze"),
    harness = Depends(get_harness)
):
    """Get regression analysis report for a model"""
    try:
        report = harness.get_regression_report(model_id, days)
        
        return ResponseBuilder.success(
            data=report,
            message=f"Generated regression report for model {model_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to generate regression report for model {model_id}: {e}")
        return ResponseBuilder.error(
            code="REGRESSION_REPORT_ERROR",
            message=f"Failed to generate regression report: {str(e)}"
        )


@enterprise_router.get("/types")
async def get_enterprise_model_types(request: Request):
    """Get available model types and statuses with caching support"""
    try:
        if MODEL_REGISTRY_AVAILABLE and ModelType and ModelStatus:
            model_types = [t.value for t in ModelType]
            model_statuses = [s.value for s in ModelStatus]
        else:
            model_types = ["transformer", "ensemble", "traditional_ml"]
            model_statuses = ["development", "canary", "stable", "deprecated", "retired"]
        
        types_data = {
            "model_types": model_types,
            "model_statuses": model_statuses
        }
        
        # Use conditional response with ETag if caching is available
        if CACHING_AVAILABLE and ETagger:
            return ETagger.create_conditional_response(
                data={
                    "success": True,
                    "data": types_data,
                    "message": "Retrieved available model types and statuses"
                },
                request=request,
                max_age=7200  # 2 hours - static configuration
            )
        
        return ResponseBuilder.success(
            data=types_data,
            message="Retrieved available model types and statuses"
        )
        
    except Exception as e:
        logger.error(f"Failed to get model types: {e}")
        return ResponseBuilder.error(
            message=f"Failed to retrieve model types: {str(e)}",
            code="TYPES_ERROR"
        )


# Export the router
__all__ = ["enterprise_router"]
