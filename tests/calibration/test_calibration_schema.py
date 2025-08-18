"""
Test suite for calibration sample schema.

Tests the CalibrationSample dataclass and related functionality including
sample creation, integrity verification, phase management, and validation.
"""

import time
import pytest
from backend.services.calibration.sample_schema import (
    CalibrationSample,
    SamplePhase,
    SampleStatus,
    build_sample
)


def test_build_sample_primary_phase():
    """Test building a sample in primary phase."""
    s = build_sample(
        prop_id=1, 
        sport="MLB", 
        prop_type="STRIKEOUTS_PITCHER",
        predicted_value=7.5,
        confidence_score=0.8
    )
    
    assert s.prop_id == 1
    assert s.sport == "MLB"
    assert s.prop_type == "STRIKEOUTS_PITCHER"
    assert s.predicted_value == 7.5
    assert s.confidence_score == 0.8
    assert s.phase == SamplePhase.PRIMARY
    assert s.status == SampleStatus.ACTIVE
    assert s.sample_id != ""
    assert s.integrity_hash is not None


def test_sample_id_generation():
    """Test that sample IDs are unique and deterministic."""
    s1 = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    s2 = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    s3 = build_sample(2, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    
    # Same inputs should generate different IDs due to timestamp
    assert s1.sample_id != s2.sample_id
    
    # Different inputs should generate different IDs
    assert s1.sample_id != s3.sample_id


def test_integrity_verification():
    """Test integrity hash verification."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    
    # Should verify successfully initially
    assert s.verify_integrity()
    
    # Modify a core field and verify it breaks integrity
    original_hash = s.integrity_hash
    s.prop_id = 999
    
    # Should fail verification with modified core field
    assert not s.verify_integrity()
    
    # Hash should remain the same (not auto-updated)
    assert s.integrity_hash == original_hash


def test_update_resolution():
    """Test updating sample with actual outcome."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    
    initial_updated_at = s.updated_at
    time.sleep(0.01)  # Ensure timestamp difference
    
    s.update_resolution(8.0)
    
    assert s.actual_value == 8.0
    assert s.calibration_gap == 0.5  # |7.5 - 8.0|
    assert s.resolved_at is not None
    assert s.updated_at > initial_updated_at


def test_validation_errors():
    """Test validation error handling."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    
    # Should start active with no errors
    assert s.status == SampleStatus.ACTIVE
    assert len(s.validation_errors or []) == 0
    
    # Add validation error
    s.add_validation_error("Test error")
    
    assert len(s.validation_errors or []) == 1
    assert "Test error" in (s.validation_errors or [])
    assert s.status == SampleStatus.FLAGGED
    
    # Don't add duplicate errors
    s.add_validation_error("Test error")
    assert len(s.validation_errors or []) == 1


def test_phase_promotion_valid():
    """Test valid phase promotions."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5, confidence_score=0.8)
    
    # Primary to Secondary should work
    assert s.promote_phase(SamplePhase.SECONDARY)
    assert s.phase == SamplePhase.SECONDARY
    
    # Need actual outcome for further promotions
    s.update_resolution(8.0)
    
    # Secondary to Validation should work
    assert s.promote_phase(SamplePhase.VALIDATION)
    assert s.phase == SamplePhase.VALIDATION
    
    # Validation to Holdout should work
    assert s.promote_phase(SamplePhase.HOLDOUT)
    assert s.phase == SamplePhase.HOLDOUT


def test_phase_promotion_invalid():
    """Test invalid phase promotions."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    
    # Can't jump from Primary to Holdout
    assert not s.promote_phase(SamplePhase.HOLDOUT)
    assert s.phase == SamplePhase.PRIMARY
    assert len(s.validation_errors or []) > 0
    
    # Can't promote without meeting criteria
    if s.validation_errors:
        s.validation_errors.clear()
    s.phase = SamplePhase.SECONDARY
    
    # Should fail without actual outcome for validation phase
    assert not s.promote_phase(SamplePhase.VALIDATION)
    assert len(s.validation_errors or []) > 0


def test_promotion_criteria():
    """Test promotion criteria checking."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5, confidence_score=0.8)
    
    # Add validation error
    s.add_validation_error("Test error")
    
    # Should not promote to holdout with validation errors
    s.phase = SamplePhase.VALIDATION
    s.update_resolution(8.0)
    
    assert not s.promote_phase(SamplePhase.HOLDOUT)


def test_eligibility_for_calibration():
    """Test calibration eligibility checking."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    
    # Should not be eligible without resolution
    assert not s.is_eligible_for_calibration()
    
    # Add resolution
    s.update_resolution(8.0)
    assert s.is_eligible_for_calibration()
    
    # Should not be eligible with validation errors
    s.add_validation_error("Test error")
    assert not s.is_eligible_for_calibration()
    
    # Should not be eligible if retired
    if s.validation_errors:
        s.validation_errors.clear()
    s.status = SampleStatus.RETIRED
    assert not s.is_eligible_for_calibration()


def test_serialization():
    """Test sample serialization to/from dict."""
    original = build_sample(
        1, "MLB", "STRIKEOUTS_PITCHER", 7.5,
        confidence_score=0.8,
        model_version="v1.2.3"
    )
    original.update_resolution(8.0)
    original.add_validation_error("Test error")
    
    # Convert to dict
    sample_dict = original.to_dict()
    
    # Verify key fields are present
    assert sample_dict['prop_id'] == 1
    assert sample_dict['sport'] == "MLB"
    assert sample_dict['phase'] == "primary"
    assert sample_dict['status'] == "flagged"
    
    # Recreate from dict
    restored = CalibrationSample.from_dict(sample_dict)
    
    # Verify restoration
    assert restored.prop_id == original.prop_id
    assert restored.sport == original.sport
    assert restored.phase == original.phase
    assert restored.status == original.status
    assert restored.actual_value == original.actual_value
    assert restored.validation_errors == original.validation_errors


def test_edge_context():
    """Test edge context handling."""
    context = {
        'edge_id': 'test_edge_123',
        'calculation_method': 'enhanced',
        'data_source': 'primary'
    }
    
    s = build_sample(
        1, "MLB", "STRIKEOUTS_PITCHER", 7.5,
        edge_context=context
    )
    
    assert s.edge_context == context
    
    # Test with None context
    s2 = build_sample(2, "NFL", "PASSING_YARDS", 250.0)
    assert s2.edge_context == {}


def test_feature_vector_hash():
    """Test feature vector hash for reproducibility."""
    s = build_sample(
        1, "MLB", "STRIKEOUTS_PITCHER", 7.5,
        model_version="v1.0",
        confidence_score=0.8
    )
    
    # Set feature vector hash
    s.feature_vector_hash = "abc123"
    
    # Should be included in serialization
    sample_dict = s.to_dict()
    assert sample_dict['feature_vector_hash'] == "abc123"
    
    # Should be preserved in restoration
    restored = CalibrationSample.from_dict(sample_dict)
    assert restored.feature_vector_hash == "abc123"


def test_data_source_tracking():
    """Test data source attribution."""
    s = build_sample(
        1, "MLB", "STRIKEOUTS_PITCHER", 7.5,
        data_source="live_odds_feed"
    )
    
    assert s.data_source == "live_odds_feed"
    
    # Verify in serialization
    sample_dict = s.to_dict()
    assert sample_dict['data_source'] == "live_odds_feed"


def test_timestamps():
    """Test timestamp handling."""
    before = time.time()
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    after = time.time()
    
    # Created timestamp should be between before/after
    assert before <= s.created_at <= after
    assert s.updated_at == s.created_at
    assert s.resolved_at is None
    
    # Update should change updated_at
    time.sleep(0.01)
    s.add_validation_error("Test")
    assert s.updated_at > s.created_at
    
    # Resolution should set resolved_at
    s.update_resolution(8.0)
    assert s.resolved_at is not None
    assert s.resolved_at >= s.created_at


def test_multiple_validation_errors():
    """Test handling multiple validation errors."""
    s = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5)
    
    errors = ["Error 1", "Error 2", "Error 3"]
    for error in errors:
        s.add_validation_error(error)
    
    assert len(s.validation_errors or []) == 3
    for error in errors:
        assert error in (s.validation_errors or [])


def test_confidence_score_bounds():
    """Test confidence score boundary handling."""
    # Test with extreme confidence scores
    s1 = build_sample(1, "MLB", "STRIKEOUTS_PITCHER", 7.5, confidence_score=0.0)
    assert s1.confidence_score == 0.0
    
    s2 = build_sample(2, "MLB", "STRIKEOUTS_PITCHER", 7.5, confidence_score=1.0)
    assert s2.confidence_score == 1.0
    
    # Test None confidence score
    s3 = build_sample(3, "MLB", "STRIKEOUTS_PITCHER", 7.5, confidence_score=None)
    assert s3.confidence_score is None


if __name__ == "__main__":
    pytest.main([__file__])