"""
Unit tests for EV Engine

Comprehensive test suite for Expected Value computation pipeline including:
- Core EV calculations
- Odds conversion utilities
- EV tier classification
- Batch processing
- Error handling
"""

import pytest
import math
from typing import List, Dict, Any

from backend.services.ev_engine import (
    EVEngine, 
    EVTier,
    ev_engine,
    compute_ev,
    classify_ev,
    american_to_decimal,
    decimal_to_american,
    implied_probability
)


class TestOddsConversions:
    """Test odds conversion utilities"""
    
    def test_american_to_decimal_positive(self):
        """Test positive American odds conversion"""
        assert american_to_decimal(100) == 2.0
        assert american_to_decimal(150) == 2.5
        assert american_to_decimal(200) == 3.0
        assert american_to_decimal(300) == 4.0
        
    def test_american_to_decimal_negative(self):
        """Test negative American odds conversion"""
        assert american_to_decimal(-100) == 2.0
        assert american_to_decimal(-110) == pytest.approx(1.909, rel=1e-3)
        assert american_to_decimal(-150) == pytest.approx(1.667, rel=1e-3)
        assert american_to_decimal(-200) == 1.5
        
    def test_american_to_decimal_edge_cases(self):
        """Test edge cases for American odds conversion"""
        assert american_to_decimal(0) == 1.0
        assert american_to_decimal(-1000) == pytest.approx(1.1, rel=1e-3)
        assert american_to_decimal(5000) == 51.0
        
    def test_decimal_to_american_greater_than_2(self):
        """Test decimal to American conversion for odds >= 2.0"""
        assert decimal_to_american(2.0) == 100
        assert decimal_to_american(2.5) == 150
        assert decimal_to_american(3.0) == 200
        assert decimal_to_american(4.0) == 300
        
    def test_decimal_to_american_less_than_2(self):
        """Test decimal to American conversion for odds < 2.0"""
        assert decimal_to_american(1.5) == -200
        assert abs(decimal_to_american(1.667) + 150) <= 1  # Allow rounding error
        assert abs(decimal_to_american(1.909) + 110) <= 1  # Allow rounding error
        
    def test_decimal_to_american_edge_cases(self):
        """Test edge cases for decimal to American conversion"""
        assert decimal_to_american(1.0) == 0
        assert decimal_to_american(0.5) == 0
        assert abs(decimal_to_american(1.01) + 10000) <= 1  # Allow rounding error
        
    def test_round_trip_conversions(self):
        """Test that American -> Decimal -> American preserves values"""
        american_odds = [-500, -200, -150, -110, 100, 150, 200, 500]
        
        for odds in american_odds:
            decimal = american_to_decimal(odds)
            back_to_american = decimal_to_american(decimal)
            # Allow small rounding differences
            assert abs(back_to_american - odds) <= 1
            
    def test_implied_probability_calculations(self):
        """Test implied probability calculations"""
        assert implied_probability(2.0) == 50.0  # Even odds
        assert implied_probability(1.5) == pytest.approx(66.67, rel=1e-2)
        assert implied_probability(3.0) == pytest.approx(33.33, rel=1e-2)
        assert implied_probability(1.0) == 100.0  # Certainty
        
    def test_implied_probability_edge_cases(self):
        """Test edge cases for implied probability"""
        assert implied_probability(0) == 0.0
        assert implied_probability(-1) == 0.0
        assert implied_probability(1000) == 0.1


class TestEVCalculations:
    """Test core EV calculation logic"""
    
    def test_basic_positive_ev(self):
        """Test basic positive EV calculation"""
        # Fair odds: 2.0 (50% probability)
        # Market odds: 2.2 (45.45% implied probability)
        # EV = (2.2 * 0.5) - 1 = 0.1 = 10%
        ev = compute_ev(2.0, 2.2)
        assert ev == pytest.approx(10.0, rel=1e-1)
        
    def test_basic_negative_ev(self):
        """Test basic negative EV calculation"""
        # Fair odds: 2.0 (50% probability)  
        # Market odds: 1.8 (55.56% implied probability)
        # EV = (1.8 * 0.5) - 1 = -0.1 = -10%
        ev = compute_ev(2.0, 1.8)
        assert ev == pytest.approx(-10.0, rel=1e-1)
        
    def test_zero_ev(self):
        """Test zero EV (fair odds match market odds)"""
        ev = compute_ev(2.0, 2.0)
        assert ev == pytest.approx(0.0, abs=1e-10)
        
    def test_high_probability_low_odds(self):
        """Test high probability, low odds scenario"""
        # Fair odds: 1.2 (83.33% probability)
        # Market odds: 1.25 (80% implied probability)
        # Should be positive EV
        ev = compute_ev(1.2, 1.25)
        assert ev > 0
        assert ev == pytest.approx(4.17, rel=1e-1)
        
    def test_low_probability_high_odds(self):
        """Test low probability, high odds scenario"""
        # Fair odds: 10.0 (10% probability)
        # Market odds: 12.0 (8.33% implied probability)
        # Should be positive EV
        ev = compute_ev(10.0, 12.0)
        assert ev > 0
        assert ev == pytest.approx(20.0, rel=1e-1)
        
    def test_ev_edge_cases(self):
        """Test edge cases for EV calculation"""
        # Zero odds should return 0 EV
        assert compute_ev(0, 2.0) == 0.0
        assert compute_ev(2.0, 0) == 0.0
        assert compute_ev(0, 0) == 0.0
        
        # Negative odds should return 0 EV
        assert compute_ev(-1, 2.0) == 0.0
        assert compute_ev(2.0, -1) == 0.0
        
    def test_american_odds_ev_calculation(self):
        """Test EV calculation using American odds"""
        engine = EVEngine()
        
        # Convert -110 vs +120 scenario
        # Our assessment: -110 (1.909 decimal, 52.38% probability)
        # Market: +120 (2.2 decimal, 45.45% probability)
        ev = engine.compute_ev_american(-110, 120)
        assert ev > 0  # Should be positive EV
        
        # Convert +150 vs -120 scenario  
        # Our assessment: +150 (2.5 decimal, 40% probability)
        # Market: -120 (1.833 decimal, 54.55% probability)
        ev = engine.compute_ev_american(150, -120)
        assert ev < 0  # Should be negative EV


class TestEVClassification:
    """Test EV tier classification"""
    
    def test_ev_tier_classification(self):
        """Test EV tier boundaries"""
        assert classify_ev(-5.0) == "negative"
        assert classify_ev(-0.1) == "negative"
        assert classify_ev(0.0) == "negative"  # Updated expectation
        assert classify_ev(1.0) == "low"
        assert classify_ev(2.9) == "low"
        assert classify_ev(3.0) == "moderate"
        assert classify_ev(5.0) == "moderate"
        assert classify_ev(7.9) == "moderate"
        assert classify_ev(8.0) == "high"
        assert classify_ev(15.0) == "high"
        assert classify_ev(100.0) == "high"
        
    def test_ev_tier_enum_values(self):
        """Test EVTier enum values"""
        assert EVTier.NEGATIVE.value == "negative"
        assert EVTier.LOW.value == "low"
        assert EVTier.MODERATE.value == "moderate"
        assert EVTier.HIGH.value == "high"
        
    def test_ev_engine_classify_method(self):
        """Test EVEngine classify_ev method"""
        engine = EVEngine()
        
        assert engine.classify_ev(-1.0) == EVTier.NEGATIVE
        assert engine.classify_ev(1.0) == EVTier.LOW
        assert engine.classify_ev(5.0) == EVTier.MODERATE
        assert engine.classify_ev(10.0) == EVTier.HIGH


class TestEVAnalysis:
    """Test comprehensive EV analysis functionality"""
    
    def test_analyze_opportunity_decimal(self):
        """Test comprehensive opportunity analysis with decimal odds"""
        engine = EVEngine()
        
        analysis = engine.analyze_opportunity(
            our_fair_odds=2.0,
            market_odds=2.2,
            odds_format="decimal"
        )
        
        assert analysis["ev_percent"] > 0
        assert analysis["ev_tier"] in ["low", "moderate", "high"]
        assert analysis["our_fair_odds_decimal"] == 2.0
        assert analysis["market_odds_decimal"] == 2.2
        assert analysis["is_profitable"] == True
        assert "recommendation" in analysis
        
    def test_analyze_opportunity_american(self):
        """Test comprehensive opportunity analysis with American odds"""
        engine = EVEngine()
        
        analysis = engine.analyze_opportunity(
            our_fair_odds=-110,
            market_odds=120,
            odds_format="american"
        )
        
        assert "ev_percent" in analysis
        assert "ev_tier" in analysis
        assert analysis["our_fair_odds_decimal"] > 0
        assert analysis["market_odds_decimal"] > 0
        assert "our_implied_probability" in analysis
        assert "market_implied_probability" in analysis
        assert "probability_edge" in analysis
        
    def test_analyze_opportunity_with_error(self):
        """Test analysis with invalid inputs"""
        engine = EVEngine()
        
        analysis = engine.analyze_opportunity(
            our_fair_odds=0,
            market_odds=2.0,
            odds_format="decimal"
        )
        
        assert analysis["ev_percent"] == 0.0
        assert analysis["ev_tier"] == "negative"
        assert "error" in analysis
        
    def test_recommendation_messages(self):
        """Test recommendation message generation"""
        engine = EVEngine()
        
        # High EV recommendation
        analysis = engine.analyze_opportunity(2.0, 3.0, "decimal")
        assert "Strong bet" in analysis["recommendation"]
        
        # Negative EV recommendation
        analysis = engine.analyze_opportunity(2.0, 1.5, "decimal")
        assert "Negative EV" in analysis["recommendation"]


class TestBatchProcessing:
    """Test batch processing functionality"""
    
    def test_batch_analyze_with_valid_data(self):
        """Test batch analysis with valid opportunity data"""
        engine = EVEngine()
        
        opportunities = [
            {
                "id": "opp1",
                "player": "Player A",
                "fairOdds": 2.0,
                "odds": -110,
                "market": "Points"
            },
            {
                "id": "opp2", 
                "player": "Player B",
                "projectedOdds": 1.8,
                "marketOdds": 2.0,
                "market": "Rebounds"
            },
            {
                "id": "opp3",
                "player": "Player C",
                "confidence": 60,  # 60% = 1.667 decimal odds
                "odds": 150,  # +150 = 2.5 decimal odds
                "market": "Assists"
            }
        ]
        
        enriched = engine.batch_analyze(opportunities)
        
        assert len(enriched) == 3
        
        # Check first opportunity (should have EV data)
        opp1 = enriched[0]
        assert "evPercent" in opp1
        assert "evTier" in opp1
        assert "isProfitable" in opp1
        
        # Check third opportunity (confidence-based)
        opp3 = enriched[2]
        assert "evPercent" in opp3
        assert opp3["evPercent"] is not None  # Should compute EV from confidence
        
    def test_batch_analyze_with_missing_data(self):
        """Test batch analysis with missing odds data"""
        engine = EVEngine()
        
        opportunities = [
            {
                "id": "opp1",
                "player": "Player A",
                "market": "Points"
                # Missing odds data
            },
            {
                "id": "opp2",
                "player": "Player B", 
                "fairOdds": 2.0,
                # Missing market odds
                "market": "Rebounds"
            }
        ]
        
        enriched = engine.batch_analyze(opportunities)
        
        assert len(enriched) == 2
        # Opportunities should be preserved even without EV data
        assert enriched[0]["id"] == "opp1"
        assert enriched[1]["id"] == "opp2"
        
    def test_batch_analyze_with_errors(self):
        """Test batch analysis error handling"""
        engine = EVEngine()
        
        opportunities = [
            {
                "id": "opp1",
                "player": "Player A",
                "fairOdds": "invalid",  # Invalid odds format
                "odds": -110,
                "market": "Points"
            },
            None,  # Invalid opportunity
            {
                "id": "opp3",
                "player": "Player C",
                "fairOdds": 2.0,
                "odds": 150,
                "market": "Assists"
            }
        ]
        
        enriched = engine.batch_analyze(opportunities)
        
        # Should handle errors gracefully and return available opportunities
        assert len(enriched) <= 3
        # Valid opportunity should be processed
        valid_opps = [opp for opp in enriched if opp and opp.get("id") == "opp3"]
        assert len(valid_opps) == 1


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_ev_engine_initialization(self):
        """Test EV engine initialization"""
        engine = EVEngine()
        assert engine.logger is not None
        
    def test_global_functions(self):
        """Test global convenience functions"""
        # Test global compute_ev function
        ev = compute_ev(2.0, 2.2)
        assert isinstance(ev, float)
        
        # Test global classify_ev function  
        tier = classify_ev(5.0)
        assert tier in ["negative", "low", "moderate", "high"]
        
        # Test global conversion functions
        decimal = american_to_decimal(-110)
        assert isinstance(decimal, float)
        
        american = decimal_to_american(2.0)
        assert isinstance(american, int)
        
        prob = implied_probability(2.0)
        assert isinstance(prob, float)
        
    def test_invalid_input_handling(self):
        """Test handling of invalid inputs"""
        engine = EVEngine()
        
        # Invalid odds should return 0 EV (type: ignore for testing invalid inputs)
        assert engine.compute_ev(None, 2.0) == 0.0  # type: ignore
        assert engine.compute_ev("invalid", 2.0) == 0.0  # type: ignore  
        assert engine.compute_ev(2.0, "invalid") == 0.0  # type: ignore
        
        # Invalid American odds should return 0 EV
        assert engine.compute_ev_american(None, -110) == 0.0  # type: ignore
        assert engine.compute_ev_american("invalid", -110) == 0.0  # type: ignore
        
    def test_very_large_numbers(self):
        """Test handling of very large odds values"""
        engine = EVEngine()
        
        # Very large decimal odds
        ev = engine.compute_ev(1000.0, 1100.0)
        assert isinstance(ev, float)
        assert not math.isnan(ev)
        assert not math.isinf(ev)
        
        # Very large American odds
        ev = engine.compute_ev_american(10000, 11000)
        assert isinstance(ev, float)
        assert not math.isnan(ev)
        assert not math.isinf(ev)
        
    def test_precision_handling(self):
        """Test precision in EV calculations"""
        engine = EVEngine()
        
        # Test that small differences are handled precisely
        ev1 = engine.compute_ev(2.000, 2.001)
        ev2 = engine.compute_ev(2.000, 2.002)
        
        assert ev2 > ev1  # More market value should give higher EV
        assert abs(ev2 - ev1) < 1.0  # But difference should be small


if __name__ == "__main__":
    pytest.main([__file__, "-v"])