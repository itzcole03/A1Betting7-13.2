"""
Intelligent Ensemble Prediction System for A1Betting

This module combines all available prediction engines and analysis methods
to produce the most accurate betting lineups with the highest predicted
chance of winning, using real data and intelligent ensemble techniques.
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np
from cachetools import TTLCache

logger = logging.getLogger(__name__)

# Import all available prediction engines
try:
    from prediction_engine import UltraAdvancedPredictionEngine

    PREDICTION_ENGINE_AVAILABLE = True
except ImportError:
    PREDICTION_ENGINE_AVAILABLE = False
    logger.warning("Main prediction engine not available")

try:
    from enhanced_prediction_engine import EnhancedMathematicalPredictionEngine

    ENHANCED_ENGINE_AVAILABLE = True
except ImportError:
    ENHANCED_ENGINE_AVAILABLE = False
    logger.warning("Enhanced prediction engine not available")

try:
    from ensemble_engine import AdvancedEnsembleEngine

    ENSEMBLE_ENGINE_AVAILABLE = True
except ImportError:
    ENSEMBLE_ENGINE_AVAILABLE = False
    logger.warning("Ensemble engine not available")

try:
    from ultra_accuracy_engine import UltraAccuracyEngine

    ULTRA_ENGINE_AVAILABLE = True
except ImportError:
    ULTRA_ENGINE_AVAILABLE = False
    logger.warning("Ultra accuracy engine not available")

try:
    from services.real_ml_service import RealMLModels

    REAL_ML_AVAILABLE = True
except ImportError:
    REAL_ML_AVAILABLE = False
    logger.warning("Real ML service not available")

try:
    from recursive_intelligence_coordinator import RecursiveIntelligenceFunction

    RECURSIVE_AI_AVAILABLE = True
except ImportError:
    RECURSIVE_AI_AVAILABLE = False
    logger.warning("Recursive AI not available")


@dataclass
class EnsemblePrediction:
    """Result from the intelligent ensemble system"""

    prediction: float
    confidence: float
    win_probability: float
    expected_value: float
    source_engines: List[str]
    engine_weights: Dict[str, float]
    individual_predictions: Dict[str, float]
    risk_score: float
    recommendation: str
    metadata: Dict[str, Any]


@dataclass
class PredictionCacheEntry:
    """Cache entry for API results and predictions"""

    data: Any
    timestamp: datetime
    ttl_seconds: int
    cache_key: str


class IntelligentEnsembleSystem:
    """
    Intelligent ensemble system that combines all available prediction methods
    for maximum accuracy and highest predicted chance of winning.
    """

    def __init__(self):
        self.engines = {}
        self.engine_weights = {}
        self.engine_performance_history = defaultdict(list)
        self.prediction_cache = TTLCache(maxsize=1000, ttl=300)  # 5-minute cache
        self.api_cache = TTLCache(
            maxsize=500, ttl=1800
        )  # 30-minute cache for API calls

        # In-season sports (current active seasons)
        self.in_season_sports = self._get_in_season_sports()

        # Initialize all available engines
        self._initialize_engines()

        # Initialize engine weights based on historical performance
        self._initialize_engine_weights()

        logger.info(
            f"✅ Intelligent Ensemble System initialized with {len(self.engines)} engines"
        )

    def _get_in_season_sports(self) -> List[str]:
        """Get list of currently in-season sports based on current date"""
        current_date = datetime.now()
        month = current_date.month

        in_season = []

        # MLB: April - October
        if 4 <= month <= 10:
            in_season.append("MLB")

        # NFL: September - February
        if month >= 9 or month <= 2:
            in_season.append("NFL")

        # NBA: October - June
        if month >= 10 or month <= 6:
            in_season.append("NBA")

        # NHL: October - June
        if month >= 10 or month <= 6:
            in_season.append("NHL")

        # College Football: August - January
        if month >= 8 or month == 1:
            in_season.append("College Football")

        # College Basketball: November - April
        if month >= 11 or month <= 4:
            in_season.append("College Basketball")

        # MLS: February - November
        if 2 <= month <= 11:
            in_season.append("MLS")

        # Tennis, Golf: Year-round
        in_season.extend(["Tennis", "Golf"])

        logger.info(f"🏆 In-season sports: {in_season}")
        return in_season

    def _initialize_engines(self):
        """Initialize all available prediction engines"""
        engine_count = 0

        # Initialize main prediction engine
        if PREDICTION_ENGINE_AVAILABLE:
            try:
                self.engines["prediction_engine"] = UltraAdvancedPredictionEngine()
                engine_count += 1
                logger.info("✅ Main prediction engine initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize main prediction engine: {e}")

        # Initialize enhanced mathematical engine
        if ENHANCED_ENGINE_AVAILABLE:
            try:
                self.engines["enhanced_engine"] = EnhancedMathematicalPredictionEngine()
                engine_count += 1
                logger.info("✅ Enhanced mathematical engine initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize enhanced engine: {e}")

        # Initialize ensemble engine
        if ENSEMBLE_ENGINE_AVAILABLE:
            try:
                self.engines["ensemble_engine"] = AdvancedEnsembleEngine()
                engine_count += 1
                logger.info("✅ Advanced ensemble engine initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize ensemble engine: {e}")

        # Initialize ultra accuracy engine
        if ULTRA_ENGINE_AVAILABLE:
            try:
                self.engines["ultra_engine"] = UltraAccuracyEngine()
                engine_count += 1
                logger.info("✅ Ultra accuracy engine initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize ultra accuracy engine: {e}")

        # Initialize real ML service
        if REAL_ML_AVAILABLE:
            try:
                self.engines["real_ml"] = RealMLModels()
                engine_count += 1
                logger.info("✅ Real ML service initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize real ML service: {e}")

        # Initialize recursive AI
        if RECURSIVE_AI_AVAILABLE:
            try:
                self.engines["recursive_ai"] = RecursiveIntelligenceFunction()
                engine_count += 1
                logger.info("✅ Recursive AI initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize recursive AI: {e}")

        logger.info(f"🚀 Total engines initialized: {engine_count}")

    def _initialize_engine_weights(self):
        """Initialize engine weights based on historical performance"""
        # Default weights based on engine sophistication and expected performance
        default_weights = {
            "ultra_engine": 0.25,  # Highest weight for ultra accuracy engine
            "enhanced_engine": 0.20,  # Mathematical sophistication
            "ensemble_engine": 0.20,  # Advanced ensemble methods
            "recursive_ai": 0.15,  # Self-evolving AI
            "prediction_engine": 0.12,  # Main prediction engine
            "real_ml": 0.08,  # Production ML models
        }

        # Only assign weights to available engines
        total_weight = 0
        for engine_name in self.engines.keys():
            if engine_name in default_weights:
                self.engine_weights[engine_name] = default_weights[engine_name]
                total_weight += default_weights[engine_name]

        # Normalize weights to sum to 1.0
        if total_weight > 0:
            for engine_name in self.engine_weights:
                self.engine_weights[engine_name] /= total_weight

        logger.info(f"🎯 Engine weights: {self.engine_weights}")

    def _get_cache_key(self, data: Any) -> str:
        """Generate cache key for data"""
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()

    async def _cached_api_call(
        self, url: str, client: httpx.AsyncClient, ttl: int = 1800
    ) -> Optional[Dict]:
        """Make cached API call to avoid redundant requests"""
        cache_key = self._get_cache_key(url)

        # Check cache first
        if cache_key in self.api_cache:
            cached_entry = self.api_cache[cache_key]
            if (
                datetime.now() - cached_entry.timestamp
            ).seconds < cached_entry.ttl_seconds:
                logger.info(f"📋 Using cached API result for {url[:50]}...")
                return cached_entry.data

        # Make fresh API call
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()

                # Cache the result
                cache_entry = PredictionCacheEntry(
                    data=data,
                    timestamp=datetime.now(),
                    ttl_seconds=ttl,
                    cache_key=cache_key,
                )
                self.api_cache[cache_key] = cache_entry

                logger.info(f"✅ Cached fresh API result for {url[:50]}...")
                return data
            else:
                logger.warning(f"API call failed with status {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"API call error: {e}")
            return None

    async def predict_prop_outcome(self, prop: Dict[str, Any]) -> EnsemblePrediction:
        """
        Generate ensemble prediction for a single prop using all available engines
        """
        # Check cache first
        cache_key = self._get_cache_key(prop)
        if cache_key in self.prediction_cache:
            cached_prediction = self.prediction_cache[cache_key]
            if (
                datetime.now() - cached_prediction.timestamp
            ).seconds < 300:  # 5-minute cache
                logger.info(
                    f"📋 Using cached prediction for {prop.get('player_name', 'unknown')}"
                )
                return cached_prediction.data

        individual_predictions = {}
        prediction_weights = {}
        source_engines = []

        # Prepare features for prediction
        features = self._extract_features_from_prop(prop)

        # Get predictions from all available engines
        for engine_name, engine in self.engines.items():
            try:
                prediction = await self._get_engine_prediction(
                    engine_name, engine, prop, features
                )
                if prediction is not None:
                    individual_predictions[engine_name] = prediction
                    prediction_weights[engine_name] = self.engine_weights.get(
                        engine_name, 0.1
                    )
                    source_engines.append(engine_name)
                    logger.info(f"✅ {engine_name}: {prediction:.2f}")
            except Exception as e:
                logger.warning(f"Engine {engine_name} prediction failed: {e}")

        if not individual_predictions:
            logger.warning("No engines produced predictions, using fallback")
            return self._fallback_prediction(prop)

        # Calculate weighted ensemble prediction
        ensemble_prediction = self._calculate_weighted_prediction(
            individual_predictions, prediction_weights
        )

        # Calculate confidence and other metrics
        confidence = self._calculate_ensemble_confidence(
            individual_predictions, prediction_weights
        )
        win_probability = self._calculate_win_probability(ensemble_prediction, prop)
        expected_value = self._calculate_expected_value(
            ensemble_prediction, prop, win_probability
        )
        risk_score = self._calculate_risk_score(individual_predictions, confidence)
        recommendation = self._generate_recommendation(
            win_probability, expected_value, risk_score
        )

        # Create ensemble prediction result
        result = EnsemblePrediction(
            prediction=ensemble_prediction,
            confidence=confidence,
            win_probability=win_probability,
            expected_value=expected_value,
            source_engines=source_engines,
            engine_weights=prediction_weights,
            individual_predictions=individual_predictions,
            risk_score=risk_score,
            recommendation=recommendation,
            metadata={
                "prop_id": prop.get("id"),
                "player_name": prop.get("player_name"),
                "stat_type": prop.get("stat_type"),
                "line_score": prop.get("line_score"),
                "sport": prop.get("sport"),
                "timestamp": datetime.now().isoformat(),
            },
        )

        # Cache the result
        cache_entry = PredictionCacheEntry(
            data=result, timestamp=datetime.now(), ttl_seconds=300, cache_key=cache_key
        )
        self.prediction_cache[cache_key] = cache_entry

        return result

    def _extract_features_from_prop(self, prop: Dict[str, Any]) -> Dict[str, float]:
        """Extract features from prop for prediction engines"""
        features = {
            "line_score": float(prop.get("line_score", 0)),
            "projected_value": float(prop.get("projected_value", 0)),
            "historical_average": float(prop.get("historical_average", 0)),
            "recent_form": float(prop.get("recent_form", 0)),
            "opponent_defense_rank": float(prop.get("opponent_defense_rank", 15)),
            "home_away_factor": 1.0 if prop.get("is_home_game", True) else 0.8,
            "weather_factor": float(prop.get("weather_factor", 1.0)),
            "injury_factor": float(prop.get("injury_factor", 1.0)),
            "rest_days": float(prop.get("rest_days", 2)),
            "season_performance": float(prop.get("season_performance", 0.75)),
        }

        # Sport-specific features
        sport = prop.get("sport", "")
        if sport == "MLB":
            features.update(
                {
                    "batting_average": float(prop.get("batting_average", 0.250)),
                    "slugging_percentage": float(
                        prop.get("slugging_percentage", 0.400)
                    ),
                    "era": float(prop.get("era", 4.00)),
                    "whip": float(prop.get("whip", 1.30)),
                }
            )
        elif sport == "NBA":
            features.update(
                {
                    "usage_rate": float(prop.get("usage_rate", 0.20)),
                    "true_shooting_pct": float(prop.get("true_shooting_pct", 0.55)),
                    "pace_factor": float(prop.get("pace_factor", 100.0)),
                }
            )
        elif sport == "NFL":
            features.update(
                {
                    "target_share": float(prop.get("target_share", 0.15)),
                    "red_zone_touches": float(prop.get("red_zone_touches", 2.0)),
                    "snap_count_pct": float(prop.get("snap_count_pct", 0.70)),
                }
            )

        return features

    async def _get_engine_prediction(
        self,
        engine_name: str,
        engine: Any,
        prop: Dict[str, Any],
        features: Dict[str, float],
    ) -> Optional[float]:
        """Get prediction from a specific engine"""
        try:
            if engine_name == "prediction_engine":
                if hasattr(engine, "predict"):
                    result = engine.predict(features)
                    return (
                        result.get("prediction", 0)
                        if isinstance(result, dict)
                        else float(result)
                    )

            elif engine_name == "enhanced_engine":
                if hasattr(engine, "predict_posterior"):
                    features_array = np.array(list(features.values())).reshape(1, -1)
                    result = engine.predict_posterior(features_array, n_samples=100)
                    return (
                        result.mean_prediction
                        if hasattr(result, "mean_prediction")
                        else float(result)
                    )

            elif engine_name == "ensemble_engine":
                if hasattr(engine, "predict"):
                    result = await engine.predict(features, f"prop_{prop.get('id')}")
                    return (
                        result.get("prediction", 0)
                        if isinstance(result, dict)
                        else float(result)
                    )

            elif engine_name == "ultra_engine":
                if hasattr(engine, "predict_with_maximum_accuracy"):
                    result = await engine.predict_with_maximum_accuracy(
                        features, prop.get("sport", "general")
                    )
                    return (
                        result.get("prediction", 0)
                        if isinstance(result, dict)
                        else float(result)
                    )

            elif engine_name == "real_ml":
                if hasattr(engine, "predict_prop_outcome"):
                    result = await engine.predict_prop_outcome(prop, features)
                    return (
                        result.get("prediction", 0)
                        if isinstance(result, dict)
                        else float(result)
                    )

            elif engine_name == "recursive_ai":
                if hasattr(engine, "enhanced_prediction"):
                    result = engine.enhanced_prediction(
                        features, prop.get("sport", "general")
                    )
                    return (
                        result.get("prediction", 0)
                        if isinstance(result, dict)
                        else float(result)
                    )

            return None

        except Exception as e:
            logger.warning(f"Engine {engine_name} prediction error: {e}")
            return None

    def _calculate_weighted_prediction(
        self, predictions: Dict[str, float], weights: Dict[str, float]
    ) -> float:
        """Calculate weighted ensemble prediction"""
        weighted_sum = 0
        total_weight = 0

        for engine_name, prediction in predictions.items():
            weight = weights.get(engine_name, 0.1)
            weighted_sum += prediction * weight
            total_weight += weight

        if total_weight > 0:
            return weighted_sum / total_weight
        return np.mean(list(predictions.values()))

    def _calculate_ensemble_confidence(
        self, predictions: Dict[str, float], weights: Dict[str, float]
    ) -> float:
        """Calculate confidence based on prediction agreement and engine weights"""
        if len(predictions) < 2:
            return 60.0  # Low confidence with single prediction

        values = list(predictions.values())
        weighted_std = np.std(values)

        # Lower standard deviation = higher confidence
        base_confidence = max(50, 100 - (weighted_std * 10))

        # Bonus for more engines agreeing
        engine_bonus = min(20, len(predictions) * 3)

        # Bonus for high-weight engines
        weight_bonus = sum(weights.values()) * 10

        total_confidence = min(98, base_confidence + engine_bonus + weight_bonus)
        return total_confidence

    def _calculate_win_probability(
        self, prediction: float, prop: Dict[str, Any]
    ) -> float:
        """Calculate probability of prop hitting based on prediction vs line"""
        line_score = prop.get("line_score", 0)
        if line_score == 0:
            return 0.5

        # Simple sigmoid transformation
        diff = (prediction - line_score) / line_score
        win_prob = 1 / (1 + np.exp(-diff * 5))  # Sigmoid with scaling factor

        return max(0.1, min(0.9, win_prob))  # Clamp between 10% and 90%

    def _calculate_expected_value(
        self, prediction: float, prop: Dict[str, Any], win_probability: float
    ) -> float:
        """Calculate expected value of the bet"""
        # Assume standard -110 odds for simplicity
        if win_probability > 0.524:  # Break-even point for -110 odds
            return (win_probability * 0.909) - (1 - win_probability)  # EV calculation
        else:
            return -((1 - win_probability) - (win_probability * 0.909))

    def _calculate_risk_score(
        self, predictions: Dict[str, float], confidence: float
    ) -> float:
        """Calculate risk score (0-100, lower is better)"""
        if len(predictions) < 2:
            return 80.0  # High risk with single prediction

        # Risk based on prediction variance
        variance_risk = np.var(list(predictions.values())) * 10

        # Risk based on confidence (inverse relationship)
        confidence_risk = (100 - confidence) * 0.5

        total_risk = min(100, variance_risk + confidence_risk)
        return total_risk

    def _generate_recommendation(
        self, win_probability: float, expected_value: float, risk_score: float
    ) -> str:
        """Generate betting recommendation"""
        if win_probability > 0.6 and expected_value > 0.05 and risk_score < 30:
            return "STRONG BET"
        elif win_probability > 0.55 and expected_value > 0.02 and risk_score < 50:
            return "BET"
        elif win_probability > 0.5 and expected_value > 0:
            return "LEAN"
        elif win_probability < 0.45 or expected_value < -0.05:
            return "AVOID"
        else:
            return "PASS"

    def _fallback_prediction(self, prop: Dict[str, Any]) -> EnsemblePrediction:
        """Fallback prediction when no engines are available"""
        line_score = prop.get("line_score", 0)
        fallback_prediction = line_score * 1.02  # Slight over the line

        return EnsemblePrediction(
            prediction=fallback_prediction,
            confidence=50.0,
            win_probability=0.52,
            expected_value=0.01,
            source_engines=["fallback"],
            engine_weights={"fallback": 1.0},
            individual_predictions={"fallback": fallback_prediction},
            risk_score=75.0,
            recommendation="PASS",
            metadata={
                "prop_id": prop.get("id"),
                "player_name": prop.get("player_name"),
                "stat_type": prop.get("stat_type"),
                "line_score": prop.get("line_score"),
                "sport": prop.get("sport"),
                "timestamp": datetime.now().isoformat(),
                "note": "Fallback prediction - no engines available",
            },
        )

    async def generate_optimal_lineup(
        self, props: List[Dict[str, Any]], lineup_size: int = 5
    ) -> Dict[str, Any]:
        """
        Generate optimal betting lineup with highest predicted chance of winning
        """
        logger.info(f"🎯 Generating optimal lineup from {len(props)} props")

        # Filter to only in-season sports
        in_season_props = [
            prop for prop in props if prop.get("sport") in self.in_season_sports
        ]
        logger.info(f"🏆 Filtered to {len(in_season_props)} in-season props")

        if not in_season_props:
            logger.warning("No in-season props available")
            return {
                "lineup": [],
                "total_win_probability": 0,
                "expected_value": 0,
                "confidence": 0,
                "risk_score": 100,
                "recommendation": "NO BETS AVAILABLE",
            }

        # Get ensemble predictions for all props
        predictions = []
        for prop in in_season_props:
            try:
                prediction = await self.predict_prop_outcome(prop)
                predictions.append((prop, prediction))
                logger.info(
                    f"✅ {prop.get('player_name', 'Unknown')} {prop.get('stat_type', '')}: {prediction.win_probability:.1%} win prob"
                )
            except Exception as e:
                logger.warning(f"Failed to predict prop {prop.get('id')}: {e}")

        if not predictions:
            logger.warning("No successful predictions generated")
            return self._empty_lineup_response()

        # Sort by combined score (win probability * confidence * (1 - risk_score))
        scored_predictions = []
        for prop, pred in predictions:
            combined_score = (
                pred.win_probability
                * (pred.confidence / 100)
                * (1 - pred.risk_score / 100)
                * (1 + pred.expected_value)  # EV boost
            )
            scored_predictions.append((prop, pred, combined_score))

        # Sort by combined score (highest first)
        scored_predictions.sort(key=lambda x: x[2], reverse=True)

        # Select top props for lineup
        lineup_props = scored_predictions[:lineup_size]

        # Calculate lineup metrics
        lineup_win_probs = [pred.win_probability for _, pred, _ in lineup_props]
        lineup_confidences = [pred.confidence for _, pred, _ in lineup_props]
        lineup_risk_scores = [pred.risk_score for _, pred, _ in lineup_props]
        lineup_expected_values = [pred.expected_value for _, pred, _ in lineup_props]

        # Combined lineup probability (assuming independence)
        total_win_probability = np.prod(lineup_win_probs)

        # Average metrics
        avg_confidence = np.mean(lineup_confidences)
        avg_risk_score = np.mean(lineup_risk_scores)
        total_expected_value = np.sum(lineup_expected_values)

        # Generate overall recommendation
        if total_win_probability > 0.15 and avg_confidence > 70 and avg_risk_score < 40:
            overall_recommendation = "STRONG LINEUP"
        elif total_win_probability > 0.10 and avg_confidence > 60:
            overall_recommendation = "GOOD LINEUP"
        elif total_win_probability > 0.05:
            overall_recommendation = "REASONABLE LINEUP"
        else:
            overall_recommendation = "HIGH RISK LINEUP"

        # Format lineup response
        lineup_details = []
        for prop, pred, score in lineup_props:
            lineup_details.append(
                {
                    "prop_id": prop.get("id"),
                    "player_name": prop.get("player_name"),
                    "team": prop.get("team"),
                    "sport": prop.get("sport"),
                    "stat_type": prop.get("stat_type"),
                    "line_score": prop.get("line_score"),
                    "prediction": pred.prediction,
                    "win_probability": pred.win_probability,
                    "confidence": pred.confidence,
                    "expected_value": pred.expected_value,
                    "risk_score": pred.risk_score,
                    "recommendation": pred.recommendation,
                    "combined_score": score,
                    "source_engines": pred.source_engines,
                }
            )

        logger.info(
            f"🏆 Generated lineup with {total_win_probability:.1%} combined win probability"
        )

        return {
            "lineup": lineup_details,
            "total_win_probability": total_win_probability,
            "expected_value": total_expected_value,
            "confidence": avg_confidence,
            "risk_score": avg_risk_score,
            "recommendation": overall_recommendation,
            "lineup_size": len(lineup_details),
            "analyzed_props": len(predictions),
            "in_season_sports": self.in_season_sports,
            "timestamp": datetime.now().isoformat(),
            "engine_summary": {
                "available_engines": list(self.engines.keys()),
                "engine_weights": self.engine_weights,
            },
        }

    def _empty_lineup_response(self) -> Dict[str, Any]:
        """Return empty lineup response when no props are available"""
        return {
            "lineup": [],
            "total_win_probability": 0,
            "expected_value": 0,
            "confidence": 0,
            "risk_score": 100,
            "recommendation": "NO BETS AVAILABLE",
            "lineup_size": 0,
            "analyzed_props": 0,
            "in_season_sports": self.in_season_sports,
            "timestamp": datetime.now().isoformat(),
            "engine_summary": {
                "available_engines": list(self.engines.keys()),
                "engine_weights": self.engine_weights,
            },
        }

    async def update_engine_performance(self, engine_name: str, accuracy: float):
        """Update engine performance history for dynamic weight adjustment"""
        self.engine_performance_history[engine_name].append(
            {"accuracy": accuracy, "timestamp": datetime.now()}
        )

        # Keep only recent performance data (last 100 predictions)
        if len(self.engine_performance_history[engine_name]) > 100:
            self.engine_performance_history[engine_name] = (
                self.engine_performance_history[engine_name][-100:]
            )

        # Recalculate weights based on recent performance
        await self._recalculate_weights()

    async def _recalculate_weights(self):
        """Recalculate engine weights based on recent performance"""
        engine_scores = {}

        for engine_name, history in self.engine_performance_history.items():
            if len(history) >= 10:  # Need at least 10 predictions to adjust weight
                recent_accuracy = np.mean(
                    [h["accuracy"] for h in history[-20:]]
                )  # Last 20 predictions
                engine_scores[engine_name] = recent_accuracy

        if engine_scores:
            # Normalize scores to weights
            total_score = sum(engine_scores.values())
            for engine_name, score in engine_scores.items():
                self.engine_weights[engine_name] = score / total_score

            logger.info(
                f"🔄 Updated engine weights based on performance: {self.engine_weights}"
            )


# Global ensemble system instance
intelligent_ensemble = IntelligentEnsembleSystem()
