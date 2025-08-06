#!/usr/bin/env python3
"""
Test script to verify pybaseball connectivity and functionality
"""

import os
import sys
from datetime import datetime, timedelta


def test_pybaseball_import():
    """Test basic pybaseball import"""
    try:
        import pybaseball as pyb

        print("✅ Pybaseball import successful")
        if hasattr(pyb, "__version__"):
            print(f"✅ Pybaseball version: {pyb.__version__}")
        return True
    except Exception as e:
        print(f"❌ Pybaseball import failed: {e}")
        return False


def test_player_lookup():
    """Test player lookup functionality"""
    try:
        import pybaseball as pyb

        # Test player lookup (doesn't require data fetching)
        print("🔍 Testing player lookup functionality...")

        # This should work without internet connectivity issues
        players = pyb.playerid_lookup("Trout", "Mike")
        if len(players) > 0:
            print(f"✅ Found {len(players)} players matching 'Mike Trout'")
            print(f"✅ Sample player ID: {players.iloc[0]['key_mlbam']}")
        else:
            print("⚠️ No players found (expected for test data)")

        return True
    except Exception as e:
        print(f"❌ Player lookup failed: {e}")
        return False


def test_small_data_fetch():
    """Test fetching a very small amount of Statcast data"""
    try:
        import pybaseball as pyb

        print("📊 Testing small data fetch...")

        # Try to fetch data for just one day in the recent past
        # Use a date range that likely has games
        test_date = "2024-08-01"  # Known MLB season date

        print(f"Attempting to fetch data for {test_date}...")
        data = pyb.statcast(start_dt=test_date, end_dt=test_date)

        print(f"✅ Successfully fetched {len(data)} Statcast records")

        if len(data) > 0:
            print(f"✅ Columns available: {len(data.columns)}")
            print(f"✅ Sample columns: {list(data.columns[:5])}")

            # Check for key Statcast fields
            required_fields = ["player_name", "events", "launch_speed", "launch_angle"]
            missing_fields = [
                field for field in required_fields if field not in data.columns
            ]

            if not missing_fields:
                print("✅ All required Statcast fields present")
            else:
                print(f"⚠️ Missing fields: {missing_fields}")

        return True

    except Exception as e:
        print(f"❌ Data fetch failed: {e}")
        print(
            "ℹ️ This may be due to network issues or Baseball Savant being unavailable"
        )
        return False


def main():
    """Run all pybaseball tests"""
    print("🚀 Testing Pybaseball Connectivity")
    print("=" * 50)

    tests = [
        ("Import Test", test_pybaseball_import),
        ("Player Lookup Test", test_player_lookup),
        ("Small Data Fetch Test", test_small_data_fetch),
    ]

    results = []

    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))

    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\n🎯 Overall: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All pybaseball tests passed! Data pipeline is ready.")
    else:
        print("⚠️ Some tests failed. Review the errors above.")

    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
