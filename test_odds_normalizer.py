"""
Unit tests for OddsNormalizer - Phase 1.1 mathematical validation

Tests cover:
- American odds to decimal conversion accuracy
- Implied probability calculations
- No-vig normalization for 2-way and n-way markets
- Edge calculations
- PropFinder integration scenarios
- Mathematical validation

Run with: pytest test_odds_normalizer.py -v
"""

import pytest
import math
from backend.services.odds_normalizer import (
    OddsNormalizer, 
    NormalizedOdds, 
    MarketNormalization,
    create_propfinder_odds_response
)


class TestOddsConversion:
    """Test American ↔ Decimal odds conversion accuracy"""
    
    def setup_method(self):
        self.normalizer = OddsNormalizer(precision=4)
    
    def test_american_to_decimal_positive_odds(self):
        """Test positive American odds conversion"""
        # +150 should convert to 2.50
        assert self.normalizer.american_to_decimal(150) == 2.5
        
        # +100 (even money) should convert to 2.0  
        assert self.normalizer.american_to_decimal(100) == 2.0
        
        # +200 should convert to 3.0
        assert self.normalizer.american_to_decimal(200) == 3.0
    
    def test_american_to_decimal_negative_odds(self):
        """Test negative American odds conversion"""
        # -110 should convert to ~1.909
        result = self.normalizer.american_to_decimal(-110)
        assert abs(result - 1.9091) < 0.001
        
        # -200 should convert to 1.50
        assert self.normalizer.american_to_decimal(-200) == 1.5
        
        # -150 should convert to ~1.667
        result = self.normalizer.american_to_decimal(-150) 
        assert abs(result - 1.6667) < 0.001
    
    def test_decimal_to_american_conversion(self):
        """Test decimal to American odds conversion"""
        # 2.50 should convert to +150
        assert self.normalizer.decimal_to_american(2.5) == 150
        
        # 1.909 should convert to approximately -110
        american = self.normalizer.decimal_to_american(1.9091)
        assert abs(american - (-110)) <= 1  # Allow 1 unit tolerance
        
        # 2.0 should convert to +100
        assert self.normalizer.decimal_to_american(2.0) == 100
    
    def test_implied_probability_calculations(self):
        """Test implied probability accuracy"""
        # -110 should be ~52.38% implied probability
        prob = self.normalizer.implied_prob_from_american(-110)
        assert abs(prob - 0.5238) < 0.001
        
        # +150 should be 40% implied probability  
        prob = self.normalizer.implied_prob_from_american(150)
        assert abs(prob - 0.4) < 0.001
        
        # Even money (+100) should be 50%
        prob = self.normalizer.implied_prob_from_american(100)
        assert prob == 0.5
    
    def test_conversion_symmetry(self):
        """Test that conversions are symmetric (American → Decimal → American)"""
        test_odds = [-200, -150, -110, -105, 100, 110, 150, 200]
        
        for original_odds in test_odds:
            decimal = self.normalizer.american_to_decimal(original_odds)
            converted_back = self.normalizer.decimal_to_american(decimal)
            
            # Allow small tolerance for rounding
            assert abs(converted_back - original_odds) <= 2


class TestVigorishRemoval:
    """Test no-vig calculations for fair probability"""
    
    def setup_method(self):
        self.normalizer = OddsNormalizer(precision=4)
    
    def test_two_way_vig_removal_standard(self):
        """Test standard two-way market vig removal"""
        # Both sides -110: implied probs ~52.38% each = 104.76% total
        over_prob = self.normalizer.implied_prob_from_american(-110)
        under_prob = self.normalizer.implied_prob_from_american(-110)
        
        no_vig_over, no_vig_under = self.normalizer.remove_vig_two_way(over_prob, under_prob)
        
        # Should normalize to exactly 50/50
        assert abs(no_vig_over - 0.5) < 0.001
        assert abs(no_vig_under - 0.5) < 0.001
        assert abs((no_vig_over + no_vig_under) - 1.0) < 0.001
    
    def test_two_way_vig_removal_uneven(self):
        """Test uneven two-way market vig removal"""
        # Over -105, Under -115 (different vig on each side)
        over_prob = self.normalizer.implied_prob_from_american(-105)  # ~51.22%
        under_prob = self.normalizer.implied_prob_from_american(-115)  # ~53.49%
        
        no_vig_over, no_vig_under = self.normalizer.remove_vig_two_way(over_prob, under_prob)
        
        # Should sum to 1.0 and maintain relative proportions
        assert abs((no_vig_over + no_vig_under) - 1.0) < 0.001
        assert no_vig_over < no_vig_under  # Under was favored, should remain so
    
    def test_three_way_vig_removal(self):
        """Test three-way market vig removal"""
        # Example: Win/Draw/Loss market
        win_prob = 0.45   # 45%
        draw_prob = 0.30  # 30%  
        loss_prob = 0.35  # 35%
        # Total = 110% (10% vig)
        
        probabilities = [win_prob, draw_prob, loss_prob]
        no_vig_probs = self.normalizer.remove_vig_n_way(probabilities)
        
        # Should sum to 1.0
        assert abs(sum(no_vig_probs) - 1.0) < 0.001
        
        # Should maintain relative order
        assert no_vig_probs[0] > no_vig_probs[1]  # Win > Draw
        assert no_vig_probs[0] > no_vig_probs[2]  # Win > Loss
    
    def test_no_vig_when_probabilities_under_100(self):
        """Test behavior when market has no vig"""
        # Theoretical perfect market (no vig)
        over_prob = 0.48
        under_prob = 0.52
        # Total = 100% (no vig)
        
        no_vig_over, no_vig_under = self.normalizer.remove_vig_two_way(over_prob, under_prob)
        
        # Should return unchanged probabilities
        assert abs(no_vig_over - over_prob) < 0.001
        assert abs(no_vig_under - under_prob) < 0.001


class TestEdgeCalculations:
    """Test edge calculation accuracy"""
    
    def setup_method(self):
        self.normalizer = OddsNormalizer(precision=4)
    
    def test_positive_edge_calculation(self):
        """Test positive edge (value bet) calculation"""
        ai_probability = 0.65    # AI model: 65% chance
        implied_probability = 0.52  # Market: ~52% (-110 odds)
        
        edge = self.normalizer.calculate_edge(ai_probability, implied_probability)
        
        expected_edge = 0.65 - 0.52  # 13% edge
        assert abs(edge - expected_edge) < 0.001
        assert edge > 0  # Positive edge = value bet
    
    def test_negative_edge_calculation(self):
        """Test negative edge (bad bet) calculation"""
        ai_probability = 0.45    # AI model: 45% chance
        implied_probability = 0.60  # Market: 60% chance
        
        edge = self.normalizer.calculate_edge(ai_probability, implied_probability)
        
        expected_edge = 0.45 - 0.60  # -15% edge
        assert abs(edge - expected_edge) < 0.001
        assert edge < 0  # Negative edge = bad bet
    
    def test_zero_edge_calculation(self):
        """Test zero edge (fair market) calculation"""
        ai_probability = 0.52
        implied_probability = 0.52
        
        edge = self.normalizer.calculate_edge(ai_probability, implied_probability)
        
        assert abs(edge) < 0.001  # Should be ~0


class TestMultiBookmakerNormalization:
    """Test normalization across multiple bookmakers"""
    
    def setup_method(self):
        self.normalizer = OddsNormalizer(precision=4)
        
        # Sample multi-bookmaker odds for Over/Under 8.5 Runs
        self.sample_odds = {
            'DraftKings': {'over': -110, 'under': -110},
            'FanDuel': {'over': -105, 'under': -115}, 
            'BetMGM': {'over': -108, 'under': -112},
            'Caesars': {'over': -103, 'under': -117}
        }
    
    def test_best_line_detection(self):
        """Test finding best odds across bookmakers"""
        result = self.normalizer.normalize_bookmaker_odds(self.sample_odds)
        
        # Best over line should be -103 (Caesars)
        assert result.best_over_odds is not None
        assert result.best_over_odds.american_odds == -103
        assert result.best_over_odds.bookmaker == 'Caesars'
        
        # Best under line should be -110 (DraftKings)  
        assert result.best_under_odds is not None
        assert result.best_under_odds.american_odds == -110
        assert result.best_under_odds.bookmaker == 'DraftKings'
    
    def test_market_vig_calculation(self):
        """Test overall market vigorish calculation"""
        result = self.normalizer.normalize_bookmaker_odds(self.sample_odds)
        
        # Should have positive vig (books make profit)
        assert result.total_vig > 0
        
        # Typical sports betting vig is 2-5%
        assert 1.0 <= result.total_vig <= 6.0
        
        # Market efficiency should be reasonable
        assert 0.95 <= result.market_efficiency <= 1.0
    
    def test_individual_odds_normalization(self):
        """Test that each bookmaker's odds are properly normalized"""
        result = self.normalizer.normalize_bookmaker_odds(self.sample_odds)
        
        # Should have normalized odds for all bookmakers
        assert len(result.individual_odds) == 8  # 4 bookmakers × 2 sides
        
        # All normalized odds should have no-vig probabilities
        for odds in result.individual_odds:
            assert odds.no_vig_probability is not None
            assert 0 < odds.no_vig_probability < 1
            assert odds.bookmaker is not None


class TestPropFinderIntegration:
    """Test integration with PropFinder API response format"""
    
    def setup_method(self):
        self.normalizer = OddsNormalizer(precision=4)
        
        self.sample_bookmaker_odds = {
            'DraftKings': {'over': -110, 'under': -110},
            'FanDuel': {'over': -105, 'under': -115},
            'BetMGM': {'over': -108, 'under': -112}
        }
    
    def test_propfinder_api_response_format(self):
        """Test PropFinder API response creation"""
        ai_probability = 0.58  # 58% chance of OVER
        
        response = create_propfinder_odds_response(
            self.normalizer,
            self.sample_bookmaker_odds,
            ai_probability,
            'over'
        )
        
        # Should have all required PropFinder fields
        required_fields = ['odds', 'impliedProbability', 'aiProbability', 'edge', 
                          'bookmakers', 'marketEfficiency', 'totalVig']
        
        for field in required_fields:
            assert field in response
        
        # AI probability should match input
        assert response['aiProbability'] == 58.0  # Converted to percentage
        
        # Edge should be reasonable for value bet
        assert response['edge'] > 0  # Positive edge expected
        
        # Should have bookmaker data
        assert len(response['bookmakers']) >= 3
    
    def test_propfinder_edge_accuracy(self):
        """Test edge calculation accuracy in PropFinder format"""
        ai_probability = 0.60  # 60% AI prediction
        
        response = create_propfinder_odds_response(
            self.normalizer,
            self.sample_bookmaker_odds,
            ai_probability,
            'over'
        )
        
        # Calculate expected edge manually
        best_odds = -105  # FanDuel has best over odds
        decimal_odds = self.normalizer.american_to_decimal(best_odds)
        implied_prob = 1.0 / decimal_odds
        
        # Remove vig for two-way market approximation
        opposing_odds = -115  # FanDuel under odds
        opposing_decimal = self.normalizer.american_to_decimal(opposing_odds)
        opposing_prob = 1.0 / opposing_decimal
        
        no_vig_prob, _ = self.normalizer.remove_vig_two_way(implied_prob, opposing_prob)
        expected_edge = (ai_probability - no_vig_prob) * 100  # As percentage
        
        # Response edge should be close to manual calculation
        assert abs(response['edge'] - expected_edge) < 1.0  # Allow 1% tolerance


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def setup_method(self):
        self.normalizer = OddsNormalizer(precision=4)
    
    def test_invalid_american_odds(self):
        """Test handling of invalid American odds"""
        with pytest.raises(ValueError):
            self.normalizer.american_to_decimal(0)  # Zero odds invalid
        
        with pytest.raises(ValueError):
            self.normalizer.american_to_decimal(1.5)  # Float instead of int
    
    def test_invalid_probabilities(self):
        """Test handling of invalid probabilities"""
        with pytest.raises(ValueError):
            self.normalizer.calculate_edge(1.5, 0.5)  # Probability > 1
        
        with pytest.raises(ValueError):
            self.normalizer.calculate_edge(-0.1, 0.5)  # Negative probability
    
    def test_empty_bookmaker_odds(self):
        """Test handling of empty bookmaker data"""
        with pytest.raises(ValueError):
            self.normalizer.normalize_bookmaker_odds({})


class TestMathematicalProperties:
    """Test mathematical properties and invariants"""
    
    def setup_method(self):
        self.normalizer = OddsNormalizer(precision=4)
    
    def test_probability_sum_invariant(self):
        """Test that no-vig probabilities always sum to 1.0"""
        test_cases = [
            # Various two-way markets
            [0.52, 0.53],  # Low vig
            [0.55, 0.55],  # High vig
            [0.48, 0.52],  # No vig
            # Three-way markets
            [0.40, 0.35, 0.35],  # Soccer match
            [0.33, 0.33, 0.44],  # Uneven three-way
        ]
        
        for probabilities in test_cases:
            if len(probabilities) == 2:
                no_vig = self.normalizer.remove_vig_two_way(probabilities[0], probabilities[1])
                total = sum(no_vig)
            else:
                no_vig = self.normalizer.remove_vig_n_way(probabilities)
                total = sum(no_vig)
            
            assert abs(total - 1.0) < 0.0001  # Tight tolerance for sum = 1.0
    
    def test_odds_probability_relationship(self):
        """Test fundamental odds-probability relationships"""
        test_odds = [-200, -150, -110, -105, 100, 110, 150, 200]
        
        for american_odds in test_odds:
            decimal = self.normalizer.american_to_decimal(american_odds)
            probability = self.normalizer.implied_prob_from_american(american_odds)
            
            # Fundamental relationship: probability = 1 / decimal_odds
            expected_prob = 1.0 / decimal
            assert abs(probability - expected_prob) < 0.0001
            
            # Probability should be between 0 and 1
            assert 0 < probability < 1


if __name__ == "__main__":
    # Run with: python -m pytest test_odds_normalizer.py -v
    pytest.main([__file__, "-v", "--tb=short"])