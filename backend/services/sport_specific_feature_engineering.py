"""
Sport-Specific Feature Engineering Framework

This service provides sport-specific feature engineering using the enhanced
feature framework from Phase 2, optimized for each sport's unique characteristics
and prediction requirements.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Callable
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from enum import Enum
import json
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Sport(Enum):
    """Supported sports for feature engineering"""
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"
    SOCCER = "soccer"
    MLB = "mlb"

class FeatureCategory(Enum):
    """Categories of features for sports analytics"""
    BASIC_STATS = "basic_stats"
    ADVANCED_METRICS = "advanced_metrics"
    SITUATIONAL = "situational"
    MATCHUP_BASED = "matchup_based"
    TEMPORAL = "temporal"
    CONTEXTUAL = "contextual"
    MOMENTUM = "momentum"
    FATIGUE = "fatigue"
    ENVIRONMENTAL = "environmental"
    PSYCHOLOGICAL = "psychological"

@dataclass
class FeatureDefinition:
    """Definition of a specific feature"""
    name: str
    category: FeatureCategory
    description: str
    calculation_method: str
    dependencies: List[str]
    importance_weight: float
    sport_specific: bool
    temporal_window: Optional[int]  # Number of games/periods to look back
    normalization_method: str

@dataclass
class SportFeatureConfig:
    """Configuration for sport-specific feature engineering"""
    sport: Sport
    feature_definitions: List[FeatureDefinition]
    context_factors: List[str]
    temporal_windows: Dict[str, int]
    normalization_parameters: Dict[str, Any]
    feature_interactions: List[Tuple[str, str, str]]  # (feature1, feature2, interaction_type)
    model_specific_features: Dict[str, List[str]]

@dataclass
class ProcessedFeatureSet:
    """Processed feature set for a player/team"""
    entity_id: str
    entity_type: str  # "player" or "team"
    sport: Sport
    game_id: str
    features: Dict[str, float]
    feature_metadata: Dict[str, Any]
    processing_timestamp: datetime
    confidence_scores: Dict[str, float]

class BaseSportFeatureEngine(ABC):
    """Abstract base class for sport-specific feature engineering"""
    
    def __init__(self, sport: Sport):
        self.sport = sport
        self.feature_cache = {}
        self.cache_ttl = timedelta(minutes=10)
        
    @abstractmethod
    async def extract_basic_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract basic statistical features"""
        pass
        
    @abstractmethod
    async def extract_advanced_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract advanced analytical features"""
        pass
        
    @abstractmethod
    async def extract_situational_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract situational context features"""
        pass
        
    @abstractmethod
    def get_sport_specific_interactions(self) -> List[Tuple[str, str, str]]:
        """Get sport-specific feature interactions"""
        pass

class NBAFeatureEngine(BaseSportFeatureEngine):
    """NBA-specific feature engineering"""
    
    def __init__(self):
        super().__init__(Sport.NBA)
        
    async def extract_basic_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract NBA basic features"""
        
        features = {}
        
        # Traditional box score stats
        features.update({
            "points_per_game": data.get("points", 0) / max(data.get("games_played", 1), 1),
            "rebounds_per_game": data.get("rebounds", 0) / max(data.get("games_played", 1), 1),
            "assists_per_game": data.get("assists", 0) / max(data.get("games_played", 1), 1),
            "steals_per_game": data.get("steals", 0) / max(data.get("games_played", 1), 1),
            "blocks_per_game": data.get("blocks", 0) / max(data.get("games_played", 1), 1),
            "turnovers_per_game": data.get("turnovers", 0) / max(data.get("games_played", 1), 1),
            "field_goal_percentage": data.get("field_goals_made", 0) / max(data.get("field_goals_attempted", 1), 1),
            "three_point_percentage": data.get("three_pointers_made", 0) / max(data.get("three_pointers_attempted", 1), 1),
            "free_throw_percentage": data.get("free_throws_made", 0) / max(data.get("free_throws_attempted", 1), 1),
            "minutes_per_game": data.get("minutes_played", 0) / max(data.get("games_played", 1), 1)
        })
        
        return features
        
    async def extract_advanced_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract NBA advanced analytics features"""
        
        features = {}
        
        # Advanced efficiency metrics
        points = data.get("points", 0)
        fga = data.get("field_goals_attempted", 1)
        fta = data.get("free_throws_attempted", 0)
        
        # True Shooting Percentage
        true_shooting_attempts = fga + (0.44 * fta)
        features["true_shooting_percentage"] = points / (2 * max(true_shooting_attempts, 1))
        
        # Effective Field Goal Percentage
        fg_made = data.get("field_goals_made", 0)
        three_pm = data.get("three_pointers_made", 0)
        features["effective_fg_percentage"] = (fg_made + 0.5 * three_pm) / max(fga, 1)
        
        # Usage Rate (simplified)
        team_possessions = data.get("team_possessions", 100)
        player_possessions = fga + 0.44 * fta + data.get("turnovers", 0)
        minutes = data.get("minutes_played", 1)
        team_minutes = data.get("team_minutes", 240)
        
        features["usage_rate"] = (player_possessions * team_minutes) / (minutes * team_possessions)
        
        # Player Efficiency Rating (simplified)
        positive_stats = points + data.get("rebounds", 0) + data.get("assists", 0) + data.get("steals", 0) + data.get("blocks", 0)
        negative_stats = data.get("turnovers", 0) + (fga - fg_made) + (fta - data.get("free_throws_made", 0))
        features["player_efficiency_rating"] = positive_stats - negative_stats
        
        # Assist-to-Turnover Ratio
        assists = data.get("assists", 0)
        turnovers = data.get("turnovers", 1)
        features["assist_to_turnover_ratio"] = assists / turnovers
        
        # Rebound Rate
        total_rebounds = data.get("offensive_rebounds", 0) + data.get("defensive_rebounds", 0)
        available_rebounds = data.get("team_available_rebounds", 50)
        features["rebound_rate"] = total_rebounds / max(available_rebounds, 1)
        
        return features
        
    async def extract_situational_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract NBA situational features"""
        
        features = {}
        
        # Game situation features
        features.update({
            "home_court_advantage": 1.0 if data.get("is_home_game", False) else 0.0,
            "back_to_back_game": 1.0 if data.get("is_back_to_back", False) else 0.0,
            "rest_days": min(data.get("days_rest", 0), 7),  # Cap at 7 days
            "altitude_factor": data.get("venue_altitude", 0) / 1000,  # Normalize to thousands of feet
            "rivalry_game": 1.0 if data.get("is_rivalry", False) else 0.0,
            "playoff_game": 1.0 if data.get("is_playoff", False) else 0.0,
            "clutch_time": 1.0 if data.get("is_clutch_time", False) else 0.0,
            "fourth_quarter": 1.0 if data.get("quarter", 1) == 4 else 0.0,
            "overtime": 1.0 if data.get("quarter", 1) > 4 else 0.0
        })
        
        # Opponent strength
        opp_record = data.get("opponent_win_percentage", 0.5)
        features["opponent_strength"] = opp_record
        
        # Team performance context
        team_record = data.get("team_win_percentage", 0.5)
        features["team_form"] = team_record
        
        return features
        
    def get_sport_specific_interactions(self) -> List[Tuple[str, str, str]]:
        """Get NBA-specific feature interactions"""
        
        return [
            ("usage_rate", "true_shooting_percentage", "multiplicative"),
            ("minutes_per_game", "player_efficiency_rating", "multiplicative"),
            ("assist_to_turnover_ratio", "usage_rate", "multiplicative"),
            ("home_court_advantage", "opponent_strength", "multiplicative"),
            ("rest_days", "back_to_back_game", "inverse"),
            ("clutch_time", "true_shooting_percentage", "multiplicative")
        ]

class NFLFeatureEngine(BaseSportFeatureEngine):
    """NFL-specific feature engineering"""
    
    def __init__(self):
        super().__init__(Sport.NFL)
        
    async def extract_basic_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract NFL basic features"""
        
        features = {}
        games = max(data.get("games_played", 1), 1)
        
        # Position-specific features
        position = data.get("position", "UNKNOWN")
        
        if position in ["QB"]:
            features.update({
                "passing_yards_per_game": data.get("passing_yards", 0) / games,
                "passing_touchdowns_per_game": data.get("passing_touchdowns", 0) / games,
                "interceptions_per_game": data.get("interceptions", 0) / games,
                "completion_percentage": data.get("completions", 0) / max(data.get("attempts", 1), 1),
                "yards_per_attempt": data.get("passing_yards", 0) / max(data.get("attempts", 1), 1),
                "passer_rating": self._calculate_passer_rating(data)
            })
            
        elif position in ["RB"]:
            features.update({
                "rushing_yards_per_game": data.get("rushing_yards", 0) / games,
                "rushing_touchdowns_per_game": data.get("rushing_touchdowns", 0) / games,
                "yards_per_carry": data.get("rushing_yards", 0) / max(data.get("carries", 1), 1),
                "receiving_yards_per_game": data.get("receiving_yards", 0) / games,
                "receptions_per_game": data.get("receptions", 0) / games
            })
            
        elif position in ["WR", "TE"]:
            features.update({
                "receiving_yards_per_game": data.get("receiving_yards", 0) / games,
                "receiving_touchdowns_per_game": data.get("receiving_touchdowns", 0) / games,
                "receptions_per_game": data.get("receptions", 0) / games,
                "yards_per_reception": data.get("receiving_yards", 0) / max(data.get("receptions", 1), 1),
                "catch_percentage": data.get("receptions", 0) / max(data.get("targets", 1), 1),
                "yards_after_catch": data.get("yards_after_catch", 0) / max(data.get("receptions", 1), 1)
            })
            
        return features
        
    def _calculate_passer_rating(self, data: Dict[str, Any]) -> float:
        """Calculate NFL passer rating"""
        
        attempts = max(data.get("attempts", 1), 1)
        completions = data.get("completions", 0)
        yards = data.get("passing_yards", 0)
        touchdowns = data.get("passing_touchdowns", 0)
        interceptions = data.get("interceptions", 0)
        
        # NFL passer rating formula
        comp_pct = max(0, min(2.375, (completions / attempts - 0.3) * 5))
        yards_per_att = max(0, min(2.375, (yards / attempts - 3) * 0.25))
        td_pct = max(0, min(2.375, touchdowns / attempts * 20))
        int_pct = max(0, min(2.375, 2.375 - interceptions / attempts * 25))
        
        rating = ((comp_pct + yards_per_att + td_pct + int_pct) / 6) * 100
        return round(rating, 1)
        
    async def extract_advanced_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract NFL advanced analytics features"""
        
        features = {}
        position = data.get("position", "UNKNOWN")
        
        # Advanced metrics by position
        if position == "QB":
            features.update({
                "air_yards_per_attempt": data.get("air_yards", 0) / max(data.get("attempts", 1), 1),
                "pressure_percentage": data.get("pressures_faced", 0) / max(data.get("dropbacks", 1), 1),
                "red_zone_efficiency": data.get("red_zone_tds", 0) / max(data.get("red_zone_attempts", 1), 1),
                "third_down_conversion": data.get("third_down_conversions", 0) / max(data.get("third_down_attempts", 1), 1)
            })
            
        elif position in ["WR", "TE"]:
            features.update({
                "separation_average": data.get("average_separation", 2.5),
                "contested_catch_rate": data.get("contested_catches", 0) / max(data.get("contested_targets", 1), 1),
                "target_share": data.get("targets", 0) / max(data.get("team_targets", 1), 1),
                "red_zone_target_share": data.get("red_zone_targets", 0) / max(data.get("team_red_zone_targets", 1), 1)
            })
            
        elif position == "RB":
            features.update({
                "yards_before_contact": data.get("yards_before_contact", 0) / max(data.get("carries", 1), 1),
                "broken_tackles_per_touch": data.get("broken_tackles", 0) / max(data.get("touches", 1), 1),
                "goal_line_efficiency": data.get("goal_line_tds", 0) / max(data.get("goal_line_carries", 1), 1)
            })
            
        # Snap count and usage
        team_snaps = data.get("team_offensive_snaps", 1000)
        player_snaps = data.get("offensive_snaps", 0)
        features["snap_share"] = player_snaps / team_snaps
        
        return features
        
    async def extract_situational_features(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Extract NFL situational features"""
        
        features = {}
        
        # Game context
        features.update({
            "home_field_advantage": 1.0 if data.get("is_home_game", False) else 0.0,
            "dome_game": 1.0 if data.get("is_dome", False) else 0.0,
            "cold_weather": 1.0 if data.get("temperature", 70) < 40 else 0.0,
            "wind_speed": min(data.get("wind_speed", 0), 25),  # Cap at 25 mph
            "precipitation": 1.0 if data.get("precipitation", 0) > 0 else 0.0,
            "divisional_game": 1.0 if data.get("is_divisional", False) else 0.0,
            "prime_time": 1.0 if data.get("is_prime_time", False) else 0.0,
            "playoff_implications": data.get("playoff_impact_score", 0.5)
        })
        
        # Opponent defensive strength
        opp_def_rank = data.get("opponent_defense_rank", 16)
        features["opponent_defense_strength"] = (33 - opp_def_rank) / 32  # Normalize to 0-1
        
        # Team offensive line strength
        ol_rank = data.get("offensive_line_rank", 16)
        features["offensive_line_strength"] = (33 - ol_rank) / 32
        
        return features
        
    def get_sport_specific_interactions(self) -> List[Tuple[str, str, str]]:
        """Get NFL-specific feature interactions"""
        
        return [
            ("target_share", "opponent_defense_strength", "inverse"),
            ("snap_share", "team_offensive_efficiency", "multiplicative"),
            ("weather_conditions", "dome_game", "inverse"),
            ("home_field_advantage", "divisional_game", "multiplicative"),
            ("red_zone_efficiency", "goal_line_carries", "multiplicative")
        ]

class SportSpecificFeatureEngineering:
    """
    Main service for sport-specific feature engineering
    """
    
    def __init__(self):
        self.sport_engines = {
            Sport.NBA: NBAFeatureEngine(),
            Sport.NFL: NFLFeatureEngine(),
            # Add other sports here
        }
        self.feature_cache = {}
        self.cache_ttl = timedelta(minutes=15)
        self.executor = ThreadPoolExecutor(max_workers=10)
        
    async def process_player_features(
        self,
        player_data: Dict[str, Any],
        sport: Sport,
        feature_categories: List[FeatureCategory] = None
    ) -> ProcessedFeatureSet:
        """
        Process comprehensive features for a player
        
        Args:
            player_data: Raw player data
            sport: Sport type
            feature_categories: Categories of features to include
            
        Returns:
            ProcessedFeatureSet with all calculated features
        """
        if feature_categories is None:
            feature_categories = list(FeatureCategory)
            
        cache_key = f"player_{player_data.get('player_id')}_{sport.value}_{hash(str(sorted(feature_categories)))}"
        
        # Check cache
        if cache_key in self.feature_cache:
            cached_data, timestamp = self.feature_cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl:
                return cached_data
        
        try:
            engine = self.sport_engines.get(sport)
            if not engine:
                raise ValueError(f"No feature engine available for {sport.value}")
            
            all_features = {}
            feature_metadata = {}
            confidence_scores = {}
            
            # Extract features by category
            for category in feature_categories:
                try:
                    if category == FeatureCategory.BASIC_STATS:
                        features = await engine.extract_basic_features(player_data)
                        all_features.update(features)
                        confidence_scores.update({f: 0.95 for f in features.keys()})
                        
                    elif category == FeatureCategory.ADVANCED_METRICS:
                        features = await engine.extract_advanced_features(player_data)
                        all_features.update(features)
                        confidence_scores.update({f: 0.85 for f in features.keys()})
                        
                    elif category == FeatureCategory.SITUATIONAL:
                        features = await engine.extract_situational_features(player_data)
                        all_features.update(features)
                        confidence_scores.update({f: 0.80 for f in features.keys()})
                        
                except Exception as e:
                    logger.error(f"Error extracting {category.value} features: {str(e)}")
                    continue
            
            # Apply feature interactions
            interaction_features = await self._apply_feature_interactions(
                all_features, engine.get_sport_specific_interactions()
            )
            all_features.update(interaction_features)
            confidence_scores.update({f: 0.75 for f in interaction_features.keys()})
            
            # Normalize features
            normalized_features = await self._normalize_features(all_features, sport)
            
            # Create feature metadata
            feature_metadata = {
                "extraction_method": f"{sport.value}_specific_engine",
                "categories_processed": [cat.value for cat in feature_categories],
                "total_features": len(normalized_features),
                "interaction_features": len(interaction_features),
                "data_quality_score": self._calculate_data_quality_score(player_data)
            }
            
            processed_features = ProcessedFeatureSet(
                entity_id=player_data.get("player_id", "unknown"),
                entity_type="player",
                sport=sport,
                game_id=player_data.get("game_id", "unknown"),
                features=normalized_features,
                feature_metadata=feature_metadata,
                processing_timestamp=datetime.now(),
                confidence_scores=confidence_scores
            )
            
            # Cache the result
            self.feature_cache[cache_key] = (processed_features, datetime.now())
            
            logger.info(f"Processed {len(normalized_features)} features for {sport.value} player")
            return processed_features
            
        except Exception as e:
            logger.error(f"Error processing player features: {str(e)}")
            # Return minimal feature set
            return ProcessedFeatureSet(
                entity_id=player_data.get("player_id", "unknown"),
                entity_type="player",
                sport=sport,
                game_id=player_data.get("game_id", "unknown"),
                features={},
                feature_metadata={"error": str(e)},
                processing_timestamp=datetime.now(),
                confidence_scores={}
            )

    async def _apply_feature_interactions(
        self,
        features: Dict[str, float],
        interactions: List[Tuple[str, str, str]]
    ) -> Dict[str, float]:
        """Apply feature interactions to create new derived features"""
        
        interaction_features = {}
        
        for feature1, feature2, interaction_type in interactions:
            if feature1 in features and feature2 in features:
                
                val1 = features[feature1]
                val2 = features[feature2]
                
                if interaction_type == "multiplicative":
                    result = val1 * val2
                elif interaction_type == "additive":
                    result = val1 + val2
                elif interaction_type == "ratio":
                    result = val1 / max(val2, 0.001)  # Avoid division by zero
                elif interaction_type == "difference":
                    result = val1 - val2
                elif interaction_type == "inverse":
                    result = val1 * (1 - val2)
                else:
                    continue  # Unknown interaction type
                
                interaction_name = f"{feature1}_x_{feature2}_{interaction_type}"
                interaction_features[interaction_name] = result
        
        return interaction_features

    async def _normalize_features(
        self,
        features: Dict[str, float],
        sport: Sport
    ) -> Dict[str, float]:
        """Normalize features using sport-specific parameters"""
        
        normalized = {}
        
        # Sport-specific normalization parameters
        normalization_params = {
            Sport.NBA: {
                "points_per_game": {"min": 0, "max": 40, "method": "min_max"},
                "rebounds_per_game": {"min": 0, "max": 20, "method": "min_max"},
                "assists_per_game": {"min": 0, "max": 15, "method": "min_max"},
                "true_shooting_percentage": {"min": 0.3, "max": 0.8, "method": "min_max"},
                "usage_rate": {"min": 0.1, "max": 0.4, "method": "min_max"}
            },
            Sport.NFL: {
                "passing_yards_per_game": {"min": 0, "max": 400, "method": "min_max"},
                "rushing_yards_per_game": {"min": 0, "max": 200, "method": "min_max"},
                "receiving_yards_per_game": {"min": 0, "max": 150, "method": "min_max"},
                "passer_rating": {"min": 0, "max": 158.3, "method": "min_max"},
                "yards_per_carry": {"min": 0, "max": 10, "method": "min_max"}
            }
        }
        
        sport_params = normalization_params.get(sport, {})
        
        for feature_name, value in features.items():
            if feature_name in sport_params:
                params = sport_params[feature_name]
                
                if params["method"] == "min_max":
                    min_val = params["min"]
                    max_val = params["max"]
                    normalized_value = (value - min_val) / (max_val - min_val)
                    normalized_value = max(0, min(1, normalized_value))  # Clamp to [0, 1]
                else:
                    normalized_value = value
                    
                normalized[feature_name] = round(normalized_value, 4)
            else:
                # Default normalization for unknown features
                normalized[feature_name] = round(max(0, min(1, value)), 4)
        
        return normalized

    def _calculate_data_quality_score(self, data: Dict[str, Any]) -> float:
        """Calculate data quality score based on completeness and consistency"""
        
        required_fields = ["player_id", "games_played"]
        optional_fields = ["team_id", "position", "age", "experience"]
        
        # Check required fields
        required_score = sum(1 for field in required_fields if field in data and data[field] is not None) / len(required_fields)
        
        # Check optional fields
        optional_score = sum(1 for field in optional_fields if field in data and data[field] is not None) / len(optional_fields)
        
        # Check for reasonable values
        consistency_score = 1.0
        if "games_played" in data and data["games_played"] < 0:
            consistency_score -= 0.2
        if "age" in data and (data["age"] < 18 or data["age"] > 50):
            consistency_score -= 0.1
            
        overall_score = (required_score * 0.6 + optional_score * 0.3 + consistency_score * 0.1)
        return round(overall_score, 3)

    async def get_feature_importance_analysis(
        self,
        sport: Sport,
        target_metric: str
    ) -> Dict[str, Any]:
        """Analyze feature importance for a specific target metric"""
        
        # Simulate feature importance analysis
        # In production, this would use actual ML models and historical data
        
        importance_scores = {}
        
        if sport == Sport.NBA:
            if "points" in target_metric.lower():
                importance_scores = {
                    "usage_rate": 0.25,
                    "true_shooting_percentage": 0.22,
                    "minutes_per_game": 0.18,
                    "home_court_advantage": 0.08,
                    "opponent_strength": 0.12,
                    "rest_days": 0.06,
                    "clutch_time": 0.09
                }
            elif "rebounds" in target_metric.lower():
                importance_scores = {
                    "rebound_rate": 0.30,
                    "minutes_per_game": 0.25,
                    "position_factor": 0.20,
                    "opponent_rebounding_strength": 0.15,
                    "pace_factor": 0.10
                }
                
        elif sport == Sport.NFL:
            if "passing" in target_metric.lower():
                importance_scores = {
                    "opponent_defense_strength": 0.28,
                    "weather_conditions": 0.15,
                    "offensive_line_strength": 0.20,
                    "target_separation": 0.18,
                    "home_field_advantage": 0.10,
                    "rest_days": 0.09
                }
        
        # Generate analysis report
        analysis = {
            "sport": sport.value,
            "target_metric": target_metric,
            "feature_importance": importance_scores,
            "top_features": sorted(importance_scores.items(), key=lambda x: x[1], reverse=True)[:5],
            "model_accuracy": np.random.uniform(0.75, 0.92),
            "feature_count": len(importance_scores),
            "analysis_timestamp": datetime.now().isoformat()
        }
        
        return analysis

    async def batch_process_features(
        self,
        players_data: List[Dict[str, Any]],
        sport: Sport
    ) -> List[ProcessedFeatureSet]:
        """Process features for multiple players in batch"""
        
        logger.info(f"Batch processing features for {len(players_data)} {sport.value} players")
        
        # Process in parallel
        tasks = [
            self.process_player_features(player_data, sport)
            for player_data in players_data
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        processed_features = [
            result for result in results 
            if isinstance(result, ProcessedFeatureSet)
        ]
        
        logger.info(f"Successfully processed features for {len(processed_features)} players")
        return processed_features

# Usage example and testing
async def main():
    """Example usage of the Sport-Specific Feature Engineering"""
    
    feature_service = SportSpecificFeatureEngineering()
    
    # Example 1: Process NBA player features
    nba_player_data = {
        "player_id": "nba_lebron_james",
        "games_played": 70,
        "points": 1820,
        "rebounds": 560,
        "assists": 630,
        "steals": 91,
        "blocks": 42,
        "turnovers": 245,
        "field_goals_made": 686,
        "field_goals_attempted": 1372,
        "three_pointers_made": 99,
        "three_pointers_attempted": 279,
        "free_throws_made": 349,
        "free_throws_attempted": 434,
        "minutes_played": 2520,
        "position": "SF",
        "team_id": "LAL",
        "is_home_game": True,
        "opponent_win_percentage": 0.65,
        "days_rest": 1
    }
    
    nba_features = await feature_service.process_player_features(
        nba_player_data, Sport.NBA
    )
    
    print("=== NBA Player Features ===")
    print(f"Total features extracted: {len(nba_features.features)}")
    print("Top features:")
    for feature, value in list(nba_features.features.items())[:10]:
        confidence = nba_features.confidence_scores.get(feature, 0.0)
        print(f"  {feature}: {value:.3f} (confidence: {confidence:.2f})")
    
    # Example 2: Process NFL player features
    nfl_player_data = {
        "player_id": "nfl_patrick_mahomes",
        "games_played": 16,
        "passing_yards": 4839,
        "passing_touchdowns": 41,
        "interceptions": 12,
        "completions": 435,
        "attempts": 648,
        "position": "QB",
        "team_id": "KC",
        "is_home_game": False,
        "opponent_defense_rank": 8,
        "temperature": 35,
        "wind_speed": 12,
        "is_divisional": True
    }
    
    nfl_features = await feature_service.process_player_features(
        nfl_player_data, Sport.NFL
    )
    
    print("\n=== NFL Player Features ===")
    print(f"Total features extracted: {len(nfl_features.features)}")
    print("Top features:")
    for feature, value in list(nfl_features.features.items())[:10]:
        confidence = nfl_features.confidence_scores.get(feature, 0.0)
        print(f"  {feature}: {value:.3f} (confidence: {confidence:.2f})")
    
    # Example 3: Feature importance analysis
    print("\n=== Feature Importance Analysis ===")
    nba_importance = await feature_service.get_feature_importance_analysis(
        Sport.NBA, "player_points"
    )
    
    print(f"Top features for NBA points prediction:")
    for feature, importance in nba_importance["top_features"]:
        print(f"  {feature}: {importance:.3f}")

if __name__ == "__main__":
    asyncio.run(main())
