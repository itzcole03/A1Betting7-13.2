#!/usr/bin/env python3
"""
Test Frontend Validation Logic
Simulate the exact frontend validation process to see where props are getting filtered out
"""

import asyncio
import json

import aiohttp


async def test_validation_logic():
    """Test what happens to props during frontend validation"""

    print("🔍 Testing Frontend Validation Logic...")

    # Get real props from backend
    async with aiohttp.ClientSession() as session:
        try:
            url = "http://127.0.0.1:8000/mlb/odds-comparison/"
            params = {"market_type": "playerprops", "limit": 50, "offset": 0}

            async with session.get(url, params=params) as response:
                props = await response.json()

                print(f"\n1. Raw props from backend: {len(props)}")

                if not props:
                    print("   ❌ No props returned from backend")
                    return

                # Analyze first few props
                print(f"\n2. Analyzing first 3 props:")
                for i, prop in enumerate(props[:3]):
                    print(f"\n   Prop {i+1}:")
                    print(f"     id: {prop.get('id', 'MISSING')}")
                    print(f"     player_name: {prop.get('player_name', 'MISSING')}")
                    print(f"     stat_type: {prop.get('stat_type', 'MISSING')}")
                    print(f"     sport: {prop.get('sport', 'MISSING')}")
                    print(f"     matchup: {prop.get('matchup', 'MISSING')}")
                    print(f"     event_name: {prop.get('event_name', 'MISSING')}")
                    print(f"     team_name: {prop.get('team_name', 'MISSING')}")
                    print(f"     line: {prop.get('line', 'MISSING')}")
                    print(f"     confidence: {prop.get('confidence', 'MISSING')}")
                    print(f"     start_time: {prop.get('start_time', 'MISSING')}")

                    # Check what frontend validation would expect
                    print(f"     Frontend mapping issues:")
                    if not prop.get("player_name"):
                        print(f"       ❌ Missing player_name")
                    if not prop.get("stat_type"):
                        print(f"       ❌ Missing stat_type")
                    if not prop.get("sport"):
                        print(f"       ❌ Missing sport")
                    if not prop.get("matchup") and not prop.get("event_name"):
                        print(f"       ❌ Missing matchup/event_name")
                    if not prop.get("line"):
                        print(f"       ❌ Missing line")
                    if not prop.get("confidence"):
                        print(f"       ❌ Missing confidence")

                # Test field mapping that frontend expects
                print(f"\n3. Testing frontend field mapping:")
                mapped_props = []
                for prop in props:
                    mapped_prop = {
                        "id": prop.get("id"),
                        "player": prop.get("player_name")
                        or prop.get("player"),  # Frontend expects 'player'
                        "matchup": prop.get("matchup") or prop.get("event_name"),
                        "stat": prop.get("stat_type")
                        or prop.get("stat"),  # Frontend expects 'stat'
                        "line": prop.get("line") or prop.get("line_score"),
                        "overOdds": prop.get("overOdds") or prop.get("odds") or 100,
                        "underOdds": prop.get("underOdds") or prop.get("odds") or 100,
                        "confidence": prop.get("confidence"),
                        "sport": prop.get("sport"),
                        "gameTime": prop.get("start_time") or prop.get("gameTime"),
                        "pickType": prop.get("pickType") or "Over",
                    }

                    # Only include if has minimum required fields
                    if all(
                        [
                            mapped_prop.get("id"),
                            mapped_prop.get("player"),
                            mapped_prop.get("sport") == "MLB",
                            mapped_prop.get("matchup"),
                            mapped_prop.get("stat"),
                            mapped_prop.get("line"),
                            mapped_prop.get("confidence"),
                        ]
                    ):
                        mapped_props.append(mapped_prop)

                print(
                    f"   Props after mapping: {len(mapped_props)} (from {len(props)})"
                )
                print(f"   Success rate: {len(mapped_props)/len(props)*100:.1f}%")

                if mapped_props:
                    print(f"\n   Sample mapped prop:")
                    sample = mapped_props[0]
                    for key, value in sample.items():
                        print(f"     {key}: {value}")

                # Check games in mapped props
                games = {}
                for prop in mapped_props:
                    matchup = prop.get("matchup", "Unknown")
                    if matchup not in games:
                        games[matchup] = 0
                    games[matchup] += 1

                print(f"\n   Games in mapped props:")
                for game, count in sorted(games.items()):
                    print(f"     - {game}: {count} props")

                print(f"\n   Looking for Brewers/Braves in mapped props:")
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
                    print(f"     ❌ No Brewers/Braves games found in mapped props")

        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_validation_logic())
