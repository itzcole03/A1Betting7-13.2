#!/usr/bin/env python3
"""
Final integration test to verify the MLB Provider Client returns Baseball Savant props
"""
import asyncio
import logging
import os
import sys
import time

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.services.mlb_provider_client import MLBProviderClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_mlb_provider_integration():
    """
    Test that MLB Provider Client returns the expanded Baseball Savant props
    """
    print("=" * 70)
    print("FINAL INTEGRATION TEST - MLB PROVIDER CLIENT + BASEBALL SAVANT")
    print("=" * 70)

    client = MLBProviderClient()

    print(f"\nTesting MLB Provider Client with Baseball Savant integration...")
    start_time = time.time()

    try:
        # This should now include both MLB Stats API and Baseball Savant props
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

                print(f"\n🏆 MISSION ACCOMPLISHED!")
                print(f"   From: 50-60 props")
                print(f"   To: {len(all_props)} props")
                print(f"   Improvement: {len(all_props) / 55:.1f}x more props!")
            else:
                print(f"⚠️  No Baseball Savant props found in integration")

        else:
            print("❌ No props returned from MLB Provider Client!")

    except Exception as e:
        print(f"❌ Error in integration test: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_mlb_provider_integration())
