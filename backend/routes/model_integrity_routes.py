"""
Model Integrity Phase API Routes
=================================

API endpoints for the core Model Integrity Phase components:
- Recompute Scheduler
- Calibration Harness  
- Edge Persistence Model
- Metrics Export System

Focus: Expose real-time performance data for monitoring and debugging
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Dict, List, Optional, Any
import time
import logging

from ..services.recompute_scheduler import recompute_scheduler, RecomputeTrigger, RecomputeType
from ..services.calibration_harness import calibration_harness, PropType, OutcomeType
from ..services.edge_persistence_model import edge_persistence_model, EdgeType
from ..services.metrics_export import metrics_collector
from ..services.unified_cache_service import unified_cache_service

logger = logging.getLogger("model_integrity_api")

router = APIRouter(prefix="/api/model-integrity", tags=["Model Integrity"])


# Recompute Scheduler Endpoints
# =============================

@router.get("/recompute/status")
async def get_recompute_status():
    """Get current recompute scheduler status"""
    try:
        status = recompute_scheduler.get_status()
        return {
            "success": True,
            "status": status,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Error getting recompute status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recompute/schedule")
async def schedule_recompute(
    game_id: str,
    trigger: str = "manual",
    prop_ids: Optional[List[str]] = None,
    force_type: Optional[str] = None
):
    """Schedule a recompute job"""
    try:
        # Parse trigger
        try:
            trigger_enum = RecomputeTrigger(trigger.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid trigger: {trigger}")
        
        # Parse force_type if provided
        force_type_enum = None
        if force_type:
            try:
                force_type_enum = RecomputeType(force_type.lower())
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid force_type: {force_type}")
        
        job_id = await recompute_scheduler.schedule_recompute(
            game_id=game_id,
            trigger=trigger_enum,
            prop_ids=prop_ids,
            force_type=force_type_enum
        )
        
        if job_id:
            return {
                "success": True,
                "job_id": job_id,
                "message": "Recompute job scheduled successfully"
            }
        else:
            return {
                "success": False,
                "message": "Recompute job was debounced"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling recompute: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recompute/history")
async def get_recompute_history(limit: int = Query(50, ge=1, le=200)):
    """Get recompute job history"""
    try:
        history = recompute_scheduler.get_job_history(limit=limit)
        return {
            "success": True,
            "history": history,
            "count": len(history)
        }
    except Exception as e:
        logger.error(f"Error getting recompute history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Calibration Harness Endpoints
# =============================

@router.get("/calibration/summary")
async def get_calibration_summary():
    """Get overall calibration summary"""
    try:
        summary = await calibration_harness.get_overall_summary()
        return {
            "success": True,
            "summary": summary,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Error getting calibration summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calibration/prop-type/{prop_type}")
async def get_prop_type_calibration(prop_type: str):
    """Get calibration metrics for a specific prop type"""
    try:
        # Parse prop type
        try:
            prop_type_enum = PropType(prop_type.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid prop_type: {prop_type}")
        
        summary = await calibration_harness.get_prop_type_summary(prop_type_enum)
        return {
            "success": True,
            "prop_type": prop_type,
            "summary": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prop type calibration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calibration/record-prediction")
async def record_prediction(
    prediction_id: str,
    game_id: str,
    prop_type: str,
    prop_line: float,
    predicted_value: float,
    predicted_probability: float,
    confidence_score: float = 0.5,
    model_version: str = "1.0"
):
    """Record a new prediction for calibration tracking"""
    try:
        # Parse prop type
        try:
            prop_type_enum = PropType(prop_type.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid prop_type: {prop_type}")
        
        await calibration_harness.record_prediction(
            prediction_id=prediction_id,
            game_id=game_id,
            prop_type=prop_type_enum,
            prop_line=prop_line,
            predicted_value=predicted_value,
            predicted_probability=predicted_probability,
            confidence_score=confidence_score,
            model_version=model_version
        )
        
        return {
            "success": True,
            "message": "Prediction recorded successfully",
            "prediction_id": prediction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calibration/record-outcome")
async def record_outcome(
    prediction_id: str,
    actual_value: float,
    outcome: str
):
    """Record the actual outcome for a prediction"""
    try:
        # Parse outcome
        try:
            outcome_enum = OutcomeType(outcome.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid outcome: {outcome}")
        
        await calibration_harness.record_outcome(
            prediction_id=prediction_id,
            actual_value=actual_value,
            outcome=outcome_enum
        )
        
        return {
            "success": True,
            "message": "Outcome recorded successfully",
            "prediction_id": prediction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording outcome: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calibration/prediction/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Get details for a specific prediction"""
    try:
        prediction = calibration_harness.get_prediction(prediction_id)
        
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        return {
            "success": True,
            "prediction": {
                "id": prediction.id,
                "game_id": prediction.game_id,
                "prop_type": prediction.prop_type.value,
                "prop_line": prediction.prop_line,
                "predicted_value": prediction.predicted_value,
                "predicted_probability": prediction.predicted_probability,
                "confidence_score": prediction.confidence_score,
                "actual_value": prediction.actual_value,
                "outcome": prediction.outcome.value if prediction.outcome else None,
                "is_settled": prediction.is_settled(),
                "was_correct": prediction.was_correct(),
                "created_at": prediction.created_at,
                "settled_at": prediction.settled_at,
                "model_version": prediction.model_version
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calibration/game/{game_id}/predictions")
async def get_game_predictions(game_id: str):
    """Get all predictions for a specific game"""
    try:
        predictions = calibration_harness.get_predictions_for_game(game_id)
        
        return {
            "success": True,
            "game_id": game_id,
            "predictions": [
                {
                    "id": p.id,
                    "prop_type": p.prop_type.value,
                    "prop_line": p.prop_line,
                    "predicted_probability": p.predicted_probability,
                    "confidence_score": p.confidence_score,
                    "is_settled": p.is_settled(),
                    "was_correct": p.was_correct()
                }
                for p in predictions
            ],
            "count": len(predictions)
        }
        
    except Exception as e:
        logger.error(f"Error getting game predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Edge Persistence Model Endpoints
# ================================

@router.get("/edges/summary")
async def get_edge_summary():
    """Get edge quality summary"""
    try:
        summary = edge_persistence_model.get_edge_quality_summary()
        return {
            "success": True,
            "summary": summary,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Error getting edge summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/edges/active")
async def get_active_edges(
    min_persistence: float = Query(0.1, ge=0.0, le=1.0),
    edge_type: Optional[str] = None
):
    """Get active edges above minimum persistence threshold"""
    try:
        if edge_type:
            try:
                edge_type_enum = EdgeType(edge_type.lower())
                edges = await edge_persistence_model.get_edges_by_type(edge_type_enum)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid edge_type: {edge_type}")
        else:
            edges = await edge_persistence_model.get_active_edges(min_persistence_score=min_persistence)
        
        # Filter by minimum persistence if edge_type was specified
        if edge_type:
            edges = [e for e in edges if e.persistence_score >= min_persistence]
        
        return {
            "success": True,
            "edges": [
                {
                    "id": edge.id,
                    "game_id": edge.game_id,
                    "prop_id": edge.prop_id,
                    "edge_type": edge.edge_type.value,
                    "current_ev": edge.current_ev,
                    "persistence_score": edge.persistence_score,
                    "confidence_score": edge.confidence_score,
                    "age_hours": edge.age_hours,
                    "line_movement": edge.line_movement,
                    "status": edge.status.value
                }
                for edge in edges
            ],
            "count": len(edges),
            "filters": {
                "min_persistence": min_persistence,
                "edge_type": edge_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting active edges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/edges/game/{game_id}")
async def get_game_edges(game_id: str):
    """Get all active edges for a specific game"""
    try:
        edges = await edge_persistence_model.get_edges_by_game(game_id)
        
        return {
            "success": True,
            "game_id": game_id,
            "edges": [
                {
                    "id": edge.id,
                    "prop_id": edge.prop_id,
                    "edge_type": edge.edge_type.value,
                    "current_ev": edge.current_ev,
                    "persistence_score": edge.persistence_score,
                    "confidence_score": edge.confidence_score,
                    "age_hours": edge.age_hours,
                    "ev_trend": edge.get_ev_trend(),
                    "volatility": edge.get_volatility_score()
                }
                for edge in edges
            ],
            "count": len(edges)
        }
        
    except Exception as e:
        logger.error(f"Error getting game edges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/edges/{edge_id}")
async def get_edge_details(edge_id: str):
    """Get detailed information for a specific edge"""
    try:
        edge = edge_persistence_model.get_edge(edge_id)
        
        if not edge:
            raise HTTPException(status_code=404, detail="Edge not found")
        
        return {
            "success": True,
            "edge": {
                "id": edge.id,
                "game_id": edge.game_id,
                "prop_id": edge.prop_id,
                "edge_type": edge.edge_type.value,
                "initial_ev": edge.initial_ev,
                "current_ev": edge.current_ev,
                "ev_change": edge.ev_change,
                "persistence_score": edge.persistence_score,
                "confidence_score": edge.confidence_score,
                "line_when_created": edge.line_when_created,
                "current_line": edge.current_line,
                "line_movement": edge.line_movement,
                "age_hours": edge.age_hours,
                "status": edge.status.value,
                "false_positive_signals": edge.false_positive_signals,
                "retirement_reason": edge.retirement_reason.value if edge.retirement_reason else None,
                "retired_at": edge.retired_at,
                "created_at": edge.created_at,
                "last_updated": edge.last_updated,
                "ev_trend_60min": edge.get_ev_trend(60),
                "volatility_score": edge.get_volatility_score(),
                "snapshot_count": len(edge.snapshots) if edge.snapshots else 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting edge details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edges/{edge_id}/flag-false-positive")
async def flag_edge_false_positive(edge_id: str, reason: str = ""):
    """Flag an edge as potentially false positive"""
    try:
        await edge_persistence_model.flag_false_positive(edge_id, reason)
        
        return {
            "success": True,
            "message": "Edge flagged as false positive",
            "edge_id": edge_id,
            "reason": reason
        }
        
    except Exception as e:
        logger.error(f"Error flagging false positive: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edges/cleanup")
async def cleanup_stale_edges():
    """Clean up stale edges that should be retired"""
    try:
        cleaned_count = await edge_persistence_model.cleanup_stale_edges()
        
        return {
            "success": True,
            "message": f"Cleaned up {cleaned_count} stale edges",
            "cleaned_count": cleaned_count
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up edges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Metrics Export Endpoints
# ========================

@router.get("/metrics/export")
async def get_metrics_export():
    """Get exported metrics for monitoring dashboards"""
    try:
        # Get metrics from cache (populated by metrics collector)
        from ..services.unified_cache_service import unified_cache_service
        
        metrics = await unified_cache_service.get("metrics_export")
        if not metrics:
            return {
                "success": False,
                "message": "No metrics available - collector may not be running"
            }
        
        return {
            "success": True,
            "metrics": metrics
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics export: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/health")
async def get_health_summary():
    """Get overall system health summary"""
    try:
        health = await metrics_collector.get_health_summary()
        return {
            "success": True,
            "health": health
        }
        
    except Exception as e:
        logger.error(f"Error getting health summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/prometheus")
async def get_prometheus_metrics():
    """Get metrics in Prometheus format"""
    try:
        prometheus_format = metrics_collector.get_prometheus_format()
        
        # Return as plain text for Prometheus scraping
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=prometheus_format, media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Error getting Prometheus metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/history/{metric_name}")
async def get_metric_history(
    metric_name: str,
    limit: int = Query(100, ge=1, le=1000)
):
    """Get historical values for a specific metric"""
    try:
        history = metrics_collector.get_metric_history(metric_name, limit)
        
        return {
            "success": True,
            "metric_name": metric_name,
            "history": history,
            "count": len(history)
        }
        
    except Exception as e:
        logger.error(f"Error getting metric history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics/start-collection")
async def start_metrics_collection(background_tasks: BackgroundTasks):
    """Start metrics collection (admin only)"""
    try:
        background_tasks.add_task(metrics_collector.start_collection)
        
        return {
            "success": True,
            "message": "Metrics collection started"
        }
        
    except Exception as e:
        logger.error(f"Error starting metrics collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics/stop-collection")
async def stop_metrics_collection():
    """Stop metrics collection (admin only)"""
    try:
        await metrics_collector.stop_collection()
        
        return {
            "success": True,
            "message": "Metrics collection stopped"
        }
        
    except Exception as e:
        logger.error(f"Error stopping metrics collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# System Control Endpoints
# ========================

@router.post("/system/start-workers")
async def start_system_workers():
    """Start all Model Integrity Phase workers"""
    try:
        # Start recompute scheduler workers
        await recompute_scheduler.start_workers()
        
        # Start metrics collection
        await metrics_collector.start_collection()
        
        # Start settlement integration
        from ..services.settlement_integration_service import settlement_integration_service
        await settlement_integration_service.start_processing()
        
        # Start SLO monitoring dashboard
        from ..services.slo_monitoring_dashboard import slo_dashboard
        await slo_dashboard.start_monitoring()
        
        return {
            "success": True,
            "message": "All Model Integrity Phase workers started",
            "components": ["recompute_scheduler", "metrics_collector", "settlement_integration", "slo_dashboard"]
        }
        
    except Exception as e:
        logger.error(f"Error starting workers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/system/stop-workers")
async def stop_system_workers():
    """Stop all Model Integrity Phase workers"""
    try:
        # Stop recompute scheduler workers
        await recompute_scheduler.stop_workers()
        
        # Stop metrics collection
        await metrics_collector.stop_collection()
        
        # Stop settlement integration
        from ..services.settlement_integration_service import settlement_integration_service
        await settlement_integration_service.stop_processing()
        
        # Stop SLO monitoring dashboard
        from ..services.slo_monitoring_dashboard import slo_dashboard
        await slo_dashboard.stop_monitoring()
        
        return {
            "success": True,
            "message": "All Model Integrity Phase workers stopped",
            "components": ["recompute_scheduler", "metrics_collector", "settlement_integration", "slo_dashboard"]
        }
        
    except Exception as e:
        logger.error(f"Error stopping workers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Settlement Integration Endpoints (NEW)
# ======================================

@router.get("/settlement/summary")
async def get_settlement_summary():
    """Get settlement processing summary"""
    try:
        from ..services.settlement_integration_service import settlement_integration_service
        summary = await settlement_integration_service.get_settlement_summary()
        
        return {
            "success": True,
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"Error getting settlement summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settlement/outliers")
async def get_settlement_outliers(limit: int = Query(20, ge=1, le=100)):
    """Get recent settlement outliers"""
    try:
        from ..services.settlement_integration_service import settlement_integration_service
        outliers = await settlement_integration_service.get_outlier_details(limit)
        
        return {
            "success": True,
            "outliers": outliers,
            "count": len(outliers)
        }
        
    except Exception as e:
        logger.error(f"Error getting settlement outliers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settlement/process-game/{game_id}")
async def force_process_game_settlement(game_id: str):
    """Manually trigger settlement processing for a specific game"""
    try:
        from ..services.settlement_integration_service import settlement_integration_service
        result = await settlement_integration_service.force_process_game(game_id)
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing game settlement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settlement/register-prediction")
async def register_prediction_for_settlement(
    prediction_id: str,
    game_id: str,
    prop_type: str
):
    """Register a prediction for automatic settlement"""
    try:
        from ..services.settlement_integration_service import settlement_integration_service
        from ..services.calibration_harness import PropType
        
        # Parse prop type
        try:
            prop_type_enum = PropType(prop_type.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid prop_type: {prop_type}")
        
        await settlement_integration_service.register_prediction_for_settlement(
            prediction_id, game_id, prop_type_enum
        )
        
        return {
            "success": True,
            "message": "Prediction registered for settlement",
            "prediction_id": prediction_id,
            "game_id": game_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering prediction for settlement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# SLO Monitoring Dashboard Endpoints (NEW)
# ========================================

@router.get("/dashboard/status")
async def get_dashboard_status():
    """Get SLO monitoring dashboard status"""
    try:
        from ..services.slo_monitoring_dashboard import slo_dashboard
        status = await slo_dashboard.get_dashboard_status()
        
        return {
            "success": True,
            "status": status
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/data")
async def get_dashboard_data():
    """Get complete dashboard data for frontend"""
    try:
        # Get cached dashboard data
        dashboard_data = await unified_cache_service.get("slo_dashboard_data")
        
        if not dashboard_data:
            return {
                "success": False,
                "message": "Dashboard data not available - monitoring may not be running"
            }
        
        return {
            "success": True,
            "data": dashboard_data
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/alerts")
async def get_active_alerts():
    """Get all active SLO alerts"""
    try:
        from ..services.slo_monitoring_dashboard import slo_dashboard
        
        return {
            "success": True,
            "alerts": list(slo_dashboard.active_alerts.values()),
            "count": len(slo_dashboard.active_alerts)
        }
        
    except Exception as e:
        logger.error(f"Error getting active alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/slo-targets")
async def get_slo_targets():
    """Get all defined SLO targets"""
    try:
        from ..services.slo_monitoring_dashboard import slo_dashboard
        
        targets = {
            name: {
                "name": target.name,
                "description": target.description,
                "target_value": target.target_value,
                "unit": target.unit,
                "comparison": target.comparison,
                "warning_threshold": target.warning_threshold,
                "critical_threshold": target.critical_threshold
            }
            for name, target in slo_dashboard.slo_targets.items()
        }
        
        return {
            "success": True,
            "targets": targets,
            "count": len(targets)
        }
        
    except Exception as e:
        logger.error(f"Error getting SLO targets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/panel/{panel_id}")
async def get_panel_data(panel_id: str):
    """Get data for a specific dashboard panel"""
    try:
        from ..services.slo_monitoring_dashboard import slo_dashboard
        
        if panel_id not in slo_dashboard.panels:
            raise HTTPException(status_code=404, detail=f"Panel not found: {panel_id}")
        
        panel = slo_dashboard.panels[panel_id]
        panel_data = await slo_dashboard._generate_panel_data(panel)
        
        return {
            "success": True,
            "panel_id": panel_id,
            "title": panel.title,
            "data": panel_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting panel data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Enhanced Calibration Endpoints (NEW)
# ====================================

@router.post("/calibration/record-prediction-enhanced")
async def record_prediction_enhanced(
    prediction_id: str,
    game_id: str,
    prop_type: str,
    prop_line: float,
    predicted_value: float,
    predicted_probability: float,
    confidence_score: float = 0.5,
    model_version: str = "1.0",
    feature_set_hash: Optional[str] = None,
    game_phase: str = "pre_game"
):
    """Record a prediction with enhanced calibration tracking"""
    try:
        from ..services.calibration_harness import PropType, GamePhase
        
        # Parse enums
        try:
            prop_type_enum = PropType(prop_type.lower())
            game_phase_enum = GamePhase(game_phase.lower())
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid enum value: {str(e)}")
        
        await calibration_harness.record_prediction(
            prediction_id=prediction_id,
            game_id=game_id,
            prop_type=prop_type_enum,
            prop_line=prop_line,
            predicted_value=predicted_value,
            predicted_probability=predicted_probability,
            confidence_score=confidence_score,
            model_version=model_version
        )
        
        # Also register for settlement
        from ..services.settlement_integration_service import settlement_integration_service
        await settlement_integration_service.register_prediction_for_settlement(
            prediction_id, game_id, prop_type_enum
        )
        
        return {
            "success": True,
            "message": "Enhanced prediction recorded and registered for settlement",
            "prediction_id": prediction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording enhanced prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system/status")
async def get_system_status():
    """Get overall Model Integrity Phase system status"""
    try:
        recompute_status = recompute_scheduler.get_status()
        health = await metrics_collector.get_health_summary()
        
        # Get component metrics
        from ..services.unified_cache_service import unified_cache_service
        
        recompute_metrics = await unified_cache_service.get("recompute_metrics") or {}
        calibration_metrics = await unified_cache_service.get("calibration_metrics") or {}
        edge_metrics = await unified_cache_service.get("edge_persistence_metrics") or {}
        
        return {
            "success": True,
            "system": {
                "status": health["status"],
                "timestamp": time.time(),
                "components": {
                    "recompute_scheduler": {
                        "running": recompute_status["workers_running"],
                        "workers": recompute_status["worker_count"],
                        "queue_depth": recompute_status["queue_depth"],
                        "active_jobs": recompute_status["active_jobs"]
                    },
                    "calibration_harness": {
                        "total_predictions": calibration_metrics.get("overall", {}).get("total_predictions", 0),
                        "overall_accuracy": calibration_metrics.get("overall", {}).get("overall_accuracy", 0),
                        "prop_types_active": len(calibration_metrics.get("by_prop_type", {}))
                    },
                    "edge_persistence": {
                        "active_edges": edge_metrics.get("quality_summary", {}).get("active_edges", 0),
                        "avg_persistence": edge_metrics.get("quality_summary", {}).get("average_persistence", 0),
                        "false_positive_rate": edge_metrics.get("quality_summary", {}).get("metrics", {}).get("false_positives_detected", 0)
                    },
                    "metrics_collector": {
                        "collecting": metrics_collector.is_collecting,
                        "health_status": health["status"],
                        "active_alerts": health["alerts"]["total"]
                    }
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))