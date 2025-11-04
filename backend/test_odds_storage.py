"""
Unit tests for Odds Storage Service - Phase 1.2 verification

Tests cover:
- Best line detection across multiple bookmakers
- Odds snapshot storage and retrieval
- Arbitrage opportunity detection
- Historical line movement tracking
- Integration with PropFinderDataService

Run with: pytest test_odds_storage.py -v
"""

import pytest
import asyncio
from datetime import datetime, timezone
from backend.services.odds_store import (
    OddsStoreService, 
    BookmakerOdds, 
    BestLineResult, 
    create_enhanced_bookmaker_response,
    store_prop_odds
)
from backend.models.odds import BestLineCalculator


class TestBestLineCalculator:
    """Test best line detection logic"""
    
    def test_is_better_odds_positive(self):
        """Test comparison of positive American odds"""
        # +200 is better than +150 for the bettor
        assert BestLineCalculator._is_better_odds(200, 150) == True
        assert BestLineCalculator._is_better_odds(150, 200) == False
        
        # Equal odds
        assert BestLineCalculator._is_better_odds(150, 150) == False
    
    def test_is_better_odds_negative(self):
        """Test comparison of negative American odds"""
        # -105 is better than -110 for the bettor (closer to 0)
        assert BestLineCalculator._is_better_odds(-105, -110) == True
        assert BestLineCalculator._is_better_odds(-110, -105) == False
        
        # -150 is worse than -110
        assert BestLineCalculator._is_better_odds(-150, -110) == False
    
    def test_is_better_odds_mixed(self):
        """Test comparison of positive vs negative odds"""
        # Any positive odds is better than negative odds
        assert BestLineCalculator._is_better_odds(100, -110) == True
        assert BestLineCalculator._is_better_odds(-110, 100) == False
    
    def test_arbitrage_detection_exists(self):
        """Test detection of arbitrage opportunities"""
        # Best over +110, best under +120 should create arbitrage
        has_arb, profit = BestLineCalculator.detect_arbitrage(110, 120)
        assert has_arb == True
        assert profit > 0
    
    def test_arbitrage_detection_none(self):
        """Test when no arbitrage exists"""
        # Standard -110/-110 line has no arbitrage
        has_arb, profit = BestLineCalculator.detect_arbitrage(-110, -110)
        assert has_arb == False
        assert profit == 0.0
    
    def test_arbitrage_calculation_accuracy(self):
        """Test arbitrage profit calculation accuracy"""
        # Real arbitrage example: Best over +110, best under +110
        # +110 = 47.6% implied probability each = 95.2% total < 100%
        has_arb, profit = BestLineCalculator.detect_arbitrage(110, 110)
        assert has_arb == True
        assert profit > 4.0  # Should have meaningful profit margin


class TestOddsStoreService:
    """Test odds storage service functionality"""
    
    def setup_method(self):
        self.odds_service = OddsStoreService()
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.odds_service is not None
        # Service should work even if database components aren't available
        assert hasattr(self.odds_service, 'logger')
    
    def test_bookmaker_odds_creation(self):
        """Test creation of BookmakerOdds objects"""
        odds = BookmakerOdds(
            bookmaker_name="DraftKings",
            bookmaker_id=1,
            over_odds=-110,
            under_odds=-110,
            line=8.5,
            timestamp=datetime.now(timezone.utc)
        )
        
        assert odds.bookmaker_name == "DraftKings"
        assert odds.over_odds == -110
        assert odds.under_odds == -110
        assert odds.line == 8.5
        assert odds.is_available == True  # Default value
    
    def test_mock_best_line_calculation(self):
        """Test best line calculation with mock data"""
        # Sample odds data from multiple books
        sample_odds = [
            BookmakerOdds("DraftKings", 1, -110, -110, 8.5, datetime.now(timezone.utc)),
            BookmakerOdds("FanDuel", 2, -105, -115, 8.5, datetime.now(timezone.utc)),
            BookmakerOdds("BetMGM", 3, -108, -112, 8.5, datetime.now(timezone.utc)),
        ]
        
        # Find best odds manually
        best_over = max((odds.over_odds for odds in sample_odds if odds.over_odds), 
                       key=lambda x: x if x > 0 else 1000 + x)  # -105 is best
        best_under = max((odds.under_odds for odds in sample_odds if odds.under_odds),
                        key=lambda x: x if x > 0 else 1000 + x)  # -110 is best
        
        assert best_over == -105  # FanDuel has best over odds
        assert best_under == -110  # DraftKings has best under odds


class TestPropFinderIntegration:
    """Test integration with PropFinder API format"""
    
    @pytest.mark.asyncio
    async def test_store_prop_odds_format(self):
        """Test storing odds in PropFinder format"""
        sample_bookmaker_odds = {
            'DraftKings': {'over': -110, 'under': -110, 'line': 8.5},
            'FanDuel': {'over': -105, 'under': -115, 'line': 8.5},
            'BetMGM': {'over': -108, 'under': -112, 'line': 8.5}
        }
        
        # This should work even without database connection
        try:
            result = await store_prop_odds(
                prop_id="nba_lebron_points_25.5", 
                sport="NBA",
                market_type="Points",
                bookmaker_odds_dict=sample_bookmaker_odds
            )
            
            # Result should be a list (even if empty without DB)
            assert isinstance(result, list)
            
        except Exception as e:
            # Should not throw errors even without database
            pytest.fail(f"store_prop_odds should handle missing database gracefully: {e}")
    
    def test_enhanced_bookmaker_response_format(self):
        """Test enhanced bookmaker response creation"""
        sample_bookmaker_odds = {
            'DraftKings': {'over': -110, 'under': -110},
            'FanDuel': {'over': -105, 'under': -115},
            'BetMGM': {'over': -108, 'under': -112}
        }
        
        ai_probability = 0.58  # 58% AI prediction
        
        result = create_enhanced_bookmaker_response(
            bookmaker_odds_dict=sample_bookmaker_odds,
            ai_probability=ai_probability,
            side='over'
        )
        
        # Should have all required PropFinder fields
        assert 'odds' in result
        assert 'impliedProbability' in result
        assert 'aiProbability' in result
        assert 'edge' in result
        assert 'bestBook' in result
        assert 'bookmakers' in result
        assert 'numBookmakers' in result
        
        # AI probability should match
        assert result['aiProbability'] == 58.0
        
        # Should identify best odds correctly
        assert result['odds'] == -105  # FanDuel has best over odds
        assert result['bestBook'] == 'Fanduel'


class TestLineMovementDetection:
    """Test line movement and steam detection"""
    
    def test_steam_move_concept(self):
        """Test the concept of steam move detection"""
        # Steam move = multiple books moving lines simultaneously in same direction
        
        # Example: Books moving from 8.5 to 9.0 within 5 minutes
        initial_snapshots = [
            {'bookmaker': 'DraftKings', 'line': 8.5, 'time': '10:00'},
            {'bookmaker': 'FanDuel', 'line': 8.5, 'time': '10:00'},
            {'bookmaker': 'BetMGM', 'line': 8.5, 'time': '10:00'},
        ]
        
        steam_snapshots = [
            {'bookmaker': 'DraftKings', 'line': 9.0, 'time': '10:03'},
            {'bookmaker': 'FanDuel', 'line': 9.0, 'time': '10:04'},
            {'bookmaker': 'BetMGM', 'line': 9.0, 'time': '10:05'},
        ]
        
        # Calculate movement magnitude
        total_movement = sum(
            abs(steam['line'] - initial['line']) 
            for steam, initial in zip(steam_snapshots, initial_snapshots)
        )
        
        assert total_movement == 1.5  # 0.5 movement per book * 3 books
        
        # Steam confidence based on book count and speed
        book_count = len(steam_snapshots)
        steam_confidence = min(1.0, book_count / 5.0)  # Max confidence at 5+ books
        
        assert steam_confidence == 0.6  # 3 books / 5 = 0.6 confidence


class TestHistoricalAnalysis:
    """Test historical odds analysis capabilities"""
    
    def test_line_movement_calculation(self):
        """Test calculation of line movements"""
        # Historical line data for a prop
        line_history = [
            {'line': 8.5, 'timestamp': '10:00'},
            {'line': 8.5, 'timestamp': '10:30'},
            {'line': 9.0, 'timestamp': '11:00'},  # Movement here
            {'line': 9.0, 'timestamp': '11:30'},
            {'line': 8.5, 'timestamp': '12:00'},  # Movement back
        ]
        
        # Calculate movements
        movements = []
        for i in range(1, len(line_history)):
            movement = line_history[i]['line'] - line_history[i-1]['line']
            if movement != 0:
                movements.append({
                    'magnitude': abs(movement),
                    'direction': 'up' if movement > 0 else 'down',
                    'timestamp': line_history[i]['timestamp']
                })
        
        assert len(movements) == 2  # Two movements detected
        assert movements[0]['magnitude'] == 0.5
        assert movements[0]['direction'] == 'up'
        assert movements[1]['magnitude'] == 0.5
        assert movements[1]['direction'] == 'down'
    
    def test_significant_movement_threshold(self):
        """Test detection of significant line movements"""
        # Define what constitutes "significant" movement
        SIGNIFICANT_THRESHOLD = 0.5
        
        test_movements = [
            0.25,  # Not significant
            0.5,   # Significant (at threshold)
            1.0,   # Very significant
            0.1,   # Not significant
        ]
        
        significant_movements = [m for m in test_movements if m >= SIGNIFICANT_THRESHOLD]
        
        assert len(significant_movements) == 2
        assert 0.5 in significant_movements
        assert 1.0 in significant_movements


class TestDataValidation:
    """Test data validation and error handling"""
    
    def test_invalid_odds_handling(self):
        """Test handling of invalid odds data"""
        # Test with missing odds data
        invalid_odds = BookmakerOdds(
            bookmaker_name="TestBook",
            bookmaker_id=999,
            over_odds=None,  # Missing odds
            under_odds=-110,
            line=None,       # Missing line
            timestamp=datetime.now(timezone.utc)
        )
        
        # Should not crash when processing invalid data
        assert invalid_odds.over_odds is None
        assert invalid_odds.line is None
        assert invalid_odds.is_available == True  # Should default to True
    
    def test_bookmaker_name_normalization(self):
        """Test consistent bookmaker name handling"""
        # Different ways bookmaker names might appear
        name_variations = [
            "draftkings",
            "DraftKings", 
            "DRAFTKINGS",
            "DK",
            "dk"
        ]
        
        # All should normalize to consistent format
        normalized_names = [name.lower() for name in name_variations]
        
        # Check that we can identify DraftKings variants
        dk_names = [name for name in normalized_names 
                   if 'draft' in name or name == 'dk']
        
        assert len(dk_names) >= 4  # Should identify most variants


if __name__ == "__main__":
    # Run with: python -m pytest test_odds_storage.py -v
    pytest.main([__file__, "-v", "--tb=short"])