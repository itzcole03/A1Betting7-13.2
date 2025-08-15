"""
Tests for Legacy Registry Service

Verifies legacy endpoint usage tracking, configuration, and migration readiness
assessment functionality. Covers the core service used by legacy middleware.
"""

import os
import time
import pytest
from unittest.mock import patch

from backend.services.legacy_registry import LegacyRegistry, get_legacy_registry


class TestLegacyRegistry:
    """Test legacy endpoint registry functionality"""

    def test_registry_initialization(self):
        """Test registry initializes with correct default settings"""
        registry = LegacyRegistry()
        
        # Should initialize with default settings
        assert isinstance(registry._data, dict)
        assert len(registry._data) == 0
        assert registry._start_time > 0
        assert registry._sunset_date is None  # Unless env var set

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "true"})
    def test_legacy_enabled_true(self):
        """Test legacy endpoints enabled when env var set to true"""
        registry = LegacyRegistry()
        assert registry.is_enabled() is True

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false"})
    def test_legacy_enabled_false(self):
        """Test legacy endpoints disabled when env var set to false"""
        registry = LegacyRegistry()
        assert registry.is_enabled() is False

    @patch.dict(os.environ, {"A1_LEGACY_SUNSET": "2025-12-31T23:59:59Z"})
    def test_sunset_date_configuration(self):
        """Test sunset date configuration from environment"""
        registry = LegacyRegistry()
        assert registry.get_sunset_date() == "2025-12-31T23:59:59Z"

    def test_register_legacy_endpoint(self):
        """Test registering legacy endpoints with forwarding"""
        registry = LegacyRegistry()
        
        # Register without forwarding
        registry.register_legacy("/api/health")
        assert "/api/health" in registry._data
        assert registry._data["/api/health"].path == "/api/health"
        assert registry._data["/api/health"].forward is None
        assert registry._data["/api/health"].count == 0
        
        # Register with forwarding
        registry.register_legacy("/api/props", "/api/v2/ml/predictions")
        assert registry._data["/api/props"].forward == "/api/v2/ml/predictions"

    def test_increment_usage(self):
        """Test usage counter increments correctly"""
        registry = LegacyRegistry()
        
        # Increment unknown endpoint (should auto-register)
        result = registry.increment_usage("/api/health")
        assert result is True
        assert "/api/health" in registry._data
        assert registry._data["/api/health"].count == 1
        assert registry._data["/api/health"].last_access_ts is not None
        
        # Increment again
        initial_timestamp = registry._data["/api/health"].last_access_ts
        time.sleep(0.01)  # Small delay to ensure timestamp changes
        registry.increment_usage("/api/health")
        assert registry._data["/api/health"].count == 2
        assert registry._data["/api/health"].last_access_ts > initial_timestamp

    def test_get_usage_data_empty(self):
        """Test getting usage data when no endpoints accessed"""
        registry = LegacyRegistry()
        data = registry.get_usage_data()
        
        assert data["enabled"] is not None
        assert data["endpoints"] == []
        assert data["total"] == 0
        assert data["first_recorded_ts"] > 0
        assert data["first_recorded_iso"] is not None
        assert data["since_seconds"] >= 0
        assert "sunset_date" in data

    def test_get_usage_data_with_endpoints(self):
        """Test getting usage data with tracked endpoints"""
        registry = LegacyRegistry()
        
        # Add some usage
        registry.register_legacy("/api/health", "/api/v2/diagnostics/health")
        registry.increment_usage("/api/health")
        registry.increment_usage("/api/health")
        registry.increment_usage("/api/props")
        
        data = registry.get_usage_data()
        
        assert len(data["endpoints"]) == 2
        assert data["total"] == 3
        
        # Find health endpoint data
        health_endpoint = next(ep for ep in data["endpoints"] if ep["path"] == "/api/health")
        assert health_endpoint["count"] == 2
        assert health_endpoint["forward"] == "/api/v2/diagnostics/health"
        assert health_endpoint["last_access_ts"] is not None
        assert health_endpoint["last_access_iso"] is not None

    def test_migration_readiness_no_usage(self):
        """Test migration readiness with no usage (should be ready)"""
        registry = LegacyRegistry()
        readiness = registry.get_migration_readiness()
        
        assert readiness["score"] == 1.0  # No usage = ready
        assert readiness["readiness_level"] == "ready"
        assert readiness["total_calls_last_24h"] == 0
        assert readiness["usage_rate_per_hour"] == 0
        assert len(readiness["analysis"]["recommendations"]) > 0

    def test_migration_readiness_high_usage(self):
        """Test migration readiness with high usage (should not be ready)"""
        registry = LegacyRegistry()
        
        # Simulate high usage
        for _ in range(100):
            registry.increment_usage("/api/health")
        
        readiness = registry.get_migration_readiness(threshold=10)
        
        assert readiness["score"] < 0.5  # High usage = not ready
        assert readiness["readiness_level"] == "not_ready"
        assert readiness["total_calls_last_24h"] == 100
        assert readiness["analysis"]["high_usage_endpoints"][0]["count"] == 100

    def test_migration_readiness_recommendations(self):
        """Test migration readiness recommendations based on usage patterns"""
        registry = LegacyRegistry()
        
        # Low usage
        registry.increment_usage("/api/health")
        readiness_low = registry.get_migration_readiness(threshold=50)
        assert any("Safe to proceed" in rec for rec in readiness_low["analysis"]["recommendations"])
        
        # High usage
        for _ in range(100):
            registry.increment_usage("/api/health")
        readiness_high = registry.get_migration_readiness(threshold=50)
        assert any("High usage detected" in rec for rec in readiness_high["analysis"]["recommendations"])

    @patch.dict(os.environ, {"A1_LEGACY_SUNSET": "2025-12-31T23:59:59Z"})
    def test_migration_recommendations_include_sunset(self):
        """Test that migration recommendations include sunset date when configured"""
        registry = LegacyRegistry()
        readiness = registry.get_migration_readiness()
        
        recommendations = readiness["analysis"]["recommendations"]
        assert any("2025-12-31T23:59:59Z" in rec for rec in recommendations)

    def test_clear_usage_data(self):
        """Test clearing usage data"""
        registry = LegacyRegistry()
        
        # Add some data
        registry.increment_usage("/api/health")
        registry.increment_usage("/api/props")
        assert len(registry._data) == 2
        
        # Clear data
        initial_start_time = registry._start_time
        time.sleep(0.01)  # Small delay
        registry.clear_usage_data()
        
        assert len(registry._data) == 0
        assert registry._start_time > initial_start_time

    def test_global_registry_singleton(self):
        """Test that global registry instance is singleton"""
        registry1 = get_legacy_registry()
        registry2 = get_legacy_registry()
        
        assert registry1 is registry2
        
        # Changes to one should affect the other
        registry1.increment_usage("/test")
        data = registry2.get_usage_data()
        assert data["total"] == 1


class TestLegacyRegistryIntegration:
    """Integration tests for legacy registry with realistic scenarios"""
    
    def test_typical_migration_workflow(self):
        """Test a typical migration assessment workflow"""
        registry = LegacyRegistry()
        
        # Initial state - ready for migration
        readiness = registry.get_migration_readiness()
        assert readiness["readiness_level"] == "ready"
        
        # Add some moderate usage
        for _ in range(25):
            registry.increment_usage("/api/health")
            registry.increment_usage("/api/props")
        
        # Should be cautious but not blocked
        readiness = registry.get_migration_readiness(threshold=50)
        assert readiness["readiness_level"] in ["ready", "caution"]
        
        # Add heavy usage
        for _ in range(100):
            registry.increment_usage("/api/health")
        
        # Should not be ready
        readiness = registry.get_migration_readiness(threshold=50)
        assert readiness["readiness_level"] == "not_ready"
        
    def test_multiple_endpoints_tracking(self):
        """Test tracking multiple legacy endpoints simultaneously"""
        registry = LegacyRegistry()
        
        # Register different types of legacy endpoints
        endpoints = [
            ("/api/health", "/api/v2/diagnostics/health"),
            ("/api/props", "/api/v2/ml/predictions"), 
            ("/api/analytics", "/api/v2/ml/analytics"),
            ("/metrics", "/api/v2/meta/cache-stats"),
            ("/dev/mode", "/api/v2/diagnostics/system")
        ]
        
        for path, forward in endpoints:
            registry.register_legacy(path, forward)
            for _ in range(10):
                registry.increment_usage(path)
        
        usage_data = registry.get_usage_data()
        
        assert len(usage_data["endpoints"]) == 5
        assert usage_data["total"] == 50
        
        # Verify all endpoints have forwarding info
        for endpoint in usage_data["endpoints"]:
            assert endpoint["forward"] is not None
            assert endpoint["forward"].startswith("/api/v2/")

    @patch.dict(os.environ, {"A1_LEGACY_ENABLED": "false", "A1_LEGACY_SUNSET": "2025-06-01T00:00:00Z"})
    def test_disabled_legacy_configuration(self):
        """Test behavior when legacy endpoints are disabled"""
        registry = LegacyRegistry()
        
        assert registry.is_enabled() is False
        assert registry.get_sunset_date() == "2025-06-01T00:00:00Z"
        
        # Usage should still be trackable even when disabled
        registry.increment_usage("/api/health")
        data = registry.get_usage_data()
        assert data["enabled"] is False
        assert data["total"] == 1