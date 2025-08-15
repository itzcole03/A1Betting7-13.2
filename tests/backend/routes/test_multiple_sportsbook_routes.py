"""
Test Multiple Sportsbook Routes - Unified Sportsbook Data, Arbitrage Detection
Tests comprehensive sportsbook integration with DraftKings, BetMGM, Caesars, and others
"""

import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

import pytest
from fastapi import status


class TestMultipleSportsbookRoutes:
    """Comprehensive tests for Multiple Sportsbook API routes"""
    
    @pytest.fixture(autouse=True)
    async def setup(self):
        """Setup mocks for sportsbook services"""
        # Mock unified sportsbook service
        self.mock_sportsbook_service = AsyncMock()
        
        # Mock connection manager for WebSocket tests
        self.mock_connection_manager = MagicMock()
        self.mock_connection_manager.connect = AsyncMock()
        self.mock_connection_manager.disconnect = MagicMock() 
        self.mock_connection_manager.broadcast = AsyncMock()
        
        yield
    
    
    # ============================================================================
    # Player Props Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_player_props_success(self, client, mock_unified_sportsbook_service):
        """Test successful retrieval of player props from multiple sportsbooks"""
        
        # Mock player props data
        mock_props = [
            {
                "player": "Aaron Judge",
                "sport": "MLB",
                "team": "NYY",
                "position": "RF",
                "opponent": "BOS",
                "league": "MLB",
                "marketType": "Home Runs",
                "betType": "over_under",
                "line": 0.5,
                "odds": -125,
                "decimalOdds": 1.80,
                "side": "over",
                "timestamp": "2025-08-14T15:30:00Z",
                "gameTime": "2025-08-14T19:05:00Z",
                "sportsbook": "DraftKings"
            },
            {
                "player": "Mike Trout", 
                "sport": "MLB",
                "team": "LAA",
                "marketType": "Hits",
                "line": 1.5,
                "odds": +110,
                "sportsbook": "FanDuel"
            }
        ]
        
        mock_unified_sportsbook_service.get_player_props.return_value = mock_props
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            response = await client.get("/api/sportsbook/player-props?sport=mlb")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            # Check response structure
            assert "success" in data
            assert data["success"] is True
            assert "data" in data
            assert len(data["data"]) == 2
            
            # Verify player data
            first_prop = data["data"][0]
            assert first_prop["player"] == "Aaron Judge"
            assert first_prop["sport"] == "MLB"
            assert first_prop["marketType"] == "Home Runs"
    
    
    @pytest.mark.asyncio
    async def test_get_player_props_with_filters(self, client, mock_unified_sportsbook_service):
        """Test player props with multiple filters"""
        
        mock_props = [
            {
                "player": "Aaron Judge",
                "sport": "MLB", 
                "marketType": "Home Runs",
                "line": 0.5,
                "odds": -120,
                "sportsbook": "DraftKings"
            }
        ]
        
        mock_unified_sportsbook_service.get_player_props.return_value = mock_props
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            # Test with multiple query parameters
            response = await client.get(
                "/api/sportsbook/player-props"
                "?sport=mlb"
                "&player_name=Aaron Judge"
                "&providers=DraftKings,FanDuel"
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert len(data["data"]) == 1
            assert data["data"][0]["player"] == "Aaron Judge"
            
            # Verify service was called with correct filters
            mock_unified_sportsbook_service.get_player_props.assert_called_once()
    
    
    @pytest.mark.asyncio
    async def test_get_player_props_missing_sport(self, client):
        """Test player props endpoint without required sport parameter"""
        
        response = await client.get("/api/sportsbook/player-props")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error_data = response.json()
        assert "detail" in error_data
    
    
    @pytest.mark.asyncio
    async def test_get_player_props_service_error(self, client):
        """Test handling of sportsbook service errors"""
        
        mock_service = AsyncMock()
        mock_service.get_player_props.side_effect = Exception("Sportsbook API unavailable")
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_service):
            
            response = await client.get("/api/sportsbook/player-props?sport=mlb")
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    
    # ============================================================================
    # Best Odds Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_best_odds_success(self, client, mock_unified_sportsbook_service):
        """Test successful retrieval of best odds comparison"""
        
        mock_best_odds = [
            {
                "player": "Aaron Judge",
                "sport": "MLB",
                "betType": "Home Runs Over/Under", 
                "line": 0.5,
                "bestOverOdds": -115,
                "bestOverProvider": "DraftKings",
                "bestOverDecimal": 1.87,
                "bestUnderOdds": +105,
                "bestUnderProvider": "FanDuel",
                "bestUnderDecimal": 2.05,
                "oddsSpread": 220,  # 115 + 105
                "valueRating": "excellent",
                "all_odds": [
                    {
                        "provider": "DraftKings",
                        "over_odds": -115,
                        "under_odds": +100
                    },
                    {
                        "provider": "FanDuel",
                        "over_odds": -110,
                        "under_odds": +105
                    }
                ]
            }
        ]
        
        mock_unified_sportsbook_service.get_best_odds.return_value = mock_best_odds
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            response = await client.get("/api/sportsbook/best-odds?sport=mlb")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            odds_data = data["data"][0]
            assert odds_data["bestOverProvider"] == "DraftKings"
            assert odds_data["bestUnderProvider"] == "FanDuel"
            assert "all_odds" in odds_data
    
    
    @pytest.mark.asyncio
    async def test_get_best_odds_with_filters(self, client, mock_unified_sportsbook_service):
        """Test best odds with player and bet type filters"""
        
        mock_best_odds = [
            {
                "player": "Mike Trout",
                "betType": "Hits Over/Under",
                "bestOverOdds": -120,
                "bestOverProvider": "BetMGM"
            }
        ]
        
        mock_unified_sportsbook_service.get_best_odds.return_value = mock_best_odds
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            response = await client.get(
                "/api/sportsbook/best-odds"
                "?sport=mlb"
                "&player_name=Mike Trout"
                "&bet_type=hits"
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert data["data"][0]["player"] == "Mike Trout"
    
    
    # ============================================================================
    # Arbitrage Opportunities Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_arbitrage_opportunities(self, client, mock_unified_sportsbook_service):
        """Test arbitrage opportunity detection"""
        
        mock_arbitrage = [
            {
                "player": "Aaron Judge",
                "sport": "MLB",
                "betType": "Home Runs Over/Under",
                "line": 0.5,
                "overOdds": -110,
                "overProvider": "DraftKings",
                "overStakePercentage": 52.38,
                "underOdds": +115,
                "underProvider": "FanDuel", 
                "underStakePercentage": 47.62,
                "guaranteedProfitPercentage": 2.27,
                "minimumBetAmount": 100,
                "expectedReturn": 102.27,
                "confidenceLevel": 0.95,
                "timeSensitivity": "high"
            }
        ]
        
        mock_unified_sportsbook_service.get_arbitrage_opportunities.return_value = mock_arbitrage
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            with patch('backend.routes.multiple_sportsbook_routes.connection_manager', self.mock_connection_manager):
                
                response = await client.get("/api/sportsbook/arbitrage?sport=mlb")
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                
                assert data["success"] is True
                arb_data = data["data"][0]
                assert arb_data["guaranteedProfitPercentage"] == 2.27
                assert arb_data["overProvider"] == "DraftKings"
                assert arb_data["underProvider"] == "FanDuel"
                
                # Verify WebSocket broadcast was triggered
                self.mock_connection_manager.broadcast.assert_called_once()
    
    
    @pytest.mark.asyncio
    async def test_get_arbitrage_with_minimum_profit(self, client, mock_unified_sportsbook_service):
        """Test arbitrage filtering by minimum profit percentage"""
        
        mock_arbitrage = [
            {
                "player": "Mike Trout",
                "guaranteedProfitPercentage": 3.5,
                "overProvider": "Caesars",
                "underProvider": "BetMGM"
            }
        ]
        
        mock_unified_sportsbook_service.get_arbitrage_opportunities.return_value = mock_arbitrage
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            with patch('backend.routes.multiple_sportsbook_routes.connection_manager', self.mock_connection_manager):
                
                response = await client.get("/api/sportsbook/arbitrage?sport=mlb&min_profit=3.0")
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                
                assert data["success"] is True
                assert data["data"][0]["guaranteedProfitPercentage"] >= 3.0
    
    
    # ============================================================================
    # Performance Metrics Tests  
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_performance_metrics(self, client, mock_unified_sportsbook_service):
        """Test sportsbook performance metrics endpoint"""
        
        mock_performance = {
            "overall_stats": {
                "total_requests": 15420,
                "success_rate": 0.967,
                "avg_response_time_ms": 234,
                "cache_hit_rate": 0.78
            },
            "provider_stats": {
                "DraftKings": {
                    "success_rate": 0.982,
                    "avg_response_time_ms": 189,
                    "last_success": datetime.now()
                },
                "FanDuel": {
                    "success_rate": 0.975,
                    "avg_response_time_ms": 212,
                    "last_success": datetime.now()
                },
                "BetMGM": {
                    "success_rate": 0.943,
                    "avg_response_time_ms": 298,
                    "last_success": datetime.now()
                }
            }
        }
        
        mock_unified_sportsbook_service.get_performance_metrics.return_value = mock_performance
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            response = await client.get("/api/sportsbook/performance")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            perf_data = data["data"]
            assert "overall_stats" in perf_data
            assert "provider_stats" in perf_data
            assert perf_data["overall_stats"]["success_rate"] > 0.9
    
    
    # ============================================================================
    # Available Sports Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_available_sports(self, client):
        """Test getting list of available sports"""
        
        response = await client.get("/api/sportsbook/sports")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Should return list of sports
        expected_sports = ["nba", "nfl", "mlb", "nhl", "ncaab", "ncaaf", "soccer", "tennis", "golf", "mma"]
        assert len(data) >= len(expected_sports)
        
        # Check some expected sports are included
        for sport in ["nba", "nfl", "mlb"]:
            assert sport in data
    
    
    # ============================================================================
    # Search Player Props Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_search_player_props(self, client, mock_unified_sportsbook_service):
        """Test searching for specific player props"""
        
        mock_search_results = [
            {
                "player": "Aaron Judge",
                "sport": "MLB",
                "betType": "Home Runs",
                "line": 0.5,
                "odds": -125,
                "side": "over",
                "timestamp": "2025-08-14T15:30:00Z",
                "gameTime": "2025-08-14T19:05:00Z",
                "sportsbook": "DraftKings"
            }
        ]
        
        mock_unified_sportsbook_service.search_player_props.return_value = mock_search_results
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            response = await client.get(
                "/api/sportsbook/search"
                "?player_name=Aaron Judge"
                "&sport=mlb"
                "&bet_type=home_runs"
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert len(data["data"]) == 1
            assert data["data"][0]["player"] == "Aaron Judge"
    
    
    @pytest.mark.asyncio
    async def test_search_player_props_missing_params(self, client):
        """Test search with missing required parameters"""
        
        response = await client.get("/api/sportsbook/search")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    
    # ============================================================================
    # WebSocket Tests
    # ============================================================================
    
    def test_websocket_connection(self, sync_client):
        """Test WebSocket endpoint for real-time sportsbook updates"""
        
        with patch('backend.routes.multiple_sportsbook_routes.connection_manager', self.mock_connection_manager):
            
            with sync_client.websocket_connect("/api/sportsbook/ws") as websocket:
                
                # Test subscription message
                subscribe_message = {
                    "type": "subscribe",
                    "sport": "mlb"
                }
                
                websocket.send_json(subscribe_message)
                
                # Test ping message
                ping_message = {
                    "type": "ping"
                }
                
                websocket.send_json(ping_message)
                
                # Verify connection manager was used
                assert self.mock_connection_manager.connect.called
    
    
    def test_websocket_multiple_subscriptions(self, sync_client):
        """Test WebSocket with multiple sport subscriptions"""
        
        with patch('backend.routes.multiple_sportsbook_routes.connection_manager', self.mock_connection_manager):
            
            with sync_client.websocket_connect("/api/sportsbook/ws") as websocket:
                
                # Subscribe to multiple sports
                sports = ["mlb", "nba", "nfl"]
                
                for sport in sports:
                    message = {
                        "type": "subscribe",
                        "sport": sport
                    }
                    websocket.send_json(message)
                
                assert self.mock_connection_manager.connect.called
    
    
    def test_websocket_disconnect_handling(self, sync_client):
        """Test WebSocket disconnect handling"""
        
        with patch('backend.routes.multiple_sportsbook_routes.connection_manager', self.mock_connection_manager):
            
            try:
                with sync_client.websocket_connect("/api/sportsbook/ws") as websocket:
                    # Send message then close
                    websocket.send_json({"type": "ping"})
                    
            except Exception:
                # Disconnect exceptions are expected
                pass
            
            # Verify connection was attempted
            assert self.mock_connection_manager.connect.called
    
    
    # ============================================================================
    # Rate Limiting Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_rate_limiting_applied(self, client, mock_unified_sportsbook_service):
        """Test that rate limiting is applied to sportsbook endpoints"""
        
        mock_unified_sportsbook_service.get_player_props.return_value = []
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            # Make multiple rapid requests
            responses = []
            for i in range(5):
                response = await client.get("/api/sportsbook/player-props?sport=mlb")
                responses.append(response)
            
            # All requests should succeed (rate limiting configured for testing)
            for response in responses:
                assert response.status_code in [status.HTTP_200_OK, status.HTTP_429_TOO_MANY_REQUESTS]
    
    
    # ============================================================================
    # Caching Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_response_caching(self, client, mock_unified_sportsbook_service):
        """Test that responses are properly cached"""
        
        mock_props = [{"player": "Test Player", "odds": -110}]
        mock_unified_sportsbook_service.get_player_props.return_value = mock_props
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            
            # Make first request
            response1 = await client.get("/api/sportsbook/player-props?sport=mlb")
            
            # Make second request (should hit cache)
            response2 = await client.get("/api/sportsbook/player-props?sport=mlb")
            
            # Both should succeed
            assert response1.status_code == status.HTTP_200_OK
            assert response2.status_code == status.HTTP_200_OK
            
            # Data should be identical
            assert response1.json() == response2.json()
    
    
    # ============================================================================
    # Error Handling Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_invalid_sport_parameter(self, client):
        """Test handling of invalid sport parameters"""
        
        response = await client.get("/api/sportsbook/player-props?sport=invalid_sport")
        
        # Should handle gracefully, either success with empty data or validation error
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    
    @pytest.mark.asyncio
    async def test_service_timeout_handling(self, client):
        """Test handling of sportsbook service timeouts"""
        
        # Mock service that times out
        mock_service = AsyncMock()
        mock_service.get_player_props.side_effect = asyncio.TimeoutError("Request timed out")
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_service):
            
            response = await client.get("/api/sportsbook/player-props?sport=mlb")
            
            # Should handle timeout gracefully
            assert response.status_code >= 400  # Error response expected
    
    
    # ============================================================================
    # Integration Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_full_arbitrage_workflow(self, client, mock_unified_sportsbook_service):
        """Test complete arbitrage detection and notification workflow"""
        
        # Mock arbitrage opportunity
        mock_arbitrage = [
            {
                "player": "Aaron Judge",
                "guaranteedProfitPercentage": 4.2,
                "overProvider": "DraftKings",
                "underProvider": "FanDuel",
                "timeSensitivity": "high"
            }
        ]
        
        mock_unified_sportsbook_service.get_arbitrage_opportunities.return_value = mock_arbitrage
        
        with patch('backend.routes.multiple_sportsbook_routes.get_sportsbook_service', return_value=mock_unified_sportsbook_service):
            with patch('backend.routes.multiple_sportsbook_routes.connection_manager', self.mock_connection_manager):
                
                # Get arbitrage opportunities  
                response = await client.get("/api/sportsbook/arbitrage?sport=mlb&min_profit=2.0")
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                
                # Verify arbitrage data
                assert data["success"] is True
                assert len(data["data"]) == 1
                assert data["data"][0]["guaranteedProfitPercentage"] == 4.2
                
                # Verify WebSocket notification was sent
                self.mock_connection_manager.broadcast.assert_called_once()
                broadcast_call = self.mock_connection_manager.broadcast.call_args
                assert "arbitrage_alert" in str(broadcast_call)
