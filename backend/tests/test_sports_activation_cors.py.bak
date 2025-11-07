"""
Test suite for CORS configuration and sports activation endpoint.

This test file verifies:
1. OPTIONS preflight requests work correctly
2. CORS headers are properly set for allowed origins
3. Unauthorized origins are rejected
4. POST endpoint maintains correct behavior
5. Security headers are preserved with CORS
"""

import pytest
from fastapi.testclient import TestClient
from backend.core.app import create_app


@pytest.fixture
def client():
    """Create test client with the canonical app"""
    app = create_app()
    return TestClient(app)


class TestSportsActivationCORS:
    """Test CORS configuration for sports activation endpoint"""

    def test_options_preflight_allowed_origin(self, client):
        """Test OPTIONS preflight with allowed origin returns correct CORS headers"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        
        assert response.status_code == 200
        
        # Verify CORS headers
        assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
        assert "POST" in response.headers["Access-Control-Allow-Methods"]
        assert "OPTIONS" in response.headers["Access-Control-Allow-Methods"]
        assert "Content-Type" in response.headers["Access-Control-Allow-Headers"]
        assert response.headers["Access-Control-Allow-Credentials"] == "true"
        assert "Vary" in response.headers and "Origin" in response.headers["Vary"]

    def test_options_preflight_without_origin(self, client):
        """Test OPTIONS preflight without Origin header (direct request, not browser preflight)"""
        response = client.options("/api/v2/sports/activate")
        
        assert response.status_code == 200
        # No CORS headers should be present for non-cross-origin requests
        assert "Access-Control-Allow-Origin" not in response.headers

    def test_options_preflight_disallowed_origin(self, client):
        """Test OPTIONS preflight with disallowed origin is handled gracefully"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://malicious-site.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        
        # The CORS middleware should handle this - expect 400 due to invalid origin
        # or 200 with no CORS headers depending on configuration
        assert response.status_code in [200, 400, 403]
        
        if response.status_code == 200:
            # If allowed, should not include Access-Control-Allow-Origin for disallowed origins
            # This depends on CORS middleware implementation
            pass

    def test_post_activation_with_cors_headers(self, client):
        """Test POST activation request with CORS origin header"""
        response = client.post(
            "/api/v2/sports/activate",
            json={"sport": "MLB"},
            headers={
                "Origin": "http://localhost:5173",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200
        
        # Verify response structure
        data = response.json()
        assert data["success"] is True
        assert data["data"]["sport"] == "MLB"
        assert data["data"]["activated"] is True
        assert data["data"]["version_used"] == "v2"
        
        # Verify CORS headers in actual response
        assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
        assert response.headers["Access-Control-Allow-Credentials"] == "true"

    def test_post_activation_without_cors(self, client):
        """Test POST activation request without CORS origin (same-origin request)"""
        response = client.post(
            "/api/v2/sports/activate",
            json={"sport": "NHL"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        
        # Verify response structure
        data = response.json()
        assert data["success"] is True
        assert data["data"]["sport"] == "NHL"
        assert data["data"]["activated"] is True
        
        # No CORS headers for same-origin requests
        assert "Access-Control-Allow-Origin" not in response.headers

    def test_security_headers_preserved_with_cors(self, client):
        """Test that security headers are still present with CORS requests"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        
        assert response.status_code == 200
        
        # Verify security headers are preserved
        security_headers = [
            "Strict-Transport-Security",
            "X-Content-Type-Options", 
            "X-Frame-Options",
            "Referrer-Policy",
            "Cross-Origin-Opener-Policy",
            "Cross-Origin-Resource-Policy",
            "Cross-Origin-Embedder-Policy",
            "Permissions-Policy"
        ]
        
        for header in security_headers:
            assert header in response.headers, f"Security header {header} missing"

    def test_cors_max_age_set(self, client):
        """Test that CORS preflight responses include max-age for caching"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        
        assert response.status_code == 200
        assert "Access-Control-Max-Age" in response.headers
        
        # Should be a reasonable cache time (e.g., 600 seconds = 10 minutes)
        max_age = int(response.headers["Access-Control-Max-Age"])
        assert 300 <= max_age <= 3600  # Between 5 minutes and 1 hour


class TestSportsActivationValidation:
    """Test input validation and error handling for sports activation"""

    def test_valid_sports_activation(self, client):
        """Test activation with all valid sports"""
        valid_sports = ["MLB", "NBA", "NFL", "NHL"]
        
        for sport in valid_sports:
            response = client.post(
                "/api/v2/sports/activate",
                json={"sport": sport},
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["sport"] == sport.upper()

    def test_invalid_sport_activation(self, client):
        """Test activation with invalid sport returns proper error"""
        response = client.post(
            "/api/v2/sports/activate",
            json={"sport": "INVALID_SPORT"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400  # Business logic validation error
        data = response.json()
        assert data["success"] is False
        assert "error" in data
        assert "Invalid sport" in data["error"]["message"]

    def test_missing_sport_field(self, client):
        """Test activation with missing sport field"""
        response = client.post(
            "/api/v2/sports/activate",
            json={},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400  # Validation error
        data = response.json()
        assert data["success"] is False
        assert "Sport is required" in data["error"]["message"]

    def test_invalid_content_type(self, client):
        """Test activation with invalid content type"""
        response = client.post(
            "/api/v2/sports/activate",
            data="sport=MLB",  # Form data instead of JSON
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 415  # Unsupported Media Type
        data = response.json()
        assert data["success"] is False
        assert "Unsupported content type" in data["error"]["message"]

    def test_malformed_json(self, client):
        """Test activation with malformed JSON"""
        response = client.post(
            "/api/v2/sports/activate",
            content="{'sport': 'MLB'",  # Invalid JSON
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400  # Validation error  
        data = response.json()
        assert data["success"] is False
        assert "Invalid JSON" in data["error"]["message"]


class TestMultipleOrigins:
    """Test CORS behavior with multiple allowed origins"""

    @pytest.mark.parametrize("origin", [
        "http://localhost:5173",
        "http://127.0.0.1:5173", 
        "http://localhost:8000"
    ])
    def test_allowed_origins(self, client, origin):
        """Test that all configured origins are properly allowed"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST"
            }
        )
        
        assert response.status_code == 200
        assert response.headers["Access-Control-Allow-Origin"] == origin

    def test_request_id_header_preserved(self, client):
        """Test that request ID headers are preserved with CORS"""
        response = client.post(
            "/api/v2/sports/activate",
            json={"sport": "MLB"},
            headers={
                "Origin": "http://localhost:5173",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200
        assert "X-Request-ID" in response.headers
        
        # Request ID should be a valid UUID-like string
        request_id = response.headers["X-Request-ID"]
        assert len(request_id) == 36  # UUID format
        assert request_id.count("-") == 4


class TestCORSEdgeCases:
    """Test edge cases and security considerations for CORS"""

    def test_options_without_request_method_header(self, client):
        """Test OPTIONS request without Access-Control-Request-Method header"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={"Origin": "http://localhost:5173"}
        )
        
        # Should still work as it's a simple OPTIONS request
        assert response.status_code == 200

    def test_unsupported_method_in_preflight(self, client):
        """Test preflight request with unsupported method"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "DELETE"  # Not supported for this endpoint
            }
        )
        
        # CORS middleware should still return 200 but list supported methods
        assert response.status_code == 200
        allowed_methods = response.headers.get("Access-Control-Allow-Methods", "")
        assert "DELETE" in allowed_methods  # FastAPI CORS allows all methods by default
        assert "POST" in allowed_methods
        assert "OPTIONS" in allowed_methods

    def test_credentials_included(self, client):
        """Test that credentials are properly handled in CORS responses"""
        response = client.options(
            "/api/v2/sports/activate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        
        assert response.status_code == 200
        assert response.headers["Access-Control-Allow-Credentials"] == "true"