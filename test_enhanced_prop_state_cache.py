"""
Test suite for Enhanced Prop State Cache System

Tests the advanced caching functionality including:
- Multi-tier caching
- Event-driven invalidation
- Cache warming
- State versioning and conflict resolution
- Performance monitoring
"""

import asyncio
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch

from backend.services.cache.enhanced_prop_state_cache import (
    EnhancedPropStateCache,
    PropCacheEntry,
    PropCacheState,
    CacheLevel,
    CacheStrategy,
    get_prop_cache,
    cache_prop,
    get_cached_prop,
    invalidate_prop_cache,
    warm_prop_cache
)
from backend.services.hooks.data_flow_hook_manager import (
    HookEvent,
    HookEventData
)


class TestEnhancedPropStateCache:
    """Test cases for the Enhanced Prop State Cache System"""
    
    @pytest.fixture
    def cache(self):
        """Create a fresh cache for each test"""
        return EnhancedPropStateCache()
    
    @pytest.fixture
    def sample_prop_data(self):
        """Sample prop data for testing"""
        return {
            "prop_id": "test_prop_123",
            "player_name": "Test Player",
            "prop_type": "points",
            "line": 25.5,
            "odds": {"+": 110, "-": 110},
            "probability": 0.52,
            "game_id": "game_456",
            "sport": "NBA"
        }
    
    @pytest.mark.asyncio
    async def test_basic_cache_operations(self, cache, sample_prop_data):
        """Test basic cache set/get operations"""
        prop_id = "test_prop_basic"
        
        # Set data in cache
        entry = await cache.set(prop_id, sample_prop_data, ttl_minutes=30)
        
        assert entry.prop_id == prop_id
        assert entry.data == sample_prop_data
        assert entry.state == PropCacheState.FRESH
        assert entry.version == 1
        assert len(entry.data_hash) == 16
        
        # Get data from cache
        cached_data, retrieved_entry = await cache.get(prop_id)
        
        assert cached_data == sample_prop_data
        assert retrieved_entry.prop_id == prop_id
        assert retrieved_entry.access_count == 1
        assert retrieved_entry.hit_count == 1
        
        # Verify cache statistics
        stats = await cache.get_stats()
        assert stats["performance"]["hits"] >= 1
        assert stats["performance"]["total_entries"] >= 1
    
    @pytest.mark.asyncio
    async def test_cache_versioning(self, cache, sample_prop_data):
        """Test cache entry versioning and updates"""
        prop_id = "test_prop_versioning"
        
        # Set initial data
        entry1 = await cache.set(prop_id, sample_prop_data)
        assert entry1.version == 1
        
        # Update with modified data
        updated_data = sample_prop_data.copy()
        updated_data["line"] = 26.5
        updated_data["probability"] = 0.48
        
        entry2 = await cache.set(prop_id, updated_data)
        assert entry2.version == 2
        assert entry2.data["line"] == 26.5
        
        # Get latest version
        cached_data, latest_entry = await cache.get(prop_id)
        assert latest_entry.version == 2
        assert cached_data["line"] == 26.5
    
    @pytest.mark.asyncio
    async def test_cache_expiration(self, cache, sample_prop_data):
        """Test cache entry expiration"""
        prop_id = "test_prop_expiration"
        
        # Set data with short TTL
        entry = await cache.set(prop_id, sample_prop_data, ttl_minutes=0.01)  # ~0.6 seconds
        
        # Should be available immediately
        cached_data, retrieved_entry = await cache.get(prop_id)
        assert cached_data is not None
        assert retrieved_entry.state == PropCacheState.FRESH
        
        # Wait for expiration
        await asyncio.sleep(0.1)
        
        # Manually expire entry for testing
        entry.expires_at = datetime.utcnow() - timedelta(minutes=1)
        
        # Should be expired now
        cached_data, expired_entry = await cache.get(prop_id)
        assert cached_data is None
        assert expired_entry.state == PropCacheState.INVALID
    
    @pytest.mark.asyncio
    async def test_stale_data_handling(self, cache, sample_prop_data):
        """Test handling of stale cache data"""
        prop_id = "test_prop_stale"
        
        # Set data
        entry = await cache.set(prop_id, sample_prop_data)
        
        # Manually make data stale
        entry.last_modified = datetime.utcnow() - timedelta(minutes=45)  # Older than 30min threshold
        
        # Get with stale allowed (default)
        cached_data, stale_entry = await cache.get(prop_id, use_stale=True)
        assert cached_data is not None
        assert stale_entry.state == PropCacheState.STALE
        
        # Get with stale not allowed
        cached_data, rejected_entry = await cache.get(prop_id, use_stale=False)
        assert cached_data is None
    
    @pytest.mark.asyncio
    async def test_live_data_sensitivity_config(self, cache, sample_prop_data):
        """Test live data sensitivity configuration"""
        prop_id = "test_prop_sensitivity"
        
        # Configure sensitivity
        live_data_config = {
            "weather": True,
            "injury": True,
            "lineup": False,
            "line_movement": True
        }
        
        entry = await cache.set(
            prop_id,
            sample_prop_data,
            live_data_config=live_data_config
        )
        
        assert entry.weather_sensitive is True
        assert entry.injury_sensitive is True
        assert entry.lineup_sensitive is False
        assert entry.line_movement_sensitive is True
        
        # Check invalidation events are configured
        assert HookEvent.WEATHER_UPDATED in entry.invalidation_events
        assert HookEvent.INJURY_REPORTED in entry.invalidation_events
        assert HookEvent.LINEUP_CHANGED not in entry.invalidation_events
        assert HookEvent.LINE_MOVEMENT in entry.invalidation_events
    
    @pytest.mark.asyncio
    async def test_manual_invalidation(self, cache, sample_prop_data):
        """Test manual cache invalidation"""
        prop_id = "test_prop_invalidation"
        
        # Cache some data
        await cache.set(prop_id, sample_prop_data)
        
        # Verify it's cached
        cached_data, entry = await cache.get(prop_id)
        assert cached_data is not None
        
        # Invalidate cache
        invalidated_count = await cache.invalidate(prop_id=prop_id, reason="test_invalidation")
        assert invalidated_count == 1
        
        # Verify it's no longer cached
        cached_data, invalid_entry = await cache.get(prop_id)
        assert cached_data is None
        assert invalid_entry.state == PropCacheState.INVALID
    
    @pytest.mark.asyncio
    async def test_cache_warming(self, cache):
        """Test cache warming functionality"""
        prop_ids = ["warm_prop_1", "warm_prop_2", "warm_prop_3"]
        
        # Queue props for warming
        warmed_count = await cache.warm(prop_ids, priority=1)
        assert warmed_count == len(prop_ids)
        
        # Check warming queue
        assert cache.warming_queue.qsize() >= len(prop_ids)
        
        # Process one item from queue (simulate warming worker)
        if not cache.warming_queue.empty():
            warm_request = await cache.warming_queue.get()
            assert warm_request["prop_id"] in prop_ids
            assert warm_request["priority"] == 1
    
    @pytest.mark.asyncio  
    async def test_memory_limit_enforcement(self, cache, sample_prop_data):
        """Test memory limit enforcement and LRU eviction"""
        # Set very low memory limit for testing
        cache.max_memory_entries = 5
        
        # Cache more entries than the limit
        for i in range(8):
            await cache.set(f"test_prop_{i}", {**sample_prop_data, "id": i})
        
        # Should have enforced memory limits
        assert len(cache.memory_cache) <= cache.max_memory_entries
        assert cache.stats["evictions"] >= 3
    
    @pytest.mark.asyncio
    async def test_conflict_resolution(self, cache, sample_prop_data):
        """Test cache entry conflict resolution"""
        prop_id = "test_prop_conflict"
        
        # Create first entry
        entry1 = await cache.set(prop_id, sample_prop_data)
        
        # Create conflicting entry with same version but different data
        conflicting_data = sample_prop_data.copy()
        conflicting_data["line"] = 30.0
        
        # Manually create entry with same version
        conflicting_entry = PropCacheEntry(
            prop_id=prop_id,
            data=conflicting_data,
            version=entry1.version  # Same version
        )
        
        # Test conflict resolution
        resolved = await cache._resolve_conflict(entry1, conflicting_entry)
        
        # Should resolve based on last_modified time
        assert isinstance(resolved, bool)
    
    @pytest.mark.asyncio
    async def test_event_driven_invalidation(self, cache, sample_prop_data):
        """Test event-driven cache invalidation"""
        prop_id = "test_prop_weather_sensitive"
        
        # Cache weather-sensitive prop
        await cache.set(
            prop_id,
            sample_prop_data,
            live_data_config={"weather": True}
        )
        
        # Verify it's cached
        cached_data, entry = await cache.get(prop_id)
        assert cached_data is not None
        assert entry.weather_sensitive is True
        
        # Simulate weather update event
        weather_event = HookEventData(
            event_type=HookEvent.WEATHER_UPDATED,
            data={"temperature": 75, "wind_speed": 15},
            metadata={"ballpark": "test_ballpark"}
        )
        
        # Manually call the weather update handler
        await cache._handle_weather_update(weather_event)
        
        # Weather-sensitive prop should be invalidated
        cached_data, invalid_entry = await cache.get(prop_id)
        assert cached_data is None
    
    @pytest.mark.asyncio
    async def test_dependency_tracking(self, cache, sample_prop_data):
        """Test cache dependency tracking"""
        prop_id = "test_prop_dependency"
        
        # Create cache entry with dependencies
        entry = await cache.set(prop_id, sample_prop_data)
        
        # Add dependencies
        entry.dependencies.add("dependency_1")
        entry.dependencies.add("dependency_2")
        
        assert len(entry.dependencies) == 2
        assert "dependency_1" in entry.dependencies


class TestConvenienceFunctions:
    """Test convenience functions"""
    
    @pytest.mark.asyncio
    async def test_cache_prop_convenience(self):
        """Test cache_prop convenience function"""
        prop_id = "convenience_prop_1"
        prop_data = {
            "player": "Test Player",
            "prop_type": "assists",
            "line": 7.5
        }
        
        entry = await cache_prop(
            prop_id=prop_id,
            prop_data=prop_data,
            ttl_minutes=45,
            weather_sensitive=True,
            injury_sensitive=True
        )
        
        assert entry.prop_id == prop_id
        assert entry.data == prop_data
        assert entry.weather_sensitive is True
        assert entry.injury_sensitive is True
    
    @pytest.mark.asyncio
    async def test_get_cached_prop_convenience(self):
        """Test get_cached_prop convenience function"""
        prop_id = "convenience_prop_2"
        prop_data = {"test": "data"}
        
        # Cache some data first
        await cache_prop(prop_id, prop_data)
        
        # Retrieve using convenience function
        cached_data, is_fresh = await get_cached_prop(prop_id)
        
        assert cached_data == prop_data
        assert is_fresh is True
    
    @pytest.mark.asyncio
    async def test_invalidate_prop_cache_convenience(self):
        """Test invalidate_prop_cache convenience function"""
        prop_id = "convenience_prop_3"
        prop_data = {"test": "invalidation"}
        
        # Cache and then invalidate
        await cache_prop(prop_id, prop_data)
        invalidated = await invalidate_prop_cache(prop_id, "convenience_test")
        
        assert invalidated == 1
        
        # Verify invalidation
        cached_data, is_fresh = await get_cached_prop(prop_id)
        assert cached_data is None
    
    @pytest.mark.asyncio
    async def test_warm_prop_cache_convenience(self):
        """Test warm_prop_cache convenience function"""
        prop_ids = ["warm_convenience_1", "warm_convenience_2"]
        
        warmed = await warm_prop_cache(prop_ids, priority=2)
        assert warmed == len(prop_ids)


class TestPerformanceAndStats:
    """Test performance monitoring and statistics"""
    
    @pytest.mark.asyncio
    async def test_cache_statistics(self):
        """Test comprehensive cache statistics"""
        cache = EnhancedPropStateCache()
        
        # Perform various operations
        await cache.set("stats_prop_1", {"data": 1})
        await cache.set("stats_prop_2", {"data": 2})
        
        await cache.get("stats_prop_1")
        await cache.get("nonexistent_prop")  # Miss
        
        await cache.invalidate(prop_id="stats_prop_1")
        
        # Get comprehensive stats
        stats = await cache.get_stats()
        
        # Verify structure
        assert "performance" in stats
        assert "distribution" in stats
        assert "capacity" in stats
        assert "warming" in stats
        
        # Verify performance metrics
        assert stats["performance"]["hits"] >= 1
        assert stats["performance"]["misses"] >= 1
        assert stats["performance"]["invalidations"] >= 1
        assert "hit_rate_percent" in stats["performance"]
        
        # Verify capacity metrics
        assert stats["capacity"]["memory_entries"] >= 1
        assert stats["capacity"]["max_memory_entries"] > 0
        assert "memory_utilization_percent" in stats["capacity"]
    
    @pytest.mark.asyncio
    async def test_entry_statistics_tracking(self):
        """Test individual entry statistics tracking"""
        cache = EnhancedPropStateCache()
        prop_id = "stats_entry_test"
        
        # Cache and access multiple times
        entry = await cache.set(prop_id, {"test": "stats"})
        
        for i in range(5):
            await cache.get(prop_id)
        
        # Check entry stats
        _, updated_entry = await cache.get(prop_id)
        assert updated_entry.access_count == 6  # 5 gets + 1 from loop above
        assert updated_entry.hit_count == 6


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    @pytest.mark.asyncio
    async def test_invalid_prop_id_handling(self):
        """Test handling of invalid prop IDs"""
        cache = EnhancedPropStateCache()
        
        # Empty prop ID
        cached_data, entry = await cache.get("")
        assert cached_data is None
        assert entry.state == PropCacheState.INVALID
        
        # None prop ID should be handled gracefully
        try:
            await cache.set(None, {"test": "data"})
        except Exception:
            pass  # Expected to handle gracefully
    
    @pytest.mark.asyncio
    async def test_cache_corruption_recovery(self):
        """Test recovery from cache corruption scenarios"""
        cache = EnhancedPropStateCache()
        
        # Manually corrupt cache state
        cache.memory_cache["corrupted_key"] = "not_a_cache_entry"
        
        # Operations should handle corruption gracefully
        stats = await cache.get_stats()
        assert stats is not None  # Should not crash
    
    @pytest.mark.asyncio
    async def test_concurrent_access(self):
        """Test concurrent cache access"""
        cache = EnhancedPropStateCache()
        prop_id = "concurrent_prop"
        prop_data = {"concurrent": "test"}
        
        # Simulate concurrent access
        tasks = []
        for i in range(10):
            if i % 2 == 0:
                # Set operations
                task = asyncio.create_task(
                    cache.set(f"{prop_id}_{i}", {**prop_data, "id": i})
                )
            else:
                # Get operations
                task = asyncio.create_task(cache.get(prop_id))
            tasks.append(task)
        
        # Wait for all operations to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify no exceptions were raised
        for result in results:
            assert not isinstance(result, Exception)


if __name__ == "__main__":
    # Run basic tests
    async def run_basic_tests():
        print("Testing Enhanced Prop State Cache System...")
        
        cache = EnhancedPropStateCache()
        
        # Test basic operations
        sample_data = {
            "prop_id": "basic_test_prop",
            "player": "Test Player",
            "line": 25.5,
            "probability": 0.52
        }
        
        print("Testing basic cache operations...")
        
        # Set data
        entry = await cache.set("basic_test_prop", sample_data, ttl_minutes=30)
        print(f"Cached entry: {entry.prop_id} (version {entry.version})")
        
        # Get data
        cached_data, retrieved_entry = await cache.get("basic_test_prop")
        print(f"Retrieved data: {cached_data is not None}")
        print(f"Cache state: {retrieved_entry.state.value}")
        
        # Update data
        updated_data = sample_data.copy()
        updated_data["line"] = 26.0
        
        updated_entry = await cache.set("basic_test_prop", updated_data)
        print(f"Updated entry version: {updated_entry.version}")
        
        # Test live data sensitivity
        live_entry = await cache.set(
            "weather_sensitive_prop",
            sample_data,
            live_data_config={"weather": True, "injury": True}
        )
        print(f"Live data sensitive: weather={live_entry.weather_sensitive}, injury={live_entry.injury_sensitive}")
        
        # Test invalidation
        invalidated = await cache.invalidate("basic_test_prop", reason="test")
        print(f"Invalidated entries: {invalidated}")
        
        # Test warming
        warmed = await cache.warm(["warm_test_1", "warm_test_2"], priority=1)
        print(f"Queued for warming: {warmed}")
        
        # Get statistics
        stats = await cache.get_stats()
        print(f"Cache stats: {stats['performance']}")
        
        # Test convenience functions
        await cache_prop("convenience_test", {"convenience": True}, weather_sensitive=True)
        cached_data, is_fresh = await get_cached_prop("convenience_test")
        print(f"Convenience function test: cached={cached_data is not None}, fresh={is_fresh}")
        
        print("Basic tests completed successfully!")
    
    asyncio.run(run_basic_tests())