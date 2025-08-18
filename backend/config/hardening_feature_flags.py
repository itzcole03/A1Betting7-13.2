"""
Hardening Bundle Feature Flags Configuration

This module provides centralized feature flag management for all hardening components,
allowing for gradual rollout and controlled deployment of stability improvements.
"""

from dataclasses import dataclass
from typing import Optional
import os


@dataclass(frozen=True)
class HardeningFeatureFlags:
    """
    Feature flags for hardening bundle components.
    
    These flags allow for gradual rollout of hardening features and can be
    controlled via environment variables for different deployment environments.
    """
    
    # Confidence & Edge Behavior
    edges_confidence_anomaly_detection_enabled: bool = True
    edges_retirement_attribution_enabled: bool = True
    edges_confidence_threshold_enforcement: bool = False
    
    # Calibration System
    calibration_extended_schema_enabled: bool = True
    calibration_sample_integrity_checks: bool = True
    calibration_phase_tracking_enabled: bool = True
    
    # Portfolio & Experimentation
    portfolio_ab_testing_enabled: bool = False
    model_promotion_evaluation_enabled: bool = False
    experimental_edge_strategies_enabled: bool = False
    
    # Monitoring & Reporting
    daily_delta_reporting_enabled: bool = True
    integrity_dashboard_enabled: bool = True
    enhanced_metrics_collection: bool = True
    
    # Performance & Safety
    confidence_compute_optimizations: bool = True
    metric_cardinality_protection: bool = True
    graceful_degradation_enabled: bool = True

    @classmethod
    def from_environment(cls) -> 'HardeningFeatureFlags':
        """
        Create feature flags instance from environment variables.
        
        Environment variables should be prefixed with 'HARDENING_' and use
        uppercase names matching the field names.
        
        Example:
            HARDENING_EDGES_CONFIDENCE_ANOMALY_DETECTION_ENABLED=true
            HARDENING_PORTFOLIO_AB_TESTING_ENABLED=false
        """
        def get_bool_env(key: str, default: bool) -> bool:
            value = os.getenv(f"HARDENING_{key.upper()}", str(default)).lower()
            return value in ('true', '1', 'yes', 'on')
        
        return cls(
            # Confidence & Edge Behavior
            edges_confidence_anomaly_detection_enabled=get_bool_env(
                "edges_confidence_anomaly_detection_enabled", True
            ),
            edges_retirement_attribution_enabled=get_bool_env(
                "edges_retirement_attribution_enabled", True
            ),
            edges_confidence_threshold_enforcement=get_bool_env(
                "edges_confidence_threshold_enforcement", False
            ),
            
            # Calibration System
            calibration_extended_schema_enabled=get_bool_env(
                "calibration_extended_schema_enabled", True
            ),
            calibration_sample_integrity_checks=get_bool_env(
                "calibration_sample_integrity_checks", True
            ),
            calibration_phase_tracking_enabled=get_bool_env(
                "calibration_phase_tracking_enabled", True
            ),
            
            # Portfolio & Experimentation
            portfolio_ab_testing_enabled=get_bool_env(
                "portfolio_ab_testing_enabled", False
            ),
            model_promotion_evaluation_enabled=get_bool_env(
                "model_promotion_evaluation_enabled", False
            ),
            experimental_edge_strategies_enabled=get_bool_env(
                "experimental_edge_strategies_enabled", False
            ),
            
            # Monitoring & Reporting
            daily_delta_reporting_enabled=get_bool_env(
                "daily_delta_reporting_enabled", True
            ),
            integrity_dashboard_enabled=get_bool_env(
                "integrity_dashboard_enabled", True
            ),
            enhanced_metrics_collection=get_bool_env(
                "enhanced_metrics_collection", True
            ),
            
            # Performance & Safety
            confidence_compute_optimizations=get_bool_env(
                "confidence_compute_optimizations", True
            ),
            metric_cardinality_protection=get_bool_env(
                "metric_cardinality_protection", True
            ),
            graceful_degradation_enabled=get_bool_env(
                "graceful_degradation_enabled", True
            ),
        )

    def is_edge_hardening_enabled(self) -> bool:
        """Check if any edge hardening features are enabled."""
        return (
            self.edges_confidence_anomaly_detection_enabled or
            self.edges_retirement_attribution_enabled or
            self.edges_confidence_threshold_enforcement
        )
    
    def is_experimentation_enabled(self) -> bool:
        """Check if experimentation features are enabled."""
        return (
            self.portfolio_ab_testing_enabled or
            self.model_promotion_evaluation_enabled or
            self.experimental_edge_strategies_enabled
        )
    
    def is_monitoring_enhanced(self) -> bool:
        """Check if enhanced monitoring is enabled."""
        return (
            self.daily_delta_reporting_enabled or
            self.integrity_dashboard_enabled or
            self.enhanced_metrics_collection
        )


# Global instance - initialized from environment by default
_feature_flags: Optional[HardeningFeatureFlags] = None


def get_hardening_flags() -> HardeningFeatureFlags:
    """
    Get the global hardening feature flags instance.
    
    On first call, initializes from environment variables.
    Subsequent calls return the cached instance.
    """
    global _feature_flags
    if _feature_flags is None:
        _feature_flags = HardeningFeatureFlags.from_environment()
    return _feature_flags


def set_hardening_flags(flags: HardeningFeatureFlags) -> None:
    """
    Set custom feature flags instance (primarily for testing).
    
    Args:
        flags: Custom feature flags configuration
    """
    global _feature_flags
    _feature_flags = flags


def reset_hardening_flags() -> None:
    """
    Reset feature flags to reload from environment (primarily for testing).
    """
    global _feature_flags
    _feature_flags = None