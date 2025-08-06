#!/usr/bin/env python3
"""
Test the pagination logic to ensure it will find Brewers/Braves
"""

import asyncio
import json

import aiohttp


async def test_pagination_logic():
    """Test that pagination logic will successfully fetch all props including Brewers/Braves"""

    print("🔍 Testing pagination logic...")

    async with aiohttp.ClientSession() as session:
        all_props = []
        offset = 0
        batch_size = 500
        has_more_props = True

        while has_more_props and offset < 3000:
            url = "http://127.0.0.1:8000/mlb/odds-comparison/"
            params = {
                "market_type": "playerprops",
                "limit": batch_size,
                "offset": offset,
            }

            try:
                async with session.get(url, params=params) as response:
                    batch_props = await response.json()

                    if not batch_props or len(batch_props) == 0:
                        print(f"   No more props at offset {offset}")
                        break

                    all_props.extend(batch_props)
                    print(
                        f"   Fetched {len(batch_props)} props at offset {offset}, total: {len(all_props)}"
                    )

                    if len(batch_props) < batch_size:
                        has_more_props = False
                    else:
                        offset += batch_size

            except Exception as e:
                print(f"   Error at offset {offset}: {e}")
                break

        print(f"\n📊 Pagination complete:")
        print(f"   Total props fetched: {len(all_props)}")

        # Check for unique games
        games = {}
        for prop in all_props:
            matchup = prop.get("matchup", prop.get("event_name", "Unknown"))
            if matchup not in games:
                games[matchup] = 0
            games[matchup] += 1

        print(f"   Unique games: {len(games)}")
        print(f"\n   All games:")
        for game, count in sorted(games.items()):
            print(f"     - {game}: {count} props")

        # Check for Brewers/Braves
        print(f"\n🎯 Brewers/Braves verification:")
        brewers_braves_found = False
        for game, count in games.items():
            if "Brewers" in game or "Braves" in game or "MIL" in game or "ATL" in game:
                print(f"   ✅ FOUND: {game} ({count} props)")
                brewers_braves_found = True

        if not brewers_braves_found:
            print(f"   ❌ Brewers/Braves not found")

        return brewers_braves_found


if __name__ == "__main__":
    result = asyncio.run(test_pagination_logic())
    print(
        f"\n🏆 Result: {'SUCCESS' if result else 'FAILED'} - Pagination {'will' if result else 'will NOT'} fetch Brewers/Braves props"
    )
