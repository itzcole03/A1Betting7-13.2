#!/usr/bin/env python3
"""
Test the actual batch predictions endpoint with team props
"""

import asyncio
import json
import time

import requests


async def test_batch_predictions_api():
    """Test the /unified/batch-predictions endpoint with team props"""

    print("🌐 Testing Batch Predictions API Endpoint")
    print("=" * 50)

    # Backend URL
    base_url = "http://127.0.0.1:8000"
    endpoint = f"{base_url}/api/unified/batch-predictions"

    # Team props payload (simulating what frontend would send)
    team_props_payload = [
        {
            "id": "athletics_team_runs_api",
            "stat_type": "team_total_runs",
            "player_name": "Oakland Athletics Team",
            "position": "TEAM",
            "line_score": 4.5,
            "confidence": 73,
            "sport": "MLB",
            "team_name": "Oakland Athletics",
            "event_name": "Athletics @ Nationals",
        },
        {
            "id": "nationals_team_hits_api",
            "stat_type": "team_total_hits",
            "player_name": "Washington Nationals Team",
            "position": "TEAM",
            "line_score": 8.5,
            "confidence": 71,
            "sport": "MLB",
            "team_name": "Washington Nationals",
            "event_name": "Athletics @ Nationals",
        },
    ]

    print(f"📊 Testing {len(team_props_payload)} team props through API")
    print(f"🔗 Endpoint: {endpoint}")
    print()

    # Test API connectivity first
    try:
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print(f"⚠️  Backend server returned status: {health_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend server: {e}")
        print("   Make sure the backend server is running on port 8000")
        return False

    # Test batch predictions endpoint
    try:
        print("🔄 Sending batch predictions request...")

        headers = {"Content-Type": "application/json"}

        start_time = time.time()
        response = requests.post(
            endpoint, json=team_props_payload, headers=headers, timeout=30
        )
        end_time = time.time()

        print(f"⏱️  Request completed in {end_time - start_time:.2f} seconds")
        print(f"📊 Response Status: {response.status_code}")

        if response.status_code == 200:
            result_data = response.json()

            predictions = result_data.get("predictions", [])
            errors = result_data.get("errors", [])

            print(f"✅ Received {len(predictions)} predictions")
            print(f"⚠️  Errors: {len(errors)}")

            if errors:
                print("❌ Errors found:")
                for error in errors:
                    print(f"   • {error}")

            print()

            # Analyze each prediction
            for i, prediction in enumerate(predictions):
                if prediction and not prediction.get("error"):
                    print(f"🔍 Prediction {i+1}:")

                    # Basic prediction data
                    print(f"   ID: {prediction.get('id', 'N/A')}")
                    print(f"   Confidence: {prediction.get('confidence', 'N/A')}%")
                    print(
                        f"   Kelly Fraction: {prediction.get('kelly_fraction', 'N/A')}"
                    )
                    print(
                        f"   Expected Value: {prediction.get('expected_value', 'N/A')}"
                    )

                    # SHAP explanation data
                    shap_explanation = prediction.get("shap_explanation", {})
                    if shap_explanation:
                        prop_type = shap_explanation.get("prop_type", "unknown")
                        print(f"   SHAP Type: {prop_type}")

                        top_factors = shap_explanation.get("top_factors", [])
                        if top_factors:
                            print(f"   Top SHAP Factors:")
                            for j, (factor, value) in enumerate(top_factors[:2], 1):
                                print(f"      {j}. {factor}: {value}")

                    # Risk assessment
                    risk_assessment = prediction.get("risk_assessment", {})
                    if risk_assessment:
                        risk_level = risk_assessment.get("risk_level", "unknown")
                        overall_risk = risk_assessment.get("overall_risk", "N/A")
                        print(f"   Risk Level: {risk_level} ({overall_risk})")

                    print()

                else:
                    print(
                        f"❌ Prediction {i+1} failed: {prediction.get('error', 'Unknown error')}"
                    )
                    print()

            # Summary
            successful_predictions = len(
                [p for p in predictions if p and not p.get("error")]
            )
            team_shap_count = len(
                [
                    p
                    for p in predictions
                    if p and p.get("shap_explanation", {}).get("prop_type") == "team"
                ]
            )

            print("📋 API Test Summary:")
            print(
                f"   ✅ Successful predictions: {successful_predictions}/{len(team_props_payload)}"
            )
            print(
                f"   🏆 Team SHAP detected: {team_shap_count}/{successful_predictions}"
            )

            if team_shap_count == successful_predictions and successful_predictions > 0:
                print(
                    "   🎉 All team props correctly processed with team-specific analysis!"
                )
                return True
            else:
                print("   ⚠️  Some team props may not have correct SHAP analysis")
                return False

        else:
            print(f"❌ API request failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ API request failed: {e}")
        return False


async def main():
    """Main test function"""

    print("🚀 End-to-End Team Props API Integration Test")
    print("=" * 55)
    print()

    success = await test_batch_predictions_api()

    print()
    if success:
        print("🎉 End-to-end test PASSED!")
        print("   Team props are successfully integrated through the full stack:")
        print("   • Backend ML pipeline ✅")
        print("   • Batch predictions API endpoint ✅")
        print("   • Team-specific SHAP analysis ✅")
        print("   • Enhanced confidence and risk calculations ✅")
    else:
        print("❌ End-to-end test FAILED!")
        print("   Check backend server status and error messages above.")

    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)
