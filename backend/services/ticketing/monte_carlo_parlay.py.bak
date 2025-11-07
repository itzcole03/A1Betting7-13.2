"""
Monte Carlo Parlay Simulation - Correlation-aware parlay simulation with adaptive stopping.

Implements:
- Correlated multivariate sampling for parlay legs
- Adaptive Monte Carlo with variance-based stopping
- Factor model-based dimensionality reduction
- Result persistence and caching
- Statistical confidence interval estimation
"""

import hashlib
import json
import math
import random
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

from sqlalchemy.orm import Session

from backend.models.portfolio_optimization import MonteCarloRun
from backend.models.modeling import Edge
from backend.services.unified_logging import get_logger

logger = get_logger("monte_carlo_parlay")


@dataclass
class ParlayLeg:
    """Individual parlay leg specification"""
    edge_id: int
    prop_id: int
    prob_over: float
    prob_under: float
    offered_line: float
    fair_line: float
    volatility_score: float


@dataclass
class MonteCarloResult:
    """Monte Carlo simulation result"""
    prob_joint: float  # Joint success probability
    draws_executed: int
    ci_low: float  # Confidence interval lower bound
    ci_high: float  # Confidence interval upper bound
    variance_estimate: float
    ev_independent: float  # EV assuming independence
    ev_adjusted: float  # EV adjusted for correlation
    distribution_snapshots: Dict[str, float]  # Quantiles, moments, etc.
    adaptive_stopped: bool  # Whether adaptive stopping was triggered


@dataclass
class SimulationParameters:
    """Monte Carlo simulation parameters"""
    draws_requested: int
    adaptive: bool
    seed: Optional[int]
    confidence_level: float
    target_ci_width: float
    batch_size: int
    correlation_matrix: List[List[float]]
    factor_loadings: Optional[List[List[float]]]


class MonteCarloParlay:
    """
    Monte Carlo simulation engine for correlated parlay betting with adaptive stopping.
    
    Features:
    - Correlated multivariate normal sampling
    - Factor model acceleration for high-dimensional problems
    - Adaptive stopping based on confidence interval width
    - Comprehensive result statistics and caching
    """

    def __init__(self, db_session: Session):
        self.db = db_session
        self.logger = logger
        
        # Default configuration
        self.default_draws = 20000
        self.max_draws = 50000
        self.min_draws = 1000
        self.default_batch_size = 5000
        self.confidence_level = 0.95
        self.target_ci_width = 0.015  # 1.5% target CI width

    def simulate_parlay(
        self,
        legs: List[ParlayLeg],
        correlation_matrix: List[List[float]],
        draws: int = None,
        adaptive: bool = True,
        seed: Optional[int] = None,
        factor_loadings: Optional[List[List[float]]] = None
    ) -> MonteCarloResult:
        """
        Run Monte Carlo simulation for correlated parlay.
        
        Args:
            legs: List of parlay legs to simulate
            correlation_matrix: Correlation matrix between legs
            draws: Number of draws (defaults to configured value)
            adaptive: Whether to use adaptive stopping
            seed: Random seed for reproducibility
            factor_loadings: Optional factor model loadings for acceleration
            
        Returns:
            MonteCarloResult with simulation outcomes
        """
        if draws is None:
            draws = self.default_draws
        draws = min(draws, self.max_draws)
        
        self.logger.info(
            f"Starting Monte Carlo parlay simulation - "
            f"legs: {len(legs)}, draws: {draws}, adaptive: {adaptive}"
        )

        # Set random seed if provided
        if seed is not None:
            random.seed(seed)
            if NUMPY_AVAILABLE:
                np.random.seed(seed)

        # Check for cached result
        run_key = self._generate_run_key(legs, correlation_matrix, draws, seed)
        cached_result = self._get_cached_result(run_key)
        if cached_result:
            self.logger.info("Using cached Monte Carlo result")
            return cached_result

        try:
            # Create simulation parameters
            params = SimulationParameters(
                draws_requested=draws,
                adaptive=adaptive,
                seed=seed,
                confidence_level=self.confidence_level,
                target_ci_width=self.target_ci_width,
                batch_size=self.default_batch_size,
                correlation_matrix=correlation_matrix,
                factor_loadings=factor_loadings
            )

            # Run simulation
            result = self._run_simulation(legs, params)

            # Persist result
            self._persist_result(run_key, legs, params, result)

            self.logger.info(
                f"Monte Carlo simulation completed - "
                f"prob_joint: {result.prob_joint:.4f}, "
                f"draws_executed: {result.draws_executed}, "
                f"ci_width: {result.ci_high - result.ci_low:.4f}"
            )

            return result

        except Exception as e:
            self.logger.error(f"Monte Carlo simulation failed: {e}")
            # Return fallback result
            return self._create_fallback_result(legs, draws)

    def _run_simulation(
        self,
        legs: List[ParlayLeg],
        params: SimulationParameters
    ) -> MonteCarloResult:
        """Execute the Monte Carlo simulation"""
        n_legs = len(legs)
        
        # Convert probabilities to z-thresholds for standard normal
        z_thresholds = []
        for leg in legs:
            # Use inverse normal CDF approximation
            z_thresh = self._inverse_normal_cdf(leg.prob_over)
            z_thresholds.append(z_thresh)

        # Initialize tracking variables
        successes = 0
        total_draws = 0
        batch_successes = []
        
        # Main simulation loop
        while total_draws < params.draws_requested:
            batch_size = min(
                params.batch_size,
                params.draws_requested - total_draws
            )
            
            # Generate correlated samples for this batch
            if NUMPY_AVAILABLE and params.factor_loadings:
                batch_outcomes = self._generate_batch_factor_numpy(
                    batch_size, z_thresholds, params.factor_loadings
                )
            elif NUMPY_AVAILABLE:
                batch_outcomes = self._generate_batch_matrix_numpy(
                    batch_size, z_thresholds, params.correlation_matrix
                )
            else:
                batch_outcomes = self._generate_batch_fallback(
                    batch_size, z_thresholds, params.correlation_matrix
                )
            
            # Count successes in this batch
            batch_success_count = sum(batch_outcomes)
            successes += batch_success_count
            total_draws += batch_size
            batch_successes.append(batch_success_count / batch_size)
            
            # Check adaptive stopping condition
            if params.adaptive and len(batch_successes) >= 3 and total_draws >= self.min_draws:
                current_prob = successes / total_draws
                variance_est = self._estimate_variance(batch_successes)
                ci_width = 2 * 1.96 * math.sqrt(variance_est / len(batch_successes))
                
                if ci_width <= params.target_ci_width:
                    self.logger.info(f"Adaptive stopping triggered at {total_draws} draws")
                    break

        # Calculate final statistics
        prob_joint = successes / total_draws
        variance_estimate = self._estimate_variance(batch_successes)
        
        # Confidence interval
        z_score = 1.96  # 95% confidence
        se = math.sqrt(prob_joint * (1 - prob_joint) / total_draws)
        ci_low = max(0.0, prob_joint - z_score * se)
        ci_high = min(1.0, prob_joint + z_score * se)
        
        # Calculate independent and adjusted EV
        ev_independent = self._calculate_independent_ev(legs)
        ev_adjusted = self._calculate_adjusted_ev(legs, prob_joint)
        
        # Distribution snapshots
        distribution_snapshots = {
            "mean": prob_joint,
            "variance": variance_estimate,
            "std": math.sqrt(variance_estimate) if variance_estimate > 0 else 0.0,
            "q25": max(0.0, prob_joint - 0.67 * se),
            "q75": min(1.0, prob_joint + 0.67 * se),
            "skewness": 0.0,  # Placeholder - could be computed from batch data
        }
        
        return MonteCarloResult(
            prob_joint=prob_joint,
            draws_executed=total_draws,
            ci_low=ci_low,
            ci_high=ci_high,
            variance_estimate=variance_estimate,
            ev_independent=ev_independent,
            ev_adjusted=ev_adjusted,
            distribution_snapshots=distribution_snapshots,
            adaptive_stopped=(total_draws < params.draws_requested)
        )

    def _generate_batch_factor_numpy(
        self,
        batch_size: int,
        z_thresholds: List[float],
        factor_loadings: List[List[float]]
    ) -> List[bool]:
        """Generate batch using factor model acceleration (numpy)"""
        n_legs = len(z_thresholds)
        n_factors = len(factor_loadings[0]) if factor_loadings else n_legs
        
        # Generate independent factor draws
        factor_draws = np.random.standard_normal((batch_size, n_factors))
        
        # Convert to correlated normal draws via factor loadings
        loadings_array = np.array(factor_loadings)
        correlated_draws = factor_draws @ loadings_array.T
        
        # Compare against thresholds
        outcomes = []
        for i in range(batch_size):
            leg_outcomes = [
                correlated_draws[i, j] > z_thresholds[j] 
                for j in range(n_legs)
            ]
            # All legs must succeed for parlay success
            outcomes.append(all(leg_outcomes))
        
        return outcomes

    def _generate_batch_matrix_numpy(
        self,
        batch_size: int,
        z_thresholds: List[float],
        correlation_matrix: List[List[float]]
    ) -> List[bool]:
        """Generate batch using full correlation matrix (numpy)"""
        try:
            corr_array = np.array(correlation_matrix)
            
            # Generate multivariate normal samples
            mean = np.zeros(len(z_thresholds))
            samples = np.random.multivariate_normal(
                mean, corr_array, size=batch_size
            )
            
            # Compare against thresholds
            outcomes = []
            for i in range(batch_size):
                leg_outcomes = [
                    samples[i, j] > z_thresholds[j] 
                    for j in range(len(z_thresholds))
                ]
                outcomes.append(all(leg_outcomes))
            
            return outcomes
            
        except Exception as e:
            self.logger.warning(f"Numpy matrix sampling failed: {e}, falling back")
            return self._generate_batch_fallback(batch_size, z_thresholds, correlation_matrix)

    def _generate_batch_fallback(
        self,
        batch_size: int,
        z_thresholds: List[float],
        correlation_matrix: List[List[float]]
    ) -> List[bool]:
        """Fallback batch generation without numpy"""
        n_legs = len(z_thresholds)
        outcomes = []
        
        for _ in range(batch_size):
            # Simple correlation approximation: use average correlation as adjustment
            avg_corr = 0.0
            count = 0
            for i in range(n_legs):
                for j in range(i + 1, n_legs):
                    avg_corr += abs(correlation_matrix[i][j])
                    count += 1
            
            if count > 0:
                avg_corr /= count
            
            # Generate independent draws first
            independent_draws = [random.gauss(0, 1) for _ in range(n_legs)]
            
            # Apply simple correlation adjustment
            if avg_corr > 0.1:  # Only adjust if meaningful correlation
                common_factor = random.gauss(0, 1) * math.sqrt(avg_corr)
                adjusted_draws = [
                    math.sqrt(1 - avg_corr) * draw + common_factor
                    for draw in independent_draws
                ]
            else:
                adjusted_draws = independent_draws
            
            # Check against thresholds
            leg_outcomes = [
                adjusted_draws[j] > z_thresholds[j] 
                for j in range(n_legs)
            ]
            outcomes.append(all(leg_outcomes))
        
        return outcomes

    def _inverse_normal_cdf(self, p: float) -> float:
        """Approximate inverse normal CDF using Beasley-Springer-Moro method"""
        if p <= 0:
            return -10.0
        if p >= 1:
            return 10.0
        
        # Beasley-Springer-Moro approximation
        a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
        b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
        
        if p > 0.5:
            p = 1 - p
            sign = 1
        else:
            sign = -1
        
        if p < 1e-10:
            return sign * 10.0
        
        try:
            t = math.sqrt(-2.0 * math.log(p))
            x = t - ((a[6]*t + a[5])*t + a[4])*t + a[3]
            x /= (((b[4]*t + b[3])*t + b[2])*t + b[1])*t + b[0]
            return sign * x
        except:
            # Fallback to simple approximation
            return sign * math.sqrt(-2.0 * math.log(p))

    def _estimate_variance(self, batch_proportions: List[float]) -> float:
        """Estimate variance from batch proportions"""
        if len(batch_proportions) < 2:
            return 0.0
        
        mean_p = sum(batch_proportions) / len(batch_proportions)
        variance = sum((p - mean_p) ** 2 for p in batch_proportions) / (len(batch_proportions) - 1)
        return variance

    def _calculate_independent_ev(self, legs: List[ParlayLeg]) -> float:
        """Calculate EV assuming independence"""
        prob_product = 1.0
        for leg in legs:
            prob_product *= leg.prob_over
        
        # Simple parlay payout approximation (should be configurable)
        payout_multiplier = 2.0 ** len(legs)  # Rough approximation
        ev = prob_product * payout_multiplier - 1.0
        return ev

    def _calculate_adjusted_ev(self, legs: List[ParlayLeg], adjusted_prob: float) -> float:
        """Calculate EV with correlation adjustment"""
        payout_multiplier = 2.0 ** len(legs)
        ev = adjusted_prob * payout_multiplier - 1.0
        return ev

    def _generate_run_key(
        self,
        legs: List[ParlayLeg],
        correlation_matrix: List[List[float]],
        draws: int,
        seed: Optional[int]
    ) -> str:
        """Generate unique key for simulation run"""
        key_data = {
            "legs": [(leg.edge_id, leg.prob_over) for leg in legs],
            "correlation_hash": self._hash_matrix(correlation_matrix),
            "draws": draws,
            "seed": seed,
            "version": "v1"
        }
        return hashlib.sha256(
            json.dumps(key_data, sort_keys=True).encode()
        ).hexdigest()[:32]

    def _hash_matrix(self, matrix: List[List[float]]) -> str:
        """Generate hash for correlation matrix"""
        # Round to 4 decimal places for consistent hashing
        rounded_matrix = [
            [round(val, 4) for val in row]
            for row in matrix
        ]
        return hashlib.sha256(
            json.dumps(rounded_matrix, sort_keys=True).encode()
        ).hexdigest()[:16]

    def _get_cached_result(self, run_key: str) -> Optional[MonteCarloResult]:
        """Check for cached simulation result"""
        try:
            cached_run = (
                self.db.query(MonteCarloRun)
                .filter_by(run_key=run_key)
                .first()
            )
            
            if cached_run:
                # Check if result is recent enough (within 24 hours)
                if datetime.now(timezone.utc) - cached_run.created_at < timedelta(hours=24):
                    return MonteCarloResult(
                        prob_joint=cached_run.prob_joint,
                        draws_executed=cached_run.draws_executed,
                        ci_low=cached_run.distribution_snapshots_json.get("ci_low", cached_run.prob_joint - 0.02),
                        ci_high=cached_run.distribution_snapshots_json.get("ci_high", cached_run.prob_joint + 0.02),
                        variance_estimate=cached_run.variance_estimate,
                        ev_independent=cached_run.ev_independent,
                        ev_adjusted=cached_run.ev_adjusted,
                        distribution_snapshots=cached_run.distribution_snapshots_json,
                        adaptive_stopped=cached_run.draws_executed < cached_run.draws_requested
                    )
            
            return None
            
        except Exception as e:
            self.logger.warning(f"Failed to retrieve cached result: {e}")
            return None

    def _persist_result(
        self,
        run_key: str,
        legs: List[ParlayLeg],
        params: SimulationParameters,
        result: MonteCarloResult
    ):
        """Persist simulation result to database"""
        try:
            # Check if run already exists
            existing_run = (
                self.db.query(MonteCarloRun)
                .filter_by(run_key=run_key)
                .first()
            )
            
            if existing_run:
                # Update existing run
                existing_run.variance_estimate = result.variance_estimate
                existing_run.ev_independent = result.ev_independent
                existing_run.ev_adjusted = result.ev_adjusted
                existing_run.prob_joint = result.prob_joint
                existing_run.draws_executed = result.draws_executed
                existing_run.distribution_snapshots_json = result.distribution_snapshots
            else:
                # Create new run
                mc_run = MonteCarloRun(
                    run_key=run_key,
                    legs_count=len(legs),
                    draws_requested=params.draws_requested,
                    draws_executed=result.draws_executed,
                    variance_estimate=result.variance_estimate,
                    ev_independent=result.ev_independent,
                    ev_adjusted=result.ev_adjusted,
                    prob_joint=result.prob_joint,
                    distribution_snapshots_json=result.distribution_snapshots,
                    parameters_json={
                        "adaptive": params.adaptive,
                        "seed": params.seed,
                        "confidence_level": params.confidence_level,
                        "target_ci_width": params.target_ci_width
                    }
                )
                self.db.add(mc_run)
            
            self.db.commit()
            self.logger.info("Monte Carlo result persisted successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to persist Monte Carlo result: {e}")
            self.db.rollback()

    def _create_fallback_result(self, legs: List[ParlayLeg], draws: int) -> MonteCarloResult:
        """Create fallback result when simulation fails"""
        # Simple independent probability calculation
        prob_joint = 1.0
        for leg in legs:
            prob_joint *= leg.prob_over
        
        # Rough confidence interval
        se = math.sqrt(prob_joint * (1 - prob_joint) / draws)
        ci_low = max(0.0, prob_joint - 1.96 * se)
        ci_high = min(1.0, prob_joint + 1.96 * se)
        
        return MonteCarloResult(
            prob_joint=prob_joint,
            draws_executed=draws,
            ci_low=ci_low,
            ci_high=ci_high,
            variance_estimate=prob_joint * (1 - prob_joint),
            ev_independent=self._calculate_independent_ev(legs),
            ev_adjusted=self._calculate_adjusted_ev(legs, prob_joint),
            distribution_snapshots={
                "mean": prob_joint,
                "variance": prob_joint * (1 - prob_joint),
                "std": math.sqrt(prob_joint * (1 - prob_joint))
            },
            adaptive_stopped=False
        )

    def get_run_by_key(self, run_key: str) -> Optional[MonteCarloResult]:
        """Retrieve simulation result by run key"""
        return self._get_cached_result(run_key)