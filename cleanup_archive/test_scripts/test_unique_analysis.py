#!/usr/bin/env python3
"""
Test script to verify unique analysis content for different players
"""
import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))


async def test_unique_analysis():
    """Test that different players get unique analysis content"""
    print("🧪 Testing Unique Analysis Generation")
    print("=" * 50)

    try:
        from backend.services.enhanced_prop_analysis_service import (
            EnhancedPropAnalysisService,
        )

        service = EnhancedPropAnalysisService()

        # Test different players with direct method calls
        test_players = [
            ("Alex Call", "hits", 0.5, "Los Angeles Dodgers"),
            ("Bryan Baker", "hits", 2.5, "Los Angeles Dodgers"),
            ("Brandon Lowe", "hits", 1.5, "Tampa Bay Rays"),
            ("Rafael Devers", "total_bases", 2.5, "Boston Red Sox"),
        ]

        results = []

        for player_name, prop_type, line, team in test_players:
            print(f"\n🔍 Testing: {player_name} - {prop_type} O/U {line}")

            try:
                # Test summary generation directly
                summary = await service._generate_summary(player_name, prop_type, line)

                # Test deep analysis generation directly
                matchup = f"{team} vs Opponent"
                deep_analysis = await service._generate_deep_analysis(
                    player_name, prop_type, line, team, matchup
                )

                # Store first 100 characters for comparison
                summary_preview = summary[:100] if summary else "No summary"
                deep_preview = deep_analysis[:150] if deep_analysis else "No analysis"

                results.append(
                    {
                        "player": player_name,
                        "summary": summary_preview,
                        "deep_analysis": deep_preview,
                        "full_summary": summary,
                        "full_deep_analysis": deep_analysis,
                    }
                )

                print(f"   Summary: {summary_preview}...")
                print(f"   Deep Analysis: {deep_preview}...")

            except Exception as e:
                print(f"   ❌ Error for {player_name}: {e}")
                import traceback

                traceback.print_exc()

        # Check for uniqueness
        print(f"\n📊 Uniqueness Analysis:")
        print("-" * 30)

        summaries = [r["summary"] for r in results]
        deep_analyses = [r["deep_analysis"] for r in results]

        unique_summaries = set(summaries)
        unique_deep_analyses = set(deep_analyses)

        print(f"Total players tested: {len(results)}")
        print(f"Unique summaries generated: {len(unique_summaries)}")
        print(f"Unique deep analyses generated: {len(unique_deep_analyses)}")

        if len(unique_summaries) == len(results):
            print("✅ SUCCESS: All summaries are unique!")
        else:
            print("❌ ISSUE: Some summaries are identical")

        if len(unique_deep_analyses) == len(results):
            print("✅ SUCCESS: All deep analyses are unique!")
        else:
            print("❌ ISSUE: Some deep analyses are identical")

        # Show full unique content samples
        print(f"\n📝 Sample Results:")
        print("-" * 30)
        for i, result in enumerate(results[:2]):  # Show first 2 for comparison
            print(f"\n{i+1}. {result['player']}:")
            print(f"   Summary: {result['full_summary']}")
            print(f"   Deep Analysis Preview: {result['full_deep_analysis'][:200]}...")

    except ImportError as e:
        print(f"❌ Import error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_unique_analysis())
