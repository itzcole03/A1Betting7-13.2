"""
Provider Registry - Manages market data providers and their states

Provides centralized registration, enabling/disabling, and health monitoring
of market data providers.
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.services.providers.base_provider import BaseMarketDataProvider
from backend.services.unified_logging import get_logger


class ProviderRegistry:
    """Registry for managing market data providers"""
    
    def __init__(self):
        self._providers: Dict[str, BaseMarketDataProvider] = {}
        self._provider_states: Dict[str, bool] = {}  # enabled/disabled
        self._provider_health: Dict[str, bool] = {}  # healthy/unhealthy
        self._last_health_check: Dict[str, Optional[datetime]] = {}
        self._sport_providers: Dict[str, Dict[str, BaseMarketDataProvider]] = {}  # sport -> provider mapping
        self.logger = get_logger("provider_registry")
        
    def register_provider(self, name: str, provider: BaseMarketDataProvider, sport: str = "NBA") -> None:
        """
        Register a new provider for a specific sport
        
        Args:
            name: Unique provider name
            provider: Provider instance
            sport: Sport this provider handles (default: NBA for backward compatibility)
        """
        provider_key = f"{name}_{sport}"
        
        if provider_key in self._providers:
            raise ValueError(f"Provider {name} already registered for sport {sport}")
            
        self._providers[provider_key] = provider
        self._provider_states[provider_key] = True  # Enabled by default
        self._provider_health[provider_key] = False  # Unknown health initially
        self._last_health_check[provider_key] = None
        
        # Maintain sport-based mapping
        if sport not in self._sport_providers:
            self._sport_providers[sport] = {}
        self._sport_providers[sport][name] = provider
        
        # For backward compatibility, also register without sport prefix for NBA
        if sport == "NBA":
            self._providers[name] = provider
            self._provider_states[name] = True
            self._provider_health[name] = False
            self._last_health_check[name] = None
        
        self.logger.info(f"Registered provider: {name} for sport {sport}")
        
    def unregister_provider(self, name: str, sport: Optional[str] = None) -> None:
        """
        Unregister a provider
        
        Args:
            name: Provider name to unregister
            sport: Specific sport (if None, unregisters from all sports)
        """
        if sport is None:
            # Remove from all sports
            keys_to_remove = [key for key in self._providers.keys() if key.startswith(f"{name}_") or key == name]
            for key in keys_to_remove:
                self._providers.pop(key, None)
                self._provider_states.pop(key, None)
                self._provider_health.pop(key, None)
                self._last_health_check.pop(key, None)
            
            # Clean up sport mappings
            for sport_dict in self._sport_providers.values():
                sport_dict.pop(name, None)
        else:
            provider_key = f"{name}_{sport}"
            if provider_key not in self._providers:
                raise ValueError(f"Provider {name} not found for sport {sport}")
                
            self._providers.pop(provider_key, None)
            self._provider_states.pop(provider_key, None)
            self._provider_health.pop(provider_key, None)
            self._last_health_check.pop(provider_key, None)
            
            # Clean up sport mapping
            if sport in self._sport_providers:
                self._sport_providers[sport].pop(name, None)
            
            # Remove legacy NBA entry if applicable
            if sport == "NBA":
                self._providers.pop(name, None)
                self._provider_states.pop(name, None)
                self._provider_health.pop(name, None)
                self._last_health_check.pop(name, None)
        
        self.logger.info(f"Unregistered provider: {name} for sport {sport or 'all sports'}")
        
    def enable_provider(self, name: str, sport: Optional[str] = None) -> None:
        """Enable a provider for specific sport or all sports"""
        if sport is None:
            # Enable for all sports
            keys_to_enable = [key for key in self._providers.keys() if key.startswith(f"{name}_") or key == name]
            for key in keys_to_enable:
                if key in self._provider_states:
                    self._provider_states[key] = True
        else:
            provider_key = f"{name}_{sport}"
            if provider_key not in self._providers:
                raise ValueError(f"Provider {name} not found for sport {sport}")
            self._provider_states[provider_key] = True
            # Handle legacy NBA key
            if sport == "NBA" and name in self._provider_states:
                self._provider_states[name] = True
                
        self.logger.info(f"Enabled provider: {name} for sport {sport or 'all sports'}")
        
    def disable_provider(self, name: str, sport: Optional[str] = None) -> None:
        """Disable a provider for specific sport or all sports"""
        if sport is None:
            # Disable for all sports
            keys_to_disable = [key for key in self._providers.keys() if key.startswith(f"{name}_") or key == name]
            for key in keys_to_disable:
                if key in self._provider_states:
                    self._provider_states[key] = False
        else:
            provider_key = f"{name}_{sport}"
            if provider_key not in self._providers:
                raise ValueError(f"Provider {name} not found for sport {sport}")
            self._provider_states[provider_key] = False
            # Handle legacy NBA key
            if sport == "NBA" and name in self._provider_states:
                self._provider_states[name] = False
                
        self.logger.info(f"Disabled provider: {name} for sport {sport or 'all sports'}")
        
    def get_provider(self, name: str, sport: str = "NBA") -> Optional[BaseMarketDataProvider]:
        """Get provider by name and sport (defaults to NBA for backward compatibility)"""
        provider_key = f"{name}_{sport}"
        if provider_key in self._providers:
            return self._providers[provider_key]
        
        # Fallback for legacy NBA providers
        if sport == "NBA" and name in self._providers:
            return self._providers[name]
            
        return None
    
    def get_providers_for_sport(self, sport: str) -> Dict[str, BaseMarketDataProvider]:
        """Get all providers for a specific sport"""
        return self._sport_providers.get(sport, {})
        
    def list_providers(self, sport: Optional[str] = None) -> List[str]:
        """List all registered provider names, optionally filtered by sport"""
        if sport is None:
            # Extract unique provider names (remove sport suffixes)
            names = set()
            for key in self._providers.keys():
                if '_' in key and key.split('_')[-1] in ["NBA", "NFL", "MLB", "NHL", "NCAA_BB", "NCAA_FB"]:
                    names.add('_'.join(key.split('_')[:-1]))
                else:
                    names.add(key)
            return list(names)
        else:
            return list(self._sport_providers.get(sport, {}).keys())
        
    def get_active_providers(self, sport: Optional[str] = None) -> Dict[str, BaseMarketDataProvider]:
        """Get all enabled and healthy providers, optionally filtered by sport"""
        active = {}
        
        if sport is None:
            # Get active from all sports
            for provider_key, provider in self._providers.items():
                if (self._provider_states.get(provider_key, False) and 
                    self._provider_health.get(provider_key, False)):
                    active[provider_key] = provider
        else:
            # Get active for specific sport
            sport_providers = self._sport_providers.get(sport, {})
            for name, provider in sport_providers.items():
                provider_key = f"{name}_{sport}"
                if (self._provider_states.get(provider_key, False) and 
                    self._provider_health.get(provider_key, False)):
                    active[name] = provider
                    
        return active

    def get_all_providers(self) -> Dict[str, BaseMarketDataProvider]:
        """Return a copy of all registered providers (compatibility helper)."""
        return self._providers.copy()
        
    def get_enabled_providers(self, sport: Optional[str] = None) -> Dict[str, BaseMarketDataProvider]:
        """Get all enabled providers (regardless of health), optionally filtered by sport"""
        enabled = {}
        
        if sport is None:
            # Get enabled from all sports
            for provider_key, provider in self._providers.items():
                if self._provider_states.get(provider_key, False):
                    enabled[provider_key] = provider
        else:
            # Get enabled for specific sport
            sport_providers = self._sport_providers.get(sport, {})
            for name, provider in sport_providers.items():
                provider_key = f"{name}_{sport}"
                if self._provider_states.get(provider_key, False):
                    enabled[name] = provider
                    
        return enabled
        
    def is_provider_enabled(self, name: str, sport: str = "NBA") -> bool:
        """Check if provider is enabled for specific sport"""
        provider_key = f"{name}_{sport}"
        if provider_key in self._provider_states:
            return self._provider_states[provider_key]
        
        # Fallback for legacy NBA providers
        if sport == "NBA" and name in self._provider_states:
            return self._provider_states[name]
            
        return False
        
    def is_provider_healthy(self, name: str, sport: str = "NBA") -> bool:
        """Check if provider is healthy for specific sport"""
        provider_key = f"{name}_{sport}"
        if provider_key in self._provider_health:
            return self._provider_health[provider_key]
            
        # Fallback for legacy NBA providers
        if sport == "NBA" and name in self._provider_health:
            return self._provider_health[name]
            
        return False
        
    def get_provider_status(self, name: str, sport: str = "NBA") -> Optional[Dict[str, Any]]:
        """Get comprehensive provider status for specific sport"""
        provider_key = f"{name}_{sport}"
        provider = self._providers.get(provider_key)
        
        # Fallback for legacy NBA providers  
        if not provider and sport == "NBA":
            provider = self._providers.get(name)
            provider_key = name
            
        if not provider:
            return None
            
        return {
            "name": name,
            "sport": sport,
            "enabled": self._provider_states.get(provider_key, False),
            "healthy": self._provider_health.get(provider_key, False),
            "last_health_check": self._last_health_check.get(provider_key),
            "supports_incremental": provider.supports_incremental,
            "max_batch_size": provider.max_batch_size,
            "last_fetch_timestamp": provider.get_last_fetch_timestamp()
        }
        
    def get_all_provider_status(self, sport: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """Get status for all providers, optionally filtered by sport"""
        status = {}
        
        if sport is None:
            # Get status for all providers across all sports
            for provider_key in self._providers:
                if '_' in provider_key and provider_key.split('_')[-1] in ["NBA", "NFL", "MLB", "NHL", "NCAA_BB", "NCAA_FB"]:
                    parts = provider_key.split('_')
                    name = '_'.join(parts[:-1])
                    provider_sport = parts[-1]
                    status[provider_key] = self.get_provider_status(name, provider_sport)
                else:
                    # Legacy provider (NBA)
                    status[provider_key] = self.get_provider_status(provider_key, "NBA")
        else:
            # Get status for specific sport
            sport_providers = self._sport_providers.get(sport, {})
            for name in sport_providers:
                status[name] = self.get_provider_status(name, sport)
                
        return status
        
    async def health_check_provider(self, name: str, sport: str = "NBA") -> bool:
        """
        Perform health check on specific provider for specific sport
        
        Args:
            name: Provider name
            sport: Sport to check (default NBA for backward compatibility)
            
        Returns:
            True if healthy, False otherwise
        """
        provider_key = f"{name}_{sport}"
        provider = self._providers.get(provider_key)
        
        # Fallback for legacy NBA providers
        if not provider and sport == "NBA":
            provider = self._providers.get(name)
            provider_key = name
            
        if not provider:
            return False
            
        try:
            is_healthy = await provider.health_check()
            self._provider_health[provider_key] = is_healthy
            self._last_health_check[provider_key] = datetime.utcnow()
            
            if is_healthy:
                self.logger.debug(f"Provider {name} ({sport}) health check: OK")
            else:
                self.logger.warning(f"Provider {name} ({sport}) health check: FAILED")
                
            return is_healthy
            
        except Exception as e:
            self._provider_health[provider_key] = False
            self._last_health_check[provider_key] = datetime.utcnow()
            self.logger.error(f"Provider {name} ({sport}) health check error: {str(e)}")
            return False
            
    async def health_check_all_providers(self, sport: Optional[str] = None) -> Dict[str, bool]:
        """
        Perform health check on providers concurrently
        
        Args:
            sport: Specific sport to check (if None, checks all sports)
        
        Returns:
            Dict mapping provider name to health status
        """
        if not self._providers:
            return {}
            
        tasks = []
        provider_info = []
        
        if sport is None:
            # Check all providers across all sports
            for provider_key in self._providers:
                if self._provider_states.get(provider_key, False):  # Only check enabled providers
                    if '_' in provider_key and provider_key.split('_')[-1] in ["NBA", "NFL", "MLB", "NHL", "NCAA_BB", "NCAA_FB"]:
                        parts = provider_key.split('_')
                        name = '_'.join(parts[:-1])
                        provider_sport = parts[-1]
                    else:
                        # Legacy provider (NBA)
                        name = provider_key
                        provider_sport = "NBA"
                    
                    tasks.append(self.health_check_provider(name, provider_sport))
                    provider_info.append((name, provider_sport))
        else:
            # Check providers for specific sport
            sport_providers = self._sport_providers.get(sport, {})
            for name in sport_providers:
                provider_key = f"{name}_{sport}"
                if self._provider_states.get(provider_key, False):
                    tasks.append(self.health_check_provider(name, sport))
                    provider_info.append((name, sport))
                
        if not tasks:
            return {}
            
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        health_status = {}
        for (name, provider_sport), result in zip(provider_info, results):
            provider_key = f"{name}_{provider_sport}" if provider_sport != "NBA" or name not in self._providers else name
            if isinstance(result, Exception):
                self.logger.error(f"Health check exception for {name} ({provider_sport}): {str(result)}")
                health_status[provider_key] = False
            else:
                health_status[provider_key] = result
                
        return health_status
        
    def get_registry_stats(self, sport: Optional[str] = None) -> Dict[str, Any]:
        """Get registry statistics, optionally filtered by sport"""
        if sport is None:
            # Stats across all sports
            total_providers = len(self._providers)
            enabled_providers = sum(1 for enabled in self._provider_states.values() if enabled)
            healthy_providers = sum(1 for healthy in self._provider_health.values() if healthy)
            active_providers = len(self.get_active_providers())
            
            # Sport breakdown
            sport_stats = {}
            for sport_name, providers in self._sport_providers.items():
                sport_stats[sport_name] = {
                    "total_providers": len(providers),
                    "enabled_providers": len(self.get_enabled_providers(sport_name)),
                    "active_providers": len(self.get_active_providers(sport_name))
                }
            
            return {
                "total_providers": total_providers,
                "enabled_providers": enabled_providers,
                "healthy_providers": healthy_providers,
                "active_providers": active_providers,
                "sport_breakdown": sport_stats
            }
        else:
            # Stats for specific sport
            sport_providers = self._sport_providers.get(sport, {})
            enabled_providers = len(self.get_enabled_providers(sport))
            active_providers = len(self.get_active_providers(sport))
            
            return {
                "sport": sport,
                "total_providers": len(sport_providers),
                "enabled_providers": enabled_providers,
                "active_providers": active_providers
            }


# Global registry instance
provider_registry = ProviderRegistry()


# Convenience functions
def register_provider(name: str, provider: BaseMarketDataProvider, sport: str = "NBA") -> None:
    """Register provider with global registry"""
    provider_registry.register_provider(name, provider, sport)
    

def get_provider(name: str, sport: str = "NBA") -> Optional[BaseMarketDataProvider]:
    """Get provider from global registry"""
    return provider_registry.get_provider(name, sport)
    

def get_active_providers(sport: Optional[str] = None) -> Dict[str, BaseMarketDataProvider]:
    """Get active providers from global registry"""
    return provider_registry.get_active_providers(sport)


def get_all_providers() -> Dict[str, BaseMarketDataProvider]:
    """Compatibility helper used by tests: return all registered providers."""
    return provider_registry.get_all_providers()


def enable_provider(name: str, sport: Optional[str] = None) -> None:
    """Enable provider in global registry"""
    provider_registry.enable_provider(name, sport)
    

def disable_provider(name: str, sport: Optional[str] = None) -> None:
    """Disable provider in global registry"""
    provider_registry.disable_provider(name, sport)


# Public exports for tests and callers
__all__ = [
    "ProviderRegistry",
    "provider_registry",
    "register_provider",
    "get_provider",
    "get_active_providers",
    "get_all_providers",
    "enable_provider",
    "disable_provider",
]