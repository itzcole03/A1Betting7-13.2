"""Test CLV metrics with feature flag disabled."""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.clv
def test_clv_metrics_disabled_flag(mock_clv_disabled_config):
    """Test that CLV metrics gracefully handle disabled feature flag."""
    from backend.main import app
    client = TestClient(app)
    
    # Test metrics-summary returns enabled:false
    response = client.get("/api/propfinder/opportunities/metrics-summary")
    
    # Debug any validation errors
    if response.status_code != 200:
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        try:
            error_data = response.json()
            print(f"Error data: {error_data}")
        except:
            print("Failed to parse as JSON")
    
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["enabled"] == False
    assert data["data"]["reason"] == "disabled_by_flag"


@pytest.mark.clv  
def test_clv_opportunities_ignore_clv_when_disabled(mock_clv_disabled_config, clv_test_client):
    """Test that include_clv=1 is ignored when feature flag is disabled."""
    # Test with include_clv=1 - should still work but not include CLV data
    response = clv_test_client.get("/api/propfinder/opportunities?include_clv=1")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "opportunities" in data["data"]
    
    # Should not have clv_metrics in any opportunity
    for opp in data["data"]["opportunities"]:
        assert "clv_metrics" not in opp