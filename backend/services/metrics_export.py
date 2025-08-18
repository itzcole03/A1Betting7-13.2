"""
Metrics Export System
=====================

Central metrics collection and export for the Model Integrity Phase.
Provides unified metrics access for monitoring dashboards and alerting.

Key Features:
- Real-time KPI collection from all core systems
- Prometheus-compatible metrics export
- Historical metrics storage and trending
- Performance alerting thresholds
- Health check endpoints

Focus: Visibility into core value loop performance
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Union
from collections import defaultdict, deque
import statistics
import logging

from ..services.unified_cache_service import unified_cache_service

logger = logging.getLogger("metrics_export")


class MetricType(Enum):
    """Types of metrics we track"""
    COUNTER = "counter"           # Always increasing (e.g., total predictions)
    GAUGE = "gauge"              # Current value (e.g., active edges)
    HISTOGRAM = "histogram"      # Distribution (e.g., latencies)
    RATE = "rate"               # Per-time-unit rate (e.g., predictions/hour)


class AlertLevel(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class MetricPoint:
    """Individual metric data point"""
    name: str
    value: Union[float, int]
    timestamp: float
    tags: Optional[Dict[str, str]] = None
    metric_type: MetricType = MetricType.GAUGE
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = {}


@dataclass
class Alert:
    """Performance alert"""
    metric_name: str
    level: AlertLevel
    threshold: float
    current_value: float
    message: str
    timestamp: float
    resolved: bool = False
    resolved_at: Optional[float] = None


class MetricsCollector:
    """
    Collects and aggregates metrics from various system components
    
    Core metrics categories:
    1. Valuation & Modeling Performance
    2. Edge Quality & Persistence  
    3. Recompute Pipeline Performance
    4. Calibration & Accuracy Tracking
    5. System Health & Resources
    """
    
    def __init__(self):
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))  # Store last 1000 points per metric
        self.alerts: List[Alert] = []
        self.alert_history: deque = deque(maxlen=500)  # Store last 500 alerts
        
        # Alert thresholds - configurable per metric
        self.thresholds = {
            # Recompute performance (target <400ms fast, <2.5s full)
            "recompute.fast_latency_p95": {"warning": 500, "error": 800, "critical": 1200},
            "recompute.full_latency_p95": {"warning": 3000, "error": 4000, "critical": 6000},
            "recompute.queue_depth": {"warning": 50, "error": 100, "critical": 200},
            "recompute.failure_rate": {"warning": 0.05, "error": 0.10, "critical": 0.20},  # 5%, 10%, 20%
            
            # Edge quality (target <30% false positive rate)
            "edges.false_positive_rate": {"warning": 0.20, "error": 0.30, "critical": 0.50},
            "edges.average_persistence": {"warning": 0.4, "error": 0.3, "critical": 0.2},  # Lower is worse
            "edges.active_count": {"warning": 5, "error": 2, "critical": 0},  # Lower is worse (inverted)
            
            # Calibration metrics (target <15% calibration error)
            "calibration.mean_error": {"warning": 0.10, "error": 0.15, "critical": 0.25},
            "calibration.accuracy_drop": {"warning": 0.05, "error": 0.10, "critical": 0.15},  # 5%, 10%, 15%
            "calibration.settlement_rate": {"warning": 0.7, "error": 0.5, "critical": 0.3},  # Lower is worse
            
            # System performance
            "system.memory_usage_pct": {"warning": 70, "error": 85, "critical": 95},
            "system.cpu_usage_pct": {"warning": 70, "error": 85, "critical": 95},
            "api.response_time_p95": {"warning": 1000, "error": 2000, "critical": 5000},  # milliseconds
        }
        
        self.collection_interval = 30  # seconds
        self.is_collecting = False
        self.collection_task: Optional[asyncio.Task] = None
        
        logger.info("MetricsCollector initialized")

    async def start_collection(self):
        """Start periodic metrics collection"""
        if self.is_collecting:
            logger.warning("Metrics collection already running")
            return
            
        self.is_collecting = True
        self.collection_task = asyncio.create_task(self._collection_loop())
        logger.info("Started metrics collection")

    async def stop_collection(self):
        """Stop metrics collection"""
        self.is_collecting = False
        if self.collection_task:
            self.collection_task.cancel()
            try:
                await self.collection_task
            except asyncio.CancelledError:
                pass
        logger.info("Stopped metrics collection")

    async def _collection_loop(self):
        """Main metrics collection loop"""
        while self.is_collecting:
            try:
                await self._collect_all_metrics()
                await asyncio.sleep(self.collection_interval)
            except Exception as e:
                logger.error(f"Metrics collection error: {str(e)}")
                await asyncio.sleep(5)  # Brief pause on error

    async def _collect_all_metrics(self):
        """Collect metrics from all system components"""
        
        # Collect from recompute scheduler
        await self._collect_recompute_metrics()
        
        # Collect from calibration harness
        await self._collect_calibration_metrics()
        
        # Collect from edge persistence model
        await self._collect_edge_metrics()
        
        # Collect system metrics
        await self._collect_system_metrics()
        
        # Check alert conditions
        await self._check_alerts()
        
        # Export aggregated metrics
        await self._export_metrics()

    async def _collect_recompute_metrics(self):
        """Collect metrics from recompute scheduler"""
        try:
            # Try to get metrics from cache (populated by recompute scheduler)
            recompute_metrics = await unified_cache_service.get("recompute_metrics")
            if not recompute_metrics:
                return
                
            timestamp = time.time()
            
            # Core recompute metrics
            self.record_metric("recompute.jobs_queued", recompute_metrics.get("jobs_queued", 0), timestamp, MetricType.COUNTER)
            self.record_metric("recompute.jobs_completed", recompute_metrics.get("jobs_completed", 0), timestamp, MetricType.COUNTER)
            self.record_metric("recompute.jobs_failed", recompute_metrics.get("jobs_failed", 0), timestamp, MetricType.COUNTER)
            self.record_metric("recompute.queue_depth", recompute_metrics.get("queue_depth", 0), timestamp, MetricType.GAUGE)
            self.record_metric("recompute.average_latency_ms", recompute_metrics.get("average_latency_ms", 0), timestamp, MetricType.GAUGE)
            self.record_metric("recompute.debounce_hits", recompute_metrics.get("debounce_hits", 0), timestamp, MetricType.COUNTER)
            
            # Calculate derived metrics
            total_jobs = recompute_metrics.get("jobs_completed", 0) + recompute_metrics.get("jobs_failed", 0)
            failure_rate = recompute_metrics.get("jobs_failed", 0) / max(total_jobs, 1)
            self.record_metric("recompute.failure_rate", failure_rate, timestamp, MetricType.GAUGE)
            
            # Fast vs full recompute breakdown
            fast_count = recompute_metrics.get("fast_recomputes", 0)
            full_count = recompute_metrics.get("full_recomputes", 0)
            total_recomputes = fast_count + full_count
            
            if total_recomputes > 0:
                fast_ratio = fast_count / total_recomputes
                self.record_metric("recompute.fast_ratio", fast_ratio, timestamp, MetricType.GAUGE)
            
            logger.debug(f"Collected recompute metrics - queue: {recompute_metrics.get('queue_depth')}, "
                        f"avg_latency: {recompute_metrics.get('average_latency_ms'):.0f}ms")
                
        except Exception as e:
            logger.error(f"Failed to collect recompute metrics: {str(e)}")

    async def _collect_calibration_metrics(self):
        """Collect metrics from calibration harness"""
        try:
            calibration_metrics = await unified_cache_service.get("calibration_metrics")
            if not calibration_metrics:
                return
                
            timestamp = time.time()
            overall = calibration_metrics.get("overall", {})
            
            # Overall calibration metrics
            self.record_metric("calibration.total_predictions", overall.get("total_predictions", 0), timestamp, MetricType.COUNTER)
            self.record_metric("calibration.settled_predictions", overall.get("settled_predictions", 0), timestamp, MetricType.COUNTER)
            self.record_metric("calibration.overall_accuracy", overall.get("overall_accuracy", 0), timestamp, MetricType.GAUGE)
            self.record_metric("calibration.settlement_rate", overall.get("settlement_rate", 0), timestamp, MetricType.GAUGE)
            self.record_metric("calibration.weighted_error", overall.get("weighted_calibration_error", 0), timestamp, MetricType.GAUGE)
            
            # Per-prop-type metrics
            by_prop_type = calibration_metrics.get("by_prop_type", {})
            for prop_type, metrics in by_prop_type.items():
                tags = {"prop_type": prop_type}
                
                self.record_metric("calibration.prop_accuracy", metrics.get("accuracy", 0), timestamp, MetricType.GAUGE, tags)
                self.record_metric("calibration.prop_calibration_error", metrics.get("mean_calibration_error", 0), timestamp, MetricType.GAUGE, tags)
                self.record_metric("calibration.prop_brier_score", metrics.get("brier_score", 0), timestamp, MetricType.GAUGE, tags)
                self.record_metric("calibration.prop_mae", metrics.get("mean_absolute_error", 0), timestamp, MetricType.GAUGE, tags)
                
            logger.debug(f"Collected calibration metrics - accuracy: {overall.get('overall_accuracy', 0):.3f}, "
                        f"settlement_rate: {overall.get('settlement_rate', 0):.3f}")
                
        except Exception as e:
            logger.error(f"Failed to collect calibration metrics: {str(e)}")

    async def _collect_edge_metrics(self):
        """Collect metrics from edge persistence model"""
        try:
            edge_metrics = await unified_cache_service.get("edge_persistence_metrics")
            if not edge_metrics:
                return
                
            timestamp = time.time()
            quality = edge_metrics.get("quality_summary", {})
            
            # Edge quality metrics
            self.record_metric("edges.active_count", quality.get("active_edges", 0), timestamp, MetricType.GAUGE)
            self.record_metric("edges.average_persistence", quality.get("average_persistence", 0), timestamp, MetricType.GAUGE)
            self.record_metric("edges.average_ev", quality.get("average_ev", 0), timestamp, MetricType.GAUGE)
            self.record_metric("edges.average_confidence", quality.get("average_confidence", 0), timestamp, MetricType.GAUGE)
            
            # Edge lifecycle metrics
            edge_metrics_data = quality.get("metrics", {})
            self.record_metric("edges.created_total", edge_metrics_data.get("edges_created", 0), timestamp, MetricType.COUNTER)
            self.record_metric("edges.retired_total", edge_metrics_data.get("edges_retired", 0), timestamp, MetricType.COUNTER)
            self.record_metric("edges.false_positives", edge_metrics_data.get("false_positives_detected", 0), timestamp, MetricType.COUNTER)
            self.record_metric("edges.avg_lifespan_hours", edge_metrics_data.get("average_edge_lifespan_hours", 0), timestamp, MetricType.GAUGE)
            
            # Calculate false positive rate
            total_retired = edge_metrics_data.get("edges_retired", 0)
            false_positives = edge_metrics_data.get("false_positives_detected", 0)
            fp_rate = false_positives / max(total_retired, 1)
            self.record_metric("edges.false_positive_rate", fp_rate, timestamp, MetricType.GAUGE)
            
            # Per edge type breakdown
            edge_type_breakdown = edge_metrics.get("edge_type_breakdown", {})
            for edge_type, type_metrics in edge_type_breakdown.items():
                tags = {"edge_type": edge_type}
                
                self.record_metric("edges.type_active_count", type_metrics.get("active_count", 0), timestamp, MetricType.GAUGE, tags)
                self.record_metric("edges.type_avg_persistence", type_metrics.get("avg_persistence", 0), timestamp, MetricType.GAUGE, tags)
                self.record_metric("edges.type_avg_age_hours", type_metrics.get("avg_age_hours", 0), timestamp, MetricType.GAUGE, tags)
                
            logger.debug(f"Collected edge metrics - active: {quality.get('active_edges', 0)}, "
                        f"avg_persistence: {quality.get('average_persistence', 0):.3f}")
                
        except Exception as e:
            logger.error(f"Failed to collect edge metrics: {str(e)}")

    async def _collect_system_metrics(self):
        """Collect system-level metrics"""
        try:
            import psutil
            timestamp = time.time()
            
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            self.record_metric("system.cpu_usage_pct", cpu_percent, timestamp, MetricType.GAUGE)
            self.record_metric("system.memory_usage_pct", memory.percent, timestamp, MetricType.GAUGE)
            self.record_metric("system.memory_available_mb", memory.available / 1024 / 1024, timestamp, MetricType.GAUGE)
            
            # Disk usage (if needed)
            disk = psutil.disk_usage('/')
            disk_usage_pct = (disk.used / disk.total) * 100
            self.record_metric("system.disk_usage_pct", disk_usage_pct, timestamp, MetricType.GAUGE)
            
            logger.debug(f"Collected system metrics - CPU: {cpu_percent:.1f}%, Memory: {memory.percent:.1f}%")
            
        except ImportError:
            # psutil not available - skip system metrics
            pass
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {str(e)}")

    def record_metric(self, name: str, value: Union[float, int], timestamp: Optional[float] = None, metric_type: MetricType = MetricType.GAUGE, tags: Optional[Dict[str, str]] = None):
        """Record a metric data point"""
        if timestamp is None:
            timestamp = time.time()
            
        point = MetricPoint(
            name=name,
            value=value,
            timestamp=timestamp,
            tags=tags or {},
            metric_type=metric_type
        )
        
        self.metrics[name].append(point)

    async def _check_alerts(self):
        """Check all metrics against alert thresholds"""
        
        current_time = time.time()
        new_alerts = []
        
        for metric_name, threshold_config in self.thresholds.items():
            if metric_name not in self.metrics:
                continue
                
            # Get latest metric value
            latest_points = list(self.metrics[metric_name])
            if not latest_points:
                continue
                
            latest_value = latest_points[-1].value
            
            # Check thresholds (highest severity first)
            for level_name in ["critical", "error", "warning"]:
                if level_name not in threshold_config:
                    continue
                    
                threshold = threshold_config[level_name]
                level = AlertLevel(level_name.upper())
                
                # Determine if threshold is breached (handle inverted metrics like active_count)
                is_breached = False
                if "active_count" in metric_name or "settlement_rate" in metric_name or "average_persistence" in metric_name:
                    # Lower values are worse
                    is_breached = latest_value < threshold
                else:
                    # Higher values are worse
                    is_breached = latest_value > threshold
                
                if is_breached:
                    # Check if we already have an active alert for this metric/level
                    existing_alert = next((a for a in self.alerts if a.metric_name == metric_name and a.level == level and not a.resolved), None)
                    
                    if not existing_alert:
                        alert = Alert(
                            metric_name=metric_name,
                            level=level,
                            threshold=threshold,
                            current_value=latest_value,
                            message=f"{metric_name} {level_name}: {latest_value:.3f} (threshold: {threshold:.3f})",
                            timestamp=current_time
                        )
                        
                        self.alerts.append(alert)
                        new_alerts.append(alert)
                        logger.warning(f"NEW ALERT: {alert.message}")
                    
                    break  # Only trigger the highest severity level
                else:
                    # Check if we should resolve any existing alerts for this metric
                    for alert in self.alerts:
                        if (alert.metric_name == metric_name and 
                            not alert.resolved and 
                            alert.level.value == level_name):
                            
                            alert.resolved = True
                            alert.resolved_at = current_time
                            self.alert_history.append(alert)
                            logger.info(f"RESOLVED ALERT: {alert.message} -> {latest_value:.3f}")
        
        # Store alerts in cache for monitoring access
        if new_alerts or self.alerts:
            active_alerts = [a for a in self.alerts if not a.resolved]
            await unified_cache_service.set("system_alerts", [asdict(a) for a in active_alerts], ttl=300)

    async def _export_metrics(self):
        """Export metrics to cache for API access"""
        
        export_data = {
            "timestamp": time.time(),
            "metrics": {},
            "summary": {},
            "alerts": {
                "active": len([a for a in self.alerts if not a.resolved]),
                "total": len(self.alerts),
                "by_level": {}
            }
        }
        
        # Export latest values for each metric
        for metric_name, points in self.metrics.items():
            if points:
                latest = points[-1]
                export_data["metrics"][metric_name] = {
                    "value": latest.value,
                    "timestamp": latest.timestamp,
                    "type": latest.metric_type.value,
                    "tags": latest.tags
                }
        
        # Calculate summary statistics
        export_data["summary"] = {
            "recompute": {
                "queue_depth": export_data["metrics"].get("recompute.queue_depth", {}).get("value", 0),
                "avg_latency_ms": export_data["metrics"].get("recompute.average_latency_ms", {}).get("value", 0),
                "failure_rate": export_data["metrics"].get("recompute.failure_rate", {}).get("value", 0)
            },
            "edges": {
                "active_count": export_data["metrics"].get("edges.active_count", {}).get("value", 0),
                "avg_persistence": export_data["metrics"].get("edges.average_persistence", {}).get("value", 0),
                "false_positive_rate": export_data["metrics"].get("edges.false_positive_rate", {}).get("value", 0)
            },
            "calibration": {
                "overall_accuracy": export_data["metrics"].get("calibration.overall_accuracy", {}).get("value", 0),
                "settlement_rate": export_data["metrics"].get("calibration.settlement_rate", {}).get("value", 0),
                "weighted_error": export_data["metrics"].get("calibration.weighted_error", {}).get("value", 0)
            },
            "system": {
                "cpu_usage_pct": export_data["metrics"].get("system.cpu_usage_pct", {}).get("value", 0),
                "memory_usage_pct": export_data["metrics"].get("system.memory_usage_pct", {}).get("value", 0)
            }
        }
        
        # Export alert summary
        alert_levels = defaultdict(int)
        for alert in self.alerts:
            if not alert.resolved:
                alert_levels[alert.level.value] += 1
        export_data["alerts"]["by_level"] = dict(alert_levels)
        
        # Store in cache for API access
        await unified_cache_service.set("metrics_export", export_data, ttl=60)  # 1 minute TTL
        
        logger.debug(f"Exported metrics - {len(self.metrics)} metric types, "
                    f"{len([a for a in self.alerts if not a.resolved])} active alerts")

    def get_metric_history(self, metric_name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get historical values for a metric"""
        if metric_name not in self.metrics:
            return []
            
        points = list(self.metrics[metric_name])[-limit:]
        return [
            {
                "timestamp": p.timestamp,
                "value": p.value,
                "tags": p.tags
            }
            for p in points
        ]

    def get_prometheus_format(self) -> str:
        """Export metrics in Prometheus format"""
        lines = []
        
        for metric_name, points in self.metrics.items():
            if not points:
                continue
                
            latest = points[-1]
            
            # Convert metric name to Prometheus format
            prom_name = metric_name.replace(".", "_")
            
            # Add tags if present
            tag_str = ""
            if latest.tags:
                tag_pairs = [f'{k}="{v}"' for k, v in latest.tags.items()]
                tag_str = "{" + ",".join(tag_pairs) + "}"
            
            lines.append(f"{prom_name}{tag_str} {latest.value}")
        
        return "\n".join(lines)

    async def get_health_summary(self) -> Dict[str, Any]:
        """Get overall system health summary"""
        
        active_alerts = [a for a in self.alerts if not a.resolved]
        critical_alerts = [a for a in active_alerts if a.level == AlertLevel.CRITICAL]
        error_alerts = [a for a in active_alerts if a.level == AlertLevel.ERROR]
        
        # Overall health status
        if critical_alerts:
            health_status = "CRITICAL"
        elif error_alerts:
            health_status = "ERROR"
        elif len(active_alerts) > 5:
            health_status = "DEGRADED"
        else:
            health_status = "HEALTHY"
        
        return {
            "status": health_status,
            "timestamp": time.time(),
            "alerts": {
                "critical": len(critical_alerts),
                "error": len(error_alerts),
                "warning": len(active_alerts) - len(critical_alerts) - len(error_alerts),
                "total": len(active_alerts)
            },
            "key_metrics": {
                metric: self.metrics[metric][-1].value if metric in self.metrics and self.metrics[metric] else 0
                for metric in [
                    "recompute.queue_depth",
                    "edges.active_count", 
                    "calibration.overall_accuracy",
                    "system.cpu_usage_pct"
                ]
            }
        }


# Global metrics collector instance
metrics_collector = MetricsCollector()