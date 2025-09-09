"""Test CLV diagnostic parameter functionality."""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


@pytest.mark.clv
def test_clv_diag_parameter(mock_clv_enabled_config, clv_test_client):
    """Test that clv_diag=1 returns diagnostic subsection."""
    # Mock the CLV metrics service
    with patch('backend.services.clv_metrics.CLVMetricsService') as mock_clv_service:
        mock_clv_instance = MagicMock()
        mock_clv_instance.record_success.return_value = None
        mock_clv_instance.get_snapshot.return_value = {
            "success_rate": 95.5,
            "failure_rate": 4.5,
            "avg_latency_ms": 120.0,
            "processed_total": 100,
            "enabled": True
        }
        mock_clv_service.return_value = mock_clv_instance
        
        # Mock CLV computation
        with patch('backend.services.clv_computation.compute_clv_for_opportunity') as mock_clv_compute:
            mock_clv_compute.return_value = {
                "clv_estimate": 0.15,
                "market_efficiency": 0.85,
                "historical_edge": 0.12,
                "line_movement_indicator": "stable"
            }
            
            # Test with clv_diag=1
            response = clv_test_client.get("/api/propfinder/opportunities?clv_diag=1")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            
            # Should have clv_diagnostics section
            assert "clv_diagnostics" in data["data"]
            diag = data["data"]["clv_diagnostics"]
            
            # Check diagnostic fields
            expected_fields = ["success_rate", "failure_rate", "avg_latency_ms", "window_size"]
            for field in expected_fields:
                assert field in diag, f"Missing diagnostic field: {field}"


@pytest.mark.clv
def test_clv_diag_with_include_clv(mock_clv_enabled_config, clv_test_client):
    """Test that clv_diag=1 and include_clv=1 work together."""
    # Mock the CLV metrics service
    with patch('backend.services.clv_metrics.CLVMetricsService') as mock_clv_service:
        mock_clv_instance = MagicMock()
        mock_clv_instance.record_success.return_value = None
        mock_clv_instance.get_snapshot.return_value = {
            "success_rate": 95.5,
            "failure_rate": 4.5,
            "avg_latency_ms": 120.0,
            "processed_total": 100,
            "enabled": True,
            "window_size": 1000
        }
        mock_clv_service.return_value = mock_clv_instance
        
        # Mock CLV computation for individual opportunities
        with patch('backend.services.clv_computation.compute_clv_batch') as mock_clv_batch:
            def mock_batch_clv(opportunities):
                enriched = []
                for opp in opportunities:
                    opp_copy = opp.copy()
                    opp_copy["clv_metrics"] = {
                        "clv_estimate": 0.15,
                        "market_efficiency": 0.85,
                        "historical_edge": 0.12,
                        "line_movement_indicator": "stable"
                    }
                    enriched.append(opp_copy)
                return enriched
            
            mock_clv_batch.side_effect = mock_batch_clv
            
            # Test with both parameters
            response = clv_test_client.get("/api/propfinder/opportunities?include_clv=1&clv_diag=1")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            
            # Should have both clv_metrics in opportunities and clv_diagnostics
            assert "clv_diagnostics" in data["data"]
            if data["data"]["opportunities"]:
                opp = data["data"]["opportunities"][0]
                assert "clv_metrics" in opp