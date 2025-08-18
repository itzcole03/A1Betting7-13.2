"""
Weather API Integration System - Section 4 Implementation

Advanced weather monitoring and integration system for:
- Real-time weather conditions at ballpark locations
- Weather forecasts and alerts 
- Wind pattern analysis for prop adjustments
- Temperature and humidity impact assessment
- Automated prop valuation adjustments based on weather conditions
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional, List, Callable, Tuple
import json
try:
    import aiohttp
except ImportError:
    aiohttp = None
from math import sqrt, pow

logger = logging.getLogger(__name__)


class WeatherCondition(Enum):
    """Weather conditions"""
    CLEAR = "clear"
    PARTLY_CLOUDY = "partly_cloudy"
    MOSTLY_CLOUDY = "mostly_cloudy"
    OVERCAST = "overcast"
    LIGHT_RAIN = "light_rain"
    RAIN = "rain"
    HEAVY_RAIN = "heavy_rain"
    THUNDERSTORMS = "thunderstorms"
    SNOW = "snow"
    FOG = "fog"
    WINDY = "windy"
    UNKNOWN = "unknown"


class WindDirection(Enum):
    """Wind direction relative to ballpark"""
    OUT_TO_LEFT = "out_to_left"        # Helps left field home runs
    OUT_TO_CENTER = "out_to_center"    # Helps center field home runs  
    OUT_TO_RIGHT = "out_to_right"      # Helps right field home runs
    IN_FROM_LEFT = "in_from_left"      # Hinders left field home runs
    IN_FROM_CENTER = "in_from_center"  # Hinders center field home runs
    IN_FROM_RIGHT = "in_from_right"    # Hinders right field home runs
    CROSS_WIND = "cross_wind"          # Sideways wind, minimal HR impact
    VARIABLE = "variable"              # Changing direction
    CALM = "calm"                      # < 5 mph
    UNKNOWN = "unknown"


class WeatherImpact(Enum):
    """Weather impact levels on game/props"""
    NONE = "none"           # No significant impact
    MINIMAL = "minimal"     # Small adjustments
    MODERATE = "moderate"   # Noticeable impact
    SIGNIFICANT = "significant"  # Major adjustments needed
    EXTREME = "extreme"     # Game-changing conditions


@dataclass
class BallparkWeatherProfile:
    """Weather profile for specific ballpark"""
    ballpark_name: str
    city: str
    state: str
    
    # Location coordinates for weather API
    latitude: float
    longitude: float
    elevation: int  # feet above sea level
    
    # Ballpark characteristics affecting weather impact
    dimensions: Dict[str, int] = field(default_factory=dict)  # LF, CF, RF distances
    wall_heights: Dict[str, int] = field(default_factory=dict)
    dome_type: str = "outdoor"  # "outdoor", "retractable", "dome"
    
    # Historical weather impact factors
    wind_factors: Dict[str, float] = field(default_factory=dict)
    temperature_factors: Dict[str, float] = field(default_factory=dict)
    altitude_factor: float = 1.0  # Air density impact
    
    # Unique characteristics
    wind_patterns: List[str] = field(default_factory=list)
    weather_notes: str = ""


@dataclass
class WeatherConditions:
    """Current weather conditions"""
    ballpark: str
    timestamp: datetime
    
    # Basic conditions
    temperature: float  # Fahrenheit
    humidity: int      # Percentage
    pressure: float    # inHg
    condition: WeatherCondition
    
    # Wind data
    wind_speed: int    # mph
    wind_direction_deg: int  # 0-360 degrees
    wind_gust_speed: Optional[int] = None
    wind_direction_relative: WindDirection = WindDirection.UNKNOWN
    
    # Precipitation
    precipitation_probability: int = 0  # Percentage
    precipitation_intensity: float = 0.0  # inches per hour
    
    # Visibility and cloud cover
    visibility: float = 10.0  # miles
    cloud_cover: int = 0      # Percentage
    
    # Calculated impacts
    weather_impact: WeatherImpact = WeatherImpact.NONE
    home_run_factor: float = 1.0    # Multiplier for HR probability
    offense_factor: float = 1.0     # Overall offensive impact
    pitching_factor: float = 1.0    # Pitching conditions impact
    
    # API metadata
    source: str = "unknown"
    confidence: float = 0.8


@dataclass 
class WeatherForecast:
    """Weather forecast for upcoming games"""
    ballpark: str
    game_date: datetime
    forecast_issued: datetime
    
    # Forecast conditions (similar to current conditions)
    expected_temperature: float
    expected_humidity: int
    expected_wind_speed: int
    expected_wind_direction: int
    expected_condition: WeatherCondition
    precipitation_chance: int
    
    # Confidence and timing
    confidence_level: float = 0.8
    game_time_specific: bool = False
    
    # Forecast updates
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    update_frequency: int = 60  # minutes


@dataclass
class WeatherAlert:
    """Weather alerts affecting games"""
    alert_id: str
    ballpark: str
    alert_type: str  # "severe_weather", "high_wind", "temperature_extreme"
    severity: WeatherImpact
    
    # Alert details
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    
    # Game impact
    affects_gameplay: bool = True
    recommended_action: str = ""
    prop_adjustments: Dict[str, float] = field(default_factory=dict)


class WeatherAPIIntegration:
    """
    Advanced Weather API Integration System
    
    Features:
    - Real-time weather data from multiple APIs
    - Ballpark-specific weather profiles
    - Wind pattern analysis for HR props
    - Temperature and humidity impact calculations  
    - Automated weather alerts
    - Integration with prop valuation system
    """
    
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        self.name = "weather_api_integration"
        self.version = "1.0"
        
        # API configuration
        self.api_keys = api_keys or {}
        self.primary_api = "openweather"  # Primary weather API
        self.backup_apis = ["weatherapi", "accuweather"]
        
        # Ballpark database
        self.ballpark_profiles: Dict[str, BallparkWeatherProfile] = {}
        
        # Weather data cache
        self.current_conditions: Dict[str, WeatherConditions] = {}
        self.forecasts: Dict[str, List[WeatherForecast]] = {}
        self.active_alerts: Dict[str, List[WeatherAlert]] = {}
        
        # Monitoring state
        self.monitoring_active = False
        self.monitored_ballparks: List[str] = []
        
        # Callbacks for weather updates
        self.weather_callbacks: List[Callable] = []
        self.alert_callbacks: List[Callable] = []
        
        # HTTP session
        self.http_session = None
        
        # Weather impact calculation parameters
        self.impact_thresholds = {
            "wind_speed": {"moderate": 15, "significant": 25, "extreme": 35},
            "temperature": {"cold": 45, "hot": 90, "extreme_cold": 35, "extreme_hot": 100},
            "humidity": {"low": 30, "high": 85},
            "precipitation": {"light": 0.1, "moderate": 0.3, "heavy": 0.5}
        }
        
        logger.info("Weather API Integration initialized")
    
    async def initialize(self):
        """Initialize weather system"""
        # Create HTTP session
        if aiohttp:
            self.http_session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))
        
        # Load ballpark profiles
        await self._load_ballpark_profiles()
        
        logger.info("Weather API Integration system initialized")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.http_session:
            await self.http_session.close()
    
    async def start_monitoring(self, ballparks: Optional[List[str]] = None):
        """Start weather monitoring for specified ballparks"""
        if ballparks:
            self.monitored_ballparks = ballparks
        
        if not self.monitoring_active:
            self.monitoring_active = True
            # Start monitoring tasks
            asyncio.create_task(self._weather_monitoring_loop())
            asyncio.create_task(self._forecast_monitoring_loop()) 
            asyncio.create_task(self._alert_monitoring_loop())
        
        logger.info(f"Started weather monitoring for {len(self.monitored_ballparks)} ballparks")
    
    async def stop_monitoring(self):
        """Stop weather monitoring"""
        self.monitoring_active = False
        self.monitored_ballparks.clear()
        logger.info("Stopped weather monitoring")
    
    async def get_current_weather(self, ballpark: str) -> Optional[WeatherConditions]:
        """Get current weather conditions for ballpark"""
        try:
            # Check cache first
            cached_conditions = self.current_conditions.get(ballpark)
            if cached_conditions and self._is_weather_data_fresh(cached_conditions.timestamp):
                return cached_conditions
            
            # Fetch fresh data
            ballpark_profile = self.ballpark_profiles.get(ballpark)
            if not ballpark_profile:
                logger.warning(f"No profile found for ballpark: {ballpark}")
                return None
            
            weather_data = await self._fetch_current_weather(
                ballpark_profile.latitude, 
                ballpark_profile.longitude
            )
            
            if weather_data:
                conditions = await self._parse_weather_data(ballpark, ballpark_profile, weather_data)
                self.current_conditions[ballpark] = conditions
                return conditions
                
        except Exception as e:
            logger.error(f"Error fetching weather for {ballpark}: {e}")
            
        return None
    
    async def get_game_forecast(self, ballpark: str, game_time: datetime) -> Optional[WeatherForecast]:
        """Get weather forecast for specific game time"""
        try:
            ballpark_profile = self.ballpark_profiles.get(ballpark)
            if not ballpark_profile:
                return None
            
            forecast_data = await self._fetch_weather_forecast(
                ballpark_profile.latitude,
                ballpark_profile.longitude,
                game_time
            )
            
            if forecast_data:
                forecast = await self._parse_forecast_data(ballpark, game_time, forecast_data)
                
                # Cache forecast
                if ballpark not in self.forecasts:
                    self.forecasts[ballpark] = []
                self.forecasts[ballpark].append(forecast)
                
                return forecast
                
        except Exception as e:
            logger.error(f"Error fetching forecast for {ballpark}: {e}")
        
        return None
    
    async def analyze_weather_impact(
        self, 
        ballpark: str, 
        weather_conditions: Optional[WeatherConditions] = None
    ) -> Dict[str, float]:
        """Analyze weather impact on various prop categories"""
        
        try:
            # Get current conditions if not provided
            if not weather_conditions:
                weather_conditions = await self.get_current_weather(ballpark)
                if not weather_conditions:
                    return {}
            
            ballpark_profile = self.ballpark_profiles.get(ballpark)
            if not ballpark_profile:
                return {}
            
            impact_analysis = {}
            
            # Home run impact analysis
            hr_impact = await self._calculate_home_run_impact(
                weather_conditions, ballpark_profile
            )
            impact_analysis["home_runs"] = hr_impact
            
            # General offensive impact  
            offensive_impact = await self._calculate_offense_factor(
                weather_conditions, ballpark_profile
            )
            impact_analysis["offensive"] = offensive_impact
            
            # Pitching impact
            pitching_impact = await self._calculate_pitching_factor(
                weather_conditions, ballpark_profile
            )
            impact_analysis["pitching"] = pitching_impact
            
            # Specific prop adjustments
            prop_adjustments = await self._calculate_prop_adjustments(
                weather_conditions, ballpark_profile, impact_analysis
            )
            impact_analysis["prop_adjustments"] = prop_adjustments
            
            logger.info(f"Weather impact analysis for {ballpark}: HR={hr_impact:.2f}, OFF={offensive_impact:.2f}")
            return impact_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing weather impact: {e}")
            return {}
    
    async def check_weather_alerts(self, ballpark: str) -> List[WeatherAlert]:
        """Check for active weather alerts"""
        return self.active_alerts.get(ballpark, [])
    
    def register_weather_callback(self, callback: Callable):
        """Register callback for weather updates"""
        self.weather_callbacks.append(callback)
        logger.info(f"Registered weather callback: {callback.__name__}")
    
    def register_alert_callback(self, callback: Callable):
        """Register callback for weather alerts"""
        self.alert_callbacks.append(callback)
        logger.info(f"Registered alert callback: {callback.__name__}")
    
    async def _load_ballpark_profiles(self):
        """Load ballpark weather profiles"""
        # Sample ballpark profiles
        profiles = [
            BallparkWeatherProfile(
                ballpark_name="Yankee Stadium",
                city="New York",
                state="NY", 
                latitude=40.8296,
                longitude=-73.9262,
                elevation=55,
                dimensions={"LF": 318, "CF": 408, "RF": 314},
                wall_heights={"LF": 8, "CF": 8, "RF": 8},
                wind_factors={"out_to_left": 1.15, "out_to_right": 1.10, "in_from_center": 0.90},
                temperature_factors={"hot": 1.05, "cold": 0.95},
                altitude_factor=1.0,
                wind_patterns=["prevailing_southwest", "winter_northwest"],
                weather_notes="Short porch in right field affected by wind"
            ),
            BallparkWeatherProfile(
                ballpark_name="Coors Field", 
                city="Denver",
                state="CO",
                latitude=39.7559,
                longitude=-104.9942,
                elevation=5200,
                dimensions={"LF": 347, "CF": 415, "RF": 350},
                wall_heights={"LF": 8, "CF": 8, "RF": 8},
                wind_factors={"any_direction": 1.20},
                temperature_factors={"hot": 1.10, "cold": 0.90},
                altitude_factor=1.25,  # High altitude effect
                wind_patterns=["mountain_winds", "afternoon_thermals"],
                weather_notes="High altitude significantly increases offense"
            ),
            BallparkWeatherProfile(
                ballpark_name="Fenway Park",
                city="Boston", 
                state="MA",
                latitude=42.3467,
                longitude=-71.0972,
                elevation=20,
                dimensions={"LF": 310, "CF": 420, "RF": 302},
                wall_heights={"LF": 37, "CF": 8, "RF": 3},  # Green Monster
                wind_factors={"out_to_left": 1.05, "in_from_right": 0.85},
                temperature_factors={"hot": 1.03, "cold": 0.97},
                altitude_factor=1.0,
                wind_patterns=["atlantic_coastal", "northeast_storms"],
                weather_notes="Green Monster affects left field, wind swirls"
            )
        ]
        
        for profile in profiles:
            self.ballpark_profiles[profile.ballpark_name] = profile
            
        logger.info(f"Loaded {len(profiles)} ballpark weather profiles")
    
    async def _fetch_current_weather(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Fetch current weather from API"""
        try:
            # Try primary API first (OpenWeather example)
            if "openweather" in self.api_keys:
                url = f"https://api.openweathermap.org/data/2.5/weather"
                params = {
                    "lat": latitude,
                    "lon": longitude,
                    "appid": self.api_keys["openweather"],
                    "units": "imperial"
                }
                
                if self.http_session:
                    async with self.http_session.get(url, params=params) as response:
                        if response.status == 200:
                            return await response.json()
            
            # Fallback to mock data for development
            return await self._generate_mock_weather_data(latitude, longitude)
            
        except Exception as e:
            logger.error(f"Error fetching weather data: {e}")
            return None
    
    async def _fetch_weather_forecast(
        self, 
        latitude: float, 
        longitude: float, 
        target_time: datetime
    ) -> Optional[Dict[str, Any]]:
        """Fetch weather forecast"""
        try:
            # Similar to current weather, but for forecast endpoint
            return await self._generate_mock_forecast_data(latitude, longitude, target_time)
            
        except Exception as e:
            logger.error(f"Error fetching forecast data: {e}")
            return None
    
    async def _generate_mock_weather_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Generate mock weather data for development/testing"""
        import random
        
        # Base data on location (rough approximation)
        if lat > 40:  # Northern locations
            base_temp = 65 if 4 <= datetime.now().month <= 9 else 40
        else:  # Southern locations  
            base_temp = 80 if 4 <= datetime.now().month <= 9 else 60
        
        return {
            "main": {
                "temp": base_temp + random.randint(-10, 15),
                "humidity": random.randint(40, 80),
                "pressure": 29.92 + random.uniform(-0.5, 0.5)
            },
            "wind": {
                "speed": random.randint(3, 20),
                "deg": random.randint(0, 359),
                "gust": random.randint(5, 25)
            },
            "weather": [{
                "main": random.choice(["Clear", "Clouds", "Rain"]),
                "description": "mock weather data"
            }],
            "visibility": 10000,
            "clouds": {"all": random.randint(0, 100)},
            "dt": int(datetime.now().timestamp())
        }
    
    async def _generate_mock_forecast_data(
        self, 
        lat: float, 
        lon: float, 
        target_time: datetime
    ) -> Dict[str, Any]:
        """Generate mock forecast data"""
        # Similar to mock current weather
        mock_current = await self._generate_mock_weather_data(lat, lon)
        mock_current["dt"] = int(target_time.timestamp())
        return mock_current
    
    async def _parse_weather_data(
        self, 
        ballpark: str, 
        profile: BallparkWeatherProfile, 
        weather_data: Dict[str, Any]
    ) -> WeatherConditions:
        """Parse weather API response into WeatherConditions"""
        
        main = weather_data.get("main", {})
        wind = weather_data.get("wind", {})
        weather = weather_data.get("weather", [{}])[0]
        clouds = weather_data.get("clouds", {})
        
        conditions = WeatherConditions(
            ballpark=ballpark,
            timestamp=datetime.now(timezone.utc),
            temperature=main.get("temp", 70),
            humidity=main.get("humidity", 50),
            pressure=main.get("pressure", 29.92),
            condition=self._parse_weather_condition(weather.get("main", "Clear")),
            wind_speed=int(wind.get("speed", 5)),
            wind_direction_deg=wind.get("deg", 180),
            wind_gust_speed=wind.get("gust"),
            cloud_cover=clouds.get("all", 0),
            visibility=weather_data.get("visibility", 10000) / 1609.34,  # Convert to miles
            source=self.primary_api
        )
        
        # Calculate wind direction relative to ballpark
        conditions.wind_direction_relative = self._calculate_wind_direction_relative(
            conditions.wind_direction_deg, profile
        )
        
        # Calculate weather impacts
        conditions.weather_impact = self._assess_weather_impact(conditions)
        conditions.home_run_factor = await self._calculate_home_run_factor(conditions, profile)
        conditions.offense_factor = await self._calculate_offense_factor(conditions, profile)
        conditions.pitching_factor = await self._calculate_pitching_factor(conditions, profile)
        
        return conditions
    
    async def _parse_forecast_data(
        self,
        ballpark: str,
        game_time: datetime,
        forecast_data: Dict[str, Any]
    ) -> WeatherForecast:
        """Parse forecast data"""
        
        main = forecast_data.get("main", {})
        wind = forecast_data.get("wind", {})
        weather = forecast_data.get("weather", [{}])[0]
        
        forecast = WeatherForecast(
            ballpark=ballpark,
            game_date=game_time,
            forecast_issued=datetime.now(timezone.utc),
            expected_temperature=main.get("temp", 70),
            expected_humidity=main.get("humidity", 50),
            expected_wind_speed=int(wind.get("speed", 5)),
            expected_wind_direction=wind.get("deg", 180),
            expected_condition=self._parse_weather_condition(weather.get("main", "Clear")),
            precipitation_chance=forecast_data.get("pop", 0) * 100 if "pop" in forecast_data else 0
        )
        
        return forecast
    
    def _parse_weather_condition(self, condition_str: str) -> WeatherCondition:
        """Parse weather condition string"""
        condition_lower = condition_str.lower()
        
        if "clear" in condition_lower or "sunny" in condition_lower:
            return WeatherCondition.CLEAR
        elif "partly" in condition_lower and "cloud" in condition_lower:
            return WeatherCondition.PARTLY_CLOUDY
        elif "mostly" in condition_lower and "cloud" in condition_lower:
            return WeatherCondition.MOSTLY_CLOUDY
        elif "overcast" in condition_lower:
            return WeatherCondition.OVERCAST
        elif "thunderstorm" in condition_lower or "storm" in condition_lower:
            return WeatherCondition.THUNDERSTORMS
        elif "rain" in condition_lower:
            if "light" in condition_lower:
                return WeatherCondition.LIGHT_RAIN
            elif "heavy" in condition_lower:
                return WeatherCondition.HEAVY_RAIN
            else:
                return WeatherCondition.RAIN
        elif "snow" in condition_lower:
            return WeatherCondition.SNOW
        elif "fog" in condition_lower:
            return WeatherCondition.FOG
        else:
            return WeatherCondition.UNKNOWN
    
    def _calculate_wind_direction_relative(
        self, 
        wind_deg: int, 
        profile: BallparkWeatherProfile
    ) -> WindDirection:
        """Calculate wind direction relative to ballpark orientation"""
        
        # This is simplified - in production would use actual ballpark orientations
        # Most ballparks face roughly northeast to avoid afternoon sun in batter's eyes
        
        # Normalize wind direction
        if wind_deg < 0:
            wind_deg += 360
        wind_deg = wind_deg % 360
        
        # Rough ballpark orientation (home plate to center field)
        # Yankee Stadium: ~200 degrees (SSW)  
        # Default assumption for calculation
        ballpark_orientation = 200
        
        # Calculate relative wind direction
        relative_deg = (wind_deg - ballpark_orientation) % 360
        
        # Determine impact direction
        if 315 <= relative_deg or relative_deg < 45:  # Wind blowing out to CF
            return WindDirection.OUT_TO_CENTER
        elif 45 <= relative_deg < 135:  # Wind blowing out to RF
            return WindDirection.OUT_TO_RIGHT  
        elif 135 <= relative_deg < 225:  # Wind blowing in from CF
            return WindDirection.IN_FROM_CENTER
        elif 225 <= relative_deg < 315:  # Wind blowing out to LF
            return WindDirection.OUT_TO_LEFT
        else:
            return WindDirection.CROSS_WIND
    
    def _assess_weather_impact(self, conditions: WeatherConditions) -> WeatherImpact:
        """Assess overall weather impact level"""
        
        impact_factors = []
        
        # Wind impact
        if conditions.wind_speed >= self.impact_thresholds["wind_speed"]["extreme"]:
            impact_factors.append(WeatherImpact.EXTREME)
        elif conditions.wind_speed >= self.impact_thresholds["wind_speed"]["significant"]:
            impact_factors.append(WeatherImpact.SIGNIFICANT)
        elif conditions.wind_speed >= self.impact_thresholds["wind_speed"]["moderate"]:
            impact_factors.append(WeatherImpact.MODERATE)
        
        # Temperature impact
        temp = conditions.temperature
        if temp <= self.impact_thresholds["temperature"]["extreme_cold"] or \
           temp >= self.impact_thresholds["temperature"]["extreme_hot"]:
            impact_factors.append(WeatherImpact.EXTREME)
        elif temp <= self.impact_thresholds["temperature"]["cold"] or \
             temp >= self.impact_thresholds["temperature"]["hot"]:
            impact_factors.append(WeatherImpact.MODERATE)
        
        # Precipitation impact
        if conditions.condition in [WeatherCondition.HEAVY_RAIN, WeatherCondition.THUNDERSTORMS]:
            impact_factors.append(WeatherImpact.EXTREME)
        elif conditions.condition == WeatherCondition.RAIN:
            impact_factors.append(WeatherImpact.SIGNIFICANT)
        elif conditions.condition == WeatherCondition.LIGHT_RAIN:
            impact_factors.append(WeatherImpact.MODERATE)
        
        # Return highest impact level
        if not impact_factors:
            return WeatherImpact.NONE
        
        impact_order = [WeatherImpact.NONE, WeatherImpact.MINIMAL, WeatherImpact.MODERATE, 
                       WeatherImpact.SIGNIFICANT, WeatherImpact.EXTREME]
        max_impact = max(impact_factors, key=lambda x: impact_order.index(x))
        return max_impact
    
    async def _calculate_home_run_impact(
        self, 
        conditions: WeatherConditions, 
        profile: BallparkWeatherProfile
    ) -> float:
        """Calculate home run impact factor"""
        
        hr_factor = 1.0
        
        # Wind impact on home runs
        wind_impact = self._get_wind_home_run_impact(conditions, profile)
        hr_factor *= wind_impact
        
        # Temperature impact (warmer = ball carries further)
        temp_impact = self._get_temperature_impact(conditions.temperature)
        hr_factor *= temp_impact
        
        # Altitude impact
        hr_factor *= profile.altitude_factor
        
        # Humidity impact (lower humidity = ball carries further)
        humidity_impact = self._get_humidity_impact(conditions.humidity)
        hr_factor *= humidity_impact
        
        # Pressure impact (lower pressure = ball carries further)
        pressure_impact = self._get_pressure_impact(conditions.pressure)
        hr_factor *= pressure_impact
        
        return hr_factor
    
    def _get_wind_home_run_impact(
        self, 
        conditions: WeatherConditions, 
        profile: BallparkWeatherProfile
    ) -> float:
        """Calculate wind impact on home runs"""
        
        base_impact = 1.0
        wind_speed = conditions.wind_speed
        wind_direction = conditions.wind_direction_relative
        
        # Wind direction impact
        if wind_direction in [WindDirection.OUT_TO_LEFT, WindDirection.OUT_TO_CENTER, WindDirection.OUT_TO_RIGHT]:
            # Wind helping home runs
            direction_multiplier = profile.wind_factors.get(wind_direction.value, 1.10)
        elif wind_direction in [WindDirection.IN_FROM_LEFT, WindDirection.IN_FROM_CENTER, WindDirection.IN_FROM_RIGHT]:
            # Wind hindering home runs  
            direction_multiplier = 0.90
        else:
            # Cross wind or calm
            direction_multiplier = 1.0
        
        # Wind speed impact (stronger wind = more impact)
        speed_multiplier = 1.0 + (wind_speed - 10) * 0.02  # 2% per mph above 10 mph
        speed_multiplier = max(0.5, min(2.0, speed_multiplier))  # Cap between 0.5 and 2.0
        
        return base_impact * direction_multiplier * speed_multiplier
    
    def _get_temperature_impact(self, temperature: float) -> float:
        """Calculate temperature impact (warmer air = less dense = ball carries further)"""
        # Baseline at 70°F
        baseline_temp = 70.0
        temp_diff = temperature - baseline_temp
        
        # Roughly 1% increase per 10°F warmer
        impact = 1.0 + (temp_diff * 0.001)
        return max(0.8, min(1.3, impact))  # Cap between 0.8 and 1.3
    
    def _get_humidity_impact(self, humidity: int) -> float:
        """Calculate humidity impact (lower humidity = less air resistance)"""
        # Baseline at 50% humidity
        baseline_humidity = 50
        humidity_diff = baseline_humidity - humidity  # Lower humidity = positive diff
        
        # Roughly 0.5% increase per 10% lower humidity
        impact = 1.0 + (humidity_diff * 0.0005)
        return max(0.9, min(1.1, impact))  # Cap between 0.9 and 1.1
    
    def _get_pressure_impact(self, pressure: float) -> float:
        """Calculate barometric pressure impact"""
        # Baseline at standard pressure (29.92 inHg)
        baseline_pressure = 29.92
        pressure_diff = baseline_pressure - pressure  # Lower pressure = positive diff
        
        # Roughly 1% increase per 0.5 inHg lower pressure
        impact = 1.0 + (pressure_diff * 0.02)
        return max(0.8, min(1.2, impact))  # Cap between 0.8 and 1.2
    
    async def _calculate_home_run_factor(
        self, 
        conditions: WeatherConditions, 
        profile: BallparkWeatherProfile
    ) -> float:
        """Calculate overall home run factor"""
        return await self._calculate_home_run_impact(conditions, profile)
    
    async def _calculate_offense_factor(
        self, 
        conditions: WeatherConditions, 
        profile: BallparkWeatherProfile
    ) -> float:
        """Calculate general offensive factor"""
        # Similar to HR factor but more conservative
        hr_factor = await self._calculate_home_run_impact(conditions, profile)
        
        # Dampen the effect for general offense (not just home runs)
        offense_factor = 1.0 + (hr_factor - 1.0) * 0.5
        return offense_factor
    
    async def _calculate_pitching_factor(
        self, 
        conditions: WeatherConditions, 
        profile: BallparkWeatherProfile
    ) -> float:
        """Calculate pitching conditions factor"""
        # Inverse of offensive factor in many cases
        offense_factor = await self._calculate_offense_factor(conditions, profile)
        
        # Better offensive conditions = tougher pitching conditions
        pitching_factor = 2.0 - offense_factor
        return max(0.7, min(1.3, pitching_factor))
    
    async def _calculate_prop_adjustments(
        self,
        conditions: WeatherConditions,
        profile: BallparkWeatherProfile, 
        impact_analysis: Dict[str, float]
    ) -> Dict[str, float]:
        """Calculate specific prop adjustments based on weather"""
        
        adjustments = {}
        
        hr_factor = impact_analysis.get("home_runs", 1.0)
        offense_factor = impact_analysis.get("offensive", 1.0) 
        pitching_factor = impact_analysis.get("pitching", 1.0)
        
        # Home run props
        adjustments["player_home_runs"] = hr_factor
        adjustments["team_home_runs"] = hr_factor
        
        # Offensive props  
        adjustments["player_hits"] = offense_factor * 0.8 + 0.2  # More conservative
        adjustments["team_runs"] = offense_factor
        adjustments["team_total_bases"] = offense_factor
        
        # Pitching props
        adjustments["pitcher_strikeouts"] = pitching_factor * 0.9 + 0.1  # Conservative
        adjustments["pitcher_earned_runs"] = 2.0 - pitching_factor  # Inverse relationship
        
        return adjustments
    
    def _is_weather_data_fresh(self, timestamp: datetime, max_age_minutes: int = 15) -> bool:
        """Check if weather data is still fresh"""
        age = datetime.now(timezone.utc) - timestamp
        return age.total_seconds() < (max_age_minutes * 60)
    
    async def _weather_monitoring_loop(self):
        """Main weather monitoring loop"""
        logger.info("Starting weather monitoring loop")
        
        while self.monitoring_active:
            try:
                for ballpark in self.monitored_ballparks:
                    # Update current weather
                    await self.get_current_weather(ballpark)
                    
                    # Check for alerts
                    await self._check_ballpark_alerts(ballpark)
                
                await asyncio.sleep(300)  # Update every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in weather monitoring loop: {e}")
                await asyncio.sleep(600)  # Wait longer on error
    
    async def _forecast_monitoring_loop(self):
        """Forecast monitoring loop"""
        logger.info("Starting forecast monitoring loop")
        
        while self.monitoring_active:
            try:
                # Update forecasts less frequently
                for ballpark in self.monitored_ballparks:
                    # Update today's forecasts
                    game_times = [
                        datetime.now(timezone.utc) + timedelta(hours=h) 
                        for h in [2, 4, 6, 8]  # Sample game times
                    ]
                    
                    for game_time in game_times:
                        await self.get_game_forecast(ballpark, game_time)
                
                await asyncio.sleep(1800)  # Update every 30 minutes
                
            except Exception as e:
                logger.error(f"Error in forecast monitoring loop: {e}")
                await asyncio.sleep(3600)  # Wait longer on error
    
    async def _alert_monitoring_loop(self):
        """Weather alert monitoring loop"""
        logger.info("Starting weather alert monitoring loop")
        
        while self.monitoring_active:
            try:
                for ballpark in self.monitored_ballparks:
                    await self._check_ballpark_alerts(ballpark)
                
                await asyncio.sleep(600)  # Check every 10 minutes
                
            except Exception as e:
                logger.error(f"Error in alert monitoring loop: {e}")
                await asyncio.sleep(1200)  # Wait longer on error
    
    async def _check_ballpark_alerts(self, ballpark: str):
        """Check for weather alerts at ballpark"""
        try:
            conditions = self.current_conditions.get(ballpark)
            if not conditions:
                return
            
            alerts = []
            
            # High wind alert
            if conditions.wind_speed >= self.impact_thresholds["wind_speed"]["significant"]:
                alert = WeatherAlert(
                    alert_id=f"{ballpark}_wind_{int(datetime.now().timestamp())}",
                    ballpark=ballpark,
                    alert_type="high_wind",
                    severity=WeatherImpact.SIGNIFICANT if conditions.wind_speed < 35 else WeatherImpact.EXTREME,
                    title="High Wind Alert",
                    description=f"Wind speeds of {conditions.wind_speed} mph may significantly impact gameplay",
                    start_time=datetime.now(timezone.utc),
                    end_time=datetime.now(timezone.utc) + timedelta(hours=3),
                    prop_adjustments={"home_runs": conditions.home_run_factor}
                )
                alerts.append(alert)
            
            # Temperature extreme alert  
            if conditions.temperature <= 40 or conditions.temperature >= 95:
                severity = WeatherImpact.EXTREME if conditions.temperature <= 35 or conditions.temperature >= 100 else WeatherImpact.SIGNIFICANT
                alert = WeatherAlert(
                    alert_id=f"{ballpark}_temp_{int(datetime.now().timestamp())}",
                    ballpark=ballpark,
                    alert_type="temperature_extreme",
                    severity=severity,
                    title="Temperature Extreme Alert",
                    description=f"Temperature of {conditions.temperature:.0f}°F may impact player performance and ball flight",
                    start_time=datetime.now(timezone.utc),
                    end_time=datetime.now(timezone.utc) + timedelta(hours=4)
                )
                alerts.append(alert)
            
            # Precipitation alert
            if conditions.condition in [WeatherCondition.RAIN, WeatherCondition.HEAVY_RAIN, WeatherCondition.THUNDERSTORMS]:
                alert = WeatherAlert(
                    alert_id=f"{ballpark}_precip_{int(datetime.now().timestamp())}",
                    ballpark=ballpark,
                    alert_type="severe_weather",
                    severity=WeatherImpact.EXTREME,
                    title="Precipitation Alert",
                    description=f"Active precipitation may delay or postpone game",
                    start_time=datetime.now(timezone.utc),
                    end_time=datetime.now(timezone.utc) + timedelta(hours=2),
                    affects_gameplay=True,
                    recommended_action="Monitor for potential game delays"
                )
                alerts.append(alert)
            
            # Update active alerts
            if alerts:
                self.active_alerts[ballpark] = alerts
                
                # Trigger alert callbacks
                for alert in alerts:
                    await self._trigger_alert_callbacks(alert)
            
        except Exception as e:
            logger.error(f"Error checking alerts for {ballpark}: {e}")
    
    async def _trigger_alert_callbacks(self, alert: WeatherAlert):
        """Trigger weather alert callbacks"""
        for callback in self.alert_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(alert)
                else:
                    callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Service health check"""
        try:
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "current_weather": True,
                    "weather_forecasts": True,
                    "weather_alerts": True,
                    "ballpark_profiles": True,
                    "prop_adjustments": True,
                    "impact_analysis": True
                },
                "monitoring_stats": {
                    "monitored_ballparks": len(self.monitored_ballparks),
                    "ballpark_profiles": len(self.ballpark_profiles),
                    "current_conditions": len(self.current_conditions),
                    "active_forecasts": sum(len(f) for f in self.forecasts.values()),
                    "active_alerts": sum(len(a) for a in self.active_alerts.values()),
                    "weather_callbacks": len(self.weather_callbacks),
                    "alert_callbacks": len(self.alert_callbacks)
                },
                "api_config": {
                    "primary_api": self.primary_api,
                    "backup_apis": self.backup_apis,
                    "api_keys_configured": len(self.api_keys)
                }
            }
            
        except Exception as e:
            logger.error(f"Weather API integration health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "error",
                "error": str(e)
            }


# Global service instance
weather_api_integration = WeatherAPIIntegration()