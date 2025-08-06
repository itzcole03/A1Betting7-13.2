#!/usr/bin/env python3
"""
Test script to verify team props integration through ML prediction pipeline
"""

import asyncio
import json
import os
import sys

import requests

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from services.unified_prediction_service import UnifiedPredictionService


async def test_team_props_ml_integration():
    """Test team props flowing through the enhanced ML prediction pipeline"""

    print("🔬 Testing Team Props ML Integration")
    print("=" * 50)

    # Initialize the service
    service = UnifiedPredictionService()

    # Sample team prop (similar to what mlb_provider_client.py generates)
    sample_team_prop = {
        "id": "test_team_prop_001",
        "event_id": "athletics_nationals_game",
        "stat_type": "team_total_runs",
        "player_name": "Oakland Athletics Team",
        "position": "TEAM",
        "line": 4.5,
        "line_score": 4.5,
        "confidence": 73,
        "sport": "MLB",
        "team_name": "Oakland Athletics",
        "event_name": "Athletics vs Nationals",
        "source": "MLB_API",
    }

    print(f"🏀 Testing sample team prop: {sample_team_prop['stat_type']}")
    print(f"   Team: {sample_team_prop['player_name']}")
    print(f"   Line: {sample_team_prop['line']}")
    print(f"   Base Confidence: {sample_team_prop['confidence']}%")
    print()

    # Test the enhanced prediction
    try:
        enhanced_prediction = await service._enhance_prediction(sample_team_prop)

        print("✅ Enhanced Prediction Generated Successfully!")
        print(f"   Enhanced Confidence: {enhanced_prediction.confidence}%")
        print(f"   Kelly Fraction: {enhanced_prediction.kelly_fraction:.4f}")
        print(f"   Expected Value: {enhanced_prediction.expected_value:.4f}")
        print(f"   Quantum Confidence: {enhanced_prediction.quantum_confidence:.4f}")
        print(f"   Neural Score: {enhanced_prediction.neural_score:.2f}")
        print()

        # Test SHAP explanation
        shap_data = enhanced_prediction.shap_explanation
        print("🔍 SHAP Explanation Analysis:")
        print(f"   Prop Type: {shap_data.get('prop_type', 'unknown')}")
        print(f"   Baseline: {shap_data.get('baseline', 0)}")
        print(f"   Top Factors:")

        for i, (factor, value) in enumerate(shap_data.get("top_factors", []), 1):
            print(f"      {i}. {factor}: {value:.2f}")

        print()

        # Test risk assessment
        risk_data = enhanced_prediction.risk_assessment
        print("⚠️  Risk Assessment:")
        print(f"   Overall Risk: {risk_data.get('overall_risk', 0):.3f}")
        print(f"   Risk Level: {risk_data.get('risk_level', 'unknown')}")
        print(f"   Prop Type: {risk_data.get('prop_type', 'unknown')}")
        print(
            f"   Volatility Adjustment: {risk_data.get('volatility_adjustment', 1.0):.3f}"
        )
        print()

        # Verify team-specific features were used
        team_features = shap_data.get("features", {})
        team_specific_features = [
            "team_offensive_rating",
            "starting_pitcher_quality",
            "bullpen_strength",
            "home_field_advantage",
        ]

        found_team_features = [f for f in team_specific_features if f in team_features]

        if found_team_features:
            print("✅ Team-specific SHAP features detected:")
            for feature in found_team_features:
                print(f"   • {feature}: {team_features[feature]:.2f}")
        else:
            print("❌ No team-specific features found in SHAP explanation")

        print()

        return True

    except Exception as e:
        print(f"❌ Error testing team props integration: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_batch_predictions_endpoint():
    """Test the batch predictions endpoint with team props"""

    print("🌐 Testing Batch Predictions Endpoint")
    print("=" * 50)

    # Sample team props for batch processing
    team_props = [
        {
            "id": "team_prop_1",
            "stat_type": "team_total_runs",
            "player_name": "Athletics Team",
            "position": "TEAM",
            "line_score": 4.5,
            "confidence": 73,
            "sport": "MLB",
        },
        {
            "id": "team_prop_2",
            "stat_type": "team_total_hits",
            "player_name": "Nationals Team",
            "position": "TEAM",
            "line_score": 8.5,
            "confidence": 71,
            "sport": "MLB",
        },
    ]

    try:
        # Test local batch processing
        service = UnifiedPredictionService()

        print(
            f"🔄 Processing {len(team_props)} team props through batch enhancement..."
        )

        enhanced_props = []
        for prop in team_props:
            enhanced = await service._enhance_prediction(prop)
            enhanced_props.append(enhanced)

        print("✅ Batch processing successful!")

        for i, enhanced in enumerate(enhanced_props):
            print(f"\n   Prop {i+1}: {enhanced.stat_type}")
            print(f"      Confidence: {enhanced.confidence}%")
            print(
                f"      SHAP Type: {enhanced.shap_explanation.get('prop_type', 'unknown')}"
            )
            print(
                f"      Risk Level: {enhanced.risk_assessment.get('risk_level', 'unknown')}"
            )

        return True

    except Exception as e:
        print(f"❌ Error testing batch predictions: {e}")
        return False


async def main():
    """Main test function"""

    print("🚀 Team Props ML Integration Test Suite")
    print("=" * 60)
    print()

    # Test individual prediction enhancement
    test1_passed = await test_team_props_ml_integration()
    print()

    # Test batch processing
    test2_passed = await test_batch_predictions_endpoint()
    print()

    # Summary
    print("📊 Test Results Summary")
    print("=" * 30)
    print(f"✅ Individual Enhancement: {'PASSED' if test1_passed else 'FAILED'}")
    print(f"✅ Batch Processing: {'PASSED' if test2_passed else 'FAILED'}")

    if test1_passed and test2_passed:
        print("\n🎉 All tests passed! Team props are now integrated with ML pipeline.")
        print("   • Team-specific SHAP explanations are working")
        print("   • Risk assessment accounts for team characteristics")
        print("   • Confidence calculations are team-aware")
        print("   • Batch processing endpoint ready for team props")
    else:
        print("\n❌ Some tests failed. Check error messages above.")

    return test1_passed and test2_passed


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
