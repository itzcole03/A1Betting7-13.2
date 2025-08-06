#!/usr/bin/env python3
"""
Find Brewers/Braves Props
Scan through all props to find where Brewers/Braves appear in the dataset
"""

import asyncio
import json

import aiohttp


async def find_brewers_braves():
    """Find where Brewers/Braves props appear in the dataset"""

    print("🔍 Searching for Brewers/Braves props...")

    async with aiohttp.ClientSession() as session:
        brewers_braves_found = False
        offset = 0
        batch_size = 500  # Max allowed

        while offset < 3000 and not brewers_braves_found:  # Don't search forever
            try:
                url = "http://127.0.0.1:8000/mlb/odds-comparison/"
                params = {
                    "market_type": "playerprops",
                    "limit": batch_size,
                    "offset": offset,
                }

                async with session.get(url, params=params) as response:
                    props = await response.json()

                    if not props or len(props) == 0:
                        print(f"   No more props at offset {offset}")
                        break

                    print(f"   Checking offset {offset}: {len(props)} props")

                    # Check for Brewers/Braves
                    games = {}
                    for prop in props:
                        matchup = prop.get("matchup", prop.get("event_name", "Unknown"))
                        if matchup not in games:
                            games[matchup] = 0
                        games[matchup] += 1

                    # Look for Brewers/Braves
                    for game, count in games.items():
                        if (
                            "Brewers" in game
                            or "Braves" in game
                            or "MIL" in game
                            or "ATL" in game
                        ):
                            print(
                                f"   ✅ FOUND: {game} ({count} props) at offset {offset}"
                            )
                            brewers_braves_found = True

                    # Show unique games at this offset
                    unique_games = list(games.keys())
                    if len(unique_games) <= 5:
                        for game in unique_games:
                            print(f"     - {game}: {games[game]} props")
                    else:
                        print(f"     - {len(unique_games)} unique games")

                    offset += batch_size

            except Exception as e:
                print(f"   ❌ Error at offset {offset}: {e}")
                break

        if not brewers_braves_found:
            print(f"\n❌ Brewers/Braves not found in first {offset} props")

            # Let's check what games ARE available
            print(f"\n📊 Summary of all games found:")
            async with session.get(
                "http://127.0.0.1:8000/mlb/odds-comparison/",
                params={"market_type": "playerprops", "limit": 500, "offset": 0},
            ) as response:
                props = await response.json()
                all_games = {}
                for prop in props:
                    matchup = prop.get("matchup", prop.get("event_name", "Unknown"))
                    if matchup not in all_games:
                        all_games[matchup] = 0
                    all_games[matchup] += 1

                print(f"   Games with props (first 500 props):")
                for game, count in sorted(all_games.items()):
                    print(f"     - {game}: {count} props")


if __name__ == "__main__":
    asyncio.run(find_brewers_braves())
