#!/usr/bin/env python3
"""
Test script to verify that MLB game times are properly formatted.

This script tests the fix for the issue where game times were showing
as date-only strings instead of proper ISO datetime formats.
"""

import json
import sys
from datetime import datetime

import requests


def test_game_times():
    """Test that game times are properly formatted in API responses."""

    print("🧪 Testing MLB Game Times Fix")
    print("=" * 50)

    # Test endpoints
    endpoints = [
        ("Today's Games", "http://127.0.0.1:8000/mlb/todays-games"),
        ("Comprehensive Props", "http://127.0.0.1:8000/mlb/comprehensive-props/"),
        ("PrizePicks Props", "http://127.0.0.1:8000/mlb/prizepicks-props/"),
    ]

    all_tests_passed = True

    for name, url in endpoints:
        print(f"\n🔍 Testing {name}...")

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            if name == "Today's Games":
                # Check games array
                games = data.get("games", [])
                if not games:
                    print(f"  ⚠️  No games found in {name}")
                    continue

                for i, game in enumerate(games[:3]):  # Check first 3 games
                    game_time = game.get("time") or game.get("game_datetime")
                    if game_time:
                        if test_datetime_format(game_time):
                            print(f"  ✅ Game {i+1} time: {game_time}")
                        else:
                            print(f"  ❌ Game {i+1} invalid time format: {game_time}")
                            all_tests_passed = False
                    else:
                        print(f"  ⚠️  Game {i+1} missing time field")

            elif name == "Comprehensive Props":
                # Check sample props
                sample_props = data.get("sample_props", [])
                if not sample_props:
                    print(f"  ⚠️  No sample props found in {name}")
                    continue

                for i, prop in enumerate(sample_props[:3]):  # Check first 3 props
                    start_time = prop.get("start_time")
                    if start_time:
                        if test_datetime_format(start_time):
                            print(f"  ✅ Prop {i+1} start_time: {start_time}")
                        else:
                            print(
                                f"  ❌ Prop {i+1} invalid start_time format: {start_time}"
                            )
                            all_tests_passed = False
                    else:
                        print(f"  ⚠️  Prop {i+1} missing start_time field")

            elif name == "PrizePicks Props":
                # Check props array (PrizePicks returns array directly)
                props = data if isinstance(data, list) else []
                if not props:
                    print(f"  ⚠️  No props found in {name}")
                    continue

                for i, prop in enumerate(props[:3]):  # Check first 3 props
                    start_time = prop.get("start_time")
                    if start_time:
                        if test_datetime_format(start_time):
                            print(f"  ✅ Prop {i+1} start_time: {start_time}")
                        else:
                            print(
                                f"  ❌ Prop {i+1} invalid start_time format: {start_time}"
                            )
                            all_tests_passed = False
                    else:
                        print(f"  ⚠️  Prop {i+1} missing start_time field")

        except requests.RequestException as e:
            print(f"  ❌ Failed to fetch {name}: {e}")
            all_tests_passed = False
        except json.JSONDecodeError as e:
            print(f"  ❌ Invalid JSON response from {name}: {e}")
            all_tests_passed = False
        except Exception as e:
            print(f"  ❌ Unexpected error testing {name}: {e}")
            all_tests_passed = False

    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 ALL TESTS PASSED! Game times are properly formatted.")
        print(
            "✅ The frontend should now display correct game times instead of 'Invalid Date'"
        )
        return True
    else:
        print("❌ SOME TESTS FAILED! Please check the issues above.")
        return False


def test_datetime_format(time_str):
    """
    Test if a time string is in a valid datetime format.

    Valid formats:
    - ISO 8601: 2025-08-04T22:40:00Z
    - ISO with timezone: 2025-08-04T22:40:00+00:00
    - Python isoformat: 2025-08-04T22:40:00

    Invalid formats:
    - Date only: 2025-08-04
    - Empty string
    - Non-datetime strings
    """

    if not time_str or not isinstance(time_str, str):
        return False

    # Check if it's just a date (YYYY-MM-DD)
    if len(time_str) == 10 and time_str.count("-") == 2:
        try:
            datetime.strptime(time_str, "%Y-%m-%d")
            return False  # Valid date but not datetime - this is what we're fixing
        except ValueError:
            pass

    # Try to parse as various datetime formats
    formats_to_try = [
        "%Y-%m-%dT%H:%M:%SZ",  # 2025-08-04T22:40:00Z
        "%Y-%m-%dT%H:%M:%S%z",  # 2025-08-04T22:40:00+00:00
        "%Y-%m-%dT%H:%M:%S",  # 2025-08-04T22:40:00
        "%Y-%m-%dT%H:%M:%S.%fZ",  # With microseconds + Z
        "%Y-%m-%dT%H:%M:%S.%f%z",  # With microseconds + timezone
        "%Y-%m-%dT%H:%M:%S.%f",  # With microseconds
    ]

    for fmt in formats_to_try:
        try:
            datetime.strptime(time_str, fmt)
            return True
        except ValueError:
            continue

    return False


if __name__ == "__main__":
    success = test_game_times()
    sys.exit(0 if success else 1)
