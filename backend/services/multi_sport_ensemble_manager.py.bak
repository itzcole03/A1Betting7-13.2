"""Multi-Sport Ensemble Model Manager
Advanced ensemble voting system for cross-sport analytics.
Part of Phase 3 Week 3: Advanced Analytics implementation.
"""

import asyncio
import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from backend.services.enhanced_ml_ensemble_service import (
    EnhancedMLEnsembleService,
    EnhancedPrediction,
)

# Import existing services
from backend.services.model_performance_tracker import (
    ModelPerformanceSnapshot,
    performance_tracker,
)

# Note: Enhanced model service imports commented out due to missing dependencies
# from backend.enhanced_model_service import EnhancedMathematicalModelService, UnifiedPredictionRequest, UnifiedPredictionResult

logger = logging.getLogger("propollama.ensemble_manager")


class VotingStrategy(Enum):
    """Ensemble voting strategies"""

    SIMPLE_AVERAGE = "simple_average"
    WEIGHTED_AVERAGE = "weighted_average"
    PERFORMANCE_WEIGHTED = "performance_weighted"
    CONFIDENCE_WEIGHTED = "confidence_weighted"
    BAYESIAN_MODEL_AVERAGING = "bayesian_averaging"
    DYNAMIC_WEIGHTING = "dynamic_weighting"
    MAJORITY_VOTE = "majority_vote"
    RANKED_CHOICE = "ranked_choice"


class SportSpecialization(Enum):
    """Sport-specific model specializations"""

    MLB = "mlb"
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"
    CROSS_SPORT = "cross_sport"
    UNIVERSAL = "universal"


@dataclass
class ModelWeight:
    """Model weighting information"""

    model_name: str
    sport: str
    base_weight: float
    performance_multiplier: float
    confidence_multiplier: float
    recency_multiplier: float
    final_weight: float
    last_updated: datetime


@dataclass
class EnsemblePrediction:
    """Enhanced ensemble prediction result"""

    request_id: str
    sport: str
    event_id: str
    player_name: str
    prop_type: str

    # Ensemble results
    ensemble_prediction: float
    ensemble_confidence: float
    ensemble_probability: float
    voting_strategy: VotingStrategy

    # Individual model contributions
    model_predictions: Dict[str, float]
    model_confidences: Dict[str, float]
    model_weights: Dict[str, float]

    # Consensus analysis
    prediction_variance: float
    model_agreement: float
    outlier_models: List[str]
    consensus_strength: float

    # Performance insights
    expected_accuracy: float
    historical_performance: Dict[str, float]
    risk_assessment: Dict[str, float]

    # Betting recommendations
    recommended_action: str
    kelly_fraction: float
    expected_value: float
    confidence_interval: Tuple[float, float]

    # Metadata
    models_used: List[str]
    processing_time: float
    timestamp: datetime
    metadata: Dict[str, Any]


@dataclass
class CrossSportInsight:
    """Cross-sport analytics insight"""

    insight_type: str
    sports_involved: List[str]
    correlation: float
    significance: float
    description: str
    actionable_recommendation: str
    confidence: float


class MultiSportEnsembleManager:
    """Advanced ensemble manager for multi-sport analytics"""

    def __init__(self):
        self.performance_tracker = performance_tracker
        self.enhanced_ml_service = EnhancedMLEnsembleService()
        # Note: Mathematical service commented out due to missing dependencies
        # self.mathematical_service = EnhancedMathematicalModelService()

        # Sport-specific model registries
        self.sport_models = {
            SportSpecialization.MLB: [],
            SportSpecialization.NBA: [],
            SportSpecialization.NFL: [],
            SportSpecialization.NHL: [],
            SportSpecialization.CROSS_SPORT: [],
            SportSpecialization.UNIVERSAL: [],
        }

        # Dynamic weighting system
        self.model_weights = {}
        self.performance_window_days = 30
        self.weight_update_frequency = timedelta(hours=6)
        self.last_weight_update = {}

        # Voting strategy preferences by sport
        self.sport_voting_strategies = {
            "mlb": VotingStrategy.PERFORMANCE_WEIGHTED,
            "nba": VotingStrategy.CONFIDENCE_WEIGHTED,
            "nfl": VotingStrategy.BAYESIAN_MODEL_AVERAGING,
            "nhl": VotingStrategy.DYNAMIC_WEIGHTING,
        }

        # Cross-sport correlation tracking
        self.cross_sport_correlations = {}
        self.is_initialized = False

    async def initialize(self) -> bool:
        """Initialize the ensemble manager"""
        try:
            # Initialize performance tracker
            await self.performance_tracker.initialize()

            # Register available models for each sport
            await self._register_sport_models()

            # Update model weights
            await self._update_all_model_weights()

            self.is_initialized = True
            logger.info("MultiSportEnsembleManager initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize MultiSportEnsembleManager: {e}")
            return False

    async def predict_ensemble(
        self,
        sport: str,
        event_id: str,
        player_name: str,
        prop_type: str,
        features: Dict[str, Any],
        voting_strategy: Optional[VotingStrategy] = None,
        force_models: Optional[List[str]] = None,
    ) -> Optional[EnsemblePrediction]:
        """Generate ensemble prediction using multiple models"""
        try:
            if not self.is_initialized:
                await self.initialize()

            # Determine voting strategy
            if not voting_strategy:
                voting_strategy = self.sport_voting_strategies.get(
                    sport.lower(), VotingStrategy.PERFORMANCE_WEIGHTED
                )

            # Get available models for this sport
            available_models = await self._get_available_models(sport)
            if not available_models:
                logger.warning(f"No models available for sport: {sport}")
                return None

            # Use forced models if specified
            if force_models:
                available_models = [m for m in available_models if m in force_models]

            # Generate predictions from all models
            model_predictions = {}
            model_confidences = {}
            processing_start = datetime.utcnow()

            for model_name in available_models:
                try:
                    prediction_result = await self._get_model_prediction(
                        model_name, sport, event_id, player_name, prop_type, features
                    )

                    if prediction_result:
                        model_predictions[model_name] = prediction_result["prediction"]
                        model_confidences[model_name] = prediction_result["confidence"]

                except Exception as e:
                    logger.warning(f"Model {model_name} failed for {sport}: {e}")
                    continue

            if not model_predictions:
                logger.error(f"No successful predictions for {sport} {event_id}")
                return None

            # Calculate model weights
            model_weights = await self._calculate_model_weights(
                sport, list(model_predictions.keys()), voting_strategy
            )

            # Generate ensemble prediction
            ensemble_result = await self._generate_ensemble_prediction(
                model_predictions, model_confidences, model_weights, voting_strategy
            )

            # Calculate consensus metrics
            consensus_metrics = self._calculate_consensus_metrics(
                model_predictions, model_confidences, model_weights
            )

            # Get historical performance insights
            historical_performance = await self._get_historical_performance(
                sport, list(model_predictions.keys())
            )

            # Calculate betting recommendations
            betting_recommendations = self._calculate_betting_recommendations(
                ensemble_result, consensus_metrics, historical_performance
            )

            processing_time = (datetime.utcnow() - processing_start).total_seconds()

            # Create ensemble prediction object
            prediction = EnsemblePrediction(
                request_id=f"ensemble_{sport}_{event_id}_{datetime.utcnow().timestamp()}",
                sport=sport,
                event_id=event_id,
                player_name=player_name,
                prop_type=prop_type,
                ensemble_prediction=ensemble_result["prediction"],
                ensemble_confidence=ensemble_result["confidence"],
                ensemble_probability=ensemble_result["probability"],
                voting_strategy=voting_strategy,
                model_predictions=model_predictions,
                model_confidences=model_confidences,
                model_weights=model_weights,
                prediction_variance=consensus_metrics["variance"],
                model_agreement=consensus_metrics["agreement"],
                outlier_models=consensus_metrics["outliers"],
                consensus_strength=consensus_metrics["strength"],
                expected_accuracy=historical_performance.get("expected_accuracy", 0.0),
                historical_performance=historical_performance,
                risk_assessment=betting_recommendations["risk_assessment"],
                recommended_action=betting_recommendations["action"],
                kelly_fraction=betting_recommendations["kelly_fraction"],
                expected_value=betting_recommendations["expected_value"],
                confidence_interval=betting_recommendations["confidence_interval"],
                models_used=list(model_predictions.keys()),
                processing_time=processing_time,
                timestamp=datetime.utcnow(),
                metadata={
                    "voting_strategy": voting_strategy.value,
                    "total_models": len(model_predictions),
                    "sport": sport,
                },
            )

            # Record prediction for performance tracking
            await self.performance_tracker.record_prediction(
                f"ensemble_{sport}",
                sport,
                ensemble_result["prediction"],
                confidence=ensemble_result["confidence"],
                metadata=asdict(prediction),
            )

            return prediction

        except Exception as e:
            logger.error(f"Failed to generate ensemble prediction: {e}")
            return None

    async def analyze_cross_sport_patterns(
        self, days: int = 30
    ) -> List[CrossSportInsight]:
        """Analyze patterns and correlations across different sports"""
        try:
            insights = []
            sports = ["mlb", "nba", "nfl", "nhl"]

            # Get performance data for all sports
            sport_performance = {}
            for sport in sports:
                snapshots = await self.performance_tracker.get_all_models_performance(
                    sport
                )
                if snapshots:
                    sport_performance[sport] = snapshots

            # Analyze cross-sport correlations
            for i, sport1 in enumerate(sports):
                for sport2 in sports[i + 1 :]:
                    if sport1 in sport_performance and sport2 in sport_performance:
                        correlation = await self._calculate_cross_sport_correlation(
                            sport_performance[sport1], sport_performance[sport2]
                        )

                        if abs(correlation) > 0.3:  # Significant correlation threshold
                            insight = CrossSportInsight(
                                insight_type="cross_sport_correlation",
                                sports_involved=[sport1, sport2],
                                correlation=correlation,
                                significance=abs(correlation),
                                description=f"Strong correlation ({correlation:.3f}) detected between {sport1.upper()} and {sport2.upper()} model performance",
                                actionable_recommendation=f"Consider cross-sport model training for {sport1.upper()} and {sport2.upper()}",
                                confidence=min(abs(correlation) * 1.2, 1.0),
                            )
                            insights.append(insight)

            # Analyze seasonal patterns
            seasonal_insights = await self._analyze_seasonal_patterns(sport_performance)
            insights.extend(seasonal_insights)

            return insights

        except Exception as e:
            logger.error(f"Failed to analyze cross-sport patterns: {e}")
            return []

    async def get_ensemble_performance_report(
        self, sport: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive ensemble performance report"""
        try:
            report = {
                "timestamp": datetime.utcnow().isoformat(),
                "sports_analysis": {},
                "cross_sport_insights": [],
                "performance_alerts": [],
                "recommendations": [],
            }

            # Get sports to analyze
            sports_to_analyze = [sport] if sport else ["mlb", "nba", "nfl", "nhl"]

            for sport_name in sports_to_analyze:
                sport_analysis = {
                    "sport": sport_name,
                    "models_count": 0,
                    "avg_performance": {},
                    "best_models": [],
                    "performance_trends": {},
                    "ensemble_metrics": {},
                }

                # Get all model snapshots for this sport
                snapshots = await self.performance_tracker.get_all_models_performance(
                    sport_name
                )
                sport_analysis["models_count"] = len(snapshots)

                if snapshots:
                    # Calculate average performance metrics
                    metrics = ["accuracy", "roi", "win_rate", "confidence_score"]
                    for metric in metrics:
                        values = [
                            s.metrics.get(metric, 0)
                            for s in snapshots
                            if s.metrics.get(metric) is not None
                        ]
                        if values:
                            sport_analysis["avg_performance"][metric] = {
                                "mean": np.mean(values),
                                "std": np.std(values),
                                "min": np.min(values),
                                "max": np.max(values),
                            }

                    # Identify best performing models
                    best_models = sorted(
                        snapshots, key=lambda x: x.metrics.get("roi", 0), reverse=True
                    )[:3]
                    sport_analysis["best_models"] = [
                        {
                            "model_name": m.model_name,
                            "roi": m.metrics.get("roi", 0),
                            "win_rate": m.metrics.get("win_rate", 0),
                            "predictions_count": m.predictions_count,
                        }
                        for m in best_models
                    ]

                report["sports_analysis"][sport_name] = sport_analysis

            # Get cross-sport insights
            report["cross_sport_insights"] = await self.analyze_cross_sport_patterns()

            # Get performance alerts
            report["performance_alerts"] = (
                await self.performance_tracker.detect_performance_degradation()
            )

            # Generate recommendations
            report["recommendations"] = self._generate_performance_recommendations(
                report
            )

            return report

        except Exception as e:
            logger.error(f"Failed to generate ensemble performance report: {e}")
            return {}

    async def _register_sport_models(self) -> None:
        """Register available models for each sport"""
        try:
            # This would typically load from a configuration file or database
            # For now, we'll define some example models

            self.sport_models[SportSpecialization.MLB] = [
                "enhanced_mlb_model",
                "mathematical_mlb_model",
                "bayesian_mlb_model",
            ]
            self.sport_models[SportSpecialization.NBA] = [
                "enhanced_nba_model",
                "mathematical_nba_model",
                "bayesian_nba_model",
            ]
            self.sport_models[SportSpecialization.NFL] = [
                "enhanced_nfl_model",
                "mathematical_nfl_model",
                "bayesian_nfl_model",
            ]
            self.sport_models[SportSpecialization.NHL] = [
                "enhanced_nhl_model",
                "mathematical_nhl_model",
                "bayesian_nhl_model",
            ]
            self.sport_models[SportSpecialization.CROSS_SPORT] = [
                "cross_sport_ensemble",
                "universal_predictor",
            ]

        except Exception as e:
            logger.error(f"Failed to register sport models: {e}")

    async def _get_available_models(self, sport: str) -> List[str]:
        """Get available models for a specific sport"""
        sport_spec = SportSpecialization(sport.lower())
        models = self.sport_models.get(sport_spec, [])
        models.extend(self.sport_models.get(SportSpecialization.UNIVERSAL, []))
        return models

    async def _get_model_prediction(
        self,
        model_name: str,
        sport: str,
        event_id: str,
        player_name: str,
        prop_type: str,
        features: Dict[str, Any],
    ) -> Optional[Dict[str, float]]:
        """Get prediction from a specific model"""
        try:
            # This would integrate with actual model services
            # For demonstration, we'll simulate predictions

            # Simulate different model behaviors
            base_prediction = features.get("line_score", 0.0) * (
                0.9 + np.random.random() * 0.2
            )
            confidence = 0.6 + np.random.random() * 0.3

            return {"prediction": base_prediction, "confidence": confidence}

        except Exception as e:
            logger.error(f"Failed to get prediction from {model_name}: {e}")
            return None

    async def _calculate_model_weights(
        self, sport: str, model_names: List[str], voting_strategy: VotingStrategy
    ) -> Dict[str, float]:
        """Calculate model weights based on strategy and performance"""
        try:
            weights = {}

            if voting_strategy == VotingStrategy.SIMPLE_AVERAGE:
                # Equal weights for all models
                weight = 1.0 / len(model_names)
                weights = {name: weight for name in model_names}

            elif voting_strategy == VotingStrategy.PERFORMANCE_WEIGHTED:
                # Weight by historical performance
                total_performance = 0.0
                model_performances = {}

                for model_name in model_names:
                    snapshot = await self.performance_tracker.get_model_performance(
                        model_name, sport
                    )
                    if snapshot:
                        performance = snapshot.metrics.get(
                            "roi", 0.0
                        ) + snapshot.metrics.get("win_rate", 0.0)
                        model_performances[model_name] = max(
                            performance, 0.1
                        )  # Minimum weight
                        total_performance += model_performances[model_name]

                # Normalize weights
                if total_performance > 0:
                    weights = {
                        name: perf / total_performance
                        for name, perf in model_performances.items()
                    }
                else:
                    # Fallback to equal weights
                    weight = 1.0 / len(model_names)
                    weights = {name: weight for name in model_names}

            elif voting_strategy == VotingStrategy.CONFIDENCE_WEIGHTED:
                # This would be calculated based on prediction confidences
                # For now, use equal weights as placeholder
                weight = 1.0 / len(model_names)
                weights = {name: weight for name in model_names}

            else:
                # Default to equal weights
                weight = 1.0 / len(model_names)
                weights = {name: weight for name in model_names}

            return weights

        except Exception as e:
            logger.error(f"Failed to calculate model weights: {e}")
            return {name: 1.0 / len(model_names) for name in model_names}

    async def _generate_ensemble_prediction(
        self,
        model_predictions: Dict[str, float],
        model_confidences: Dict[str, float],
        model_weights: Dict[str, float],
        voting_strategy: VotingStrategy,
    ) -> Dict[str, float]:
        """Generate final ensemble prediction"""
        try:
            if voting_strategy == VotingStrategy.WEIGHTED_AVERAGE:
                # Weighted average of predictions
                weighted_sum = sum(
                    pred * model_weights.get(name, 0)
                    for name, pred in model_predictions.items()
                )
                ensemble_prediction = weighted_sum

                # Weighted average of confidences
                confidence_sum = sum(
                    conf * model_weights.get(name, 0)
                    for name, conf in model_confidences.items()
                )
                ensemble_confidence = confidence_sum

            else:
                # Simple average as fallback
                ensemble_prediction = np.mean(list(model_predictions.values()))
                ensemble_confidence = np.mean(list(model_confidences.values()))

            # Calculate probability (simplified)
            ensemble_probability = ensemble_confidence

            return {
                "prediction": ensemble_prediction,
                "confidence": ensemble_confidence,
                "probability": ensemble_probability,
            }

        except Exception as e:
            logger.error(f"Failed to generate ensemble prediction: {e}")
            return {"prediction": 0.0, "confidence": 0.0, "probability": 0.0}

    def _calculate_consensus_metrics(
        self,
        model_predictions: Dict[str, float],
        model_confidences: Dict[str, float],
        model_weights: Dict[str, float],
    ) -> Dict[str, Any]:
        """Calculate consensus metrics for the ensemble"""
        try:
            predictions = list(model_predictions.values())

            # Calculate variance
            variance = np.var(predictions)

            # Calculate agreement (inverse of coefficient of variation)
            mean_pred = np.mean(predictions)
            cv = np.std(predictions) / mean_pred if mean_pred != 0 else 1.0
            agreement = 1.0 / (1.0 + cv)

            # Identify outliers (predictions more than 2 std devs from mean)
            std_pred = np.std(predictions)
            outlier_threshold = 2 * std_pred
            outliers = [
                name
                for name, pred in model_predictions.items()
                if abs(pred - mean_pred) > outlier_threshold
            ]

            # Calculate consensus strength
            consensus_strength = agreement * (1.0 - len(outliers) / len(predictions))

            return {
                "variance": variance,
                "agreement": agreement,
                "outliers": outliers,
                "strength": consensus_strength,
            }

        except Exception as e:
            logger.error(f"Failed to calculate consensus metrics: {e}")
            return {"variance": 1.0, "agreement": 0.0, "outliers": [], "strength": 0.0}

    async def _get_historical_performance(
        self, sport: str, model_names: List[str]
    ) -> Dict[str, float]:
        """Get historical performance metrics for models"""
        try:
            total_accuracy = 0.0
            total_roi = 0.0
            total_win_rate = 0.0
            model_count = 0

            for model_name in model_names:
                snapshot = await self.performance_tracker.get_model_performance(
                    model_name, sport
                )
                if snapshot:
                    total_accuracy += snapshot.metrics.get("accuracy", 0.0)
                    total_roi += snapshot.metrics.get("roi", 0.0)
                    total_win_rate += snapshot.metrics.get("win_rate", 0.0)
                    model_count += 1

            if model_count > 0:
                return {
                    "expected_accuracy": total_accuracy / model_count,
                    "expected_roi": total_roi / model_count,
                    "expected_win_rate": total_win_rate / model_count,
                }

            return {
                "expected_accuracy": 0.0,
                "expected_roi": 0.0,
                "expected_win_rate": 0.0,
            }

        except Exception as e:
            logger.error(f"Failed to get historical performance: {e}")
            return {}

    def _calculate_betting_recommendations(
        self,
        ensemble_result: Dict[str, float],
        consensus_metrics: Dict[str, Any],
        historical_performance: Dict[str, float],
    ) -> Dict[str, Any]:
        """Calculate betting recommendations based on ensemble results"""
        try:
            confidence = ensemble_result["confidence"]
            prediction = ensemble_result["prediction"]
            consensus_strength = consensus_metrics["strength"]

            # Simple Kelly Criterion calculation
            win_prob = confidence
            odds_decimal = 2.0  # Placeholder - would come from actual odds
            kelly_fraction = (win_prob * odds_decimal - 1) / (odds_decimal - 1)
            kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Cap at 25%

            # Expected value calculation
            expected_value = win_prob * (odds_decimal - 1) - (1 - win_prob)

            # Risk assessment
            risk_score = 1.0 - (confidence * consensus_strength)
            risk_level = (
                "low" if risk_score < 0.3 else "medium" if risk_score < 0.7 else "high"
            )

            # Action recommendation
            if confidence > 0.75 and consensus_strength > 0.7:
                action = "strong_bet"
            elif confidence > 0.6 and consensus_strength > 0.5:
                action = "moderate_bet"
            elif confidence > 0.5:
                action = "small_bet"
            else:
                action = "avoid"

            # Confidence interval (simplified)
            ci_width = (1.0 - confidence) * 0.2
            confidence_interval = (prediction - ci_width, prediction + ci_width)

            return {
                "action": action,
                "kelly_fraction": kelly_fraction,
                "expected_value": expected_value,
                "confidence_interval": confidence_interval,
                "risk_assessment": {
                    "score": risk_score,
                    "level": risk_level,
                    "factors": ["confidence", "consensus", "historical_performance"],
                },
            }

        except Exception as e:
            logger.error(f"Failed to calculate betting recommendations: {e}")
            return {
                "action": "avoid",
                "kelly_fraction": 0.0,
                "expected_value": 0.0,
                "confidence_interval": (0.0, 0.0),
                "risk_assessment": {"score": 1.0, "level": "high", "factors": []},
            }

    async def _update_all_model_weights(self) -> None:
        """Update weights for all registered models"""
        try:
            for sport_spec, models in self.sport_models.items():
                for model_name in models:
                    # This would update dynamic weights based on recent performance
                    # For now, we'll just log the intent
                    logger.debug(
                        f"Would update weights for {model_name} in {sport_spec.value}"
                    )

        except Exception as e:
            logger.error(f"Failed to update model weights: {e}")

    async def _calculate_cross_sport_correlation(
        self,
        sport1_snapshots: List[ModelPerformanceSnapshot],
        sport2_snapshots: List[ModelPerformanceSnapshot],
    ) -> float:
        """Calculate correlation between two sports' model performance"""
        try:
            # Extract ROI values for correlation analysis
            sport1_rois = [
                s.total_roi for s in sport1_snapshots if s.total_roi is not None
            ]
            sport2_rois = [
                s.total_roi for s in sport2_snapshots if s.total_roi is not None
            ]

            if len(sport1_rois) > 1 and len(sport2_rois) > 1:
                # Truncate to same length
                min_length = min(len(sport1_rois), len(sport2_rois))
                sport1_rois = sport1_rois[:min_length]
                sport2_rois = sport2_rois[:min_length]

                # Calculate Pearson correlation
                correlation = np.corrcoef(sport1_rois, sport2_rois)[0, 1]
                return float(correlation) if not np.isnan(correlation) else 0.0

            return 0.0

        except Exception as e:
            logger.error(f"Failed to calculate cross-sport correlation: {e}")
            return 0.0

    async def _analyze_seasonal_patterns(
        self, sport_performance: Dict[str, List[ModelPerformanceSnapshot]]
    ) -> List[CrossSportInsight]:
        """Analyze seasonal patterns across sports"""
        try:
            insights = []

            # This would analyze seasonal trends
            # For now, return a placeholder insight
            if len(sport_performance) > 1:
                insight = CrossSportInsight(
                    insight_type="seasonal_pattern",
                    sports_involved=list(sport_performance.keys()),
                    correlation=0.0,
                    significance=0.5,
                    description="Seasonal analysis across multiple sports indicates varying performance patterns",
                    actionable_recommendation="Consider seasonal model adjustments for optimal performance",
                    confidence=0.6,
                )
                insights.append(insight)

            return insights

        except Exception as e:
            logger.error(f"Failed to analyze seasonal patterns: {e}")
            return []

    def _generate_performance_recommendations(
        self, report: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable recommendations based on performance report"""
        try:
            recommendations = []

            # Analyze performance alerts
            alerts = report.get("performance_alerts", [])
            if alerts:
                high_severity_alerts = [
                    a for a in alerts if a.get("severity") == "high"
                ]
                if high_severity_alerts:
                    recommendations.append(
                        f"URGENT: {len(high_severity_alerts)} models require immediate attention due to performance degradation"
                    )

            # Analyze cross-sport insights
            insights = report.get("cross_sport_insights", [])
            strong_correlations = [i for i in insights if abs(i.correlation) > 0.5]
            if strong_correlations:
                recommendations.append(
                    f"Consider implementing cross-sport model training based on {len(strong_correlations)} strong correlations detected"
                )

            # Analyze sports performance
            sports_analysis = report.get("sports_analysis", {})
            for sport, analysis in sports_analysis.items():
                avg_roi = (
                    analysis.get("avg_performance", {}).get("roi", {}).get("mean", 0)
                )
                if avg_roi < 0.05:
                    recommendations.append(
                        f"Review {sport.upper()} models - ROI below threshold ({avg_roi:.3f})"
                    )

            if not recommendations:
                recommendations.append(
                    "All systems performing within expected parameters"
                )

            return recommendations

        except Exception as e:
            logger.error(f"Failed to generate recommendations: {e}")
            return ["Error generating recommendations"]


# Global ensemble manager instance
ensemble_manager = MultiSportEnsembleManager()
