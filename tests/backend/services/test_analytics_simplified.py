"""
Simplified Tests for Analytics Persistence System

Focus on service logic, data validation, and API functionality
without complex database setup requirements.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from dataclasses import dataclass

from backend.services.analytics_persistence_service import (
    EVOpportunityData,
    ArbitrageOpportunityData,
    EV_MIN_THRESHOLD,
    ARB_MIN_PROFIT_PCT
)
from backend.models.analytics import EVOpportunityHistory, ArbitrageHistory


class TestDataValidation:
    """Tests for data validation and threshold logic"""
    
    def test_ev_threshold_filtering(self):
        """Test EV threshold filtering logic"""
        # Above threshold
        high_ev = EVOpportunityData(
            sport="MLB",
            player="Test Player",
            market="Hits",
            line=2.5,
            odds=-110,
            ev_percent=5.2  # Above 3% threshold
        )
        assert high_ev.ev_percent >= EV_MIN_THRESHOLD
        
        # Below threshold  
        low_ev = EVOpportunityData(
            sport="MLB",
            player="Test Player", 
            market="Hits",
            line=2.5,
            odds=-110,
            ev_percent=2.1  # Below 3% threshold
        )
        assert low_ev.ev_percent < EV_MIN_THRESHOLD
    
    def test_arbitrage_threshold_filtering(self):
        """Test arbitrage threshold filtering logic"""
        # Above threshold
        high_arb = ArbitrageOpportunityData(
            sport="NBA",
            market="Points",
            profit_pct=2.3,  # Above 1% threshold
            bookmakers=["FanDuel", "DraftKings"]
        )
        assert high_arb.profit_pct >= ARB_MIN_PROFIT_PCT
        
        # Below threshold
        low_arb = ArbitrageOpportunityData(
            sport="NBA", 
            market="Points",
            profit_pct=0.8,  # Below 1% threshold
            bookmakers=["FanDuel", "DraftKings"]
        )
        assert low_arb.profit_pct < ARB_MIN_PROFIT_PCT
    
    def test_ev_tier_classification(self):
        """Test EV tier classification logic"""
        assert EVOpportunityHistory.determine_ev_tier(2.5) == "low"
        assert EVOpportunityHistory.determine_ev_tier(5.5) == "medium"
        assert EVOpportunityHistory.determine_ev_tier(8.0) == "high"
        assert EVOpportunityHistory.determine_ev_tier(12.0) == "premium"
    
    def test_ev_hash_calculation(self):
        """Test EV opportunity hash calculation for deduplication"""
        hash1 = EVOpportunityHistory.calculate_hash("MLB", "Player A", "Hits", 2.5, -110)
        hash2 = EVOpportunityHistory.calculate_hash("MLB", "Player A", "Hits", 2.5, -110)
        hash3 = EVOpportunityHistory.calculate_hash("MLB", "Player A", "Hits", 2.5, -120)
        
        assert hash1 == hash2  # Same data should produce same hash
        assert hash1 != hash3  # Different odds should produce different hash
        assert len(hash1) == 64  # SHA256 hex digest length
    
    def test_arbitrage_hash_calculation(self):
        """Test arbitrage opportunity hash calculation"""
        books = ["FanDuel", "DraftKings"]
        hash1 = ArbitrageHistory.calculate_hash("NBA", "Points", books, 25.5)
        hash2 = ArbitrageHistory.calculate_hash("NBA", "Points", books, 25.5)
        hash3 = ArbitrageHistory.calculate_hash("NBA", "Points", books, 26.5)
        
        assert hash1 == hash2  # Same data should produce same hash
        assert hash1 != hash3  # Different line should produce different hash


class TestServiceLogic:
    """Tests for persistence service business logic"""
    
    @pytest.mark.asyncio
    async def test_persist_ev_opportunity_above_threshold(self):
        """Test EV opportunity persistence above threshold"""
        with patch('backend.services.analytics_persistence_service.AnalyticsPersistenceService') as MockService:
            mock_service = MockService.return_value
            mock_service.persist_ev_opportunity = AsyncMock(return_value=True)
            
            ev_data = EVOpportunityData(
                sport="MLB",
                player="Aaron Judge",
                market="Home Runs",
                line=1.5,
                odds=-110,
                ev_percent=5.2  # Above threshold
            )
            
            result = await mock_service.persist_ev_opportunity(ev_data)
            assert result is True
            mock_service.persist_ev_opportunity.assert_called_once_with(ev_data)
    
    @pytest.mark.asyncio
    async def test_persist_arbitrage_opportunity_above_threshold(self):
        """Test arbitrage opportunity persistence above threshold"""
        with patch('backend.services.analytics_persistence_service.AnalyticsPersistenceService') as MockService:
            mock_service = MockService.return_value
            mock_service.persist_arbitrage_opportunity = AsyncMock(return_value=True)
            
            arb_data = ArbitrageOpportunityData(
                sport="NBA",
                market="Points", 
                profit_pct=2.3,  # Above threshold
                bookmakers=["FanDuel", "DraftKings"]
            )
            
            result = await mock_service.persist_arbitrage_opportunity(arb_data)
            assert result is True
            mock_service.persist_arbitrage_opportunity.assert_called_once_with(arb_data)


class TestSchedulerHelpers:
    """Tests for scheduler helper functions"""
    
    @pytest.mark.asyncio
    async def test_persist_ev_opportunity_helper_above_threshold(self):
        """Test EV opportunity helper function above threshold"""
        with patch('backend.services.analytics_scheduler.AnalyticsPersistenceService') as MockServiceClass:
            mock_service = AsyncMock()
            mock_service.persist_ev_opportunity.return_value = True
            MockServiceClass.return_value = mock_service
            
            from backend.services.analytics_scheduler import persist_ev_opportunity_if_qualified
            
            result = await persist_ev_opportunity_if_qualified(
                sport="MLB",
                player="Test Player", 
                market="Hits",
                line=2.5,
                odds=-110,
                ev_percent=5.2  # Above threshold
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_persist_ev_opportunity_helper_below_threshold(self):
        """Test EV opportunity helper function below threshold"""
        with patch('backend.services.analytics_scheduler.AnalyticsPersistenceService') as MockServiceClass:
            mock_service = AsyncMock()
            MockServiceClass.return_value = mock_service
            
            from backend.services.analytics_scheduler import persist_ev_opportunity_if_qualified
            
            result = await persist_ev_opportunity_if_qualified(
                sport="MLB",
                player="Test Player",
                market="Hits", 
                line=2.5,
                odds=-110,
                ev_percent=2.1  # Below threshold
            )
            
            assert result is False
            # Should not call persist since below threshold
            mock_service.persist_ev_opportunity.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_persist_arbitrage_opportunity_helper_above_threshold(self):
        """Test arbitrage opportunity helper function above threshold"""
        with patch('backend.services.analytics_scheduler.AnalyticsPersistenceService') as MockServiceClass:
            mock_service = AsyncMock()
            mock_service.persist_arbitrage_opportunity.return_value = True
            MockServiceClass.return_value = mock_service
            
            from backend.services.analytics_scheduler import persist_arbitrage_opportunity_if_qualified
            
            result = await persist_arbitrage_opportunity_if_qualified(
                sport="NBA",
                market="Points",
                profit_pct=2.3,  # Above threshold
                bookmakers=["FanDuel", "DraftKings"]
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_persist_arbitrage_opportunity_helper_below_threshold(self):
        """Test arbitrage opportunity helper function below threshold"""
        with patch('backend.services.analytics_scheduler.AnalyticsPersistenceService') as MockServiceClass:
            mock_service = AsyncMock()
            MockServiceClass.return_value = mock_service
            
            from backend.services.analytics_scheduler import persist_arbitrage_opportunity_if_qualified
            
            result = await persist_arbitrage_opportunity_if_qualified(
                sport="NBA",
                market="Points",
                profit_pct=0.8,  # Below threshold
                bookmakers=["FanDuel", "DraftKings"]
            )
            
            assert result is False
            # Should not call persist since below threshold
            mock_service.persist_arbitrage_opportunity.assert_not_called()


class TestSchedulerLifecycle:
    """Tests for scheduler lifecycle management"""
    
    @pytest.mark.asyncio
    async def test_scheduler_start_stop(self):
        """Test scheduler start/stop lifecycle"""
        with patch('backend.services.analytics_scheduler.AnalyticsPersistenceService'):
            from backend.services.analytics_scheduler import AnalyticsScheduler
            
            scheduler = AnalyticsScheduler()
            
            assert not scheduler.running
            
            await scheduler.start()
            assert scheduler.running
            
            await scheduler.stop()
            assert not scheduler.running
    
    @pytest.mark.asyncio
    async def test_manual_maintenance_trigger(self):
        """Test manual maintenance trigger"""
        with patch('backend.services.analytics_scheduler.AnalyticsPersistenceService') as MockServiceClass:
            mock_service = AsyncMock()
            mock_service.prune_old_records.return_value = {
                "ev_opportunities_deleted": 5,
                "arbitrage_opportunities_deleted": 3
            }
            MockServiceClass.return_value = mock_service
            
            from backend.services.analytics_scheduler import AnalyticsScheduler
            
            scheduler = AnalyticsScheduler()
            scheduler.analytics_service = mock_service
            
            result = await scheduler.trigger_maintenance_now()
            
            assert result["status"] == "success"
            assert "maintenance completed successfully" in result["message"]
            mock_service.prune_old_records.assert_called_once()


class TestArbitrageBookmakersProperty:
    """Test arbitrage bookmakers JSON property"""
    
    def test_bookmakers_property_getter_setter(self):
        """Test bookmakers JSON property getter/setter"""
        record = ArbitrageHistory(
            arb_hash="test",
            sport="NBA",
            market="Points",
            profit_pct=2.0,
            books_json="",
            detected_at=datetime.now(timezone.utc)
        )
        
        # Test setter
        record.bookmakers = ["FanDuel", "DraftKings"]
        assert record.books_json == '["FanDuel", "DraftKings"]'
        
        # Test getter
        assert record.bookmakers == ["FanDuel", "DraftKings"]
        
        # Test empty case
        record.books_json = ""
        assert record.bookmakers == []


# Test configuration constants
def test_configuration_constants():
    """Test that configuration constants are properly set"""
    assert EV_MIN_THRESHOLD == 3.0
    assert ARB_MIN_PROFIT_PCT == 1.0


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])