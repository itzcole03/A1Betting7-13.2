#!/usr/bin/env python3
"""
Test script to verify seasonal filtering functionality
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone

from simple_server import get_in_season_sports


def test_seasonal_filtering():
    """Test the seasonal filtering functionality"""
    print("🧪 Testing seasonal filtering...")

    # Test July (current month)
    july_sports = get_in_season_sports(7)
    print(f"📅 July (month 7) in-season sports: {july_sports}")

    # Test September (NFL season)
    september_sports = get_in_season_sports(9)
    print(f"📅 September (month 9) in-season sports: {september_sports}")

    # Test February (NFL/NBA season)
    february_sports = get_in_season_sports(2)
    print(f"📅 February (month 2) in-season sports: {february_sports}")

    # Verify July doesn't include NFL
    if "NFL" in july_sports:
        print("❌ ERROR: NFL should NOT be in season in July!")
        return False
    else:
        print("✅ CORRECT: NFL is NOT in season in July")

    # Verify July includes MLB
    if "MLB" in july_sports:
        print("✅ CORRECT: MLB is in season in July")
    else:
        print("❌ ERROR: MLB should be in season in July!")
        return False

    # Verify September includes NFL
    if "NFL" in september_sports:
        print("✅ CORRECT: NFL is in season in September")
    else:
        print("❌ ERROR: NFL should be in season in September!")
        return False

    print("✅ All seasonal filtering tests passed!")
    return True


if __name__ == "__main__":
    success = test_seasonal_filtering()
    sys.exit(0 if success else 1)
