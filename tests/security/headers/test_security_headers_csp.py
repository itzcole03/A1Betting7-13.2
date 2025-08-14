"""
CSP-Specific Security Headers Tests

Tests Content Security Policy functionality:
- CSP header generation with various configurations
- Report-only vs enforce mode handling
- Extra connect sources configuration
- CSP directive validation

Phase 1, Step 6: Security Headers Middleware - CSP Tests
"""

import pytest
from unittest.mock import Mock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.config.settings import SecuritySettings
from backend.middleware.security_headers import SecurityHeadersMiddleware, build_csp_header


class TestCSPConfiguration:
    """Test CSP configuration and header generation"""
    
    def test_csp_report_only_mode(self):
        """Test CSP report-only mode header name"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=True
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        csp_header_name, csp_header_value = middleware._build_csp_header()
        assert csp_header_name == "Content-Security-Policy-Report-Only"
        assert csp_header_value is not None
    
    def test_csp_enforce_mode(self):
        """Test CSP enforce mode header name"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=False
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        csp_header_name, csp_header_value = middleware._build_csp_header()
        assert csp_header_name == "Content-Security-Policy"
        assert csp_header_value is not None
    
    def test_csp_disabled(self):
        """Test CSP disabled configuration"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=False
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        csp_header_name, csp_header_value = middleware._build_csp_header()
        assert csp_header_name is None
        assert csp_header_value is None
    
    def test_csp_extra_connect_sources_single(self):
        """Test CSP with single extra connect source"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src="https://api.example.com"
        )
        
        csp_value = build_csp_header(settings)
        
        assert "connect-src 'self' https://api.example.com" in csp_value
    
    def test_csp_extra_connect_sources_multiple(self):
        """Test CSP with multiple extra connect sources"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src="https://api.example.com, wss://stream.example.com, https://cdn.example.com"
        )
        
        csp_value = build_csp_header(settings)
        
        expected_connect = "connect-src 'self' https://api.example.com wss://stream.example.com https://cdn.example.com"
        assert expected_connect in csp_value
    
    def test_csp_extra_connect_sources_with_whitespace(self):
        """Test CSP extra connect sources with varying whitespace"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src="  https://api.example.com  ,   wss://stream.example.com   "
        )
        
        csp_value = build_csp_header(settings)
        
        assert "connect-src 'self' https://api.example.com wss://stream.example.com" in csp_value
    
    def test_csp_extra_connect_sources_empty_string(self):
        """Test CSP with empty extra connect sources"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src=""
        )
        
        csp_value = build_csp_header(settings)
        
        assert "connect-src 'self'" in csp_value
        assert "connect-src 'self' " not in csp_value  # No trailing space
    
    def test_csp_upgrade_insecure_requests_enabled(self):
        """Test CSP with upgrade-insecure-requests enabled"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_enable_upgrade_insecure=True
        )
        
        csp_value = build_csp_header(settings)
        
        assert "upgrade-insecure-requests" in csp_value
    
    def test_csp_upgrade_insecure_requests_disabled(self):
        """Test CSP with upgrade-insecure-requests disabled"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_enable_upgrade_insecure=False
        )
        
        csp_value = build_csp_header(settings)
        
        assert "upgrade-insecure-requests" not in csp_value
    
    def test_csp_report_endpoint_enabled(self):
        """Test CSP with report endpoint enabled"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_endpoint_enabled=True
        )
        
        csp_value = build_csp_header(settings)
        
        assert "report-uri /csp/report" in csp_value
    
    def test_csp_report_endpoint_disabled(self):
        """Test CSP with report endpoint disabled"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_endpoint_enabled=False
        )
        
        csp_value = build_csp_header(settings)
        
        assert "report-uri" not in csp_value


class TestCSPDirectives:
    """Test CSP directive generation"""
    
    def test_default_csp_directives(self):
        """Test default CSP directives are included"""
        settings = SecuritySettings(csp_enabled=True)
        
        csp_value = build_csp_header(settings)
        
        # Check all default directives are present
        expected_directives = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "connect-src 'self'"
        ]
        
        for directive in expected_directives:
            assert directive in csp_value
    
    def test_csp_directive_order_and_format(self):
        """Test CSP directive order and semicolon formatting"""
        settings = SecuritySettings(csp_enabled=True)
        
        csp_value = build_csp_header(settings)
        
        # Should be semicolon-separated
        directives = csp_value.split("; ")
        assert len(directives) >= 10  # Should have at least 10 directives
        
        # Check first directive
        assert directives[0] == "default-src 'self'"
    
    def test_csp_script_src_secure_default(self):
        """Test script-src has secure default (no unsafe-inline)"""
        settings = SecuritySettings(csp_enabled=True)
        
        csp_value = build_csp_header(settings)
        
        # script-src should NOT include 'unsafe-inline' or 'unsafe-eval'
        assert "script-src 'self'" in csp_value
        assert "script-src 'self' 'unsafe-inline'" not in csp_value
        assert "script-src 'self' 'unsafe-eval'" not in csp_value
    
    def test_csp_style_src_allows_inline(self):
        """Test style-src allows inline styles for framework compatibility"""
        settings = SecuritySettings(csp_enabled=True)
        
        csp_value = build_csp_header(settings)
        
        # style-src should include 'unsafe-inline' for common frameworks
        assert "style-src 'self' 'unsafe-inline'" in csp_value
    
    def test_csp_object_src_none(self):
        """Test object-src is set to 'none' for security"""
        settings = SecuritySettings(csp_enabled=True)
        
        csp_value = build_csp_header(settings)
        
        assert "object-src 'none'" in csp_value
    
    def test_csp_frame_ancestors_none(self):
        """Test frame-ancestors is set to 'none' for clickjacking protection"""
        settings = SecuritySettings(csp_enabled=True)
        
        csp_value = build_csp_header(settings)
        
        assert "frame-ancestors 'none'" in csp_value


class TestCSPIntegrationWithFastAPI:
    """Test CSP integration with FastAPI"""
    
    def test_csp_report_only_header_applied(self):
        """Test CSP report-only header is applied to responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=True,
            csp_extra_connect_src="https://api.example.com"
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        assert "Content-Security-Policy-Report-Only" in response.headers
        assert "Content-Security-Policy" not in response.headers
        
        csp_header = response.headers["Content-Security-Policy-Report-Only"]
        assert "default-src 'self'" in csp_header
        assert "connect-src 'self' https://api.example.com" in csp_header
    
    def test_csp_enforce_header_applied(self):
        """Test CSP enforce header is applied to responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=False
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        assert "Content-Security-Policy" in response.headers
        assert "Content-Security-Policy-Report-Only" not in response.headers
        
        csp_header = response.headers["Content-Security-Policy"]
        assert "default-src 'self'" in csp_header
    
    def test_csp_not_applied_when_disabled(self):
        """Test CSP header is not applied when disabled"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=False
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        assert "Content-Security-Policy" not in response.headers
        assert "Content-Security-Policy-Report-Only" not in response.headers
    
    def test_csp_applied_to_404_responses(self):
        """Test CSP header is applied even to 404 responses"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        client = TestClient(app)
        response = client.get("/nonexistent")
        
        assert response.status_code == 404
        assert "Content-Security-Policy-Report-Only" in response.headers
        
        csp_header = response.headers["Content-Security-Policy-Report-Only"]
        assert "default-src 'self'" in csp_header
