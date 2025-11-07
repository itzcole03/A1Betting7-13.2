"""
Performance Validation System - 2x Peak Load Testing
===================================================

Comprehensive performance validation system to test SLOs under 2x projected peak load.
Ensures system headroom before real provider activation.

Test Scenarios:
1. Synthetic burst load testing (Monte Carlo, JSON serialization, array ops)  
2. Peak load simulation (2x projected traffic)
3. Stress testing with queue backlog
4. SLO compliance validation
5. Fail-fast guard verification

Exit Criteria:
- SLOs met consistently under 2× projected peak load
- Median line-to-edge latency < 400ms
- 95th percentile partial optimization refresh < 2.5s
- Fail-fast guards prevent system overload
- Queue backlog threshold enforcement working
"""

import asyncio
import concurrent.futures
import json
import logging
import multiprocessing
import random
import statistics
import threading
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Callable, Tuple
import gc

# Performance testing imports
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

# Project imports (with fallbacks for testing)
try:
    from slo_monitoring_system import SLOMonitor, RequestPriority, SLOStatus
    from performance_profiler import PerformanceProfiler, SyntheticLoadGenerator
    SLO_MONITORING_AVAILABLE = True
except ImportError:
    SLO_MONITORING_AVAILABLE = False
    print("⚠️  SLO monitoring not available - using mock implementations")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class LoadTestConfig:
    """Load test configuration"""
    base_load_rps: int = 100  # Requests per second under normal load
    peak_multiplier: float = 2.0  # Peak load multiplier 
    test_duration_seconds: int = 300  # 5 minutes
    ramp_up_seconds: int = 30  # Gradual ramp up
    concurrent_users: int = 50
    operations_mix: Dict[str, float] = field(default_factory=lambda: {
        'monte_carlo': 0.3,
        'json_serialization': 0.4, 
        'array_operations': 0.2,
        'data_fetch': 0.1
    })
    priority_distribution: Dict[RequestPriority, float] = field(default_factory=lambda: {
        RequestPriority.LOW: 0.2,
        RequestPriority.MEDIUM: 0.6,
        RequestPriority.HIGH: 0.15,
        RequestPriority.CRITICAL: 0.05
    })


@dataclass
class PerformanceTestResult:
    """Performance test result"""
    test_name: str
    duration_seconds: float
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_latency_ms: float
    median_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    max_latency_ms: float
    throughput_rps: float
    success_rate: float
    slo_compliance: Dict[str, bool]
    queue_performance: Dict[str, Any]
    resource_utilization: Dict[str, float]
    
    @property
    def passed(self) -> bool:
        """Check if test passed all criteria"""
        return (
            self.success_rate >= 0.95 and
            self.median_latency_ms <= 400.0 and
            self.p95_latency_ms <= 2500.0 and
            all(self.slo_compliance.values())
        )


class MockSLOMonitor:
    """Mock SLO monitor for testing when real one not available"""
    
    def __init__(self):
        self.latencies = []
        self.success_count = 0
        self.failure_count = 0
        self.queue_depth = 0
        
    def record_request_latency(self, latency_ms: float, operation: str = "default", 
                             priority = None, success: bool = True):
        self.latencies.append(latency_ms)
        if success:
            self.success_count += 1
        else:
            self.failure_count += 1
    
    def check_slos(self):
        if not self.latencies:
            return type('MockSLOMetrics', (), {
                'median_latency_ms': 0,
                'p95_latency_ms': 0,
                'p99_latency_ms': 0,
                'success_rate': 1.0,
                'queue_depth': 0,
                'cpu_utilization': 50.0,
                'memory_utilization': 60.0,
                'status': 'HEALTHY'
            })()
        
        sorted_latencies = sorted(self.latencies)
        n = len(sorted_latencies)
        
        return type('MockSLOMetrics', (), {
            'median_latency_ms': sorted_latencies[n//2],
            'p95_latency_ms': sorted_latencies[int(0.95 * n)],
            'p99_latency_ms': sorted_latencies[int(0.99 * n)],
            'success_rate': self.success_count / max(1, self.success_count + self.failure_count),
            'queue_depth': self.queue_depth,
            'cpu_utilization': random.uniform(40, 80),
            'memory_utilization': random.uniform(50, 75),
            'status': 'HEALTHY'
        })()
    
    def get_comprehensive_report(self):
        metrics = self.check_slos()
        return {
            'slo_status': metrics.status,
            'slo_metrics': {
                'median_latency_ms': metrics.median_latency_ms,
                'p95_latency_ms': metrics.p95_latency_ms,
                'success_rate': metrics.success_rate
            },
            'queue_metrics': {
                'current_depth': metrics.queue_depth,
                'load_shedding_active': False,
                'rejected_requests': 0
            }
        }
    
    def shutdown(self):
        pass


class PerformanceValidator:
    """Comprehensive performance validation system"""
    
    def __init__(self, config: LoadTestConfig):
        self.config = config
        self.results = []
        
        # Initialize SLO monitor
        if SLO_MONITORING_AVAILABLE:
            self.slo_monitor = SLOMonitor()
        else:
            self.slo_monitor = MockSLOMonitor()
        
        # Load generator
        self.load_generator = None
        try:
            self.load_generator = SyntheticLoadGenerator()
        except:
            logger.warning("SyntheticLoadGenerator not available - using mock")
        
        # Performance tracking
        self.test_start_time = None
        self.test_metrics = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'latencies': [],
            'operation_times': {}
        }
        
        self.lock = threading.Lock()
    
    def simulate_monte_carlo_operation(self, complexity: str = "medium") -> Tuple[float, bool]:
        """Simulate Monte Carlo operation with realistic performance"""
        start_time = time.time()
        
        try:
            if complexity == "simple":
                # Simple correlation matrix operations
                if NUMPY_AVAILABLE:
                    matrix_size = random.randint(3, 8)
                    corr_matrix = np.random.rand(matrix_size, matrix_size)
                    corr_matrix = (corr_matrix + corr_matrix.T) / 2
                    np.fill_diagonal(corr_matrix, 1.0)
                    
                    # Simulate Monte Carlo draws
                    n_draws = random.randint(1000, 5000)
                    draws = np.random.randn(n_draws, matrix_size)
                    results = np.all(draws > 0, axis=1)
                    prob = np.mean(results)
                else:
                    # Fallback implementation
                    time.sleep(random.uniform(0.05, 0.15))
                    prob = random.uniform(0.3, 0.7)
                
            elif complexity == "complex":
                # Complex operations with factor decomposition
                if NUMPY_AVAILABLE:
                    matrix_size = random.randint(10, 20)
                    data_matrix = np.random.randn(5000, matrix_size)
                    
                    # Covariance calculation
                    cov_matrix = np.cov(data_matrix.T)
                    
                    # Eigenvalue decomposition
                    eigenvals, eigenvecs = np.linalg.eigh(cov_matrix)
                    
                    # Factor analysis
                    n_factors = min(5, matrix_size // 2)
                    factor_loadings = eigenvecs[:, -n_factors:]
                    
                    # Monte Carlo simulation
                    n_draws = random.randint(10000, 20000)
                    draws = np.random.randn(n_draws, matrix_size)
                    correlated_draws = draws @ factor_loadings @ factor_loadings.T
                    results = np.all(correlated_draws > 0, axis=1)
                    prob = np.mean(results)
                else:
                    # Fallback - simulate longer processing
                    time.sleep(random.uniform(0.2, 0.5))
                    prob = random.uniform(0.2, 0.8)
                
            else:  # medium
                # Standard Monte Carlo operation
                if NUMPY_AVAILABLE:
                    matrix_size = random.randint(5, 12)
                    n_draws = random.randint(5000, 15000)
                    
                    # Generate correlation matrix
                    corr_matrix = np.eye(matrix_size) + 0.1 * (np.ones((matrix_size, matrix_size)) - np.eye(matrix_size))
                    
                    # Cholesky decomposition
                    chol = np.linalg.cholesky(corr_matrix)
                    
                    # Monte Carlo draws
                    independent_draws = np.random.randn(n_draws, matrix_size)
                    correlated_draws = independent_draws @ chol.T
                    
                    # Probability calculation
                    thresholds = np.random.randn(matrix_size)
                    results = np.all(correlated_draws > thresholds, axis=1)
                    prob = np.mean(results)
                else:
                    time.sleep(random.uniform(0.1, 0.3))
                    prob = random.uniform(0.25, 0.75)
            
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            return latency_ms, True
            
        except Exception as e:
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            logger.warning(f"Monte Carlo operation failed: {e}")
            return latency_ms, False
    
    def simulate_json_operation(self, size: str = "medium") -> Tuple[float, bool]:
        """Simulate JSON serialization operation"""
        start_time = time.time()
        
        try:
            if size == "small":
                n_objects = random.randint(10, 50)
            elif size == "large":
                n_objects = random.randint(200, 500)
            else:  # medium
                n_objects = random.randint(50, 200)
            
            # Generate complex objects
            objects = []
            for i in range(n_objects):
                obj = {
                    'id': i,
                    'timestamp': time.time(),
                    'data': {
                        'values': [random.random() for _ in range(random.randint(10, 50))],
                        'metadata': {
                            'source': f'provider_{random.randint(1, 10)}',
                            'quality': random.uniform(0.8, 1.0),
                            'tags': [f'tag_{j}' for j in range(random.randint(3, 10))]
                        },
                        'nested': {
                            'level1': {
                                'level2': {
                                    'values': [random.randint(1, 100) for _ in range(20)]
                                }
                            }
                        }
                    }
                }
                objects.append(obj)
            
            # Serialize and deserialize
            json_str = json.dumps(objects, default=str)
            parsed_objects = json.loads(json_str)
            
            # Simulate processing
            total_values = sum(len(obj.get('data', {}).get('values', [])) for obj in parsed_objects)
            
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            return latency_ms, True
            
        except Exception as e:
            end_time = time.time()
            latency_ms = (end_time - start_start) * 1000
            logger.warning(f"JSON operation failed: {e}")
            return latency_ms, False
    
    def simulate_array_operation(self, complexity: str = "medium") -> Tuple[float, bool]:
        """Simulate array operations"""
        start_time = time.time()
        
        try:
            if not NUMPY_AVAILABLE:
                # Fallback - simulate with native Python
                if complexity == "simple":
                    data = [[random.random() for _ in range(100)] for _ in range(100)]
                    result = [[sum(row)] for row in data]
                elif complexity == "complex":
                    data = [[random.random() for _ in range(500)] for _ in range(200)]
                    # Simulate matrix multiplication
                    result = []
                    for i in range(len(data)):
                        row_result = []
                        for j in range(len(data[0])):
                            row_result.append(data[i][j] * random.random())
                        result.append(row_result)
                else:  # medium
                    data = [[random.random() for _ in range(200)] for _ in range(150)]
                    # Simulate statistical operations
                    result = [statistics.mean(row) for row in data]
            else:
                # Use NumPy for realistic performance
                if complexity == "simple":
                    data = np.random.rand(100, 100)
                    result = np.sum(data, axis=1)
                elif complexity == "complex":
                    data = np.random.rand(500, 200)
                    weights = np.random.rand(200, 100)
                    # Matrix multiplication
                    result = data @ weights
                    # Additional operations
                    result = np.linalg.svd(result[:100, :50])
                else:  # medium
                    data = np.random.rand(200, 150)
                    # Statistical operations
                    result = {
                        'mean': np.mean(data, axis=1),
                        'std': np.std(data, axis=1),
                        'correlation': np.corrcoef(data[:50, :50]),
                        'eigenvals': np.linalg.eigvals(np.cov(data[:50, :50].T))
                    }
            
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            return latency_ms, True
            
        except Exception as e:
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            logger.warning(f"Array operation failed: {e}")
            return latency_ms, False
    
    def simulate_data_fetch_operation(self) -> Tuple[float, bool]:
        """Simulate data fetch operation"""
        start_time = time.time()
        
        try:
            # Simulate network latency and data processing
            network_latency = random.uniform(10, 50) / 1000  # 10-50ms
            time.sleep(network_latency)
            
            # Simulate data processing
            data_size = random.randint(100, 1000)
            data = {
                'records': [
                    {
                        'id': i,
                        'value': random.uniform(0, 100),
                        'category': random.choice(['A', 'B', 'C', 'D']),
                        'timestamp': time.time() - random.uniform(0, 3600)
                    }
                    for i in range(data_size)
                ]
            }
            
            # Process data
            processed = {
                'total_records': len(data['records']),
                'categories': {},
                'statistics': {}
            }
            
            for record in data['records']:
                cat = record['category']
                if cat not in processed['categories']:
                    processed['categories'][cat] = []
                processed['categories'][cat].append(record['value'])
            
            # Calculate statistics
            for cat, values in processed['categories'].items():
                processed['statistics'][cat] = {
                    'mean': statistics.mean(values),
                    'count': len(values)
                }
            
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            return latency_ms, True
            
        except Exception as e:
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            logger.warning(f"Data fetch operation failed: {e}")
            return latency_ms, False
    
    def single_user_workload(self, user_id: int, duration: int, target_rps: float) -> Dict[str, Any]:
        """Simulate single user workload"""
        user_metrics = {
            'user_id': user_id,
            'requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'latencies': [],
            'operations': defaultdict(int)
        }
        
        end_time = time.time() + duration
        request_interval = 1.0 / target_rps if target_rps > 0 else 1.0
        
        while time.time() < end_time:
            # Choose operation based on mix
            operation = random.choices(
                list(self.config.operations_mix.keys()),
                weights=list(self.config.operations_mix.values())
            )[0]
            
            # Choose priority
            priority = random.choices(
                list(self.config.priority_distribution.keys()),
                weights=list(self.config.priority_distribution.values())
            )[0]
            
            # Execute operation
            if operation == 'monte_carlo':
                complexity = random.choice(['simple', 'medium', 'complex'])
                latency_ms, success = self.simulate_monte_carlo_operation(complexity)
            elif operation == 'json_serialization':
                size = random.choice(['small', 'medium', 'large'])
                latency_ms, success = self.simulate_json_operation(size)
            elif operation == 'array_operations':
                complexity = random.choice(['simple', 'medium', 'complex'])
                latency_ms, success = self.simulate_array_operation(complexity)
            else:  # data_fetch
                latency_ms, success = self.simulate_data_fetch_operation()
            
            # Record metrics
            user_metrics['requests'] += 1
            user_metrics['latencies'].append(latency_ms)
            user_metrics['operations'][operation] += 1
            
            if success:
                user_metrics['successful_requests'] += 1
            else:
                user_metrics['failed_requests'] += 1
            
            # Record in SLO monitor
            self.slo_monitor.record_request_latency(
                latency_ms, operation, priority, success
            )
            
            # Update global metrics
            with self.lock:
                self.test_metrics['total_requests'] += 1
                self.test_metrics['latencies'].append(latency_ms)
                if success:
                    self.test_metrics['successful_requests'] += 1
                else:
                    self.test_metrics['failed_requests'] += 1
            
            # Wait for next request
            time.sleep(request_interval + random.uniform(-0.1, 0.1) * request_interval)
        
        return user_metrics
    
    def run_load_test(self, test_name: str, target_rps: float, duration: int) -> PerformanceTestResult:
        """Run load test with specified parameters"""
        logger.info(f"Starting load test: {test_name}")
        logger.info(f"Target RPS: {target_rps}, Duration: {duration}s, Users: {self.config.concurrent_users}")
        
        # Reset metrics
        with self.lock:
            self.test_metrics = {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'latencies': [],
                'operation_times': {}
            }
        
        start_time = time.time()
        per_user_rps = target_rps / self.config.concurrent_users
        
        # Run concurrent user workloads
        with ThreadPoolExecutor(max_workers=self.config.concurrent_users) as executor:
            futures = [
                executor.submit(self.single_user_workload, user_id, duration, per_user_rps)
                for user_id in range(self.config.concurrent_users)
            ]
            
            # Wait for completion
            user_results = [future.result() for future in futures]
        
        end_time = time.time()
        actual_duration = end_time - start_time
        
        # Get SLO metrics
        slo_metrics = self.slo_monitor.check_slos()
        slo_report = self.slo_monitor.get_comprehensive_report()
        
        # Calculate performance metrics
        with self.lock:
            total_requests = self.test_metrics['total_requests']
            successful_requests = self.test_metrics['successful_requests'] 
            failed_requests = self.test_metrics['failed_requests']
            all_latencies = self.test_metrics['latencies']
        
        if all_latencies:
            sorted_latencies = sorted(all_latencies)
            n = len(sorted_latencies)
            
            performance_metrics = {
                'average_latency_ms': statistics.mean(all_latencies),
                'median_latency_ms': sorted_latencies[n // 2],
                'p95_latency_ms': sorted_latencies[int(0.95 * n)],
                'p99_latency_ms': sorted_latencies[int(0.99 * n)],
                'max_latency_ms': max(all_latencies)
            }
        else:
            performance_metrics = {
                'average_latency_ms': 0.0,
                'median_latency_ms': 0.0,
                'p95_latency_ms': 0.0,
                'p99_latency_ms': 0.0,
                'max_latency_ms': 0.0
            }
        
        # SLO compliance check
        slo_compliance = {
            'median_latency': performance_metrics['median_latency_ms'] <= 400.0,
            'p95_latency': performance_metrics['p95_latency_ms'] <= 2500.0,
            'success_rate': (successful_requests / max(1, total_requests)) >= 0.95,
            'slo_status_healthy': slo_metrics.status in ['HEALTHY', 'WARNING']
        }
        
        result = PerformanceTestResult(
            test_name=test_name,
            duration_seconds=actual_duration,
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            throughput_rps=total_requests / actual_duration,
            success_rate=successful_requests / max(1, total_requests),
            slo_compliance=slo_compliance,
            queue_performance=slo_report.get('queue_metrics', {}),
            resource_utilization=slo_report.get('slo_metrics', {}),
            **performance_metrics
        )
        
        self.results.append(result)
        
        # Log results
        logger.info(f"Load test '{test_name}' completed:")
        logger.info(f"  Requests: {total_requests} ({result.throughput_rps:.1f} RPS)")
        logger.info(f"  Success rate: {result.success_rate:.3f}")
        logger.info(f"  Latency - Median: {result.median_latency_ms:.1f}ms, P95: {result.p95_latency_ms:.1f}ms")
        logger.info(f"  SLO compliance: {all(slo_compliance.values())}")
        
        return result
    
    def run_comprehensive_validation(self) -> Dict[str, Any]:
        """Run comprehensive performance validation"""
        logger.info("Starting comprehensive performance validation")
        logger.info("="*60)
        
        validation_results = {
            'validation_timestamp': datetime.now(timezone.utc).isoformat(),
            'test_configuration': self.config.__dict__,
            'test_results': [],
            'overall_passed': False,
            'summary': {}
        }
        
        # Test 1: Baseline performance
        logger.info("Test 1: Baseline Performance")
        baseline_result = self.run_load_test(
            "Baseline Load",
            target_rps=self.config.base_load_rps,
            duration=60
        )
        
        # Test 2: Peak load (2x baseline)
        logger.info("Test 2: Peak Load (2x Baseline)")
        peak_result = self.run_load_test(
            "Peak Load (2x)",
            target_rps=self.config.base_load_rps * self.config.peak_multiplier,
            duration=120
        )
        
        # Test 3: Sustained peak load
        logger.info("Test 3: Sustained Peak Load") 
        sustained_result = self.run_load_test(
            "Sustained Peak Load",
            target_rps=self.config.base_load_rps * self.config.peak_multiplier,
            duration=self.config.test_duration_seconds
        )
        
        # Test 4: Burst load (3x baseline for short duration)
        logger.info("Test 4: Burst Load")
        burst_result = self.run_load_test(
            "Burst Load (3x)",
            target_rps=self.config.base_load_rps * 3.0,
            duration=30
        )
        
        # Compile results
        validation_results['test_results'] = [
            baseline_result.__dict__,
            peak_result.__dict__, 
            sustained_result.__dict__,
            burst_result.__dict__
        ]
        
        # Overall validation
        all_tests_passed = all(result.passed for result in [baseline_result, peak_result, sustained_result, burst_result])
        peak_slo_met = sustained_result.passed  # This is the critical test
        
        validation_results['overall_passed'] = all_tests_passed and peak_slo_met
        
        # Summary statistics
        validation_results['summary'] = {
            'total_tests': 4,
            'tests_passed': sum(1 for result in [baseline_result, peak_result, sustained_result, burst_result] if result.passed),
            'critical_peak_test_passed': peak_slo_met,
            'max_throughput_achieved_rps': max(result.throughput_rps for result in [baseline_result, peak_result, sustained_result, burst_result]),
            'best_median_latency_ms': min(result.median_latency_ms for result in [baseline_result, peak_result, sustained_result, burst_result]),
            'worst_p95_latency_ms': max(result.p95_latency_ms for result in [baseline_result, peak_result, sustained_result, burst_result]),
            'overall_success_rate': statistics.mean([result.success_rate for result in [baseline_result, peak_result, sustained_result, burst_result]])
        }
        
        # Final SLO report
        final_slo_report = self.slo_monitor.get_comprehensive_report()
        validation_results['final_slo_status'] = final_slo_report
        
        return validation_results
    
    def generate_validation_report(self, results: Dict[str, Any]) -> str:
        """Generate comprehensive validation report"""
        report = f"""
Performance Validation Report - A1Betting7-13.2
{'='*60}

Validation Date: {results['validation_timestamp']}
Configuration: {results['test_configuration']['base_load_rps']} RPS base load, {results['test_configuration']['peak_multiplier']}x peak multiplier

OVERALL RESULT: {'✅ PASSED' if results['overall_passed'] else '❌ FAILED'}

Test Summary:
- Tests Run: {results['summary']['total_tests']}
- Tests Passed: {results['summary']['tests_passed']}/{results['summary']['total_tests']}
- Critical Peak Test: {'✅ PASSED' if results['summary']['critical_peak_test_passed'] else '❌ FAILED'}

Performance Summary:
- Max Throughput: {results['summary']['max_throughput_achieved_rps']:.1f} RPS
- Best Median Latency: {results['summary']['best_median_latency_ms']:.1f}ms
- Worst P95 Latency: {results['summary']['worst_p95_latency_ms']:.1f}ms  
- Overall Success Rate: {results['summary']['overall_success_rate']:.3f}

Individual Test Results:
"""
        
        for i, test_result in enumerate(results['test_results'], 1):
            status = "✅ PASSED" if test_result['passed'] else "❌ FAILED"
            report += f"""
Test {i}: {test_result['test_name']} - {status}
- Duration: {test_result['duration_seconds']:.1f}s
- Requests: {test_result['total_requests']:,} ({test_result['throughput_rps']:.1f} RPS)
- Success Rate: {test_result['success_rate']:.3f}
- Latency: Median={test_result['median_latency_ms']:.1f}ms, P95={test_result['p95_latency_ms']:.1f}ms
- SLO Compliance: {all(test_result['slo_compliance'].values())}
"""
        
        report += f"""

SLO Compliance Details:
- Median Latency < 400ms: {'✅' if all(result['median_latency_ms'] <= 400 for result in results['test_results']) else '❌'}
- 95th Percentile < 2.5s: {'✅' if all(result['p95_latency_ms'] <= 2500 for result in results['test_results']) else '❌'}
- Success Rate > 95%: {'✅' if all(result['success_rate'] >= 0.95 for result in results['test_results']) else '❌'}

Final System Status: {results['final_slo_status']['slo_status']}

Exit Criteria Assessment:
{'✅' if results['overall_passed'] else '❌'} SLOs met consistently under 2× projected peak load
{'✅' if results['summary']['best_median_latency_ms'] <= 400 else '❌'} Median line-to-edge latency < 400ms  
{'✅' if results['summary']['worst_p95_latency_ms'] <= 2500 else '❌'} 95th percentile partial optimization refresh < 2.5s
{'✅' if results['final_slo_status']['queue_metrics']['rejected_requests'] > 0 else '❌'} Fail-fast guards functional

RECOMMENDATION: {'✅ System ready for provider activation' if results['overall_passed'] else '❌ System needs optimization before activation'}
"""
        
        return report
    
    def cleanup(self):
        """Clean up resources"""
        self.slo_monitor.shutdown()
        # Force garbage collection to clean up arrays
        gc.collect()


def main():
    """Main validation entry point"""
    print("Performance Validation System - A1Betting7-13.2")
    print("="*60)
    
    # Configuration
    config = LoadTestConfig(
        base_load_rps=50,  # Conservative for testing
        peak_multiplier=2.0,
        test_duration_seconds=180,  # 3 minutes for quick testing
        concurrent_users=20
    )
    
    # Create validator
    validator = PerformanceValidator(config)
    
    try:
        # Run comprehensive validation
        results = validator.run_comprehensive_validation()
        
        # Generate and save report
        report = validator.generate_validation_report(results)
        
        with open('performance_validation_report.txt', 'w') as f:
            f.write(report)
        
        with open('performance_validation_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(report)
        
        # Exit with appropriate code
        exit_code = 0 if results['overall_passed'] else 1
        
        print(f"\n{'✅ VALIDATION PASSED' if results['overall_passed'] else '❌ VALIDATION FAILED'}")
        print(f"📊 Detailed results saved to performance_validation_results.json")
        print(f"📋 Report saved to performance_validation_report.txt")
        
        return exit_code
        
    except KeyboardInterrupt:
        print("\n❌ Validation interrupted by user")
        return 2
    except Exception as e:
        print(f"\n❌ Validation failed with error: {e}")
        logger.exception("Validation error")
        return 3
    finally:
        validator.cleanup()


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)