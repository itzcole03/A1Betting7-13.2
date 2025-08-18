"""
Edge Weighting Optimizer with Confidence Integration

This module provides advanced edge weighting optimization by integrating confidence
evaluation with risk-adjusted portfolio management. The system incorporates:

1. Confidence-based weighting adjustments
2. Exposure penalty calculations  
3. Correlation penalty assessment
4. Volatility-based risk adjustments
5. Portfolio-level optimization

The optimizer operates behind feature flags for incremental deployment.
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from ..unified_config import unified_config
from ..unified_logging import get_logger
from ..edges.edge_confidence import EdgeConfidenceEvaluator, EdgeConfidenceResult, ConfidenceComponents

# Initialize services
logger = get_logger("edge_weighting")

@dataclass
class EdgeWeightingResult:
    """Results of edge weighting optimization"""
    edge_id: int
    base_ev: float
    confidence_score: float
    confidence_tier: str
    confidence_multiplier: float
    exposure_penalty: float
    correlation_penalty: float
    volatility_penalty: float
    final_weight: float
    risk_metrics: Dict[str, Any]
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
                edge_id = edge.get('id', i)
                try:
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
                        confidence_tier="UNKNOWN",
                        confidence_multiplier=1.0,
                        exposure_penalty=0.0,
                        correlation_penalty=0.0,
                        volatility_penalty=0.0,
                        final_weight=0.0,
                        risk_metrics={},
                        warnings=[f"Failed to calculate weights: {e}"]
                    ))
            
            self.logger.info(f"Calculated weights for {len(results)} edges")
            return self._normalize_portfolio_weights(results)
            
        except Exception as e:
            self.logger.error(f"Error in batch weight calculation: {e}")
            return results
    
    async def _batch_evaluate_confidence(self, edges: List[Dict]) -> Dict[int, EdgeConfidenceResult]:
        """Batch evaluate confidence for multiple edges"""
        confidence_evaluator = EdgeConfidenceEvaluator()
        results = {}
        
        for i, edge in enumerate(edges):
            edge_id = edge.get('id', i)
            try:
                edge_data = {
                    'ev': edge.get('ev', 0.0),
                    'prop_type': edge.get('prop_type', 'unknown'),
                    'market_size': edge.get('market_size', 1000),
                    'volatility_score': edge.get('volatility_score', 0.5)
                }
                
                confidence_result = await confidence_evaluator.evaluate_edge_confidence(
                    edge_id=edge_id,
                    edge_data=edge_data,
                    force_refresh=False
                )
                results[edge_id] = confidence_result
                
            except Exception as e:
                self.logger.warning(f"Confidence evaluation failed for edge {edge_id}: {e}")
                # Create minimal confidence result
                results[edge_id] = EdgeConfidenceResult(
                    edge_id=edge_id,
                    composite_confidence=0.5,
                    confidence_components=ConfidenceComponents(),
                    confidence_tier="MEDIUM",
                    risk_adjusted_confidence=0.4,
                    evaluation_timestamp=datetime.now(timezone.utc),
                    evaluation_duration_ms=0,
                    model_version="unknown",
                    warnings=[f"Confidence evaluation failed: {e}"]
                )
        
        self.logger.info(f"Evaluated confidence for {len(results)} edges")
        return results
    
    def _calculate_portfolio_metrics(self, edges: List[Dict], portfolio_context: Optional[Dict]) -> Dict:
        """Calculate portfolio-level risk and correlation metrics"""
        try:
            metrics = {
                'total_exposure': sum(edge.get('bet_size', 0) for edge in edges),
                'prop_type_concentration': {},
                'market_concentration': {},
                'volatility_distribution': []
            }
            
            # Calculate prop type concentration
            prop_types = [edge.get('prop_type', 'unknown') for edge in edges]
            for prop_type in set(prop_types):
                count = prop_types.count(prop_type)
                metrics['prop_type_concentration'][prop_type] = count / len(edges)
            
            # Calculate volatility distribution
            volatilities = [edge.get('volatility_score', 0.5) for edge in edges]
            metrics['volatility_distribution'] = volatilities
            metrics['avg_volatility'] = sum(volatilities) / len(volatilities) if volatilities else 0.5
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Error calculating portfolio metrics: {e}")
            return {}
    
    async def _calculate_individual_weights(
        self, 
        edge: Dict, 
        confidence_result: Optional[EdgeConfidenceResult],
        portfolio_metrics: Dict
    ) -> EdgeWeightingResult:
        """Calculate weights for an individual edge"""
        try:
            edge_id = edge.get('id', 0)
            base_ev = edge.get('ev', 0.0)
            
            # Start with base confidence multiplier
            confidence_multiplier = self._calculate_confidence_multiplier(confidence_result)
            
            # Apply penalties
            exposure_penalty = 0.0
            correlation_penalty = 0.0
            volatility_penalty = 0.0
            
            if confidence_result and self.enable_confidence_weighting:
                confidence_score = confidence_result.composite_confidence
            else:
                confidence_score = 0.5
            
            if self.enable_exposure_penalty:
                exposure_penalty = self._calculate_exposure_penalty(edge, portfolio_metrics)
            
            if self.enable_correlation_penalty:
                correlation_penalty = self._calculate_correlation_penalty(edge, portfolio_metrics)
            
            if self.enable_volatility_penalty:
                volatility_penalty = self._calculate_volatility_penalty(edge)
            
            # Calculate final weight
            final_weight = max(0.0, base_ev * confidence_multiplier - exposure_penalty - correlation_penalty - volatility_penalty)
            
            return EdgeWeightingResult(
                edge_id=edge_id,
                base_ev=base_ev,
                confidence_score=confidence_score,
                confidence_tier=confidence_result.confidence_tier if confidence_result else "MEDIUM",
                confidence_multiplier=confidence_multiplier,
                exposure_penalty=exposure_penalty,
                correlation_penalty=correlation_penalty,
                volatility_penalty=volatility_penalty,
                final_weight=final_weight,
                risk_metrics={
                    'volatility_score': edge.get('volatility_score', 0.5),
                    'market_size': edge.get('market_size', 1000)
                },
                warnings=[]
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating individual weights for edge {edge.get('id')}: {e}")
            return EdgeWeightingResult(
                edge_id=edge.get('id', 0), 
                base_ev=0.0, 
                confidence_score=0.0, 
                confidence_tier="UNKNOWN", 
                confidence_multiplier=1.0, 
                exposure_penalty=0.0,
                correlation_penalty=0.0, 
                volatility_penalty=0.0, 
                final_weight=0.0, 
                risk_metrics={}, 
                warnings=[f"Calculation failed: {e}"]
            )
    
    def _calculate_confidence_multiplier(self, confidence_result: Optional[EdgeConfidenceResult]) -> float:
        """Calculate confidence multiplier for weighting"""
        try:
            if not confidence_result:
                return 1.0
                
            base_confidence = confidence_result.composite_confidence
            
            if confidence_result.confidence_tier == "HIGH":
                return base_confidence * self.confidence_amplification
            elif confidence_result.confidence_tier == "MEDIUM":
                return base_confidence * (self.confidence_amplification * 0.7)
            else:  # LOW confidence
                return base_confidence * 0.5
                
        except Exception as e:
            self.logger.warning(f"Error calculating confidence multiplier: {e}")
            return 1.0
    
    def _calculate_exposure_penalty(self, edge: Dict, portfolio_metrics: Dict) -> float:
        """Calculate penalty for excessive position exposure"""
        try:
            bet_size = edge.get('bet_size', 0)
            total_exposure = portfolio_metrics.get('total_exposure', 1)
            
            if total_exposure == 0:
                return 0.0
            
            position_percentage = bet_size / total_exposure
            if position_percentage > self.max_single_position_exposure:
                excess_exposure = position_percentage - self.max_single_position_exposure
                penalty = min(self.max_exposure_penalty, excess_exposure * 5.0)
                return penalty
            
            return 0.0
            
        except Exception as e:
            self.logger.warning(f"Error calculating exposure penalty: {e}")
            return 0.0
    
    def _calculate_correlation_penalty(self, edge: Dict, portfolio_metrics: Dict) -> float:
        """Calculate penalty for high correlation with existing positions"""
        try:
            prop_type = edge.get('prop_type', 'unknown')
            prop_concentration = portfolio_metrics.get('prop_type_concentration', {}).get(prop_type, 0)
            
            if prop_concentration > 0.5:  # More than 50% of portfolio in same prop type
                penalty = min(self.max_correlation_penalty, (prop_concentration - 0.5) * 2.0)
                return penalty
            
            return 0.0
            
        except Exception as e:
            self.logger.warning(f"Error calculating correlation penalty: {e}")
            return 0.0
    
    def _calculate_volatility_penalty(self, edge: Dict) -> float:
        """Calculate penalty for high volatility edges"""
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
            confidence_weight = _calculate_confidence_weight(confidence_components)
            effective_value *= confidence_weight
        
        # Apply confidence amplification from optimizer
        amplification = 1.5 if optimizer_instance is None else optimizer_instance.confidence_amplification
        if confidence_components and confidence_components.get('composite_confidence', 0) > 0.7:
            effective_value *= amplification
        
        # Apply penalties
        effective_value -= exposure_penalty
        effective_value -= correlation_penalty
        effective_value -= volatility_penalty
        
        # Ensure non-negative result
        return max(0.0, effective_value)
        
    except Exception as e:
        logger.warning(f"Error computing effective edge value: {e}")
        base_ev = edge.get('ev', 0.0)  # Get base_ev for fallback
        return max(0.0, base_ev * 0.5)  # Conservative fallback


def _calculate_confidence_weight(confidence_components: Dict[str, float]) -> float:
    """Calculate weighting multiplier based on confidence components"""
    try:
        composite_confidence = confidence_components.get('composite_confidence', 0.5)
        model_confidence = confidence_components.get('model_confidence', 0.5)
        market_confidence = confidence_components.get('market_confidence', 0.5)
        
        # Weighted combination of confidence factors
        weight = (
            composite_confidence * 0.4 +
            model_confidence * 0.3 +
            market_confidence * 0.3
        )
        
        # Apply confidence tier boost
        confidence_tier = confidence_components.get('confidence_tier', 'MEDIUM')
        if confidence_tier == 'HIGH':
            weight *= 1.2
        elif confidence_tier == 'LOW':
            weight *= 0.8
        
        return max(0.1, min(2.0, weight))  # Clamp between 0.1 and 2.0
        
    except Exception as e:
        logger.warning(f"Error calculating confidence weight: {e}")
        return 1.0  # Neutral weight on error


# Global optimizer instance
edge_weighting_optimizer = EdgeWeightingOptimizer()