#!/usr/bin/env python3
"""
Test script to validate the Enhanced Deep AI Analysis system
"""
import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.models.api_models import (
    BetAnalysisRequest,
    BetAnalysisResponse,
    PropAnalysis,
)
from backend.services.enhanced_prop_analysis_service import EnhancedPropAnalysisService


async def test_enhanced_analysis():
    """Test the enhanced analysis service with sample data"""
    print("🧠 Testing Enhanced Deep AI Analysis System")
    print("=" * 50)

    # Initialize the service
    analysis_service = EnhancedPropAnalysisService()

    # Create test data
    test_request = BetAnalysisRequest(
        player_name="Brandon Lowe",
        prop_type="Hits",
        line=1.5,
        over_odds=-110,
        under_odds=-110,
        team="Tampa Bay Rays",
        opponent="Boston Red Sox",
        game_time="2024-10-15T19:30:00Z",
    )

    print(
        f"Testing analysis for: {test_request.player_name} - {test_request.prop_type} O/U {test_request.line}"
    )
    print()

    try:
        # Generate enhanced analysis
        analysis = await analysis_service.generate_enhanced_analysis(test_request)

        if analysis:
            print("✅ Enhanced Analysis Generated Successfully!")
            print()

            # Display the analysis
            if hasattr(analysis, "deep_analysis") and analysis.deep_analysis:
                print("🧠 Deep AI Analysis:")
                print("-" * 30)
                print(analysis.deep_analysis)
                print()

                # Check for insight-focused content vs methodology
                insight_indicators = [
                    "hitting .3",  # Performance stats
                    "career average",  # Historical data
                    "last 10 games",  # Recent trends
                    "vs LHP",  # Matchup specifics
                    "allows a .",  # Opponent analysis
                    "appears generous",  # Line evaluation
                    "trending upward",  # Performance trends
                ]

                methodology_indicators = [
                    "SHAP",
                    "feature importance",
                    "exponential decay",
                    "Bayesian updating",
                    "methodology",
                    "our system analyzes",
                    "we apply",
                    "ensemble model",
                ]

                insights_found = sum(
                    1
                    for indicator in insight_indicators
                    if indicator.lower() in analysis.deep_analysis.lower()
                )
                methodology_found = sum(
                    1
                    for indicator in methodology_indicators
                    if indicator.lower() in analysis.deep_analysis.lower()
                )

                print(f"📊 Content Analysis:")
                print(f"   Insight-focused content: {insights_found} indicators found")
                print(f"   Methodology content: {methodology_found} indicators found")

                if insights_found > methodology_found:
                    print("   ✅ SUCCESS: Analysis is insight-focused!")
                elif methodology_found > insights_found:
                    print("   ❌ ISSUE: Analysis still methodology-focused")
                else:
                    print("   ⚠️  MIXED: Analysis contains both approaches")

            else:
                print("❌ No deep analysis content generated")

            if hasattr(analysis, "summary") and analysis.summary:
                print()
                print("👁️ At a Glance Summary:")
                print("-" * 30)
                print(analysis.summary)

        else:
            print("❌ No analysis generated")

    except Exception as e:
        print(f"❌ Error generating analysis: {e}")
        import traceback

        traceback.print_exc()


async def test_multiple_players():
    """Test with multiple players to verify consistency"""
    print("\n" + "=" * 50)
    print("Testing Multiple Players for Consistency")
    print("=" * 50)

    test_players = [
        ("Brandon Lowe", "Hits", 1.5, "Tampa Bay Rays"),
        ("Rafael Devers", "Total Bases", 2.5, "Boston Red Sox"),
        ("Jose Altuve", "RBIs", 1.5, "Houston Astros"),
    ]

    analysis_service = EnhancedPropAnalysisService()

    for player_name, prop_type, line, team in test_players:
        print(f"\nTesting: {player_name} - {prop_type} O/U {line}")

        test_request = BetAnalysisRequest(
            player_name=player_name,
            prop_type=prop_type,
            line=line,
            over_odds=-110,
            under_odds=-110,
            team=team,
            game_time="2024-10-15T19:30:00Z",
        )

        try:
            analysis = await analysis_service.generate_enhanced_analysis(test_request)
            if (
                analysis
                and hasattr(analysis, "deep_analysis")
                and analysis.deep_analysis
            ):
                # Check first 100 characters to verify content type
                content_preview = analysis.deep_analysis[:100].replace("\n", " ")
                print(f"   Preview: {content_preview}...")

                # Quick check for insight vs methodology
                if any(
                    word in analysis.deep_analysis.lower()
                    for word in ["hitting", "average", "career", "recent"]
                ):
                    print("   ✅ Insight-focused content detected")
                elif any(
                    word in analysis.deep_analysis.lower()
                    for word in ["shap", "methodology", "system analyzes"]
                ):
                    print("   ❌ Methodology-focused content detected")
                else:
                    print("   ⚠️  Content type unclear")
            else:
                print("   ❌ No analysis generated")

        except Exception as e:
            print(f"   ❌ Error: {e}")


if __name__ == "__main__":
    print("Starting Enhanced Deep AI Analysis Tests...")
    print()

    # Run the tests
    asyncio.run(test_enhanced_analysis())
    asyncio.run(test_multiple_players())

    print("\n" + "=" * 50)
    print("Testing Complete!")
    print("=" * 50)
