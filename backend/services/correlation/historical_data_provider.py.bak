"""
Historical Data Provider - Provides synthetic historical outcomes for correlation analysis

This service handles the generation and persistence of historical prop outcomes
needed for correlation analysis. Currently uses synthetic data generation based
on model predictions since real historical ingestion may not be available.

TODO: Replace synthetic generation with real stat ingestion when available.
"""

import hashlib
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

import numpy as np
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models.correlation_ticketing import HistoricalPropOutcome
from backend.models.modeling import ModelPrediction, DistributionFamily
from backend.services.unified_config import get_correlation_config
from backend.services.unified_logging import get_logger


logger = get_logger(__name__)


class HistoricalDataProvider:
    """
    Provides historical prop outcomes for correlation analysis.
    
    Generates synthetic historical data based on model predictions when real
    historical data is not available. Caches results to avoid re-generation.
    """

    def __init__(self):
        self.config = get_correlation_config()
        self._cache = {}  # Simple in-memory cache

    def ensure_minimum_history(
        self,
        prop_id: int,
        min_samples: Optional[int] = None
    ) -> List[float]:
        """
        Ensure minimum historical samples exist for a prop.
        
        Args:
            prop_id: The prop ID to generate history for
            min_samples: Minimum samples needed (defaults to config)
            
        Returns:
            List of historical actual values
            
        TODO: Replace with real stat ingestion when available
        """
        if min_samples is None:
            min_samples = self.config.min_samples

        cache_key = f"history_{prop_id}_{min_samples}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        session = SessionLocal()
        try:
            # Check existing historical data
            existing_count = session.query(HistoricalPropOutcome).filter(
                HistoricalPropOutcome.prop_id == prop_id
            ).count()

            if existing_count >= min_samples:
                # Load existing data
                outcomes = session.query(HistoricalPropOutcome).filter(
                    HistoricalPropOutcome.prop_id == prop_id
                ).order_by(desc(HistoricalPropOutcome.event_date)).limit(min_samples).all()
                
                values = [outcome.actual_value for outcome in outcomes]
                self._cache[cache_key] = values
                return values

            # Generate synthetic data to meet minimum requirement
            samples_needed = min_samples - existing_count
            synthetic_outcomes = self._generate_synthetic_outcomes(
                session, prop_id, samples_needed
            )

            # Persist synthetic outcomes
            for outcome in synthetic_outcomes:
                session.add(outcome)
            
            session.commit()

            # Return all values (existing + new)
            all_outcomes = session.query(HistoricalPropOutcome).filter(
                HistoricalPropOutcome.prop_id == prop_id
            ).order_by(desc(HistoricalPropOutcome.event_date)).limit(min_samples).all()
            
            values = [outcome.actual_value for outcome in all_outcomes]
            self._cache[cache_key] = values

            logger.info(
                "Generated synthetic history",
                extra={
                    "prop_id": prop_id,
                    "samples_generated": samples_needed,
                    "total_samples": len(values),
                    "action": "ensure_minimum_history"
                }
            )

            return values
        finally:
            session.close()

    def _generate_synthetic_outcomes(
        self,
        session: Session,
        prop_id: int,
        count: int
    ) -> List[HistoricalPropOutcome]:
        """
        Generate synthetic historical outcomes based on model predictions.
        
        Args:
            session: Database session
            prop_id: Prop ID to generate for
            count: Number of samples to generate
            
        Returns:
            List of HistoricalPropOutcome instances (not yet persisted)
        """
        # Get the latest model prediction for this prop
        prediction = session.query(ModelPrediction).filter(
            ModelPrediction.prop_id == prop_id
        ).order_by(desc(ModelPrediction.generated_at)).first()

        if not prediction:
            logger.warning(
                "No model prediction found for prop",
                extra={"prop_id": prop_id, "action": "generate_synthetic"}
            )
            # Fallback to default distribution
            mean, variance = 15.0, 25.0  # Generic basketball points-like default
            distribution_family = DistributionFamily.NORMAL
            player_id = 1  # Placeholder
            prop_type = "UNKNOWN"
        else:
            mean = prediction.mean
            variance = prediction.variance
            distribution_family = prediction.distribution_family
            player_id = prediction.player_id
            prop_type = prediction.prop_type

        # Generate samples based on distribution family
        if distribution_family == DistributionFamily.POISSON:
            # For Poisson, variance equals mean, so use mean as lambda
            samples = np.random.poisson(lam=mean, size=count)
        elif distribution_family == DistributionFamily.NEG_BINOMIAL:
            # Negative binomial parameterization: convert mean/var to n,p
            if variance > mean:
                # Standard negative binomial (variance > mean)
                p = mean / variance
                n = mean * p / (1 - p)
                samples = np.random.negative_binomial(n=max(1, int(n)), p=min(0.99, p), size=count)
            else:
                # Fallback to Poisson if variance <= mean
                samples = np.random.poisson(lam=mean, size=count)
        else:  # NORMAL or default
            std_dev = np.sqrt(max(0.1, variance))  # Ensure positive variance
            samples = np.random.normal(loc=mean, scale=std_dev, size=count)
            # Ensure non-negative values for sports stats
            samples = np.maximum(0, samples)

        # Convert to float and create outcome records
        outcomes = []
        base_date = datetime.now() - timedelta(days=count + 10)
        
        for i, sample_value in enumerate(samples):
            outcome = HistoricalPropOutcome(
                prop_id=prop_id,
                player_id=player_id,
                prop_type=prop_type,
                event_date=base_date + timedelta(days=i + 1),
                actual_value=float(sample_value),
                source="synthetic"
            )
            outcomes.append(outcome)

        return outcomes

    def get_aligned_history(
        self,
        prop_ids: List[int],
        min_samples: Optional[int] = None
    ) -> Tuple[List[int], List[List[float]]]:
        """
        Get aligned historical data for multiple props.
        
        Since we're using synthetic data, alignment is by sample index rather
        than actual game dates. In a real implementation, this would align by
        actual game dates.
        
        Args:
            prop_ids: List of prop IDs
            min_samples: Minimum samples for each prop
            
        Returns:
            Tuple of (prop_ids, aligned_data_matrix)
            where aligned_data_matrix[i] corresponds to prop_ids[i]
            
        TODO: Implement real game-date alignment when historical ingestion available
        """
        if min_samples is None:
            min_samples = self.config.min_samples

        aligned_data = []
        valid_prop_ids = []

        for prop_id in prop_ids:
            try:
                history = self.ensure_minimum_history(prop_id, min_samples)
                if len(history) >= min_samples:
                    # Take the most recent min_samples
                    aligned_data.append(history[:min_samples])
                    valid_prop_ids.append(prop_id)
                else:
                    logger.warning(
                        "Insufficient history for prop",
                        extra={
                            "prop_id": prop_id,
                            "available_samples": len(history),
                            "required_samples": min_samples,
                            "action": "get_aligned_history"
                        }
                    )
            except Exception as e:
                logger.error(
                    "Failed to get history for prop",
                    extra={
                        "prop_id": prop_id,
                        "error": str(e),
                        "action": "get_aligned_history"
                    }
                )

        logger.info(
            "Retrieved aligned history",
            extra={
                "requested_props": len(prop_ids),
                "valid_props": len(valid_prop_ids),
                "samples_per_prop": min_samples,
                "action": "get_aligned_history"
            }
        )

        return valid_prop_ids, aligned_data

    def clear_cache(self):
        """Clear the in-memory cache"""
        self._cache.clear()
        logger.info("Cleared historical data cache")

    def get_cache_stats(self) -> dict:
        """Get cache statistics for monitoring"""
        return {
            "cached_props": len(self._cache),
            "cache_keys": list(self._cache.keys())
        }


# Global instance
historical_data_provider = HistoricalDataProvider()


# Convenience functions
def ensure_minimum_history(prop_id: int, min_samples: Optional[int] = None) -> List[float]:
    """Convenience function for ensuring minimum history"""
    return historical_data_provider.ensure_minimum_history(prop_id, min_samples)


def get_aligned_history(
    prop_ids: List[int],
    min_samples: Optional[int] = None
) -> Tuple[List[int], List[List[float]]]:
    """Convenience function for getting aligned history"""
    return historical_data_provider.get_aligned_history(prop_ids, min_samples)