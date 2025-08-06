"""
Test script for Baseball Savant integration and expanded prop coverage.

This script tests the new comprehensive player prop generation
to verify we're getting 500-1000+ props instead of 50-60.
"""

import asyncio
import json
import logging
import time

from backend.services.baseball_savant_client import baseball_savant_client
from backend.services.mlb_provider_client import MLBProviderClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_baseball_savant_integration():
    """Test the Baseball Savant integration and prop expansion."""

    print("=" * 80)
    print("TESTING BASEBALL SAVANT INTEGRATION - EXPANDED PROP COVERAGE")
    print("=" * 80)

    try:
        # Test 1: Get active players
        print("\n1. Testing active player retrieval...")
        start_time = time.time()

        active_players = await baseball_savant_client.get_all_active_players()
        player_fetch_time = time.time() - start_time

        print(
            f"✅ Found {len(active_players)} active players in {player_fetch_time:.2f}s"
        )

        if active_players:
            print(f"Sample players:")
            for i, player in enumerate(active_players[:5]):
                print(
                    f"  {i+1}. {player.get('name', 'Unknown')} ({player.get('team', 'Unknown')}) - {player.get('position_type', 'Unknown')}"
                )

        # Test 2: Generate comprehensive props (limited sample)
        print(f"\n2. Testing comprehensive prop generation (sample of 10 players)...")
        start_time = time.time()

        # Test with limited players first
        comprehensive_props = await baseball_savant_client.generate_comprehensive_props(
            max_players=10
        )
        prop_gen_time = time.time() - start_time

        print(
            f"✅ Generated {len(comprehensive_props)} props from 10 players in {prop_gen_time:.2f}s"
        )

        if comprehensive_props:
            # Analyze prop distribution by category
            categories = {}
            prop_types = {}

            for prop in comprehensive_props:
                category = prop.get("category", "unknown")
                prop_type = prop.get("prop_type", "unknown")

                categories[category] = categories.get(category, 0) + 1
                prop_types[prop_type] = prop_types.get(prop_type, 0) + 1

            print(f"\nProp distribution by category:")
            for category, count in sorted(categories.items()):
                print(f"  {category}: {count} props")

            print(f"\nTop prop types:")
            for prop_type, count in sorted(
                prop_types.items(), key=lambda x: x[1], reverse=True
            )[:10]:
                print(f"  {prop_type}: {count} props")

            print(f"\nSample props:")
            for i, prop in enumerate(comprehensive_props[:5]):
                print(
                    f"  {i+1}. {prop.get('player_name', 'Unknown')} - {prop.get('description', 'Unknown')} (Line: {prop.get('line', 'N/A')}, Confidence: {prop.get('confidence', 'N/A')}%)"
                )

        # Test 3: Test MLB Provider Client integration
        print(f"\n3. Testing MLB Provider Client integration...")
        start_time = time.time()

        mlb_client = MLBProviderClient()
        all_props = await mlb_client.fetch_odds_comparison(market_type="playerprops")
        integration_time = time.time() - start_time

        print(
            f"✅ MLB Provider Client returned {len(all_props)} total props in {integration_time:.2f}s"
        )

        if all_props:
            # Count props by source
            sources = {}
            for prop in all_props:
                source = prop.get("source", "unknown")
                sources[source] = sources.get(source, 0) + 1

            print(f"\nProps by source:")
            for source, count in sorted(sources.items()):
                print(f"  {source}: {count} props")

            print(f"\nSample integrated props:")
            for i, prop in enumerate(all_props[:3]):
                print(
                    f"  {i+1}. {prop.get('player_name', 'Unknown')} - {prop.get('stat_type', 'Unknown')} (Source: {prop.get('source', 'Unknown')})"
                )

        # Test 4: Performance projection
        print(f"\n4. Performance projection for full coverage...")

        total_players = len(active_players)
        props_per_player = len(comprehensive_props) / 10 if comprehensive_props else 0
        projected_total_props = total_players * props_per_player

        print(f"📊 Performance Analysis:")
        print(f"  Total active players: {total_players}")
        print(f"  Average props per player: {props_per_player:.1f}")
        print(f"  Projected total props: {projected_total_props:.0f}")
        print(
            f"  Expansion factor: {projected_total_props / 50:.1f}x (vs. current ~50 props)"
        )

        if projected_total_props > 500:
            print(
                f"✅ SUCCESS: Projected {projected_total_props:.0f} props exceeds target of 500+"
            )
        else:
            print(
                f"⚠️  WARNING: Projected {projected_total_props:.0f} props below target of 500+"
            )

        print(f"\n" + "=" * 80)
        print(f"BASEBALL SAVANT INTEGRATION TEST COMPLETE")
        print(f"Current: ~50-60 props → New: ~{projected_total_props:.0f} props")
        print(f"Expansion: {projected_total_props / 50:.1f}x improvement")
        print(f"=" * 80)

    except Exception as e:
        logger.error(f"Test failed with error: {e}", exc_info=True)
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    asyncio.run(test_baseball_savant_integration())
