#!/usr/bin/env python3
"""
Test script to verify team props fallback logic
"""

import json

import requests


def test_player_props():
    """Test player props endpoint"""
    print("=== Testing Player Props ===")
    response = requests.get(
        "http://127.0.0.1:8000/mlb/odds-comparison/?market_type=playerprops&limit=10"
    )
    data = response.json()
    print(f"Player props: {len(data)} results")

    # Count unique games
    games = set()
    for prop in data:
        games.add(prop.get("event_name", ""))
    print(f"Unique games with player props: {len(games)}")

    return len(data), len(games)


def test_team_props():
    """Test team props endpoint"""
    print("\n=== Testing Team Props ===")
    response = requests.get(
        "http://127.0.0.1:8000/mlb/odds-comparison/?market_type=team&limit=20"
    )
    data = response.json()
    print(f"Team props: {len(data)} results")

    # Show sample
    if data:
        prop = data[0]
        print(
            f"Sample team prop: {prop.get('stat_type')} - {prop.get('player_name')} - Line: {prop.get('line')}"
        )

    return len(data)


def test_todays_games():
    """Test today's games endpoint"""
    print("\n=== Testing Today's Games ===")
    response = requests.get("http://127.0.0.1:8000/mlb/todays-games")
    data = response.json()
    games = data.get("games", [])
    print(f"Today's games: {len(games)} games")

    for game in games[:3]:
        print(f"  {game.get('away')} @ {game.get('home')} at {game.get('time')}")

    return len(games)


def main():
    """Test the team props fallback scenario"""
    print("Testing Team Props Fallback Logic")
    print("=" * 50)

    # Test all endpoints
    player_props_count, player_games_count = test_player_props()
    team_props_count = test_team_props()
    games_count = test_todays_games()

    print(f"\n=== Summary ===")
    print(f"Today's games: {games_count}")
    print(
        f"Player props: {player_props_count} props covering {player_games_count} games"
    )
    print(f"Team props: {team_props_count} props")

    # Simulate frontend fallback logic
    if games_count > 0:
        coverage_percentage = player_games_count / games_count
        print(f"Player prop coverage: {coverage_percentage:.1%}")

        if coverage_percentage < 0.8:
            print(
                "✅ FALLBACK TRIGGER: Low player prop coverage, would fetch team props"
            )
            print(f"✅ Team props available: {team_props_count} props")
        else:
            print("❌ FALLBACK NOT TRIGGERED: Good player prop coverage")

    print(
        f"\nResult: Frontend fallback logic should {'✅ WORK' if team_props_count > 0 else '❌ FAIL'}"
    )


if __name__ == "__main__":
    main()
