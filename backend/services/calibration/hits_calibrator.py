"""
Hits Calibrator

Provides calibration services specifically for batter hits props.
Implements reliability assessment and historical performance analysis.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
import math
import time
import statistics

from .prop_type_registry import CalibratedPropType, prop_type_registry
from ..unified_config import unified_config
from ..unified_logging import get_logger
from ..unified_cache_service import unified_cache_service

logger = get_logger("hits_calibrator")


@dataclass
class HitsCalibrationData:
    """Historical data for hits calibration"""
    
    player_id: str
    game_date: datetime
    actual_hits: int
    predicted_hits: float
    prediction_confidence: float
    
    # Game context
    opposing_pitcher: Optional[str] = None
    home_away: Optional[str] = None
    ballpark: Optional[str] = None
    weather_conditions: Optional[str] = None
    
    # Player context at time of game
    recent_form: Optional[float] = None
    season_avg: Optional[float] = None
    career_avg_vs_pitcher: Optional[float] = None


@dataclass
class HitsCalibrationResult:
    """Result of hits calibration analysis"""
    
    player_id: str
    prop_type: CalibratedPropType
    calibrated_confidence: float
    reliability_bin: str
    
    # Calibration metrics
    historical_accuracy: float
    sample_size: int
    recent_form_factor: float
    
    # Reliability assessment
    consistency_score: float
    variance_penalty: float
    recency_boost: float
    
    # Metadata
    calibration_timestamp: datetime
    lookback_days: int
    data_quality_score: float
    
    # Warnings and notes
    warnings: List[str]
    notes: List[str]


class HitsCalibratorEngine:
    """Engine for calibrating hits predictions with reliability assessment"""
    
    def __init__(self):
        self.config = unified_config
        self.cache = unified_cache_service
        self.logger = logger
        
        # Get prop type configuration
        self.prop_config = prop_type_registry.get_config(CalibratedPropType.HITS_BATTER)
        
        # Calibration parameters
        self.min_sample_size = self.prop_config.min_sample_size if self.prop_config else 60
        self.confidence_threshold = self.prop_config.confidence_threshold if self.prop_config else 0.72
        self.max_lookback_days = self.prop_config.max_historical_days if self.prop_config else 365
        
        # Feature flags
        self.enable_recency_weighting = self.config.get_config_value(
            "calibration.hits.enable_recency_weighting", True
        )
        self.enable_contextual_adjustment = self.config.get_config_value(
            "calibration.hits.enable_contextual_adjustment", True
        )
        self.enable_variance_penalty = self.config.get_config_value(
            "calibration.hits.enable_variance_penalty", True
        )
        
        # Weighting factors
        self.recency_decay_factor = self.config.get_config_value(
            "calibration.hits.recency_decay_factor", 0.95
        )
        self.min_confidence_boost = self.config.get_config_value(
            "calibration.hits.min_confidence_boost", 0.05
        )
        self.max_confidence_penalty = self.config.get_config_value(
            "calibration.hits.max_confidence_penalty", 0.20
        )
        
        # Cache TTL
        self.cache_ttl = self.config.get_config_value(
            "calibration.cache_ttl_hours", 6
        ) * 3600
    
    async def calibrate_hits_prediction(
        self,
        player_id: str,
        base_prediction: float,
        base_confidence: float,
        game_context: Optional[Dict] = None
    ) -> HitsCalibrationResult:
        """
        Calibrate a hits prediction using historical performance data.
        
        Args:
            player_id: Player identifier
            base_prediction: Base model prediction for hits
            base_confidence: Base model confidence (0.0-1.0)
            game_context: Optional game context (opponent, ballpark, etc.)
            
        Returns:
            HitsCalibrationResult: Calibrated prediction with reliability assessment
        """
        start_time = time.time()
        cache_key = f"hits_calibration:{player_id}:{hash(str(game_context))}"
        
        # Check cache first
        cached_result = await self.cache.get(cache_key)
        cached_result_data = await cached_result if cached_result else None
        if cached_result_data and not self._is_cache_stale(cached_result_data):
            self.logger.debug(f"Using cached calibration for player {player_id}")
            return HitsCalibrationResult(**cached_result_data)
        
        try:
            warnings = []
            notes = []
            
            # Get historical calibration data
            historical_data = await self._get_historical_data(player_id)
            
            if len(historical_data) < self.min_sample_size:
                warnings.append(f"Insufficient sample size: {len(historical_data)} < {self.min_sample_size}")
                return self._create_fallback_result(
                    player_id, base_confidence, warnings, 
                    sample_size=len(historical_data)
                )
            
            # Calculate historical accuracy
            accuracy_metrics = self._calculate_accuracy_metrics(historical_data)
            
            # Calculate consistency score
            consistency_score = self._calculate_consistency_score(historical_data)
            
            # Apply recency weighting
            recent_form_factor = 1.0
            if self.enable_recency_weighting:
                recent_form_factor = self._calculate_recency_factor(historical_data)
            
            # Apply contextual adjustments
            contextual_adjustment = 1.0
            if self.enable_contextual_adjustment and game_context:
                contextual_adjustment = await self._calculate_contextual_adjustment(
                    player_id, game_context, historical_data
                )
            
            # Calculate variance penalty
            variance_penalty = 0.0
            if self.enable_variance_penalty:
                variance_penalty = self._calculate_variance_penalty(historical_data)
            
            # Combine all factors into calibrated confidence
            calibrated_confidence = self._combine_calibration_factors(
                base_confidence=base_confidence,
                historical_accuracy=accuracy_metrics['overall_accuracy'],
                consistency_score=consistency_score,
                recent_form_factor=recent_form_factor,
                contextual_adjustment=contextual_adjustment,
                variance_penalty=variance_penalty
            )
            
            # Determine reliability bin
            reliability_bin = prop_type_registry.get_reliability_bin(
                CalibratedPropType.HITS_BATTER, calibrated_confidence
            ) or "MEDIUM"
            
            # Calculate data quality score
            data_quality_score = self._calculate_data_quality_score(historical_data)
            
            # Add context-specific notes
            if game_context:
                notes.extend(self._generate_contextual_notes(game_context, historical_data))
            
            # Create result
            result = HitsCalibrationResult(
                player_id=player_id,
                prop_type=CalibratedPropType.HITS_BATTER,
                calibrated_confidence=calibrated_confidence,
                reliability_bin=reliability_bin,
                historical_accuracy=accuracy_metrics['overall_accuracy'],
                sample_size=len(historical_data),
                recent_form_factor=recent_form_factor,
                consistency_score=consistency_score,
                variance_penalty=variance_penalty,
                recency_boost=recent_form_factor - 1.0,
                calibration_timestamp=datetime.now(timezone.utc),
                lookback_days=self._calculate_actual_lookback_days(historical_data),
                data_quality_score=data_quality_score,
                warnings=warnings,
                notes=notes
            )
            
            # Cache the result
            await self.cache.set(cache_key, result.__dict__, ttl=self.cache_ttl)
            
            duration_ms = int((time.time() - start_time) * 1000)
            self.logger.info(
                f"Calibrated hits prediction for {player_id}: "
                f"confidence {base_confidence:.3f} -> {calibrated_confidence:.3f} "
                f"({reliability_bin}), duration={duration_ms}ms"
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error calibrating hits prediction for {player_id}: {e}")
            return self._create_fallback_result(
                player_id, base_confidence, 
                [f"Calibration failed: {str(e)}"]
            )
    
    async def _get_historical_data(self, player_id: str) -> List[HitsCalibrationData]:
        """Get historical hits data for calibration"""
        # This would connect to actual database/data source
        # For now, return mock data structure
        
        cache_key = f"historical_hits:{player_id}"
        cached_data = await self.cache.get(cache_key)
        
        if cached_data:
            return [HitsCalibrationData(**item) for item in cached_data]
        
        # Placeholder: In real implementation, would query database
        # for historical games, predictions, and outcomes
        mock_data = []
        base_date = datetime.now(timezone.utc) - timedelta(days=self.max_lookback_days)
        
        for i in range(self.min_sample_size + 20):  # Generate sufficient mock data
            game_date = base_date + timedelta(days=i * 4)  # Games every 4 days
            
            # Simulate realistic hits data
            predicted_hits = 1.2 + (i % 3) * 0.3  # Vary between 1.2-2.1
            actual_hits = max(0, min(5, int(predicted_hits + (hash(f"{player_id}_{i}") % 3) - 1)))
            confidence = 0.6 + (i % 5) * 0.08  # Vary confidence
            
            mock_data.append(HitsCalibrationData(
                player_id=player_id,
                game_date=game_date,
                actual_hits=actual_hits,
                predicted_hits=predicted_hits,
                prediction_confidence=confidence,
                home_away="HOME" if i % 2 == 0 else "AWAY",
                recent_form=0.8 + (i % 4) * 0.05
            ))
        
        # Cache mock data
        await self.cache.set(cache_key, [item.__dict__ for item in mock_data], ttl=3600)
        
        return mock_data
    
    def _calculate_accuracy_metrics(self, historical_data: List[HitsCalibrationData]) -> Dict[str, float]:
        """Calculate various accuracy metrics from historical data"""
        if not historical_data:
            return {'overall_accuracy': 0.5}
        
        # Calculate binary accuracy (predicted vs actual hits)
        correct_predictions = 0
        total_predictions = len(historical_data)
        
        # Calculate MAE and RMSE
        absolute_errors = []
        squared_errors = []
        
        for data in historical_data:
            predicted = round(data.predicted_hits)
            actual = data.actual_hits
            
            if predicted == actual:
                correct_predictions += 1
            
            abs_error = abs(predicted - actual)
            absolute_errors.append(abs_error)
            squared_errors.append(abs_error ** 2)
        
        binary_accuracy = correct_predictions / total_predictions
        mae = statistics.mean(absolute_errors)
        rmse = math.sqrt(statistics.mean(squared_errors))
        
        # Weighted accuracy considering confidence
        confidence_weighted_accuracy = self._calculate_confidence_weighted_accuracy(historical_data)
        
        return {
            'overall_accuracy': binary_accuracy,
            'binary_accuracy': binary_accuracy,
            'mae': mae,
            'rmse': rmse,
            'confidence_weighted': confidence_weighted_accuracy
        }
    
    def _calculate_confidence_weighted_accuracy(self, historical_data: List[HitsCalibrationData]) -> float:
        """Calculate accuracy weighted by prediction confidence"""
        if not historical_data:
            return 0.5
        
        weighted_correct = 0.0
        total_weight = 0.0
        
        for data in historical_data:
            weight = data.prediction_confidence
            predicted = round(data.predicted_hits)
            actual = data.actual_hits
            
            if predicted == actual:
                weighted_correct += weight
            total_weight += weight
        
        return weighted_correct / max(0.001, total_weight)
    
    def _calculate_consistency_score(self, historical_data: List[HitsCalibrationData]) -> float:
        """Calculate consistency score based on prediction variance"""
        if len(historical_data) < 3:
            return 0.5
        
        # Calculate variance in prediction errors
        errors = [abs(round(d.predicted_hits) - d.actual_hits) for d in historical_data]
        error_variance = statistics.variance(errors) if len(errors) > 1 else 0.0
        
        # Convert variance to consistency score (lower variance = higher consistency)
        max_variance = 2.0  # Maximum expected variance for hits
        consistency = max(0.0, 1.0 - (error_variance / max_variance))
        
        return consistency
    
    def _calculate_recency_factor(self, historical_data: List[HitsCalibrationData]) -> float:
        """Calculate factor based on recent performance"""
        if not historical_data:
            return 1.0
        
        # Sort by date (most recent first)
        sorted_data = sorted(historical_data, key=lambda x: x.game_date, reverse=True)
        
        # Take most recent games (up to 10)
        recent_games = sorted_data[:10]
        
        if not recent_games:
            return 1.0
        
        # Calculate accuracy in recent games with decay weighting
        weighted_accuracy = 0.0
        total_weight = 0.0
        
        for i, data in enumerate(recent_games):
            weight = self.recency_decay_factor ** i
            predicted = round(data.predicted_hits)
            actual = data.actual_hits
            
            if predicted == actual:
                weighted_accuracy += weight
            total_weight += weight
        
        recent_accuracy = weighted_accuracy / max(0.001, total_weight)
        
        # Convert to factor (boost good recent performance, penalize poor performance)
        if recent_accuracy > 0.65:
            return 1.0 + (recent_accuracy - 0.65) * 0.5  # Boost up to 1.175
        elif recent_accuracy < 0.45:
            return 0.9 + (recent_accuracy - 0.45) * 0.5  # Penalty down to 0.8
        else:
            return 1.0  # Neutral
    
    async def _calculate_contextual_adjustment(
        self,
        player_id: str,
        game_context: Dict,
        historical_data: List[HitsCalibrationData]
    ) -> float:
        """Calculate adjustment based on game context"""
        adjustment = 1.0
        
        # Home/Away adjustment
        home_away = game_context.get('home_away')
        if home_away and len(historical_data) > 10:
            home_games = [d for d in historical_data if d.home_away == 'HOME']
            away_games = [d for d in historical_data if d.home_away == 'AWAY']
            
            if home_games and away_games:
                home_accuracy = self._calculate_subset_accuracy(home_games)
                away_accuracy = self._calculate_subset_accuracy(away_games)
                
                if home_away == 'HOME':
                    adjustment *= (home_accuracy / max(0.5, away_accuracy))
                else:
                    adjustment *= (away_accuracy / max(0.5, home_accuracy))
        
        # Opposing pitcher adjustment (placeholder)
        opposing_pitcher = game_context.get('opposing_pitcher')
        if opposing_pitcher:
            # Would look up historical performance vs this pitcher
            # For now, apply small random adjustment
            pitcher_factor = 0.95 + (hash(opposing_pitcher) % 10) * 0.01
            adjustment *= pitcher_factor
        
        # Clamp adjustment to reasonable range
        return max(0.8, min(1.2, adjustment))
    
    def _calculate_subset_accuracy(self, data_subset: List[HitsCalibrationData]) -> float:
        """Calculate accuracy for a subset of data"""
        if not data_subset:
            return 0.5
        
        correct = sum(1 for d in data_subset if round(d.predicted_hits) == d.actual_hits)
        return correct / len(data_subset)
    
    def _calculate_variance_penalty(self, historical_data: List[HitsCalibrationData]) -> float:
        """Calculate penalty for high variance in predictions"""
        if len(historical_data) < 3:
            return 0.0
        
        # Calculate variance in prediction confidence
        confidences = [d.prediction_confidence for d in historical_data]
        confidence_variance = statistics.variance(confidences)
        
        # High variance in confidence suggests instability
        max_variance = 0.1  # Max expected variance in confidence
        penalty = min(self.max_confidence_penalty, confidence_variance / max_variance)
        
        return penalty
    
    def _combine_calibration_factors(
        self,
        base_confidence: float,
        historical_accuracy: float,
        consistency_score: float,
        recent_form_factor: float,
        contextual_adjustment: float,
        variance_penalty: float
    ) -> float:
        """Combine all calibration factors into final confidence"""
        
        # Start with weighted average of base confidence and historical accuracy
        calibrated = (base_confidence * 0.4) + (historical_accuracy * 0.6)
        
        # Apply consistency boost/penalty
        consistency_adjustment = (consistency_score - 0.5) * 0.1
        calibrated += consistency_adjustment
        
        # Apply recent form factor
        calibrated *= recent_form_factor
        
        # Apply contextual adjustment
        calibrated *= contextual_adjustment
        
        # Apply variance penalty
        calibrated -= variance_penalty
        
        # Clamp to valid range
        return max(0.1, min(0.95, calibrated))
    
    def _calculate_data_quality_score(self, historical_data: List[HitsCalibrationData]) -> float:
        """Calculate overall data quality score"""
        if not historical_data:
            return 0.0
        
        # Sample size score
        sample_score = min(1.0, len(historical_data) / (self.min_sample_size * 2))
        
        # Recency score (how recent is the data)
        most_recent = max(d.game_date for d in historical_data)
        days_old = (datetime.now(timezone.utc) - most_recent).days
        recency_score = max(0.0, 1.0 - (days_old / 30))  # Decay over 30 days
        
        # Completeness score (how much context data is available)
        complete_records = sum(1 for d in historical_data if d.opposing_pitcher and d.home_away)
        completeness_score = complete_records / len(historical_data)
        
        # Combined score
        return (sample_score * 0.4 + recency_score * 0.3 + completeness_score * 0.3)
    
    def _calculate_actual_lookback_days(self, historical_data: List[HitsCalibrationData]) -> int:
        """Calculate actual lookback days from data"""
        if not historical_data:
            return 0
        
        oldest_date = min(d.game_date for d in historical_data)
        return (datetime.now(timezone.utc) - oldest_date).days
    
    def _generate_contextual_notes(
        self, 
        game_context: Dict, 
        historical_data: List[HitsCalibrationData]
    ) -> List[str]:
        """Generate contextual notes for the calibration"""
        notes = []
        
        # Home/Away note
        home_away = game_context.get('home_away')
        if home_away:
            home_games = [d for d in historical_data if d.home_away == 'HOME']
            away_games = [d for d in historical_data if d.home_away == 'AWAY']
            
            if home_games and away_games:
                home_acc = self._calculate_subset_accuracy(home_games)
                away_acc = self._calculate_subset_accuracy(away_games)
                
                if home_away == 'HOME':
                    notes.append(f"Home accuracy: {home_acc:.1%} (vs {away_acc:.1%} away)")
                else:
                    notes.append(f"Away accuracy: {away_acc:.1%} (vs {home_acc:.1%} home)")
        
        # Sample size note
        sample_size = len(historical_data)
        if sample_size < self.min_sample_size * 1.5:
            notes.append(f"Limited sample size: {sample_size} games")
        
        return notes
    
    def _create_fallback_result(
        self, 
        player_id: str, 
        base_confidence: float, 
        warnings: List[str],
        sample_size: int = 0
    ) -> HitsCalibrationResult:
        """Create fallback result when calibration fails"""
        
        # Use conservative confidence for fallback
        fallback_confidence = min(0.6, base_confidence * 0.8)
        
        return HitsCalibrationResult(
            player_id=player_id,
            prop_type=CalibratedPropType.HITS_BATTER,
            calibrated_confidence=fallback_confidence,
            reliability_bin="LOW",
            historical_accuracy=0.5,
            sample_size=sample_size,
            recent_form_factor=1.0,
            consistency_score=0.5,
            variance_penalty=0.0,
            recency_boost=0.0,
            calibration_timestamp=datetime.now(timezone.utc),
            lookback_days=0,
            data_quality_score=0.0,
            warnings=warnings,
            notes=["Using fallback calibration due to insufficient data"]
        )
    
    def _is_cache_stale(self, cached_data: Dict) -> bool:
        """Check if cached calibration data is stale"""
        if 'calibration_timestamp' not in cached_data:
            return True
        
        cache_time = datetime.fromisoformat(cached_data['calibration_timestamp'].replace('Z', '+00:00'))
        age_hours = (datetime.now(timezone.utc) - cache_time).total_seconds() / 3600
        
        return age_hours > (self.cache_ttl / 3600)


# Global hits calibrator instance
hits_calibrator = HitsCalibratorEngine()