"""Test CLV metrics failure path handling."""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


@pytest.mark.clv
def test_clv_metrics_failure_path():
    """Test that CLV enrichment failure increments failure counter but returns 200."""
    with patch('backend.services.unified_config.unified_config') as mock_config:
        # Mock config to return enabled CLV metrics
        mock_performance_config = MagicMock()
        mock_performance_config.enable_clv_metrics = True
        mock_config.get_config.return_value.performance = mock_performance_config
        
        # Mock the CLV metrics service
        with patch('backend.services.clv_metrics.CLVMetricsService') as mock_clv_service:
            mock_clv_instance = MagicMock()
            mock_clv_instance.record_failure.return_value = None
            mock_clv_service.return_value = mock_clv_instance
            
            # Mock the propfinder service
            with patch('backend.services.simple_propfinder_service.SimplePropFinderService') as mock_service:
                mock_instance = MagicMock()
                mock_opportunities = [
                    {
                        "id": "test1",
                        "player": "Test Player",
                        "team": "TEST",
                        "sport": "MLB",
                        "market": "Hits",
                        "line": 1.5,
                        "odds": 110,
                        "confidence": 75.0
                    }
                ]
                mock_instance.get_opportunities.return_value = mock_opportunities
                mock_service.return_value = mock_instance
                
                # Mock CLV computation to raise exception
                def mock_attach_clv_data_fail(opportunities):
                    raise Exception("CLV computation failed")
                
                with patch.object(mock_instance, 'attach_clv_data', side_effect=mock_attach_clv_data_fail):
                    
                    from backend.main import app
                    client = TestClient(app)
                    
                    # Test with include_clv=1 - should still return 200
                    response = client.get("/api/propfinder/opportunities?include_clv=1")
                    assert response.status_code == 200
                    data = response.json()
                    assert "data" in data
                    assert "opportunities" in data["data"]
                    
                    # Should still have opportunities without clv_metrics
                    if data["data"]["opportunities"]:
                        opp = data["data"]["opportunities"][0]
                        assert "clv_metrics" not in opp
                    
                    # Verify failure was recorded
                    mock_clv_instance.record_failure.assert_called()


@pytest.mark.clv
def test_clv_metrics_service_failure_graceful():
    """Test that CLV metrics service failures don't affect the response."""
    with patch('backend.services.unified_config.unified_config') as mock_config:
        # Mock config to return enabled CLV metrics
        mock_performance_config = MagicMock()
        mock_performance_config.enable_clv_metrics = True
        mock_config.get_config.return_value.performance = mock_performance_config
        
        # Mock the CLV metrics service to raise exception
        with patch('backend.services.clv_metrics.CLVMetricsService') as mock_clv_service:
            mock_clv_service.side_effect = Exception("Metrics service unavailable")
            
            # Mock the propfinder service
            with patch('backend.services.simple_propfinder_service.SimplePropFinderService') as mock_service:
                mock_instance = MagicMock()
                mock_opportunities = [
                    {
                        "id": "test1",
                        "player": "Test Player",
                        "team": "TEST",
                        "sport": "MLB",
                        "market": "Hits",
                        "line": 1.5,
                        "odds": 110,
                        "confidence": 75.0
                    }
                ]
                mock_instance.get_opportunities.return_value = mock_opportunities
                mock_service.return_value = mock_instance
                
                from backend.main import app
                client = TestClient(app)
                
                # Test with include_clv=1 - should still return 200
                response = client.get("/api/propfinder/opportunities?include_clv=1")
                assert response.status_code == 200
                data = response.json()
                assert "data" in data
                assert "opportunities" in data["data"]