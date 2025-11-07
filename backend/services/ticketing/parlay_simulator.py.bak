"""
Parlay Simulator - Computes expected value for multi-leg parlay tickets

This service handles:
1. Independent parlay probability calculation (product of individual probabilities)
2. Correlation-adjusted parlay probability using simplified Gaussian copula
3. Expected value calculations for both independent and correlation-adjusted scenarios
4. Payout multiplier calculations

The simulator helps estimate the true expected value of parlay tickets by accounting
for correlations between different prop outcomes.
"""

import logging
import math
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

import numpy as np
from scipy.stats import norm, multivariate_normal
from scipy.linalg import cholesky, LinAlgError

from backend.services.correlation.correlation_engine import correlation_engine
from backend.services.unified_config import get_correlation_config, get_ticketing_config
from backend.services.unified_logging import get_logger


logger = get_logger(__name__)


@dataclass
class LegInput:
    """Represents a single leg (bet) in a parlay"""
    prop_id: int
    prob_success: float  # Probability of this leg winning (prob_over or prob_under)
    offered_odds: float  # Offered odds for this leg
    fair_odds: float    # Fair odds based on model
    
    def __post_init__(self):
        # Validate probabilities
        self.prob_success = max(0.001, min(0.999, self.prob_success))


@dataclass
class ParlaySimulationResult:
    """Result of parlay simulation"""
    independent_prob: float
    adjusted_prob: float
    payout_multiplier: float
    ev_independent: float
    ev_adjusted: float
    correlation_adjustment_factor: float
    legs_count: int


class ParlaySimulator:
    """
    Simulates parlay expected value with correlation adjustments.
    
    Provides both independent probability calculations (simple product)
    and correlation-adjusted calculations using simplified Gaussian copula
    approximation for more realistic parlay EV estimation.
    """

    def __init__(self):
        self.correlation_config = get_correlation_config()
        self.ticketing_config = get_ticketing_config()

    def compute_independent_parlay_probability(self, legs: List[LegInput]) -> float:
        """
        Compute parlay probability assuming independence.
        
        Args:
            legs: List of parlay legs
            
        Returns:
            Probability of all legs winning (product of individual probabilities)
        """
        if not legs:
            return 0.0

        prob = 1.0
        for leg in legs:
            prob *= leg.prob_success

        logger.debug(
            "Computed independent parlay probability",
            extra={
                "legs_count": len(legs),
                "probability": prob,
                "action": "compute_independent_parlay_probability"
            }
        )

        return prob

    def approximate_correlation_adjusted_probability(
        self,
        legs: List[LegInput],
        correlation_matrix: Optional[Dict[int, Dict[int, float]]] = None
    ) -> float:
        """
        Approximate correlation-adjusted parlay probability.
        
        Uses simplified Gaussian copula approach:
        1. Convert success probabilities to standard normal quantiles
        2. Apply correlation structure
        3. Approximate joint probability
        
        Args:
            legs: List of parlay legs
            correlation_matrix: Optional pre-computed correlation matrix
            
        Returns:
            Correlation-adjusted probability of all legs winning
            
        TODO: Replace with robust Monte Carlo sampling for production
        """
        if not legs or not self.correlation_config.allow_correlation_adjustment:
            return self.compute_independent_parlay_probability(legs)

        if len(legs) == 1:
            return legs[0].prob_success

        # Get correlation matrix if not provided
        if correlation_matrix is None:
            prop_ids = [leg.prop_id for leg in legs]
            correlation_matrix = correlation_engine.build_correlation_matrix(prop_ids)

        # Check if we have meaningful correlations
        has_meaningful_correlations = self._check_meaningful_correlations(
            legs, correlation_matrix
        )
        
        if not has_meaningful_correlations:
            # Fallback to independent calculation
            return self.compute_independent_parlay_probability(legs)

        try:
            # Method 1: Simplified pairwise adjustment (more robust)
            adjusted_prob = self._pairwise_correlation_adjustment(legs, correlation_matrix)
            
            logger.debug(
                "Computed correlation-adjusted probability",
                extra={
                    "legs_count": len(legs),
                    "independent_prob": self.compute_independent_parlay_probability(legs),
                    "adjusted_prob": adjusted_prob,
                    "action": "approximate_correlation_adjusted_probability"
                }
            )

            return adjusted_prob

        except Exception as e:
            logger.warning(
                "Failed correlation adjustment, using independent calculation",
                extra={
                    "legs_count": len(legs),
                    "error": str(e),
                    "action": "approximate_correlation_adjusted_probability"
                }
            )
            return self.compute_independent_parlay_probability(legs)

    def _pairwise_correlation_adjustment(
        self,
        legs: List[LegInput],
        correlation_matrix: Dict[int, Dict[int, float]]
    ) -> float:
        """
        Apply pairwise correlation adjustment using vine copula approximation.
        
        This is a simplified approach that adjusts the independent probability
        based on average pairwise correlations and an adjustment factor.
        """
        independent_prob = self.compute_independent_parlay_probability(legs)
        
        if len(legs) <= 1:
            return independent_prob

        # Compute average absolute correlation
        correlations = []
        for i, leg_a in enumerate(legs):
            for j in range(i + 1, len(legs)):
                leg_b = legs[j]
                corr = correlation_matrix.get(leg_a.prop_id, {}).get(leg_b.prop_id, 0.0)
                correlations.append(abs(corr))

        avg_abs_correlation = np.mean(correlations) if correlations else 0.0
        
        # Apply adjustment factor
        adjustment_factor = self.correlation_config.adjustment_factor
        
        # Simplified adjustment: positive correlations increase parlay probability
        # (when one prop hits, others more likely to hit)
        correlation_multiplier = 1.0 + (avg_abs_correlation * adjustment_factor)
        
        # Apply adjustment but keep within reasonable bounds
        adjusted_prob = independent_prob * correlation_multiplier
        adjusted_prob = min(adjusted_prob, 0.95)  # Cap at 95%
        
        return adjusted_prob

    def _multivariate_normal_adjustment(
        self,
        legs: List[LegInput],
        correlation_matrix: Dict[int, Dict[int, float]]
    ) -> float:
        """
        Apply multivariate normal adjustment using Gaussian copula.
        
        TODO: This is a more sophisticated approach for future implementation.
        Currently simplified due to numerical stability concerns.
        """
        # Convert probabilities to standard normal quantiles
        quantiles = []
        for leg in legs:
            # Convert probability to quantile (inverse CDF)
            # Use 1 - prob_success because we want P(success)
            quantile = norm.ppf(1 - leg.prob_success)
            quantiles.append(quantile)

        # Build correlation matrix in numpy format
        n = len(legs)
        R = np.eye(n)
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    prop_i = legs[i].prop_id
                    prop_j = legs[j].prop_id
                    corr = correlation_matrix.get(prop_i, {}).get(prop_j, 0.0)
                    R[i, j] = corr

        # Ensure positive semi-definite matrix
        R = self._make_positive_semidefinite(R)

        try:
            # Compute joint probability using multivariate normal CDF
            # This is computationally expensive and approximate
            upper_bounds = np.array(quantiles)
            
            # For computational efficiency, use Monte Carlo approximation
            n_samples = 10000
            samples = multivariate_normal.rvs(mean=np.zeros(n), cov=R, size=n_samples)
            
            # Count how many samples satisfy all conditions
            success_count = 0
            for sample in samples:
                if all(sample[i] <= quantiles[i] for i in range(n)):
                    success_count += 1
            
            adjusted_prob = success_count / n_samples
            return max(0.001, min(0.999, adjusted_prob))

        except Exception as e:
            logger.warning(
                "Multivariate normal adjustment failed",
                extra={"error": str(e), "legs_count": n}
            )
            # Fallback to pairwise adjustment
            return self._pairwise_correlation_adjustment(legs, correlation_matrix)

    def _make_positive_semidefinite(self, matrix: np.ndarray) -> np.ndarray:
        """
        Ensure matrix is positive semi-definite by eigenvalue adjustment.
        """
        eigenvals, eigenvecs = np.linalg.eigh(matrix)
        eigenvals = np.maximum(eigenvals, 1e-8)  # Ensure positive eigenvalues
        return eigenvecs @ np.diag(eigenvals) @ eigenvecs.T

    def _check_meaningful_correlations(
        self,
        legs: List[LegInput],
        correlation_matrix: Dict[int, Dict[int, float]]
    ) -> bool:
        """
        Check if there are meaningful correlations worth adjusting for.
        """
        threshold = 0.1  # Minimum correlation to consider meaningful
        
        for i, leg_a in enumerate(legs):
            for j in range(i + 1, len(legs)):
                leg_b = legs[j]
                corr = correlation_matrix.get(leg_a.prop_id, {}).get(leg_b.prop_id, 0.0)
                if abs(corr) >= threshold:
                    return True
        
        return False

    def estimate_parlay_ev(
        self,
        legs: List[LegInput],
        stake: float,
        correlation_matrix: Optional[Dict[int, Dict[int, float]]] = None
    ) -> ParlaySimulationResult:
        """
        Estimate parlay expected value with both independent and correlation-adjusted scenarios.
        
        Args:
            legs: List of parlay legs
            stake: Stake amount
            correlation_matrix: Optional pre-computed correlation matrix
            
        Returns:
            ParlaySimulationResult with both independent and adjusted EV
        """
        if not legs or stake <= 0:
            return ParlaySimulationResult(
                independent_prob=0.0,
                adjusted_prob=0.0,
                payout_multiplier=0.0,
                ev_independent=-stake,
                ev_adjusted=-stake,
                correlation_adjustment_factor=0.0,
                legs_count=0
            )

        # Compute probabilities
        independent_prob = self.compute_independent_parlay_probability(legs)
        adjusted_prob = self.approximate_correlation_adjusted_probability(legs, correlation_matrix)

        # Compute payout multiplier (simplified)
        payout_multiplier = self._compute_payout_multiplier(legs)

        # Calculate expected values
        potential_payout = stake * payout_multiplier
        
        ev_independent = (independent_prob * potential_payout) - stake
        ev_adjusted = (adjusted_prob * potential_payout) - stake

        # Correlation adjustment factor for analysis
        if independent_prob > 0:
            correlation_adjustment_factor = adjusted_prob / independent_prob
        else:
            correlation_adjustment_factor = 1.0

        result = ParlaySimulationResult(
            independent_prob=independent_prob,
            adjusted_prob=adjusted_prob,
            payout_multiplier=payout_multiplier,
            ev_independent=ev_independent,
            ev_adjusted=ev_adjusted,
            correlation_adjustment_factor=correlation_adjustment_factor,
            legs_count=len(legs)
        )

        logger.info(
            "Estimated parlay EV",
            extra={
                "legs_count": len(legs),
                "stake": stake,
                "independent_ev": ev_independent,
                "adjusted_ev": ev_adjusted,
                "adjustment_factor": correlation_adjustment_factor,
                "action": "estimate_parlay_ev"
            }
        )

        return result

    def _compute_payout_multiplier(self, legs: List[LegInput]) -> float:
        """
        Compute payout multiplier for parlay.
        
        TODO: Implement sophisticated payout schema modeling for different platforms.
        Currently uses simplified base multiplier approach.
        """
        # Simple approach: base multiplier raised to power of legs count
        base_multiplier = self.ticketing_config.parlay_base_multiplier
        legs_factor = len(legs) ** 0.5  # Diminishing returns for more legs
        
        multiplier = base_multiplier * legs_factor
        
        # Apply minimum multiplier based on odds
        # For realistic parlays, multiplier should be at least product of fair odds
        fair_odds_product = 1.0
        for leg in legs:
            if leg.fair_odds > 0:
                # Convert to decimal odds if needed
                decimal_odds = leg.fair_odds if leg.fair_odds > 1 else (1 / leg.fair_odds)
                fair_odds_product *= decimal_odds

        # Use the higher of configured multiplier or fair odds product
        return max(multiplier, fair_odds_product)


# Global instance
parlay_simulator = ParlaySimulator()


# Convenience functions
def compute_independent_parlay_probability(legs: List[LegInput]) -> float:
    """Convenience function for independent parlay probability"""
    return parlay_simulator.compute_independent_parlay_probability(legs)


def approximate_correlation_adjusted_probability(
    legs: List[LegInput],
    correlation_matrix: Optional[Dict[int, Dict[int, float]]] = None
) -> float:
    """Convenience function for correlation-adjusted probability"""
    return parlay_simulator.approximate_correlation_adjusted_probability(legs, correlation_matrix)


def estimate_parlay_ev(
    legs: List[LegInput],
    stake: float,
    correlation_matrix: Optional[Dict[int, Dict[int, float]]] = None
) -> ParlaySimulationResult:
    """Convenience function for parlay EV estimation"""
    return parlay_simulator.estimate_parlay_ev(legs, stake, correlation_matrix)