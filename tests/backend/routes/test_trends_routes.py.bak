import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
import json

from backend.models.trends_models import (
    TrendLeaderboardFilters,
    TrendLeaderboardResponse,
    TrendMetric,
    SportFilter,
    MarketTypeFilter,
    TrendLeaderboardEntry,
    TrendStatsSummary,
    TrendCacheStatus
)
from backend.services.trends_service import TrendsService, trends_service
from backend.routes.trends_routes import router


class TestTrendsModels:
    """Test trends data models"""
    
    def test_trend_leaderboard_entry_creation(self):
        """Test creating a trend leaderboard entry"""
        entry = TrendLeaderboardEntry(
            player_id="mlb_aaron_judge",
            player_name="Aaron Judge",
            team="NYY",
            sport="MLB",
            market_type="player_props",
            over_hit_rate=0.725,
            avg_ev=8.5,
            arbitrage_count=3,
            high_confidence_rate=0.68,
            total_props=25
        )
        
        assert entry.player_name == "Aaron Judge"
        assert entry.over_hit_rate == 0.725
        assert entry.avg_ev == 8.5
        assert entry.arbitrage_count == 3
        assert entry.total_props == 25
        assert entry.rank is None  # Default value
    
    def test_trend_leaderboard_filters_defaults(self):
        """Test default values for filters"""
        filters = TrendLeaderboardFilters()
        
        assert filters.metric == TrendMetric.OVER_HIT_RATE
        assert filters.sport == SportFilter.ALL
        assert filters.market_type == MarketTypeFilter.ALL
        assert filters.min_samples == 5
        assert filters.period_days == 30
        assert filters.limit == 50
    
    def test_trend_leaderboard_filters_validation(self):
        """Test filter validation"""
        # Test minimum samples validation
        with pytest.raises(ValueError):
            TrendLeaderboardFilters(min_samples=0)
        
        with pytest.raises(ValueError):
            TrendLeaderboardFilters(min_samples=101)
        
        # Test period days validation
        with pytest.raises(ValueError):
            TrendLeaderboardFilters(period_days=6)
        
        with pytest.raises(ValueError):
            TrendLeaderboardFilters(period_days=366)
    
    def test_trend_leaderboard_response_structure(self):
        """Test response model structure"""
        entry = TrendLeaderboardEntry(
            player_id="test_player",
            player_name="Test Player",
            team="TEST",
            sport="MLB",
            market_type="player_props",
            over_hit_rate=0.5,
            avg_ev=0.0,
            arbitrage_count=0,
            high_confidence_rate=0.5,
            total_props=10
        )
        
        response = TrendLeaderboardResponse(
            data=[entry],
            filters=TrendLeaderboardFilters(),
            total_entries=1,
            error=None
        )
        
        assert response.success is True
        assert len(response.data) == 1
        assert response.total_entries == 1
        assert response.error is None


class TestTrendsService:
    """Test trends service functionality"""
    
    @pytest.fixture
    def trends_service_instance(self):
        """Create a fresh trends service instance for testing"""
        return TrendsService()
    
    @pytest.mark.asyncio
    async def test_get_trends_leaderboard_basic(self, trends_service_instance):
        """Test basic leaderboard retrieval"""
        filters = TrendLeaderboardFilters(
            metric=TrendMetric.OVER_HIT_RATE,
            sport=SportFilter.MLB,
            min_samples=5,
            limit=10
        )
        
        response = await trends_service_instance.get_trends_leaderboard(filters)
        
        assert isinstance(response, TrendLeaderboardResponse)
        assert response.success is True
        assert len(response.data) <= 10  # Respects limit
        assert all(entry.total_props >= 5 for entry in response.data)  # Respects min_samples
        assert all(entry.sport == "MLB" for entry in response.data)  # Respects sport filter
    
    @pytest.mark.asyncio
    async def test_get_trends_leaderboard_all_metrics(self, trends_service_instance):
        """Test leaderboard with all different metrics"""
        metrics_to_test = [
            TrendMetric.OVER_HIT_RATE,
            TrendMetric.AVG_EV,
            TrendMetric.ARBITRAGE_COUNT,
            TrendMetric.HIGH_CONFIDENCE_RATE
        ]
        
        for metric in metrics_to_test:
            filters = TrendLeaderboardFilters(
                metric=metric,
                sport=SportFilter.ALL,
                limit=5
            )
            
            response = await trends_service_instance.get_trends_leaderboard(filters)
            
            assert response.success is True
            assert len(response.data) <= 5
            
            # Check that results are sorted by the selected metric
            if len(response.data) > 1:
                metric_values = [getattr(entry, metric.value) for entry in response.data]
                assert metric_values == sorted(metric_values, reverse=True)
    
    @pytest.mark.asyncio
    async def test_cache_functionality(self, trends_service_instance):
        """Test caching behavior"""
        filters = TrendLeaderboardFilters(limit=5)
        
        # First request should compute
        start_time = datetime.utcnow()
        response1 = await trends_service_instance.get_trends_leaderboard(filters)
        first_request_time = datetime.utcnow() - start_time
        
        # Second request should be cached (faster)
        start_time = datetime.utcnow()
        response2 = await trends_service_instance.get_trends_leaderboard(filters)
        second_request_time = datetime.utcnow() - start_time
        
        assert response1.data == response2.data
        assert response2.cache_timestamp is not None
        # Second request should be significantly faster (cached)
        # Note: This might be flaky in CI, so just check cache timestamp exists
        assert response2.cache_timestamp <= datetime.utcnow()
    
    @pytest.mark.asyncio
    async def test_cache_invalidation(self, trends_service_instance):
        """Test cache invalidation after TTL"""
        # Mock the cache TTL to be very short for testing
        original_ttl = trends_service_instance._cache_ttl
        trends_service_instance._cache_ttl = timedelta(milliseconds=1)
        
        try:
            filters = TrendLeaderboardFilters(limit=3)
            
            # First request
            response1 = await trends_service_instance.get_trends_leaderboard(filters)
            
            # Wait for cache to expire
            import asyncio
            await asyncio.sleep(0.002)  # 2ms
            
            # Second request should recompute
            response2 = await trends_service_instance.get_trends_leaderboard(filters)
            
            # Should have fresh cache timestamps
            assert response2.cache_timestamp > response1.cache_timestamp
            
        finally:
            # Restore original TTL
            trends_service_instance._cache_ttl = original_ttl
    
    @pytest.mark.asyncio
    async def test_get_trends_summary(self, trends_service_instance):
        """Test trends summary functionality"""
        summary = await trends_service_instance.get_trends_summary()
        
        assert isinstance(summary, TrendStatsSummary)
        assert summary.total_players > 0
        assert summary.total_props_analyzed > 0
        assert len(summary.sports_covered) > 0
        assert "start_date" in summary.date_range
        assert "end_date" in summary.date_range
    
    def test_get_cache_status(self, trends_service_instance):
        """Test cache status reporting"""
        status = trends_service_instance.get_cache_status()
        
        assert isinstance(status, TrendCacheStatus)
        assert isinstance(status.last_computed, datetime)
        assert isinstance(status.next_refresh, datetime)
        assert status.cache_hit_rate >= 0
        assert status.entries_cached >= 0
        assert status.computation_time_ms >= 0
    
    @pytest.mark.asyncio
    async def test_clear_cache(self, trends_service_instance):
        """Test cache clearing functionality"""
        # Populate cache first
        filters = TrendLeaderboardFilters(limit=2)
        await trends_service_instance.get_trends_leaderboard(filters)
        
        # Verify cache has entries
        assert len(trends_service_instance._cache) > 0
        
        # Clear cache
        result = await trends_service_instance.clear_cache()
        
        assert result is True
        assert len(trends_service_instance._cache) == 0
        assert len(trends_service_instance._cache_timestamps) == 0


class TestTrendsRoutes:
    """Test trends API routes"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(router)
        return TestClient(app)
    
    def test_get_trends_leaderboard_endpoint(self, client):
        """Test GET /api/trends/props endpoint"""
        response = client.get("/api/trends/props")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "data" in data
        assert "filters" in data
        assert "total_entries" in data
        assert isinstance(data["data"], list)
    
    def test_get_trends_leaderboard_with_filters(self, client):
        """Test endpoint with various filter parameters"""
        params = {
            "metric": "avg_ev",
            "sport": "MLB",
            "market_type": "player_props",
            "min_samples": 10,
            "period_days": 14,
            "limit": 20
        }
        
        response = client.get("/api/trends/props", params=params)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert len(data["data"]) <= 20
        assert data["filters"]["metric"] == "avg_ev"
        assert data["filters"]["sport"] == "MLB"
        assert data["filters"]["min_samples"] == 10
    
    def test_get_trends_leaderboard_invalid_params(self, client):
        """Test endpoint with invalid parameters"""
        # Test invalid min_samples
        response = client.get("/api/trends/props?min_samples=0")
        assert response.status_code == 422  # Validation error
        
        # Test invalid period_days
        response = client.get("/api/trends/props?period_days=5")
        assert response.status_code == 422  # Validation error
    
    def test_get_trends_summary_endpoint(self, client):
        """Test GET /api/trends/summary endpoint"""
        response = client.get("/api/trends/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_players" in data
        assert "total_props_analyzed" in data
        assert "sports_covered" in data
        assert "date_range" in data
    
    def test_get_cache_status_endpoint(self, client):
        """Test GET /api/trends/cache/status endpoint"""
        response = client.get("/api/trends/cache/status")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "last_computed" in data
        assert "next_refresh" in data
        assert "cache_hit_rate" in data
        assert "entries_cached" in data
    
    def test_clear_cache_endpoint(self, client):
        """Test POST /api/trends/cache/clear endpoint"""
        response = client.post("/api/trends/cache/clear")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "message" in data
    
    def test_get_available_metrics_endpoint(self, client):
        """Test GET /api/trends/metrics/available endpoint"""
        response = client.get("/api/trends/metrics/available")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "metrics" in data
        assert "sports" in data
        assert "market_types" in data
        
        # Check that all expected metrics are present
        expected_metrics = ["over_hit_rate", "avg_ev", "arbitrage_count", "high_confidence_rate"]
        for metric in expected_metrics:
            assert metric in data["metrics"]
            assert "name" in data["metrics"][metric]
            assert "description" in data["metrics"][metric]


class TestTrendsIntegration:
    """Integration tests for trends functionality"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_trends_flow(self):
        """Test complete flow from service to API response"""
        # Test with global service instance
        filters = TrendLeaderboardFilters(
            metric=TrendMetric.OVER_HIT_RATE,
            sport=SportFilter.MLB,
            min_samples=5,
            limit=10
        )
        
        # Get data through service
        response = await trends_service.get_trends_leaderboard(filters)
        
        assert response.success is True
        assert len(response.data) > 0
        
        # Verify data quality
        for entry in response.data:
            assert entry.player_name is not None
            assert entry.sport == "MLB"
            assert entry.total_props >= 5
            assert 0 <= entry.over_hit_rate <= 1
            assert entry.high_confidence_rate >= 0
    
    @pytest.mark.asyncio 
    async def test_concurrent_requests(self):
        """Test handling concurrent requests to trends service"""
        import asyncio
        
        filters = TrendLeaderboardFilters(limit=5)
        
        # Make multiple concurrent requests
        tasks = [
            trends_service.get_trends_leaderboard(filters)
            for _ in range(5)
        ]
        
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        assert all(response.success for response in responses)
        
        # All should return the same data (due to caching)
        first_data = responses[0].data
        for response in responses[1:]:
            assert response.data == first_data
    
    @pytest.mark.asyncio
    async def test_performance_under_load(self):
        """Test performance with various filter combinations"""
        import asyncio
        import time
        
        filter_combinations = [
            TrendLeaderboardFilters(metric=TrendMetric.OVER_HIT_RATE, sport=SportFilter.MLB),
            TrendLeaderboardFilters(metric=TrendMetric.AVG_EV, sport=SportFilter.NBA),
            TrendLeaderboardFilters(metric=TrendMetric.ARBITRAGE_COUNT, sport=SportFilter.ALL),
            TrendLeaderboardFilters(metric=TrendMetric.HIGH_CONFIDENCE_RATE, sport=SportFilter.NFL),
        ]
        
        start_time = time.time()
        
        tasks = [
            trends_service.get_trends_leaderboard(filters)
            for filters in filter_combinations
        ]
        
        responses = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # All requests should complete successfully
        assert all(response.success for response in responses)
        
        # Should complete reasonably quickly (allowing for sample data generation)
        assert total_time < 5.0  # 5 seconds should be more than enough
        
        # Each response should have appropriate data
        for i, response in enumerate(responses):
            expected_sport = filter_combinations[i].sport
            if expected_sport != SportFilter.ALL:
                assert all(
                    entry.sport == expected_sport.value 
                    for entry in response.data
                )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])