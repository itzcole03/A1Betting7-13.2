#!/usr/bin/env python3
"""
Clear cache and test the MLB Provider Client integration
"""
import asyncio
import logging
import os
import sys
import time

import redis.asyncio as redis

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.services.mlb_provider_client import MLBProviderClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_fresh_mlb_provider_integration():
    """
    Clear cache and test fresh MLB Provider Client integration
    """
    print("=" * 70)
    print("FRESH INTEGRATION TEST - CLEARING CACHE AND TESTING")
    print("=" * 70)

    # Clear the cache first
    try:
        redis_conn = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        cache_key = "mlb:odds_comparison:playerprops:2025"

        print(f"Clearing cache key: {cache_key}")
        await redis_conn.delete(cache_key)

        # Also clear any other related cache keys
        keys_to_clear = ["mlb_stats_api:player_props:*", "baseball_savant:*", "mlb:*"]

        for pattern in keys_to_clear:
            matching_keys = await redis_conn.keys(pattern)
            if matching_keys:
                await redis_conn.delete(*matching_keys)
                print(f"Cleared {len(matching_keys)} keys matching {pattern}")

        await redis_conn.close()
        print("✅ Cache cleared successfully")

    except Exception as e:
        print(f"⚠️  Cache clearing failed: {e}")

    # Now test fresh
    client = MLBProviderClient()

    print(f"\nTesting fresh MLB Provider Client (cache cleared)...")
    start_time = time.time()

    try:
        # This should now fetch fresh data and include Baseball Savant props
        all_props = await client.fetch_odds_comparison(market_type="playerprops")
        integration_time = time.time() - start_time

        print(
            f"✅ MLB Provider Client returned {len(all_props)} total props in {integration_time:.2f}s"
        )

        if all_props:
            # Count props by source
            sources = {}
            baseball_savant_props = []

            for prop in all_props:
                source = prop.get("source", "unknown")
                sources[source] = sources.get(source, 0) + 1

                if source == "baseball_savant":
                    baseball_savant_props.append(prop)

            print(f"\nProps by source:")
            for source, count in sorted(sources.items()):
                print(f"  {source}: {count} props")

            if baseball_savant_props:
                print(
                    f"\n🎯 SUCCESS: {len(baseball_savant_props)} Baseball Savant props integrated!"
                )

                print(f"\nSample Baseball Savant props:")
                for i, prop in enumerate(baseball_savant_props[:5]):
                    player_name = prop.get("player_name", "Unknown")
                    description = prop.get("description", "Unknown")
                    line = prop.get("line", "N/A")
                    confidence = prop.get("confidence", "N/A")
                    print(
                        f"  {i+1}. {player_name} - {description} (Line: {line}, Confidence: {confidence}%)"
                    )

                print(f"\n🏆 TOTAL SUCCESS!")
                print(f"   Original: 50-60 props")
                print(f"   New total: {len(all_props)} props")
                print(f"   Baseball Savant: {len(baseball_savant_props)} props")
                print(f"   Improvement: {len(all_props) / 55:.1f}x more props!")

                return True
            else:
                print(f"⚠️  Still no Baseball Savant props found")

                # Let's debug why
                print(f"\nDebugging integration issue...")
                print(f"Sample MLB props:")
                for i, prop in enumerate(all_props[:3]):
                    print(f"  {i+1}. Source: {prop.get('source', 'Unknown')}")
                    print(f"      Player: {prop.get('player_name', 'Unknown')}")
                    print(f"      Description: {prop.get('description', 'Unknown')}")

                return False

        else:
            print("❌ No props returned from MLB Provider Client!")
            return False

    except Exception as e:
        print(f"❌ Error in fresh integration test: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    result = asyncio.run(test_fresh_mlb_provider_integration())
    if result:
        print("\n✅ MISSION ACCOMPLISHED - PROP EXPANSION SUCCESSFUL!")
    else:
        print("\n❌ Integration issue needs debugging")
