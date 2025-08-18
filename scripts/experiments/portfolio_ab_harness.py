#!/usr/bin/env python3
"""
Portfolio A/B Testing Harness

This script provides a comprehensive framework for A/B testing edge portfolios,
allowing for controlled experimentation with different edge selection strategies,
confidence thresholds, and optimization parameters.

Usage:
  python scripts/experiments/portfolio_ab_harness.py --input edges_snapshot.json --k 15 --days 7 --simulate
  python scripts/experiments/portfolio_ab_harness.py --config ab_config.yaml --output results/
  python scripts/experiments/portfolio_ab_harness.py --live --duration 3600 --strategies baseline,optimized
"""

import argparse
import json
import yaml
import random
import statistics
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import sys
import time


class StrategyType(Enum):
    """Types of portfolio strategies for A/B testing."""
    BASELINE = "baseline"
    CONFIDENCE_WEIGHTED = "confidence_weighted"
    EV_OPTIMIZED = "ev_optimized" 
    RISK_ADJUSTED = "risk_adjusted"
    HYBRID = "hybrid"
    DIVERSIFIED = "diversified"


class MetricType(Enum):
    """Types of metrics to track during experiments."""
    TOTAL_EV = "total_ev"
    WIN_RATE = "win_rate"
    ROI = "roi"
    SHARPE_RATIO = "sharpe_ratio"
    MAX_DRAWDOWN = "max_drawdown"
    CONSISTENCY_SCORE = "consistency_score"


@dataclass
class Edge:
    """Represents an edge for portfolio testing."""
    edge_id: str
    prop_id: int
    sport: str
    prop_type: str
    expected_value: float
    confidence: float
    kelly_fraction: Optional[float] = None
    implied_prob: Optional[float] = None
    true_prob: Optional[float] = None
    bet_size: Optional[float] = None
    context: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}


@dataclass
class PortfolioMetrics:
    """Metrics for a portfolio over the experiment period."""
    total_edges: int
    total_ev: float
    realized_profit: float
    win_rate: float
    roi: float
    sharpe_ratio: float
    max_drawdown: float
    consistency_score: float
    average_confidence: float
    portfolio_diversity: float
    risk_adjusted_return: float


@dataclass
class ExperimentResult:
    """Results of an A/B test experiment."""
    experiment_id: str
    strategy_name: str
    start_time: str
    end_time: str
    duration_hours: float
    portfolio_metrics: PortfolioMetrics
    daily_performance: List[Dict[str, float]]
    edge_details: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class PortfolioStrategy:
    """Base class for portfolio selection strategies."""
    
    def __init__(self, name: str, params: Dict[str, Any]):
        self.name = name
        self.params = params
    
    def select_portfolio(self, available_edges: List[Edge], k: int) -> List[Edge]:
        """Select k edges from available edges."""
        raise NotImplementedError
    
    def optimize_bet_sizes(self, selected_edges: List[Edge], bankroll: float) -> List[Edge]:
        """Optimize bet sizes for selected edges."""
        return selected_edges


class BaselineStrategy(PortfolioStrategy):
    """Baseline strategy: select highest EV edges."""
    
    def select_portfolio(self, available_edges: List[Edge], k: int) -> List[Edge]:
        sorted_edges = sorted(available_edges, key=lambda e: e.expected_value, reverse=True)
        return sorted_edges[:k]


class ConfidenceWeightedStrategy(PortfolioStrategy):
    """Strategy that weights edge selection by confidence."""
    
    def select_portfolio(self, available_edges: List[Edge], k: int) -> List[Edge]:
        # Score edges by confidence-weighted EV
        for edge in available_edges:
            edge.context['selection_score'] = edge.expected_value * edge.confidence
        
        sorted_edges = sorted(available_edges, key=lambda e: e.context['selection_score'], reverse=True)
        return sorted_edges[:k]


class EVOptimizedStrategy(PortfolioStrategy):
    """Strategy that optimizes for total portfolio EV."""
    
    def select_portfolio(self, available_edges: List[Edge], k: int) -> List[Edge]:
        # Use greedy selection with diminishing returns consideration
        selected = []
        remaining = available_edges.copy()
        
        for _ in range(k):
            if not remaining:
                break
            
            # Score remaining edges considering portfolio diversity
            best_edge = None
            best_score = float('-inf')
            
            for edge in remaining:
                # Base score is EV
                score = edge.expected_value
                
                # Add diversity bonus
                sport_count = sum(1 for e in selected if e.sport == edge.sport)
                prop_type_count = sum(1 for e in selected if e.prop_type == edge.prop_type)
                
                diversity_penalty = (sport_count * 0.1) + (prop_type_count * 0.05)
                score -= diversity_penalty
                
                if score > best_score:
                    best_score = score
                    best_edge = edge
            
            if best_edge:
                selected.append(best_edge)
                remaining.remove(best_edge)
        
        return selected


class RiskAdjustedStrategy(PortfolioStrategy):
    """Strategy that adjusts for risk using confidence and correlation."""
    
    def select_portfolio(self, available_edges: List[Edge], k: int) -> List[Edge]:
        # Calculate risk-adjusted scores
        for edge in available_edges:
            # Risk adjustment based on confidence
            confidence_factor = (edge.confidence - 0.5) * 2  # Scale to [-1, 1]
            risk_adjustment = 1.0 + (confidence_factor * 0.2)  # Max 20% adjustment
            
            edge.context['risk_adjusted_ev'] = edge.expected_value * risk_adjustment
        
        # Select top risk-adjusted edges
        sorted_edges = sorted(available_edges, key=lambda e: e.context['risk_adjusted_ev'], reverse=True)
        return sorted_edges[:k]


class HybridStrategy(PortfolioStrategy):
    """Hybrid strategy combining multiple approaches."""
    
    def select_portfolio(self, available_edges: List[Edge], k: int) -> List[Edge]:
        # Combine EV, confidence, and diversity factors
        weights = self.params.get('weights', {'ev': 0.5, 'confidence': 0.3, 'diversity': 0.2})
        
        # Normalize scores for each factor
        evs = [e.expected_value for e in available_edges]
        confidences = [e.confidence for e in available_edges]
        
        max_ev = max(evs) if evs else 1.0
        max_confidence = max(confidences) if confidences else 1.0
        
        scored_edges = []
        for edge in available_edges:
            ev_score = (edge.expected_value / max_ev) * weights['ev']
            confidence_score = (edge.confidence / max_confidence) * weights['confidence']
            
            # Diversity score based on sport/prop type representation
            sport_diversity = 1.0 / (1 + sum(1 for e in available_edges if e.sport == edge.sport))
            prop_diversity = 1.0 / (1 + sum(1 for e in available_edges if e.prop_type == edge.prop_type))
            diversity_score = ((sport_diversity + prop_diversity) / 2) * weights['diversity']
            
            total_score = ev_score + confidence_score + diversity_score
            scored_edges.append((edge, total_score))
        
        # Sort by total score and select top k
        scored_edges.sort(key=lambda x: x[1], reverse=True)
        return [edge for edge, _ in scored_edges[:k]]


class DiversifiedStrategy(PortfolioStrategy):
    """Strategy that prioritizes portfolio diversification."""
    
    def select_portfolio(self, available_edges: List[Edge], k: int) -> List[Edge]:
        selected = []
        remaining = available_edges.copy()
        
        # Group edges by sport and prop type
        sport_groups = {}
        prop_groups = {}
        
        for edge in remaining:
            if edge.sport not in sport_groups:
                sport_groups[edge.sport] = []
            sport_groups[edge.sport].append(edge)
            
            if edge.prop_type not in prop_groups:
                prop_groups[edge.prop_type] = []
            prop_groups[edge.prop_type].append(edge)
        
        # Round-robin selection across sports and prop types
        sport_list = list(sport_groups.keys())
        sport_idx = 0
        
        while len(selected) < k and remaining:
            # Try to select from current sport
            current_sport = sport_list[sport_idx % len(sport_list)]
            sport_edges = [e for e in remaining if e.sport == current_sport]
            
            if sport_edges:
                # Select best EV edge from this sport
                best_edge = max(sport_edges, key=lambda e: e.expected_value)
                selected.append(best_edge)
                remaining.remove(best_edge)
            
            sport_idx += 1
            
            # Safety check to avoid infinite loop
            if sport_idx > len(sport_list) * 3:
                break
        
        # Fill remaining slots with best available edges
        while len(selected) < k and remaining:
            best_edge = max(remaining, key=lambda e: e.expected_value)
            selected.append(best_edge)
            remaining.remove(best_edge)
        
        return selected


class PortfolioABHarness:
    """Main harness for running portfolio A/B tests."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.logger = self._setup_logging()
        
        # Strategy registry
        self.strategies = {
            StrategyType.BASELINE: BaselineStrategy,
            StrategyType.CONFIDENCE_WEIGHTED: ConfidenceWeightedStrategy,
            StrategyType.EV_OPTIMIZED: EVOptimizedStrategy,
            StrategyType.RISK_ADJUSTED: RiskAdjustedStrategy,
            StrategyType.HYBRID: HybridStrategy,
            StrategyType.DIVERSIFIED: DiversifiedStrategy,
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Set up logging for the harness."""
        logger = logging.getLogger('portfolio_ab_harness')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def load_edges(self, input_file: str) -> List[Edge]:
        """Load edges from input file."""
        try:
            with open(input_file, 'r') as f:
                data = json.load(f)
            
            edges = []
            if isinstance(data, list):
                edge_data = data
            elif isinstance(data, dict) and 'edges' in data:
                edge_data = data['edges']
            else:
                raise ValueError("Invalid input format")
            
            for item in edge_data:
                edge = Edge(
                    edge_id=item.get('edge_id', f"edge_{len(edges)}"),
                    prop_id=item.get('prop_id', 0),
                    sport=item.get('sport', 'Unknown'),
                    prop_type=item.get('prop_type', 'Unknown'),
                    expected_value=float(item.get('expected_value', 0)),
                    confidence=float(item.get('confidence', 0.5)),
                    kelly_fraction=item.get('kelly_fraction'),
                    implied_prob=item.get('implied_prob'),
                    true_prob=item.get('true_prob'),
                    context=item.get('context', {})
                )
                edges.append(edge)
            
            self.logger.info(f"Loaded {len(edges)} edges from {input_file}")
            return edges
        
        except Exception as e:
            self.logger.error(f"Failed to load edges from {input_file}: {e}")
            raise
    
    def generate_synthetic_edges(self, count: int = 100) -> List[Edge]:
        """Generate synthetic edges for testing."""
        sports = ['MLB', 'NFL', 'NBA', 'NHL']
        prop_types = ['STRIKEOUTS_PITCHER', 'PASSING_YARDS', 'POINTS_PLAYER', 'GOALS_PLAYER']
        
        edges = []
        for i in range(count):
            sport = random.choice(sports)
            prop_type = random.choice(prop_types)
            
            # Generate realistic EV and confidence values
            confidence = random.uniform(0.45, 0.85)
            expected_value = random.uniform(-0.05, 0.25) * (confidence ** 2)  # Higher confidence -> potentially higher EV
            
            edge = Edge(
                edge_id=f"synthetic_{i}",
                prop_id=i,
                sport=sport,
                prop_type=prop_type,
                expected_value=expected_value,
                confidence=confidence,
                kelly_fraction=expected_value / 0.1,  # Simple Kelly calculation
                implied_prob=random.uniform(0.3, 0.7),
                true_prob=random.uniform(0.25, 0.75)
            )
            edges.append(edge)
        
        self.logger.info(f"Generated {count} synthetic edges")
        return edges
    
    def run_ab_experiment(
        self,
        edges: List[Edge],
        strategies: List[str],
        k: int = 15,
        days: int = 7,
        bankroll: float = 10000.0,
        simulate: bool = True,
        simulation_runs: int = 1000
    ) -> Dict[str, ExperimentResult]:
        """Run A/B experiment comparing different strategies."""
        
        self.logger.info(f"Starting A/B experiment with {len(strategies)} strategies")
        self.logger.info(f"Portfolio size: {k}, Duration: {days} days, Bankroll: ${bankroll:,.2f}")
        
        results = {}
        
        for strategy_name in strategies:
            self.logger.info(f"Testing strategy: {strategy_name}")
            
            try:
                # Get strategy instance
                strategy_type = StrategyType(strategy_name.lower())
                strategy_class = self.strategies[strategy_type]
                strategy_params = self.config.get('strategy_params', {}).get(strategy_name, {})
                strategy = strategy_class(strategy_name, strategy_params)
                
                # Run strategy
                result = self._test_strategy(
                    strategy, edges, k, days, bankroll, simulate, simulation_runs
                )
                results[strategy_name] = result
                
            except Exception as e:
                self.logger.error(f"Failed to test strategy {strategy_name}: {e}")
                continue
        
        return results
    
    def _test_strategy(
        self,
        strategy: PortfolioStrategy,
        edges: List[Edge],
        k: int,
        days: int,
        bankroll: float,
        simulate: bool,
        simulation_runs: int
    ) -> ExperimentResult:
        """Test a single strategy."""
        
        start_time = datetime.now()
        
        # Select portfolio
        selected_edges = strategy.select_portfolio(edges, k)
        
        if len(selected_edges) == 0:
            raise ValueError(f"Strategy {strategy.name} selected no edges")
        
        # Optimize bet sizes
        optimized_edges = strategy.optimize_bet_sizes(selected_edges, bankroll)
        
        # Run simulation or use historical data
        if simulate:
            metrics, daily_performance = self._simulate_strategy_performance(
                optimized_edges, days, bankroll, simulation_runs
            )
        else:
            metrics, daily_performance = self._backtest_strategy_performance(
                optimized_edges, days, bankroll
            )
        
        end_time = datetime.now()
        duration_hours = (end_time - start_time).total_seconds() / 3600
        
        # Prepare edge details for result
        edge_details = []
        for edge in optimized_edges:
            edge_details.append({
                'edge_id': edge.edge_id,
                'sport': edge.sport,
                'prop_type': edge.prop_type,
                'expected_value': edge.expected_value,
                'confidence': edge.confidence,
                'bet_size': edge.bet_size or 0.0,
                'kelly_fraction': edge.kelly_fraction,
                'selection_context': edge.context
            })
        
        return ExperimentResult(
            experiment_id=f"{strategy.name}_{int(start_time.timestamp())}",
            strategy_name=strategy.name,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_hours=duration_hours,
            portfolio_metrics=metrics,
            daily_performance=daily_performance,
            edge_details=edge_details,
            metadata={
                'portfolio_size': len(optimized_edges),
                'simulation_runs': simulation_runs if simulate else None,
                'bankroll': bankroll,
                'days': days
            }
        )
    
    def _simulate_strategy_performance(
        self,
        edges: List[Edge],
        days: int,
        bankroll: float,
        runs: int = 1000
    ) -> Tuple[PortfolioMetrics, List[Dict[str, float]]]:
        """Simulate strategy performance using Monte Carlo."""
        
        all_run_results = []
        
        for run in range(runs):
            daily_returns = []
            current_bankroll = bankroll
            
            for day in range(days):
                daily_profit = 0.0
                daily_bets = 0
                
                for edge in edges:
                    # Simulate outcome based on true probability
                    bet_size = edge.bet_size or (bankroll * 0.02)  # Default 2% of bankroll
                    
                    if edge.true_prob is not None:
                        win_prob = edge.true_prob
                    else:
                        # Estimate from confidence and implied probability
                        win_prob = edge.implied_prob * (1 + (edge.confidence - 0.5))
                        win_prob = max(0.05, min(0.95, win_prob))  # Clamp to reasonable range
                    
                    # Simulate bet outcome
                    if random.random() < win_prob:
                        # Win: profit is bet size times odds minus bet size
                        if edge.implied_prob > 0:
                            odds = 1 / edge.implied_prob
                            profit = bet_size * (odds - 1)
                        else:
                            profit = bet_size  # Fallback
                    else:
                        # Loss: lose the bet size
                        profit = -bet_size
                    
                    daily_profit += profit
                    daily_bets += 1
                
                daily_returns.append({
                    'day': day + 1,
                    'profit': daily_profit,
                    'bankroll': current_bankroll + daily_profit,
                    'roi': daily_profit / bankroll,
                    'bets': daily_bets
                })
                
                current_bankroll += daily_profit
            
            # Calculate run metrics
            total_profit = sum(day['profit'] for day in daily_returns)
            win_days = sum(1 for day in daily_returns if day['profit'] > 0)
            
            all_run_results.append({
                'total_profit': total_profit,
                'final_bankroll': current_bankroll,
                'win_rate': win_days / days,
                'daily_returns': daily_returns
            })
        
        # Aggregate results across all runs
        avg_profit = statistics.mean(result['total_profit'] for result in all_run_results)
        avg_win_rate = statistics.mean(result['win_rate'] for result in all_run_results)
        profits = [result['total_profit'] for result in all_run_results]
        
        # Calculate portfolio metrics
        roi = avg_profit / bankroll
        sharpe_ratio = self._calculate_sharpe_ratio(profits, 0.02)  # Assume 2% risk-free rate
        max_drawdown = self._calculate_max_drawdown(profits)
        consistency_score = 1.0 - (statistics.stdev(profits) / max(abs(avg_profit), 1))
        
        metrics = PortfolioMetrics(
            total_edges=len(edges),
            total_ev=sum(edge.expected_value * (edge.bet_size or bankroll * 0.02) for edge in edges),
            realized_profit=avg_profit,
            win_rate=avg_win_rate,
            roi=roi,
            sharpe_ratio=sharpe_ratio,
            max_drawdown=max_drawdown,
            consistency_score=consistency_score,
            average_confidence=statistics.mean(edge.confidence for edge in edges),
            portfolio_diversity=self._calculate_portfolio_diversity(edges),
            risk_adjusted_return=roi / max(abs(max_drawdown), 0.01)
        )
        
        # Average daily performance across runs
        daily_performance = []
        for day in range(days):
            day_profits = [run['daily_returns'][day]['profit'] for run in all_run_results]
            daily_performance.append({
                'day': day + 1,
                'avg_profit': statistics.mean(day_profits),
                'profit_std': statistics.stdev(day_profits) if len(day_profits) > 1 else 0,
                'win_probability': sum(1 for p in day_profits if p > 0) / len(day_profits)
            })
        
        return metrics, daily_performance
    
    def _backtest_strategy_performance(
        self,
        edges: List[Edge],
        days: int,
        bankroll: float
    ) -> Tuple[PortfolioMetrics, List[Dict[str, float]]]:
        """Backtest strategy using historical outcomes (placeholder)."""
        
        # This would integrate with historical data in a real implementation
        # For now, use simplified simulation
        return self._simulate_strategy_performance(edges, days, bankroll, runs=100)
    
    def _calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio for returns."""
        if not returns or len(returns) < 2:
            return 0.0
        
        excess_returns = [r - risk_free_rate for r in returns]
        mean_excess = statistics.mean(excess_returns)
        std_excess = statistics.stdev(excess_returns)
        
        return mean_excess / std_excess if std_excess > 0 else 0.0
    
    def _calculate_max_drawdown(self, returns: List[float]) -> float:
        """Calculate maximum drawdown from returns."""
        if not returns:
            return 0.0
        
        running_max = 0
        max_drawdown = 0
        
        for ret in returns:
            running_max = max(running_max, ret)
            drawdown = running_max - ret
            max_drawdown = max(max_drawdown, drawdown)
        
        return max_drawdown
    
    def _calculate_portfolio_diversity(self, edges: List[Edge]) -> float:
        """Calculate portfolio diversity score."""
        if not edges:
            return 0.0
        
        sports = set(edge.sport for edge in edges)
        prop_types = set(edge.prop_type for edge in edges)
        
        # Simple diversity measure
        sport_diversity = len(sports) / len(edges)
        prop_diversity = len(prop_types) / len(edges)
        
        return (sport_diversity + prop_diversity) / 2
    
    def save_results(self, results: Dict[str, ExperimentResult], output_dir: str) -> None:
        """Save experiment results to files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save individual results
        for strategy_name, result in results.items():
            filename = f"{strategy_name}_{timestamp}.json"
            filepath = output_path / filename
            
            with open(filepath, 'w') as f:
                json.dump(asdict(result), f, indent=2, default=str)
        
        # Save comparison summary
        summary_file = output_path / f"experiment_summary_{timestamp}.json"
        summary = self._create_experiment_summary(results)
        
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        self.logger.info(f"Results saved to {output_path}")
    
    def _create_experiment_summary(self, results: Dict[str, ExperimentResult]) -> Dict[str, Any]:
        """Create summary comparison of all strategies."""
        summary = {
            'experiment_timestamp': datetime.now().isoformat(),
            'strategies_tested': len(results),
            'strategy_comparison': {},
            'rankings': {}
        }
        
        # Extract key metrics for comparison
        metrics_data = {}
        for strategy_name, result in results.items():
            metrics = result.portfolio_metrics
            metrics_data[strategy_name] = {
                'roi': metrics.roi,
                'sharpe_ratio': metrics.sharpe_ratio,
                'win_rate': metrics.win_rate,
                'max_drawdown': metrics.max_drawdown,
                'consistency_score': metrics.consistency_score,
                'total_edges': metrics.total_edges,
                'realized_profit': metrics.realized_profit
            }
        
        summary['strategy_comparison'] = metrics_data
        
        # Create rankings for each metric
        for metric in ['roi', 'sharpe_ratio', 'win_rate', 'consistency_score']:
            ranked_strategies = sorted(
                results.keys(),
                key=lambda s: getattr(results[s].portfolio_metrics, metric),
                reverse=True
            )
            summary['rankings'][metric] = ranked_strategies
        
        return summary


def main():
    parser = argparse.ArgumentParser(description='Portfolio A/B Testing Harness')
    parser.add_argument('--input', type=str, help='Input file with edges data')
    parser.add_argument('--config', type=str, help='Configuration file (YAML)')
    parser.add_argument('--output', type=str, default='results/', help='Output directory')
    parser.add_argument('--k', type=int, default=15, help='Portfolio size')
    parser.add_argument('--days', type=int, default=7, help='Experiment duration in days')
    parser.add_argument('--bankroll', type=float, default=10000.0, help='Starting bankroll')
    parser.add_argument('--strategies', type=str, 
                       default='baseline,confidence_weighted,ev_optimized',
                       help='Comma-separated list of strategies to test')
    parser.add_argument('--simulate', action='store_true', help='Use simulation mode')
    parser.add_argument('--simulation-runs', type=int, default=1000, help='Number of simulation runs')
    parser.add_argument('--generate-synthetic', type=int, help='Generate N synthetic edges')
    
    args = parser.parse_args()
    
    # Load configuration if provided
    config = {}
    if args.config:
        with open(args.config, 'r') as f:
            config = yaml.safe_load(f)
    
    # Initialize harness
    harness = PortfolioABHarness(config)
    
    # Load or generate edges
    if args.generate_synthetic:
        edges = harness.generate_synthetic_edges(args.generate_synthetic)
    elif args.input:
        edges = harness.load_edges(args.input)
    else:
        print("Error: Must provide either --input file or --generate-synthetic count")
        sys.exit(1)
    
    # Parse strategies
    strategies = [s.strip() for s in args.strategies.split(',')]
    
    # Run experiment
    results = harness.run_ab_experiment(
        edges=edges,
        strategies=strategies,
        k=args.k,
        days=args.days,
        bankroll=args.bankroll,
        simulate=args.simulate,
        simulation_runs=args.simulation_runs
    )
    
    # Save results
    harness.save_results(results, args.output)
    
    # Print summary
    print(f"\n=== A/B Test Results Summary ===")
    print(f"Strategies tested: {len(results)}")
    print(f"Portfolio size: {args.k}")
    print(f"Duration: {args.days} days")
    print(f"Bankroll: ${args.bankroll:,.2f}")
    print(f"\nStrategy Performance:")
    
    for strategy_name, result in results.items():
        metrics = result.portfolio_metrics
        print(f"\n{strategy_name}:")
        print(f"  ROI: {metrics.roi:.2%}")
        print(f"  Sharpe Ratio: {metrics.sharpe_ratio:.3f}")
        print(f"  Win Rate: {metrics.win_rate:.2%}")
        print(f"  Max Drawdown: {metrics.max_drawdown:.2f}")
        print(f"  Consistency: {metrics.consistency_score:.3f}")
        print(f"  Realized Profit: ${metrics.realized_profit:,.2f}")


def run_ab(edges_data, k=15, days=7, strategies=['baseline', 'confidence_weighted']):
    """Simplified function for testing integration."""
    harness = PortfolioABHarness()
    
    # Convert dict data to Edge objects
    edges = []
    for item in edges_data:
        edge = Edge(
            edge_id=item.get('edge_id', f"edge_{len(edges)}"),
            prop_id=item.get('prop_id', 0),
            sport=item.get('sport', 'MLB'),
            prop_type=item.get('prop_type', 'STRIKEOUTS_PITCHER'),
            expected_value=float(item.get('expected_value', 0)),
            confidence=float(item.get('confidence', 0.5))
        )
        edges.append(edge)
    
    results = harness.run_ab_experiment(edges, strategies, k, days, simulate=True, simulation_runs=100)
    return results


if __name__ == '__main__':
    main()