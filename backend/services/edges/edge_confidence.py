"""
Edge Confidence Module

Provides composite confidence scoring for betting edges with persistence integration.
Implements sophisticated confidence modeling with multiple evaluation components.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Union
import math
import time

from ..unified_config import unified_config
from ..unified_logging import get_logger
from ..unified_cache_service import unified_cache_service

logger = get_logger("edge_confidence")


@dataclass
class ConfidenceComponents:
    """Individual components that make up edge confidence"""
    
    # Model-based confidence metrics
    model_confidence: float = 0.0          # 0.0 - 1.0, model's internal confidence
    prediction_stability: float = 0.0      # Stability across recent predictions
    cross_validation_score: float = 0.0    # K-fold cross-validation performance
    
    # Data quality metrics
    sample_size_adequacy: float = 0.0      # Adequacy of training sample size
    feature_completeness: float = 0.0      # Completeness of input features
    data_freshness: float = 0.0            # Recency of underlying data
    
    # Market consistency metrics
    line_movement_alignment: float = 0.0   # Alignment with market line movements
    volume_weighted_confidence: float = 0.0 # Market volume consideration
    consensus_divergence: float = 0.0      # Divergence from market consensus
    
    # Historical performance metrics
    similar_edge_success_rate: float = 0.0  # Success rate of similar past edges
    model_version_track_record: float = 0.0 # Performance of current model version
    prop_type_accuracy: float = 0.0         # Historical accuracy for this prop type
    
    # Risk assessment metrics
    volatility_adjusted_confidence: float = 0.0 # Confidence adjusted for volatility
    correlation_risk_factor: float = 0.0    # Risk from correlated positions
    exposure_concentration_risk: float = 0.0 # Risk from position concentration


@dataclass
class EdgeConfidenceResult:
    """Complete edge confidence evaluation result"""
    
    edge_id: int
    composite_confidence: float  # Final composite confidence score (0.0 - 1.0)
    confidence_components: ConfidenceComponents
    confidence_tier: str  # HIGH, MEDIUM, LOW
    risk_adjusted_confidence: float  # Confidence adjusted for all risk factors
    
    # Metadata
    evaluation_timestamp: datetime
    evaluation_duration_ms: int
    model_version: str
    feature_flags_active: List[str] = field(default_factory=list)
    
    # Persistence tracking
    persistence_score: float = 0.0  # How well this edge persists over time
    degradation_rate: float = 0.0   # Rate at which confidence degrades
    
    # Debugging info
    confidence_breakdown: Dict[str, float] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)


class EdgeConfidenceEvaluator:
    """Evaluates composite confidence for betting edges"""
    
    def __init__(self):
        self.config = unified_config
        self.cache = unified_cache_service
        self.logger = logger
        
        # Feature flags
        self.enable_model_confidence = self.config.get_config_value("edge_confidence.enable_model_confidence", True)
        self.enable_market_consistency = self.config.get_config_value("edge_confidence.enable_market_consistency", True)
        self.enable_historical_performance = self.config.get_config_value("edge_confidence.enable_historical_performance", True)
        self.enable_risk_assessment = self.config.get_config_value("edge_confidence.enable_risk_assessment", True)
        
        # Confidence component weights
        self.weights = {
            'model_confidence': self.config.get_config_value("edge_confidence.weights.model_confidence", 0.25),
            'data_quality': self.config.get_config_value("edge_confidence.weights.data_quality", 0.20),
            'market_consistency': self.config.get_config_value("edge_confidence.weights.market_consistency", 0.20),
            'historical_performance': self.config.get_config_value("edge_confidence.weights.historical_performance", 0.20),
            'risk_assessment': self.config.get_config_value("edge_confidence.weights.risk_assessment", 0.15)
        }
        
        # Confidence tier thresholds
        self.tier_thresholds = {
            'high': self.config.get_config_value("edge_confidence.thresholds.high", 0.75),
            'medium': self.config.get_config_value("edge_confidence.thresholds.medium", 0.55),
            'low': 0.0  # Everything else is low
        }
        
        # Cache TTL for confidence evaluations
        self.cache_ttl = self.config.get_config_value("edge_confidence.cache_ttl_minutes", 15) * 60
    
    async def evaluate_edge_confidence(
        self, 
        edge_id: int, 
        edge_data: Dict, 
        market_data: Optional[Dict] = None,
        force_refresh: bool = False
    ) -> EdgeConfidenceResult:
        """
        Evaluate comprehensive confidence for a betting edge.
        
        Args:
            edge_id: Unique edge identifier
            edge_data: Edge information (EV, prob_over, etc.)
            market_data: Optional market context data
            force_refresh: Skip cache and force fresh evaluation
            
        Returns:
            EdgeConfidenceResult: Complete confidence evaluation
        """
        start_time = time.time()
        cache_key = f"edge_confidence:{edge_id}:{hash(str(edge_data))}"
        
        # Check cache first (unless forcing refresh)
        if not force_refresh:
            cached_result = await self.cache.get(cache_key)
            if cached_result and isinstance(cached_result, dict):
                self.logger.debug(f"Using cached confidence for edge {edge_id}")
                return EdgeConfidenceResult(**cached_result)
        
        try:
            # Initialize components
            components = ConfidenceComponents()
            active_flags = []
            warnings = []
            
            # Evaluate each confidence component
            if self.enable_model_confidence:
                await self._evaluate_model_confidence(components, edge_data)
                active_flags.append("model_confidence")
            
            await self._evaluate_data_quality(components, edge_data)
            
            if self.enable_market_consistency and market_data:
                await self._evaluate_market_consistency(components, edge_data, market_data)
                active_flags.append("market_consistency")
            elif self.enable_market_consistency:
                warnings.append("Market consistency evaluation skipped: no market data")
            
            if self.enable_historical_performance:
                await self._evaluate_historical_performance(components, edge_data)
                active_flags.append("historical_performance")
            
            if self.enable_risk_assessment:
                await self._evaluate_risk_assessment(components, edge_data)
                active_flags.append("risk_assessment")
            
            # Calculate composite confidence
            composite_confidence = self._calculate_composite_confidence(components)
            
            # Determine confidence tier
            confidence_tier = self._determine_confidence_tier(composite_confidence)
            
            # Calculate risk-adjusted confidence
            risk_adjusted_confidence = self._calculate_risk_adjusted_confidence(
                composite_confidence, components
            )
            
            # Calculate persistence metrics
            persistence_score = await self._calculate_persistence_score(edge_id, edge_data)
            degradation_rate = await self._calculate_degradation_rate(edge_id, components)
            
            # Create result
            result = EdgeConfidenceResult(
                edge_id=edge_id,
                composite_confidence=composite_confidence,
                confidence_components=components,
                confidence_tier=confidence_tier,
                risk_adjusted_confidence=risk_adjusted_confidence,
                evaluation_timestamp=datetime.now(timezone.utc),
                evaluation_duration_ms=int((time.time() - start_time) * 1000),
                model_version=self.config.get_config_value("model.version", "unknown"),
                feature_flags_active=active_flags,
                persistence_score=persistence_score,
                degradation_rate=degradation_rate,
                confidence_breakdown=self._create_confidence_breakdown(components),
                warnings=warnings
            )
            
            # Cache the result
            await self.cache.set(cache_key, result.__dict__, ttl=self.cache_ttl)
            
            self.logger.info(
                f"Edge confidence evaluated for {edge_id}: "
                f"composite={composite_confidence:.3f}, "
                f"tier={confidence_tier}, "
                f"duration={result.evaluation_duration_ms}ms"
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error evaluating edge confidence for {edge_id}: {e}")
            # Return minimal confidence result
            return EdgeConfidenceResult(
                edge_id=edge_id,
                composite_confidence=0.0,
                confidence_components=ConfidenceComponents(),
                confidence_tier="LOW",
                risk_adjusted_confidence=0.0,
                evaluation_timestamp=datetime.now(timezone.utc),
                evaluation_duration_ms=int((time.time() - start_time) * 1000),
                model_version="error",
                warnings=[f"Evaluation failed: {str(e)}"]
            )
    
    async def _evaluate_model_confidence(self, components: ConfidenceComponents, edge_data: Dict):
        """Evaluate model-based confidence metrics"""
        try:
            # Model's internal confidence (from prediction uncertainty)
            prediction_uncertainty = edge_data.get('prediction_uncertainty', 0.5)
            components.model_confidence = 1.0 - prediction_uncertainty
            
            # Prediction stability (variance across recent predictions)
            recent_predictions = edge_data.get('recent_predictions', [])
            if len(recent_predictions) > 1:
                variance = self._calculate_variance(recent_predictions)
                components.prediction_stability = max(0.0, 1.0 - variance)
            else:
                components.prediction_stability = 0.5  # Neutral for single prediction
            
            # Cross-validation score (from model training)
            cv_score = edge_data.get('cross_validation_score', 0.7)
            components.cross_validation_score = cv_score
            
        except Exception as e:
            self.logger.warning(f"Error evaluating model confidence: {e}")
    
    async def _evaluate_data_quality(self, components: ConfidenceComponents, edge_data: Dict):
        """Evaluate data quality metrics"""
        try:
            # Sample size adequacy
            sample_size = edge_data.get('training_sample_size', 1000)
            adequate_sample_size = self.config.get_config_value("edge_confidence.min_sample_size", 500)
            components.sample_size_adequacy = min(1.0, sample_size / adequate_sample_size)
            
            # Feature completeness
            available_features = edge_data.get('available_features', 10)
            total_features = edge_data.get('total_features', 15)
            components.feature_completeness = available_features / max(1, total_features)
            
            # Data freshness (hours since last update)
            data_age_hours = edge_data.get('data_age_hours', 24)
            max_age_hours = self.config.get_config_value("edge_confidence.max_data_age_hours", 48)
            components.data_freshness = max(0.0, 1.0 - (data_age_hours / max_age_hours))
            
        except Exception as e:
            self.logger.warning(f"Error evaluating data quality: {e}")
    
    async def _evaluate_market_consistency(
        self, 
        components: ConfidenceComponents, 
        edge_data: Dict, 
        market_data: Dict
    ):
        """Evaluate market consistency metrics"""
        try:
            # Line movement alignment
            our_prediction = edge_data.get('fair_line', 0)
            market_movement = market_data.get('line_movement_direction', 0)
            our_movement = 1 if our_prediction > edge_data.get('offered_line', 0) else -1
            alignment = 1.0 if our_movement == market_movement else 0.0
            components.line_movement_alignment = alignment
            
            # Volume-weighted confidence
            betting_volume = market_data.get('betting_volume', 1000)
            high_volume_threshold = self.config.get_config_value("edge_confidence.high_volume_threshold", 10000)
            volume_factor = min(1.0, betting_volume / high_volume_threshold)
            components.volume_weighted_confidence = volume_factor
            
            # Consensus divergence (higher divergence = lower confidence)
            market_consensus = market_data.get('consensus_prob', 0.5)
            our_prob = edge_data.get('prob_over', 0.5)
            divergence = abs(market_consensus - our_prob)
            max_divergence = self.config.get_config_value("edge_confidence.max_consensus_divergence", 0.3)
            components.consensus_divergence = max(0.0, 1.0 - (divergence / max_divergence))
            
        except Exception as e:
            self.logger.warning(f"Error evaluating market consistency: {e}")
    
    async def _evaluate_historical_performance(self, components: ConfidenceComponents, edge_data: Dict):
        """Evaluate historical performance metrics"""
        try:
            # Similar edge success rate
            prop_type = edge_data.get('prop_type', 'unknown')
            similar_edges_cache_key = f"similar_edges_success:{prop_type}"
            similar_success_rate = await self.cache.get(similar_edges_cache_key, 0.6)
            components.similar_edge_success_rate = similar_success_rate
            
            # Model version track record
            model_version = self.config.get_config_value("model.version", "v1.0")
            version_cache_key = f"model_version_success:{model_version}"
            version_success_rate = await self.cache.get(version_cache_key, 0.65)
            components.model_version_track_record = version_success_rate
            
            # Prop type accuracy
            prop_accuracy_cache_key = f"prop_type_accuracy:{prop_type}"
            prop_accuracy = await self.cache.get(prop_accuracy_cache_key, 0.62)
            components.prop_type_accuracy = prop_accuracy
            
        except Exception as e:
            self.logger.warning(f"Error evaluating historical performance: {e}")
    
    async def _evaluate_risk_assessment(self, components: ConfidenceComponents, edge_data: Dict):
        """Evaluate risk assessment metrics"""
        try:
            # Volatility-adjusted confidence
            volatility = edge_data.get('volatility_score', 0.5)
            max_volatility = self.config.get_config_value("edge_confidence.max_volatility", 2.0)
            volatility_factor = max(0.0, 1.0 - (volatility / max_volatility))
            components.volatility_adjusted_confidence = volatility_factor
            
            # Correlation risk factor (placeholder - would need correlation analysis)
            correlation_risk = edge_data.get('correlation_risk', 0.1)
            components.correlation_risk_factor = max(0.0, 1.0 - correlation_risk)
            
            # Exposure concentration risk
            exposure_concentration = edge_data.get('exposure_concentration', 0.05)
            max_concentration = self.config.get_config_value("edge_confidence.max_exposure_concentration", 0.2)
            concentration_factor = max(0.0, 1.0 - (exposure_concentration / max_concentration))
            components.exposure_concentration_risk = concentration_factor
            
        except Exception as e:
            self.logger.warning(f"Error evaluating risk assessment: {e}")
    
    def _calculate_composite_confidence(self, components: ConfidenceComponents) -> float:
        """Calculate weighted composite confidence score"""
        try:
            # Model confidence component
            model_score = (
                components.model_confidence * 0.4 +
                components.prediction_stability * 0.3 +
                components.cross_validation_score * 0.3
            )
            
            # Data quality component
            data_score = (
                components.sample_size_adequacy * 0.4 +
                components.feature_completeness * 0.3 +
                components.data_freshness * 0.3
            )
            
            # Market consistency component
            market_score = (
                components.line_movement_alignment * 0.4 +
                components.volume_weighted_confidence * 0.3 +
                components.consensus_divergence * 0.3
            )
            
            # Historical performance component
            historical_score = (
                components.similar_edge_success_rate * 0.4 +
                components.model_version_track_record * 0.3 +
                components.prop_type_accuracy * 0.3
            )
            
            # Risk assessment component
            risk_score = (
                components.volatility_adjusted_confidence * 0.4 +
                components.correlation_risk_factor * 0.3 +
                components.exposure_concentration_risk * 0.3
            )
            
            # Weighted composite
            composite = (
                model_score * self.weights['model_confidence'] +
                data_score * self.weights['data_quality'] +
                market_score * self.weights['market_consistency'] +
                historical_score * self.weights['historical_performance'] +
                risk_score * self.weights['risk_assessment']
            )
            
            return max(0.0, min(1.0, composite))
            
        except Exception as e:
            self.logger.error(f"Error calculating composite confidence: {e}")
            return 0.0
    
    def _determine_confidence_tier(self, composite_confidence: float) -> str:
        """Determine confidence tier based on composite score"""
        if composite_confidence >= self.tier_thresholds['high']:
            return "HIGH"
        elif composite_confidence >= self.tier_thresholds['medium']:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _calculate_risk_adjusted_confidence(
        self, 
        composite_confidence: float, 
        components: ConfidenceComponents
    ) -> float:
        """Calculate risk-adjusted confidence score"""
        try:
            # Risk adjustment factors
            volatility_adjustment = components.volatility_adjusted_confidence
            correlation_adjustment = components.correlation_risk_factor
            concentration_adjustment = components.exposure_concentration_risk
            
            # Combined risk factor (geometric mean for conservative adjustment)
            risk_factor = (
                volatility_adjustment * 
                correlation_adjustment * 
                concentration_adjustment
            ) ** (1/3)
            
            return composite_confidence * risk_factor
            
        except Exception as e:
            self.logger.error(f"Error calculating risk-adjusted confidence: {e}")
            return composite_confidence * 0.5  # Conservative fallback
    
    async def _calculate_persistence_score(self, edge_id: int, edge_data: Dict) -> float:
        """Calculate how well this edge persists over time"""
        try:
            # Check historical persistence for similar edges
            cache_key = f"edge_persistence:{edge_id}"
            cached_persistence = await self.cache.get(cache_key)
            
            if cached_persistence is not None:
                return cached_persistence
            
            # Placeholder calculation - would analyze historical edge duration
            base_persistence = 0.6
            ev_factor = min(1.0, edge_data.get('ev', 0.05) / 0.1)  # Higher EV = better persistence
            volatility_penalty = max(0.0, 1.0 - edge_data.get('volatility_score', 0.5))
            
            persistence = base_persistence * ev_factor * volatility_penalty
            
            # Cache for future use
            await self.cache.set(cache_key, persistence, ttl=3600)  # 1 hour cache
            
            return persistence
            
        except Exception as e:
            self.logger.warning(f"Error calculating persistence score: {e}")
            return 0.5  # Neutral fallback
    
    async def _calculate_degradation_rate(self, edge_id: int, components: ConfidenceComponents) -> float:
        """Calculate the rate at which confidence degrades over time"""
        try:
            # Base degradation rate
            base_rate = 0.05  # 5% per hour
            
            # Adjust based on data freshness
            freshness_factor = 1.0 - components.data_freshness
            degradation_rate = base_rate * (1.0 + freshness_factor)
            
            return min(0.2, degradation_rate)  # Cap at 20% per hour
            
        except Exception as e:
            self.logger.warning(f"Error calculating degradation rate: {e}")
            return 0.05  # Default 5% per hour
    
    def _create_confidence_breakdown(self, components: ConfidenceComponents) -> Dict[str, float]:
        """Create detailed confidence breakdown for debugging"""
        return {
            "model_confidence": components.model_confidence,
            "prediction_stability": components.prediction_stability,
            "cross_validation_score": components.cross_validation_score,
            "sample_size_adequacy": components.sample_size_adequacy,
            "feature_completeness": components.feature_completeness,
            "data_freshness": components.data_freshness,
            "line_movement_alignment": components.line_movement_alignment,
            "volume_weighted_confidence": components.volume_weighted_confidence,
            "consensus_divergence": components.consensus_divergence,
            "similar_edge_success_rate": components.similar_edge_success_rate,
            "model_version_track_record": components.model_version_track_record,
            "prop_type_accuracy": components.prop_type_accuracy,
            "volatility_adjusted_confidence": components.volatility_adjusted_confidence,
            "correlation_risk_factor": components.correlation_risk_factor,
            "exposure_concentration_risk": components.exposure_concentration_risk
        }
    
    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance of a list of values"""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        squared_diffs = [(x - mean) ** 2 for x in values]
        return sum(squared_diffs) / len(values)


# Global edge confidence evaluator instance
edge_confidence_evaluator = EdgeConfidenceEvaluator()