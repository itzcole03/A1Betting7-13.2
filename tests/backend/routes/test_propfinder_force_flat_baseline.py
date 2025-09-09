"""
Test suite for PropFinder routes with force_flat_baseline functionality
"""
import pytest
from fastapi.testclient import TestClient
from backend.core.app import create_app


@pytest.fixture
def client():
    """Create test client"""
    app = create_app()
    return TestClient(app)


class TestPropFinderForceFlatBaseline:
    """Test force_flat_baseline functionality in PropFinder routes"""
    
    def test_force_flat_baseline_route_parameter_accepted(self, client):
        """Test that force_flat_baseline parameter is accepted by the route"""
        response = client.get("/api/propfinder/opportunities?limit=3&force_flat_baseline=true")
        
        assert response.status_code == 200
        
        # Should have standard API response structure
        data = response.json()
        assert "data" in data
        
    def test_force_flat_baseline_ensures_movement_fields_non_null(self, client):
        """Test that force_flat_baseline=true ensures all movement fields are non-null"""
        response = client.get("/api/propfinder/opportunities?limit=5&force_flat_baseline=true")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have opportunities in nested structure
        opportunities = data["data"]["opportunities"]
        assert len(opportunities) > 0
        
        # Check each opportunity has non-null movement fields
        for opp in opportunities:
            # Movement fields should be non-null
            assert opp.get("openingLine") is not None, f"Opportunity {opp.get('id')} has null openingLine"
            assert opp.get("latestLine") is not None, f"Opportunity {opp.get('id')} has null latestLine"
            assert opp.get("movementDirection") is not None, f"Opportunity {opp.get('id')} has null movementDirection"
            assert opp.get("lineChange") is not None, f"Opportunity {opp.get('id')} has null lineChange"
    
    def test_force_flat_baseline_creates_flat_movement(self, client):
        """Test that force_flat_baseline creates flat movement with zero changes"""
        response = client.get("/api/propfinder/opportunities?limit=3&force_flat_baseline=true")
        
        assert response.status_code == 200
        data = response.json()
        
        opportunities = data["data"]["opportunities"]
        assert len(opportunities) > 0
        
        # Check each opportunity has flat movement characteristics
        for opp in opportunities:
            # Movement direction should be "flat"
            assert opp.get("movementDirection") == "flat", f"Opportunity {opp.get('id')} not flat: {opp.get('movementDirection')}"
            
            # Line change should be 0.0
            assert opp.get("lineChange") == 0.0, f"Opportunity {opp.get('id')} has non-zero lineChange: {opp.get('lineChange')}"
    
    def test_force_flat_baseline_false_preserves_normal_behavior(self, client):
        """Test that force_flat_baseline=false preserves normal behavior"""
        response = client.get("/api/propfinder/opportunities?limit=3&force_flat_baseline=false")
        
        assert response.status_code == 200
        data = response.json()
        
        opportunities = data["data"]["opportunities"]
        assert len(opportunities) > 0
        
        # Normal behavior - doesn't force flat movement
        # Just ensure it doesn't crash and returns data
        assert len(opportunities) > 0
    
    def test_force_flat_baseline_contract_validation(self, client):
        """Test contract validation for force_flat_baseline"""
        response = client.get("/api/propfinder/opportunities?limit=2&force_flat_baseline=true&diagnostics=true")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        opportunities = data["data"]["opportunities"]
        assert len(opportunities) > 0
        
        # Check contract validation fields
        for opp_data in opportunities:
            # Should have movement fields that can be validated
            assert opp_data.get("movementDirection") == "flat"
            assert opp_data.get("lineChange") == 0.0
    
    def test_force_flat_baseline_with_other_parameters(self, client):
        """Test that force_flat_baseline works with other query parameters"""
        response = client.get(
            "/api/propfinder/opportunities"
            "?force_flat_baseline=true"
            "&limit=2"
            "&sports=NBA,MLB"
            "&confidence_min=70"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should still apply force_flat_baseline even with filters
        opportunities = data["data"]["opportunities"]
        for opp in opportunities:
            assert opp.get("movementDirection") == "flat"
            assert opp.get("lineChange") == 0.0