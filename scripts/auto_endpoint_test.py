#!/usr/bin/env python3
"""
Automated Endpoint Testing Script
Phase 4: End-to-End Integration & Testing

This script tests all critical backend endpoints to ensure they're working correctly.
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Any
import sys
import os

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

class EndpointTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.test_results = []
        
    async def initialize(self):
        """Initialize HTTP session"""
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)
        
    async def cleanup(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
    
    async def test_endpoint(self, endpoint: str, method: str = "GET", data: Dict = None, expected_status: int = 200) -> Dict[str, Any]:
        """Test a single endpoint"""
        test_start = time.time()
        test_result = {
            "endpoint": endpoint,
            "method": method,
            "expected_status": expected_status,
            "actual_status": None,
            "response_time": None,
            "success": False,
            "error": None,
            "response_data": None
        }
        
        try:
            url = f"{self.base_url}{endpoint}"
            print(f"🔄 Testing {method} {endpoint}")
            
            if method == "GET":
                async with self.session.get(url) as response:
                    test_result["actual_status"] = response.status
                    test_result["response_time"] = time.time() - test_start
                    
                    if response.status == expected_status:
                        test_result["success"] = True
                        if response.content_type == 'application/json':
                            test_result["response_data"] = await response.json()
                        print(f"✅ {endpoint} - Status: {response.status} ({test_result['response_time']:.3f}s)")
                    else:
                        print(f"❌ {endpoint} - Expected: {expected_status}, Got: {response.status}")
                        
            elif method == "POST":
                async with self.session.post(url, json=data) as response:
                    test_result["actual_status"] = response.status
                    test_result["response_time"] = time.time() - test_start
                    
                    if response.status == expected_status:
                        test_result["success"] = True
                        if response.content_type == 'application/json':
                            test_result["response_data"] = await response.json()
                        print(f"✅ {endpoint} - Status: {response.status} ({test_result['response_time']:.3f}s)")
                    else:
                        print(f"❌ {endpoint} - Expected: {expected_status}, Got: {response.status}")
                        
        except asyncio.TimeoutError:
            test_result["error"] = "Timeout"
            test_result["response_time"] = time.time() - test_start
            print(f"⏱️ {endpoint} - Timeout after {test_result['response_time']:.3f}s")
            
        except Exception as e:
            test_result["error"] = str(e)
            test_result["response_time"] = time.time() - test_start
            print(f"❌ {endpoint} - Error: {e}")
        
        self.test_results.append(test_result)
        return test_result
    
    async def run_health_tests(self):
        """Test health endpoints"""
        print("\n🏥 Testing Health Endpoints")
        print("=" * 50)
        
        await self.test_endpoint("/health")
        await self.test_endpoint("/api/health")
        await self.test_endpoint("/api/health/status")
        await self.test_endpoint("/api/health/comprehensive")
        
    async def run_prizepicks_tests(self):
        """Test PrizePicks endpoints"""
        print("\n🏀 Testing PrizePicks Endpoints")
        print("=" * 50)
        
        await self.test_endpoint("/api/prizepicks/props")
        await self.test_endpoint("/api/prizepicks/props?sport=NBA")
        await self.test_endpoint("/api/prizepicks/props?min_confidence=80")
        await self.test_endpoint("/api/prizepicks/comprehensive-projections")
        await self.test_endpoint("/api/prizepicks/recommendations")
        await self.test_endpoint("/api/prizepicks/health")
        
        # Test lineup optimization
        lineup_data = {
            "entries": [
                {"id": "test1", "confidence": 85, "ml_prediction": {"confidence": 85, "risk_assessment": {"level": "low"}}},
                {"id": "test2", "confidence": 78, "ml_prediction": {"confidence": 78, "risk_assessment": {"level": "medium"}}}
            ],
            "optimization_params": {"strategy": "kelly"}
        }
        await self.test_endpoint("/api/prizepicks/lineup/optimize", method="POST", data=lineup_data)
    
    async def run_prediction_tests(self):
        """Test prediction endpoints"""
        print("\n🎯 Testing Prediction Endpoints")
        print("=" * 50)
        
        await self.test_endpoint("/features", method="POST", data={
            "game_id": 12345,
            "team_stats": {"points": 110, "rebounds": 45},
            "player_stats": {"points": 25, "assists": 8}
        })
        
        await self.test_endpoint("/predict", method="POST", data={
            "game_id": 12345,
            "team_stats": {"points": 110, "rebounds": 45},
            "player_stats": {"points": 25, "assists": 8}
        })
    
    async def run_autonomous_tests(self):
        """Test autonomous system endpoints"""
        print("\n🤖 Testing Autonomous System Endpoints")
        print("=" * 50)
        
        await self.test_endpoint("/api/autonomous/status")
        await self.test_endpoint("/api/autonomous/health")
        await self.test_endpoint("/api/autonomous/capabilities")
        
    def generate_report(self) -> Dict[str, Any]:
        """Generate test report"""
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        avg_response_time = sum(r["response_time"] for r in self.test_results if r["response_time"]) / total_tests
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "successful": successful_tests,
                "failed": failed_tests,
                "success_rate": (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
                "average_response_time": avg_response_time
            },
            "test_results": self.test_results,
            "failed_tests": [r for r in self.test_results if not r["success"]]
        }
        
        return report
    
    def print_summary(self):
        """Print test summary"""
        report = self.generate_report()
        summary = report["summary"]
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Successful: {summary['successful']} ✅")
        print(f"Failed: {summary['failed']} ❌")
        print(f"Success Rate: {summary['success_rate']:.1f}%")
        print(f"Average Response Time: {summary['average_response_time']:.3f}s")
        
        if summary["failed"] > 0:
            print(f"\n❌ FAILED TESTS:")
            for failed_test in report["failed_tests"]:
                print(f"  - {failed_test['method']} {failed_test['endpoint']}: {failed_test['error'] or f'Status {failed_test['actual_status']}'}")
        
        print(f"\n📅 Test completed at: {report['timestamp']}")
        
        # Save report to file
        report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"📄 Detailed report saved to: {report_file}")

async def main():
    """Main test execution"""
    print("🚀 A1Betting Backend Endpoint Testing")
    print("=" * 60)
    print(f"Start time: {datetime.now().isoformat()}")
    
    tester = EndpointTester()
    
    try:
        await tester.initialize()
        
        # Run all test suites
        await tester.run_health_tests()
        await tester.run_prizepicks_tests()
        await tester.run_prediction_tests()
        await tester.run_autonomous_tests()
        
        # Generate and print summary
        tester.print_summary()
        
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return 1
        
    finally:
        await tester.cleanup()
    
    # Return appropriate exit code
    report = tester.generate_report()
    return 0 if report["summary"]["failed"] == 0 else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
