"""
Edge Retirement Attribution Service

This module provides comprehensive tracking and attribution analysis for edge
retirement decisions, helping identify patterns and root causes of edge failures.
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List, Set
from enum import Enum
import time
import json
import logging


class RetirementReason(Enum):
    """Enumeration of edge retirement reasons."""
    LOW_CONFIDENCE = "low_confidence"
    CALIBRATION_DRIFT = "calibration_drift"
    PERFORMANCE_DEGRADATION = "performance_degradation"
    DATA_QUALITY_ISSUES = "data_quality_issues"
    MODEL_INSTABILITY = "model_instability"
    ANOMALY_DETECTION = "anomaly_detection"
    MANUAL_OVERRIDE = "manual_override"
    SYSTEM_ERROR = "system_error"
    TIMEOUT = "timeout"
    RESOURCE_EXHAUSTION = "resource_exhaustion"


class RetirementCategory(Enum):
    """Categories for retirement reasons."""
    MODEL_RELATED = "model_related"
    DATA_RELATED = "data_related"
    SYSTEM_RELATED = "system_related"
    MANUAL = "manual"
    PERFORMANCE = "performance"


class RetirementUrgency(Enum):
    """Urgency levels for retirement decisions."""
    IMMEDIATE = "immediate"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SCHEDULED = "scheduled"


@dataclass
class EdgeRetirement:
    """Represents an edge retirement event with full attribution."""
    
    # Core identification
    edge_id: str
    prop_id: int
    sport: str
    prop_type: str
    retirement_timestamp: float
    
    # Retirement details
    reason: RetirementReason
    category: RetirementCategory
    urgency: RetirementUrgency
    
    # Attribution data
    trigger_value: Optional[float] = None
    threshold_violated: Optional[float] = None
    confidence_at_retirement: Optional[float] = None
    calibration_gap: Optional[float] = None
    
    # Context and metadata
    model_version: Optional[str] = None
    system_state: Optional[Dict[str, Any]] = None
    contributing_factors: Optional[List[str]] = None
    error_details: Optional[str] = None
    
    # Performance metrics at retirement
    recent_accuracy: Optional[float] = None
    recent_volume: Optional[int] = None
    lifetime_performance: Optional[Dict[str, float]] = None
    
    # Decision context
    decision_latency_ms: Optional[float] = None
    automated_decision: bool = True
    decision_confidence: Optional[float] = None
    
    def __post_init__(self):
        """Initialize computed fields and defaults."""
        if self.contributing_factors is None:
            self.contributing_factors = []
        
        if self.system_state is None:
            self.system_state = {}
        
        if self.lifetime_performance is None:
            self.lifetime_performance = {}
        
        # Set category based on reason if not explicitly provided
        if not hasattr(self, '_category_set'):
            self.category = self._derive_category_from_reason()
    
    def _derive_category_from_reason(self) -> RetirementCategory:
        """Derive retirement category from reason."""
        reason_to_category = {
            RetirementReason.LOW_CONFIDENCE: RetirementCategory.MODEL_RELATED,
            RetirementReason.CALIBRATION_DRIFT: RetirementCategory.MODEL_RELATED,
            RetirementReason.PERFORMANCE_DEGRADATION: RetirementCategory.PERFORMANCE,
            RetirementReason.DATA_QUALITY_ISSUES: RetirementCategory.DATA_RELATED,
            RetirementReason.MODEL_INSTABILITY: RetirementCategory.MODEL_RELATED,
            RetirementReason.ANOMALY_DETECTION: RetirementCategory.MODEL_RELATED,
            RetirementReason.MANUAL_OVERRIDE: RetirementCategory.MANUAL,
            RetirementReason.SYSTEM_ERROR: RetirementCategory.SYSTEM_RELATED,
            RetirementReason.TIMEOUT: RetirementCategory.SYSTEM_RELATED,
            RetirementReason.RESOURCE_EXHAUSTION: RetirementCategory.SYSTEM_RELATED,
        }
        
        return reason_to_category.get(self.reason, RetirementCategory.SYSTEM_RELATED)
    
    def add_contributing_factor(self, factor: str) -> None:
        """Add a contributing factor to the retirement."""
        if self.contributing_factors is None:
            self.contributing_factors = []
        
        if factor not in self.contributing_factors:
            self.contributing_factors.append(factor)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert retirement record to dictionary."""
        result = asdict(self)
        
        # Convert enums to string values
        result['reason'] = self.reason.value
        result['category'] = self.category.value
        result['urgency'] = self.urgency.value
        
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> EdgeRetirement:
        """Create retirement record from dictionary."""
        # Convert string enums back to enum objects
        if 'reason' in data:
            data['reason'] = RetirementReason(data['reason'])
        
        if 'category' in data:
            data['category'] = RetirementCategory(data['category'])
            
        if 'urgency' in data:
            data['urgency'] = RetirementUrgency(data['urgency'])
        
        return cls(**data)


class EdgeRetirementAttributor:
    """
    Service for tracking and analyzing edge retirement patterns.
    
    Provides comprehensive attribution analysis to help identify systemic issues
    and improve edge reliability over time.
    """
    
    def __init__(
        self,
        logger: Optional[logging.Logger] = None,
        metrics_client: Optional[Any] = None,
        max_retirement_history: int = 10000
    ):
        """
        Initialize the edge retirement attributor.
        
        Args:
            logger: Logger for retirement events
            metrics_client: Metrics client for retirement tracking
            max_retirement_history: Maximum number of retirement records to keep
        """
        self.logger = logger or logging.getLogger(__name__)
        self.metrics_client = metrics_client
        self.max_retirement_history = max_retirement_history
        
        # Retirement tracking
        self.retirement_history: List[EdgeRetirement] = []
        self.retirement_counts: Dict[RetirementReason, int] = {
            reason: 0 for reason in RetirementReason
        }
        
        # Pattern tracking
        self.recent_patterns: Dict[str, Any] = {}
        self.system_health_indicators: Dict[str, float] = {}
    
    def record_retirement(
        self,
        edge_id: str,
        prop_id: int,
        sport: str,
        prop_type: str,
        reason: RetirementReason,
        urgency: RetirementUrgency = RetirementUrgency.MEDIUM,
        trigger_value: Optional[float] = None,
        threshold_violated: Optional[float] = None,
        confidence_at_retirement: Optional[float] = None,
        calibration_gap: Optional[float] = None,
        model_version: Optional[str] = None,
        system_state: Optional[Dict[str, Any]] = None,
        contributing_factors: Optional[List[str]] = None,
        error_details: Optional[str] = None,
        recent_accuracy: Optional[float] = None,
        recent_volume: Optional[int] = None,
        lifetime_performance: Optional[Dict[str, float]] = None,
        decision_latency_ms: Optional[float] = None,
        automated_decision: bool = True,
        decision_confidence: Optional[float] = None
    ) -> EdgeRetirement:
        """
        Record a new edge retirement with full attribution.
        
        Args:
            edge_id: Unique edge identifier
            prop_id: Proposition ID
            sport: Sport category
            prop_type: Type of proposition
            reason: Reason for retirement
            urgency: Urgency level of retirement
            trigger_value: Value that triggered retirement
            threshold_violated: Threshold that was violated
            confidence_at_retirement: Confidence score at time of retirement
            calibration_gap: Calibration gap at time of retirement
            model_version: Model version in use
            system_state: System state information
            contributing_factors: List of contributing factors
            error_details: Detailed error information
            recent_accuracy: Recent accuracy metrics
            recent_volume: Recent volume metrics
            lifetime_performance: Lifetime performance metrics
            decision_latency_ms: Time taken to make retirement decision
            automated_decision: Whether retirement was automated
            decision_confidence: Confidence in retirement decision
            
        Returns:
            EdgeRetirement: The recorded retirement event
        """
        current_time = time.time()
        
        retirement = EdgeRetirement(
            edge_id=edge_id,
            prop_id=prop_id,
            sport=sport,
            prop_type=prop_type,
            retirement_timestamp=current_time,
            reason=reason,
            category=RetirementCategory.MODEL_RELATED,  # Will be derived in __post_init__
            urgency=urgency,
            trigger_value=trigger_value,
            threshold_violated=threshold_violated,
            confidence_at_retirement=confidence_at_retirement,
            calibration_gap=calibration_gap,
            model_version=model_version,
            system_state=system_state or {},
            contributing_factors=contributing_factors or [],
            error_details=error_details,
            recent_accuracy=recent_accuracy,
            recent_volume=recent_volume,
            lifetime_performance=lifetime_performance or {},
            decision_latency_ms=decision_latency_ms,
            automated_decision=automated_decision,
            decision_confidence=decision_confidence
        )
        
        # Record the retirement
        self._record_retirement_event(retirement)
        
        # Update patterns and analysis
        self._update_pattern_analysis(retirement)
        
        # Update system health indicators
        self._update_system_health(retirement)
        
        return retirement
    
    def _record_retirement_event(self, retirement: EdgeRetirement) -> None:
        """Record a retirement event in history and metrics."""
        # Add to history
        self.retirement_history.append(retirement)
        
        # Maintain history size limit
        if len(self.retirement_history) > self.max_retirement_history:
            self.retirement_history = self.retirement_history[-self.max_retirement_history//2:]
        
        # Update counts
        self.retirement_counts[retirement.reason] += 1
        
        # Log the retirement
        self.logger.warning(
            f"Edge retirement recorded: {retirement.edge_id} "
            f"(reason: {retirement.reason.value}, urgency: {retirement.urgency.value}, "
            f"category: {retirement.category.value})"
        )
        
        # Record metrics
        if self.metrics_client:
            self.metrics_client.increment(
                'edge_retirements_total',
                labels={
                    'reason': retirement.reason.value,
                    'category': retirement.category.value,
                    'urgency': retirement.urgency.value,
                    'sport': retirement.sport,
                    'prop_type': retirement.prop_type
                }
            )
            
            # Record decision latency if available
            if retirement.decision_latency_ms:
                self.metrics_client.histogram(
                    'edge_retirement_decision_latency_ms',
                    retirement.decision_latency_ms,
                    labels={'reason': retirement.reason.value}
                )
    
    def _update_pattern_analysis(self, retirement: EdgeRetirement) -> None:
        """Update pattern analysis based on new retirement."""
        current_time = time.time()
        
        # Initialize patterns tracking if needed
        if 'last_pattern_update' not in self.recent_patterns:
            self.recent_patterns = {
                'last_pattern_update': current_time,
                'hourly_retirements': {},
                'reason_clusters': {},
                'model_version_issues': {},
                'sport_prop_patterns': {}
            }
        
        # Update hourly retirement patterns
        hour_key = int(current_time // 3600)  # Hour bucket
        if hour_key not in self.recent_patterns['hourly_retirements']:
            self.recent_patterns['hourly_retirements'][hour_key] = 0
        self.recent_patterns['hourly_retirements'][hour_key] += 1
        
        # Clean old hourly data (keep last 48 hours)
        cutoff_hour = hour_key - 48
        self.recent_patterns['hourly_retirements'] = {
            k: v for k, v in self.recent_patterns['hourly_retirements'].items()
            if k > cutoff_hour
        }
        
        # Update reason clustering
        reason_key = retirement.reason.value
        if reason_key not in self.recent_patterns['reason_clusters']:
            self.recent_patterns['reason_clusters'][reason_key] = []
        self.recent_patterns['reason_clusters'][reason_key].append({
            'timestamp': retirement.retirement_timestamp,
            'edge_id': retirement.edge_id,
            'confidence': retirement.confidence_at_retirement
        })
        
        # Keep only recent reasons (last 24 hours)
        cutoff_time = current_time - 24 * 3600
        for reason_key in self.recent_patterns['reason_clusters']:
            self.recent_patterns['reason_clusters'][reason_key] = [
                event for event in self.recent_patterns['reason_clusters'][reason_key]
                if event['timestamp'] > cutoff_time
            ]
        
        # Update model version issue tracking
        if retirement.model_version:
            model_key = retirement.model_version
            if model_key not in self.recent_patterns['model_version_issues']:
                self.recent_patterns['model_version_issues'][model_key] = 0
            self.recent_patterns['model_version_issues'][model_key] += 1
        
        # Update sport/prop type patterns
        sport_prop_key = f"{retirement.sport}:{retirement.prop_type}"
        if sport_prop_key not in self.recent_patterns['sport_prop_patterns']:
            self.recent_patterns['sport_prop_patterns'][sport_prop_key] = {
                'count': 0,
                'reasons': {}
            }
        
        pattern_entry = self.recent_patterns['sport_prop_patterns'][sport_prop_key]
        pattern_entry['count'] += 1
        
        reason_val = retirement.reason.value
        if reason_val not in pattern_entry['reasons']:
            pattern_entry['reasons'][reason_val] = 0
        pattern_entry['reasons'][reason_val] += 1
        
        self.recent_patterns['last_pattern_update'] = current_time
    
    def _update_system_health(self, retirement: EdgeRetirement) -> None:
        """Update system health indicators based on retirement."""
        current_time = time.time()
        
        # Calculate recent retirement rate
        recent_retirements = [
            r for r in self.retirement_history
            if r.retirement_timestamp > current_time - 3600  # Last hour
        ]
        
        self.system_health_indicators.update({
            'recent_retirement_rate': len(recent_retirements) / 60.0,  # Per minute
            'critical_retirements_ratio': len([
                r for r in recent_retirements
                if r.urgency == RetirementUrgency.IMMEDIATE
            ]) / max(len(recent_retirements), 1),
            'model_related_ratio': len([
                r for r in recent_retirements
                if r.category == RetirementCategory.MODEL_RELATED
            ]) / max(len(recent_retirements), 1),
            'automated_decision_ratio': len([
                r for r in recent_retirements
                if r.automated_decision
            ]) / max(len(recent_retirements), 1),
            'last_health_update': current_time
        })
    
    def get_retirement_analysis(
        self,
        hours_back: int = 24,
        group_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive retirement analysis.
        
        Args:
            hours_back: Hours of history to analyze
            group_by: Optional grouping ('reason', 'category', 'sport', 'prop_type')
            
        Returns:
            Dictionary with retirement analysis
        """
        cutoff_time = time.time() - (hours_back * 3600)
        recent_retirements = [
            r for r in self.retirement_history
            if r.retirement_timestamp >= cutoff_time
        ]
        
        analysis = {
            'total_retirements': len(recent_retirements),
            'time_window_hours': hours_back,
            'retirement_rate_per_hour': len(recent_retirements) / hours_back,
            'system_health': dict(self.system_health_indicators),
        }
        
        if not recent_retirements:
            return analysis
        
        # Group analysis
        if group_by == 'reason':
            groups = {}
            for retirement in recent_retirements:
                key = retirement.reason.value
                if key not in groups:
                    groups[key] = []
                groups[key].append(retirement)
            analysis['groups'] = {k: len(v) for k, v in groups.items()}
        
        elif group_by == 'category':
            groups = {}
            for retirement in recent_retirements:
                key = retirement.category.value
                if key not in groups:
                    groups[key] = []
                groups[key].append(retirement)
            analysis['groups'] = {k: len(v) for k, v in groups.items()}
        
        elif group_by == 'sport':
            groups = {}
            for retirement in recent_retirements:
                key = retirement.sport
                if key not in groups:
                    groups[key] = []
                groups[key].append(retirement)
            analysis['groups'] = {k: len(v) for k, v in groups.items()}
        
        elif group_by == 'prop_type':
            groups = {}
            for retirement in recent_retirements:
                key = retirement.prop_type
                if key not in groups:
                    groups[key] = []
                groups[key].append(retirement)
            analysis['groups'] = {k: len(v) for k, v in groups.items()}
        
        # Urgency distribution
        urgency_dist = {}
        for retirement in recent_retirements:
            urgency = retirement.urgency.value
            urgency_dist[urgency] = urgency_dist.get(urgency, 0) + 1
        analysis['urgency_distribution'] = urgency_dist
        
        # Average confidence at retirement
        confidences = [
            r.confidence_at_retirement for r in recent_retirements
            if r.confidence_at_retirement is not None
        ]
        if confidences:
            analysis['average_confidence_at_retirement'] = sum(confidences) / len(confidences)
        
        # Pattern analysis
        analysis['patterns'] = dict(self.recent_patterns)
        
        return analysis
    
    def identify_systemic_issues(self, threshold: float = 0.3) -> List[Dict[str, Any]]:
        """
        Identify potential systemic issues based on retirement patterns.
        
        Args:
            threshold: Minimum proportion to consider an issue systemic
            
        Returns:
            List of identified systemic issues
        """
        issues = []
        current_time = time.time()
        
        # Analyze recent retirements (last 6 hours)
        recent_retirements = [
            r for r in self.retirement_history
            if r.retirement_timestamp > current_time - 6 * 3600
        ]
        
        if len(recent_retirements) < 5:  # Need minimum sample size
            return issues
        
        total_recent = len(recent_retirements)
        
        # Check for dominant retirement reasons
        reason_counts = {}
        for retirement in recent_retirements:
            reason = retirement.reason.value
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
        
        for reason, count in reason_counts.items():
            if count / total_recent > threshold:
                issues.append({
                    'type': 'dominant_retirement_reason',
                    'reason': reason,
                    'proportion': count / total_recent,
                    'count': count,
                    'severity': 'high' if count / total_recent > 0.6 else 'medium',
                    'description': f"High proportion of {reason} retirements: {count}/{total_recent} ({count/total_recent:.2%})"
                })
        
        # Check for model version issues
        if self.recent_patterns.get('model_version_issues'):
            for model_version, issue_count in self.recent_patterns['model_version_issues'].items():
                if issue_count > 5:  # Arbitrary threshold
                    issues.append({
                        'type': 'model_version_issues',
                        'model_version': model_version,
                        'count': issue_count,
                        'severity': 'high' if issue_count > 10 else 'medium',
                        'description': f"Model version {model_version} has {issue_count} retirement issues"
                    })
        
        # Check for sport/prop type clustering
        if self.recent_patterns.get('sport_prop_patterns'):
            for sport_prop, pattern_data in self.recent_patterns['sport_prop_patterns'].items():
                if pattern_data['count'] > total_recent * threshold:
                    issues.append({
                        'type': 'sport_prop_clustering',
                        'sport_prop': sport_prop,
                        'count': pattern_data['count'],
                        'proportion': pattern_data['count'] / total_recent,
                        'severity': 'medium',
                        'description': f"High retirement clustering in {sport_prop}: {pattern_data['count']} retirements",
                        'reasons': pattern_data['reasons']
                    })
        
        return issues
    
    def get_retirement_trends(self, days_back: int = 7) -> Dict[str, Any]:
        """Get retirement trends over the specified time period."""
        cutoff_time = time.time() - (days_back * 24 * 3600)
        relevant_retirements = [
            r for r in self.retirement_history
            if r.retirement_timestamp >= cutoff_time
        ]
        
        # Group by day
        daily_counts = {}
        for retirement in relevant_retirements:
            day_key = int(retirement.retirement_timestamp // (24 * 3600))
            if day_key not in daily_counts:
                daily_counts[day_key] = 0
            daily_counts[day_key] += 1
        
        # Calculate trend
        days = sorted(daily_counts.keys())
        if len(days) >= 2:
            recent_avg = sum(daily_counts[day] for day in days[-3:]) / min(3, len(days[-3:]))
            older_avg = sum(daily_counts[day] for day in days[:-3]) / max(1, len(days[:-3]))
            trend = (recent_avg - older_avg) / max(older_avg, 1)
        else:
            trend = 0.0
        
        return {
            'days_analyzed': days_back,
            'total_retirements': len(relevant_retirements),
            'daily_average': len(relevant_retirements) / days_back,
            'daily_counts': daily_counts,
            'trend_ratio': trend,
            'trend_direction': 'increasing' if trend > 0.1 else 'decreasing' if trend < -0.1 else 'stable'
        }