"""
Enhanced Monitoring and Alerting for A1Betting7-13.2

Phase 2 implementation: Comprehensive monitoring system with real-time alerting,
performance tracking, and intelligent anomaly detection for sports betting platform.

Architecture Features:
- Real-time performance monitoring
- Intelligent alerting with escalation
- Anomaly detection using statistical methods
- Business metrics tracking
- Custom dashboard integration
- Automated health checks
"""

import asyncio
import json
import logging
import math
import smtplib
import statistics
import time
import warnings
from collections import defaultdict, deque
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import aiohttp
import numpy as np
from scipy import stats

warnings.filterwarnings("ignore")

from ..cache_manager_consolidated import CacheManagerConsolidated

# Existing services integration
from ..redis_service_optimized import RedisServiceOptimized

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("enhanced_monitoring")


class AlertSeverity(Enum):
    """Alert severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(Enum):
    """Types of alerts"""

    PERFORMANCE = "performance"
    ERROR_RATE = "error_rate"
    BUSINESS_METRIC = "business_metric"
    SYSTEM_HEALTH = "system_health"
    ANOMALY = "anomaly"
    THRESHOLD = "threshold"
    TREND = "trend"


class MetricType(Enum):
    """Types of metrics to monitor"""

    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"
    RATE = "rate"


class MonitoringScope(Enum):
    """Monitoring scope levels"""

    SYSTEM = "system"
    SERVICE = "service"
    ENDPOINT = "endpoint"
    BUSINESS = "business"
    USER = "user"


@dataclass
class MetricDefinition:
    """Definition of a metric to monitor"""

    name: str
    metric_type: MetricType
    scope: MonitoringScope
    description: str
    unit: str
    collection_interval_seconds: int
    retention_hours: int
    alert_thresholds: Dict[AlertSeverity, float]
    collection_function: str
    enabled: bool = True


@dataclass
class AlertRule:
    """Alert rule configuration"""

    name: str
    metric_name: str
    alert_type: AlertType
    severity: AlertSeverity
    condition: str  # e.g., "value > threshold", "change_rate > 50%"
    threshold: float
    evaluation_window_minutes: int
    cooldown_minutes: int
    escalation_minutes: int
    notification_channels: List[str]
    auto_resolve: bool = True
    enabled: bool = True


@dataclass
class Alert:
    """Alert instance"""

    id: str
    rule_name: str
    metric_name: str
    alert_type: AlertType
    severity: AlertSeverity
    condition: str
    threshold: float
    current_value: float
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime]
    notification_sent: bool
    escalated: bool
    metadata: Dict[str, Any]


@dataclass
class MetricValue:
    """Single metric measurement"""

    name: str
    value: float
    timestamp: datetime
    tags: Dict[str, str]
    metadata: Dict[str, Any]


@dataclass
class MonitoringStats:
    """Monitoring system statistics"""

    total_metrics_collected: int
    active_alerts: int
    resolved_alerts_24h: int
    average_response_time_ms: float
    error_rate_percent: float
    system_health_score: float
    last_update: datetime


class AnomalyDetector:
    """Statistical anomaly detection for metrics"""

    def __init__(self, sensitivity: float = 2.0, window_size: int = 100):
        self.sensitivity = sensitivity  # Standard deviations for anomaly threshold
        self.window_size = window_size
        self.metric_history: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=window_size)
        )

    def add_value(self, metric_name: str, value: float):
        """Add new metric value to history"""
        self.metric_history[metric_name].append(value)

    def detect_anomaly(self, metric_name: str, value: float) -> Tuple[bool, float]:
        """
        Detect if value is anomalous for the metric
        Returns (is_anomaly, anomaly_score)
        """
        history = self.metric_history[metric_name]

        if len(history) < 10:
            return False, 0.0  # Need minimum history

        # Calculate statistical baseline
        mean = statistics.mean(history)
        stdev = statistics.stdev(history) if len(history) > 1 else 0

        if stdev == 0:
            return False, 0.0  # No variance in data

        # Calculate z-score
        z_score = abs(value - mean) / stdev

        # Anomaly if beyond sensitivity threshold
        is_anomaly = z_score > self.sensitivity
        anomaly_score = z_score / self.sensitivity if self.sensitivity > 0 else 0

        return is_anomaly, min(anomaly_score, 5.0)  # Cap at 5x threshold


class NotificationChannel:
    """Base class for notification channels"""

    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.config = config
        self.enabled = config.get("enabled", True)

    async def send_notification(self, alert: Alert) -> bool:
        """Send notification for alert"""
        raise NotImplementedError


class EmailNotificationChannel(NotificationChannel):
    """Email notification channel"""

    async def send_notification(self, alert: Alert) -> bool:
        """Send email notification"""
        try:
            if not self.enabled:
                return False

            smtp_host = self.config.get("smtp_host", "localhost")
            smtp_port = self.config.get("smtp_port", 587)
            username = self.config.get("username")
            password = self.config.get("password")
            from_email = self.config.get("from_email")
            to_emails = self.config.get("to_emails", [])

            if not all([from_email, to_emails]):
                logger.error("Email configuration incomplete")
                return False

            # Create message
            subject = f"[{alert.severity.value.upper()}] {alert.rule_name}"
            body = self._create_email_body(alert)

            msg = MIMEMultipart()
            msg["From"] = from_email
            msg["To"] = ", ".join(to_emails)
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))

            # Send email
            server = smtplib.SMTP(smtp_host, smtp_port)
            if username and password:
                server.starttls()
                server.login(username, password)

            server.send_message(msg)
            server.quit()

            logger.info(f"Email notification sent for alert {alert.id}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return False

    def _create_email_body(self, alert: Alert) -> str:
        """Create HTML email body"""
        severity_colors = {
            AlertSeverity.LOW: "#28a745",
            AlertSeverity.MEDIUM: "#ffc107",
            AlertSeverity.HIGH: "#fd7e14",
            AlertSeverity.CRITICAL: "#dc3545",
        }

        color = severity_colors.get(alert.severity, "#6c757d")

        return f"""
        <html>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: {color};">{alert.rule_name}</h2>
                <p><strong>Severity:</strong> <span style="color: {color};">{alert.severity.value.upper()}</span></p>
                <p><strong>Metric:</strong> {alert.metric_name}</p>
                <p><strong>Current Value:</strong> {alert.current_value}</p>
                <p><strong>Threshold:</strong> {alert.threshold}</p>
                <p><strong>Condition:</strong> {alert.condition}</p>
                <p><strong>Triggered At:</strong> {alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                <hr>
                <p>{alert.message}</p>
                
                <h3>Additional Information</h3>
                <ul>
                    <li><strong>Alert ID:</strong> {alert.id}</li>
                    <li><strong>Alert Type:</strong> {alert.alert_type.value}</li>
                </ul>
                
                <p style="color: #6c757d; font-size: 12px;">
                    This alert was generated by A1Betting7-13.2 Enhanced Monitoring System
                </p>
            </div>
        </body>
        </html>
        """


class WebhookNotificationChannel(NotificationChannel):
    """Webhook notification channel (Slack, Discord, etc.)"""

    async def send_notification(self, alert: Alert) -> bool:
        """Send webhook notification"""
        try:
            if not self.enabled:
                return False

            webhook_url = self.config.get("webhook_url")
            if not webhook_url:
                logger.error("Webhook URL not configured")
                return False

            payload = self._create_webhook_payload(alert)

            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status == 200:
                        logger.info(f"Webhook notification sent for alert {alert.id}")
                        return True
                    else:
                        logger.error(f"Webhook notification failed: {response.status}")
                        return False

        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")
            return False

    def _create_webhook_payload(self, alert: Alert) -> Dict[str, Any]:
        """Create webhook payload (Slack format)"""
        severity_colors = {
            AlertSeverity.LOW: "#28a745",
            AlertSeverity.MEDIUM: "#ffc107",
            AlertSeverity.HIGH: "#fd7e14",
            AlertSeverity.CRITICAL: "#dc3545",
        }

        return {
            "attachments": [
                {
                    "color": severity_colors.get(alert.severity, "#6c757d"),
                    "title": f"🚨 {alert.rule_name}",
                    "text": alert.message,
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert.severity.value.upper(),
                            "short": True,
                        },
                        {"title": "Metric", "value": alert.metric_name, "short": True},
                        {
                            "title": "Current Value",
                            "value": str(alert.current_value),
                            "short": True,
                        },
                        {
                            "title": "Threshold",
                            "value": str(alert.threshold),
                            "short": True,
                        },
                        {
                            "title": "Triggered At",
                            "value": alert.triggered_at.strftime(
                                "%Y-%m-%d %H:%M:%S UTC"
                            ),
                            "short": False,
                        },
                    ],
                    "footer": "A1Betting7-13.2 Monitoring",
                    "ts": int(alert.triggered_at.timestamp()),
                }
            ]
        }


class EnhancedMonitoring:
    """
    Enhanced Monitoring and Alerting System

    Provides comprehensive monitoring capabilities with intelligent alerting,
    anomaly detection, and real-time performance tracking.
    """

    def __init__(
        self,
        redis_service: RedisServiceOptimized,
        cache_manager: CacheManagerConsolidated,
        monitoring_interval_seconds: int = 30,
        max_alerts_per_rule: int = 5,
        enable_anomaly_detection: bool = True,
    ):
        self.redis_service = redis_service
        self.cache_manager = cache_manager
        self.monitoring_interval = monitoring_interval_seconds
        self.max_alerts_per_rule = max_alerts_per_rule
        self.enable_anomaly_detection = enable_anomaly_detection

        # Core components
        self.metric_definitions: Dict[str, MetricDefinition] = {}
        self.alert_rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.notification_channels: Dict[str, NotificationChannel] = {}

        # Anomaly detection
        self.anomaly_detector = AnomalyDetector() if enable_anomaly_detection else None

        # Metric storage
        self.metric_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.metric_cache: Dict[str, MetricValue] = {}

        # Performance tracking
        self.monitoring_stats = MonitoringStats(
            total_metrics_collected=0,
            active_alerts=0,
            resolved_alerts_24h=0,
            average_response_time_ms=0.0,
            error_rate_percent=0.0,
            system_health_score=1.0,
            last_update=datetime.now(),
        )

        # Background tasks
        self._monitoring_task: Optional[asyncio.Task] = None
        self._alert_task: Optional[asyncio.Task] = None
        self._running = False

        # Initialize built-in metrics and rules
        self._initialize_builtin_metrics()
        self._initialize_builtin_alert_rules()
        self._initialize_notification_channels()

        logger.info("Enhanced Monitoring System initialized")

    def _initialize_builtin_metrics(self):
        """Initialize built-in metric definitions"""

        # System metrics
        system_metrics = [
            MetricDefinition(
                name="system_cpu_usage",
                metric_type=MetricType.GAUGE,
                scope=MonitoringScope.SYSTEM,
                description="System CPU usage percentage",
                unit="percent",
                collection_interval_seconds=30,
                retention_hours=24,
                alert_thresholds={
                    AlertSeverity.MEDIUM: 70.0,
                    AlertSeverity.HIGH: 85.0,
                    AlertSeverity.CRITICAL: 95.0,
                },
                collection_function="collect_cpu_usage",
            ),
            MetricDefinition(
                name="system_memory_usage",
                metric_type=MetricType.GAUGE,
                scope=MonitoringScope.SYSTEM,
                description="System memory usage percentage",
                unit="percent",
                collection_interval_seconds=30,
                retention_hours=24,
                alert_thresholds={
                    AlertSeverity.MEDIUM: 75.0,
                    AlertSeverity.HIGH: 90.0,
                    AlertSeverity.CRITICAL: 98.0,
                },
                collection_function="collect_memory_usage",
            ),
            MetricDefinition(
                name="redis_connection_count",
                metric_type=MetricType.GAUGE,
                scope=MonitoringScope.SERVICE,
                description="Active Redis connections",
                unit="count",
                collection_interval_seconds=60,
                retention_hours=24,
                alert_thresholds={
                    AlertSeverity.HIGH: 100.0,
                    AlertSeverity.CRITICAL: 150.0,
                },
                collection_function="collect_redis_connections",
            ),
        ]

        # API metrics
        api_metrics = [
            MetricDefinition(
                name="api_response_time",
                metric_type=MetricType.TIMER,
                scope=MonitoringScope.ENDPOINT,
                description="API endpoint response time",
                unit="ms",
                collection_interval_seconds=10,
                retention_hours=24,
                alert_thresholds={
                    AlertSeverity.MEDIUM: 1000.0,
                    AlertSeverity.HIGH: 3000.0,
                    AlertSeverity.CRITICAL: 5000.0,
                },
                collection_function="collect_api_response_time",
            ),
            MetricDefinition(
                name="api_error_rate",
                metric_type=MetricType.RATE,
                scope=MonitoringScope.ENDPOINT,
                description="API error rate percentage",
                unit="percent",
                collection_interval_seconds=60,
                retention_hours=24,
                alert_thresholds={
                    AlertSeverity.MEDIUM: 5.0,
                    AlertSeverity.HIGH: 10.0,
                    AlertSeverity.CRITICAL: 25.0,
                },
                collection_function="collect_api_error_rate",
            ),
            MetricDefinition(
                name="api_request_rate",
                metric_type=MetricType.RATE,
                scope=MonitoringScope.ENDPOINT,
                description="API requests per minute",
                unit="requests/min",
                collection_interval_seconds=60,
                retention_hours=24,
                alert_thresholds={
                    AlertSeverity.HIGH: 1000.0,
                    AlertSeverity.CRITICAL: 2000.0,
                },
                collection_function="collect_api_request_rate",
            ),
        ]

        # Business metrics
        business_metrics = [
            MetricDefinition(
                name="prediction_accuracy",
                metric_type=MetricType.GAUGE,
                scope=MonitoringScope.BUSINESS,
                description="ML prediction accuracy percentage",
                unit="percent",
                collection_interval_seconds=300,
                retention_hours=168,  # 1 week
                alert_thresholds={
                    AlertSeverity.MEDIUM: 60.0,  # Below 60% accuracy
                    AlertSeverity.HIGH: 50.0,
                    AlertSeverity.CRITICAL: 40.0,
                },
                collection_function="collect_prediction_accuracy",
            ),
            MetricDefinition(
                name="active_predictions",
                metric_type=MetricType.GAUGE,
                scope=MonitoringScope.BUSINESS,
                description="Number of active predictions",
                unit="count",
                collection_interval_seconds=300,
                retention_hours=72,
                alert_thresholds={
                    AlertSeverity.LOW: 1000.0,  # High volume alert
                    AlertSeverity.CRITICAL: 10.0,  # Too few predictions
                },
                collection_function="collect_active_predictions",
            ),
            MetricDefinition(
                name="data_freshness",
                metric_type=MetricType.GAUGE,
                scope=MonitoringScope.BUSINESS,
                description="Data freshness in minutes",
                unit="minutes",
                collection_interval_seconds=300,
                retention_hours=24,
                alert_thresholds={
                    AlertSeverity.MEDIUM: 30.0,
                    AlertSeverity.HIGH: 60.0,
                    AlertSeverity.CRITICAL: 120.0,
                },
                collection_function="collect_data_freshness",
            ),
        ]

        # Register all metrics
        all_metrics = system_metrics + api_metrics + business_metrics

        for metric_def in all_metrics:
            self.metric_definitions[metric_def.name] = metric_def

        logger.info(f"Initialized {len(all_metrics)} built-in metric definitions")

    def _initialize_builtin_alert_rules(self):
        """Initialize built-in alert rules"""

        alert_rules = [
            # System health alerts
            AlertRule(
                name="High CPU Usage",
                metric_name="system_cpu_usage",
                alert_type=AlertType.THRESHOLD,
                severity=AlertSeverity.HIGH,
                condition="value > threshold",
                threshold=85.0,
                evaluation_window_minutes=5,
                cooldown_minutes=15,
                escalation_minutes=30,
                notification_channels=["email", "webhook"],
            ),
            AlertRule(
                name="Critical Memory Usage",
                metric_name="system_memory_usage",
                alert_type=AlertType.THRESHOLD,
                severity=AlertSeverity.CRITICAL,
                condition="value > threshold",
                threshold=95.0,
                evaluation_window_minutes=2,
                cooldown_minutes=10,
                escalation_minutes=15,
                notification_channels=["email", "webhook"],
            ),
            # API performance alerts
            AlertRule(
                name="Slow API Response",
                metric_name="api_response_time",
                alert_type=AlertType.THRESHOLD,
                severity=AlertSeverity.MEDIUM,
                condition="average > threshold",
                threshold=2000.0,
                evaluation_window_minutes=10,
                cooldown_minutes=20,
                escalation_minutes=60,
                notification_channels=["webhook"],
            ),
            AlertRule(
                name="High API Error Rate",
                metric_name="api_error_rate",
                alert_type=AlertType.THRESHOLD,
                severity=AlertSeverity.HIGH,
                condition="value > threshold",
                threshold=10.0,
                evaluation_window_minutes=5,
                cooldown_minutes=15,
                escalation_minutes=30,
                notification_channels=["email", "webhook"],
            ),
            # Business metric alerts
            AlertRule(
                name="Low Prediction Accuracy",
                metric_name="prediction_accuracy",
                alert_type=AlertType.THRESHOLD,
                severity=AlertSeverity.HIGH,
                condition="value < threshold",
                threshold=60.0,
                evaluation_window_minutes=30,
                cooldown_minutes=60,
                escalation_minutes=120,
                notification_channels=["email"],
            ),
            AlertRule(
                name="Stale Data Alert",
                metric_name="data_freshness",
                alert_type=AlertType.THRESHOLD,
                severity=AlertSeverity.MEDIUM,
                condition="value > threshold",
                threshold=60.0,
                evaluation_window_minutes=15,
                cooldown_minutes=30,
                escalation_minutes=60,
                notification_channels=["webhook"],
            ),
            # Anomaly detection alerts
            AlertRule(
                name="API Response Time Anomaly",
                metric_name="api_response_time",
                alert_type=AlertType.ANOMALY,
                severity=AlertSeverity.MEDIUM,
                condition="anomaly_score > threshold",
                threshold=2.0,
                evaluation_window_minutes=15,
                cooldown_minutes=30,
                escalation_minutes=60,
                notification_channels=["webhook"],
            ),
        ]

        for rule in alert_rules:
            self.alert_rules[rule.name] = rule

        logger.info(f"Initialized {len(alert_rules)} built-in alert rules")

    def _initialize_notification_channels(self):
        """Initialize notification channels with default configuration"""

        # Email channel (disabled by default - requires configuration)
        email_config = {
            "enabled": False,
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "username": "",
            "password": "",
            "from_email": "",
            "to_emails": [],
        }
        self.notification_channels["email"] = EmailNotificationChannel(
            "email", email_config
        )

        # Webhook channel (disabled by default - requires configuration)
        webhook_config = {"enabled": False, "webhook_url": ""}
        self.notification_channels["webhook"] = WebhookNotificationChannel(
            "webhook", webhook_config
        )

        logger.info("Initialized notification channels")

    async def start_monitoring(self):
        """Start the monitoring system"""
        if self._running:
            logger.warning("Monitoring system already running")
            return

        self._running = True

        # Start monitoring tasks
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        self._alert_task = asyncio.create_task(self._alert_evaluation_loop())

        logger.info("Enhanced Monitoring System started")

    async def stop_monitoring(self):
        """Stop the monitoring system"""
        if not self._running:
            return

        self._running = False

        # Cancel tasks
        if self._monitoring_task:
            self._monitoring_task.cancel()
        if self._alert_task:
            self._alert_task.cancel()

        # Wait for tasks to complete
        try:
            if self._monitoring_task:
                await self._monitoring_task
            if self._alert_task:
                await self._alert_task
        except asyncio.CancelledError:
            pass

        logger.info("Enhanced Monitoring System stopped")

    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self._running:
            try:
                start_time = time.time()

                # Collect metrics
                await self._collect_all_metrics()

                # Update monitoring stats
                collection_time = (time.time() - start_time) * 1000
                self.monitoring_stats.average_response_time_ms = (
                    self.monitoring_stats.average_response_time_ms * 0.9
                ) + (collection_time * 0.1)
                self.monitoring_stats.last_update = datetime.now()

                # Wait for next collection
                await asyncio.sleep(self.monitoring_interval)

            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(self.monitoring_interval)

    async def _alert_evaluation_loop(self):
        """Alert evaluation loop"""
        while self._running:
            try:
                await self._evaluate_alert_rules()
                await asyncio.sleep(30)  # Evaluate alerts every 30 seconds

            except Exception as e:
                logger.error(f"Error in alert evaluation loop: {e}")
                await asyncio.sleep(30)

    async def _collect_all_metrics(self):
        """Collect all enabled metrics"""
        collection_tasks = []

        for metric_name, metric_def in self.metric_definitions.items():
            if metric_def.enabled:
                task = asyncio.create_task(
                    self._collect_metric(metric_name, metric_def)
                )
                collection_tasks.append(task)

        # Execute all collections in parallel
        if collection_tasks:
            await asyncio.gather(*collection_tasks, return_exceptions=True)

    async def _collect_metric(self, metric_name: str, metric_def: MetricDefinition):
        """Collect a single metric"""
        try:
            # Map function names to actual collection methods
            collection_methods = {
                "collect_cpu_usage": self._collect_cpu_usage,
                "collect_memory_usage": self._collect_memory_usage,
                "collect_redis_connections": self._collect_redis_connections,
                "collect_api_response_time": self._collect_api_response_time,
                "collect_api_error_rate": self._collect_api_error_rate,
                "collect_api_request_rate": self._collect_api_request_rate,
                "collect_prediction_accuracy": self._collect_prediction_accuracy,
                "collect_active_predictions": self._collect_active_predictions,
                "collect_data_freshness": self._collect_data_freshness,
            }

            if metric_def.collection_function not in collection_methods:
                logger.error(
                    f"Unknown collection function: {metric_def.collection_function}"
                )
                return

            # Collect metric value
            value = await collection_methods[metric_def.collection_function]()

            if value is not None:
                # Create metric value
                metric_value = MetricValue(
                    name=metric_name,
                    value=value,
                    timestamp=datetime.now(),
                    tags={"scope": metric_def.scope.value},
                    metadata={"unit": metric_def.unit},
                )

                # Store metric
                await self._store_metric(metric_value)

                # Update anomaly detection
                if self.anomaly_detector:
                    self.anomaly_detector.add_value(metric_name, value)

                self.monitoring_stats.total_metrics_collected += 1

        except Exception as e:
            logger.error(f"Error collecting metric {metric_name}: {e}")

    async def _store_metric(self, metric_value: MetricValue):
        """Store metric value in history and cache"""
        # Update in-memory cache
        self.metric_cache[metric_value.name] = metric_value

        # Add to history
        self.metric_history[metric_value.name].append(metric_value)

        # Store in Redis for persistence
        try:
            key = (
                f"metric:{metric_value.name}:{int(metric_value.timestamp.timestamp())}"
            )
            data = {
                "value": metric_value.value,
                "timestamp": metric_value.timestamp.isoformat(),
                "tags": metric_value.tags,
                "metadata": metric_value.metadata,
            }

            await self.redis_service.set_with_expiry(
                key, json.dumps(data), 86400  # 24 hours
            )

        except Exception as e:
            logger.error(f"Error storing metric in Redis: {e}")

    # Metric collection methods

    async def _collect_cpu_usage(self) -> float:
        """Collect CPU usage percentage"""
        try:
            import psutil

            return psutil.cpu_percent(interval=1)
        except ImportError:
            # Fallback: simulate CPU usage
            return 15.0 + (time.time() % 60) / 2.0
        except Exception as e:
            logger.error(f"Error collecting CPU usage: {e}")
            return None

    async def _collect_memory_usage(self) -> float:
        """Collect memory usage percentage"""
        try:
            import psutil

            return psutil.virtual_memory().percent
        except ImportError:
            # Fallback: simulate memory usage
            return 25.0 + (time.time() % 30) / 1.5
        except Exception as e:
            logger.error(f"Error collecting memory usage: {e}")
            return None

    async def _collect_redis_connections(self) -> float:
        """Collect Redis connection count"""
        try:
            info = await self.redis_service.get_info()
            return float(info.get("connected_clients", 0))
        except Exception as e:
            logger.error(f"Error collecting Redis connections: {e}")
            return None

    async def _collect_api_response_time(self) -> float:
        """Collect average API response time"""
        try:
            # Get from cache manager statistics
            stats = await self.cache_manager.get_performance_stats()
            return stats.get("average_response_time_ms", 100.0)
        except Exception as e:
            logger.error(f"Error collecting API response time: {e}")
            return None

    async def _collect_api_error_rate(self) -> float:
        """Collect API error rate percentage"""
        try:
            # Simulate error rate collection - in real implementation,
            # this would come from application metrics
            base_rate = 2.0
            variation = math.sin(time.time() / 3600) * 1.0  # Hourly variation
            return max(0.0, base_rate + variation)
        except Exception as e:
            logger.error(f"Error collecting API error rate: {e}")
            return None

    async def _collect_api_request_rate(self) -> float:
        """Collect API request rate"""
        try:
            # Simulate request rate - in real implementation,
            # this would come from application metrics
            base_rate = 150.0
            variation = math.sin(time.time() / 1800) * 50.0  # 30-minute cycles
            return max(0.0, base_rate + variation)
        except Exception as e:
            logger.error(f"Error collecting API request rate: {e}")
            return None

    async def _collect_prediction_accuracy(self) -> float:
        """Collect ML prediction accuracy"""
        try:
            # Get accuracy from ML pipeline metrics
            # In real implementation, this would query the ML service
            base_accuracy = 75.0
            drift = math.sin(time.time() / 86400) * 5.0  # Daily drift
            return max(40.0, min(95.0, base_accuracy + drift))
        except Exception as e:
            logger.error(f"Error collecting prediction accuracy: {e}")
            return None

    async def _collect_active_predictions(self) -> float:
        """Collect number of active predictions"""
        try:
            # Query Redis for active predictions
            pattern = "prediction:active:*"
            count = await self.redis_service.count_keys(pattern)
            return float(count)
        except Exception as e:
            logger.error(f"Error collecting active predictions: {e}")
            return None

    async def _collect_data_freshness(self) -> float:
        """Collect data freshness in minutes"""
        try:
            # Check timestamp of latest data update
            latest_key = "data:latest_update"
            latest_timestamp = await self.redis_service.get(latest_key)

            if latest_timestamp:
                latest_time = datetime.fromisoformat(latest_timestamp)
                freshness = (datetime.now() - latest_time).total_seconds() / 60.0
                return freshness
            else:
                return 30.0  # Default if no timestamp found

        except Exception as e:
            logger.error(f"Error collecting data freshness: {e}")
            return None

    async def _evaluate_alert_rules(self):
        """Evaluate all alert rules"""
        for rule_name, rule in self.alert_rules.items():
            if rule.enabled:
                try:
                    await self._evaluate_single_rule(rule)
                except Exception as e:
                    logger.error(f"Error evaluating rule {rule_name}: {e}")

    async def _evaluate_single_rule(self, rule: AlertRule):
        """Evaluate a single alert rule"""
        # Get metric data for evaluation window
        metric_data = await self._get_metric_data_for_window(
            rule.metric_name, rule.evaluation_window_minutes
        )

        if not metric_data:
            return

        # Evaluate condition
        triggered = False
        current_value = None

        if rule.alert_type == AlertType.THRESHOLD:
            current_value = await self._evaluate_threshold_condition(rule, metric_data)
            triggered = current_value is not None

        elif rule.alert_type == AlertType.ANOMALY:
            current_value, triggered = await self._evaluate_anomaly_condition(
                rule, metric_data
            )

        # Handle alert state
        alert_key = f"{rule.name}_{rule.metric_name}"

        if triggered:
            if alert_key not in self.active_alerts:
                # Create new alert
                alert = Alert(
                    id=f"alert_{int(time.time())}_{hash(alert_key) % 10000}",
                    rule_name=rule.name,
                    metric_name=rule.metric_name,
                    alert_type=rule.alert_type,
                    severity=rule.severity,
                    condition=rule.condition,
                    threshold=rule.threshold,
                    current_value=current_value,
                    message=self._create_alert_message(rule, current_value),
                    triggered_at=datetime.now(),
                    resolved_at=None,
                    notification_sent=False,
                    escalated=False,
                    metadata={},
                )

                self.active_alerts[alert_key] = alert
                self.monitoring_stats.active_alerts += 1

                # Send notification
                await self._send_alert_notification(alert)

                logger.warning(f"Alert triggered: {rule.name} - {current_value}")

        else:
            # Check if alert should be resolved
            if alert_key in self.active_alerts and rule.auto_resolve:
                alert = self.active_alerts[alert_key]
                alert.resolved_at = datetime.now()

                del self.active_alerts[alert_key]
                self.monitoring_stats.active_alerts -= 1
                self.monitoring_stats.resolved_alerts_24h += 1

                logger.info(f"Alert resolved: {rule.name}")

    async def _get_metric_data_for_window(
        self, metric_name: str, window_minutes: int
    ) -> List[MetricValue]:
        """Get metric data for evaluation window"""

        if metric_name not in self.metric_history:
            return []

        cutoff_time = datetime.now() - timedelta(minutes=window_minutes)

        # Filter history to window
        window_data = [
            metric
            for metric in self.metric_history[metric_name]
            if metric.timestamp >= cutoff_time
        ]

        return window_data

    async def _evaluate_threshold_condition(
        self, rule: AlertRule, metric_data: List[MetricValue]
    ) -> Optional[float]:
        """Evaluate threshold condition"""

        if not metric_data:
            return None

        values = [m.value for m in metric_data]

        if "average" in rule.condition:
            current_value = statistics.mean(values)
        elif "max" in rule.condition:
            current_value = max(values)
        elif "min" in rule.condition:
            current_value = min(values)
        else:
            current_value = values[-1]  # Latest value

        # Evaluate condition
        if ">" in rule.condition:
            return current_value if current_value > rule.threshold else None
        elif "<" in rule.condition:
            return current_value if current_value < rule.threshold else None
        else:
            return None

    async def _evaluate_anomaly_condition(
        self, rule: AlertRule, metric_data: List[MetricValue]
    ) -> Tuple[Optional[float], bool]:
        """Evaluate anomaly condition"""

        if not self.anomaly_detector or not metric_data:
            return None, False

        latest_value = metric_data[-1].value
        is_anomaly, anomaly_score = self.anomaly_detector.detect_anomaly(
            rule.metric_name, latest_value
        )

        triggered = is_anomaly and anomaly_score > rule.threshold

        return anomaly_score if triggered else None, triggered

    def _create_alert_message(self, rule: AlertRule, current_value: float) -> str:
        """Create alert message"""
        return (
            f"Alert '{rule.name}' triggered for metric '{rule.metric_name}'. "
            f"Current value: {current_value:.2f}, Threshold: {rule.threshold:.2f}. "
            f"Condition: {rule.condition}"
        )

    async def _send_alert_notification(self, alert: Alert):
        """Send alert notification through configured channels"""
        rule = self.alert_rules.get(alert.rule_name)
        if not rule:
            return

        notification_tasks = []

        for channel_name in rule.notification_channels:
            if channel_name in self.notification_channels:
                channel = self.notification_channels[channel_name]
                task = asyncio.create_task(channel.send_notification(alert))
                notification_tasks.append(task)

        if notification_tasks:
            results = await asyncio.gather(*notification_tasks, return_exceptions=True)

            # Check if any notifications succeeded
            success_count = sum(1 for result in results if result is True)

            if success_count > 0:
                alert.notification_sent = True
                logger.info(f"Alert notification sent via {success_count} channels")
            else:
                logger.error("Failed to send alert notification via any channel")

    async def register_metric(self, metric_definition: MetricDefinition):
        """Register a custom metric definition"""
        self.metric_definitions[metric_definition.name] = metric_definition
        logger.info(f"Registered custom metric: {metric_definition.name}")

    async def register_alert_rule(self, alert_rule: AlertRule):
        """Register a custom alert rule"""
        self.alert_rules[alert_rule.name] = alert_rule
        logger.info(f"Registered custom alert rule: {alert_rule.name}")

    async def configure_notification_channel(
        self, channel_name: str, config: Dict[str, Any]
    ):
        """Configure notification channel"""
        if channel_name == "email":
            self.notification_channels[channel_name] = EmailNotificationChannel(
                channel_name, config
            )
        elif channel_name == "webhook":
            self.notification_channels[channel_name] = WebhookNotificationChannel(
                channel_name, config
            )
        else:
            logger.error(f"Unknown notification channel: {channel_name}")
            return

        logger.info(f"Configured notification channel: {channel_name}")

    async def get_monitoring_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive monitoring dashboard data"""

        # Current metrics
        current_metrics = {}
        for name, metric in self.metric_cache.items():
            current_metrics[name] = {
                "value": metric.value,
                "timestamp": metric.timestamp.isoformat(),
                "unit": metric.metadata.get("unit", ""),
                "tags": metric.tags,
            }

        # Active alerts
        active_alerts_data = []
        for alert in self.active_alerts.values():
            active_alerts_data.append(
                {
                    "id": alert.id,
                    "rule_name": alert.rule_name,
                    "metric_name": alert.metric_name,
                    "severity": alert.severity.value,
                    "current_value": alert.current_value,
                    "threshold": alert.threshold,
                    "triggered_at": alert.triggered_at.isoformat(),
                    "message": alert.message,
                }
            )

        # Recent metrics history (last hour)
        recent_history = {}
        cutoff_time = datetime.now() - timedelta(hours=1)

        for metric_name, history in self.metric_history.items():
            recent_values = [
                {"value": m.value, "timestamp": m.timestamp.isoformat()}
                for m in history
                if m.timestamp >= cutoff_time
            ]
            if recent_values:
                recent_history[metric_name] = recent_values

        # System health score calculation
        health_score = await self._calculate_system_health_score()

        return {
            "monitoring_stats": asdict(self.monitoring_stats),
            "current_metrics": current_metrics,
            "active_alerts": active_alerts_data,
            "recent_history": recent_history,
            "system_health_score": health_score,
            "registered_metrics": len(self.metric_definitions),
            "registered_alert_rules": len(self.alert_rules),
            "notification_channels": {
                name: channel.enabled
                for name, channel in self.notification_channels.items()
            },
        }

    async def _calculate_system_health_score(self) -> float:
        """Calculate overall system health score (0-1)"""
        try:
            health_factors = []

            # CPU health (inverse of usage)
            if "system_cpu_usage" in self.metric_cache:
                cpu_usage = self.metric_cache["system_cpu_usage"].value
                cpu_health = max(0, 1 - (cpu_usage / 100))
                health_factors.append(cpu_health)

            # Memory health
            if "system_memory_usage" in self.metric_cache:
                memory_usage = self.metric_cache["system_memory_usage"].value
                memory_health = max(0, 1 - (memory_usage / 100))
                health_factors.append(memory_health)

            # API performance health
            if "api_response_time" in self.metric_cache:
                response_time = self.metric_cache["api_response_time"].value
                # Good response time: < 500ms = 1.0, 2000ms = 0.5, 5000ms+ = 0.0
                api_health = max(0, min(1, 1 - (response_time - 500) / 4500))
                health_factors.append(api_health)

            # Error rate health
            if "api_error_rate" in self.metric_cache:
                error_rate = self.metric_cache["api_error_rate"].value
                error_health = max(
                    0, 1 - (error_rate / 20)
                )  # 20% error rate = 0 health
                health_factors.append(error_health)

            # Active alerts penalty
            alert_penalty = min(0.5, len(self.active_alerts) * 0.1)

            if health_factors:
                base_health = statistics.mean(health_factors)
                return max(0, base_health - alert_penalty)
            else:
                return 0.8  # Default health if no metrics

        except Exception as e:
            logger.error(f"Error calculating system health score: {e}")
            return 0.5


# Factory function for easy initialization
async def create_enhanced_monitoring(
    redis_service: RedisServiceOptimized,
    cache_manager: CacheManagerConsolidated,
    **kwargs,
) -> EnhancedMonitoring:
    """Factory function to create the enhanced monitoring service"""
    monitoring = EnhancedMonitoring(
        redis_service=redis_service, cache_manager=cache_manager, **kwargs
    )

    # Start monitoring automatically
    await monitoring.start_monitoring()

    return monitoring
