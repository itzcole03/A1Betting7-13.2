"""
Sport-Specific Volatility Models for Intelligent Caching
Advanced caching strategies based on sports data volatility patterns and user behavior
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from backend.utils.enhanced_logging import get_logger

logger = get_logger("sport_volatility_models")


class SportType(Enum):
    """Supported sports for volatility modeling"""
    MLB = "mlb"
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"


class DataCategory(Enum):
    """Categories of sports data with different volatility profiles"""
    LIVE_SCORES = "live_scores"
    LIVE_ODDS = "live_odds"
    PRE_GAME_ODDS = "pre_game_odds"
    PLAYER_STATS = "player_stats"
    TEAM_STATS = "team_stats"
    INJURY_REPORTS = "injury_reports"
    GAME_SCHEDULES = "game_schedules"
    PLAYER_PROPS = "player_props"
    WEATHER_CONDITIONS = "weather_conditions"
    NEWS_UPDATES = "news_updates"


class GameState(Enum):
    """Game states affecting data volatility"""
    PRE_GAME = "pre_game"
    LIVE = "live"
    HALFTIME = "halftime"
    POST_GAME = "post_game"
    DELAYED = "delayed"
    CANCELLED = "cancelled"


@dataclass
class VolatilityProfile:
    """Volatility profile for specific sport and data category"""
    sport: SportType
    data_category: DataCategory
    base_ttl: int  # Base TTL in seconds
    volatility_multiplier: float  # Multiplier based on volatility (0.1 = very volatile, 2.0 = very stable)
    peak_hours: List[int]  # Hours when data is most accessed
    seasonal_factor: float  # Seasonal adjustment factor
    user_context_factor: float  # User behavior impact factor
    game_state_factors: Dict[GameState, float]  # TTL adjustments by game state
    update_frequency: int  # Expected update frequency in seconds
    
    def calculate_ttl(self, 
                     current_hour: int = None,
                     game_state: GameState = None,
                     user_context: str = None,
                     access_frequency: int = 1) -> int:
        """Calculate dynamic TTL based on current conditions"""
        
        if current_hour is None:
            current_hour = datetime.now().hour
        
        # Start with base TTL
        calculated_ttl = self.base_ttl
        
        # Apply volatility multiplier
        calculated_ttl = int(calculated_ttl * self.volatility_multiplier)
        
        # Apply peak hours adjustment (shorter TTL during peak)
        if current_hour in self.peak_hours:
            calculated_ttl = int(calculated_ttl * 0.7)  # 30% shorter during peak
        
        # Apply seasonal factor
        calculated_ttl = int(calculated_ttl * self.seasonal_factor)
        
        # Apply game state factor
        if game_state and game_state in self.game_state_factors:
            calculated_ttl = int(calculated_ttl * self.game_state_factors[game_state])
        
        # Apply user context factor (frequent users get fresher data)
        if user_context and access_frequency > 10:
            calculated_ttl = int(calculated_ttl * self.user_context_factor)
        
        # Ensure reasonable bounds
        min_ttl = min(30, self.base_ttl // 10)  # Minimum 30 seconds or 10% of base
        max_ttl = self.base_ttl * 5  # Maximum 5x base TTL
        
        return max(min_ttl, min(calculated_ttl, max_ttl))


class SportVolatilityModels:
    """
    Sport-specific volatility models for intelligent caching with:
    - Dynamic TTL calculation based on data volatility
    - Game state awareness
    - Peak hours optimization  
    - User behavior patterns
    - Seasonal adjustments
    """

    def __init__(self):
        self.volatility_profiles: Dict[Tuple[SportType, DataCategory], VolatilityProfile] = {}
        self.user_access_patterns: Dict[str, Dict[str, int]] = {}  # user_id -> {data_key: access_count}
        self.game_states: Dict[str, GameState] = {}  # game_id -> current_state
        self.seasonal_adjustments: Dict[SportType, float] = {}
        
        # Initialize profiles
        self._initialize_volatility_profiles()
        
        # Background task for updating patterns
        self._pattern_update_task: Optional[asyncio.Task] = None

    def _initialize_volatility_profiles(self):
        """Initialize sport-specific volatility profiles"""
        
        # MLB Volatility Profiles
        self._register_mlb_profiles()
        
        # NBA Volatility Profiles  
        self._register_nba_profiles()
        
        # NFL Volatility Profiles
        self._register_nfl_profiles()
        
        # NHL Volatility Profiles
        self._register_nhl_profiles()
        
        logger.info(f"✅ Initialized {len(self.volatility_profiles)} volatility profiles")

    def _register_mlb_profiles(self):
        """Register MLB-specific volatility profiles"""
        
        # MLB Live Scores - High volatility during games
        self.volatility_profiles[(SportType.MLB, DataCategory.LIVE_SCORES)] = VolatilityProfile(
            sport=SportType.MLB,
            data_category=DataCategory.LIVE_SCORES,
            base_ttl=45,  # 45 seconds for live scores
            volatility_multiplier=0.3,  # Very volatile during games
            peak_hours=[19, 20, 21, 22],  # Evening games
            seasonal_factor=1.0,
            user_context_factor=0.8,  # Frequent users get 20% fresher data
            game_state_factors={
                GameState.PRE_GAME: 3.0,    # 3x longer before game
                GameState.LIVE: 0.5,        # 2x shorter during game
                GameState.HALFTIME: 2.0,    # 2x longer during breaks
                GameState.POST_GAME: 5.0,   # 5x longer after game
                GameState.DELAYED: 4.0,
                GameState.CANCELLED: 10.0
            },
            update_frequency=30
        )
        
        # MLB Live Odds - Extremely volatile
        self.volatility_profiles[(SportType.MLB, DataCategory.LIVE_ODDS)] = VolatilityProfile(
            sport=SportType.MLB,
            data_category=DataCategory.LIVE_ODDS,
            base_ttl=30,
            volatility_multiplier=0.2,  # Extremely volatile
            peak_hours=[19, 20, 21, 22],
            seasonal_factor=1.0,
            user_context_factor=0.7,
            game_state_factors={
                GameState.PRE_GAME: 2.0,
                GameState.LIVE: 0.3,        # Very short during live games
                GameState.HALFTIME: 1.5,
                GameState.POST_GAME: 8.0,
                GameState.DELAYED: 6.0,
                GameState.CANCELLED: 20.0
            },
            update_frequency=15
        )
        
        # MLB Pre-game Odds - Moderate volatility
        self.volatility_profiles[(SportType.MLB, DataCategory.PRE_GAME_ODDS)] = VolatilityProfile(
            sport=SportType.MLB,
            data_category=DataCategory.PRE_GAME_ODDS,
            base_ttl=300,  # 5 minutes
            volatility_multiplier=0.6,
            peak_hours=[18, 19, 20],  # Before evening games
            seasonal_factor=1.0,
            user_context_factor=0.9,
            game_state_factors={
                GameState.PRE_GAME: 1.0,
                GameState.LIVE: 3.0,        # Less important during game
                GameState.POST_GAME: 10.0,
            },
            update_frequency=180
        )
        
        # MLB Player Stats - Low volatility
        self.volatility_profiles[(SportType.MLB, DataCategory.PLAYER_STATS)] = VolatilityProfile(
            sport=SportType.MLB,
            data_category=DataCategory.PLAYER_STATS,
            base_ttl=1800,  # 30 minutes
            volatility_multiplier=1.5,  # Relatively stable
            peak_hours=[18, 19, 20, 21],
            seasonal_factor=1.2,  # More stable during season
            user_context_factor=0.95,
            game_state_factors={
                GameState.PRE_GAME: 1.0,
                GameState.LIVE: 0.8,        # Slightly fresher during games
                GameState.POST_GAME: 0.5,   # Update quickly after games
            },
            update_frequency=900
        )
        
        # MLB Injury Reports - Medium volatility  
        self.volatility_profiles[(SportType.MLB, DataCategory.INJURY_REPORTS)] = VolatilityProfile(
            sport=SportType.MLB,
            data_category=DataCategory.INJURY_REPORTS,
            base_ttl=900,  # 15 minutes
            volatility_multiplier=0.8,
            peak_hours=[16, 17, 18],  # Before games announced
            seasonal_factor=1.0,
            user_context_factor=0.9,
            game_state_factors={
                GameState.PRE_GAME: 0.7,    # Important before games
                GameState.LIVE: 1.5,
                GameState.POST_GAME: 2.0,
            },
            update_frequency=600
        )

    def _register_nba_profiles(self):
        """Register NBA-specific volatility profiles"""
        
        # NBA Live Scores - Very high volatility (fast-paced game)
        self.volatility_profiles[(SportType.NBA, DataCategory.LIVE_SCORES)] = VolatilityProfile(
            sport=SportType.NBA,
            data_category=DataCategory.LIVE_SCORES,
            base_ttl=30,  # Even shorter for NBA
            volatility_multiplier=0.25,  # Very volatile
            peak_hours=[20, 21, 22, 23],  # Evening/night games
            seasonal_factor=1.0,
            user_context_factor=0.8,
            game_state_factors={
                GameState.PRE_GAME: 4.0,
                GameState.LIVE: 0.4,        # Very short during fast-paced game
                GameState.HALFTIME: 3.0,
                GameState.POST_GAME: 6.0,
                GameState.DELAYED: 5.0,
                GameState.CANCELLED: 12.0
            },
            update_frequency=20
        )
        
        # NBA Live Odds - Extremely volatile (frequent scoring)
        self.volatility_profiles[(SportType.NBA, DataCategory.LIVE_ODDS)] = VolatilityProfile(
            sport=SportType.NBA,
            data_category=DataCategory.LIVE_ODDS,
            base_ttl=20,  # Very short
            volatility_multiplier=0.15,  # Extremely volatile
            peak_hours=[20, 21, 22, 23],
            seasonal_factor=1.0,
            user_context_factor=0.7,
            game_state_factors={
                GameState.PRE_GAME: 3.0,
                GameState.LIVE: 0.25,       # Extremely short during games
                GameState.HALFTIME: 2.0,
                GameState.POST_GAME: 10.0,
                GameState.DELAYED: 8.0,
                GameState.CANCELLED: 25.0
            },
            update_frequency=10
        )

    def _register_nfl_profiles(self):
        """Register NFL-specific volatility profiles"""
        
        # NFL Live Scores - Moderate volatility (slower-paced)
        self.volatility_profiles[(SportType.NFL, DataCategory.LIVE_SCORES)] = VolatilityProfile(
            sport=SportType.NFL,
            data_category=DataCategory.LIVE_SCORES,
            base_ttl=60,  # Longer than basketball
            volatility_multiplier=0.4,
            peak_hours=[13, 14, 15, 16, 17, 20, 21],  # Sunday afternoon, Monday night
            seasonal_factor=0.9,  # More important during season
            user_context_factor=0.85,
            game_state_factors={
                GameState.PRE_GAME: 5.0,
                GameState.LIVE: 0.6,
                GameState.HALFTIME: 4.0,
                GameState.POST_GAME: 8.0,
                GameState.DELAYED: 6.0,
                GameState.CANCELLED: 15.0
            },
            update_frequency=45
        )
        
        # NFL Injury Reports - High volatility (very important)
        self.volatility_profiles[(SportType.NFL, DataCategory.INJURY_REPORTS)] = VolatilityProfile(
            sport=SportType.NFL,
            data_category=DataCategory.INJURY_REPORTS,
            base_ttl=600,  # 10 minutes
            volatility_multiplier=0.5,  # High importance
            peak_hours=[12, 13, 14, 15, 16],  # Before Sunday games
            seasonal_factor=0.8,
            user_context_factor=0.8,
            game_state_factors={
                GameState.PRE_GAME: 0.5,    # Very important before games
                GameState.LIVE: 2.0,
                GameState.POST_GAME: 3.0,
            },
            update_frequency=300
        )

    def _register_nhl_profiles(self):
        """Register NHL-specific volatility profiles"""
        
        # NHL Live Scores - High volatility (fast-paced)
        self.volatility_profiles[(SportType.NHL, DataCategory.LIVE_SCORES)] = VolatilityProfile(
            sport=SportType.NHL,
            data_category=DataCategory.LIVE_SCORES,
            base_ttl=40,
            volatility_multiplier=0.35,
            peak_hours=[19, 20, 21, 22],  # Evening games
            seasonal_factor=1.0,
            user_context_factor=0.8,
            game_state_factors={
                GameState.PRE_GAME: 3.5,
                GameState.LIVE: 0.45,
                GameState.HALFTIME: 2.5,  # Between periods
                GameState.POST_GAME: 7.0,
                GameState.DELAYED: 5.0,
                GameState.CANCELLED: 12.0
            },
            update_frequency=25
        )

    async def get_dynamic_ttl(self, 
                            sport: SportType, 
                            data_category: DataCategory,
                            game_id: str = None,
                            user_id: str = None,
                            access_count: int = 1) -> int:
        """Get dynamic TTL based on sport-specific volatility model"""
        
        profile_key = (sport, data_category)
        
        if profile_key not in self.volatility_profiles:
            logger.warning(f"⚠️ No volatility profile for {sport.value}:{data_category.value}, using default")
            return 300  # Default 5 minutes
        
        profile = self.volatility_profiles[profile_key]
        
        # Get current conditions
        current_hour = datetime.now().hour
        game_state = self.game_states.get(game_id, GameState.PRE_GAME) if game_id else None
        
        # Get user access frequency
        user_access_frequency = 1
        if user_id and user_id in self.user_access_patterns:
            data_key = f"{sport.value}:{data_category.value}"
            user_access_frequency = self.user_access_patterns[user_id].get(data_key, 1)
        
        # Calculate dynamic TTL
        ttl = profile.calculate_ttl(
            current_hour=current_hour,
            game_state=game_state,
            user_context=user_id,
            access_frequency=user_access_frequency
        )
        
        logger.debug(
            f"🕒 Dynamic TTL for {sport.value}:{data_category.value} = {ttl}s "
            f"(base: {profile.base_ttl}s, game_state: {game_state.value if game_state else 'unknown'})"
        )
        
        return ttl

    async def update_game_state(self, game_id: str, state: GameState):
        """Update game state for volatility calculations"""
        old_state = self.game_states.get(game_id)
        self.game_states[game_id] = state
        
        if old_state != state:
            logger.info(f"🎮 Game {game_id} state changed: {old_state} → {state.value}")
            
            # Trigger cache invalidation for live data if game becomes live
            if state == GameState.LIVE and old_state != GameState.LIVE:
                await self._invalidate_live_data_cache(game_id)

    async def track_user_access(self, user_id: str, sport: SportType, data_category: DataCategory):
        """Track user access patterns for personalized caching"""
        if user_id not in self.user_access_patterns:
            self.user_access_patterns[user_id] = {}
        
        data_key = f"{sport.value}:{data_category.value}"
        self.user_access_patterns[user_id][data_key] = (
            self.user_access_patterns[user_id].get(data_key, 0) + 1
        )
        
        # Limit history to prevent memory bloat
        if self.user_access_patterns[user_id][data_key] > 1000:
            self.user_access_patterns[user_id][data_key] = 100  # Reset to reasonable number

    async def get_cache_warming_priorities(self, sport: SportType, current_hour: int = None) -> List[Tuple[DataCategory, int]]:
        """Get cache warming priorities based on volatility and peak hours"""
        if current_hour is None:
            current_hour = datetime.now().hour
        
        priorities = []
        
        for (sport_type, data_category), profile in self.volatility_profiles.items():
            if sport_type == sport:
                # Calculate priority score
                priority_score = 0
                
                # Higher priority for more volatile data (lower volatility_multiplier)
                priority_score += (1.0 - profile.volatility_multiplier) * 100
                
                # Higher priority during peak hours
                if current_hour in profile.peak_hours:
                    priority_score += 50
                
                # Higher priority for shorter base TTL (more frequently accessed)
                priority_score += max(0, 300 - profile.base_ttl) / 10
                
                priorities.append((data_category, int(priority_score)))
        
        # Sort by priority score (descending)
        priorities.sort(key=lambda x: x[1], reverse=True)
        
        return priorities

    async def get_seasonal_adjustment(self, sport: SportType) -> float:
        """Get seasonal adjustment factor for sport"""
        current_month = datetime.now().month
        
        # Define sport seasons (simplified)
        sport_seasons = {
            SportType.MLB: [4, 5, 6, 7, 8, 9, 10],      # April-October
            SportType.NBA: [10, 11, 12, 1, 2, 3, 4, 5], # October-May  
            SportType.NFL: [9, 10, 11, 12, 1, 2],       # September-February
            SportType.NHL: [10, 11, 12, 1, 2, 3, 4, 5]  # October-May
        }
        
        if sport in sport_seasons and current_month in sport_seasons[sport]:
            return 0.9  # 10% more aggressive caching during season
        else:
            return 1.2  # 20% longer TTL during off-season

    async def _invalidate_live_data_cache(self, game_id: str):
        """Invalidate cache for live data when game state changes"""
        try:
            from backend.services.intelligent_cache_service import intelligent_cache_service
            
            # Invalidate patterns related to live data for this game
            patterns = [
                f"*live*{game_id}*",
                f"*odds*{game_id}*",
                f"*score*{game_id}*"
            ]
            
            for pattern in patterns:
                await intelligent_cache_service.invalidate_pattern(pattern)
            
            logger.info(f"🗑️ Invalidated live data cache for game {game_id}")
            
        except Exception as e:
            logger.error(f"❌ Error invalidating live data cache: {e}")

    def get_volatility_summary(self) -> Dict[str, Any]:
        """Get summary of volatility models for monitoring"""
        summary = {
            "total_profiles": len(self.volatility_profiles),
            "sports_covered": len(set(sport for sport, _ in self.volatility_profiles.keys())),
            "data_categories_covered": len(set(category for _, category in self.volatility_profiles.keys())),
            "tracked_users": len(self.user_access_patterns),
            "active_games": len(self.game_states),
            "profiles_by_sport": {}
        }
        
        # Group profiles by sport
        for sport in SportType:
            sport_profiles = [
                (category.value, profile.base_ttl, profile.volatility_multiplier)
                for (sport_type, category), profile in self.volatility_profiles.items()
                if sport_type == sport
            ]
            summary["profiles_by_sport"][sport.value] = sport_profiles
        
        return summary

    async def optimize_for_user_behavior(self, user_id: str) -> Dict[str, Any]:
        """Get user-specific cache optimization recommendations"""
        if user_id not in self.user_access_patterns:
            return {"recommendations": "No user data available"}
        
        user_patterns = self.user_access_patterns[user_id]
        
        # Find most accessed data types
        sorted_patterns = sorted(user_patterns.items(), key=lambda x: x[1], reverse=True)
        
        recommendations = {
            "user_id": user_id,
            "top_accessed_data": sorted_patterns[:5],
            "cache_optimization": {},
            "warming_suggestions": []
        }
        
        for data_key, access_count in sorted_patterns[:3]:
            sport_str, category_str = data_key.split(":")
            sport = SportType(sport_str)
            
            # Suggest shorter TTL for frequently accessed data
            if access_count > 50:
                recommendations["cache_optimization"][data_key] = {
                    "suggested_ttl_multiplier": 0.7,
                    "reason": "Frequently accessed, user benefits from fresher data"
                }
            
            # Suggest cache warming for high-access patterns
            if access_count > 20:
                recommendations["warming_suggestions"].append({
                    "data_type": data_key,
                    "priority": "high" if access_count > 50 else "medium",
                    "reason": f"User accesses this data {access_count} times"
                })
        
        return recommendations


# Global instance
sport_volatility_models = SportVolatilityModels()
