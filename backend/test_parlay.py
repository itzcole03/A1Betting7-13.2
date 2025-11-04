#!/usr/bin/env python3

import requests
import json

def test_parlay_endpoint():
    """Test the parlay analysis endpoint"""
    
    # Test data
    parlay_data = {
        "legs": [
            {
                "player": "LeBron James",
                "market": "Points",
                "odds": -110,
                "our_fair_odds": -105,
                "team": "Lakers"
            },
            {
                "player": "Stephen Curry", 
                "market": "Three Pointers Made",
                "odds": 120,
                "our_fair_odds": 110,
                "team": "Warriors"
            }
        ]
    }
    
    try:
        # Make the request
        response = requests.post(
            "http://127.0.0.1:8000/api/parlay/analyze",
            json=parlay_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n=== PARLAY ANALYSIS RESULT ===")
            print(json.dumps(result, indent=2))
        else:
            print(f"\nError Response: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_parlay_endpoint()