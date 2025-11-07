#!/usr/bin/env python3
"""
Security Implementation Validation Script

Validates that all security components are properly integrated:
- Rate limiting returns 429 responses
- HMAC signing infrastructure is ready
- Data redaction removes sensitive information
- RBAC controls access to protected endpoints

Exit Criteria:
- "Attempted overuse yields 429 with consistent metadata"
- "Sensitive identifiers absent from logs and rationales"
"""

import asyncio
import json
import time
from typing import Dict, Any
import requests
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_ENDPOINTS = {
    "security_status": "/security-test/status",
    "rationale": "/security-test/rationale",
    "optimization": "/security-test/optimization", 
    "admin": "/security-test/admin",
    "rate_limit": "/security-test/rate-limit",
    "redaction": "/security-test/redaction",
    "rbac": "/security-test/rbac",
    "create_key": "/security-test/create-admin-key",
    "hmac": "/security-test/hmac"
}


class SecurityValidator:
    """Comprehensive security validation"""
    
    def __init__(self):
        self.results = {}
        self.admin_api_key = None
    
    def log(self, message: str, level: str = "INFO"):
        """Log validation messages"""
        timestamp = datetime.now().isoformat()
        print(f"[{timestamp}] {level}: {message}")
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        try:
            url = f"{BASE_URL}{endpoint}"
            response = requests.request(method, url, timeout=10, **kwargs)
            
            return {
                "success": True,
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "headers": dict(response.headers)
            }
        except requests.exceptions.Timeout:
            return {"success": False, "error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Connection error - is backend running?"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def test_security_status(self) -> bool:
        """Test basic security service status"""
        self.log("Testing security service status...")
        
        result = self.make_request("GET", TEST_ENDPOINTS["security_status"])
        
        if not result["success"]:
            self.log(f"Security status check failed: {result['error']}", "ERROR")
            return False
        
        if result["status_code"] != 200:
            self.log(f"Security status returned {result['status_code']}", "ERROR")
            return False
        
        data = result["data"]
        if not data.get("data", {}).get("security_services_active"):
            self.log("Security services not active", "ERROR")
            return False
        
        self.log("✅ Security services are active and operational")
        self.results["security_status"] = True
        return True
    
    def create_admin_api_key(self) -> bool:
        """Create admin API key for testing"""
        self.log("Creating admin API key for testing...")
        
        result = self.make_request("POST", TEST_ENDPOINTS["create_key"])
        
        if not result["success"] or result["status_code"] != 200:
            self.log("Admin API key creation failed", "ERROR")
            return False
        
        api_key = result["data"]["data"]["api_key"]
        self.admin_api_key = api_key
        
        self.log("✅ Admin API key created successfully")
        self.log(f"API Key: {api_key}")
        self.results["admin_key_created"] = True
        return True
    
    def test_rate_limiting(self) -> bool:
        """Test rate limiting functionality"""
        self.log("Testing rate limiting (may take a few seconds)...")
        
        # Make multiple rapid requests to trigger rate limiting
        requests_made = 0
        rate_limited = False
        
        for i in range(15):  # Make 15 requests rapidly
            result = self.make_request("GET", TEST_ENDPOINTS["rate_limit"])
            requests_made += 1
            
            if result["status_code"] == 429:
                self.log(f"✅ Rate limiting triggered after {requests_made} requests")
                
                # Validate 429 response has proper metadata
                error_detail = result["data"].get("detail", {})
                if isinstance(error_detail, dict):
                    if "retry_after" in error_detail and "current_usage" in error_detail:
                        self.log("✅ 429 response contains consistent metadata")
                        rate_limited = True
                        break
                    else:
                        self.log("⚠️ 429 response missing required metadata", "WARN")
                else:
                    self.log("⚠️ 429 response format unexpected", "WARN")
            
            time.sleep(0.1)  # Small delay between requests
        
        if not rate_limited:
            self.log("❌ Rate limiting not triggered - may need adjustment", "WARN")
            self.results["rate_limiting"] = False
            return False
        
        self.results["rate_limiting"] = True
        return True
    
    def test_rbac_without_key(self) -> bool:
        """Test RBAC denies access without API key"""
        self.log("Testing RBAC access control without API key...")
        
        test_data = {"message": "test", "tokens": 100}
        
        # Test rationale endpoint without key
        result = self.make_request(
            "POST", 
            TEST_ENDPOINTS["rationale"], 
            json=test_data
        )
        
        if result["status_code"] == 403:
            self.log("✅ RBAC correctly denies access without API key")
            self.results["rbac_denies_access"] = True
            return True
        else:
            self.log(f"❌ Expected 403, got {result['status_code']}", "ERROR")
            self.results["rbac_denies_access"] = False
            return False
    
    def test_rbac_with_key(self) -> bool:
        """Test RBAC allows access with valid API key"""
        if not self.admin_api_key:
            self.log("No admin API key available for testing", "ERROR")
            return False
        
        self.log("Testing RBAC access control with API key...")
        
        headers = {"X-API-Key": self.admin_api_key}
        test_data = {"message": "test", "tokens": 100}
        
        # Test rationale endpoint with key
        result = self.make_request(
            "POST", 
            TEST_ENDPOINTS["rationale"], 
            json=test_data,
            headers=headers
        )
        
        if result["status_code"] == 200:
            self.log("✅ RBAC allows access with valid API key")
            self.results["rbac_allows_access"] = True
            return True
        else:
            self.log(f"❌ Expected 200, got {result['status_code']}: {result.get('data')}", "ERROR")
            self.results["rbac_allows_access"] = False
            return False
    
    def test_data_redaction(self) -> bool:
        """Test data redaction removes sensitive information"""
        self.log("Testing data redaction...")
        
        result = self.make_request("POST", TEST_ENDPOINTS["redaction"])
        
        if not result["success"] or result["status_code"] != 200:
            self.log("Data redaction test failed", "ERROR")
            return False
        
        data = result["data"]["data"]
        redacted_data = data["redacted"]
        
        # Check that sensitive data was redacted
        checks = [
            ("minimal", "api_key", "sk-1234567890abcdef"),
            ("standard", "credit_card", "4111-1111-1111-1111"),
            ("aggressive", "email", "test@example.com")
        ]
        
        redaction_working = True
        for level, field, original_value in checks:
            if level in redacted_data and field in redacted_data[level]:
                if redacted_data[level][field] == original_value:
                    self.log(f"❌ {level} redaction failed for {field}", "ERROR")
                    redaction_working = False
                else:
                    self.log(f"✅ {level} redaction worked for {field}")
        
        # Check rationale redaction
        if "rationale" in redacted_data["minimal"]:
            rationale_content = redacted_data["minimal"]["rationale"]["content"]
            if "provider_internal_id_ABC123" in rationale_content:
                self.log("❌ Provider internal ID not redacted from rationale", "ERROR")
                redaction_working = False
            else:
                self.log("✅ Provider internal ID redacted from rationale")
        
        self.results["data_redaction"] = redaction_working
        return redaction_working
    
    def test_hmac_infrastructure(self) -> bool:
        """Test HMAC signing infrastructure"""
        self.log("Testing HMAC signing infrastructure...")
        
        result = self.make_request("GET", TEST_ENDPOINTS["hmac"])
        
        if not result["success"] or result["status_code"] != 200:
            self.log("HMAC test failed", "ERROR")
            return False
        
        data = result["data"]["data"]
        
        if data.get("hmac_active"):
            self.log("✅ HMAC signing infrastructure is ready")
            self.results["hmac_infrastructure"] = True
            return True
        else:
            self.log("❌ HMAC signing infrastructure not active", "ERROR")
            self.results["hmac_infrastructure"] = False
            return False
    
    def test_endpoint_security_integration(self) -> bool:
        """Test that endpoints properly integrate security"""
        if not self.admin_api_key:
            self.log("No admin API key for integration test", "ERROR")
            return False
        
        self.log("Testing security integration on protected endpoints...")
        
        headers = {"X-API-Key": self.admin_api_key}
        test_data = {"message": "security integration test", "tokens": 200}
        
        endpoints_to_test = ["rationale", "optimization", "admin"]
        integration_working = True
        
        for endpoint in endpoints_to_test:
            result = self.make_request(
                "POST", 
                TEST_ENDPOINTS[endpoint], 
                json=test_data,
                headers=headers
            )
            
            if result["status_code"] == 200:
                response_data = result["data"]
                
                # Check for security metadata in response
                if "metadata" in response_data and "security" in response_data["metadata"]:
                    self.log(f"✅ {endpoint} endpoint has security metadata")
                else:
                    self.log(f"⚠️ {endpoint} endpoint missing security metadata", "WARN")
                
                # Check that response indicates security was applied
                if response_data.get("data", {}).get("security_applied"):
                    self.log(f"✅ {endpoint} endpoint confirms security applied")
                else:
                    self.log(f"⚠️ {endpoint} endpoint doesn't confirm security", "WARN")
                    
            else:
                self.log(f"❌ {endpoint} endpoint returned {result['status_code']}", "ERROR")
                integration_working = False
        
        self.results["endpoint_integration"] = integration_working
        return integration_working
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        
        total_tests = len(self.results)
        passed_tests = sum(1 for result in self.results.values() if result)
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Evaluate exit criteria
        rate_limiting_success = self.results.get("rate_limiting", False)
        redaction_success = self.results.get("data_redaction", False)
        
        exit_criteria_met = rate_limiting_success and redaction_success
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "success_rate": f"{success_rate:.1f}%",
                "overall_status": "PASS" if success_rate >= 80 else "FAIL"
            },
            "exit_criteria": {
                "overuse_yields_429": rate_limiting_success,
                "sensitive_identifiers_redacted": redaction_success,
                "criteria_met": exit_criteria_met
            },
            "detailed_results": self.results,
            "recommendations": []
        }
        
        # Add recommendations based on results
        if not rate_limiting_success:
            report["recommendations"].append(
                "Rate limiting needs adjustment - ensure endpoints properly integrate rate limiter"
            )
        
        if not redaction_success:
            report["recommendations"].append(
                "Data redaction needs improvement - ensure sensitive data is properly filtered"
            )
        
        if not self.results.get("rbac_allows_access", False):
            report["recommendations"].append(
                "RBAC integration needs verification - ensure valid API keys grant access"
            )
        
        return report
    
    async def run_validation(self) -> Dict[str, Any]:
        """Run comprehensive security validation"""
        self.log("🔒 Starting comprehensive security validation...")
        self.log("=" * 60)
        
        # Run validation tests
        tests = [
            ("Security Status", self.test_security_status),
            ("Admin API Key Creation", self.create_admin_api_key), 
            ("Rate Limiting", self.test_rate_limiting),
            ("RBAC Access Denial", self.test_rbac_without_key),
            ("RBAC Access Grant", self.test_rbac_with_key),
            ("Data Redaction", self.test_data_redaction),
            ("HMAC Infrastructure", self.test_hmac_infrastructure),
            ("Endpoint Integration", self.test_endpoint_security_integration)
        ]
        
        for test_name, test_func in tests:
            self.log(f"Running: {test_name}")
            try:
                test_func()
            except Exception as e:
                self.log(f"❌ {test_name} failed with error: {e}", "ERROR")
                self.results[test_name.lower().replace(" ", "_")] = False
            
            self.log("-" * 40)
        
        # Generate final report
        report = self.generate_report()
        
        self.log("🔒 Security Validation Complete")
        self.log("=" * 60)
        self.log(f"Overall Status: {report['summary']['overall_status']}")
        self.log(f"Success Rate: {report['summary']['success_rate']}")
        self.log(f"Exit Criteria Met: {report['exit_criteria']['criteria_met']}")
        
        if report["recommendations"]:
            self.log("\nRecommendations:")
            for rec in report["recommendations"]:
                self.log(f"• {rec}")
        
        return report


async def main():
    """Main validation entry point"""
    validator = SecurityValidator()
    report = await validator.run_validation()
    
    # Save report to file
    with open("security_validation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: security_validation_report.json")
    
    # Exit with appropriate code
    exit_code = 0 if report["exit_criteria"]["criteria_met"] else 1
    return exit_code


if __name__ == "__main__":
    import sys
    exit_code = asyncio.run(main())
    sys.exit(exit_code)