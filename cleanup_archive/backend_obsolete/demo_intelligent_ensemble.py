"""
Intelligent Ensemble System Demo and Test Script

This script demonstrates the intelligent ensemble system for A1Betting,
showing how all prediction engines are combined for maximum accuracy.
"""

import asyncio
import logging
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def demo_intelligent_ensemble():
    """Demonstrate the intelligent ensemble system"""

    print("=" * 60)
    print("🚀 A1BETTING INTELLIGENT ENSEMBLE SYSTEM DEMO")
    print("=" * 60)

    try:
        # Import the enhanced data fetchers
        from services.data_fetchers_enhanced import (
            fetch_current_prizepicks_props_with_ensemble,
            generate_optimal_betting_lineup,
        )

        print("\n✅ Successfully imported intelligent ensemble system")

        # Test 1: Fetch enhanced props
        print("\n" + "=" * 40)
        print("🧠 TEST 1: Fetching Enhanced Props")
        print("=" * 40)

        props = await fetch_current_prizepicks_props_with_ensemble()

        print(f"📊 Fetched {len(props)} enhanced props")

        # Show sample props
        for i, prop in enumerate(props[:3]):
            print(f"\n🏀 Prop {i+1}:")
            print(f"   Player: {prop.get('player_name', 'Unknown')}")
            print(f"   Sport: {prop.get('sport', 'Unknown')}")
            print(f"   Stat: {prop.get('stat_type', 'Unknown')}")
            print(f"   Line: {prop.get('line', 0)}")

            # Show ensemble enhancements if available
            if "ensemble_confidence" in prop:
                print(f"   🧠 Ensemble Confidence: {prop['ensemble_confidence']:.1f}%")
                print(f"   🎯 Win Probability: {prop['win_probability']:.1%}")
                print(f"   💰 Expected Value: {prop['expected_value']:.2f}")
                print(f"   ⚠️  Risk Score: {prop['risk_score']:.1f}")
                print(f"   📈 Recommendation: {prop['recommendation']}")
                print(
                    f"   🔧 Source Engines: {', '.join(prop.get('source_engines', []))}"
                )

        # Test 2: Generate optimal lineup
        print("\n" + "=" * 40)
        print("🏆 TEST 2: Generating Optimal Lineup")
        print("=" * 40)

        lineup = await generate_optimal_betting_lineup(props, lineup_size=5)

        print(f"\n🎯 OPTIMAL LINEUP RESULTS:")
        print(
            f"   Combined Win Probability: {lineup.get('total_win_probability', 0):.1%}"
        )
        print(f"   Total Expected Value: {lineup.get('expected_value', 0):.2f}")
        print(f"   Average Confidence: {lineup.get('confidence', 0):.1f}%")
        print(f"   Risk Score: {lineup.get('risk_score', 0):.1f}")
        print(f"   Overall Recommendation: {lineup.get('recommendation', 'Unknown')}")

        print(f"\n📋 LINEUP DETAILS:")
        for i, bet in enumerate(lineup.get("lineup", [])[:5]):
            print(
                f"   {i+1}. {bet.get('player_name', 'Unknown')} ({bet.get('sport', 'Unknown')})"
            )
            print(
                f"      {bet.get('stat_type', 'Unknown')}: {bet.get('prediction', 0):.1f}"
            )
            print(
                f"      Win Prob: {bet.get('win_probability', 0):.1%} | Confidence: {bet.get('confidence', 0):.1f}%"
            )
            print(f"      Recommendation: {bet.get('recommendation', 'Unknown')}")

        # Test 3: Show engine availability
        print("\n" + "=" * 40)
        print("🔧 TEST 3: Engine Availability")
        print("=" * 40)

        engine_summary = lineup.get("engine_summary", {})
        available_engines = engine_summary.get("available_engines", [])
        engine_weights = engine_summary.get("engine_weights", {})

        print(f"📊 Available Prediction Engines: {len(available_engines)}")
        for engine in available_engines:
            weight = engine_weights.get(engine, 0)
            print(f"   • {engine}: {weight:.1%} weight")

        # Test 4: In-season sports filtering
        print("\n" + "=" * 40)
        print("🏅 TEST 4: In-Season Sports Filtering")
        print("=" * 40)

        in_season_sports = lineup.get("in_season_sports", [])
        print(f"📅 Currently In-Season Sports: {', '.join(in_season_sports)}")

        sports_count = {}
        for prop in props:
            sport = prop.get("sport", "Unknown")
            sports_count[sport] = sports_count.get(sport, 0) + 1

        print(f"📊 Props by Sport:")
        for sport, count in sports_count.items():
            status = "✅ IN-SEASON" if sport in in_season_sports else "❌ OFF-SEASON"
            print(f"   • {sport}: {count} props ({status})")

        print("\n" + "=" * 60)
        print("🎉 INTELLIGENT ENSEMBLE SYSTEM DEMO COMPLETE")
        print("=" * 60)

        print(f"\n📈 SUMMARY:")
        print(f"   • Enhanced {len(props)} props with ensemble predictions")
        print(f"   • Generated optimal {len(lineup.get('lineup', []))} prop lineup")
        print(
            f"   • Combined win probability: {lineup.get('total_win_probability', 0):.1%}"
        )
        print(f"   • Using {len(available_engines)} prediction engines")
        print(f"   • Filtered to {len(in_season_sports)} in-season sports")
        print(f"   • Recommendation: {lineup.get('recommendation', 'Unknown')}")

        return {
            "status": "success",
            "props_count": len(props),
            "lineup_size": len(lineup.get("lineup", [])),
            "win_probability": lineup.get("total_win_probability", 0),
            "available_engines": len(available_engines),
            "in_season_sports": len(in_season_sports),
        }

    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("⚠️  Make sure all dependencies are installed and engines are available")
        return {"status": "import_error", "error": str(e)}

    except Exception as e:
        print(f"❌ Demo Error: {e}")
        logger.exception("Demo failed")
        return {"status": "demo_error", "error": str(e)}


async def test_api_endpoints():
    """Test the enhanced API endpoints"""

    print("\n" + "=" * 60)
    print("🌐 TESTING ENHANCED API ENDPOINTS")
    print("=" * 60)

    try:
        import httpx

        base_url = "http://localhost:8000"

        async with httpx.AsyncClient(timeout=30.0) as client:

            # Test 1: Enhanced props endpoint
            print("\n🧠 Testing /api/prizepicks/props?enhanced=true")
            response = await client.get(
                f"{base_url}/api/prizepicks/props?enhanced=true"
            )

            if response.status_code == 200:
                props = response.json()
                print(f"✅ Success: Fetched {len(props)} enhanced props")

                # Check for ensemble enhancements
                enhanced_count = sum(
                    1 for prop in props if "ensemble_confidence" in prop
                )
                print(f"🧠 Enhanced props: {enhanced_count}/{len(props)}")
            else:
                print(f"❌ Failed: Status {response.status_code}")

            # Test 2: Optimal lineup endpoint
            print(f"\n🏆 Testing /api/prizepicks/lineup/optimal")
            response = await client.get(
                f"{base_url}/api/prizepicks/lineup/optimal?lineup_size=5"
            )

            if response.status_code == 200:
                lineup = response.json()
                print(f"✅ Success: Generated optimal lineup")
                print(
                    f"🎯 Win Probability: {lineup.get('total_win_probability', 0):.1%}"
                )
                print(f"📊 Lineup Size: {len(lineup.get('lineup', []))}")
            else:
                print(f"❌ Failed: Status {response.status_code}")

            # Test 3: Lineup analysis endpoint
            print(f"\n🔍 Testing /api/prizepicks/lineup/analysis")
            # This would require prop IDs, so we'll skip the actual call
            print("⚠️  Skipping analysis test (requires specific prop IDs)")

    except Exception as e:
        print(f"❌ API Test Error: {e}")
        print("⚠️  Make sure the backend is running on localhost:8000")


if __name__ == "__main__":
    print("🚀 Starting A1Betting Intelligent Ensemble System Demo...")

    # Run the demo
    result = asyncio.run(demo_intelligent_ensemble())

    if result["status"] == "success":
        print("\n🎉 Demo completed successfully!")

        # Optionally test API endpoints if backend is running
        print(
            "\n❓ Would you like to test the API endpoints? (Backend must be running)"
        )
        print("   Run: python -m uvicorn main:app --host 0.0.0.0 --port 8000")
        # asyncio.run(test_api_endpoints())
    else:
        print(f"\n❌ Demo failed: {result.get('error', 'Unknown error')}")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure all dependencies are installed")
        print("   2. Check that prediction engines are available")
        print("   3. Verify API keys are configured in .env files")
        print("   4. Review logs for specific error details")
