#!/usr/bin/env python3
"""
Comprehensive Testing Framework

Addresses testing issues identified by autonomous analysis:
- Unit test configuration problems
- API connectivity testing
- Performance benchmarking
- Integration test automation
"""

import pytest
import asyncio
import aiohttp
import time
import json
import logging
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import subprocess
import sys
import os

@dataclass
class TestResult:
    test_name: str
    status: str  # 'passed', 'failed', 'skipped'
    execution_time: float
    error_message: Optional[str] = None
    details: Optional[Dict] = None

@dataclass
class TestSuite:
    name: str
    tests: List[TestResult]
    total_time: float
    pass_rate: float

class ComprehensiveTestFramework:
    def __init__(self):
        self.logger = self.setup_logging()
        self.test_results: List[TestResult] = []
        self.test_suites: List[TestSuite] = []
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Test configuration
        self.config = {
            'api_base_url': '${process.env.REACT_APP_API_URL || "http://localhost:8000"}',
            'timeout': 30,
            'retry_attempts': 3,
            'performance_threshold_ms': 2000
        }
    
    def setup_logging(self) -> logging.Logger:
        """Setup test framework logging"""
        logger = logging.getLogger('test_framework')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.FileHandler('test_framework.log')
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def initialize_test_environment(self):
        """Initialize test environment"""
        try:
            # Create HTTP session for API testing
            timeout = aiohttp.ClientTimeout(total=self.config['timeout'])
            self.session = aiohttp.ClientSession(timeout=timeout)
            
            # Ensure test directories exist
            test_dirs = ['reports', 'fixtures', 'mocks']
            for dir_name in test_dirs:
                Path(dir_name).mkdir(exist_ok=True)
            
            self.logger.info("Test environment initialized")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize test environment: {e}")
            raise
    
    async def cleanup_test_environment(self):
        """Cleanup test environment"""
        if self.session:
            await self.session.close()
        
        self.logger.info("Test environment cleaned up")
    
    async def test_api_connectivity(self) -> TestResult:
        """Test API connectivity and basic endpoints"""
        test_name = "api_connectivity"
        start_time = time.time()
        
        try:
            # Test health endpoint
            health_url = f"{self.config['api_base_url']}/api/health"
            
            async with self.session.get(health_url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    execution_time = time.time() - start_time
                    
                    return TestResult(
                        test_name=test_name,
                        status='passed',
                        execution_time=execution_time,
                        details={
                            'endpoint': health_url,
                            'status_code': response.status,
                            'response_data': data
                        }
                    )
                else:
                    execution_time = time.time() - start_time
                    return TestResult(
                        test_name=test_name,
                        status='failed',
                        execution_time=execution_time,
                        error_message=f"Health endpoint returned status {response.status}"
                    )
        
        except Exception as e:
            execution_time = time.time() - start_time
            return TestResult(
                test_name=test_name,
                status='failed',
                execution_time=execution_time,
                error_message=str(e)
            )
    
    async def test_api_endpoints(self) -> List[TestResult]:
        """Test multiple API endpoints"""
        endpoints_to_test = [
            {'method': 'GET', 'path': '/api/health', 'expected_status': 200},
            {'method': 'GET', 'path': '/api/v1/predictions', 'expected_status': [200, 401]},
            {'method': 'GET', 'path': '/api/v1/performance-stats', 'expected_status': [200, 401]},
            {'method': 'GET', 'path': '/docs', 'expected_status': 200},
        ]
        
        results = []
        
        for endpoint in endpoints_to_test:
            test_name = f"api_endpoint_{endpoint['method']}_{endpoint['path'].replace('/', '_')}"
            start_time = time.time()
            
            try:
                url = f"{self.config['api_base_url']}{endpoint['path']}"
                
                async with self.session.request(endpoint['method'], url) as response:
                    execution_time = time.time() - start_time
                    
                    expected_statuses = endpoint['expected_status']
                    if not isinstance(expected_statuses, list):
                        expected_statuses = [expected_statuses]
                    
                    if response.status in expected_statuses:
                        status = 'passed'
                        error_message = None
                    else:
                        status = 'failed'
                        error_message = f"Expected status {expected_statuses}, got {response.status}"
                    
                    results.append(TestResult(
                        test_name=test_name,
                        status=status,
                        execution_time=execution_time,
                        error_message=error_message,
                        details={
                            'endpoint': url,
                            'method': endpoint['method'],
                            'status_code': response.status,
                            'expected_status': expected_statuses
                        }
                    ))
            
            except Exception as e:
                execution_time = time.time() - start_time
                results.append(TestResult(
                    test_name=test_name,
                    status='failed',
                    execution_time=execution_time,
                    error_message=str(e)
                ))
        
        return results
    
    def test_unit_tests_with_pytest(self) -> TestResult:
        """Run unit tests using pytest with proper configuration"""
        test_name = "unit_tests_pytest"
        start_time = time.time()
        
        try:
            # Create pytest configuration to fix the issues found
            pytest_config = """
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
    --color=yes
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
"""
            
            # Write pytest.ini file
            with open('pytest.ini', 'w') as f:
                f.write(pytest_config)
            
            # Run pytest
            result = subprocess.run([
                sys.executable, '-m', 'pytest',
                '--tb=short',
                '-v',
                '--color=yes'
            ], capture_output=True, text=True, cwd='.')
            
            execution_time = time.time() - start_time
            
            if result.returncode == 0:
                status = 'passed'
                error_message = None
            else:
                status = 'failed'
                error_message = result.stderr
            
            return TestResult(
                test_name=test_name,
                status=status,
                execution_time=execution_time,
                error_message=error_message,
                details={
                    'return_code': result.returncode,
                    'stdout': result.stdout,
                    'stderr': result.stderr
                }
            )
        
        except Exception as e:
            execution_time = time.time() - start_time
            return TestResult(
                test_name=test_name,
                status='failed',
                execution_time=execution_time,
                error_message=str(e)
            )
    
    async def test_performance_benchmarks(self) -> List[TestResult]:
        """Run performance benchmark tests"""
        benchmarks = [
            {
                'name': 'api_response_time',
                'endpoint': '/api/health',
                'max_response_time_ms': 1000
            },
            {
                'name': 'prediction_endpoint_performance',
                'endpoint': '/api/v1/predictions',
                'max_response_time_ms': 2000
            }
        ]
        
        results = []
        
        for benchmark in benchmarks:
            test_name = f"performance_{benchmark['name']}"
            start_time = time.time()
            
            try:
                url = f"{self.config['api_base_url']}{benchmark['endpoint']}"
                
                # Run multiple requests to get average
                response_times = []
                for _ in range(5):
                    request_start = time.time()
                    
                    try:
                        async with self.session.get(url) as response:
                            await response.read()  # Ensure full response is received
                            request_time = (time.time() - request_start) * 1000  # Convert to ms
                            response_times.append(request_time)
                    except:
                        # Skip failed requests for performance testing
                        continue
                
                execution_time = time.time() - start_time
                
                if response_times:
                    avg_response_time = sum(response_times) / len(response_times)
                    max_allowed = benchmark['max_response_time_ms']
                    
                    if avg_response_time <= max_allowed:
                        status = 'passed'
                        error_message = None
                    else:
                        status = 'failed'
                        error_message = f"Average response time {avg_response_time:.1f}ms exceeds limit {max_allowed}ms"
                    
                    results.append(TestResult(
                        test_name=test_name,
                        status=status,
                        execution_time=execution_time,
                        error_message=error_message,
                        details={
                            'avg_response_time_ms': avg_response_time,
                            'max_allowed_ms': max_allowed,
                            'all_response_times': response_times
                        }
                    ))
                else:
                    results.append(TestResult(
                        test_name=test_name,
                        status='failed',
                        execution_time=execution_time,
                        error_message="No successful requests for performance testing"
                    ))
            
            except Exception as e:
                execution_time = time.time() - start_time
                results.append(TestResult(
                    test_name=test_name,
                    status='failed',
                    execution_time=execution_time,
                    error_message=str(e)
                ))
        
        return results
    
    def test_system_resources(self) -> TestResult:
        """Test system resource usage"""
        test_name = "system_resources"
        start_time = time.time()
        
        try:
            import psutil
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            execution_time = time.time() - start_time
            
            # Check if resources are within acceptable limits
            issues = []
            if cpu_percent > 90:
                issues.append(f"High CPU usage: {cpu_percent}%")
            if memory.percent > 90:
                issues.append(f"High memory usage: {memory.percent}%")
            if disk.percent > 90:
                issues.append(f"High disk usage: {disk.percent}%")
            
            if issues:
                status = 'failed'
                error_message = "; ".join(issues)
            else:
                status = 'passed'
                error_message = None
            
            return TestResult(
                test_name=test_name,
                status=status,
                execution_time=execution_time,
                error_message=error_message,
                details={
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory.percent,
                    'disk_percent': disk.percent,
                    'memory_available_gb': memory.available / (1024**3),
                    'disk_free_gb': disk.free / (1024**3)
                }
            )
        
        except ImportError:
            execution_time = time.time() - start_time
            return TestResult(
                test_name=test_name,
                status='skipped',
                execution_time=execution_time,
                error_message="psutil not available for system resource testing"
            )
        except Exception as e:
            execution_time = time.time() - start_time
            return TestResult(
                test_name=test_name,
                status='failed',
                execution_time=execution_time,
                error_message=str(e)
            )
    
    async def run_comprehensive_test_suite(self) -> Dict:
        """Run the complete test suite"""
        self.logger.info("Starting comprehensive test suite")
        suite_start_time = time.time()
        
        await self.initialize_test_environment()
        
        try:
            all_results = []
            
            # API Connectivity Tests
            self.logger.info("Running API connectivity tests")
            connectivity_result = await self.test_api_connectivity()
            all_results.append(connectivity_result)
            
            # API Endpoint Tests
            self.logger.info("Running API endpoint tests")
            endpoint_results = await self.test_api_endpoints()
            all_results.extend(endpoint_results)
            
            # Unit Tests
            self.logger.info("Running unit tests")
            unit_test_result = self.test_unit_tests_with_pytest()
            all_results.append(unit_test_result)
            
            # Performance Tests
            self.logger.info("Running performance benchmarks")
            performance_results = await self.test_performance_benchmarks()
            all_results.extend(performance_results)
            
            # System Resource Tests
            self.logger.info("Running system resource tests")
            resource_result = self.test_system_resources()
            all_results.append(resource_result)
            
            suite_end_time = time.time()
            total_time = suite_end_time - suite_start_time
            
            # Calculate statistics
            passed_tests = [r for r in all_results if r.status == 'passed']
            failed_tests = [r for r in all_results if r.status == 'failed']
            skipped_tests = [r for r in all_results if r.status == 'skipped']
            
            pass_rate = len(passed_tests) / len(all_results) * 100 if all_results else 0
            
            # Create test suite
            test_suite = TestSuite(
                name="comprehensive_test_suite",
                tests=all_results,
                total_time=total_time,
                pass_rate=pass_rate
            )
            
            self.test_suites.append(test_suite)
            
            # Generate report
            report = {
                'timestamp': datetime.now().isoformat(),
                'total_tests': len(all_results),
                'passed': len(passed_tests),
                'failed': len(failed_tests),
                'skipped': len(skipped_tests),
                'pass_rate': pass_rate,
                'total_time': total_time,
                'test_results': [asdict(result) for result in all_results],
                'recommendations': self.generate_test_recommendations(all_results)
            }
            
            # Save report
            self.save_test_report(report)
            
            self.logger.info(f"Test suite completed: {len(passed_tests)}/{len(all_results)} tests passed")
            
            return report
        
        finally:
            await self.cleanup_test_environment()
    
    def generate_test_recommendations(self, results: List[TestResult]) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        failed_tests = [r for r in results if r.status == 'failed']
        
        # API connectivity recommendations
        api_failures = [r for r in failed_tests if 'api' in r.test_name]
        if api_failures:
            recommendations.append("API connectivity issues detected - ensure backend service is running")
        
        # Performance recommendations
        perf_failures = [r for r in failed_tests if 'performance' in r.test_name]
        if perf_failures:
            recommendations.append("Performance issues detected - consider optimization or infrastructure scaling")
        
        # Unit test recommendations
        unit_failures = [r for r in failed_tests if 'unit' in r.test_name]
        if unit_failures:
            recommendations.append("Unit test configuration issues - check pytest setup and dependencies")
        
        # Resource recommendations
        resource_failures = [r for r in failed_tests if 'resource' in r.test_name]
        if resource_failures:
            recommendations.append("System resource issues - monitor CPU, memory, and disk usage")
        
        # General recommendations
        if len(failed_tests) > len(results) * 0.5:
            recommendations.append("High failure rate - review system configuration and dependencies")
        
        recommendations.extend([
            "Run tests regularly in CI/CD pipeline",
            "Monitor test performance trends over time",
            "Implement test data fixtures for consistency",
            "Add integration tests for critical user flows"
        ])
        
        return recommendations
    
    def save_test_report(self, report: Dict, filename: str = None):
        """Save test report to file"""
        if not filename:
            filename = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.logger.info(f"Test report saved to {filename}")
    
    def get_test_summary(self) -> Dict:
        """Get summary of all test runs"""
        if not self.test_suites:
            return {'message': 'No test suites have been run'}
        
        latest_suite = self.test_suites[-1]
        
        return {
            'latest_run': {
                'timestamp': datetime.now().isoformat(),
                'total_tests': len(latest_suite.tests),
                'pass_rate': latest_suite.pass_rate,
                'total_time': latest_suite.total_time
            },
            'historical_data': {
                'total_runs': len(self.test_suites),
                'avg_pass_rate': sum(s.pass_rate for s in self.test_suites) / len(self.test_suites)
            }
        }

# Global instance
test_framework = ComprehensiveTestFramework()

async def main():
    """Demo the comprehensive test framework"""
    print("🧪 Comprehensive Test Framework")
    print("=" * 40)
    
    try:
        # Run comprehensive test suite
        report = await test_framework.run_comprehensive_test_suite()
        
        print(f"📊 Test Results:")
        print(f"  • Total tests: {report['total_tests']}")
        print(f"  • Passed: {report['passed']}")
        print(f"  • Failed: {report['failed']}")
        print(f"  • Pass rate: {report['pass_rate']:.1f}%")
        print(f"  • Total time: {report['total_time']:.2f}s")
        
        if report['failed'] > 0:
            print(f"\n⚠️  Failed tests:")
            failed_tests = [r for r in report['test_results'] if r['status'] == 'failed']
            for test in failed_tests[:5]:  # Show first 5 failures
                print(f"  • {test['test_name']}: {test['error_message']}")
        
        print(f"\n💡 Recommendations:")
        for rec in report['recommendations'][:5]:  # Show first 5 recommendations
            print(f"  • {rec}")
        
    except Exception as e:
        print(f"❌ Test framework error: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 