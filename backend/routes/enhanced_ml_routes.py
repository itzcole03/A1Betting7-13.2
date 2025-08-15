"""
Enhanced ML API Routes

This module provides API endpoints for the enhanced ML capabilities:
- SHAP explainability
- Batch prediction optimization  
- Performance monitoring and logging
- Model management and health checks
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from ..services.enhanced_prediction_integration import enhanced_prediction_integration
from ..services.redis_cache_service import get_redis_cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/enhanced-ml", tags=["enhanced-ml"])


# Request/Response Models
class PredictionRequest(BaseModel):
    """Single prediction request"""
    request_id: str = Field(..., description="Unique request identifier")
    event_id: str = Field(..., description="Event/game identifier")
    sport: str = Field(..., description="Sport type (e.g., MLB, NBA)")
    bet_type: str = Field(..., description="Type of bet (e.g., over_under, moneyline)")
    features: Dict[str, float] = Field(..., description="Feature dictionary for prediction")
    models: Optional[List[str]] = Field(None, description="Specific models to use")
    priority: int = Field(1, ge=1, le=3, description="Request priority (1=low, 2=medium, 3=high)")
    include_explanations: bool = Field(True, description="Include SHAP explanations")
    timeout: float = Field(10.0, gt=0, description="Request timeout in seconds")


class BatchPredictionRequest(BaseModel):
    """Batch prediction request"""
    requests: List[PredictionRequest] = Field(..., description="List of prediction requests")
    include_explanations: bool = Field(True, description="Include SHAP explanations for all requests")
    explanation_options: Optional[Dict[str, Any]] = Field(None, description="SHAP explanation options")


class PredictionOutcomeUpdate(BaseModel):
    """Update for prediction outcome"""
    prediction_id: str = Field(..., description="Prediction identifier")
    actual_outcome: float = Field(..., description="Actual outcome value")
    outcome_status: str = Field("correct", description="Outcome status (correct, incorrect, push, void)")


class ModelRegistration(BaseModel):
    """Model registration request"""
    model_name: str = Field(..., description="Unique model name")
    sport: str = Field(..., description="Primary sport for this model")
    model_type: str = Field("xgboost", description="Model type (xgboost, sklearn, etc.)")
    model_version: str = Field("1.0", description="Model version")
    feature_names: List[str] = Field(default_factory=list, description="Model feature names")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional model metadata")


class PerformanceQuery(BaseModel):
    """Performance query parameters"""
    model_name: Optional[str] = Field(None, description="Specific model name")
    sport: Optional[str] = Field(None, description="Specific sport")
    bet_type: Optional[str] = Field(None, description="Specific bet type")
    window_size: Optional[int] = Field(None, description="Rolling window size")


class ModelComparison(BaseModel):
    """Model comparison request"""
    sport: str = Field(..., description="Sport to compare models for")
    bet_type: str = Field(..., description="Bet type to compare")
    metrics: Optional[List[str]] = Field(None, description="Specific metrics to compare")


# API Endpoints
@router.post("/predict/single")
async def predict_single(request: PredictionRequest) -> Dict[str, Any]:
    """
    Enhanced single prediction with SHAP explanations and performance logging
    """
    try:
        # Check Redis cache first
        cache_service = await get_redis_cache()
        
        # Create cache key from request data
        cache_key_data = {
            'event_id': request.event_id,
            'sport': request.sport,
            'bet_type': request.bet_type,
            'features': request.features,
            'models': request.models,
            'include_explanations': request.include_explanations
        }
        
        # Try to get from cache
        cached_result = await cache_service.get_prediction_result(cache_key_data)
        if cached_result:
            return {
                "status": "success",
                "result": cached_result,
                "timestamp": time.time(),
                "cache_hit": True
            }
        
        # Cache miss - execute prediction
        result = await enhanced_prediction_integration.enhanced_predict_single(
            request_id=request.request_id,
            event_id=request.event_id,
            sport=request.sport,
            bet_type=request.bet_type,
            features=request.features,
            models=request.models,
            include_explanations=request.include_explanations,
            priority=request.priority
        )
        
        # Cache the result
        await cache_service.cache_prediction_result(cache_key_data, result)
        
        return {
            "status": "success",
            "result": result,
            "timestamp": time.time(),
            "cache_hit": False
        }
        
    except Exception as e:
        logger.error(f"Error in single prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict/batch")
async def predict_batch(request: BatchPredictionRequest) -> Dict[str, Any]:
    """
    Enhanced batch predictions with optimization and explanations
    """
    try:
        # Check Redis cache first
        cache_service = await get_redis_cache()
        
        # Convert Pydantic models to dictionaries for caching
        prediction_requests = [req.dict() for req in request.requests]
        
        # Try to get from cache
        cached_results = await cache_service.get_batch_predictions(prediction_requests)
        if cached_results:
            return {
                "status": "success",
                "results": cached_results,
                "total_predictions": len(cached_results),
                "timestamp": time.time(),
                "cache_hit": True
            }
        
        # Cache miss - execute batch prediction
        results = await enhanced_prediction_integration.enhanced_predict(
            prediction_requests=prediction_requests,
            include_explanations=request.include_explanations,
            explanation_options=request.explanation_options or {}
        )
        
        # Cache the results
        await cache_service.cache_batch_predictions(prediction_requests, results)
        
        return {
            "status": "success",
            "results": results,
            "total_predictions": len(results),
            "timestamp": time.time(),
            "cache_hit": False
        }
        
        return {
            "status": "success",
            "results": results,
            "batch_size": len(results),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@router.post("/models/register")
async def register_model(registration: ModelRegistration, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Register a model with enhanced services
    """
    try:
        # Note: This endpoint expects the actual model object to be provided separately
        # In a real implementation, you might load the model from a file path or model registry
        
        # For now, return success but indicate model object is needed
        return {
            "status": "pending",
            "message": "Model registration initiated. Model object must be provided separately.",
            "model_name": registration.model_name,
            "sport": registration.sport,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error registering model: {e}")
        raise HTTPException(status_code=500, detail=f"Model registration failed: {str(e)}")


@router.get("/models/registered")
async def get_registered_models() -> Dict[str, Any]:
    """
    Get list of registered models and their information
    """
    try:
        models = enhanced_prediction_integration.get_registered_models()
        
        return {
            "status": "success",
            "registered_models": models,
            "count": len(models),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error getting registered models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")


@router.post("/outcomes/update")
async def update_prediction_outcome(update: PredictionOutcomeUpdate) -> Dict[str, Any]:
    """
    Update prediction outcome for performance tracking
    """
    try:
        success = enhanced_prediction_integration.log_prediction_outcome(
            prediction_id=update.prediction_id,
            actual_outcome=update.actual_outcome,
            outcome_status=update.outcome_status
        )
        
        return {
            "status": "success" if success else "failed",
            "prediction_id": update.prediction_id,
            "outcome_logged": success,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error updating prediction outcome: {e}")
        raise HTTPException(status_code=500, detail=f"Outcome update failed: {str(e)}")


@router.post("/performance/query")
async def query_performance(query: PerformanceQuery) -> Dict[str, Any]:
    """
    Query performance statistics
    """
    try:
        summary = enhanced_prediction_integration.get_performance_summary(
            model_name=query.model_name,
            sport=query.sport,
            bet_type=query.bet_type
        )
        
        return {
            "status": "success",
            "performance_data": summary,
            "query_params": query.dict(),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error querying performance: {e}")
        raise HTTPException(status_code=500, detail=f"Performance query failed: {str(e)}")


@router.post("/performance/compare")
async def compare_models(comparison: ModelComparison) -> Dict[str, Any]:
    """
    Compare model performance for specific sport and bet type
    """
    try:
        comparison_data = enhanced_prediction_integration.get_model_comparison(
            sport=comparison.sport,
            bet_type=comparison.bet_type,
            metrics=comparison.metrics
        )
        
        return {
            "status": "success",
            "comparison": comparison_data,
            "sport": comparison.sport,
            "bet_type": comparison.bet_type,
            "models_compared": len(comparison_data),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error comparing models: {e}")
        raise HTTPException(status_code=500, detail=f"Model comparison failed: {str(e)}")


@router.get("/performance/alerts")
async def get_performance_alerts(limit: int = 20) -> Dict[str, Any]:
    """
    Get recent performance alerts
    """
    try:
        alerts = enhanced_prediction_integration.get_recent_alerts(limit=limit)
        
        return {
            "status": "success",
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")


@router.get("/performance/batch-stats")
async def get_batch_stats() -> Dict[str, Any]:
    """
    Get batch processing performance statistics
    """
    try:
        stats = enhanced_prediction_integration.get_batch_performance_stats()
        
        return {
            "status": "success",
            "batch_statistics": stats,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error getting batch stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get batch stats: {str(e)}")


@router.get("/performance/shap-stats")
async def get_shap_stats() -> Dict[str, Any]:
    """
    Get SHAP explanation cache statistics
    """
    try:
        stats = enhanced_prediction_integration.get_shap_cache_stats()
        
        return {
            "status": "success",
            "shap_statistics": stats,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error getting SHAP stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get SHAP stats: {str(e)}")


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Comprehensive health check for all enhanced ML services
    """
    try:
        health_status = await enhanced_prediction_integration.health_check()
        
        # Determine HTTP status code based on health
        status_code = 200
        if health_status.get('overall_status') in ['critical', 'error']:
            status_code = 503  # Service Unavailable
        elif health_status.get('overall_status') == 'degraded':
            status_code = 206  # Partial Content
        
        return health_status
        
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return {
            "overall_status": "error",
            "error": str(e),
            "timestamp": time.time()
        }


@router.post("/initialize")
async def initialize_services() -> Dict[str, Any]:
    """
    Initialize enhanced ML services
    """
    try:
        await enhanced_prediction_integration.initialize_services()
        
        return {
            "status": "success",
            "message": "Enhanced ML services initialized",
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        raise HTTPException(status_code=500, detail=f"Service initialization failed: {str(e)}")


@router.post("/shutdown")
async def shutdown_services() -> Dict[str, Any]:
    """
    Shutdown enhanced ML services
    """
    try:
        await enhanced_prediction_integration.shutdown_services()
        
        return {
            "status": "success",
            "message": "Enhanced ML services shut down",
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error shutting down services: {e}")
        raise HTTPException(status_code=500, detail=f"Service shutdown failed: {str(e)}")


# Background task endpoints
@router.post("/admin/reset-performance-stats")
async def reset_performance_stats(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Reset performance statistics (admin only)
    """
    try:
        def reset_stats():
            enhanced_prediction_integration.performance_logger.reset_stats()
        
        background_tasks.add_task(reset_stats)
        
        return {
            "status": "success",
            "message": "Performance statistics reset initiated",
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error resetting performance stats: {e}")
        raise HTTPException(status_code=500, detail=f"Stats reset failed: {str(e)}")


@router.get("/admin/export-performance")
async def export_performance_data(
    start_time: Optional[float] = None,
    end_time: Optional[float] = None
) -> Dict[str, Any]:
    """
    Export performance data for analysis (admin only)
    """
    try:
        export_data = enhanced_prediction_integration.performance_logger.export_performance_data(
            start_time=start_time,
            end_time=end_time
        )
        
        return {
            "status": "success",
            "export_data": export_data,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error exporting performance data: {e}")
        raise HTTPException(status_code=500, detail=f"Data export failed: {str(e)}")


# Real-time monitoring endpoint
@router.get("/monitor/real-time")
async def get_real_time_metrics() -> Dict[str, Any]:
    """
    Get real-time monitoring metrics
    """
    try:
        # Get current statistics from all services
        batch_stats = enhanced_prediction_integration.get_batch_performance_stats()
        shap_stats = enhanced_prediction_integration.get_shap_cache_stats()
        active_alerts = enhanced_prediction_integration.get_recent_alerts(limit=5)
        
        return {
            "status": "success",
            "real_time_metrics": {
                "batch_processing": {
                    "queue_sizes": batch_stats.get('queue_stats', {}),
                    "throughput": batch_stats.get('batch_stats', {}).get('throughput_per_second', 0),
                    "cache_hit_rate": batch_stats.get('batch_stats', {}).get('cache_hit_rate', 0)
                },
                "shap_explanations": {
                    "cache_size": shap_stats.get('cache_size', 0),
                    "hit_rate": shap_stats.get('hit_rate', 0),
                    "registered_models": len(enhanced_prediction_integration.get_registered_models())
                },
                "alerts": {
                    "recent_count": len(active_alerts),
                    "recent_alerts": active_alerts
                },
                "system_health": enhanced_prediction_integration.initialized
            },
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Real-time metrics failed: {str(e)}")


# Utility function for integration with existing prediction engines
async def integrate_enhanced_prediction(prediction_engine_func, *args, **kwargs):
    """
    Utility function to integrate enhanced capabilities with existing prediction engines
    
    This can be called from existing prediction services like BestBetSelector or FinalPredictionEngine
    to add SHAP explanations, batch optimization, and performance logging.
    """
    try:
        # Initialize services if not already done
        if not enhanced_prediction_integration.initialized:
            await enhanced_prediction_integration.initialize_services()
        
        # Call original prediction function
        start_time = time.time()
        result = await prediction_engine_func(*args, **kwargs)
        processing_time = time.time() - start_time
        
        # Enhance result with additional capabilities if it's a prediction
        if isinstance(result, dict) and 'prediction' in result:
            # Add processing time
            result['enhanced_processing_time'] = processing_time
            
            # Add performance metadata
            result['enhanced_metadata'] = {
                'timestamp': time.time(),
                'enhanced_services_active': True,
                'services_initialized': enhanced_prediction_integration.initialized
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Error in enhanced prediction integration: {e}")
        # Return original result if enhancement fails
        return await prediction_engine_func(*args, **kwargs)


# Export the integration utility for use by other modules
__all__ = ['router', 'integrate_enhanced_prediction']
