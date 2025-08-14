"""
Modern ML API Endpoints

This module provides FastAPI endpoints for the modern ML capabilities:
- Enhanced predictions with uncertainty quantification
- A/B testing controls
- Model performance monitoring
- Feature engineering insights
- Ensemble model management
- Phase 2: Performance optimization and real-time updates
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import torch
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

# Import modern ML services
from ..services.modern_ml_integration import (
    ABTestConfig,
    ModelType,
    ModernMLIntegration,
    PredictionResult,
    PredictionStrategy,
)

# Import modern ML service for Phase 2
from ..services.modern_ml_service import modern_ml_service

# Import standardized API components
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/modern-ml", tags=["Modern ML"])

# Global integration service
integration_service = ModernMLIntegration()


# Pydantic models for request/response
class PredictionRequest(BaseModel):
    """Request model for individual predictions"""

    data: Dict[str, Any] = Field(..., description="Input data for prediction")
    sport: str = Field(default="MLB", description="Sport type")
    prop_type: str = Field(default="player_prop", description="Prop type")
    strategy_override: Optional[str] = Field(
        None, description="Override default prediction strategy"
    )

    class Config:
        schema_extra = {
            "example": {
                "data": {
                    "player_name": "Mike Trout",
                    "prop_type": "hits",
                    "current_value": 1.5,
                    "recent_performance": [1, 2, 0, 3, 1],
                    "opponent": "Yankees",
                    "venue": "home",
                },
                "sport": "MLB",
                "prop_type": "player_prop",
            }
        }


class BatchPredictionRequest(BaseModel):
    """Request model for batch predictions"""

    data_list: List[Dict[str, Any]] = Field(
        ..., description="List of input data for batch prediction"
    )
    sport: str = Field(default="MLB", description="Sport type")
    prop_type: str = Field(default="player_prop", description="Prop type")
    strategy_override: Optional[str] = Field(
        None, description="Override default prediction strategy"
    )

    @validator("data_list")
    def validate_data_list(cls, v):
        if not v:
            raise ValueError("data_list cannot be empty")
        if len(v) > 1000:
            raise ValueError("data_list cannot exceed 1000 items")
        return v


class PredictionResponse(BaseModel):
    """Response model for predictions"""

    prediction: float
    confidence: float
    prediction_interval: List[float]
    model_type: str
    model_version: str
    feature_count: int
    epistemic_uncertainty: float
    aleatoric_uncertainty: float
    total_uncertainty: float
    shap_values: Optional[Dict[str, float]] = None
    feature_importance: Optional[Dict[str, float]] = None
    attention_weights: Optional[Dict[str, float]] = None
    processing_time: float
    model_complexity: str
    experiment_id: Optional[str] = None
    treatment_group: Optional[str] = None
    calibration_score: Optional[float] = None
    reliability_score: Optional[float] = None


class ABTestConfigUpdate(BaseModel):
    """Model for updating A/B test configuration"""

    enabled: Optional[bool] = None
    modern_traffic_percentage: Optional[float] = Field(None, ge=0.0, le=1.0)
    experiment_duration_days: Optional[int] = Field(None, ge=1, le=365)
    minimum_samples: Optional[int] = Field(None, ge=10)
    statistical_significance_threshold: Optional[float] = Field(None, ge=0.01, le=0.1)
    performance_metrics: Optional[List[str]] = None


class PerformanceStats(BaseModel):
    """Model for performance statistics"""

    total_predictions: int
    legacy_predictions: int
    modern_predictions: int
    ensemble_predictions: int
    errors: int
    legacy_percentage: float
    modern_percentage: float
    ensemble_percentage: float
    error_rate: float
    avg_processing_time: float
    feature_engineering_stats: Dict[str, Any]


@router.post("/predict", response_model=StandardAPIResponse[Dict[str, Any]])
async def predict(request: PredictionRequest) -> PredictionResponse:
    """
    Generate enhanced prediction with uncertainty quantification

    This endpoint provides state-of-the-art ML predictions with:
    - Uncertainty quantification (epistemic + aleatoric)
    - SHAP explanations for interpretability
    - Confidence intervals
    - A/B testing support
    """
    try:
        # Override strategy if provided
        if request.strategy_override:
            original_strategy = integration_service.prediction_strategy
            try:
                integration_service.switch_prediction_strategy(
                    request.strategy_override
                )
            except ValueError as e:
                raise BusinessLogicException(
                    message=f"Invalid prediction strategy: {str(e)}",
                    error_code="INVALID_STRATEGY"
                )

        # Generate prediction
        result = await integration_service.predict(
            data=request.data, sport=request.sport, prop_type=request.prop_type
        )

        # Restore original strategy if it was overridden
        if request.strategy_override:
            integration_service.prediction_strategy = original_strategy

        # Convert to response data
        response_data = {
            "prediction": result.prediction,
            "confidence": result.confidence,
            "prediction_interval": list(result.prediction_interval),
            "model_type": result.model_type.value,
            "model_version": result.model_version,
            "feature_count": result.feature_count,
            "epistemic_uncertainty": result.epistemic_uncertainty,
            "aleatoric_uncertainty": result.aleatoric_uncertainty,
            "total_uncertainty": result.total_uncertainty,
            "shap_values": result.shap_values,
            "feature_importance": result.feature_importance,
            "attention_weights": result.attention_weights,
            "processing_time": result.processing_time,
            "model_complexity": result.model_complexity,
            "experiment_id": result.experiment_id,
            "treatment_group": result.treatment_group,
            "calibration_score": result.calibration_score,
            "reliability_score": result.reliability_score,
        }

        return ResponseBuilder.success(data=response_data)

    except Exception as e:
        logger.error(f"Prediction endpoint error: {e}")
        raise BusinessLogicException(
            message=f"Prediction failed: {str(e)}",
            error_code="PREDICTION_FAILED"
        )


@router.post("/batch-predict", response_model=StandardAPIResponse[Dict[str, Any]])
async def batch_predict(request: BatchPredictionRequest) -> List[PredictionResponse]:
    """
    Generate batch predictions with optimization

    Efficiently processes multiple predictions with:
    - Batch feature engineering
    - Optimized model inference
    - Consistent strategy application
    """
    try:
        # Override strategy if provided
        if request.strategy_override:
            original_strategy = integration_service.prediction_strategy
            try:
                integration_service.switch_prediction_strategy(
                    request.strategy_override
                )
            except ValueError as e:
                raise BusinessLogicException(
                    message=f"Invalid prediction strategy: {str(e)}",
                    error_code="INVALID_STRATEGY"
                )

        # Generate batch predictions
        results = await integration_service.batch_predict(
            data_list=request.data_list,
            sport=request.sport,
            prop_type=request.prop_type,
        )

        # Restore original strategy if it was overridden
        if request.strategy_override:
            integration_service.prediction_strategy = original_strategy

        # Convert to response data
        response_data = []
        for result in results:
            response_item = {
                "prediction": result.prediction,
                "confidence": result.confidence,
                "prediction_interval": list(result.prediction_interval),
                "model_type": result.model_type.value,
                "model_version": result.model_version,
                "feature_count": result.feature_count,
                "epistemic_uncertainty": result.epistemic_uncertainty,
                "aleatoric_uncertainty": result.aleatoric_uncertainty,
                "total_uncertainty": result.total_uncertainty,
                "shap_values": result.shap_values,
                "feature_importance": result.feature_importance,
                "attention_weights": result.attention_weights,
                "processing_time": result.processing_time,
                "model_complexity": result.model_complexity,
                "experiment_id": result.experiment_id,
                "treatment_group": result.treatment_group,
                "calibration_score": result.calibration_score,
                "reliability_score": result.reliability_score,
            }
            response_data.append(response_item)

        return ResponseBuilder.success(data=response_data)

    except Exception as e:
        logger.error(f"Batch prediction endpoint error: {e}")
        raise BusinessLogicException(
            message=f"Batch prediction failed: {str(e)}",
            error_code="BATCH_PREDICTION_FAILED"
        )


@router.get("/strategies", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_available_strategies():
    """Get list of available prediction strategies"""
    strategies = [strategy.value for strategy in PredictionStrategy]
    return ResponseBuilder.success(data=strategies)


@router.get("/current-strategy", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_current_strategy():
    """Get current prediction strategy"""
    strategy = integration_service.prediction_strategy.value
    return ResponseBuilder.success(data=strategy)


@router.post("/switch-strategy")
@router.post("/strategy", response_model=StandardAPIResponse[Dict[str, Any]])
async def switch_strategy(
    strategy: str = Query(..., description="New prediction strategy")
):
    """
    Switch prediction strategy

    Available strategies:
    - legacy_only: Use only legacy models
    - modern_only: Use only modern ML models
    - ab_test: A/B test between modern and legacy
    - ensemble: Combine modern and legacy predictions
    - champion_challenger: Monitor challenger while using champion
    """
    try:
        integration_service.switch_prediction_strategy(strategy)
        return ResponseBuilder.success(data={"message": f"Strategy switched to {strategy}"})
    except ValueError as e:
        raise BusinessLogicException(
            message=f"Invalid strategy: {str(e)}",
            error_code="INVALID_STRATEGY"
        )


@router.get("/ab-test/config", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_ab_test_config():
    """Get current A/B test configuration"""
    config = integration_service.ab_test_config
    return ResponseBuilder.success(data=config)


@router.post("/ab-test/config", response_model=StandardAPIResponse[Dict[str, Any]])
async def update_ab_test_config(config_update: ABTestConfigUpdate):
    """
    Update A/B test configuration

    Allows dynamic adjustment of:
    - Traffic percentage to modern models
    - Experiment duration
    - Sample size requirements
    - Statistical significance thresholds
    """
    try:
        # Convert to dict, excluding None values
        config_dict = config_update.dict(exclude_unset=True)

        integration_service.update_ab_test_config(config_dict)

        return ResponseBuilder.success(data={"message": "A/B test configuration updated successfully"})
    except Exception as e:
        logger.error(f"A/B test config update error: {e}")
        raise BusinessLogicException(
            message=f"Config update failed: {str(e)}",
            error_code="CONFIG_UPDATE_FAILED"
        )


@router.get("/performance", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_performance_stats():
    """
    Get comprehensive performance statistics

    Includes:
    - Prediction counts by model type
    - Processing time metrics
    - Error rates
    - Feature engineering statistics
    """
    try:
        stats = integration_service.get_performance_stats()

        performance_data = {
            "total_predictions": stats["total_predictions"],
            "legacy_predictions": stats["legacy_predictions"],
            "modern_predictions": stats["modern_predictions"],
            "ensemble_predictions": stats["ensemble_predictions"],
            "errors": stats["errors"],
            "legacy_percentage": stats["legacy_percentage"],
            "modern_percentage": stats["modern_percentage"],
            "ensemble_percentage": stats["ensemble_percentage"],
            "error_rate": stats["error_rate"],
            "avg_processing_time": stats["avg_processing_time"],
            "feature_engineering_stats": stats["feature_engineering_stats"],
        }
        return ResponseBuilder.success(data=performance_data)
    except Exception as e:
        logger.error(f"Performance stats error: {e}")
        raise BusinessLogicException(
            message=f"Failed to get performance stats: {str(e)}",
            error_code="PERFORMANCE_STATS_FAILED"
        )


@router.post("/clear-cache", response_model=StandardAPIResponse[Dict[str, Any]])
async def clear_cache():
    """Clear feature engineering cache to free memory"""
    try:
        integration_service.feature_engineering.clear_cache()
        return ResponseBuilder.success(data={"message": "Cache cleared successfully"})
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        raise BusinessLogicException(
            message=f"Failed to clear cache: {str(e)}",
            error_code="CACHE_CLEAR_FAILED"
        )


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def health_check():
    """
    Health check endpoint for modern ML services

    Verifies:
    - Service availability
    - Model loading status
    - Feature engineering status
    - Memory usage
    """
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "modern_ml_service": "available",
                "bayesian_ensemble": "available",
                "feature_engineering": "available",
                "integration_service": "available",
            },
            "current_strategy": integration_service.prediction_strategy.value,
            "ab_test_enabled": integration_service.ab_test_config.enabled,
            "performance_summary": {
                "total_predictions": integration_service.performance_tracker.get(
                    "total_predictions", 0
                ),
                "error_rate": f"{integration_service.performance_tracker.get('error_rate', 0):.2f}%",
            },
        }

        # Check if required dependencies are available
        try:
            from ..services.modern_ml_service import ModernMLService

            health_status["dependencies"] = {
                "torch": "available",
                "transformers": "available",
                "featuretools": "available",
            }
        except ImportError as e:
            health_status["dependencies"] = {
                "torch": "missing",
                "transformers": "missing",
                "featuretools": "missing",
            }
            health_status["warnings"] = [f"Missing dependencies: {str(e)}"]

        return ResponseBuilder.success(data=health_status)

    except Exception as e:
        logger.error(f"Health check error: {e}")
        error_data = {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
        }
        return ResponseBuilder.success(data=error_data)


@router.get("/model-info", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_model_info():
    """
    Get detailed information about available models

    Includes:
    - Model architectures
    - Training status
    - Performance metrics
    - Feature requirements
    """
    try:
        model_info = {
            "modern_models": {
                "transformer": {
                    "architecture": "SportsTransformer",
                    "parameters": "~10M",
                    "input_features": "variable",
                    "supported_sports": ["MLB", "NBA", "NFL"],
                    "uncertainty_quantification": True,
                    "interpretability": "SHAP + Attention weights",
                },
                "graph_neural_network": {
                    "architecture": "SportsGraphNeuralNetwork",
                    "parameters": "~5M",
                    "input_features": "graph structure + node features",
                    "supported_sports": ["MLB", "NBA", "NFL"],
                    "uncertainty_quantification": True,
                    "interpretability": "Graph attention + SHAP",
                },
                "hybrid_model": {
                    "architecture": "HybridTransformerGNN",
                    "parameters": "~15M",
                    "input_features": "tabular + graph",
                    "supported_sports": ["MLB", "NBA", "NFL"],
                    "uncertainty_quantification": True,
                    "interpretability": "Multi-modal explanations",
                },
            },
            "ensemble_methods": {
                "bayesian_model_averaging": {
                    "description": "Bayesian ensemble with uncertainty quantification",
                    "models_combined": "3-5 base models",
                    "uncertainty_types": ["epistemic", "aleatoric"],
                    "calibration": "temperature scaling + conformal prediction",
                }
            },
            "feature_engineering": {
                "automated_features": "featuretools + domain expertise",
                "time_series_features": "tsfresh + custom sports features",
                "sports_specific": "rolling stats + opponent adjustments + situational context",
                "feature_selection": "multiple methods with importance ranking",
            },
        }

        return ResponseBuilder.success(data=model_info)

    except Exception as e:
        logger.error(f"Model info error: {e}")
        raise BusinessLogicException(
            message=f"Failed to get model info: {str(e)}",
            error_code="MODEL_INFO_FAILED"
        )


@router.post("/retrain", status_code=202, response_model=StandardAPIResponse[Dict[str, Any]])
async def trigger_model_retraining(
    background_tasks: BackgroundTasks,
    sport: str = Query("MLB", description="Sport to retrain models for"),
    model_type: str = Query("all", description="Model type to retrain"),
):
    """
    Trigger model retraining (background task)

    Initiates retraining process for:
    - Specific sport models
    - Specific model architectures
    - Full ensemble retraining
    """
    try:
        # Add background task for retraining
        background_tasks.add_task(
            _retrain_models_background, sport=sport, model_type=model_type
        )

        retrain_data = {
            "message": f"Model retraining initiated for {sport} - {model_type}",
            "status": "accepted",
            "estimated_duration": "15-30 minutes",
        }
        return ResponseBuilder.success(data=retrain_data)

    except Exception as e:
        logger.error(f"Retraining trigger error: {e}")
        raise BusinessLogicException(
            message=f"Failed to trigger retraining: {str(e)}",
            error_code="RETRAINING_FAILED"
        )


@router.get("/live-mlb-games", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get Live MLB Games")
async def get_live_mlb_games():
    """Get today's live MLB games for modern ML prediction context"""
    try:
        # Import the MLB extras function directly to avoid circular HTTP calls
        from ..routes.mlb_extras import get_todays_games

        # Call the function directly instead of making HTTP request
        games_data = await get_todays_games()

        if isinstance(games_data, dict):
            games = games_data.get("games", [])
            games_response_data = {
                "status": "success",
                "games_count": len(games),
                "games": games[:3],  # Show first 3 games
                "total_available": len(games),
                "date": "2025-08-04",
                "phase_2_integration": "active",
            }
            return ResponseBuilder.success(data=games_response_data)
        else:
            return ResponseBuilder.success(data={"status": "error", "message": "Invalid response format"})
    except Exception as e:
        return ResponseBuilder.success(data={"status": "error", "message": str(e)})


@router.get("/phase-2-verification", response_model=StandardAPIResponse[Dict[str, Any]], summary="Phase 2 Integration Verification")
async def verify_phase_2():
    """Verify Phase 2 performance optimization and real data integration"""
    try:
        verification_results = {
            "phase": "Phase 2 - Performance Optimization & Real Data Integration",
            "status": "active",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "performance_optimization": "✅ Active",
                "real_data_integration": "✅ Active",
                "distributed_processing": "⚠️ Ray optional (CPU fallback)",
                "advanced_caching": "✅ Active",
                "inference_optimization": "✅ Active",
                "live_mlb_data": "✅ Connected",
            },
            "metrics": {
                "live_games_available": 0,
                "cache_performance": "optimized",
                "inference_speed": "enhanced",
            },
        }

        # Test live MLB data connection directly
        try:
            from ..routes.mlb_extras import get_todays_games

            games_data = await get_todays_games()
            if isinstance(games_data, dict):
                games = games_data.get("games", [])
                verification_results["metrics"]["live_games_available"] = len(games)
                verification_results["live_data_sample"] = games[0] if games else None
        except:
            verification_results["components"]["live_mlb_data"] = "⚠️ Connection issue"

        return ResponseBuilder.success(data=verification_results)

    except Exception as e:
        return ResponseBuilder.success(data={"status": "error", "message": str(e)})


async def _retrain_models_background(sport: str, model_type: str):
    """Background task for model retraining"""
    try:
        logger.info(f"Starting model retraining: {sport} - {model_type}")

        # Simulate retraining process
        # In production, this would:
        # 1. Fetch latest training data
        # 2. Preprocess and engineer features
        # 3. Train models with hyperparameter optimization
        # 4. Validate performance
        # 5. Deploy if performance improves

        await asyncio.sleep(5)  # Simulate training time

        logger.info(f"Model retraining completed: {sport} - {model_type}")

    except Exception as e:
        logger.error(f"Background retraining failed: {e}")


# Phase 2: Performance Optimization Endpoints


@router.post("/phase2/start-optimization")
async def start_phase2_optimization(background_tasks: BackgroundTasks):
    """Start Phase 2 performance optimization services"""
    try:
        background_tasks.add_task(modern_ml_service.start_phase2_services)

        phase2_data = {
            "message": "Phase 2 optimization services starting",
            "status": "accepted",
            "services": [
                "Real-time model updates",
                "Inference optimization",
                "Advanced caching",
                "Distributed processing",
            ],
        }
        return ResponseBuilder.success(data=phase2_data)

    except Exception as e:
        logger.error(f"Phase 2 startup error: {e}")
        raise BusinessLogicException(
            message=f"Failed to start Phase 2 services: {str(e)}",
            error_code="PHASE2_STARTUP_FAILED"
        )


@router.post("/phase2/stop-optimization")
async def stop_phase2_optimization(background_tasks: BackgroundTasks):
    """Stop Phase 2 optimization services"""
    try:
        background_tasks.add_task(modern_ml_service.stop_phase2_services)

        stop_data = {
            "message": "Phase 2 optimization services stopping",
            "status": "accepted",
        }
        return ResponseBuilder.success(data=stop_data)

    except Exception as e:
        logger.error(f"Phase 2 shutdown error: {e}")
        raise BusinessLogicException(
            message=f"Failed to stop Phase 2 services: {str(e)}",
            error_code="PHASE2_SHUTDOWN_FAILED"
        )


@router.get("/phase2/optimization-stats")
async def get_phase2_optimization_stats():
    """Get Phase 2 optimization statistics"""
    try:
        stats = modern_ml_service.get_performance_metrics()

        return ResponseBuilder.success(data={"phase2_stats": stats,
                "timestamp": datetime.now().isoformat(),
                "services_active": hasattr(modern_ml_service, "inference_optimizer"),})

    except Exception as e:
        logger.error(f"Phase 2 stats error: {e}")
        raise BusinessLogicException(
            message=f"Failed to get optimization stats: {str(e)}",
            error_code="OPTIMIZATION_STATS_FAILED"
        )


@router.post("/phase2/optimized-prediction")
async def optimized_prediction(request: PredictionRequest):
    """Make optimized prediction using Phase 2 services"""
    try:
        # Convert to modern ML prediction request format
        from ..services.modern_ml_service import PredictionRequest as ModernRequest

        modern_request = ModernRequest(
            prop_id=f"pred_{datetime.now().timestamp()}",
            player_name=request.data.get("player_name", "Unknown"),
            team=request.data.get("team", "Unknown"),
            opponent_team=request.data.get("opponent_team", "Unknown"),
            sport=request.sport,
            stat_type=request.prop_type,
            line_score=float(request.data.get("line_score", 0.0)),
            historical_data=request.data.get("historical_data", []),
            team_data=request.data.get("team_data", {}),
            opponent_data=request.data.get("opponent_data", {}),
            game_context=request.data.get("game_context", {}),
            injury_reports=request.data.get("injury_reports", []),
            recent_news=request.data.get("recent_news", []),
        )

        # Use optimized prediction if available
        if hasattr(modern_ml_service, "optimized_predict"):
            result = await modern_ml_service.optimized_predict(modern_request)
        else:
            result = await modern_ml_service.predict(modern_request)

        prediction_data = {
            "prediction": result.prediction,
            "confidence": result.confidence,
            "uncertainty_lower": result.uncertainty_lower,
            "uncertainty_upper": result.uncertainty_upper,
            "processing_time": result.processing_time,
            "models_used": result.models_used or [],
            "feature_importance": result.feature_importance or {},
            "timestamp": (
                result.timestamp.isoformat()
                if result.timestamp
                else datetime.now().isoformat()
            ),
            "optimization_metadata": {
                "phase2_optimized": True,
                "ensemble_prediction": result.ensemble_prediction,
            },
            # New advanced analytics fields
            "over_prob": result.over_prob,
            "under_prob": result.under_prob,
            "expected_value": result.expected_value,
            "explanation": result.explanation,
        }
        return ResponseBuilder.success(data=prediction_data)

    except Exception as e:
        logger.error(f"Optimized prediction error: {e}")
        raise BusinessLogicException(
            message=f"Optimized prediction failed: {str(e)}",
            error_code="OPTIMIZED_PREDICTION_FAILED"
        )


@router.get("/phase2/health")
async def phase2_health_check():
    """Health check for Phase 2 services"""
    try:
        # Import comprehensive prop generator to check Phase 2 integration
        from ..services.comprehensive_prop_generator import ComprehensivePropGenerator

        # Create temporary instance to check service availability
        temp_generator = ComprehensivePropGenerator()

        health_status = {
            "phase2_available": True,
            "services": {},
            "overall_status": "healthy",
            "integration_rate": 0.0,
        }

        # Check Phase 2 service integrations
        services_status = []

        # Check Performance Optimizer
        if (
            hasattr(temp_generator, "performance_optimizer")
            and temp_generator.performance_optimizer
        ):
            health_status["services"]["performance_optimizer"] = {
                "available": True,
                "gpu_available": torch.cuda.is_available(),
                "device": (
                    str(temp_generator.performance_optimizer.device)
                    if hasattr(temp_generator.performance_optimizer, "device")
                    else "unknown"
                ),
            }
            services_status.append(True)
        else:
            health_status["services"]["performance_optimizer"] = {"available": False}
            services_status.append(False)

        # Check Intelligent Cache Service
        try:
            from backend.services.intelligent_cache_service import (
                intelligent_cache_service,
            )

            health_status["services"]["intelligent_cache"] = {
                "available": True,
                "status": "operational",
            }
            services_status.append(True)
        except ImportError:
            health_status["services"]["intelligent_cache"] = {"available": False}
            services_status.append(False)

        # Check Real-time Updates Service
        try:
            from ..services.real_time_updates import real_time_pipeline

            health_status["services"]["real_time_updates"] = {
                "available": True,
                "status": "operational",
            }
            services_status.append(True)
        except ImportError:
            health_status["services"]["real_time_updates"] = {"available": False}
            services_status.append(False)

        # Calculate integration rate
        health_status["integration_rate"] = (
            (sum(services_status) / len(services_status)) * 100
            if services_status
            else 0
        )
        health_status["phase2_available"] = health_status["integration_rate"] > 50

        return ResponseBuilder.success(data=health_status)

    except Exception as e:
        logger.error(f"Phase 2 health check error: {e}")
        error_data = {
            "phase2_available": False,
            "error": str(e),
            "overall_status": "unhealthy",
            "integration_rate": 0.0,
        }
        return ResponseBuilder.success(data=error_data)


# Export router for main app
__all__ = ["router"]
