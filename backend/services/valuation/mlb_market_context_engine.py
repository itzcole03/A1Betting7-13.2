"""
MLB Market Context Engine - Section 3 Implementation

Provides comprehensive contextual analysis for MLB betting markets,
including ballpark effects, weather conditions, matchup analysis,
and situational factors.
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, time

logger = logging.getLogger(__name__)


class WeatherCondition(Enum):
    """Weather condition types"""
    CLEAR = "clear"
    CLOUDY = "cloudy"
    OVERCAST = "overcast"
    LIGHT_RAIN = "light_rain"
    HEAVY_RAIN = "heavy_rain"
    WIND_OUT = "wind_out"        # Wind blowing out to fences
    WIND_IN = "wind_in"          # Wind blowing in from fences
    CROSS_WIND = "cross_wind"    # Cross wind
    EXTREME_HEAT = "extreme_heat" # >90°F
    COLD = "cold"                # <50°F


class GameSituation(Enum):
    """Game situation types"""
    REGULAR_SEASON = "regular_season"
    PLAYOFF = "playoff"
    DAY_GAME = "day_game"
    NIGHT_GAME = "night_game"
    SERIES_OPENER = "series_opener"
    SERIES_FINALE = "series_finale"
    GETAWAY_DAY = "getaway_day"    # Last game before travel
    HOME_OPENER = "home_opener"
    RIVALRY_GAME = "rivalry_game"


@dataclass
class BallparkFactors:
    """Ballpark-specific factors"""
    name: str
    offensive_factor: float     # >1.0 favors offense, <1.0 favors pitching
    home_run_factor: float      # Specific to home run frequency
    dimensions: Dict[str, int]  # LF, CF, RF distances
    altitude: int               # Feet above sea level
    wall_heights: Dict[str, int] # LF, CF, RF wall heights
    foul_territory: str         # "large", "medium", "small"


@dataclass
class MatchupContext:
    """Pitcher vs batter matchup context"""
    pitcher_handedness: str     # "L", "R"  
    batter_handedness: str      # "L", "R", "S" (switch)
    historical_matchup: Optional[Dict[str, Any]] = None
    pitcher_vs_team_history: Optional[Dict[str, Any]] = None
    platoon_advantage: Optional[str] = None  # "pitcher", "batter", "neutral"


@dataclass
class TeamContext:
    """Team-specific context"""
    recent_form: Dict[str, float]    # Last 10 games stats
    injuries: List[str]              # Key injured players  
    bullpen_usage: Dict[str, float]  # Recent bullpen usage
    lineup_changes: List[str]        # Recent lineup changes
    travel_fatigue: bool             # Coming off long road trip


@dataclass
class MLBGameContext:
    """Comprehensive MLB game context"""
    ballpark: BallparkFactors
    weather: Dict[str, Any]
    game_situation: GameSituation
    matchup_context: MatchupContext
    home_team_context: TeamContext
    away_team_context: TeamContext
    game_time: datetime
    series_context: Dict[str, Any]


class MLBMarketContextEngine:
    """
    Advanced context analysis engine for MLB betting markets
    
    Provides contextual adjustments for:
    - Ballpark effects on different prop types
    - Weather impact on game outcomes  
    - Matchup advantages and disadvantages
    - Situational factors (day/night, series position, etc.)
    """
    
    def __init__(self):
        self.name = "mlb_market_context_engine"
        self.version = "1.0"
        
        # MLB ballpark database (simplified - would be comprehensive in production)
        self.ballpark_database = self._initialize_ballpark_database()
        
        # Weather impact factors
        self.weather_factors = {
            WeatherCondition.WIND_OUT: {
                "home_runs": 1.12,
                "hits": 1.03,
                "runs": 1.08,
                "strikeouts_pitcher": 0.95
            },
            WeatherCondition.WIND_IN: {
                "home_runs": 0.85,
                "hits": 0.98,
                "runs": 0.93,
                "strikeouts_pitcher": 1.05
            },
            WeatherCondition.EXTREME_HEAT: {
                "home_runs": 1.05,
                "hits": 0.97,
                "runs": 1.02,
                "innings_pitched": 0.95  # Pitchers tire faster
            },
            WeatherCondition.COLD: {
                "home_runs": 0.92,
                "hits": 0.95,
                "runs": 0.94,
                "strikeouts_pitcher": 1.03
            }
        }
        
        # Time-of-day factors
        self.time_factors = {
            "day_game": {
                "home_runs": 1.02,  # Easier to see ball in day games
                "strikeouts_pitcher": 0.98,
                "walks": 1.03
            },
            "night_game": {
                "home_runs": 0.98,
                "strikeouts_pitcher": 1.02,
                "walks": 0.97
            }
        }
        
        logger.info("MLB Market Context Engine initialized")
    
    def _initialize_ballpark_database(self) -> Dict[str, BallparkFactors]:
        """Initialize ballpark database"""
        return {
            "coors_field": BallparkFactors(
                name="Coors Field",
                offensive_factor=1.15,
                home_run_factor=1.25,
                dimensions={"LF": 347, "CF": 415, "RF": 350},
                altitude=5200,
                wall_heights={"LF": 8, "CF": 8, "RF": 8},
                foul_territory="small"
            ),
            "fenway_park": BallparkFactors(
                name="Fenway Park", 
                offensive_factor=1.05,
                home_run_factor=1.08,
                dimensions={"LF": 310, "CF": 420, "RF": 302},
                altitude=20,
                wall_heights={"LF": 37, "CF": 17, "RF": 3},
                foul_territory="small"
            ),
            "petco_park": BallparkFactors(
                name="Petco Park",
                offensive_factor=0.92,
                home_run_factor=0.85,
                dimensions={"LF": 336, "CF": 396, "RF": 322},
                altitude=70,
                wall_heights={"LF": 8, "CF": 8, "RF": 8},
                foul_territory="large"
            ),
            "yankee_stadium": BallparkFactors(
                name="Yankee Stadium",
                offensive_factor=1.08,
                home_run_factor=1.12,
                dimensions={"LF": 318, "CF": 408, "RF": 314},
                altitude=55,
                wall_heights={"LF": 8, "CF": 8, "RF": 8},
                foul_territory="medium"
            ),
            "marlins_park": BallparkFactors(
                name="Marlins Park",
                offensive_factor=0.95,
                home_run_factor=0.90,
                dimensions={"LF": 344, "CF": 407, "RF": 335},
                altitude=10,
                wall_heights={"LF": 12, "CF": 12, "RF": 12},
                foul_territory="medium"
            )
        }
    
    async def analyze_game_context(
        self,
        *,
        ballpark: str,
        weather_data: Dict[str, Any],
        game_time: datetime,
        matchup_data: Dict[str, Any],
        team_data: Dict[str, Any],
        series_info: Dict[str, Any]
    ) -> MLBGameContext:
        """
        Analyze comprehensive game context
        
        Args:
            ballpark: Ballpark name
            weather_data: Weather conditions
            game_time: Game start time
            matchup_data: Pitcher/batter matchup info
            team_data: Team context information
            series_info: Series context
            
        Returns:
            MLBGameContext: Comprehensive game context
        """
        try:
            logger.debug(f"Analyzing context for {ballpark}")
            
            # Parse ballpark factors
            ballpark_factors = self._get_ballpark_factors(ballpark)
            
            # Analyze weather conditions
            weather_analysis = self._analyze_weather_conditions(weather_data)
            
            # Determine game situation
            game_situation = self._determine_game_situation(
                game_time, series_info, team_data
            )
            
            # Analyze matchup context
            matchup_context = self._analyze_matchup_context(matchup_data)
            
            # Process team contexts
            home_team_context = self._process_team_context(
                team_data.get("home_team", {}), "home"
            )
            away_team_context = self._process_team_context(
                team_data.get("away_team", {}), "away"
            )
            
            return MLBGameContext(
                ballpark=ballpark_factors,
                weather=weather_analysis,
                game_situation=game_situation,
                matchup_context=matchup_context,
                home_team_context=home_team_context,
                away_team_context=away_team_context,
                game_time=game_time,
                series_context=series_info
            )
            
        except Exception as e:
            logger.error(f"Error analyzing game context: {e}")
            raise
    
    def _get_ballpark_factors(self, ballpark: str) -> BallparkFactors:
        """Get ballpark factors from database"""
        ballpark_key = ballpark.lower().replace(" ", "_")
        
        if ballpark_key in self.ballpark_database:
            return self.ballpark_database[ballpark_key]
        else:
            logger.warning(f"Unknown ballpark: {ballpark}, using neutral factors")
            return BallparkFactors(
                name=ballpark,
                offensive_factor=1.0,
                home_run_factor=1.0,
                dimensions={"LF": 330, "CF": 400, "RF": 330},
                altitude=500,
                wall_heights={"LF": 8, "CF": 8, "RF": 8},
                foul_territory="medium"
            )
    
    def _analyze_weather_conditions(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze weather conditions and their impacts"""
        
        conditions = []
        temperature = weather_data.get("temperature", 75)
        wind_speed = weather_data.get("wind_speed", 0)
        wind_direction = weather_data.get("wind_direction", "")
        precipitation = weather_data.get("precipitation", 0)
        
        # Temperature analysis
        if temperature > 90:
            conditions.append(WeatherCondition.EXTREME_HEAT)
        elif temperature < 50:
            conditions.append(WeatherCondition.COLD)
        
        # Wind analysis
        if wind_speed > 10:  # mph
            if "out" in wind_direction.lower():
                conditions.append(WeatherCondition.WIND_OUT)
            elif "in" in wind_direction.lower():
                conditions.append(WeatherCondition.WIND_IN)
            else:
                conditions.append(WeatherCondition.CROSS_WIND)
        
        # Precipitation analysis
        if precipitation > 0.1:
            conditions.append(WeatherCondition.HEAVY_RAIN)
        elif precipitation > 0:
            conditions.append(WeatherCondition.LIGHT_RAIN)
        elif weather_data.get("cloud_cover", 0) > 0.8:
            conditions.append(WeatherCondition.OVERCAST)
        elif weather_data.get("cloud_cover", 0) > 0.3:
            conditions.append(WeatherCondition.CLOUDY)
        else:
            conditions.append(WeatherCondition.CLEAR)
        
        return {
            "conditions": conditions,
            "temperature": temperature,
            "wind_speed": wind_speed,
            "wind_direction": wind_direction,
            "precipitation": precipitation,
            "impact_analysis": self._calculate_weather_impact(conditions)
        }
    
    def _calculate_weather_impact(self, conditions: List[WeatherCondition]) -> Dict[str, float]:
        """Calculate cumulative weather impact on different stats"""
        
        impact_factors = {
            "home_runs": 1.0,
            "hits": 1.0,
            "runs": 1.0,
            "strikeouts_pitcher": 1.0,
            "innings_pitched": 1.0,
            "walks": 1.0
        }
        
        for condition in conditions:
            if condition in self.weather_factors:
                condition_factors = self.weather_factors[condition]
                for stat, factor in condition_factors.items():
                    if stat in impact_factors:
                        impact_factors[stat] *= factor
        
        return impact_factors
    
    def _determine_game_situation(
        self, 
        game_time: datetime, 
        series_info: Dict[str, Any],
        team_data: Dict[str, Any]
    ) -> GameSituation:
        """Determine primary game situation"""
        
        # Check if it's a playoff game
        if series_info.get("is_playoff", False):
            return GameSituation.PLAYOFF
        
        # Check for special series situations
        if series_info.get("game_number") == 1:
            return GameSituation.SERIES_OPENER
        elif series_info.get("is_series_finale", False):
            return GameSituation.SERIES_FINALE
        
        # Check for special game types
        if team_data.get("is_home_opener", False):
            return GameSituation.HOME_OPENER
        
        if series_info.get("is_rivalry", False):
            return GameSituation.RIVALRY_GAME
        
        if series_info.get("is_getaway_day", False):
            return GameSituation.GETAWAY_DAY
        
        # Check time of day
        game_hour = game_time.hour
        if 10 <= game_hour <= 17:  # Day games typically 10am-5pm local
            return GameSituation.DAY_GAME
        else:
            return GameSituation.NIGHT_GAME
    
    def _analyze_matchup_context(self, matchup_data: Dict[str, Any]) -> MatchupContext:
        """Analyze pitcher vs batter matchup context"""
        
        pitcher_hand = matchup_data.get("pitcher_handedness", "R")
        batter_hand = matchup_data.get("batter_handedness", "R")
        
        # Determine platoon advantage
        if pitcher_hand != batter_hand:
            # Opposite handedness favors batter
            platoon_advantage = "batter"
        else:
            # Same handedness favors pitcher
            platoon_advantage = "pitcher"
        
        # Switch hitters are special case
        if batter_hand == "S":
            platoon_advantage = "neutral"  # Switch hitters adjust
        
        return MatchupContext(
            pitcher_handedness=pitcher_hand,
            batter_handedness=batter_hand,
            historical_matchup=matchup_data.get("historical_matchup"),
            pitcher_vs_team_history=matchup_data.get("pitcher_vs_team"),
            platoon_advantage=platoon_advantage
        )
    
    def _process_team_context(
        self, 
        team_data: Dict[str, Any], 
        home_away: str
    ) -> TeamContext:
        """Process team-specific context"""
        
        # Recent form (last 10 games)
        recent_form = {
            "wins": team_data.get("recent_wins", 5),
            "losses": team_data.get("recent_losses", 5),
            "runs_per_game": team_data.get("recent_rpg", 4.5),
            "runs_allowed": team_data.get("recent_ra", 4.5),
            "batting_avg": team_data.get("recent_avg", 0.250)
        }
        
        # Injuries
        injuries = team_data.get("injuries", [])
        
        # Bullpen usage (innings pitched in last 3 games)
        bullpen_usage = {
            "total_innings": team_data.get("bullpen_innings", 6.0),
            "high_leverage_innings": team_data.get("bullpen_high_leverage", 2.0),
            "closer_available": team_data.get("closer_available", True)
        }
        
        # Lineup changes
        lineup_changes = team_data.get("lineup_changes", [])
        
        # Travel fatigue
        travel_fatigue = team_data.get("travel_fatigue", False)
        
        return TeamContext(
            recent_form=recent_form,
            injuries=injuries,
            bullpen_usage=bullpen_usage,
            lineup_changes=lineup_changes,
            travel_fatigue=travel_fatigue
        )
    
    def calculate_contextual_adjustments(
        self,
        game_context: MLBGameContext,
        prop_type: str,
        player_position: str = "batter"
    ) -> Dict[str, float]:
        """
        Calculate contextual adjustments for a specific prop type
        
        Args:
            game_context: Complete game context
            prop_type: Type of prop (hits, home_runs, etc.)
            player_position: "batter", "pitcher", "team"
            
        Returns:
            dict: Adjustment factors for the prop
        """
        try:
            adjustments = {
                "ballpark_factor": 1.0,
                "weather_factor": 1.0,
                "time_factor": 1.0,
                "matchup_factor": 1.0,
                "situation_factor": 1.0,
                "composite_factor": 1.0
            }
            
            prop_lower = prop_type.lower()
            
            # Ballpark adjustments
            if prop_lower in ["hits", "home_runs", "runs", "rbi", "total_bases"]:
                if prop_lower == "home_runs":
                    adjustments["ballpark_factor"] = game_context.ballpark.home_run_factor
                else:
                    adjustments["ballpark_factor"] = game_context.ballpark.offensive_factor
            elif prop_lower in ["strikeouts_pitcher", "walks", "innings_pitched"]:
                # Pitching stats get inverse of offensive factor
                adjustments["ballpark_factor"] = 1 / game_context.ballpark.offensive_factor
            
            # Weather adjustments
            weather_impacts = game_context.weather["impact_analysis"]
            if prop_lower in weather_impacts:
                adjustments["weather_factor"] = weather_impacts[prop_lower]
            
            # Time of day adjustments
            is_day_game = game_context.game_situation == GameSituation.DAY_GAME
            time_key = "day_game" if is_day_game else "night_game"
            
            if time_key in self.time_factors:
                time_impacts = self.time_factors[time_key]
                if prop_lower in time_impacts:
                    adjustments["time_factor"] = time_impacts[prop_lower]
            
            # Matchup adjustments
            if player_position == "batter":
                matchup_factor = self._calculate_batter_matchup_factor(
                    game_context.matchup_context, prop_lower
                )
                adjustments["matchup_factor"] = matchup_factor
            
            # Situational adjustments
            adjustments["situation_factor"] = self._calculate_situation_factor(
                game_context.game_situation, prop_lower
            )
            
            # Calculate composite factor
            adjustments["composite_factor"] = (
                adjustments["ballpark_factor"] *
                adjustments["weather_factor"] *
                adjustments["time_factor"] *
                adjustments["matchup_factor"] *
                adjustments["situation_factor"]
            )
            
            return adjustments
            
        except Exception as e:
            logger.error(f"Error calculating contextual adjustments: {e}")
            return {"composite_factor": 1.0}
    
    def _calculate_batter_matchup_factor(
        self, 
        matchup_context: MatchupContext, 
        prop_type: str
    ) -> float:
        """Calculate batter matchup adjustment factor"""
        
        if matchup_context.platoon_advantage == "batter":
            # Batter has platoon advantage
            if prop_type in ["hits", "home_runs", "rbi", "runs"]:
                return 1.08  # 8% boost for favorable matchup
            else:
                return 1.02  # Smaller boost for other stats
                
        elif matchup_context.platoon_advantage == "pitcher":
            # Pitcher has platoon advantage
            if prop_type in ["hits", "home_runs", "rbi", "runs"]:
                return 0.92  # 8% reduction for unfavorable matchup
            else:
                return 0.98  # Smaller reduction for other stats
        
        return 1.0  # Neutral matchup
    
    def _calculate_situation_factor(
        self, 
        game_situation: GameSituation, 
        prop_type: str
    ) -> float:
        """Calculate situational adjustment factor"""
        
        if game_situation == GameSituation.PLAYOFF:
            # Playoff games tend to be more unpredictable
            return 0.98  # Slight reduction across all stats
            
        elif game_situation == GameSituation.RIVALRY_GAME:
            # Rivalry games can be higher intensity
            if prop_type in ["strikeouts_pitcher", "walks"]:
                return 1.03  # Pitchers may be more amped up
            else:
                return 1.01  # Slight boost for offensive stats
                
        elif game_situation == GameSituation.GETAWAY_DAY:
            # Teams eager to finish and travel
            if prop_type in ["innings_pitched"]:
                return 0.95  # Starters may not go as deep
            else:
                return 1.02  # Slightly more offensive minded
        
        return 1.0  # No adjustment for regular situations
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for context engine"""
        try:
            # Test ballpark lookup
            test_ballpark = self._get_ballpark_factors("coors_field")
            ballpark_test = test_ballpark.offensive_factor > 1.0
            
            # Test weather analysis
            test_weather = {"temperature": 95, "wind_speed": 15, "wind_direction": "out"}
            weather_analysis = self._analyze_weather_conditions(test_weather)
            weather_test = len(weather_analysis["conditions"]) > 0
            
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "ballpark_database": ballpark_test,
                    "weather_analysis": weather_test,
                    "matchup_analysis": True,
                    "contextual_adjustments": True,
                    "ballparks_loaded": len(self.ballpark_database)
                }
            }
            
        except Exception as e:
            logger.error(f"Context engine health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "degraded",
                "error": str(e)
            }


# Global service instance
mlb_market_context_engine = MLBMarketContextEngine()