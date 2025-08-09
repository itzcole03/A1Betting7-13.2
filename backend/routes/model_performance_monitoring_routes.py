"""
Model Performance Monitoring API Routes
API endpoints for accessing model performance monitoring data and controls.
Part of Phase 3: Advanced AI Enhancement and Multi-Sport Expansion
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
import logging

from ..services.advanced_model_performance_monitoring import (
    get_monitoring_service,
    ModelStatus,
    DriftType
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/ai/monitoring", tags=["AI Model Performance Monitoring"])

# Request/Response Models
class ModelRegistrationRequest(BaseModel):
    model_id: str = Field(..., description="Unique model identifier")
    baseline_data: Dict[str, Any] = Field(..., description="Baseline performance metrics")

class PredictionBatchRequest(BaseModel):
    model_id: str = Field(..., description="Model identifier")
    predictions: List[Dict[str, Any]] = Field(..., description="Batch of predictions")
    ground_truth: Optional[List[Any]] = Field(None, description="Optional ground truth values")

class PerformanceMetricsResponse(BaseModel):
    model_id: str
    timestamp: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: Optional[float]
    predictions_count: int
    avg_confidence: float
    latency_ms: float
    memory_usage_mb: float
    throughput_per_second: float
    error_rate: float

class ModelHealthResponse(BaseModel):
    model_id: str
    status: str
    health_score: float
    performance_trend: str
    last_checked: str
    alerts: List[Dict[str, Any]]
    metrics_summary: Dict[str, float]
    uptime_hours: float

class ComparativeAnalysisResponse(BaseModel):
    models: Dict[str, Dict[str, float]]
    rankings: Dict[str, List[tuple]]
    summary: Dict[str, Any]

@router.get("/status", summary="Get monitoring system status")
async def get_monitoring_status():
    """Get the current status of the monitoring system"""
    try:
        monitoring_service = await get_monitoring_service()
        
        return {
            "status": "active" if monitoring_service.is_monitoring else "inactive",
            "monitored_models": len(monitoring_service.performance_history),
            "monitoring_window_hours": monitoring_service.monitoring_window_hours,
            "drift_thresholds": {dt.value: threshold for dt, threshold in monitoring_service.drift_thresholds.items()},
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get monitoring status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get monitoring status")

@router.post("/models/register", summary="Register a model for monitoring")
async def register_model(request: ModelRegistrationRequest):
    """Register a new model for performance monitoring"""
    try:
        monitoring_service = await get_monitoring_service()
        
        success = await monitoring_service.register_model(
            model_id=request.model_id,
            baseline_data=request.baseline_data
        )
        
        if success:
            return {
                "success": True,
                "message": f"Model {request.model_id} registered successfully",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to register model")
            
    except Exception as e:
        logger.error(f"Failed to register model: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to register model")

@router.post("/predictions/batch", summary="Record a batch of predictions")
async def record_prediction_batch(request: PredictionBatchRequest):
    """Record a batch of predictions for performance monitoring"""
    try:
        monitoring_service = await get_monitoring_service()
        
        await monitoring_service.record_prediction_batch(
            model_id=request.model_id,
            predictions=request.predictions,
            ground_truth=request.ground_truth
        )
        
        return {
            "success": True,
            "message": f"Recorded {len(request.predictions)} predictions for model {request.model_id}",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to record prediction batch: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record prediction batch")

@router.get("/models/{model_id}/health", response_model=ModelHealthResponse, summary="Get model health status")
async def get_model_health(model_id: str):
    """Get comprehensive health status for a specific model"""
    try:
        monitoring_service = await get_monitoring_service()
        
        health_status = await monitoring_service.get_model_health_status(model_id)
        
        if not health_status:
            raise HTTPException(status_code=404, detail="Model not found or no data available")
        
        return ModelHealthResponse(
            model_id=health_status.model_id,
            status=health_status.status.value,
            health_score=health_status.health_score,
            performance_trend=health_status.performance_trend,
            last_checked=health_status.last_checked.isoformat(),
            alerts=[alert.to_dict() for alert in health_status.alerts],
            metrics_summary=health_status.metrics_summary,
            uptime_hours=health_status.uptime_hours
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model health for {model_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get model health status")

@router.get("/models/{model_id}/metrics", summary="Get model performance metrics")
async def get_model_metrics(
    model_id: str,
    limit: int = Query(default=100, description="Maximum number of metrics to return"),
    hours: Optional[int] = Query(default=None, description="Filter metrics from last N hours")
):
    """Get performance metrics for a specific model"""
    try:
        monitoring_service = await get_monitoring_service()
        
        if model_id not in monitoring_service.performance_history:
            raise HTTPException(status_code=404, detail="Model not found")
        
        metrics = monitoring_service.performance_history[model_id]
        
        # Filter by time if specified
        if hours:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            metrics = [m for m in metrics if m.timestamp > cutoff_time]
        
        # Limit results
        metrics = metrics[-limit:] if limit > 0 else metrics
        
        return {
            "model_id": model_id,
            "total_metrics": len(metrics),
            "metrics": [m.to_dict() for m in metrics]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get metrics for {model_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get model metrics")

@router.get("/models/compare", response_model=ComparativeAnalysisResponse, summary="Compare multiple models")
async def compare_models(
    model_ids: List[str] = Query(..., description="List of model IDs to compare")
):
    """Get comparative analysis across multiple models"""
    try:
        monitoring_service = await get_monitoring_service()
        
        comparison = await monitoring_service.get_comparative_analysis(model_ids)
        
        return ComparativeAnalysisResponse(
            models=comparison['models'],
            rankings=comparison['rankings'],
            summary=comparison['summary']
        )
        
    except Exception as e:
        logger.error(f"Failed to compare models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compare models")

@router.get("/models", summary="List all monitored models")
async def list_monitored_models():
    """Get list of all models currently being monitored"""
    try:
        monitoring_service = await get_monitoring_service()
        
        models_info = []
        for model_id in monitoring_service.performance_history.keys():
            metrics = monitoring_service.performance_history[model_id]
            health_status = await monitoring_service.get_model_health_status(model_id)
            
            model_info = {
                "model_id": model_id,
                "total_metrics": len(metrics),
                "last_update": metrics[-1].timestamp.isoformat() if metrics else None,
                "health_score": health_status.health_score if health_status else 0,
                "status": health_status.status.value if health_status else "unknown"
            }
            models_info.append(model_info)
        
        return {
            "total_models": len(models_info),
            "models": models_info,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to list monitored models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list monitored models")

@router.get("/models/{model_id}/report", summary="Export detailed performance report")
async def export_performance_report(
    model_id: str,
    start_date: Optional[str] = Query(default=None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(default=None, description="End date (ISO format)")
):
    """Export detailed performance report for a model"""
    try:
        monitoring_service = await get_monitoring_service()
        
        # Parse dates if provided
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        report = await monitoring_service.export_performance_report(
            model_id=model_id,
            start_date=start_dt,
            end_date=end_dt
        )
        
        if not report:
            raise HTTPException(status_code=404, detail="Model not found or no data available")
        
        return report
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to export performance report for {model_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export performance report")

@router.get("/alerts", summary="Get recent alerts")
async def get_recent_alerts(
    limit: int = Query(default=50, description="Maximum number of alerts to return"),
    severity: Optional[str] = Query(default=None, description="Filter by severity level"),
    model_id: Optional[str] = Query(default=None, description="Filter by model ID")
):
    """Get recent drift and performance alerts"""
    try:
        # In production, this would fetch from an alerts database
        # For now, return a sample response structure
        
        alerts = []  # Placeholder - would fetch from alert storage
        
        return {
            "total_alerts": len(alerts),
            "alerts": alerts,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get recent alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recent alerts")

@router.post("/control/start", summary="Start monitoring system")
async def start_monitoring():
    """Start the performance monitoring system"""
    try:
        monitoring_service = await get_monitoring_service()
        
        if monitoring_service.is_monitoring:
            return {
                "success": True,
                "message": "Monitoring system is already running",
                "timestamp": datetime.now().isoformat()
            }
        
        # Note: In production, this would be handled by a background service
        # For now, just mark as monitoring
        monitoring_service.is_monitoring = True
        
        return {
            "success": True,
            "message": "Monitoring system started",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to start monitoring: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start monitoring system")

@router.post("/control/stop", summary="Stop monitoring system")
async def stop_monitoring():
    """Stop the performance monitoring system"""
    try:
        monitoring_service = await get_monitoring_service()
        
        await monitoring_service.stop_monitoring()
        
        return {
            "success": True,
            "message": "Monitoring system stopped",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to stop monitoring: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stop monitoring system")

@router.get("/dashboard/overview", summary="Get monitoring dashboard overview")
async def get_dashboard_overview():
    """Get overview data for the monitoring dashboard"""
    try:
        monitoring_service = await get_monitoring_service()
        
        # Collect overview statistics
        total_models = len(monitoring_service.performance_history)
        active_models = 0
        total_predictions = 0
        avg_health_score = 0
        
        model_statuses = {"healthy": 0, "warning": 0, "critical": 0, "failed": 0}
        
        for model_id in monitoring_service.performance_history.keys():
            metrics = monitoring_service.performance_history[model_id]
            if metrics:
                active_models += 1
                total_predictions += sum(m.predictions_count for m in metrics)
                
                health_status = await monitoring_service.get_model_health_status(model_id)
                if health_status:
                    avg_health_score += health_status.health_score
                    model_statuses[health_status.status.value] = model_statuses.get(health_status.status.value, 0) + 1
        
        avg_health_score = avg_health_score / max(active_models, 1)
        
        return {
            "system_status": "active" if monitoring_service.is_monitoring else "inactive",
            "total_models": total_models,
            "active_models": active_models,
            "total_predictions": total_predictions,
            "avg_health_score": avg_health_score,
            "model_statuses": model_statuses,
            "monitoring_uptime_hours": 24,  # Placeholder
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get dashboard overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard overview")

# Health check endpoint
@router.get("/health", summary="Health check for monitoring service")
async def health_check():
    """Health check endpoint for the monitoring service"""
    try:
        monitoring_service = await get_monitoring_service()
        
        return {
            "status": "healthy",
            "monitoring_active": monitoring_service.is_monitoring,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Service unhealthy")
