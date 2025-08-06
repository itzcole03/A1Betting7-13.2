#!/usr/bin/env python3
"""
Debug script to identify why Brewers @ Braves has no props
"""

import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

import logging

from backend.services.mlb_provider_client import MLBProviderClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def debug_prop_generation():
    """Debug prop generation for specific teams"""

    print("🔍 Debugging MLB prop generation...")

    # Initialize client
    client = MLBProviderClient()

    try:
        # Get all props
        print("\n1. Fetching ALL props...")
        all_props = await client.fetch_mlb_stats_player_props()
        print(f"   Total props generated: {len(all_props)}")

        # Group by game
        games = {}
        for prop in all_props:
            event_name = prop.get("event_name", "Unknown")
            if event_name not in games:
                games[event_name] = []
            games[event_name].append(prop)

        print(f"\n2. Props grouped by {len(games)} games:")
        for game, props in games.items():
            print(f"   - {game}: {len(props)} props")

        # Check specifically for Brewers/Braves
        print("\n3. Searching for Brewers/Braves:")
        brewers_braves_found = False
        for game in games.keys():
            if (
                "brewers" in game.lower()
                or "braves" in game.lower()
                or "milwaukee" in game.lower()
                or "atlanta" in game.lower()
            ):
                print(f"   ✅ Found: {game} ({len(games[game])} props)")
                brewers_braves_found = True

        if not brewers_braves_found:
            print("   ❌ No Brewers/Braves game found!")

        # Check odds-comparison endpoint
        print("\n4. Testing odds-comparison endpoint...")
        odds_data = await client.fetch_odds_comparison("playerprops")
        print(f"   Odds endpoint returned: {len(odds_data)} props")

        # Group odds data by game
        odds_games = {}
        for prop in odds_data:
            event_name = prop.get("event_name", "Unknown")
            if event_name not in odds_games:
                odds_games[event_name] = []
            odds_games[event_name].append(prop)

        print(f"   Odds data grouped by {len(odds_games)} games:")
        for game, props in odds_games.items():
            print(f"   - {game}: {len(props)} props")

        # Compare the two
        print(f"\n5. Comparison:")
        print(f"   Direct method: {len(all_props)} props, {len(games)} games")
        print(f"   Odds endpoint: {len(odds_data)} props, {len(odds_games)} games")

        if len(all_props) != len(odds_data):
            print("   ❌ MISMATCH! Props are being lost somewhere in the pipeline")

            # Find missing games
            all_game_names = set(games.keys())
            odds_game_names = set(odds_games.keys())
            missing_games = all_game_names - odds_game_names

            if missing_games:
                print(f"   Missing games from odds endpoint:")
                for game in missing_games:
                    print(f"     - {game} ({len(games[game])} props)")
        else:
            print("   ✅ Props match between methods")

    except Exception as e:
        print(f"❌ Error during debugging: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(debug_prop_generation())
