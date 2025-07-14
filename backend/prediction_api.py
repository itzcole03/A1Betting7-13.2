"""
Real-Time Prediction API
PHASE 5: REAL-TIME PREDICTION ENGINE - API ENDPOINTS

FastAPI endpoints for the real-time prediction engine.
Provides REST API access to real-time predictions, explanations, and system health.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from dataclasses import asdict

# Import our real-time prediction engine
from services.real_time_prediction_engine import (
    real_time_prediction_engine, 
    RealTimePrediction, 
    PredictionSystemHealth,
    PredictionConfidence
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="A1Betting Real-Time Prediction API",
    description="PHASE 5: Real-time prediction engine with trained ML models",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["${process.env.REACT_APP_API_URL || "http://localhost:8000"}", "${process.env.REACT_APP_API_URL || "http://localhost:8000"}"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API responses
class PredictionResponse(BaseModel):
    """API response for predictions"""
    prop_id: str
    player_name: str
    stat_type: str
    line: float
    sport: str
    league: str
    game_time: str
    predicted_value: float
    prediction_probability: float
    confidence_level: str
    confidence_score: float
    primary_model: str
    ensemble_models: List[str]
    model_agreement: float
    shap_explanation: Dict[str, Any]
    key_factors: List[str]
    reasoning: str
    expected_value: float
    risk_score: float
    recommendation: str
    prediction_time: str
    data_freshness: float
    api_latency: float

class SystemHealthResponse(BaseModel):
    """API response for system health"""
    status: str
    models_loaded: int
    active_predictions: int
    api_latency_avg: float
    data_freshness_avg: float
    error_rate: float
    last_update: str

class PredictionRequest(BaseModel):
    """API request for predictions"""
    sport: Optional[str] = None
    limit: int = 20

# Global initialization flag
_engine_initialized = False

async def get_initialized_engine():
    """Dependency to ensure engine is initialized"""
    global _engine_initialized
    if not _engine_initialized:
        try:
            await real_time_prediction_engine.initialize()
            _engine_initialized = True
            logger.info("✅ Prediction engine initialized for API")
        except Exception as e:
            logger.error(f"❌ Engine initialization failed: {e}")
            raise HTTPException(status_code=503, detail="Prediction engine initialization failed")
    
    return real_time_prediction_engine


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("🚀 Starting Real-Time Prediction API...")
        await get_initialized_engine()
        logger.info("✅ Real-Time Prediction API started successfully")
        yield
    finally:
        try:
            await real_time_prediction_engine.close()
            logger.info("✅ Real-Time Prediction API shutdown complete")
        except Exception as e:
            logger.error(f"❌ API shutdown error: {e}")

app.router.lifespan_context = lifespan

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "A1Betting Real-Time Prediction API",
        "version": "1.0.0",
        "phase": "PHASE 5: REAL-TIME PREDICTION ENGINE",
        "status": "operational",
        "endpoints": {
            "predictions": "/api/predictions/prizepicks/live",
            "health": "/api/predictions/prizepicks/health",
            "explain": "/api/predictions/prizepicks/explain/{prop_id}",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "real-time-prediction-api"
    }

@app.post("/api/predictions/prizepicks/live", response_model=List[PredictionResponse])
async def get_live_predictions(
    request: PredictionRequest,
    engine = Depends(get_initialized_engine)
) -> List[PredictionResponse]:
    """
    Get real-time predictions for current props
    
    CRITICAL: All predictions generated from real trained models using real data.
    """
    try:
        start_time = datetime.now(timezone.utc)
        
        logger.info(f"🎯 API request for live predictions: sport={request.sport}, limit={request.limit}")
        
        # Generate predictions using the real-time engine
        predictions = await engine.generate_real_time_predictions(
            sport=request.sport,
            limit=request.limit
        )
        
        # Calculate API latency
        api_latency = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        # Convert to API response format
        response_predictions = []
        for pred in predictions:
            # Update API latency
            pred.api_latency = api_latency
            
            # Convert to response model
            response_pred = PredictionResponse(
                prop_id=pred.prop_id,
                player_name=pred.player_name,
                stat_type=pred.stat_type,
                line=pred.line,
                sport=pred.sport,
                league=pred.league,
                game_time=pred.game_time.isoformat(),
                predicted_value=pred.predicted_value,
                prediction_probability=pred.prediction_probability,
                confidence_level=pred.confidence_level.value,
                confidence_score=pred.confidence_score,
                primary_model=pred.primary_model,
                ensemble_models=pred.ensemble_models,
                model_agreement=pred.model_agreement,
                shap_explanation=pred.shap_explanation,
                key_factors=pred.key_factors,
                reasoning=pred.reasoning,
                expected_value=pred.expected_value,
                risk_score=pred.risk_score,
                recommendation=pred.recommendation,
                prediction_time=pred.prediction_time.isoformat(),
                data_freshness=pred.data_freshness,
                api_latency=pred.api_latency
            )
            response_predictions.append(response_pred)
        
        logger.info(f"✅ API response: {len(response_predictions)} predictions in {api_latency:.2f}s")
        
        return response_predictions
        
    except Exception as e:
        logger.error(f"❌ API error generating predictions: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction generation failed: {str(e)}")

@app.get("/api/predictions/prizepicks/live", response_model=List[PredictionResponse])
async def get_live_predictions_get(
    sport: Optional[str] = None,
    limit: int = 20,
    engine = Depends(get_initialized_engine)
) -> List[PredictionResponse]:
    """
    Get real-time predictions (GET method for easier frontend integration)
    """
    request = PredictionRequest(sport=sport, limit=limit)
    return await get_live_predictions(request, engine)

@app.get("/api/predictions/prizepicks/health", response_model=SystemHealthResponse)
async def get_system_health(
    engine = Depends(get_initialized_engine)
) -> SystemHealthResponse:
    """Get system health and performance metrics"""
    try:
        health = await engine.get_system_health()
        
        response = SystemHealthResponse(
            status=health.status,
            models_loaded=health.models_loaded,
            active_predictions=health.active_predictions,
            api_latency_avg=health.api_latency_avg,
            data_freshness_avg=health.data_freshness_avg,
            error_rate=health.error_rate,
            last_update=health.last_update.isoformat()
        )
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Error getting system health: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/predictions/prizepicks/explain/{prop_id}")
async def get_prediction_explanation(
    prop_id: str,
    engine = Depends(get_initialized_engine)
):
    """Get detailed explanation for a specific prediction"""
    try:
        # This would retrieve a specific prediction explanation
        # For now, return a general explanation structure
        
        explanation = {
            "prop_id": prop_id,
            "explanation_type": "SHAP",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Detailed SHAP explanation for specific predictions",
            "note": "This endpoint would provide detailed explanations for cached predictions"
        }
        
        return explanation
        
    except Exception as e:
        logger.error(f"❌ Error getting explanation for {prop_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")

@app.get("/api/predictions/prizepicks/models")
async def get_loaded_models(
    engine = Depends(get_initialized_engine)
):
    """Get information about loaded models"""
    try:
        models_info = []
        
        for model_id, metadata in engine.model_metadata.items():
            models_info.append({
                "model_id": model_id,
                "model_name": metadata.get("model_name", "unknown"),
                "loaded_at": metadata.get("loaded_at", datetime.now()).isoformat(),
                "feature_count": len(metadata.get("feature_names", [])),
                "status": "loaded"
            })
        
        return {
            "models_loaded": len(models_info),
            "models": models_info,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Model info failed: {str(e)}")

@app.get("/api/predictions/prizepicks/stats")
async def get_prediction_stats(
    engine = Depends(get_initialized_engine)
):
    """Get prediction statistics and performance metrics"""
    try:
        stats = {
            "total_predictions": engine.health_metrics.get('predictions_generated', 0),
            "total_api_calls": engine.health_metrics.get('api_calls', 0),
            "total_errors": engine.health_metrics.get('errors', 0),
            "uptime_seconds": (datetime.now(timezone.utc) - engine.health_metrics.get('start_time', datetime.now(timezone.utc))).total_seconds(),
            "models_loaded": len(engine.loaded_models),
            "cache_size": len(engine.prediction_cache),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Calculate derived metrics
        if stats["total_api_calls"] > 0:
            stats["error_rate"] = stats["total_errors"] / stats["total_api_calls"]
            stats["predictions_per_call"] = stats["total_predictions"] / stats["total_api_calls"]
        else:
            stats["error_rate"] = 0.0
            stats["predictions_per_call"] = 0.0
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error getting prediction stats: {e}")
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")

@app.post("/api/predictions/prizepicks/train")
async def trigger_model_training(
    background_tasks: BackgroundTasks,
    engine = Depends(get_initialized_engine)
):
    """Trigger model training in the background"""
    try:
        # Add model training task to background
        background_tasks.add_task(train_models_background)
        
        return {
            "message": "Model training initiated in background",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "training_started"
        }
        
    except Exception as e:
        logger.error(f"❌ Error triggering training: {e}")
        raise HTTPException(status_code=500, detail=f"Training trigger failed: {str(e)}")

async def train_models_background():
    """Background task for model training"""
    try:
        logger.info("🔄 Background model training started...")
        
        # Import here to avoid circular imports
        from services.real_ml_training_service import real_ml_training_service
        
        # Collect training data
        training_data = await real_ml_training_service.collect_real_training_data()
        
        if training_data and training_data.samples_count > 0:
            # Train models
            trained_models = await real_ml_training_service.train_real_models(training_data)
            logger.info(f"✅ Background training completed: {len(trained_models)} models")
            
            # Reload models in the prediction engine
            await real_time_prediction_engine._load_trained_models()
        else:
            logger.warning("⚠️ No training data available for background training")
        
    except Exception as e:
        logger.error(f"❌ Background training failed: {e}")

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Real-Time Prediction API server...")
    
    uvicorn.run(
        "prediction_api:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
        log_level="info"
    ) 