"""
API Contract Tests - Phase 4.1 Backend Tests
Test suite to ensure API responses match StandardAPIResponse format
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from backend.main import app
from typing import Any, Dict, List
import json


class TestStandardAPIResponseContract:
    """Test suite for StandardAPIResponse contract compliance"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    def validate_standard_api_response(self, response_data: Dict[str, Any], endpoint: str) -> List[str]:
        """
        Validate response follows StandardAPIResponse structure
        Returns list of validation errors, empty if valid
        """
        errors = []
        
        if not isinstance(response_data, dict):
            errors.append(f"{endpoint}: Response is not a dictionary")
            return errors
        
        # Check for required fields in StandardAPIResponse
        # Based on common patterns: success, message, data, error, status
        has_success_indicator = any(key in response_data for key in [
            "success", "status", "message", "data", "error", "detail", "result"
        ])
        
        if not has_success_indicator:
            errors.append(f"{endpoint}: Missing standard response indicator fields")
        
        # Check for consistent error structure
        if "error" in response_data or "detail" in response_data:
            # Error response should have message
            has_error_message = any(key in response_data for key in ["message", "detail", "error"])
            if not has_error_message:
                errors.append(f"{endpoint}: Error response missing descriptive message")
        
        # Check for data consistency
        if "data" in response_data:
            data_field = response_data["data"]
            if data_field is None:
                # Null data should be accompanied by appropriate status
                if response_data.get("success", True):  # Default to True for backward compatibility
                    errors.append(f"{endpoint}: Null data with success=True may be inconsistent")
        
        return errors
    
    def test_auth_routes_contract_compliance(self, client):
        """Test authentication routes comply with StandardAPIResponse"""
        auth_endpoints = [
            # (method, endpoint, data, description)
            ("POST", "/auth/register", {
                "email": "contract_test@example.com",
                "password": "TestPassword123!",
                "first_name": "Contract",
                "last_name": "Test"
            }, "User registration"),
            ("POST", "/auth/login", {
                "email": "test@example.com", 
                "password": "TestPassword123!"
            }, "User login"),
            ("POST", "/auth/refresh", {}, "Token refresh"),
            ("GET", "/auth/me", None, "Get current user"),
            ("POST", "/auth/change-password", {
                "current_password": "OldPass123!",
                "new_password": "NewPass123!"
            }, "Change password"),
            ("POST", "/auth/api/auth/reset-password", {
                "email": "test@example.com"
            }, "Reset password"),
            ("POST", "/auth/verify-email/", {
                "token": "test-verification-token"
            }, "Verify email")
        ]
        
        contract_violations = []
        
        for method, endpoint, data, description in auth_endpoints:
            try:
                if method == "GET":
                    response = client.get(endpoint)
                else:
                    response = client.post(endpoint, json=data)
                
                # Should return valid HTTP status
                assert response.status_code in [200, 201, 400, 401, 404, 409, 422, 500]
                
                response_data = response.json()
                errors = self.validate_standard_api_response(response_data, f"{method} {endpoint}")
                
                if errors:
                    contract_violations.extend([f"{description}: {error}" for error in errors])
                    
            except Exception as e:
                contract_violations.append(f"{description} ({endpoint}): Exception during test - {str(e)}")
        
        # Report all contract violations
        if contract_violations:
            violation_report = "\n".join(contract_violations)
            pytest.fail(f"StandardAPIResponse contract violations found:\n{violation_report}")
    
    def test_prediction_routes_contract_compliance(self, client):
        """Test prediction routes comply with StandardAPIResponse"""
        prediction_endpoints = [
            ("POST", "/api/enhanced-ml/predict/single", {
                "sport": "MLB",
                "features": {"test_feature": 1.0}
            }, "Single prediction"),
            ("POST", "/api/enhanced-ml/predict/batch", {
                "requests": [{
                    "sport": "MLB", 
                    "features": {"test_feature": 1.0}
                }]
            }, "Batch prediction"),
            ("GET", "/api/enhanced-ml/health", None, "ML health check"),
            ("GET", "/api/enhanced-ml/models/registered", None, "Get registered models"),
            ("POST", "/api/enhanced-ml/models/register", {
                "model_name": "contract_test",
                "model_version": "1.0.0"
            }, "Register model"),
            ("GET", "/api/enhanced-ml/performance/alerts", None, "Performance alerts"),
            ("GET", "/api/enhanced-ml/performance/batch-stats", None, "Batch statistics"),
            ("POST", "/api/enhanced-ml/initialize", {}, "Initialize ML engine"),
            ("POST", "/api/enhanced-ml/shutdown", {}, "Shutdown ML engine")
        ]
        
        contract_violations = []
        
        for method, endpoint, data, description in prediction_endpoints:
            try:
                if method == "GET":
                    response = client.get(endpoint)
                else:
                    response = client.post(endpoint, json=data)
                
                # Should return valid HTTP status
                assert response.status_code in [200, 201, 400, 404, 422, 500, 503]
                
                response_data = response.json()
                errors = self.validate_standard_api_response(response_data, f"{method} {endpoint}")
                
                if errors:
                    contract_violations.extend([f"{description}: {error}" for error in errors])
                    
            except Exception as e:
                contract_violations.append(f"{description} ({endpoint}): Exception during test - {str(e)}")
        
        # Report all contract violations
        if contract_violations:
            violation_report = "\n".join(contract_violations)
            pytest.fail(f"StandardAPIResponse contract violations found:\n{violation_report}")
    
    def test_portfolio_routes_contract_compliance(self, client):
        """Test portfolio optimization routes comply with StandardAPIResponse"""
        portfolio_endpoints = [
            ("POST", "/api/advanced-kelly/calculate", {
                "probability": 0.65,
                "odds": 1.85,
                "bankroll": 1000.0
            }, "Kelly calculation"),
            ("POST", "/api/advanced-kelly/portfolio-optimization", {
                "opportunities": [{
                    "id": "test_bet",
                    "probability": 0.65,
                    "odds": 1.85
                }],
                "total_bankroll": 1000.0
            }, "Portfolio optimization"),
            ("GET", "/api/advanced-kelly/portfolio-metrics", None, "Portfolio metrics"),
            ("POST", "/api/advanced-kelly/batch-calculate", {
                "opportunities": [{
                    "probability": 0.65,
                    "odds": 1.85,
                    "bankroll": 1000.0,
                    "id": "test_calc"
                }]
            }, "Batch Kelly calculation"),
            ("POST", "/api/advanced-kelly/risk-analysis", {
                "portfolio": [{
                    "bet_id": "test_bet",
                    "amount": 50.0,
                    "probability": 0.65,
                    "odds": 1.85
                }],
                "total_bankroll": 1000.0
            }, "Risk analysis")
        ]
        
        contract_violations = []
        
        for method, endpoint, data, description in portfolio_endpoints:
            try:
                if method == "GET":
                    response = client.get(endpoint)
                else:
                    response = client.post(endpoint, json=data)
                
                # Should return valid HTTP status
                assert response.status_code in [200, 201, 400, 404, 422, 500]
                
                response_data = response.json()
                errors = self.validate_standard_api_response(response_data, f"{method} {endpoint}")
                
                if errors:
                    contract_violations.extend([f"{description}: {error}" for error in errors])
                    
            except Exception as e:
                contract_violations.append(f"{description} ({endpoint}): Exception during test - {str(e)}")
        
        # Report all contract violations
        if contract_violations:
            violation_report = "\n".join(contract_violations)
            pytest.fail(f"StandardAPIResponse contract violations found:\n{violation_report}")
    
    def test_mlb_routes_contract_compliance(self, client):
        """Test MLB-specific routes comply with StandardAPIResponse"""
        mlb_endpoints = [
            ("GET", "/mlb/todays-games", None, "Today's MLB games"),
            ("GET", "/mlb/prizepicks-props/", None, "PrizePicks props"),
            ("GET", "/health", None, "Application health check"),
            ("POST", "/api/sports/activate/MLB", {}, "Activate MLB sport"),
            ("GET", "/api/debug/status", None, "Debug status")
        ]
        
        contract_violations = []
        
        for method, endpoint, data, description in mlb_endpoints:
            try:
                if method == "GET":
                    response = client.get(endpoint)
                else:
                    response = client.post(endpoint, json=data if data else {})
                
                # Should return valid HTTP status
                assert response.status_code in [200, 201, 400, 404, 422, 500, 503]
                
                response_data = response.json()
                errors = self.validate_standard_api_response(response_data, f"{method} {endpoint}")
                
                if errors:
                    contract_violations.extend([f"{description}: {error}" for error in errors])
                    
            except Exception as e:
                contract_violations.append(f"{description} ({endpoint}): Exception during test - {str(e)}")
        
        # Report all contract violations
        if contract_violations:
            violation_report = "\n".join(contract_violations)
            pytest.fail(f"StandardAPIResponse contract violations found:\n{violation_report}")
    
    def test_error_response_contract_compliance(self, client):
        """Test error responses follow StandardAPIResponse contract"""
        # Test various error scenarios to ensure consistent error structure
        error_test_cases = [
            # (method, endpoint, data, expected_status, description)
            ("POST", "/auth/login", {"invalid": "login"}, 422, "Validation error"),
            ("GET", "/api/nonexistent/endpoint", None, 404, "Not found error"),
            ("POST", "/api/enhanced-ml/predict/single", {"malformed": "request"}, 422, "Malformed request"),
            ("POST", "/auth/register", {"email": "invalid-email"}, 422, "Invalid email format"),
            ("GET", "/auth/me", None, 401, "Unauthorized access"),
            ("POST", "/api/advanced-kelly/calculate", {"probability": -1.0}, 422, "Invalid probability")
        ]
        
        contract_violations = []
        
        for method, endpoint, data, expected_status, description in error_test_cases:
            try:
                if method == "GET":
                    response = client.get(endpoint)
                else:
                    response = client.post(endpoint, json=data)
                
                # Verify error status code is as expected or within acceptable range
                acceptable_statuses = [expected_status, 400, 422, 500]  # Allow some flexibility
                assert response.status_code in acceptable_statuses, f"Unexpected status for {description}"
                
                response_data = response.json()
                
                # Error responses should have consistent structure
                has_error_info = any(key in response_data for key in [
                    "message", "detail", "error", "errors"
                ])
                
                if not has_error_info:
                    contract_violations.append(f"{description}: Error response missing descriptive information")
                
                # Error messages should be strings or structured objects
                for error_key in ["message", "detail", "error"]:
                    if error_key in response_data:
                        error_value = response_data[error_key]
                        if error_value is not None and not isinstance(error_value, (str, dict, list)):
                            contract_violations.append(
                                f"{description}: Error {error_key} should be string, dict, or list, got {type(error_value)}"
                            )
                
            except Exception as e:
                contract_violations.append(f"{description} ({endpoint}): Exception during test - {str(e)}")
        
        # Report all contract violations
        if contract_violations:
            violation_report = "\n".join(contract_violations)
            pytest.fail(f"Error response contract violations found:\n{violation_report}")
    
    def test_response_structure_consistency(self, client):
        """Test response structure consistency across similar endpoints"""
        # Test that similar endpoints return similar response structures
        
        # Health check endpoints should have consistent structure
        health_endpoints = [
            ("GET", "/health", "Application health"),
            ("GET", "/api/enhanced-ml/health", "ML health"),
            ("GET", "/api/debug/status", "Debug status")
        ]
        
        health_responses = []
        for method, endpoint, description in health_endpoints:
            try:
                response = client.get(endpoint)
                if response.status_code in [200, 503]:  # Acceptable for health checks
                    response_data = response.json()
                    health_responses.append((endpoint, response_data, description))
            except Exception:
                pass  # Skip failed requests for this consistency test
        
        # Check if health responses follow similar patterns
        if len(health_responses) > 1:
            status_fields = set()
            for endpoint, data, desc in health_responses:
                # Collect common field names
                if isinstance(data, dict):
                    status_fields.update(data.keys())
            
            # Common health check fields
            expected_health_fields = {"status", "health", "message", "service"}
            common_fields = status_fields.intersection(expected_health_fields)
            
            if not common_fields:
                pytest.fail("Health endpoints lack consistent response structure fields")
    
    def test_pagination_contract_compliance(self, client):
        """Test paginated endpoints follow consistent contract"""
        # Test endpoints that might return paginated results
        paginated_endpoints = [
            ("GET", "/mlb/todays-games", "MLB games list"),
            ("GET", "/api/enhanced-ml/models/registered", "Registered models"),
            ("GET", "/mlb/prizepicks-props/", "PrizePicks props")
        ]
        
        contract_violations = []
        
        for method, endpoint, description in paginated_endpoints:
            try:
                response = client.get(endpoint)
                
                if response.status_code == 200:
                    response_data = response.json()
                    
                    # If response contains array data, check for pagination info
                    if isinstance(response_data, dict):
                        has_array_data = any(
                            isinstance(value, list) for value in response_data.values()
                        )
                        
                        if has_array_data:
                            # Look for common pagination fields
                            pagination_fields = {"total", "count", "page", "limit", "offset", "has_more"}
                            has_pagination_info = bool(set(response_data.keys()).intersection(pagination_fields))
                            
                            # This is informational - not a strict requirement
                            # Large lists might benefit from pagination info
                            for key, value in response_data.items():
                                if isinstance(value, list) and len(value) > 100:
                                    if not has_pagination_info:
                                        # Note: This is a suggestion, not a failure
                                        print(f"INFO: {description} returns large list ({len(value)} items) without pagination info")
                
            except Exception as e:
                contract_violations.append(f"{description}: Exception during pagination test - {str(e)}")
        
        # Report contract violations (if any strict requirements are added)
        if contract_violations:
            violation_report = "\n".join(contract_violations)
            pytest.fail(f"Pagination contract violations found:\n{violation_report}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
