#!/usr/bin/env python3
"""
Tests for CLV (Closing Line Value) functionality in LineMovementService.

This test suite validates:
1. CLV calculation logic with various scenarios
2. Edge case handling (zero openingLine, None values)
3. Integration with force_flat_baseline
4. PropOpportunity field population
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from backend.services.line_movement_service import LineMovementService
from backend.services.simple_propfinder_service import PropOpportunity, Sport, Market, Pick, Trend, Venue, SharpMoney, MatchupHistory, LineMovement, Direction, Bookmaker


class TestLineMovementCLV:
    """Test CLV (Closing Line Value) functionality"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = LineMovementService()
        # Force in-memory mode for testing
        self.service.in_memory_only = True
        
        # Create a mock opportunity for testing
        self.mock_opportunity = PropOpportunity(
            id="test_clv_1",
            player="Test Player",
            playerImage=None,
            team="Test Team",
            teamLogo=None,
            opponent="Test Opponent", 
            opponentLogo=None,
            sport=Sport.NBA,
            market=Market.POINTS,
            line=25.5,
            pick=Pick.OVER,
            odds=-110,
            impliedProbability=52.4,
            aiProbability=58.7,
            edge=6.3,
            confidence=75.0,
            projectedValue=1.25,
            volume=15000,
            trend=Trend.RISING,
            trendStrength=7,
            timeToGame="2h 15m",
            venue=Venue.HOME,
            weather=None,
            injuries=[],
            recentForm=[85.2, 78.9],
            matchupHistory=MatchupHistory(games=10, average=26.1, hitRate=0.68),
            lineMovement=LineMovement(open=26.0, current=25.5, direction=Direction.DOWN),
            bookmakers=[],
            isBookmarked=False,
            tags=["High Volume"],
            socialSentiment=70,
            sharpMoney=SharpMoney.MODERATE,
            lastUpdated=datetime.now(),
            alertTriggered=False,
            alertSeverity=None
        )

    def test_clv_calculation_positive_movement(self):
        """Test CLV calculation when line moves favorably"""
        # Setup: Opening line 25.5, closing line 26.5 (moved up)
        self.mock_opportunity.openingLine = 25.5
        self.mock_opportunity.latestLine = 26.5
        
        self.service.enrich_opportunity(self.mock_opportunity)
        
        # Verify CLV calculation: (26.5 - 25.5) / 25.5 * 100 = 3.92%
        assert self.mock_opportunity.clvPercent == pytest.approx(3.92, rel=0.01)
        assert self.mock_opportunity.closingLine == 26.5
        assert self.mock_opportunity.closingOdds == -110

    def test_clv_calculation_negative_movement(self):
        """Test CLV calculation when line moves against"""
        # Setup: Opening line 26.0, closing line 25.0 (moved down)
        self.mock_opportunity.openingLine = 26.0
        self.mock_opportunity.latestLine = 25.0
        
        self.service.enrich_opportunity(self.mock_opportunity)
        
        # Verify CLV calculation: (25.0 - 26.0) / 26.0 * 100 = -3.85%
        assert self.mock_opportunity.clvPercent == pytest.approx(-3.85, rel=0.01)
        assert self.mock_opportunity.closingLine == 25.0

    def test_clv_calculation_no_movement(self):
        """Test CLV calculation when line doesn't move (flat)"""
        # Setup: Opening line 25.5, closing line 25.5 (no movement)
        self.mock_opportunity.openingLine = 25.5
        self.mock_opportunity.latestLine = 25.5
        
        self.service.enrich_opportunity(self.mock_opportunity)
        
        # Verify CLV calculation: (25.5 - 25.5) / 25.5 * 100 = 0%
        assert self.mock_opportunity.clvPercent == 0.0
        assert self.mock_opportunity.closingLine == 25.5

    def test_clv_edge_case_zero_opening_line(self):
        """Test CLV calculation when opening line is zero (should not calculate)"""
        # Setup: Opening line 0, closing line 1.5
        self.mock_opportunity.openingLine = 0.0
        self.mock_opportunity.latestLine = 1.5
        
        self.service.enrich_opportunity(self.mock_opportunity)
        
        # Verify CLV is not calculated when opening line is zero
        assert self.mock_opportunity.clvPercent is None
        assert self.mock_opportunity.closingLine == 1.5

    def test_clv_edge_case_none_opening_line(self):
        """Test CLV calculation when opening line is None"""
        # Setup: Opening line None, closing line 25.5
        self.mock_opportunity.openingLine = None
        self.mock_opportunity.latestLine = 25.5
        
        self.service.enrich_opportunity(self.mock_opportunity)
        
        # Verify CLV is not calculated when opening line is None
        assert self.mock_opportunity.clvPercent is None
        assert self.mock_opportunity.closingLine == 25.5

    def test_clv_edge_case_none_closing_line(self):
        """Test CLV calculation when closing line is None"""
        # Setup: Opening line 25.5, closing line None
        self.mock_opportunity.openingLine = 25.5
        self.mock_opportunity.latestLine = None
        
        self.service.enrich_opportunity(self.mock_opportunity)
        
        # Verify CLV is not calculated when closing line is None
        assert self.mock_opportunity.clvPercent is None
        assert self.mock_opportunity.closingLine is None

    def test_clv_with_force_flat_baseline_integration(self):
        """Test CLV calculation with force_flat_baseline enabled"""
        # Setup: Original line 25.5 in opportunity
        self.mock_opportunity.line = 25.5
        self.mock_opportunity.odds = -110
        
        self.service.enrich_opportunity(self.mock_opportunity, force_flat_baseline=True)
        
        # Verify force_flat_baseline creates flat movement
        assert self.mock_opportunity.openingLine == 25.5
        assert self.mock_opportunity.latestLine == 25.5
        assert self.mock_opportunity.movementDirection == "flat"
        
        # Verify CLV is 0% for flat movement
        assert self.mock_opportunity.clvPercent == 0.0
        assert self.mock_opportunity.closingLine == 25.5
        assert self.mock_opportunity.closingOdds == -110

    def test_clv_calculation_precision(self):
        """Test CLV calculation precision and rounding"""
        # Setup: Opening line 23.333, closing line 24.666
        self.mock_opportunity.openingLine = 23.333
        self.mock_opportunity.latestLine = 24.666
        
        self.service.enrich_opportunity(self.mock_opportunity)
        
        # Verify CLV calculation: (24.666 - 23.333) / 23.333 * 100 ≈ 5.71%
        expected_clv = round(((24.666 - 23.333) / 23.333) * 100, 2)
        assert self.mock_opportunity.clvPercent == expected_clv
        assert isinstance(self.mock_opportunity.clvPercent, float)

    def test_clv_with_diagnostics_enabled(self):
        """Test CLV calculation with diagnostics enabled"""
        # Setup: Opening line 25.5, closing line 26.0
        self.mock_opportunity.openingLine = 25.5
        self.mock_opportunity.latestLine = 26.0
        
        self.service.enrich_opportunity(self.mock_opportunity, include_diagnostics=True)
        
        # Verify CLV calculation works with diagnostics
        assert self.mock_opportunity.clvPercent == pytest.approx(1.96, rel=0.01)
        assert self.mock_opportunity.closingLine == 26.0
        
        # Verify diagnostics fields are still populated
        assert hasattr(self.mock_opportunity, 'movementSource')
        assert hasattr(self.mock_opportunity, 'movementApplied')

    def test_clv_error_handling(self):
        """Test CLV calculation error handling"""
        # Setup: Mock an error in CLV calculation
        self.mock_opportunity.openingLine = 25.5
        self.mock_opportunity.latestLine = 26.0
        
        with patch.object(self.service, '_calculate_and_set_clv', side_effect=Exception("Test error")):
            # Should not raise an exception, should handle gracefully
            self.service.enrich_opportunity(self.mock_opportunity)
            
            # Verify error handling - other fields should still be populated
            assert self.mock_opportunity.movementDirection is not None

    def test_clv_large_movement_scenarios(self):
        """Test CLV calculation with large line movements"""
        test_cases = [
            (20.0, 25.0, 25.0),   # +5 point movement = +25% CLV
            (30.0, 20.0, -33.33), # -10 point movement = -33.33% CLV
            (1.0, 2.0, 100.0),    # Double the line = +100% CLV
            (10.0, 5.0, -50.0),   # Half the line = -50% CLV
        ]
        
        for opening, closing, expected_clv in test_cases:
            self.mock_opportunity.openingLine = opening
            self.mock_opportunity.latestLine = closing
            
            self.service.enrich_opportunity(self.mock_opportunity)
            
            assert self.mock_opportunity.clvPercent == pytest.approx(expected_clv, rel=0.01), \
                f"Failed for opening={opening}, closing={closing}"

    def test_clv_fields_in_dict_opportunity(self):
        """Test CLV calculation with dictionary-based opportunity"""
        dict_opportunity = {
            "id": "test_clv_dict",
            "line": 25.5,
            "odds": -110,
            "openingLine": 24.5,
            "latestLine": 25.5,
            "latestOdds": -110
        }
        
        self.service.enrich_opportunity(dict_opportunity)
        
        # Verify CLV fields are added to dictionary
        assert "clvPercent" in dict_opportunity
        assert "closingLine" in dict_opportunity
        assert "closingOdds" in dict_opportunity
        
        # Verify CLV calculation: (25.5 - 24.5) / 24.5 * 100 ≈ 4.08%
        assert dict_opportunity["clvPercent"] == pytest.approx(4.08, rel=0.01)
        assert dict_opportunity["closingLine"] == 25.5
        assert dict_opportunity["closingOdds"] == -110


if __name__ == "__main__":
    pytest.main([__file__, "-v"])