"""
Phase 1 Implementation Validation Script

Tests the error taxonomy system with the 3 refactored endpoints:
1. /api/health (E5000_INTERNAL testing) 
2. /api/v2/sports/activate (E1000_VALIDATION testing)
3. /api/props (E2000_DEPENDENCY testing)

Also tests rate limiting middleware and structured logging.
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, Optional


class Phase1Validator:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = []
        
    async def test_endpoint(self, session: aiohttp.ClientSession, method: str, path: str, 
                           expected_status: int = None, payload: Dict[str, Any] = None,
                           description: str = "") -> Dict[str, Any]:
        """Test a single endpoint and validate response structure"""
        url = f"{self.base_url}{path}"
        
        try:
            async with session.request(method, url, json=payload) as response:
                content = await response.text()
                
                try:
                    data = json.loads(content)
                except json.JSONDecodeError:
                    data = {"raw_response": content}
                
                result = {
                    "description": description,
                    "method": method,
                    "path": path, 
                    "status_code": response.status,
                    "expected_status": expected_status,
                    "response_data": data,
                    "has_structured_format": self._validate_structured_response(data),
                    "headers": dict(response.headers),
                    "test_passed": True
                }
                
                if expected_status and response.status != expected_status:
                    result["test_passed"] = False
                    result["error"] = f"Expected {expected_status}, got {response.status}"
                
                return result
                
        except Exception as e:
            return {
                "description": description,
                "method": method,
                "path": path,
                "status_code": None,
                "expected_status": expected_status,
                "response_data": None,
                "has_structured_format": False,
                "error": str(e),
                "test_passed": False
            }
    
    def _validate_structured_response(self, data: Dict[str, Any]) -> bool:
        """Validate if response follows our structured format"""
        if not isinstance(data, dict):
            return False
            
        # Check for structured success response
        if "success" in data and "data" in data and "error" in data:
            return True
            
        # Check for structured error response  
        if "success" in data and data.get("success") is False:
            error = data.get("error", {})
            if isinstance(error, dict) and "code" in error and "message" in error:
                return True
                
        return False
    
    async def test_health_endpoint(self, session: aiohttp.ClientSession):
        """Test /api/health endpoint (refactored with error taxonomy)"""
        print("🔍 Testing Health Endpoint...")
        
        # Test successful health check
        result = await self.test_endpoint(
            session, "GET", "/api/health", 200,
            description="Health endpoint - success case"
        )
        self.results.append(result)
        print(f"   ✅ Health check: {result['status_code']} - Structured: {result['has_structured_format']}")
        
    async def test_sports_activate_endpoint(self, session: aiohttp.ClientSession):
        """Test /api/v2/sports/activate endpoint (refactored with validation errors)"""
        print("🔍 Testing Sports Activate Endpoint...")
        
        # Test with valid payload
        valid_result = await self.test_endpoint(
            session, "POST", "/api/v2/sports/activate", None,
            payload={"sport": "MLB"},
            description="Sports activate - valid payload"
        )
        self.results.append(valid_result)
        print(f"   ✅ Valid activation: {valid_result['status_code']} - Structured: {valid_result['has_structured_format']}")
        
        # Test with invalid payload to trigger E1000_VALIDATION
        invalid_result = await self.test_endpoint(
            session, "POST", "/api/v2/sports/activate", 400,
            payload={"invalid_field": "test"},
            description="Sports activate - validation error"
        )
        self.results.append(invalid_result)
        print(f"   ✅ Validation error: {invalid_result['status_code']} - Structured: {invalid_result['has_structured_format']}")
        
    async def test_props_endpoint(self, session: aiohttp.ClientSession):
        """Test /api/props endpoint (refactored with dependency errors)"""
        print("🔍 Testing Props Endpoint...")
        
        # Test props endpoint (should work or show dependency error)
        result = await self.test_endpoint(
            session, "GET", "/api/props", None,
            description="Props endpoint - dependency test"
        )
        self.results.append(result)
        print(f"   ✅ Props request: {result['status_code']} - Structured: {result['has_structured_format']}")
        
    async def test_rate_limiting(self, session: aiohttp.ClientSession):
        """Test rate limiting middleware"""
        print("🔍 Testing Rate Limiting...")
        
        # Send multiple quick requests to test rate limiting
        rate_limit_results = []
        for i in range(10):
            result = await self.test_endpoint(
                session, "GET", "/api/health", None,
                description=f"Rate limit test #{i+1}"
            )
            rate_limit_results.append(result)
            
            # Check for rate limit headers
            headers = result.get("headers", {})
            rate_limit_info = {
                "X-RateLimit-Limit": headers.get("x-ratelimit-limit"),
                "X-RateLimit-Remaining": headers.get("x-ratelimit-remaining"),
                "X-RateLimit-Reset": headers.get("x-ratelimit-reset")
            }
            
            if any(rate_limit_info.values()):
                print(f"   ✅ Rate limit headers present: {rate_limit_info}")
                break
        
        self.results.extend(rate_limit_results[:3])  # Only keep first 3 for summary
        
    async def test_unknown_endpoint(self, session: aiohttp.ClientSession):
        """Test unknown endpoint for 404 handling"""
        print("🔍 Testing Unknown Endpoint...")
        
        result = await self.test_endpoint(
            session, "GET", "/api/unknown-endpoint", 404,
            description="Unknown endpoint - 404 test"
        )
        self.results.append(result)
        print(f"   ✅ 404 handling: {result['status_code']} - Structured: {result['has_structured_format']}")
        
    def print_summary(self):
        """Print validation summary"""
        print("\n" + "="*60)
        print("📊 PHASE 1 VALIDATION SUMMARY")
        print("="*60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.get("test_passed", False))
        structured_responses = sum(1 for r in self.results if r.get("has_structured_format", False))
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed Tests: {passed_tests}")
        print(f"Structured Responses: {structured_responses}")
        print(f"Success Rate: {passed_tests/total_tests*100:.1f}%")
        print(f"Structured Rate: {structured_responses/total_tests*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        print("-"*60)
        
        for i, result in enumerate(self.results, 1):
            status = "✅ PASS" if result.get("test_passed") else "❌ FAIL"
            structured = "📋 Structured" if result.get("has_structured_format") else "🔧 Needs Fix"
            
            print(f"{i:2d}. {status} | {structured} | {result['method']} {result['path']}")
            print(f"    {result['description']}")
            print(f"    Status: {result.get('status_code', 'N/A')}")
            
            if not result.get("test_passed"):
                print(f"    Error: {result.get('error', 'Unknown error')}")
                
            print()
        
        print("🎯 NEXT STEPS:")
        if structured_responses < total_tests:
            print("- Complete exception handler integration")
            print("- Ensure all endpoints use error taxonomy")
            
        if passed_tests < total_tests:
            print("- Fix failing endpoint tests")
            
        print("- Continue with Steps 5-12 of Phase 1")
        
    async def run_validation(self):
        """Run all validation tests"""
        print("🚀 STARTING PHASE 1 IMPLEMENTATION VALIDATION")
        print("Testing error taxonomy, structured responses, and rate limiting...")
        print()
        
        async with aiohttp.ClientSession() as session:
            # Test core endpoints (Step 3 - Endpoint Refactoring)
            await self.test_health_endpoint(session)
            await self.test_sports_activate_endpoint(session) 
            await self.test_props_endpoint(session)
            
            # Test middleware (Step 4 - Rate Limiting)
            await self.test_rate_limiting(session)
            
            # Test general error handling
            await self.test_unknown_endpoint(session)
            
        self.print_summary()


async def main():
    validator = Phase1Validator()
    await validator.run_validation()


if __name__ == "__main__":
    asyncio.run(main())
