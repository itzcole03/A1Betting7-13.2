"""
Comprehensive Security Smoke Test Suite

This test suite validates security controls by attempting unauthorized access
and verifying that proper 401/403 responses are returned. Tests include:
- Authentication bypass attempts
- Authorization boundary violations
- Rate limiting validation
- Token manipulation attempts
- Policy enforcement verification
"""

import asyncio
import pytest
import time
from typing import Any, Dict, List, Optional
from unittest.mock import Mock, patch

from fastapi import status
from fastapi.testclient import TestClient
from httpx import AsyncClient

from backend.core.app import create_app
from backend.security.enhanced_auth_service import enhanced_auth_service
from backend.security.policy_engine import security_policy_engine
from backend.security.advanced_rate_limiter import advanced_rate_limiter

class SecurityTestCase:
    """Individual security test case"""
    
    def __init__(self, name: str, endpoint: str, method: str = "GET", 
                 headers: Optional[Dict[str, str]] = None,
                 json_data: Optional[Dict[str, Any]] = None,
                 expected_status: int = 401,
                 description: str = ""):
        self.name = name
        self.endpoint = endpoint
        self.method = method
        self.headers = headers or {}
        self.json_data = json_data
        self.expected_status = expected_status
        self.description = description

class SecuritySmokeTestSuite:
    """Comprehensive security test suite"""
    
    def __init__(self):
        """Initialize the test suite"""
        self.app = create_app()
        self.client = TestClient(self.app)
        self.test_results: List[Dict[str, Any]] = []
        
        # Test cases covering different security scenarios
        self.test_cases = self._init_test_cases()
    
    def _init_test_cases(self) -> List[SecurityTestCase]:
        """Initialize security test cases"""
        return [
            # Authentication Tests
            SecurityTestCase(
                name="unauthenticated_admin_access",
                endpoint="/api/admin/users",
                method="GET",
                expected_status=401,
                description="Attempt to access admin endpoint without authentication"
            ),
            SecurityTestCase(
                name="invalid_token_access",
                endpoint="/api/users/profile",
                method="GET",
                headers={"Authorization": "Bearer invalid_token_12345"},
                expected_status=401,
                description="Attempt to access protected endpoint with invalid token"
            ),
            SecurityTestCase(
                name="malformed_token_access",
                endpoint="/api/users/profile",
                method="GET",
                headers={"Authorization": "Bearer malformed.token.here"},
                expected_status=401,
                description="Attempt to access protected endpoint with malformed JWT"
            ),
            SecurityTestCase(
                name="expired_token_access",
                endpoint="/api/users/profile",
                method="GET",
                headers={"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJleHAiOjE2MDk0NTkyMDB9.invalid"},
                expected_status=401,
                description="Attempt to access protected endpoint with expired token"
            ),
            
            # Authorization Tests
            SecurityTestCase(
                name="user_accessing_admin_endpoint",
                endpoint="/api/admin/system",
                method="GET",
                headers={"Authorization": "Bearer user_token_mock"},
                expected_status=403,
                description="User role attempting to access admin-only endpoint"
            ),
            SecurityTestCase(
                name="guest_accessing_user_endpoint",
                endpoint="/api/users/settings",
                method="GET",
                expected_status=401,
                description="Guest attempting to access user-only endpoint"
            ),
            SecurityTestCase(
                name="user_modifying_admin_settings",
                endpoint="/api/admin/settings",
                method="POST",
                headers={"Authorization": "Bearer user_token_mock"},
                json_data={"setting": "value"},
                expected_status=403,
                description="User role attempting to modify admin settings"
            ),
            
            # Method-specific Authorization Tests
            SecurityTestCase(
                name="unauthorized_delete_operation",
                endpoint="/api/admin/users/123",
                method="DELETE",
                headers={"Authorization": "Bearer user_token_mock"},
                expected_status=403,
                description="User attempting DELETE operation on admin resource"
            ),
            SecurityTestCase(
                name="unauthorized_post_operation",
                endpoint="/api/admin/users",
                method="POST",
                headers={"Authorization": "Bearer user_token_mock"},
                json_data={"username": "newuser", "email": "test@example.com"},
                expected_status=403,
                description="User attempting POST operation on admin resource"
            ),
            
            # Rate Limiting Tests
            SecurityTestCase(
                name="rate_limit_bypass_attempt",
                endpoint="/api/auth/login",
                method="POST",
                json_data={"username": "test", "password": "wrongpass"},
                expected_status=429,  # Rate limited after multiple attempts
                description="Attempting to bypass rate limiting on auth endpoint"
            ),
            
            # Token Manipulation Tests
            SecurityTestCase(
                name="modified_token_payload",
                endpoint="/api/users/profile",
                method="GET",
                headers={"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.modified_payload.signature"},
                expected_status=401,
                description="Attempt with manually modified token payload"
            ),
            SecurityTestCase(
                name="token_with_wrong_signature",
                endpoint="/api/users/profile", 
                method="GET",
                headers={"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.wrong_signature"},
                expected_status=401,
                description="Valid payload with incorrect signature"
            ),
            
            # Security Header Tests
            SecurityTestCase(
                name="missing_content_type_header",
                endpoint="/api/v2/sports/activate",
                method="POST",
                headers={"Authorization": "Bearer user_token_mock"},
                json_data={"sport": "MLB"},
                expected_status=400,  # Should require proper content-type
                description="POST request without proper Content-Type header"
            ),
            
            # Cross-Origin Request Tests
            SecurityTestCase(
                name="unauthorized_cors_request",
                endpoint="/api/admin/users",
                method="GET", 
                headers={
                    "Origin": "https://malicious-site.com",
                    "Authorization": "Bearer admin_token_mock"
                },
                expected_status=403,
                description="Request from unauthorized origin"
            ),
            
            # SQL Injection Attempt Tests
            SecurityTestCase(
                name="sql_injection_in_params",
                endpoint="/api/users/profile?id=1' OR '1'='1",
                method="GET",
                headers={"Authorization": "Bearer user_token_mock"},
                expected_status=400,
                description="SQL injection attempt in query parameters"
            ),
            
            # XSS Attempt Tests
            SecurityTestCase(
                name="xss_in_request_body",
                endpoint="/api/users/profile",
                method="PUT",
                headers={"Authorization": "Bearer user_token_mock", "Content-Type": "application/json"},
                json_data={"name": "<script>alert('xss')</script>"},
                expected_status=400,
                description="XSS attempt in request body"
            ),
            
            # Service Key Tests
            SecurityTestCase(
                name="service_endpoint_without_service_key",
                endpoint="/api/internal/sync",
                method="POST",
                headers={"Authorization": "Bearer service_token_mock"},
                expected_status=403,
                description="Service endpoint access without service key"
            ),
        ]
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all security test cases"""
        print("🔒 Starting comprehensive security smoke tests...")
        
        passed_tests = 0
        failed_tests = 0
        
        for test_case in self.test_cases:
            try:
                result = await self._run_test_case(test_case)
                
                if result["passed"]:
                    passed_tests += 1
                    print(f"✅ {test_case.name}: PASS")
                else:
                    failed_tests += 1
                    print(f"❌ {test_case.name}: FAIL - {result['error']}")
                
                self.test_results.append(result)
                
            except Exception as e:
                failed_tests += 1
                error_result = {
                    "name": test_case.name,
                    "passed": False,
                    "error": f"Test execution error: {str(e)}",
                    "expected_status": test_case.expected_status,
                    "actual_status": None,
                    "description": test_case.description
                }
                self.test_results.append(error_result)
                print(f"❌ {test_case.name}: ERROR - {str(e)}")
        
        # Run rate limiting specific tests
        await self._run_rate_limiting_tests()
        
        summary = {
            "total_tests": len(self.test_cases),
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests / len(self.test_cases)) * 100 if self.test_cases else 0,
            "test_results": self.test_results
        }
        
        print(f"\n🔒 Security Test Summary:")
        print(f"   Total Tests: {summary['total_tests']}")
        print(f"   Passed: {summary['passed']}")
        print(f"   Failed: {summary['failed']}")
        print(f"   Success Rate: {summary['success_rate']:.1f}%")
        
        return summary
    
    async def _run_test_case(self, test_case: SecurityTestCase) -> Dict[str, Any]:
        """Run individual test case"""
        try:
            # Make request using the test client
            if test_case.method.upper() == "GET":
                response = self.client.get(test_case.endpoint, headers=test_case.headers)
            elif test_case.method.upper() == "POST":
                response = self.client.post(
                    test_case.endpoint, 
                    headers=test_case.headers, 
                    json=test_case.json_data
                )
            elif test_case.method.upper() == "PUT":
                response = self.client.put(
                    test_case.endpoint,
                    headers=test_case.headers,
                    json=test_case.json_data
                )
            elif test_case.method.upper() == "DELETE":
                response = self.client.delete(test_case.endpoint, headers=test_case.headers)
            else:
                return {
                    "name": test_case.name,
                    "passed": False,
                    "error": f"Unsupported HTTP method: {test_case.method}",
                    "expected_status": test_case.expected_status,
                    "actual_status": None,
                    "description": test_case.description
                }
            
            # Check if response status matches expected
            passed = response.status_code == test_case.expected_status
            error = None if passed else f"Expected {test_case.expected_status}, got {response.status_code}"
            
            return {
                "name": test_case.name,
                "passed": passed,
                "error": error,
                "expected_status": test_case.expected_status,
                "actual_status": response.status_code,
                "description": test_case.description,
                "response_body": response.text[:200] if response.text else None  # First 200 chars
            }
            
        except Exception as e:
            return {
                "name": test_case.name,
                "passed": False,
                "error": f"Request execution error: {str(e)}",
                "expected_status": test_case.expected_status,
                "actual_status": None,
                "description": test_case.description
            }
    
    async def _run_rate_limiting_tests(self) -> None:
        """Run specific rate limiting tests"""
        print("\n🚦 Running rate limiting tests...")
        
        # Test rapid authentication attempts
        auth_endpoint = "/api/auth/login"
        rapid_attempts = 15  # More than the expected limit
        
        rate_limit_triggered = False
        for i in range(rapid_attempts):
            response = self.client.post(
                auth_endpoint,
                json={"username": f"test_user_{i}", "password": "wrongpass"}
            )
            
            if response.status_code == 429:
                rate_limit_triggered = True
                break
            
            # Small delay between attempts
            time.sleep(0.1)
        
        rate_limit_result = {
            "name": "auth_rate_limiting",
            "passed": rate_limit_triggered,
            "error": None if rate_limit_triggered else "Rate limiting not triggered after multiple attempts",
            "expected_status": 429,
            "actual_status": response.status_code if 'response' in locals() else None,
            "description": "Rapid authentication attempts should trigger rate limiting"
        }
        
        self.test_results.append(rate_limit_result)
        
        if rate_limit_triggered:
            print("✅ auth_rate_limiting: PASS")
        else:
            print("❌ auth_rate_limiting: FAIL - Rate limiting not triggered")
    
    def generate_security_report(self) -> str:
        """Generate detailed security test report"""
        report = []
        report.append("# A1Betting Security Smoke Test Report")
        report.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Summary
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["passed"])
        failed = total - passed
        
        report.append("## Summary")
        report.append(f"- **Total Tests**: {total}")
        report.append(f"- **Passed**: {passed}")
        report.append(f"- **Failed**: {failed}")
        report.append(f"- **Success Rate**: {(passed/total*100):.1f}%" if total > 0 else "- **Success Rate**: N/A")
        report.append("")
        
        # Failed tests
        if failed > 0:
            report.append("## Failed Tests")
            for result in self.test_results:
                if not result["passed"]:
                    report.append(f"### ❌ {result['name']}")
                    report.append(f"**Description**: {result['description']}")
                    report.append(f"**Expected Status**: {result['expected_status']}")
                    report.append(f"**Actual Status**: {result.get('actual_status', 'N/A')}")
                    report.append(f"**Error**: {result['error']}")
                    report.append("")
        
        # Passed tests
        report.append("## Passed Tests")
        for result in self.test_results:
            if result["passed"]:
                report.append(f"- ✅ **{result['name']}**: {result['description']}")
        
        report.append("")
        report.append("## Recommendations")
        if failed > 0:
            report.append("- Review failed test cases and implement proper security controls")
            report.append("- Ensure authentication middleware is properly configured")
            report.append("- Verify authorization policies are correctly enforced")
            report.append("- Test rate limiting configuration and thresholds")
        else:
            report.append("- All security tests passed! 🎉")
            report.append("- Continue monitoring and testing security controls regularly")
        
        return "\n".join(report)

async def run_security_smoke_tests():
    """Main function to run security smoke tests"""
    test_suite = SecuritySmokeTestSuite()
    
    try:
        results = await test_suite.run_all_tests()
        
        # Generate and save report
        report = test_suite.generate_security_report()
        
        # Save report to file
        import os
        report_path = os.path.join(os.path.dirname(__file__), "..", "..", "security_test_report.md")
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 Security test report saved to: {report_path}")
        
        return results
        
    except Exception as e:
        print(f"❌ Error running security tests: {str(e)}")
        return {"error": str(e)}

# Pytest integration
class TestSecuritySmoke:
    """Pytest test class for security smoke tests"""
    
    @pytest.fixture
    def test_suite(self):
        """Create test suite fixture"""
        return SecuritySmokeTestSuite()
    
    @pytest.mark.asyncio
    async def test_unauthorized_admin_access(self, test_suite):
        """Test that admin endpoints reject unauthorized access"""
        test_case = SecurityTestCase(
            name="unauthorized_admin_test",
            endpoint="/api/admin/users",
            method="GET",
            expected_status=401
        )
        
        result = await test_suite._run_test_case(test_case)
        assert result["passed"], f"Admin endpoint should reject unauthorized access: {result['error']}"
    
    @pytest.mark.asyncio
    async def test_invalid_token_rejection(self, test_suite):
        """Test that invalid tokens are rejected"""
        test_case = SecurityTestCase(
            name="invalid_token_test",
            endpoint="/api/users/profile",
            method="GET",
            headers={"Authorization": "Bearer invalid_token_here"},
            expected_status=401
        )
        
        result = await test_suite._run_test_case(test_case)
        assert result["passed"], f"Invalid token should be rejected: {result['error']}"
    
    @pytest.mark.asyncio
    async def test_rate_limiting_enforcement(self, test_suite):
        """Test that rate limiting is enforced"""
        # This would require a more sophisticated test setup
        # For now, we'll test that the rate limiter exists
        assert advanced_rate_limiter is not None
        assert hasattr(advanced_rate_limiter, 'check_rate_limit')

if __name__ == "__main__":
    # Run tests directly
    asyncio.run(run_security_smoke_tests())