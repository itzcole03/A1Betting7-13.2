"""
Test CLV Response Consistency

Tests to ensure response schemas remain consistent across CLV enabled/disabled scenarios.
Regression tests for response envelope consistency and field exclusion.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.simple_propfinder_service import (
    PropOpportunity, Sport, Market, Pick, Venue, Trend, MatchupHistory, 
    LineMovement, Direction, SharpMoney
)
from datetime import datetime


@pytest.fixture
def mock_opportunities():
    """Create mock PropOpportunity objects for testing"""
    return [
        PropOpportunity(
            id="test-1",
            player="Test Player 1",
            playerImage=None,
            team="Team A",
            teamLogo=None,
            opponent="Team B",
            opponentLogo=None,
            sport=Sport.NBA,
            market=Market.POINTS,
            line=25.5,
            pick=Pick.OVER,
            odds=-110,
            impliedProbability=0.52,
            aiProbability=0.55,
            edge=5.2,
            confidence=85.0,
            projectedValue=1.0,
            volume=100,
            trend=Trend.RISING,
            trendStrength=3,
            timeToGame="2 hours",
            venue=Venue.HOME,
            weather=None,
            injuries=[],
            recentForm=[0.75, 0.80, 0.65],
            matchupHistory=MatchupHistory(games=5, average=0.6, hitRate=0.6),
            lineMovement=LineMovement(open=25.5, current=25.5, direction=Direction.NONE),
            bookmakers=[],
            isBookmarked=False,
            tags=["high-confidence"],
            socialSentiment=75,
            sharpMoney=SharpMoney.HEAVY,
            lastUpdated=datetime.now(),
            alertTriggered=True,
            alertSeverity=None,
            bestBookmaker="FanDuel",
            lineSpread=0.5,
            oddsSpread=15,
            numBookmakers=3,
            # CLV fields initially None
            clvPercent=None,
            clv_metrics=None
        ),
        PropOpportunity(
            id="test-2", 
            player="Test Player 2",
            playerImage=None,
            team="Team C",
            teamLogo=None,
            opponent="Team D",
            opponentLogo=None,
            sport=Sport.NBA,
            market=Market.REBOUNDS,
            line=8.5,
            pick=Pick.UNDER,
            odds=105,
            impliedProbability=0.48,
            aiProbability=0.45,
            edge=3.1,
            confidence=72.0,
            projectedValue=0.8,
            volume=80,
            trend=Trend.FALLING,
            trendStrength=2,
            timeToGame="3 hours",
            venue=Venue.AWAY,
            weather="Clear",
            injuries=[],
            recentForm=[0.65, 0.70, 0.60],
            matchupHistory=MatchupHistory(games=5, average=0.5, hitRate=0.5),
            lineMovement=LineMovement(open=8.5, current=8.5, direction=Direction.NONE),
            bookmakers=[],
            isBookmarked=False,
            tags=["moderate-confidence"],
            socialSentiment=65,
            sharpMoney=SharpMoney.MODERATE,
            lastUpdated=datetime.now(),
            alertTriggered=False,
            alertSeverity=None,
            bestBookmaker="DraftKings",
            lineSpread=0.0,
            oddsSpread=10,
            numBookmakers=4,
            # CLV fields initially None
            clvPercent=None,
            clv_metrics=None
        )
    ]


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def mock_clv_disabled_config():
    """Mock CLV disabled configuration"""
    mock_config = MagicMock()
    mock_config.performance.enable_clv_metrics = False
    return mock_config


@pytest.fixture
def mock_clv_enabled_config():
    """Mock CLV enabled configuration"""
    mock_config = MagicMock()
    mock_config.performance.enable_clv_metrics = True
    return mock_config


class TestCLVResponseConsistency:
    """Test response consistency across CLV scenarios"""

    @patch('backend.routes.propfinder_routes.get_simple_propfinder_service')
    @patch('backend.routes.propfinder_routes.get_bookmark_service')
    @patch('backend.services.unified_config.unified_config.get_config')
    def test_clv_disabled_response_schema_consistency(
        self, 
        mock_config, 
        mock_bookmark_service,
        mock_propfinder_service, 
        client, 
        mock_opportunities,
        mock_clv_disabled_config
    ):
        """Test that CLV disabled responses have consistent top-level schema with no CLV fields"""
        # Setup mocks
        mock_config.return_value = mock_clv_disabled_config
        mock_service = MagicMock()
        mock_service._initialize_services = AsyncMock(return_value=None)
        mock_service.get_prop_opportunities = AsyncMock(return_value=mock_opportunities)
        mock_propfinder_service.return_value = mock_service
        
        mock_bookmark = MagicMock()
        mock_bookmark.get_user_bookmarked_prop_ids = AsyncMock(return_value=set())
        mock_bookmark_service.return_value = mock_bookmark

        # Make request with CLV enabled but feature flag disabled
        response = client.get("/api/propfinder/opportunities?include_clv=true")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level response structure consistency
        assert "data" in data
        assert "message" in data
        assert "status" in data
        assert data["status"] == "success"
        
        # Check data payload structure
        response_data = data["data"]
        assert "opportunities" in response_data
        assert "total" in response_data
        assert "filtered" in response_data
        assert "summary" in response_data
        
        # Verify NO CLV fields in opportunities
        for opp in response_data["opportunities"]:
            assert "clvPercent" not in opp, f"CLV field found in disabled response: {opp.keys()}"
            assert "closingLine" not in opp, f"CLV field found in disabled response: {opp.keys()}"
            assert "closingOdds" not in opp, f"CLV field found in disabled response: {opp.keys()}"
            assert "clv_metrics" not in opp, f"CLV field found in disabled response: {opp.keys()}"
            
            # Verify expected fields ARE present
            assert "id" in opp
            assert "player" in opp
            assert "confidence" in opp
            assert "edge" in opp

    @patch('backend.routes.propfinder_routes.get_simple_propfinder_service')
    @patch('backend.routes.propfinder_routes.get_bookmark_service')
    @patch('backend.services.unified_config.unified_config.get_config')
    @patch('backend.services.clv_computation.compute_clv_batch')
    def test_clv_enabled_success_response_schema_consistency(
        self, 
        mock_compute_clv,
        mock_config, 
        mock_bookmark_service,
        mock_propfinder_service, 
        client, 
        mock_opportunities,
        mock_clv_enabled_config
    ):
        """Test that CLV enabled + success responses have consistent schema with CLV fields"""
        # Setup mocks
        mock_config.return_value = mock_clv_enabled_config
        
        # Mock CLV computation success - add CLV fields to opportunities
        enriched_opportunities = []
        for opp in mock_opportunities:
            # Create a copy with CLV fields populated
            enriched_opp = PropOpportunity(
                id=opp.id,
                player=opp.player,
                playerImage=opp.playerImage,
                team=opp.team,
                teamLogo=opp.teamLogo,
                opponent=opp.opponent,
                opponentLogo=opp.opponentLogo,
                sport=opp.sport,
                market=opp.market,
                line=opp.line,
                pick=opp.pick,
                odds=opp.odds,
                impliedProbability=opp.impliedProbability,
                aiProbability=opp.aiProbability,
                edge=opp.edge,
                confidence=opp.confidence,
                projectedValue=opp.projectedValue,
                volume=opp.volume,
                trend=opp.trend,
                trendStrength=opp.trendStrength,
                timeToGame=opp.timeToGame,
                venue=opp.venue,
                weather=opp.weather,
                injuries=opp.injuries,
                recentForm=opp.recentForm,
                matchupHistory=opp.matchupHistory,
                lineMovement=opp.lineMovement,
                bookmakers=opp.bookmakers,
                isBookmarked=opp.isBookmarked,
                tags=opp.tags,
                socialSentiment=opp.socialSentiment,
                sharpMoney=opp.sharpMoney,
                lastUpdated=opp.lastUpdated,
                alertTriggered=opp.alertTriggered,
                alertSeverity=opp.alertSeverity,
                bestBookmaker=opp.bestBookmaker,
                lineSpread=opp.lineSpread,
                oddsSpread=opp.oddsSpread,
                numBookmakers=opp.numBookmakers,
                # CLV fields populated with test values
                clvPercent=2.5,
                clv_metrics={
                    "clv_percent": 2.5,
                    "clv_strength": "strong", 
                    "closing_line_value": 1.8
                }
            )
            enriched_opportunities.append(enriched_opp)
        
        mock_compute_clv.return_value = enriched_opportunities
        
        mock_service = MagicMock()
        mock_service._initialize_services = AsyncMock(return_value=None)
        mock_service.get_prop_opportunities = AsyncMock(return_value=mock_opportunities)
        mock_propfinder_service.return_value = mock_service
        
        mock_bookmark = MagicMock()
        mock_bookmark.get_user_bookmarked_prop_ids = AsyncMock(return_value=set())
        mock_bookmark_service.return_value = mock_bookmark

        # Make request with CLV enabled and feature flag enabled
        response = client.get("/api/propfinder/opportunities?include_clv=true")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level response structure consistency
        assert "data" in data
        assert "message" in data
        assert "status" in data
        assert data["status"] == "success"
        
        # Check data payload structure
        response_data = data["data"]
        assert "opportunities" in response_data
        assert "total" in response_data
        assert "filtered" in response_data
        assert "summary" in response_data
        
        # Verify CLV fields ARE present and have non-null values
        for opp in response_data["opportunities"]:
            assert "clvPercent" in opp, f"CLV field missing in enabled response: {opp.keys()}"
            assert "closingLine" in opp, f"CLV field missing in enabled response: {opp.keys()}"
            assert "closingOdds" in opp, f"CLV field missing in enabled response: {opp.keys()}"
            assert "clv_metrics" in opp, f"CLV field missing in enabled response: {opp.keys()}"
            
            # Verify CLV fields have actual values (not None)
            assert opp["clvPercent"] is not None
            assert opp["clv_metrics"] is not None
            
            # Verify expected base fields are still present
            assert "id" in opp
            assert "player" in opp
            assert "confidence" in opp
            assert "edge" in opp

    @patch('backend.routes.propfinder_routes.get_simple_propfinder_service')
    @patch('backend.routes.propfinder_routes.get_bookmark_service')
    @patch('backend.services.unified_config.unified_config.get_config')
    @patch('backend.services.clv_computation.compute_clv_batch')
    def test_clv_enabled_failure_response_schema_consistency(
        self, 
        mock_compute_clv,
        mock_config, 
        mock_bookmark_service,
        mock_propfinder_service, 
        client, 
        mock_opportunities,
        mock_clv_enabled_config
    ):
        """Test that CLV enabled + computation failure responses exclude CLV fields properly"""
        # Setup mocks
        mock_config.return_value = mock_clv_enabled_config
        
        # Mock CLV computation failure
        mock_compute_clv.side_effect = Exception("CLV computation failed")
        
        mock_service = MagicMock()
        mock_service._initialize_services = AsyncMock(return_value=None)
        mock_service.get_prop_opportunities = AsyncMock(return_value=mock_opportunities)
        mock_propfinder_service.return_value = mock_service
        
        mock_bookmark = MagicMock()
        mock_bookmark.get_user_bookmarked_prop_ids = AsyncMock(return_value=set())
        mock_bookmark_service.return_value = mock_bookmark

        # Make request with CLV enabled but computation fails
        response = client.get("/api/propfinder/opportunities?include_clv=true")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level response structure consistency
        assert "data" in data
        assert "message" in data
        assert "status" in data
        assert data["status"] == "success"
        
        # Check data payload structure
        response_data = data["data"]
        assert "opportunities" in response_data
        assert "total" in response_data
        assert "filtered" in response_data
        assert "summary" in response_data
        
        # Verify NO CLV fields in opportunities (failure should exclude them)
        for opp in response_data["opportunities"]:
            assert "clvPercent" not in opp, f"CLV field found in failure response: {opp.keys()}"
            assert "closingLine" not in opp, f"CLV field found in failure response: {opp.keys()}"
            assert "closingOdds" not in opp, f"CLV field found in failure response: {opp.keys()}"
            assert "clv_metrics" not in opp, f"CLV field found in failure response: {opp.keys()}"
            
            # Verify expected base fields are still present
            assert "id" in opp
            assert "player" in opp
            assert "confidence" in opp
            assert "edge" in opp

    def test_response_envelope_structure_consistency(self, client):
        """Test that all responses maintain consistent envelope structure"""
        # This test ensures that regardless of CLV state, the response envelope is consistent
        
        # Test with minimal request (no CLV)
        response = client.get("/api/propfinder/opportunities")
        assert response.status_code == 200
        data = response.json()
        
        # Verify standard envelope structure
        assert isinstance(data, dict)
        assert "data" in data
        assert "message" in data
        assert "status" in data
        assert data["status"] in ["success", "error"]
        
        # Test data structure
        if data["status"] == "success":
            response_data = data["data"]
            assert isinstance(response_data, dict)
            assert "opportunities" in response_data
            assert "total" in response_data
            assert "filtered" in response_data
            assert "summary" in response_data
            
            # Verify opportunities is a list
            assert isinstance(response_data["opportunities"], list)
            
            # Verify numeric fields
            assert isinstance(response_data["total"], int)
            assert isinstance(response_data["filtered"], int)
            assert isinstance(response_data["summary"], dict)