#!/usr/bin/env python3
"""
Quick test script for the odds history endpoint
"""
import json

import requests


def test_odds_history():
    base_url = "http://127.0.0.1:8000"
    endpoint = "/api/odds/history"

    # Test parameters
    params = {"prop_id": "test-prop-123", "hours_back": 24}

    try:
        response = requests.get(f"{base_url}{endpoint}", params=params)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2))

            if data.get("success"):
                snapshots = data.get("data", {}).get("snapshots", [])
                print(f"\nFound {len(snapshots)} snapshots")
                if snapshots:
                    print("Sample snapshot:")
                    print(json.dumps(snapshots[0], indent=2))
            else:
                print(f"API returned error: {data.get('error')}")
        else:
            print(f"HTTP Error: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")


if __name__ == "__main__":
    test_odds_history()
