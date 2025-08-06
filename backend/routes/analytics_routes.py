"""Advanced Analytics API Routes
Exposes model performance tracking and ensemble analytics capabilities.
Part of Phase 3 Week 3: Advanced Analytics implementation.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import JSONResponse

from backend.services.model_performance_tracker import (
    ModelPerformanceSnapshot,
    performance_tracker,
)
from backend.services.multi_sport_ensemble_manager import (
    CrossSportInsight,
    EnsemblePrediction,
    VotingStrategy,
    ensemble_manager,
)

logger = logging.getLogger("propollama.analytics_api")

router = APIRouter(prefix="/analytics", tags=["Advanced Analytics"])


@router.get("/health")
async def analytics_health():
    """Check analytics services health"""
    try:
        tracker_ready = performance_tracker.is_initialized
        ensemble_ready = ensemble_manager.is_initialized

        if not tracker_ready:
            await performance_tracker.initialize()
            tracker_ready = performance_tracker.is_initialized

        if not ensemble_ready:
            await ensemble_manager.initialize()
            ensemble_ready = ensemble_manager.is_initialized

        return {
            "status": "healthy" if (tracker_ready and ensemble_ready) else "degraded",
            "components": {
                "performance_tracker": "ready" if tracker_ready else "not_ready",
                "ensemble_manager": "ready" if ensemble_ready else "not_ready",
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Analytics health check failed: {e}")
        raise HTTPException(
            status_code=500, detail="Analytics service health check failed"
        )


@router.get("/performance/models")
async def get_all_models_performance(
    sport: Optional[str] = Query(None, description="Filter by specific sport")
):
    """Get performance metrics for all models"""
    try:
        snapshots = await performance_tracker.get_all_models_performance(sport)

        return {
            "total_models": len(snapshots),
            "sport_filter": sport,
            "models": [
                {
                    "model_name": snapshot.model_name,
                    "sport": snapshot.sport,
                    "status": snapshot.status.value,
                    "metrics": snapshot.metrics,
                    "predictions_count": snapshot.predictions_count,
                    "wins": snapshot.wins,
                    "losses": snapshot.losses,
                    "win_rate": snapshot.wins / max(snapshot.predictions_count, 1),
                    "total_roi": snapshot.total_roi,
                    "avg_confidence": snapshot.avg_confidence,
                    "error_rate": snapshot.error_rate,
                    "last_prediction": (
                        snapshot.last_prediction.isoformat()
                        if snapshot.last_prediction
                        else None
                    ),
                    "timestamp": snapshot.timestamp.isoformat(),
                }
                for snapshot in snapshots
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to get models performance: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve model performance data"
        )


@router.get("/performance/models/{model_name}/{sport}")
async def get_model_performance(
    model_name: str = Path(..., description="Model name"),
    sport: str = Path(..., description="Sport"),
    days: int = Query(7, description="Number of days to analyze", ge=1, le=365),
):
    """Get detailed performance metrics for a specific model"""
    try:
        snapshot = await performance_tracker.get_model_performance(
            model_name, sport, days
        )

        if not snapshot:
            raise HTTPException(
                status_code=404,
                detail=f"No performance data found for {model_name} in {sport}",
            )

        # Get performance trends
        trends = await performance_tracker.get_performance_trends(
            model_name, sport, days
        )

        return {
            "model_name": snapshot.model_name,
            "sport": snapshot.sport,
            "analysis_period_days": days,
            "status": snapshot.status.value,
            "performance_metrics": snapshot.metrics,
            "summary": {
                "total_predictions": snapshot.predictions_count,
                "wins": snapshot.wins,
                "losses": snapshot.losses,
                "win_rate": snapshot.wins / max(snapshot.predictions_count, 1),
                "total_roi": snapshot.total_roi,
                "avg_confidence": snapshot.avg_confidence,
                "error_rate": snapshot.error_rate,
            },
            "trends": trends,
            "last_prediction": (
                snapshot.last_prediction.isoformat()
                if snapshot.last_prediction
                else None
            ),
            "timestamp": snapshot.timestamp.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get performance for {model_name}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve model performance"
        )


@router.get("/performance/alerts")
async def get_performance_alerts(
    threshold: float = Query(
        0.10, description="Performance degradation threshold", ge=0.01, le=0.50
    )
):
    """Get performance degradation alerts"""
    try:
        alerts = await performance_tracker.detect_performance_degradation(threshold)

        # Categorize alerts by severity
        high_severity = [a for a in alerts if a.get("severity") == "high"]
        medium_severity = [a for a in alerts if a.get("severity") == "medium"]

        return {
            "total_alerts": len(alerts),
            "threshold_used": threshold,
            "summary": {
                "high_severity": len(high_severity),
                "medium_severity": len(medium_severity),
            },
            "alerts": alerts,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to get performance alerts: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve performance alerts"
        )


@router.post("/ensemble/predict")
async def generate_ensemble_prediction(request: Dict[str, Any]):
    """Generate ensemble prediction using multiple models"""
    try:
        # Validate required fields
        required_fields = ["sport", "event_id", "player_name", "prop_type", "features"]
        missing_fields = [field for field in required_fields if field not in request]
        if missing_fields:
            raise HTTPException(
                status_code=400, detail=f"Missing required fields: {missing_fields}"
            )

        # Parse voting strategy if provided
        voting_strategy = None
        if "voting_strategy" in request:
            try:
                voting_strategy = VotingStrategy(request["voting_strategy"])
            except ValueError:
                valid_strategies = [s.value for s in VotingStrategy]
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid voting strategy. Valid options: {valid_strategies}",
                )

        # Generate ensemble prediction
        prediction = await ensemble_manager.predict_ensemble(
            sport=request["sport"],
            event_id=request["event_id"],
            player_name=request["player_name"],
            prop_type=request["prop_type"],
            features=request["features"],
            voting_strategy=voting_strategy,
            force_models=request.get("force_models"),
        )

        if not prediction:
            raise HTTPException(
                status_code=500, detail="Failed to generate ensemble prediction"
            )

        return {
            "request_id": prediction.request_id,
            "sport": prediction.sport,
            "event_id": prediction.event_id,
            "player_name": prediction.player_name,
            "prop_type": prediction.prop_type,
            "ensemble_result": {
                "prediction": prediction.ensemble_prediction,
                "confidence": prediction.ensemble_confidence,
                "probability": prediction.ensemble_probability,
                "voting_strategy": prediction.voting_strategy.value,
            },
            "model_analysis": {
                "individual_predictions": prediction.model_predictions,
                "individual_confidences": prediction.model_confidences,
                "model_weights": prediction.model_weights,
                "models_used": prediction.models_used,
                "total_models": len(prediction.models_used),
            },
            "consensus_analysis": {
                "prediction_variance": prediction.prediction_variance,
                "model_agreement": prediction.model_agreement,
                "outlier_models": prediction.outlier_models,
                "consensus_strength": prediction.consensus_strength,
            },
            "performance_insights": {
                "expected_accuracy": prediction.expected_accuracy,
                "historical_performance": prediction.historical_performance,
                "risk_assessment": prediction.risk_assessment,
            },
            "betting_recommendations": {
                "recommended_action": prediction.recommended_action,
                "kelly_fraction": prediction.kelly_fraction,
                "expected_value": prediction.expected_value,
                "confidence_interval": prediction.confidence_interval,
            },
            "processing_time": prediction.processing_time,
            "timestamp": prediction.timestamp.isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate ensemble prediction: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to generate ensemble prediction"
        )


@router.get("/ensemble/report")
async def get_ensemble_performance_report(
    sport: Optional[str] = Query(None, description="Filter by specific sport")
):
    """Get comprehensive ensemble performance report"""
    try:
        report = await ensemble_manager.get_ensemble_performance_report(sport)

        if not report:
            raise HTTPException(
                status_code=500, detail="Failed to generate ensemble report"
            )

        return report

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get ensemble report: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to generate ensemble performance report"
        )


@router.get("/cross-sport/insights")
async def get_cross_sport_insights(
    days: int = Query(30, description="Number of days to analyze", ge=7, le=365)
):
    """Analyze cross-sport patterns and correlations"""
    try:
        insights = await ensemble_manager.analyze_cross_sport_patterns(days)

        # Categorize insights by type
        correlations = [
            i for i in insights if i.insight_type == "cross_sport_correlation"
        ]
        seasonal = [i for i in insights if i.insight_type == "seasonal_pattern"]

        return {
            "analysis_period_days": days,
            "total_insights": len(insights),
            "summary": {
                "correlations_found": len(correlations),
                "seasonal_patterns": len(seasonal),
            },
            "insights": [
                {
                    "type": insight.insight_type,
                    "sports": insight.sports_involved,
                    "correlation": insight.correlation,
                    "significance": insight.significance,
                    "description": insight.description,
                    "recommendation": insight.actionable_recommendation,
                    "confidence": insight.confidence,
                }
                for insight in insights
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get cross-sport insights: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to analyze cross-sport patterns"
        )


@router.get("/dashboard/summary")
async def get_analytics_dashboard_summary():
    """Get summary data for analytics dashboard"""
    try:
        # Get performance data for all sports
        all_models = await performance_tracker.get_all_models_performance()

        # Group by sport
        sports_summary = {}
        for snapshot in all_models:
            sport = snapshot.sport
            if sport not in sports_summary:
                sports_summary[sport] = {
                    "models_count": 0,
                    "total_predictions": 0,
                    "avg_roi": 0.0,
                    "avg_win_rate": 0.0,
                    "healthy_models": 0,
                }

            sports_summary[sport]["models_count"] += 1
            sports_summary[sport]["total_predictions"] += snapshot.predictions_count
            sports_summary[sport]["avg_roi"] += snapshot.total_roi
            sports_summary[sport]["avg_win_rate"] += snapshot.wins / max(
                snapshot.predictions_count, 1
            )

            if snapshot.error_rate < 0.05:  # Less than 5% error rate
                sports_summary[sport]["healthy_models"] += 1

        # Calculate averages
        for sport_data in sports_summary.values():
            if sport_data["models_count"] > 0:
                sport_data["avg_roi"] /= sport_data["models_count"]
                sport_data["avg_win_rate"] /= sport_data["models_count"]

        # Get recent alerts
        alerts = await performance_tracker.detect_performance_degradation()

        # Get cross-sport insights
        insights = await ensemble_manager.analyze_cross_sport_patterns(7)  # Last 7 days

        return {
            "sports_summary": sports_summary,
            "overall_metrics": {
                "total_models": len(all_models),
                "total_sports": len(sports_summary),
                "total_predictions": sum(s.predictions_count for s in all_models),
                "overall_avg_roi": sum(s.total_roi for s in all_models)
                / max(len(all_models), 1),
                "healthy_models": sum(1 for s in all_models if s.error_rate < 0.05),
            },
            "alerts_summary": {
                "total_alerts": len(alerts),
                "high_severity": len(
                    [a for a in alerts if a.get("severity") == "high"]
                ),
                "medium_severity": len(
                    [a for a in alerts if a.get("severity") == "medium"]
                ),
            },
            "insights_summary": {
                "total_insights": len(insights),
                "correlations": len(
                    [i for i in insights if i.insight_type == "cross_sport_correlation"]
                ),
                "patterns": len(
                    [i for i in insights if i.insight_type == "seasonal_pattern"]
                ),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get dashboard summary: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to generate dashboard summary"
        )


@router.post("/performance/record")
async def record_model_prediction(request: Dict[str, Any]):
    """Record a model prediction for performance tracking"""
    try:
        # Validate required fields
        required_fields = ["model_name", "sport", "prediction_value"]
        missing_fields = [field for field in required_fields if field not in request]
        if missing_fields:
            raise HTTPException(
                status_code=400, detail=f"Missing required fields: {missing_fields}"
            )

        success = await performance_tracker.record_prediction(
            model_name=request["model_name"],
            sport=request["sport"],
            prediction_value=request["prediction_value"],
            actual_value=request.get("actual_value"),
            confidence=request.get("confidence", 0.0),
            metadata=request.get("metadata"),
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to record prediction")

        return {
            "status": "success",
            "message": f"Prediction recorded for {request['model_name']} in {request['sport']}",
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to record prediction: {e}")
        raise HTTPException(status_code=500, detail="Failed to record model prediction")


@router.put("/performance/update")
async def update_model_performance(request: Dict[str, Any]):
    """Update performance metrics for a specific model"""
    try:
        # Validate required fields
        required_fields = ["model_name", "sport", "metrics"]
        missing_fields = [field for field in required_fields if field not in request]
        if missing_fields:
            raise HTTPException(
                status_code=400, detail=f"Missing required fields: {missing_fields}"
            )

        success = await performance_tracker.update_performance_metrics(
            model_name=request["model_name"],
            sport=request["sport"],
            metrics=request["metrics"],
        )

        if not success:
            raise HTTPException(
                status_code=500, detail="Failed to update performance metrics"
            )

        return {
            "status": "success",
            "message": f"Performance metrics updated for {request['model_name']} in {request['sport']}",
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update performance metrics: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update model performance metrics"
        )
