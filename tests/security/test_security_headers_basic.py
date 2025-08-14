"""
Basic Security Headers Tests

Simplified test suite for Phase 1 Step 6: Security Headers Middleware
Focus on core functionality with working test patterns.
"""

import pytest
from unittest.mock import Mock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.middleware.security_headers import (
    SecurityHeadersMiddleware,
    build_csp_header,
    create_security_headers_middleware
)
from backend.config.settings import SecuritySettings


class TestCSPHeaderGeneration:
    """Test CSP header generation utility function"""
    
    def test_basic_csp_generation(self):
        """Test basic CSP header generation"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src="",
            csp_enable_upgrade_insecure=True,
            csp_report_endpoint_enabled=True
        )
        
        csp_value = build_csp_header(settings)
        
        # Check basic directives
        assert "default-src 'self'" in csp_value
        assert "script-src 'self'" in csp_value  # No unsafe-inline by default for security
        assert "style-src 'self' 'unsafe-inline'" in csp_value
        assert "object-src 'none'" in csp_value
        assert "upgrade-insecure-requests" in csp_value
        assert "report-uri /api/security/csp-report" in csp_value
    
    def test_csp_with_extra_connect_src(self):
        """Test CSP with additional connect sources"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src="https://api.example.com,wss://socket.example.com",
            csp_enable_upgrade_insecure=False,
            csp_report_endpoint_enabled=False
        )
        
        csp_value = build_csp_header(settings)
        
        assert "connect-src 'self' https://api.example.com wss://socket.example.com" in csp_value
        assert "upgrade-insecure-requests" not in csp_value
        assert "report-uri" not in csp_value
    
    def test_csp_disabled(self):
        """Test CSP generation when disabled"""
        settings = SecuritySettings(
            csp_enabled=False
        )
        
        csp_value = build_csp_header(settings)
        
        # Should return empty string when disabled
        assert csp_value == ""


class TestSecuritySettings:
    """Test security settings validation"""
    
    def test_x_frame_options_valid_values(self):
        """Test X-Frame-Options validation with valid values"""
        settings_deny = SecuritySettings(x_frame_options="DENY")
        assert settings_deny.x_frame_options == "DENY"
        
        settings_sameorigin = SecuritySettings(x_frame_options="SAMEORIGIN")
        assert settings_sameorigin.x_frame_options == "SAMEORIGIN"
    
    def test_x_frame_options_invalid_value(self):
        """Test X-Frame-Options validation with invalid value"""
        with pytest.raises(ValueError, match="X-Frame-Options must be either 'DENY' or 'SAMEORIGIN'"):
            SecuritySettings(x_frame_options="INVALID")
    
    def test_security_strict_mode_override(self):
        """Test security strict mode overriding CSP report-only"""
        settings = SecuritySettings(
            csp_report_only=True,
            security_strict_mode=True
        )
        
        # Should be overridden to False by strict mode
        assert settings.csp_report_only is False
    
    def test_default_settings(self):
        """Test default security settings"""
        settings = SecuritySettings()
        
        assert settings.security_headers_enabled is True
        assert settings.enable_hsts is True
        assert settings.csp_enabled is True
        assert settings.csp_report_only is True  # Default is report-only
        assert settings.x_frame_options == "DENY"


class TestSecurityHeadersMiddleware:
    """Test security headers middleware core functionality"""
    
    def test_middleware_initialization(self):
        """Test middleware initializes correctly"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            enable_coep=True,
            enable_coop=True,
            csp_enabled=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        # Should have static headers pre-computed
        assert len(middleware._static_headers) > 0
        assert 'Strict-Transport-Security' in middleware._static_headers
        assert 'X-Content-Type-Options' in middleware._static_headers
    
    def test_middleware_disabled(self):
        """Test middleware when security headers disabled"""
        settings = SecuritySettings(
            security_headers_enabled=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        # Should not have security headers when disabled
        assert len(middleware._static_headers) == 0
    
    def test_csp_header_names(self):
        """Test CSP header name selection based on mode"""
        # Enforce mode
        settings_enforce = SecuritySettings(
            csp_enabled=True,
            csp_report_only=False
        )
        middleware_enforce = SecurityHeadersMiddleware(Mock(), settings_enforce)
        assert middleware_enforce._csp_header_name == 'Content-Security-Policy'
        
        # Report-only mode
        settings_report = SecuritySettings(
            csp_enabled=True,
            csp_report_only=True
        )
        middleware_report = SecurityHeadersMiddleware(Mock(), settings_report)
        assert middleware_report._csp_header_name == 'Content-Security-Policy-Report-Only'
        
        # Disabled
        settings_disabled = SecuritySettings(
            csp_enabled=False
        )
        middleware_disabled = SecurityHeadersMiddleware(Mock(), settings_disabled)
        assert middleware_disabled._csp_header_name is None


class TestMiddlewareFactory:
    """Test middleware factory function"""
    
    def test_factory_creates_middleware(self):
        """Test factory function creates correct middleware type"""
        settings = SecuritySettings()
        
        middleware_factory = create_security_headers_middleware(
            settings=settings,
            metrics_client=None
        )
        
        # Should return a callable that creates middleware
        assert callable(middleware_factory)
        
        # Test creating actual middleware
        app = Mock()
        middleware_instance = middleware_factory(app)
        assert isinstance(middleware_instance, SecurityHeadersMiddleware)


class TestIntegrationWithFastAPI:
    """Test integration with FastAPI application"""
    
    @pytest.fixture
    def app_with_security_headers(self):
        """Create FastAPI app with security headers middleware"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_report_only=False,  # Use enforce mode for testing
            x_frame_options="DENY"
        )
        
        middleware_factory = create_security_headers_middleware(
            settings=settings,
            metrics_client=None
        )
        
        app.add_middleware(middleware_factory)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        return app
    
    def test_headers_applied_to_response(self, app_with_security_headers):
        """Test security headers are applied to HTTP responses"""
        client = TestClient(app_with_security_headers)
        
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Check core security headers
        assert 'Strict-Transport-Security' in response.headers
        assert 'X-Frame-Options' in response.headers
        assert response.headers['X-Frame-Options'] == 'DENY'
        assert 'X-Content-Type-Options' in response.headers
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
        
        # Check CSP header (enforce mode)
        assert 'Content-Security-Policy' in response.headers
        csp_value = response.headers['Content-Security-Policy']
        assert "default-src 'self'" in csp_value
    
    def test_headers_not_overridden(self, app_with_security_headers):
        """Test existing headers are not overridden"""
        app = app_with_security_headers
        
        @app.get("/test-custom")
        async def test_custom():
            from starlette.responses import Response
            import json
            response = Response(
                content=json.dumps({"message": "custom"}),
                media_type="application/json"
            )
            # Set custom X-Frame-Options
            response.headers['X-Frame-Options'] = 'SAMEORIGIN'
            return response
        
        client = TestClient(app)
        response = client.get("/test-custom")
        
        # Custom header should not be overridden
        assert response.headers['X-Frame-Options'] == 'SAMEORIGIN'
    
    def test_disabled_middleware(self):
        """Test middleware when disabled"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=False
        )
        
        middleware_factory = create_security_headers_middleware(
            settings=settings,
            metrics_client=None
        )
        
        app.add_middleware(middleware_factory)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        # Security headers should not be present when disabled
        security_headers = [
            'Strict-Transport-Security',
            'Content-Security-Policy',
            'Content-Security-Policy-Report-Only',
            'Cross-Origin-Opener-Policy',
            'Cross-Origin-Embedder-Policy'
        ]
        
        for header in security_headers:
            assert header not in response.headers


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
