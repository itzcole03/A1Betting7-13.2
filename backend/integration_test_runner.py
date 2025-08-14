"""
Integration Test for Structured Logging and Metrics

Tests the structured logging middleware and metrics collection
to ensure they're working correctly with the FastAPI application.
"""

import asyncio
import json
import aiohttp
import pytest
from typing import Dict, Any


class StructuredLoggingMetricsIntegrationTest:
    """Integration test for logging and metrics functionality"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    async def test_structured_logging_headers(self) -> Dict[str, Any]:
        """Test that requests get proper request ID headers"""
        print("🧪 Testing structured logging request ID headers...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/health") as response:
                    request_id = response.headers.get("X-Request-ID")
                    
                    if request_id:
                        print(f"  ✅ Request ID header present: {request_id}")
                        return {
                            "success": True,
                            "request_id": request_id,
                            "message": "Request ID header correctly set"
                        }
                    else:
                        print("  ❌ No X-Request-ID header found")
                        return {
                            "success": False,
                            "message": "Missing X-Request-ID header"
                        }
                        
        except Exception as e:
            print(f"  ❌ Error testing request ID headers: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to test request ID headers"
            }

    async def test_metrics_endpoint(self) -> Dict[str, Any]:
        """Test that metrics endpoint is available and functional"""
        print("📊 Testing metrics endpoint availability...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/metrics") as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        # Check for Prometheus format indicators
                        has_metrics = any([
                            "http_requests_total" in content,
                            "http_request_duration_seconds" in content,
                            "# HELP" in content,
                            "# TYPE" in content
                        ])
                        
                        if has_metrics:
                            print("  ✅ Metrics endpoint returns Prometheus format")
                            return {
                                "success": True,
                                "content_length": len(content),
                                "message": "Metrics endpoint working correctly"
                            }
                        else:
                            print("  ⚠️ Metrics endpoint available but no metrics data")
                            return {
                                "success": False,
                                "message": "Metrics endpoint returns empty/invalid data",
                                "content": content[:200]  # First 200 chars for debugging
                            }
                    else:
                        print(f"  ❌ Metrics endpoint returned status {response.status}")
                        return {
                            "success": False,
                            "status_code": response.status,
                            "message": f"Metrics endpoint returned {response.status}"
                        }
                        
        except Exception as e:
            print(f"  ❌ Error testing metrics endpoint: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to test metrics endpoint"
            }

    async def test_metrics_summary_endpoint(self) -> Dict[str, Any]:
        """Test the human-readable metrics summary endpoint"""
        print("📈 Testing metrics summary endpoint...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/metrics/summary") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get("success") and "data" in data:
                            metrics_data = data["data"]
                            print(f"  ✅ Metrics summary available")
                            print(f"    - Metrics enabled: {metrics_data.get('metrics_enabled')}")
                            print(f"    - Prometheus available: {metrics_data.get('prometheus_available')}")
                            
                            return {
                                "success": True,
                                "metrics_enabled": metrics_data.get('metrics_enabled'),
                                "prometheus_available": metrics_data.get('prometheus_available'),
                                "message": "Metrics summary endpoint working"
                            }
                        else:
                            print("  ❌ Invalid response format from metrics summary")
                            return {
                                "success": False,
                                "response_data": data,
                                "message": "Invalid metrics summary response format"
                            }
                    else:
                        print(f"  ❌ Metrics summary endpoint returned status {response.status}")
                        return {
                            "success": False,
                            "status_code": response.status,
                            "message": f"Metrics summary endpoint returned {response.status}"
                        }
                        
        except Exception as e:
            print(f"  ❌ Error testing metrics summary endpoint: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to test metrics summary endpoint"
            }

    async def test_logging_consistency(self) -> Dict[str, Any]:
        """Test that multiple requests maintain logging consistency"""
        print("📝 Testing logging consistency across requests...")
        
        request_ids = []
        
        try:
            async with aiohttp.ClientSession() as session:
                # Make multiple requests and collect request IDs
                for i in range(3):
                    async with session.get(f"{self.base_url}/api/health") as response:
                        request_id = response.headers.get("X-Request-ID")
                        if request_id:
                            request_ids.append(request_id)
                        await asyncio.sleep(0.1)  # Small delay between requests
                
                # Verify all request IDs are unique
                unique_ids = len(set(request_ids))
                total_ids = len(request_ids)
                
                if unique_ids == total_ids and total_ids > 0:
                    print(f"  ✅ All {total_ids} request IDs are unique")
                    return {
                        "success": True,
                        "total_requests": total_ids,
                        "unique_ids": unique_ids,
                        "request_ids": request_ids,
                        "message": "Request ID generation is working correctly"
                    }
                else:
                    print(f"  ❌ Request ID consistency issue: {unique_ids}/{total_ids} unique")
                    return {
                        "success": False,
                        "total_requests": total_ids,
                        "unique_ids": unique_ids,
                        "request_ids": request_ids,
                        "message": "Request IDs are not unique"
                    }
                    
        except Exception as e:
            print(f"  ❌ Error testing logging consistency: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to test logging consistency"
            }

    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all integration tests"""
        print("🔧 STRUCTURED LOGGING & METRICS INTEGRATION TESTS")
        print("=" * 55)
        
        tests = [
            ("request_id_headers", self.test_structured_logging_headers()),
            ("metrics_endpoint", self.test_metrics_endpoint()), 
            ("metrics_summary", self.test_metrics_summary_endpoint()),
            ("logging_consistency", self.test_logging_consistency())
        ]
        
        results = {}
        
        for test_name, test_coro in tests:
            print(f"\n🧪 Running {test_name}...")
            try:
                result = await test_coro
                results[test_name] = result
            except Exception as e:
                print(f"  ❌ Test {test_name} failed with exception: {e}")
                results[test_name] = {
                    "success": False,
                    "error": str(e),
                    "message": f"Test {test_name} threw exception"
                }
        
        # Calculate summary
        total_tests = len(results)
        passed_tests = len([r for r in results.values() if r.get("success", False)])
        
        print(f"\n" + "=" * 55)
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 55)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {total_tests - passed_tests}")
        print(f"📈 Success Rate: {(passed_tests / total_tests * 100):.1f}%")
        
        return {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": total_tests - passed_tests,
                "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0
            },
            "test_results": results
        }


async def run_logging_metrics_integration_tests():
    """Run the structured logging and metrics integration tests"""
    tester = StructuredLoggingMetricsIntegrationTest()
    return await tester.run_all_tests()


if __name__ == "__main__":
    # Run the integration tests
    results = asyncio.run(run_logging_metrics_integration_tests())
    
    # Exit with appropriate code based on results
    success_rate = results["summary"]["success_rate"]
    exit_code = 0 if success_rate >= 80 else 1
    exit(exit_code)
