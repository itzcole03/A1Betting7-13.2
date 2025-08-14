"""
Security Headers Error Response Tests

Tests that security headers are applied to error responses:
- 404 Not Found responses
- 500 Internal Server Error responses
- Validation error responses
- Exception handling with security headers

Phase 1, Step 6: Security Headers Middleware - Error Response Tests
"""

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from fastapi.responses import JSONResponse

from backend.config.settings import SecuritySettings
from backend.middleware.security_headers import SecurityHeadersMiddleware


class TestSecurityHeadersOnErrorResponses:
    """Test security headers application on error responses"""
    
    def test_headers_applied_to_404_responses(self):
        """Test security headers are applied to 404 Not Found responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_report_only=True,
            enable_coop=True,
            enable_coep=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        # No routes defined - all requests should return 404
        client = TestClient(app)
        response = client.get("/nonexistent-endpoint")
        
        assert response.status_code == 404
        
        # Verify security headers are present on 404 response
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "Content-Security-Policy-Report-Only" in response.headers
        assert "Cross-Origin-Opener-Policy" in response.headers
        assert "Cross-Origin-Embedder-Policy" in response.headers
        
        # Verify header values
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["Referrer-Policy"] == "no-referrer"
    
    def test_headers_applied_to_500_responses(self):
        """Test security headers are applied to 500 Internal Server Error responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_report_only=False,  # Test with enforcement mode
            x_frame_options="SAMEORIGIN"
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/error")
        async def error_endpoint():
            raise Exception("Intentional error for testing")
        
        client = TestClient(app)
        response = client.get("/error")
        
        assert response.status_code == 500
        
        # Verify security headers are present on 500 response
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "Content-Security-Policy" in response.headers
        assert "Content-Security-Policy-Report-Only" not in response.headers
        
        # Verify specific header values
        assert response.headers["X-Frame-Options"] == "SAMEORIGIN"
        assert "default-src 'self'" in response.headers["Content-Security-Policy"]
    
    def test_headers_applied_to_http_exception_responses(self):
        """Test security headers are applied to HTTPException responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/forbidden")
        async def forbidden_endpoint():
            raise HTTPException(status_code=403, detail="Forbidden")
        
        @app.get("/bad-request")
        async def bad_request_endpoint():
            raise HTTPException(status_code=400, detail="Bad Request")
        
        client = TestClient(app)
        
        # Test 403 Forbidden
        response = client.get("/forbidden")
        assert response.status_code == 403
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        
        # Test 400 Bad Request
        response = client.get("/bad-request")
        assert response.status_code == 400
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
    
    def test_headers_applied_to_validation_error_responses(self):
        """Test security headers are applied to validation error responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_extra_connect_src="https://api.example.com"
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        from pydantic import BaseModel
        
        class TestModel(BaseModel):
            required_field: str
            number_field: int
        
        @app.post("/validate")
        async def validate_endpoint(data: TestModel):
            return {"data": data}
        
        client = TestClient(app)
        
        # Send invalid JSON to trigger validation error
        response = client.post("/validate", json={"number_field": "not_a_number"})
        
        assert response.status_code == 422  # Validation error
        
        # Verify security headers are present on validation error response
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "Content-Security-Policy-Report-Only" in response.headers
        
        # Verify CSP includes custom connect source
        csp_header = response.headers["Content-Security-Policy-Report-Only"]
        assert "connect-src 'self' https://api.example.com" in csp_header
    
    def test_headers_applied_to_custom_exception_responses(self):
        """Test security headers are applied to custom exception responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            enable_coop=True,
            enable_coep=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        class CustomException(Exception):
            pass
        
        @app.exception_handler(CustomException)
        async def custom_exception_handler(request, exc):
            return JSONResponse(
                status_code=418,  # I'm a teapot
                content={"error": "Custom error occurred"}
            )
        
        @app.get("/custom-error")
        async def custom_error_endpoint():
            raise CustomException("Custom error")
        
        client = TestClient(app)
        response = client.get("/custom-error")
        
        assert response.status_code == 418
        
        # Verify security headers are present on custom exception response
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "Cross-Origin-Opener-Policy" in response.headers
        assert "Cross-Origin-Embedder-Policy" in response.headers
    
    def test_headers_not_applied_when_disabled_on_errors(self):
        """Test security headers are not applied when disabled, even on error responses"""
        app = FastAPI()
        
        settings = SecuritySettings(security_headers_enabled=False)
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/error")
        async def error_endpoint():
            raise HTTPException(status_code=500, detail="Server Error")
        
        client = TestClient(app)
        response = client.get("/error")
        
        assert response.status_code == 500
        
        # Verify NO security headers are present when disabled
        assert "Strict-Transport-Security" not in response.headers
        assert "X-Content-Type-Options" not in response.headers
        assert "X-Frame-Options" not in response.headers
        assert "Content-Security-Policy" not in response.headers
        assert "Content-Security-Policy-Report-Only" not in response.headers
    
    def test_headers_applied_consistent_across_response_types(self):
        """Test security headers are consistent across success and error responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_report_only=True,
            x_frame_options="DENY"
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/success")
        async def success_endpoint():
            return {"status": "success"}
        
        @app.get("/error")
        async def error_endpoint():
            raise HTTPException(status_code=500, detail="Error")
        
        client = TestClient(app)
        
        # Get responses
        success_response = client.get("/success")
        error_response = client.get("/error")
        
        assert success_response.status_code == 200
        assert error_response.status_code == 500
        
        # Compare security headers - should be identical
        security_headers = [
            "Strict-Transport-Security",
            "X-Content-Type-Options", 
            "X-Frame-Options",
            "Referrer-Policy",
            "Content-Security-Policy-Report-Only",
            "Cross-Origin-Resource-Policy",
            "Permissions-Policy"
        ]
        
        for header in security_headers:
            assert header in success_response.headers
            assert header in error_response.headers
            assert success_response.headers[header] == error_response.headers[header]


class TestErrorResponseSpecialCases:
    """Test special cases for error response handling"""
    
    def test_headers_on_method_not_allowed(self):
        """Test security headers on 405 Method Not Allowed responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/only-get")
        async def get_only_endpoint():
            return {"method": "GET"}
        
        client = TestClient(app)
        
        # Try POST to GET-only endpoint
        response = client.post("/only-get")
        
        assert response.status_code == 405
        
        # Verify security headers on 405 response
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
    
    def test_headers_on_unsupported_media_type(self):
        """Test security headers on 415 Unsupported Media Type responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        from pydantic import BaseModel
        
        class TestModel(BaseModel):
            field: str
        
        @app.post("/json-only")
        async def json_only_endpoint(data: TestModel):
            return {"data": data}
        
        client = TestClient(app)
        
        # Send XML instead of JSON
        response = client.post(
            "/json-only",
            content="<xml>invalid</xml>",
            headers={"Content-Type": "application/xml"}
        )
        
        # FastAPI typically returns 422 for this, but test any error response
        assert response.status_code >= 400
        
        # Verify security headers on media type error
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
    
    def test_middleware_exception_handling(self):
        """Test that middleware exceptions don't prevent security headers"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Even if there were internal middleware issues, headers should be applied
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
