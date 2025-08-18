"""
Confidence Anomaly Detection Service

This module provides real-time detection of confidence anomalies in edge calculations,
helping to identify potential issues with model performance, data quality, or system behavior.
"""

from __future__ import annotations
from collections import deque
from typing import Deque, Dict, Optional, List, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import statistics
import time
import math
import logging


class AnomalyType(Enum):
    """Types of confidence anomalies that can be detected."""
    CONFIDENCE_SPIKE = "confidence_spike"
    CONFIDENCE_DROP = "confidence_drop"
    CALIBRATION_DRIFT = "calibration_drift"
    OUTLIER_PATTERN = "outlier_pattern"
    TEMPORAL_INSTABILITY = "temporal_instability"


class AnomalySeverity(Enum):
    """Severity levels for detected anomalies."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ConfidenceAnomaly:
    """Represents a detected confidence anomaly."""
    anomaly_type: AnomalyType
    severity: AnomalySeverity
    confidence_value: float
    calibration_gap: float
    timestamp: float
    context: Dict[str, Any]
    threshold_violated: float
    statistical_significance: float
    description: str


@dataclass
class AnomalyDetectionConfig:
    """Configuration for anomaly detection parameters."""
    # Window sizes for different analyses
    short_term_window: int = 50
    long_term_window: int = 500
    calibration_window: int = 100
    
    # Statistical thresholds
    confidence_spike_threshold: float = 2.5  # Standard deviations
    confidence_drop_threshold: float = 2.0
    calibration_drift_threshold: float = 0.15
    outlier_threshold: float = 3.0
    
    # Temporal stability parameters
    temporal_instability_threshold: float = 0.3
    min_samples_for_analysis: int = 20
    
    # Severity thresholds
    critical_severity_multiplier: float = 3.0
    high_severity_multiplier: float = 2.0
    medium_severity_multiplier: float = 1.5


class ConfidenceAnomalyDetector:
    """
    Real-time confidence anomaly detection system.
    
    Monitors edge confidence values and calibration gaps to detect potential
    issues with model performance, data quality, or system behavior.
    """
    
    def __init__(
        self,
        config: Optional[AnomalyDetectionConfig] = None,
        logger: Optional[logging.Logger] = None,
        metrics_client: Optional[Any] = None
    ):
        """
        Initialize the confidence anomaly detector.
        
        Args:
            config: Detection configuration parameters
            logger: Logger for anomaly reporting
            metrics_client: Metrics client for anomaly tracking
        """
        self.config = config or AnomalyDetectionConfig()
        self.logger = logger or logging.getLogger(__name__)
        self.metrics_client = metrics_client
        
        # Rolling windows for different time horizons
        self.short_term_confidence: Deque[float] = deque(maxlen=self.config.short_term_window)
        self.long_term_confidence: Deque[float] = deque(maxlen=self.config.long_term_window)
        self.calibration_history: Deque[float] = deque(maxlen=self.config.calibration_window)
        
        # Temporal tracking
        self.confidence_timestamps: Deque[float] = deque(maxlen=self.config.short_term_window)
        self.last_anomaly_check: float = 0.0
        
        # Anomaly tracking
        self.detected_anomalies: List[ConfidenceAnomaly] = []
        self.anomaly_counts: Dict[AnomalyType, int] = {
            anomaly_type: 0 for anomaly_type in AnomalyType
        }
        
        # Statistical tracking
        self.baseline_stats: Dict[str, float] = {}
        self.is_baseline_established: bool = False
    
    def record(self, confidence: float, calibration_gap: float, context: Optional[Dict[str, Any]] = None) -> List[ConfidenceAnomaly]:
        """
        Record a new confidence measurement and detect anomalies.
        
        Args:
            confidence: Confidence score for the edge
            calibration_gap: Calibration gap for the prop type
            context: Optional context information
            
        Returns:
            List of detected anomalies
        """
        current_time = time.time()
        context = context or {}
        
        # Update rolling windows
        self.short_term_confidence.append(confidence)
        self.long_term_confidence.append(confidence)
        self.calibration_history.append(calibration_gap)
        self.confidence_timestamps.append(current_time)
        
        # Establish baseline if we have enough data
        if not self.is_baseline_established and len(self.long_term_confidence) >= self.config.min_samples_for_analysis:
            self._establish_baseline()
        
        # Only perform anomaly detection if baseline is established
        detected_anomalies = []
        if self.is_baseline_established:
            detected_anomalies = self._detect_anomalies(confidence, calibration_gap, current_time, context)
        
        # Update tracking
        self.last_anomaly_check = current_time
        
        return detected_anomalies
    
    def _establish_baseline(self) -> None:
        """Establish baseline statistics for anomaly detection."""
        if len(self.long_term_confidence) < self.config.min_samples_for_analysis:
            return
        
        confidence_values = list(self.long_term_confidence)
        calibration_values = list(self.calibration_history)
        
        self.baseline_stats = {
            'confidence_mean': statistics.mean(confidence_values),
            'confidence_std': statistics.stdev(confidence_values) if len(confidence_values) > 1 else 0.0,
            'calibration_mean': statistics.mean(calibration_values) if calibration_values else 0.0,
            'calibration_std': statistics.stdev(calibration_values) if len(calibration_values) > 1 else 0.0,
        }
        
        self.is_baseline_established = True
        self.logger.info(f"Established confidence anomaly baseline: {self.baseline_stats}")
    
    def _detect_anomalies(
        self,
        confidence: float,
        calibration_gap: float,
        timestamp: float,
        context: Dict[str, Any]
    ) -> List[ConfidenceAnomaly]:
        """Detect anomalies in the current confidence measurement."""
        anomalies = []
        
        # Check for confidence spikes and drops
        confidence_anomalies = self._detect_confidence_anomalies(confidence, timestamp, context)
        anomalies.extend(confidence_anomalies)
        
        # Check for calibration drift
        calibration_anomalies = self._detect_calibration_drift(calibration_gap, timestamp, context)
        anomalies.extend(calibration_anomalies)
        
        # Check for outlier patterns
        outlier_anomalies = self._detect_outlier_patterns(confidence, timestamp, context)
        anomalies.extend(outlier_anomalies)
        
        # Check for temporal instability
        temporal_anomalies = self._detect_temporal_instability(timestamp, context)
        anomalies.extend(temporal_anomalies)
        
        # Record detected anomalies
        for anomaly in anomalies:
            self._record_anomaly(anomaly)
        
        return anomalies
    
    def _detect_confidence_anomalies(
        self,
        confidence: float,
        timestamp: float,
        context: Dict[str, Any]
    ) -> List[ConfidenceAnomaly]:
        """Detect confidence spikes and drops."""
        anomalies = []
        
        confidence_mean = self.baseline_stats['confidence_mean']
        confidence_std = self.baseline_stats['confidence_std']
        
        if confidence_std == 0:
            return anomalies
        
        # Calculate z-score
        z_score = abs(confidence - confidence_mean) / confidence_std
        
        # Check for spike
        if z_score > self.config.confidence_spike_threshold and confidence > confidence_mean:
            severity = self._calculate_severity(z_score, self.config.confidence_spike_threshold)
            anomalies.append(ConfidenceAnomaly(
                anomaly_type=AnomalyType.CONFIDENCE_SPIKE,
                severity=severity,
                confidence_value=confidence,
                calibration_gap=context.get('calibration_gap', 0.0),
                timestamp=timestamp,
                context=context,
                threshold_violated=self.config.confidence_spike_threshold,
                statistical_significance=z_score,
                description=f"Confidence spike detected: {confidence:.3f} (z-score: {z_score:.2f})"
            ))
        
        # Check for drop
        elif z_score > self.config.confidence_drop_threshold and confidence < confidence_mean:
            severity = self._calculate_severity(z_score, self.config.confidence_drop_threshold)
            anomalies.append(ConfidenceAnomaly(
                anomaly_type=AnomalyType.CONFIDENCE_DROP,
                severity=severity,
                confidence_value=confidence,
                calibration_gap=context.get('calibration_gap', 0.0),
                timestamp=timestamp,
                context=context,
                threshold_violated=self.config.confidence_drop_threshold,
                statistical_significance=z_score,
                description=f"Confidence drop detected: {confidence:.3f} (z-score: {z_score:.2f})"
            ))
        
        return anomalies
    
    def _detect_calibration_drift(
        self,
        calibration_gap: float,
        timestamp: float,
        context: Dict[str, Any]
    ) -> List[ConfidenceAnomaly]:
        """Detect calibration drift anomalies."""
        anomalies = []
        
        if len(self.calibration_history) < self.config.min_samples_for_analysis:
            return anomalies
        
        calibration_mean = self.baseline_stats['calibration_mean']
        
        # Check for significant drift from baseline
        drift = abs(calibration_gap - calibration_mean)
        
        if drift > self.config.calibration_drift_threshold:
            # Calculate recent trend
            recent_calibration = list(self.calibration_history)[-10:]
            recent_mean = statistics.mean(recent_calibration) if recent_calibration else calibration_gap
            
            severity = self._calculate_drift_severity(drift, self.config.calibration_drift_threshold)
            
            anomalies.append(ConfidenceAnomaly(
                anomaly_type=AnomalyType.CALIBRATION_DRIFT,
                severity=severity,
                confidence_value=context.get('confidence', 0.0),
                calibration_gap=calibration_gap,
                timestamp=timestamp,
                context={**context, 'recent_calibration_mean': recent_mean},
                threshold_violated=self.config.calibration_drift_threshold,
                statistical_significance=drift / self.config.calibration_drift_threshold,
                description=f"Calibration drift detected: {drift:.3f} above threshold"
            ))
        
        return anomalies
    
    def _detect_outlier_patterns(
        self,
        confidence: float,
        timestamp: float,
        context: Dict[str, Any]
    ) -> List[ConfidenceAnomaly]:
        """Detect outlier patterns in confidence values."""
        anomalies = []
        
        if len(self.short_term_confidence) < self.config.min_samples_for_analysis:
            return anomalies
        
        confidence_values = list(self.short_term_confidence)
        
        # Calculate median and MAD (Median Absolute Deviation)
        median_confidence = statistics.median(confidence_values)
        mad = statistics.median([abs(x - median_confidence) for x in confidence_values])
        
        if mad == 0:
            return anomalies
        
        # Modified z-score using MAD
        modified_z_score = 0.6745 * (confidence - median_confidence) / mad
        
        if abs(modified_z_score) > self.config.outlier_threshold:
            severity = self._calculate_severity(abs(modified_z_score), self.config.outlier_threshold)
            
            anomalies.append(ConfidenceAnomaly(
                anomaly_type=AnomalyType.OUTLIER_PATTERN,
                severity=severity,
                confidence_value=confidence,
                calibration_gap=context.get('calibration_gap', 0.0),
                timestamp=timestamp,
                context={**context, 'median_confidence': median_confidence, 'mad': mad},
                threshold_violated=self.config.outlier_threshold,
                statistical_significance=abs(modified_z_score),
                description=f"Outlier pattern detected: modified z-score {modified_z_score:.2f}"
            ))
        
        return anomalies
    
    def _detect_temporal_instability(
        self,
        timestamp: float,
        context: Dict[str, Any]
    ) -> List[ConfidenceAnomaly]:
        """Detect temporal instability in confidence values."""
        anomalies = []
        
        if len(self.short_term_confidence) < 10:  # Need minimum samples for stability analysis
            return anomalies
        
        # Calculate coefficient of variation for recent confidence values
        recent_confidence = list(self.short_term_confidence)[-10:]
        if len(recent_confidence) < 2:
            return anomalies
        
        mean_confidence = statistics.mean(recent_confidence)
        std_confidence = statistics.stdev(recent_confidence)
        
        if mean_confidence == 0:
            return anomalies
        
        coefficient_of_variation = std_confidence / mean_confidence
        
        if coefficient_of_variation > self.config.temporal_instability_threshold:
            severity = self._calculate_severity(
                coefficient_of_variation,
                self.config.temporal_instability_threshold
            )
            
            anomalies.append(ConfidenceAnomaly(
                anomaly_type=AnomalyType.TEMPORAL_INSTABILITY,
                severity=severity,
                confidence_value=mean_confidence,
                calibration_gap=context.get('calibration_gap', 0.0),
                timestamp=timestamp,
                context={**context, 'coefficient_of_variation': coefficient_of_variation},
                threshold_violated=self.config.temporal_instability_threshold,
                statistical_significance=coefficient_of_variation / self.config.temporal_instability_threshold,
                description=f"Temporal instability detected: CV {coefficient_of_variation:.3f}"
            ))
        
        return anomalies
    
    def _calculate_severity(self, value: float, threshold: float) -> AnomalySeverity:
        """Calculate severity based on threshold violation magnitude."""
        ratio = value / threshold
        
        if ratio >= self.config.critical_severity_multiplier:
            return AnomalySeverity.CRITICAL
        elif ratio >= self.config.high_severity_multiplier:
            return AnomalySeverity.HIGH
        elif ratio >= self.config.medium_severity_multiplier:
            return AnomalySeverity.MEDIUM
        else:
            return AnomalySeverity.LOW
    
    def _calculate_drift_severity(self, drift: float, threshold: float) -> AnomalySeverity:
        """Calculate severity for drift-based anomalies."""
        ratio = drift / threshold
        
        if ratio >= 3.0:
            return AnomalySeverity.CRITICAL
        elif ratio >= 2.0:
            return AnomalySeverity.HIGH
        elif ratio >= 1.5:
            return AnomalySeverity.MEDIUM
        else:
            return AnomalySeverity.LOW
    
    def _record_anomaly(self, anomaly: ConfidenceAnomaly) -> None:
        """Record a detected anomaly for tracking and metrics."""
        self.detected_anomalies.append(anomaly)
        self.anomaly_counts[anomaly.anomaly_type] += 1
        
        # Limit stored anomalies to prevent memory growth
        if len(self.detected_anomalies) > 1000:
            self.detected_anomalies = self.detected_anomalies[-500:]
        
        # Log the anomaly
        self.logger.warning(
            f"Confidence anomaly detected: {anomaly.description} "
            f"(type: {anomaly.anomaly_type.value}, severity: {anomaly.severity.value})"
        )
        
        # Record metrics if client available
        if self.metrics_client:
            self.metrics_client.increment(
                'confidence_anomalies_total',
                labels={
                    'type': anomaly.anomaly_type.value,
                    'severity': anomaly.severity.value
                }
            )
    
    def get_anomaly_summary(self, hours_back: int = 24) -> Dict[str, Any]:
        """Get summary of detected anomalies within the specified time window."""
        cutoff_time = time.time() - (hours_back * 3600)
        recent_anomalies = [
            anomaly for anomaly in self.detected_anomalies
            if anomaly.timestamp >= cutoff_time
        ]
        
        # Group by type and severity
        summary = {
            'total_anomalies': len(recent_anomalies),
            'by_type': {},
            'by_severity': {},
            'time_window_hours': hours_back
        }
        
        for anomaly in recent_anomalies:
            # Count by type
            type_key = anomaly.anomaly_type.value
            summary['by_type'][type_key] = summary['by_type'].get(type_key, 0) + 1
            
            # Count by severity
            severity_key = anomaly.severity.value
            summary['by_severity'][severity_key] = summary['by_severity'].get(severity_key, 0) + 1
        
        return summary
    
    def reset_baseline(self) -> None:
        """Reset the baseline statistics (useful for model updates or retraining)."""
        self.baseline_stats = {}
        self.is_baseline_established = False
        self.short_term_confidence.clear()
        self.long_term_confidence.clear()
        self.calibration_history.clear()
        self.confidence_timestamps.clear()
        
        self.logger.info("Confidence anomaly detector baseline reset")