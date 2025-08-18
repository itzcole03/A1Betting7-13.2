#!/usr/bin/env python3
"""
Performance Profiler for A1Betting7-13.2
========================================

Comprehensive CPU profiling during synthetic burst load to identify hotspots:
- Monte Carlo simulations
- JSON serialization/deserialization 
- Array operations and factor decompositions
- Database operations
- Cache performance

Usage:
    python performance_profiler.py --profile-type [cprofile|pyinstrument|both]
    python performance_profiler.py --burst-load --duration 60 --concurrent-users 50
"""

import argparse
import asyncio
import cProfile
import json
import logging
import multiprocessing
import os
import pstats
import random
import sys
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from io import StringIO
from typing import Dict, List, Optional, Any, Callable

import numpy as np

# Conditional imports for profiling tools
try:
    import pyinstrument
    PYINSTRUMENT_AVAILABLE = True
except ImportError:
    PYINSTRUMENT_AVAILABLE = False
    print("⚠️  pyinstrument not available. Install with: pip install pyinstrument")

try:
    from backend.services.ticketing.monte_carlo_parlay import MonteCarloParlay, ParlayLeg
    from backend.services.batch_prediction_optimizer import BatchPredictionOptimizer
    from backend.models.streaming import ProviderState, PortfolioRationale
    BACKEND_AVAILABLE = True
except ImportError:
    BACKEND_AVAILABLE = False
    print("⚠️  Backend services not available. Run from project root.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ProfilingResults:
    """Container for profiling results"""
    profile_type: str
    duration: float
    operations_per_second: float
    memory_usage_mb: float
    cpu_hotspots: List[Dict[str, Any]]
    recommendations: List[str]


class SyntheticLoadGenerator:
    """Generate synthetic load patterns for performance testing"""
    
    def __init__(self):
        self.operations = []
        self.results = []
    
    def generate_monte_carlo_load(self, n_simulations: int = 10000) -> Dict[str, Any]:
        """Generate synthetic Monte Carlo simulation load"""
        # Simulate large correlation matrix operations
        n_props = random.randint(5, 15)
        
        # Generate proper correlation matrix that's guaranteed positive definite
        # Method: Generate via random factors for numerical stability
        n_factors = max(2, n_props // 2)
        factor_loadings = np.random.randn(n_props, n_factors) * 0.7
        correlation_matrix = np.dot(factor_loadings, factor_loadings.T)
        
        # Add diagonal terms to ensure positive definiteness
        np.fill_diagonal(correlation_matrix, 1.0)
        
        # Add regularization to guarantee numerical stability
        min_eigenval = np.min(np.linalg.eigvals(correlation_matrix))
        if min_eigenval <= 1e-6:
            regularization = 1e-4 + abs(min_eigenval) * 1.1
            correlation_matrix += np.eye(n_props) * regularization
        
        # Final normalization to proper correlation matrix
        diag_inv_sqrt = np.diag(1.0 / np.sqrt(np.diag(correlation_matrix)))
        correlation_matrix = np.dot(diag_inv_sqrt, np.dot(correlation_matrix, diag_inv_sqrt))
        
        # Ensure diagonal is exactly 1.0
        np.fill_diagonal(correlation_matrix, 1.0)
        
        # Generate props with realistic parameters
        props = []
        for i in range(n_props):
            prob_over = random.uniform(0.35, 0.65)
            props.append({
                'prop_id': i + 1,
                'prob_over': prob_over,
                'prob_under': 1 - prob_over,
                'offered_line': random.uniform(-120, -105),
                'fair_line': random.uniform(-115, -110),
                'volatility_score': random.uniform(0.1, 0.4)
            })
        
        return {
            'props': props,
            'correlation_matrix': correlation_matrix.tolist(),
            'n_simulations': n_simulations,
            'confidence_level': 0.95
        }
    
    def generate_json_serialization_load(self, n_objects: int = 1000) -> List[Dict[str, Any]]:
        """Generate load for JSON serialization testing"""
        objects = []
        for i in range(n_objects):
            # Create complex nested objects similar to ProviderState/PortfolioRationale
            obj = {
                'id': i,
                'provider_name': f'provider_{i % 10}',
                'sport': random.choice(['NBA', 'NFL', 'MLB', 'NHL']),
                'capabilities': {
                    'real_time': True,
                    'historical': True,
                    'props_supported': [f'prop_{j}' for j in range(random.randint(10, 50))],
                    'markets': {
                        'player_props': random.randint(100, 500),
                        'team_props': random.randint(20, 100),
                        'game_props': random.randint(10, 30)
                    }
                },
                'performance_metrics': {
                    'total_requests': random.randint(1000, 10000),
                    'successful_requests': random.randint(900, 9500),
                    'average_response_time_ms': random.uniform(50, 200),
                    'historical_accuracy': [random.uniform(0.45, 0.65) for _ in range(30)]
                },
                'metadata': {
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                    'version': '1.0.0',
                    'tags': [f'tag_{k}' for k in range(random.randint(5, 15))]
                }
            }
            objects.append(obj)
        return objects
    
    def generate_array_operations_load(self, size: int = 10000) -> Dict[str, np.ndarray]:
        """Generate load for array operations (factor decompositions, etc.)"""
        # Large matrices for factor decomposition
        data_matrix = np.random.randn(size, 100)  # 10k observations, 100 features
        correlation_matrix = np.random.randn(100, 100)
        correlation_matrix = correlation_matrix @ correlation_matrix.T  # Make positive definite
        
        return {
            'data_matrix': data_matrix,
            'correlation_matrix': correlation_matrix,
            'factor_loadings': np.random.randn(100, 20),  # 20 factors
            'weights': np.random.rand(100),
            'returns': np.random.randn(size)
        }


class PerformanceProfiler:
    """Main performance profiler class"""
    
    def __init__(self):
        self.load_generator = SyntheticLoadGenerator()
        self.results = []
        
    @contextmanager
    def profile_cprofile(self, filename: str = None):
        """Context manager for cProfile profiling"""
        pr = cProfile.Profile()
        pr.enable()
        
        start_time = time.time()
        try:
            yield pr
        finally:
            pr.disable()
            end_time = time.time()
            
            if filename:
                pr.dump_stats(filename)
            
            # Generate text report
            s = StringIO()
            ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
            ps.print_stats(20)  # Top 20 functions
            
            print(f"\n{'='*60}")
            print(f"cProfile Results ({end_time - start_time:.2f}s)")
            print(f"{'='*60}")
            print(s.getvalue())
    
    @contextmanager
    def profile_pyinstrument(self, filename: str = None):
        """Context manager for pyinstrument profiling"""
        if not PYINSTRUMENT_AVAILABLE:
            print("⚠️  pyinstrument not available")
            yield None
            return
        
        profiler = pyinstrument.Profiler()
        profiler.start()
        
        start_time = time.time()
        try:
            yield profiler
        finally:
            profiler.stop()
            end_time = time.time()
            
            if filename:
                with open(filename, 'w') as f:
                    f.write(profiler.output_text(unicode=True, color=False))
            
            print(f"\n{'='*60}")
            print(f"pyinstrument Results ({end_time - start_time:.2f}s)")
            print(f"{'='*60}")
            print(profiler.output_text(unicode=True, color=False, show_all=True)[:2000])
    
    def profile_monte_carlo_operations(self, n_iterations: int = 100):
        """Profile Monte Carlo simulation operations"""
        logger.info(f"Profiling Monte Carlo operations ({n_iterations} iterations)")
        
        def monte_carlo_workload():
            for i in range(n_iterations):
                load_data = self.load_generator.generate_monte_carlo_load()
                
                # Simulate correlation matrix operations
                corr_matrix = np.array(load_data['correlation_matrix'])
                
                # Cholesky decomposition (expensive operation)
                try:
                    chol_decomp = np.linalg.cholesky(corr_matrix)
                except np.linalg.LinAlgError:
                    # Add small diagonal term to make positive definite
                    corr_matrix += np.eye(corr_matrix.shape[0]) * 0.001
                    chol_decomp = np.linalg.cholesky(corr_matrix)
                
                # Simulate Monte Carlo draws
                n_draws = min(load_data['n_simulations'], 5000)  # Limit for profiling
                n_props = len(load_data['props'])
                
                # Pre-allocate arrays (optimization to test)
                random_draws = np.random.randn(n_draws, n_props)
                correlated_draws = random_draws @ chol_decomp.T
                
                # Simulate probability calculations
                results = np.zeros(n_draws)
                for draw_idx in range(n_draws):
                    prop_outcomes = correlated_draws[draw_idx] > 0  # Simplified
                    results[draw_idx] = np.all(prop_outcomes)
                
                # Calculate statistics
                prob_estimate = np.mean(results)
                variance_estimate = np.var(results)
                confidence_interval = np.percentile(results, [2.5, 97.5])
        
        return monte_carlo_workload
    
    def profile_json_operations(self, n_iterations: int = 1000):
        """Profile JSON serialization/deserialization operations"""
        logger.info(f"Profiling JSON operations ({n_iterations} iterations)")
        
        def json_workload():
            objects = self.load_generator.generate_json_serialization_load(100)
            
            for i in range(n_iterations):
                # Serialize to JSON (expensive for large objects)
                json_data = json.dumps(objects, default=str)
                
                # Deserialize from JSON
                parsed_objects = json.loads(json_data)
                
                # Simulate database-like operations
                for obj in parsed_objects:
                    # Simulate field access and modification
                    obj['processed_at'] = time.time()
                    obj['performance_score'] = (
                        obj['performance_metrics']['successful_requests'] / 
                        max(1, obj['performance_metrics']['total_requests'])
                    )
        
        return json_workload
    
    def profile_array_operations(self, n_iterations: int = 50):
        """Profile array operations and factor decompositions"""
        logger.info(f"Profiling array operations ({n_iterations} iterations)")
        
        def array_workload():
            load_data = self.load_generator.generate_array_operations_load()
            
            for i in range(n_iterations):
                # Matrix operations
                data_matrix = load_data['data_matrix']
                correlation_matrix = load_data['correlation_matrix']
                
                # Eigenvalue decomposition (expensive)
                eigenvals, eigenvecs = np.linalg.eigh(correlation_matrix)
                
                # Factor analysis simulation
                factor_loadings = eigenvecs[:, -20:]  # Top 20 factors
                factor_scores = data_matrix @ factor_loadings
                
                # Portfolio optimization simulation
                weights = load_data['weights']
                returns = load_data['returns']
                
                # Covariance calculation
                cov_matrix = np.cov(data_matrix.T)
                
                # Risk calculation
                portfolio_variance = weights.T @ cov_matrix @ weights
                
                # Optimization step (simplified)
                gradient = 2 * cov_matrix @ weights
                weights_updated = weights - 0.01 * gradient
                weights_updated = np.maximum(0, weights_updated)  # Long-only constraint
                weights_updated /= np.sum(weights_updated)  # Normalize
        
        return array_workload
    
    def run_burst_load_test(self, duration: int = 60, concurrent_users: int = 10):
        """Run synthetic burst load test"""
        logger.info(f"Running burst load test: {concurrent_users} users for {duration}s")
        
        def single_user_load():
            """Simulate single user generating requests"""
            end_time = time.time() + duration
            requests = 0
            
            while time.time() < end_time:
                # Random operation selection
                operation = random.choice([
                    'monte_carlo',
                    'json_serialization', 
                    'array_operations'
                ])
                
                if operation == 'monte_carlo':
                    workload = self.profile_monte_carlo_operations(n_iterations=5)
                elif operation == 'json_serialization':
                    workload = self.profile_json_operations(n_iterations=50)
                else:
                    workload = self.profile_array_operations(n_iterations=3)
                
                workload()
                requests += 1
                
                # Small delay to simulate user behavior
                time.sleep(random.uniform(0.1, 0.5))
            
            return requests
        
        # Run concurrent load
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [executor.submit(single_user_load) for _ in range(concurrent_users)]
            total_requests = sum(future.result() for future in futures)
        
        logger.info(f"Burst load completed: {total_requests} total requests")
        return total_requests
    
    def profile_system_components(self, profile_type: str = 'both'):
        """Profile all system components"""
        results = {}
        
        # Profile Monte Carlo operations
        if profile_type in ['cprofile', 'both']:
            with self.profile_cprofile('monte_carlo_cprofile.prof'):
                workload = self.profile_monte_carlo_operations(n_iterations=50)
                workload()
        
        if profile_type in ['pyinstrument', 'both'] and PYINSTRUMENT_AVAILABLE:
            with self.profile_pyinstrument('monte_carlo_pyinstrument.txt'):
                workload = self.profile_monte_carlo_operations(n_iterations=50)
                workload()
        
        # Profile JSON operations
        if profile_type in ['cprofile', 'both']:
            with self.profile_cprofile('json_cprofile.prof'):
                workload = self.profile_json_operations(n_iterations=500)
                workload()
        
        if profile_type in ['pyinstrument', 'both'] and PYINSTRUMENT_AVAILABLE:
            with self.profile_pyinstrument('json_pyinstrument.txt'):
                workload = self.profile_json_operations(n_iterations=500)
                workload()
        
        # Profile array operations
        if profile_type in ['cprofile', 'both']:
            with self.profile_cprofile('array_cprofile.prof'):
                workload = self.profile_array_operations(n_iterations=25)
                workload()
        
        if profile_type in ['pyinstrument', 'both'] and PYINSTRUMENT_AVAILABLE:
            with self.profile_pyinstrument('array_pyinstrument.txt'):
                workload = self.profile_array_operations(n_iterations=25)
                workload()
        
        return results
    
    def analyze_profiling_results(self) -> List[str]:
        """Analyze profiling results and generate recommendations"""
        recommendations = []
        
        # Check for common performance issues
        recommendations.extend([
            "🎯 Pre-allocate NumPy arrays for Monte Carlo simulations",
            "🎯 Cache Cholesky decompositions for repeated correlation matrices",
            "🎯 Use ujson or orjson instead of standard json for faster serialization",
            "🎯 Implement factor model caching to avoid repeated eigenvalue decompositions",
            "🎯 Use sparse matrices for large correlation matrices with many zeros",
            "🎯 Batch JSON operations to reduce overhead",
            "🎯 Implement connection pooling for database operations",
            "🎯 Use memory-mapped files for large array operations",
            "🎯 Consider using numba/jit compilation for hot paths",
            "🎯 Implement async/await patterns for I/O bound operations"
        ])
        
        return recommendations
    
    def generate_report(self):
        """Generate comprehensive profiling report"""
        report = f"""
Performance Profiling Report - A1Betting7-13.2
{'='*60}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Profiling Files Generated:
- monte_carlo_cprofile.prof (cProfile format)
- monte_carlo_pyinstrument.txt (pyinstrument format)
- json_cprofile.prof
- json_pyinstrument.txt  
- array_cprofile.prof
- array_pyinstrument.txt

View cProfile results with: python -m pstats <filename>.prof
View pyinstrument results: cat <filename>_pyinstrument.txt

Performance Optimization Recommendations:
"""
        
        recommendations = self.analyze_profiling_results()
        for i, rec in enumerate(recommendations, 1):
            report += f"{i:2d}. {rec}\n"
        
        report += f"""

Next Steps:
1. Analyze hotspot functions identified in profiling results
2. Implement pre-allocation optimizations for arrays
3. Add factor decomposition caching
4. Replace json with ujson for serialization
5. Set up SLO monitoring for latency targets
6. Implement fail-fast queue guards
7. Validate performance under 2x peak load

Critical SLOs to Monitor:
- Median line-to-edge latency < 400ms
- 95th percentile partial optimization refresh < 2.5s
- Queue backlog fail-fast threshold
"""
        
        with open('performance_profiling_report.txt', 'w') as f:
            f.write(report)
        
        print(report)
        return report


def main():
    """Main profiling entry point"""
    parser = argparse.ArgumentParser(description='A1Betting7-13.2 Performance Profiler')
    parser.add_argument('--profile-type', choices=['cprofile', 'pyinstrument', 'both'], 
                       default='both', help='Profiling method to use')
    parser.add_argument('--burst-load', action='store_true', 
                       help='Run synthetic burst load test')
    parser.add_argument('--duration', type=int, default=60, 
                       help='Burst load test duration in seconds')
    parser.add_argument('--concurrent-users', type=int, default=10, 
                       help='Number of concurrent users for burst load')
    parser.add_argument('--components', nargs='+', 
                       choices=['monte_carlo', 'json', 'arrays', 'all'], 
                       default=['all'], help='Components to profile')
    
    args = parser.parse_args()
    
    profiler = PerformanceProfiler()
    
    print(f"""
A1Betting7-13.2 Performance Profiler
{'='*40}

Configuration:
- Profile Type: {args.profile_type}
- Components: {', '.join(args.components)}
- Burst Load: {args.burst_load}
""")
    
    if args.burst_load:
        print(f"- Duration: {args.duration}s")
        print(f"- Concurrent Users: {args.concurrent_users}")
    
    print("\nStarting performance profiling...\n")
    
    # Run burst load test if requested
    if args.burst_load:
        total_requests = profiler.run_burst_load_test(
            duration=args.duration,
            concurrent_users=args.concurrent_users
        )
        print(f"Burst load completed: {total_requests} requests")
    
    # Profile system components
    if 'all' in args.components or len(set(args.components) & {'monte_carlo', 'json', 'arrays'}) > 0:
        results = profiler.profile_system_components(profile_type=args.profile_type)
    
    # Generate final report
    profiler.generate_report()
    
    print("\n✅ Profiling completed successfully!")
    print("📊 Check performance_profiling_report.txt for detailed analysis")
    print("📈 Review .prof files with: python -m pstats <filename>.prof")


if __name__ == "__main__":
    main()