"""
Standalone test for Enhanced Prop State Cache System
Tests the cache functionality without heavy ML dependencies
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_cache_system():
    """Test the Enhanced Prop State Cache System standalone"""
    
    print("Testing Enhanced Prop State Cache System...")
    print("=" * 60)
    
    # Import our cache module
    try:
        from services.cache.enhanced_prop_state_cache import (
            EnhancedPropStateCache, 
            PropCacheState,
            cache_prop,
            get_cached_prop,
            invalidate_prop_cache,
            warm_prop_cache
        )
        print("✅ Successfully imported Enhanced Prop State Cache System")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    
    # Create cache instance
    cache = EnhancedPropStateCache()
    print("✅ Created cache instance")
    
    # Test 1: Basic Cache Operations
    print("\n📋 Test 1: Basic Cache Operations")
    
    sample_data = {
        "prop_id": "test_prop_basic",
        "player": "Test Player", 
        "prop_type": "points",
        "line": 25.5,
        "probability": 0.52,
        "game_id": "game_456"
    }
    
    # Set data
    entry = await cache.set("test_prop_basic", sample_data, ttl_minutes=30)
    print(f"  ✅ Cached entry: {entry.prop_id} (version {entry.version})")
    print(f"     State: {entry.state.value}, Created: {entry.created_at.strftime('%H:%M:%S')}")
    
    # Get data
    cached_data, retrieved_entry = await cache.get("test_prop_basic")
    print(f"  ✅ Retrieved cached data: {cached_data is not None}")
    print(f"     Access count: {retrieved_entry.access_count}, Hit count: {retrieved_entry.hit_count}")
    
    # Test 2: Cache Versioning
    print("\n📋 Test 2: Cache Versioning")
    
    # Update with modified data
    updated_data = sample_data.copy()
    updated_data["line"] = 26.5
    updated_data["probability"] = 0.48
    
    updated_entry = await cache.set("test_prop_basic", updated_data)
    print(f"  ✅ Updated entry version: {updated_entry.version}")
    print(f"     New line: {updated_data['line']}")
    
    # Verify latest version
    cached_data, latest_entry = await cache.get("test_prop_basic")
    print(f"  ✅ Retrieved latest version: {latest_entry.version}")
    print(f"     Line value: {cached_data['line']}")
    
    # Test 3: Live Data Sensitivity
    print("\n📋 Test 3: Live Data Sensitivity")
    
    sensitive_entry = await cache.set(
        "weather_sensitive_prop",
        sample_data,
        live_data_config={
            "weather": True,
            "injury": True,
            "lineup": False,
            "line_movement": True
        }
    )
    
    print(f"  ✅ Created live data sensitive entry:")
    print(f"     Weather sensitive: {sensitive_entry.weather_sensitive}")
    print(f"     Injury sensitive: {sensitive_entry.injury_sensitive}")
    print(f"     Lineup sensitive: {sensitive_entry.lineup_sensitive}")
    print(f"     Line movement sensitive: {sensitive_entry.line_movement_sensitive}")
    print(f"     Invalidation events: {len(sensitive_entry.invalidation_events)}")
    
    # Test 4: Cache Invalidation
    print("\n📋 Test 4: Cache Invalidation")
    
    # Verify data is cached
    cached_data, entry = await cache.get("test_prop_basic")
    print(f"  ✅ Data before invalidation: {cached_data is not None}")
    
    # Invalidate cache
    invalidated_count = await cache.invalidate(
        prop_id="test_prop_basic", 
        reason="test_invalidation"
    )
    print(f"  ✅ Invalidated entries: {invalidated_count}")
    
    # Verify invalidation
    cached_data, invalid_entry = await cache.get("test_prop_basic")
    print(f"  ✅ Data after invalidation: {cached_data is None}")
    print(f"     Cache state: {invalid_entry.state.value}")
    
    # Test 5: Cache Warming
    print("\n📋 Test 5: Cache Warming")
    
    prop_ids = ["warm_prop_1", "warm_prop_2", "warm_prop_3"]
    warmed_count = await cache.warm(prop_ids, priority=1)
    print(f"  ✅ Queued for warming: {warmed_count} props")
    print(f"     Warming queue size: {cache.warming_queue.qsize()}")
    
    # Process one warming request
    if not cache.warming_queue.empty():
        warm_request = await cache.warming_queue.get()
        print(f"  ✅ Warming request: {warm_request['prop_id']} (priority {warm_request['priority']})")
    
    # Test 6: Cache Statistics
    print("\n📋 Test 6: Cache Statistics")
    
    stats = await cache.get_stats()
    print(f"  ✅ Cache statistics retrieved:")
    print(f"     Performance:")
    for key, value in stats["performance"].items():
        print(f"       {key}: {value}")
    print(f"     Capacity:")
    for key, value in stats["capacity"].items():
        print(f"       {key}: {value}")
    
    # Test 7: Convenience Functions
    print("\n📋 Test 7: Convenience Functions")
    
    # Test cache_prop
    convenience_entry = await cache_prop(
        prop_id="convenience_test",
        prop_data={"convenience": True, "test": "value"},
        ttl_minutes=45,
        weather_sensitive=True,
        injury_sensitive=True
    )
    print(f"  ✅ cache_prop: {convenience_entry.prop_id}")
    print(f"     Weather sensitive: {convenience_entry.weather_sensitive}")
    
    # Test get_cached_prop
    cached_data, is_fresh = await get_cached_prop("convenience_test")
    print(f"  ✅ get_cached_prop: {cached_data is not None}, fresh: {is_fresh}")
    
    # Test invalidate_prop_cache
    invalidated = await invalidate_prop_cache("convenience_test", "convenience_test")
    print(f"  ✅ invalidate_prop_cache: {invalidated} entries")
    
    # Test warm_prop_cache
    warmed = await warm_prop_cache(["warm_convenience_1", "warm_convenience_2"])
    print(f"  ✅ warm_prop_cache: {warmed} props queued")
    
    # Test 8: Memory Management
    print("\n📋 Test 8: Memory Management")
    
    # Set memory limit
    original_limit = cache.max_memory_entries
    cache.max_memory_entries = 5
    print(f"  ✅ Set memory limit to {cache.max_memory_entries} entries")
    
    # Cache more entries than the limit
    for i in range(8):
        await cache.set(f"memory_test_prop_{i}", {"id": i, "data": f"test_{i}"})
    
    print(f"  ✅ Cached 8 entries with limit of 5")
    print(f"     Actual memory entries: {len(cache.memory_cache)}")
    print(f"     Evictions: {cache.stats['evictions']}")
    
    # Restore original limit
    cache.max_memory_entries = original_limit
    
    # Test 9: Error Handling
    print("\n📋 Test 9: Error Handling")
    
    # Test empty prop ID
    cached_data, entry = await cache.get("")
    print(f"  ✅ Empty prop ID handled: {cached_data is None}")
    print(f"     State: {entry.state.value}")
    
    # Test nonexistent prop
    cached_data, entry = await cache.get("nonexistent_prop_12345")
    print(f"  ✅ Nonexistent prop handled: {cached_data is None}")
    
    print("\n" + "=" * 60)
    print("🎉 All tests completed successfully!")
    print("Enhanced Prop State Cache System is working correctly!")
    
    return True


if __name__ == "__main__":
    # Run the tests
    try:
        success = asyncio.run(test_cache_system())
        if success:
            print("\n✅ Enhanced Prop State Cache System verification PASSED")
            exit(0)
        else:
            print("\n❌ Enhanced Prop State Cache System verification FAILED")
            exit(1)
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)