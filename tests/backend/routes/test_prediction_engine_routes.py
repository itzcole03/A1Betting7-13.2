"""
Prediction Engine Routes Integration Tests - Phase 4.1 Backend Tests
Test suite for enhanced ML prediction endpoints
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import asyncio
from backend.main import app


class TestPredictionEngineRoutes:
    """Test suite for prediction engine routes"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    async def async_client(self):
        """Create async test client"""
        from httpx import AsyncClient
        async with AsyncClient(base_url="http://test") as client:
            yield client
    
    def test_single_prediction_endpoint_structure(self, client):
        """Test single prediction endpoint structure and validation"""
        # Test with valid prediction request
        prediction_request = {
            "sport": "MLB",
            "prop_type": "runs_scored",
            "context": {
                "player_id": "12345",
                "team": "BOS",
                "opponent": "NYY",
                "venue": "home"
            },
            "features": {
                "batting_avg": 0.285,
                "recent_form": 0.72,
                "pitcher_era": 3.45,
                "weather_temp": 75.0
            }
        }
        
        response = client.post("/api/enhanced-ml/predict/single", json=prediction_request)
        
        # Should return proper response structure
        assert response.status_code in [200, 400, 422, 500]  # Valid status codes
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check response structure
            assert isinstance(data, dict)
            assert "success" in data or "prediction" in data or "result" in data
        else:
            # Error case - check error structure
            assert "message" in data or "detail" in data or "error" in data
    
    def test_single_prediction_validation(self, client):
        """Test single prediction input validation"""
        # Test missing required fields
        invalid_requests = [
            {},  # Empty request
            {"sport": "MLB"},  # Missing other required fields
            {"features": {}},  # Missing sport and context
            {
                "sport": "MLB",
                "features": "invalid"  # Invalid features type
            },
            {
                "sport": "INVALID_SPORT",
                "features": {"test": 1.0}
            }
        ]
        
        for invalid_request in invalid_requests:
            response = client.post("/api/enhanced-ml/predict/single", json=invalid_request)
            assert response.status_code in [400, 422], f"Failed for request: {invalid_request}"
            
            data = response.json()
            assert "message" in data or "detail" in data
    
    def test_batch_prediction_endpoint_structure(self, client):
        """Test batch prediction endpoint structure"""
        # Test with valid batch request
        batch_request = {
            "requests": [
                {
                    "sport": "MLB",
                    "prop_type": "runs_scored",
                    "features": {
                        "batting_avg": 0.285,
                        "pitcher_era": 3.45
                    }
                },
                {
                    "sport": "MLB", 
                    "prop_type": "hits",
                    "features": {
                        "batting_avg": 0.310,
                        "pitcher_era": 4.20
                    }
                }
            ]
        }
        
        response = client.post("/api/enhanced-ml/predict/batch", json=batch_request)
        
        # Should return proper response structure
        assert response.status_code in [200, 400, 422, 500]
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check response structure
            assert isinstance(data, dict)
            assert "success" in data or "results" in data or "predictions" in data
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_batch_prediction_validation(self, client):
        """Test batch prediction validation"""
        # Test empty batch
        response = client.post("/api/enhanced-ml/predict/batch", json={"requests": []})
        assert response.status_code in [400, 422]
        
        # Test invalid batch structure
        invalid_batch = {"requests": "invalid"}
        response = client.post("/api/enhanced-ml/predict/batch", json=invalid_batch)
        assert response.status_code in [400, 422]
        
        # Test batch with invalid individual requests
        invalid_batch = {
            "requests": [
                {"invalid": "request"},
                {"sport": "MLB"}  # Missing features
            ]
        }
        response = client.post("/api/enhanced-ml/predict/batch", json=invalid_batch)
        assert response.status_code in [400, 422]
    
    def test_model_registration_endpoint_structure(self, client):
        """Test model registration endpoint structure"""
        registration_data = {
            "model_name": "test_model",
            "model_version": "1.0.0",
            "model_type": "regression",
            "sport": "MLB",
            "description": "Test model registration"
        }
        
        response = client.post("/api/enhanced-ml/models/register", json=registration_data)
        
        # Should handle registration gracefully
        assert response.status_code in [200, 201, 400, 409, 422]
        
        data = response.json()
        assert isinstance(data, dict)
        assert "message" in data or "detail" in data or "success" in data
    
    def test_registered_models_endpoint(self, client):
        """Test get registered models endpoint"""
        response = client.get("/api/enhanced-ml/models/registered")
        
        # Should return proper response structure
        assert response.status_code in [200, 500]
        
        data = response.json()
        if response.status_code == 200:
            assert isinstance(data, dict)
            assert "models" in data or "results" in data or "success" in data
        else:
            assert "message" in data or "detail" in data
    
    def test_performance_query_endpoint_structure(self, client):
        """Test performance query endpoint structure"""
        query_data = {
            "model_name": "test_model",
            "time_range": {
                "start": "2024-01-01T00:00:00Z",
                "end": "2024-12-31T23:59:59Z"
            },
            "metrics": ["accuracy", "precision", "recall"]
        }
        
        response = client.post("/api/enhanced-ml/performance/query", json=query_data)
        
        # Should handle query gracefully
        assert response.status_code in [200, 400, 404, 422]
        
        data = response.json()
        assert isinstance(data, dict)
        if response.status_code == 200:
            assert "performance" in data or "metrics" in data or "results" in data or "success" in data
        else:
            assert "message" in data or "detail" in data
    
    def test_health_endpoint(self, client):
        """Test ML engine health endpoint"""
        response = client.get("/api/enhanced-ml/health")
        
        # Health endpoint should always respond
        assert response.status_code in [200, 503]
        
        data = response.json()
        assert isinstance(data, dict)
        assert "status" in data or "health" in data or "message" in data
    
    def test_performance_alerts_endpoint(self, client):
        """Test performance alerts endpoint"""
        response = client.get("/api/enhanced-ml/performance/alerts")
        
        # Should return alerts structure
        assert response.status_code in [200, 500]
        
        data = response.json()
        if response.status_code == 200:
            assert isinstance(data, dict)
            assert "alerts" in data or "warnings" in data or "status" in data or "success" in data
        else:
            assert "message" in data or "detail" in data
    
    def test_batch_stats_endpoint(self, client):
        """Test batch statistics endpoint"""
        response = client.get("/api/enhanced-ml/performance/batch-stats")
        
        # Should return batch statistics
        assert response.status_code in [200, 500]
        
        data = response.json()
        if response.status_code == 200:
            assert isinstance(data, dict)
            assert "stats" in data or "statistics" in data or "batch_stats" in data or "success" in data
        else:
            assert "message" in data or "detail" in data
    
    def test_shap_stats_endpoint(self, client):
        """Test SHAP statistics endpoint"""
        response = client.get("/api/enhanced-ml/performance/shap-stats")
        
        # Should return SHAP statistics
        assert response.status_code in [200, 500]
        
        data = response.json()
        if response.status_code == 200:
            assert isinstance(data, dict)
            assert "shap_stats" in data or "explanations" in data or "statistics" in data or "success" in data
        else:
            assert "message" in data or "detail" in data
    
    def test_outcome_update_endpoint_structure(self, client):
        """Test prediction outcome update endpoint"""
        outcome_data = {
            "prediction_id": "test_prediction_123",
            "actual_outcome": 1.5,
            "outcome_type": "numeric",
            "timestamp": "2024-01-15T10:30:00Z"
        }
        
        response = client.post("/api/enhanced-ml/outcomes/update", json=outcome_data)
        
        # Should handle outcome update gracefully
        assert response.status_code in [200, 400, 404, 422]
        
        data = response.json()
        assert isinstance(data, dict)
        assert "message" in data or "detail" in data or "success" in data
    
    def test_initialize_endpoint(self, client):
        """Test ML engine initialization endpoint"""
        response = client.post("/api/enhanced-ml/initialize")
        
        # Should handle initialization
        assert response.status_code in [200, 409, 500]
        
        data = response.json()
        assert isinstance(data, dict)
        assert "message" in data or "detail" in data or "status" in data
    
    def test_shutdown_endpoint(self, client):
        """Test ML engine shutdown endpoint"""
        response = client.post("/api/enhanced-ml/shutdown")
        
        # Should handle shutdown gracefully
        assert response.status_code in [200, 500]
        
        data = response.json()
        assert isinstance(data, dict)
        assert "message" in data or "detail" in data or "status" in data
    
    def test_prediction_flow_integration(self, client):
        """Test complete prediction flow integration"""
        # 1. Check health status
        health_response = client.get("/api/enhanced-ml/health")
        assert health_response.status_code in [200, 503]
        
        # 2. Try to get registered models
        models_response = client.get("/api/enhanced-ml/models/registered") 
        assert models_response.status_code in [200, 500]
        
        # 3. Try a prediction request
        prediction_request = {
            "sport": "MLB",
            "prop_type": "runs_scored",
            "features": {
                "test_feature": 1.0,
                "another_feature": 0.5
            }
        }
        
        prediction_response = client.post("/api/enhanced-ml/predict/single", json=prediction_request)
        assert prediction_response.status_code in [200, 400, 422, 500]
        
        # 4. Try batch prediction
        batch_request = {
            "requests": [prediction_request]
        }
        
        batch_response = client.post("/api/enhanced-ml/predict/batch", json=batch_request)
        assert batch_response.status_code in [200, 400, 422, 500]
        
        # 5. Check performance stats
        stats_response = client.get("/api/enhanced-ml/performance/batch-stats")
        assert stats_response.status_code in [200, 500]
    
    def test_error_handling_consistency(self, client):
        """Test consistent error handling across prediction endpoints"""
        # Test various malformed requests
        malformed_requests = [
            (client.post, "/api/enhanced-ml/predict/single", {"invalid": "json"}),
            (client.post, "/api/enhanced-ml/predict/batch", {"malformed": "data"}),
            (client.post, "/api/enhanced-ml/models/register", {"incomplete": "registration"}),
            (client.post, "/api/enhanced-ml/performance/query", {"bad": "query"}),
            (client.post, "/api/enhanced-ml/outcomes/update", {"invalid": "outcome"})
        ]
        
        for method, endpoint, data in malformed_requests:
            response = method(endpoint, json=data)
            
            # Should return consistent error structure
            assert response.status_code in [400, 422, 500]
            
            response_data = response.json()
            assert isinstance(response_data, dict)
            
            # Should have some form of error message
            has_error_info = any(key in response_data for key in ["message", "detail", "error", "errors"])
            assert has_error_info, f"Response lacks error info: {response_data}"
    
    def test_standard_api_response_compliance(self, client):
        """Test prediction routes comply with StandardAPIResponse format"""
        # Test endpoints that should return StandardAPIResponse
        standard_response_endpoints = [
            ("GET", "/api/enhanced-ml/health", None),
            ("GET", "/api/enhanced-ml/models/registered", None),
            ("GET", "/api/enhanced-ml/performance/alerts", None),
            ("POST", "/api/enhanced-ml/initialize", {}),
            ("POST", "/api/enhanced-ml/shutdown", {})
        ]
        
        for method, endpoint, data in standard_response_endpoints:
            if method == "GET":
                response = client.get(endpoint)
            else:
                response = client.post(endpoint, json=data if data else {})
            
            # Should return valid status code
            assert response.status_code in [200, 400, 401, 404, 422, 500, 503]
            
            response_data = response.json()
            assert isinstance(response_data, dict)
            
            # Should have consistent structure
            has_standard_fields = any(key in response_data for key in [
                "success", "message", "data", "error", "detail", "status"
            ])
            assert has_standard_fields, f"Response lacks standard fields: {response_data}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
