"""
Test MLB Extras Routes - PrizePicks Props, Comprehensive Props, Live Game Stats
Tests MLB-specific endpoints with real data integration
"""

import json
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi import status


class TestMLBExtrasRoutes:
    """Comprehensive tests for MLB Extras API routes"""
    
    @pytest.fixture(autouse=True)
    async def setup(self):
        """Setup mocks for MLB services"""
        # Mock MLB data services
        self.mock_mlb_service = AsyncMock()
        self.mock_prizepicks_service = AsyncMock() 
        self.mock_comprehensive_generator = AsyncMock()
        
        yield
    
    
    # ============================================================================
    # Basic Health Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_mlb_test_props_endpoint(self, client):
        """Test basic MLB extras router connectivity"""
        
        response = await client.get("/mlb/test-props/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["success"] is True
        assert data["data"]["status"] == "ok"
        assert "mlb_extras router is reachable" in data["data"]["message"]
    
    
    # ============================================================================
    # Today's Games Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_todays_games_success(self, client):
        """Test getting today's MLB games"""
        
        mock_games = [
            {
                "game_id": "662253",
                "home_team": "NYY",
                "away_team": "BOS", 
                "game_date": "2025-08-14",
                "game_time": "19:05",
                "status": "scheduled",
                "venue": "Yankee Stadium"
            },
            {
                "game_id": "662254", 
                "home_team": "LAD",
                "away_team": "SF",
                "game_date": "2025-08-14", 
                "game_time": "22:10",
                "status": "scheduled",
                "venue": "Dodger Stadium"
            }
        ]
        
        with patch('backend.routes.mlb_extras.get_todays_games', return_value=mock_games):
            
            response = await client.get("/mlb/todays-games")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert len(data["data"]) == 2
            
            first_game = data["data"][0]
            assert first_game["game_id"] == "662253"
            assert first_game["home_team"] == "NYY"
            assert first_game["away_team"] == "BOS"
    
    
    @pytest.mark.asyncio
    async def test_get_todays_games_empty(self, client):
        """Test today's games when no games scheduled"""
        
        with patch('backend.routes.mlb_extras.get_todays_games', return_value=[]):
            
            response = await client.get("/mlb/todays-games")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert len(data["data"]) == 0
    
    
    @pytest.mark.asyncio
    async def test_get_todays_games_service_error(self, client):
        """Test today's games with service error"""
        
        with patch('backend.routes.mlb_extras.get_todays_games', side_effect=Exception("MLB API unavailable")):
            
            response = await client.get("/mlb/todays-games")
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    
    # ============================================================================
    # PrizePicks Props Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_prizepicks_props_success(self, client):
        """Test getting PrizePicks MLB props"""
        
        mock_props = [
            {
                "prop_id": "judge-hr-over-0.5",
                "player": "Aaron Judge",
                "stat": "Home Runs",
                "line": 0.5,
                "pick_type": "over",
                "multiplier": 2.5,
                "confidence": 87.3,
                "expected_value": 15.2,
                "game_id": "662253",
                "sport": "MLB"
            },
            {
                "prop_id": "trout-hits-over-1.5", 
                "player": "Mike Trout",
                "stat": "Hits",
                "line": 1.5,
                "pick_type": "over",
                "multiplier": 3.0,
                "confidence": 78.9,
                "expected_value": 8.7
            }
        ]
        
        with patch('backend.routes.mlb_extras.get_filtered_prizepicks_props', return_value=mock_props):
            
            response = await client.get("/mlb/prizepicks-props/")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert len(data["data"]) == 2
            
            first_prop = data["data"][0]
            assert first_prop["player"] == "Aaron Judge"
            assert first_prop["stat"] == "Home Runs"
            assert first_prop["confidence"] == 87.3
    
    
    @pytest.mark.asyncio
    async def test_get_prizepicks_props_fallback_to_empty(self, client):
        """Test PrizePicks props fallback when all data sources fail"""
        
        # Mock all data sources failing 
        with patch('backend.routes.mlb_extras.get_filtered_prizepicks_props', side_effect=Exception("All sources failed")):
            
            response = await client.get("/mlb/prizepicks-props/")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert len(data["data"]) == 0  # Should return empty array instead of mock data
    
    
    # ============================================================================
    # Comprehensive Props Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_comprehensive_props_success(self, client):
        """Test comprehensive props generation for a specific game"""
        
        mock_comprehensive_props = {
            "game_id": "662253",
            "props": [
                {
                    "prop_id": "comp-judge-hr",
                    "player": "Aaron Judge",
                    "stat": "Home Runs",
                    "line": 0.5,
                    "prediction": 0.72,
                    "confidence": 89.1,
                    "source": "baseball_savant_enhanced",
                    "reasoning": "Strong recent form, favorable matchup vs LHP"
                },
                {
                    "prop_id": "comp-judge-rbi",
                    "player": "Aaron Judge", 
                    "stat": "RBIs",
                    "line": 1.5,
                    "prediction": 0.65,
                    "confidence": 82.7,
                    "source": "ml_ensemble",
                    "reasoning": "High RBI opportunity in projected lineup spot"
                }
            ],
            "summary": {
                "total_props": 125,
                "high_confidence_props": 67,
                "unique_players": 18,
                "data_sources": ["baseball_savant", "mlb_stats_api", "ml_models"]
            }
        }
        
        with patch('backend.services.comprehensive_prop_generator.ComprehensivePropGenerator') as MockGenerator:
            mock_instance = AsyncMock()
            mock_instance.generate_game_props.return_value = mock_comprehensive_props
            MockGenerator.return_value = mock_instance
            
            response = await client.get("/mlb/comprehensive-props/662253?optimize_performance=true")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert data["data"]["game_id"] == "662253"
            assert len(data["data"]["props"]) == 2
            assert data["data"]["summary"]["total_props"] == 125
            
            # Verify optimization was requested
            mock_instance.generate_game_props.assert_called_once_with("662253", optimize_performance=True)
    
    
    @pytest.mark.asyncio 
    async def test_get_comprehensive_props_without_optimization(self, client):
        """Test comprehensive props without performance optimization"""
        
        mock_props = {"game_id": "662253", "props": [], "summary": {"total_props": 50}}
        
        with patch('backend.services.comprehensive_prop_generator.ComprehensivePropGenerator') as MockGenerator:
            mock_instance = AsyncMock()
            mock_instance.generate_game_props.return_value = mock_props
            MockGenerator.return_value = mock_instance
            
            response = await client.get("/mlb/comprehensive-props/662253")
            
            assert response.status_code == status.HTTP_200_OK
            
            # Verify optimization was not requested (default False)
            mock_instance.generate_game_props.assert_called_once_with("662253", optimize_performance=False)
    
    
    @pytest.mark.asyncio
    async def test_get_comprehensive_props_service_error(self, client):
        """Test comprehensive props with service error"""
        
        with patch('backend.services.comprehensive_prop_generator.ComprehensivePropGenerator') as MockGenerator:
            mock_instance = AsyncMock()
            mock_instance.generate_game_props.side_effect = Exception("Comprehensive props service unavailable")
            MockGenerator.return_value = mock_instance
            
            response = await client.get("/mlb/comprehensive-props/662253")
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    
    # ============================================================================
    # Live Game Stats Tests  
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_live_game_stats_success(self, client):
        """Test getting live game statistics"""
        
        mock_live_stats = {
            "game_id": "662253",
            "status": "in_progress",
            "inning": 7,
            "inning_half": "top",
            "home_score": 4,
            "away_score": 2,
            "live_stats": {
                "current_batter": "Aaron Judge",
                "current_pitcher": "Chris Sale",
                "balls": 2,
                "strikes": 1,
                "outs": 1,
                "runners": {
                    "first": "Gleyber Torres",
                    "second": None,
                    "third": None
                }
            },
            "player_stats": {
                "Aaron Judge": {
                    "at_bats": 3,
                    "hits": 2,
                    "home_runs": 1,
                    "rbis": 2
                }
            }
        }
        
        with patch('backend.routes.mlb_extras.get_live_game_data', return_value=mock_live_stats):
            
            response = await client.get("/mlb/live-game-stats/662253")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert data["data"]["game_id"] == "662253"
            assert data["data"]["status"] == "in_progress"
            assert data["data"]["inning"] == 7
            assert "live_stats" in data["data"]
            assert "player_stats" in data["data"]
    
    
    @pytest.mark.asyncio
    async def test_get_live_game_stats_not_found(self, client):
        """Test live game stats for non-existent game"""
        
        with patch('backend.routes.mlb_extras.get_live_game_data', return_value=None):
            
            response = await client.get("/mlb/live-game-stats/invalid-game-id")
            
            assert response.status_code == status.HTTP_404_NOT_FOUND
    
    
    @pytest.mark.asyncio
    async def test_get_live_game_stats_scheduled_game(self, client):
        """Test live game stats for a scheduled (not started) game"""
        
        mock_scheduled_game = {
            "game_id": "662253",
            "status": "scheduled",
            "game_time": "19:05",
            "home_team": "NYY",
            "away_team": "BOS",
            "home_score": None,
            "away_score": None
        }
        
        with patch('backend.routes.mlb_extras.get_live_game_data', return_value=mock_scheduled_game):
            
            response = await client.get("/mlb/live-game-stats/662253")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert data["data"]["status"] == "scheduled"
            assert data["data"]["home_score"] is None
    
    
    # ============================================================================
    # Play-by-Play Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_play_by_play_success(self, client):
        """Test getting game play-by-play data"""
        
        mock_play_by_play = {
            "game_id": "662253",
            "events": [
                {
                    "inning": 1,
                    "inning_half": "top",
                    "description": "Aaron Judge grounds out to shortstop",
                    "timestamp": "2025-08-14T19:15:00Z",
                    "away_score": 0,
                    "home_score": 0
                },
                {
                    "inning": 1,
                    "inning_half": "top", 
                    "description": "Gleyber Torres singles to center field",
                    "timestamp": "2025-08-14T19:18:00Z",
                    "away_score": 0,
                    "home_score": 0
                },
                {
                    "inning": 1,
                    "inning_half": "bottom",
                    "description": "Rafael Devers doubles to left field",
                    "timestamp": "2025-08-14T19:25:00Z",
                    "away_score": 0,
                    "home_score": 0
                }
            ],
            "total_events": 3
        }
        
        with patch('backend.routes.mlb_extras.get_play_by_play_data', return_value=mock_play_by_play):
            
            response = await client.get("/mlb/play-by-play/662253")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert data["data"]["game_id"] == "662253"
            assert len(data["data"]["events"]) == 3
            assert data["data"]["total_events"] == 3
            
            first_event = data["data"]["events"][0]
            assert first_event["inning"] == 1
            assert "Aaron Judge" in first_event["description"]
    
    
    @pytest.mark.asyncio
    async def test_get_play_by_play_empty_events(self, client):
        """Test play-by-play for game with no events yet"""
        
        mock_empty_play_by_play = {
            "game_id": "662253",
            "events": [],
            "total_events": 0
        }
        
        with patch('backend.routes.mlb_extras.get_play_by_play_data', return_value=mock_empty_play_by_play):
            
            response = await client.get("/mlb/play-by-play/662253")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["success"] is True
            assert len(data["data"]["events"]) == 0
            assert data["data"]["total_events"] == 0
    
    
    @pytest.mark.asyncio
    async def test_get_play_by_play_game_not_found(self, client):
        """Test play-by-play for non-existent game"""
        
        with patch('backend.routes.mlb_extras.get_play_by_play_data', return_value=None):
            
            response = await client.get("/mlb/play-by-play/invalid-game-id")
            
            assert response.status_code == status.HTTP_404_NOT_FOUND
    
    
    # ============================================================================
    # Error Handling Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_invalid_game_id_format(self, client):
        """Test endpoints with invalid game ID formats"""
        
        # Test various invalid game ID formats
        invalid_game_ids = ["", "abc", "12.34", "game-id-too-long-to-be-valid"]
        
        for invalid_id in invalid_game_ids:
            response = await client.get(f"/mlb/live-game-stats/{invalid_id}")
            
            # Should handle gracefully (either 400 validation error or 404 not found)
            assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
    
    
    @pytest.mark.asyncio
    async def test_service_timeout_handling(self, client):
        """Test handling of service timeouts"""
        
        import asyncio
        
        with patch('backend.routes.mlb_extras.get_live_game_data', side_effect=asyncio.TimeoutError("Request timed out")):
            
            response = await client.get("/mlb/live-game-stats/662253")
            
            # Should handle timeout gracefully
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    
    # ============================================================================
    # Integration Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_mlb_data_flow_integration(self, client):
        """Test integrated MLB data flow: games -> props -> live stats"""
        
        # Mock game data
        mock_games = [{"game_id": "662253", "home_team": "NYY", "away_team": "BOS"}]
        
        # Mock props for that game
        mock_props = [{"player": "Aaron Judge", "game_id": "662253"}]
        
        # Mock live stats for that game  
        mock_stats = {"game_id": "662253", "status": "in_progress"}
        
        with patch('backend.routes.mlb_extras.get_todays_games', return_value=mock_games):
            with patch('backend.routes.mlb_extras.get_filtered_prizepicks_props', return_value=mock_props):
                with patch('backend.routes.mlb_extras.get_live_game_data', return_value=mock_stats):
                    
                    # 1. Get today's games
                    games_response = await client.get("/mlb/todays-games")
                    assert games_response.status_code == status.HTTP_200_OK
                    games_data = games_response.json()
                    
                    # 2. Get props (general endpoint)
                    props_response = await client.get("/mlb/prizepicks-props/")
                    assert props_response.status_code == status.HTTP_200_OK
                    props_data = props_response.json()
                    
                    # 3. Get live stats for specific game
                    game_id = games_data["data"][0]["game_id"]
                    stats_response = await client.get(f"/mlb/live-game-stats/{game_id}")
                    assert stats_response.status_code == status.HTTP_200_OK
                    stats_data = stats_response.json()
                    
                    # Verify data consistency
                    assert games_data["success"] is True
                    assert props_data["success"] is True  
                    assert stats_data["success"] is True
                    assert stats_data["data"]["game_id"] == game_id
    
    
    # ============================================================================
    # Performance Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_comprehensive_props_performance(self, client, performance_timer):
        """Test comprehensive props generation performance"""
        
        mock_props = {"game_id": "662253", "props": [], "summary": {"total_props": 100}}
        
        with patch('backend.services.comprehensive_prop_generator.ComprehensivePropGenerator') as MockGenerator:
            mock_instance = AsyncMock()
            mock_instance.generate_game_props.return_value = mock_props
            MockGenerator.return_value = mock_instance
            
            performance_timer.start()
            response = await client.get("/mlb/comprehensive-props/662253?optimize_performance=true")
            elapsed = performance_timer.stop()
            
            assert response.status_code == status.HTTP_200_OK
            assert elapsed < 2.0  # Should complete within 2 seconds with optimization
    
    
    @pytest.mark.asyncio
    async def test_multiple_concurrent_requests(self, client):
        """Test handling multiple concurrent MLB requests"""
        
        mock_games = [{"game_id": "662253"}]
        mock_props = [{"player": "Aaron Judge"}]
        
        with patch('backend.routes.mlb_extras.get_todays_games', return_value=mock_games):
            with patch('backend.routes.mlb_extras.get_filtered_prizepicks_props', return_value=mock_props):
                
                # Make concurrent requests
                import asyncio
                tasks = [
                    client.get("/mlb/todays-games"),
                    client.get("/mlb/prizepicks-props/"),
                    client.get("/mlb/test-props/")
                ]
                
                responses = await asyncio.gather(*tasks)
                
                # All requests should succeed
                for response in responses:
                    assert response.status_code == status.HTTP_200_OK
                    data = response.json()
                    assert data["success"] is True
