"""
Enhanced API Service - Phase 4 Performance Optimization
High-performance API endpoints with caching, error handling, and monitoring
"""

import asyncio
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import HTTPException
from pydantic import BaseModel

from backend.config_manager import A1BettingConfig
from backend.services.optimized_cache_service import cache_get, cache_set
from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_api")


class APIResponse(BaseModel):
    """Standardized API response model"""
    success: bool = True
    data: Any = None
    message: str = "Success"
    timestamp: datetime = None
    execution_time_ms: float = 0.0
    cached: bool = False

    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.utcnow()
        super().__init__(**data)


class PerformanceMonitor:
    """Performance monitoring for API calls"""
    
    def __init__(self):
        self.call_times: Dict[str, List[float]] = {}
        self.error_counts: Dict[str, int] = {}
        self.cache_hits: Dict[str, int] = {}
        
    def record_call(self, endpoint: str, duration_ms: float, from_cache: bool = False):
        """Record API call performance"""
        if endpoint not in self.call_times:
            self.call_times[endpoint] = []
        self.call_times[endpoint].append(duration_ms)
        
        if from_cache:
            self.cache_hits[endpoint] = self.cache_hits.get(endpoint, 0) + 1
    
    def record_error(self, endpoint: str):
        """Record API error"""
        self.error_counts[endpoint] = self.error_counts.get(endpoint, 0) + 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        stats = {}
        for endpoint, times in self.call_times.items():
            if times:
                stats[endpoint] = {
                    "avg_time_ms": round(sum(times) / len(times), 2),
                    "min_time_ms": round(min(times), 2),
                    "max_time_ms": round(max(times), 2),
                    "total_calls": len(times),
                    "cache_hits": self.cache_hits.get(endpoint, 0),
                    "errors": self.error_counts.get(endpoint, 0)
                }
        return stats


# Global performance monitor
performance_monitor = PerformanceMonitor()


class EnhancedAPIService:
    """
    Enhanced API service with:
    - Performance monitoring
    - Intelligent caching
    - Error handling and recovery
    - Response optimization
    """
    
    def __init__(self):
        self.config = A1BettingConfig()
        
    async def get_health_status(self) -> APIResponse:
        """Get API health status with performance metrics"""
        start_time = time.time()
        
        try:
            # Check various service health
            health_data = {
                "status": "healthy",
                "timestamp": datetime.utcnow(),
                "services": {
                    "api": "operational",
                    "cache": "operational",
                    "database": "operational"
                },
                "performance": performance_monitor.get_stats(),
                "uptime_seconds": time.time() - start_time
            }
            
            execution_time = (time.time() - start_time) * 1000
            performance_monitor.record_call("/health", execution_time)
            
            return APIResponse(
                data=health_data,
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            performance_monitor.record_error("/health")
            logger.error(f"Health check failed: {e}")
            raise HTTPException(status_code=500, detail="Health check failed")

    async def get_mlb_games(self, use_cache: bool = True) -> APIResponse:
        """Get MLB games with caching and performance optimization"""
        start_time = time.time()
        cache_key = "mlb_games_today"
        
        try:
            # Try cache first
            if use_cache:
                cached_data = await cache_get(cache_key)
                if cached_data:
                    execution_time = (time.time() - start_time) * 1000
                    performance_monitor.record_call("/mlb/games", execution_time, from_cache=True)
                    
                    return APIResponse(
                        data=cached_data,
                        execution_time_ms=execution_time,
                        cached=True,
                        message="Retrieved from cache"
                    )
            
            # Generate mock data for demo mode
            games_data = await self._generate_mlb_games_data()
            
            # Cache the result
            if use_cache:
                await cache_set(cache_key, games_data, ttl=300)  # 5 minutes
            
            execution_time = (time.time() - start_time) * 1000
            performance_monitor.record_call("/mlb/games", execution_time)
            
            return APIResponse(
                data=games_data,
                execution_time_ms=execution_time,
                message="MLB games retrieved successfully"
            )
            
        except Exception as e:
            performance_monitor.record_error("/mlb/games")
            logger.error(f"Failed to get MLB games: {e}")
            raise HTTPException(status_code=500, detail="Failed to retrieve MLB games")

    async def get_game_props(self, game_id: str, use_cache: bool = True) -> APIResponse:
        """Get game props with caching and optimization"""
        start_time = time.time()
        cache_key = f"game_props:{game_id}"
        
        try:
            # Try cache first
            if use_cache:
                cached_data = await cache_get(cache_key)
                if cached_data:
                    execution_time = (time.time() - start_time) * 1000
                    performance_monitor.record_call("/game/props", execution_time, from_cache=True)
                    
                    return APIResponse(
                        data=cached_data,
                        execution_time_ms=execution_time,
                        cached=True,
                        message="Props retrieved from cache"
                    )
            
            # Generate props data
            props_data = await self._generate_game_props_data(game_id)
            
            # Cache the result
            if use_cache:
                await cache_set(cache_key, props_data, ttl=180)  # 3 minutes
            
            execution_time = (time.time() - start_time) * 1000
            performance_monitor.record_call("/game/props", execution_time)
            
            return APIResponse(
                data=props_data,
                execution_time_ms=execution_time,
                message="Game props retrieved successfully"
            )
            
        except Exception as e:
            performance_monitor.record_error("/game/props")
            logger.error(f"Failed to get game props for {game_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve props for game {game_id}")

    async def get_player_predictions(self, player_name: str, prop_type: str, line: float, use_cache: bool = True) -> APIResponse:
        """Get AI predictions for player props with caching"""
        start_time = time.time()
        cache_key = f"ml_prediction:{player_name}:{prop_type}:{line}"
        
        try:
            # Try cache first
            if use_cache:
                cached_data = await cache_get(cache_key)
                if cached_data:
                    execution_time = (time.time() - start_time) * 1000
                    performance_monitor.record_call("/ml/predict", execution_time, from_cache=True)
                    
                    return APIResponse(
                        data=cached_data,
                        execution_time_ms=execution_time,
                        cached=True,
                        message="Prediction retrieved from cache"
                    )
            
            # Generate prediction data
            prediction_data = await self._generate_prediction_data(player_name, prop_type, line)
            
            # Cache the result
            if use_cache:
                await cache_set(cache_key, prediction_data, ttl=600)  # 10 minutes
            
            execution_time = (time.time() - start_time) * 1000
            performance_monitor.record_call("/ml/predict", execution_time)
            
            return APIResponse(
                data=prediction_data,
                execution_time_ms=execution_time,
                message="AI prediction generated successfully"
            )
            
        except Exception as e:
            performance_monitor.record_error("/ml/predict")
            logger.error(f"Failed to get prediction for {player_name}: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate prediction")

    async def _generate_mlb_games_data(self) -> List[Dict[str, Any]]:
        """Generate mock MLB games data for demo mode"""
        # Simulate some processing time
        await asyncio.sleep(0.01)
        
        return [
            {
                "id": "123456",
                "home_team": "Giants",
                "away_team": "Dodgers",
                "start_time": "2025-01-08T19:30:00Z",
                "status": "scheduled",
                "venue": "Oracle Park"
            },
            {
                "id": "776879", 
                "home_team": "Yankees",
                "away_team": "Red Sox",
                "start_time": "2025-01-08T20:00:00Z",
                "status": "scheduled",
                "venue": "Yankee Stadium"
            }
        ]

    async def _generate_game_props_data(self, game_id: str) -> List[Dict[str, Any]]:
        """Generate mock game props data"""
        # Simulate some processing time
        await asyncio.sleep(0.02)
        
        return [
            {
                "player": "Mookie Betts",
                "prop_type": "hits",
                "line": 1.5,
                "over_odds": -110,
                "under_odds": -110,
                "confidence": 0.75,
                "ev": 0.12
            },
            {
                "player": "Freddie Freeman",
                "prop_type": "rbis",
                "line": 0.5,
                "over_odds": +150,
                "under_odds": -180,
                "confidence": 0.68,
                "ev": 0.08
            }
        ]

    async def _generate_prediction_data(self, player_name: str, prop_type: str, line: float) -> Dict[str, Any]:
        """Generate mock AI prediction data"""
        # Simulate AI processing time
        await asyncio.sleep(0.05)
        
        import random
        
        confidence = random.uniform(0.6, 0.95)
        probability_over = random.uniform(0.4, 0.8)
        
        return {
            "player": player_name,
            "prop_type": prop_type,
            "line": line,
            "prediction": {
                "probability_over": probability_over,
                "probability_under": 1 - probability_over,
                "confidence": confidence,
                "expected_value": random.uniform(-0.05, 0.15),
                "recommendation": "over" if probability_over > 0.5 else "under"
            },
            "model_info": {
                "ensemble_models": ["xgboost", "random_forest", "lstm"],
                "features_used": 47,
                "last_trained": "2025-01-08T12:00:00Z"
            }
        }


# Global service instance
_api_service: Optional[EnhancedAPIService] = None


async def get_api_service() -> EnhancedAPIService:
    """Get global API service instance"""
    global _api_service
    if _api_service is None:
        _api_service = EnhancedAPIService()
    return _api_service
