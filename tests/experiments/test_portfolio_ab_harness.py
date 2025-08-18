"""
Test suite for portfolio A/B testing harness.

Tests the PortfolioABHarness class and related functionality for
A/B testing portfolio strategies and Monte Carlo simulation.
"""

import time
import pytest
import numpy as np
from scripts.experiments.portfolio_ab_harness import (
    PortfolioABHarness,
    PortfolioStrategy,
    ExperimentResult,
    ABTestConfig,
    StrategyMetrics
)


class DummyLogger:
    def __init__(self):
        self.messages = []
    
    def info(self, msg, *args, **kwargs):
        self.messages.append(('info', msg % args if args else msg))
    
    def warning(self, msg, *args, **kwargs):
        self.messages.append(('warning', msg % args if args else msg))
    
    def error(self, msg, *args, **kwargs):
        self.messages.append(('error', msg % args if args else msg))
    
    def debug(self, msg, *args, **kwargs):
        self.messages.append(('debug', msg % args if args else msg))


def create_mock_edge_data(size: int = 100) -> dict:
    """Create mock edge data for testing."""
    np.random.seed(42)  # For reproducible tests
    
    return {
        'edge_ids': [f'edge_{i}' for i in range(size)],
        'confidence_scores': np.random.beta(2, 2, size).tolist(),  # Beta distribution for confidence
        'historical_performance': np.random.normal(0.05, 0.02, size).tolist(),  # Normal distribution for returns
        'volatility_metrics': np.random.gamma(2, 0.02, size).tolist(),  # Gamma distribution for volatility
        'edge_types': np.random.choice(['value', 'momentum', 'arbitrage'], size).tolist(),
        'sports': np.random.choice(['MLB', 'NFL', 'NBA', 'NHL'], size).tolist(),
        'prop_types': np.random.choice(['STRIKEOUTS_PITCHER', 'PASSING_YARDS', 'POINTS_PLAYER'], size).tolist()
    }


def test_harness_initialization():
    """Test A/B harness initialization."""
    config = ABTestConfig(
        portfolio_size=20,
        simulation_runs=100,
        duration_days=7,
        confidence_level=0.95
    )
    
    harness = PortfolioABHarness(config)
    
    assert harness.config.portfolio_size == 20
    assert harness.config.simulation_runs == 100
    assert len(harness.strategy_results) == 0


def test_ab_config_validation():
    """Test A/B test configuration validation."""
    # Valid config
    config = ABTestConfig(
        portfolio_size=10,
        simulation_runs=50,
        duration_days=5,
        confidence_level=0.95
    )
    
    assert config.portfolio_size == 10
    assert config.confidence_level == 0.95
    
    # Test default values
    default_config = ABTestConfig()
    assert default_config.portfolio_size == 25
    assert default_config.simulation_runs == 1000


def test_strategy_metrics_calculation():
    """Test strategy metrics calculation."""
    # Create mock returns
    returns = [0.05, -0.02, 0.08, 0.03, -0.01, 0.06, 0.02]
    
    metrics = StrategyMetrics.from_returns(returns)
    
    assert metrics.total_return == sum(returns)
    assert metrics.avg_return == sum(returns) / len(returns)
    assert metrics.sharpe_ratio is not None
    assert metrics.max_drawdown <= 0  # Max drawdown should be negative or zero
    assert 0 <= metrics.win_rate <= 1


def test_strategy_metrics_edge_cases():
    """Test strategy metrics with edge cases."""
    # Empty returns
    empty_metrics = StrategyMetrics.from_returns([])
    assert empty_metrics.total_return == 0
    assert empty_metrics.avg_return == 0
    
    # All zero returns
    zero_metrics = StrategyMetrics.from_returns([0, 0, 0, 0])
    assert zero_metrics.total_return == 0
    assert zero_metrics.volatility == 0
    
    # Single return
    single_metrics = StrategyMetrics.from_returns([0.05])
    assert single_metrics.total_return == 0.05
    assert single_metrics.volatility == 0


def test_high_confidence_strategy():
    """Test high confidence portfolio strategy."""
    edge_data = create_mock_edge_data(100)
    harness = PortfolioABHarness()
    
    portfolio = harness.run_strategy(
        PortfolioStrategy.HIGH_CONFIDENCE,
        edge_data,
        size=20
    )
    
    assert len(portfolio) == 20
    
    # Verify edges are sorted by confidence (descending)
    confidences = [edge_data['confidence_scores'][i] for i in portfolio]
    assert confidences == sorted(confidences, reverse=True)


def test_diversified_strategy():
    """Test diversified portfolio strategy."""
    edge_data = create_mock_edge_data(100)
    harness = PortfolioABHarness()
    
    portfolio = harness.run_strategy(
        PortfolioStrategy.DIVERSIFIED,
        edge_data,
        size=20
    )
    
    assert len(portfolio) == 20
    
    # Verify some level of sport diversification
    selected_sports = [edge_data['sports'][i] for i in portfolio]
    unique_sports = set(selected_sports)
    assert len(unique_sports) >= 2  # Should have at least 2 different sports


def test_risk_adjusted_strategy():
    """Test risk-adjusted portfolio strategy."""
    edge_data = create_mock_edge_data(100)
    harness = PortfolioABHarness()
    
    portfolio = harness.run_strategy(
        PortfolioStrategy.RISK_ADJUSTED,
        edge_data,
        size=20
    )
    
    assert len(portfolio) == 20
    
    # Verify risk adjustment is applied (lower volatility edges preferred)
    selected_volatilities = [edge_data['volatility_metrics'][i] for i in portfolio]
    all_volatilities = edge_data['volatility_metrics']
    
    # Selected edges should have lower average volatility than the full set
    avg_selected_vol = sum(selected_volatilities) / len(selected_volatilities)
    avg_all_vol = sum(all_volatilities) / len(all_volatilities)
    
    assert avg_selected_vol <= avg_all_vol


def test_momentum_strategy():
    """Test momentum-based portfolio strategy."""
    edge_data = create_mock_edge_data(100)
    harness = PortfolioABHarness()
    
    portfolio = harness.run_strategy(
        PortfolioStrategy.MOMENTUM,
        edge_data,
        size=20
    )
    
    assert len(portfolio) == 20
    
    # Verify momentum scoring (high performance + high confidence)
    selected_performance = [edge_data['historical_performance'][i] for i in portfolio]
    selected_confidence = [edge_data['confidence_scores'][i] for i in portfolio]
    
    # Should select edges with above-average performance and confidence
    avg_performance = sum(edge_data['historical_performance']) / len(edge_data['historical_performance'])
    avg_confidence = sum(edge_data['confidence_scores']) / len(edge_data['confidence_scores'])
    
    avg_selected_perf = sum(selected_performance) / len(selected_performance)
    avg_selected_conf = sum(selected_confidence) / len(selected_confidence)
    
    assert avg_selected_perf >= avg_performance
    assert avg_selected_conf >= avg_confidence


def test_balanced_strategy():
    """Test balanced portfolio strategy."""
    edge_data = create_mock_edge_data(100)
    harness = PortfolioABHarness()
    
    portfolio = harness.run_strategy(
        PortfolioStrategy.BALANCED,
        edge_data,
        size=20
    )
    
    assert len(portfolio) == 20
    
    # Balanced strategy should consider multiple factors
    # This is harder to test precisely, but we can verify it produces valid results
    selected_edges = portfolio
    assert all(0 <= idx < len(edge_data['edge_ids']) for idx in selected_edges)


def test_monte_carlo_simulation():
    """Test Monte Carlo simulation."""
    edge_data = create_mock_edge_data(50)
    config = ABTestConfig(
        portfolio_size=10,
        simulation_runs=100,
        duration_days=5,
        confidence_level=0.95
    )
    
    harness = PortfolioABHarness(config)
    
    # Run simulation for one strategy
    results = harness.run_monte_carlo_simulation(
        PortfolioStrategy.HIGH_CONFIDENCE,
        edge_data
    )
    
    assert len(results) == 100  # Should have 100 simulation runs
    assert all(isinstance(r, (int, float)) for r in results)


def test_full_ab_test():
    """Test full A/B test with multiple strategies."""
    edge_data = create_mock_edge_data(100)
    config = ABTestConfig(
        portfolio_size=15,
        simulation_runs=50,  # Reduced for test speed
        duration_days=7,
        confidence_level=0.90
    )
    
    harness = PortfolioABHarness(config)
    
    # Run A/B test
    results = harness.run_ab_test(
        edge_data,
        strategies=[
            PortfolioStrategy.HIGH_CONFIDENCE,
            PortfolioStrategy.DIVERSIFIED,
            PortfolioStrategy.RISK_ADJUSTED
        ]
    )
    
    assert len(results) == 3
    
    # Verify result structure
    for strategy, result in results.items():
        assert isinstance(result, ExperimentResult)
        assert result.strategy == strategy
        assert result.metrics is not None
        assert len(result.simulation_results) == 50


def test_experiment_result_comparison():
    """Test experiment result comparison and ranking."""
    edge_data = create_mock_edge_data(80)
    config = ABTestConfig(simulation_runs=30)
    harness = PortfolioABHarness(config)
    
    # Run test with multiple strategies
    results = harness.run_ab_test(
        edge_data,
        strategies=[
            PortfolioStrategy.HIGH_CONFIDENCE,
            PortfolioStrategy.MOMENTUM,
            PortfolioStrategy.BALANCED
        ]
    )
    
    # Test ranking
    ranked_results = harness.rank_strategies_by_performance(results)
    
    assert len(ranked_results) == 3
    
    # Verify ranking order (should be sorted by some performance metric)
    for i in range(len(ranked_results) - 1):
        curr_result = ranked_results[i][1]
        next_result = ranked_results[i + 1][1]
        # Assuming ranking by total return
        assert curr_result.metrics.total_return >= next_result.metrics.total_return


def test_statistical_significance():
    """Test statistical significance testing."""
    edge_data = create_mock_edge_data(60)
    config = ABTestConfig(simulation_runs=100)
    harness = PortfolioABHarness(config)
    
    # Create two different result sets
    results_a = harness.run_monte_carlo_simulation(
        PortfolioStrategy.HIGH_CONFIDENCE,
        edge_data
    )
    results_b = harness.run_monte_carlo_simulation(
        PortfolioStrategy.DIVERSIFIED,
        edge_data
    )
    
    # Test significance
    is_significant, p_value = harness.test_statistical_significance(
        results_a,
        results_b
    )
    
    assert isinstance(is_significant, bool)
    assert 0 <= p_value <= 1


def test_edge_selection_constraints():
    """Test edge selection with various constraints."""
    edge_data = create_mock_edge_data(30)
    harness = PortfolioABHarness()
    
    # Test portfolio size larger than available edges
    large_portfolio = harness.run_strategy(
        PortfolioStrategy.HIGH_CONFIDENCE,
        edge_data,
        size=50  # More than available
    )
    
    # Should select all available edges
    assert len(large_portfolio) == 30
    
    # Test empty edge data
    empty_data = {
        'edge_ids': [],
        'confidence_scores': [],
        'historical_performance': [],
        'volatility_metrics': [],
        'edge_types': [],
        'sports': [],
        'prop_types': []
    }
    
    empty_portfolio = harness.run_strategy(
        PortfolioStrategy.HIGH_CONFIDENCE,
        empty_data,
        size=10
    )
    
    assert len(empty_portfolio) == 0


def test_performance_metrics_validation():
    """Test performance metrics validation and edge cases."""
    # Test with extreme values
    extreme_returns = [1.0, -0.5, 2.0, -0.8, 0.5]
    extreme_metrics = StrategyMetrics.from_returns(extreme_returns)
    
    assert extreme_metrics.total_return == sum(extreme_returns)
    assert extreme_metrics.max_drawdown <= 0
    
    # Test with very small values
    small_returns = [0.001, -0.0005, 0.002, 0.0001]
    small_metrics = StrategyMetrics.from_returns(small_returns)
    
    assert abs(small_metrics.total_return - sum(small_returns)) < 1e-10


def test_strategy_robustness():
    """Test strategy robustness with different data distributions."""
    # Create data with different characteristics
    configs = [
        # High confidence, low performance
        {
            'confidence_scores': [0.9] * 50,
            'historical_performance': [-0.01] * 50
        },
        # Low confidence, high performance
        {
            'confidence_scores': [0.3] * 50,
            'historical_performance': [0.05] * 50
        },
        # Mixed quality
        {
            'confidence_scores': [0.9] * 25 + [0.3] * 25,
            'historical_performance': [0.02] * 25 + [0.08] * 25
        }
    ]
    
    harness = PortfolioABHarness()
    
    for i, config_data in enumerate(configs):
        edge_data = create_mock_edge_data(50)
        edge_data['confidence_scores'] = config_data['confidence_scores']
        edge_data['historical_performance'] = config_data['historical_performance']
        
        # Each strategy should handle different data characteristics
        for strategy in [PortfolioStrategy.HIGH_CONFIDENCE, PortfolioStrategy.RISK_ADJUSTED]:
            portfolio = harness.run_strategy(strategy, edge_data, size=10)
            assert len(portfolio) == 10
            assert all(0 <= idx < 50 for idx in portfolio)


def test_logger_integration():
    """Test logger integration."""
    logger = DummyLogger()
    config = ABTestConfig(simulation_runs=10)
    harness = PortfolioABHarness(config)
    harness.logger = logger  # type: ignore
    
    edge_data = create_mock_edge_data(20)
    
    # Run test
    harness.run_ab_test(edge_data, strategies=[PortfolioStrategy.HIGH_CONFIDENCE])
    
    # Check logging
    info_messages = [msg for level, msg in logger.messages if level == 'info']
    assert len(info_messages) > 0
    
    # Should have logged experiment details
    experiment_logs = [msg for msg in info_messages if 'experiment' in msg.lower()]
    assert len(experiment_logs) > 0


def test_simulation_reproducibility():
    """Test that simulations are reproducible with same seed."""
    edge_data = create_mock_edge_data(40)
    config = ABTestConfig(simulation_runs=20, random_seed=12345)
    
    harness1 = PortfolioABHarness(config)
    harness2 = PortfolioABHarness(config)
    
    # Run same simulation twice
    results1 = harness1.run_monte_carlo_simulation(
        PortfolioStrategy.HIGH_CONFIDENCE,
        edge_data
    )
    results2 = harness2.run_monte_carlo_simulation(
        PortfolioStrategy.HIGH_CONFIDENCE,
        edge_data
    )
    
    # Results should be identical (or very similar due to random seed)
    assert len(results1) == len(results2)
    # Note: Exact equality might not hold due to floating point precision
    # so we test that they're very close
    for r1, r2 in zip(results1, results2):
        assert abs(r1 - r2) < 1e-10


def test_memory_efficiency():
    """Test memory efficiency with large datasets."""
    # Create larger dataset
    large_edge_data = create_mock_edge_data(1000)
    config = ABTestConfig(simulation_runs=10)  # Keep simulation count low
    
    harness = PortfolioABHarness(config)
    
    # Should handle large datasets without issues
    portfolio = harness.run_strategy(
        PortfolioStrategy.DIVERSIFIED,
        large_edge_data,
        size=50
    )
    
    assert len(portfolio) == 50
    assert all(0 <= idx < 1000 for idx in portfolio)


if __name__ == "__main__":
    pytest.main([__file__])