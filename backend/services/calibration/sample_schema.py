"""
Calibration Sample Schema Extension

This module provides an extended schema for calibration samples, supporting
improved tracking of sample integrity, confidence scoring, and phase management.
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List
from enum import Enum
import hashlib
import time
import json


class SamplePhase(Enum):
    """Enumeration of sample phases for calibration tracking."""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    VALIDATION = "validation"
    HOLDOUT = "holdout"


class SampleStatus(Enum):
    """Enumeration of sample status values."""
    ACTIVE = "active"
    RETIRED = "retired"
    FLAGGED = "flagged"
    UNDER_REVIEW = "under_review"


@dataclass
class CalibrationSample:
    """
    Extended calibration sample with enhanced tracking and integrity verification.
    
    This schema supports multi-phase calibration, confidence scoring, and
    comprehensive sample metadata for improved calibration reliability.
    """
    
    # Core identification
    prop_id: int
    sport: str
    prop_type: str
    sample_id: str
    
    # Sample data
    predicted_value: float
    actual_value: Optional[float] = None
    confidence_score: Optional[float] = None
    
    # Phase and status tracking
    phase: SamplePhase = SamplePhase.PRIMARY
    status: SampleStatus = SampleStatus.ACTIVE
    
    # Timing information
    created_at: float = 0.0
    updated_at: float = 0.0
    resolved_at: Optional[float] = None
    
    # Integrity and validation
    integrity_hash: Optional[str] = None
    validation_errors: Optional[List[str]] = None
    calibration_gap: Optional[float] = None
    
    # Metadata and attribution
    model_version: Optional[str] = None
    feature_vector_hash: Optional[str] = None
    data_source: Optional[str] = None
    edge_context: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        """Initialize computed fields and defaults."""
        if self.created_at == 0.0:
            self.created_at = time.time()
        
        if self.updated_at == 0.0:
            self.updated_at = self.created_at
        
        if self.sample_id == "":
            self.sample_id = self._generate_sample_id()
        
        if self.validation_errors is None:
            self.validation_errors = []
        
        if self.edge_context is None:
            self.edge_context = {}
        
        # Generate integrity hash if not provided
        if self.integrity_hash is None:
            self.integrity_hash = self._compute_integrity_hash()
    
    def _generate_sample_id(self) -> str:
        """Generate a unique sample ID based on core attributes."""
        components = [
            str(self.prop_id),
            self.sport,
            self.prop_type,
            str(self.predicted_value),
            str(self.created_at)
        ]
        content = "|".join(components)
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _compute_integrity_hash(self) -> str:
        """Compute integrity hash for tamper detection."""
        # Include core immutable fields in integrity hash
        integrity_data = {
            'prop_id': self.prop_id,
            'sport': self.sport,
            'prop_type': self.prop_type,
            'predicted_value': self.predicted_value,
            'created_at': self.created_at,
            'model_version': self.model_version,
            'feature_vector_hash': self.feature_vector_hash
        }
        
        content = json.dumps(integrity_data, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()
    
    def verify_integrity(self) -> bool:
        """Verify sample integrity against stored hash."""
        current_hash = self._compute_integrity_hash()
        return current_hash == self.integrity_hash
    
    def update_resolution(self, actual_value: float, resolved_at: Optional[float] = None) -> None:
        """Update sample with actual outcome and calculate calibration gap."""
        self.actual_value = actual_value
        self.resolved_at = resolved_at or time.time()
        self.updated_at = time.time()
        
        # Calculate calibration gap
        if self.predicted_value is not None:
            self.calibration_gap = abs(self.predicted_value - actual_value)
    
    def add_validation_error(self, error: str) -> None:
        """Add a validation error to the sample."""
        if self.validation_errors is None:
            self.validation_errors = []
            
        if error not in self.validation_errors:
            self.validation_errors.append(error)
            self.updated_at = time.time()
            
            # Flag sample if validation errors are present
            if self.status == SampleStatus.ACTIVE:
                self.status = SampleStatus.FLAGGED
    
    def promote_phase(self, new_phase: SamplePhase) -> bool:
        """
        Promote sample to a new phase with validation.
        
        Args:
            new_phase: Target phase for promotion
            
        Returns:
            bool: True if promotion was successful, False otherwise
        """
        # Define valid phase transitions
        valid_transitions = {
            SamplePhase.PRIMARY: [SamplePhase.SECONDARY, SamplePhase.VALIDATION],
            SamplePhase.SECONDARY: [SamplePhase.VALIDATION, SamplePhase.HOLDOUT],
            SamplePhase.VALIDATION: [SamplePhase.HOLDOUT],
            SamplePhase.HOLDOUT: []  # Terminal phase
        }
        
        if new_phase not in valid_transitions.get(self.phase, []):
            self.add_validation_error(f"Invalid phase transition: {self.phase.value} -> {new_phase.value}")
            return False
        
        # Check if sample meets promotion criteria
        if not self._meets_promotion_criteria(new_phase):
            self.add_validation_error(f"Sample does not meet criteria for {new_phase.value} phase")
            return False
        
        self.phase = new_phase
        self.updated_at = time.time()
        return True
    
    def _meets_promotion_criteria(self, target_phase: SamplePhase) -> bool:
        """Check if sample meets criteria for phase promotion."""
        # Must be resolved for most promotions
        if target_phase != SamplePhase.SECONDARY and self.actual_value is None:
            return False
        
        # Must have confidence score for validation/holdout
        if target_phase in [SamplePhase.VALIDATION, SamplePhase.HOLDOUT]:
            if self.confidence_score is None:
                return False
        
        # Must not have validation errors for final phases
        if target_phase == SamplePhase.HOLDOUT:
            if self.validation_errors:
                return False
        
        # Must verify integrity
        if not self.verify_integrity():
            return False
        
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert sample to dictionary representation."""
        result = asdict(self)
        
        # Convert enums to string values
        result['phase'] = self.phase.value
        result['status'] = self.status.value
        
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> CalibrationSample:
        """Create sample from dictionary representation."""
        # Convert string enums back to enum objects
        if 'phase' in data:
            data['phase'] = SamplePhase(data['phase'])
        
        if 'status' in data:
            data['status'] = SampleStatus(data['status'])
        
        return cls(**data)
    
    def is_eligible_for_calibration(self) -> bool:
        """Check if sample is eligible for calibration calculations."""
        return (
            self.status == SampleStatus.ACTIVE and
            self.actual_value is not None and
            self.calibration_gap is not None and
            not (self.validation_errors or []) and
            self.verify_integrity()
        )


def build_sample(
    prop_id: int,
    sport: str,
    prop_type: str,
    predicted_value: float,
    confidence_score: Optional[float] = None,
    model_version: Optional[str] = None,
    data_source: Optional[str] = None,
    phase: SamplePhase = SamplePhase.PRIMARY,
    edge_context: Optional[Dict[str, Any]] = None
) -> CalibrationSample:
    """
    Builder function for creating calibration samples with proper defaults.
    
    Args:
        prop_id: Unique proposition identifier
        sport: Sport category (e.g., "MLB", "NFL")
        prop_type: Type of proposition (e.g., "STRIKEOUTS_PITCHER", "PASSING_YARDS")
        predicted_value: Model prediction for the prop
        confidence_score: Optional confidence score for the prediction
        model_version: Optional model version identifier
        data_source: Optional data source identifier
        phase: Sample phase (defaults to PRIMARY)
        edge_context: Optional contextual information about the edge
        
    Returns:
        CalibrationSample: Configured calibration sample
    """
    return CalibrationSample(
        prop_id=prop_id,
        sport=sport,
        prop_type=prop_type,
        predicted_value=predicted_value,
        confidence_score=confidence_score,
        model_version=model_version,
        data_source=data_source,
        phase=phase,
        edge_context=edge_context or {},
        sample_id=""  # Will be auto-generated in __post_init__
    )