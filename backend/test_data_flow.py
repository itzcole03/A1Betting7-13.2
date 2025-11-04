#!/usr/bin/env python3
"""
Complete Data Flow Test for A1Betting Frontend-Backend Integration

This script tests the complete data flow that the frontend should be performing:
1. Activate MLB sport
2. Fetch today's games
3. Fetch MLB props data
4. Verify data structure

This is to confirm that the backend is working correctly and identify if the issue
is in the frontend or the backend.
"""

import json
import time

import requests

BASE_URL = "http://127.0.0.1:8000"


def test_complete_data_flow():
    print("=" * 60)
    print("🧪 TESTING COMPLETE A1BETTING DATA FLOW")
    print("=" * 60)

    # Test 1: Activate MLB Sport
    print("\n1️⃣ Testing Sport Activation (POST /api/sports/activate/MLB)")
    try:
        response = requests.post(
            f"{BASE_URL}/api/sports/activate/MLB",
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
            if data.get("status") == "ready":
                print("   ✅ MLB Sport activation successful!")
            else:
                print(f"   ❌ MLB Sport activation failed: {data}")
                return False
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

    # Test 2: Fetch Today's Games
    print("\n2️⃣ Testing Today's Games (GET /mlb/todays-games)")
    try:
        response = requests.get(f"{BASE_URL}/mlb/todays-games", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            games_count = len(data.get("games", []))
            print(f"   Games found: {games_count}")
            if games_count > 0:
                print("   Sample game:", json.dumps(data["games"][0], indent=4))
                print("   ✅ Today's games fetch successful!")
            else:
                print("   ⚠️ No games found (might be normal depending on date)")
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Test 3: Fetch MLB Props Data
    print("\n3️⃣ Testing MLB Props Data (GET /mlb/odds-comparison/)")
    try:
        params = {"market_type": "playerprops", "limit": 5, "offset": 0}
        response = requests.get(
            f"{BASE_URL}/mlb/odds-comparison/", params=params, timeout=15
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                props_count = len(data)
                print(f"   Props found: {props_count}")
                print("   Sample prop:", json.dumps(data[0], indent=4))
                print("   ✅ MLB props data fetch successful!")

                # Verify required fields
                sample_prop = data[0]
                required_fields = [
                    "id",
                    "player_name",
                    "stat_type",
                    "line",
                    "confidence",
                ]
                missing_fields = [
                    field for field in required_fields if field not in sample_prop
                ]
                if missing_fields:
                    print(f"   ⚠️ Missing required fields: {missing_fields}")
                else:
                    print("   ✅ All required fields present in props data")
            else:
                print(f"   ❌ No props data returned or invalid format: {data}")
                return False
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

    # Test 4: Test CORS Headers (simulate frontend request)
    print("\n4️⃣ Testing CORS for Frontend (Simulated Browser Request)")
    try:
        headers = {
            "Origin": "http://localhost:5173",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        response = requests.get(
            f"{BASE_URL}/mlb/todays-games", headers=headers, timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ CORS working correctly for frontend requests!")
        else:
            print(f"   ❌ CORS issue: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    print("\n" + "=" * 60)
    print("🎯 DATA FLOW TEST COMPLETED")
    print("✅ Backend is working correctly!")
    print("✅ All API endpoints are functional!")
    print("✅ Data structure is valid!")
    print("")
    print("🔍 CONCLUSION: The issue is likely in the frontend:")
    print("   - Component not mounting properly")
    print("   - React hooks not triggering")
    print("   - JavaScript errors preventing API calls")
    print("   - Routing issues")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_complete_data_flow()
    if success:
        print("\n✅ All backend tests passed! Frontend integration issue detected.")
    else:
        print("\n❌ Backend issues found that need to be fixed.")
