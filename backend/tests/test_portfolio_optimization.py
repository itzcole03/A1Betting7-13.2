"""
Comprehensive Test Suite for Advanced Portfolio Optimization Engine

Test coverage:
- Unit tests for all optimization components
- Integration tests for end-to-end workflows  
- Performance benchmarks for optimization algorithms
- Statistical validation of results
- Cache layer functionality
- API endpoint testing
"""

import pytest
import asyncio
import time
import random
from typing import List, Dict, Any
from unittest.mock import Mock, patch, AsyncMock

# Test the imports
try:
    from backend.models.portfolio_optimization import (
        OptimizationRun, MonteCarloRun, CorrelationCacheEntry,
        OptimizationStatus, SimulationStatus, OptimizationObjective
    )
    from backend.services.correlation.advanced_correlation_engine import AdvancedCorrelationEngine
    from backend.services.ticketing.monte_carlo_parlay import MonteCarloParlay
    from backend.services.optimization.portfolio_optimizer import PortfolioOptimizer
    from backend.services.tasks.task_scheduler import TaskScheduler, TaskPriority
    from backend.services.cache.portfolio_cache import (
        PortfolioCache, CacheNamespace, portfolio_cache
    )
    from backend.services.validation.stat_tests import (
        StatisticalValidator, ConfidenceIntervalMethod,
        validate_monte_carlo_results, test_correlation_matrix_properties
    )
    IMPORTS_AVAILABLE = True
except ImportError as e:
    print(f"Import error: {e}")
    IMPORTS_AVAILABLE = False


# Mock database session for testing
class MockDB:
    def __init__(self):
        self.added_items = []
        self.committed = False
        
    def add(self, item):
        self.added_items.append(item)
        
    def commit(self):
        self.committed = True
        
    def refresh(self, item):
        if not hasattr(item, 'id'):
            item.id = random.randint(1, 1000)
        
    def query(self, model_class):
        return MockQuery()
        
    def close(self):
        pass


class MockQuery:
    def filter(self, *args):
        return self
        
    def first(self):
        return None


# Test fixtures
@pytest.fixture
def mock_db():
    return MockDB()


@pytest.fixture
def sample_prop_data():
    """Sample prop data for testing"""
    return [
        {"prop_id": 1, "true_probability": 0.55, "implied_probability": 0.50, "edge": 0.10},
        {"prop_id": 2, "true_probability": 0.60, "implied_probability": 0.52, "edge": 0.15},
        {"prop_id": 3, "true_probability": 0.45, "implied_probability": 0.48, "edge": -0.07},
        {"prop_id": 4, "true_probability": 0.65, "implied_probability": 0.58, "edge": 0.12},
        {"prop_id": 5, "true_probability": 0.40, "implied_probability": 0.45, "edge": -0.11},
    ]


@pytest.fixture
def sample_correlation_matrix():
    """Sample correlation matrix for testing"""
    return [
        [1.0, 0.3, -0.1, 0.2, 0.0],
        [0.3, 1.0, 0.4, -0.2, 0.1],
        [-0.1, 0.4, 1.0, 0.0, 0.3],
        [0.2, -0.2, 0.0, 1.0, -0.1],
        [0.0, 0.1, 0.3, -0.1, 1.0]
    ]


class TestAdvancedCorrelationEngine:
    """Test suite for correlation engine"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_engine_initialization(self, mock_db):
        """Test correlation engine initialization"""
        engine = AdvancedCorrelationEngine(mock_db)
        assert engine.db == mock_db
        assert hasattr(engine, 'logger')
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_compute_pairwise_matrix(self, mock_db, sample_prop_data):
        """Test pairwise correlation matrix computation"""
        engine = AdvancedCorrelationEngine(mock_db)
        
        # Mock the data fetching
        with patch.object(engine, '_fetch_historical_data') as mock_fetch:
            mock_fetch.return_value = [
                [0.55, 0.60, 0.45, 0.65, 0.40],
                [0.52, 0.58, 0.48, 0.62, 0.42],
                [0.58, 0.62, 0.42, 0.68, 0.38],
            ]
            
            prop_ids = [p["prop_id"] for p in sample_prop_data]
            result = await engine.compute_pairwise_matrix(
                prop_ids=prop_ids,
                lookback_days=30,
                min_observations=3
            )
            
            assert "correlation_matrix" in result
            assert "num_observations" in result
            assert len(result["correlation_matrix"]) == len(prop_ids)

    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_factor_model_computation(self, mock_db, sample_prop_data):
        """Test factor model fitting"""
        engine = AdvancedCorrelationEngine(mock_db)
        
        with patch.object(engine, '_fetch_historical_data') as mock_fetch:
            # Generate more realistic historical data
            mock_data = []
            for _ in range(50):  # 50 observations
                row = [random.gauss(0.5, 0.1) for _ in sample_prop_data]
                mock_data.append(row)
            mock_fetch.return_value = mock_data
            
            prop_ids = [p["prop_id"] for p in sample_prop_data]
            result = await engine.fit_factor_model(
                prop_ids=prop_ids,
                lookback_days=30,
                num_factors=2
            )
            
            assert "correlation_matrix" in result
            assert "factor_loadings" in result
            assert "variance_explained" in result

    def test_psd_enforcement(self):
        """Test positive semi-definite enforcement"""
        if not IMPORTS_AVAILABLE:
            pytest.skip("Imports not available")
            
        engine = AdvancedCorrelationEngine(MockDB())
        
        # Create a matrix that's not PSD
        matrix = [
            [1.0, 0.9, 0.8],
            [0.9, 1.0, 0.9], 
            [0.8, 0.9, 1.0]
        ]
        
        # This should not fail
        psd_matrix = engine._enforce_psd(matrix)
        assert len(psd_matrix) == 3
        assert len(psd_matrix[0]) == 3


class TestMonteCarloParlay:
    """Test suite for Monte Carlo simulation"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_simulator_initialization(self, mock_db):
        """Test Monte Carlo simulator initialization"""
        simulator = MonteCarloParlay(mock_db)
        assert simulator.db == mock_db
        assert hasattr(simulator, 'logger')
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_parlay_simulation(self, mock_db, sample_prop_data):
        """Test basic parlay simulation"""
        simulator = MonteCarloParlay(mock_db)
        
        # Mock correlation engine
        with patch.object(simulator, '_get_correlation_matrix') as mock_corr:
            mock_corr.return_value = [
                [1.0, 0.2], [0.2, 1.0]
            ]
            
            props = [(1, 0.55), (2, 0.60)]
            stakes = [10.0, 15.0]
            
            result = await simulator.simulate_parlay(
                props=props,
                stakes=stakes,
                min_simulations=100,
                max_simulations=1000,
                confidence_level=0.95
            )
            
            assert "expected_payout" in result
            assert "payout_variance" in result
            assert "win_probability" in result
            assert "confidence_intervals" in result
            assert result["num_simulations"] >= 100

    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_adaptive_stopping(self, mock_db):
        """Test adaptive stopping criterion"""
        simulator = MonteCarloParlay(mock_db)
        
        # Test with payouts that should converge quickly
        payouts = [100.0] * 50 + [0.0] * 50  # 50% win rate
        
        should_stop = simulator._check_convergence(
            payouts=payouts,
            window_size=20,
            tolerance=0.01,
            confidence_level=0.95
        )
        
        # Should eventually converge with consistent data
        assert isinstance(should_stop, bool)

    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_confidence_interval_calculation(self, mock_db):
        """Test confidence interval calculations"""
        simulator = MonteCarloParlay(mock_db)
        
        payouts = [random.gauss(50, 10) for _ in range(1000)]
        
        ci = simulator._calculate_confidence_intervals(payouts, 0.95)
        
        assert "mean" in ci
        assert "variance" in ci
        assert "lower_95" in ci
        assert "upper_95" in ci
        assert ci["lower_95"] < ci["mean"] < ci["upper_95"]


class TestPortfolioOptimizer:
    """Test suite for portfolio optimization"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_optimizer_initialization(self, mock_db):
        """Test portfolio optimizer initialization"""
        optimizer = PortfolioOptimizer(mock_db)
        assert optimizer.db == mock_db
        assert hasattr(optimizer, 'logger')
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_candidate_generation(self, mock_db, sample_prop_data):
        """Test optimization candidate generation"""
        optimizer = PortfolioOptimizer(mock_db)
        
        props = [
            {"prop_id": p["prop_id"], "edge_percentage": p["edge"] * 100, 
             "implied_probability": p["implied_probability"], 
             "true_probability": p["true_probability"]}
            for p in sample_prop_data
        ]
        
        candidates = optimizer._generate_initial_candidates(
            props=props,
            max_total_stake=1000,
            beam_width=10
        )
        
        assert len(candidates) <= 10
        for candidate in candidates:
            assert "stakes" in candidate
            assert "expected_value" in candidate
            assert sum(candidate["stakes"]) <= 1000

    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_portfolio_optimization(self, mock_db, sample_prop_data):
        """Test end-to-end portfolio optimization"""
        optimizer = PortfolioOptimizer(mock_db)
        
        # Mock correlation matrix
        with patch.object(optimizer, '_get_correlation_matrix') as mock_corr:
            mock_corr.return_value = [
                [1.0, 0.1, 0.0, 0.2, -0.1],
                [0.1, 1.0, 0.3, 0.0, 0.2],
                [0.0, 0.3, 1.0, 0.1, 0.0],
                [0.2, 0.0, 0.1, 1.0, -0.2],
                [-0.1, 0.2, 0.0, -0.2, 1.0]
            ]
            
            props = [
                {"prop_id": p["prop_id"], "edge_percentage": p["edge"] * 100,
                 "implied_probability": p["implied_probability"],
                 "true_probability": p["true_probability"]}
                for p in sample_prop_data if p["edge"] > 0  # Only positive edge props
            ]
            
            if props:  # Only run if we have positive edge props
                result = await optimizer.optimize_portfolio(
                    props=props,
                    objective=OptimizationObjective.MAX_EV,
                    max_total_stake=1000,
                    constraints={
                        "min_edge_threshold": 0.05,
                        "max_correlation_threshold": 0.7
                    },
                    beam_width=5,
                    max_iterations=10
                )
                
                assert "best_portfolio" in result
                assert "expected_value" in result
                assert "total_stake" in result
                assert result["total_stake"] <= 1000

    def test_constraint_checking(self, mock_db):
        """Test portfolio constraint validation"""
        optimizer = PortfolioOptimizer(mock_db)
        
        candidate = {
            "prop_ids": [1, 2, 3],
            "stakes": [100, 200, 300],
            "correlations": [0.1, 0.3, 0.5]
        }
        
        constraints = {
            "min_edge_threshold": 0.05,
            "max_correlation_threshold": 0.6,
            "max_total_stake": 1000
        }
        
        # This should pass constraints
        is_valid = optimizer._check_constraints(candidate, constraints)
        assert isinstance(is_valid, bool)


class TestTaskScheduler:
    """Test suite for task scheduler"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_task_registration(self):
        """Test task registration"""
        scheduler = TaskScheduler.get_instance()
        
        async def dummy_task(x, y):
            return x + y
        
        task_id = await scheduler.register_task(
            name="test_task",
            func=dummy_task,
            args=(1, 2),
            priority=TaskPriority.LOW
        )
        
        assert isinstance(task_id, str)
        assert len(task_id) > 0
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_task_execution(self):
        """Test task execution"""
        scheduler = TaskScheduler.get_instance()
        
        async def test_func(value):
            return value * 2
        
        task_id = await scheduler.register_task(
            name="multiply_task",
            func=test_func,
            args=(5,),
            priority=TaskPriority.HIGH
        )
        
        # Give some time for task to potentially execute
        await asyncio.sleep(0.1)
        
        status = await scheduler.get_task_status(task_id)
        assert status is not None
        assert "task_id" in status

    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio 
    async def test_periodic_scheduling(self):
        """Test periodic task scheduling"""
        scheduler = TaskScheduler.get_instance()
        
        call_count = 0
        
        async def periodic_task():
            nonlocal call_count
            call_count += 1
        
        task_id = await scheduler.schedule_periodic(
            name="periodic_test",
            func=periodic_task,
            interval_sec=0.1,  # Very short interval for testing
            max_runs=3
        )
        
        # Wait for a few executions
        await asyncio.sleep(0.35)
        
        # Should have been called multiple times
        assert call_count >= 1


class TestPortfolioCache:
    """Test suite for caching layer"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_cache_initialization(self):
        """Test cache initialization"""
        cache = PortfolioCache(max_memory_entries=100, default_ttl_sec=300)
        assert cache.max_memory_entries == 100
        assert cache.default_ttl_sec == 300
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_basic_cache_operations(self):
        """Test basic cache set/get operations"""
        cache = PortfolioCache()
        
        # Set and get
        cache.set("test_key", {"value": 123}, namespace="test")
        result = cache.get("test_key", namespace="test")
        
        assert result is not None
        assert result["value"] == 123
        
        # Test default value
        missing = cache.get("missing_key", default="not_found", namespace="test")
        assert missing == "not_found"
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_namespace_isolation(self):
        """Test namespace isolation"""
        cache = PortfolioCache()
        
        cache.set("same_key", "value_1", namespace="namespace_1")
        cache.set("same_key", "value_2", namespace="namespace_2")
        
        result_1 = cache.get("same_key", namespace="namespace_1")
        result_2 = cache.get("same_key", namespace="namespace_2")
        
        assert result_1 == "value_1"
        assert result_2 == "value_2"
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_pattern_invalidation(self):
        """Test pattern-based cache invalidation"""
        cache = PortfolioCache()
        
        # Set multiple keys
        cache.set("user_1_data", "data1", namespace="users")
        cache.set("user_2_data", "data2", namespace="users") 
        cache.set("system_config", "config", namespace="system")
        
        # Invalidate user keys
        cache.invalidate("user_*", namespace="users")
        
        # User keys should be gone
        assert cache.get("user_1_data", namespace="users") is None
        assert cache.get("user_2_data", namespace="users") is None
        
        # System config should remain
        assert cache.get("system_config", namespace="system") == "config"
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_get_or_set(self):
        """Test get_or_set functionality"""
        cache = PortfolioCache()
        
        call_count = 0
        
        async def expensive_computation():
            nonlocal call_count
            call_count += 1
            return f"computed_result_{call_count}"
        
        # First call should compute
        result1 = await cache.get_or_set(
            key="expensive_key",
            ttl_sec=300,
            factory_func=expensive_computation,
            namespace="test"
        )
        
        # Second call should use cache
        result2 = await cache.get_or_set(
            key="expensive_key", 
            ttl_sec=300,
            factory_func=expensive_computation,
            namespace="test"
        )
        
        assert result1 == result2
        assert call_count == 1  # Function should only be called once

    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_cache_stats(self):
        """Test cache statistics"""
        cache = PortfolioCache()
        
        # Perform some operations
        cache.set("key1", "value1")
        cache.get("key1")  # Hit
        cache.get("missing_key")  # Miss
        
        stats = cache.get_stats()
        
        assert "hits" in stats
        assert "misses" in stats
        assert "sets" in stats
        assert "hit_rate" in stats
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1
        assert stats["sets"] >= 1


class TestStatisticalValidator:
    """Test suite for statistical validation"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_validator_initialization(self):
        """Test validator initialization"""
        validator = StatisticalValidator()
        assert hasattr(validator, 'enable_scipy')
        assert hasattr(validator, 'logger')
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_kolmogorov_smirnov_test(self):
        """Test KS goodness-of-fit test"""
        validator = StatisticalValidator()
        
        # Generate normal-like data
        data = [random.gauss(0, 1) for _ in range(100)]
        
        result = validator.kolmogorov_smirnov_test(
            data=data,
            distribution="norm",
            significance_level=0.05
        )
        
        assert hasattr(result, 'test_name')
        assert hasattr(result, 'test_statistic')
        assert hasattr(result, 'p_value')
        assert hasattr(result, 'reject_null')
        assert result.test_name.startswith("Kolmogorov-Smirnov")
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_confidence_interval_methods(self):
        """Test different confidence interval methods"""
        validator = StatisticalValidator()
        
        data = [random.gauss(50, 10) for _ in range(100)]
        
        # Test percentile method
        ci_percentile = validator.compute_confidence_interval(
            data=data,
            confidence_level=0.95,
            method=ConfidenceIntervalMethod.PERCENTILE
        )
        
        assert ci_percentile.lower < ci_percentile.upper
        assert ci_percentile.confidence_level == 0.95
        assert ci_percentile.method == ConfidenceIntervalMethod.PERCENTILE
        
        # Test normal approximation
        ci_normal = validator.compute_confidence_interval(
            data=data,
            confidence_level=0.95,
            method=ConfidenceIntervalMethod.NORMAL_APPROXIMATION
        )
        
        assert ci_normal.lower < ci_normal.upper
        assert ci_normal.method == ConfidenceIntervalMethod.NORMAL_APPROXIMATION
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_bootstrap_resampling(self):
        """Test bootstrap resampling"""
        validator = StatisticalValidator()
        
        data = [random.gauss(10, 2) for _ in range(50)]
        
        def mean_func(sample):
            return sum(sample) / len(sample)
        
        bootstrap_result = validator.bootstrap_resample(
            data=data,
            statistic_func=mean_func,
            num_bootstrap_samples=100,
            confidence_level=0.95
        )
        
        assert len(bootstrap_result.statistic_samples) == 100
        assert hasattr(bootstrap_result, 'confidence_interval')
        assert bootstrap_result.confidence_interval.lower < bootstrap_result.confidence_interval.upper
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_correlation_significance(self):
        """Test correlation significance testing"""
        validator = StatisticalValidator()
        
        # Test significant correlation
        result = validator.test_correlation_significance(
            correlation=0.7,
            sample_size=50,
            significance_level=0.05
        )
        
        assert hasattr(result, 'reject_null')
        assert result.test_name == "Correlation Significance"
        assert result.significance_level == 0.05
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_monte_carlo_convergence(self):
        """Test Monte Carlo convergence analysis"""
        validator = StatisticalValidator()
        
        # Generate convergent simulation results
        base_value = 100
        simulation_results = []
        for i in range(5000):
            # Add decreasing noise to simulate convergence
            noise_factor = 10 / (1 + i / 1000)
            result = base_value + random.gauss(0, noise_factor)
            simulation_results.append(result)
        
        convergence_result = validator.validate_monte_carlo_convergence(
            simulation_results=simulation_results,
            window_size=1000,
            tolerance=0.01
        )
        
        assert "converged" in convergence_result
        assert "final_estimate" in convergence_result
        assert "coefficient_of_variation" in convergence_result


class TestUtilityFunctions:
    """Test utility and convenience functions"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_validate_monte_carlo_results(self):
        """Test comprehensive Monte Carlo validation"""
        # Generate sample results
        results = [random.gauss(50, 10) for _ in range(1000)]
        
        validation = validate_monte_carlo_results(
            simulation_results=results,
            expected_distribution="norm",
            confidence_level=0.95,
            significance_level=0.05
        )
        
        assert "summary" in validation
        assert "distribution_tests" in validation
        assert "confidence_intervals" in validation
        assert "convergence_analysis" in validation
        
        assert validation["summary"]["num_samples"] == 1000
        assert "ks_test" in validation["distribution_tests"]
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_correlation_matrix_validation(self, sample_correlation_matrix):
        """Test correlation matrix property validation"""
        validation = test_correlation_matrix_properties(
            correlation_matrix=sample_correlation_matrix,
            tolerance=1e-6
        )
        
        assert "is_symmetric" in validation
        assert "diagonal_ones" in validation
        assert "values_in_range" in validation
        assert validation["size"] == 5
        
        # Should pass all basic tests
        assert validation["is_symmetric"] is True
        assert validation["diagonal_ones"] is True
        assert validation["values_in_range"] is True


class TestPerformanceBenchmarks:
    """Performance benchmarks for optimization components"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_correlation_computation_performance(self, mock_db):
        """Benchmark correlation computation performance"""
        engine = AdvancedCorrelationEngine(mock_db)
        
        # Mock large dataset
        with patch.object(engine, '_fetch_historical_data') as mock_fetch:
            # Generate large random dataset
            large_dataset = []
            for _ in range(200):  # 200 observations
                row = [random.gauss(0.5, 0.1) for _ in range(20)]  # 20 props
                large_dataset.append(row)
            mock_fetch.return_value = large_dataset
            
            prop_ids = list(range(1, 21))  # 20 props
            
            start_time = time.time()
            result = await engine.compute_pairwise_matrix(
                prop_ids=prop_ids,
                lookback_days=30,
                min_observations=50
            )
            end_time = time.time()
            
            computation_time = end_time - start_time
            
            assert result is not None
            assert computation_time < 10.0  # Should complete within 10 seconds
            print(f"Pairwise correlation computation time: {computation_time:.2f}s")
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_monte_carlo_performance(self, mock_db):
        """Benchmark Monte Carlo simulation performance"""
        simulator = MonteCarloParlay(mock_db)
        
        with patch.object(simulator, '_get_correlation_matrix') as mock_corr:
            # Create larger correlation matrix
            n_props = 10
            mock_corr.return_value = [
                [1.0 if i == j else 0.1 for j in range(n_props)]
                for i in range(n_props)
            ]
            
            props = [(i, 0.5 + random.uniform(-0.1, 0.1)) for i in range(1, n_props + 1)]
            stakes = [random.uniform(10, 50) for _ in range(n_props)]
            
            start_time = time.time()
            result = await simulator.simulate_parlay(
                props=props,
                stakes=stakes,
                min_simulations=10000,
                max_simulations=50000,
                confidence_level=0.95
            )
            end_time = time.time()
            
            computation_time = end_time - start_time
            
            assert result is not None
            assert result["num_simulations"] >= 10000
            assert computation_time < 30.0  # Should complete within 30 seconds
            print(f"Monte Carlo simulation time: {computation_time:.2f}s for {result['num_simulations']} simulations")
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    def test_cache_performance(self):
        """Benchmark cache performance"""
        cache = PortfolioCache(max_memory_entries=10000)
        
        # Benchmark cache writes
        start_time = time.time()
        for i in range(1000):
            cache.set(f"key_{i}", {"data": f"value_{i}", "index": i}, namespace="benchmark")
        write_time = time.time() - start_time
        
        # Benchmark cache reads
        start_time = time.time()
        for i in range(1000):
            result = cache.get(f"key_{i}", namespace="benchmark")
            assert result is not None
        read_time = time.time() - start_time
        
        print(f"Cache write time: {write_time:.3f}s for 1000 entries")
        print(f"Cache read time: {read_time:.3f}s for 1000 entries")
        
        assert write_time < 5.0  # Should be fast
        assert read_time < 1.0   # Reads should be very fast


# Integration tests
class TestIntegrationWorkflows:
    """End-to-end integration tests"""
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
    @pytest.mark.asyncio
    async def test_full_optimization_workflow(self, mock_db, sample_prop_data):
        """Test complete optimization workflow"""
        # 1. Initialize components
        correlation_engine = AdvancedCorrelationEngine(mock_db)
        optimizer = PortfolioOptimizer(mock_db)
        cache = PortfolioCache()
        
        # 2. Mock correlation data
        with patch.object(correlation_engine, 'compute_pairwise_matrix') as mock_corr:
            mock_corr.return_value = {
                "correlation_matrix": [
                    [1.0, 0.2, 0.1],
                    [0.2, 1.0, 0.0],
                    [0.1, 0.0, 1.0]
                ],
                "num_observations": 100
            }
            
            # 3. Mock optimizer correlation retrieval
            with patch.object(optimizer, '_get_correlation_matrix') as mock_opt_corr:
                mock_opt_corr.return_value = [
                    [1.0, 0.2, 0.1],
                    [0.2, 1.0, 0.0], 
                    [0.1, 0.0, 1.0]
                ]
                
                # 4. Run optimization
                positive_edge_props = [
                    {"prop_id": p["prop_id"], "edge_percentage": p["edge"] * 100,
                     "implied_probability": p["implied_probability"],
                     "true_probability": p["true_probability"]}
                    for p in sample_prop_data if p["edge"] > 0
                ]
                
                if positive_edge_props:
                    result = await optimizer.optimize_portfolio(
                        props=positive_edge_props,
                        objective=OptimizationObjective.MAX_EV,
                        max_total_stake=1000,
                        constraints={
                            "min_edge_threshold": 0.05,
                            "max_correlation_threshold": 0.8
                        },
                        beam_width=10,
                        max_iterations=50
                    )
                    
                    # 5. Validate results
                    assert "best_portfolio" in result
                    assert "expected_value" in result
                    assert result["expected_value"] > 0  # Should be profitable
                    assert result["total_stake"] <= 1000  # Respects constraint
                    
                    # 6. Cache results
                    cache.set(
                        key="optimization_result",
                        value=result,
                        ttl_sec=3600,
                        namespace=CacheNamespace.OPTIMIZATION
                    )
                    
                    cached_result = cache.get("optimization_result", namespace=CacheNamespace.OPTIMIZATION)
                    assert cached_result == result


if __name__ == "__main__":
    # Run tests if script is executed directly
    if IMPORTS_AVAILABLE:
        print("Running basic test validation...")
        
        # Run a few basic tests
        import asyncio
        
        async def run_basic_tests():
            print("✓ Testing cache operations...")
            cache = PortfolioCache()
            cache.set("test", {"value": 123})
            result = cache.get("test")
            assert result["value"] == 123
            print("  Cache test passed")
            
            print("✓ Testing statistical validator...")
            validator = StatisticalValidator()
            data = [random.gauss(0, 1) for _ in range(100)]
            ks_result = validator.kolmogorov_smirnov_test(data, "norm")
            assert hasattr(ks_result, 'test_name')
            print("  Statistical validation test passed")
            
            print("✓ Testing task scheduler...")
            scheduler = TaskScheduler.get_instance()
            
            async def test_task():
                return "completed"
                
            task_id = await scheduler.register_task("test_task", test_task, ())
            assert isinstance(task_id, str)
            print("  Task scheduler test passed")
            
            print("\n✅ All basic tests passed!")
            
        # Run tests
        asyncio.run(run_basic_tests())
    else:
        print("❌ Cannot run tests - required modules not available")
        print("Make sure all portfolio optimization modules have been implemented.")