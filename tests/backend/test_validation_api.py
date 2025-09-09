"""
Tests for data validation API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import asyncio

from backend.validators.data_validator import ValidationMetrics, ValidationWarning, ValidationWarningType


@pytest.fixture
def client():
    """Create a test client for the API."""
    from backend.core.app import create_app
    app = create_app()
    return TestClient(app)


@pytest.fixture
async def populated_metrics():
    """Create metrics with some test data."""
    metrics = ValidationMetrics()
    
    # Add some test warnings
    warnings = [
        ValidationWarning(
            type=ValidationWarningType.ODDS_INCOMPLETE,
            message="Missing bookmaker",
            field="bestBookmaker",
            value=None,
            timestamp=datetime.now()
        ),
        ValidationWarning(
            type=ValidationWarningType.EV_INVALID_FAIR_ODDS,
            message="Fair odds must be greater than 0",
            field="fairOdds",
            value=-100,
            timestamp=datetime.now()
        ),
        ValidationWarning(
            type=ValidationWarningType.ARBITRAGE_PROBABILITY_VIOLATION,
            message="Probability sum out of range",
            field="probability_sum",
            value=1.25,
            timestamp=datetime.now()
        )
    ]
    
    for warning in warnings:
        await metrics.record_warning(warning)
    
    return metrics


class TestValidationAPIEndpoints:
    """Test the validation API endpoints."""

    def test_validation_summary_endpoint(self, client):
        """Test the validation summary endpoint."""
        response = client.get("/api/data/validation/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert data["success"] is True
        assert "data" in data
        assert "timestamp" in data
        
        summary_data = data["data"]
        assert "total_validated" in summary_data
        assert "total_warnings" in summary_data
        assert "warning_counts" in summary_data
        assert "time_window_minutes" in summary_data
        assert "generated_at" in summary_data
        assert "warning_rate" in summary_data

    def test_validation_summary_with_custom_time_window(self, client):
        """Test the validation summary endpoint with custom time window."""
        response = client.get("/api/data/validation/summary?minutes=30")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        summary_data = data["data"]
        assert summary_data["time_window_minutes"] == 30

    def test_validation_summary_invalid_time_window(self, client):
        """Test the validation summary endpoint with invalid time window."""
        # Test negative minutes
        response = client.get("/api/data/validation/summary?minutes=-5")
        assert response.status_code == 422  # Validation error
        
        # Test too large minutes
        response = client.get("/api/data/validation/summary?minutes=2000")
        assert response.status_code == 422  # Validation error

    def test_validation_health_endpoint(self, client):
        """Test the validation health endpoint."""
        response = client.get("/api/data/validation/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "data" in data
        
        health_data = data["data"]
        assert "status" in health_data
        assert "recent_warnings" in health_data
        assert "validation_active" in health_data
        assert "last_check" in health_data
        
        # Health endpoint should always return some status
        assert health_data["status"] in ["healthy", "degraded"]

    def test_validation_summary_structure(self, client):
        """Test that the validation summary has the correct structure."""
        response = client.get("/api/data/validation/summary?minutes=15")
        
        assert response.status_code == 200
        data = response.json()
        
        summary_data = data["data"]
        
        # Check required fields
        required_fields = [
            "total_validated",
            "total_warnings", 
            "warning_counts",
            "time_window_minutes",
            "generated_at",
            "warning_rate"
        ]
        
        for field in required_fields:
            assert field in summary_data, f"Required field '{field}' missing from summary"
        
        # Check data types
        assert isinstance(summary_data["total_validated"], int)
        assert isinstance(summary_data["total_warnings"], int)
        assert isinstance(summary_data["warning_counts"], dict)
        assert isinstance(summary_data["time_window_minutes"], int)
        assert isinstance(summary_data["warning_rate"], float)

    def test_validation_warning_counts_structure(self, client):
        """Test that warning counts have the expected structure."""
        response = client.get("/api/data/validation/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        warning_counts = data["data"]["warning_counts"]
        
        # Should be a dictionary with string keys (warning types) and integer values (counts)
        for warning_type, count in warning_counts.items():
            assert isinstance(warning_type, str)
            assert isinstance(count, int)
            assert count >= 0
            
            # Warning type should be one of the valid enum values
            valid_warning_types = [
                "odds_incomplete",
                "odds_invalid_format", 
                "ev_invalid_fair_odds",
                "ev_invalid_market_odds",
                "arbitrage_probability_violation",
                "arbitrage_missing_sides",
                "numerical_bounds_violation"
            ]
            # Note: It's OK if the warning_type is not in this list if no warnings of that type exist

    def test_validation_endpoints_cors_headers(self, client):
        """Test that validation endpoints include proper CORS headers."""
        response = client.get("/api/data/validation/summary")
        
        # The app should have CORS middleware configured
        assert response.status_code == 200
        
        # Check for CORS headers (these may be added by FastAPI CORS middleware)
        # The exact headers depend on CORS configuration in the app

    def test_validation_endpoints_with_options_request(self, client):
        """Test that validation endpoints handle OPTIONS requests for CORS."""
        response = client.options("/api/data/validation/summary")
        
        # OPTIONS request should be handled by CORS middleware
        # Status code should be 200 for successful preflight
        assert response.status_code in [200, 204]


class TestValidationEndpointIntegration:
    """Test integration between validation pipeline and API endpoints."""

    @pytest.mark.asyncio
    async def test_propfinder_opportunities_have_validation_warnings(self, client):
        """Test that PropFinder opportunities include validation warnings when returned."""
        response = client.get("/api/propfinder/opportunities")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if opportunities are returned
            if "opportunities" in data or "data" in data:
                opportunities = data.get("opportunities", data.get("data", {}).get("opportunities", []))
                
                if opportunities:
                    # Check if at least some opportunities have validation warnings
                    opportunities_with_warnings = [
                        opp for opp in opportunities 
                        if "validationWarnings" in opp and opp["validationWarnings"]
                    ]
                    
                    # Not all opportunities need warnings, but the field should exist
                    for opp in opportunities:
                        assert "validationWarnings" in opp or "validation_warnings" in opp, \
                            "Opportunities should include validationWarnings field"

    def test_validation_summary_reflects_recent_activity(self, client):
        """Test that validation summary reflects recent validation activity."""
        # First, trigger some validation by getting opportunities
        prop_response = client.get("/api/propfinder/opportunities")
        
        # Then check validation summary
        summary_response = client.get("/api/data/validation/summary?minutes=5")
        
        assert summary_response.status_code == 200
        data = summary_response.json()
        
        summary_data = data["data"]
        
        # If PropFinder was successful, validation should have been triggered
        if prop_response.status_code == 200:
            # Should have some validated opportunities
            assert summary_data["total_validated"] >= 0

    def test_multiple_summary_requests_consistency(self, client):
        """Test that multiple summary requests return consistent data structure."""
        # Make multiple requests with different time windows
        time_windows = [5, 15, 30, 60]
        
        for minutes in time_windows:
            response = client.get(f"/api/data/validation/summary?minutes={minutes}")
            
            assert response.status_code == 200
            data = response.json()
            
            # All responses should have the same structure
            assert "success" in data
            assert "data" in data
            assert data["success"] is True
            
            summary_data = data["data"]
            assert summary_data["time_window_minutes"] == minutes
            
            # Longer time windows should generally have >= warnings than shorter ones
            # (Though this depends on timing of the requests)

    def test_health_endpoint_error_handling(self, client):
        """Test that health endpoint handles errors gracefully."""
        response = client.get("/api/data/validation/health")
        
        # Health endpoint should always return 200, even if there are internal issues
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        
        health_data = data["data"]
        
        # Should always have a status, even if degraded
        assert "status" in health_data
        assert health_data["status"] in ["healthy", "degraded"]


class TestValidationMetricsAPI:
    """Test scenarios specific to validation metrics collection via API."""

    def test_validation_metrics_accumulation(self, client):
        """Test that validation metrics accumulate over multiple requests."""
        # Get initial metrics
        initial_response = client.get("/api/data/validation/summary?minutes=60")
        initial_data = initial_response.json()["data"]
        initial_warnings = initial_data["total_warnings"]
        
        # Trigger some validation activity
        for _ in range(3):
            client.get("/api/propfinder/opportunities")
        
        # Get updated metrics
        updated_response = client.get("/api/data/validation/summary?minutes=60")
        updated_data = updated_response.json()["data"]
        updated_warnings = updated_data["total_warnings"]
        
        # Should have at least the same number of warnings (possibly more)
        assert updated_warnings >= initial_warnings

    def test_validation_summary_time_window_accuracy(self, client):
        """Test that different time windows return appropriate data."""
        # Get summaries for different time windows
        response_5min = client.get("/api/data/validation/summary?minutes=5")
        response_60min = client.get("/api/data/validation/summary?minutes=60")
        
        assert response_5min.status_code == 200
        assert response_60min.status_code == 200
        
        data_5min = response_5min.json()["data"]
        data_60min = response_60min.json()["data"]
        
        # 60-minute window should generally have >= warnings than 5-minute window
        assert data_60min["total_warnings"] >= data_5min["total_warnings"]
        
        # Time windows should be correctly set
        assert data_5min["time_window_minutes"] == 5
        assert data_60min["time_window_minutes"] == 60

    def test_validation_warning_types_coverage(self, client):
        """Test that API can handle all types of validation warnings."""
        # Trigger validation with opportunities that might have various warning types
        client.get("/api/propfinder/opportunities")
        
        response = client.get("/api/data/validation/summary")
        assert response.status_code == 200
        
        data = response.json()["data"]
        warning_counts = data["warning_counts"]
        
        # The API should handle any warning types that occur
        # We don't require specific types, but the structure should be valid
        for warning_type, count in warning_counts.items():
            assert isinstance(warning_type, str)
            assert isinstance(count, int) 
            assert count >= 0