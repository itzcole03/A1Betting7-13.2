"""
Sport-specific configuration management

Provides sport-aware configuration for polling intervals, provider mappings,
and sport-specific feature flags.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from backend.services.unified_config import unified_config


@dataclass(frozen=True)
class SportConfig:
    """Configuration for a specific sport"""
    name: str
    enabled: bool = False
    polling_interval_sec: int = 30
    enabled_providers: Optional[List[str]] = None
    priority_provider: str = "stub"
    data_retention_days: int = 180
    ingestion_limit: int = 500
    timeout_sec: int = 30
    max_retries: int = 3
    
    def __post_init__(self):
        if self.enabled_providers is None:
            # Use object.__setattr__ for frozen dataclass
            object.__setattr__(self, 'enabled_providers', ["stub"])


class SportConfigManager:
    """Manages sport-specific configurations"""
    
    def __init__(self):
        self._sport_configs: Dict[str, SportConfig] = {}
        self._initialize_sport_configs()
    
    def _initialize_sport_configs(self):
        """Initialize sport configurations from unified config"""
        sports_config = unified_config.get_config().sports
        
        # Create sport configs from unified config
        for sport, enabled in sports_config.sports_enabled.items():
            poll_interval = sports_config.polling_intervals.get(sport, 30)
            
            # Get provider config for sport
            provider_config = sports_config.provider_configs.get(sport, {})
            enabled_providers = provider_config.get("enabled_providers", ["stub"])
            priority_provider = provider_config.get("priority_provider", "stub")
            timeout_sec = provider_config.get("timeout_sec", 30)
            max_retries = provider_config.get("max_retries", 3)
            
            # Get retention and limits
            retention_days = sports_config.data_retention_days.get(sport, 180)
            ingestion_limit = sports_config.ingestion_limits.get(sport, 500)
            
            sport_config = SportConfig(
                name=sport,
                enabled=enabled,
                polling_interval_sec=poll_interval,
                enabled_providers=enabled_providers,
                priority_provider=priority_provider,
                data_retention_days=retention_days,
                ingestion_limit=ingestion_limit,
                timeout_sec=timeout_sec,
                max_retries=max_retries
            )
            
            self._sport_configs[sport] = sport_config
    
    def get_sport_config(self, sport: str) -> Optional[SportConfig]:
        """Get configuration for specific sport"""
        return self._sport_configs.get(sport)
    
    def get_enabled_sports(self) -> List[str]:
        """Get list of enabled sports"""
        return [sport for sport, config in self._sport_configs.items() if config.enabled]
    
    def get_all_sports(self) -> List[str]:
        """Get list of all configured sports"""
        return list(self._sport_configs.keys())
    
    def is_sport_enabled(self, sport: str) -> bool:
        """Check if sport is enabled"""
        config = self.get_sport_config(sport)
        return config.enabled if config else False
    
    def get_default_sport(self) -> str:
        """Get default sport"""
        return unified_config.get_config().sports.default_sport
    
    def get_polling_interval(self, sport: str) -> int:
        """Get polling interval for sport"""
        config = self.get_sport_config(sport)
        return config.polling_interval_sec if config else 30
    
    def get_enabled_providers(self, sport: str) -> List[str]:
        """Get enabled providers for sport"""
        config = self.get_sport_config(sport)
        return config.enabled_providers or ["stub"] if config else ["stub"]
    
    def get_priority_provider(self, sport: str) -> str:
        """Get priority provider for sport"""
        config = self.get_sport_config(sport)
        return config.priority_provider if config else "stub"
    
    def get_data_retention_days(self, sport: str) -> int:
        """Get data retention period for sport"""
        config = self.get_sport_config(sport)
        return config.data_retention_days if config else 180
    
    def get_ingestion_limit(self, sport: str) -> int:
        """Get ingestion limit for sport"""
        config = self.get_sport_config(sport)
        return config.ingestion_limit if config else 500
    
    def get_timeout_sec(self, sport: str) -> int:
        """Get timeout for sport providers"""
        config = self.get_sport_config(sport)
        return config.timeout_sec if config else 30
    
    def get_max_retries(self, sport: str) -> int:
        """Get max retries for sport providers"""
        config = self.get_sport_config(sport)
        return config.max_retries if config else 3
    
    def get_sport_summary(self) -> Dict[str, Dict[str, Any]]:
        """Get summary of all sport configurations"""
        return {
            sport: {
                "enabled": config.enabled,
                "polling_interval_sec": config.polling_interval_sec,
                "enabled_providers": config.enabled_providers or ["stub"],
                "priority_provider": config.priority_provider,
                "data_retention_days": config.data_retention_days,
                "ingestion_limit": config.ingestion_limit,
                "timeout_sec": config.timeout_sec,
                "max_retries": config.max_retries
            }
            for sport, config in self._sport_configs.items()
        }
    
    def validate_sport(self, sport: str) -> bool:
        """Validate if sport is supported"""
        return sport in self._sport_configs
    
    def get_sport_or_default(self, sport: Optional[str]) -> str:
        """Get sport or default if None/invalid"""
        if sport is None:
            return self.get_default_sport()
        
        if not self.validate_sport(sport):
            return self.get_default_sport()
            
        return sport


# Global sport config manager
sport_config_manager = SportConfigManager()


# Convenience functions
def get_sport_config(sport: str) -> Optional[SportConfig]:
    """Get sport configuration"""
    return sport_config_manager.get_sport_config(sport)


def get_enabled_sports() -> List[str]:
    """Get enabled sports"""
    return sport_config_manager.get_enabled_sports()


def is_sport_enabled(sport: str) -> bool:
    """Check if sport is enabled"""
    return sport_config_manager.is_sport_enabled(sport)


def get_default_sport() -> str:
    """Get default sport"""
    return sport_config_manager.get_default_sport()


def get_sport_or_default(sport: Optional[str]) -> str:
    """Get sport or default if None/invalid"""
    return sport_config_manager.get_sport_or_default(sport)


def get_polling_interval(sport: str) -> int:
    """Get polling interval for sport"""
    return sport_config_manager.get_polling_interval(sport)


def get_enabled_providers(sport: str) -> List[str]:
    """Get enabled providers for sport"""
    return sport_config_manager.get_enabled_providers(sport)


def get_priority_provider(sport: str) -> str:
    """Get priority provider for sport"""  
    return sport_config_manager.get_priority_provider(sport)


def validate_sport(sport: str) -> bool:
    """Validate if sport is supported"""
    return sport_config_manager.validate_sport(sport)


# Export all public interfaces
__all__ = [
    'SportConfig',
    'SportConfigManager', 
    'sport_config_manager',
    'get_sport_config',
    'get_enabled_sports',
    'is_sport_enabled',
    'get_default_sport',
    'get_sport_or_default',
    'get_polling_interval',
    'get_enabled_providers',
    'get_priority_provider',
    'validate_sport'
]