#!/usr/bin/env python3
"""
Debug Frontend Data Flow for MLB Props
Simulates the exact frontend data fetching process to identify where props are lost
"""

import asyncio
import json

import aiohttp


async def debug_frontend_data_flow():
    """Debug the exact data flow that the frontend follows"""

    print("🔍 Debugging Frontend Data Flow for MLB Props...")

    # Step 1: Test the exact endpoint the frontend calls
    print("\n1. Testing /mlb/odds-comparison/ endpoint (what frontend calls)...")

    async with aiohttp.ClientSession() as session:
        try:
            # This is the exact endpoint and params the frontend uses
            url = "http://127.0.0.1:8000/mlb/odds-comparison/"
            params = {
                "market_type": "playerprops",
                "limit": 1000,  # High limit to get all props
                "offset": 0,
            }

            async with session.get(url, params=params) as response:
                data = await response.json()

                if isinstance(data, list):
                    props = data
                elif isinstance(data, dict) and "odds" in data:
                    props = data["odds"]
                elif isinstance(data, dict) and "data" in data:
                    props = data["data"]
                else:
                    props = []

                print(f"   Raw data returned: {len(props)} props")

                # Analyze games
                games = {}
                valid_props = 0
                missing_sport_props = 0

                for prop in props:
                    # Check if prop has required fields
                    if not isinstance(prop, dict):
                        continue

                    valid_props += 1

                    # Check sport field
                    sport = prop.get("sport", "Unknown")
                    if sport == "Unknown" or not sport:
                        missing_sport_props += 1

                    # Track games
                    away_team = prop.get("away_team", prop.get("awayTeam", "Unknown"))
                    home_team = prop.get("home_team", prop.get("homeTeam", "Unknown"))
                    matchup = f"{away_team} @ {home_team}"

                    if matchup not in games:
                        games[matchup] = 0
                    games[matchup] += 1

                print(f"   Valid prop objects: {valid_props}")
                print(f"   Props missing sport field: {missing_sport_props}")
                print(f"   Games represented: {len(games)}")

                # Show game breakdown
                print(f"\n   Games breakdown:")
                for game, count in sorted(games.items())[:10]:  # Show first 10
                    print(f"     - {game}: {count} props")
                if len(games) > 10:
                    print(f"     ... and {len(games) - 10} more games")

                # Look for Brewers/Braves specifically
                print(f"\n   Looking for Brewers/Braves:")
                brewers_braves_found = False
                for game, count in games.items():
                    if (
                        "Brewers" in game
                        or "Braves" in game
                        or "MIL" in game
                        or "ATL" in game
                    ):
                        print(f"     ✅ Found: {game} ({count} props)")
                        brewers_braves_found = True

                if not brewers_braves_found:
                    print(f"     ❌ No Brewers/Braves games found in props")

                # Sample a few props to see their structure
                if props:
                    print(f"\n   Sample prop structure:")
                    sample_prop = props[0]
                    for key, value in sample_prop.items():
                        print(f"     {key}: {value}")

                return props

        except Exception as e:
            print(f"   ❌ Error fetching data: {e}")
            return []


if __name__ == "__main__":
    asyncio.run(debug_frontend_data_flow())
