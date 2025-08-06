#!/usr/bin/env python3
"""
Focused test of comprehensive prop generation with the fixed Baseball Savant client
"""
import asyncio
import logging
import os
import sys
import time

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.services.baseball_savant_client import BaseballSavantClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_comprehensive_prop_generation():
    """
    Test comprehensive prop generation with the fixed client
    """
    print("=" * 60)
    print("COMPREHENSIVE PROP GENERATION TEST - WITH FIXES")
    print("=" * 60)

    client = BaseballSavantClient()

    print("\n1. Testing with 5 players to verify prop generation...")
    start_time = time.time()

    try:
        # Test with a small number of players first
        comprehensive_props = await client.generate_comprehensive_props(max_players=5)
        generation_time = time.time() - start_time

        print(
            f"✅ Generated {len(comprehensive_props)} props from 5 players in {generation_time:.2f}s"
        )

        if comprehensive_props:
            # Analyze results
            print(f"\nProp breakdown:")

            # Group by player
            player_props = {}
            for prop in comprehensive_props:
                player_name = prop.get("player_name", "Unknown")
                if player_name not in player_props:
                    player_props[player_name] = []
                player_props[player_name].append(prop)

            for player_name, props in player_props.items():
                print(f"  {player_name}: {len(props)} props")
                for prop in props[:3]:  # Show first 3 props per player
                    print(
                        f"    - {prop.get('description', 'Unknown')} (Line: {prop.get('line', 'N/A')}, Confidence: {prop.get('confidence', 'N/A')}%)"
                    )
                if len(props) > 3:
                    print(f"    ... and {len(props) - 3} more props")

            # Verify prop structure
            sample_prop = comprehensive_props[0]
            print(f"\nSample prop structure:")
            for key, value in sample_prop.items():
                print(f"  {key}: {value}")
        else:
            print("❌ No props generated!")

        print(f"\n2. Testing with larger sample (20 players)...")
        start_time = time.time()

        large_props = await client.generate_comprehensive_props(max_players=20)
        large_generation_time = time.time() - start_time

        print(
            f"✅ Generated {len(large_props)} props from 20 players in {large_generation_time:.2f}s"
        )

        if large_props:
            # Calculate average props per player
            avg_props = len(large_props) / 20
            print(f"Average props per player: {avg_props:.1f}")

            # Estimate for all 219 players
            estimated_total = avg_props * 219
            print(f"Estimated total props for all 219 players: {estimated_total:.0f}")

            print(
                f"\n🎯 SUCCESS: We can generate {estimated_total:.0f}+ props vs the current 50-60!"
            )
        else:
            print("❌ Large test failed!")

    except Exception as e:
        print(f"❌ Error in comprehensive test: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_comprehensive_prop_generation())
