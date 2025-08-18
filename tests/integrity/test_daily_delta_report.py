"""
Test suite for daily delta report integrity script.

Tests the DailyDeltaReporter class and related functionality for
daily integrity reporting and anomaly detection.
"""

import os
import time
import json
import tempfile
import pytest
from datetime import datetime, timedelta
from pathlib import Path
from scripts.integrity.daily_delta_report import (
    DailyDeltaReporter,
    DeltaMetric,
    IntegrityDelta
)


def create_sample_digest(prefix: str = "test", metrics_count: int = 10) -> dict:
    """Create a sample digest for testing."""
    digest = {
        "timestamp": time.time(),
        "version": "1.0",
        "system_info": {
            "hostname": f"{prefix}_host",
            "environment": "test",
            "git_commit": "abc123"
        },
        "metrics": {}
    }
    
    # Add sample metrics
    for i in range(metrics_count):
        metric_name = f"metric_{i}"
        digest["metrics"][metric_name] = {
            "value": i * 10.0,
            "count": i + 1,
            "timestamp": time.time() - (i * 3600)  # Each metric older by an hour
        }
    
    return digest


def test_reporter_initialization():
    """Test delta reporter initialization."""
    reporter = DailyDeltaReporter()
    
    assert hasattr(reporter, 'config')
    assert hasattr(reporter, 'logger')
    assert hasattr(reporter, 'thresholds')


def test_reporter_with_config():
    """Test reporter initialization with custom config."""
    config = {
        'output_dir': 'test_output',
        'thresholds': {
            'confidence': {'warning': 0.1, 'critical': 0.2}
        }
    }
    
    reporter = DailyDeltaReporter(config=config)
    
    assert reporter.config == config
    assert reporter.thresholds['confidence']['warning'] == 0.1


def test_digest_loading():
    """Test digest file loading."""
    with tempfile.TemporaryDirectory() as temp_dir:
        digest_path = Path(temp_dir) / "test_digest.json"
        
        # Create test digest
        digest = create_sample_digest()
        with open(digest_path, 'w') as f:
            json.dump(digest, f)
        
        reporter = DailyDeltaReporter()
        loaded_digest = reporter.load_digest(str(digest_path))
        
        assert loaded_digest is not None
        assert loaded_digest["version"] == "1.0"
        assert "metrics" in loaded_digest
        assert len(loaded_digest["metrics"]) == 10


def test_digest_loading_invalid_file():
    """Test digest loading with invalid file."""
    with tempfile.TemporaryDirectory() as temp_dir:
        invalid_path = Path(temp_dir) / "nonexistent.json"
        
        reporter = DailyDeltaReporter()
        
        # Should raise exception for invalid file
        with pytest.raises(Exception):
            reporter.load_digest(str(invalid_path))


def test_delta_metric_creation():
    """Test delta metric creation."""
    delta = DeltaMetric(
        metric_name="test_metric",
        previous_value=100.0,
        current_value=120.0,
        delta=20.0,
        delta_percentage=20.0,
        threshold_violated=False,
        severity="low",
        description="Test metric change"
    )
    
    assert delta.metric_name == "test_metric"
    assert delta.delta == 20.0
    assert delta.delta_percentage == 20.0
    assert delta.severity == "low"


def test_integrity_delta_creation():
    """Test integrity delta structure."""
    delta_metrics = [
        DeltaMetric(
            metric_name="metric_1",
            previous_value=100.0,
            current_value=120.0,
            delta=20.0,
            delta_percentage=20.0,
            threshold_violated=False,
            severity="low",
            description="Test change"
        )
    ]
    
    integrity_delta = IntegrityDelta(
        report_id="test_report_001",
        timestamp=datetime.now().isoformat(),
        baseline_timestamp=datetime.now().isoformat(),
        current_timestamp=datetime.now().isoformat(),
        baseline_digest_hash="hash1",
        current_digest_hash="hash2",
        total_metrics_compared=10,
        metrics_changed=1,
        metrics_improved=0,
        metrics_degraded=1,
        critical_issues=0,
        high_priority_issues=0,
        metric_deltas=delta_metrics,
        new_metrics=[],
        missing_metrics=[],
        anomaly_score=0.5,
        stability_score=0.8,
        performance_trend="stable",
        recommended_actions=["Monitor metric_1"]
    )
    
    assert integrity_delta.report_id == "test_report_001"
    assert len(integrity_delta.metric_deltas) == 1
    assert integrity_delta.anomaly_score == 0.5


def test_delta_serialization():
    """Test delta serialization to dict."""
    delta_metrics = [
        DeltaMetric(
            metric_name="metric_1",
            previous_value=100.0,
            current_value=120.0,
            delta=20.0,
            delta_percentage=20.0,
            threshold_violated=False,
            severity="low",
            description="Test change"
        )
    ]
    
    integrity_delta = IntegrityDelta(
        report_id="test_report_001",
        timestamp=datetime.now().isoformat(),
        baseline_timestamp=datetime.now().isoformat(),
        current_timestamp=datetime.now().isoformat(),
        baseline_digest_hash="hash1",
        current_digest_hash="hash2",
        total_metrics_compared=10,
        metrics_changed=1,
        metrics_improved=0,
        metrics_degraded=1,
        critical_issues=0,
        high_priority_issues=0,
        metric_deltas=delta_metrics,
        new_metrics=[],
        missing_metrics=[],
        anomaly_score=0.5,
        stability_score=0.8,
        performance_trend="stable",
        recommended_actions=["Monitor metric_1"]
    )
    
    # Convert to dict
    delta_dict = integrity_delta.to_dict()
    
    assert isinstance(delta_dict, dict)
    assert delta_dict['report_id'] == "test_report_001"
    assert delta_dict['anomaly_score'] == 0.5
    assert len(delta_dict['metric_deltas']) == 1


def test_thresholds_configuration():
    """Test thresholds configuration."""
    custom_thresholds = {
        'confidence': {'warning': 0.1, 'critical': 0.25},
        'accuracy': {'warning': 0.05, 'critical': 0.15}
    }
    
    config = {'thresholds': custom_thresholds}
    reporter = DailyDeltaReporter(config=config)
    
    assert reporter.thresholds['confidence']['warning'] == 0.1
    assert reporter.thresholds['accuracy']['critical'] == 0.15


def test_metric_categories():
    """Test metric categorization."""
    reporter = DailyDeltaReporter()
    
    assert 'performance' in reporter.metric_categories
    assert 'reliability' in reporter.metric_categories
    assert 'efficiency' in reporter.metric_categories
    
    # Check some expected metrics in categories
    assert 'accuracy' in reporter.metric_categories['performance']
    assert 'error_rate' in reporter.metric_categories['reliability']


def test_output_directory_creation():
    """Test output directory creation."""
    with tempfile.TemporaryDirectory() as temp_dir:
        output_path = Path(temp_dir) / "custom_output"
        
        config = {'output_dir': str(output_path)}
        reporter = DailyDeltaReporter(config=config)
        
        # Output directory should be created
        assert reporter.output_dir.exists()
        assert reporter.output_dir == output_path


def test_logger_integration():
    """Test logger integration."""
    reporter = DailyDeltaReporter()
    
    # Logger should be properly initialized
    assert hasattr(reporter, 'logger')
    assert reporter.logger.name == 'daily_delta_reporter'
    
    # Should be able to log messages
    reporter.logger.info("Test message")


def test_large_digest_handling():
    """Test handling of large digest files."""
    # Create large digest
    large_digest = create_sample_digest("large", metrics_count=1000)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        digest_path = Path(temp_dir) / "large_digest.json"
        
        with open(digest_path, 'w') as f:
            json.dump(large_digest, f)
        
        reporter = DailyDeltaReporter()
        loaded_digest = reporter.load_digest(str(digest_path))
        
        # Should handle large files
        assert len(loaded_digest["metrics"]) == 1000
        assert "digest_metadata" in loaded_digest


def test_malformed_json_handling():
    """Test handling of malformed JSON files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        malformed_path = Path(temp_dir) / "malformed.json"
        
        # Create malformed JSON
        with open(malformed_path, 'w') as f:
            f.write('{"invalid": json content}')
        
        reporter = DailyDeltaReporter()
        
        # Should raise exception for malformed JSON
        with pytest.raises(Exception):
            reporter.load_digest(str(malformed_path))


def test_digest_metadata_addition():
    """Test automatic digest metadata addition."""
    with tempfile.TemporaryDirectory() as temp_dir:
        digest_path = Path(temp_dir) / "test_digest.json"
        
        # Create digest without metadata
        digest = {"timestamp": time.time(), "metrics": {}}
        with open(digest_path, 'w') as f:
            json.dump(digest, f)
        
        reporter = DailyDeltaReporter()
        loaded_digest = reporter.load_digest(str(digest_path))
        
        # Should add metadata
        assert "digest_metadata" in loaded_digest
        assert "file_path" in loaded_digest["digest_metadata"]
        assert "file_size" in loaded_digest["digest_metadata"]


if __name__ == "__main__":
    pytest.main([__file__])