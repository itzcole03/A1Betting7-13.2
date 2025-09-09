"""
Tests for Analytics API Routes

Tests all API endpoints for retrieving analytics data
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

from backend.routes.analytics_routes import router as analytics_router
from backend.services.analytics_persistence_service import (
    DailyEVStats,
    DailyArbitrageStats
)


@pytest.fixture
def app():
    """Create FastAPI app with analytics routes for testing"""
    app = FastAPI()
    app.include_router(analytics_router)  # Router already has /api/analytics prefix
    return app


@pytest.fixture
def client(app):
    """Create test client"""
    return TestClient(app)


class TestAnalyticsAPIEndpoints:
    """Tests for analytics API endpoints"""
    
    def test_health_endpoint(self, client):
        """Test analytics health endpoint"""
        response = client.get("/api/analytics/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "analytics_persistence"
        assert "retention_config" in data
        assert "thresholds" in data
        assert "timestamp" in data
    
    def test_daily_ev_stats_endpoint(self, client):
        """Test daily EV stats endpoint"""
        # Mock the dependency injection
        mock_service = AsyncMock()
        mock_stats = [
            DailyEVStats(
                date="2024-01-15",
                total_opportunities=10,
                avg_ev_percent=6.5,
                tier_counts={"high": 3, "medium": 7},
                top_sports=[{"sport": "MLB", "count": 6}],
                top_players=[{"player": "Aaron Judge", "count": 3}]
            )
        ]
        mock_service.get_daily_ev_stats.return_value = mock_stats
        
        # Override the dependency
        from backend.routes.analytics_routes import get_analytics_service
        app = client.app
        app.dependency_overrides[get_analytics_service] = lambda: mock_service
        
        try:
            response = client.get("/api/analytics/daily-ev-stats?days=7")
            assert response.status_code == 200
            
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["total_opportunities"] == 10
            assert data[0]["avg_ev_percent"] == 6.5
            
            mock_service.get_daily_ev_stats.assert_called_once_with(7)
        finally:
            # Clean up
            app.dependency_overrides.clear()
    
    def test_daily_arbitrage_stats_endpoint(self, client):
        """Test daily arbitrage stats endpoint"""
        mock_service = AsyncMock()
        mock_stats = [
            DailyArbitrageStats(
                date="2024-01-15",
                total_opportunities=5,
                avg_profit_pct=2.1,
                total_books_involved=15,
                top_markets=[{"market": "Points", "count": 3}],
                top_sports=[{"sport": "NBA", "count": 5}]
            )
        ]
        mock_service.get_daily_arbitrage_stats.return_value = mock_stats
        
        from backend.routes.analytics_routes import get_analytics_service
        app = client.app
        app.dependency_overrides[get_analytics_service] = lambda: mock_service
        
        try:
            response = client.get("/api/analytics/daily-arb-stats?days=7")
            assert response.status_code == 200
            
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["total_opportunities"] == 5
            assert data[0]["avg_profit_pct"] == 2.1
            
            mock_service.get_daily_arbitrage_stats.assert_called_once_with(7)
        finally:
            app.dependency_overrides.clear()
    
    def test_summary_stats_endpoint(self, client):
        """Test summary stats endpoint"""
        mock_service = AsyncMock()
        mock_summary = {
            "ev": {
                "avg": 7.2,
                "pctHigh": 45.0,
                "tierCounts": {"high": 5, "medium": 3}
            },
            "arbitrage": {
                "count24h": 8,
                "avgProfitPct24h": 2.3
            }
        }
        mock_service.get_summary_stats.return_value = mock_summary
        
        from backend.routes.analytics_routes import get_analytics_service
        app = client.app
        app.dependency_overrides[get_analytics_service] = lambda: mock_service
        
        try:
            response = client.get("/api/analytics/summary")
            assert response.status_code == 200
            
            data = response.json()
            assert data["ev"]["avg"] == 7.2
            assert data["arbitrage"]["count24h"] == 8
            
            mock_service.get_summary_stats.assert_called_once()
        finally:
            app.dependency_overrides.clear()
    
    def test_prune_endpoint(self, client):
        """Test data pruning endpoint"""
        mock_service = AsyncMock()
        mock_result = {
            "ev_opportunities_deleted": 150,
            "arbitrage_opportunities_deleted": 75
        }
        mock_service.prune_old_records.return_value = mock_result
        
        from backend.routes.analytics_routes import get_analytics_service
        app = client.app
        app.dependency_overrides[get_analytics_service] = lambda: mock_service
        
        try:
            response = client.post("/api/analytics/prune")
            assert response.status_code == 200
            
            data = response.json()
            assert data["ev_opportunities_deleted"] == 150
            assert data["arbitrage_opportunities_deleted"] == 75
            
            mock_service.prune_old_records.assert_called_once()
        finally:
            app.dependency_overrides.clear()
    
    def test_invalid_days_parameter(self, client):
        """Test invalid days parameter validation"""
        response = client.get("/api/analytics/daily-ev-stats?days=0")
        assert response.status_code == 422  # Validation error
        
        response = client.get("/api/analytics/daily-ev-stats?days=366")
        assert response.status_code == 422  # Validation error
    
    def test_service_error_handling(self, client):
        """Test error handling when service raises exception"""
        mock_service = AsyncMock()
        mock_service.get_daily_ev_stats.side_effect = Exception("Database error")
        
        from backend.routes.analytics_routes import get_analytics_service
        app = client.app
        app.dependency_overrides[get_analytics_service] = lambda: mock_service
        
        try:
            response = client.get("/api/analytics/daily-ev-stats?days=7")
            assert response.status_code == 500
            
            data = response.json()
            assert "detail" in data
            assert "Failed to retrieve EV statistics" in data["detail"]
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])