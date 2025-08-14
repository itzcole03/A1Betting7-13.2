"""
Health Endpoint Aliases Integration Tests

Tests all normalized health endpoints return 200 with identical JSON schema:
- /api/health (canonical)  
- /health (alias)
- /api/v2/health (version alias)

Validates exact envelope format:
{
  "success": true,
  "data": {"status": "ok"}, 
  "error": null,
  "meta": {"request_id": "<uuid>"}
}
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from backend.core.app import create_app


@pytest.fixture
def client():
    """Create test client with canonical app"""
    app = create_app()
    return TestClient(app)


def validate_health_response_schema(response_json):
    """Validate the normalized health response schema"""
    assert "success" in response_json
    assert "data" in response_json  
    assert "error" in response_json
    assert "meta" in response_json
    
    # Validate success is boolean true
    assert response_json["success"] is True
    
    # Validate data structure
    assert isinstance(response_json["data"], dict)
    assert response_json["data"]["status"] == "ok"
    
    # Validate error is null
    assert response_json["error"] is None
    
    # Validate meta contains request_id
    assert isinstance(response_json["meta"], dict)
    assert "request_id" in response_json["meta"]
    
    # Validate request_id is valid UUID format
    request_id = response_json["meta"]["request_id"]
    assert isinstance(request_id, str)
    
    # This will raise ValueError if not valid UUID
    uuid.UUID(request_id)


class TestHealthAliases:
    """Test normalized health endpoint aliases"""
    
    def test_canonical_health_get(self, client):
        """Test canonical /api/health GET returns 200 with correct schema"""
        response = client.get("/api/health")
        assert response.status_code == 200
        validate_health_response_schema(response.json())
    
    def test_canonical_health_head(self, client):
        """Test canonical /api/health HEAD returns 200"""  
        response = client.head("/api/health")
        assert response.status_code == 200
    
    def test_health_alias_get(self, client):
        """Test /health alias GET returns 200 with identical schema"""
        response = client.get("/health")
        assert response.status_code == 200
        validate_health_response_schema(response.json())
    
    def test_health_alias_head(self, client):
        """Test /health alias HEAD returns 200"""
        response = client.head("/health")
        assert response.status_code == 200
    
    def test_v2_health_alias_get(self, client):
        """Test /api/v2/health alias GET returns 200 with identical schema"""
        response = client.get("/api/v2/health")
        assert response.status_code == 200
        validate_health_response_schema(response.json())
    
    def test_v2_health_alias_head(self, client):
        """Test /api/v2/health alias HEAD returns 200"""
        response = client.head("/api/v2/health")  
        assert response.status_code == 200
    
    def test_all_health_endpoints_identical_schema(self, client):
        """Test all health endpoints return identical JSON schema structure"""
        endpoints = ["/api/health", "/health", "/api/v2/health"]
        responses = []
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200
            response_json = response.json()
            validate_health_response_schema(response_json)
            responses.append(response_json)
        
        # Verify all have same structure (excluding unique request_id)
        for response_json in responses:
            assert response_json["success"] is True
            assert response_json["data"] == {"status": "ok"}
            assert response_json["error"] is None
            assert "request_id" in response_json["meta"]
    
    def test_sports_activate_options_preflight(self, client):
        """Test OPTIONS preflight for sports/activate returns 204 with CORS headers"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        
        # Should return 204 (No Content) or 200 for successful preflight
        assert response.status_code in [200, 204]
        
        # Verify CORS headers are present
        headers = response.headers
        assert "access-control-allow-origin" in headers
        assert "access-control-allow-methods" in headers or "access-control-allow-method" in headers
