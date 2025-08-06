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
    assert "NFL" not in july_sports, "NFL should NOT be in season in July!"
    print("✅ CORRECT: NFL is NOT in season in July")

    # Verify July includes MLB
    assert "MLB" in july_sports, "MLB should be in season in July!"
    print("✅ CORRECT: MLB is in season in July")

    # Verify September includes NFL
    assert "NFL" in september_sports, "NFL should be in season in September!"
    print("✅ CORRECT: NFL is in season in September")

    print("✅ All seasonal filtering tests passed!")


if __name__ == "__main__":
    test_seasonal_filtering()
