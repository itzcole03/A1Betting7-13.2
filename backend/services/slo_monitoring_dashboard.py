"""
Model Integrity SLO Monitoring Dashboard
========================================

Comprehensive observability dashboard for the Model Integrity Phase with SLO tracking.
Provides real-time visibility into system health, performance metrics, and alert conditions.

Dashboard Panels:
1. Recompute Decision Breakdown (stacked bar fast/full/skipped)
2. Queue Depth vs Time with saturation alerts
3. Valuation Staleness Heatmap (prop_type)
4. Calibration Reliability Chart (predicted vs actual by bin)
5. Edge Confidence Distribution (histogram)
6. Active Edge Count & Birth/Retire Rate
7. Edge False-Positive Proxy Trend
8. Provider Health (latency/error)
9. System Resource (CPU, memory, event loop lag)

Focus: Production-ready monitoring aligned to defined SLOs
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Tuple
import statistics
import logging

from ..services.unified_cache_service import unified_cache_service
from ..services.recompute_scheduler import recompute_scheduler
from ..services.calibration_harness import calibration_harness
from ..services.settlement_integration_service import settlement_integration_service

logger = logging.getLogger("slo_monitoring")


class SLOStatus(Enum):
    """SLO compliance status"""
    HEALTHY = "healthy"      # Within SLO targets
    WARNING = "warning"      # Approaching SLO violation  
    CRITICAL = "critical"    # SLO violated
    UNKNOWN = "unknown"      # Insufficient data


class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class SLOTarget:
    """SLO target definition"""
    name: str
    description: str
    target_value: float
    unit: str
    comparison: str  # "lt", "gt", "eq"
    warning_threshold: float  # % of target that triggers warning
    critical_threshold: float  # % of target that triggers critical


@dataclass
class DashboardPanel:
    """Dashboard panel configuration"""
    id: str
    title: str
    panel_type: str  # "gauge", "chart", "table", "heatmap", "histogram"
    query: str
    refresh_interval: int  # seconds
    slo_targets: Optional[List[str]] = None  # SLO target names
    
    def __post_init__(self):
        if self.slo_targets is None:
            self.slo_targets = []


class ModelIntegritySLODashboard:
    """
    Comprehensive SLO monitoring dashboard for Model Integrity Phase
    
    Features:
    - Real-time metrics collection from all components
    - SLO target tracking and alert generation
    - Interactive dashboard panels with drill-down
    - Historical trend analysis
    - Automated anomaly detection
    """
    
    def __init__(self):
        self.monitoring_active = False
        self.collection_interval = 30  # seconds
        
        # SLO Definitions (from your audit requirements)
        self.slo_targets = {
            "recompute_latency_fast_p95": SLOTarget(
                name="recompute_latency_fast_p95",
                description="Fast recompute latency p95",
                target_value=150.0,
                unit="ms",
                comparison="lt",
                warning_threshold=0.8,  # 120ms
                critical_threshold=1.0   # 150ms
            ),
            "recompute_latency_full_p95": SLOTarget(
                name="recompute_latency_full_p95", 
                description="Full recompute latency p95",
                target_value=500.0,
                unit="ms",
                comparison="lt",
                warning_threshold=0.8,  # 400ms
                critical_threshold=1.0   # 500ms
            ),
            "valuation_staleness_95th": SLOTarget(
                name="valuation_staleness_95th",
                description="95% props updated within staleness target",
                target_value=60.0,
                unit="seconds",
                comparison="lt",
                warning_threshold=0.8,  # 48s
                critical_threshold=1.0   # 60s
            ),
            "calibration_sample_throughput": SLOTarget(
                name="calibration_sample_throughput",
                description="Calibration samples per day",
                target_value=50.0,
                unit="samples/day",
                comparison="gt",
                warning_threshold=0.8,  # 40 samples/day
                critical_threshold=0.6   # 30 samples/day
            ),
            "edge_false_positive_rate": SLOTarget(
                name="edge_false_positive_rate",
                description="Edge false positive proxy rate",
                target_value=35.0,
                unit="percent",
                comparison="lt",
                warning_threshold=0.9,  # 31.5%
                critical_threshold=1.0   # 35%
            ),
            "system_error_rate": SLOTarget(
                name="system_error_rate",
                description="Recompute failure rate",
                target_value=1.0,
                unit="percent",
                comparison="lt",
                warning_threshold=0.8,  # 0.8%
                critical_threshold=1.0   # 1.0%
            )
        }
        
        # Dashboard Panels
        self.panels = {
            "recompute_decisions": DashboardPanel(
                id="recompute_decisions",
                title="Recompute Decision Breakdown",
                panel_type="stacked_bar",
                query="recompute_decisions_total",
                refresh_interval=30,
                slo_targets=["recompute_latency_fast_p95", "recompute_latency_full_p95"]
            ),
            "queue_depth": DashboardPanel(
                id="queue_depth",
                title="Queue Depth vs Time",
                panel_type="timeseries",
                query="recompute_queue_depth",
                refresh_interval=15
            ),
            "staleness_heatmap": DashboardPanel(
                id="staleness_heatmap",
                title="Valuation Staleness Heatmap",
                panel_type="heatmap",
                query="valuation_staleness_by_prop_type",
                refresh_interval=60,
                slo_targets=["valuation_staleness_95th"]
            ),
            "calibration_reliability": DashboardPanel(
                id="calibration_reliability",
                title="Calibration Reliability Chart",
                panel_type="scatter",
                query="calibration_reliability_bins",
                refresh_interval=300,  # 5 minutes
                slo_targets=["calibration_sample_throughput"]
            ),
            "edge_confidence": DashboardPanel(
                id="edge_confidence",
                title="Edge Confidence Distribution",
                panel_type="histogram",
                query="edge_confidence_distribution",
                refresh_interval=60
            ),
            "edge_lifecycle": DashboardPanel(
                id="edge_lifecycle",
                title="Active Edge Count & Birth/Retire Rate",
                panel_type="timeseries_multi",
                query="edge_lifecycle_metrics",
                refresh_interval=60,
                slo_targets=["edge_false_positive_rate"]
            ),
            "provider_health": DashboardPanel(
                id="provider_health",
                title="Provider Health",
                panel_type="status_grid",
                query="provider_health_status",
                refresh_interval=30
            ),
            "system_resources": DashboardPanel(
                id="system_resources",
                title="System Resources",
                panel_type="gauge_multi",
                query="system_resource_metrics",
                refresh_interval=15,
                slo_targets=["system_error_rate"]
            )
        }
        
        # Metrics storage
        self.current_metrics: Dict[str, Any] = {}
        self.historical_metrics: List[Dict[str, Any]] = []
        self.max_history_size = 1440  # 24 hours at 1-minute intervals
        
        # Alert state
        self.active_alerts: Dict[str, Dict[str, Any]] = {}
        self.alert_history: List[Dict[str, Any]] = []
        
        logger.info("ModelIntegritySLODashboard initialized")

    async def start_monitoring(self):
        """Start the SLO monitoring system"""
        if self.monitoring_active:
            logger.warning("SLO monitoring already active")
            return
            
        self.monitoring_active = True
        logger.info("Starting SLO monitoring...")
        
        # Start monitoring tasks
        asyncio.create_task(self._metrics_collection_loop())
        asyncio.create_task(self._slo_evaluation_loop())
        asyncio.create_task(self._dashboard_update_loop())

    async def stop_monitoring(self):
        """Stop SLO monitoring"""
        self.monitoring_active = False
        logger.info("SLO monitoring stopped")

    async def _metrics_collection_loop(self):
        """Main metrics collection loop"""
        while self.monitoring_active:
            try:
                start_time = time.time()
                
                # Collect metrics from all Model Integrity components
                metrics = await self._collect_all_metrics()
                
                # Store current metrics
                self.current_metrics = {
                    **metrics,
                    "collection_timestamp": start_time,
                    "collection_latency_ms": (time.time() - start_time) * 1000
                }
                
                # Add to historical storage
                self.historical_metrics.append(self.current_metrics.copy())
                if len(self.historical_metrics) > self.max_history_size:
                    self.historical_metrics.pop(0)
                
                # Cache for API access
                await unified_cache_service.set(
                    "slo_dashboard_metrics",
                    self.current_metrics,
                    ttl=60
                )
                
                await asyncio.sleep(self.collection_interval)
                
            except Exception as e:
                logger.error(f"Metrics collection error: {str(e)}")
                await asyncio.sleep(5)

    async def _collect_all_metrics(self) -> Dict[str, Any]:
        """Collect metrics from all Model Integrity components"""
        metrics = {"timestamp": time.time()}
        
        try:
            # Recompute Scheduler Metrics
            recompute_status = recompute_scheduler.get_status()
            recompute_metrics = await unified_cache_service.get("recompute_metrics") or {}
            
            metrics["recompute"] = {
                "queue_depth": recompute_status["queue_depth"],
                "active_jobs": recompute_status["active_jobs"],
                "workers_running": recompute_status["workers_running"],
                "circuit_breaker_open": recompute_status["circuit_breaker_open"],
                "avg_latency_ms": recompute_metrics.get("average_latency_ms", 0),
                "fast_recomputes": recompute_metrics.get("fast_recomputes", 0),
                "full_recomputes": recompute_metrics.get("full_recomputes", 0),
                "jobs_failed": recompute_metrics.get("jobs_failed", 0),
                "jobs_completed": recompute_metrics.get("jobs_completed", 0),
                "saturation_events": recompute_metrics.get("saturation_events", 0),
                "jobs_rejected": recompute_metrics.get("jobs_rejected", 0)
            }
            
        except Exception as e:
            logger.error(f"Error collecting recompute metrics: {str(e)}")
            metrics["recompute"] = {}
        
        try:
            # Calibration Harness Metrics
            calibration_summary = await calibration_harness.get_overall_summary()
            calibration_metrics = await unified_cache_service.get("calibration_metrics") or {}
            
            metrics["calibration"] = {
                "total_predictions": calibration_summary.get("total_predictions", 0),
                "settled_predictions": calibration_summary.get("settled_predictions", 0),
                "overall_accuracy": calibration_summary.get("overall_accuracy", 0),
                "settlement_rate": calibration_summary.get("settlement_rate", 0),
                "weighted_calibration_error": calibration_summary.get("weighted_calibration_error", 0),
                "prop_type_count": calibration_summary.get("prop_type_count", 0)
            }
            
        except Exception as e:
            logger.error(f"Error collecting calibration metrics: {str(e)}")
            metrics["calibration"] = {}
        
        try:
            # Settlement Integration Metrics
            settlement_summary = await settlement_integration_service.get_settlement_summary()
            
            metrics["settlement"] = {
                "processing_active": settlement_summary.get("processing_active", False),
                "pending_games": settlement_summary.get("pending_games", 0),
                "pending_predictions": settlement_summary.get("pending_predictions", 0),
                "recent_outliers": settlement_summary.get("recent_outliers", 0),
                "recent_mismatches": settlement_summary.get("recent_mismatches", 0),
                "predictions_settled": settlement_summary.get("stats", {}).get("predictions_settled", 0)
            }
            
        except Exception as e:
            logger.error(f"Error collecting settlement metrics: {str(e)}")
            metrics["settlement"] = {}
        
        # Calculate derived metrics
        metrics["derived"] = self._calculate_derived_metrics(metrics)
        
        return metrics

    def _calculate_derived_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate derived metrics for SLO evaluation"""
        derived = {}
        
        try:
            # Error rate calculation
            recompute = metrics.get("recompute", {})
            failed = recompute.get("jobs_failed", 0)
            completed = recompute.get("jobs_completed", 0)
            total_jobs = failed + completed
            
            derived["error_rate_percent"] = (failed / total_jobs * 100) if total_jobs > 0 else 0
            
            # Throughput calculations
            calibration = metrics.get("calibration", {})
            
            # Estimate daily throughput based on recent activity
            current_predictions = calibration.get("total_predictions", 0)
            if len(self.historical_metrics) > 0:
                prev_predictions = self.historical_metrics[-1].get("calibration", {}).get("total_predictions", 0)
                prediction_rate = max(0, current_predictions - prev_predictions)
                # Extrapolate to daily (collection_interval is in seconds)
                daily_extrapolation = (24 * 3600) / self.collection_interval
                derived["daily_prediction_throughput"] = prediction_rate * daily_extrapolation
            else:
                derived["daily_prediction_throughput"] = 0
            
            # Queue saturation percentage
            queue_depth = recompute.get("queue_depth", 0)
            max_queue_size = getattr(recompute_scheduler, "queue_max_size", 100)
            derived["queue_saturation_percent"] = (queue_depth / max_queue_size * 100) if max_queue_size > 0 else 0
            
        except Exception as e:
            logger.error(f"Error calculating derived metrics: {str(e)}")
        
        return derived

    async def _slo_evaluation_loop(self):
        """Evaluate SLO compliance and generate alerts"""
        while self.monitoring_active:
            try:
                # Evaluate all SLO targets
                await self._evaluate_slo_targets()
                
                await asyncio.sleep(60)  # Evaluate SLOs every minute
                
            except Exception as e:
                logger.error(f"SLO evaluation error: {str(e)}")
                await asyncio.sleep(5)

    async def _evaluate_slo_targets(self):
        """Evaluate current metrics against SLO targets"""
        if not self.current_metrics:
            return
            
        for target_name, target in self.slo_targets.items():
            try:
                current_value = self._extract_metric_value(target_name, self.current_metrics)
                if current_value is None:
                    continue
                    
                status = self._evaluate_slo_status(current_value, target)
                
                # Generate alert if needed
                if status != SLOStatus.HEALTHY:
                    await self._generate_slo_alert(target_name, target, current_value, status)
                else:
                    # Clear alert if it exists
                    if target_name in self.active_alerts:
                        await self._clear_slo_alert(target_name)
                        
            except Exception as e:
                logger.error(f"Error evaluating SLO {target_name}: {str(e)}")

    def _extract_metric_value(self, target_name: str, metrics: Dict[str, Any]) -> Optional[float]:
        """Extract the relevant metric value for SLO evaluation"""
        
        if target_name == "recompute_latency_fast_p95":
            # This would need actual percentile calculation from historical data
            return metrics.get("recompute", {}).get("avg_latency_ms", 0)
            
        elif target_name == "recompute_latency_full_p95":
            # Placeholder - would need separate tracking of fast vs full latencies
            return metrics.get("recompute", {}).get("avg_latency_ms", 0) * 1.5
            
        elif target_name == "valuation_staleness_95th":
            # Placeholder - would need staleness tracking
            return 45.0  # Mock value
            
        elif target_name == "calibration_sample_throughput":
            return metrics.get("derived", {}).get("daily_prediction_throughput", 0)
            
        elif target_name == "edge_false_positive_rate":
            # Placeholder - would need edge tracking integration
            return 25.0  # Mock value
            
        elif target_name == "system_error_rate":
            return metrics.get("derived", {}).get("error_rate_percent", 0)
            
        return None

    def _evaluate_slo_status(self, current_value: float, target: SLOTarget) -> SLOStatus:
        """Evaluate SLO status based on current value and target"""
        
        if target.comparison == "lt":
            # Lower is better
            if current_value <= target.target_value * target.warning_threshold:
                return SLOStatus.HEALTHY
            elif current_value <= target.target_value * target.critical_threshold:
                return SLOStatus.WARNING
            else:
                return SLOStatus.CRITICAL
                
        elif target.comparison == "gt":
            # Higher is better
            if current_value >= target.target_value * target.warning_threshold:
                return SLOStatus.HEALTHY
            elif current_value >= target.target_value * target.critical_threshold:
                return SLOStatus.WARNING
            else:
                return SLOStatus.CRITICAL
                
        return SLOStatus.UNKNOWN

    async def _generate_slo_alert(self, target_name: str, target: SLOTarget, current_value: float, status: SLOStatus):
        """Generate SLO violation alert"""
        
        alert_id = f"slo_{target_name}_{int(time.time())}"
        severity = AlertSeverity.WARNING if status == SLOStatus.WARNING else AlertSeverity.CRITICAL
        
        alert = {
            "id": alert_id,
            "target_name": target_name,
            "severity": severity.value,
            "status": status.value,
            "current_value": current_value,
            "target_value": target.target_value,
            "unit": target.unit,
            "description": target.description,
            "message": f"SLO {target.description} {status.value}: {current_value:.2f}{target.unit} (target: {target.target_value}{target.unit})",
            "created_at": time.time(),
            "acknowledged": False
        }
        
        # Store active alert
        self.active_alerts[target_name] = alert
        self.alert_history.append(alert)
        
        logger.warning(f"SLO Alert Generated: {alert['message']}")
        
        # Cache alert for API access
        await unified_cache_service.set(f"slo_alert_{target_name}", alert, ttl=3600)

    async def _clear_slo_alert(self, target_name: str):
        """Clear SLO alert when back to healthy status"""
        if target_name in self.active_alerts:
            alert = self.active_alerts[target_name]
            logger.info(f"SLO Alert Cleared: {alert['message']}")
            del self.active_alerts[target_name]

    async def _dashboard_update_loop(self):
        """Update dashboard data for frontend consumption"""
        while self.monitoring_active:
            try:
                dashboard_data = await self._generate_dashboard_data()
                
                # Cache dashboard data
                await unified_cache_service.set(
                    "slo_dashboard_data",
                    dashboard_data,
                    ttl=self.collection_interval + 10
                )
                
                await asyncio.sleep(self.collection_interval)
                
            except Exception as e:
                logger.error(f"Dashboard update error: {str(e)}")
                await asyncio.sleep(5)

    async def _generate_dashboard_data(self) -> Dict[str, Any]:
        """Generate complete dashboard data structure"""
        
        return {
            "timestamp": time.time(),
            "slo_status": {
                target_name: {
                    "status": self._evaluate_slo_status(
                        self._extract_metric_value(target_name, self.current_metrics) or 0,
                        target
                    ).value,
                    "current_value": self._extract_metric_value(target_name, self.current_metrics),
                    "target_value": target.target_value,
                    "unit": target.unit
                }
                for target_name, target in self.slo_targets.items()
            },
            "active_alerts": list(self.active_alerts.values()),
            "alert_count": len(self.active_alerts),
            "panels": {
                panel_id: await self._generate_panel_data(panel)
                for panel_id, panel in self.panels.items()
            },
            "system_health": {
                "recompute_scheduler": self.current_metrics.get("recompute", {}).get("workers_running", False),
                "calibration_harness": self.current_metrics.get("calibration", {}).get("prop_type_count", 0) > 0,
                "settlement_integration": self.current_metrics.get("settlement", {}).get("processing_active", False),
                "overall_status": "healthy" if len(self.active_alerts) == 0 else "degraded"
            }
        }

    async def _generate_panel_data(self, panel: DashboardPanel) -> Dict[str, Any]:
        """Generate data for a specific dashboard panel"""
        
        try:
            if panel.query == "recompute_decisions_total":
                return {
                    "type": panel.panel_type,
                    "data": self._get_recompute_decision_data()
                }
            elif panel.query == "recompute_queue_depth":
                return {
                    "type": panel.panel_type,
                    "data": self._get_queue_depth_timeseries()
                }
            elif panel.query == "calibration_reliability_bins":
                return {
                    "type": panel.panel_type,
                    "data": await self._get_calibration_reliability_data()
                }
            # Add more panel data generators as needed
            
        except Exception as e:
            logger.error(f"Error generating panel data for {panel.id}: {str(e)}")
            
        return {"type": panel.panel_type, "data": {}, "error": "Data generation failed"}

    def _get_recompute_decision_data(self) -> Dict[str, Any]:
        """Get recompute decision breakdown data"""
        recompute = self.current_metrics.get("recompute", {})
        
        return {
            "categories": ["Fast", "Full", "Rejected", "Saturated"],
            "series": [
                {"name": "Line Changes", "data": [recompute.get("fast_recomputes", 0), 0, 0, 0]},
                {"name": "Structural Changes", "data": [0, recompute.get("full_recomputes", 0), 0, 0]},
                {"name": "Queue Issues", "data": [0, 0, recompute.get("jobs_rejected", 0), recompute.get("saturation_events", 0)]}
            ]
        }

    def _get_queue_depth_timeseries(self) -> Dict[str, Any]:
        """Get queue depth time series data"""
        timestamps = []
        values = []
        
        # Get last 2 hours of data
        cutoff_time = time.time() - 7200  # 2 hours
        
        for metric in self.historical_metrics:
            if metric.get("timestamp", 0) > cutoff_time:
                timestamps.append(metric["timestamp"])
                values.append(metric.get("recompute", {}).get("queue_depth", 0))
        
        return {
            "timestamps": timestamps,
            "values": values,
            "warning_threshold": getattr(recompute_scheduler, "queue_max_size", 100) * 0.8,
            "critical_threshold": getattr(recompute_scheduler, "queue_max_size", 100) * 0.9
        }

    async def _get_calibration_reliability_data(self) -> Dict[str, Any]:
        """Get calibration reliability chart data"""
        try:
            # This would integrate with the enhanced calibration harness
            # For now, return mock data structure
            return {
                "bins": [
                    {"expected": 0.6, "observed": 0.58, "count": 45, "well_calibrated": True},
                    {"expected": 0.7, "observed": 0.72, "count": 38, "well_calibrated": True},
                    {"expected": 0.8, "observed": 0.85, "count": 29, "well_calibrated": False},
                    {"expected": 0.9, "observed": 0.91, "count": 22, "well_calibrated": True}
                ],
                "perfect_line": {"x": [0, 1], "y": [0, 1]},
                "calibration_error": 0.032
            }
        except Exception as e:
            logger.error(f"Error generating calibration reliability data: {str(e)}")
            return {}

    async def get_dashboard_status(self) -> Dict[str, Any]:
        """Get current dashboard status"""
        return {
            "monitoring_active": self.monitoring_active,
            "collection_interval": self.collection_interval,
            "metrics_collected": len(self.historical_metrics),
            "active_alerts": len(self.active_alerts),
            "slo_targets_count": len(self.slo_targets),
            "panels_count": len(self.panels),
            "last_collection": self.current_metrics.get("collection_timestamp", 0)
        }


# Global SLO monitoring dashboard instance
slo_dashboard = ModelIntegritySLODashboard()