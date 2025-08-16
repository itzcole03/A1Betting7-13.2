"""
Auth Route Prefix Conformance Test

Ensures that auth routes follow the expected /api/auth prefix pattern
to prevent accidental direct mount without API prefix.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

def test_auth_route_prefix_conformance():
    """
    Test that auth routes are properly mounted with /api prefix.
    
    This prevents the 404 /api/auth/login issue by ensuring routes
    are accessible under the correct prefix structure.
    """
    client = TestClient(app)
    
    # Test that auth routes are accessible with /api prefix
    auth_endpoints = [
        ("/api/auth/login", "POST"),
        ("/api/auth/login", "HEAD"),  # Readiness check
        ("/api/auth/logout", "POST"),
        ("/api/auth/me", "GET"),
    ]
    
    for endpoint, method in auth_endpoints:
        response = getattr(client, method.lower())(endpoint)
        
        # We expect proper responses, not 404 (which would indicate wrong mounting)
        assert response.status_code != 404, f"{method} {endpoint} returned 404 - check route mounting"
        
        # For HEAD /api/auth/login, we expect 204 (readiness check)
        if endpoint == "/api/auth/login" and method == "HEAD":
            assert response.status_code == 204, "Auth readiness check should return 204"

def test_auth_routes_not_directly_mounted():
    """
    Ensure auth routes are NOT accessible without /api prefix.
    
    This prevents confusion and ensures consistent API structure.
    """
    client = TestClient(app)
    
    # These should NOT be accessible (should return 404)
    direct_endpoints = [
        ("/auth/login", "POST"),
        ("/auth/login", "HEAD"),
        ("/auth/logout", "POST"),
        ("/auth/me", "GET"),
    ]
    
    for endpoint, method in direct_endpoints:
        response = getattr(client, method.lower())(endpoint)
        
        # We expect 404 since these should not be directly mounted
        assert response.status_code == 404, f"{method} {endpoint} should not be accessible without /api prefix"

def test_auth_login_readiness_check():
    """
    Test the HEAD /api/auth/login readiness check endpoint.
    
    This allows monitoring systems to check auth service health
    without requiring valid credentials or mutating state.
    """
    client = TestClient(app)
    
    response = client.head("/api/auth/login")
    
    # Should return 204 No Content for readiness
    assert response.status_code == 204
    
    # Should have no response body
    assert response.content == b""
    
    # Response should be fast (basic readiness check)
    # Note: In real implementation, this might check DB connectivity, etc.

if __name__ == "__main__":
    pytest.main([__file__, "-v"])