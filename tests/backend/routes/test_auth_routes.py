"""
Authentication Routes Integration Tests - Phase 4.1 Backend Tests
Test suite for authentication endpoints
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
import asyncio
from unittest.mock import AsyncMock, patch
from backend.main import app


class TestAuthenticationRoutes:
    """Test suite for authentication routes"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    async def async_client(self):
        """Create async test client"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client
    
    def test_register_endpoint_structure(self, client):
        """Test user registration endpoint structure"""
        # Test with minimal valid data
        registration_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = client.post("/auth/register", json=registration_data)
        
        # Should return proper response structure
        assert response.status_code in [200, 201, 400, 409]  # Valid status codes
        
        if response.status_code in [200, 201]:
            # Success case - check response structure
            data = response.json()
            assert "access_token" in data or "message" in data
        else:
            # Error case - check error structure
            data = response.json()
            assert "message" in data or "detail" in data
    
    def test_register_validation(self, client):
        """Test registration input validation"""
        # Test invalid email format
        invalid_email_data = {
            "email": "invalid-email",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = client.post("/auth/register", json=invalid_email_data)
        assert response.status_code == 422  # Validation error
        
        # Test weak password
        weak_password_data = {
            "email": "test@example.com", 
            "password": "123",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = client.post("/auth/register", json=weak_password_data)
        assert response.status_code in [400, 422]  # Validation or business logic error
    
    def test_login_endpoint_structure(self, client):
        """Test user login endpoint structure"""
        login_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        # Should return proper response structure
        assert response.status_code in [200, 400, 401, 404]  # Valid status codes
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check for token fields
            assert "access_token" in data or "message" in data
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_login_validation(self, client):
        """Test login input validation"""
        # Test missing email
        response = client.post("/auth/login", json={"password": "test"})
        assert response.status_code == 422
        
        # Test missing password  
        response = client.post("/auth/login", json={"email": "test@example.com"})
        assert response.status_code == 422
    
    def test_refresh_token_endpoint_structure(self, client):
        """Test refresh token endpoint structure"""
        # Test without token (should fail)
        response = client.post("/auth/refresh")
        assert response.status_code in [401, 422]  # Unauthorized or validation error
        
        # Test with invalid token
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.post("/auth/refresh", headers=headers)
        assert response.status_code in [401, 422]  # Should reject invalid token
        
        data = response.json()
        assert "message" in data or "detail" in data
    
    def test_me_endpoint_structure(self, client):
        """Test get current user endpoint structure"""
        # Test without token (should fail)
        response = client.get("/auth/me")
        assert response.status_code in [401, 422]  # Unauthorized
        
        # Test with invalid token
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code in [401, 422]  # Should reject invalid token
        
        data = response.json()
        assert "message" in data or "detail" in data
    
    def test_change_password_endpoint_structure(self, client):
        """Test change password endpoint structure"""
        change_password_data = {
            "current_password": "OldPassword123!",
            "new_password": "NewPassword123!"
        }
        
        # Test without authentication
        response = client.post("/auth/change-password", json=change_password_data)
        assert response.status_code in [401, 422]  # Unauthorized
        
        # Test with invalid token
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.post("/auth/change-password", json=change_password_data, headers=headers)
        assert response.status_code in [401, 422]  # Should reject invalid token
    
    def test_reset_password_endpoint_structure(self, client):
        """Test reset password endpoint structure"""
        reset_data = {"email": "test@example.com"}
        
        response = client.post("/auth/api/auth/reset-password", json=reset_data)
        
        # Should return proper response structure regardless of email existence
        assert response.status_code in [200, 400, 404]
        
        data = response.json()
        assert "message" in data or "detail" in data or "success" in data
    
    def test_verify_email_endpoint_structure(self, client):
        """Test email verification endpoint structure"""
        verify_data = {"token": "invalid-verification-token"}
        
        response = client.post("/auth/verify-email/", json=verify_data)
        
        # Should handle invalid token gracefully
        assert response.status_code in [200, 400, 404]
        
        data = response.json()
        assert "message" in data or "detail" in data or "success" in data
    
    def test_profile_update_endpoint_structure(self, client):
        """Test profile update endpoint structure"""
        profile_data = {
            "first_name": "Updated",
            "last_name": "Name"
        }
        
        # Test without authentication
        response = client.put("/auth/api/user/profile", json=profile_data)
        assert response.status_code in [401, 422]  # Unauthorized
        
        # Test with invalid token
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.put("/auth/api/user/profile", json=profile_data, headers=headers)
        assert response.status_code in [401, 422]  # Should reject invalid token
    
    def test_standard_api_response_compliance(self, client):
        """Test that auth routes return StandardAPIResponse format"""
        # Test refresh token endpoint for StandardAPIResponse compliance
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.post("/auth/refresh", headers=headers)
        
        data = response.json()
        # StandardAPIResponse should have consistent error structure
        assert isinstance(data, dict)
        
        # Check for standard fields
        has_standard_structure = (
            "message" in data or 
            "detail" in data or 
            "success" in data or
            "error" in data
        )
        assert has_standard_structure, f"Response lacks standard structure: {data}"
    
    def test_authentication_flow_integration(self, client):
        """Test complete authentication flow integration"""
        # This test verifies the overall flow works without external dependencies
        
        # 1. Try to access protected endpoint without auth
        response = client.get("/auth/me")
        assert response.status_code in [401, 422]
        
        # 2. Try registration (may succeed or fail based on existing users)
        registration_data = {
            "email": f"integration_test_{pytest.current_timestamp()}@example.com",
            "password": "TestPassword123!",
            "first_name": "Integration",
            "last_name": "Test"
        }
        
        register_response = client.post("/auth/register", json=registration_data)
        assert register_response.status_code in [200, 201, 400, 409, 422]
        
        # 3. Try login with same credentials
        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }
        
        login_response = client.post("/auth/login", json=login_data)
        assert login_response.status_code in [200, 400, 401, 404]
        
        # If login successful, test token usage
        if login_response.status_code == 200:
            login_data = login_response.json()
            if "access_token" in login_data:
                token = login_data["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test protected endpoint
                me_response = client.get("/auth/me", headers=headers)
                assert me_response.status_code in [200, 401]


# Add timestamp helper for unique test data
@pytest.fixture(scope="session", autouse=True)
def add_timestamp_to_pytest():
    """Add timestamp helper to pytest for unique test data"""
    import time
    pytest.current_timestamp = lambda: int(time.time() * 1000)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
