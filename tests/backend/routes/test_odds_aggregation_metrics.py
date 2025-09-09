"""
Tests for Odds Aggregation Prometheus Metrics

Comprehensive test suite for the metrics collection system with proper
guards for environments where Prometheus is not available.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import the metrics system
from backend.services.odds_aggregation_metrics import (
    OddsAggregationMetrics, 
    get_metrics,
    initialize_metrics,
    is_prometheus_available
)
from backend.routes.metrics_routes import router as metrics_router


class TestOddsAggregationMetrics:
    """Test the core metrics collection functionality"""
    
    def test_metrics_initialization_with_prometheus(self):
        """Test metrics initialization when Prometheus is available"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            assert metrics.enabled is True
            assert metrics.is_enabled() is True
    
    def test_metrics_initialization_without_prometheus(self):
        """Test metrics initialization when Prometheus is not available"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', False):
            metrics = OddsAggregationMetrics(enabled=True)
            assert metrics.enabled is False
            assert metrics.is_enabled() is False
    
    def test_metrics_disabled_by_configuration(self):
        """Test metrics can be disabled by configuration"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=False)
            assert metrics.enabled is False
            assert metrics.is_enabled() is False
    
    def test_provider_confidence_metrics(self):
        """Test provider confidence score recording"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Test confidence score recording
            metrics.record_confidence_score("draftkings", "odds_aggregation", 0.85)
            
            # Test confidence change recording
            metrics.record_confidence_change("draftkings", "odds_aggregation", 0.75, 0.85)
            
            # Should not raise exceptions
            assert True
    
    def test_circuit_breaker_metrics(self):
        """Test circuit breaker state and transition recording"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Test state recording
            metrics.record_circuit_breaker_state("draftkings", "closed")
            
            # Test transition recording
            metrics.record_circuit_breaker_transition("draftkings", "closed", "open")
            
            # Test recovery time recording
            metrics.record_circuit_breaker_recovery("draftkings", 30.5)
            
            # Should not raise exceptions
            assert True
    
    def test_fallback_execution_metrics(self):
        """Test fallback execution recording"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Test fallback execution recording
            metrics.record_fallback_execution(
                context="odds_aggregation",
                original_provider="draftkings",
                fallback_provider="fanduel",
                reason="stale_data",
                success=True,
                latency=0.125
            )
            
            # Test active contexts update
            metrics.update_active_fallback_contexts(3)
            
            # Should not raise exceptions
            assert True
    
    def test_provider_performance_metrics(self):
        """Test provider performance recording"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Test request recording
            metrics.record_provider_request("draftkings", "success", 0.045)
            
            # Test success rate update
            metrics.update_provider_success_rate("draftkings", "1h", 0.95)
            
            # Should not raise exceptions
            assert True
    
    def test_schema_validation_metrics(self):
        """Test schema validation recording"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Test validation recording
            metrics.record_schema_validation(
                provider_id="draftkings",
                schema_type="odds_response",
                result="success"
            )
            
            # Test validation error recording
            metrics.record_schema_validation(
                provider_id="draftkings",
                schema_type="odds_response",
                result="error",
                error_type="missing_field",
                severity="warning"
            )
            
            # Should not raise exceptions
            assert True
    
    def test_system_performance_metrics(self):
        """Test system performance recording"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Test request recording
            metrics.record_request("/api/odds", "GET", "200", 0.125)
            
            # Test system health update
            metrics.update_system_health(0.95)
            
            # Test system info update
            metrics.update_system_info({
                "version": "1.0.0",
                "environment": "test"
            })
            
            # Should not raise exceptions
            assert True
    
    def test_request_time_measurement(self):
        """Test request time measurement context manager"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Test successful operation
            with metrics.measure_request_time("/api/test"):
                # Simulate some work
                import time
                time.sleep(0.001)
            
            # Test operation with exception
            try:
                with metrics.measure_request_time("/api/test"):
                    raise ValueError("Test error")
            except ValueError:
                pass
            
            # Should not raise exceptions beyond the test exception
            assert True
    
    def test_mock_metrics_when_prometheus_unavailable(self):
        """Test that mock metrics work when Prometheus is not available"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', False):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # All metric recording should work without errors
            metrics.record_confidence_score("draftkings", "odds_aggregation", 0.85)
            metrics.record_circuit_breaker_state("draftkings", "closed")
            metrics.record_fallback_execution("ctx", "orig", "fall", "reason", True, 0.1)
            metrics.record_provider_request("draftkings", "success", 0.045)
            metrics.record_schema_validation("draftkings", "odds", "success")
            metrics.record_request("/api/test", "GET", "200", 0.1)
            
            # Should return empty metrics
            assert metrics.get_metrics() == b"# Prometheus metrics not available\n"
            assert metrics.is_enabled() is False
    
    def test_health_summary(self):
        """Test health summary generation"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            health = metrics.get_health_summary()
            
            assert "metrics_enabled" in health
            assert "prometheus_available" in health
            assert "registry_initialized" in health
            assert health["metrics_enabled"] is True
            assert health["prometheus_available"] is True
    
    def test_global_metrics_instance(self):
        """Test global metrics instance management"""
        # Test getting metrics instance
        metrics1 = get_metrics()
        metrics2 = get_metrics()
        
        # Should return the same instance
        assert metrics1 is metrics2
        
        # Test initialization
        metrics3 = initialize_metrics(enabled=False)
        assert metrics3.is_enabled() is False


class TestMetricsRoutes:
    """Test the FastAPI metrics routes"""
    
    def setup_method(self):
        """Set up test client"""
        self.app = FastAPI()
        self.app.include_router(metrics_router)
        self.client = TestClient(self.app)
    
    def test_prometheus_endpoint_with_metrics_enabled(self):
        """Test Prometheus metrics endpoint when metrics are enabled"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            mock_metrics = Mock()
            mock_metrics.is_enabled.return_value = True
            mock_metrics.get_metrics.return_value = b"# Sample metrics\ntest_metric 1.0\n"
            mock_metrics.get_metrics_content_type.return_value = "text/plain"
            mock_get_metrics.return_value = mock_metrics
            
            response = self.client.get("/metrics/prometheus")
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/plain; charset=utf-8"
            assert b"test_metric 1.0" in response.content
    
    def test_prometheus_endpoint_with_metrics_disabled(self):
        """Test Prometheus metrics endpoint when metrics are disabled"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            mock_metrics = Mock()
            mock_metrics.is_enabled.return_value = False
            mock_get_metrics.return_value = mock_metrics
            
            response = self.client.get("/metrics/prometheus")
            
            assert response.status_code == 503
            assert "Metrics collection is disabled" in response.json()["detail"]
    
    def test_prometheus_endpoint_with_error(self):
        """Test Prometheus metrics endpoint with internal error"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            mock_get_metrics.side_effect = Exception("Test error")
            
            response = self.client.get("/metrics/prometheus")
            
            assert response.status_code == 500
            assert "Failed to retrieve metrics" in response.json()["detail"]
    
    def test_legacy_metrics_endpoint(self):
        """Test legacy metrics endpoint"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            mock_metrics = Mock()
            mock_metrics.is_enabled.return_value = True
            mock_metrics.get_metrics.return_value = b"# Enhanced metrics\nenhanced_metric 1.0\n"
            mock_get_metrics.return_value = mock_metrics
            
            response = self.client.get("/metrics/")
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/plain; version=0.0.4; charset=utf-8"
    
    def test_legacy_metrics_endpoint_with_disabled_metrics(self):
        """Test legacy metrics endpoint when enhanced metrics are disabled"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            with patch('backend.routes.metrics_routes.LEGACY_ADAPTER_AVAILABLE', True):
                mock_metrics = Mock()
                mock_metrics.is_enabled.return_value = False
                mock_get_metrics.return_value = mock_metrics
                
                response = self.client.get("/metrics/")
                
                assert response.status_code == 200
                # The legacy adapter may still work and return real metrics, 
                # or fall back to enhanced metrics disabled message
                assert response.headers["content-type"] == "text/plain; version=0.0.4; charset=utf-8"
    
    def test_metrics_health_endpoint(self):
        """Test metrics health endpoint"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            with patch('backend.routes.metrics_routes.is_prometheus_available', return_value=True):
                mock_metrics = Mock()
                mock_metrics.is_enabled.return_value = True
                mock_metrics.get_health_summary.return_value = {
                    "metrics_enabled": True,
                    "prometheus_available": True,
                    "registry_initialized": True
                }
                mock_get_metrics.return_value = mock_metrics
                
                response = self.client.get("/metrics/health")
                
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "healthy"
                assert data["prometheus_client_available"] is True
                assert data["metrics_enabled"] is True
    
    def test_metrics_health_endpoint_with_error(self):
        """Test metrics health endpoint with error"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            mock_get_metrics.side_effect = Exception("Test error")
            
            response = self.client.get("/metrics/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "unhealthy"
            assert "error" in data
    
    def test_metrics_status_endpoint(self):
        """Test metrics status endpoint"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            with patch('backend.routes.metrics_routes.is_prometheus_available', return_value=True):
                mock_metrics = Mock()
                mock_metrics.is_enabled.return_value = True
                mock_metrics.get_metrics_content_type.return_value = "text/plain"
                mock_get_metrics.return_value = mock_metrics
                
                response = self.client.get("/metrics/status")
                
                assert response.status_code == 200
                data = response.json()
                assert data["prometheus_available"] is True
                assert data["metrics_enabled"] is True
                assert data["collection_active"] is True
                assert "enhanced_metrics_endpoint" in data
    
    def test_metrics_status_endpoint_with_disabled_metrics(self):
        """Test metrics status endpoint when metrics are disabled"""
        with patch('backend.routes.metrics_routes.get_metrics') as mock_get_metrics:
            with patch('backend.routes.metrics_routes.is_prometheus_available', return_value=False):
                mock_metrics = Mock()
                mock_metrics.is_enabled.return_value = False
                mock_get_metrics.return_value = mock_metrics
                
                response = self.client.get("/metrics/status")
                
                assert response.status_code == 200
                data = response.json()
                assert data["prometheus_available"] is False
                assert data["metrics_enabled"] is False
                assert data["collection_active"] is False
                assert "recommendation" in data


class TestMetricsIntegration:
    """Test integration with other system components"""
    
    def test_smart_fallback_metrics_integration(self):
        """Test integration with smart fallback service"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Simulate smart fallback execution
            metrics.record_fallback_execution(
                context="odds_aggregation",
                original_provider="draftkings",
                fallback_provider="fanduel",
                reason="stale_data",
                success=True,
                latency=0.156
            )
            
            # Update circuit breaker state
            metrics.record_circuit_breaker_state("draftkings", "open")
            metrics.record_circuit_breaker_transition("draftkings", "closed", "open")
            
            # Record provider confidence changes
            metrics.record_confidence_change("draftkings", "odds_aggregation", 0.85, 0.45)
            
            # Should not raise exceptions
            assert True
    
    def test_provider_confidence_metrics_integration(self):
        """Test integration with provider confidence system"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Simulate provider confidence scoring
            providers = ["draftkings", "fanduel", "betmgm"]
            for provider in providers:
                metrics.record_confidence_score(provider, "odds_aggregation", 0.8 + (0.1 * hash(provider) % 3))
                metrics.record_provider_request(provider, "success", 0.05 + (0.02 * hash(provider) % 5))
                metrics.update_provider_success_rate(provider, "1h", 0.9 + (0.05 * hash(provider) % 2))
            
            # Should not raise exceptions
            assert True
    
    def test_schema_validation_metrics_integration(self):
        """Test integration with schema validation system"""
        with patch('backend.services.odds_aggregation_metrics.PROMETHEUS_AVAILABLE', True):
            metrics = OddsAggregationMetrics(enabled=True)
            
            # Simulate schema validation results
            validation_results = [
                ("draftkings", "odds_response", "success", None, None),
                ("fanduel", "odds_response", "warning", "missing_optional_field", "warning"),
                ("betmgm", "odds_response", "error", "invalid_format", "error")
            ]
            
            for provider, schema_type, result, error_type, severity in validation_results:
                metrics.record_schema_validation(provider, schema_type, result, error_type, severity)
            
            # Should not raise exceptions
            assert True


if __name__ == "__main__":
    pytest.main([__file__])