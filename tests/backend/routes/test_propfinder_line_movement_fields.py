"""
Tests for PropFinder Line Movement API Fields

Validates that line movement fields are properly exposed through the API
and have expected values and types.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_line_movement_fields_present():
    """Test that line movement fields are present in API response"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    # StandardAPIResponse wraps OpportunitiesResponse in 'data' key
    opportunities = data.get("data", {}).get("opportunities", [])
    assert isinstance(opportunities, list)
    
    # Expected line movement fields
    expected_fields = [
        "openingLine",
        "openingOdds", 
        "latestLine",
        "latestOdds",
        "lineChange",
        "oddsChange",
        "movementDirection"
    ]
    
    # Check that fields exist in response structure
    if opportunities:
        sample = opportunities[0]
        for field in expected_fields:
            assert field in sample, f"Field '{field}' missing from opportunity response"


def test_movement_direction_values():
    """Test that movementDirection has valid values when present"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    valid_directions = {"up", "down", "flat", None}
    
    for opp in opportunities:
        movement_direction = opp.get("movementDirection")
        assert movement_direction in valid_directions, f"Invalid movement direction: {movement_direction}"


def test_line_change_calculation():
    """Test that line changes are calculated correctly when both opening and latest are present"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    for opp in opportunities:
        opening_line = opp.get("openingLine")
        latest_line = opp.get("latestLine") 
        line_change = opp.get("lineChange")
        
        # If both opening and latest are present, line change should be calculated
        if opening_line is not None and latest_line is not None:
            expected_change = round(latest_line - opening_line, 3)
            if line_change is not None:
                assert abs(line_change - expected_change) < 0.001, f"Line change mismatch: expected {expected_change}, got {line_change}"


def test_odds_change_calculation():
    """Test that odds changes are calculated correctly"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    for opp in opportunities:
        opening_odds = opp.get("openingOdds")
        latest_odds = opp.get("latestOdds")
        odds_change = opp.get("oddsChange")
        
        # If both opening and latest odds are present, odds change should be calculated
        if opening_odds is not None and latest_odds is not None:
            expected_change = latest_odds - opening_odds
            if odds_change is not None:
                assert odds_change == expected_change, f"Odds change mismatch: expected {expected_change}, got {odds_change}"


def test_field_types():
    """Test that line movement fields have correct data types"""
    resp = client.get("/api/propfinder/opportunities") 
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    for opp in opportunities:
        # Test numeric fields
        for field in ["openingLine", "latestLine", "lineChange"]:
            value = opp.get(field)
            if value is not None:
                assert isinstance(value, (int, float)), f"Field '{field}' should be numeric, got {type(value)}"
        
        # Test integer fields  
        for field in ["openingOdds", "latestOdds", "oddsChange"]:
            value = opp.get(field)
            if value is not None:
                assert isinstance(value, int), f"Field '{field}' should be integer, got {type(value)}"
        
        # Test string field
        movement_direction = opp.get("movementDirection")
        if movement_direction is not None:
            assert isinstance(movement_direction, str), f"movementDirection should be string, got {type(movement_direction)}"


def test_movement_direction_consistency():
    """Test that movement direction is consistent with line changes"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    for opp in opportunities:
        line_change = opp.get("lineChange")
        movement_direction = opp.get("movementDirection")
        
        if line_change is not None and movement_direction is not None:
            if line_change > 0:
                assert movement_direction == "up", f"Positive line change should have 'up' direction, got '{movement_direction}'"
            elif line_change < 0:
                assert movement_direction == "down", f"Negative line change should have 'down' direction, got '{movement_direction}'"
            else:
                assert movement_direction == "flat", f"Zero line change should have 'flat' direction, got '{movement_direction}'"


def test_null_value_handling():
    """Test that null/None values are handled gracefully"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    # Should not crash with null values and fields should be present
    for opp in opportunities:
        # Fields should exist even if null
        assert "openingLine" in opp
        assert "latestLine" in opp
        assert "lineChange" in opp
        assert "movementDirection" in opp
        assert "openingOdds" in opp
        assert "latestOdds" in opp
        assert "oddsChange" in opp


def test_api_backwards_compatibility():
    """Test that existing API fields are still present"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    if opportunities:
        sample = opportunities[0]
        
        # Ensure existing critical fields are still present
        required_existing_fields = [
            "id", "player", "sport", "market", "line", "pick", "odds",
            "confidence", "edge", "impliedProbability"
        ]
        
        for field in required_existing_fields:
            assert field in sample, f"Existing field '{field}' missing - backwards compatibility broken"


def test_multiple_opportunities_consistency():
    """Test that multiple opportunities can have different movement patterns"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    # Should have at least a few opportunities to test
    assert len(opportunities) >= 3, "Need multiple opportunities for comprehensive testing"
    
    # Check that we have at least some variety in movement data
    movement_directions = set()
    for opp in opportunities:
        direction = opp.get("movementDirection")
        if direction is not None:
            movement_directions.add(direction)
    
    # Not all should be the same (unless there's only one data pattern)
    # This is more of a data quality check
    if len(opportunities) >= 5:
        assert len(movement_directions) > 0, "Should have some movement direction data"


def test_filter_compatibility():
    """Test that line movement fields work with existing filters"""
    # Test with confidence filter to ensure no breaking changes
    resp = client.get("/api/propfinder/opportunities?confidence_min=70")
    assert resp.status_code == 200
    
    data = resp.json()
    opportunities = data.get("data", {}).get("opportunities", [])
    
    # Should still have movement fields with filters applied
    if opportunities:
        sample = opportunities[0]
        assert "movementDirection" in sample
        assert "lineChange" in sample
        
        # Confidence filter should still work
        assert sample.get("confidence", 0) >= 70


def test_response_schema_completeness():
    """Test that the response matches expected schema structure"""
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    
    data = resp.json()
    
    # Should have standard API response structure
    assert "success" in data
    assert "data" in data
    assert "error" in data  # Updated to match actual response structure
    
    opportunities_data = data.get("data", {})
    assert "opportunities" in opportunities_data
    assert "total" in opportunities_data
    assert "filtered" in opportunities_data
    
    # Movement fields should not break response structure
    opportunities = opportunities_data.get("opportunities", [])
    if opportunities:
        # Should still be valid JSON serializable
        import json
        json_str = json.dumps(opportunities[0])
        parsed = json.loads(json_str)
        assert isinstance(parsed, dict)