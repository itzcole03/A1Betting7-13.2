"""
Section 3 MLB Valuation System Tests

Comprehensive test suite for all Section 3 MLB valuation components:
- MLB Valuation Engine
- Binary Prop Handler
- Payout Normalizer  
- Market Context Engine
- Integration Service

Tests validate functionality, edge cases, and integration patterns.
"""

import asyncio
import sys
import traceback
from datetime import datetime
from typing import Dict, Any

# Add backend to path for imports
sys.path.append('backend')


class Section3TestRunner:
    """Test runner for Section 3 MLB valuation system"""
    
    def __init__(self):
        self.test_results = []
        self.components_tested = []
    
    async def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🧪 Starting Section 3 MLB Valuation System Tests...")
        print("=" * 60)
        
        # Test 1: MLB Valuation Engine
        await self._test_mlb_valuation_engine()
        
        # Test 2: Binary Prop Handler
        await self._test_binary_prop_handler()
        
        # Test 3: Payout Normalizer
        await self._test_payout_normalizer()
        
        # Test 4: Market Context Engine
        await self._test_market_context_engine()
        
        # Test 5: Integration Service
        await self._test_integration_service()
        
        # Test 6: End-to-End Integration
        await self._test_end_to_end_integration()
        
        # Print results
        self._print_test_summary()
    
    async def _test_mlb_valuation_engine(self):
        """Test MLB Valuation Engine"""
        print("\n1. Testing MLB Valuation Engine...")
        
        try:
            from backend.services.valuation.mlb_valuation_engine import (
                mlb_valuation_engine, PayoutStructure, MLBMarketContext
            )
            
            # Health check
            health = await mlb_valuation_engine.health_check()
            assert health["status"] == "healthy", f"Health check failed: {health}"
            print("   ✅ Health check passed")
            
            # Test prop value evaluation
            prediction = {
                "mean": 1.8,
                "variance": 0.5,
                "distribution_family": "BINOMIAL",
                "binomial_params": {"n": 4, "p": 0.25}
            }
            
            payout_structure = PayoutStructure(
                over_odds=-110,
                under_odds=-110, 
                line=1.5,
                vig_percentage=0.045
            )
            
            market_context = MLBMarketContext(
                ballpark="coors_field",
                weather_conditions="wind_out",
                pitcher_handedness="R",
                batter_handedness="L"
            )
            
            result = await mlb_valuation_engine.evaluate_prop_value(
                prediction=prediction,
                market_line=1.5,
                payout_structure=payout_structure,
                prop_type="HITS",
                market_context=market_context
            )
            
            # Validate result structure
            assert "edge_assessment" in result, "Missing edge assessment"
            assert "expected_value" in result, "Missing expected value" 
            assert result["prop_type"] == "HITS", "Incorrect prop type"
            assert result["market_line"] == 1.5, "Incorrect market line"
            
            print("   ✅ Prop value evaluation passed")
            
            # Test different prop categories
            prop_types = ["HITS", "HOME_RUNS", "STRIKEOUTS_PITCHER", "TEAM_RUNS"]
            for prop_type in prop_types:
                result = await mlb_valuation_engine.evaluate_prop_value(
                    prediction=prediction,
                    market_line=1.5,
                    payout_structure=payout_structure,
                    prop_type=prop_type
                )
                assert result["prop_type"] == prop_type, f"Failed for {prop_type}"
            
            print("   ✅ Multiple prop types passed")
            
            self.test_results.append(("MLB Valuation Engine", "PASS"))
            self.components_tested.append("mlb_valuation_engine")
            
        except Exception as e:
            print(f"   ❌ MLB Valuation Engine test failed: {e}")
            print(f"   Stack trace: {traceback.format_exc()}")
            self.test_results.append(("MLB Valuation Engine", "FAIL", str(e)))
    
    async def _test_binary_prop_handler(self):
        """Test Binary Prop Handler"""
        print("\n2. Testing Binary Prop Handler...")
        
        try:
            from backend.services.valuation.mlb_binary_prop_handler import mlb_binary_prop_handler
            
            # Health check
            health = await mlb_binary_prop_handler.health_check()
            assert health["status"] == "healthy", f"Health check failed: {health}"
            print("   ✅ Health check passed")
            
            # Test binary prop evaluation
            player_data = {
                "batting_average": 0.275,
                "projected_attempts": 4,
                "games_played": 120
            }
            
            game_context = {
                "pitcher_handedness": "R",
                "batter_handedness": "L",
                "ballpark": "coors_field",
                "weather_conditions": "wind_out",
                "home_away": "home"
            }
            
            result = await mlb_binary_prop_handler.evaluate_binary_prop(
                prop_type="hits",
                line=1.5,
                player_data=player_data,
                game_context=game_context
            )
            
            # Validate result
            assert result.prop_type == "hits", "Incorrect prop type"
            assert result.line == 1.5, "Incorrect line"
            assert 0 <= result.probability_over <= 1, "Invalid probability over"
            assert 0 <= result.probability_under <= 1, "Invalid probability under"
            assert result.confidence > 0, "Invalid confidence"
            
            print("   ✅ Binary prop evaluation passed")
            
            # Test different binary prop types
            binary_props = ["hits", "home_runs", "rbi", "stolen_bases"]
            for prop_type in binary_props:
                result = await mlb_binary_prop_handler.evaluate_binary_prop(
                    prop_type=prop_type,
                    line=1.5,
                    player_data=player_data,
                    game_context=game_context
                )
                assert result.prop_type == prop_type, f"Failed for {prop_type}"
            
            print("   ✅ Multiple binary prop types passed")
            
            # Test edge cases
            # Test with minimal data
            minimal_result = await mlb_binary_prop_handler.evaluate_binary_prop(
                prop_type="hits",
                line=2.5,
                player_data={"batting_average": 0.250},
                game_context=None
            )
            assert minimal_result.confidence > 0, "Failed with minimal data"
            
            print("   ✅ Edge cases passed")
            
            self.test_results.append(("Binary Prop Handler", "PASS"))
            self.components_tested.append("mlb_binary_prop_handler")
            
        except Exception as e:
            print(f"   ❌ Binary Prop Handler test failed: {e}")
            print(f"   Stack trace: {traceback.format_exc()}")
            self.test_results.append(("Binary Prop Handler", "FAIL", str(e)))
    
    async def _test_payout_normalizer(self):
        """Test Payout Normalizer"""
        print("\n3. Testing Payout Normalizer...")
        
        try:
            from backend.services.valuation.mlb_payout_normalizer import (
                mlb_payout_normalizer, MarketOdds, OddsQuote, OddsFormat, MarketType
            )
            
            # Health check
            health = await mlb_payout_normalizer.health_check()
            assert health["status"] == "healthy", f"Health check failed: {health}"
            print("   ✅ Health check passed")
            
            # Test market normalization
            quotes = [
                OddsQuote(odds=-110, format=OddsFormat.AMERICAN, side="over", line=1.5),
                OddsQuote(odds=-110, format=OddsFormat.AMERICAN, side="under", line=1.5)
            ]
            
            market_odds = MarketOdds(
                quotes=quotes,
                market_type=MarketType.PLAYER_PROP,
                prop_type="hits",
                player="Test Player"
            )
            
            normalized = await mlb_payout_normalizer.normalize_market(market_odds)
            
            # Validate normalization
            assert "over" in normalized.true_probabilities, "Missing over probability"
            assert "under" in normalized.true_probabilities, "Missing under probability"
            assert normalized.vig_percentage > 0, "Invalid vig percentage"
            assert abs(sum(normalized.true_probabilities.values()) - 1.0) < 0.001, "Probabilities don't sum to 1"
            
            print("   ✅ Market normalization passed")
            
            # Test Kelly Criterion
            kelly = mlb_payout_normalizer.calculate_kelly_criterion(
                true_probability=0.55,
                decimal_odds=1.909,  # -110 odds
                bankroll_fraction_cap=0.05
            )
            
            assert kelly["kelly_fraction"] >= 0, "Invalid Kelly fraction"
            assert kelly["recommended_bet"] <= 0.05, "Bet exceeds cap"
            
            print("   ✅ Kelly Criterion passed")
            
            # Test market value analysis
            our_predictions = {"over": 0.58, "under": 0.42}
            value_analysis = mlb_payout_normalizer.analyze_market_value(
                normalized, our_predictions
            )
            
            assert "value_analysis" in value_analysis, "Missing value analysis"
            assert value_analysis["best_bet"] in ["over", "under"], "Invalid best bet"
            
            print("   ✅ Market value analysis passed")
            
            self.test_results.append(("Payout Normalizer", "PASS"))
            self.components_tested.append("mlb_payout_normalizer")
            
        except Exception as e:
            print(f"   ❌ Payout Normalizer test failed: {e}")
            print(f"   Stack trace: {traceback.format_exc()}")
            self.test_results.append(("Payout Normalizer", "FAIL", str(e)))
    
    async def _test_market_context_engine(self):
        """Test Market Context Engine"""
        print("\n4. Testing Market Context Engine...")
        
        try:
            from backend.services.valuation.mlb_market_context_engine import mlb_market_context_engine
            
            # Health check
            health = await mlb_market_context_engine.health_check()
            assert health["status"] == "healthy", f"Health check failed: {health}"
            print("   ✅ Health check passed")
            
            # Test game context analysis
            weather_data = {
                "temperature": 85,
                "wind_speed": 12,
                "wind_direction": "out",
                "precipitation": 0,
                "cloud_cover": 0.2
            }
            
            matchup_data = {
                "pitcher_handedness": "R",
                "batter_handedness": "L"
            }
            
            team_data = {
                "home_team": {"recent_wins": 7, "recent_losses": 3},
                "away_team": {"recent_wins": 4, "recent_losses": 6}
            }
            
            series_info = {
                "game_number": 1,
                "is_rivalry": False,
                "is_playoff": False
            }
            
            game_context = await mlb_market_context_engine.analyze_game_context(
                ballpark="coors_field",
                weather_data=weather_data,
                game_time=datetime.now(),
                matchup_data=matchup_data,
                team_data=team_data,
                series_info=series_info
            )
            
            # Validate context
            assert game_context.ballpark.name == "Coors Field", "Incorrect ballpark"
            assert game_context.matchup_context.platoon_advantage == "batter", "Incorrect platoon advantage"
            assert len(game_context.weather["conditions"]) > 0, "No weather conditions"
            
            print("   ✅ Game context analysis passed")
            
            # Test contextual adjustments
            adjustments = mlb_market_context_engine.calculate_contextual_adjustments(
                game_context=game_context,
                prop_type="hits",
                player_position="batter"
            )
            
            assert "composite_factor" in adjustments, "Missing composite factor"
            assert adjustments["composite_factor"] > 0, "Invalid composite factor"
            
            # Coors Field with wind blowing out should favor offensive stats
            assert adjustments["composite_factor"] > 1.0, "Expected offensive boost at Coors with wind out"
            
            print("   ✅ Contextual adjustments passed")
            
            self.test_results.append(("Market Context Engine", "PASS"))
            self.components_tested.append("mlb_market_context_engine")
            
        except Exception as e:
            print(f"   ❌ Market Context Engine test failed: {e}")
            print(f"   Stack trace: {traceback.format_exc()}")
            self.test_results.append(("Market Context Engine", "FAIL", str(e)))
    
    async def _test_integration_service(self):
        """Test Integration Service"""
        print("\n5. Testing Integration Service...")
        
        try:
            from backend.services.valuation.mlb_valuation_integrator import (
                mlb_valuation_integrator, MLBValuationRequest
            )
            
            # Health check
            health = await mlb_valuation_integrator.health_check()
            assert health["status"] == "healthy", f"Health check failed: {health}"
            print("   ✅ Health check passed")
            
            # Test comprehensive evaluation
            request = MLBValuationRequest(
                prop_type="hits",
                line=1.5,
                player_data={
                    "batting_average": 0.285,
                    "projected_attempts": 4,
                    "player_name": "Test Player"
                },
                market_odds={
                    "over": -105,
                    "under": -115,
                    "line": 1.5
                },
                ballpark="coors_field",
                weather_data={
                    "temperature": 80,
                    "wind_speed": 8,
                    "wind_direction": "out"
                },
                matchup_data={
                    "pitcher_handedness": "R",
                    "batter_handedness": "L"
                },
                team_data={
                    "home_team": {"recent_wins": 6, "recent_losses": 4},
                    "away_team": {"recent_wins": 5, "recent_losses": 5}
                }
            )
            
            result = await mlb_valuation_integrator.evaluate_comprehensive(request)
            
            # Validate comprehensive result
            assert result.prop_type == "hits", "Incorrect prop type"
            assert result.line == 1.5, "Incorrect line"
            assert result.confidence >= 0, "Invalid confidence"
            assert result.expected_value is not None, "Missing expected value"
            assert result.recommendation is not None, "Missing recommendation"
            assert len(result.components_used) >= 3, "Not enough components used"
            assert result.processing_time_ms > 0, "Invalid processing time"
            
            print("   ✅ Comprehensive evaluation passed")
            
            # Test with binary prop
            binary_request = MLBValuationRequest(
                prop_type="home_runs",
                line=0.5,
                player_data={
                    "hr_rate": 0.06,
                    "projected_attempts": 4,
                    "player_name": "Power Hitter"
                },
                market_odds={
                    "over": +120,
                    "under": -150,
                    "line": 0.5
                }
            )
            
            binary_result = await mlb_valuation_integrator.evaluate_comprehensive(binary_request)
            
            assert binary_result.binary_prop_analysis is not None, "Binary analysis missing"
            assert "binary_prop_handler" in binary_result.components_used, "Binary handler not used"
            
            print("   ✅ Binary prop integration passed")
            
            self.test_results.append(("Integration Service", "PASS"))
            self.components_tested.append("mlb_valuation_integrator")
            
        except Exception as e:
            print(f"   ❌ Integration Service test failed: {e}")
            print(f"   Stack trace: {traceback.format_exc()}")
            self.test_results.append(("Integration Service", "FAIL", str(e)))
    
    async def _test_end_to_end_integration(self):
        """Test end-to-end integration"""
        print("\n6. Testing End-to-End Integration...")
        
        try:
            from backend.services.valuation.mlb_valuation_integrator import (
                mlb_valuation_integrator, MLBValuationRequest
            )
            
            # Test multiple prop types end-to-end
            test_cases = [
                {
                    "prop_type": "hits",
                    "line": 1.5,
                    "player_data": {"batting_average": 0.300, "projected_attempts": 4},
                    "expected_binary": True
                },
                {
                    "prop_type": "strikeouts_pitcher",
                    "line": 6.5,
                    "player_data": {"k_rate": 0.28, "projected_innings": 6.0},
                    "expected_binary": False
                },
                {
                    "prop_type": "runs",
                    "line": 0.5,
                    "player_data": {"runs_rate": 0.15, "projected_attempts": 4},
                    "expected_binary": True
                }
            ]
            
            for i, case in enumerate(test_cases):
                request = MLBValuationRequest(
                    prop_type=case["prop_type"],
                    line=case["line"],
                    player_data=case["player_data"],
                    market_odds={"over": -110, "under": -110, "line": case["line"]}
                )
                
                result = await mlb_valuation_integrator.evaluate_comprehensive(request)
                
                # Validate result
                assert result.prop_type == case["prop_type"], f"Case {i}: Wrong prop type"
                assert result.recommendation["action"] in ["BET", "NO_BET"], f"Case {i}: Invalid action"
                
                # Check binary analysis presence
                has_binary = result.binary_prop_analysis is not None
                assert has_binary == case["expected_binary"], f"Case {i}: Binary analysis mismatch"
                
                print(f"   ✅ Test case {i+1}: {case['prop_type']} passed")
            
            # Test error handling
            error_request = MLBValuationRequest(
                prop_type="invalid_prop",
                line=-1,  # Invalid line
                player_data={},
                market_odds={"over": 0, "under": 0, "line": -1}  # Invalid odds
            )
            
            error_result = await mlb_valuation_integrator.evaluate_comprehensive(error_request)
            
            # Should not crash, should return error result
            assert error_result is not None, "Should return error result"
            assert error_result.recommendation["action"] == "NO_BET", "Should recommend no bet on error"
            
            print("   ✅ Error handling passed")
            
            self.test_results.append(("End-to-End Integration", "PASS"))
            
        except Exception as e:
            print(f"   ❌ End-to-End Integration test failed: {e}")
            print(f"   Stack trace: {traceback.format_exc()}")
            self.test_results.append(("End-to-End Integration", "FAIL", str(e)))
    
    def _print_test_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🎯 Section 3 MLB Valuation System Test Results")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result[1] == "PASS")
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result[1] == "PASS" else "❌"
            print(f"{status} {result[0]}: {result[1]}")
            if result[1] == "FAIL" and len(result) > 2:
                print(f"   Error: {result[2]}")
        
        print(f"\n📊 Overall Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL SECTION 3 TESTS PASSED!")
            print("\n✅ Section 3 Components Successfully Implemented:")
            for component in self.components_tested:
                print(f"   • {component}")
            print("\n🚀 Ready to proceed to Section 4 implementation!")
        else:
            print("❌ Some tests failed. Please review and fix issues before proceeding.")
            
        print("=" * 60)


async def main():
    """Run Section 3 test suite"""
    runner = Section3TestRunner()
    await runner.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())