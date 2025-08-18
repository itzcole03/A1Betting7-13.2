"""
Optimizer Weighting Patch

Integrates edge confidence scoring into portfolio optimization and edge ranking.
Provides sophisticated weighting mechanisms for multi-objective optimization.
"""

from __future__ import annotations

import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

from ..edges.edge_confidence import edge_confidence_evaluator, EdgeConfidenceResult, ConfidenceComponents
from ..unified_config import unified_config
from ..unified_logging import get_logger

logger = get_logger("edge_weighting")


@dataclass
class EdgeWeightingResult:
    """Result of edge weighting calculation"""
    
    edge_id: int
    base_ev: float
    confidence_score: float
    effective_edge_value: float
    
    # Weight components
    confidence_weight: float
    exposure_penalty: float
    correlation_penalty: float
    volatility_penalty: float
    
    # Final weighting factors
    final_weight: float
    rank_score: float
    
    # Metadata
    confidence_tier: str
    risk_adjusted: bool
    warnings: List[str]


class EdgeWeightingOptimizer:
    """Optimizes edge weighting using confidence and risk factors"""
    
    def __init__(self):
        self.config = unified_config
        self.logger = logger
        
        # Feature flags
        self.enable_confidence_weighting = self.config.get_config_value(
            "optimizer.enable_confidence_weighting", True
        )
        self.enable_exposure_penalty = self.config.get_config_value(
            "optimizer.enable_exposure_penalty", True
        )
        self.enable_correlation_penalty = self.config.get_config_value(
            "optimizer.enable_correlation_penalty", True
        )
        self.enable_volatility_penalty = self.config.get_config_value(
            "optimizer.enable_volatility_penalty", True
        )
        
        # Weighting parameters
        self.confidence_amplification = self.config.get_config_value(
            "optimizer.confidence_amplification", 1.5
        )
        self.max_exposure_penalty = self.config.get_config_value(
            "optimizer.max_exposure_penalty", 0.5
        )
        self.max_correlation_penalty = self.config.get_config_value(
            "optimizer.max_correlation_penalty", 0.3
        )
        self.max_volatility_penalty = self.config.get_config_value(
            "optimizer.max_volatility_penalty", 0.4
        )
        
        # Risk thresholds
        self.high_volatility_threshold = self.config.get_config_value(
            "optimizer.high_volatility_threshold", 1.5
        )
        self.high_correlation_threshold = self.config.get_config_value(
            "optimizer.high_correlation_threshold", 0.7
        )
        self.max_single_position_exposure = self.config.get_config_value(
            "optimizer.max_single_position_exposure", 0.1
        )


def compute_effective_edge_value(
    edge: Dict[str, Any],
    confidence_components: Optional[Dict[str, float]] = None,
    exposure_penalty: float = 0.0,
    correlation_penalty: float = 0.0,
    volatility_penalty: float = 0.0,
    optimizer_instance: Optional[EdgeWeightingOptimizer] = None
) -> float:
    """
    Compute effective edge value incorporating confidence and risk penalties.
    
    Args:
        edge: Edge data containing ev, volatility, prop_type, etc.
        confidence_components: Optional confidence component scores
        exposure_penalty: Penalty for position size concentration (0.0-1.0)
        correlation_penalty: Penalty for correlated positions (0.0-1.0)
        volatility_penalty: Penalty for high volatility (0.0-1.0)
        optimizer_instance: Optional optimizer instance for advanced calculations
        
    Returns:
        float: Effective edge value after all adjustments
    """
    try:
        base_ev = edge.get('ev', 0.0)
        
        if base_ev <= 0:
            return 0.0
        
        # Start with base expected value
        effective_value = base_ev
        
        # Apply confidence weighting if available
        if confidence_components:
            confidence_weight = _calculate_confidence_weight(
                confidence_components, optimizer_instance
            )
            effective_value *= confidence_weight
        
        # Apply risk penalties
        effective_value *= (1.0 - exposure_penalty)
        effective_value *= (1.0 - correlation_penalty)
        effective_value *= (1.0 - volatility_penalty)
        
        return max(0.0, effective_value)
        
    except Exception as e:
        logger.error(f"Error computing effective edge value: {e}")
        return 0.0


def _calculate_confidence_weight(
    confidence_components: Dict[str, float],
    optimizer_instance: Optional[EdgeWeightingOptimizer] = None
) -> float:
    """Calculate confidence-based weight multiplier"""
    try:
        # Extract key confidence metrics
        composite_confidence = confidence_components.get('composite_confidence', 0.6)
        model_confidence = confidence_components.get('model_confidence', 0.6)
        data_quality = confidence_components.get('data_freshness', 0.6)
        
        # Calculate confidence weight with amplification
        base_weight = composite_confidence
        
        # Apply amplification for high-confidence edges
        amplification = 1.5 if optimizer_instance is None else optimizer_instance.confidence_amplification
        
        if composite_confidence > 0.75:  # High confidence
            weight = base_weight * amplification
        elif composite_confidence > 0.55:  # Medium confidence
            weight = base_weight * (amplification * 0.7)
        else:  # Low confidence
            weight = base_weight * 0.8
        
        return min(2.0, max(0.1, weight))  # Clamp between 0.1 and 2.0
        
    except Exception as e:
        logger.warning(f"Error calculating confidence weight: {e}")
        return 1.0  # Neutral weight on error


class EdgeWeightingOptimizer:
    """Advanced edge weighting optimizer with confidence integration"""
    
    async def calculate_edge_weights(
        self, 
        edges: List[Dict[str, Any]], 
        portfolio_context: Optional[Dict] = None
    ) -> List[EdgeWeightingResult]:
        """
        Calculate optimized weights for a list of edges.
        
        Args:
            edges: List of edge dictionaries
            portfolio_context: Optional portfolio context for correlation analysis
            
        Returns:
            List[EdgeWeightingResult]: Weighted edge results
        """
        results = []
        
        try:
            # Get confidence evaluations for all edges
            confidence_results = await self._batch_evaluate_confidence(edges)
            
            # Calculate portfolio-level risk metrics
            portfolio_metrics = self._calculate_portfolio_metrics(edges, portfolio_context)
            
            for i, edge in enumerate(edges):
                try:
                    edge_id = edge.get('id', i)
                    confidence_result = confidence_results.get(edge_id)
                    
                    # Calculate individual weight components
                    weight_result = await self._calculate_individual_weights(
                        edge, confidence_result, portfolio_metrics
                    )
                    
                    results.append(weight_result)
                    
                except Exception as e:
                    self.logger.error(f"Error calculating weights for edge {edge_id}: {e}")
                    # Add minimal result for failed edge
                    results.append(EdgeWeightingResult(
                        edge_id=edge_id,
                        base_ev=edge.get('ev', 0.0),
                        confidence_score=0.0,
                        effective_edge_value=0.0,
                        confidence_weight=0.0,
                        exposure_penalty=1.0,
                        correlation_penalty=1.0,
                        volatility_penalty=1.0,
                        final_weight=0.0,
                        rank_score=0.0,
                        confidence_tier="ERROR",
                        risk_adjusted=True,
                        warnings=[f"Weight calculation failed: {str(e)}"]
                    ))
            
            # Normalize weights across the portfolio
            results = self._normalize_portfolio_weights(results)
            
            self.logger.info(f"Calculated weights for {len(results)} edges")
            return results
            
        except Exception as e:
            self.logger.error(f"Error in batch weight calculation: {e}")
            return []
    
    async def _batch_evaluate_confidence(
        self, 
        edges: List[Dict[str, Any]]
    ) -> Dict[int, EdgeConfidenceResult]:
        """Batch evaluate confidence for multiple edges"""
        confidence_results = {}
        
        try:
            for i, edge in enumerate(edges):
                edge_id = edge.get('id', i)
                
                try:
                    confidence_result = await edge_confidence_evaluator.evaluate_edge_confidence(
                        edge_id=edge_id,
                        edge_data=edge,
                        market_data=edge.get('market_data')
                    )
                    confidence_results[edge_id] = confidence_result
                    
                except Exception as e:
                    self.logger.warning(f"Confidence evaluation failed for edge {edge_id}: {e}")
                    # Create minimal confidence result
                    confidence_results[edge_id] = EdgeConfidenceResult(
                        edge_id=edge_id,
                        composite_confidence=0.5,
                        confidence_components=ConfidenceComponents(),
                        confidence_tier="LOW",
                        risk_adjusted_confidence=0.5,
                        evaluation_timestamp=None,
                        evaluation_duration_ms=0,
                        model_version="error"
                    )
            
            return confidence_results
            
        except Exception as e:
            self.logger.error(f"Error in batch confidence evaluation: {e}")
            return {}
    
    def _calculate_portfolio_metrics(
        self, 
        edges: List[Dict[str, Any]], 
        portfolio_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Calculate portfolio-level metrics for risk assessment"""
        try:
            total_ev = sum(edge.get('ev', 0.0) for edge in edges)
            total_positions = len(edges)
            
            # Calculate position size distribution
            position_sizes = [edge.get('position_size', 0.01) for edge in edges]
            max_position_size = max(position_sizes) if position_sizes else 0.0
            
            # Calculate prop type concentration
            prop_types = [edge.get('prop_type', 'unknown') for edge in edges]
            prop_type_counts = {}
            for prop_type in prop_types:
                prop_type_counts[prop_type] = prop_type_counts.get(prop_type, 0) + 1
            
            max_prop_type_concentration = (
                max(prop_type_counts.values()) / max(1, total_positions)
                if prop_type_counts else 0.0
            )
            
            # Calculate average volatility
            volatilities = [edge.get('volatility_score', 0.5) for edge in edges]
            avg_volatility = sum(volatilities) / max(1, len(volatilities))
            
            return {
                'total_ev': total_ev,
                'total_positions': total_positions,
                'max_position_size': max_position_size,
                'max_prop_type_concentration': max_prop_type_concentration,
                'average_volatility': avg_volatility,
                'portfolio_value': portfolio_context.get('portfolio_value', 10000.0) if portfolio_context else 10000.0
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating portfolio metrics: {e}")
            return {}
    
    async def _calculate_individual_weights(
        self,
        edge: Dict[str, Any],
        confidence_result: Optional[EdgeConfidenceResult],
        portfolio_metrics: Dict[str, Any]
    ) -> EdgeWeightingResult:
        """Calculate weights for an individual edge"""
        try:
            edge_id = edge.get('id', 0)
            base_ev = edge.get('ev', 0.0)
            
            # Initialize weight components
            confidence_weight = 1.0
            exposure_penalty = 0.0
            correlation_penalty = 0.0
            volatility_penalty = 0.0
            warnings = []
            
            # Calculate confidence weight
            if confidence_result and self.enable_confidence_weighting:
                confidence_weight = self._calculate_confidence_multiplier(confidence_result)
            elif not confidence_result:
                warnings.append("No confidence result available")
            
            # Calculate exposure penalty
            if self.enable_exposure_penalty:
                exposure_penalty = self._calculate_exposure_penalty(edge, portfolio_metrics)
            
            # Calculate correlation penalty
            if self.enable_correlation_penalty:
                correlation_penalty = self._calculate_correlation_penalty(edge, portfolio_metrics)
            
            # Calculate volatility penalty
            if self.enable_volatility_penalty:
                volatility_penalty = self._calculate_volatility_penalty(edge)
            
            # Calculate effective edge value
            effective_edge_value = base_ev * confidence_weight
            effective_edge_value *= (1.0 - exposure_penalty)
            effective_edge_value *= (1.0 - correlation_penalty)
            effective_edge_value *= (1.0 - volatility_penalty)
            
            # Calculate final weight and rank score
            final_weight = max(0.0, effective_edge_value)
            rank_score = final_weight * confidence_weight  # Boost ranking for high confidence
            
            return EdgeWeightingResult(
                edge_id=edge_id,
                base_ev=base_ev,
                confidence_score=confidence_result.composite_confidence if confidence_result else 0.0,
                effective_edge_value=effective_edge_value,
                confidence_weight=confidence_weight,
                exposure_penalty=exposure_penalty,
                correlation_penalty=correlation_penalty,
                volatility_penalty=volatility_penalty,
                final_weight=final_weight,
                rank_score=rank_score,
                confidence_tier=confidence_result.confidence_tier if confidence_result else "UNKNOWN",
                risk_adjusted=True,
                warnings=warnings
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating individual weights for edge {edge.get('id')}: {e}")
            raise
    
    def _calculate_confidence_multiplier(self, confidence_result: EdgeConfidenceResult) -> float:
        """Calculate confidence-based weight multiplier"""
        try:
            base_confidence = confidence_result.composite_confidence
            
            # Tier-based amplification
            if confidence_result.confidence_tier == "HIGH":
                return base_confidence * self.confidence_amplification
            elif confidence_result.confidence_tier == "MEDIUM":
                return base_confidence * (self.confidence_amplification * 0.7)
            else:  # LOW
                return base_confidence * 0.8
            
        except Exception as e:
            self.logger.warning(f"Error calculating confidence multiplier: {e}")
            return 1.0
    
    def _calculate_exposure_penalty(self, edge: Dict, portfolio_metrics: Dict) -> float:
        """Calculate penalty for position size exposure"""
        try:
            position_size = edge.get('position_size', 0.01)
            portfolio_value = portfolio_metrics.get('portfolio_value', 10000.0)
            
            # Calculate position as percentage of portfolio
            position_percentage = position_size / max(1.0, portfolio_value)
            
            if position_percentage > self.max_single_position_exposure:
                excess_exposure = position_percentage - self.max_single_position_exposure
                penalty = min(self.max_exposure_penalty, excess_exposure * 5.0)
                return penalty
            
            return 0.0
            
        except Exception as e:
            self.logger.warning(f"Error calculating exposure penalty: {e}")
            return 0.0
    
    def _calculate_correlation_penalty(self, edge: Dict, portfolio_metrics: Dict) -> float:
        """Calculate penalty for correlated positions"""
        try:
            # Simplified correlation penalty based on prop type concentration
            prop_type = edge.get('prop_type', 'unknown')
            prop_concentration = portfolio_metrics.get('max_prop_type_concentration', 0.0)
            
            if prop_concentration > 0.5:  # More than 50% in same prop type
                penalty = min(self.max_correlation_penalty, (prop_concentration - 0.5) * 2.0)
                return penalty
            
            return 0.0
            
        except Exception as e:
            self.logger.warning(f"Error calculating correlation penalty: {e}")
            return 0.0
    
    def _calculate_volatility_penalty(self, edge: Dict) -> float:
        """Calculate penalty for high volatility"""
        try:
            volatility = edge.get('volatility_score', 0.5)
            
            if volatility > self.high_volatility_threshold:
                excess_volatility = volatility - self.high_volatility_threshold
                penalty = min(self.max_volatility_penalty, excess_volatility * 0.3)
                return penalty
            
            return 0.0
            
        except Exception as e:
            self.logger.warning(f"Error calculating volatility penalty: {e}")
            return 0.0
    
    def _normalize_portfolio_weights(self, results: List[EdgeWeightingResult]) -> List[EdgeWeightingResult]:
        """Normalize weights across the entire portfolio"""
        try:
            # Calculate total weight
            total_weight = sum(result.final_weight for result in results)
            
            if total_weight <= 0:
                self.logger.warning("Total portfolio weight is zero or negative")
                return results
            
            # Normalize each weight
            for result in results:
                result.final_weight = result.final_weight / total_weight
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error normalizing portfolio weights: {e}")
            return results


# Global optimizer instance
edge_weighting_optimizer = EdgeWeightingOptimizer()