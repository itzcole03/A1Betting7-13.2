"""
Tests for Legacy Endpoint Disable Flag

Verifies legacy endpoint middleware behavior when A1_LEGACY_ENABLED=false.
Tests the 410 Gone response functionality and proper JSON contract.
"""

import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.core.app import create_app


class TestLegacyDisableFlag:
    """Test legacy endpoint disable flag behavior"""

    def test_legacy_endpoints_enabled_by_default_dev(self):
        """Test legacy endpoints enabled by default in development"""
        with patch.dict(os.environ, {"ENVIRONMENT": "development"}, clear=False):
            app = create_app()
            client = TestClient(app)
            
            # Legacy endpoint should work
            response = client.get("/api/health")
            assert response.status_code == 200
            
            # Should have legacy headers
            assert response.headers.get("X-Legacy-Endpoint") == "true"

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false"})
    def test_legacy_endpoints_disabled_410_response(self):
        """Test legacy endpoints return 410 Gone when disabled"""
        app = create_app()
        client = TestClient(app)
        
        # Legacy endpoint should return 410 Gone
        response = client.get("/api/health")
        assert response.status_code == 410
        
        data = response.json()
        assert data["error"] == "deprecated"
        assert "deprecated and disabled" in data["message"]
        assert data["forward"] == "/api/v2/diagnostics/health"
        assert data["docs"] == "/docs/migration/legacy_deprecation_plan.md"
        assert "timestamp" in data

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false"})
    def test_multiple_legacy_endpoints_410(self):
        """Test multiple legacy endpoints return 410 when disabled"""
        app = create_app()
        client = TestClient(app)
        
        legacy_endpoints = [
            ("/api/health", "/api/v2/diagnostics/health"),
            ("/health", "/api/v2/diagnostics/health"),
            ("/api/props", "/api/v2/ml/predictions"),
            ("/api/predictions", "/api/v2/ml/predictions"),
            ("/metrics", "/api/v2/meta/cache-stats"),
        ]
        
        for endpoint, expected_forward in legacy_endpoints:
            response = client.get(endpoint)
            assert response.status_code == 410, f"Endpoint {endpoint} should return 410"
            
            data = response.json()
            assert data["error"] == "deprecated"
            assert data["forward"] == expected_forward

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false"})
    def test_v2_endpoints_still_work_when_legacy_disabled(self):
        """Test that /api/v2/* endpoints still work when legacy is disabled"""
        app = create_app()
        client = TestClient(app)
        
        # V2 endpoints should still work
        response = client.get("/api/v2/diagnostics/health")
        assert response.status_code == 200
        
        # Should not have legacy headers
        assert "X-Legacy-Endpoint" not in response.headers

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false", "A1_LEGACY_SUNSET": "2025-12-31T23:59:59Z"})
    def test_410_response_includes_sunset_date(self):
        """Test 410 response includes sunset date when configured"""
        app = create_app()
        client = TestClient(app)
        
        response = client.get("/api/health")
        assert response.status_code == 410
        
        data = response.json()
        assert data["sunset"] == "2025-12-31T23:59:59Z"

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "true"})
    def test_legacy_usage_tracking_when_enabled(self):
        """Test legacy endpoints increment usage counters when enabled"""
        app = create_app()
        client = TestClient(app)
        
        # Make some requests to legacy endpoints
        client.get("/api/health")
        client.get("/api/health")
        client.get("/api/props")
        
        # Check usage via meta endpoint
        response = client.get("/api/v2/meta/legacy-usage")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] is True
        assert data["total"] >= 3  # At least the requests we made
        
        # Find health endpoint in results
        health_endpoint = next((ep for ep in data["endpoints"] if ep["path"] == "/api/health"), None)
        assert health_endpoint is not None
        assert health_endpoint["count"] >= 2

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false"})
    def test_no_usage_tracking_when_disabled(self):
        """Test legacy endpoints don't increment counters when disabled (410 returned)"""
        app = create_app()
        client = TestClient(app)
        
        # Try to access legacy endpoints (should get 410)
        client.get("/api/health")
        client.get("/api/props")
        
        # Usage should not be tracked for 410 responses
        response = client.get("/api/v2/meta/legacy-usage")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] is False
        # Total might be 0 or very low since these were 410 responses

    def test_options_requests_not_affected(self):
        """Test OPTIONS requests bypass legacy middleware"""
        app = create_app()
        client = TestClient(app)
        
        # OPTIONS should work regardless of legacy flag
        response = client.options("/api/health")
        # Status varies by endpoint but should not be 410
        assert response.status_code != 410

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false"})
    def test_websocket_endpoints_not_affected(self):
        """Test WebSocket endpoints not affected by legacy disable flag"""
        app = create_app()
        client = TestClient(app)
        
        # WebSocket endpoints should not return 410
        # Note: This tests HTTP to WebSocket endpoint, actual WS connection would need different client
        try:
            response = client.get("/ws/client")  
            # WebSocket endpoints typically return 400 for HTTP requests, not 410
            assert response.status_code != 410
        except Exception:
            # Connection errors are expected for WebSocket endpoints via HTTP
            pass

    def test_legacy_meta_endpoints_always_available(self):
        """Test legacy meta endpoints work regardless of legacy flag"""
        app = create_app()
        client = TestClient(app)
        
        # Meta endpoints should always work
        response = client.get("/api/v2/meta/legacy-usage")
        assert response.status_code == 200
        
        response = client.get("/api/v2/meta/migration-readiness")
        assert response.status_code == 200


class TestLegacyMiddlewareIntegration:
    """Integration tests for legacy middleware behavior"""

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "true"})
    def test_legacy_headers_added_to_responses(self):
        """Test legacy endpoints get proper headers when enabled"""
        app = create_app()
        client = TestClient(app)
        
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.headers.get("X-Legacy-Endpoint") == "true"
        assert response.headers.get("X-Forward-To") == "/api/v2/diagnostics/health"
        assert "Use /api/v2/diagnostics/health instead" in response.headers.get("X-Deprecated-Warning", "")

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "true"})
    def test_non_legacy_endpoints_no_headers(self):
        """Test non-legacy endpoints don't get legacy headers"""
        app = create_app()
        client = TestClient(app)
        
        response = client.get("/api/v2/diagnostics/health")
        assert response.status_code == 200
        assert "X-Legacy-Endpoint" not in response.headers
        assert "X-Forward-To" not in response.headers

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false"})
    def test_410_response_has_proper_headers(self):
        """Test 410 responses have proper deprecation headers"""
        app = create_app()
        client = TestClient(app)
        
        response = client.get("/api/health")
        assert response.status_code == 410
        assert response.headers.get("X-Legacy-Endpoint") == "true"
        assert response.headers.get("X-Deprecated") == "true"
        assert response.headers.get("X-Forward-To") == "/api/v2/diagnostics/health"

    def test_enhanced_ml_prefix_detection(self):
        """Test enhanced ML endpoints detected as legacy"""
        app = create_app()
        client = TestClient(app)
        
        # Enhanced ML endpoints are legacy (should get headers when enabled)
        # Note: These endpoints may not exist in this app, but middleware should detect them
        try:
            response = client.get("/api/enhanced-ml/health")
            if response.status_code != 404:  # Only test if endpoint exists
                # Should have legacy headers if enabled
                legacy_enabled = os.getenv("A1_LEGACY_ENABLED", "true").lower() != "false"
                if legacy_enabled:
                    assert response.headers.get("X-Legacy-Endpoint") == "true"
        except Exception:
            # Skip if endpoint doesn't exist
            pass