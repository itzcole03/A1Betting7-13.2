"""Test CLV metrics failure and graceful degradation paths."""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.clv
def test_clv_metrics_failure_path(mock_clv_enabled_config, clv_test_client):
    """Test that CLV failures are handled gracefully."""
    # Mock CLV service to raise exception
    with patch('backend.services.clv_metrics.CLVMetricsService') as mock_clv_service:
        mock_clv_instance = MagicMock()
        mock_clv_instance.record_failure.return_value = None
        mock_clv_service.return_value = mock_clv_instance
        
        # Mock CLV computation to fail
        with patch('backend.services.clv_computation.compute_clv_batch') as mock_clv_batch:
            mock_clv_batch.side_effect = Exception("CLV computation failed")
            
            # Request should still work, just without CLV data
            response = clv_test_client.get("/api/propfinder/opportunities?include_clv=1")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert "opportunities" in data["data"]
            
            # Should not have clv_metrics due to failure
            for opp in data["data"]["opportunities"]:
                assert "clv_metrics" not in opp


@pytest.mark.clv
def test_clv_metrics_service_failure_graceful(mock_clv_enabled_config, clv_test_client):
    """Test that CLV service failures don't break the endpoint."""
    # Mock CLV computation to fail
    with patch('backend.services.clv_computation.compute_clv_batch') as mock_clv_batch:
        mock_clv_batch.side_effect = Exception("CLV computation failed")
        
        # Request should still work
        response = clv_test_client.get("/api/propfinder/opportunities?include_clv=1")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "opportunities" in data["data"]
        
        # Should have opportunities but no CLV metrics
        assert len(data["data"]["opportunities"]) > 0
        for opp in data["data"]["opportunities"]:
            assert "clv_metrics" not in opp