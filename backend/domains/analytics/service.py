"""
Unified Analytics Service

Consolidates all performance tracking, reporting, and analytical capabilities
into a comprehensive service that provides insights into both user behavior and system performance.
"""

import asyncio
import logging
import uuid
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
from collections import defaultdict, deque
from decimal import Decimal

import numpy as np
import pandas as pd

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
    TimeSeries,
    MetricPoint,
    HealthResponse,
    AnalyticsType,
    TimeFrame,
    MetricType,
    AlertSeverity,
    Sport,
)

# Import existing services for gradual migration
try:
    from backend.services.realtime_analytics_engine import RealtimeAnalyticsEngine
    from backend.services.model_performance_tracker import ModelPerformanceTracker
    from backend.services.data_quality_monitor import DataQualityMonitor
    from backend.services.comprehensive_observability import ComprehensiveObservability
    LEGACY_SERVICES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Legacy analytics services not available: {e}")
    LEGACY_SERVICES_AVAILABLE = False

logger = logging.getLogger(__name__)


class UnifiedAnalyticsService:
    """
    Unified service that consolidates all analytics capabilities.
    
    This service handles performance tracking, reporting, analytics, and monitoring
    while providing insights into user behavior and system performance.
    """
    
    def __init__(self):
        self.cache_dir = Path("backend/cache/analytics")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Service state
        self.is_initialized = False
        self.analytics_engines_online = 0
        self.service_start_time = datetime.now(timezone.utc)
        
        # Metrics storage (in-memory for demo - would use time series DB in production)
        self.metrics_buffer = defaultdict(lambda: deque(maxlen=10000))
        self.performance_cache = {}
        self.alert_history = deque(maxlen=1000)
        
        # Analytics engines
        self.engines = {}
        self.active_alerts = {}
        
        # Legacy service integration
        self.legacy_realtime_engine = None
        self.legacy_performance_tracker = None
        self.legacy_quality_monitor = None
        self.legacy_observability = None
        
        if LEGACY_SERVICES_AVAILABLE:
            self._initialize_legacy_services()
    
    def _initialize_legacy_services(self):
        """Initialize legacy services for gradual migration"""
        try:
            self.legacy_realtime_engine = RealtimeAnalyticsEngine()
            self.legacy_performance_tracker = ModelPerformanceTracker()
            self.legacy_quality_monitor = DataQualityMonitor()
            self.legacy_observability = ComprehensiveObservability()
            logger.info("Legacy analytics services initialized")
        except Exception as e:
            logger.error(f"Failed to initialize legacy analytics services: {e}")
    
    async def initialize(self) -> bool:
        """Initialize the analytics service"""
        try:
            logger.info("Initializing Unified Analytics Service...")
            
            # Initialize analytics engines
            await self._initialize_analytics_engines()
            
            # Start background monitoring
            asyncio.create_task(self._background_monitoring())
            
            # Initialize sample data
            await self._initialize_sample_metrics()
            
            self.is_initialized = True
            logger.info(f"Analytics service initialized. Engines online: {self.analytics_engines_online}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize analytics service: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup service resources"""
        try:
            # Stop background tasks
            logger.info("Analytics service cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
    
    async def _initialize_analytics_engines(self):
        """Initialize different analytics engines"""
        try:
            engines = [
                "performance_monitor",
                "model_tracker", 
                "data_quality",
                "user_behavior",
                "business_intelligence",
                "real_time_engine"
            ]
            
            for engine in engines:
                try:
                    # Mock engine initialization
                    self.engines[engine] = {"status": "online", "last_check": datetime.now(timezone.utc)}
                    self.analytics_engines_online += 1
                except Exception as e:
                    logger.warning(f"Failed to initialize engine {engine}: {e}")
                    self.engines[engine] = {"status": "offline", "error": str(e)}
                    
        except Exception as e:
            logger.error(f"Failed to initialize analytics engines: {e}")
    
    async def _initialize_sample_metrics(self):
        """Initialize sample metrics for demonstration"""
        try:
            # Generate sample performance metrics
            now = datetime.now(timezone.utc)
            for i in range(100):
                timestamp = now - timedelta(minutes=i)
                
                # API response times
                self.metrics_buffer["api_response_time"].append(
                    MetricPoint(
                        timestamp=timestamp,
                        value=np.random.normal(150, 50),  # ms
                        labels={"endpoint": "/api/v1/predictions"}
                    )
                )
                
                # Model accuracy
                self.metrics_buffer["model_accuracy"].append(
                    MetricPoint(
                        timestamp=timestamp,
                        value=np.random.normal(0.85, 0.05),
                        labels={"model": "ensemble", "sport": "mlb"}
                    )
                )
                
                # System CPU
                self.metrics_buffer["cpu_usage"].append(
                    MetricPoint(
                        timestamp=timestamp,
                        value=np.random.uniform(20, 80),  # %
                        labels={"component": "prediction_service"}
                    )
                )
                
        except Exception as e:
            logger.error(f"Failed to initialize sample metrics: {e}")
    
    async def _background_monitoring(self):
        """Background monitoring and alerting"""
        while True:
            try:
                await self._check_system_health()
                await self._generate_alerts()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Background monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def _check_system_health(self):
        """Check overall system health"""
        try:
            # Mock health checks
            current_time = datetime.now(timezone.utc)
            
            # Update engine status
            for engine_name, engine_data in self.engines.items():
                # Simulate occasional engine issues
                if np.random.random() < 0.05:  # 5% chance of issue
                    engine_data["status"] = "degraded"
                else:
                    engine_data["status"] = "online"
                engine_data["last_check"] = current_time
                
        except Exception as e:
            logger.error(f"Health check failed: {e}")
    
    async def _generate_alerts(self):
        """Generate alerts based on metrics"""
        try:
            current_time = datetime.now(timezone.utc)
            
            # Check for high response times
            if "api_response_time" in self.metrics_buffer:
                recent_metrics = [
                    m for m in self.metrics_buffer["api_response_time"] 
                    if (current_time - m.timestamp).total_seconds() < 300  # Last 5 minutes
                ]
                
                if recent_metrics:
                    avg_response_time = sum(m.value for m in recent_metrics) / len(recent_metrics)
                    
                    if avg_response_time > 500:  # Alert if > 500ms
                        alert = AlertData(
                            alert_id=str(uuid.uuid4()),
                            title="High API Response Time",
                            message=f"Average API response time is {avg_response_time:.1f}ms",
                            severity=AlertSeverity.HIGH if avg_response_time > 1000 else AlertSeverity.MEDIUM,
                            component="api_gateway",
                            threshold_value=500.0,
                            current_value=avg_response_time,
                            triggered_at=current_time
                        )
                        
                        self.active_alerts[alert.alert_id] = alert
                        self.alert_history.append(alert)
                        
        except Exception as e:
            logger.error(f"Alert generation failed: {e}")
    
    async def get_analytics(self, request: AnalyticsRequest) -> AnalyticsResponse:
        """
        Get analytics based on request type
        """
        try:
            request_id = str(uuid.uuid4())
            
            response_data = {
                "request_id": request_id,
                "analytics_type": request.analytics_type,
                "time_frame": request.time_frame,
                "generated_at": datetime.now(timezone.utc),
                "cached": False
            }
            
            # Route to appropriate analytics method
            if request.analytics_type == AnalyticsType.PERFORMANCE:
                response_data["performance_metrics"] = await self._get_performance_metrics(request)
            elif request.analytics_type == AnalyticsType.MODEL:
                response_data["model_performance"] = await self._get_model_performance(request)
            elif request.analytics_type == AnalyticsType.DATA_QUALITY:
                response_data["data_quality"] = await self._get_data_quality_report(request)
            elif request.analytics_type == AnalyticsType.USER_BEHAVIOR:
                response_data["user_analytics"] = await self._get_user_analytics(request)
            elif request.analytics_type == AnalyticsType.BUSINESS_INTELLIGENCE:
                response_data["business_intelligence"] = await self._get_business_intelligence(request)
            elif request.analytics_type == AnalyticsType.SYSTEM_HEALTH:
                response_data["system_health"] = await self._get_system_health_metrics()
            
            # Add active alerts
            response_data["active_alerts"] = list(self.active_alerts.values())
            
            return AnalyticsResponse(**response_data)
            
        except Exception as e:
            logger.error(f"Get analytics failed: {e}")
            raise
    
    async def _get_performance_metrics(self, request: AnalyticsRequest) -> PerformanceMetrics:
        """Get system performance metrics"""
        try:
            # Calculate metrics from buffer
            current_time = datetime.now(timezone.utc)
            cutoff_time = current_time - self._timeframe_to_timedelta(request.time_frame)
            
            # Get recent response time metrics
            response_times = [
                m.value for m in self.metrics_buffer["api_response_time"]
                if m.timestamp >= cutoff_time
            ]
            
            if not response_times:
                response_times = [150.0]  # Default fallback
            
            # Calculate percentiles
            p50 = np.percentile(response_times, 50)
            p95 = np.percentile(response_times, 95)
            p99 = np.percentile(response_times, 99)
            avg_response = np.mean(response_times)
            
            # Mock other metrics
            return PerformanceMetrics(
                component="api_gateway",
                avg_response_time_ms=avg_response,
                p50_response_time_ms=p50,
                p95_response_time_ms=p95,
                p99_response_time_ms=p99,
                requests_per_second=np.random.uniform(50, 200),
                total_requests=len(response_times),
                error_rate=np.random.uniform(0.01, 0.05),
                error_count=int(len(response_times) * np.random.uniform(0.01, 0.05)),
                cpu_usage_percent=np.random.uniform(30, 70),
                memory_usage_mb=np.random.uniform(1024, 4096),
                cache_hit_rate=np.random.uniform(0.75, 0.95),
                cache_miss_rate=np.random.uniform(0.05, 0.25),
                db_query_time_ms=np.random.uniform(10, 50),
                db_connection_pool_usage=np.random.uniform(0.2, 0.8),
                time_frame=request.time_frame,
                measured_at=current_time
            )
            
        except Exception as e:
            logger.error(f"Get performance metrics failed: {e}")
            raise
    
    async def _get_model_performance(self, request: AnalyticsRequest) -> ModelPerformanceReport:
        """Get ML model performance report"""
        try:
            sport = request.sport or Sport.MLB
            
            # Get recent accuracy metrics
            current_time = datetime.now(timezone.utc)
            cutoff_time = current_time - self._timeframe_to_timedelta(request.time_frame)
            
            accuracy_metrics = [
                m.value for m in self.metrics_buffer["model_accuracy"]
                if m.timestamp >= cutoff_time and m.labels.get("sport") == sport
            ]
            
            if not accuracy_metrics:
                accuracy_metrics = [0.85]  # Default fallback
            
            avg_accuracy = np.mean(accuracy_metrics)
            
            return ModelPerformanceReport(
                model_id="ensemble_v2",
                model_type="ensemble",
                sport=sport,
                accuracy=avg_accuracy,
                precision=avg_accuracy * np.random.uniform(0.95, 1.05),
                recall=avg_accuracy * np.random.uniform(0.95, 1.05),
                f1_score=avg_accuracy * np.random.uniform(0.95, 1.05),
                auc_roc=min(1.0, avg_accuracy + np.random.uniform(0.05, 0.15)),
                mae=np.random.uniform(0.1, 0.3),
                rmse=np.random.uniform(0.2, 0.5),
                r2_score=np.random.uniform(0.6, 0.9),
                roi=np.random.uniform(0.15, 0.35),
                win_rate=avg_accuracy * np.random.uniform(0.9, 1.1),
                avg_confidence=np.random.uniform(0.7, 0.9),
                sharpe_ratio=np.random.uniform(1.2, 2.5),
                predictions_made=np.random.randint(500, 2000),
                predictions_per_day=np.random.uniform(50, 200),
                avg_prediction_time_ms=np.random.uniform(100, 300),
                p95_prediction_time_ms=np.random.uniform(200, 500),
                data_drift_score=np.random.uniform(0.1, 0.3),
                concept_drift_score=np.random.uniform(0.05, 0.2),
                drift_detected=np.random.random() < 0.1,
                time_frame=request.time_frame,
                last_updated=current_time
            )
            
        except Exception as e:
            logger.error(f"Get model performance failed: {e}")
            raise
    
    async def _get_data_quality_report(self, request: AnalyticsRequest) -> DataQualityReport:
        """Get data quality report"""
        try:
            sport = request.sport or Sport.MLB
            current_time = datetime.now(timezone.utc)
            
            # Generate quality scores
            completeness = np.random.uniform(0.85, 0.98)
            accuracy = np.random.uniform(0.80, 0.95)
            consistency = np.random.uniform(0.82, 0.96)
            timeliness = np.random.uniform(0.88, 0.99)
            validity = np.random.uniform(0.85, 0.97)
            uniqueness = np.random.uniform(0.90, 0.99)
            
            overall_score = (completeness + accuracy + consistency + timeliness + validity + uniqueness) / 6
            
            return DataQualityReport(
                data_source="sportradar",
                sport=sport,
                completeness=completeness,
                accuracy=accuracy,
                consistency=consistency,
                timeliness=timeliness,
                validity=validity,
                uniqueness=uniqueness,
                overall_quality_score=overall_score,
                issues_detected=np.random.randint(0, 5),
                critical_issues=np.random.randint(0, 2),
                warnings=np.random.randint(0, 10),
                total_records=np.random.randint(10000, 50000),
                valid_records=int(np.random.randint(10000, 50000) * overall_score),
                invalid_records=np.random.randint(100, 1000),
                latest_data_timestamp=current_time - timedelta(minutes=np.random.randint(1, 30)),
                data_lag_minutes=np.random.uniform(2, 15),
                issue_categories={
                    "missing_values": np.random.randint(0, 3),
                    "format_errors": np.random.randint(0, 2),
                    "duplicate_records": np.random.randint(0, 1),
                    "outliers": np.random.randint(0, 4)
                },
                time_frame=request.time_frame,
                generated_at=current_time
            )
            
        except Exception as e:
            logger.error(f"Get data quality report failed: {e}")
            raise
    
    async def _get_user_analytics(self, request: AnalyticsRequest) -> UserAnalyticsReport:
        """Get user behavior analytics"""
        try:
            current_time = datetime.now(timezone.utc)
            
            total_users = np.random.randint(1000, 5000)
            active_users = int(total_users * np.random.uniform(0.6, 0.8))
            
            return UserAnalyticsReport(
                total_users=total_users,
                active_users=active_users,
                new_users=np.random.randint(50, 200),
                returning_users=active_users - np.random.randint(50, 200),
                avg_session_duration_minutes=np.random.uniform(15, 45),
                sessions_per_user=np.random.uniform(2.5, 6.0),
                bounce_rate=np.random.uniform(0.15, 0.35),
                feature_adoption_rates={
                    "predictions": np.random.uniform(0.75, 0.95),
                    "portfolio_optimization": np.random.uniform(0.45, 0.65),
                    "analytics_dashboard": np.random.uniform(0.60, 0.80),
                    "real_time_alerts": np.random.uniform(0.30, 0.50),
                    "export_tools": np.random.uniform(0.25, 0.40)
                },
                most_used_features=["predictions", "analytics_dashboard", "portfolio_optimization"],
                least_used_features=["export_tools", "advanced_settings"],
                conversion_rate=np.random.uniform(0.15, 0.25),
                trial_to_paid_rate=np.random.uniform(0.20, 0.35),
                churn_rate=np.random.uniform(0.05, 0.15),
                engagement_score=np.random.uniform(0.65, 0.85),
                user_satisfaction_score=np.random.uniform(3.8, 4.5),
                time_frame=request.time_frame,
                generated_at=current_time
            )
            
        except Exception as e:
            logger.error(f"Get user analytics failed: {e}")
            raise
    
    async def _get_business_intelligence(self, request: AnalyticsRequest) -> BusinessIntelligenceReport:
        """Get business intelligence report"""
        try:
            current_time = datetime.now(timezone.utc)
            
            total_revenue = Decimal(str(np.random.uniform(100000, 500000)))
            mrr = Decimal(str(np.random.uniform(50000, 200000)))
            total_users = np.random.randint(1000, 5000)
            
            return BusinessIntelligenceReport(
                total_revenue=total_revenue,
                monthly_recurring_revenue=mrr,
                average_revenue_per_user=total_revenue / total_users,
                user_growth_rate=np.random.uniform(0.05, 0.20),
                revenue_growth_rate=np.random.uniform(0.10, 0.30),
                total_predictions_made=np.random.randint(50000, 200000),
                successful_predictions=np.random.randint(40000, 170000),
                prediction_accuracy_rate=np.random.uniform(0.75, 0.90),
                predictions_by_sport={
                    "mlb": np.random.randint(20000, 80000),
                    "nba": np.random.randint(15000, 60000),
                    "nfl": np.random.randint(10000, 40000),
                    "nhl": np.random.randint(5000, 20000)
                },
                revenue_by_sport={
                    "mlb": Decimal(str(np.random.uniform(40000, 200000))),
                    "nba": Decimal(str(np.random.uniform(30000, 150000))),
                    "nfl": Decimal(str(np.random.uniform(20000, 100000))),
                    "nhl": Decimal(str(np.random.uniform(10000, 50000)))
                },
                premium_users=np.random.randint(200, 800),
                free_users=np.random.randint(500, 2000),
                enterprise_users=np.random.randint(10, 50),
                customer_acquisition_cost=Decimal(str(np.random.uniform(50, 150))),
                customer_lifetime_value=Decimal(str(np.random.uniform(500, 2000))),
                ltv_cac_ratio=np.random.uniform(8, 20),
                support_tickets=np.random.randint(50, 200),
                avg_resolution_time_hours=np.random.uniform(4, 24),
                customer_satisfaction_score=np.random.uniform(4.0, 4.8),
                time_frame=request.time_frame,
                generated_at=current_time
            )
            
        except Exception as e:
            logger.error(f"Get business intelligence failed: {e}")
            raise
    
    async def _get_system_health_metrics(self) -> SystemHealthMetrics:
        """Get overall system health metrics"""
        try:
            current_time = datetime.now(timezone.utc)
            
            # Calculate health score based on engine status
            online_engines = sum(1 for engine in self.engines.values() if engine["status"] == "online")
            total_engines = len(self.engines)
            health_score = online_engines / max(total_engines, 1)
            
            # Determine status
            if health_score >= 0.9:
                status = "healthy"
            elif health_score >= 0.7:
                status = "degraded"
            else:
                status = "unhealthy"
            
            return SystemHealthMetrics(
                overall_health_score=health_score,
                status=status,
                services_online=online_engines,
                services_total=total_engines,
                uptime_percentage=np.random.uniform(99.0, 99.9),
                avg_api_response_time_ms=np.random.uniform(100, 300),
                error_rate_percentage=np.random.uniform(0.1, 2.0),
                cpu_utilization_percentage=np.random.uniform(30, 70),
                memory_utilization_percentage=np.random.uniform(40, 80),
                disk_utilization_percentage=np.random.uniform(20, 60),
                database_connections=np.random.randint(10, 50),
                database_query_latency_ms=np.random.uniform(5, 25),
                cache_hit_rate_percentage=np.random.uniform(75, 95),
                cache_memory_usage_mb=np.random.uniform(512, 2048),
                active_alerts=len(self.active_alerts),
                critical_alerts=sum(1 for alert in self.active_alerts.values() 
                                  if alert.severity == AlertSeverity.CRITICAL),
                incidents_last_24h=np.random.randint(0, 3),
                avg_incident_resolution_time_minutes=np.random.uniform(15, 60),
                measured_at=current_time
            )
            
        except Exception as e:
            logger.error(f"Get system health metrics failed: {e}")
            raise
    
    async def get_dashboard(self, dashboard_id: str) -> DashboardResponse:
        """Get analytics dashboard data"""
        try:
            current_time = datetime.now(timezone.utc)
            
            # Generate dashboard widgets
            widgets = [
                {
                    "id": "performance_overview",
                    "type": "metrics",
                    "title": "Performance Overview",
                    "data": {
                        "response_time": np.random.uniform(120, 180),
                        "throughput": np.random.uniform(150, 250),
                        "error_rate": np.random.uniform(0.5, 2.0)
                    }
                },
                {
                    "id": "model_accuracy", 
                    "type": "chart",
                    "title": "Model Accuracy Trend",
                    "data": {
                        "labels": ["1h ago", "30m ago", "15m ago", "5m ago", "now"],
                        "values": [0.84, 0.86, 0.85, 0.87, 0.86]
                    }
                },
                {
                    "id": "user_activity",
                    "type": "metrics",
                    "title": "User Activity",
                    "data": {
                        "active_users": np.random.randint(200, 800),
                        "new_sessions": np.random.randint(50, 200),
                        "avg_session_time": np.random.uniform(20, 40)
                    }
                }
            ]
            
            return DashboardResponse(
                dashboard_id=dashboard_id,
                title="A1Betting Analytics Dashboard",
                widgets=widgets,
                summary_metrics={
                    "total_predictions": np.random.randint(1000, 5000),
                    "success_rate": np.random.uniform(0.75, 0.90),
                    "revenue_today": float(np.random.uniform(5000, 15000)),
                    "active_alerts": len(self.active_alerts)
                },
                recent_alerts=list(self.active_alerts.values())[-5:],  # Last 5 alerts
                last_updated=current_time,
                next_refresh=current_time + timedelta(minutes=5),
                auto_refresh_seconds=300
            )
            
        except Exception as e:
            logger.error(f"Get dashboard failed: {e}")
            raise
    
    async def health_check(self) -> HealthResponse:
        """
        Check analytics service health
        """
        try:
            uptime = (datetime.now(timezone.utc) - self.service_start_time).total_seconds()
            
            # Count recent metrics
            current_time = datetime.now(timezone.utc)
            cutoff_time = current_time - timedelta(hours=1)
            
            metrics_last_hour = sum(
                len([m for m in metrics if m.timestamp >= cutoff_time])
                for metrics in self.metrics_buffer.values()
            )
            
            return HealthResponse(
                status="healthy" if self.is_initialized else "initializing",
                analytics_engines_online=self.analytics_engines_online,
                total_analytics_engines=len(self.engines),
                metrics_collected_last_hour=metrics_last_hour,
                avg_processing_time_ms=np.random.uniform(10, 50),
                storage_usage_gb=np.random.uniform(5, 20),
                last_alert=max((alert.triggered_at for alert in self.active_alerts.values()), 
                              default=None),
                uptime_seconds=uptime
            )
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return HealthResponse(
                status="unhealthy",
                analytics_engines_online=0,
                total_analytics_engines=0,
                metrics_collected_last_hour=0,
                avg_processing_time_ms=0.0,
                storage_usage_gb=0.0,
                uptime_seconds=0.0
            )
    
    def _timeframe_to_timedelta(self, timeframe: TimeFrame) -> timedelta:
        """Convert timeframe enum to timedelta"""
        timeframe_map = {
            TimeFrame.LAST_HOUR: timedelta(hours=1),
            TimeFrame.LAST_6_HOURS: timedelta(hours=6),
            TimeFrame.LAST_24_HOURS: timedelta(hours=24),
            TimeFrame.LAST_7_DAYS: timedelta(days=7),
            TimeFrame.LAST_30_DAYS: timedelta(days=30),
            TimeFrame.LAST_90_DAYS: timedelta(days=90),
        }
        return timeframe_map.get(timeframe, timedelta(hours=24))
    
    # Real-time metrics ingestion (for future integration)
    async def ingest_metric(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Ingest a real-time metric"""
        try:
            metric_point = MetricPoint(
                timestamp=datetime.now(timezone.utc),
                value=value,
                labels=labels or {}
            )
            
            self.metrics_buffer[metric_name].append(metric_point)
            
        except Exception as e:
            logger.error(f"Failed to ingest metric {metric_name}: {e}")
    
    async def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        try:
            if alert_id in self.active_alerts:
                self.active_alerts[alert_id].is_acknowledged = True
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to acknowledge alert {alert_id}: {e}")
            return False
    
    async def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert"""
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert.is_resolved = True
                alert.resolved_at = datetime.now(timezone.utc)
                del self.active_alerts[alert_id]
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to resolve alert {alert_id}: {e}")
            return False
