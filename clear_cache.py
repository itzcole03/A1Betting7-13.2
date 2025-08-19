#!/usr/bin/env python3
"""
Clear corrupted cache entries that contain coroutine objects.
"""

import asyncio
import sys
import os

# Add the backend to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.services.unified_cache_service import unified_cache_service

async def clear_propfinder_cache():
    """Clear PropFinder cache entries that might contain coroutine objects"""
    try:
        print("🧹 Clearing PropFinder cache entries...")
        
        # Clear all game_props cache entries
        cleared_count = await unified_cache_service.clear("game_props:*")
        print(f"✅ Cleared {cleared_count} game_props cache entries")
        
        # Also clear any propfinder-related entries
        cleared_count += await unified_cache_service.clear("*propfinder*")
        print(f"✅ Cleared additional PropFinder entries")
        
        print(f"🎯 Total cleared: {cleared_count} cache entries")
        print("🚀 Cache cleared successfully! Ready for fresh PropFinder computation.")
        
    except Exception as e:
        print(f"❌ Error clearing cache: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(clear_propfinder_cache())