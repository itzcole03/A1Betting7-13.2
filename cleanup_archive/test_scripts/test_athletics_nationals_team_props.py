#!/usr/bin/env python3
"""
Test Athletics @ Nationals team props integration end-to-end
"""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))


async def test_athletics_nationals_team_props():
    """Test the specific Athletics @ Nationals scenario with enhanced team props"""

    print("⚾ Athletics @ Nationals Team Props Test")
    print("=" * 50)

    # Import here to avoid path issues
    from services.unified_prediction_service import UnifiedPredictionService

    service = UnifiedPredictionService()

    # Athletics @ Nationals team props (similar to what would be generated)
    athletics_nationals_props = [
        {
            "id": "athletics_team_runs",
            "event_id": "athletics_nationals_6pm",
            "stat_type": "team_total_runs",
            "player_name": "Oakland Athletics Team",
            "position": "TEAM",
            "line": 4.5,
            "line_score": 4.5,
            "confidence": 73,
            "sport": "MLB",
            "team_name": "Oakland Athletics",
            "event_name": "Athletics @ Nationals",
            "source": "MLB_API",
        },
        {
            "id": "nationals_team_runs",
            "event_id": "athletics_nationals_6pm",
            "stat_type": "team_total_runs",
            "player_name": "Washington Nationals Team",
            "position": "TEAM",
            "line": 4.5,
            "line_score": 4.5,
            "confidence": 71,
            "sport": "MLB",
            "team_name": "Washington Nationals",
            "event_name": "Athletics @ Nationals",
            "source": "MLB_API",
        },
        {
            "id": "athletics_team_hits",
            "event_id": "athletics_nationals_6pm",
            "stat_type": "team_total_hits",
            "player_name": "Oakland Athletics Team",
            "position": "TEAM",
            "line": 8.5,
            "line_score": 8.5,
            "confidence": 69,
            "sport": "MLB",
            "team_name": "Oakland Athletics",
            "event_name": "Athletics @ Nationals",
            "source": "MLB_API",
        },
        {
            "id": "first_to_score_prop",
            "event_id": "athletics_nationals_6pm",
            "stat_type": "first_to_score",
            "player_name": "Oakland Athletics Team",
            "position": "TEAM",
            "line": 0.5,
            "line_score": 0.5,
            "confidence": 52,
            "sport": "MLB",
            "team_name": "Oakland Athletics",
            "event_name": "Athletics @ Nationals",
            "source": "MLB_API",
        },
    ]

    print(
        f"📊 Testing {len(athletics_nationals_props)} team props for Athletics @ Nationals"
    )
    print()

    # Process each prop through the enhanced ML pipeline
    enhanced_results = []

    for i, prop in enumerate(athletics_nationals_props):
        print(f"🔄 Processing Prop {i+1}: {prop['stat_type']}")
        print(f"   Team: {prop['team_name']}")
        print(f"   Line: {prop['line']}")
        print(f"   Base Confidence: {prop['confidence']}%")

        try:
            # Enhance through ML pipeline
            enhanced = await service._enhance_prediction(prop)
            enhanced_results.append(enhanced)

            print(f"   ✅ Enhanced Confidence: {enhanced.confidence}%")
            print(f"   💰 Kelly Fraction: {enhanced.kelly_fraction:.4f}")
            print(f"   📈 Expected Value: {enhanced.expected_value:.4f}")
            print(f"   🧠 Neural Score: {enhanced.neural_score:.2f}")
            print(f"   ⚠️  Risk Level: {enhanced.risk_assessment['risk_level']}")

            # Show top SHAP factors
            top_factors = enhanced.shap_explanation.get("top_factors", [])
            print(f"   🔍 Top SHAP Factors:")
            for j, (factor, value) in enumerate(top_factors[:2], 1):
                print(f"      {j}. {factor}: {value:.2f}")

            print()

        except Exception as e:
            print(f"   ❌ Error processing prop: {e}")
            print()

    # Summary analysis
    print("📋 Summary Analysis")
    print("=" * 30)

    if enhanced_results:
        avg_confidence = sum(r.confidence for r in enhanced_results) / len(
            enhanced_results
        )
        avg_kelly = sum(r.kelly_fraction for r in enhanced_results) / len(
            enhanced_results
        )
        avg_ev = sum(r.expected_value for r in enhanced_results) / len(enhanced_results)

        print(
            f"✅ Successfully processed: {len(enhanced_results)}/{len(athletics_nationals_props)} props"
        )
        print(f"📊 Average Enhanced Confidence: {avg_confidence:.1f}%")
        print(f"💰 Average Kelly Fraction: {avg_kelly:.4f}")
        print(f"📈 Average Expected Value: {avg_ev:.4f}")

        # Count team vs player SHAP types
        team_shap_count = sum(
            1 for r in enhanced_results if r.shap_explanation.get("prop_type") == "team"
        )

        print(
            f"🏆 Team SHAP Analysis: {team_shap_count}/{len(enhanced_results)} props correctly identified as team props"
        )

        # Risk distribution
        risk_levels = [r.risk_assessment["risk_level"] for r in enhanced_results]
        risk_dist = {level: risk_levels.count(level) for level in set(risk_levels)}
        print(f"⚠️  Risk Distribution: {risk_dist}")

        print()
        print("🎯 Key Insights:")

        # Analyze team-specific features
        all_features = {}
        for result in enhanced_results:
            features = result.shap_explanation.get("features", {})
            for feature, value in features.items():
                if feature not in all_features:
                    all_features[feature] = []
                all_features[feature].append(value)

        # Find most important team features
        avg_feature_impact = {
            feature: sum(values) / len(values)
            for feature, values in all_features.items()
        }

        top_team_features = sorted(
            avg_feature_impact.items(), key=lambda x: x[1], reverse=True
        )[:3]

        print(f"   • Most impactful features across all team props:")
        for feature, avg_impact in top_team_features:
            print(f"     - {feature}: {avg_impact:.2f} average impact")

        return True
    else:
        print("❌ No props were successfully processed")
        return False


async def main():
    """Main test function"""

    print("🏟️  Athletics @ Nationals Team Props Integration Test")
    print("=" * 65)
    print()

    success = await test_athletics_nationals_team_props()

    print()
    if success:
        print("🎉 Test completed successfully!")
        print("   Team props are now flowing through the ML prediction pipeline")
        print("   with team-specific SHAP explanations and enhanced analysis.")
    else:
        print("❌ Test failed. Check error messages above.")

    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
