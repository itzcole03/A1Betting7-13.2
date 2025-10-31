"""
Comprehensive Data Quality Monitoring and Alerting System
Advanced monitoring for data completeness, accuracy, consistency, and timeliness
"""

import asyncio
import json
import logging
import statistics
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

import numpy as np
from pydantic import BaseModel

from backend.services.enhanced_data_pipeline import enhanced_data_pipeline
from backend.services.intelligent_cache_service import intelligent_cache_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("data_quality_monitor")


class QualityMetricType(Enum):
    """Types of data quality metrics"""
    COMPLETENESS = "completeness"
    ACCURACY = "accuracy"
    CONSISTENCY = "consistency"
    TIMELINESS = "timeliness"
    VALIDITY = "validity"
    UNIQUENESS = "uniqueness"


class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class DataSourceType(Enum):
    """Data source types for monitoring"""
    SPORTRADAR = "sportradar"
    ODDS_API = "odds_api"
    MLB_STATS = "mlb_stats"
    BASEBALL_SAVANT = "baseball_savant"
    PRIZEPICKS = "prizepicks"


@dataclass
class QualityRule:
    """Data quality rule definition"""
    name: str
    metric_type: QualityMetricType
    data_source: DataSourceType
    field_path: str  # JSONPath for field validation
    rule_function: Callable[[Any], bool]
    threshold: float
    severity: AlertSeverity
    description: str
    enabled: bool = True


@dataclass
class QualityViolation:
    """Data quality violation record"""
    rule_name: str
    data_source: DataSourceType
    metric_type: QualityMetricType
    severity: AlertSeverity
    field_path: str
    expected_value: Any
    actual_value: Any
    threshold: float
    violation_score: float
    timestamp: datetime
    data_sample: Dict[str, Any]
    description: str


@dataclass
class QualityMetrics:
    """Aggregated quality metrics"""
    data_source: DataSourceType
    completeness_score: float = 0.0
    accuracy_score: float = 0.0
    consistency_score: float = 0.0
    timeliness_score: float = 0.0
    validity_score: float = 0.0
    uniqueness_score: float = 0.0
    overall_score: float = 0.0
    total_records: int = 0
    violations_count: int = 0
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class TimelinessMetric:
    """Timeliness tracking for data feeds"""
    data_source: DataSourceType
    expected_interval: int  # Expected update interval in seconds
    last_update: datetime
    update_count: int = 0
    avg_delay: float = 0.0
    max_delay: float = 0.0
    missed_updates: int = 0


class DataQualityMonitor:
    """
    Comprehensive data quality monitoring system with:
    - Real-time quality assessment
    - Automated anomaly detection
    - Cross-source reconciliation
    - Timeliness monitoring
    - Configurable alerting
    - Quality metrics dashboard
    """

    def __init__(self):
        # Quality rules registry
        self.quality_rules: Dict[str, QualityRule] = {}
        
        # Violation tracking
        self.recent_violations: deque = deque(maxlen=1000)
        self.violation_history: Dict[str, List[QualityViolation]] = defaultdict(list)
        
        # Metrics tracking
        self.quality_metrics: Dict[DataSourceType, QualityMetrics] = {}
        self.timeliness_metrics: Dict[DataSourceType, TimelinessMetric] = {}
        
        # Cross-source reconciliation
        self.reconciliation_rules: List[Callable] = []
        self.cross_source_cache: Dict[str, Any] = {}
        
        # Anomaly detection
        self.baseline_data: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.anomaly_thresholds: Dict[str, float] = {
            "odds_variance": 0.15,  # 15% variance threshold
            "score_discrepancy": 1.0,  # 1 point discrepancy
            "timestamp_drift": 300,  # 5 minutes drift
        }
        
        # Alerting
        self.alert_callbacks: Dict[AlertSeverity, List[Callable]] = {
            severity: [] for severity in AlertSeverity
        }
        self.alert_rate_limits: Dict[str, float] = {}  # rule_name -> last_alert_time
        self.alert_cooldown: int = 300  # 5 minutes cooldown between same alerts
        
        # Background tasks
        self._monitoring_task: Optional[asyncio.Task] = None
        self._timeliness_task: Optional[asyncio.Task] = None
        self._reconciliation_task: Optional[asyncio.Task] = None
        self._cleanup_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Initialize data quality monitoring system"""
        # Register default quality rules
        await self._register_default_rules()
        
        # Initialize metrics for all data sources
        for source_type in DataSourceType:
            self.quality_metrics[source_type] = QualityMetrics(data_source=source_type)
            
            # Set up timeliness tracking based on data source
            expected_intervals = {
                DataSourceType.SPORTRADAR: 30,  # Live data every 30 seconds
                DataSourceType.ODDS_API: 60,    # Odds updated every minute
                DataSourceType.MLB_STATS: 300,  # Stats every 5 minutes
                DataSourceType.BASEBALL_SAVANT: 3600,  # Hourly updates
                DataSourceType.PRIZEPICKS: 300,  # Props every 5 minutes
            }
            
            self.timeliness_metrics[source_type] = TimelinessMetric(
                data_source=source_type,
                expected_interval=expected_intervals.get(source_type, 300),
                last_update=datetime.now(timezone.utc)
            )
        
        # Start background monitoring tasks
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        self._timeliness_task = asyncio.create_task(self._timeliness_monitor())
        self._reconciliation_task = asyncio.create_task(self._reconciliation_monitor())
        self._cleanup_task = asyncio.create_task(self._cleanup_old_data())
        
        logger.info("✅ Data quality monitoring system initialized")

    async def _register_default_rules(self):
        """Register default data quality rules"""
        
        # Completeness rules
        self.register_rule(QualityRule(
            name="sportradar_game_completeness",
            metric_type=QualityMetricType.COMPLETENESS,
            data_source=DataSourceType.SPORTRADAR,
            field_path="$.games[*].id",
            rule_function=lambda x: x is not None and str(x).strip() != "",
            threshold=0.95,
            severity=AlertSeverity.ERROR,
            description="Game IDs must be present and non-empty"
        ))
        
        self.register_rule(QualityRule(
            name="odds_price_completeness",
            metric_type=QualityMetricType.COMPLETENESS,
            data_source=DataSourceType.ODDS_API,
            field_path="$.bookmakers[*].markets[*].outcomes[*].price",
            rule_function=lambda x: x is not None and isinstance(x, (int, float)) and x > 0,
            threshold=0.90,
            severity=AlertSeverity.WARNING,
            description="Odds prices must be present and positive"
        ))
        
        # Accuracy rules
        self.register_rule(QualityRule(
            name="odds_range_validation",
            metric_type=QualityMetricType.ACCURACY,
            data_source=DataSourceType.ODDS_API,
            field_path="$.bookmakers[*].markets[*].outcomes[*].price",
            rule_function=lambda x: isinstance(x, (int, float)) and 1.01 <= x <= 1000,
            threshold=0.99,
            severity=AlertSeverity.ERROR,
            description="Odds must be within reasonable range (1.01 to 1000)"
        ))
        
        self.register_rule(QualityRule(
            name="score_validation",
            metric_type=QualityMetricType.ACCURACY,
            data_source=DataSourceType.SPORTRADAR,
            field_path="$.games[*].home_score",
            rule_function=lambda x: x is None or (isinstance(x, int) and 0 <= x <= 50),
            threshold=0.99,
            severity=AlertSeverity.ERROR,
            description="Scores must be non-negative integers within reasonable range"
        ))
        
        # Timeliness rules
        self.register_rule(QualityRule(
            name="data_freshness_check",
            metric_type=QualityMetricType.TIMELINESS,
            data_source=DataSourceType.SPORTRADAR,
            field_path="$.last_updated",
            rule_function=lambda x: self._check_data_freshness(x, 300),  # 5 minutes
            threshold=0.95,
            severity=AlertSeverity.WARNING,
            description="Data must be updated within expected timeframe"
        ))
        
        # Consistency rules
        self.register_rule(QualityRule(
            name="team_name_consistency",
            metric_type=QualityMetricType.CONSISTENCY,
            data_source=DataSourceType.SPORTRADAR,
            field_path="$.games[*].home_team.name",
            rule_function=lambda x: isinstance(x, str) and len(x.strip()) > 0,
            threshold=0.98,
            severity=AlertSeverity.WARNING,
            description="Team names must be consistent and non-empty"
        ))

    def register_rule(self, rule: QualityRule):
        """Register a new quality rule"""
        self.quality_rules[rule.name] = rule
        logger.info(f"📋 Registered quality rule: {rule.name}")

    def register_alert_callback(self, severity: AlertSeverity, callback: Callable):
        """Register callback for quality alerts"""
        self.alert_callbacks[severity].append(callback)
        logger.info(f"🔔 Registered alert callback for {severity.value} alerts")

    def register_reconciliation_rule(self, rule_function: Callable):
        """Register cross-source reconciliation rule"""
        self.reconciliation_rules.append(rule_function)
        logger.info("🔄 Registered cross-source reconciliation rule")

    async def validate_data(self, data_source: DataSourceType, data: Dict[str, Any]) -> List[QualityViolation]:
        """Validate data against quality rules"""
        violations = []
        
        # Get applicable rules for this data source
        applicable_rules = [
            rule for rule in self.quality_rules.values()
            if rule.data_source == data_source and rule.enabled
        ]
        
        for rule in applicable_rules:
            try:
                # Extract field values using JSONPath-like syntax
                field_values = self._extract_field_values(data, rule.field_path)
                
                # Validate each value
                total_values = len(field_values)
                valid_values = sum(1 for value in field_values if rule.rule_function(value))
                
                if total_values > 0:
                    validity_ratio = valid_values / total_values
                    
                    if validity_ratio < rule.threshold:
                        violation = QualityViolation(
                            rule_name=rule.name,
                            data_source=data_source,
                            metric_type=rule.metric_type,
                            severity=rule.severity,
                            field_path=rule.field_path,
                            expected_value=f"≥{rule.threshold * 100}% valid",
                            actual_value=f"{validity_ratio * 100:.1f}% valid",
                            threshold=rule.threshold,
                            violation_score=rule.threshold - validity_ratio,
                            timestamp=datetime.now(timezone.utc),
                            data_sample=self._sample_invalid_data(data, field_values, rule),
                            description=rule.description
                        )
                        
                        violations.append(violation)
                        
                        # Check if we should send alert
                        await self._check_and_send_alert(violation)
                        
            except Exception as e:
                logger.error(f"❌ Error validating rule {rule.name}: {e}")
        
        # Update metrics
        await self._update_quality_metrics(data_source, violations, len(applicable_rules))
        
        return violations

    def _extract_field_values(self, data: Dict[str, Any], field_path: str) -> List[Any]:
        """Extract field values from data using JSONPath-like syntax"""
        # Simplified JSONPath implementation
        # In production, use a proper JSONPath library like jsonpath-ng
        
        values = []
        
        try:
            if field_path.startswith("$."):
                # Remove the $. prefix
                path = field_path[2:]
                values = self._traverse_path(data, path.split("."))
            else:
                # Direct field access
                if field_path in data:
                    values = [data[field_path]]
        
        except Exception as e:
            logger.warning(f"⚠️ Error extracting field {field_path}: {e}")
        
        return values

    def _traverse_path(self, data: Any, path_parts: List[str]) -> List[Any]:
        """Traverse nested data structure"""
        if not path_parts:
            return [data] if data is not None else []
        
        current_part = path_parts[0]
        remaining_parts = path_parts[1:]
        
        results = []
        
        if current_part == "*":
            # Wildcard - traverse all items
            if isinstance(data, dict):
                for value in data.values():
                    results.extend(self._traverse_path(value, remaining_parts))
            elif isinstance(data, list):
                for item in data:
                    results.extend(self._traverse_path(item, remaining_parts))
        elif current_part.endswith("[*]"):
            # Array wildcard
            field_name = current_part[:-3]
            if isinstance(data, dict) and field_name in data:
                array_data = data[field_name]
                if isinstance(array_data, list):
                    for item in array_data:
                        results.extend(self._traverse_path(item, remaining_parts))
        else:
            # Direct field access
            if isinstance(data, dict) and current_part in data:
                results.extend(self._traverse_path(data[current_part], remaining_parts))
        
        return results

    def _sample_invalid_data(self, data: Dict[str, Any], field_values: List[Any], rule: QualityRule) -> Dict[str, Any]:
        """Sample invalid data for violation report"""
        invalid_samples = []
        
        for value in field_values[:5]:  # Limit to 5 samples
            if not rule.rule_function(value):
                invalid_samples.append(value)
        
        return {
            "invalid_samples": invalid_samples,
            "total_samples": len(field_values),
            "rule_description": rule.description
        }

    def _check_data_freshness(self, timestamp_str: str, max_age_seconds: int) -> bool:
        """Check if data is fresh enough"""
        try:
            if isinstance(timestamp_str, str):
                # Parse timestamp
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            else:
                return True  # Skip validation if not a timestamp
            
            age_seconds = (datetime.now(timezone.utc) - timestamp).total_seconds()
            return age_seconds <= max_age_seconds
            
        except Exception:
            return False

    async def _check_and_send_alert(self, violation: QualityViolation):
        """Check alert rate limits and send alert if needed"""
        now = time.time()
        last_alert_time = self.alert_rate_limits.get(violation.rule_name, 0)
        
        if now - last_alert_time >= self.alert_cooldown:
            self.alert_rate_limits[violation.rule_name] = now
            
            # Send alerts to registered callbacks
            for callback in self.alert_callbacks[violation.severity]:
                try:
                    await callback(violation)
                except Exception as e:
                    logger.error(f"❌ Alert callback error: {e}")
            
            logger.warning(
                f"🚨 Data quality alert: {violation.rule_name} - "
                f"{violation.severity.value.upper()} - {violation.description}"
            )

    async def _update_quality_metrics(self, data_source: DataSourceType, violations: List[QualityViolation], total_rules: int):
        """Update quality metrics for data source"""
        metrics = self.quality_metrics[data_source]
        
        # Update violation counts
        metrics.violations_count += len(violations)
        metrics.total_records += 1
        
        # Calculate scores by metric type
        metric_scores = defaultdict(list)
        
        for violation in violations:
            score = 1.0 - violation.violation_score
            metric_scores[violation.metric_type].append(max(0.0, score))
        
        # Update individual metric scores
        if metric_scores[QualityMetricType.COMPLETENESS]:
            metrics.completeness_score = statistics.mean(metric_scores[QualityMetricType.COMPLETENESS])
        
        if metric_scores[QualityMetricType.ACCURACY]:
            metrics.accuracy_score = statistics.mean(metric_scores[QualityMetricType.ACCURACY])
        
        if metric_scores[QualityMetricType.CONSISTENCY]:
            metrics.consistency_score = statistics.mean(metric_scores[QualityMetricType.CONSISTENCY])
        
        if metric_scores[QualityMetricType.TIMELINESS]:
            metrics.timeliness_score = statistics.mean(metric_scores[QualityMetricType.TIMELINESS])
        
        if metric_scores[QualityMetricType.VALIDITY]:
            metrics.validity_score = statistics.mean(metric_scores[QualityMetricType.VALIDITY])
        
        # Calculate overall score
        scores = [
            metrics.completeness_score,
            metrics.accuracy_score,
            metrics.consistency_score,
            metrics.timeliness_score,
            metrics.validity_score,
        ]
        metrics.overall_score = statistics.mean([s for s in scores if s > 0])
        
        metrics.last_updated = datetime.now(timezone.utc)

    async def detect_anomalies(self, data_source: DataSourceType, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect anomalies in data using statistical methods"""
        anomalies = []
        
        try:
            # Extract key metrics for anomaly detection
            extracted_metrics = self._extract_metrics_for_anomaly_detection(data_source, data)
            
            for metric_name, current_value in extracted_metrics.items():
                baseline_key = f"{data_source.value}_{metric_name}"
                baseline_values = self.baseline_data[baseline_key]
                
                # Add current value to baseline
                baseline_values.append(current_value)
                
                # Detect anomalies if we have enough baseline data
                if len(baseline_values) >= 10:
                    anomaly = self._detect_statistical_anomaly(
                        baseline_key, current_value, list(baseline_values)[:-1]
                    )
                    
                    if anomaly:
                        anomalies.append(anomaly)
            
        except Exception as e:
            logger.error(f"❌ Anomaly detection error for {data_source.value}: {e}")
        
        return anomalies

    def _extract_metrics_for_anomaly_detection(self, data_source: DataSourceType, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract key metrics for anomaly detection"""
        metrics = {}
        
        try:
            if data_source == DataSourceType.ODDS_API:
                # Extract odds variance
                odds_values = self._extract_field_values(data, "$.bookmakers[*].markets[*].outcomes[*].price")
                if odds_values and len(odds_values) > 1:
                    metrics["odds_variance"] = np.var(odds_values)
                    metrics["odds_mean"] = np.mean(odds_values)
            
            elif data_source == DataSourceType.SPORTRADAR:
                # Extract scores if available
                home_scores = self._extract_field_values(data, "$.games[*].home_score")
                away_scores = self._extract_field_values(data, "$.games[*].away_score")
                
                if home_scores:
                    metrics["avg_home_score"] = np.mean([s for s in home_scores if s is not None])
                if away_scores:
                    metrics["avg_away_score"] = np.mean([s for s in away_scores if s is not None])
                
                # Extract game count
                games = self._extract_field_values(data, "$.games[*]")
                metrics["game_count"] = len(games)
            
        except Exception as e:
            logger.warning(f"⚠️ Error extracting metrics for {data_source.value}: {e}")
        
        return metrics

    def _detect_statistical_anomaly(self, metric_name: str, current_value: float, historical_values: List[float]) -> Optional[Dict[str, Any]]:
        """Detect statistical anomalies using z-score and IQR methods"""
        try:
            if len(historical_values) < 5:
                return None
            
            mean_val = np.mean(historical_values)
            std_val = np.std(historical_values)
            
            # Z-score anomaly detection
            if std_val > 0:
                z_score = abs((current_value - mean_val) / std_val)
                if z_score > 3:  # 3-sigma rule
                    return {
                        "type": "statistical_anomaly",
                        "metric": metric_name,
                        "method": "z_score",
                        "current_value": current_value,
                        "expected_range": f"{mean_val - 2*std_val:.2f} to {mean_val + 2*std_val:.2f}",
                        "z_score": z_score,
                        "severity": "high" if z_score > 4 else "medium",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
            
            # IQR-based anomaly detection
            q1 = np.percentile(historical_values, 25)
            q3 = np.percentile(historical_values, 75)
            iqr = q3 - q1
            
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            if current_value < lower_bound or current_value > upper_bound:
                return {
                    "type": "iqr_anomaly",
                    "metric": metric_name,
                    "method": "iqr",
                    "current_value": current_value,
                    "expected_range": f"{lower_bound:.2f} to {upper_bound:.2f}",
                    "severity": "medium",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
        except Exception as e:
            logger.error(f"❌ Statistical anomaly detection error: {e}")
        
        return None

    async def reconcile_cross_source_data(self, primary_source: DataSourceType, secondary_source: DataSourceType, 
                                        primary_data: Dict[str, Any], secondary_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Reconcile data between different sources"""
        discrepancies = []
        
        try:
            # Execute registered reconciliation rules
            for rule_function in self.reconciliation_rules:
                rule_discrepancies = await rule_function(
                    primary_source, secondary_source, primary_data, secondary_data
                )
                discrepancies.extend(rule_discrepancies)
            
            # Default reconciliation for common fields
            default_discrepancies = await self._default_cross_source_reconciliation(
                primary_source, secondary_source, primary_data, secondary_data
            )
            discrepancies.extend(default_discrepancies)
            
        except Exception as e:
            logger.error(f"❌ Cross-source reconciliation error: {e}")
        
        return discrepancies

    async def _default_cross_source_reconciliation(self, primary_source: DataSourceType, secondary_source: DataSourceType,
                                                 primary_data: Dict[str, Any], secondary_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Default reconciliation logic for common data fields"""
        discrepancies = []
        
        # Example: Compare game scores between sources
        if primary_source == DataSourceType.SPORTRADAR and secondary_source == DataSourceType.ODDS_API:
            primary_games = self._extract_field_values(primary_data, "$.games[*]")
            secondary_events = self._extract_field_values(secondary_data, "$.events[*]")
            
            # Match games by team names or other identifiers
            for primary_game in primary_games:
                matching_event = self._find_matching_event(primary_game, secondary_events)
                if matching_event:
                    game_discrepancies = self._compare_game_data(primary_game, matching_event)
                    discrepancies.extend(game_discrepancies)
        
        return discrepancies

    def _find_matching_event(self, game: Dict[str, Any], events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Find matching event between different data sources"""
        # Simplified matching logic - in production, use more sophisticated matching
        game_teams = {
            game.get("home_team", {}).get("name", "").lower(),
            game.get("away_team", {}).get("name", "").lower()
        }
        
        for event in events:
            event_teams = {
                event.get("home_team", "").lower(),
                event.get("away_team", "").lower()
            }
            
            # Check if teams match
            if game_teams & event_teams:  # Set intersection
                return event
        
        return None

    def _compare_game_data(self, primary_game: Dict[str, Any], secondary_event: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Compare game data between sources"""
        discrepancies = []
        
        # Compare scores if available
        primary_home_score = primary_game.get("home_score")
        secondary_home_score = secondary_event.get("home_score")
        
        if (primary_home_score is not None and secondary_home_score is not None and 
            abs(primary_home_score - secondary_home_score) > 0):
            
            discrepancies.append({
                "type": "score_discrepancy",
                "field": "home_score",
                "primary_value": primary_home_score,
                "secondary_value": secondary_home_score,
                "discrepancy": abs(primary_home_score - secondary_home_score),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        return discrepancies

    async def update_timeliness_metric(self, data_source: DataSourceType):
        """Update timeliness metrics when data is received"""
        now = datetime.now(timezone.utc)
        metric = self.timeliness_metrics[data_source]
        
        # Calculate delay from expected update time
        expected_next_update = metric.last_update + timedelta(seconds=metric.expected_interval)
        
        if now > expected_next_update:
            delay_seconds = (now - expected_next_update).total_seconds()
            metric.avg_delay = (metric.avg_delay * metric.update_count + delay_seconds) / (metric.update_count + 1)
            metric.max_delay = max(metric.max_delay, delay_seconds)
            
            # Check if this is a missed update
            if delay_seconds > metric.expected_interval * 2:
                metric.missed_updates += 1
                
                # Create timeliness violation
                violation = QualityViolation(
                    rule_name=f"{data_source.value}_timeliness",
                    data_source=data_source,
                    metric_type=QualityMetricType.TIMELINESS,
                    severity=AlertSeverity.WARNING if delay_seconds < metric.expected_interval * 3 else AlertSeverity.ERROR,
                    field_path="update_timestamp",
                    expected_value=f"≤{metric.expected_interval}s delay",
                    actual_value=f"{delay_seconds:.1f}s delay",
                    threshold=metric.expected_interval,
                    violation_score=min(1.0, delay_seconds / metric.expected_interval),
                    timestamp=now,
                    data_sample={"delay_seconds": delay_seconds},
                    description=f"Data update delayed beyond expected interval"
                )
                
                await self._check_and_send_alert(violation)
        
        metric.last_update = now
        metric.update_count += 1

    async def get_quality_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive quality dashboard data"""
        dashboard = {
            "overview": {
                "total_data_sources": len(DataSourceType),
                "active_rules": len([r for r in self.quality_rules.values() if r.enabled]),
                "recent_violations": len(self.recent_violations),
                "overall_health": "healthy"
            },
            "quality_metrics": {},
            "timeliness_metrics": {},
            "recent_violations": list(self.recent_violations)[-10:],  # Last 10 violations
            "anomalies": [],
            "cross_source_status": {}
        }
        
        # Add quality metrics for each data source
        for source_type, metrics in self.quality_metrics.items():
            dashboard["quality_metrics"][source_type.value] = {
                "overall_score": metrics.overall_score,
                "completeness": metrics.completeness_score,
                "accuracy": metrics.accuracy_score,
                "consistency": metrics.consistency_score,
                "timeliness": metrics.timeliness_score,
                "validity": metrics.validity_score,
                "total_records": metrics.total_records,
                "violations_count": metrics.violations_count,
                "last_updated": metrics.last_updated.isoformat()
            }
        
        # Add timeliness metrics
        for source_type, timeliness in self.timeliness_metrics.items():
            dashboard["timeliness_metrics"][source_type.value] = {
                "expected_interval": timeliness.expected_interval,
                "last_update": timeliness.last_update.isoformat(),
                "avg_delay": timeliness.avg_delay,
                "max_delay": timeliness.max_delay,
                "missed_updates": timeliness.missed_updates,
                "update_count": timeliness.update_count
            }
        
        # Determine overall health
        avg_quality_score = statistics.mean([m.overall_score for m in self.quality_metrics.values() if m.overall_score > 0])
        if avg_quality_score < 0.7:
            dashboard["overview"]["overall_health"] = "critical"
        elif avg_quality_score < 0.85:
            dashboard["overview"]["overall_health"] = "warning"
        
        return dashboard

    # Background monitoring tasks
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while True:
            try:
                await asyncio.sleep(60)  # Monitor every minute
                
                # Check for stale data sources
                now = datetime.now(timezone.utc)
                for source_type, timeliness in self.timeliness_metrics.items():
                    time_since_update = (now - timeliness.last_update).total_seconds()
                    
                    if time_since_update > timeliness.expected_interval * 3:
                        logger.warning(f"⚠️ Data source {source_type.value} is stale ({time_since_update:.1f}s)")
                
            except Exception as e:
                logger.error(f"❌ Monitoring loop error: {e}")

    async def _timeliness_monitor(self):
        """Monitor data timeliness"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                now = datetime.now(timezone.utc)
                for source_type, metric in self.timeliness_metrics.items():
                    expected_next = metric.last_update + timedelta(seconds=metric.expected_interval)
                    
                    if now > expected_next + timedelta(seconds=metric.expected_interval):
                        # Data is overdue
                        await self.update_timeliness_metric(source_type)
                
            except Exception as e:
                logger.error(f"❌ Timeliness monitor error: {e}")

    async def _reconciliation_monitor(self):
        """Monitor cross-source data reconciliation"""
        while True:
            try:
                await asyncio.sleep(300)  # Reconcile every 5 minutes
                
                # Get recent data from cache for reconciliation
                # This is a simplified example - in production, you'd have more sophisticated logic
                
                logger.debug("🔄 Running cross-source reconciliation check")
                
            except Exception as e:
                logger.error(f"❌ Reconciliation monitor error: {e}")

    async def _cleanup_old_data(self):
        """Clean up old violation data"""
        while True:
            try:
                await asyncio.sleep(3600)  # Cleanup every hour
                
                # Remove old violations (keep last 7 days)
                cutoff_time = datetime.now(timezone.utc) - timedelta(days=7)
                
                for rule_name, violations in self.violation_history.items():
                    self.violation_history[rule_name] = [
                        v for v in violations if v.timestamp > cutoff_time
                    ]
                
                logger.debug("🧹 Cleaned up old violation data")
                
            except Exception as e:
                logger.error(f"❌ Cleanup task error: {e}")

    async def close(self):
        """Cleanup data quality monitor resources"""
        logger.info("🔄 Shutting down data quality monitor...")
        
        # Cancel background tasks
        for task in [self._monitoring_task, self._timeliness_task, self._reconciliation_task, self._cleanup_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        logger.info("✅ Data quality monitor shutdown completed")


# Global instance
data_quality_monitor = DataQualityMonitor()
