"""
Basic Security Headers Middleware Tests

Tests core functionality of security headers middleware:
- Middleware initialization and configuration
- Static header application
- Basic CSP header generation
- Middleware factory pattern

Phase 1, Step 6: Security Headers Middleware - Basic Tests
"""

import pytest
from unittest.mock import Mock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.config.settings import SecuritySettings
from backend.middleware.security_headers import SecurityHeadersMiddleware, create_security_headers_middleware, build_csp_header


class TestSecurityHeadersMiddleware:
    """Test SecurityHeadersMiddleware basic functionality"""
    
    def test_middleware_initialization_enabled(self):
        """Test middleware initializes correctly when enabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        assert middleware.enabled is True
        assert middleware.settings == settings
        assert len(middleware._static_headers) > 0
    
    def test_middleware_initialization_disabled(self):
        """Test middleware initializes correctly when disabled"""
        settings = SecuritySettings(security_headers_enabled=False)
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        assert middleware.enabled is False
        assert len(middleware._static_headers) == 0
        
        # Test that CSP headers are not generated when disabled
        csp_header_name, csp_header_value = middleware._build_csp_header()
        assert csp_header_name is None
        assert csp_header_value is None
    
    def test_static_headers_build_hsts_enabled(self):
        """Test static headers include HSTS when enabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        assert "Strict-Transport-Security" in middleware._static_headers
        expected_hsts = "max-age=63072000; includeSubDomains; preload"
        assert middleware._static_headers["Strict-Transport-Security"] == expected_hsts
    
    def test_static_headers_build_hsts_disabled(self):
        """Test static headers exclude HSTS when disabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=False
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        assert "Strict-Transport-Security" not in middleware._static_headers
    
    def test_static_headers_build_cross_origin_policies(self):
        """Test static headers include cross-origin policies"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_coop=True,
            enable_coep=True
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        assert "Cross-Origin-Opener-Policy" in middleware._static_headers
        assert "Cross-Origin-Resource-Policy" in middleware._static_headers
        assert "Cross-Origin-Embedder-Policy" in middleware._static_headers
        
        assert middleware._static_headers["Cross-Origin-Opener-Policy"] == "same-origin"
        assert middleware._static_headers["Cross-Origin-Resource-Policy"] == "same-origin"
        assert middleware._static_headers["Cross-Origin-Embedder-Policy"] == "require-corp"
    
    def test_static_headers_build_x_frame_options(self):
        """Test X-Frame-Options header configuration"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            x_frame_options="SAMEORIGIN"
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        assert "X-Frame-Options" in middleware._static_headers
        assert middleware._static_headers["X-Frame-Options"] == "SAMEORIGIN"
    
    def test_basic_security_headers_always_included(self):
        """Test that basic security headers are always included when enabled"""
        settings = SecuritySettings(security_headers_enabled=True)
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        # These should always be present when security headers are enabled
        assert "X-Content-Type-Options" in middleware._static_headers
        assert "Referrer-Policy" in middleware._static_headers
        assert "Permissions-Policy" in middleware._static_headers
        
        assert middleware._static_headers["X-Content-Type-Options"] == "nosniff"
        assert middleware._static_headers["Referrer-Policy"] == "no-referrer"
        assert "camera=()" in middleware._static_headers["Permissions-Policy"]


class TestCSPHeaderGeneration:
    """Test CSP header generation functionality"""
    
    def test_build_csp_header_basic(self):
        """Test basic CSP header generation"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_only=True
        )
        
        csp_value = build_csp_header(settings)
        
        assert "default-src 'self'" in csp_value
        assert "script-src 'self'" in csp_value
        assert "style-src 'self' 'unsafe-inline'" in csp_value
        assert "object-src 'none'" in csp_value
        assert "frame-ancestors 'none'" in csp_value
    
    def test_build_csp_header_with_extra_connect_src(self):
        """Test CSP header generation with extra connect sources"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src="https://api.example.com, wss://stream.example.com"
        )
        
        csp_value = build_csp_header(settings)
        
        assert "connect-src 'self' https://api.example.com wss://stream.example.com" in csp_value
    
    def test_build_csp_header_with_upgrade_insecure(self):
        """Test CSP header generation with upgrade-insecure-requests"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_enable_upgrade_insecure=True
        )
        
        csp_value = build_csp_header(settings)
        
        assert "upgrade-insecure-requests" in csp_value
    
    def test_build_csp_header_with_report_endpoint(self):
        """Test CSP header generation with report endpoint"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_endpoint_enabled=True
        )
        
        csp_value = build_csp_header(settings)
        
        assert "report-uri /csp/report" in csp_value
    
    def test_build_csp_header_disabled(self):
        """Test CSP header generation when disabled"""
        settings = SecuritySettings(csp_enabled=False)
        
        csp_value = build_csp_header(settings)
        
        assert csp_value == ""


class TestMiddlewareFactory:
    """Test middleware factory pattern"""
    
    def test_create_security_headers_middleware_basic(self):
        """Test middleware factory creates correct middleware"""
        settings = SecuritySettings(security_headers_enabled=True)
        metrics_client = Mock()
        
        factory = create_security_headers_middleware(settings, metrics_client)
        
        assert callable(factory)
        
        # Test factory creates middleware
        app = FastAPI()
        middleware = factory(app)
        
        assert isinstance(middleware, SecurityHeadersMiddleware)
        assert middleware.settings == settings
        assert middleware.metrics_client == metrics_client
    
    def test_create_security_headers_middleware_no_metrics(self):
        """Test middleware factory without metrics client"""
        settings = SecuritySettings(security_headers_enabled=True)
        
        factory = create_security_headers_middleware(settings)
        
        app = FastAPI()
        middleware = factory(app)
        
        assert isinstance(middleware, SecurityHeadersMiddleware)
        assert middleware.metrics_client is None


class TestIntegrationWithFastAPI:
    """Test integration with FastAPI application"""
    
    def test_headers_applied_to_response(self):
        """Test that security headers are applied to responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_report_only=True
        )
        
        # Add middleware
        app.add_middleware(
            SecurityHeadersMiddleware,
            settings=settings
        )
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Check security headers are present
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "Content-Security-Policy-Report-Only" in response.headers
        
        # Check header values
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["Referrer-Policy"] == "no-referrer"
    
    def test_headers_not_applied_when_disabled(self):
        """Test that security headers are not applied when disabled"""
        app = FastAPI()
        
        settings = SecuritySettings(security_headers_enabled=False)
        
        # Add middleware
        app.add_middleware(
            SecurityHeadersMiddleware,
            settings=settings
        )
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Check security headers are NOT present
        assert "Strict-Transport-Security" not in response.headers
        assert "X-Content-Type-Options" not in response.headers
        assert "Content-Security-Policy" not in response.headers
        assert "Content-Security-Policy-Report-Only" not in response.headers
    
    def test_headers_applied_to_error_responses(self):
        """Test that security headers are applied even to error responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        # Add middleware
        app.add_middleware(
            SecurityHeadersMiddleware,
            settings=settings
        )
        
        @app.get("/test")
        async def test_endpoint():
            raise Exception("Test error")
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 500
        
        # Check security headers are still present on error responses
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
