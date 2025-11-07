"""
Cache Keys Service

Provides versioned, namespaced cache key generation with consistent patterns:
- Versioned keys: {cache_version}:{tier}:{entity}:{id|hash}
- Stable hashing for complex identifiers
- Namespace and tier management
- Cache key parsing and validation

Supports cache invalidation strategies and version management.
"""

import os
import hashlib
import logging
from typing import Optional, Dict, List, Tuple, Any, Union
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

# Cache version from environment
CACHE_VERSION = os.getenv("A1_CACHE_VERSION", "v1")


class CacheTier(Enum):
    """Standard cache tiers for data organization"""
    
    RAW_PROVIDER = "raw_provider"           # Raw data from external APIs
    NORMALIZED_PROPS = "normalized_props"   # Normalized prop data
    DERIVED_EDGES = "derived_edges"         # Computed edges and insights
    USER_PREFERENCES = "user_prefs"         # User-specific cached data
    ANALYTICS = "analytics"                 # Analytics and aggregations
    METADATA = "metadata"                   # System metadata and configs
    TEMPORARY = "temp"                      # Short-lived temporary data


class CacheEntity(Enum):
    """Standard cache entities for consistent naming"""
    
    # Sports entities
    GAME = "game"
    PLAYER = "player"
    TEAM = "team"
    SEASON = "season"
    
    # Betting entities
    PROP = "prop"
    LINE = "line"
    ODDS = "odds"
    BET = "bet"
    
    # User entities
    USER = "user"
    SESSION = "session"
    PREFERENCE = "preference"
    
    # System entities
    CONFIG = "config"
    HEALTH = "health"
    METRICS = "metrics"
    
    # Data entities
    FEED = "feed"
    ANALYSIS = "analysis"
    PREDICTION = "prediction"


@dataclass
class ParsedCacheKey:
    """Parsed cache key components"""
    
    version: str
    tier: str
    entity: str
    identifier: str
    raw_key: str
    
    @property
    def namespace(self) -> str:
        """Get the namespace (tier) for this key"""
        return self.tier
    
    @property
    def is_versioned(self) -> bool:
        """Check if key follows versioned format"""
        return ":" in self.raw_key and len(self.raw_key.split(":")) >= 4


class CacheKeyBuilder:
    """
    Cache key builder with versioning and namespace support
    
    Generates consistent, versioned cache keys with stable hashing
    for complex identifiers and entity relationships.
    """
    
    def __init__(self, cache_version: Optional[str] = None):
        self.cache_version = cache_version or CACHE_VERSION
        self.hash_algorithm = "sha256"
        
        # Key format validation regex
        import re
        self._key_pattern = re.compile(
            r"^v\d+:[a-z_]+:[a-z_]+:[a-zA-Z0-9\-_\.]+(?::[a-zA-Z0-9\-_\.]+)*$"
        )
    
    def build_key(
        self,
        tier: Union[CacheTier, str],
        entity: Union[CacheEntity, str], 
        identifier: Union[str, int, Dict[str, Any]],
        extra_hash: Optional[str] = None,
        sub_keys: Optional[List[str]] = None
    ) -> str:
        """
        Build a versioned cache key with consistent format
        
        Args:
            tier: Cache tier (data organization level)
            entity: Entity type being cached
            identifier: Unique identifier (can be complex object)
            extra_hash: Additional data to include in hash
            sub_keys: Additional key components for hierarchical keys
        
        Returns:
            Formatted cache key: {version}:{tier}:{entity}:{id}[:sub_keys]
        """
        # Normalize inputs
        tier_str = tier.value if isinstance(tier, CacheTier) else str(tier)
        entity_str = entity.value if isinstance(entity, CacheEntity) else str(entity)
        
        # Convert identifier to stable string
        id_str = self._stable_identifier(identifier, extra_hash)
        
        # Build base key
        key_parts = [self.cache_version, tier_str, entity_str, id_str]
        
        # Add sub-keys if provided
        if sub_keys:
            key_parts.extend([str(k) for k in sub_keys])
        
        cache_key = ":".join(key_parts)
        
        # Validate key format
        if not self._validate_key_format(cache_key):
            logger.warning(f"Generated key may not follow standard format: {cache_key}")
        
        logger.debug(f"🔑 Built cache key: {cache_key}")
        return cache_key
    
    def build_pattern(
        self,
        tier: Union[CacheTier, str, None] = None,
        entity: Union[CacheEntity, str, None] = None,
        identifier_pattern: str = "*"
    ) -> str:
        """
        Build a cache key pattern for bulk operations
        
        Args:
            tier: Cache tier (None for all tiers)
            entity: Entity type (None for all entities)  
            identifier_pattern: Pattern for identifier matching
        
        Returns:
            Cache key pattern with wildcards
        """
        tier_part = tier.value if isinstance(tier, CacheTier) else (tier or "*")
        entity_part = entity.value if isinstance(entity, CacheEntity) else (entity or "*")
        
        pattern = f"{self.cache_version}:{tier_part}:{entity_part}:{identifier_pattern}"
        
        logger.debug(f"🎯 Built cache pattern: {pattern}")
        return pattern
    
    def parse_key(self, cache_key: str) -> Optional[ParsedCacheKey]:
        """
        Parse a cache key into its components
        
        Args:
            cache_key: Cache key to parse
            
        Returns:
            ParsedCacheKey object or None if parsing fails
        """
        try:
            parts = cache_key.split(":")
            
            if len(parts) < 4:
                logger.debug(f"Key doesn't follow versioned format: {cache_key}")
                return None
            
            version = parts[0]
            tier = parts[1]
            entity = parts[2]
            identifier = ":".join(parts[3:])  # Join remaining parts as identifier
            
            return ParsedCacheKey(
                version=version,
                tier=tier,
                entity=entity,
                identifier=identifier,
                raw_key=cache_key
            )
            
        except Exception as e:
            logger.warning(f"Failed to parse cache key '{cache_key}': {e}")
            return None
    
    def get_namespace_keys(self, namespace: str, all_keys: List[str]) -> List[str]:
        """
        Filter keys by namespace (tier)
        
        Args:
            namespace: Namespace to filter by
            all_keys: All available cache keys
            
        Returns:
            Keys belonging to the specified namespace
        """
        namespace_keys = []
        
        for key in all_keys:
            parsed = self.parse_key(key)
            if parsed and parsed.tier == namespace:
                namespace_keys.append(key)
        
        return namespace_keys
    
    def group_keys_by_namespace(self, keys: List[str]) -> Dict[str, List[str]]:
        """
        Group cache keys by their namespace (tier)
        
        Args:
            keys: List of cache keys to group
            
        Returns:
            Dictionary mapping namespace -> list of keys
        """
        grouped = {}
        
        for key in keys:
            parsed = self.parse_key(key)
            if parsed:
                namespace = parsed.tier
                if namespace not in grouped:
                    grouped[namespace] = []
                grouped[namespace].append(key)
            else:
                # Handle non-versioned keys
                if "legacy" not in grouped:
                    grouped["legacy"] = []
                grouped["legacy"].append(key)
        
        return grouped
    
    def is_version_compatible(self, cache_key: str) -> bool:
        """
        Check if cache key version is compatible with current version
        
        Args:
            cache_key: Cache key to check
            
        Returns:
            True if version is compatible
        """
        parsed = self.parse_key(cache_key)
        if not parsed:
            return False
        
        return parsed.version == self.cache_version
    
    def upgrade_key_version(self, old_key: str) -> Optional[str]:
        """
        Upgrade an old cache key to current version
        
        Args:
            old_key: Old cache key to upgrade
            
        Returns:
            Upgraded cache key or None if upgrade not possible
        """
        parsed = self.parse_key(old_key)
        if not parsed:
            return None
        
        if parsed.version == self.cache_version:
            return old_key  # Already current version
        
        # Build new key with current version
        parts = old_key.split(":")
        parts[0] = self.cache_version
        
        upgraded_key = ":".join(parts)
        logger.debug(f"🔄 Upgraded key: {old_key} -> {upgraded_key}")
        
        return upgraded_key
    
    def _stable_identifier(self, identifier: Union[str, int, Dict[str, Any]], extra_hash: Optional[str] = None) -> str:
        """
        Convert identifier to stable string representation
        
        Handles complex identifiers by creating stable hashes.
        """
        if isinstance(identifier, (str, int)):
            base_id = str(identifier)
        elif isinstance(identifier, dict):
            # Create stable hash from sorted dict
            import json
            sorted_dict = json.dumps(identifier, sort_keys=True, separators=(',', ':'))
            base_id = self.stable_hash(sorted_dict)
        else:
            # Convert to string and hash
            base_id = self.stable_hash(str(identifier))
        
        # Include extra hash if provided
        if extra_hash:
            combined = f"{base_id}:{extra_hash}"
            return self.stable_hash(combined)
        
        return base_id
    
    def stable_hash(self, value: str, length: int = 12) -> str:
        """
        Create a stable, shortened hash of a value
        
        Args:
            value: Value to hash
            length: Length of returned hash (default 12 chars)
            
        Returns:
            Stable hash string
        """
        hasher = hashlib.new(self.hash_algorithm)
        hasher.update(value.encode('utf-8'))
        full_hash = hasher.hexdigest()
        
        return full_hash[:length]
    
    def _validate_key_format(self, cache_key: str) -> bool:
        """Validate that cache key follows expected format"""
        return bool(self._key_pattern.match(cache_key))


# Convenience functions for common patterns
def build_game_key(game_id: Union[str, int], data_type: str = "details") -> str:
    """Build cache key for game data"""
    builder = CacheKeyBuilder()
    return builder.build_key(
        tier=CacheTier.NORMALIZED_PROPS,
        entity=CacheEntity.GAME,
        identifier=str(game_id),
        sub_keys=[data_type]
    )

def build_player_key(player_id: Union[str, int], stat_type: str = "season") -> str:
    """Build cache key for player data"""
    builder = CacheKeyBuilder()
    return builder.build_key(
        tier=CacheTier.NORMALIZED_PROPS,
        entity=CacheEntity.PLAYER,
        identifier=str(player_id),
        sub_keys=[stat_type]
    )

def build_prop_key(game_id: Union[str, int], player_id: Union[str, int], prop_type: str) -> str:
    """Build cache key for prop data"""
    builder = CacheKeyBuilder()
    prop_id = f"{game_id}_{player_id}_{prop_type}"
    return builder.build_key(
        tier=CacheTier.DERIVED_EDGES,
        entity=CacheEntity.PROP,
        identifier=prop_id
    )

def build_user_key(user_id: str, data_type: str = "preferences") -> str:
    """Build cache key for user data"""
    builder = CacheKeyBuilder()
    return builder.build_key(
        tier=CacheTier.USER_PREFERENCES,
        entity=CacheEntity.USER,
        identifier=user_id,
        sub_keys=[data_type]
    )

def build_analytics_key(metric_name: str, time_period: str = "daily") -> str:
    """Build cache key for analytics data"""
    builder = CacheKeyBuilder()
    return builder.build_key(
        tier=CacheTier.ANALYTICS,
        entity=CacheEntity.METRICS,
        identifier=metric_name,
        sub_keys=[time_period]
    )


# Global key builder instance
cache_key_builder = CacheKeyBuilder()


# Export key building functions
def build_key(tier: Union[CacheTier, str], entity: Union[CacheEntity, str], 
             identifier: Union[str, int, Dict[str, Any]], **kwargs) -> str:
    """Global function to build cache keys"""
    return cache_key_builder.build_key(tier, entity, identifier, **kwargs)

def build_pattern(tier: Union[CacheTier, str, None] = None, 
                 entity: Union[CacheEntity, str, None] = None,
                 identifier_pattern: str = "*") -> str:
    """Global function to build cache patterns"""
    return cache_key_builder.build_pattern(tier, entity, identifier_pattern)

def parse_key(cache_key: str) -> Optional[ParsedCacheKey]:
    """Global function to parse cache keys"""
    return cache_key_builder.parse_key(cache_key)


# Version management utilities
def get_current_version() -> str:
    """Get current cache version"""
    return CACHE_VERSION

def set_cache_version(version: str):
    """Set cache version (primarily for testing)"""
    global CACHE_VERSION
    CACHE_VERSION = version
    logger.info(f"🔄 Cache version updated to: {version}")

def invalidate_version_keys(old_version: str) -> List[str]:
    """Generate patterns to invalidate old version keys"""
    patterns = [
        f"{old_version}:*",  # All keys from old version
    ]
    logger.info(f"🗑️ Generated invalidation patterns for version {old_version}")
    return patterns