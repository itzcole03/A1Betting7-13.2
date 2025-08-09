"""
Enhanced Automated Data Validation and Anomaly Detection Service

This service implements sophisticated automated data validation rules and
anomaly detection algorithms to proactively identify and rectify data
inconsistencies or errors. Crucial for maintaining prediction accuracy.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from enum import Enum
import json
import statistics
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ValidationSeverity(Enum):
    """Severity levels for validation issues"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high" 
    CRITICAL = "critical"

class DataSourceType(Enum):
    """Types of data sources being validated"""
    PLAYER_STATS = "player_stats"
    GAME_DATA = "game_data"
    BETTING_ODDS = "betting_odds"
    INJURY_REPORTS = "injury_reports"
    WEATHER_DATA = "weather_data"
    SOCIAL_SENTIMENT = "social_sentiment"
    NEWS_DATA = "news_data"
    TRACKING_DATA = "tracking_data"

class AnomalyType(Enum):
    """Types of anomalies detected"""
    STATISTICAL_OUTLIER = "statistical_outlier"
    TEMPORAL_ANOMALY = "temporal_anomaly"
    LOGICAL_INCONSISTENCY = "logical_inconsistency"
    MISSING_DATA = "missing_data"
    DUPLICATE_DATA = "duplicate_data"
    FORMAT_ERROR = "format_error"
    RANGE_VIOLATION = "range_violation"
    CORRELATION_BREAK = "correlation_break"

@dataclass
class ValidationRule:
    """Data validation rule definition"""
    rule_id: str
    name: str
    data_source: DataSourceType
    rule_type: str
    description: str
    severity: ValidationSeverity
    threshold: float
    parameters: Dict[str, Any]
    is_active: bool
    created_at: datetime
    last_updated: datetime

@dataclass
class ValidationResult:
    """Result of data validation"""
    validation_id: str
    rule_id: str
    data_source: DataSourceType
    severity: ValidationSeverity
    issue_type: AnomalyType
    message: str
    affected_records: int
    sample_data: List[Dict[str, Any]]
    confidence_score: float
    timestamp: datetime
    auto_fixed: bool
    fix_action: Optional[str]

@dataclass
class AnomalyDetectionResult:
    """Result of anomaly detection analysis"""
    detection_id: str
    data_source: DataSourceType
    anomaly_type: AnomalyType
    severity: ValidationSeverity
    description: str
    anomalous_points: List[Dict[str, Any]]
    statistical_measures: Dict[str, float]
    confidence_score: float
    recommended_action: str
    timestamp: datetime

@dataclass
class DataQualityMetrics:
    """Data quality metrics for monitoring"""
    data_source: DataSourceType
    timestamp: datetime
    completeness_score: float  # 0-1
    accuracy_score: float  # 0-1
    consistency_score: float  # 0-1
    timeliness_score: float  # 0-1
    validity_score: float  # 0-1
    overall_quality_score: float  # 0-1
    total_records: int
    issues_found: int
    auto_fixes_applied: int

class EnhancedDataValidationService:
    """
    Service for comprehensive data validation and anomaly detection
    """
    
    def __init__(self):
        self.validation_rules = {}
        self.validation_results = []
        self.anomaly_results = []
        self.quality_metrics = {}
        self.ml_models = {}
        self.thresholds = self._initialize_thresholds()
        self._initialize_validation_rules()
        
    def _initialize_thresholds(self) -> Dict[str, Dict[str, float]]:
        """Initialize statistical thresholds for different data types"""
        return {
            "player_stats": {
                "z_score_threshold": 3.0,
                "iqr_multiplier": 1.5,
                "correlation_threshold": 0.8,
                "missing_data_threshold": 0.05,
                "duplicate_threshold": 0.01
            },
            "betting_odds": {
                "z_score_threshold": 2.5,
                "iqr_multiplier": 2.0,
                "correlation_threshold": 0.9,
                "missing_data_threshold": 0.02,
                "change_rate_threshold": 0.1
            },
            "tracking_data": {
                "z_score_threshold": 3.5,
                "iqr_multiplier": 1.8,
                "temporal_consistency": 0.95,
                "missing_data_threshold": 0.03
            },
            "sentiment_data": {
                "z_score_threshold": 2.0,
                "sentiment_range": (-1.0, 1.0),
                "volume_threshold": 100,
                "missing_data_threshold": 0.1
            }
        }

    def _initialize_validation_rules(self):
        """Initialize comprehensive validation rules"""
        
        rules = [
            # Player Statistics Rules
            ValidationRule(
                rule_id="player_stats_range_check",
                name="Player Statistics Range Validation",
                data_source=DataSourceType.PLAYER_STATS,
                rule_type="range_validation",
                description="Validates player statistics are within realistic ranges",
                severity=ValidationSeverity.HIGH,
                threshold=0.95,
                parameters={
                    "points_range": (0, 100),
                    "rebounds_range": (0, 30),
                    "assists_range": (0, 20),
                    "fg_percentage_range": (0.0, 1.0),
                    "minutes_range": (0, 48)
                },
                is_active=True,
                created_at=datetime.now(),
                last_updated=datetime.now()
            ),
            
            # Betting Odds Rules
            ValidationRule(
                rule_id="odds_logical_consistency",
                name="Betting Odds Logical Consistency",
                data_source=DataSourceType.BETTING_ODDS,
                rule_type="logical_validation",
                description="Ensures betting odds follow logical constraints",
                severity=ValidationSeverity.CRITICAL,
                threshold=0.99,
                parameters={
                    "min_odds": 1.01,
                    "max_odds": 50.0,
                    "total_probability_range": (0.95, 1.05),
                    "arbitrage_threshold": 0.02
                },
                is_active=True,
                created_at=datetime.now(),
                last_updated=datetime.now()
            ),
            
            # Temporal Consistency Rules
            ValidationRule(
                rule_id="temporal_consistency_check",
                name="Temporal Data Consistency",
                data_source=DataSourceType.GAME_DATA,
                rule_type="temporal_validation",
                description="Validates temporal consistency across game data",
                severity=ValidationSeverity.MEDIUM,
                threshold=0.9,
                parameters={
                    "max_time_gap_minutes": 30,
                    "future_data_tolerance_hours": 24,
                    "sequence_validation": True
                },
                is_active=True,
                created_at=datetime.now(),
                last_updated=datetime.now()
            ),
            
            # Data Completeness Rules
            ValidationRule(
                rule_id="data_completeness_check",
                name="Data Completeness Validation",
                data_source=DataSourceType.PLAYER_STATS,
                rule_type="completeness_validation",
                description="Ensures required data fields are present",
                severity=ValidationSeverity.HIGH,
                threshold=0.95,
                parameters={
                    "required_fields": ["player_id", "game_id", "minutes", "points"],
                    "critical_fields": ["player_id", "game_id"],
                    "optional_fields": ["plus_minus", "efficiency"]
                },
                is_active=True,
                created_at=datetime.now(),
                last_updated=datetime.now()
            )
        ]
        
        for rule in rules:
            self.validation_rules[rule.rule_id] = rule

    async def validate_data_batch(
        self,
        data: List[Dict[str, Any]],
        data_source: DataSourceType,
        validation_context: Optional[Dict[str, Any]] = None
    ) -> List[ValidationResult]:
        """
        Validate a batch of data against all applicable rules
        
        Args:
            data: List of data records to validate
            data_source: Type of data source
            validation_context: Additional context for validation
            
        Returns:
            List of ValidationResult objects
        """
        logger.info(f"Starting validation for {len(data)} records from {data_source.value}")
        
        validation_results = []
        
        try:
            # Convert to DataFrame for easier processing
            df = pd.DataFrame(data)
            
            if df.empty:
                logger.warning(f"No data provided for validation: {data_source.value}")
                return validation_results
            
            # Get applicable rules for this data source
            applicable_rules = [
                rule for rule in self.validation_rules.values()
                if rule.data_source == data_source and rule.is_active
            ]
            
            logger.info(f"Applying {len(applicable_rules)} validation rules")
            
            # Apply each validation rule
            for rule in applicable_rules:
                try:
                    rule_results = await self._apply_validation_rule(df, rule, validation_context)
                    validation_results.extend(rule_results)
                except Exception as e:
                    logger.error(f"Error applying rule {rule.rule_id}: {str(e)}")
                    
            # Run anomaly detection
            anomaly_results = await self._detect_anomalies(df, data_source)
            
            # Convert anomaly results to validation results
            for anomaly in anomaly_results:
                validation_results.append(self._anomaly_to_validation_result(anomaly))
                
            # Store results
            self.validation_results.extend(validation_results)
            
            logger.info(f"Validation complete: {len(validation_results)} issues found")
            
            # Update quality metrics
            await self._update_quality_metrics(df, data_source, validation_results)
            
            return validation_results
            
        except Exception as e:
            logger.error(f"Error in batch validation: {str(e)}")
            return []

    async def _apply_validation_rule(
        self,
        df: pd.DataFrame,
        rule: ValidationRule,
        context: Optional[Dict[str, Any]]
    ) -> List[ValidationResult]:
        """Apply a specific validation rule to data"""
        
        results = []
        
        try:
            if rule.rule_type == "range_validation":
                results = await self._validate_ranges(df, rule)
            elif rule.rule_type == "logical_validation":
                results = await self._validate_logical_consistency(df, rule)
            elif rule.rule_type == "temporal_validation":
                results = await self._validate_temporal_consistency(df, rule)
            elif rule.rule_type == "completeness_validation":
                results = await self._validate_completeness(df, rule)
            else:
                logger.warning(f"Unknown rule type: {rule.rule_type}")
                
        except Exception as e:
            logger.error(f"Error applying rule {rule.rule_id}: {str(e)}")
            
        return results

    async def _validate_ranges(
        self,
        df: pd.DataFrame,
        rule: ValidationRule
    ) -> List[ValidationResult]:
        """Validate data ranges"""
        
        results = []
        parameters = rule.parameters
        
        for field, (min_val, max_val) in parameters.items():
            if field.endswith("_range") and field.replace("_range", "") in df.columns:
                column = field.replace("_range", "")
                
                # Check for values outside range
                outside_range = df[
                    (df[column] < min_val) | (df[column] > max_val)
                ]
                
                if len(outside_range) > 0:
                    result = ValidationResult(
                        validation_id=f"range_val_{datetime.now().timestamp()}",
                        rule_id=rule.rule_id,
                        data_source=rule.data_source,
                        severity=rule.severity,
                        issue_type=AnomalyType.RANGE_VIOLATION,
                        message=f"{column} values outside range [{min_val}, {max_val}]",
                        affected_records=len(outside_range),
                        sample_data=outside_range.head(5).to_dict('records'),
                        confidence_score=0.95,
                        timestamp=datetime.now(),
                        auto_fixed=False,
                        fix_action=f"Clamp values to range [{min_val}, {max_val}]"
                    )
                    results.append(result)
                    
        return results

    async def _validate_logical_consistency(
        self,
        df: pd.DataFrame,
        rule: ValidationRule
    ) -> List[ValidationResult]:
        """Validate logical consistency in betting odds"""
        
        results = []
        parameters = rule.parameters
        
        if rule.data_source == DataSourceType.BETTING_ODDS:
            # Check total probability constraint
            if "home_odds" in df.columns and "away_odds" in df.columns:
                df["total_probability"] = (1/df["home_odds"]) + (1/df["away_odds"])
                
                prob_range = parameters.get("total_probability_range", (0.95, 1.05))
                invalid_probs = df[
                    (df["total_probability"] < prob_range[0]) | 
                    (df["total_probability"] > prob_range[1])
                ]
                
                if len(invalid_probs) > 0:
                    result = ValidationResult(
                        validation_id=f"logic_val_{datetime.now().timestamp()}",
                        rule_id=rule.rule_id,
                        data_source=rule.data_source,
                        severity=rule.severity,
                        issue_type=AnomalyType.LOGICAL_INCONSISTENCY,
                        message="Invalid total probability in betting odds",
                        affected_records=len(invalid_probs),
                        sample_data=invalid_probs.head(5).to_dict('records'),
                        confidence_score=0.98,
                        timestamp=datetime.now(),
                        auto_fixed=False,
                        fix_action="Normalize odds to ensure valid probability"
                    )
                    results.append(result)
                    
        return results

    async def _validate_temporal_consistency(
        self,
        df: pd.DataFrame,
        rule: ValidationRule
    ) -> List[ValidationResult]:
        """Validate temporal consistency"""
        
        results = []
        parameters = rule.parameters
        
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            
            # Check for future data
            future_tolerance = timedelta(hours=parameters.get("future_data_tolerance_hours", 24))
            future_cutoff = datetime.now() + future_tolerance
            
            future_data = df[df["timestamp"] > future_cutoff]
            
            if len(future_data) > 0:
                result = ValidationResult(
                    validation_id=f"temporal_val_{datetime.now().timestamp()}",
                    rule_id=rule.rule_id,
                    data_source=rule.data_source,
                    severity=rule.severity,
                    issue_type=AnomalyType.TEMPORAL_ANOMALY,
                    message="Data with future timestamps detected",
                    affected_records=len(future_data),
                    sample_data=future_data.head(5).to_dict('records'),
                    confidence_score=0.99,
                    timestamp=datetime.now(),
                    auto_fixed=False,
                    fix_action="Remove or adjust future timestamps"
                )
                results.append(result)
                
        return results

    async def _validate_completeness(
        self,
        df: pd.DataFrame,
        rule: ValidationRule
    ) -> List[ValidationResult]:
        """Validate data completeness"""
        
        results = []
        parameters = rule.parameters
        
        required_fields = parameters.get("required_fields", [])
        critical_fields = parameters.get("critical_fields", [])
        
        # Check for missing critical fields
        for field in critical_fields:
            if field in df.columns:
                missing_count = df[field].isna().sum()
                if missing_count > 0:
                    result = ValidationResult(
                        validation_id=f"completeness_val_{datetime.now().timestamp()}",
                        rule_id=rule.rule_id,
                        data_source=rule.data_source,
                        severity=ValidationSeverity.CRITICAL,
                        issue_type=AnomalyType.MISSING_DATA,
                        message=f"Missing critical field: {field}",
                        affected_records=missing_count,
                        sample_data=[],
                        confidence_score=1.0,
                        timestamp=datetime.now(),
                        auto_fixed=False,
                        fix_action=f"Fill missing values for {field}"
                    )
                    results.append(result)
                    
        return results

    async def _detect_anomalies(
        self,
        df: pd.DataFrame,
        data_source: DataSourceType
    ) -> List[AnomalyDetectionResult]:
        """Detect anomalies using machine learning techniques"""
        
        anomalies = []
        
        try:
            # Statistical outlier detection
            statistical_anomalies = await self._detect_statistical_outliers(df, data_source)
            anomalies.extend(statistical_anomalies)
            
            # Isolation Forest anomaly detection
            if len(df) > 10:  # Need sufficient data
                isolation_anomalies = await self._detect_isolation_forest_anomalies(df, data_source)
                anomalies.extend(isolation_anomalies)
            
            # Correlation break detection
            correlation_anomalies = await self._detect_correlation_breaks(df, data_source)
            anomalies.extend(correlation_anomalies)
            
        except Exception as e:
            logger.error(f"Error in anomaly detection: {str(e)}")
            
        return anomalies

    async def _detect_statistical_outliers(
        self,
        df: pd.DataFrame,
        data_source: DataSourceType
    ) -> List[AnomalyDetectionResult]:
        """Detect statistical outliers using Z-score and IQR methods"""
        
        anomalies = []
        thresholds = self.thresholds.get(data_source.value.replace('_', ''), {})
        z_threshold = thresholds.get("z_score_threshold", 3.0)
        iqr_multiplier = thresholds.get("iqr_multiplier", 1.5)
        
        # Get numeric columns
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        for column in numeric_columns:
            if len(df[column].dropna()) < 10:  # Need sufficient data
                continue
                
            # Z-score method
            z_scores = np.abs(stats.zscore(df[column].dropna()))
            z_outliers = df[z_scores > z_threshold]
            
            if len(z_outliers) > 0:
                anomaly = AnomalyDetectionResult(
                    detection_id=f"z_outlier_{column}_{datetime.now().timestamp()}",
                    data_source=data_source,
                    anomaly_type=AnomalyType.STATISTICAL_OUTLIER,
                    severity=ValidationSeverity.MEDIUM,
                    description=f"Z-score outliers detected in {column}",
                    anomalous_points=z_outliers.head(10).to_dict('records'),
                    statistical_measures={
                        "z_score_threshold": z_threshold,
                        "max_z_score": float(np.max(z_scores)),
                        "outlier_count": len(z_outliers),
                        "outlier_percentage": len(z_outliers) / len(df) * 100
                    },
                    confidence_score=0.8,
                    recommended_action="Review and potentially remove or transform outliers",
                    timestamp=datetime.now()
                )
                anomalies.append(anomaly)
                
            # IQR method
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - iqr_multiplier * IQR
            upper_bound = Q3 + iqr_multiplier * IQR
            
            iqr_outliers = df[(df[column] < lower_bound) | (df[column] > upper_bound)]
            
            if len(iqr_outliers) > 0:
                anomaly = AnomalyDetectionResult(
                    detection_id=f"iqr_outlier_{column}_{datetime.now().timestamp()}",
                    data_source=data_source,
                    anomaly_type=AnomalyType.STATISTICAL_OUTLIER,
                    severity=ValidationSeverity.MEDIUM,
                    description=f"IQR outliers detected in {column}",
                    anomalous_points=iqr_outliers.head(10).to_dict('records'),
                    statistical_measures={
                        "iqr_multiplier": iqr_multiplier,
                        "lower_bound": float(lower_bound),
                        "upper_bound": float(upper_bound),
                        "outlier_count": len(iqr_outliers),
                        "outlier_percentage": len(iqr_outliers) / len(df) * 100
                    },
                    confidence_score=0.75,
                    recommended_action="Investigate IQR outliers for data quality issues",
                    timestamp=datetime.now()
                )
                anomalies.append(anomaly)
                
        return anomalies

    async def _detect_isolation_forest_anomalies(
        self,
        df: pd.DataFrame,
        data_source: DataSourceType
    ) -> List[AnomalyDetectionResult]:
        """Detect anomalies using Isolation Forest algorithm"""
        
        anomalies = []
        
        try:
            # Get numeric columns for analysis
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            
            if len(numeric_columns) < 2:  # Need at least 2 numeric features
                return anomalies
                
            # Prepare data
            feature_data = df[numeric_columns].dropna()
            
            if len(feature_data) < 10:  # Need sufficient data
                return anomalies
                
            # Standardize features
            scaler = StandardScaler()
            scaled_data = scaler.fit_transform(feature_data)
            
            # Apply Isolation Forest
            contamination = min(0.1, max(0.01, len(feature_data) * 0.05 / len(df)))  # Adaptive contamination
            iso_forest = IsolationForest(contamination=contamination, random_state=42)
            outlier_labels = iso_forest.fit_predict(scaled_data)
            
            # Get anomalous records
            anomaly_mask = outlier_labels == -1
            anomalous_records = df.iloc[feature_data.index[anomaly_mask]]
            
            if len(anomalous_records) > 0:
                # Get anomaly scores
                anomaly_scores = iso_forest.decision_function(scaled_data)
                min_score = np.min(anomaly_scores[anomaly_mask])
                
                anomaly = AnomalyDetectionResult(
                    detection_id=f"isolation_forest_{datetime.now().timestamp()}",
                    data_source=data_source,
                    anomaly_type=AnomalyType.STATISTICAL_OUTLIER,
                    severity=ValidationSeverity.MEDIUM,
                    description="Isolation Forest detected multivariate anomalies",
                    anomalous_points=anomalous_records.head(10).to_dict('records'),
                    statistical_measures={
                        "contamination_rate": contamination,
                        "anomaly_count": len(anomalous_records),
                        "min_anomaly_score": float(min_score),
                        "features_used": list(numeric_columns)
                    },
                    confidence_score=0.85,
                    recommended_action="Investigate multivariate anomalies for complex patterns",
                    timestamp=datetime.now()
                )
                anomalies.append(anomaly)
                
        except Exception as e:
            logger.error(f"Error in Isolation Forest detection: {str(e)}")
            
        return anomalies

    async def _detect_correlation_breaks(
        self,
        df: pd.DataFrame,
        data_source: DataSourceType
    ) -> List[AnomalyDetectionResult]:
        """Detect breaks in expected correlations between variables"""
        
        anomalies = []
        
        try:
            # Define expected correlations for different data sources
            expected_correlations = {
                DataSourceType.PLAYER_STATS: [
                    ("points", "field_goals_made", 0.8),
                    ("assists", "minutes", 0.6),
                    ("rebounds", "minutes", 0.5)
                ],
                DataSourceType.BETTING_ODDS: [
                    ("home_odds", "away_odds", -0.7),
                    ("spread", "total", 0.3)
                ]
            }
            
            correlations = expected_correlations.get(data_source, [])
            
            for var1, var2, expected_corr in correlations:
                if var1 in df.columns and var2 in df.columns:
                    actual_corr = df[var1].corr(df[var2])
                    
                    if not pd.isna(actual_corr):
                        correlation_diff = abs(actual_corr - expected_corr)
                        
                        if correlation_diff > 0.3:  # Significant deviation
                            anomaly = AnomalyDetectionResult(
                                detection_id=f"correlation_break_{var1}_{var2}_{datetime.now().timestamp()}",
                                data_source=data_source,
                                anomaly_type=AnomalyType.CORRELATION_BREAK,
                                severity=ValidationSeverity.MEDIUM,
                                description=f"Unexpected correlation between {var1} and {var2}",
                                anomalous_points=[],
                                statistical_measures={
                                    "expected_correlation": expected_corr,
                                    "actual_correlation": float(actual_corr),
                                    "correlation_difference": float(correlation_diff),
                                    "variable_1": var1,
                                    "variable_2": var2
                                },
                                confidence_score=0.7,
                                recommended_action="Investigate correlation break for data quality issues",
                                timestamp=datetime.now()
                            )
                            anomalies.append(anomaly)
                            
        except Exception as e:
            logger.error(f"Error in correlation break detection: {str(e)}")
            
        return anomalies

    def _anomaly_to_validation_result(self, anomaly: AnomalyDetectionResult) -> ValidationResult:
        """Convert anomaly detection result to validation result"""
        
        return ValidationResult(
            validation_id=anomaly.detection_id,
            rule_id="anomaly_detection",
            data_source=anomaly.data_source,
            severity=anomaly.severity,
            issue_type=anomaly.anomaly_type,
            message=anomaly.description,
            affected_records=len(anomaly.anomalous_points),
            sample_data=anomaly.anomalous_points[:5],
            confidence_score=anomaly.confidence_score,
            timestamp=anomaly.timestamp,
            auto_fixed=False,
            fix_action=anomaly.recommended_action
        )

    async def _update_quality_metrics(
        self,
        df: pd.DataFrame,
        data_source: DataSourceType,
        validation_results: List[ValidationResult]
    ):
        """Update data quality metrics based on validation results"""
        
        try:
            total_records = len(df)
            issues_found = len(validation_results)
            
            # Calculate quality scores
            completeness_score = self._calculate_completeness_score(df)
            accuracy_score = self._calculate_accuracy_score(validation_results, total_records)
            consistency_score = self._calculate_consistency_score(validation_results)
            timeliness_score = self._calculate_timeliness_score(df)
            validity_score = self._calculate_validity_score(validation_results, total_records)
            
            # Overall quality score (weighted average)
            overall_score = (
                completeness_score * 0.25 +
                accuracy_score * 0.25 +
                consistency_score * 0.2 +
                timeliness_score * 0.15 +
                validity_score * 0.15
            )
            
            metrics = DataQualityMetrics(
                data_source=data_source,
                timestamp=datetime.now(),
                completeness_score=completeness_score,
                accuracy_score=accuracy_score,
                consistency_score=consistency_score,
                timeliness_score=timeliness_score,
                validity_score=validity_score,
                overall_quality_score=overall_score,
                total_records=total_records,
                issues_found=issues_found,
                auto_fixes_applied=0  # Would be implemented in auto-fix functionality
            )
            
            self.quality_metrics[data_source] = metrics
            
        except Exception as e:
            logger.error(f"Error updating quality metrics: {str(e)}")

    def _calculate_completeness_score(self, df: pd.DataFrame) -> float:
        """Calculate data completeness score"""
        if df.empty:
            return 0.0
            
        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isna().sum().sum()
        
        return max(0.0, 1.0 - (missing_cells / total_cells))

    def _calculate_accuracy_score(self, validation_results: List[ValidationResult], total_records: int) -> float:
        """Calculate data accuracy score based on validation results"""
        if total_records == 0:
            return 1.0
            
        # Weight issues by severity
        severity_weights = {
            ValidationSeverity.LOW: 0.1,
            ValidationSeverity.MEDIUM: 0.3,
            ValidationSeverity.HIGH: 0.7,
            ValidationSeverity.CRITICAL: 1.0
        }
        
        weighted_issues = sum(
            result.affected_records * severity_weights.get(result.severity, 0.5)
            for result in validation_results
        )
        
        accuracy_score = max(0.0, 1.0 - (weighted_issues / total_records))
        return min(1.0, accuracy_score)

    def _calculate_consistency_score(self, validation_results: List[ValidationResult]) -> float:
        """Calculate data consistency score"""
        consistency_issues = [
            result for result in validation_results
            if result.issue_type in [AnomalyType.LOGICAL_INCONSISTENCY, AnomalyType.CORRELATION_BREAK]
        ]
        
        if not validation_results:
            return 1.0
            
        consistency_ratio = 1.0 - (len(consistency_issues) / len(validation_results))
        return max(0.0, consistency_ratio)

    def _calculate_timeliness_score(self, df: pd.DataFrame) -> float:
        """Calculate data timeliness score"""
        if "timestamp" not in df.columns:
            return 0.8  # Neutral score if no timestamp
            
        try:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            now = datetime.now()
            
            # Calculate how recent the data is
            time_diffs = (now - df["timestamp"]).dt.total_seconds() / 3600  # Hours
            avg_age_hours = time_diffs.mean()
            
            # Score based on average age (fresher = better)
            if avg_age_hours <= 1:
                return 1.0
            elif avg_age_hours <= 6:
                return 0.9
            elif avg_age_hours <= 24:
                return 0.7
            elif avg_age_hours <= 168:  # 1 week
                return 0.5
            else:
                return 0.2
                
        except Exception:
            return 0.8

    def _calculate_validity_score(self, validation_results: List[ValidationResult], total_records: int) -> float:
        """Calculate data validity score"""
        if total_records == 0:
            return 1.0
            
        validity_issues = [
            result for result in validation_results
            if result.issue_type in [AnomalyType.RANGE_VIOLATION, AnomalyType.FORMAT_ERROR]
        ]
        
        invalid_records = sum(result.affected_records for result in validity_issues)
        validity_score = max(0.0, 1.0 - (invalid_records / total_records))
        
        return validity_score

    async def get_quality_dashboard(self) -> Dict[str, Any]:
        """Generate comprehensive data quality dashboard"""
        
        dashboard = {
            "generated_at": datetime.now().isoformat(),
            "overall_health": {},
            "data_sources": {},
            "recent_issues": [],
            "trends": {},
            "recommendations": []
        }
        
        try:
            # Overall health metrics
            if self.quality_metrics:
                overall_scores = [metrics.overall_quality_score for metrics in self.quality_metrics.values()]
                dashboard["overall_health"] = {
                    "average_quality_score": round(statistics.mean(overall_scores), 3),
                    "min_quality_score": round(min(overall_scores), 3),
                    "max_quality_score": round(max(overall_scores), 3),
                    "total_data_sources": len(self.quality_metrics),
                    "healthy_sources": len([s for s in overall_scores if s > 0.8]),
                    "warning_sources": len([s for s in overall_scores if 0.6 <= s <= 0.8]),
                    "critical_sources": len([s for s in overall_scores if s < 0.6])
                }
            
            # Data source details
            for data_source, metrics in self.quality_metrics.items():
                dashboard["data_sources"][data_source.value] = {
                    "overall_score": metrics.overall_quality_score,
                    "completeness": metrics.completeness_score,
                    "accuracy": metrics.accuracy_score,
                    "consistency": metrics.consistency_score,
                    "timeliness": metrics.timeliness_score,
                    "validity": metrics.validity_score,
                    "total_records": metrics.total_records,
                    "issues_found": metrics.issues_found,
                    "last_updated": metrics.timestamp.isoformat(),
                    "status": self._get_health_status(metrics.overall_quality_score)
                }
            
            # Recent critical issues
            recent_issues = [
                result for result in self.validation_results[-50:]  # Last 50 results
                if result.severity in [ValidationSeverity.HIGH, ValidationSeverity.CRITICAL]
                and (datetime.now() - result.timestamp).hours <= 24
            ]
            
            dashboard["recent_issues"] = [
                {
                    "severity": issue.severity.value,
                    "data_source": issue.data_source.value,
                    "message": issue.message,
                    "affected_records": issue.affected_records,
                    "timestamp": issue.timestamp.isoformat()
                }
                for issue in recent_issues[:10]  # Show top 10
            ]
            
            # Generate recommendations
            dashboard["recommendations"] = self._generate_quality_recommendations()
            
        except Exception as e:
            logger.error(f"Error generating quality dashboard: {str(e)}")
            dashboard["error"] = str(e)
            
        return dashboard

    def _get_health_status(self, score: float) -> str:
        """Get health status based on quality score"""
        if score >= 0.9:
            return "excellent"
        elif score >= 0.8:
            return "good"
        elif score >= 0.6:
            return "warning"
        else:
            return "critical"

    def _generate_quality_recommendations(self) -> List[str]:
        """Generate recommendations based on quality metrics and issues"""
        
        recommendations = []
        
        # Analyze quality metrics for patterns
        if self.quality_metrics:
            low_completeness_sources = [
                source for source, metrics in self.quality_metrics.items()
                if metrics.completeness_score < 0.8
            ]
            
            if low_completeness_sources:
                recommendations.append(
                    f"Improve data completeness for: {', '.join([s.value for s in low_completeness_sources])}"
                )
            
            low_accuracy_sources = [
                source for source, metrics in self.quality_metrics.items()
                if metrics.accuracy_score < 0.7
            ]
            
            if low_accuracy_sources:
                recommendations.append(
                    f"Address accuracy issues in: {', '.join([s.value for s in low_accuracy_sources])}"
                )
        
        # Analyze recent validation results
        if self.validation_results:
            common_issues = {}
            for result in self.validation_results[-100:]:  # Last 100 results
                issue_type = result.issue_type.value
                common_issues[issue_type] = common_issues.get(issue_type, 0) + 1
            
            if common_issues:
                most_common = max(common_issues, key=common_issues.get)
                recommendations.append(f"Focus on resolving {most_common} issues ({common_issues[most_common]} recent occurrences)")
        
        # Generic recommendations
        recommendations.extend([
            "Implement automated data quality monitoring alerts",
            "Establish data quality SLAs with external providers",
            "Consider implementing auto-fix mechanisms for common issues",
            "Regularly review and update validation rules",
            "Implement data lineage tracking for better issue resolution"
        ])
        
        return recommendations[:5]  # Return top 5 recommendations

# Usage example and testing
async def main():
    """Example usage of the Enhanced Data Validation Service"""
    
    validation_service = EnhancedDataValidationService()
    
    # Example 1: Validate player statistics data
    player_stats_data = [
        {
            "player_id": "player_1",
            "game_id": "game_123",
            "minutes": 35,
            "points": 28,
            "rebounds": 8,
            "assists": 6,
            "field_goals_made": 10,
            "timestamp": "2024-01-15T19:30:00"
        },
        {
            "player_id": "player_2",
            "game_id": "game_123",
            "minutes": 42,
            "points": 150,  # Unrealistic value
            "rebounds": 15,
            "assists": 3,
            "field_goals_made": 8,
            "timestamp": "2024-01-15T19:30:00"
        }
    ]
    
    validation_results = await validation_service.validate_data_batch(
        data=player_stats_data,
        data_source=DataSourceType.PLAYER_STATS
    )
    
    print(f"Validation Results: {len(validation_results)} issues found")
    for result in validation_results:
        print(f"- {result.severity.value}: {result.message} ({result.affected_records} records)")
    
    # Example 2: Validate betting odds data
    betting_odds_data = [
        {
            "game_id": "game_123",
            "home_odds": 1.8,
            "away_odds": 2.1,
            "total_over": 220.5,
            "total_under": 220.5,
            "timestamp": "2024-01-15T18:00:00"
        },
        {
            "game_id": "game_124",
            "home_odds": 1.2,
            "away_odds": 1.2,  # Invalid - probabilities sum > 1
            "total_over": 215.5,
            "total_under": 215.5,
            "timestamp": "2024-01-15T18:00:00"
        }
    ]
    
    odds_validation_results = await validation_service.validate_data_batch(
        data=betting_odds_data,
        data_source=DataSourceType.BETTING_ODDS
    )
    
    print(f"\nOdds Validation Results: {len(odds_validation_results)} issues found")
    for result in odds_validation_results:
        print(f"- {result.severity.value}: {result.message}")
    
    # Example 3: Generate quality dashboard
    dashboard = await validation_service.get_quality_dashboard()
    print(f"\nData Quality Dashboard:")
    print(f"Overall Health: {dashboard.get('overall_health', {})}")
    print(f"Recent Issues: {len(dashboard.get('recent_issues', []))}")
    print(f"Recommendations: {dashboard.get('recommendations', [])[:3]}")

if __name__ == "__main__":
    asyncio.run(main())
