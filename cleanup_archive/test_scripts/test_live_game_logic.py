#!/usr/bin/env python3
"""
Test script to verify live game detection logic
"""


def test_game_status_filtering():
    """Test the game status filtering logic"""
    from datetime import datetime

    import pytz

    # Mock game data with different statuses
    mock_games = [
        {"status": "Scheduled", "game_datetime": "2025-08-04T22:40:00Z"},
        {
            "status": "Live",
            "game_datetime": "2025-08-04T20:00:00Z",
        },  # Started 2+ hours ago
        {
            "status": "In Progress",
            "game_datetime": "2025-08-04T21:00:00Z",
        },  # Started 1+ hour ago
        {"status": "Warmup", "game_datetime": "2025-08-04T22:30:00Z"},
        {"status": "Pre-Game", "game_datetime": "2025-08-04T22:35:00Z"},
        {"status": "Final", "game_datetime": "2025-08-04T19:00:00Z"},
        {"status": "Delayed", "game_datetime": "2025-08-04T22:00:00Z"},
        {"status": "Postponed", "game_datetime": "2025-08-04T22:15:00Z"},
    ]

    now = datetime.now(pytz.UTC)
    end_of_tomorrow = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    print("Testing game status filtering logic:")
    print(f"Current time: {now.isoformat()}")
    print(f"End time: {end_of_tomorrow.isoformat()}")
    print()

    for game in mock_games:
        game_datetime = datetime.fromisoformat(
            game["game_datetime"].replace("Z", "+00:00")
        )
        game_status = game["status"].lower()

        # Apply the same logic as the endpoint
        is_live = game_status in [
            "live",
            "in progress",
            "warmup",
            "pre-game",
            "delayed",
            "postponed",
        ]
        is_future_scheduled = game_status == "scheduled" and game_datetime >= now
        is_not_finished = game_status not in [
            "final",
            "game over",
            "completed",
            "cancelled",
        ]

        should_include = (
            (is_live or is_future_scheduled)
            and is_not_finished
            and game_datetime <= end_of_tomorrow
        )

        print(f"Game: {game['status']} at {game['game_datetime']}")
        print(f"  - is_live: {is_live}")
        print(f"  - is_future_scheduled: {is_future_scheduled}")
        print(f"  - is_not_finished: {is_not_finished}")
        print(f"  - Should include: {should_include}")
        print()


if __name__ == "__main__":
    test_game_status_filtering()
