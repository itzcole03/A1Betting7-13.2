"""
Prop Type Registry

Manages calibrated prop types and their configuration.
"""

from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass


class CalibratedPropType(str, Enum):
    """Enumeration of prop types that support calibration"""
    
    STRIKEOUTS_PITCHER = "STRIKEOUTS_PITCHER"
    HITS_BATTER = "HITS_BATTER"  # newly added
    
    # Future prop types can be added here
    # RUNS_SCORED = "RUNS_SCORED"
    # RBI_BATTER = "RBI_BATTER"
    # HOME_RUNS = "HOME_RUNS"


@dataclass
class PropTypeConfig:
    """Configuration for a specific prop type"""
    
    prop_type: CalibratedPropType
    display_name: str
    description: str
    
    # Calibration parameters
    min_sample_size: int = 50
    confidence_threshold: float = 0.7
    max_historical_days: int = 365
    
    # Reliability bins
    reliability_bins: Optional[List[str]] = None
    bin_thresholds: Optional[List[float]] = None
    
    # Feature flags
    enable_advanced_calibration: bool = True
    enable_cross_validation: bool = True
    enable_drift_detection: bool = True


class PropTypeRegistry:
    """Registry for managing calibrated prop types"""
    
    def __init__(self):
        self._prop_configs = self._initialize_prop_configs()
    
    def _initialize_prop_configs(self) -> Dict[CalibratedPropType, PropTypeConfig]:
        """Initialize default configurations for all prop types"""
        configs = {}
        
        # Strikeouts pitcher configuration
        configs[CalibratedPropType.STRIKEOUTS_PITCHER] = PropTypeConfig(
            prop_type=CalibratedPropType.STRIKEOUTS_PITCHER,
            display_name="Pitcher Strikeouts",
            description="Number of strikeouts by a pitcher in a game",
            min_sample_size=75,
            confidence_threshold=0.75,
            max_historical_days=730,  # 2 years for pitchers
            reliability_bins=["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
            bin_thresholds=[0.0, 0.55, 0.70, 0.85, 1.0],
            enable_advanced_calibration=True,
            enable_cross_validation=True,
            enable_drift_detection=True
        )
        
        # Hits batter configuration 
        configs[CalibratedPropType.HITS_BATTER] = PropTypeConfig(
            prop_type=CalibratedPropType.HITS_BATTER,
            display_name="Batter Hits",
            description="Number of hits by a batter in a game",
            min_sample_size=60,
            confidence_threshold=0.72,
            max_historical_days=365,  # 1 year for batters (more volatile)
            reliability_bins=["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
            bin_thresholds=[0.0, 0.50, 0.68, 0.82, 1.0],
            enable_advanced_calibration=True,
            enable_cross_validation=True,
            enable_drift_detection=True
        )
        
        return configs
    
    def get_config(self, prop_type: CalibratedPropType) -> Optional[PropTypeConfig]:
        """Get configuration for a prop type"""
        return self._prop_configs.get(prop_type)
    
    def get_all_configs(self) -> Dict[CalibratedPropType, PropTypeConfig]:
        """Get all prop type configurations"""
        return self._prop_configs.copy()
    
    def is_supported(self, prop_type: str) -> bool:
        """Check if a prop type is supported for calibration"""
        try:
            CalibratedPropType(prop_type)
            return True
        except ValueError:
            return False
    
    def get_supported_prop_types(self) -> List[CalibratedPropType]:
        """Get list of all supported prop types"""
        return list(CalibratedPropType)
    
    def update_config(self, prop_type: CalibratedPropType, config: PropTypeConfig):
        """Update configuration for a prop type"""
        self._prop_configs[prop_type] = config
    
    def get_reliability_bin(self, prop_type: CalibratedPropType, confidence_score: float) -> Optional[str]:
        """Get reliability bin for a confidence score"""
        config = self.get_config(prop_type)
        if not config or not config.reliability_bins or not config.bin_thresholds:
            return None
        
        # Find the appropriate bin
        for i, threshold in enumerate(config.bin_thresholds[1:], 1):
            if confidence_score <= threshold:
                return config.reliability_bins[i-1]
        
        # If above all thresholds, return highest bin
        return config.reliability_bins[-1]


# Global registry instance
prop_type_registry = PropTypeRegistry()