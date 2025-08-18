"""
Enhanced Prop State Cache System

Advanced caching system for prop states with live data integration, event-driven cache invalidation,
state versioning, conflict resolution, and intelligent cache warming strategies for optimal performance.
"""

import asyncio
import logging
import hashlib
import json
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Set, Tuple, Union
from uuid import uuid4
import weakref

from ..unified_config import get_live_data_config, get_config
from ..unified_logging import get_logger
from ..unified_cache_service import unified_cache_service
from ..hooks.data_flow_hook_manager import (
    get_hook_manager,
    HookEvent,
    HookEventData,
    HookPriority,
    hook
)


class CacheStrategy(Enum):
    """Cache management strategies"""
    LRU = "lru"                    # Least Recently Used
    LFU = "lfu"                    # Least Frequently Used
    TTL = "ttl"                    # Time To Live
    EVENT_DRIVEN = "event_driven"  # Invalidate on events
    HYBRID = "hybrid"              # Combination of strategies


class CacheLevel(Enum):
    """Cache levels for tiered caching"""
    MEMORY = "memory"              # In-memory cache (fastest)
    REDIS = "redis"                # Redis cache (fast, persistent)
    DATABASE = "database"          # Database cache (slowest, most persistent)


class PropCacheState(Enum):
    """States of cached prop data"""
    FRESH = "fresh"                # Recently cached, fully valid
    STALE = "stale"                # Older but still usable
    INVALID = "invalid"            # Needs immediate refresh
    WARMING = "warming"            # Currently being refreshed
    LOCKED = "locked"              # Locked for update


@dataclass
class PropCacheEntry:
    """Individual prop cache entry"""
    prop_id: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Cache management
    cache_key: str = ""
    cache_level: CacheLevel = CacheLevel.MEMORY
    strategy: CacheStrategy = CacheStrategy.HYBRID
    
    # Versioning
    version: int = 1
    data_hash: str = ""
    last_modified: datetime = field(default_factory=datetime.utcnow)
    
    # Lifecycle
    created_at: datetime = field(default_factory=datetime.utcnow)
    accessed_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    
    # Statistics
    access_count: int = 0
    hit_count: int = 0
    miss_count: int = 0
    
    # State management
    state: PropCacheState = PropCacheState.FRESH
    invalidation_events: Set[HookEvent] = field(default_factory=set)
    dependencies: Set[str] = field(default_factory=set)  # Other cache keys this depends on
    dependents: Set[str] = field(default_factory=set)    # Other cache keys that depend on this
    
    # Live data integration
    live_data_sensitive: bool = True
    weather_sensitive: bool = False
    injury_sensitive: bool = False
    lineup_sensitive: bool = False
    line_movement_sensitive: bool = False
    
    def __post_init__(self):
        if not self.cache_key:
            self.cache_key = f"prop_cache_{self.prop_id}_{self.version}"
        
        if not self.data_hash:
            self.data_hash = self._calculate_data_hash()
    
    def _calculate_data_hash(self) -> str:
        """Calculate hash of data for change detection"""
        data_str = json.dumps(self.data, sort_keys=True, default=str)
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]
    
    def update_data(self, new_data: Dict[str, Any]) -> bool:
        """Update data and return True if changed"""
        new_hash = hashlib.sha256(
            json.dumps(new_data, sort_keys=True, default=str).encode()
        ).hexdigest()[:16]
        
        if new_hash != self.data_hash:
            self.data = new_data
            self.data_hash = new_hash
            self.version += 1
            self.last_modified = datetime.utcnow()
            self.cache_key = f"prop_cache_{self.prop_id}_{self.version}"
            return True
        return False
    
    def mark_accessed(self):
        """Mark entry as accessed"""
        self.accessed_at = datetime.utcnow()
        self.access_count += 1
    
    def is_expired(self) -> bool:
        """Check if entry is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def is_stale(self, stale_threshold_minutes: int = 30) -> bool:
        """Check if entry is stale"""
        age = datetime.utcnow() - self.last_modified
        return age.total_seconds() > (stale_threshold_minutes * 60)


@dataclass
class CacheWarmingStrategy:
    """Strategy for warming cache"""
    prop_ids: Set[str] = field(default_factory=set)
    priority: int = 1  # 1 = highest priority
    warm_on_events: Set[HookEvent] = field(default_factory=set)
    warm_schedule: Optional[str] = None  # Cron-like schedule
    batch_size: int = 10
    concurrent_limit: int = 3
    enabled: bool = True


class EnhancedPropStateCache:
    """
    Enhanced prop state caching system with live data integration.
    
    Key Features:
    - Multi-tier caching (memory, Redis, database)
    - Event-driven cache invalidation
    - Intelligent cache warming
    - State versioning and conflict resolution
    - Dependency tracking
    - Performance optimization
    - Live data integration
    """
    
    def __init__(self):
        self.logger = get_logger("enhanced_prop_state_cache")
        self.config = get_live_data_config()
        self.app_config = get_config()
        
        # Cache storage
        self.memory_cache: Dict[str, PropCacheEntry] = {}
        self.cache_index: Dict[str, Set[str]] = defaultdict(set)  # prop_id -> cache_keys
        
        # Configuration
        self.max_memory_entries = 10000
        self.default_ttl_minutes = 60
        self.stale_threshold_minutes = 30
        self.warming_batch_size = 20
        
        # Performance tracking
        self.stats = {
            "hits": 0,
            "misses": 0,
            "invalidations": 0,
            "warmings": 0,
            "evictions": 0,
            "conflicts": 0,
            "total_entries": 0,
            "memory_usage_mb": 0.0,
        }
        
        # Cache warming
        self.warming_strategies: Dict[str, CacheWarmingStrategy] = {}
        self.warming_queue: asyncio.Queue = asyncio.Queue()
        self.warming_active = False
        
        # Dependency tracking
        self.dependency_graph: Dict[str, Set[str]] = defaultdict(set)
        
        # Setup event hooks
        self._setup_event_hooks()
        
        self.logger.info("EnhancedPropStateCache initialized")

    async def get(
        self,
        prop_id: str,
        cache_key: Optional[str] = None,
        use_stale: bool = True,
        warm_on_miss: bool = True
    ) -> Tuple[Optional[Dict[str, Any]], PropCacheEntry]:
        """
        Get prop data from cache with intelligent fallback.
        
        Args:
            prop_id: Prop identifier
            cache_key: Specific cache key (optional)
            use_stale: Whether to return stale data
            warm_on_miss: Whether to trigger warming on cache miss
        
        Returns:
            (data, cache_entry) - data is None if not found
        """
        try:
            # Find cache entry
            cache_entry = None
            
            if cache_key:
                cache_entry = self.memory_cache.get(cache_key)
            else:
                # Find latest version for this prop
                prop_keys = self.cache_index.get(prop_id, set())
                if prop_keys:
                    # Get the highest version
                    latest_entry = None
                    latest_version = -1
                    
                    for key in prop_keys:
                        entry = self.memory_cache.get(key)
                        if entry and entry.version > latest_version:
                            latest_version = entry.version
                            latest_entry = entry
                    
                    cache_entry = latest_entry
            
            if cache_entry:
                cache_entry.mark_accessed()
                
                # Check if expired
                if cache_entry.is_expired():
                    cache_entry.state = PropCacheState.INVALID
                    await self._invalidate_entry(cache_entry.cache_key, "expired")
                    cache_entry = None
                
                # Check if stale
                elif cache_entry.is_stale(self.stale_threshold_minutes):
                    if use_stale:
                        cache_entry.state = PropCacheState.STALE
                        # Trigger async refresh
                        if warm_on_miss:
                            await self._trigger_warming(prop_id)
                    else:
                        cache_entry = None
            
            if cache_entry:
                # Cache hit
                self.stats["hits"] += 1
                cache_entry.hit_count += 1
                
                self.logger.debug(f"Cache hit for {prop_id} (state: {cache_entry.state.value})")
                return cache_entry.data, cache_entry
            else:
                # Cache miss
                self.stats["misses"] += 1
                
                # Try other cache levels
                data = await self._try_other_cache_levels(prop_id)
                if data:
                    # Store in memory cache
                    entry = await self.set(prop_id, data)
                    return data, entry
                
                # Trigger warming if enabled
                if warm_on_miss:
                    await self._trigger_warming(prop_id)
                
                self.logger.debug(f"Cache miss for {prop_id}")
                # Return empty entry for consistency
                empty_entry = PropCacheEntry(prop_id=prop_id, state=PropCacheState.INVALID)
                return None, empty_entry
                
        except Exception as e:
            self.logger.error(f"Error getting cache entry for {prop_id}: {e}")
            empty_entry = PropCacheEntry(prop_id=prop_id, state=PropCacheState.INVALID)
            return None, empty_entry

    async def set(
        self,
        prop_id: str,
        data: Dict[str, Any],
        metadata: Dict[str, Any] = None,
        ttl_minutes: Optional[int] = None,
        cache_level: CacheLevel = CacheLevel.MEMORY,
        live_data_config: Dict[str, bool] = None
    ) -> PropCacheEntry:
        """
        Set prop data in cache with intelligent storage.
        
        Args:
            prop_id: Prop identifier
            data: Prop data to cache
            metadata: Additional metadata
            ttl_minutes: Time to live in minutes
            cache_level: Which cache level to use
            live_data_config: Live data sensitivity configuration
        
        Returns:
            The created cache entry
        """
        try:
            # Create cache entry
            ttl = ttl_minutes or self.default_ttl_minutes
            expires_at = datetime.utcnow() + timedelta(minutes=ttl)
            
            cache_entry = PropCacheEntry(
                prop_id=prop_id,
                data=data,
                metadata=metadata or {},
                cache_level=cache_level,
                expires_at=expires_at,
                state=PropCacheState.FRESH
            )
            
            # Configure live data sensitivity
            if live_data_config:
                cache_entry.weather_sensitive = live_data_config.get("weather", False)
                cache_entry.injury_sensitive = live_data_config.get("injury", False)
                cache_entry.lineup_sensitive = live_data_config.get("lineup", False)
                cache_entry.line_movement_sensitive = live_data_config.get("line_movement", False)
            
            # Set invalidation events based on sensitivity
            self._configure_invalidation_events(cache_entry)
            
            # Check for conflicts with existing entries
            existing_entry = await self._find_latest_entry(prop_id)
            if existing_entry:
                conflict_resolved = await self._resolve_conflict(existing_entry, cache_entry)
                if not conflict_resolved:
                    self.stats["conflicts"] += 1
                    self.logger.warning(f"Cache conflict for {prop_id}, using newer version")
            
            # Store in memory cache
            self.memory_cache[cache_entry.cache_key] = cache_entry
            self.cache_index[prop_id].add(cache_entry.cache_key)
            
            # Store in other cache levels if configured
            if cache_level == CacheLevel.REDIS or cache_level == CacheLevel.MEMORY:
                await self._store_in_redis(cache_entry)
            
            # Enforce memory limits
            await self._enforce_memory_limits()
            
            # Update statistics
            self.stats["total_entries"] = len(self.memory_cache)
            
            self.logger.debug(
                f"Cached {prop_id} (version {cache_entry.version}, ttl {ttl}min)"
            )
            
            return cache_entry
            
        except Exception as e:
            self.logger.error(f"Error setting cache entry for {prop_id}: {e}")
            raise

    async def invalidate(
        self,
        prop_id: Optional[str] = None,
        cache_key: Optional[str] = None,
        reason: str = "manual",
        cascade: bool = True
    ) -> int:
        """
        Invalidate cache entries.
        
        Args:
            prop_id: Prop ID to invalidate (all versions)
            cache_key: Specific cache key to invalidate
            reason: Reason for invalidation
            cascade: Whether to cascade to dependent entries
        
        Returns:
            Number of entries invalidated
        """
        invalidated_count = 0
        
        try:
            if cache_key:
                # Invalidate specific entry
                if cache_key in self.memory_cache:
                    invalidated_count += await self._invalidate_entry(cache_key, reason)
                    
                    if cascade:
                        # Invalidate dependents
                        entry = self.memory_cache.get(cache_key)
                        if entry:
                            for dependent_key in entry.dependents:
                                invalidated_count += await self._invalidate_entry(
                                    dependent_key, f"cascade from {cache_key}"
                                )
            
            elif prop_id:
                # Invalidate all entries for this prop
                prop_keys = self.cache_index.get(prop_id, set()).copy()
                for key in prop_keys:
                    invalidated_count += await self._invalidate_entry(key, reason)
            
            if invalidated_count > 0:
                self.stats["invalidations"] += invalidated_count
                self.logger.info(f"Invalidated {invalidated_count} cache entries ({reason})")
            
            return invalidated_count
            
        except Exception as e:
            self.logger.error(f"Error invalidating cache: {e}")
            return 0

    async def warm(
        self,
        prop_ids: Union[str, List[str]],
        priority: int = 1,
        force: bool = False
    ) -> int:
        """
        Warm cache for specific props.
        
        Args:
            prop_ids: Prop ID(s) to warm
            priority: Warming priority (1 = highest)
            force: Force warming even if already cached
        
        Returns:
            Number of entries warmed
        """
        if isinstance(prop_ids, str):
            prop_ids = [prop_ids]
        
        warmed_count = 0
        
        try:
            for prop_id in prop_ids:
                # Check if already cached and fresh
                if not force:
                    existing_entry = await self._find_latest_entry(prop_id)
                    if existing_entry and existing_entry.state == PropCacheState.FRESH:
                        continue
                
                # Add to warming queue
                await self.warming_queue.put({
                    "prop_id": prop_id,
                    "priority": priority,
                    "force": force,
                    "requested_at": datetime.utcnow()
                })
                
                warmed_count += 1
            
            if warmed_count > 0:
                self.stats["warmings"] += warmed_count
                self.logger.debug(f"Queued {warmed_count} props for warming")
            
            return warmed_count
            
        except Exception as e:
            self.logger.error(f"Error warming cache: {e}")
            return 0

    async def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        # Calculate hit rate
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        # Memory usage estimation
        memory_usage_mb = len(self.memory_cache) * 0.001  # Rough estimate
        
        # State distribution
        state_distribution = defaultdict(int)
        for entry in self.memory_cache.values():
            state_distribution[entry.state.value] += 1
        
        # Cache level distribution
        level_distribution = defaultdict(int)
        for entry in self.memory_cache.values():
            level_distribution[entry.cache_level.value] += 1
        
        return {
            "performance": {
                **self.stats,
                "hit_rate_percent": round(hit_rate, 2),
                "total_requests": total_requests,
                "memory_usage_mb": round(memory_usage_mb, 2)
            },
            "distribution": {
                "by_state": dict(state_distribution),
                "by_level": dict(level_distribution)
            },
            "capacity": {
                "memory_entries": len(self.memory_cache),
                "max_memory_entries": self.max_memory_entries,
                "memory_utilization_percent": round(
                    len(self.memory_cache) / self.max_memory_entries * 100, 2
                )
            },
            "warming": {
                "strategies": len(self.warming_strategies),
                "queue_size": self.warming_queue.qsize(),
                "warming_active": self.warming_active
            }
        }

    # Event-driven invalidation hooks

    @hook(HookEvent.WEATHER_UPDATED, priority=HookPriority.HIGH, debounce_ms=1000)
    async def _handle_weather_update(self, event: HookEventData):
        """Handle weather update events"""
        # Invalidate weather-sensitive props
        invalidated = 0
        for entry in self.memory_cache.values():
            if entry.weather_sensitive:
                invalidated += await self._invalidate_entry(
                    entry.cache_key, "weather_update"
                )
        
        if invalidated > 0:
            self.logger.info(f"Invalidated {invalidated} weather-sensitive props")

    @hook(HookEvent.INJURY_REPORTED, priority=HookPriority.HIGH, debounce_ms=500)
    async def _handle_injury_report(self, event: HookEventData):
        """Handle injury report events"""
        player_id = event.metadata.get("player_id")
        
        # Invalidate injury-sensitive props for this player
        invalidated = 0
        for entry in self.memory_cache.values():
            if entry.injury_sensitive:
                # Check if this prop is related to the injured player
                if self._prop_affects_player(entry.prop_id, player_id):
                    invalidated += await self._invalidate_entry(
                        entry.cache_key, f"injury_report_{player_id}"
                    )
        
        if invalidated > 0:
            self.logger.info(f"Invalidated {invalidated} injury-sensitive props for player {player_id}")

    @hook(HookEvent.LINEUP_CHANGED, priority=HookPriority.HIGH, debounce_ms=1000)
    async def _handle_lineup_change(self, event: HookEventData):
        """Handle lineup change events"""
        game_id = event.metadata.get("game_id")
        
        # Invalidate lineup-sensitive props for this game
        invalidated = 0
        for entry in self.memory_cache.values():
            if entry.lineup_sensitive:
                if self._prop_affects_game(entry.prop_id, game_id):
                    invalidated += await self._invalidate_entry(
                        entry.cache_key, f"lineup_change_{game_id}"
                    )
        
        if invalidated > 0:
            self.logger.info(f"Invalidated {invalidated} lineup-sensitive props for game {game_id}")

    @hook([HookEvent.LINE_MOVEMENT, HookEvent.STEAM_DETECTED], priority=HookPriority.MEDIUM, debounce_ms=2000)
    async def _handle_line_movement(self, events: List[HookEventData]):
        """Handle line movement events (batched)"""
        affected_props = set()
        
        for event in events:
            prop_id = event.metadata.get("prop_id")
            if prop_id:
                affected_props.add(prop_id)
        
        # Invalidate line-movement-sensitive props
        invalidated = 0
        for prop_id in affected_props:
            invalidated += await self.invalidate(prop_id, reason="line_movement")
        
        if invalidated > 0:
            self.logger.info(f"Invalidated {invalidated} props due to line movement")

    # Private methods

    def _setup_event_hooks(self):
        """Setup event-driven invalidation hooks"""
        # Hooks are set up via decorators above
        self.logger.debug("Event-driven invalidation hooks configured")

    async def _find_latest_entry(self, prop_id: str) -> Optional[PropCacheEntry]:
        """Find the latest cache entry for a prop"""
        prop_keys = self.cache_index.get(prop_id, set())
        if not prop_keys:
            return None
        
        latest_entry = None
        latest_version = -1
        
        for key in prop_keys:
            entry = self.memory_cache.get(key)
            if entry and entry.version > latest_version:
                latest_version = entry.version
                latest_entry = entry
        
        return latest_entry

    async def _resolve_conflict(
        self,
        existing_entry: PropCacheEntry,
        new_entry: PropCacheEntry
    ) -> bool:
        """
        Resolve cache entry conflicts.
        
        Returns True if conflict was resolved successfully.
        """
        try:
            # Use version-based resolution (newer wins)
            if new_entry.version > existing_entry.version:
                # Mark old entry as invalid
                existing_entry.state = PropCacheState.INVALID
                return True
            elif new_entry.version == existing_entry.version:
                # Same version - check data hash
                if new_entry.data_hash != existing_entry.data_hash:
                    # Data differs - use last modified time
                    if new_entry.last_modified > existing_entry.last_modified:
                        existing_entry.state = PropCacheState.INVALID
                        return True
            
            # Existing entry is newer or same - reject new entry
            return False
            
        except Exception as e:
            self.logger.error(f"Error resolving cache conflict: {e}")
            return False

    async def _invalidate_entry(self, cache_key: str, reason: str) -> int:
        """Invalidate a specific cache entry"""
        if cache_key not in self.memory_cache:
            return 0
        
        entry = self.memory_cache[cache_key]
        entry.state = PropCacheState.INVALID
        
        # Remove from memory cache
        del self.memory_cache[cache_key]
        
        # Remove from index
        if entry.prop_id in self.cache_index:
            self.cache_index[entry.prop_id].discard(cache_key)
            if not self.cache_index[entry.prop_id]:
                del self.cache_index[entry.prop_id]
        
        # Remove from Redis if applicable
        await self._remove_from_redis(cache_key)
        
        self.logger.debug(f"Invalidated cache entry {cache_key} ({reason})")
        return 1

    async def _enforce_memory_limits(self):
        """Enforce memory cache size limits"""
        if len(self.memory_cache) <= self.max_memory_entries:
            return
        
        # LRU eviction
        entries_by_access = sorted(
            self.memory_cache.items(),
            key=lambda x: x[1].accessed_at
        )
        
        evicted_count = 0
        excess = len(self.memory_cache) - self.max_memory_entries
        
        for cache_key, entry in entries_by_access[:excess]:
            await self._invalidate_entry(cache_key, "memory_limit_eviction")
            evicted_count += 1
        
        if evicted_count > 0:
            self.stats["evictions"] += evicted_count
            self.logger.debug(f"Evicted {evicted_count} entries due to memory limits")

    def _configure_invalidation_events(self, cache_entry: PropCacheEntry):
        """Configure which events should invalidate this cache entry"""
        events = set()
        
        if cache_entry.weather_sensitive:
            events.add(HookEvent.WEATHER_UPDATED)
        
        if cache_entry.injury_sensitive:
            events.add(HookEvent.INJURY_REPORTED)
        
        if cache_entry.lineup_sensitive:
            events.add(HookEvent.LINEUP_CHANGED)
        
        if cache_entry.line_movement_sensitive:
            events.update([HookEvent.LINE_MOVEMENT, HookEvent.STEAM_DETECTED])
        
        cache_entry.invalidation_events = events

    async def _try_other_cache_levels(self, prop_id: str) -> Optional[Dict[str, Any]]:
        """Try to get data from other cache levels (Redis, DB)"""
        # Try Redis cache
        redis_key = f"prop_cache_{prop_id}"
        cached_data = await unified_cache_service.get(redis_key)
        
        if cached_data:
            self.logger.debug(f"Retrieved {prop_id} from Redis cache")
            return cached_data
        
        # Could add database cache here
        return None

    async def _store_in_redis(self, cache_entry: PropCacheEntry):
        """Store cache entry in Redis"""
        try:
            redis_key = f"prop_cache_{cache_entry.prop_id}"
            ttl_seconds = int((cache_entry.expires_at - datetime.utcnow()).total_seconds()) if cache_entry.expires_at else 3600
            
            await unified_cache_service.set(
                redis_key,
                {
                    "data": cache_entry.data,
                    "metadata": cache_entry.metadata,
                    "version": cache_entry.version,
                    "cached_at": cache_entry.created_at.isoformat()
                },
                ttl=max(ttl_seconds, 60)  # Minimum 1 minute
            )
            
        except Exception as e:
            self.logger.debug(f"Failed to store in Redis: {e}")

    async def _remove_from_redis(self, cache_key: str):
        """Remove cache entry from Redis"""
        try:
            # Extract prop_id from cache_key
            if "_" in cache_key:
                prop_id = cache_key.split("_")[2]  # prop_cache_PROPID_VERSION
                redis_key = f"prop_cache_{prop_id}"
                await unified_cache_service.delete(redis_key)
        except Exception as e:
            self.logger.debug(f"Failed to remove from Redis: {e}")

    async def _trigger_warming(self, prop_id: str):
        """Trigger cache warming for a prop"""
        try:
            await self.warming_queue.put({
                "prop_id": prop_id,
                "priority": 2,  # Medium priority
                "force": False,
                "requested_at": datetime.utcnow()
            })
        except Exception as e:
            self.logger.debug(f"Failed to trigger warming for {prop_id}: {e}")

    def _prop_affects_player(self, prop_id: str, player_id: str) -> bool:
        """Check if a prop is affected by a specific player"""
        # This would integrate with prop metadata to determine player relationships
        # For now, simple heuristic
        return player_id.lower() in prop_id.lower()

    def _prop_affects_game(self, prop_id: str, game_id: str) -> bool:
        """Check if a prop is affected by a specific game"""
        # This would integrate with prop metadata to determine game relationships
        # For now, simple heuristic  
        return game_id.lower() in prop_id.lower()


# Global instance
_cache_instance: Optional[EnhancedPropStateCache] = None


def get_prop_cache() -> EnhancedPropStateCache:
    """Get the global prop cache instance"""
    global _cache_instance
    
    if _cache_instance is None:
        _cache_instance = EnhancedPropStateCache()
    
    return _cache_instance


# Convenience functions

async def cache_prop(
    prop_id: str,
    prop_data: Dict[str, Any],
    ttl_minutes: int = 60,
    weather_sensitive: bool = False,
    injury_sensitive: bool = False,
    lineup_sensitive: bool = False,
    line_movement_sensitive: bool = False
) -> PropCacheEntry:
    """Convenience function to cache prop data"""
    cache = get_prop_cache()
    
    live_data_config = {
        "weather": weather_sensitive,
        "injury": injury_sensitive,
        "lineup": lineup_sensitive,
        "line_movement": line_movement_sensitive
    }
    
    return await cache.set(
        prop_id=prop_id,
        data=prop_data,
        ttl_minutes=ttl_minutes,
        live_data_config=live_data_config
    )


async def get_cached_prop(
    prop_id: str,
    use_stale: bool = True
) -> Tuple[Optional[Dict[str, Any]], bool]:
    """
    Convenience function to get cached prop data.
    
    Returns:
        (data, is_fresh) - data is None if not cached
    """
    cache = get_prop_cache()
    data, entry = await cache.get(prop_id, use_stale=use_stale)
    is_fresh = entry.state == PropCacheState.FRESH
    
    return data, is_fresh


async def invalidate_prop_cache(
    prop_id: str,
    reason: str = "manual"
) -> int:
    """Convenience function to invalidate prop cache"""
    cache = get_prop_cache()
    return await cache.invalidate(prop_id=prop_id, reason=reason)


async def warm_prop_cache(
    prop_ids: Union[str, List[str]],
    priority: int = 1
) -> int:
    """Convenience function to warm prop cache"""
    cache = get_prop_cache()
    return await cache.warm(prop_ids, priority=priority)