"""
Unified Analytics Domain Router

RESTful API endpoints for all analytics operations.
Consolidates analytics routes into a logical, maintainable structure.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from fastapi.responses import JSONResponse
import logging

from .service import UnifiedAnalyticsService
from .models import (
    AnalyticsRequest,
    AnalyticsResponse,
    PerformanceMetricsRequest,
    ModelPerformanceRequest, 
    UserAnalyticsRequest,
    PerformanceMetrics,
    ModelPerformanceReport,
    DataQualityReport,
    UserAnalyticsReport,
    BusinessIntelligenceReport,
    SystemHealthMetrics,
    DashboardResponse,
    AlertData,
    HealthResponse,
    AnalyticsError,
    AnalyticsType,
    TimeFrame,
    Sport,
    AlertSeverity,
)

logger = logging.getLogger(__name__)

# Create router
analytics_router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["analytics"],
    responses={
        404: {"model": AnalyticsError, "description": "Not found"},
        500: {"model": AnalyticsError, "description": "Internal server error"},
    }
)

# Service dependency
async def get_analytics_service() -> UnifiedAnalyticsService:
    """Get analytics service instance"""
    service = UnifiedAnalyticsService()
    if not service.is_initialized:
        await service.initialize()
    return service


@analytics_router.get("/health", response_model=HealthResponse)
async def health_check(
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Check analytics service health
    """
    try:
        return await service.health_check()
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


@analytics_router.post("/", response_model=AnalyticsResponse)
async def get_analytics(
    request: AnalyticsRequest,
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get analytics data based on request type
    
    **Request Body:**
    - **analytics_type**: Type of analytics (performance, model, data_quality, user_behavior, business_intelligence, system_health)
    - **time_frame**: Time frame for analysis (1h, 6h, 24h, 7d, 30d, 90d)
    - **sport**: Optional sport filter
    - **filters**: Additional filters
    - **include_breakdown**: Include detailed breakdown
    - **real_time**: Real-time data required
    
    **Returns:**
    - Analytics response with relevant metrics and insights
    """
    try:
        return await service.get_analytics(request)
    except Exception as e:
        logger.error(f"Get analytics failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics request failed: {str(e)}")


@analytics_router.get("/performance", response_model=AnalyticsResponse)
async def get_performance_analytics(
    component: Optional[str] = Query(None, description="Component filter"),
    endpoint: Optional[str] = Query(None, description="Endpoint filter"),
    time_frame: TimeFrame = Query(TimeFrame.LAST_24_HOURS, description="Time frame"),
    include_percentiles: bool = Query(True, description="Include percentile data"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get system performance analytics
    
    **Query Parameters:**
    - **component**: Filter by component (api_gateway, prediction_service, etc.)
    - **endpoint**: Filter by API endpoint
    - **time_frame**: Time frame for analysis
    - **include_percentiles**: Include response time percentiles
    
    **Returns:**
    - Performance metrics including response times, throughput, errors
    """
    try:
        request = AnalyticsRequest(
            analytics_type=AnalyticsType.PERFORMANCE,
            time_frame=time_frame,
            filters={
                "component": component,
                "endpoint": endpoint,
                "include_percentiles": include_percentiles
            }
        )
        
        return await service.get_analytics(request)
    except Exception as e:
        logger.error(f"Get performance analytics failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get performance analytics")


@analytics_router.get("/models/performance", response_model=AnalyticsResponse)
async def get_model_performance(
    model_id: Optional[str] = Query(None, description="Specific model ID"),
    sport: Optional[Sport] = Query(None, description="Sport filter"),
    time_frame: TimeFrame = Query(TimeFrame.LAST_7_DAYS, description="Time frame"),
    include_comparison: bool = Query(False, description="Include model comparison"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get ML model performance analytics
    
    **Query Parameters:**
    - **model_id**: Specific model identifier
    - **sport**: Sport filter (mlb, nba, nfl, nhl)
    - **time_frame**: Time frame for analysis
    - **include_comparison**: Include comparison with other models
    
    **Returns:**
    - Model performance metrics including accuracy, ROI, latency
    """
    try:
        request = AnalyticsRequest(
            analytics_type=AnalyticsType.MODEL,
            time_frame=time_frame,
            sport=sport,
            filters={
                "model_id": model_id,
                "include_comparison": include_comparison
            }
        )
        
        return await service.get_analytics(request)
    except Exception as e:
        logger.error(f"Get model performance failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get model performance")


@analytics_router.get("/data/quality", response_model=AnalyticsResponse)
async def get_data_quality_analytics(
    sport: Optional[Sport] = Query(None, description="Sport filter"),
    data_source: Optional[str] = Query(None, description="Data source filter"),
    time_frame: TimeFrame = Query(TimeFrame.LAST_24_HOURS, description="Time frame"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get data quality analytics
    
    **Query Parameters:**
    - **sport**: Sport filter
    - **data_source**: Data source filter (sportradar, baseball_savant, etc.)
    - **time_frame**: Time frame for analysis
    
    **Returns:**
    - Data quality metrics including completeness, accuracy, consistency
    """
    try:
        request = AnalyticsRequest(
            analytics_type=AnalyticsType.DATA_QUALITY,
            time_frame=time_frame,
            sport=sport,
            filters={"data_source": data_source}
        )
        
        return await service.get_analytics(request)
    except Exception as e:
        logger.error(f"Get data quality analytics failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get data quality analytics")


@analytics_router.get("/users", response_model=AnalyticsResponse)
async def get_user_analytics(
    user_segment: Optional[str] = Query(None, description="User segment filter"),
    feature: Optional[str] = Query(None, description="Feature usage filter"),
    time_frame: TimeFrame = Query(TimeFrame.LAST_30_DAYS, description="Time frame"),
    include_cohort: bool = Query(False, description="Include cohort analysis"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get user behavior analytics
    
    **Query Parameters:**
    - **user_segment**: User segment filter (premium, free, enterprise)
    - **feature**: Feature usage filter
    - **time_frame**: Time frame for analysis
    - **include_cohort**: Include cohort analysis
    
    **Returns:**
    - User analytics including engagement, retention, feature adoption
    """
    try:
        request = AnalyticsRequest(
            analytics_type=AnalyticsType.USER_BEHAVIOR,
            time_frame=time_frame,
            filters={
                "user_segment": user_segment,
                "feature": feature,
                "include_cohort": include_cohort
            }
        )
        
        return await service.get_analytics(request)
    except Exception as e:
        logger.error(f"Get user analytics failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user analytics")


@analytics_router.get("/business", response_model=AnalyticsResponse)
async def get_business_intelligence(
    time_frame: TimeFrame = Query(TimeFrame.LAST_30_DAYS, description="Time frame"),
    include_forecasts: bool = Query(False, description="Include forecasts"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get business intelligence analytics
    
    **Query Parameters:**
    - **time_frame**: Time frame for analysis
    - **include_forecasts**: Include revenue and growth forecasts
    
    **Returns:**
    - Business metrics including revenue, growth, KPIs
    """
    try:
        request = AnalyticsRequest(
            analytics_type=AnalyticsType.BUSINESS_INTELLIGENCE,
            time_frame=time_frame,
            filters={"include_forecasts": include_forecasts}
        )
        
        return await service.get_analytics(request)
    except Exception as e:
        logger.error(f"Get business intelligence failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get business intelligence")


@analytics_router.get("/system/health", response_model=AnalyticsResponse)
async def get_system_health(
    include_breakdown: bool = Query(True, description="Include component breakdown"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get system health analytics
    
    **Query Parameters:**
    - **include_breakdown**: Include detailed component breakdown
    
    **Returns:**
    - System health metrics including uptime, resource usage, alerts
    """
    try:
        request = AnalyticsRequest(
            analytics_type=AnalyticsType.SYSTEM_HEALTH,
            time_frame=TimeFrame.LAST_24_HOURS,
            include_breakdown=include_breakdown
        )
        
        return await service.get_analytics(request)
    except Exception as e:
        logger.error(f"Get system health failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system health")


@analytics_router.get("/dashboard/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: str = Path(..., description="Dashboard identifier"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get analytics dashboard data
    
    **Path Parameters:**
    - **dashboard_id**: Dashboard identifier (main, performance, models, business)
    
    **Returns:**
    - Dashboard data with widgets, metrics, and alerts
    """
    try:
        return await service.get_dashboard(dashboard_id)
    except Exception as e:
        logger.error(f"Get dashboard failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard")


@analytics_router.get("/alerts", response_model=List[AlertData])
async def get_active_alerts(
    severity: Optional[AlertSeverity] = Query(None, description="Alert severity filter"),
    component: Optional[str] = Query(None, description="Component filter"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of alerts"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Get active alerts
    
    **Query Parameters:**
    - **severity**: Filter by alert severity (low, medium, high, critical)
    - **component**: Filter by component
    - **limit**: Maximum number of alerts to return
    
    **Returns:**
    - List of active alerts with details
    """
    try:
        alerts = list(service.active_alerts.values())
        
        # Apply filters
        if severity:
            alerts = [alert for alert in alerts if alert.severity == severity]
        
        if component:
            alerts = [alert for alert in alerts if alert.component == component]
        
        # Sort by severity and time
        severity_order = {
            AlertSeverity.CRITICAL: 4,
            AlertSeverity.HIGH: 3,
            AlertSeverity.MEDIUM: 2,
            AlertSeverity.LOW: 1
        }
        
        alerts.sort(
            key=lambda a: (severity_order.get(a.severity, 0), a.triggered_at),
            reverse=True
        )
        
        return alerts[:limit]
        
    except Exception as e:
        logger.error(f"Get alerts failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get alerts")


@analytics_router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str = Path(..., description="Alert ID"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Acknowledge an alert
    
    **Path Parameters:**
    - **alert_id**: Alert identifier
    
    **Returns:**
    - Acknowledgment status
    """
    try:
        success = await service.acknowledge_alert(alert_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {"status": "acknowledged", "alert_id": alert_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Acknowledge alert failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to acknowledge alert")


@analytics_router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str = Path(..., description="Alert ID"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Resolve an alert
    
    **Path Parameters:**
    - **alert_id**: Alert identifier
    
    **Returns:**
    - Resolution status
    """
    try:
        success = await service.resolve_alert(alert_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {"status": "resolved", "alert_id": alert_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resolve alert failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve alert")


@analytics_router.post("/metrics/ingest")
async def ingest_metric(
    metric_name: str = Query(..., description="Metric name"),
    value: float = Query(..., description="Metric value"),
    labels: Optional[str] = Query(None, description="JSON-encoded labels"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Ingest a real-time metric (for external integrations)
    
    **Query Parameters:**
    - **metric_name**: Name of the metric
    - **value**: Metric value
    - **labels**: Optional JSON-encoded labels
    
    **Returns:**
    - Ingestion status
    """
    try:
        import json
        parsed_labels = json.loads(labels) if labels else None
        
        await service.ingest_metric(metric_name, value, parsed_labels)
        
        return {
            "status": "ingested",
            "metric_name": metric_name,
            "value": value,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Metric ingestion failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest metric")


@analytics_router.get("/exports/report")
async def export_analytics_report(
    analytics_type: AnalyticsType = Query(..., description="Analytics type"),
    time_frame: TimeFrame = Query(TimeFrame.LAST_30_DAYS, description="Time frame"),
    format: str = Query("json", description="Export format (json, csv)"),
    service: UnifiedAnalyticsService = Depends(get_analytics_service)
):
    """
    Export analytics report
    
    **Query Parameters:**
    - **analytics_type**: Type of analytics to export
    - **time_frame**: Time frame for report
    - **format**: Export format (json, csv)
    
    **Returns:**
    - Analytics report in requested format
    """
    try:
        request = AnalyticsRequest(
            analytics_type=analytics_type,
            time_frame=time_frame
        )
        
        response = await service.get_analytics(request)
        
        if format.lower() == "csv":
            # Convert to CSV format (simplified implementation)
            return {"message": "CSV export not implemented yet", "data": response.dict()}
        else:
            return response
            
    except Exception as e:
        logger.error(f"Export report failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to export report")


# Error handlers
@analytics_router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@analytics_router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception in analytics router: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
