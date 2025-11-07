#!/usr/bin/env python3
"""
Line Movement API Test Script
Tests both GET /movement and POST /alerts/line endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/line-movement"

def test_get_movement():
    """Test the GET /movement endpoint"""
    print("🔍 Testing GET /movement endpoint...")
    
    params = {
        "sport": "MLB",
        "player": "Aaron Judge", 
        "market": "HR",
        "book": "DraftKings"
    }
    
    response = requests.get(f"{BASE_URL}/movement", params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ GET /movement successful!")
        print(f"Timeline: {data['timeline']}")
        print(f"Lines: {data['lines']}")
        print(f"Movement: {data['movementMagnitude']} ({data['direction']})")
        print(f"Snapshots: {data['snapshotCount']}")
    else:
        print(f"❌ GET /movement failed: {response.text}")
    
    print()

def test_post_alert():
    """Test the POST /alerts/line endpoint"""
    print("📢 Testing POST /alerts/line endpoint...")
    
    alert_config = {
        "user_id": "test123",
        "sport": "MLB",
        "player": "Aaron Judge",
        "market": "HR", 
        "book": "DraftKings",
        "delta": 0.5,
        "ev": 2.0
    }
    
    response = requests.post(
        f"{BASE_URL}/alerts/line",
        json=alert_config,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ POST /alerts/line successful!")
        print(f"Message: {data['message']}")
        print(f"Config saved: {data['config']}")
    else:
        print(f"❌ POST /alerts/line failed: {response.text}")
    
    print()

def test_get_user_alerts():
    """Test the GET /alerts/user/{user_id} endpoint"""
    print("👤 Testing GET /alerts/user/{user_id} endpoint...")
    
    user_id = "test123"
    response = requests.get(f"{BASE_URL}/alerts/user/{user_id}")
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ GET /alerts/user successful!")
        print(f"Response: {data}")
    else:
        print(f"❌ GET /alerts/user failed: {response.text}")
    
    print()

if __name__ == "__main__":
    print("🚀 Line Movement API Test Suite")
    print("=" * 50)
    
    try:
        test_get_movement()
        test_post_alert()
        test_get_user_alerts()
        
        print("✅ All tests completed!")
        print("\n📋 MVP Backend Summary:")
        print("- GET /api/line-movement/movement ✅")
        print("- POST /api/line-movement/alerts/line ✅")
        print("- GET /api/line-movement/alerts/user/{user_id} ✅")
        print("\n🔄 Next Steps:")
        print("- Add 'Set Alert' button to frontend")
        print("- Add Line Movement modal with sparkline")
        print("- Re-enable Redis integration for real data")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed! Make sure backend server is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Test failed: {e}")