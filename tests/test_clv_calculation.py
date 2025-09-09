#!/usr/bin/env python3
"""
Unit tests for CLV (Closing Line Value) calculation functionality
"""

import pytest
from datetime import datetime, timezone
from backend.services.line_movement_service import LineMovementService
from backend.services.simple_propfinder_service import (
    PropOpportunity, Sport, Market, Pick, Trend, Venue, SharpMoney,
    MatchupHistory, LineMovement, Bookmaker, Direction
)


class TestCLVCalculation:
    """Test CLV calculation functionality"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = LineMovementService()

    def create_test_opportunity(self, line=10.5, odds=-110) -> PropOpportunity:
        """Create a test PropOpportunity with basic fields"""
        return PropOpportunity(
            id="test_clv",
            player="Test Player", 
            playerImage=None,
            team="Test Team",
            teamLogo=None,
            opponent="Test Opponent",
            opponentLogo=None,
            sport=Sport.NBA,
            market=Market.POINTS,
            line=line,
            pick=Pick.OVER,
            odds=odds,
            impliedProbability=52.4,
            aiProbability=55.0,
            edge=2.6,
            confidence=75.0,
            projectedValue=1.5,
            volume=10000,
            trend=Trend.RISING,
            trendStrength=5,
            timeToGame="2h 30m",
            venue=Venue.HOME,
            weather=None,
            injuries=[],
            recentForm=[85.2, 78.9],
            matchupHistory=MatchupHistory(games=10, average=10.8, hitRate=0.6),
            lineMovement=LineMovement(open=10.5, current=10.5, direction=Direction.NONE),
            bookmakers=[],
            isBookmarked=False,
            tags=["Test"],
            socialSentiment=75,
            sharpMoney=SharpMoney.MODERATE,
            lastUpdated=datetime.now(timezone.utc),
            alertTriggered=False,
            alertSeverity=None
        )

    def test_clv_calculation_with_force_flat_baseline(self):
        """Test CLV calculation with force_flat_baseline (should be 0%)"""
        opp = self.create_test_opportunity(line=10.5)
        
        # Force flat baseline should result in 0% CLV
        self.service.enrich_opportunity(opp, force_flat_baseline=True)
        
        # Check CLV fields are populated
        assert hasattr(opp, 'closingLine'), "closingLine field should be set"
        assert hasattr(opp, 'closingOdds'), "closingOdds field should be set" 
        assert hasattr(opp, 'clvPercent'), "clvPercent field should be set"
        
        # For force_flat_baseline, opening == closing, so CLV should be 0%
        assert opp.closingLine == 10.5, f"Expected closingLine=10.5, got {opp.closingLine}"
        assert opp.clvPercent == 0.0, f"Expected clvPercent=0.0, got {opp.clvPercent}"

    def test_clv_calculation_positive_movement(self):
        """Test CLV calculation with positive line movement"""
        opp = self.create_test_opportunity(line=10.5)
        
        # Simulate historical data: opening=10.0, latest=10.5 (5% CLV)
        # Since we're testing in-memory mode and no historical data exists,
        # we need to test the calculation method directly
        opening_line = 10.0
        latest_line = 10.5
        
        def mock_get(field):
            field_map = {
                "line": 10.5,
                "odds": -110,
                "latestOdds": -110
            }
            return field_map.get(field)
        
        def mock_set(field, value):
            setattr(opp, field, value)
        
        # Test the CLV calculation method directly
        self.service._calculate_and_set_clv(opp, opening_line, latest_line, mock_get, mock_set)
        
        # Check CLV calculation: (10.5 - 10.0) / 10.0 * 100 = 5%
        assert opp.clvPercent == 5.0, f"Expected clvPercent=5.0, got {opp.clvPercent}"
        assert opp.closingLine == 10.5, f"Expected closingLine=10.5, got {opp.closingLine}"

    def test_clv_calculation_negative_movement(self):
        """Test CLV calculation with negative line movement"""
        opp = self.create_test_opportunity(line=9.5)
        
        # Simulate: opening=10.0, latest=9.5 (-5% CLV)
        opening_line = 10.0
        latest_line = 9.5
        
        def mock_get(field):
            field_map = {
                "line": 9.5,
                "odds": -110,
                "latestOdds": -110
            }
            return field_map.get(field)
        
        def mock_set(field, value):
            setattr(opp, field, value)
        
        self.service._calculate_and_set_clv(opp, opening_line, latest_line, mock_get, mock_set)
        
        # Check CLV calculation: (9.5 - 10.0) / 10.0 * 100 = -5%
        assert opp.clvPercent == -5.0, f"Expected clvPercent=-5.0, got {opp.clvPercent}"

    def test_clv_calculation_zero_opening_line(self):
        """Test CLV calculation with zero opening line (edge case)"""
        opp = self.create_test_opportunity(line=0.5)
        
        # Edge case: opening=0.0, latest=0.5 (should not calculate CLV)
        opening_line = 0.0
        latest_line = 0.5
        
        def mock_get(field):
            return -110 if field == "latestOdds" else None
        
        def mock_set(field, value):
            setattr(opp, field, value)
        
        self.service._calculate_and_set_clv(opp, opening_line, latest_line, mock_get, mock_set)
        
        # CLV should be None when opening line is zero (division by zero protection)
        assert opp.clvPercent is None, f"Expected clvPercent=None for zero opening line, got {opp.clvPercent}"

    def test_clv_calculation_none_values(self):
        """Test CLV calculation with None values (edge case)"""
        opp = self.create_test_opportunity(line=10.5)
        
        # Edge case: None values
        opening_line = None
        latest_line = 10.5
        
        def mock_get(field):
            return -110 if field == "latestOdds" else None
        
        def mock_set(field, value):
            setattr(opp, field, value)
        
        self.service._calculate_and_set_clv(opp, opening_line, latest_line, mock_get, mock_set)
        
        # CLV should be None when opening line is None
        assert opp.clvPercent is None, f"Expected clvPercent=None for None opening line, got {opp.clvPercent}"

    def test_clv_large_movement(self):
        """Test CLV calculation with large line movements"""
        opp = self.create_test_opportunity(line=15.0)
        
        # Large movement: opening=10.0, latest=15.0 (50% CLV)
        opening_line = 10.0
        latest_line = 15.0
        
        def mock_get(field):
            field_map = {
                "latestOdds": -110
            }
            return field_map.get(field)
        
        def mock_set(field, value):
            setattr(opp, field, value)
        
        self.service._calculate_and_set_clv(opp, opening_line, latest_line, mock_get, mock_set)
        
        # Check large CLV: (15.0 - 10.0) / 10.0 * 100 = 50%
        assert opp.clvPercent == 50.0, f"Expected clvPercent=50.0, got {opp.clvPercent}"
        
    def test_clv_precision_rounding(self):
        """Test CLV calculation precision and rounding"""
        opp = self.create_test_opportunity(line=10.33)
        
        # Test rounding: opening=10.0, latest=10.33 (3.3% -> should round to 3.3%)
        opening_line = 10.0
        latest_line = 10.33
        
        def mock_get(field):
            return -110 if field == "latestOdds" else None
        
        def mock_set(field, value):
            setattr(opp, field, value)
        
        self.service._calculate_and_set_clv(opp, opening_line, latest_line, mock_get, mock_set)
        
        # Check precision: (10.33 - 10.0) / 10.0 * 100 = 3.3%
        assert opp.clvPercent == 3.3, f"Expected clvPercent=3.3, got {opp.clvPercent}"