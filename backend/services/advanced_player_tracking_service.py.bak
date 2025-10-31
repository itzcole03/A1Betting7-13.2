"""
Advanced Player Tracking Data Integration Service

This service integrates granular player movement, speed, and efficiency data
from optical tracking and wearable sensors to enhance prediction models.
Focus on data types that directly contribute to prediction accuracy.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
import aiohttp
import pandas as pd
from dataclasses import dataclass, asdict
import numpy as np
from enum import Enum
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrackingDataType(Enum):
    """Types of player tracking data available"""
    OPTICAL_TRACKING = "optical_tracking"
    WEARABLE_SENSORS = "wearable_sensors"  
    BIOMECHANICAL = "biomechanical"
    PERFORMANCE_METRICS = "performance_metrics"
    MOVEMENT_ANALYSIS = "movement_analysis"

class Sport(Enum):
    """Supported sports for tracking data"""
    NBA = "nba"
    NFL = "nfl"
    MLB = "mlb"
    NHL = "nhl"
    SOCCER = "soccer"

@dataclass
class PlayerMovementData:
    """Player movement tracking data structure"""
    player_id: str
    game_id: str
    timestamp: datetime
    position_x: float
    position_y: float
    velocity: float
    acceleration: float
    distance_covered: float
    sprint_count: int
    max_speed: float
    avg_speed: float
    direction_changes: int
    
@dataclass
class BiomechanicalData:
    """Player biomechanical data structure"""
    player_id: str
    game_id: str
    timestamp: datetime
    heart_rate: int
    muscle_fatigue_index: float
    power_output: float
    stride_length: float
    stride_frequency: float
    ground_contact_time: float
    vertical_oscillation: float
    asymmetry_score: float

@dataclass
class PerformanceEfficiencyMetrics:
    """Performance efficiency metrics from tracking data"""
    player_id: str
    game_id: str
    efficiency_score: float
    fatigue_index: float
    workload_rating: float
    recovery_status: float
    injury_risk_score: float
    predicted_performance_decline: float
    optimal_rest_time: int
    load_management_recommendation: str

class AdvancedPlayerTrackingService:
    """
    Service for integrating advanced player tracking data from multiple sources
    """
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.tracking_apis = {
            "optical_tracking": {
                "base_url": "https://api.sportvision.com/v2",
                "api_key": None,
                "rate_limit": 100  # requests per minute
            },
            "wearable_sensors": {
                "base_url": "https://api.catapultsports.com/v3", 
                "api_key": None,
                "rate_limit": 50
            },
            "biomechanical": {
                "base_url": "https://api.kinexon.com/v1",
                "api_key": None,
                "rate_limit": 75
            }
        }
        self.cache = {}
        self.cache_ttl = timedelta(minutes=5)
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def get_player_movement_data(
        self,
        player_id: str,
        game_id: str,
        data_type: TrackingDataType = TrackingDataType.OPTICAL_TRACKING
    ) -> List[PlayerMovementData]:
        """
        Retrieve player movement data from tracking systems
        
        Args:
            player_id: Unique player identifier
            game_id: Unique game identifier  
            data_type: Type of tracking data to retrieve
            
        Returns:
            List of PlayerMovementData objects
        """
        cache_key = f"movement_{player_id}_{game_id}_{data_type.value}"
        
        # Check cache first
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl:
                logger.info(f"Returning cached movement data for {player_id}")
                return cached_data
                
        try:
            # Simulate API call - replace with actual API integration
            movement_data = await self._fetch_movement_data(player_id, game_id, data_type)
            
            # Cache the result
            self.cache[cache_key] = (movement_data, datetime.now())
            
            logger.info(f"Retrieved {len(movement_data)} movement data points for player {player_id}")
            return movement_data
            
        except Exception as e:
            logger.error(f"Error fetching movement data for {player_id}: {str(e)}")
            return []

    async def _fetch_movement_data(
        self,
        player_id: str,
        game_id: str,
        data_type: TrackingDataType
    ) -> List[PlayerMovementData]:
        """Fetch movement data from external API"""
        
        # Simulate realistic tracking data
        movement_data = []
        base_time = datetime.now() - timedelta(hours=2)
        
        for i in range(100):  # 100 data points per game
            timestamp = base_time + timedelta(seconds=i * 30)
            
            data_point = PlayerMovementData(
                player_id=player_id,
                game_id=game_id,
                timestamp=timestamp,
                position_x=np.random.uniform(0, 100),
                position_y=np.random.uniform(0, 50),
                velocity=np.random.uniform(0, 15),  # m/s
                acceleration=np.random.uniform(-3, 3),  # m/s²
                distance_covered=np.random.uniform(50, 200),  # meters
                sprint_count=np.random.randint(0, 5),
                max_speed=np.random.uniform(10, 20),  # m/s
                avg_speed=np.random.uniform(5, 12),  # m/s
                direction_changes=np.random.randint(0, 10)
            )
            movement_data.append(data_point)
            
        return movement_data

    async def get_biomechanical_data(
        self,
        player_id: str,
        game_id: str
    ) -> List[BiomechanicalData]:
        """
        Retrieve biomechanical data from wearable sensors
        
        Args:
            player_id: Unique player identifier
            game_id: Unique game identifier
            
        Returns:
            List of BiomechanicalData objects
        """
        cache_key = f"biomech_{player_id}_{game_id}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl:
                return cached_data
                
        try:
            biomech_data = await self._fetch_biomechanical_data(player_id, game_id)
            
            # Cache the result
            self.cache[cache_key] = (biomech_data, datetime.now())
            
            logger.info(f"Retrieved {len(biomech_data)} biomechanical data points for player {player_id}")
            return biomech_data
            
        except Exception as e:
            logger.error(f"Error fetching biomechanical data for {player_id}: {str(e)}")
            return []

    async def _fetch_biomechanical_data(
        self,
        player_id: str,
        game_id: str
    ) -> List[BiomechanicalData]:
        """Fetch biomechanical data from wearable sensors"""
        
        biomech_data = []
        base_time = datetime.now() - timedelta(hours=2)
        
        for i in range(50):  # 50 data points per game
            timestamp = base_time + timedelta(minutes=i * 2)
            
            data_point = BiomechanicalData(
                player_id=player_id,
                game_id=game_id,
                timestamp=timestamp,
                heart_rate=np.random.randint(120, 180),
                muscle_fatigue_index=np.random.uniform(0, 1),
                power_output=np.random.uniform(200, 800),  # watts
                stride_length=np.random.uniform(0.8, 1.5),  # meters
                stride_frequency=np.random.uniform(150, 200),  # steps/min
                ground_contact_time=np.random.uniform(200, 350),  # milliseconds
                vertical_oscillation=np.random.uniform(6, 15),  # cm
                asymmetry_score=np.random.uniform(0, 20)  # percentage
            )
            biomech_data.append(data_point)
            
        return biomech_data

    async def calculate_performance_efficiency(
        self,
        player_id: str,
        game_id: str,
        sport: Sport
    ) -> PerformanceEfficiencyMetrics:
        """
        Calculate performance efficiency metrics from tracking data
        
        Args:
            player_id: Unique player identifier
            game_id: Unique game identifier
            sport: Sport type for sport-specific calculations
            
        Returns:
            PerformanceEfficiencyMetrics object
        """
        try:
            # Get movement and biomechanical data
            movement_data = await self.get_player_movement_data(player_id, game_id)
            biomech_data = await self.get_biomechanical_data(player_id, game_id)
            
            if not movement_data or not biomech_data:
                logger.warning(f"Insufficient data for efficiency calculation: {player_id}")
                return self._default_efficiency_metrics(player_id, game_id)
            
            # Calculate efficiency metrics
            efficiency_score = self._calculate_efficiency_score(movement_data, biomech_data, sport)
            fatigue_index = self._calculate_fatigue_index(biomech_data)
            workload_rating = self._calculate_workload_rating(movement_data, biomech_data)
            recovery_status = self._calculate_recovery_status(biomech_data)
            injury_risk = self._calculate_injury_risk(movement_data, biomech_data)
            performance_decline = self._predict_performance_decline(movement_data, biomech_data)
            
            # Generate recommendations
            optimal_rest = self._calculate_optimal_rest_time(fatigue_index, workload_rating)
            load_management = self._generate_load_management_recommendation(
                efficiency_score, fatigue_index, injury_risk
            )
            
            return PerformanceEfficiencyMetrics(
                player_id=player_id,
                game_id=game_id,
                efficiency_score=efficiency_score,
                fatigue_index=fatigue_index,
                workload_rating=workload_rating,
                recovery_status=recovery_status,
                injury_risk_score=injury_risk,
                predicted_performance_decline=performance_decline,
                optimal_rest_time=optimal_rest,
                load_management_recommendation=load_management
            )
            
        except Exception as e:
            logger.error(f"Error calculating efficiency metrics for {player_id}: {str(e)}")
            return self._default_efficiency_metrics(player_id, game_id)

    def _calculate_efficiency_score(
        self,
        movement_data: List[PlayerMovementData],
        biomech_data: List[BiomechanicalData],
        sport: Sport
    ) -> float:
        """Calculate overall efficiency score"""
        
        # Movement efficiency
        avg_velocity = np.mean([d.velocity for d in movement_data])
        total_distance = sum([d.distance_covered for d in movement_data])
        direction_changes = sum([d.direction_changes for d in movement_data])
        
        # Biomechanical efficiency  
        avg_heart_rate = np.mean([d.heart_rate for d in biomech_data])
        avg_power_output = np.mean([d.power_output for d in biomech_data])
        avg_fatigue = np.mean([d.muscle_fatigue_index for d in biomech_data])
        
        # Sport-specific weights
        sport_weights = {
            Sport.NBA: {"velocity": 0.3, "endurance": 0.25, "power": 0.25, "fatigue": 0.2},
            Sport.NFL: {"velocity": 0.4, "endurance": 0.2, "power": 0.3, "fatigue": 0.1},
            Sport.MLB: {"velocity": 0.2, "endurance": 0.3, "power": 0.35, "fatigue": 0.15},
            Sport.NHL: {"velocity": 0.35, "endurance": 0.3, "power": 0.25, "fatigue": 0.1},
            Sport.SOCCER: {"velocity": 0.25, "endurance": 0.4, "power": 0.2, "fatigue": 0.15}
        }
        
        weights = sport_weights.get(sport, sport_weights[Sport.NBA])
        
        # Normalize metrics (0-1 scale)
        velocity_score = min(avg_velocity / 15, 1.0)  # Normalize to max 15 m/s
        endurance_score = min(total_distance / 10000, 1.0)  # Normalize to 10km
        power_score = min(avg_power_output / 1000, 1.0)  # Normalize to 1000W
        fatigue_score = 1.0 - avg_fatigue  # Invert fatigue (lower is better)
        
        efficiency_score = (
            velocity_score * weights["velocity"] +
            endurance_score * weights["endurance"] +
            power_score * weights["power"] +
            fatigue_score * weights["fatigue"]
        )
        
        return round(efficiency_score, 3)

    def _calculate_fatigue_index(self, biomech_data: List[BiomechanicalData]) -> float:
        """Calculate fatigue index from biomechanical data"""
        if not biomech_data:
            return 0.5
            
        fatigue_scores = [d.muscle_fatigue_index for d in biomech_data]
        heart_rates = [d.heart_rate for d in biomech_data]
        
        # Trend analysis - increasing fatigue over time
        fatigue_trend = np.polyfit(range(len(fatigue_scores)), fatigue_scores, 1)[0]
        hr_trend = np.polyfit(range(len(heart_rates)), heart_rates, 1)[0]
        
        # Combine current fatigue with trends
        current_fatigue = np.mean(fatigue_scores[-5:])  # Last 5 measurements
        trend_factor = max(fatigue_trend, 0) * 0.5 + max(hr_trend / 200, 0) * 0.3
        
        total_fatigue = current_fatigue + trend_factor
        return round(min(total_fatigue, 1.0), 3)

    def _calculate_workload_rating(
        self,
        movement_data: List[PlayerMovementData],
        biomech_data: List[BiomechanicalData]
    ) -> float:
        """Calculate workload rating"""
        
        # Movement workload
        total_distance = sum([d.distance_covered for d in movement_data])
        sprint_count = sum([d.sprint_count for d in movement_data])
        direction_changes = sum([d.direction_changes for d in movement_data])
        
        # Physiological workload
        avg_heart_rate = np.mean([d.heart_rate for d in biomech_data])
        avg_power_output = np.mean([d.power_output for d in biomech_data])
        
        # Normalize and combine
        distance_score = min(total_distance / 8000, 1.0)  # 8km max
        sprint_score = min(sprint_count / 50, 1.0)  # 50 sprints max
        change_score = min(direction_changes / 200, 1.0)  # 200 changes max
        hr_score = min((avg_heart_rate - 60) / 120, 1.0)  # HR range 60-180
        power_score = min(avg_power_output / 800, 1.0)  # 800W max
        
        workload = (
            distance_score * 0.25 +
            sprint_score * 0.2 +
            change_score * 0.15 +
            hr_score * 0.2 +
            power_score * 0.2
        )
        
        return round(workload, 3)

    def _calculate_recovery_status(self, biomech_data: List[BiomechanicalData]) -> float:
        """Calculate recovery status"""
        if not biomech_data:
            return 0.7
            
        # Heart rate variability proxy
        heart_rates = [d.heart_rate for d in biomech_data]
        hr_variance = np.var(heart_rates)
        
        # Ground contact time consistency (indicator of freshness)
        contact_times = [d.ground_contact_time for d in biomech_data]
        contact_consistency = 1.0 - (np.std(contact_times) / np.mean(contact_times))
        
        # Power output consistency
        power_outputs = [d.power_output for d in biomech_data]
        power_consistency = 1.0 - (np.std(power_outputs) / np.mean(power_outputs))
        
        recovery_score = (
            min(hr_variance / 400, 1.0) * 0.3 +  # Higher variance = better recovery
            contact_consistency * 0.35 +
            power_consistency * 0.35
        )
        
        return round(min(recovery_score, 1.0), 3)

    def _calculate_injury_risk(
        self,
        movement_data: List[PlayerMovementData],
        biomech_data: List[BiomechanicalData]
    ) -> float:
        """Calculate injury risk score"""
        
        # Movement asymmetry
        asymmetry_scores = [d.asymmetry_score for d in biomech_data]
        avg_asymmetry = np.mean(asymmetry_scores)
        
        # Fatigue accumulation
        fatigue_scores = [d.muscle_fatigue_index for d in biomech_data]
        fatigue_accumulation = np.mean(fatigue_scores[-10:])  # Recent fatigue
        
        # Load spikes
        velocities = [d.velocity for d in movement_data]
        velocity_spikes = len([v for v in velocities if v > np.mean(velocities) + 2 * np.std(velocities)])
        
        # Combine risk factors
        asymmetry_risk = min(avg_asymmetry / 20, 1.0)  # 20% max asymmetry
        fatigue_risk = fatigue_accumulation
        spike_risk = min(velocity_spikes / 20, 1.0)  # 20 spikes max
        
        injury_risk = (
            asymmetry_risk * 0.4 +
            fatigue_risk * 0.4 +
            spike_risk * 0.2
        )
        
        return round(injury_risk, 3)

    def _predict_performance_decline(
        self,
        movement_data: List[PlayerMovementData],
        biomech_data: List[BiomechanicalData]
    ) -> float:
        """Predict performance decline over next period"""
        
        # Velocity trend
        velocities = [d.velocity for d in movement_data]
        velocity_trend = np.polyfit(range(len(velocities)), velocities, 1)[0]
        
        # Power output trend
        power_outputs = [d.power_output for d in biomech_data]
        power_trend = np.polyfit(range(len(power_outputs)), power_outputs, 1)[0]
        
        # Fatigue accumulation
        fatigue_scores = [d.muscle_fatigue_index for d in biomech_data]
        fatigue_trend = np.polyfit(range(len(fatigue_scores)), fatigue_scores, 1)[0]
        
        # Predict decline (negative trends indicate decline)
        velocity_decline = max(-velocity_trend / 5, 0)  # Normalize to velocity scale
        power_decline = max(-power_trend / 200, 0)  # Normalize to power scale
        fatigue_increase = max(fatigue_trend * 2, 0)  # Amplify fatigue impact
        
        performance_decline = (
            velocity_decline * 0.4 +
            power_decline * 0.35 +
            fatigue_increase * 0.25
        )
        
        return round(min(performance_decline, 1.0), 3)

    def _calculate_optimal_rest_time(self, fatigue_index: float, workload_rating: float) -> int:
        """Calculate optimal rest time in hours"""
        
        # Base rest time
        base_rest = 12  # 12 hours minimum
        
        # Fatigue adjustment
        fatigue_hours = fatigue_index * 24  # Up to 24 additional hours
        
        # Workload adjustment
        workload_hours = workload_rating * 12  # Up to 12 additional hours
        
        total_rest = base_rest + fatigue_hours + workload_hours
        return int(min(total_rest, 72))  # Cap at 72 hours

    def _generate_load_management_recommendation(
        self,
        efficiency_score: float,
        fatigue_index: float,
        injury_risk: float
    ) -> str:
        """Generate load management recommendation"""
        
        if injury_risk > 0.7:
            return "HIGH RISK: Immediate rest recommended. Consider medical evaluation."
        elif fatigue_index > 0.8:
            return "MODERATE RISK: Reduce training intensity. Focus on recovery protocols."
        elif efficiency_score < 0.4:
            return "LOW EFFICIENCY: Implement technique training. Reduce volume temporarily."
        elif efficiency_score > 0.8 and fatigue_index < 0.3:
            return "OPTIMAL: Maintain current training load. Monitor for changes."
        else:
            return "MODERATE: Standard training protocols. Monitor fatigue accumulation."

    def _default_efficiency_metrics(self, player_id: str, game_id: str) -> PerformanceEfficiencyMetrics:
        """Return default metrics when data is unavailable"""
        return PerformanceEfficiencyMetrics(
            player_id=player_id,
            game_id=game_id,
            efficiency_score=0.6,
            fatigue_index=0.5,
            workload_rating=0.5,
            recovery_status=0.7,
            injury_risk_score=0.3,
            predicted_performance_decline=0.2,
            optimal_rest_time=24,
            load_management_recommendation="INSUFFICIENT DATA: Monitor manually."
        )

    async def get_sport_specific_insights(
        self,
        player_id: str,
        sport: Sport,
        position: str
    ) -> Dict[str, Any]:
        """
        Get sport-specific insights based on tracking data
        
        Args:
            player_id: Unique player identifier
            sport: Sport type
            position: Player position
            
        Returns:
            Dictionary with sport-specific insights
        """
        try:
            insights = {
                "sport": sport.value,
                "position": position,
                "key_metrics": [],
                "performance_indicators": {},
                "tactical_insights": []
            }
            
            if sport == Sport.NBA:
                insights.update(await self._get_nba_insights(player_id, position))
            elif sport == Sport.NFL:
                insights.update(await self._get_nfl_insights(player_id, position))
            elif sport == Sport.MLB:
                insights.update(await self._get_mlb_insights(player_id, position))
            elif sport == Sport.NHL:
                insights.update(await self._get_nhl_insights(player_id, position))
            elif sport == Sport.SOCCER:
                insights.update(await self._get_soccer_insights(player_id, position))
                
            return insights
            
        except Exception as e:
            logger.error(f"Error getting sport-specific insights for {player_id}: {str(e)}")
            return {"error": str(e)}

    async def _get_nba_insights(self, player_id: str, position: str) -> Dict[str, Any]:
        """NBA-specific tracking insights"""
        return {
            "key_metrics": ["shot_mechanics", "defensive_positioning", "court_coverage"],
            "performance_indicators": {
                "shot_release_consistency": np.random.uniform(0.7, 0.95),
                "defensive_reaction_time": np.random.uniform(0.2, 0.5),
                "court_vision_score": np.random.uniform(0.6, 0.9)
            },
            "tactical_insights": [
                "Optimal shooting zones based on movement patterns",
                "Defensive positioning effectiveness",
                "Transition speed analytics"
            ]
        }

    async def _get_nfl_insights(self, player_id: str, position: str) -> Dict[str, Any]:
        """NFL-specific tracking insights"""
        return {
            "key_metrics": ["acceleration", "route_precision", "contact_force"],
            "performance_indicators": {
                "first_step_quickness": np.random.uniform(0.1, 0.3),
                "route_separation": np.random.uniform(0.5, 2.5),
                "impact_force": np.random.uniform(500, 1500)
            },
            "tactical_insights": [
                "Route efficiency and separation",
                "Collision impact analysis", 
                "Field position optimization"
            ]
        }

    async def _get_mlb_insights(self, player_id: str, position: str) -> Dict[str, Any]:
        """MLB-specific tracking insights"""
        return {
            "key_metrics": ["swing_mechanics", "field_coverage", "reaction_time"],
            "performance_indicators": {
                "bat_speed": np.random.uniform(70, 85),
                "fielding_range": np.random.uniform(2.0, 4.5),
                "pitch_recognition": np.random.uniform(0.6, 0.9)
            },
            "tactical_insights": [
                "Swing path optimization",
                "Defensive positioning effectiveness",
                "Base running efficiency"
            ]
        }

    async def _get_nhl_insights(self, player_id: str, position: str) -> Dict[str, Any]:
        """NHL-specific tracking insights"""
        return {
            "key_metrics": ["skating_efficiency", "puck_handling", "ice_coverage"],
            "performance_indicators": {
                "stride_power": np.random.uniform(0.7, 1.0),
                "puck_control_time": np.random.uniform(0.3, 1.2),
                "zone_coverage": np.random.uniform(0.6, 0.95)
            },
            "tactical_insights": [
                "Skating mechanics optimization",
                "Puck possession patterns",
                "Zone coverage efficiency"
            ]
        }

    async def _get_soccer_insights(self, player_id: str, position: str) -> Dict[str, Any]:
        """Soccer-specific tracking insights"""
        return {
            "key_metrics": ["running_efficiency", "ball_control", "field_coverage"],
            "performance_indicators": {
                "sprint_frequency": np.random.uniform(15, 35),
                "touch_efficiency": np.random.uniform(0.7, 0.95),
                "heat_map_coverage": np.random.uniform(0.6, 0.9)
            },
            "tactical_insights": [
                "Running pattern optimization",
                "Ball control in pressure situations",
                "Positional discipline analysis"
            ]
        }

    async def get_real_time_tracking_feed(
        self,
        game_id: str,
        update_interval: int = 5
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Get real-time tracking data feed for live games
        
        Args:
            game_id: Unique game identifier
            update_interval: Update interval in seconds
            
        Yields:
            Real-time tracking data updates
        """
        try:
            while True:
                # Simulate real-time data feed
                tracking_update = {
                    "game_id": game_id,
                    "timestamp": datetime.now().isoformat(),
                    "players": []
                }
                
                # Generate data for 10 players
                for i in range(10):
                    player_data = {
                        "player_id": f"player_{i+1}",
                        "position": {"x": np.random.uniform(0, 100), "y": np.random.uniform(0, 50)},
                        "velocity": np.random.uniform(0, 15),
                        "heart_rate": np.random.randint(120, 180),
                        "fatigue_index": np.random.uniform(0, 1),
                        "efficiency_score": np.random.uniform(0.3, 1.0)
                    }
                    tracking_update["players"].append(player_data)
                
                yield tracking_update
                await asyncio.sleep(update_interval)
                
        except Exception as e:
            logger.error(f"Error in real-time tracking feed: {str(e)}")
            yield {"error": str(e)}

# Usage example and testing
async def main():
    """Example usage of the Advanced Player Tracking Service"""
    
    async with AdvancedPlayerTrackingService() as tracking_service:
        
        # Example 1: Get player movement data
        movement_data = await tracking_service.get_player_movement_data(
            player_id="lebron_james",
            game_id="game_123",
            data_type=TrackingDataType.OPTICAL_TRACKING
        )
        print(f"Retrieved {len(movement_data)} movement data points")
        
        # Example 2: Get biomechanical data
        biomech_data = await tracking_service.get_biomechanical_data(
            player_id="lebron_james",
            game_id="game_123"
        )
        print(f"Retrieved {len(biomech_data)} biomechanical data points")
        
        # Example 3: Calculate performance efficiency
        efficiency_metrics = await tracking_service.calculate_performance_efficiency(
            player_id="lebron_james",
            game_id="game_123",
            sport=Sport.NBA
        )
        print(f"Efficiency Score: {efficiency_metrics.efficiency_score}")
        print(f"Fatigue Index: {efficiency_metrics.fatigue_index}")
        print(f"Injury Risk: {efficiency_metrics.injury_risk_score}")
        print(f"Load Management: {efficiency_metrics.load_management_recommendation}")
        
        # Example 4: Get sport-specific insights
        insights = await tracking_service.get_sport_specific_insights(
            player_id="lebron_james",
            sport=Sport.NBA,
            position="Small Forward"
        )
        print(f"NBA Insights: {insights}")

if __name__ == "__main__":
    asyncio.run(main())
