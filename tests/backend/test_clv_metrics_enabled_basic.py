"""Test CLV metrics with feature flag enabled (basic functionality)."""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.clv
def test_clv_metrics_enabled_basic(mock_clv_enabled_config):
    """Test that CLV metrics work when feature flag is enabled."""
    # Mock the CLV metrics service
    with patch('backend.services.clv_metrics.CLVMetricsService') as mock_clv_service:
        mock_clv_instance = MagicMock()
        # Mock successful metrics recording
        mock_clv_instance.record_success.return_value = None
        mock_clv_instance.get_snapshot.return_value = {
            "success_rate": 95.5,
            "failure_rate": 4.5,
            "avg_latency_ms": 120.0,
            "processed_total": 100,
            "enabled": True
        }
        mock_clv_service.return_value = mock_clv_instance
        
        from backend.main import app
        client = TestClient(app)
        
        # Test metrics-summary returns enabled:true with data
        response = client.get("/api/propfinder/opportunities/metrics-summary")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["enabled"] == True
        assert "success_rate" in data["data"]
        assert "processed_total" in data["data"]


@pytest.mark.clv
def test_clv_opportunities_include_clv_metrics(mock_clv_enabled_config, clv_test_client):
    """Test that include_clv=1 adds CLV metrics when enabled."""
    # Mock the CLV metrics service
    with patch('backend.services.clv_metrics.CLVMetricsService') as mock_clv_service:
        mock_clv_instance = MagicMock()
        mock_clv_instance.record_success.return_value = None
        mock_clv_service.return_value = mock_clv_instance
        
        # Mock CLV computation for batch processing
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
            
            # Test with include_clv=1
            response = clv_test_client.get("/api/propfinder/opportunities?include_clv=1")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert "opportunities" in data["data"]
            
            # Should have clv_metrics in opportunities
            if data["data"]["opportunities"]:
                opp = data["data"]["opportunities"][0]
                assert "clv_metrics" in opp
                assert "clv_estimate" in opp["clv_metrics"]