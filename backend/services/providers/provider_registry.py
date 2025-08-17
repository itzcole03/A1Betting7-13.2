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
        self.logger = get_logger("provider_registry")
        
    def register_provider(self, name: str, provider: BaseMarketDataProvider) -> None:
        """
        Register a new provider
        
        Args:
            name: Unique provider name
            provider: Provider instance
        """
        if name in self._providers:
            raise ValueError(f"Provider {name} already registered")
            
        self._providers[name] = provider
        self._provider_states[name] = True  # Enabled by default
        self._provider_health[name] = False  # Unknown health initially
        self._last_health_check[name] = None
        
        self.logger.info(f"Registered provider: {name}")
        
    def unregister_provider(self, name: str) -> None:
        """
        Unregister a provider
        
        Args:
            name: Provider name to unregister
        """
        if name not in self._providers:
            raise ValueError(f"Provider {name} not found")
            
        self._providers.pop(name)
        self._provider_states.pop(name, None)
        self._provider_health.pop(name, None)
        self._last_health_check.pop(name, None)
        
        self.logger.info(f"Unregistered provider: {name}")
        
    def enable_provider(self, name: str) -> None:
        """Enable a provider"""
        if name not in self._providers:
            raise ValueError(f"Provider {name} not found")
            
        self._provider_states[name] = True
        self.logger.info(f"Enabled provider: {name}")
        
    def disable_provider(self, name: str) -> None:
        """Disable a provider"""
        if name not in self._providers:
            raise ValueError(f"Provider {name} not found")
            
        self._provider_states[name] = False
        self.logger.info(f"Disabled provider: {name}")
        
    def get_provider(self, name: str) -> Optional[BaseMarketDataProvider]:
        """Get provider by name"""
        return self._providers.get(name)
        
    def list_providers(self) -> List[str]:
        """List all registered provider names"""
        return list(self._providers.keys())
        
    def get_active_providers(self) -> Dict[str, BaseMarketDataProvider]:
        """Get all enabled and healthy providers"""
        active = {}
        for name, provider in self._providers.items():
            if self._provider_states.get(name, False) and self._provider_health.get(name, False):
                active[name] = provider
        return active
        
    def get_enabled_providers(self) -> Dict[str, BaseMarketDataProvider]:
        """Get all enabled providers (regardless of health)"""
        enabled = {}
        for name, provider in self._providers.items():
            if self._provider_states.get(name, False):
                enabled[name] = provider
        return enabled
        
    def is_provider_enabled(self, name: str) -> bool:
        """Check if provider is enabled"""
        return self._provider_states.get(name, False)
        
    def is_provider_healthy(self, name: str) -> bool:
        """Check if provider is healthy"""
        return self._provider_health.get(name, False)
        
    def get_provider_status(self, name: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive provider status"""
        if name not in self._providers:
            return None
            
        provider = self._providers[name]
        return {
            "name": name,
            "enabled": self._provider_states.get(name, False),
            "healthy": self._provider_health.get(name, False),
            "last_health_check": self._last_health_check.get(name),
            "supports_incremental": provider.supports_incremental,
            "max_batch_size": provider.max_batch_size,
            "last_fetch_timestamp": provider.get_last_fetch_timestamp()
        }
        
    def get_all_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status for all providers"""
        status = {}
        for name in self._providers:
            status[name] = self.get_provider_status(name)
        return status
        
    async def health_check_provider(self, name: str) -> bool:
        """
        Perform health check on specific provider
        
        Args:
            name: Provider name
            
        Returns:
            True if healthy, False otherwise
        """
        if name not in self._providers:
            return False
            
        provider = self._providers[name]
        
        try:
            is_healthy = await provider.health_check()
            self._provider_health[name] = is_healthy
            self._last_health_check[name] = datetime.utcnow()
            
            if is_healthy:
                self.logger.debug(f"Provider {name} health check: OK")
            else:
                self.logger.warning(f"Provider {name} health check: FAILED")
                
            return is_healthy
            
        except Exception as e:
            self._provider_health[name] = False
            self._last_health_check[name] = datetime.utcnow()
            self.logger.error(f"Provider {name} health check error: {str(e)}")
            return False
            
    async def health_check_all_providers(self) -> Dict[str, bool]:
        """
        Perform health check on all providers concurrently
        
        Returns:
            Dict mapping provider name to health status
        """
        if not self._providers:
            return {}
            
        tasks = []
        provider_names = []
        
        for name in self._providers:
            if self._provider_states.get(name, False):  # Only check enabled providers
                tasks.append(self.health_check_provider(name))
                provider_names.append(name)
                
        if not tasks:
            return {}
            
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        health_status = {}
        for name, result in zip(provider_names, results):
            if isinstance(result, Exception):
                self.logger.error(f"Health check exception for {name}: {str(result)}")
                health_status[name] = False
            else:
                health_status[name] = result
                
        return health_status
        
    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        total_providers = len(self._providers)
        enabled_providers = sum(1 for enabled in self._provider_states.values() if enabled)
        healthy_providers = sum(1 for healthy in self._provider_health.values() if healthy)
        
        return {
            "total_providers": total_providers,
            "enabled_providers": enabled_providers,
            "healthy_providers": healthy_providers,
            "active_providers": len(self.get_active_providers())
        }


# Global registry instance
provider_registry = ProviderRegistry()


# Convenience functions
def register_provider(name: str, provider: BaseMarketDataProvider) -> None:
    """Register provider with global registry"""
    provider_registry.register_provider(name, provider)
    

def get_provider(name: str) -> Optional[BaseMarketDataProvider]:
    """Get provider from global registry"""
    return provider_registry.get_provider(name)
    

def get_active_providers() -> Dict[str, BaseMarketDataProvider]:
    """Get active providers from global registry"""
    return provider_registry.get_active_providers()


def enable_provider(name: str) -> None:
    """Enable provider in global registry"""
    provider_registry.enable_provider(name)
    

def disable_provider(name: str) -> None:
    """Disable provider in global registry"""
    provider_registry.disable_provider(name)