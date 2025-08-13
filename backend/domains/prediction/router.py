"""
Unified Prediction Domain Router

RESTful API endpoints for all prediction operations.
Consolidates prediction routes into a logical, maintainable structure.
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.responses import JSONResponse

from .models import (
    BatchPredictionRequest,
    ExplanationResponse,
    HealthResponse,
    ModelPerformanceMetrics,
    ModelType,
    PredictionError,
    PredictionRequest,
    PredictionResponse,
    PropType,
    QuantumOptimizationRequest,
    QuantumOptimizationResponse,
    Sport,
)
from .service import UnifiedPredictionService

logger = logging.getLogger(__name__)

# Create router
prediction_router = APIRouter(
    prefix="/api/v1/predictions",
    tags=["predictions"],
    responses={
        404: {"model": PredictionError, "description": "Not found"},
        500: {"model": PredictionError, "description": "Internal server error"},
    },
)


# Service dependency
async def get_prediction_service() -> UnifiedPredictionService:
    """Get prediction service instance"""
    service = UnifiedPredictionService()
    if not service.is_initialized:
        await service.initialize()
    return service


@prediction_router.get("/health", response_model=HealthResponse)
async def health_check(
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Check prediction service health
    """
    try:
        return await service.health_check()
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


@prediction_router.post("/", response_model=PredictionResponse)
async def create_prediction(
    request: PredictionRequest,
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Generate a single prediction

    **Request Body:**
    - **player_name**: Name of the player
    - **sport**: Sport type (mlb, nba, nfl, nhl)
    - **prop_type**: Type of prop bet
    - **line_score**: Betting line value
    - **game_date**: Optional game date
    - **opponent**: Optional opponent team

    **Returns:**
    - Complete prediction with confidence, recommendations, and explanations
    """
    try:
        return await service.predict(request)
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@prediction_router.post("/batch", response_model=List[PredictionResponse])
async def create_batch_predictions(
    request: BatchPredictionRequest,
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Generate batch predictions

    **Request Body:**
    - **predictions**: List of prediction requests
    - **include_explanations**: Whether to include SHAP explanations
    - **model_type**: Optional preferred model type

    **Returns:**
    - List of predictions
    """
    try:
        return await service.predict_batch(request)
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Batch prediction failed: {str(e)}"
        )


@prediction_router.get("/", response_model=List[PredictionResponse])
async def list_predictions(
    sport: Optional[Sport] = Query(None, description="Filter by sport"),
    prop_type: Optional[PropType] = Query(None, description="Filter by prop type"),
    player_name: Optional[str] = Query(None, description="Filter by player name"),
    limit: int = Query(20, ge=1, le=100, description="Number of predictions to return"),
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    List recent predictions with optional filters

    **Query Parameters:**
    - **sport**: Filter by sport type
    - **prop_type**: Filter by prop bet type
    - **player_name**: Filter by player name
    - **limit**: Maximum number of results (1-100)

    **Returns:**
    - List of recent predictions matching filters
    """
    try:
        # This would typically query a database
        # For now, return empty list as this is a new service
        return []
    except Exception as e:
        logger.error(f"List predictions failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to list predictions")


@prediction_router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: str = Path(..., description="Prediction ID"),
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Get a specific prediction by ID

    **Path Parameters:**
    - **prediction_id**: Unique prediction identifier

    **Returns:**
    - Complete prediction details
    """
    try:
        # Try to get cached prediction
        cached_prediction = await service._get_cached_prediction(prediction_id)

        if not cached_prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")

        return cached_prediction
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get prediction")


@prediction_router.get("/sports/{sport}", response_model=List[PredictionResponse])
async def get_sport_predictions(
    sport: Sport = Path(..., description="Sport type"),
    prop_type: Optional[PropType] = Query(None, description="Filter by prop type"),
    limit: int = Query(20, ge=1, le=100, description="Number of predictions to return"),
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Get predictions for a specific sport

    **Path Parameters:**
    - **sport**: Sport type (mlb, nba, nfl, nhl)

    **Query Parameters:**
    - **prop_type**: Optional prop type filter
    - **limit**: Maximum number of results

    **Returns:**
    - List of sport-specific predictions
    """
    try:
        # This would typically query sport-specific predictions
        return []
    except Exception as e:
        logger.error(f"Get sport predictions failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sport predictions")


@prediction_router.get("/explain/{prediction_id}", response_model=ExplanationResponse)
async def explain_prediction(
    prediction_id: str = Path(..., description="Prediction ID"),
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Get SHAP explanation for a prediction

    **Path Parameters:**
    - **prediction_id**: Prediction ID to explain

    **Returns:**
    - SHAP explanation with feature importance and reasoning
    """
    try:
        return await service.explain_prediction(prediction_id)
    except Exception as e:
        logger.error(f"Explanation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")


@prediction_router.post("/optimize/quantum", response_model=QuantumOptimizationResponse)
async def quantum_optimization(
    request: QuantumOptimizationRequest,
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Perform quantum-inspired portfolio optimization

    **Request Body:**
    - **predictions**: List of predictions to optimize
    - **portfolio_size**: Desired portfolio size (default: 5)
    - **risk_tolerance**: Risk tolerance level 0-1 (default: 0.5)
    - **max_allocation**: Maximum allocation per bet (default: 0.2)

    **Returns:**
    - Optimized portfolio allocation with quantum advantages
    """
    try:
        return await service.optimize_quantum(request)
    except Exception as e:
        logger.error(f"Quantum optimization failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Quantum optimization failed: {str(e)}"
        )


@prediction_router.get(
    "/models/performance", response_model=List[ModelPerformanceMetrics]
)
async def get_model_performance(
    model_type: Optional[str] = Query(None, description="Specific model type"),
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Get model performance metrics

    **Query Parameters:**
    - **model_type**: Optional specific model type filter

    **Returns:**
    - List of model performance metrics
    """
    try:
        return await service.get_model_performance(model_type)
    except Exception as e:
        logger.error(f"Get model performance failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get model performance")


@prediction_router.post("/models/retrain")
async def retrain_models(
    model_type: Optional[str] = Query(None, description="Specific model to retrain"),
    service: UnifiedPredictionService = Depends(get_prediction_service),
):
    """
    Trigger model retraining (admin operation)

    **Query Parameters:**
    - **model_type**: Optional specific model to retrain

    **Returns:**
    - Retraining status
    """
    try:
        # This would trigger actual model retraining
        return {"status": "retraining_started", "model_type": model_type or "all"}
    except Exception as e:
        logger.error(f"Model retraining failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to start retraining")
