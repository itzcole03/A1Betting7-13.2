#!/usr/bin/env python3
"""
Quick endpoint test script for unified sports API
"""
import requests
import time
import sys

def test_endpoints():
    """Test sports endpoints quickly"""
    base_url = "http://127.0.0.1:8000"

    endpoints = [
        "/sports/",
        "/api/sports/health",
        "/api/sports/status",
        "/sports/nba/teams",
        "/sports/mlb/games"
    ]

    print("🚀 Testing unified sports API endpoints...")

    for endpoint in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            print(f"Testing: {url}")
            response = requests.get(url, timeout=2)

            if response.status_code == 200:
                print(f"✅ {endpoint}: {response.status_code}")
                # Print first 200 chars of response
                content = response.text[:200] + "..." if len(response.text) > 200 else response.text
                print(f"   Response: {content}")
            else:
                print(f"❌ {endpoint}: {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"❌ {endpoint}: Connection failed - {e}")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

if __name__ == "__main__":
    # Wait a moment for server to start
    time.sleep(3)
    test_endpoints()