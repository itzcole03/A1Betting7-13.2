#!/usr/bin/env python3
"""
Test script to verify the Past Matchup Tracker fix is working correctly.
"""

import json
import sys

import requests


def test_past_matchup_tracker():
    """Test that the past matchup tracker API is working."""

    print("🧪 Testing Past Matchup Tracker Fix")
    print("=" * 50)

    try:
        # Step 1: Get today's games
        print("🔍 Getting today's games...")
        games_response = requests.get("http://127.0.0.1:8000/mlb/todays-games")

        if not games_response.ok:
            print(f"❌ Failed to get today's games: {games_response.status_code}")
            return False

        games_data = games_response.json()
        games = games_data.get("games", [])

        if not games:
            print("❌ No games found")
            return False

        print(f"✅ Found {len(games)} games")

        # Step 2: Test past matchup data for scheduled (non-live) games
        scheduled_games = [g for g in games if g.get("status") == "Scheduled"]

        if not scheduled_games:
            print("❌ No scheduled games found (all may be live)")
            return False

        test_game = scheduled_games[0]
        game_id = test_game.get("game_id")
        away_team = test_game.get("away")
        home_team = test_game.get("home")

        print(f"🔍 Testing past matchups for Game {game_id}: {away_team} @ {home_team}")

        # Step 3: Test the past matchups API
        matchup_response = requests.get(
            f"http://127.0.0.1:8000/mlb/past-matchups/{game_id}"
        )

        if not matchup_response.ok:
            print(f"❌ Past matchups API failed: {matchup_response.status_code}")
            return False

        matchup_data = matchup_response.json()

        # Step 4: Validate the response structure
        required_fields = [
            "status",
            "game_id",
            "teams",
            "last_5_matchups",
            "head_to_head_record",
            "season_stats",
        ]

        for field in required_fields:
            if field not in matchup_data:
                print(f"❌ Missing required field: {field}")
                return False

        if matchup_data["status"] != "ok":
            print(f"❌ API returned error status: {matchup_data.get('status')}")
            return False

        # Step 5: Validate data content
        teams = matchup_data["teams"]
        matchups = matchup_data["last_5_matchups"]
        h2h_record = matchup_data["head_to_head_record"]
        season_stats = matchup_data["season_stats"]

        print(f"✅ API Status: {matchup_data['status']}")
        print(f"✅ Teams: {teams['away']} vs {teams['home']}")
        print(f"✅ Past Matchups: {len(matchups)} games found")
        print(
            f"✅ H2H Record: {h2h_record['away_wins']}-{h2h_record['home_wins']} (Total: {h2h_record['total_games']})"
        )

        # Display sample matchup data
        if matchups:
            print("📊 Recent Matchups:")
            for i, match in enumerate(matchups[:3]):
                print(
                    f"   {i+1}. {match['date']}: {match['away_team']} {match['away_score']}-{match['home_score']} {match['home_team']} (Winner: {match['winner']})"
                )

        # Validate season stats
        if "away_team" in season_stats and "home_team" in season_stats:
            away_stats = season_stats["away_team"]
            home_stats = season_stats["home_team"]
            print(
                f"✅ Season Stats: {teams['away']} ({away_stats['wins']}-{away_stats['losses']}) vs {teams['home']} ({home_stats['wins']}-{home_stats['losses']})"
            )

        print("=" * 50)
        print("🎉 Past Matchup Tracker fix is working correctly!")
        print("✅ The API endpoint /mlb/past-matchups/{game_id} is operational")
        print("✅ Frontend should now display past matchup data for scheduled games")
        print(
            "✅ Data includes historical matchups, head-to-head records, and season stats"
        )

        return True

    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False


if __name__ == "__main__":
    success = test_past_matchup_tracker()
    sys.exit(0 if success else 1)
