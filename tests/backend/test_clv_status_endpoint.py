"""
Tests for CLV status probe endpoint

Focused testing for the lightweight CLV runtime status endpoint that provides
debugging visibility without triggering enrichment operations.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_clv_status_initial():
    """Test CLV status endpoint returns valid initial state"""
    r = client.get("/api/propfinder/clv-status")
    assert r.status_code == 200
    
    body = r.json()
    assert body["success"] is True
    assert "data" in body
    
    data = body["data"]
    assert "status" in data
    # Should be pending or degraded before any call
    assert data["status"] in ("pending", "degraded", "ready")
    
    # Check required fields are present
    assert "lastRequestedEpoch" in data
    assert "lastRequestedIso" in data
    assert "lastIncludeParam" in data
    assert "lastFeatureFlagEnabled" in data
    assert "lastComputationSucceeded" in data
    assert "lastReturnedWithCLV" in data
    assert "lastOpportunityCount" in data
    assert "lastError" in data


def test_clv_status_after_request():
    """Test CLV status reflects last opportunities request"""
    # Make an opportunities request first
    client.get("/api/propfinder/opportunities?limit=3&include_clv=false")
    
    # Check status endpoint reflects the request
    r = client.get("/api/propfinder/clv-status")
    assert r.status_code == 200
    
    data = r.json()["data"]
    assert data["lastOpportunityCount"] >= 0
    assert data["lastIncludeParam"] is False
    assert data["lastRequestedEpoch"] is not None
    assert data["lastRequestedIso"] is not None


def test_clv_status_after_clv_enabled_request():
    """Test CLV status reflects CLV-enabled request"""
    # Make a CLV-enabled opportunities request
    client.get("/api/propfinder/opportunities?limit=3&include_clv=true")
    
    # Check status endpoint reflects the CLV request
    r = client.get("/api/propfinder/clv-status")
    assert r.status_code == 200
    
    data = r.json()["data"]
    assert data["lastIncludeParam"] is True
    assert data["lastRequestedEpoch"] is not None
    
    # CLV computation may succeed or fail, but request should be tracked
    assert isinstance(data["lastComputationSucceeded"], bool)
    assert isinstance(data["lastReturnedWithCLV"], bool)


def test_clv_status_does_not_trigger_enrichment():
    """Test that status endpoint itself doesn't trigger CLV processing"""
    # Get initial status
    r1 = client.get("/api/propfinder/clv-status")
    initial_epoch = r1.json()["data"]["lastRequestedEpoch"]
    
    # Call status endpoint again
    r2 = client.get("/api/propfinder/clv-status")
    second_epoch = r2.json()["data"]["lastRequestedEpoch"]
    
    # Status endpoint should not update the last requested time
    assert initial_epoch == second_epoch


def test_clv_status_error_handling():
    """Test CLV status endpoint handles errors gracefully"""
    r = client.get("/api/propfinder/clv-status")
    assert r.status_code == 200
    
    # Should not return error status unless there's an actual error
    data = r.json()["data"]
    if data["status"] == "error":
        assert "error" in data
    else:
        assert data["status"] in ("pending", "degraded", "ready")