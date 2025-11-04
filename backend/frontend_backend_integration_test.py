#!/usr/bin/env python3
"""
Comprehensive Frontend-Backend Integration Test
Tests all critical API endpoints through the frontend proxy to validate complete integration.
"""

import asyncio
import json
import sys
import time
from typing import Any, Dict, List

import aiohttp


class IntegrationTester:
    def __init__(self, frontend_url: str = "http://localhost:5173"):
        self.frontend_url = frontend_url
        self.backend_url = "http://localhost:8000"  # Direct backend for comparison
        self.results: List[Dict[str, Any]] = []

    async def test_endpoint(
        self,
        endpoint: str,
        method: str = "GET",
        data: Dict = None,
        description: str = None,
    ) -> Dict[str, Any]:
        """Test an endpoint through both frontend proxy and direct backend"""
        test_result = {
            "endpoint": endpoint,
            "method": method,
            "description": description or f"{method} {endpoint}",
            "frontend_success": False,
            "backend_success": False,
            "frontend_error": None,
            "backend_error": None,
            "frontend_response_time": 0,
            "backend_response_time": 0,
            "proxy_working": False,
        }

        async with aiohttp.ClientSession() as session:
            # Test through frontend proxy
            try:
                start_time = time.time()
                frontend_url = f"{self.frontend_url}{endpoint}"

                if method == "GET":
                    async with session.get(frontend_url) as response:
                        test_result["frontend_response_time"] = time.time() - start_time
                        test_result["frontend_status"] = response.status
                        if response.status < 400:
                            test_result["frontend_success"] = True
                            frontend_data = await response.text()
                            test_result["frontend_data_length"] = len(frontend_data)
                        else:
                            test_result["frontend_error"] = f"HTTP {response.status}"

                elif method == "POST":
                    async with session.post(frontend_url, json=data) as response:
                        test_result["frontend_response_time"] = time.time() - start_time
                        test_result["frontend_status"] = response.status
                        if response.status < 400:
                            test_result["frontend_success"] = True
                            frontend_data = await response.text()
                            test_result["frontend_data_length"] = len(frontend_data)
                        else:
                            test_result["frontend_error"] = f"HTTP {response.status}"

            except Exception as e:
                test_result["frontend_error"] = str(e)

            # Test direct backend (for comparison)
            try:
                start_time = time.time()
                backend_url = f"{self.backend_url}{endpoint}"

                if method == "GET":
                    async with session.get(backend_url) as response:
                        test_result["backend_response_time"] = time.time() - start_time
                        test_result["backend_status"] = response.status
                        if response.status < 400:
                            test_result["backend_success"] = True
                            backend_data = await response.text()
                            test_result["backend_data_length"] = len(backend_data)
                        else:
                            test_result["backend_error"] = f"HTTP {response.status}"

                elif method == "POST":
                    async with session.post(backend_url, json=data) as response:
                        test_result["backend_response_time"] = time.time() - start_time
                        test_result["backend_status"] = response.status
                        if response.status < 400:
                            test_result["backend_success"] = True
                            backend_data = await response.text()
                            test_result["backend_data_length"] = len(backend_data)
                        else:
                            test_result["backend_error"] = f"HTTP {response.status}"

            except Exception as e:
                test_result["backend_error"] = str(e)

        # Check if proxy is working correctly
        test_result["proxy_working"] = test_result["frontend_success"] == test_result[
            "backend_success"
        ] and test_result.get("frontend_status") == test_result.get("backend_status")

        return test_result

    async def run_comprehensive_test(self):
        """Run comprehensive integration tests"""
        print("🚀 Starting Comprehensive Frontend-Backend Integration Test")
        print("=" * 70)

        # Critical endpoints to test
        test_cases = [
            # Basic health endpoints
            {"endpoint": "/health", "description": "Basic health check"},
            {"endpoint": "/api/health", "description": "Unified API health check"},
            # MLB endpoints (core functionality)
            {"endpoint": "/mlb/todays-games", "description": "Today's MLB games"},
            {
                "endpoint": "/mlb/comprehensive-props/776869",
                "description": "Comprehensive props for game",
            },
            {"endpoint": "/mlb/prizepicks-props/", "description": "PrizePicks props"},
            # API endpoints
            {"endpoint": "/api/props/featured", "description": "Featured props API"},
            {"endpoint": "/api/mlb-bet-analysis", "description": "MLB bet analysis"},
            # Modern ML endpoints
            {"endpoint": "/api/modern-ml/health", "description": "Modern ML health"},
            {"endpoint": "/api/modern-ml/strategies", "description": "ML strategies"},
            # Phase 3 MLOps endpoints
            {"endpoint": "/api/phase3/health", "description": "Phase 3 MLOps health"},
            {
                "endpoint": "/api/phase3/health/mlops",
                "description": "MLOps service health",
            },
            {
                "endpoint": "/api/phase3/health/monitoring",
                "description": "Monitoring service health",
            },
            # Data validation endpoints
            {
                "endpoint": "/api/validation/health",
                "description": "Data validation health",
            },
            {
                "endpoint": "/api/validation/metrics",
                "description": "Validation metrics",
            },
            # POST endpoints
            {
                "endpoint": "/api/unified/batch-predictions",
                "method": "POST",
                "data": {"data_list": [{"test": "data"}]},
                "description": "Batch predictions",
            },
        ]

        # Run all tests
        for test_case in test_cases:
            result = await self.test_endpoint(**test_case)
            self.results.append(result)

            # Print immediate result
            status_icon = "✅" if result["proxy_working"] else "❌"
            print(f"{status_icon} {result['description']}")
            if not result["proxy_working"]:
                print(
                    f"   Frontend: {result.get('frontend_status', 'ERROR')} - {result.get('frontend_error', 'Success')}"
                )
                print(
                    f"   Backend:  {result.get('backend_status', 'ERROR')} - {result.get('backend_error', 'Success')}"
                )

        self.print_summary()

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 70)

        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r["proxy_working"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0

        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Failed: {total_tests - successful_tests}")
        print(f"Success Rate: {success_rate:.1f}%")

        # Performance metrics
        frontend_avg_time = sum(
            r["frontend_response_time"] for r in self.results if r["frontend_success"]
        ) / max(sum(1 for r in self.results if r["frontend_success"]), 1)
        backend_avg_time = sum(
            r["backend_response_time"] for r in self.results if r["backend_success"]
        ) / max(sum(1 for r in self.results if r["backend_success"]), 1)

        print(f"\nPerformance Metrics:")
        print(f"Average Frontend Response Time: {frontend_avg_time:.3f}s")
        print(f"Average Backend Response Time: {backend_avg_time:.3f}s")
        print(f"Proxy Overhead: {(frontend_avg_time - backend_avg_time):.3f}s")

        # Failed tests detail
        failed_tests = [r for r in self.results if not r["proxy_working"]]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['description']}")
                print(
                    f"     Frontend: {test.get('frontend_status', 'ERROR')} - {test.get('frontend_error', 'Success')}"
                )
                print(
                    f"     Backend:  {test.get('backend_status', 'ERROR')} - {test.get('backend_error', 'Success')}"
                )

        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if success_rate >= 90:
            print("✅ EXCELLENT - Frontend-backend integration is working perfectly!")
        elif success_rate >= 75:
            print("🟡 GOOD - Minor issues detected, but core functionality working")
        elif success_rate >= 50:
            print("🟠 FAIR - Significant issues detected, needs attention")
        else:
            print("❌ POOR - Major integration problems, requires immediate fix")

        # Save detailed results
        with open("integration_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
        print(f"\n📄 Detailed results saved to: integration_test_results.json")


async def main():
    """Main test execution"""
    tester = IntegrationTester()
    await tester.run_comprehensive_test()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        sys.exit(1)
