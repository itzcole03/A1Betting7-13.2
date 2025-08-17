"""
Test LLM API Endpoints

Tests the REST API endpoints for explanation requests.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
import asyncio

from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def mock_explanation_service():
    """Mock explanation service for testing"""
    service = Mock()
    service.generate_or_get_edge_explanation = AsyncMock()
    service.prefetch_explanations = AsyncMock()
    service.get_health_status = Mock()
    return service


class TestLLMAPIEndpoints:
    """Test LLM explanation API endpoints"""
    
    def test_generate_explanation_success(self, client):
        """Test successful explanation generation"""
        edge_id = 123
        model_version_id = 1
        
        # Mock the explanation service
        mock_result = {
            "explanation": "This is a strong OVER bet because...",
            "provider": "openai",
            "tokens_used": 150,
            "from_cache": False,
            "confidence": 0.85,
            "reasoning_steps": ["Step 1", "Step 2"]
        }
        
        with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
            mock_service.generate_or_get_edge_explanation.return_value = mock_result
            
            response = client.post(f"/api/edges/{edge_id}/explanation", json={
                "model_version_id": model_version_id
            })
            
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["edge_id"] == edge_id
        assert data["explanation"]["content"] == "This is a strong OVER bet because..."
        assert data["explanation"]["provider"] == "openai"
        assert data["explanation"]["tokens_used"] == 150
        assert data["explanation"]["from_cache"] is False
        
    def test_generate_explanation_missing_model_version(self, client):
        """Test explanation generation with missing model version"""
        edge_id = 123
        
        response = client.post(f"/api/edges/{edge_id}/explanation", json={})
        
        assert response.status_code == 422  # Validation error
        
    def test_generate_explanation_service_error(self, client):
        """Test explanation generation with service error"""
        edge_id = 123
        model_version_id = 1
        
        with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
            mock_service.generate_or_get_edge_explanation.side_effect = Exception("Service unavailable")
            
            response = client.post(f"/api/edges/{edge_id}/explanation", json={
                "model_version_id": model_version_id
            })
            
        assert response.status_code == 500
        data = response.json()
        assert data["success"] is False
        assert "error" in data
        
    def test_get_explanation_success(self, client):
        """Test retrieving existing explanation"""
        edge_id = 456
        model_version_id = 1
        
        mock_result = {
            "explanation": "Cached explanation content",
            "provider": "openai", 
            "tokens_used": 100,
            "from_cache": True
        }
        
        with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
            mock_service.generate_or_get_edge_explanation.return_value = mock_result
            
            response = client.get(f"/api/edges/{edge_id}/explanation", params={
                "model_version_id": model_version_id
            })
            
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["edge_id"] == edge_id
        assert data["explanation"]["content"] == "Cached explanation content"
        assert data["explanation"]["from_cache"] is True
        
    def test_get_explanation_not_found(self, client):
        """Test retrieving non-existent explanation"""
        edge_id = 999
        model_version_id = 1
        
        with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
            # Simulate cache miss and service returning None
            mock_service.generate_or_get_edge_explanation.return_value = None
            
            response = client.get(f"/api/edges/{edge_id}/explanation", params={
                "model_version_id": model_version_id
            })
            
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "not found" in data["error"].lower()
        
    def test_prefetch_explanations_success(self, client):
        """Test prefetching multiple explanations"""
        request_data = {
            "edges": [
                {"edge_id": 1, "model_version_id": 1},
                {"edge_id": 2, "model_version_id": 1}, 
                {"edge_id": 3, "model_version_id": 2}
            ]
        }
        
        mock_results = [
            {
                "edge_id": 1,
                "explanation": "Explanation for edge 1",
                "provider": "openai",
                "tokens_used": 120,
                "from_cache": False
            },
            {
                "edge_id": 2, 
                "explanation": "Explanation for edge 2",
                "provider": "openai",
                "tokens_used": 110,
                "from_cache": True
            },
            {
                "edge_id": 3,
                "explanation": "Explanation for edge 3", 
                "provider": "openai",
                "tokens_used": 130,
                "from_cache": False
            }
        ]
        
        with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
            mock_service.prefetch_explanations.return_value = mock_results
            
            response = client.post("/api/edges/explanation/prefetch", json=request_data)
            
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert len(data["results"]) == 3
        assert data["summary"]["total_requested"] == 3
        assert data["summary"]["generated"] == 2  # 2 not from cache
        assert data["summary"]["from_cache"] == 1
        
    def test_prefetch_explanations_empty_request(self, client):
        """Test prefetching with empty edge list"""
        response = client.post("/api/edges/explanation/prefetch", json={"edges": []})
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "empty" in data["error"].lower()
        
    def test_prefetch_explanations_too_many_edges(self, client):
        """Test prefetching with too many edges"""
        # Create request with more than 100 edges
        edges = [{"edge_id": i, "model_version_id": 1} for i in range(101)]
        request_data = {"edges": edges}
        
        response = client.post("/api/edges/explanation/prefetch", json=request_data)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "limit" in data["error"].lower()
        
    def test_get_service_status(self, client):
        """Test service status endpoint"""
        mock_health = {
            "status": "healthy",
            "adapters": {"openai": "available", "local": "available"},
            "cache": {"memory_size": 50, "hit_rate": 0.75},
            "rate_limiter": {"active_tokens": 5, "max_tokens": 100}
        }
        
        with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
            mock_service.get_health_status.return_value = mock_health
            
            response = client.get("/api/edges/explanation/status")
            
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["status"] == "healthy"
        assert "adapters" in data
        assert "cache" in data
        assert "rate_limiter" in data
        
    def test_explanation_request_validation(self, client):
        """Test input validation for explanation requests"""
        # Test invalid edge_id
        response = client.post("/api/edges/invalid/explanation", json={
            "model_version_id": 1
        })
        assert response.status_code == 422
        
        # Test negative model_version_id
        response = client.post("/api/edges/123/explanation", json={
            "model_version_id": -1
        })
        assert response.status_code == 422
        
    def test_explanation_response_format(self, client):
        """Test that API responses follow expected format"""
        edge_id = 123
        model_version_id = 1
        
        mock_result = {
            "explanation": "Test explanation",
            "provider": "test_provider",
            "tokens_used": 100,
            "from_cache": False
        }
        
        with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
            mock_service.generate_or_get_edge_explanation.return_value = mock_result
            
            response = client.post(f"/api/edges/{edge_id}/explanation", json={
                "model_version_id": model_version_id
            })
            
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "success" in data
        assert "edge_id" in data
        assert "model_version_id" in data
        assert "explanation" in data
        assert "timestamp" in data
        
        # Check explanation structure
        explanation = data["explanation"]
        assert "content" in explanation
        assert "provider" in explanation
        assert "tokens_used" in explanation
        assert "from_cache" in explanation
        
    def test_concurrent_explanation_requests(self, client):
        """Test handling multiple concurrent requests"""
        import threading
        import time
        
        edge_id = 123
        model_version_id = 1
        
        mock_result = {
            "explanation": "Concurrent test explanation",
            "provider": "test_provider",
            "tokens_used": 100,
            "from_cache": False
        }
        
        responses = []
        
        def make_request():
            with patch('backend.routes.llm_explanations.explanation_service') as mock_service:
                # Add small delay to simulate processing
                async def mock_generate(*args, **kwargs):
                    await asyncio.sleep(0.1)
                    return mock_result
                    
                mock_service.generate_or_get_edge_explanation = mock_generate
                
                resp = client.post(f"/api/edges/{edge_id}/explanation", json={
                    "model_version_id": model_version_id
                })
                responses.append(resp)
        
        # Start multiple threads
        threads = []
        for _ in range(3):
            t = threading.Thread(target=make_request)
            threads.append(t)
            t.start()
            
        # Wait for all threads to complete
        for t in threads:
            t.join()
            
        # All requests should succeed
        assert len(responses) == 3
        for response in responses:
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])