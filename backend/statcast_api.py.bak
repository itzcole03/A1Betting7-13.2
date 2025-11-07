"""
Statcast Projection API Endpoints

This module provides FastAPI endpoints for accessing advanced Statcast-based
player projections and enhanced ML analysis capabilities.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, Field

from .services.stat_projection_models import ProjectionResult

# Local imports
from .services.statcast_ml_integration import StatcastMLIntegration

logger = logging.getLogger("statcast_api")

# Initialize the integration service
statcast_integration = StatcastMLIntegration()


# Pydantic models for API
class PlayerProjectionRequest(BaseModel):
    player_name: str = Field(..., description="Player name")
    player_id: Optional[str] = Field(None, description="Optional player ID")
    stat_type: str = Field("home_runs", description="Type of statistic to project")
    games_to_project: int = Field(
        162, description="Number of games to project", ge=1, le=162
    )


class BatchProjectionRequest(BaseModel):
    players: List[Dict[str, str]] = Field(..., description="List of player information")
    games_to_project: int = Field(
        162, description="Number of games to project", ge=1, le=162
    )


class ProjectionResponse(BaseModel):
    player_name: str
    stat_type: str
    projected_value: float
    confidence_score: float
    confidence_interval: tuple
    contributing_factors: Dict[str, float]
    model_consensus: Dict[str, float]
    games_projected: int
    timestamp: str


class EnhancedAnalysisResponse(BaseModel):
    player_name: str
    analysis_type: str
    statcast_projection: Optional[Dict[str, Any]]
    betting_analysis: Optional[Dict[str, Any]]
    combined_insights: Dict[str, Any]
    data_quality: Dict[str, Any]
    timestamp: str


class ConfidenceAnalysisResponse(BaseModel):
    player_name: str
    stat_type: str
    projection: Dict[str, Any]
    confidence_factors: Dict[str, Any]
    model_consensus: Dict[str, Any]
    historical_accuracy: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    recommendations: List[str]


class BettingValueResponse(BaseModel):
    player_name: str
    stat_type: str
    projection: float
    betting_line: float
    confidence: float
    edge_analysis: Dict[str, Any]
    recommendation: str
    prop_details: Dict[str, Any]


# API Router
router = APIRouter(prefix="/api/statcast", tags=["Statcast Projections"])


# Startup event removed to prevent blocking - Statcast initialization happens lazily
# @router.on_event("startup")
# async def startup_event():
#     """Initialize models on startup - using lazy initialization to prevent blocking"""
#     logger.info("🚀 Starting Statcast API initialization (lazy mode)")
#     try:
#         # Initialize models in background without blocking startup
#         asyncio.create_task(statcast_integration.initialize_models_async())
#         logger.info("✅ Statcast models scheduled for background initialization")
#     except Exception as e:
#         logger.error(f"❌ Failed to schedule Statcast models initialization: {e}")


@router.post("/projection/player", response_model=ProjectionResponse)
async def get_player_projection(request: PlayerProjectionRequest):
    """
    Get advanced Statcast-based projection for a single player
    """
    logger.info(
        f"📊 Player projection request: {request.player_name} - {request.stat_type}"
    )

    try:
        # Get enhanced analysis
        analysis = await statcast_integration.get_enhanced_player_analysis(
            player_name=request.player_name,
            player_id=request.player_id,
            stat_type=request.stat_type,
            games_to_project=request.games_to_project,
        )

        # Extract projection data
        if "statcast_projection" not in analysis:
            raise HTTPException(
                status_code=404,
                detail=f"No projection available for {request.player_name}",
            )

        projection_data = analysis["statcast_projection"]

        response = ProjectionResponse(
            player_name=request.player_name,
            stat_type=request.stat_type,
            projected_value=projection_data["value"],
            confidence_score=projection_data["confidence"],
            confidence_interval=projection_data["confidence_interval"],
            contributing_factors=projection_data.get("contributing_factors", {}),
            model_consensus=projection_data.get("model_consensus", {}),
            games_projected=projection_data.get(
                "games_projected", request.games_to_project
            ),
            timestamp=analysis["timestamp"],
        )

        logger.info(
            f"✅ Projection generated: {response.projected_value:.1f} (confidence: {response.confidence_score:.2f})"
        )
        return response

    except Exception as e:
        logger.error(f"❌ Player projection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projection/batch", response_model=List[ProjectionResponse])
async def get_batch_projections(request: BatchProjectionRequest):
    """
    Get projections for multiple players
    """
    logger.info(f"📋 Batch projection request for {len(request.players)} players")

    try:
        # Get batch analysis
        batch_results = await statcast_integration.batch_analyze_players(
            player_list=request.players, games_to_project=request.games_to_project
        )

        projections = []
        for player_info in request.players:
            player_name = player_info.get("name", "")
            stat_type = player_info.get("stat_type", "home_runs")

            if player_name in batch_results:
                analysis = batch_results[player_name]

                if "statcast_projection" in analysis:
                    projection_data = analysis["statcast_projection"]

                    projection = ProjectionResponse(
                        player_name=player_name,
                        stat_type=stat_type,
                        projected_value=projection_data["value"],
                        confidence_score=projection_data["confidence"],
                        confidence_interval=projection_data["confidence_interval"],
                        contributing_factors=projection_data.get(
                            "contributing_factors", {}
                        ),
                        model_consensus=projection_data.get("model_consensus", {}),
                        games_projected=projection_data.get(
                            "games_projected", request.games_to_project
                        ),
                        timestamp=analysis["timestamp"],
                    )
                    projections.append(projection)

        logger.info(f"✅ Batch projections generated: {len(projections)} successful")
        return projections

    except Exception as e:
        logger.error(f"❌ Batch projection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/enhanced/{player_name}", response_model=EnhancedAnalysisResponse)
async def get_enhanced_analysis(
    player_name: str,
    stat_type: str = Query("home_runs", description="Type of statistic"),
    games_to_project: int = Query(162, description="Games to project", ge=1, le=162),
):
    """
    Get comprehensive enhanced analysis combining Statcast and betting insights
    """
    logger.info(f"🔍 Enhanced analysis request: {player_name} - {stat_type}")

    try:
        analysis = await statcast_integration.get_enhanced_player_analysis(
            player_name=player_name,
            stat_type=stat_type,
            games_to_project=games_to_project,
        )

        response = EnhancedAnalysisResponse(
            player_name=player_name,
            analysis_type=analysis.get("analysis_type", "enhanced_statcast_betting"),
            statcast_projection=analysis.get("statcast_projection"),
            betting_analysis=analysis.get("betting_analysis"),
            combined_insights=analysis.get("combined_insights", {}),
            data_quality=analysis.get("data_quality", {}),
            timestamp=analysis["timestamp"],
        )

        logger.info(f"✅ Enhanced analysis complete for {player_name}")
        return response

    except Exception as e:
        logger.error(f"❌ Enhanced analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/confidence/{player_name}", response_model=ConfidenceAnalysisResponse)
async def get_confidence_analysis(
    player_name: str,
    stat_type: str = Query("home_runs", description="Type of statistic"),
):
    """
    Get detailed confidence analysis for projections
    """
    logger.info(f"🎯 Confidence analysis request: {player_name} - {stat_type}")

    try:
        confidence_data = await statcast_integration.get_projection_confidence_analysis(
            player_name=player_name, stat_type=stat_type
        )

        if "error" in confidence_data:
            raise HTTPException(status_code=404, detail=confidence_data["error"])

        response = ConfidenceAnalysisResponse(
            player_name=confidence_data["player_name"],
            stat_type=confidence_data["stat_type"],
            projection=confidence_data["projection"],
            confidence_factors=confidence_data["confidence_factors"],
            model_consensus=confidence_data["model_consensus"],
            historical_accuracy=confidence_data["historical_accuracy"],
            risk_assessment=confidence_data["risk_assessment"],
            recommendations=confidence_data["recommendations"],
        )

        logger.info(f"✅ Confidence analysis complete for {player_name}")
        return response

    except Exception as e:
        logger.error(f"❌ Confidence analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/betting/value-analysis", response_model=List[BettingValueResponse])
async def analyze_betting_value(betting_props: List[Dict[str, Any]]):
    """
    Compare projections against betting lines to find value opportunities
    """
    logger.info(f"💰 Betting value analysis for {len(betting_props)} props")

    try:
        value_opportunities = (
            await statcast_integration.compare_projections_vs_betting_lines(
                betting_props
            )
        )

        responses = []
        for opportunity in value_opportunities:
            response = BettingValueResponse(
                player_name=opportunity["player_name"],
                stat_type=opportunity["stat_type"],
                projection=opportunity["projection"],
                betting_line=opportunity["betting_line"],
                confidence=opportunity["confidence"],
                edge_analysis=opportunity["edge_analysis"],
                recommendation=opportunity["recommendation"],
                prop_details=opportunity["prop_details"],
            )
            responses.append(response)

        logger.info(f"✅ Found {len(responses)} value opportunities")
        return responses

    except Exception as e:
        logger.error(f"❌ Betting value analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/status")
async def get_model_status():
    """
    Get status of trained models
    """
    logger.info("📊 Model status request")

    try:
        # Get model information
        model_info = {}

        # Check which models are available
        available_stats = statcast_integration.projection_models.target_stats
        trained_stats = list(statcast_integration.projection_models.models.keys())

        for stat in available_stats:
            if stat in trained_stats:
                # Get performance metrics
                metrics = statcast_integration.projection_models.get_model_performance(
                    stat
                )
                model_info[stat] = {
                    "status": "trained",
                    "models_available": list(metrics.keys()) if metrics else [],
                    "performance": {
                        model_name: {
                            "r2_score": model_metrics.r2_score,
                            "mae": model_metrics.mae,
                            "train_time": model_metrics.train_time,
                        }
                        for model_name, model_metrics in (metrics or {}).items()
                    },
                }
            else:
                model_info[stat] = {
                    "status": "not_trained",
                    "models_available": [],
                    "performance": {},
                }

        status_response = {
            "total_stats": len(available_stats),
            "trained_stats": len(trained_stats),
            "training_completion": len(trained_stats) / len(available_stats) * 100,
            "model_details": model_info,
            "last_updated": datetime.now().isoformat(),
        }

        logger.info(
            f"✅ Model status: {len(trained_stats)}/{len(available_stats)} trained"
        )
        return status_response

    except Exception as e:
        logger.error(f"❌ Model status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models/retrain/{stat_type}")
async def retrain_models(
    stat_type: str,
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Force retrain even if models exist"),
):
    """
    Retrain models for a specific statistic
    """
    logger.info(f"🔄 Model retrain request: {stat_type}")

    try:
        if stat_type not in statcast_integration.projection_models.target_stats:
            raise HTTPException(
                status_code=400, detail=f"Unsupported stat type: {stat_type}"
            )

        # Check if models already exist
        if stat_type in statcast_integration.projection_models.models and not force:
            raise HTTPException(
                status_code=400,
                detail=f"Models for {stat_type} already exist. Use force=true to retrain.",
            )

        # Add retrain task to background
        background_tasks.add_task(_retrain_model_background, stat_type)

        return {
            "message": f"Retraining initiated for {stat_type}",
            "stat_type": stat_type,
            "status": "in_progress",
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Model retrain failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the Statcast API
    """
    try:
        # Check if integration is properly initialized
        models_count = len(statcast_integration.projection_models.models)

        health_status = {
            "status": "healthy" if models_count > 0 else "degraded",
            "models_trained": models_count,
            "integration_ready": hasattr(statcast_integration, "projection_models"),
            "timestamp": datetime.now().isoformat(),
        }

        return health_status

    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


# Background task functions
async def _retrain_model_background(stat_type: str):
    """Background task for model retraining"""
    logger.info(f"🔄 Starting background retrain for {stat_type}")

    try:
        # Fetch fresh training data
        training_data = (
            await statcast_integration.data_pipeline.fetch_historical_statcast_data(
                start_date=datetime(2023, 4, 1), end_date=datetime(2024, 10, 31)
            )
        )

        if training_data.empty:
            logger.warning(f"No training data available for {stat_type}")
            return

        # Prepare stat-specific data
        stat_data = statcast_integration._prepare_stat_data(training_data, stat_type)

        # Train models
        metrics = await statcast_integration.projection_models.train_models_for_stat(
            stat_data, stat_type, hyperparameter_tuning=True
        )

        logger.info(
            f"✅ Background retrain complete for {stat_type}: {len(metrics)} models trained"
        )

    except Exception as e:
        logger.error(f"❌ Background retrain failed for {stat_type}: {e}")


# Include router in main app
def include_statcast_router(app):
    """Include the Statcast router in the main FastAPI app"""
    app.include_router(router)
    logger.info("✅ Statcast API routes registered")
