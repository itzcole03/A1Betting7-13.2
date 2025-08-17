"""
Streaming API Integration Tests

Integration tests for the streaming API endpoints to verify 
end-to-end functionality.
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any
from unittest.mock import Mock, AsyncMock, patch

# FastAPI testing
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import the streaming API router
from backend.routes.streaming.streaming_api import router as streaming_router


# ============================================================================
# INTEGRATION TEST FIXTURES
# ============================================================================

@pytest.fixture
def app():
    """Create FastAPI app with streaming routes for testing"""
    app = FastAPI(title="Streaming Test API")
    app.include_router(streaming_router)
    return app


@pytest.fixture
def client(app):
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def mock_services():
    """Mock all streaming services for consistent testing"""
    
    # Mock provider registry
    mock_registry = Mock()
    mock_registry.get_all_provider_status.return_value = {
        "test_provider_1": {"status": "active", "last_check": datetime.utcnow()},
        "test_provider_2": {"status": "inactive", "last_check": datetime.utcnow()}
    }
    mock_registry.get_provider.return_value = Mock(
        provider_name="test_provider",
        supports_incremental=True,
        health_check=AsyncMock(return_value=True)
    )
    mock_registry.get_registry_stats.return_value = {
        "total_providers": 2,
        "active_providers": 1,
        "health_check_failures": 0
    }
    
    # Mock market streamer
    mock_streamer = Mock()
    mock_streamer.get_status.return_value = {
        "is_running": True,
        "active_providers": ["test_provider_1"],
        "total_events": 1500,
        "last_cycle_time": datetime.utcnow().isoformat(),
        "events_per_second": 25.3
    }
    mock_streamer.start = AsyncMock()
    mock_streamer.stop = AsyncMock()
    
    # Mock rationale service
    mock_rationale_service = Mock()
    mock_rationale_service.get_status.return_value = {
        "is_available": True,
        "cache_size": 50,
        "rate_limit_remaining": 100,
        "total_requests": 75,
        "cache_hits": 15
    }
    mock_rationale_service.generate_rationale = AsyncMock(return_value=Mock(
        id=12345,
        request_id="test_123",
        narrative="This is a test portfolio analysis narrative.",
        key_points=["Strong performance", "Diversified holdings", "Low risk exposure"],
        confidence=0.87,
        generation_time_ms=450,
        model_info={"model": "gpt-4", "version": "2024-01"},
        timestamp=datetime.utcnow()
    ))
    
    return {
        "provider_registry": mock_registry,
        "market_streamer": mock_streamer,
        "rationale_service": mock_rationale_service
    }


# ============================================================================
# API ENDPOINT INTEGRATION TESTS
# ============================================================================

class TestProviderEndpoints:
    """Test provider management endpoints"""
    
    def test_list_providers(self, client, mock_services):
        """Test GET /streaming/providers"""
        with patch('backend.routes.streaming.streaming_api.provider_registry', mock_services["provider_registry"]):
            response = client.get("/streaming/providers")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] == True
            assert "data" in data
            assert "providers" in data["data"]
            assert "total_count" in data["data"]
            assert "registry_stats" in data["data"]
    
    def test_get_specific_provider(self, client, mock_services):
        """Test GET /streaming/providers/{provider_name}"""
        with patch('backend.routes.streaming.streaming_api.provider_registry', mock_services["provider_registry"]):
            response = client.get("/streaming/providers/test_provider")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] == True
            assert "data" in data
            assert data["data"]["provider_name"] == "test_provider"
    
    def test_get_nonexistent_provider(self, client, mock_services):
        """Test GET /streaming/providers/{provider_name} for non-existent provider"""
        mock_services["provider_registry"].get_provider.return_value = None
        
        with patch('backend.routes.streaming.streaming_api.provider_registry', mock_services["provider_registry"]):
            response = client.get("/streaming/providers/nonexistent")
            
            assert response.status_code == 404


class TestStreamingControlEndpoints:
    """Test streaming control endpoints"""
    
    def test_start_streaming(self, client, mock_services):
        """Test POST /streaming/control with start action"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_services["market_streamer"]):
            response = client.post(
                "/streaming/control",
                json={"action": "start", "providers": ["test_provider"]}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] == True
            assert "Streaming started" in data["message"]
            mock_services["market_streamer"].start.assert_called_once()
    
    def test_stop_streaming(self, client, mock_services):
        """Test POST /streaming/control with stop action"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_services["market_streamer"]):
            response = client.post(
                "/streaming/control",
                json={"action": "stop"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] == True
            assert "Streaming stopped" in data["message"]
            mock_services["market_streamer"].stop.assert_called_once()
    
    def test_invalid_action(self, client, mock_services):
        """Test POST /streaming/control with invalid action"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_services["market_streamer"]):
            response = client.post(
                "/streaming/control",
                json={"action": "invalid_action"}
            )
            
            assert response.status_code == 400


class TestSystemStatusEndpoints:
    """Test system status and health endpoints"""
    
    def test_get_system_status(self, client, mock_services):
        """Test GET /streaming/status"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_services["market_streamer"]):
            with patch('backend.routes.streaming.streaming_api.provider_registry', mock_services["provider_registry"]):
                with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_services["rationale_service"]):
                    response = client.get("/streaming/status")
                    
                    assert response.status_code == 200
                    data = response.json()
                    
                    assert data["success"] == True
                    assert "streaming" in data["data"]
                    assert "providers" in data["data"]
                    assert "rationale_service" in data["data"]
                    
                    # Verify streaming status fields
                    streaming_status = data["data"]["streaming"]
                    assert "is_running" in streaming_status
                    assert "active_providers" in streaming_status
                    assert "total_events" in streaming_status
                    assert "events_per_second" in streaming_status
    
    def test_health_check(self, client, mock_services):
        """Test GET /streaming/health"""
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_services["market_streamer"]):
            with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_services["rationale_service"]):
                response = client.get("/streaming/health")
                
                assert response.status_code == 200
                data = response.json()
                
                assert "healthy" in data
                assert "components" in data
                assert "timestamp" in data
                
                # Verify component health status
                components = data["components"]
                assert "streamer" in components
                assert "rationale_service" in components


class TestRationaleEndpoints:
    """Test portfolio rationale endpoints"""
    
    def test_generate_rationale(self, client, mock_services):
        """Test POST /streaming/rationale/generate"""
        with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_services["rationale_service"]):
            request_data = {
                "rationale_type": "portfolio_summary",
                "portfolio_data": {
                    "total_value": 50000,
                    "positions": 8,
                    "performance": "positive"
                },
                "context_data": {
                    "market_conditions": "bullish",
                    "sector_focus": "technology"
                },
                "user_preferences": {
                    "risk_tolerance": "moderate",
                    "investment_horizon": "long_term"
                }
            }
            
            response = client.post("/streaming/rationale/generate", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] == True
            assert "Portfolio rationale generated" in data["message"]
            mock_services["rationale_service"].generate_rationale.assert_called_once()
    
    def test_generate_rationale_invalid_type(self, client, mock_services):
        """Test POST /streaming/rationale/generate with invalid rationale type"""
        request_data = {
            "rationale_type": "invalid_type",
            "portfolio_data": {"test": "data"}
        }
        
        response = client.post("/streaming/rationale/generate", json=request_data)
        
        assert response.status_code == 400
        assert "Invalid rationale type" in response.json()["detail"]


# ============================================================================
# END-TO-END WORKFLOW TESTS
# ============================================================================

class TestStreamingWorkflow:
    """Test complete streaming workflow scenarios"""
    
    def test_provider_lifecycle_workflow(self, client, mock_services):
        """Test complete provider lifecycle: list -> get -> update -> health check"""
        
        with patch('backend.routes.streaming.streaming_api.provider_registry', mock_services["provider_registry"]):
            # 1. List all providers
            list_response = client.get("/streaming/providers")
            assert list_response.status_code == 200
            providers_data = list_response.json()["data"]
            assert len(providers_data["providers"]) >= 1
            
            # 2. Get specific provider details
            provider_name = "test_provider"
            detail_response = client.get(f"/streaming/providers/{provider_name}")
            assert detail_response.status_code == 200
            provider_details = detail_response.json()["data"]
            assert provider_details["provider_name"] == provider_name
            
            # 3. Check system status (includes provider health)
            with patch('backend.routes.streaming.streaming_api.market_streamer', mock_services["market_streamer"]):
                with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_services["rationale_service"]):
                    status_response = client.get("/streaming/status")
                    assert status_response.status_code == 200
                    status_data = status_response.json()["data"]
                    assert "providers" in status_data
                    assert status_data["providers"]["total_providers"] > 0
    
    def test_streaming_control_workflow(self, client, mock_services):
        """Test streaming control workflow: start -> status -> stop"""
        
        with patch('backend.routes.streaming.streaming_api.market_streamer', mock_services["market_streamer"]):
            with patch('backend.routes.streaming.streaming_api.provider_registry', mock_services["provider_registry"]):
                with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_services["rationale_service"]):
                    
                    # 1. Start streaming
                    start_response = client.post(
                        "/streaming/control",
                        json={"action": "start"}
                    )
                    assert start_response.status_code == 200
                    assert "started" in start_response.json()["message"].lower()
                    
                    # 2. Check status after starting
                    status_response = client.get("/streaming/status")
                    assert status_response.status_code == 200
                    status_data = status_response.json()["data"]
                    assert status_data["streaming"]["is_running"] == True
                    
                    # 3. Stop streaming
                    stop_response = client.post(
                        "/streaming/control",
                        json={"action": "stop"}
                    )
                    assert stop_response.status_code == 200
                    assert "stopped" in stop_response.json()["message"].lower()
    
    def test_rationale_generation_workflow(self, client, mock_services):
        """Test rationale generation workflow: generate -> verify response"""
        
        with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_services["rationale_service"]):
            # Generate rationale
            request_data = {
                "rationale_type": "portfolio_summary",
                "portfolio_data": {
                    "total_value": 75000,
                    "positions": 12,
                    "top_holdings": ["AAPL", "GOOGL", "TSLA"]
                }
            }
            
            response = client.post("/streaming/rationale/generate", json=request_data)
            assert response.status_code == 200
            
            data = response.json()
            assert data["success"] == True
            assert "data" in data
            
            # Verify the rationale service was called correctly
            mock_services["rationale_service"].generate_rationale.assert_called_once()
            call_args = mock_services["rationale_service"].generate_rationale.call_args[0][0]
            assert call_args.portfolio_data["total_value"] == 75000


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================

class TestErrorHandling:
    """Test API error handling scenarios"""
    
    def test_provider_registry_error(self, client):
        """Test handling of provider registry errors"""
        with patch('backend.routes.streaming.streaming_api.provider_registry') as mock_registry:
            mock_registry.get_all_provider_status.side_effect = Exception("Registry error")
            
            response = client.get("/streaming/providers")
            assert response.status_code == 500
    
    def test_streaming_service_error(self, client):
        """Test handling of streaming service errors"""
        with patch('backend.routes.streaming.streaming_api.market_streamer') as mock_streamer:
            mock_streamer.start.side_effect = Exception("Streamer error")
            
            response = client.post("/streaming/control", json={"action": "start"})
            assert response.status_code == 500
    
    def test_rationale_service_error(self, client):
        """Test handling of rationale service errors"""
        with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service') as mock_service:
            mock_service.generate_rationale.side_effect = Exception("Rationale error")
            
            request_data = {
                "rationale_type": "portfolio_summary",
                "portfolio_data": {"test": "data"}
            }
            
            response = client.post("/streaming/rationale/generate", json=request_data)
            assert response.status_code == 500


# ============================================================================
# TEST RUNNER
# ============================================================================

if __name__ == "__main__":
    # Run integration tests
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "-m", "not performance",
        "--cov=backend.routes.streaming",
        "--cov-report=term-missing"
    ])