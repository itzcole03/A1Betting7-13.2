"""
Core Services Package
Consolidated core services for A1Betting platform
"""

from .unified_cache_service import (
    UnifiedCacheService,
    CacheConfig,
    CacheLevel,
    CacheStrategy,
    CacheStats,
    get_cache,
    cache_context,
    cache_get,
    cache_set,
    cache_delete,
    cache_decorator
)

from .unified_data_service import (
    UnifiedDataService,
    DataSourceConfig,
    DataSourceType,
    DataQuality,
    DataValidationRule,
    DataValidationResult,
    DataMetrics,
    DataSourceAdapter,
    ESPNAdapter,
    SportsRadarAdapter,
    PrizePicksAdapter,
    DataValidator,
    get_data_service,
    data_service_context,
    fetch_data,
    fetch_aggregated_data,
    register_data_source
)

__all__ = [
    # Cache Service
    'UnifiedCacheService',
    'CacheConfig',
    'CacheLevel',
    'CacheStrategy',
    'CacheStats',
    'get_cache',
    'cache_context',
    'cache_get',
    'cache_set',
    'cache_delete',
    'cache_decorator',
    
    # Data Service
    'UnifiedDataService',
    'DataSourceConfig',
    'DataSourceType',
    'DataQuality',
    'DataValidationRule',
    'DataValidationResult',
    'DataMetrics',
    'DataSourceAdapter',
    'ESPNAdapter',
    'SportsRadarAdapter',
    'PrizePicksAdapter',
    'DataValidator',
    'get_data_service',
    'data_service_context',
    'fetch_data',
    'fetch_aggregated_data',
    'register_data_source',
]

# Version information
__version__ = "1.0.0"
__author__ = "A1Betting Development Team"
__description__ = "Unified core services for A1Betting platform"
