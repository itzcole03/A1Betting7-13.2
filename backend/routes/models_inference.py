"""
PR9: Model Inference API Routes

Provides REST endpoints for model inference, audit data access, and registry management
under the /api/v2/models/* namespace. Enhanced with security middleware.
"""

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from backend.utils.log_context import get_contextual_logger, get_request_id
from backend.services.inference_service import get_inference_service
from backend.services.model_registry import get_model_registry
from backend.services.inference_audit import get_inference_audit

# Import security middleware
try:
    from backend.services.security_middleware import secure_endpoint, rate_limited
    SECURITY_AVAILABLE = True
except ImportError:
    SECURITY_AVAILABLE = False
    # Fallback decorators that do nothing
    def secure_endpoint(requests_per_minute=None, burst_limit=None, require_api_key=True):
        def decorator(func):
            return func
        return decorator
    
    def rate_limited(requests_per_minute=None, burst_limit=None):
        def decorator(func):
            return func
        return decorator

logger = get_contextual_logger(__name__)
router = APIRouter()

# Request/Response Models
class PredictionRequest(BaseModel):
    """Request model for inference prediction."""
    features: Dict[str, Any] = Field(..., description="Input features for model inference")


class PredictionResponse(BaseModel):
    """Response model for inference prediction."""
    prediction: float = Field(..., description="Model prediction value")
    confidence: float = Field(..., description="Prediction confidence score")
    model_version: str = Field(..., description="Active model version used")
    request_id: str = Field(..., description="Request correlation ID")
    shadow_diff: Optional[float] = Field(None, description="Difference from shadow model (if enabled)")


class AuditEntry(BaseModel):
    """Model for audit entry data."""
    request_id: str
    timestamp: float
    model_version: str
    feature_hash: str
    latency_ms: float
    prediction: float
    confidence: float
    shadow_version: Optional[str] = None
    shadow_prediction: Optional[float] = None
    shadow_diff: Optional[float] = None
    shadow_latency_ms: Optional[float] = None
    status: str


class AuditSummary(BaseModel):
    """Model for audit summary data."""
    rolling_count: int
    avg_latency_ms: float
    shadow_avg_diff: Optional[float]
    prediction_mean: float
    confidence_histogram: Dict[str, int]
    shadow_enabled: bool
    active_model: str
    shadow_model: Optional[str]
    success_rate: float
    error_count: int


class ModelRegistryResponse(BaseModel):
    """Response model for model registry information."""
    available_versions: List[str]
    active_version: str
    shadow_version: Optional[str]
    shadow_enabled: bool


@router.post(
    "/api/v2/models/predict",
    response_model=PredictionResponse,
    summary="Run Model Inference",
    description="Execute model inference with observability and shadow mode support"
)
@secure_endpoint(requests_per_minute=30, burst_limit=5, require_api_key=True)
async def predict(request: Request, prediction_request: PredictionRequest):
    """
    Run model inference with full observability.
    
    This endpoint executes primary model inference and optionally runs shadow model
    inference if configured. Results are recorded in the audit system for monitoring.
    """
    try:
        # Get services
        inference_service = get_inference_service()
        model_registry = get_model_registry()
        
        # Get active model version
        active_model_version = model_registry.get_active_model_version()
        
        logger.info(
            "Processing inference request",
            extra={
                "active_model": active_model_version,
                "feature_count": len(prediction_request.features),
                "shadow_enabled": model_registry.is_shadow_mode_enabled()
            }
        )
        
        # Run inference
        result = await inference_service.run_inference(
            model_version=active_model_version,
            features=prediction_request.features
        )
        
        # Build response
        response = PredictionResponse(
            prediction=result.prediction,
            confidence=result.confidence,
            model_version=result.model_version,
            request_id=result.request_id,
            shadow_diff=result.shadow_diff
        )
        
        logger.info(
            "Inference request completed",
            extra={
                "request_id": result.request_id,
                "prediction": result.prediction,
                "confidence": result.confidence,
                "latency_ms": result.latency_ms
            }
        )
        
        return response
        
    except ValueError as e:
        logger.error(f"Invalid model configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid model configuration: {str(e)}")
    
    except Exception as e:
        logger.error(f"Inference request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@router.get(
    "/api/v2/models/audit/recent",
    response_model=List[AuditEntry],
    summary="Get Recent Audit Entries",
    description="Retrieve recent model inference audit entries with optional limit"
)
@rate_limited(requests_per_minute=120, burst_limit=15)
async def get_recent_audit_entries(
    request: Request,
    limit: int = Query(default=100, ge=1, le=1000, description="Maximum number of entries to return")
):
    """
    Get recent inference audit entries.
    
    Returns the most recent inference audit entries for monitoring and debugging.
    Entries include timing, prediction values, and shadow model comparisons.
    """
    try:
        audit_service = get_inference_audit()
        
        logger.debug(
            f"Retrieving recent audit entries",
            extra={"requested_limit": limit}
        )
        
        # Get recent entries
        entries = audit_service.get_recent_inferences(limit=limit)
        
        # Convert to response models
        response = [AuditEntry(**entry) for entry in entries]
        
        logger.info(
            f"Retrieved {len(response)} audit entries",
            extra={"requested_limit": limit, "actual_count": len(response)}
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to retrieve audit entries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit entries: {str(e)}")


@router.get(
    "/api/v2/models/audit/summary",
    response_model=AuditSummary,
    summary="Get Audit Summary",
    description="Get aggregated audit summary with drift and calibration metrics"
)
@rate_limited(requests_per_minute=120, burst_limit=15)
async def get_audit_summary(request: Request):
    """
    Get aggregated audit summary.
    
    Returns aggregated statistics including average latency, shadow model differences,
    confidence distribution, and success rates for monitoring drift and performance.
    """
    try:
        audit_service = get_inference_audit()
        
        logger.debug("Retrieving audit summary")
        
        # Get summary
        summary = audit_service.get_audit_summary()
        
        # Convert to response model
        response = AuditSummary(
            rolling_count=summary.rolling_count,
            avg_latency_ms=summary.avg_latency_ms,
            shadow_avg_diff=summary.shadow_avg_diff,
            prediction_mean=summary.prediction_mean,
            confidence_histogram=summary.confidence_histogram,
            shadow_enabled=summary.shadow_enabled,
            active_model=summary.active_model,
            shadow_model=summary.shadow_model,
            success_rate=summary.success_rate,
            error_count=summary.error_count
        )
        
        logger.info(
            "Audit summary retrieved",
            extra={
                "rolling_count": summary.rolling_count,
                "avg_latency_ms": summary.avg_latency_ms,
                "success_rate": summary.success_rate,
                "shadow_enabled": summary.shadow_enabled
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to retrieve audit summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit summary: {str(e)}")


@router.get(
    "/api/v2/models/registry",
    response_model=ModelRegistryResponse,
    summary="Get Model Registry Information",
    description="Get information about available models, active version, and shadow configuration"
)
async def get_model_registry_info(request: Request):
    """
    Get model registry information.
    
    Returns available model versions, current active version, and shadow model
    configuration for understanding the current deployment state.
    """
    try:
        model_registry = get_model_registry()
        
        logger.debug("Retrieving model registry information")
        
        # Get registry information
        available_versions = model_registry.list_available_versions()
        active_version = model_registry.get_active_model_version()
        shadow_version = model_registry.get_shadow_model_version()
        shadow_enabled = model_registry.is_shadow_mode_enabled()
        
        response = ModelRegistryResponse(
            available_versions=available_versions,
            active_version=active_version,
            shadow_version=shadow_version,
            shadow_enabled=shadow_enabled
        )
        
        logger.info(
            "Model registry information retrieved",
            extra={
                "available_versions_count": len(available_versions),
                "active_version": active_version,
                "shadow_version": shadow_version,
                "shadow_enabled": shadow_enabled
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to retrieve model registry information: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve registry info: {str(e)}")


# Health check endpoint for the inference system
@router.get(
    "/api/v2/models/health",
    summary="Inference System Health Check",
    description="Check health of inference services, audit system, and model registry"
)
async def inference_health_check(request: Request):
    """
    Check health of the inference system components.
    
    Validates that all inference system components are functioning properly,
    including model registry, audit service, and inference capabilities.
    """
    try:
        # Check all services
        model_registry = get_model_registry()
        audit_service = get_inference_audit()
        inference_service = get_inference_service()
        
        # Get health information
        audit_health = await audit_service.health_check()
        buffer_status = audit_service.get_buffer_status()
        
        # Test basic functionality
        available_versions = model_registry.list_available_versions()
        active_version = model_registry.get_active_model_version()
        
        health_data = {
            "status": "healthy",
            "timestamp": get_request_id(),  # Reuse for timestamp
            "services": {
                "model_registry": {
                    "status": "healthy",
                    "available_versions": len(available_versions),
                    "active_version": active_version
                },
                "audit_service": audit_health,
                "buffer_status": buffer_status
            },
            "shadow_mode": {
                "enabled": model_registry.is_shadow_mode_enabled(),
                "shadow_version": model_registry.get_shadow_model_version()
            }
        }
        
        logger.info("Inference system health check completed successfully")
        
        return health_data
        
    except Exception as e:
        logger.error(f"Inference system health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


# TODO: Admin endpoint for model activation (if time permits)
# This would allow runtime switching of active models
@router.post(
    "/api/v2/models/activate",
    summary="Activate Model Version (TODO)",
    description="TODO: Runtime activation of model versions (requires admin role)"
)
async def activate_model_version(request: Request):
    """
    TODO: Activate a different model version at runtime.
    
    This endpoint would allow authorized users to switch the active model version
    without restarting the service. Requires admin role validation.
    """
    raise HTTPException(
        status_code=501,
        detail="Model activation endpoint not yet implemented - TODO for future PR"
    )