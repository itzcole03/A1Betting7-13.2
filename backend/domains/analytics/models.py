"""
Unified Analytics Domain Models

Standardized data models for all analytics operations including performance tracking,
monitoring, reporting, and business intelligence.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from decimal import Decimal
from pydantic import BaseModel, Field, validator


class Sport(str, Enum):
    """Supported sports"""
    MLB = "mlb"
    NBA = "nba"
    NFL = "nfl" 
    NHL = "nhl"


class AnalyticsType(str, Enum):
    """Types of analytics"""
    PERFORMANCE = "performance"
    MODEL = "model"
    DATA_QUALITY = "data_quality"
    SYSTEM_HEALTH = "system_health"
    USER_BEHAVIOR = "user_behavior"
    BUSINESS_INTELLIGENCE = "business_intelligence"
    REAL_TIME = "real_time"


class MetricType(str, Enum):
    """Metric types"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


class TimeFrame(str, Enum):
    """Time frame options"""
    LAST_HOUR = "1h"
    LAST_6_HOURS = "6h"
    LAST_24_HOURS = "24h"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    LAST_90_DAYS = "90d"


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Request Models
class AnalyticsRequest(BaseModel):
    """Base analytics request"""
    analytics_type: AnalyticsType
    time_frame: TimeFrame = Field(TimeFrame.LAST_24_HOURS, description="Time frame for analytics")
    sport: Optional[Sport] = Field(None, description="Sport filter")
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional filters")
    include_breakdown: bool = Field(False, description="Include detailed breakdown")
    real_time: bool = Field(False, description="Real-time data required")


class PerformanceMetricsRequest(BaseModel):
    """Performance metrics request"""
    component: Optional[str] = Field(None, description="Component filter")
    endpoint: Optional[str] = Field(None, description="Endpoint filter")
    time_frame: TimeFrame = Field(TimeFrame.LAST_24_HOURS)
    include_percentiles: bool = Field(True, description="Include percentile data")


class ModelPerformanceRequest(BaseModel):
    """Model performance analytics request"""
    model_id: Optional[str] = Field(None, description="Specific model ID")
    sport: Optional[Sport] = Field(None, description="Sport filter")
    time_frame: TimeFrame = Field(TimeFrame.LAST_7_DAYS)
    include_comparison: bool = Field(False, description="Include model comparison")


class UserAnalyticsRequest(BaseModel):
    """User analytics request"""
    user_segment: Optional[str] = Field(None, description="User segment filter")
    feature: Optional[str] = Field(None, description="Feature usage filter")
    time_frame: TimeFrame = Field(TimeFrame.LAST_30_DAYS)
    include_cohort: bool = Field(False, description="Include cohort analysis")


# Core Metric Models
class MetricPoint(BaseModel):
    """Single metric data point"""
    timestamp: datetime
    value: float
    labels: Optional[Dict[str, str]] = Field(None, description="Metric labels")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TimeSeries(BaseModel):
    """Time series data"""
    metric_name: str
    metric_type: MetricType
    unit: Optional[str] = None
    data_points: List[MetricPoint]
    aggregation: Optional[str] = Field(None, description="Aggregation method")
    
    @validator('data_points')
    def validate_data_points(cls, v):
        if not v:
            raise ValueError('Data points cannot be empty')
        return sorted(v, key=lambda x: x.timestamp)


class PerformanceMetrics(BaseModel):
    """System performance metrics"""
    component: str
    
    # Response time metrics
    avg_response_time_ms: float
    p50_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    
    # Throughput metrics
    requests_per_second: float
    total_requests: int
    
    # Error metrics
    error_rate: float
    error_count: int
    
    # Resource metrics
    cpu_usage_percent: float
    memory_usage_mb: float
    
    # Cache metrics
    cache_hit_rate: float
    cache_miss_rate: float
    
    # Database metrics
    db_query_time_ms: float
    db_connection_pool_usage: float
    
    # Time range
    time_frame: TimeFrame
    measured_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ModelPerformanceReport(BaseModel):
    """ML model performance report"""
    model_id: str
    model_type: str
    sport: Sport
    
    # Accuracy metrics
    accuracy: float = Field(..., ge=0, le=1)
    precision: float = Field(..., ge=0, le=1)
    recall: float = Field(..., ge=0, le=1)
    f1_score: float = Field(..., ge=0, le=1)
    auc_roc: float = Field(..., ge=0, le=1)
    
    # Regression metrics (if applicable)
    mae: Optional[float] = Field(None, ge=0)
    rmse: Optional[float] = Field(None, ge=0)
    r2_score: Optional[float] = Field(None, ge=-1, le=1)
    
    # Business metrics
    roi: float = Field(..., description="Return on investment")
    win_rate: float = Field(..., ge=0, le=1)
    avg_confidence: float = Field(..., ge=0, le=1)
    sharpe_ratio: float = Field(..., description="Risk-adjusted return")
    
    # Volume metrics
    predictions_made: int = Field(..., ge=0)
    predictions_per_day: float = Field(..., ge=0)
    
    # Latency metrics
    avg_prediction_time_ms: float = Field(..., ge=0)
    p95_prediction_time_ms: float = Field(..., ge=0)
    
    # Drift detection
    data_drift_score: float = Field(..., ge=0, le=1)
    concept_drift_score: float = Field(..., ge=0, le=1)
    drift_detected: bool
    
    # Time range
    time_frame: TimeFrame
    last_updated: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DataQualityReport(BaseModel):
    """Data quality analysis report"""
    data_source: str
    sport: Sport
    
    # Quality dimensions
    completeness: float = Field(..., ge=0, le=1, description="Data completeness score")
    accuracy: float = Field(..., ge=0, le=1, description="Data accuracy score")
    consistency: float = Field(..., ge=0, le=1, description="Data consistency score")
    timeliness: float = Field(..., ge=0, le=1, description="Data timeliness score")
    validity: float = Field(..., ge=0, le=1, description="Data validity score")
    uniqueness: float = Field(..., ge=0, le=1, description="Data uniqueness score")
    
    # Overall score
    overall_quality_score: float = Field(..., ge=0, le=1)
    
    # Issue tracking
    issues_detected: int = Field(..., ge=0)
    critical_issues: int = Field(..., ge=0)
    warnings: int = Field(..., ge=0)
    
    # Volume metrics
    total_records: int = Field(..., ge=0)
    valid_records: int = Field(..., ge=0)
    invalid_records: int = Field(..., ge=0)
    
    # Freshness metrics
    latest_data_timestamp: datetime
    data_lag_minutes: float = Field(..., ge=0)
    
    # Issues breakdown
    issue_categories: Dict[str, int] = Field(default_factory=dict)
    
    # Time range
    time_frame: TimeFrame
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserAnalyticsReport(BaseModel):
    """User behavior analytics report"""
    
    # User engagement metrics
    total_users: int = Field(..., ge=0)
    active_users: int = Field(..., ge=0)
    new_users: int = Field(..., ge=0)
    returning_users: int = Field(..., ge=0)
    
    # Session metrics
    avg_session_duration_minutes: float = Field(..., ge=0)
    sessions_per_user: float = Field(..., ge=0)
    bounce_rate: float = Field(..., ge=0, le=1)
    
    # Feature usage
    feature_adoption_rates: Dict[str, float] = Field(default_factory=dict)
    most_used_features: List[str] = Field(default_factory=list)
    least_used_features: List[str] = Field(default_factory=list)
    
    # Conversion metrics
    conversion_rate: float = Field(..., ge=0, le=1)
    trial_to_paid_rate: float = Field(..., ge=0, le=1)
    churn_rate: float = Field(..., ge=0, le=1)
    
    # Engagement scoring
    engagement_score: float = Field(..., ge=0, le=1)
    user_satisfaction_score: float = Field(..., ge=0, le=5)
    
    # Cohort analysis (if requested)
    cohort_retention: Optional[Dict[str, float]] = Field(None)
    
    # Time range
    time_frame: TimeFrame
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class BusinessIntelligenceReport(BaseModel):
    """Business intelligence and KPI report"""
    
    # Revenue metrics
    total_revenue: Decimal = Field(..., ge=0)
    monthly_recurring_revenue: Decimal = Field(..., ge=0)
    average_revenue_per_user: Decimal = Field(..., ge=0)
    
    # Growth metrics
    user_growth_rate: float
    revenue_growth_rate: float
    
    # Platform usage
    total_predictions_made: int = Field(..., ge=0)
    successful_predictions: int = Field(..., ge=0)
    prediction_accuracy_rate: float = Field(..., ge=0, le=1)
    
    # Sports breakdown
    predictions_by_sport: Dict[str, int] = Field(default_factory=dict)
    revenue_by_sport: Dict[str, Decimal] = Field(default_factory=dict)
    
    # User segments
    premium_users: int = Field(..., ge=0)
    free_users: int = Field(..., ge=0)
    enterprise_users: int = Field(..., ge=0)
    
    # Cost metrics
    customer_acquisition_cost: Decimal = Field(..., ge=0)
    customer_lifetime_value: Decimal = Field(..., ge=0)
    ltv_cac_ratio: float = Field(..., ge=0)
    
    # Support metrics
    support_tickets: int = Field(..., ge=0)
    avg_resolution_time_hours: float = Field(..., ge=0)
    customer_satisfaction_score: float = Field(..., ge=0, le=5)
    
    # Time range
    time_frame: TimeFrame
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class SystemHealthMetrics(BaseModel):
    """Overall system health metrics"""
    
    # System status
    overall_health_score: float = Field(..., ge=0, le=1)
    status: str = Field(..., description="healthy, degraded, unhealthy")
    
    # Service availability
    services_online: int = Field(..., ge=0)
    services_total: int = Field(..., ge=0)
    uptime_percentage: float = Field(..., ge=0, le=100)
    
    # Performance overview
    avg_api_response_time_ms: float = Field(..., ge=0)
    error_rate_percentage: float = Field(..., ge=0, le=100)
    
    # Resource utilization
    cpu_utilization_percentage: float = Field(..., ge=0, le=100)
    memory_utilization_percentage: float = Field(..., ge=0, le=100)
    disk_utilization_percentage: float = Field(..., ge=0, le=100)
    
    # Database health
    database_connections: int = Field(..., ge=0)
    database_query_latency_ms: float = Field(..., ge=0)
    
    # Cache performance
    cache_hit_rate_percentage: float = Field(..., ge=0, le=100)
    cache_memory_usage_mb: float = Field(..., ge=0)
    
    # Active alerts
    active_alerts: int = Field(..., ge=0)
    critical_alerts: int = Field(..., ge=0)
    
    # Recent incidents
    incidents_last_24h: int = Field(..., ge=0)
    avg_incident_resolution_time_minutes: float = Field(..., ge=0)
    
    # Timestamp
    measured_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AlertData(BaseModel):
    """Alert/notification data"""
    alert_id: str
    title: str
    message: str
    severity: AlertSeverity
    component: str
    
    # Metrics
    threshold_value: float
    current_value: float
    
    # Timing
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    
    # Status
    is_resolved: bool = False
    is_acknowledged: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Response Models
class AnalyticsResponse(BaseModel):
    """Unified analytics response"""
    request_id: str
    analytics_type: AnalyticsType
    
    # Data payload
    performance_metrics: Optional[PerformanceMetrics] = None
    model_performance: Optional[ModelPerformanceReport] = None
    data_quality: Optional[DataQualityReport] = None
    user_analytics: Optional[UserAnalyticsReport] = None
    business_intelligence: Optional[BusinessIntelligenceReport] = None
    system_health: Optional[SystemHealthMetrics] = None
    
    # Time series data
    time_series: Optional[List[TimeSeries]] = None
    
    # Alerts and notifications
    active_alerts: Optional[List[AlertData]] = None
    
    # Metadata
    time_frame: TimeFrame
    generated_at: datetime
    expires_at: Optional[datetime] = None
    cached: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DashboardResponse(BaseModel):
    """Analytics dashboard response"""
    dashboard_id: str
    title: str
    
    # Widget data
    widgets: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Overall metrics
    summary_metrics: Dict[str, Any] = Field(default_factory=dict)
    
    # Alerts
    recent_alerts: List[AlertData] = Field(default_factory=list)
    
    # Refresh info
    last_updated: datetime
    next_refresh: Optional[datetime] = None
    auto_refresh_seconds: int = Field(300, description="Auto-refresh interval")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthResponse(BaseModel):
    """Analytics service health response"""
    status: str
    analytics_engines_online: int
    total_analytics_engines: int
    metrics_collected_last_hour: int
    avg_processing_time_ms: float
    storage_usage_gb: float
    last_alert: Optional[datetime] = None
    uptime_seconds: float
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Error Models
class AnalyticsError(BaseModel):
    """Analytics error response"""
    error_code: str
    message: str
    component: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
