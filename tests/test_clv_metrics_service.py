"""
Tests for CLV Metrics Service with Feature Flag Support

Comprehensive test suite for CLV metrics functionality including:
- Feature flag behavior (enabled/disabled)
- Metrics recording and snapshots  
- Graceful degradation scenarios
- API endpoint integration
"""

import pytest
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Setup environment before importing the app
os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from backend.main import app
from backend.services.clv_metrics import CLVMetricsService, clv_metrics

test_client = TestClient(app)


@pytest.fixture
def clean_clv_service():
    """Provide a fresh CLV metrics service for each test"""
    # Reset the singleton instance
    CLVMetricsService._instance = None
    service = CLVMetricsService()
    yield service
    # Cleanup
    CLVMetricsService._instance = None


class TestCLVMetricsFeatureFlag:
    """Test CLV metrics feature flag behavior"""
    
    @patch.dict(os.environ, {"ENABLE_CLV_METRICS": "0"})
    def test_clv_metrics_disabled_flag(self, clean_clv_service):
        """Test CLV metrics behavior when disabled by feature flag"""
        with patch('backend.services.clv_metrics.unified_config') as mock_config:
            mock_config.get_config.return_value.performance.enable_clv_metrics = False
            
            service = CLVMetricsService()
            assert not service.enabled
            
            # Operations should be no-ops when disabled
            service.record_success(100.0)
            service.record_failure(200.0)
            service.record_batch(5, 150.0)
            
            snapshot = service.get_snapshot()
            assert not snapshot["enabled"]
            assert snapshot["reason"] == "disabled_by_flag"
    
    @patch.dict(os.environ, {"ENABLE_CLV_METRICS": "1"})
    def test_clv_metrics_enabled_flag(self, clean_clv_service):
        """Test CLV metrics behavior when enabled by feature flag"""
        with patch('backend.services.clv_metrics.unified_config') as mock_config:
            mock_config.get_config.return_value.performance.enable_clv_metrics = True
            
            service = CLVMetricsService()
            assert service.enabled
            
            # Operations should work normally when enabled
            service.record_success(100.0)
            service.record_batch(3, 50.0)
            
            snapshot = service.get_snapshot()
            assert snapshot["enabled"]
            assert snapshot["processed_total"] > 0
    
    def test_metrics_summary_endpoint_disabled(self):
        """Test /opportunities/metrics-summary when CLV is disabled"""
        with patch('backend.services.unified_config.unified_config') as mock_config:
            mock_config.get_config.return_value.performance.enable_clv_metrics = False
            
            response = test_client.get("/api/propfinder/opportunities/metrics-summary")
            assert response.status_code == 200
            
            data = response.json()
            assert data["success"] is True
            assert data["data"]["enabled"] is False
            assert "disabled_by_flag" in data["data"]["reason"]
    
    def test_include_clv_param_with_disabled_flag(self):
        """Test include_clv=1 parameter when CLV is disabled by flag"""
        with patch('backend.services.unified_config.unified_config') as mock_config:
            mock_config.get_config.return_value.performance.enable_clv_metrics = False
            
            response = test_client.get("/api/propfinder/opportunities?include_clv=1")
            assert response.status_code == 200
            
            # Should return opportunities without CLV data, no 4xx error
            data = response.json()
            assert data["success"] is True
            assert "data" in data
            assert "opportunities" in data["data"]


class TestCLVMetricsEnabled:
    """Test CLV metrics functionality when enabled"""
    
    @patch.dict(os.environ, {"ENABLE_CLV_METRICS": "1"})
    def test_clv_metrics_basic_recording(self, clean_clv_service):
        """Test basic metrics recording functionality"""
        with patch('backend.services.clv_metrics.unified_config') as mock_config:
            mock_config.get_config.return_value.performance.enable_clv_metrics = True
            
            service = CLVMetricsService()
            
            # Record some metrics
            service.record_success(150.0)
            service.record_success(200.0)
            service.record_failure(300.0)
            service.record_batch(5, 100.0)
            service.record_cache_hit()
            service.record_cache_miss()
            
            snapshot = service.get_snapshot()
            
            assert snapshot["enabled"] is True
            assert snapshot["processed_total"] == 3  # 2 success + 1 failure
            assert snapshot["success_rate"] == 66.67  # 2/3 * 100
            assert snapshot["failure_rate"] == 33.33  # 1/3 * 100
            assert snapshot["avg_latency_ms"] == 216.67  # (150+200+300)/3
            assert snapshot["cache_hit_rate"] == 50.0  # 1/(1+1) * 100
    
    @patch.dict(os.environ, {"ENABLE_CLV_METRICS": "1"})
    def test_clv_timing_context_success(self, clean_clv_service):
        """Test CLV timing context manager for successful operations"""
        with patch('backend.services.clv_metrics.unified_config') as mock_config:
            mock_config.get_config.return_value.performance.enable_clv_metrics = True
            
            service = CLVMetricsService()
            
            # Use timing context successfully
            with service.timing_context():
                pass  # Simulate successful operation
            
            snapshot = service.get_snapshot()
            assert snapshot["processed_total"] == 1
            assert snapshot["success_rate"] == 100.0
            assert snapshot["failure_rate"] == 0.0
    
    @patch.dict(os.environ, {"ENABLE_CLV_METRICS": "1"})
    def test_clv_timing_context_failure(self, clean_clv_service):
        """Test CLV timing context manager for failed operations"""
        with patch('backend.services.clv_metrics.unified_config') as mock_config:
            mock_config.get_config.return_value.performance.enable_clv_metrics = True
            
            service = CLVMetricsService()
            
            # Use timing context with exception
            with pytest.raises(ValueError):
                with service.timing_context():
                    raise ValueError("Simulated CLV enrichment failure")
            
            snapshot = service.get_snapshot()
            assert snapshot["processed_total"] == 1
            assert snapshot["success_rate"] == 0.0
            assert snapshot["failure_rate"] == 100.0


class TestCLVMetricsFailurePath:
    """Test CLV metrics failure scenarios"""
    
    @patch('backend.services.clv_metrics.PROMETHEUS_AVAILABLE', False)
    def test_clv_metrics_without_prometheus(self, clean_clv_service):
        """Test CLV metrics behavior when prometheus_client is not available"""
        service = CLVMetricsService()
        
        # Should still work with mock metrics
        service.record_success(100.0)
        service.record_failure(200.0)
        
        snapshot = service.get_snapshot()
        assert snapshot["enabled"] is True
        assert snapshot["prometheus_available"] is False
    
    def test_clv_metrics_graceful_failure(self, clean_clv_service):
        """Test metrics recording failures are handled gracefully"""
        service = CLVMetricsService()
        
        # Mock metric objects to raise exceptions
        service.clv_success_rate_total = MagicMock()
        service.clv_success_rate_total.labels.return_value.inc.side_effect = Exception("Metric error")
        
        # Should not raise exception, just log debug message
        service.record_success(100.0)
        
        # Snapshot should still work
        snapshot = service.get_snapshot()
        assert snapshot["enabled"] is True
    
    def test_clv_diagnostics_with_error(self):
        """Test CLV diagnostics endpoint handles errors gracefully"""
        with patch('backend.services.clv_metrics.clv_metrics') as mock_metrics:
            mock_metrics.get_snapshot.side_effect = Exception("Service error")
            
            response = test_client.get("/api/propfinder/opportunities?clv_diag=1")
            assert response.status_code == 200
            
            # Should still return valid response, not crash
            data = response.json()
            assert data["success"] is True


class TestCLVDiagnosticParameter:
    """Test CLV diagnostic parameter functionality"""
    
    def test_clv_diag_parameter_enabled(self):
        """Test clv_diag=1 returns diagnostic information"""
        response = test_client.get("/api/propfinder/opportunities?clv_diag=1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # Should include diagnostic metadata
        assert "meta" in data["data"]
        assert "clv_diagnostics" in data["data"]["meta"]
    
    def test_clv_diag_parameter_disabled(self):
        """Test clv_diag=0 does not include diagnostics"""
        response = test_client.get("/api/propfinder/opportunities?clv_diag=0")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # Should not include detailed CLV diagnostics
        if "meta" in data["data"] and "clv_diagnostics" in data["data"]["meta"]:
            # If present, should indicate diagnostics are disabled
            assert data["data"]["meta"]["clv_diagnostics"].get("enabled") is False
    
    def test_clv_diag_with_metrics_summary(self):
        """Test clv_diag=1 includes metrics summary information"""
        response = test_client.get("/api/propfinder/opportunities?clv_diag=1")
        assert response.status_code == 200
        
        data = response.json()
        diag = data["data"]["meta"]["clv_diagnostics"]
        
        # Should contain metrics summary fields
        expected_fields = ["enabled", "success_rate", "failure_rate", "avg_latency_ms", "processed_total"]
        for field in expected_fields:
            assert field in diag, f"Missing field: {field}"


@pytest.mark.clv
class TestCLVMetricsIntegration:
    """Integration tests for CLV metrics with PropFinder API"""
    
    def test_propfinder_with_clv_metrics(self, mock_clv_enabled_config, clv_test_client):
        """Test PropFinder endpoint with CLV metrics integration"""
        # Mock CLV computation 
        with patch('backend.services.clv_computation.compute_clv_batch') as mock_clv_batch:
            mock_clv_batch.return_value = []  # Return empty list for simplicity
            
            response = clv_test_client.get("/api/propfinder/opportunities?include_clv=1")
            assert response.status_code == 200
            
            data = response.json()
            assert data["success"] is True
    
    def test_propfinder_metrics_summary_endpoint(self):
        """Test the dedicated CLV metrics summary endpoint"""
        with patch('backend.services.clv_metrics.CLVMetricsService') as mock_service:
            mock_instance = MagicMock()
            mock_instance.get_snapshot.return_value = {
                "enabled": True,
                "success_rate": 95.0,
                "failure_rate": 5.0,
                "processed_total": 100
            }
            mock_service.return_value = mock_instance
            
            from backend.main import app
            client = TestClient(app)
            response = client.get("/api/propfinder/opportunities/metrics-summary")
            assert response.status_code == 200
            
            data = response.json()
            assert data["success"] is True
            
            # Should have CLV metrics summary structure
            summary = data["data"]
            assert "enabled" in summary
        if summary["enabled"]:
            assert "success_rate" in summary
            assert "failure_rate" in summary
            assert "avg_latency_ms" in summary
            assert "processed_total" in summary


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])