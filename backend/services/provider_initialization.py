"""
Provider Initialization Service

Handles startup registration of market data providers with proper
sport-specific configuration and health monitoring setup.
"""

from typing import Dict, List, Optional, Any
from backend.services.providers import register_provider, provider_registry
from backend.services.unified_logging import get_logger
from backend.config.sport_settings import get_enabled_sports, get_enabled_providers

logger = get_logger("provider_initialization")


async def initialize_providers() -> Dict[str, Any]:
    """
    Initialize and register all enabled market data providers
    
    Returns:
        Dict with initialization summary
    """
    logger.info("🚀 Starting provider initialization...")
    
    summary = {
        "total_registered": 0,
        "successful_registrations": [],
        "failed_registrations": [],
        "enabled_sports": [],
        "provider_breakdown": {}
    }
    
    try:
        # Get enabled sports from configuration
        enabled_sports = get_enabled_sports()
        summary["enabled_sports"] = enabled_sports
        
        logger.info(f"Enabled sports: {enabled_sports}")
        
        for sport in enabled_sports:
            logger.info(f"Initializing providers for {sport}...")
            
            # Get enabled providers for this sport
            enabled_provider_names = get_enabled_providers(sport)
            sport_registrations = []
            
            for provider_name in enabled_provider_names:
                try:
                    provider_instance = await _create_provider_instance(provider_name, sport)
                    
                    if provider_instance:
                        # Register with provider registry
                        register_provider(provider_name, provider_instance, sport)
                        
                        # Perform health check
                        health_check_passed = await provider_registry.health_check_provider(provider_name, sport)
                        
                        registration_info = {
                            "provider": provider_name,
                            "sport": sport,
                            "healthy": health_check_passed,
                            "supports_incremental": provider_instance.supports_incremental,
                            "max_batch_size": provider_instance.max_batch_size,
                            "supported_sports": list(provider_instance.supported_sports)
                        }
                        
                        sport_registrations.append(registration_info)
                        summary["successful_registrations"].append(f"{provider_name}_{sport}")
                        summary["total_registered"] += 1
                        
                        logger.info(f"✅ Registered {provider_name} for {sport} - healthy: {health_check_passed}")
                    else:
                        summary["failed_registrations"].append(f"{provider_name}_{sport}")
                        logger.warning(f"❌ Failed to create provider instance: {provider_name} for {sport}")
                        
                except Exception as e:
                    summary["failed_registrations"].append(f"{provider_name}_{sport}")
                    logger.error(f"❌ Failed to register {provider_name} for {sport}: {str(e)}")
            
            summary["provider_breakdown"][sport] = sport_registrations
        
        # Log summary
        logger.info(f"✅ Provider initialization completed:")
        logger.info(f"   Total registered: {summary['total_registered']}")
        logger.info(f"   Successful: {len(summary['successful_registrations'])}")
        logger.info(f"   Failed: {len(summary['failed_registrations'])}")
        
        if summary["failed_registrations"]:
            logger.warning(f"   Failed registrations: {summary['failed_registrations']}")
        
        return summary
        
    except Exception as e:
        logger.error(f"❌ Provider initialization failed: {str(e)}")
        summary["initialization_error"] = str(e)
        return summary


async def _create_provider_instance(provider_name: str, sport: str):
    """
    Create provider instance based on name and sport
    
    Args:
        provider_name: Name of the provider to create
        sport: Sport the provider will handle
    
    Returns:
        Provider instance or None if creation fails
    """
    try:
        # Handle sample providers
        if provider_name == "sample_provider_a":
            from backend.services.providers.adapters import SampleProviderA
            return SampleProviderA()
        
        elif provider_name == "sample_provider_b":
            from backend.services.providers.adapters import SampleProviderB
            return SampleProviderB()
        
        elif provider_name == "sample_mlb" and sport == "MLB":
            from backend.services.providers.adapters import SampleMLBProvider
            return SampleMLBProvider()
        
        elif provider_name == "stub":
            # Create sport-specific stub providers
            if sport == "MLB":
                from backend.services.providers.adapters import SampleMLBProvider
                return SampleMLBProvider()
            elif sport == "NBA":
                from backend.services.providers.adapters import SampleProviderA
                return SampleProviderA()
            else:
                logger.warning(f"No stub provider available for sport: {sport}")
                return None
        
        # Handle real providers (when implemented)
        elif provider_name in ["draftkings", "fanduel", "betmgm", "theodds", "sportsradar"]:
            logger.info(f"Real provider {provider_name} not implemented yet, skipping")
            return None
        
        else:
            logger.warning(f"Unknown provider: {provider_name}")
            return None
            
    except ImportError as e:
        logger.error(f"Failed to import provider {provider_name}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Failed to create provider instance {provider_name}: {str(e)}")
        return None


async def get_provider_summary() -> Dict[str, Any]:
    """Get summary of all registered providers"""
    return {
        "registry_stats": provider_registry.get_registry_stats(),
        "provider_status": provider_registry.get_all_provider_status()
    }


async def shutdown_providers() -> None:
    """Shutdown all providers during application shutdown"""
    logger.info("🔄 Shutting down providers...")
    
    try:
        # Get all registered providers
        all_providers = provider_registry.get_all_provider_status()
        
        shutdown_count = 0
        for provider_key, status in all_providers.items():
            if status:
                try:
                    provider_name = status["name"]
                    sport = status["sport"]
                    
                    # Disable provider
                    provider_registry.disable_provider(provider_name, sport)
                    shutdown_count += 1
                    
                    logger.debug(f"Disabled provider: {provider_name} for {sport}")
                    
                except Exception as e:
                    logger.warning(f"Error disabling provider {provider_key}: {str(e)}")
        
        logger.info(f"✅ Provider shutdown completed - disabled {shutdown_count} providers")
        
    except Exception as e:
        logger.error(f"❌ Provider shutdown failed: {str(e)}")


# Public interfaces
__all__ = [
    'initialize_providers',
    'get_provider_summary', 
    'shutdown_providers'
]