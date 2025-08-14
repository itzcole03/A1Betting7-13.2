"""
Security Headers Middleware Core Tests

Test suite for Phase 1 Step 6: Security Headers Middleware - Core Functionality

Tests cover:
1. Basic security header application (HSTS, X-Frame-Options, etc.)
2. Content Security Policy (CSP) configuration and enforcement
3. Cross-origin policies (COOP, COEP, CORP) 
4. Permissions-Policy restrictions

Focused on core security headers functionality without metrics or configuration complexity.
Split from oversized test_security_headers.py (652 lines) for better maintainability.
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
        middleware._apply_static_headers(response)
        
        hsts_value = response.headers.get('Strict-Transport-Security')
        assert hsts_value is not None
        assert 'max-age=63072000' in hsts_value
        assert 'includeSubDomains' in hsts_value
        assert 'preload' in hsts_value
    
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
        """Test X-Frame-Options DENY setting"""
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
        
        assert response.headers.get('X-Frame-Options') == 'DENY'
    
    def test_x_frame_options_sameorigin(self):
        """Test X-Frame-Options SAMEORIGIN setting"""
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
        
        assert response.headers.get('X-Frame-Options') == 'SAMEORIGIN'
    
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
        
        assert response.headers.get('X-Content-Type-Options') == 'nosniff'
    
    def test_all_basic_headers_disabled(self):
        """Test no headers applied when disabled"""
        settings = SecuritySettings(
            security_headers_enabled=False,
            enable_hsts=True,  # Should be ignored
            x_frame_options="DENY"  # Should be ignored
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        # No security headers should be applied
        security_headers = [
            'Strict-Transport-Security',
            'X-Frame-Options',
            'X-Content-Type-Options',
            'Referrer-Policy'
        ]
        
        for header in security_headers:
            assert header not in response.headers


class TestCSPFunctionality:
    """Test Content Security Policy functionality"""
    
    def test_csp_basic_policy(self):
        """Test basic CSP policy generation"""
        settings = SecuritySettings(
            csp_enabled=True
        )
        
        csp_value = build_csp_header(settings)
        
        # Check default directives
        assert "default-src 'self'" in csp_value
        assert "script-src 'self'" in csp_value
        assert "style-src 'self' 'unsafe-inline'" in csp_value
        assert "img-src 'self' data:" in csp_value
        assert "font-src 'self'" in csp_value
        assert "object-src 'none'" in csp_value
        assert "frame-ancestors 'none'" in csp_value
        assert "base-uri 'self'" in csp_value
        assert "form-action 'self'" in csp_value
    
    def test_csp_with_extra_connect_src(self):
        """Test CSP with additional connect-src domains"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_extra_connect_src="https://api.example.com wss://websocket.example.com"
        )
        
        csp_value = build_csp_header(settings)
        assert "connect-src 'self' https://api.example.com wss://websocket.example.com" in csp_value
    
    def test_csp_upgrade_insecure_requests(self):
        """Test CSP upgrade-insecure-requests directive"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_upgrade_insecure_requests=True
        )
        
        csp_value = build_csp_header(settings)
        assert "upgrade-insecure-requests" in csp_value
    
    def test_csp_report_uri(self):
        """Test CSP report-uri directive"""
        settings = SecuritySettings(
            csp_enabled=True,
            csp_report_uri="/csp/report"
        )
        
        csp_value = build_csp_header(settings)
        assert "report-uri /csp/report" in csp_value
    
    def test_csp_enforce_mode(self):
        """Test CSP enforce mode (not report-only)"""
        settings = SecuritySettings(
            security_headers_enabled=True,
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
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        assert middleware._csp_header_name == 'Content-Security-Policy-Report-Only'
    
    def test_csp_disabled(self):
        """Test CSP header not applied when disabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=False
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware.dispatch(Mock(), Mock())  # Won't add CSP header


class TestCrossOriginPolicies:
    """Test Cross-Origin Policies (COOP, COEP, CORP)"""
    
    def test_coop_same_origin_allow_popups(self):
        """Test COOP same-origin-allow-popups policy"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_coop=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers.get('Cross-Origin-Opener-Policy') == 'same-origin'
    
    def test_coop_disabled(self):
        """Test COOP disabled"""
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
        """Test COEP require-corp policy"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_coep=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers.get('Cross-Origin-Embedder-Policy') == 'require-corp'
    
    def test_coep_disabled(self):
        """Test COEP disabled"""
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
        """Test CORP same-site policy"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_corp=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        assert response.headers.get('Cross-Origin-Resource-Policy') == 'same-origin'
    
    def test_corp_disabled(self):
        """Test CORP disabled"""
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
    """Test Permissions-Policy header functionality"""
    
    def test_permissions_policy_basic(self):
        """Test basic Permissions-Policy header"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            permissions_policy_enabled=True
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        permissions_value = response.headers.get('Permissions-Policy')
        assert permissions_value is not None
        
        # Check default restricted permissions
        assert 'camera=()' in permissions_value
        assert 'microphone=()' in permissions_value
        assert 'geolocation=()' in permissions_value
    
    def test_permissions_policy_with_append(self):
        """Test Permissions-Policy with additional restrictions"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            permissions_policy_enabled=True,
            permissions_policy_append="payment=()"
        )
        
        middleware = SecurityHeadersMiddleware(
            app=Mock(),
            settings=settings
        )
        
        response = Response()
        middleware._apply_static_headers(response)
        
        permissions_value = response.headers.get('Permissions-Policy')
        assert permissions_value is not None
        
        # Check both default and appended permissions
        assert 'camera=()' in permissions_value
        assert 'payment=()' in permissions_value


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
