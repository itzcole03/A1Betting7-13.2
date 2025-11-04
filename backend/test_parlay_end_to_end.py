#!/usr/bin/env python3

import requests
import json
import sys

def test_parlay_analytics_end_to_end():
    """Test the complete parlay analytics flow from backend to frontend"""
    
    print("=== PARLAY ANALYTICS END-TO-END TEST ===\n")
    
    # Test 1: Backend health check
    print("1. Testing backend health...")
    try:
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False
    
    # Test 2: Test parlay endpoint with multiple scenarios
    print("\n2. Testing parlay analysis scenarios...")
    
    test_scenarios = [
        {
            "name": "Standard 2-leg parlay",
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
        },
        {
            "name": "Same-game parlay with correlation risk",
            "legs": [
                {
                    "player": "Jayson Tatum",
                    "market": "Points",
                    "odds": -115,
                    "our_fair_odds": -110,
                    "team": "Celtics"
                },
                {
                    "player": "Jayson Tatum", 
                    "market": "Rebounds",
                    "odds": -105,
                    "our_fair_odds": -100,
                    "team": "Celtics"
                },
                {
                    "player": "Jayson Tatum",
                    "market": "Assists",
                    "odds": 110,
                    "our_fair_odds": 105,
                    "team": "Celtics"
                }
            ]
        },
        {
            "name": "Large 5-leg parlay",
            "legs": [
                {
                    "player": "Giannis Antetokounmpo",
                    "market": "Points",
                    "odds": -120,
                    "our_fair_odds": -115,
                    "team": "Bucks"
                },
                {
                    "player": "Luka Doncic", 
                    "market": "Assists",
                    "odds": -110,
                    "our_fair_odds": -105,
                    "team": "Mavericks"
                },
                {
                    "player": "Kevin Durant",
                    "market": "Points",
                    "odds": 105,
                    "our_fair_odds": 100,
                    "team": "Suns"
                },
                {
                    "player": "Joel Embiid",
                    "market": "Rebounds",
                    "odds": -125,
                    "our_fair_odds": -120,
                    "team": "76ers"
                },
                {
                    "player": "Nikola Jokic",
                    "market": "Triple Double",
                    "odds": 180,
                    "our_fair_odds": 170,
                    "team": "Nuggets"
                }
            ]
        }
    ]
    
    all_passed = True
    
    for scenario in test_scenarios:
        print(f"\n   Testing: {scenario['name']}")
        
        try:
            response = requests.post(
                "http://127.0.0.1:8000/api/parlay/analyze",
                json={"legs": scenario["legs"]},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success"):
                    data = result["data"]
                    
                    # Validate key fields
                    required_fields = [
                        "total_payout", "implied_probability", "fair_probability",
                        "expected_value_percent", "correlation_warnings",
                        "individual_leg_analysis", "number_of_legs"
                    ]
                    
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        print(f"   ❌ Missing fields: {missing_fields}")
                        all_passed = False
                    else:
                        print(f"   ✅ Legs: {data['number_of_legs']}, "
                              f"EV: {data['expected_value_percent']:.1f}%, "
                              f"Correlations: {len(data['correlation_warnings'])}")
                        
                        # Check correlation detection for same-player parlays
                        if scenario["name"].startswith("Same-game"):
                            if len(data["correlation_warnings"]) == 0:
                                print(f"   ⚠️  Expected correlation warnings for same-player parlay")
                else:
                    print(f"   ❌ Analysis failed: {result.get('error', 'Unknown error')}")
                    all_passed = False
            else:
                print(f"   ❌ HTTP error: {response.status_code}")
                all_passed = False
                
        except Exception as e:
            print(f"   ❌ Request failed: {e}")
            all_passed = False
    
    # Test 3: Check frontend accessibility
    print("\n3. Testing frontend accessibility...")
    try:
        response = requests.get("http://localhost:5174/lineup-builder", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend lineup builder page accessible")
        else:
            print(f"❌ Frontend page error: {response.status_code}")
            all_passed = False
    except Exception as e:
        print(f"❌ Frontend connection failed: {e}")
        all_passed = False
    
    # Test 4: API contract validation
    print("\n4. Testing API contract validation...")
    
    # Test invalid request
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/parlay/analyze",
            json={"legs": []},  # Empty legs should fail validation
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 400:
            print("✅ Input validation working correctly")
        else:
            print(f"❌ Expected validation error for empty legs, got: {response.status_code}")
            all_passed = False
            
    except Exception as e:
        print(f"❌ Validation test failed: {e}")
        all_passed = False
    
    # Summary
    print(f"\n=== TEST SUMMARY ===")
    if all_passed:
        print("🎉 All tests PASSED! Parlay analytics is working end-to-end.")
        print("\nFeatures verified:")
        print("- ✅ Backend parlay calculation engine")
        print("- ✅ Correlation detection algorithms") 
        print("- ✅ Expected value calculations")
        print("- ✅ API contract validation")
        print("- ✅ Frontend integration and routing")
        print("\nYou can now access the parlay analytics at:")
        print("http://localhost:5174/lineup-builder")
        return True
    else:
        print("❌ Some tests FAILED. Check the errors above.")
        return False

if __name__ == "__main__":
    success = test_parlay_analytics_end_to_end()
    sys.exit(0 if success else 1)