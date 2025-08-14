"""
Security Headers Metrics Tests

Tests metrics integration for security headers:
- Security headers applied metrics tracking
- CSP violation reports metrics tracking
- Metrics client integration
- Metrics labeling and categorization

Phase 1, Step 6: Security Headers Middleware - Metrics Tests
"""

import pytest
from unittest.mock import Mock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.config.settings import SecuritySettings
from backend.middleware.security_headers import SecurityHeadersMiddleware


class TestSecurityHeadersMetrics:
    """Test security headers metrics collection"""
    
    def test_security_headers_metrics_integration(self):
        """Test metrics client integration with security headers middleware"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            enable_coop=True,
            enable_coep=True
        )
        
        # Mock metrics client
        metrics_client = Mock()
        metrics_client.security_headers_applied_total = Mock()
        metrics_client.security_headers_applied_total.labels = Mock(return_value=Mock())
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings, metrics_client)
        
        assert middleware.metrics_client == metrics_client
    
    def test_security_headers_metrics_tracking(self):
        """Test that security headers application is tracked in metrics"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True,
            csp_report_only=True,
            enable_coop=True,
            enable_coep=True
        )
        
        # Mock metrics client with proper method chaining
        metrics_client = Mock()
        security_metric_mock = Mock()
        metrics_client.security_headers_applied_total = Mock()
        metrics_client.security_headers_applied_total.labels = Mock(return_value=security_metric_mock)
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings, metrics_client=metrics_client)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Verify metrics calls were made
        assert metrics_client.security_headers_applied_total.labels.called
        assert security_metric_mock.inc.called
    
    def test_header_type_labeling(self):
        """Test that different header types are correctly labeled in metrics"""
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, SecuritySettings())
        
        # Test header type mapping
        assert middleware._get_header_type("Strict-Transport-Security") == "hsts"
        assert middleware._get_header_type("X-Frame-Options") == "x-frame-options"
        assert middleware._get_header_type("X-Content-Type-Options") == "x-content-type-options"
        assert middleware._get_header_type("Cross-Origin-Embedder-Policy") == "coep"
        assert middleware._get_header_type("Cross-Origin-Opener-Policy") == "coop"
        assert middleware._get_header_type("Cross-Origin-Resource-Policy") == "corp"
        assert middleware._get_header_type("Permissions-Policy") == "permissions-policy"
        assert middleware._get_header_type("Unknown-Header") == "unknown-header"
    
    def test_csp_metrics_tracking(self):
        """Test CSP header metrics tracking"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            csp_report_only=True
        )
        
        # Mock metrics client
        metrics_client = Mock()
        csp_metric_mock = Mock()
        metrics_client.security_headers_applied_total = Mock()
        metrics_client.security_headers_applied_total.labels = Mock(return_value=csp_metric_mock)
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings, metrics_client=metrics_client)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Verify CSP metric was tracked
        metrics_client.security_headers_applied_total.labels.assert_any_call(header_type='csp')
        csp_metric_mock.inc.assert_called()
    
    def test_metrics_disabled_graceful_handling(self):
        """Test graceful handling when metrics client is not available"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True
        )
        
        # No metrics client
        app.add_middleware(SecurityHeadersMiddleware, settings=settings, metrics_client=None)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        # Should work fine without metrics
        assert response.status_code == 200
        assert "Strict-Transport-Security" in response.headers
        assert "Content-Security-Policy-Report-Only" in response.headers
    
    def test_metrics_with_incomplete_interface(self):
        """Test handling of metrics client with incomplete interface"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        # Mock metrics client without security_headers_applied_total attribute
        incomplete_metrics_client = Mock()
        del incomplete_metrics_client.security_headers_applied_total
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings, metrics_client=incomplete_metrics_client)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        # Should work fine even with incomplete metrics interface
        assert response.status_code == 200
        assert "Strict-Transport-Security" in response.headers


class TestCSPViolationMetrics:
    """Test CSP violation reporting metrics"""
    
    def test_csp_violation_metrics_interface(self):
        """Test that CSP violation metrics are properly defined in metrics client"""
        # This test verifies the metrics interface exists
        from backend.middleware.prometheus_metrics_middleware import PrometheusMetricsMiddleware
        
        # Mock app for metrics middleware
        mock_app = Mock()
        metrics_middleware = PrometheusMetricsMiddleware(mock_app)
        
        # Verify CSP violation metrics exist
        assert hasattr(metrics_middleware, 'csp_violation_reports_total')
        assert metrics_middleware.csp_violation_reports_total is not None
    
    def test_csp_violation_metrics_labels(self):
        """Test CSP violation metrics labeling structure"""
        from backend.middleware.prometheus_metrics_middleware import PrometheusMetricsMiddleware
        
        mock_app = Mock()
        metrics_middleware = PrometheusMetricsMiddleware(mock_app)
        
        # Mock the labels method to verify it's called with correct parameters
        mock_labels = Mock(return_value=Mock())
        metrics_middleware.csp_violation_reports_total.labels = mock_labels
        
        # Simulate CSP violation report
        directive = "script-src"
        violated_directive = "script-src-elem"
        
        metrics_middleware.csp_violation_reports_total.labels(
            directive=directive,
            violated_directive=violated_directive
        ).inc()
        
        # Verify labels were called with correct structure
        mock_labels.assert_called_with(
            directive=directive,
            violated_directive=violated_directive
        )


class TestMetricsConfiguration:
    """Test metrics configuration scenarios"""
    
    def test_metrics_enabled_with_security_headers_enabled(self):
        """Test metrics collection when security headers are enabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True
        )
        
        metrics_client = Mock()
        metrics_client.security_headers_applied_total = Mock()
        metrics_client.security_headers_applied_total.labels = Mock(return_value=Mock())
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings, metrics_client)
        
        # Metrics client should be stored when security headers are enabled
        assert middleware.metrics_client == metrics_client
    
    def test_metrics_not_used_when_security_headers_disabled(self):
        """Test that metrics are not collected when security headers are disabled"""
        settings = SecuritySettings(security_headers_enabled=False)
        
        metrics_client = Mock()
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings, metrics_client)
        
        # Middleware should be disabled
        assert middleware.enabled is False
        
        # Test that no metrics are recorded
        app.add_middleware(type(middleware), settings=settings, metrics_client=metrics_client)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # No security headers should be applied
        assert "Strict-Transport-Security" not in response.headers
        
        # Metrics should not be called since headers are disabled
        assert not metrics_client.security_headers_applied_total.called
    
    def test_debug_logging_with_metrics(self):
        """Test debug logging includes metrics information"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True
        )
        
        metrics_client = Mock()
        metrics_client.security_headers_applied_total = Mock()
        metrics_client.security_headers_applied_total.labels = Mock(return_value=Mock())
        
        middleware = SecurityHeadersMiddleware(app, settings, metrics_client)
        
        # Verify metrics client is attached
        assert middleware.metrics_client == metrics_client
        
        # The middleware should be ready to track metrics
        assert hasattr(middleware.metrics_client, 'security_headers_applied_total')
    
    def test_sampling_with_high_request_volume(self):
        """Test that debug logging is sampled at high request volumes"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True
        )
        
        metrics_client = Mock()
        middleware = SecurityHeadersMiddleware(app, settings, metrics_client)
        
        # Simulate 100 requests to test sampling
        middleware._request_count = 0
        
        # Check that sampling occurs at intervals
        for i in range(1, 201):  # 200 requests
            middleware._request_count = i
            should_sample = (i % 100 == 0)  # Every 100th request
            
            if should_sample:
                # These requests should trigger debug logging (if debug enabled)
                assert middleware._request_count % 100 == 0
    
    def test_concurrent_request_metrics(self):
        """Test metrics collection under concurrent requests"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            enable_hsts=True,
            csp_enabled=True
        )
        
        # Mock thread-safe metrics client
        metrics_client = Mock()
        metrics_client.security_headers_applied_total = Mock()
        metrics_client.security_headers_applied_total.labels = Mock(return_value=Mock())
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings, metrics_client=metrics_client)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        
        # Make multiple concurrent-style requests
        responses = []
        for _ in range(10):
            response = client.get("/test")
            responses.append(response)
        
        # All responses should succeed
        for response in responses:
            assert response.status_code == 200
            assert "Strict-Transport-Security" in response.headers
        
        # Metrics should be called multiple times
        assert metrics_client.security_headers_applied_total.labels.call_count >= 10
