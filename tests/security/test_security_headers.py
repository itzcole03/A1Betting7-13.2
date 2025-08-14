"""
Security Headers Middleware Tests

Comprehensive test suite for Phase 1 Step 6: Security Headers Middleware

Tests cover:
1. Basic security header application (HSTS, X-Frame-Options, etc.)
2. Content Security Policy (CSP) configuration and enforcement
3. Cross-origin policies (COOP, COEP, CORP) 
4. Permissions-Policy restrictions
5. Metrics integration and tracking
6. Configuration validation and edge cases
7. Performance considerations and middleware ordering

Test Structure:
- test_basic_headers: Core security headers functionality
- test_csp_functionality: CSP header generation and modes  
- test_cross_origin_policies: COOP/COEP/CORP headers
- test_permissions_policy: Permissions-Policy header
- test_metrics_integration: Prometheus metrics tracking
- test_configuration: Settings validation and edge cases
- test_middleware_integration: Full integration testing
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List
import json

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.requests import Request
from starlette.responses import Response

from backend.middleware.security_headers import (
    SecurityHeadersMiddleware,
    build_csp_header,
    create_security_headers_middleware
)
from backend.config.settings import SecuritySettings


class TestBasicSecurityHeaders:
    """Test core security headers functionality"""
    
    def test_hsts_header_enabled(self):
        """Test HSTS header application when enabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        # Apply headers directly through static headers dict
        for header_name, header_value in middleware._static_headers.items():
            response.headers[header_name] = header_value
        
        assert 'Strict-Transport-Security' in response.headers
        hsts_value = response.headers['Strict-Transport-Security']
        assert 'max-age=' in hsts_value
    
    def test_hsts_header_disabled(self):
        """Test HSTS header not applied when disabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert 'Strict-Transport-Security' not in response.headers
    
    def test_x_frame_options_deny(self):
        """Test X-Frame-Options header with DENY value"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            x_frame_options="DENY"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers['X-Frame-Options'] == 'DENY'
    
    def test_x_frame_options_sameorigin(self):
        """Test X-Frame-Options header with SAMEORIGIN value"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            x_frame_options="SAMEORIGIN"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers['X-Frame-Options'] == 'SAMEORIGIN'
    
    def test_x_content_type_options(self):
        """Test X-Content-Type-Options header"""
        settings = SecuritySettings(
            security_headers_enabled=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
    
    def test_all_basic_headers_disabled(self):
        """Test no headers applied when security headers disabled"""
        settings = SecuritySettings(
            security_headers_enabled=False,
            enable_hsts=True,
            x_frame_options="DENY"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        # Only default headers should be present (if any)
        security_header_names = [
            'Strict-Transport-Security',
            'X-Frame-Options', 
            'X-Content-Type-Options'
        ]
        
        for header_name in security_header_names:
            assert header_name not in response.headers


class TestCSPFunctionality:
    """Test Content Security Policy functionality"""
    
    def test_csp_basic_policy(self):
        """Test basic CSP policy generation"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_only=False,
            csp_extra_connect_src=[]
        )
        
        csp_value = build_csp_header(settings)
        
        assert "default-src 'self'" in csp_value
        assert "script-src 'self' 'unsafe-inline'" in csp_value
        assert "style-src 'self' 'unsafe-inline'" in csp_value
        assert "img-src 'self' data: blob:" in csp_value
        assert "object-src 'none'" in csp_value
        assert "base-uri 'self'" in csp_value
        assert "form-action 'self'" in csp_value
        assert "frame-ancestors 'none'" in csp_value
    
    def test_csp_with_extra_connect_src(self):
        """Test CSP with additional connect-src domains"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src=["https://api.example.com", "https://cdn.example.com"]
        )
        
        csp_value = build_csp_header(settings)
        
        assert "connect-src 'self' https://api.example.com https://cdn.example.com" in csp_value
    
    def test_csp_upgrade_insecure_requests(self):
        """Test CSP with upgrade-insecure-requests"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_enable_upgrade_insecure=True
        )
        
        csp_value = build_csp_header(settings)
        
        assert "upgrade-insecure-requests" in csp_value
    
    def test_csp_report_uri(self):
        """Test CSP with report-uri"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_endpoint_enabled=True
        )
        
        csp_value = build_csp_header(settings)
        
        assert "report-uri /api/security/csp-report" in csp_value
    
    def test_csp_enforce_mode(self):
        """Test CSP enforcement mode"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_only=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        assert middleware._csp_header_name == 'Content-Security-Policy'
    
    def test_csp_report_only_mode(self):
        """Test CSP report-only mode"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_only=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        assert middleware._csp_header_name == 'Content-Security-Policy-Report-Only'
    
    def test_csp_disabled(self):
        """Test CSP disabled"""
        settings = SecuritySettings(
            csp_enabled=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        assert middleware._csp_header_name is None
        assert middleware._csp_header_value is None


class TestCrossOriginPolicies:
    """Test cross-origin policies (COOP, COEP, CORP)"""
    
    def test_coop_same_origin_allow_popups(self):
        """Test COOP header with same-origin-allow-popups"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_coop=True,
            coop_policy="same-origin-allow-popups"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers['Cross-Origin-Opener-Policy'] == 'same-origin-allow-popups'
    
    def test_coop_disabled(self):
        """Test COOP header not applied when disabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_coop=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert 'Cross-Origin-Opener-Policy' not in response.headers
    
    def test_coep_require_corp(self):
        """Test COEP header with require-corp"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_coep=True,
            coep_policy="require-corp"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers['Cross-Origin-Embedder-Policy'] == 'require-corp'
    
    def test_coep_disabled(self):
        """Test COEP header not applied when disabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_coep=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert 'Cross-Origin-Embedder-Policy' not in response.headers
    
    def test_corp_same_site(self):
        """Test CORP header with same-site"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_corp=True,
            corp_policy="same-site"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers['Cross-Origin-Resource-Policy'] == 'same-site'
    
    def test_corp_disabled(self):
        """Test CORP header not applied when disabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_corp=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert 'Cross-Origin-Resource-Policy' not in response.headers


class TestPermissionsPolicy:
    """Test Permissions-Policy header"""
    
    def test_permissions_policy_basic(self):
        """Test basic Permissions-Policy header"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            permissions_policy_append=""
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        permissions_value = response.headers['Permissions-Policy']
        
        # Check for default restrictive policies
        assert 'camera=()' in permissions_value
        assert 'microphone=()' in permissions_value
        assert 'geolocation=()' in permissions_value
        assert 'autoplay=()' in permissions_value
        assert 'accelerometer=()' in permissions_value
        assert 'gyroscope=()' in permissions_value
    
    def test_permissions_policy_with_append(self):
        """Test Permissions-Policy with additional policies"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            permissions_policy_append=", payment=()"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        permissions_value = response.headers['Permissions-Policy']
        
        # Check for default policies plus appended one
        assert 'camera=()' in permissions_value
        assert 'payment=()' in permissions_value


class TestMetricsIntegration:
    """Test Prometheus metrics integration"""
    
    def test_metrics_tracking_enabled(self):
        """Test metrics tracking when enabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True
        )
        
        mock_metrics = Mock()
        mock_metrics.security_headers_applied_total = Mock()
        mock_metrics.security_headers_applied_total.labels = Mock(return_value=Mock())
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings,
            metrics_client=mock_metrics
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        # Should call metrics for each header type
        assert mock_metrics.security_headers_applied_total.labels.called
    
    def test_metrics_tracking_disabled(self):
        """Test metrics tracking when metrics client not available"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings,
            metrics_client=None
        )
        
        # Should not raise error when no metrics client
        response = Response()
        middleware._apply_static_headers(response)
    
    def test_header_type_mapping(self):
        """Test header name to metrics type mapping"""
        settings = SecuritySettings(
            security_headers_enabled=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        # Test mapping function
        assert middleware._get_header_type('Strict-Transport-Security') == 'hsts'
        assert middleware._get_header_type('X-Frame-Options') == 'x-frame-options'
        assert middleware._get_header_type('Cross-Origin-Opener-Policy') == 'coop'
        assert middleware._get_header_type('Unknown-Header') == 'unknown-header'


class TestConfiguration:
    """Test configuration validation and edge cases"""
    
    def test_security_strict_mode_override(self):
        """Test security_strict_mode overriding CSP report-only"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=True,
            security_strict_mode=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        # Should use enforce mode despite report_only=True
        assert middleware._csp_header_name == 'Content-Security-Policy'
    
    def test_x_frame_options_validation(self):
        """Test X-Frame-Options value validation"""
        # Valid values should work
        valid_settings = SecuritySettings(
            x_frame_options="DENY"
        )
        assert valid_settings.x_frame_options == "DENY"
        
        valid_settings = SecuritySettings(
            x_frame_options="SAMEORIGIN"
        )
        assert valid_settings.x_frame_options == "SAMEORIGIN"
        
        # Invalid values should be caught by Pydantic validation
        with pytest.raises(ValueError):
            SecuritySettings(
                x_frame_options="INVALID"
            )
    
    def test_csp_extra_connect_src_list(self):
        """Test CSP extra connect-src as list"""
        settings = SecuritySettings(
            csp_extra_connect_src=["https://api.example.com", "wss://websocket.example.com"]
        )
        
        csp_value = build_csp_header(settings)
        assert "https://api.example.com" in csp_value
        assert "wss://websocket.example.com" in csp_value
    
    def test_csp_extra_connect_src_empty(self):
        """Test CSP with empty extra connect-src"""
        settings = SecuritySettings(
            csp_extra_connect_src=[]
        )
        
        csp_value = build_csp_header(settings)
        assert "connect-src 'self'" in csp_value


class TestMiddlewareIntegration:
    """Test full middleware integration"""
    
    @pytest.fixture
    def app_with_middleware(self):
        """Create FastAPI app with security headers middleware"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_report_only=False,
            enable_coop=True,
            enable_coep=True
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
    
    def test_full_middleware_integration(self, app_with_middleware):
        """Test full middleware with FastAPI integration"""
        client = TestClient(app_with_middleware)
        
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Check security headers are applied
        assert 'Strict-Transport-Security' in response.headers
        assert 'Content-Security-Policy' in response.headers
        assert 'X-Content-Type-Options' in response.headers
        assert 'Cross-Origin-Opener-Policy' in response.headers
        assert 'Cross-Origin-Embedder-Policy' in response.headers
    
    def test_existing_headers_not_overridden(self, app_with_middleware):
        """Test that existing headers are not overridden"""
        app = app_with_middleware
        
        @app.get("/test-existing")
        async def test_existing():
            from fastapi import Response
            response = Response(content=json.dumps({"message": "test"}))
            response.headers['X-Frame-Options'] = 'ALLOWALL'  # Custom value
            return response
        
        client = TestClient(app)
        response = client.get("/test-existing")
        
        # Should not override existing header
        assert response.headers['X-Frame-Options'] == 'ALLOWALL'


class TestPerformanceAndOrdering:
    """Test performance considerations and middleware ordering"""
    
    def test_static_header_caching(self):
        """Test static headers are cached for performance"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            x_frame_options="DENY"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        # Static headers should be pre-computed
        assert len(middleware._static_headers) > 0
        assert 'Strict-Transport-Security' in middleware._static_headers
        assert 'X-Frame-Options' in middleware._static_headers
    
    def test_debug_logging_sampling(self):
        """Test debug logging is sampled to avoid performance issues"""
        settings = SecuritySettings(
            security_headers_enabled=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        # Simulate multiple requests
        response = Response()
        middleware._request_count = 99  # Just before sampling threshold
        
        with patch('backend.middleware.security_headers.logger') as mock_logger:
            mock_logger.isEnabledFor.return_value = True
            middleware._apply_static_headers(response)
            # Should not log at 99
            mock_logger.debug.assert_not_called()
            
            middleware._apply_static_headers(response)  # 100th request
            # Should log at 100
            mock_logger.debug.assert_called()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
