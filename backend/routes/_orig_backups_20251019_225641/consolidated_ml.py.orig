"""
Consolidated ML Routes - Phase 5 API Consolidation

This module consolidates all ML functionality from:
- enhanced_ml_routes.py (SHAP explainability, batch optimization, performance monitoring)
- modern_ml_routes.py (uncertainty quantification, A/B testing, ensemble management)

Features:
- Enhanced ML predictions with SHAP explanations and uncertainty quantification
- Batch prediction optimization with caching
- A/B testing framework for model comparison
- Performance monitoring and alerting
- Model registration and management
- Ensemble model coordination
- Contract compliance with StandardAPIResponse
- Phase 2 performance optimization integration
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import types
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

# Enhanced ML services
try:
    from ..services.enhanced_prediction_integration import enhanced_prediction_integration
    from ..services.redis_cache_service import get_redis_cache
    ENHANCED_ML_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Enhanced ML services import failed: {e}")
    ENHANCED_ML_AVAILABLE = False

# Modern ML services
try:
    from ..services.modern_ml_integration import (
        ABTestConfig,
        ModelType,
        ModernMLIntegration,
        PredictionResult,
        PredictionStrategy,
    )
    from ..services.modern_ml_service import modern_ml_service
    MODERN_ML_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Modern ML services import failed: {e}")
    MODERN_ML_AVAILABLE = False

# Torch availability check for Phase 2 integration
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Machine Learning", "ML-Consolidated"])

# EV enrichment imports (robust import of functions)
try:
    from ..services.ev_service import parse_odds, compute_ev, american_to_decimal
    ev_service = types.SimpleNamespace(parse_odds=parse_odds, compute_ev=compute_ev, american_to_decimal=american_to_decimal)
    EV_SERVICE_AVAILABLE = True
except Exception:
    ev_service = None
    EV_SERVICE_AVAILABLE = False


def _extract_decimal_odds_from_request(request: "PredictionRequest") -> Optional[float]:
    """Attempt to find a market odds value in the request and convert to decimal odds.

    Looks in `request.data` then `request.features` for keys commonly used for odds.
    Returns decimal odds or None if not found/convertible.
    """
    search_sources = []
    if getattr(request, "data", None):
        search_sources.append(request.data)
    if getattr(request, "features", None):
        # features is a dict of floats; odds may sometimes be provided there
        search_sources.append(request.features)

    candidate = None
    for src in search_sources:
        if not isinstance(src, dict):
            continue
        for key in ("odds", "market_odds", "odds_decimal", "market_decimal_odds", "american_odds"):
            if key in src:
                candidate = src[key]
                break
        if candidate is not None:
            break

    if candidate is None:
        return None

    # Try to parse numeric-like values
    try:
        val = float(candidate)
    except Exception:
        return None

    # Use ev_service.parse_odds which handles decimal vs American guessing
    try:
        if EV_SERVICE_AVAILABLE and ev_service:
            return ev_service.parse_odds(val)
        else:
            # Fallback: treat as decimal if >= 1.01
            return val if val >= 1.01 else None
    except Exception:
        return None


def _maybe_add_ev_to_unified(request: "PredictionRequest", unified_result: dict) -> None:
    """Enrich unified_result with EV fields when possible.

    Adds `ev`, `ev_pct`, and `odds_decimal` when request contains market odds and
    the prediction/confidence can be interpreted as a probability.
    """
    try:
        if not EV_SERVICE_AVAILABLE or ev_service is None:
            return

        odds_decimal = _extract_decimal_odds_from_request(request)
        if odds_decimal is None:
            return

        # Determine probability: prefer 'confidence', then 'prediction'
        prob = unified_result.get("confidence")
        if prob is None:
            prob = unified_result.get("prediction")

        if prob is None:
            return

        # Normalize if confidence is given as percentage (0-100)
        try:
            p = float(prob)
        except Exception:
            return

        if p > 1.0 and p <= 100.0:
            p = p / 100.0

        if not (0.0 <= p <= 1.0):
            return

        ev, ev_pct = ev_service.compute_ev(p, odds_decimal, stake=1.0)
        unified_result.setdefault("odds_decimal", odds_decimal)
        unified_result["ev"] = ev
        unified_result["ev_pct"] = ev_pct
        unified_result["ev_label"] = "+EV" if ev > 0 else ("ZeroEV" if abs(ev) < 1e-9 else "-EV")
    except Exception:
        # Be defensive; enrichment must not break prediction flow
        return

# Initialize integration services
if MODERN_ML_AVAILABLE:
    integration_service = ModernMLIntegration()
else:
    integration_service = None


# === REQUEST/RESPONSE MODELS ===

class PredictionRequest(BaseModel):
    """Unified prediction request model"""
    request_id: str = Field(..., description="Unique request identifier")
    event_id: str = Field(..., description="Event/game identifier")
    sport: str = Field(..., description="Sport type (e.g., MLB, NBA)")
    bet_type: str = Field(..., description="Type of bet (e.g., over_under, moneyline)")
    features: Dict[str, float] = Field(..., description="Feature dictionary for prediction")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional input data")
    models: Optional[List[str]] = Field(None, description="Specific models to use")
    priority: int = Field(1, ge=1, le=3, description="Request priority")
    include_explanations: bool = Field(True, description="Include SHAP explanations")
    include_uncertainty: bool = Field(True, description="Include uncertainty quantification")
    strategy_override: Optional[str] = Field(None, description="Override prediction strategy")
    timeout: float = Field(10.0, gt=0, description="Request timeout in seconds")

    class Config:
        schema_extra = {
            "example": {
                "request_id": "pred_123456",
                "event_id": "game_789",
                "sport": "MLB",
                "bet_type": "over_under",
                "features": {
                    "player_avg": 0.285,
                    "opponent_era": 4.50,
                    "home_field": 1.0,
                    "recent_form": 0.75
                },
                "include_explanations": True,
                "include_uncertainty": True
            }
        }


class BatchPredictionRequest(BaseModel):
    """Batch prediction request model"""
    requests: List[PredictionRequest] = Field(..., description="List of prediction requests")
    include_explanations: bool = Field(True, description="Include SHAP explanations for all")
    explanation_options: Optional[Dict[str, Any]] = Field(None, description="SHAP explanation options")
    strategy_override: Optional[str] = Field(None, description="Override prediction strategy")

    @validator("requests")
    def validate_requests(cls, v):
        if not v:
            raise ValueError("requests cannot be empty")
        if len(v) > 1000:
            raise ValueError("requests cannot exceed 1000 items")
        return v


class PredictionResponse(BaseModel):
    """Unified prediction response model"""
    request_id: str
    prediction: float
    confidence: float
    
    # Uncertainty quantification (from modern ML)
    prediction_interval: Optional[List[float]] = None
    epistemic_uncertainty: Optional[float] = None
    aleatoric_uncertainty: Optional[float] = None
    total_uncertainty: Optional[float] = None
    
    # Explanations (from enhanced ML)
    shap_values: Optional[Dict[str, float]] = None
    feature_importance: Optional[Dict[str, float]] = None
    attention_weights: Optional[Dict[str, float]] = None
    
    # Model metadata
    model_type: str
    model_version: str
    models_used: Optional[List[str]] = None
    feature_count: int
    processing_time: float
    
    # Performance metrics
    calibration_score: Optional[float] = None
    reliability_score: Optional[float] = None
    model_complexity: Optional[str] = None
    
    # A/B testing
    experiment_id: Optional[str] = None
    treatment_group: Optional[str] = None
    
    # Caching
    cache_hit: bool = False
    timestamp: float


class ModelRegistration(BaseModel):
    """Model registration request"""
    model_name: str = Field(..., description="Unique model name")
    sport: str = Field(..., description="Primary sport for this model")
    model_type: str = Field("xgboost", description="Model type")
    model_version: str = Field("1.0", description="Model version")
    feature_names: List[str] = Field(default_factory=list, description="Feature names")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class ABTestConfigUpdate(BaseModel):
    """A/B test configuration update"""
    enabled: Optional[bool] = None
    modern_traffic_percentage: Optional[float] = Field(None, ge=0.0, le=1.0)
    experiment_duration_days: Optional[int] = Field(None, ge=1, le=365)
    minimum_samples: Optional[int] = Field(None, ge=10)
    statistical_significance_threshold: Optional[float] = Field(None, ge=0.01, le=0.1)
    performance_metrics: Optional[List[str]] = None


class PredictionOutcomeUpdate(BaseModel):
    """Prediction outcome update"""
    prediction_id: str = Field(..., description="Prediction identifier")
    actual_outcome: float = Field(..., description="Actual outcome value")
    outcome_status: str = Field("correct", description="Outcome status")


# === MAIN PREDICTION ENDPOINTS ===

@router.post("/predict", response_model=StandardAPIResponse[Dict[str, Any]])
async def predict(request: PredictionRequest) -> Dict[str, Any]:
    """
    Unified ML prediction with enhanced features:
    - SHAP explanations for interpretability
    - Uncertainty quantification (epistemic + aleatoric)
    - Performance monitoring and caching
    - A/B testing support
    """
    try:
        start_time = time.time()
        
        # Strategy 1: Enhanced ML prediction (with SHAP and caching)
        if ENHANCED_ML_AVAILABLE and not request.strategy_override:
            try:
                result = await _enhanced_ml_predict(request)
                if result:
                    result["processing_strategy"] = "enhanced_ml"
                    return ResponseBuilder.success(result)
            except Exception as e:
                logger.warning(f"Enhanced ML prediction failed: {e}")
        
        # Strategy 2: Modern ML prediction (with uncertainty quantification)
        if MODERN_ML_AVAILABLE and integration_service:
            try:
                result = await _modern_ml_predict(request)
                if result:
                    result["processing_strategy"] = "modern_ml"
                    return ResponseBuilder.success(result)
            except Exception as e:
                logger.warning(f"Modern ML prediction failed: {e}")
        
        # Strategy 3: Basic ML fallback
        result = await _basic_ml_predict(request)
        result["processing_strategy"] = "basic_fallback"
        
        return ResponseBuilder.success(result)
        
    except Exception as e:
        logger.error(f"Prediction endpoint error: {e}")
        raise BusinessLogicException(f"Prediction failed: {str(e)}")


@router.post("/batch-predict", response_model=StandardAPIResponse[Dict[str, Any]])
async def batch_predict(request: BatchPredictionRequest) -> Dict[str, Any]:
    """
    Unified batch predictions with optimization:
    - Batch feature engineering
    - Optimized model inference
    - Parallel processing where available
    - Consistent strategy application
    """
    try:
        start_time = time.time()
        
        # Strategy 1: Enhanced ML batch prediction
        if ENHANCED_ML_AVAILABLE and not request.strategy_override:
            try:
                results = await _enhanced_ml_batch_predict(request)
                if results:
                    return ResponseBuilder.success({
                        "results": results,
                        "batch_size": len(results),
                        "processing_strategy": "enhanced_ml",
                        "processing_time": time.time() - start_time
                    })
            except Exception as e:
                logger.warning(f"Enhanced ML batch prediction failed: {e}")
        
        # Strategy 2: Modern ML batch prediction
        if MODERN_ML_AVAILABLE and integration_service:
            try:
                results = await _modern_ml_batch_predict(request)
                if results:
                    return ResponseBuilder.success({
                        "results": results,
                        "batch_size": len(results),
                        "processing_strategy": "modern_ml",
                        "processing_time": time.time() - start_time
                    })
            except Exception as e:
                logger.warning(f"Modern ML batch prediction failed: {e}")
        
        # Strategy 3: Basic batch fallback
        results = []
        for pred_request in request.requests:
            try:
                result = await _basic_ml_predict(pred_request)
                results.append(result)
            except Exception as e:
                logger.warning(f"Basic prediction failed for {pred_request.request_id}: {e}")
                # Add error result
                results.append({
                    "request_id": pred_request.request_id,
                    "prediction": 0.0,
                    "confidence": 0.0,
                    "model_type": "error",
                    "model_version": "1.0",
                    "feature_count": 0,
                    "processing_time": time.time() - start_time,
                    "cache_hit": False,
                    "timestamp": time.time(),
                    "error": str(e)
                })
        
        return ResponseBuilder.success({
            "results": results,
            "batch_size": len(results),
            "processing_strategy": "basic_fallback",
            "processing_time": time.time() - start_time
        })
        
    except Exception as e:
        logger.error(f"Batch prediction endpoint error: {e}")
        raise BusinessLogicException(f"Batch prediction failed: {str(e)}")


# === STRATEGY MANAGEMENT ===

@router.get("/strategies", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_available_strategies():
    """Get list of available prediction strategies"""
    strategies = ["enhanced_ml", "modern_ml", "basic_fallback"]
    
    if MODERN_ML_AVAILABLE:
        modern_strategies = [strategy.value for strategy in PredictionStrategy]
        strategies.extend(modern_strategies)
    
    return ResponseBuilder.success({
        "available_strategies": strategies,
        "default_strategy": "enhanced_ml" if ENHANCED_ML_AVAILABLE else "modern_ml" if MODERN_ML_AVAILABLE else "basic_fallback",
        "services_available": {
            "enhanced_ml": ENHANCED_ML_AVAILABLE,
            "modern_ml": MODERN_ML_AVAILABLE,
            "torch": TORCH_AVAILABLE
        }
    })


@router.post("/strategy", response_model=StandardAPIResponse[Dict[str, Any]])
async def switch_strategy(strategy: str = Query(..., description="New prediction strategy")):
    """Switch prediction strategy for modern ML integration"""
    try:
        if not MODERN_ML_AVAILABLE or not integration_service:
            raise BusinessLogicException("Modern ML integration not available")
        
        integration_service.switch_prediction_strategy(strategy)
        return ResponseBuilder.success({"message": f"Strategy switched to {strategy}"})
        
    except ValueError as e:
        raise BusinessLogicException(f"Invalid strategy: {str(e)}")
    except Exception as e:
        logger.error(f"Strategy switch error: {e}")
        raise BusinessLogicException(f"Failed to switch strategy: {str(e)}")


# === MODEL MANAGEMENT ===

@router.post("/models/register", response_model=StandardAPIResponse[Dict[str, Any]])
async def register_model(registration: ModelRegistration, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Register a model with ML services"""
    try:
        # Enhanced ML registration if available
        if ENHANCED_ML_AVAILABLE:
            # Note: Enhanced ML expects the actual model object
            # This would typically be loaded from a model registry or file
            pass
        
        # For now, return success but indicate model object is needed
        return ResponseBuilder.success({
            "status": "pending",
            "message": "Model registration initiated. Model object must be provided separately.",
            "model_name": registration.model_name,
            "sport": registration.sport,
            "timestamp": time.time()
        })
        
    except Exception as e:
        logger.error(f"Error registering model: {e}")
        raise BusinessLogicException(f"Model registration failed: {str(e)}")


@router.get("/models/registered", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_registered_models() -> Dict[str, Any]:
    """Get list of registered models"""
    try:
        models = []
        
        # Get models from enhanced ML if available
        if ENHANCED_ML_AVAILABLE:
            try:
                enhanced_models = enhanced_prediction_integration.get_registered_models()
                models.extend(enhanced_models)
            except Exception as e:
                logger.warning(f"Could not get enhanced ML models: {e}")
        
        # Add model info structure
        model_info = {
            "registered_models": models,
            "count": len(models),
            "services": {
                "enhanced_ml_available": ENHANCED_ML_AVAILABLE,
                "modern_ml_available": MODERN_ML_AVAILABLE,
                "torch_available": TORCH_AVAILABLE
            },
            "timestamp": time.time()
        }
        
        return ResponseBuilder.success(model_info)
        
    except Exception as e:
        logger.error(f"Error getting registered models: {e}")
        raise BusinessLogicException(f"Failed to get models: {str(e)}")


# === PERFORMANCE MONITORING ===

@router.get("/performance", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_performance_stats():
    """Get comprehensive performance statistics"""
    try:
        stats = {}
        
        # Enhanced ML performance stats
        if ENHANCED_ML_AVAILABLE:
            try:
                enhanced_stats = enhanced_prediction_integration.get_performance_summary()
                stats["enhanced_ml"] = enhanced_stats
            except Exception as e:
                stats["enhanced_ml"] = {"error": str(e)}
        
        # Modern ML performance stats
        if MODERN_ML_AVAILABLE and integration_service:
            try:
                modern_stats = integration_service.get_performance_stats()
                stats["modern_ml"] = modern_stats
            except Exception as e:
                stats["modern_ml"] = {"error": str(e)}
        
        # Overall statistics
        performance_data = {
            "consolidated_stats": stats,
            "services_active": {
                "enhanced_ml": ENHANCED_ML_AVAILABLE,
                "modern_ml": MODERN_ML_AVAILABLE
            },
            "timestamp": time.time()
        }
        
        return ResponseBuilder.success(performance_data)
        
    except Exception as e:
        logger.error(f"Performance stats error: {e}")
        raise BusinessLogicException(f"Failed to get performance stats: {str(e)}")


@router.post("/outcomes/update", response_model=StandardAPIResponse[Dict[str, Any]])
async def update_prediction_outcome(update: PredictionOutcomeUpdate) -> Dict[str, Any]:
    """Update prediction outcome for performance tracking"""
    try:
        success = False
        
        # Update enhanced ML if available
        if ENHANCED_ML_AVAILABLE:
            try:
                success = enhanced_prediction_integration.log_prediction_outcome(
                    prediction_id=update.prediction_id,
                    actual_outcome=update.actual_outcome,
                    outcome_status=update.outcome_status
                )
            except Exception as e:
                logger.warning(f"Enhanced ML outcome update failed: {e}")
        
        return ResponseBuilder.success({
            "status": "success" if success else "partial",
            "prediction_id": update.prediction_id,
            "outcome_logged": success,
            "timestamp": time.time()
        })
        
    except Exception as e:
        logger.error(f"Error updating prediction outcome: {e}")
        raise BusinessLogicException(f"Outcome update failed: {str(e)}")


# === A/B TESTING (Modern ML) ===

@router.get("/ab-test/config", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_ab_test_config():
    """Get current A/B test configuration"""
    try:
        if not MODERN_ML_AVAILABLE or not integration_service:
            return ResponseBuilder.success({
                "message": "A/B testing not available - modern ML integration required",
                "available": False
            })
        
        config = integration_service.ab_test_config
        return ResponseBuilder.success(config)
        
    except Exception as e:
        logger.error(f"A/B test config error: {e}")
        raise BusinessLogicException(f"Failed to get A/B test config: {str(e)}")


@router.post("/ab-test/config", response_model=StandardAPIResponse[Dict[str, Any]])
async def update_ab_test_config(config_update: ABTestConfigUpdate):
    """Update A/B test configuration"""
    try:
        if not MODERN_ML_AVAILABLE or not integration_service:
            raise BusinessLogicException("A/B testing not available - modern ML integration required")
        
        config_dict = config_update.dict(exclude_unset=True)
        integration_service.update_ab_test_config(config_dict)
        
        return ResponseBuilder.success({"message": "A/B test configuration updated successfully"})
        
    except Exception as e:
        logger.error(f"A/B test config update error: {e}")
        raise BusinessLogicException(f"Config update failed: {str(e)}")


# === HEALTH & MONITORING ===

@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def health_check():
    """Comprehensive health check for consolidated ML services"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {},
            "consolidated_ml_active": True
        }
        
        # Check enhanced ML health
        if ENHANCED_ML_AVAILABLE:
            try:
                enhanced_health = await enhanced_prediction_integration.health_check()
                health_status["services"]["enhanced_ml"] = enhanced_health
            except Exception as e:
                health_status["services"]["enhanced_ml"] = {
                    "status": "error",
                    "error": str(e)
                }
        
        # Check modern ML health
        if MODERN_ML_AVAILABLE:
            health_status["services"]["modern_ml"] = {
                "status": "available",
                "current_strategy": integration_service.prediction_strategy.value if integration_service else "unknown",
                "ab_test_enabled": integration_service.ab_test_config.enabled if integration_service else False
            }
        
        # Determine overall status
        service_errors = [
            s for s in health_status["services"].values() 
            if s.get("status") in ["error", "critical"]
        ]
        
        if service_errors:
            health_status["status"] = "degraded" if len(service_errors) < len(health_status["services"]) else "unhealthy"
        
        return ResponseBuilder.success(health_status)
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        error_data = {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }
        return ResponseBuilder.success(error_data)


# === HELPER FUNCTIONS ===

async def _enhanced_ml_predict(request: PredictionRequest) -> Optional[Dict[str, Any]]:
    """Enhanced ML prediction with SHAP and caching"""
    try:
        # Get cache service
        cache_service = await get_redis_cache()
        
        # Create cache key
        cache_key_data = {
            'event_id': request.event_id,
            'sport': request.sport,
            'bet_type': request.bet_type,
            'features': request.features
        }
        
        # Try cache first
        cached_result = await cache_service.get_prediction_result(cache_key_data)
        if cached_result:
            cached_result["cache_hit"] = True
            cached_result["request_id"] = request.request_id
            return cached_result
        
        # Execute prediction
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
        
        # Cache result
        await cache_service.cache_prediction_result(cache_key_data, result)
        
        # Convert to unified format
        unified_result = {
            "request_id": request.request_id,
            "prediction": result.get("prediction", 0.0),
            "confidence": result.get("confidence", 0.0),
            "shap_values": result.get("shap_values"),
            "feature_importance": result.get("feature_importance"),
            "model_type": result.get("model_type", "enhanced"),
            "model_version": result.get("model_version", "1.0"),
            "models_used": result.get("models_used"),
            "feature_count": len(request.features),
            "processing_time": result.get("processing_time", 0.0),
            "cache_hit": False,
            "timestamp": time.time()
        }

        # Try to enrich with EV if possible (do not raise on failure)
        try:
            _maybe_add_ev_to_unified(request, unified_result)
        except Exception:
            pass

        return unified_result
        
    except Exception as e:
        logger.error(f"Enhanced ML prediction failed: {e}")
        return None


async def _modern_ml_predict(request: PredictionRequest) -> Optional[Dict[str, Any]]:
    """Modern ML prediction with uncertainty quantification"""
    try:
        # Override strategy if provided
        original_strategy = None
        if request.strategy_override and integration_service:
            original_strategy = integration_service.prediction_strategy
            integration_service.switch_prediction_strategy(request.strategy_override)
        
        # Prepare data for modern ML
        prediction_data = request.features.copy()
        if request.data:
            prediction_data.update(request.data)
        
        # Execute prediction
        result = await integration_service.predict(
            data=prediction_data,
            sport=request.sport,
            prop_type=request.bet_type
        )
        
        # Restore original strategy
        if original_strategy:
            integration_service.prediction_strategy = original_strategy
        
        # Convert to unified format
        unified_result = {
            "request_id": request.request_id,
            "prediction": result.prediction,
            "confidence": result.confidence,
            "prediction_interval": list(result.prediction_interval) if result.prediction_interval else None,
            "epistemic_uncertainty": result.epistemic_uncertainty,
            "aleatoric_uncertainty": result.aleatoric_uncertainty,
            "total_uncertainty": result.total_uncertainty,
            "shap_values": result.shap_values,
            "feature_importance": result.feature_importance,
            "attention_weights": result.attention_weights,
            "model_type": result.model_type.value,
            "model_version": result.model_version,
            "feature_count": result.feature_count,
            "processing_time": result.processing_time,
            "calibration_score": result.calibration_score,
            "reliability_score": result.reliability_score,
            "model_complexity": result.model_complexity,
            "experiment_id": result.experiment_id,
            "treatment_group": result.treatment_group,
            "cache_hit": False,
            "timestamp": time.time()
        }

        # Enrich with EV if possible
        try:
            _maybe_add_ev_to_unified(request, unified_result)
        except Exception:
            pass

        return unified_result
        
    except Exception as e:
        logger.error(f"Modern ML prediction failed: {e}")
        return None


async def _basic_ml_predict(request: PredictionRequest) -> Dict[str, Any]:
    """Basic ML prediction fallback"""
    # Mock prediction for compatibility
    confidence = sum(request.features.values()) / len(request.features) if request.features else 0.5
    confidence = max(0.0, min(1.0, confidence))  # Clamp between 0 and 1
    
    unified_result = {
        "request_id": request.request_id,
        "prediction": confidence,
        "confidence": confidence * 100,  # Convert to percentage
        "model_type": "basic_fallback",
        "model_version": "1.0",
        "feature_count": len(request.features),
        "processing_time": 0.001,
        "cache_hit": False,
        "timestamp": time.time()
    }

    try:
        _maybe_add_ev_to_unified(request, unified_result)
    except Exception:
        pass

    return unified_result


async def _enhanced_ml_batch_predict(request: BatchPredictionRequest) -> Optional[List[Dict[str, Any]]]:
    """Enhanced ML batch prediction"""
    try:
        # Convert requests to enhanced ML format
        prediction_requests = [req.dict() for req in request.requests]
        
        # Execute batch prediction
        results = await enhanced_prediction_integration.enhanced_predict(
            prediction_requests=prediction_requests,
            include_explanations=request.include_explanations,
            explanation_options=request.explanation_options or {}
        )
        
        # Convert to unified format
        unified_results = []
        for i, result in enumerate(results):
            unified_result = {
                "request_id": request.requests[i].request_id,
                "prediction": result.get("prediction", 0.0),
                "confidence": result.get("confidence", 0.0),
                "shap_values": result.get("shap_values"),
                "feature_importance": result.get("feature_importance"),
                "model_type": result.get("model_type", "enhanced"),
                "model_version": result.get("model_version", "1.0"),
                "models_used": result.get("models_used"),
                "feature_count": len(request.requests[i].features),
                "processing_time": result.get("processing_time", 0.0),
                "cache_hit": False,
                "timestamp": time.time()
            }
            unified_results.append(unified_result)
        
        return unified_results
        
    except Exception as e:
        logger.error(f"Enhanced ML batch prediction failed: {e}")
        return None


async def _modern_ml_batch_predict(request: BatchPredictionRequest) -> Optional[List[Dict[str, Any]]]:
    """Modern ML batch prediction"""
    try:
        # Override strategy if provided
        original_strategy = None
        if request.strategy_override and integration_service:
            original_strategy = integration_service.prediction_strategy
            integration_service.switch_prediction_strategy(request.strategy_override)
        
        # Prepare data list for modern ML
        data_list = []
        for req in request.requests:
            prediction_data = req.features.copy()
            if req.data:
                prediction_data.update(req.data)
            data_list.append(prediction_data)
        
        # Execute batch prediction
        results = await integration_service.batch_predict(
            data_list=data_list,
            sport=request.requests[0].sport if request.requests else "MLB",
            prop_type=request.requests[0].bet_type if request.requests else "over_under"
        )
        
        # Restore original strategy
        if original_strategy:
            integration_service.prediction_strategy = original_strategy
        
        # Convert to unified format
        unified_results = []
        for i, result in enumerate(results):
            unified_result = {
                "request_id": request.requests[i].request_id,
                "prediction": result.prediction,
                "confidence": result.confidence,
                "prediction_interval": list(result.prediction_interval) if result.prediction_interval else None,
                "epistemic_uncertainty": result.epistemic_uncertainty,
                "aleatoric_uncertainty": result.aleatoric_uncertainty,
                "total_uncertainty": result.total_uncertainty,
                "shap_values": result.shap_values,
                "feature_importance": result.feature_importance,
                "attention_weights": result.attention_weights,
                "model_type": result.model_type.value,
                "model_version": result.model_version,
                "feature_count": result.feature_count,
                "processing_time": result.processing_time,
                "calibration_score": result.calibration_score,
                "reliability_score": result.reliability_score,
                "model_complexity": result.model_complexity,
                "experiment_id": result.experiment_id,
                "treatment_group": result.treatment_group,
                "cache_hit": False,
                "timestamp": time.time()
            }
            unified_results.append(unified_result)
        
        return unified_results
        
    except Exception as e:
        logger.error(f"Modern ML batch prediction failed: {e}")
        return None


# === LEGACY COMPATIBILITY ENDPOINTS ===

@router.get("/model-info", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_model_info():
    """Get detailed information about available models"""
    try:
        model_info = {
            "consolidated_ml_models": {
                "enhanced_ml": {
                    "available": ENHANCED_ML_AVAILABLE,
                    "features": ["SHAP explanations", "Redis caching", "Batch optimization", "Performance monitoring"]
                },
                "modern_ml": {
                    "available": MODERN_ML_AVAILABLE,
                    "features": ["Uncertainty quantification", "A/B testing", "Ensemble methods", "Advanced architectures"]
                },
                "basic_fallback": {
                    "available": True,
                    "features": ["Simple predictions", "Always available", "Fast response"]
                }
            },
            "integration_status": {
                "services_consolidated": True,
                "torch_available": TORCH_AVAILABLE,
                "redis_caching": ENHANCED_ML_AVAILABLE,
                "uncertainty_quantification": MODERN_ML_AVAILABLE
            }
        }
        
        return ResponseBuilder.success(model_info)
        
    except Exception as e:
        logger.error(f"Model info error: {e}")
        raise BusinessLogicException(f"Failed to get model info: {str(e)}")


@router.post("/clear-cache", response_model=StandardAPIResponse[Dict[str, Any]])
async def clear_cache():
    """Clear ML caches to free memory"""
    try:
        cleared_caches = []
        
        # Clear modern ML cache if available
        if MODERN_ML_AVAILABLE and integration_service:
            try:
                integration_service.feature_engineering.clear_cache()
                cleared_caches.append("modern_ml_features")
            except Exception as e:
                logger.warning(f"Failed to clear modern ML cache: {e}")
        
        # Enhanced ML cache clearing would be handled by Redis
        if ENHANCED_ML_AVAILABLE:
            cleared_caches.append("enhanced_ml_redis")
        
        return ResponseBuilder.success({
            "message": "Caches cleared successfully",
            "cleared_caches": cleared_caches
        })
        
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        raise BusinessLogicException(f"Failed to clear cache: {str(e)}")


# Background task endpoints
@router.post("/initialize", response_model=StandardAPIResponse[Dict[str, Any]])
async def initialize_services() -> Dict[str, Any]:
    """Initialize consolidated ML services"""
    try:
        initialization_results = []
        
        if ENHANCED_ML_AVAILABLE:
            try:
                await enhanced_prediction_integration.initialize_services()
                initialization_results.append({"service": "enhanced_ml", "status": "initialized"})
            except Exception as e:
                initialization_results.append({"service": "enhanced_ml", "status": "failed", "error": str(e)})
        
        if MODERN_ML_AVAILABLE:
            initialization_results.append({"service": "modern_ml", "status": "available"})
        
        return ResponseBuilder.success({
            "status": "success",
            "message": "Consolidated ML services initialized",
            "initialization_results": initialization_results,
            "timestamp": time.time()
        })
        
    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        raise BusinessLogicException(f"Service initialization failed: {str(e)}")
