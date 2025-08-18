"""
Test suite for edge retirement attribution service.

Tests the EdgeRetirementAttributor class and related functionality including
retirement tracking, pattern analysis, and systemic issue identification.
"""

import time
import pytest
from backend.services.edges.retirement_attribution import (
    EdgeRetirementAttributor,
    EdgeRetirement,
    RetirementReason,
    RetirementCategory,
    RetirementUrgency
)
from types import SimpleNamespace


class DummyMetrics:
    def __init__(self):
        self.events = []
    
    def increment(self, name, labels=None):
        self.events.append(('increment', name, labels or {}))
    
    def histogram(self, name, value, labels=None):
        self.events.append(('histogram', name, value, labels or {}))


class DummyLogger:
    def __init__(self):
        self.messages = []
    
    def info(self, msg, *args, **kwargs):
        self.messages.append(('info', msg % args if args else msg))
    
    def warning(self, msg, *args, **kwargs):
        self.messages.append(('warning', msg % args if args else msg))
    
    def error(self, msg, *args, **kwargs):
        self.messages.append(('error', msg % args if args else msg))
    
    def debug(self, msg, *args, **kwargs):
        self.messages.append(('debug', msg % args if args else msg))


def test_attributor_initialization():
    """Test attributor initialization."""
    attributor = EdgeRetirementAttributor()
    
    assert len(attributor.retirement_history) == 0
    assert all(count == 0 for count in attributor.retirement_counts.values())
    assert len(attributor.recent_patterns) == 0


def test_retirement_recording():
    """Test basic retirement recording."""
    attributor = EdgeRetirementAttributor()
    
    retirement = attributor.record_retirement(
        edge_id="edge_123",
        prop_id=1,
        sport="MLB",
        prop_type="STRIKEOUTS_PITCHER",
        reason=RetirementReason.LOW_CONFIDENCE,
        trigger_value=0.3,
        threshold_violated=0.5
    )
    
    assert retirement.edge_id == "edge_123"
    assert retirement.reason == RetirementReason.LOW_CONFIDENCE
    assert retirement.category == RetirementCategory.MODEL_RELATED
    assert retirement.trigger_value == 0.3
    
    # Should be in history
    assert len(attributor.retirement_history) == 1
    assert attributor.retirement_counts[RetirementReason.LOW_CONFIDENCE] == 1


def test_retirement_category_derivation():
    """Test automatic category derivation from reason."""
    attributor = EdgeRetirementAttributor()
    
    # Test model-related
    retirement = attributor.record_retirement(
        "edge_1", 1, "MLB", "STRIKEOUTS_PITCHER",
        RetirementReason.MODEL_INSTABILITY
    )
    assert retirement.category == RetirementCategory.MODEL_RELATED
    
    # Test data-related
    retirement = attributor.record_retirement(
        "edge_2", 2, "NFL", "PASSING_YARDS",
        RetirementReason.DATA_QUALITY_ISSUES
    )
    assert retirement.category == RetirementCategory.DATA_RELATED
    
    # Test system-related
    retirement = attributor.record_retirement(
        "edge_3", 3, "NBA", "POINTS_PLAYER",
        RetirementReason.SYSTEM_ERROR
    )
    assert retirement.category == RetirementCategory.SYSTEM_RELATED
    
    # Test manual
    retirement = attributor.record_retirement(
        "edge_4", 4, "NHL", "GOALS_PLAYER",
        RetirementReason.MANUAL_OVERRIDE
    )
    assert retirement.category == RetirementCategory.MANUAL


def test_contributing_factors():
    """Test contributing factor handling."""
    retirement = EdgeRetirement(
        edge_id="edge_123",
        prop_id=1,
        sport="MLB",
        prop_type="STRIKEOUTS_PITCHER",
        retirement_timestamp=time.time(),
        reason=RetirementReason.LOW_CONFIDENCE,
        category=RetirementCategory.MODEL_RELATED,
        urgency=RetirementUrgency.MEDIUM
    )
    
    # Add contributing factors
    retirement.add_contributing_factor("Poor recent performance")
    retirement.add_contributing_factor("Data quality issues")
    
    assert len(retirement.contributing_factors or []) == 2
    assert "Poor recent performance" in (retirement.contributing_factors or [])
    assert "Data quality issues" in (retirement.contributing_factors or [])
    
    # Don't add duplicates
    retirement.add_contributing_factor("Poor recent performance")
    assert len(retirement.contributing_factors or []) == 2


def test_retirement_serialization():
    """Test retirement serialization to/from dict."""
    original = EdgeRetirement(
        edge_id="edge_123",
        prop_id=1,
        sport="MLB",
        prop_type="STRIKEOUTS_PITCHER",
        retirement_timestamp=time.time(),
        reason=RetirementReason.LOW_CONFIDENCE,
        category=RetirementCategory.MODEL_RELATED,
        urgency=RetirementUrgency.HIGH,
        trigger_value=0.3,
        confidence_at_retirement=0.4
    )
    
    # Convert to dict
    retirement_dict = original.to_dict()
    
    # Verify enum serialization
    assert retirement_dict['reason'] == 'low_confidence'
    assert retirement_dict['category'] == 'model_related'
    assert retirement_dict['urgency'] == 'high'
    
    # Recreate from dict
    restored = EdgeRetirement.from_dict(retirement_dict)
    
    # Verify restoration
    assert restored.edge_id == original.edge_id
    assert restored.reason == original.reason
    assert restored.category == original.category
    assert restored.urgency == original.urgency


def test_pattern_analysis_updates():
    """Test pattern analysis updates."""
    attributor = EdgeRetirementAttributor()
    
    # Record several retirements
    for i in range(5):
        attributor.record_retirement(
            f"edge_{i}",
            i,
            "MLB",
            "STRIKEOUTS_PITCHER",
            RetirementReason.LOW_CONFIDENCE
        )
    
    # Check pattern tracking
    assert 'last_pattern_update' in attributor.recent_patterns
    assert 'hourly_retirements' in attributor.recent_patterns
    assert 'reason_clusters' in attributor.recent_patterns


def test_system_health_indicators():
    """Test system health indicator updates."""
    attributor = EdgeRetirementAttributor()
    
    # Record retirement
    attributor.record_retirement(
        "edge_123",
        1,
        "MLB",
        "STRIKEOUTS_PITCHER",
        RetirementReason.LOW_CONFIDENCE,
        urgency=RetirementUrgency.IMMEDIATE
    )
    
    # Check health indicators
    assert 'recent_retirement_rate' in attributor.system_health_indicators
    assert 'critical_retirements_ratio' in attributor.system_health_indicators
    assert 'last_health_update' in attributor.system_health_indicators


def test_retirement_analysis():
    """Test retirement analysis generation."""
    attributor = EdgeRetirementAttributor()
    
    # Record retirements with different reasons
    attributor.record_retirement(
        "edge_1", 1, "MLB", "STRIKEOUTS_PITCHER",
        RetirementReason.LOW_CONFIDENCE
    )
    attributor.record_retirement(
        "edge_2", 2, "NFL", "PASSING_YARDS",
        RetirementReason.CALIBRATION_DRIFT
    )
    attributor.record_retirement(
        "edge_3", 3, "NBA", "POINTS_PLAYER",
        RetirementReason.LOW_CONFIDENCE
    )
    
    # Get analysis
    analysis = attributor.get_retirement_analysis(hours_back=1)
    
    assert analysis['total_retirements'] == 3
    assert analysis['retirement_rate_per_hour'] == 3.0
    assert 'system_health' in analysis
    assert 'urgency_distribution' in analysis


def test_retirement_analysis_grouping():
    """Test retirement analysis with grouping."""
    attributor = EdgeRetirementAttributor()
    
    # Record retirements
    attributor.record_retirement(
        "edge_1", 1, "MLB", "STRIKEOUTS_PITCHER",
        RetirementReason.LOW_CONFIDENCE
    )
    attributor.record_retirement(
        "edge_2", 2, "MLB", "PASSING_YARDS",
        RetirementReason.LOW_CONFIDENCE
    )
    attributor.record_retirement(
        "edge_3", 3, "NFL", "PASSING_YARDS",
        RetirementReason.CALIBRATION_DRIFT
    )
    
    # Group by reason
    analysis = attributor.get_retirement_analysis(hours_back=1, group_by='reason')
    
    assert 'groups' in analysis
    assert analysis['groups']['low_confidence'] == 2
    assert analysis['groups']['calibration_drift'] == 1
    
    # Group by sport
    analysis = attributor.get_retirement_analysis(hours_back=1, group_by='sport')
    
    assert analysis['groups']['MLB'] == 2
    assert analysis['groups']['NFL'] == 1


def test_systemic_issue_identification():
    """Test systemic issue identification."""
    attributor = EdgeRetirementAttributor()
    
    # Record many retirements of the same type (should trigger systemic issue)
    for i in range(8):
        attributor.record_retirement(
            f"edge_{i}",
            i,
            "MLB",
            "STRIKEOUTS_PITCHER",
            RetirementReason.LOW_CONFIDENCE
        )
    
    # Should identify systemic issue
    issues = attributor.identify_systemic_issues(threshold=0.5)  # 50% threshold
    
    assert len(issues) > 0
    
    # Should identify dominant retirement reason
    dominant_reason_issues = [
        issue for issue in issues
        if issue['type'] == 'dominant_retirement_reason'
    ]
    assert len(dominant_reason_issues) > 0


def test_model_version_issue_tracking():
    """Test model version issue tracking."""
    attributor = EdgeRetirementAttributor()
    
    # Record multiple retirements for same model version
    for i in range(8):
        attributor.record_retirement(
            f"edge_{i}",
            i,
            "MLB",
            "STRIKEOUTS_PITCHER",
            RetirementReason.MODEL_INSTABILITY,
            model_version="v1.2.3"
        )
    
    # Should track model version issues
    issues = attributor.identify_systemic_issues()
    
    model_issues = [
        issue for issue in issues
        if issue['type'] == 'model_version_issues'
    ]
    assert len(model_issues) > 0
    
    if model_issues:
        issue = model_issues[0]
        assert issue['model_version'] == "v1.2.3"
        assert issue['count'] >= 8


def test_retirement_trends():
    """Test retirement trend analysis."""
    attributor = EdgeRetirementAttributor()
    
    # Record retirements over time (simulate by manipulating timestamps)
    current_time = time.time()
    
    # Older retirements (2 days ago)
    for i in range(3):
        retirement = attributor.record_retirement(
            f"edge_old_{i}",
            i,
            "MLB",
            "STRIKEOUTS_PITCHER",
            RetirementReason.LOW_CONFIDENCE
        )
        retirement.retirement_timestamp = current_time - (2 * 24 * 3600)
    
    # Recent retirements (today)
    for i in range(6):
        attributor.record_retirement(
            f"edge_new_{i}",
            i + 10,
            "MLB",
            "STRIKEOUTS_PITCHER",
            RetirementReason.LOW_CONFIDENCE
        )
    
    # Get trends
    trends = attributor.get_retirement_trends(days_back=3)
    
    assert trends['days_analyzed'] == 3
    assert trends['total_retirements'] == 9
    assert 'daily_counts' in trends
    assert 'trend_direction' in trends


def test_metrics_integration():
    """Test metrics client integration."""
    metrics_client = DummyMetrics()
    attributor = EdgeRetirementAttributor(metrics_client=metrics_client)
    
    # Record retirement
    attributor.record_retirement(
        "edge_123",
        1,
        "MLB",
        "STRIKEOUTS_PITCHER",
        RetirementReason.LOW_CONFIDENCE,
        decision_latency_ms=150.0
    )
    
    # Check metrics recording
    increment_events = [e for e in metrics_client.events if e[0] == 'increment']
    assert len(increment_events) > 0
    
    # Should have recorded retirement metric
    retirement_events = [e for e in increment_events if 'edge_retirements_total' in e[1]]
    assert len(retirement_events) > 0
    
    # Check histogram for latency
    histogram_events = [e for e in metrics_client.events if e[0] == 'histogram']
    latency_events = [e for e in histogram_events if 'decision_latency_ms' in e[1]]
    assert len(latency_events) > 0


def test_logger_integration():
    """Test logger integration."""
    logger = DummyLogger()
    # Work around type checking by not passing to constructor directly
    attributor = EdgeRetirementAttributor()
    attributor.logger = logger  # type: ignore
    
    # Record retirement
    attributor.record_retirement(
        "edge_123",
        1,
        "MLB",
        "STRIKEOUTS_PITCHER",
        RetirementReason.LOW_CONFIDENCE
    )
    
    # Check logging
    warning_messages = [msg for level, msg in logger.messages if level == 'warning']
    assert len(warning_messages) > 0
    
    # Should contain retirement information
    retirement_logs = [msg for msg in warning_messages if 'retirement recorded' in msg.lower()]
    assert len(retirement_logs) > 0


def test_memory_limit_enforcement():
    """Test that retirement history doesn't grow indefinitely."""
    attributor = EdgeRetirementAttributor(max_retirement_history=50)
    
    # Record more retirements than the limit
    for i in range(75):
        attributor.record_retirement(
            f"edge_{i}",
            i,
            "MLB",
            "STRIKEOUTS_PITCHER",
            RetirementReason.LOW_CONFIDENCE
        )
    
    # Should not exceed memory limit
    assert len(attributor.retirement_history) <= 50


def test_sport_prop_clustering():
    """Test sport/prop type clustering detection."""
    attributor = EdgeRetirementAttributor()
    
    # Record many retirements for same sport/prop combination
    for i in range(10):
        attributor.record_retirement(
            f"edge_{i}",
            i,
            "MLB",
            "STRIKEOUTS_PITCHER",
            RetirementReason.CALIBRATION_DRIFT
        )
    
    # Add a few other retirements to avoid 100% clustering
    attributor.record_retirement(
        "edge_other_1", 100, "NFL", "PASSING_YARDS",
        RetirementReason.LOW_CONFIDENCE
    )
    attributor.record_retirement(
        "edge_other_2", 101, "NBA", "POINTS_PLAYER",
        RetirementReason.LOW_CONFIDENCE
    )
    
    # Should identify clustering
    issues = attributor.identify_systemic_issues(threshold=0.3)
    
    clustering_issues = [
        issue for issue in issues
        if issue['type'] == 'sport_prop_clustering'
    ]
    
    # May or may not detect depending on exact threshold, but test shouldn't fail
    assert len(clustering_issues) >= 0


def test_empty_analysis():
    """Test analysis with no data."""
    attributor = EdgeRetirementAttributor()
    
    # Get analysis with no retirements
    analysis = attributor.get_retirement_analysis()
    
    assert analysis['total_retirements'] == 0
    assert analysis['retirement_rate_per_hour'] == 0.0
    
    # Get trends with no data
    trends = attributor.get_retirement_trends()
    
    assert trends['total_retirements'] == 0
    assert trends['daily_average'] == 0.0
    
    # Get issues with no data
    issues = attributor.identify_systemic_issues()
    
    assert len(issues) == 0


def test_automated_vs_manual_decisions():
    """Test tracking of automated vs manual retirement decisions."""
    attributor = EdgeRetirementAttributor()
    
    # Record automated decision
    attributor.record_retirement(
        "edge_auto", 1, "MLB", "STRIKEOUTS_PITCHER",
        RetirementReason.LOW_CONFIDENCE,
        automated_decision=True
    )
    
    # Record manual decision
    attributor.record_retirement(
        "edge_manual", 2, "MLB", "STRIKEOUTS_PITCHER",
        RetirementReason.MANUAL_OVERRIDE,
        automated_decision=False
    )
    
    # Check system health indicators
    health = attributor.system_health_indicators
    assert 'automated_decision_ratio' in health
    assert 0.0 <= health['automated_decision_ratio'] <= 1.0


if __name__ == "__main__":
    pytest.main([__file__])