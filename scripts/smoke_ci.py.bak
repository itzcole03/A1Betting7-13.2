#!/usr/bin/env python3
"""
A1Betting CI Smoke Test Runner
=============================

Lightweight smoke test runner designed for CI/CD pipelines with no external dependencies.
Uses only Python standard library for maximum compatibility across platforms.

Epic 7 Implementation:
- Cross-platform support (Linux/Windows/macOS)
- JSON/XML output for CI integration
- Performance benchmarking
- Parallel test execution
- Exit codes for pipeline integration
"""

import argparse
import json
import os
import platform
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple


class CISmokeTest:
    """CI-optimized smoke test runner"""
    
    def __init__(self, base_url: str = "http://localhost:8000", timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.results: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "platform": {
                "system": platform.system(),
                "release": platform.release(),
                "architecture": platform.architecture()[0],
                "python_version": platform.python_version()
            },
            "test_results": [],
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "warnings": 0,
                "duration_seconds": 0
            },
            "performance_metrics": {
                "response_times": [],
                "throughput_rps": 0,
                "error_rate": 0
            }
        }
        self.start_time = time.time()
    
    def make_request(self, endpoint: str, method: str = "GET", timeout: Optional[int] = None) -> Tuple[bool, Dict[str, Any]]:
        """Make HTTP request using urllib (no external dependencies)"""
        
        url = f"{self.base_url}{endpoint}"
        request_timeout = timeout or self.timeout
        start_time = time.time()
        
        try:
            if method == "HEAD":
                req = urllib.request.Request(url, method="HEAD")
            else:
                req = urllib.request.Request(url)
            
            with urllib.request.urlopen(req, timeout=request_timeout) as response:
                response_time = (time.time() - start_time) * 1000  # ms
                
                result = {
                    "success": True,
                    "status_code": response.status,
                    "response_time_ms": round(response_time, 2),
                    "headers": dict(response.headers),
                    "error": None
                }
                
                if method != "HEAD":
                    try:
                        content = response.read().decode('utf-8')
                        if response.headers.get('content-type', '').startswith('application/json'):
                            result["data"] = json.loads(content)
                        else:
                            result["content"] = content[:1000]  # Truncate large responses
                    except (json.JSONDecodeError, UnicodeDecodeError) as e:
                        result["content"] = str(e)
                
                # Track performance metrics
                self.results["performance_metrics"]["response_times"].append(response_time)
                
                return True, result
                
        except urllib.error.HTTPError as e:
            response_time = (time.time() - start_time) * 1000
            return False, {
                "success": False,
                "status_code": e.code,
                "response_time_ms": round(response_time, 2),
                "error": f"HTTP {e.code}: {e.reason}",
                "headers": dict(e.headers) if hasattr(e, 'headers') else {}
            }
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return False, {
                "success": False,
                "status_code": 0,
                "response_time_ms": round(response_time, 2),
                "error": str(e),
                "headers": {}
            }
    
    def test_health_endpoint(self) -> Dict[str, Any]:
        """Test basic health endpoint"""
        success, result = self.make_request("/health")
        
        return {
            "test_name": "health_endpoint",
            "description": "Basic health check",
            "critical": True,
            "success": success,
            "details": result
        }
    
    def test_capability_matrix(self) -> Dict[str, Any]:
        """Test service capability matrix endpoint"""
        success, result = self.make_request("/api/system/capabilities")
        
        # Additional validation for capability matrix
        if success and result.get("data"):
            capabilities = result["data"]
            if isinstance(capabilities, list) and len(capabilities) > 0:
                # Check that each capability has required fields
                required_fields = ["service_name", "status", "version"]
                valid_capabilities = all(
                    all(field in cap for field in required_fields)
                    for cap in capabilities
                )
                if not valid_capabilities:
                    success = False
                    result["error"] = "Missing required fields in capability matrix"
        
        return {
            "test_name": "capability_matrix",
            "description": "Service capability matrix validation",
            "critical": True,
            "success": success,
            "details": result
        }
    
    def test_head_endpoints(self) -> Dict[str, Any]:
        """Test HEAD endpoints for resource existence"""
        endpoints_to_test = [
            "/api/system/capabilities",
            "/api/models/registry"
        ]
        
        head_results = []
        overall_success = True
        
        for endpoint in endpoints_to_test:
            success, result = self.make_request(endpoint, method="HEAD")
            head_results.append({
                "endpoint": endpoint,
                "success": success,
                "status_code": result.get("status_code", 0),
                "response_time_ms": result.get("response_time_ms", 0)
            })
            if not success:
                overall_success = False
        
        return {
            "test_name": "head_endpoints",
            "description": "HEAD endpoint functionality",
            "critical": False,
            "success": overall_success,
            "details": {
                "endpoints_tested": len(endpoints_to_test),
                "results": head_results
            }
        }
    
    def test_model_registry(self) -> Dict[str, Any]:
        """Test ML model registry endpoint"""
        success, result = self.make_request("/api/models/registry")
        
        # Validate model registry response structure
        if success and result.get("data"):
            models = result["data"]
            if isinstance(models, list):
                # Check model structure
                for model in models:
                    if not isinstance(model, dict):
                        success = False
                        result["error"] = "Invalid model structure in registry"
                        break
                    required_model_fields = ["model_id", "name", "version", "stage", "status"]
                    if not all(field in model for field in required_model_fields):
                        success = False
                        result["error"] = f"Missing required fields in model: {model.get('model_id', 'unknown')}"
                        break
        
        return {
            "test_name": "model_registry",
            "description": "ML model registry validation",
            "critical": False,
            "success": success,
            "details": result
        }
    
    def test_websocket_health(self) -> Dict[str, Any]:
        """Test WebSocket health (simplified for CI)"""
        # Since WebSocket testing is complex in CI, we'll test the HTTP endpoint
        # that provides WebSocket status
        success, result = self.make_request("/api/websocket/status", timeout=10)
        
        return {
            "test_name": "websocket_health",
            "description": "WebSocket service availability",
            "critical": False,
            "success": success,
            "details": result
        }
    
    def run_performance_benchmark(self) -> Dict[str, Any]:
        """Run performance benchmarks"""
        benchmark_endpoints = [
            "/health",
            "/api/system/capabilities"
        ]
        
        benchmark_results = []
        
        for endpoint in benchmark_endpoints:
            # Run multiple requests to get average performance
            times = []
            successes = 0
            
            for _ in range(5):  # 5 requests per endpoint
                success, result = self.make_request(endpoint)
                if success:
                    successes += 1
                    times.append(result.get("response_time_ms", 0))
            
            if times:
                avg_time = sum(times) / len(times)
                min_time = min(times)
                max_time = max(times)
                success_rate = (successes / 5) * 100
                
                benchmark_results.append({
                    "endpoint": endpoint,
                    "avg_response_time_ms": round(avg_time, 2),
                    "min_response_time_ms": round(min_time, 2),
                    "max_response_time_ms": round(max_time, 2),
                    "success_rate_percent": success_rate
                })
        
        return {
            "test_name": "performance_benchmark",
            "description": "API performance benchmarking",
            "critical": False,
            "success": len(benchmark_results) > 0,
            "details": {
                "benchmarks": benchmark_results,
                "total_requests": len(benchmark_endpoints) * 5
            }
        }
    
    def run_all_tests(self, parallel: bool = False) -> Dict[str, Any]:
        """Run all smoke tests"""
        
        test_methods = [
            self.test_health_endpoint,
            self.test_capability_matrix,
            self.test_head_endpoints,
            self.test_model_registry,
            self.test_websocket_health
        ]
        
        if parallel:
            # Run tests in parallel
            with ThreadPoolExecutor(max_workers=5) as executor:
                future_to_test = {executor.submit(test): test.__name__ for test in test_methods}
                
                for future in as_completed(future_to_test):
                    test_result = future.result()
                    self.results["test_results"].append(test_result)
        else:
            # Run tests sequentially
            for test_method in test_methods:
                test_result = test_method()
                self.results["test_results"].append(test_result)
        
        # Run performance benchmark separately
        benchmark_result = self.run_performance_benchmark()
        self.results["test_results"].append(benchmark_result)
        
        # Calculate summary
        self.calculate_summary()
        
        return self.results
    
    def calculate_summary(self):
        """Calculate test summary and performance metrics"""
        self.results["summary"]["total_tests"] = len(self.results["test_results"])
        self.results["summary"]["duration_seconds"] = round(time.time() - self.start_time, 2)
        
        for test in self.results["test_results"]:
            if test["success"]:
                self.results["summary"]["passed"] += 1
            else:
                if test["critical"]:
                    self.results["summary"]["failed"] += 1
                else:
                    self.results["summary"]["warnings"] += 1
        
        # Calculate performance metrics
        response_times = self.results["performance_metrics"]["response_times"]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            self.results["performance_metrics"]["avg_response_time_ms"] = round(avg_response_time, 2)
            self.results["performance_metrics"]["min_response_time_ms"] = round(min(response_times), 2)
            self.results["performance_metrics"]["max_response_time_ms"] = round(max(response_times), 2)
            
            # Calculate approximate throughput (very rough estimate)
            total_time = self.results["summary"]["duration_seconds"]
            if total_time > 0:
                self.results["performance_metrics"]["throughput_rps"] = round(
                    len(response_times) / total_time, 2
                )
        
        # Calculate error rate
        total_requests = len(response_times) if response_times else 0
        failed_requests = sum(1 for test in self.results["test_results"] if not test["success"])
        if total_requests > 0:
            self.results["performance_metrics"]["error_rate"] = round(
                (failed_requests / total_requests) * 100, 2
            )
    
    def get_exit_code(self) -> int:
        """Get appropriate exit code for CI"""
        if self.results["summary"]["failed"] > 0:
            return 1  # Critical failures
        elif self.results["summary"]["warnings"] > 0:
            return 2  # Warnings only
        else:
            return 0  # All tests passed


def format_output(results: Dict[str, Any], format_type: str) -> str:
    """Format results for different output types"""
    
    if format_type == "json":
        return json.dumps(results, indent=2)
    
    elif format_type == "summary":
        summary = results["summary"]
        platform_info = results["platform"]
        
        output = f"""
🧪 A1Betting Smoke Test Results
==============================
Platform: {platform_info["system"]} {platform_info["release"]} ({platform_info["architecture"]})
Python: {platform_info["python_version"]}
Timestamp: {results["timestamp"]}

📊 Summary:
- Total Tests: {summary["total_tests"]}
- ✅ Passed: {summary["passed"]}
- ❌ Failed: {summary["failed"]}
- ⚠️ Warnings: {summary["warnings"]}
- Duration: {summary["duration_seconds"]}s

⚡ Performance:
- Avg Response Time: {results["performance_metrics"].get("avg_response_time_ms", 0)}ms
- Error Rate: {results["performance_metrics"].get("error_rate", 0)}%
- Throughput: {results["performance_metrics"].get("throughput_rps", 0)} RPS

🔍 Test Details:
"""
        
        for test in results["test_results"]:
            status = "✅" if test["success"] else ("❌" if test["critical"] else "⚠️")
            output += f"{status} {test['test_name']}: {test['description']}\n"
            if not test["success"] and test["details"].get("error"):
                output += f"   Error: {test['details']['error']}\n"
        
        return output
    
    elif format_type == "xml":
        # JUnit XML format for CI integration
        xml_output = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml_output += f'<testsuites tests="{results["summary"]["total_tests"]}" '
        xml_output += f'failures="{results["summary"]["failed"]}" '
        xml_output += f'time="{results["summary"]["duration_seconds"]}">\n'
        xml_output += f'  <testsuite name="A1Betting Smoke Tests" tests="{results["summary"]["total_tests"]}">\n'
        
        for test in results["test_results"]:
            xml_output += f'    <testcase name="{test["test_name"]}" classname="SmokeTest"'
            if test["details"].get("response_time_ms"):
                xml_output += f' time="{test["details"]["response_time_ms"] / 1000}"'
            xml_output += '>\n'
            
            if not test["success"]:
                error_msg = test["details"].get("error", "Unknown error")
                xml_output += f'      <failure message="{error_msg}"/>\n'
            
            xml_output += '    </testcase>\n'
        
        xml_output += '  </testsuite>\n'
        xml_output += '</testsuites>\n'
        
        return xml_output
    
    else:
        return format_output(results, "summary")


def main():
    parser = argparse.ArgumentParser(description="A1Betting CI Smoke Test Runner")
    parser.add_argument("--base-url", default="http://localhost:8000", 
                       help="Base URL for API testing")
    parser.add_argument("--timeout", type=int, default=30,
                       help="Request timeout in seconds")
    parser.add_argument("--format", choices=["json", "summary", "xml"], default="summary",
                       help="Output format")
    parser.add_argument("--ci-mode", action="store_true",
                       help="Enable CI mode (less verbose, structured output)")
    parser.add_argument("--parallel", action="store_true",
                       help="Run tests in parallel")
    parser.add_argument("--benchmark", action="store_true",
                       help="Include performance benchmarks")
    parser.add_argument("--export-results", type=str,
                       help="Export results to file")
    parser.add_argument("--fail-fast", action="store_true",
                       help="Exit on first failure")
    
    args = parser.parse_args()
    
    # Initialize smoke test runner
    smoke_test = CISmokeTest(base_url=args.base_url, timeout=args.timeout)
    
    if args.ci_mode:
        print(f"🚀 Starting A1Betting smoke tests on {platform.system()}...")
    
    # Run tests
    try:
        results = smoke_test.run_all_tests(parallel=args.parallel)
        
        # Format and display results
        output = format_output(results, args.format)
        
        if not args.ci_mode or args.format in ["json", "xml"]:
            print(output)
        else:
            # CI mode - minimal output
            summary = results["summary"]
            print(f"✅ Tests: {summary['passed']}/{summary['total_tests']} passed "
                  f"({summary['failed']} failed, {summary['warnings']} warnings)")
            print(f"⚡ Performance: {results['performance_metrics'].get('avg_response_time_ms', 0)}ms avg response")
        
        # Export results if requested
        if args.export_results:
            with open(args.export_results, 'w') as f:
                json.dump(results, f, indent=2)
            if args.ci_mode:
                print(f"📁 Results exported to {args.export_results}")
        
        # Exit with appropriate code
        exit_code = smoke_test.get_exit_code()
        if args.ci_mode:
            print(f"🏁 Exit code: {exit_code}")
        
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"❌ Smoke test runner error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()