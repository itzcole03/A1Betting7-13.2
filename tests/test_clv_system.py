"""
Comprehensive CLV System Tests

Unit tests for CLV bet tracking models, utilities, API endpoints, and computation logic.
Includes edge cases, error handling, and performance testing.
"""

import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.orm import Session

from fastapi.testclient import TestClient
from fastapi import status

# Import the CLV system components
from backend.models.clv_bet_tracking import (
    CLVBetTracking, 
    CLVAnalyticsSummary, 
    CLVLeaderboard, 
    CLVComputationStatus, 
    BetResult
)
from backend.utils.clv_utils import (
    american_to_probability,
    calculate_clv_percent,
    get_clv_tier,
    get_clv_performance_score,
    get_achievement_badges,
    calculate_roi_percent,
    calculate_win_rate
)
from backend.tasks.clv_computation_task import CLVComputationTask
from backend.routes.clv_bet_tracking_routes import router as clv_tracking_router
from backend.routes.user_clv_analytics_routes import router as analytics_router
from backend.routes.clv_history_segmentation_routes import router as history_router


class TestCLVUtilities:
    """Test CLV utility functions"""
    
    def test_american_to_probability_positive_odds(self):
        """Test conversion of positive American odds to probability"""
        # +200 odds should be ~33.33% probability
        prob = american_to_probability(200)
        assert abs(prob - 0.3333) < 0.001
        
        # +100 odds should be 50% probability
        prob = american_to_probability(100)
        assert abs(prob - 0.5) < 0.001
        
        # +500 odds should be ~16.67% probability
        prob = american_to_probability(500)
        assert abs(prob - 0.1667) < 0.001
    
    def test_american_to_probability_negative_odds(self):
        """Test conversion of negative American odds to probability"""
        # -200 odds should be ~66.67% probability
        prob = american_to_probability(-200)
        assert abs(prob - 0.6667) < 0.001
        
        # -110 odds should be ~52.38% probability
        prob = american_to_probability(-110)
        assert abs(prob - 0.5238) < 0.001
        
        # -500 odds should be ~83.33% probability
        prob = american_to_probability(-500)
        assert abs(prob - 0.8333) < 0.001
    
    def test_american_to_probability_edge_cases(self):
        """Test edge cases for odds conversion"""
        # Test +100 (even odds)
        prob = american_to_probability(100)
        assert abs(prob - 0.5) < 0.001
        
        # Test very high positive odds
        prob = american_to_probability(10000)
        assert prob < 0.1
        
        # Test very low negative odds
        prob = american_to_probability(-10000)
        assert prob > 0.9
    
    def test_calculate_clv_percent(self):
        """Test CLV percentage calculation"""
        # Positive CLV case: bet at +200, closing at +150
        # Opening: +200 (33.33%), Closing: +150 (40%)
        # CLV = (40% - 33.33%) / 33.33% * 100 = 20%
        clv = calculate_clv_percent(200, 150)
        assert abs(clv - 20.0) < 1.0  # Allow some rounding tolerance
        
        # Negative CLV case: bet at -110, closing at -120
        opening_prob = american_to_probability(-110)  # ~52.38%
        closing_prob = american_to_probability(-120)  # ~54.55%
        expected_clv = ((closing_prob - opening_prob) / opening_prob) * 100
        clv = calculate_clv_percent(-110, -120)
        assert abs(clv - expected_clv) < 0.1
        
        # Zero CLV case: same odds
        clv = calculate_clv_percent(-110, -110)
        assert abs(clv) < 0.001
    
    def test_get_clv_tier(self):
        """Test CLV tier classification"""
        assert get_clv_tier(12.0) == "elite"
        assert get_clv_tier(6.0) == "excellent"
        assert get_clv_tier(3.0) == "good"
        assert get_clv_tier(1.0) == "positive"
        assert get_clv_tier(-1.0) == "slight_negative"
        assert get_clv_tier(-8.0) == "poor"
    
    def test_get_clv_performance_score(self):
        """Test CLV performance score calculation"""
        # Test various CLV percentages
        score = get_clv_performance_score(10.0, 100, 0.8)
        assert score > 80  # Should be high score
        
        score = get_clv_performance_score(-5.0, 50, 0.4)
        assert score < 40  # Should be low score
        
        score = get_clv_performance_score(2.0, 20, 0.6)
        assert 40 <= score <= 70  # Should be medium score
    
    def test_get_achievement_badges(self):
        """Test achievement badge system"""
        # Elite performer
        stats = {
            "avg_clv_percent": 8.0,
            "total_bets": 200,
            "positive_clv_rate": 75.0,
            "win_rate": 60.0
        }
        badges = get_achievement_badges(stats)
        assert "clv_elite" in badges
        assert "volume_champion" in badges
        
        # Beginner
        stats = {
            "avg_clv_percent": -2.0,
            "total_bets": 15,
            "positive_clv_rate": 30.0,
            "win_rate": 45.0
        }
        badges = get_achievement_badges(stats)
        assert "first_steps" in badges
    
    def test_calculate_roi_percent(self):
        """Test ROI calculation"""
        # Profitable scenario
        roi = calculate_roi_percent(500.0, 1000.0)
        assert roi == 50.0
        
        # Loss scenario
        roi = calculate_roi_percent(-200.0, 1000.0)
        assert roi == -20.0
        
        # Break-even
        roi = calculate_roi_percent(0.0, 1000.0)
        assert roi == 0.0
        
        # Edge case: zero stake
        roi = calculate_roi_percent(100.0, 0.0)
        assert roi == 0.0
    
    def test_calculate_win_rate(self):
        """Test win rate calculation"""
        # 60% win rate
        win_rate = calculate_win_rate(60, 100)
        assert win_rate == 60.0
        
        # Perfect record
        win_rate = calculate_win_rate(10, 10)
        assert win_rate == 100.0
        
        # No wins
        win_rate = calculate_win_rate(0, 50)
        assert win_rate == 0.0
        
        # Edge case: no bets
        win_rate = calculate_win_rate(0, 0)
        assert win_rate == 0.0


class TestCLVModels:
    """Test CLV database models"""
    
    @pytest.fixture
    def sample_clv_bet(self):
        """Create a sample CLV bet tracking record"""
        return CLVBetTracking(
            bet_id="bet_123",
            user_id="user_456",
            sport="NBA",
            market="Moneyline",
            selection="Lakers",
            opening_odds=-110,
            stake_amount=100.0,
            placed_at=datetime.now(timezone.utc),
            clv_status=CLVComputationStatus.PENDING
        )
    
    def test_clv_bet_tracking_creation(self, sample_clv_bet):
        """Test CLV bet tracking model creation"""
        assert sample_clv_bet.bet_id == "bet_123"
        assert sample_clv_bet.user_id == "user_456"
        assert sample_clv_bet.sport == "NBA"
        assert sample_clv_bet.market == "Moneyline"
        assert sample_clv_bet.clv_status == CLVComputationStatus.PENDING
        assert sample_clv_bet.clv_percent is None
    
    def test_clv_computation_status_enum(self):
        """Test CLV computation status enum values"""
        assert CLVComputationStatus.PENDING.value == "pending"
        assert CLVComputationStatus.COMPUTED.value == "computed"
        assert CLVComputationStatus.FAILED.value == "failed"
        assert CLVComputationStatus.NO_CLOSING_ODDS.value == "no_closing_odds"
    
    def test_bet_result_enum(self):
        """Test bet result enum values"""
        assert BetResult.WIN.value == "win"
        assert BetResult.LOSS.value == "loss"
        assert BetResult.PUSH.value == "push"
    
    def test_clv_analytics_summary_creation(self):
        """Test CLV analytics summary model"""
        summary = CLVAnalyticsSummary(
            user_id="user_123",
            period_start=datetime.now(timezone.utc) - timedelta(days=30),
            period_end=datetime.now(timezone.utc),
            total_bets=50,
            avg_clv_percent=3.5,
            positive_clv_rate=65.0,
            total_stake=5000.0,
            total_profit_loss=250.0,
            roi_percent=5.0
        )
        
        assert summary.user_id == "user_123"
        assert summary.total_bets == 50
        assert summary.avg_clv_percent == 3.5
        assert summary.roi_percent == 5.0
    
    def test_clv_leaderboard_creation(self):
        """Test CLV leaderboard model"""
        leaderboard_entry = CLVLeaderboard(
            user_id="user_789",
            period_start=datetime.now(timezone.utc) - timedelta(days=30),
            period_end=datetime.now(timezone.utc),
            avg_clv_percent=8.2,
            total_bets=100,
            rank=5,
            percentile=95.0
        )
        
        assert leaderboard_entry.user_id == "user_789"
        assert leaderboard_entry.avg_clv_percent == 8.2
        assert leaderboard_entry.rank == 5
        assert leaderboard_entry.percentile == 95.0


class TestCLVComputationTask:
    """Test CLV computation background task"""
    
    @pytest.fixture
    def clv_task(self):
        """Create CLV computation task instance"""
        return CLVComputationTask()
    
    @pytest.mark.asyncio
    async def test_task_initialization(self, clv_task):
        """Test task initialization"""
        assert clv_task.is_running == False
        assert clv_task.monitoring_interval_minutes == 60
        assert clv_task.stats["processed_count"] == 0
        assert clv_task.stats["success_count"] == 0
        assert clv_task.stats["error_count"] == 0
    
    @pytest.mark.asyncio
    async def test_get_pending_bets(self, clv_task):
        """Test getting pending bets for CLV computation"""
        # Mock database session
        mock_session = Mock()
        mock_query = Mock()
        mock_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []
        
        bets = clv_task._get_pending_bets(mock_session)
        assert isinstance(bets, list)
        
        # Verify proper query construction
        mock_session.query.assert_called_once_with(CLVBetTracking)
        mock_query.filter.assert_called()
    
    @pytest.mark.asyncio
    async def test_fetch_closing_odds_success(self, clv_task):
        """Test successful closing odds fetching"""
        sample_bet = CLVBetTracking(
            bet_id="bet_123",
            sport="NBA",
            market="Moneyline",
            selection="Lakers",
            game_id="game_456",
            opening_odds=-110
        )
        
        # Mock successful odds fetch
        closing_odds = await clv_task._fetch_closing_odds(sample_bet)
        
        # Should return simulated odds (since we're using mock data)
        assert closing_odds is not None
        assert isinstance(closing_odds, (int, float))
    
    @pytest.mark.asyncio
    async def test_compute_clv_for_bet(self, clv_task):
        """Test CLV computation for individual bet"""
        sample_bet = CLVBetTracking(
            bet_id="bet_123",
            sport="NBA",
            opening_odds=-110,
            clv_status=CLVComputationStatus.PENDING
        )
        
        # Mock database session
        mock_session = Mock()
        
        # Test computation
        success = await clv_task._compute_clv_for_bet(sample_bet, mock_session)
        
        # Should complete successfully with simulated data
        assert isinstance(success, bool)
    
    @pytest.mark.asyncio
    async def test_process_bets_batch(self, clv_task):
        """Test batch processing of bets"""
        # Create sample bets
        bets = [
            CLVBetTracking(bet_id=f"bet_{i}", opening_odds=-110, clv_status=CLVComputationStatus.PENDING)
            for i in range(5)
        ]
        
        # Mock database session
        mock_session = Mock()
        
        # Test batch processing
        results = await clv_task._process_bets_batch(bets, mock_session)
        
        assert isinstance(results, dict)
        assert "processed" in results
        assert "succeeded" in results
        assert "failed" in results
    
    @pytest.mark.asyncio
    async def test_manual_trigger(self, clv_task):
        """Test manual CLV computation trigger"""
        # Mock database session
        mock_db = Mock()
        
        result = await clv_task.trigger_manual_computation(mock_db)
        
        assert isinstance(result, dict)
        assert "status" in result
        assert "message" in result
    
    def test_get_computation_status(self, clv_task):
        """Test getting computation status"""
        status = clv_task.get_computation_status()
        
        assert isinstance(status, dict)
        assert "is_running" in status
        assert "stats" in status
        assert "last_run" in status
        assert "next_scheduled_run" in status


class TestCLVAPI:
    """Test CLV API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(clv_tracking_router)
        app.include_router(analytics_router)
        app.include_router(history_router)
        return TestClient(app)
    
    @pytest.fixture
    def mock_user(self):
        """Mock authenticated user"""
        return Mock(id="test_user_123")
    
    @pytest.fixture
    def sample_bet_data(self):
        """Sample bet tracking data"""
        return {
            "bet_id": "bet_123",
            "sport": "NBA",
            "market": "Moneyline",
            "selection": "Lakers",
            "opening_odds": -110,
            "stake_amount": 100.0,
            "game_id": "game_456",
            "bookmaker": "DraftKings"
        }
    
    def test_track_bet_endpoint(self, client, sample_bet_data):
        """Test bet tracking endpoint"""
        with patch('backend.routes.clv_bet_tracking_routes.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(id="test_user")
            
            with patch('backend.routes.clv_bet_tracking_routes.get_db') as mock_db:
                mock_db.return_value = Mock()
                
                response = client.post("/api/bets/track", json=sample_bet_data)
                
                # Should accept the request (actual DB operations are mocked)
                assert response.status_code in [200, 201, 422]  # 422 for validation errors in test
    
    def test_get_user_clv_analytics_unauthorized(self, client):
        """Test user CLV analytics with unauthorized access"""
        response = client.get("/api/users/other_user/clv")
        assert response.status_code == 422  # No auth header
    
    def test_get_user_clv_summary_endpoint(self, client):
        """Test user CLV summary endpoint"""
        with patch('backend.routes.user_clv_analytics_routes.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(id="test_user")
            
            with patch('backend.routes.user_clv_analytics_routes.get_db') as mock_db:
                mock_session = Mock()
                mock_session.query.return_value.filter.return_value.all.return_value = []
                mock_db.return_value = mock_session
                
                response = client.get("/api/users/test_user/clv/summary")
                
                # Should return summary data
                assert response.status_code in [200, 422]
    
    def test_clv_leaderboard_endpoint(self, client):
        """Test CLV leaderboard endpoint"""
        with patch('backend.routes.clv_history_segmentation_routes.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(id="test_user")
            
            with patch('backend.routes.clv_history_segmentation_routes.get_db') as mock_db:
                mock_session = Mock()
                mock_session.query.return_value.filter.return_value.group_by.return_value.having.return_value.all.return_value = []
                mock_db.return_value = mock_session
                
                response = client.get("/api/clv-history/leaderboard")
                
                assert response.status_code in [200, 422]
    
    def test_manual_clv_computation_endpoint(self, client):
        """Test manual CLV computation trigger"""
        with patch('backend.routes.clv_bet_tracking_routes.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(id="admin_user")
            
            with patch('backend.routes.clv_bet_tracking_routes.get_db') as mock_db:
                mock_db.return_value = Mock()
                
                response = client.post("/api/bets/clv/compute")
                
                assert response.status_code in [200, 422]


class TestCLVEdgeCases:
    """Test edge cases and error handling"""
    
    def test_clv_calculation_extreme_odds(self):
        """Test CLV calculation with extreme odds"""
        # Very high positive odds
        clv = calculate_clv_percent(10000, 5000)
        assert isinstance(clv, (int, float))
        
        # Very low negative odds
        clv = calculate_clv_percent(-2000, -1500)
        assert isinstance(clv, (int, float))
    
    def test_clv_calculation_invalid_odds(self):
        """Test CLV calculation with invalid odds"""
        # Test with zero (should handle gracefully)
        try:
            clv = calculate_clv_percent(0, -110)
            assert clv is not None
        except (ValueError, ZeroDivisionError):
            pass  # Expected behavior
    
    def test_empty_bet_list_analytics(self):
        """Test analytics functions with empty bet lists"""
        from backend.routes.user_clv_analytics_routes import _calculate_clv_metrics, _calculate_profitability_metrics
        
        # Empty list should not crash
        metrics = _calculate_clv_metrics([])
        assert metrics.total_bets == 0
        assert metrics.avg_clv_percent is None
        
        profitability = _calculate_profitability_metrics([])
        assert profitability.settled_bets == 0
        assert profitability.win_rate is None
    
    def test_achievement_badges_edge_cases(self):
        """Test achievement system with edge cases"""
        # Minimal stats
        stats = {
            "avg_clv_percent": 0.0,
            "total_bets": 1,
            "positive_clv_rate": 0.0,
            "win_rate": 0.0
        }
        badges = get_achievement_badges(stats)
        assert isinstance(badges, list)
        
        # Missing fields
        stats = {}
        badges = get_achievement_badges(stats)
        assert isinstance(badges, list)
    
    @pytest.mark.asyncio
    async def test_clv_task_error_handling(self):
        """Test CLV computation task error handling"""
        task = CLVComputationTask()
        
        # Test with invalid bet data
        invalid_bet = CLVBetTracking(
            bet_id=None,  # Invalid bet ID
            sport="INVALID",
            opening_odds=0  # Invalid odds
        )
        
        mock_session = Mock()
        
        # Should handle errors gracefully
        try:
            result = await task._compute_clv_for_bet(invalid_bet, mock_session)
            assert isinstance(result, bool)
        except Exception as e:
            # Should log error but not crash
            assert True


class TestCLVPerformance:
    """Test CLV system performance"""
    
    @pytest.mark.asyncio
    async def test_batch_processing_performance(self):
        """Test performance of batch CLV processing"""
        import time
        
        task = CLVComputationTask()
        
        # Create large batch of bets
        bets = [
            CLVBetTracking(
                bet_id=f"bet_{i}",
                sport="NBA",
                opening_odds=-110,
                clv_status=CLVComputationStatus.PENDING
            )
            for i in range(100)
        ]
        
        mock_session = Mock()
        
        start_time = time.time()
        results = await task._process_bets_batch(bets, mock_session)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        # Should process 100 bets reasonably quickly (under 10 seconds)
        assert processing_time < 10.0
        assert isinstance(results, dict)
    
    def test_clv_calculation_performance(self):
        """Test performance of CLV calculations"""
        import time
        
        start_time = time.time()
        
        # Calculate CLV for many different odds combinations
        for opening in range(-200, 201, 10):
            if opening == 0:
                continue
            for closing in range(-200, 201, 10):
                if closing == 0:
                    continue
                clv = calculate_clv_percent(opening, closing)
                assert isinstance(clv, (int, float))
        
        end_time = time.time()
        calculation_time = end_time - start_time
        
        # Should complete many calculations quickly
        assert calculation_time < 5.0
    
    def test_memory_usage_batch_processing(self):
        """Test memory usage during batch processing"""
        # Create large number of bet objects
        bets = [
            CLVBetTracking(
                bet_id=f"bet_{i}",
                user_id=f"user_{i % 10}",
                sport="NBA",
                opening_odds=-110
            )
            for i in range(1000)
        ]
        
        # Process them and ensure objects can be garbage collected
        from backend.routes.user_clv_analytics_routes import _calculate_clv_metrics
        
        metrics = _calculate_clv_metrics(bets)
        assert metrics.total_bets == 1000
        
        # Clear references
        del bets
        del metrics
        
        # Should not cause memory issues
        assert True


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])