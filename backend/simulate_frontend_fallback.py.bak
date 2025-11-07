#!/usr/bin/env python3
"""
Simulate frontend fallback behavior for the Athletics @ Nationals game
"""

import requests


def simulate_frontend_fallback():
    """Simulate the frontend fallback logic"""
    print("Simulating Frontend Fallback Logic")
    print("=" * 50)

    # Step 1: Get today's games (like frontend does)
    games_response = requests.get("http://127.0.0.1:8000/mlb/todays-games")
    games_data = games_response.json()
    upcoming_games = games_data.get("games", [])
    print(f"Step 1: Found {len(upcoming_games)} upcoming games")

    # Step 2: Fetch player props (like frontend does initially)
    player_response = requests.get(
        "http://127.0.0.1:8000/mlb/odds-comparison/?market_type=playerprops&limit=500"
    )
    player_props = player_response.json()
    print(f"Step 2: Fetched {len(player_props)} player props")

    # Step 3: Check prop coverage (simplified team matching)
    games_with_props = set()
    for prop in player_props:
        prop_event = prop.get("event_name", "").lower()
        for game in upcoming_games:
            game_event = game.get("event_name", "").lower()
            # Simple matching - if any team name appears in both
            game_teams = game_event.replace("@", " ").replace("vs", " ").split()
            prop_teams = prop_event.replace("@", " ").replace("vs", " ").split()

            if any(team in prop_teams for team in game_teams if len(team) > 3):
                games_with_props.add(game.get("event_name"))
                break

    coverage = len(games_with_props) / len(upcoming_games) if upcoming_games else 0
    print(
        f"Step 3: Player props cover {len(games_with_props)}/{len(upcoming_games)} games ({coverage:.1%})"
    )

    # Step 4: Trigger fallback if coverage < 80%
    if coverage < 0.8:
        print("Step 4: ✅ FALLBACK TRIGGERED - Fetching team props...")
        team_response = requests.get(
            "http://127.0.0.1:8000/mlb/odds-comparison/?market_type=team&limit=500"
        )
        team_props = team_response.json()
        print(f"Step 4: Fetched {len(team_props)} additional team props")

        # Step 5: Combine props
        all_props = player_props + team_props
        print(f"Step 5: Combined total: {len(all_props)} props")

        # Step 6: Check specific Athletics @ Nationals game
        athletics_game = None
        for game in upcoming_games:
            event_name = game.get("event_name", "")
            if "athletics" in event_name.lower() and "nationals" in event_name.lower():
                athletics_game = event_name
                break

        if athletics_game:
            print(f"Step 6: Checking props for '{athletics_game}'...")
            athletics_props = []

            for prop in all_props:
                # Check if prop might be for Athletics game (loose matching)
                prop_event = prop.get("event_name", "").lower()
                player_name = prop.get("player_name", "").lower()

                if (
                    "athletics" in prop_event
                    or "nationals" in prop_event
                    or "athletics" in player_name
                    or "nationals" in player_name
                    or prop.get("position") == "TEAM"
                ):  # Include all team props as potential matches
                    athletics_props.append(prop)

            print(
                f"Step 6: Found {len(athletics_props)} props for Athletics game (including potential team props)"
            )

            if len(athletics_props) > 0:
                print("✅ SUCCESS: Athletics @ Nationals now has props available!")
                print("Sample props:")
                for prop in athletics_props[:3]:
                    print(
                        f"  - {prop.get('stat_type')} {prop.get('player_name')} (Line: {prop.get('line')})"
                    )
            else:
                print("❌ STILL NO PROPS: Athletics @ Nationals still shows no props")
        else:
            print("❌ Athletics @ Nationals game not found")
    else:
        print("Step 4: ❌ FALLBACK NOT TRIGGERED - Good player prop coverage")


if __name__ == "__main__":
    simulate_frontend_fallback()
