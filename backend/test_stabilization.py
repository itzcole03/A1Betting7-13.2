"""
Emergency Stabilization Integration Tests
Tests for the health endpoint fixes, CORS, WebSocket, and lean mode functionality
"""

import pytest
from fastapi.testclient import TestClient
import json

# Import the app directly from core
from backend.core.app import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health endpoint normalization fixes"""
    
    def test_api_health_get(self):
        """Test GET /api/health returns 200"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"
        
    def test_api_health_head(self):
        """Test HEAD /api/health returns 200"""
        response = client.head("/api/health")
        assert response.status_code == 200
        
    def test_health_alias_get(self):
        """Test GET /health alias returns 200"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"
        
    def test_health_alias_head(self):
        """Test HEAD /health alias returns 200"""
        response = client.head("/health")
        assert response.status_code == 200
        
    def test_api_v2_health_alias_get(self):
        """Test GET /api/v2/health alias returns 200"""
        response = client.get("/api/v2/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"
        
    def test_api_v2_health_alias_head(self):
        """Test HEAD /api/v2/health alias returns 200"""
        response = client.head("/api/v2/health")
        assert response.status_code == 200


class TestPerformanceStatsEndpoint:
    """Test performance stats endpoint that was causing 404s"""
    
    def test_performance_stats_get(self):
        """Test GET /performance/stats returns 200"""
        response = client.get("/performance/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "memory_usage" in data["data"]
        assert "timestamp" in data["data"]
        
    def test_performance_stats_head(self):
        """Test HEAD /performance/stats returns 200"""
        response = client.head("/performance/stats")
        assert response.status_code == 200


class TestCORSPreflight:
    """Test CORS preflight requests"""
    
    def test_options_sports_activate(self):
        """Test OPTIONS /api/v2/sports/activate works for CORS"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        assert response.status_code == 200
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-origin" in response.headers


class TestApiEndpoints:
    """Test core API endpoints work correctly"""
    
    def test_api_props(self):
        """Test /api/props endpoint"""
        response = client.get("/api/props")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        
    def test_api_predictions(self):
        """Test /api/predictions endpoint"""
        response = client.get("/api/predictions")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        
    def test_api_sports_activate(self):
        """Test POST /api/v2/sports/activate"""
        response = client.post(
            "/api/v2/sports/activate",
            json={"sport": "MLB"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["sport"] == "MLB"
        assert data["data"]["activated"] is True


@pytest.mark.fast_stabilization
class TestStabilizationFixes:
    """
    Tests specifically for the emergency stabilization fixes
    Marked with @pytest.mark.fast_stabilization for quick validation
    """
    
    def test_no_404_for_health_endpoints(self):
        """Verify no 404s for health endpoints that were causing monitoring spam"""
        endpoints = ["/health", "/api/health", "/api/v2/health"]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code != 404, f"{endpoint} returned 404"
            assert response.status_code == 200, f"{endpoint} should return 200"
            
    def test_no_404_for_performance_stats(self):
        """Verify /performance/stats doesn't return 404"""
        response = client.get("/performance/stats")
        assert response.status_code != 404
        assert response.status_code == 200
        
    def test_head_support_for_all_health_endpoints(self):
        """Verify HEAD method support for all health endpoints"""
        endpoints = ["/health", "/api/health", "/api/v2/health", "/performance/stats"]
        
        for endpoint in endpoints:
            response = client.head(endpoint)
            assert response.status_code != 404, f"HEAD {endpoint} returned 404"
            assert response.status_code != 405, f"HEAD {endpoint} returned 405 Method Not Allowed"
            assert response.status_code == 200, f"HEAD {endpoint} should return 200"
            
    def test_consistent_response_format(self):
        """Verify all health endpoints return consistent format"""
        endpoints = ["/health", "/api/health", "/api/v2/health"]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            data = response.json()
            
            # Check standard response format
            assert "success" in data
            assert "data" in data
            assert "error" in data
            assert data["success"] is True
            
            # Check health data structure
            health_data = data["data"]
            assert "status" in health_data
            assert health_data["status"] == "healthy"
            assert "uptime_seconds" in health_data
            assert "last_success" in health_data


# Run specific tests for stabilization validation
if __name__ == "__main__":
    import subprocess
    import sys
    
    # Run only the fast stabilization tests
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "-v", "-m", "fast_stabilization",
        "--tb=short"
    ])
    
    if result.returncode == 0:
        print("✅ All stabilization tests passed!")
    else:
        print("❌ Some stabilization tests failed")
        sys.exit(1)
