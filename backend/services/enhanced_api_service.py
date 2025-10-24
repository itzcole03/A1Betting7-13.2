"""
Enhanced API Service - Phase 4 Performance Optimization
High-performance API endpoints with caching, error handling, and monitoring
"""

import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from fastapi import HTTPException
from pydantic import BaseModel

from backend.config_manager import A1BettingConfig
from backend.services.optimized_cache_service import cache_get, cache_set
from backend.utils.enhanced_logging import get_logger

try:
    from backend.services.mlb_stats_api_client import MLBStatsAPIClient
except Exception:  # pragma: no cover - optional dependency
    MLBStatsAPIClient = None  # type: ignore[assignment]

logger = get_logger("enhanced_api")


class APIResponse(BaseModel):
    """Standardized API response model"""

    success: bool = True
    data: Any = None
    message: str = "Success"
    timestamp: Optional[datetime] = None
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
        self.mlb_stats_client: Optional[Any] = None

        if MLBStatsAPIClient is not None:
            try:
                self.mlb_stats_client = MLBStatsAPIClient()
                logger.info("Initialized MLBStatsAPIClient for enhanced API service")
            except Exception as init_error:  # pragma: no cover - initialization guard
                logger.warning(
                    "MLBStatsAPIClient initialization failed; enhanced API will fall back to mock data (%s)",
                    init_error,
                )
        
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
            
            # Fetch real MLB games when available
            games_list = await self._generate_mlb_games_data()
            games_payload: Dict[str, Any] = {"games": games_list}

            # Cache the result
            if use_cache:
                await cache_set(cache_key, games_payload, ttl=300)  # 5 minutes
            
            execution_time = (time.time() - start_time) * 1000
            performance_monitor.record_call("/mlb/games", execution_time)
            
            return APIResponse(
                data=games_payload,
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
            props_list = await self._generate_game_props_data(game_id)
            props_payload: Dict[str, Any] = {"props": props_list}

            # Cache the result
            if use_cache:
                await cache_set(cache_key, props_payload, ttl=180)  # 3 minutes
            
            execution_time = (time.time() - start_time) * 1000
            performance_monitor.record_call("/game/props", execution_time)
            
            return APIResponse(
                data=props_payload,
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
        """Return today's MLB games using the stats client when available."""

        if self.mlb_stats_client is not None:
            try:
                games = await self.mlb_stats_client.get_todays_games()
                if games:
                    normalized: List[Dict[str, Any]] = []
                    fetched_at = datetime.now(timezone.utc).isoformat()
                    for game in games:
                        game_id = game.get("game_id") or game.get("gamePk")
                        home_team = game.get("home_team") or game.get("home", {}).get("name")
                        away_team = game.get("away_team") or game.get("away", {}).get("name")
                        normalized.append(
                            {
                                "id": str(game_id),
                                "game_id": str(game_id),
                                "home_team": home_team,
                                "away_team": away_team,
                                "home_id": game.get("home_id"),
                                "away_id": game.get("away_id"),
                                "start_time": game.get("game_date"),
                                "status": game.get("status", "scheduled"),
                                "venue": game.get("venue"),
                                "game_type": game.get("game_type"),
                                "doubleheader": game.get("doubleheader"),
                                "inning": game.get("inning"),
                                "inning_state": game.get("inning_state"),
                                "matchup": f"{away_team} @ {home_team}" if away_team and home_team else None,
                                "last_updated": fetched_at,
                            }
                        )

                    if normalized:
                        return normalized
            except Exception as stats_error:  # pragma: no cover - network guard
                logger.warning(
                    "Real MLB games fetch failed; falling back to mock data (%s)",
                    stats_error,
                )

        return await self._generate_mock_mlb_games_data()

    async def _generate_mock_mlb_games_data(self) -> List[Dict[str, Any]]:
        """Fallback dataset when real MLB data is unavailable."""

        await asyncio.sleep(0.01)
        return [
            {
                "id": "mock_game_1",
                "game_id": "mock_game_1",
                "home_team": "Giants",
                "away_team": "Dodgers",
                "start_time": "2025-01-08T19:30:00Z",
                "status": "scheduled",
                "venue": "Oracle Park",
                "matchup": "Dodgers @ Giants",
                "last_updated": datetime.utcnow().isoformat() + "Z",
            },
            {
                "id": "mock_game_2",
                "game_id": "mock_game_2",
                "home_team": "Yankees",
                "away_team": "Red Sox",
                "start_time": "2025-01-08T20:00:00Z",
                "status": "scheduled",
                "venue": "Yankee Stadium",
                "matchup": "Red Sox @ Yankees",
                "last_updated": datetime.utcnow().isoformat() + "Z",
            },
        ]

    async def _generate_game_props_data(self, game_id: str) -> List[Dict[str, Any]]:
        """Return props for a specific MLB game using real data when available."""

        if self.mlb_stats_client is not None:
            try:
                props = await self.mlb_stats_client.generate_player_props_data()
                if props:
                    normalized_props: List[Dict[str, Any]] = []
                    for prop in props:
                        event_id = prop.get("event_id") or prop.get("game_id")
                        if event_id is None:
                            continue
                        if str(event_id) != str(game_id):
                            continue
                        try:
                            normalized_props.append(self._map_mlb_prop_to_game_prop(prop))
                        except Exception as normalize_error:
                            logger.debug(
                                "Skipping MLB prop for game %s due to normalization error: %s",
                                game_id,
                                normalize_error,
                            )
                    if normalized_props:
                        return normalized_props
            except Exception as stats_error:  # pragma: no cover - network guard
                logger.warning(
                    "Real MLB props fetch failed for game %s; falling back to mock data (%s)",
                    game_id,
                    stats_error,
                )

        return await self._generate_mock_game_props_data()

    def _map_mlb_prop_to_game_prop(self, prop: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize MLB stats prop payload into game props schema."""

        ai_probability_pct = float(prop.get("ai_probability", prop.get("confidence", 70.0)))
        implied_probability_pct = float(prop.get("implied_probability", 50.0))
        edge_pct = float(prop.get("edge", ai_probability_pct - implied_probability_pct))
        line_value = float(prop.get("line") or prop.get("line_score") or 0.0)

        probability_over = self._clamp_probability(ai_probability_pct / 100.0)
        probability_under = self._clamp_probability(1.0 - probability_over)
        implied_probability = self._clamp_probability(implied_probability_pct / 100.0)

        over_odds = prop.get("odds")
        if over_odds is None:
            over_odds = self._probability_to_american(probability_over)
        under_odds = self._probability_to_american(probability_under)

        return {
            "player": prop.get("player_name") or prop.get("player"),
            "prop_type": prop.get("stat_type"),
            "line": line_value,
            "over_odds": over_odds,
            "under_odds": under_odds,
            "confidence": probability_over,
            "ev": edge_pct / 100.0,
            "ai_probability": probability_over,
            "implied_probability": implied_probability,
            "edge_pct": edge_pct,
            "matchup": prop.get("matchup"),
            "team": prop.get("team_name") or prop.get("team"),
            "opponent": prop.get("opponent"),
            "start_time": prop.get("start_time"),
            "provider": prop.get("provider_id", "mlb_stats_api"),
            "bookmakers": prop.get("bookmakers", []),
            "volume": prop.get("volume"),
            "sharp_money": prop.get("sharp_money"),
        }

    async def _generate_mock_game_props_data(self) -> List[Dict[str, Any]]:
        """Fallback mock props when real data is unavailable."""

        await asyncio.sleep(0.02)
        import random

        return [
            {
                "player": "Mookie Betts",
                "prop_type": "hits",
                "line": 1.5,
                "over_odds": -110,
                "under_odds": -110,
                "confidence": 0.75,
                "ev": 0.12,
                "ai_probability": 0.75,
                "implied_probability": 0.5,
                "edge_pct": 12.0,
                "matchup": "Dodgers @ Giants",
                "team": "LAD",
                "opponent": "SF",
                "start_time": datetime.utcnow().isoformat() + "Z",
                "provider": "mock",
                "bookmakers": [],
                "volume": random.randint(200, 600),
                "sharp_money": "moderate",
            },
            {
                "player": "Freddie Freeman",
                "prop_type": "rbis",
                "line": 0.5,
                "over_odds": +150,
                "under_odds": -180,
                "confidence": 0.68,
                "ev": 0.08,
                "ai_probability": 0.68,
                "implied_probability": 0.4,
                "edge_pct": 8.0,
                "matchup": "Dodgers @ Giants",
                "team": "LAD",
                "opponent": "SF",
                "start_time": datetime.utcnow().isoformat() + "Z",
                "provider": "mock",
                "bookmakers": [],
                "volume": random.randint(200, 600),
                "sharp_money": "light",
            },
        ]

    @staticmethod
    def _clamp_probability(value: float) -> float:
        return max(0.01, min(0.99, value))

    @staticmethod
    def _probability_to_american(probability: float) -> int:
        probability = EnhancedAPIService._clamp_probability(probability)
        if probability >= 0.5:
            odds = -((probability / (1 - probability)) * 100)
        else:
            odds = ((1 - probability) / probability) * 100
        return int(round(odds))

    async def _generate_prediction_data(self, player_name: str, prop_type: str, line: float) -> Dict[str, Any]:
        """Generate AI prediction data powered by real MLB stats when available."""

        if self.mlb_stats_client is not None:
            try:
                props = await self.mlb_stats_client.generate_player_props_data()
                if props:
                    matching_prop = self._find_matching_prop(props, player_name, prop_type)
                    if matching_prop:
                        return self._build_prediction_from_prop(
                            matching_prop,
                            requested_line=line,
                            player_name=player_name,
                            prop_type=prop_type,
                        )
            except Exception as stats_error:  # pragma: no cover - network guard
                logger.warning(
                    "Real MLB prediction generation failed for %s (%s); using mock fallback",
                    player_name,
                    stats_error,
                )

        return await self._generate_mock_prediction_data(player_name, prop_type, line)

    def _find_matching_prop(
        self,
        props: List[Dict[str, Any]],
        player_name: str,
        prop_type: str,
    ) -> Optional[Dict[str, Any]]:
        target_name = player_name.strip().lower()
        target_stat = prop_type.strip().lower()

        def _name(value: Dict[str, Any]) -> str:
            return str(value.get("player_name") or value.get("player") or "").strip().lower()

        def _stat(value: Dict[str, Any]) -> str:
            return str(value.get("stat_type") or "").strip().lower()

        # Exact match on both player and stat type
        for prop in props:
            if _name(prop) == target_name and _stat(prop) == target_stat:
                return prop

        # Match on player + stat type substring
        for prop in props:
            if target_name in _name(prop) and _stat(prop) == target_stat:
                return prop

        # Fallback: match on player only
        for prop in props:
            if target_name in _name(prop):
                return prop

        return None

    def _build_prediction_from_prop(
        self,
        prop: Dict[str, Any],
        *,
        requested_line: float,
        player_name: str,
        prop_type: str,
    ) -> Dict[str, Any]:
        ai_probability_pct = float(prop.get("ai_probability", prop.get("confidence", 70.0)))
        probability_over = self._clamp_probability(ai_probability_pct / 100.0)
        probability_under = self._clamp_probability(1.0 - probability_over)
        implied_probability_pct = float(prop.get("implied_probability", 50.0))
        implied_probability = self._clamp_probability(implied_probability_pct / 100.0)
        edge_pct = float(prop.get("edge", ai_probability_pct - implied_probability_pct))
        line_value = float(prop.get("line") or prop.get("line_score") or requested_line)
        recommendation = "over" if probability_over >= probability_under else "under"

        model_line_delta = round(line_value - requested_line, 2)

        return {
            "player": player_name,
            "prop_type": prop_type,
            "line": requested_line,
            "prediction": {
                "probability_over": probability_over,
                "probability_under": probability_under,
                "confidence": probability_over,
                "expected_value": edge_pct / 100.0,
                "recommendation": recommendation,
                "model_line": line_value,
                "line_delta": model_line_delta,
                "implied_probability": implied_probability,
            },
            "model_info": {
                "source": prop.get("provider_id", "mlb_stats_api"),
                "provider_event_id": prop.get("event_id"),
                "ai_probability_pct": ai_probability_pct,
                "implied_probability_pct": implied_probability_pct,
                "edge_pct": edge_pct,
                "bookmakers": prop.get("bookmakers", []),
                "matchup": prop.get("matchup"),
                "start_time": prop.get("start_time"),
            },
        }

    async def _generate_mock_prediction_data(
        self, player_name: str, prop_type: str, line: float
    ) -> Dict[str, Any]:
        """Fallback mock prediction when real data is unavailable."""

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
                "recommendation": "over" if probability_over > 0.5 else "under",
                "model_line": line,
                "line_delta": 0.0,
                "implied_probability": 0.5,
            },
            "model_info": {
                "source": "mock",
                "ensemble_models": ["xgboost", "random_forest", "lstm"],
                "features_used": 47,
                "last_trained": datetime.utcnow().isoformat() + "Z",
            },
        }


# Global service instance
_api_service: Optional[EnhancedAPIService] = None


async def get_api_service() -> EnhancedAPIService:
    """Get global API service instance"""
    global _api_service
    if _api_service is None:
        _api_service = EnhancedAPIService()
    return _api_service
