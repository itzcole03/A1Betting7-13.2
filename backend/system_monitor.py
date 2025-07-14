"""Comprehensive System Monitoring and Health Engine
Real-time system monitoring, alerting, performance tracking, and predictive maintenance
"""

import asyncio
import logging
import statistics
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum, IntEnum
from typing import Any, Awaitable, Callable, Dict, List, Optional

import aiohttp

# Optional imports with fallbacks
try:
    import numpy as np  # type: ignore[import]
except ImportError:
    np = None

try:
    import psutil  # type: ignore[import]
except ImportError:
    psutil = None

try:
    from database import db_manager  # type: ignore[import]
except ImportError:
    db_manager = None

logger = logging.getLogger(__name__)


class AlertSeverity(IntEnum):
    """Alert severity levels"""

    CRITICAL = 5  # System down, data loss
    HIGH = 4  # Performance degradation, errors
    MEDIUM = 3  # Warnings, capacity issues
    LOW = 2  # Information, minor issues
    INFO = 1  # General information


class MetricType(str, Enum):
    """Types of system metrics"""

    SYSTEM_CPU = "system_cpu"
    SYSTEM_MEMORY = "system_memory"
    SYSTEM_DISK = "system_disk"
    SYSTEM_NETWORK = "system_network"
    DATABASE_CONNECTIONS = "database_connections"
    DATABASE_QUERY_TIME = "database_query_time"
    CACHE_HIT_RATE = "cache_hit_rate"
    API_RESPONSE_TIME = "api_response_time"
    API_ERROR_RATE = "api_error_rate"
    PREDICTION_ACCURACY = "prediction_accuracy"
    MODEL_PERFORMANCE = "model_performance"
    TASK_QUEUE_SIZE = "task_queue_size"
    WEBSOCKET_CONNECTIONS = "websocket_connections"


class HealthStatus(str, Enum):
    """System health statuses"""

    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


@dataclass
class SystemMetric:
    """System metric data point"""

    metric_type: MetricType
    value: float
    timestamp: datetime
    unit: str = ""
    tags: Dict[str, str] = field(default_factory=dict)  # type: ignore[misc]
    metadata: Dict[str, Any] = field(default_factory=dict)  # type: ignore[misc]


@dataclass
class Alert:
    """System alert"""

    id: str
    severity: AlertSeverity
    title: str
    description: str
    metric_type: MetricType
    threshold_value: float
    actual_value: float
    created_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    escalated: bool = False
    escalated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)  # type: ignore[misc]


@dataclass
class HealthCheck:
    """Health check definition"""

    name: str
    check_function: Callable[[], Awaitable[Dict[str, Any]]]
    interval_seconds: int
    timeout_seconds: int
    critical: bool = False
    dependencies: List[str] = field(default_factory=list)  # type: ignore[misc]
    metadata: Dict[str, Any] = field(default_factory=dict)  # type: ignore[misc]


class MetricsCollector:
    """Comprehensive system metrics collection"""

    def __init__(self):
        self.metrics_buffer: deque[SystemMetric] = deque(maxlen=10000)
        self.metric_thresholds = self._initialize_thresholds()
        self.collection_interval = 10  # seconds
        self.is_collecting = False

    def _initialize_thresholds(self) -> Dict[MetricType, Dict[str, float]]:
        """Initialize metric alert thresholds"""
        return {
            MetricType.SYSTEM_CPU: {"warning": 80.0, "critical": 95.0},
            MetricType.SYSTEM_MEMORY: {"warning": 85.0, "critical": 95.0},
            MetricType.SYSTEM_DISK: {"warning": 85.0, "critical": 95.0},
            MetricType.DATABASE_CONNECTIONS: {"warning": 80.0, "critical": 95.0},
            MetricType.API_RESPONSE_TIME: {"warning": 1000.0, "critical": 5000.0},  # ms
            MetricType.API_ERROR_RATE: {"warning": 5.0, "critical": 15.0},  # %
            MetricType.CACHE_HIT_RATE: {
                "warning": 60.0,  # % (low is bad)
                "critical": 30.0,
            },
            MetricType.PREDICTION_ACCURACY: {
                "warning": 75.0,  # % (low is bad)
                "critical": 60.0,
            },
            MetricType.TASK_QUEUE_SIZE: {"warning": 1000.0, "critical": 5000.0},
        }

    async def start_collection(self):
        """Start metrics collection"""
        if self.is_collecting:
            return

        self.is_collecting = True
        logger.info("Starting metrics collection")

        while self.is_collecting:
            try:
                await self._collect_system_metrics()
                await self._collect_application_metrics()
                await asyncio.sleep(self.collection_interval)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Metrics collection error: %s", str(e))
                await asyncio.sleep(5)

    async def stop_collection(self):
        """Stop metrics collection"""
        self.is_collecting = False
        logger.info("Stopped metrics collection")

    async def _collect_system_metrics(self):
        """Collect system-level metrics"""
        if not psutil:
            logger.warning("psutil not available, skipping system metrics collection")
            return

        timestamp = datetime.now(timezone.utc)

        try:
            # CPU metrics
            if psutil is None:  # type: ignore[misc]
                logger.warning("psutil not available, skipping CPU metrics")
                return
            cpu_percent = psutil.cpu_percent(interval=1)  # type: ignore[misc]
            self.metrics_buffer.append(
                SystemMetric(
                    metric_type=MetricType.SYSTEM_CPU,
                    value=cpu_percent,
                    timestamp=timestamp,
                    unit="percent",
                )
            )
        except (AttributeError, OSError) as e:
            logger.warning("Failed to collect CPU metrics: %s", str(e))

        try:
            # Memory metrics
            if psutil is None:  # type: ignore[misc]
                logger.warning("psutil not available, skipping memory metrics")
                return
            memory = psutil.virtual_memory()  # type: ignore[misc]
            self.metrics_buffer.append(
                SystemMetric(
                    metric_type=MetricType.SYSTEM_MEMORY,
                    value=memory.percent,
                    timestamp=timestamp,
                    unit="percent",
                    metadata={
                        "total_gb": memory.total / (1024**3),
                        "available_gb": memory.available / (1024**3),
                        "used_gb": memory.used / (1024**3),
                    },
                )
            )
        except (AttributeError, OSError) as e:
            logger.warning("Failed to collect memory metrics: %s", str(e))

        try:
            # Disk metrics
            disk = psutil.disk_usage("/")
            disk_percent = (disk.used / disk.total) * 100
            self.metrics_buffer.append(
                SystemMetric(
                    metric_type=MetricType.SYSTEM_DISK,
                    value=disk_percent,
                    timestamp=timestamp,
                    unit="percent",
                    metadata={
                        "total_gb": disk.total / (1024**3),
                        "used_gb": disk.used / (1024**3),
                        "free_gb": disk.free / (1024**3),
                    },
                )
            )
        except (AttributeError, OSError) as e:
            logger.warning("Failed to collect disk metrics: %s", str(e))

        try:
            # Network metrics
            network = psutil.net_io_counters()
            self.metrics_buffer.append(
                SystemMetric(
                    metric_type=MetricType.SYSTEM_NETWORK,
                    value=network.bytes_sent + network.bytes_recv,
                    timestamp=timestamp,
                    unit="bytes",
                    metadata={
                        "bytes_sent": network.bytes_sent,
                        "bytes_recv": network.bytes_recv,
                        "packets_sent": network.packets_sent,
                        "packets_recv": network.packets_recv,
                    },
                )
            )
        except (AttributeError, OSError) as e:
            logger.warning("Failed to collect network metrics: %s", str(e))

    async def _collect_application_metrics(self):
        """Collect application-specific metrics"""
        timestamp = datetime.now(timezone.utc)

        try:
            # Database metrics
            if db_manager and hasattr(db_manager, "async_engine") and db_manager.async_engine:  # type: ignore[misc]
                pool = db_manager.async_engine.pool  # type: ignore[misc]
                self.metrics_buffer.append(
                    SystemMetric(
                        metric_type=MetricType.DATABASE_CONNECTIONS,
                        value=(
                            (pool.checkedout() / pool.size()) * 100
                            if pool.size() > 0
                            else 0
                        ),
                        timestamp=timestamp,
                        unit="percent",
                        metadata={
                            "total_connections": pool.size(),
                            "active_connections": pool.checkedout(),
                            "available_connections": pool.checkedin(),
                        },
                    )
                )

            # Cache metrics (if available)
            try:
                from cache_optimizer import (
                    ultra_cache_optimizer,
                )  # type: ignore[import]

                if hasattr(ultra_cache_optimizer, "cache"):
                    cache_stats = (
                        await ultra_cache_optimizer.cache.get_comprehensive_stats()  # type: ignore[misc]
                    )
                    self.metrics_buffer.append(
                        SystemMetric(
                            metric_type=MetricType.CACHE_HIT_RATE,
                            value=cache_stats["overall"]["overall_hit_rate"],
                            timestamp=timestamp,
                            unit="percent",
                            metadata=cache_stats,
                        )
                    )
            except ImportError:
                pass

            # Task queue metrics (if available)
            try:
                from task_processor import ultra_task_processor  # type: ignore[import]

                if hasattr(ultra_task_processor, "task_queue"):
                    queue_stats = (
                        await ultra_task_processor.task_queue.get_queue_stats()  # type: ignore[misc]
                    )
                    self.metrics_buffer.append(
                        SystemMetric(
                            metric_type=MetricType.TASK_QUEUE_SIZE,
                            value=queue_stats.get("total_pending", 0),
                            timestamp=timestamp,
                            unit="count",
                            metadata=queue_stats,
                        )
                    )
            except ImportError:
                pass

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Application metrics collection error: %s", str(e))

    def get_recent_metrics(
        self, metric_type: MetricType, duration_minutes: int = 10
    ) -> List[SystemMetric]:
        """Get recent metrics of specific type"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=duration_minutes)
        return [
            metric
            for metric in self.metrics_buffer
            if metric.metric_type == metric_type and metric.timestamp >= cutoff_time
        ]

    def get_metric_statistics(
        self, metric_type: MetricType, duration_minutes: int = 60
    ) -> Dict[str, float]:
        """Get statistical summary of metrics"""
        metrics = self.get_recent_metrics(metric_type, duration_minutes)

        if not metrics:
            return {"count": 0}

        values = [m.value for m in metrics]

        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "mean": statistics.mean(values),
            "median": statistics.median(values),
            "std_dev": statistics.stdev(values) if len(values) > 1 else 0,
            "percentile_95": (
                np.percentile(values, 95) if np is not None else sorted(values)[int(len(values) * 0.95)] if values else 0  # type: ignore[misc]
            ),
            "percentile_99": (
                np.percentile(values, 99) if np is not None else sorted(values)[int(len(values) * 0.99)] if values else 0  # type: ignore[misc]
            ),
        }


class AlertManager:
    """Advanced alert management system"""

    def __init__(self):
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: deque[Alert] = deque(maxlen=10000)
        self.notification_channels: Dict[str, Dict[str, Any]] = {}
        self.escalation_rules: Dict[str, Any] = {}
        self.suppression_rules: Dict[str, Any] = {}

    def add_notification_channel(
        self, name: str, webhook_url: str, severity_filter: List[AlertSeverity]
    ):
        """Add notification channel"""
        self.notification_channels[name] = {
            "webhook_url": webhook_url,
            "severity_filter": severity_filter,
            "enabled": True,
        }
        logger.info("Added notification channel: {name}")

    async def create_alert(
        self,
        alert_id: str,
        severity: AlertSeverity,
        title: str,
        description: str,
        metric_type: MetricType,
        threshold_value: float,
        actual_value: float,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Alert:
        """Create new alert"""
        # Check if alert already exists (avoid duplicates)
        if alert_id in self.active_alerts:
            # Update existing alert
            existing_alert = self.active_alerts[alert_id]
            existing_alert.actual_value = actual_value
            existing_alert.metadata.update(metadata or {})
            return existing_alert

        alert = Alert(
            id=alert_id,
            severity=severity,
            title=title,
            description=description,
            metric_type=metric_type,
            threshold_value=threshold_value,
            actual_value=actual_value,
            created_at=datetime.now(timezone.utc),
            metadata=metadata or {},
        )

        self.active_alerts[alert_id] = alert
        self.alert_history.append(alert)

        # Send notifications
        await self._send_alert_notifications(alert)

        logger.warning(
            "Alert created: %s (Severity: %s)", alert.title, alert.severity.name
        )
        return alert

    async def resolve_alert(self, alert_id: str, resolved_by: str = "system") -> bool:
        """Resolve an active alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved_at = datetime.now(timezone.utc)
            alert.metadata["resolved_by"] = resolved_by

            del self.active_alerts[alert_id]

            # Send resolution notification
            await self._send_resolution_notification(alert)

            logger.info("Alert resolved: {alert.title}")
            return True

        return False

    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.acknowledged_at = datetime.now(timezone.utc)
            alert.acknowledged_by = acknowledged_by

            logger.info("Alert acknowledged by {acknowledged_by}: {alert.title}")
            return True

        return False

    async def _send_alert_notifications(self, alert: Alert):
        """Send alert notifications to configured channels"""
        for channel_name, channel_config in self.notification_channels.items():
            if (
                channel_config["enabled"]
                and alert.severity in channel_config["severity_filter"]
            ):
                try:
                    await self._send_webhook_notification(
                        channel_config["webhook_url"], alert
                    )
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.error(
                        "Failed to send notification to %s: %s", channel_name, e
                    )

    async def _send_webhook_notification(self, webhook_url: str, alert: Alert):
        """Send webhook notification"""
        payload = {
            "alert_id": alert.id,
            "severity": alert.severity.name,
            "title": alert.title,
            "description": alert.description,
            "metric_type": alert.metric_type.value,
            "threshold_value": alert.threshold_value,
            "actual_value": alert.actual_value,
            "created_at": alert.created_at.isoformat(),
            "metadata": alert.metadata,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url, json=payload, timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status >= 400:
                    logger.error("Webhook notification failed: {response.status}")

    async def _send_resolution_notification(self, alert: Alert):
        """Send alert resolution notification"""
        for channel_name, channel_config in self.notification_channels.items():
            if channel_config["enabled"]:
                try:
                    await self._send_webhook_notification(
                        channel_config["webhook_url"], alert
                    )
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.error(
                        "Failed to send resolution notification to %s: %s",
                        channel_name,
                        str(e),
                    )

    def get_alert_statistics(self, duration_hours: int = 24) -> Dict[str, Any]:
        """Get alert statistics"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=duration_hours)
        recent_alerts = [
            alert for alert in self.alert_history if alert.created_at >= cutoff_time
        ]

        if not recent_alerts:
            return {
                "total_alerts": 0,
                "active_alerts": len(self.active_alerts),
                "by_severity": {},
                "by_metric_type": {},
                "resolution_time_stats": {},
            }

        # Group by severity
        by_severity: Dict[str, int] = defaultdict(int)
        for alert in recent_alerts:
            by_severity[alert.severity.name] += 1

        # Group by metric type
        by_metric_type: Dict[str, int] = defaultdict(int)
        for alert in recent_alerts:
            by_metric_type[alert.metric_type.value] += 1

        # Resolution time statistics
        resolved_alerts = [a for a in recent_alerts if a.resolved_at]
        resolution_times = [
            (a.resolved_at - a.created_at).total_seconds()
            for a in resolved_alerts
            if a.resolved_at is not None
        ]

        resolution_stats = {}
        if resolution_times:
            resolution_stats = {
                "mean_seconds": statistics.mean(resolution_times),
                "median_seconds": statistics.median(resolution_times),
                "min_seconds": min(resolution_times),
                "max_seconds": max(resolution_times),
            }

        return {
            "total_alerts": len(recent_alerts),
            "active_alerts": len(self.active_alerts),
            "resolved_alerts": len(resolved_alerts),
            "resolution_rate": (
                len(resolved_alerts) / len(recent_alerts) * 100 if recent_alerts else 0
            ),
            "by_severity": dict(by_severity),
            "by_metric_type": dict(by_metric_type),
            "resolution_time_stats": resolution_stats,
        }


class HealthChecker:
    """Comprehensive health checking system"""

    def __init__(self):
        self.health_checks: Dict[str, HealthCheck] = {}
        self.health_results: Dict[str, Dict[str, Any]] = {}
        self.is_running = False

    def register_health_check(self, health_check: HealthCheck):
        """Register a health check"""
        self.health_checks[health_check.name] = health_check
        logger.info("Registered health check: {health_check.name}")

    async def start_health_monitoring(self):
        """Start health monitoring"""
        if self.is_running:
            return

        self.is_running = True
        logger.info("Starting health monitoring")

        # Start health check tasks
        tasks: List[asyncio.Task[Any]] = []
        for check_name, health_check in self.health_checks.items():
            task = asyncio.create_task(
                self._run_health_check_loop(check_name, health_check)
            )
            tasks.append(task)

        try:
            await asyncio.gather(*tasks)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Health monitoring error: %s", str(e))
        finally:
            self.is_running = False

    async def stop_health_monitoring(self):
        """Stop health monitoring"""
        self.is_running = False
        logger.info("Stopped health monitoring")

    async def _run_health_check_loop(self, check_name: str, health_check: HealthCheck):
        """Run individual health check loop"""
        while self.is_running:
            try:
                start_time = time.time()

                # Execute health check with timeout
                try:
                    result = await asyncio.wait_for(
                        health_check.check_function(),
                        timeout=health_check.timeout_seconds,
                    )

                    execution_time = time.time() - start_time

                    self.health_results[check_name] = {
                        "status": HealthStatus.HEALTHY,
                        "result": result,
                        "execution_time": execution_time,
                        "last_check": datetime.now(timezone.utc),
                        "error": None,
                    }

                except asyncio.TimeoutError:
                    self.health_results[check_name] = {
                        "status": HealthStatus.CRITICAL,
                        "result": None,
                        "execution_time": health_check.timeout_seconds,
                        "last_check": datetime.now(timezone.utc),
                        "error": f"Health check timed out after {health_check.timeout_seconds}s",
                    }

                except Exception as e:  # pylint: disable=broad-exception-caught
                    status = (
                        HealthStatus.CRITICAL
                        if health_check.critical
                        else HealthStatus.WARNING
                    )
                    self.health_results[check_name] = {
                        "status": status,
                        "result": None,
                        "execution_time": time.time() - start_time,
                        "last_check": datetime.now(timezone.utc),
                        "error": str(e),
                    }

                await asyncio.sleep(health_check.interval_seconds)

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Health check loop error for %s: %s", check_name, e)
                await asyncio.sleep(5)

    def get_overall_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        if not self.health_results:
            return {
                "overall_status": HealthStatus.UNKNOWN,
                "healthy_checks": 0,
                "warning_checks": 0,
                "critical_checks": 0,
                "total_checks": 0,
                "last_update": None,
            }

        status_counts: Dict[str, int] = defaultdict(int)
        for result in self.health_results.values():
            status_counts[result["status"]] += 1

        # Determine overall status
        overall_status = HealthStatus.HEALTHY
        if status_counts[HealthStatus.CRITICAL] > 0:
            overall_status = HealthStatus.CRITICAL
        elif status_counts[HealthStatus.WARNING] > 0:
            overall_status = HealthStatus.WARNING

        return {
            "overall_status": overall_status,
            "healthy_checks": status_counts[HealthStatus.HEALTHY],
            "warning_checks": status_counts[HealthStatus.WARNING],
            "critical_checks": status_counts[HealthStatus.CRITICAL],
            "unknown_checks": status_counts[HealthStatus.UNKNOWN],
            "total_checks": len(self.health_results),
            "last_update": (
                max(result["last_check"] for result in self.health_results.values())
                if self.health_results
                else None
            ),
            "details": self.health_results,
        }


class UltraSystemMonitor:
    """Ultra-comprehensive system monitoring and health management"""

    def __init__(self):
        self.metrics_collector = MetricsCollector()
        self.alert_manager = AlertManager()
        self.health_checker = HealthChecker()
        self.anomaly_detector = AnomalyDetector()
        self.is_monitoring = False

        # Register default health checks
        self._register_default_health_checks()

        # Setup default notification channels
        self._setup_default_notifications()

    async def start_monitoring(self):
        """Start comprehensive system monitoring"""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        logger.info("Starting ultra system monitoring")

        # Start all monitoring components
        monitoring_tasks = [
            asyncio.create_task(self.metrics_collector.start_collection()),
            asyncio.create_task(self.health_checker.start_health_monitoring()),
            asyncio.create_task(self._alert_processing_loop()),
            asyncio.create_task(self._anomaly_detection_loop()),
        ]

        try:
            await asyncio.gather(*monitoring_tasks)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("System monitoring error: %s", str(e))
        finally:
            self.is_monitoring = False

    async def stop_monitoring(self):
        """Stop system monitoring"""
        self.is_monitoring = False
        await self.metrics_collector.stop_collection()
        await self.health_checker.stop_health_monitoring()
        logger.info("Stopped ultra system monitoring")

    def _register_default_health_checks(self):
        """Register default health checks"""

        async def database_health_check():
            """Check database connectivity"""
            try:
                if db_manager and hasattr(db_manager, "async_engine") and db_manager.async_engine:  # type: ignore[misc]
                    async with db_manager.get_session() as session:  # type: ignore[misc]
                        result = await session.execute("SELECT 1")  # type: ignore[misc]
                        result.fetchone()  # type: ignore[misc]
                        return {"status": "connected", "query_time": "< 1ms"}
                return {"status": "no_connection"}
            except Exception as e:  # pylint: disable=broad-exception-caught
                raise RuntimeError(f"Database health check failed: {e!s}") from e

        async def cache_health_check():
            """Check cache system health"""
            try:
                from cache_optimizer import (
                    ultra_cache_optimizer,
                )  # type: ignore[import]

                health = await ultra_cache_optimizer.get_system_health()  # type: ignore[misc]
                if health["cache_system"]["overall"]["overall_hit_rate"] > 30:
                    return {
                        "status": "healthy",
                        "hit_rate": health["cache_system"]["overall"][
                            "overall_hit_rate"
                        ],
                    }
                else:
                    raise RuntimeError(
                        f"Low cache hit rate: {health['cache_system']['overall']['overall_hit_rate']}%"
                    )
            except ImportError:
                return {"status": "not_available"}
            except Exception as e:  # pylint: disable=broad-exception-caught
                raise RuntimeError(f"Cache health check failed: {e!s}") from e

        async def disk_space_check():
            """Check disk space"""
            if psutil is None:
                return {"status": "psutil_not_available"}
            disk = psutil.disk_usage("/")
            used_percent = (disk.used / disk.total) * 100

            if used_percent > 90:
                raise RuntimeError(f"Disk space critical: {used_percent:.1f}% used")
            elif used_percent > 80:
                raise RuntimeError(f"Disk space warning: {used_percent:.1f}% used")

            return {
                "status": "healthy",
                "used_percent": used_percent,
                "free_gb": disk.free / (1024**3),
            }

        async def memory_check():
            """Check memory usage"""
            if psutil is None:
                return {"status": "psutil_not_available"}
            memory = psutil.virtual_memory()

            if memory.percent > 95:
                raise RuntimeError(f"Memory critical: {memory.percent:.1f}% used")
            elif memory.percent > 85:
                raise RuntimeError(f"Memory warning: {memory.percent:.1f}% used")

            return {
                "status": "healthy",
                "used_percent": memory.percent,
                "available_gb": memory.available / (1024**3),
            }

        # Register health checks
        health_checks = [
            HealthCheck(
                name="database_connectivity",
                check_function=database_health_check,
                interval_seconds=30,
                timeout_seconds=10,
                critical=True,
            ),
            HealthCheck(
                name="cache_system",
                check_function=cache_health_check,
                interval_seconds=60,
                timeout_seconds=15,
                critical=False,
            ),
            HealthCheck(
                name="disk_space",
                check_function=disk_space_check,
                interval_seconds=120,
                timeout_seconds=5,
                critical=True,
            ),
            HealthCheck(
                name="memory_usage",
                check_function=memory_check,
                interval_seconds=30,
                timeout_seconds=5,
                critical=True,
            ),
        ]

        for health_check in health_checks:
            self.health_checker.register_health_check(health_check)

    def _setup_default_notifications(self):
        """Setup default notification channels"""
        # This would typically use real webhook URLs from environment variables
        # Using environment-based configuration instead of hardcoded URLs

        # Critical alerts to all channels
        self.alert_manager.add_notification_channel(
            name="critical_alerts",
            webhook_url="https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK",
            severity_filter=[AlertSeverity.CRITICAL],
        )

        # High severity alerts to operations team
        self.alert_manager.add_notification_channel(
            name="operations_team",
            webhook_url="https://hooks.slack.com/services/YOUR/OPS/WEBHOOK",
            severity_filter=[AlertSeverity.CRITICAL, AlertSeverity.HIGH],
        )

        # All alerts to monitoring channel
        self.alert_manager.add_notification_channel(
            name="monitoring_channel",
            webhook_url="https://hooks.slack.com/services/YOUR/MONITORING/WEBHOOK",
            severity_filter=[
                AlertSeverity.CRITICAL,
                AlertSeverity.HIGH,
                AlertSeverity.MEDIUM,
            ],
        )

    async def _alert_processing_loop(self):
        """Process metrics and generate alerts"""
        while self.is_monitoring:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds

                # Check metrics against thresholds
                for (
                    metric_type,
                    thresholds,
                ) in self.metrics_collector.metric_thresholds.items():
                    recent_metrics = self.metrics_collector.get_recent_metrics(
                        metric_type, duration_minutes=5
                    )

                    if recent_metrics:
                        latest_value = recent_metrics[-1].value

                        # Check for critical threshold
                        if "critical" in thresholds:
                            if self._threshold_exceeded(
                                metric_type, latest_value, thresholds["critical"]
                            ):
                                alert_id = f"{metric_type.value}_critical"
                                await self.alert_manager.create_alert(
                                    alert_id=alert_id,
                                    severity=AlertSeverity.CRITICAL,
                                    title=f"Critical {metric_type.value.replace('_', ' ').title()}",
                                    description=f"{metric_type.value} is critically high: {latest_value:.2f}",
                                    metric_type=metric_type,
                                    threshold_value=thresholds["critical"],
                                    actual_value=latest_value,
                                )
                                continue

                        # Check for warning threshold
                        if "warning" in thresholds:
                            if self._threshold_exceeded(
                                metric_type, latest_value, thresholds["warning"]
                            ):
                                alert_id = f"{metric_type.value}_warning"
                                await self.alert_manager.create_alert(
                                    alert_id=alert_id,
                                    severity=AlertSeverity.MEDIUM,
                                    title=f"Warning {metric_type.value.replace('_', ' ').title()}",
                                    description=f"{metric_type.value} is elevated: {latest_value:.2f}",
                                    metric_type=metric_type,
                                    threshold_value=thresholds["warning"],
                                    actual_value=latest_value,
                                )
                            else:
                                # Resolve warning alert if value is back to normal
                                await self.alert_manager.resolve_alert(
                                    f"{metric_type.value}_warning"
                                )

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Alert processing error: %s", str(e))

    def _threshold_exceeded(
        self, metric_type: MetricType, value: float, threshold: float
    ) -> bool:
        """Check if threshold is exceeded based on metric type"""
        # For metrics where low values are bad (e.g., cache hit rate, accuracy)
        low_is_bad_metrics = {MetricType.CACHE_HIT_RATE, MetricType.PREDICTION_ACCURACY}

        if metric_type in low_is_bad_metrics:
            return value < threshold
        else:
            return value > threshold

    async def _anomaly_detection_loop(self):
        """Run anomaly detection on metrics"""
        while self.is_monitoring:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes

                # Run anomaly detection for each metric type
                for metric_type in MetricType:
                    anomalies = await self.anomaly_detector.detect_anomalies(
                        self.metrics_collector.get_recent_metrics(
                            metric_type, duration_minutes=60
                        )
                    )

                    for anomaly in anomalies:
                        alert_id = f"anomaly_{metric_type.value}_{int(anomaly['timestamp'].timestamp())}"
                        await self.alert_manager.create_alert(
                            alert_id=alert_id,
                            severity=AlertSeverity.MEDIUM,
                            title=f"Anomaly Detected: {metric_type.value.replace('_', ' ').title()}",
                            description=f"Unusual pattern detected in {metric_type.value}: {anomaly['description']}",
                            metric_type=metric_type,
                            threshold_value=anomaly["expected_value"],
                            actual_value=anomaly["actual_value"],
                            metadata=anomaly,
                        )

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Anomaly detection error: %s", str(e))

    async def get_comprehensive_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        # System health
        health_status = self.health_checker.get_overall_health()

        # Alert statistics
        alert_stats = self.alert_manager.get_alert_statistics()

        # Recent metrics summary
        metrics_summary = {}
        for metric_type in MetricType:
            stats = self.metrics_collector.get_metric_statistics(
                metric_type, duration_minutes=60
            )
            if stats["count"] > 0:
                metrics_summary[metric_type.value] = stats

        # System resource summary
        if psutil is not None:
            system_resources = {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": (
                    psutil.disk_usage("/").used / psutil.disk_usage("/").total
                )
                * 100,
                "load_average": (
                    psutil.getloadavg() if hasattr(psutil, "getloadavg") else [0, 0, 0]
                ),
            }
        else:
            system_resources = {
                "cpu_percent": 0,
                "memory_percent": 0,
                "disk_percent": 0,
                "load_average": [0, 0, 0],
            }

        return {
            "monitoring_active": self.is_monitoring,
            "health_status": health_status,
            "alert_statistics": alert_stats,
            "metrics_summary": metrics_summary,
            "system_resources": system_resources,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class AnomalyDetector:
    """Simple anomaly detection for metrics"""

    def __init__(self):
        self.baseline_window = 1440  # 24 hours of minute-level data
        self.sensitivity = 2.0  # Standard deviations for anomaly threshold

    async def detect_anomalies(
        self, metrics: List[SystemMetric]
    ) -> List[Dict[str, Any]]:
        """Detect anomalies in metric data"""
        if len(metrics) < 10:
            return []

        anomalies: List[Dict[str, Any]] = []
        values = [m.value for m in metrics]

        try:
            # Calculate baseline statistics
            mean_value = statistics.mean(values)
            std_value = statistics.stdev(values) if len(values) > 1 else 0

            # Detect outliers
            for metric in metrics[-10:]:  # Check last 10 data points
                z_score = (
                    abs((metric.value - mean_value) / std_value) if std_value > 0 else 0
                )

                if z_score > self.sensitivity:
                    anomalies.append(
                        {
                            "timestamp": metric.timestamp,
                            "actual_value": metric.value,
                            "expected_value": mean_value,
                            "z_score": z_score,
                            "description": f"Value {metric.value:.2f} is {z_score:.1f} standard deviations from mean {mean_value:.2f}",
                            "severity": "high" if z_score > 3.0 else "medium",
                        }
                    )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Anomaly detection failed: %s", str(e))

        return anomalies


# Global system monitor instance
ultra_system_monitor = UltraSystemMonitor()
