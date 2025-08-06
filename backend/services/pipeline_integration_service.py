"""
Pipeline Integration Service - Connects enhanced async pipelines to existing systems
Integrates with EnterpriseDataPipeline, RealtimeAnalyticsEngine, and PropBookAnalyzer
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from backend.services.enhanced_async_pipeline import (
    CircuitBreakerConfig,
    EnhancedAsyncPipeline,
    PipelineManager,
    RetryConfig,
    pipeline_manager,
)
from backend.services.optimized_redis_service import OptimizedRedisService
from backend.utils.enhanced_logging import get_logger

logger = get_logger("pipeline_integration")


class DataProcessingPipeline:
    """Enhanced data processing pipeline for MLB analysis"""

    def __init__(self, redis_service: OptimizedRedisService):
        self.redis_service = redis_service
        self.pipeline_manager = pipeline_manager
        self.pipelines_initialized = False

    async def initialize_pipelines(self):
        """Initialize all processing pipelines"""
        if self.pipelines_initialized:
            return

        logger.info("Initializing enhanced processing pipelines")

        # Game data processing pipeline
        game_pipeline = await self.pipeline_manager.create_pipeline(
            name="game_processing",
            processor=self._process_game_data,
            max_workers=8,
            queue_size=5000,
            circuit_breaker_config=CircuitBreakerConfig(
                failure_threshold=3, recovery_timeout=30, success_threshold=2
            ),
            retry_config=RetryConfig(
                max_retries=2, base_delay=0.5, exponential_backoff=True
            ),
            batch_size=10,
            batch_timeout=2.0,
        )

        # Analysis processing pipeline
        analysis_pipeline = await self.pipeline_manager.create_pipeline(
            name="analysis_processing",
            processor=self._process_analysis_data,
            max_workers=6,
            queue_size=3000,
            circuit_breaker_config=CircuitBreakerConfig(
                failure_threshold=5, recovery_timeout=45, success_threshold=3
            ),
            retry_config=RetryConfig(max_retries=3, base_delay=1.0, max_delay=30.0),
            batch_size=5,
            batch_timeout=1.5,
        )

        # Prop processing pipeline
        prop_pipeline = await self.pipeline_manager.create_pipeline(
            name="prop_processing",
            processor=self._process_prop_data,
            max_workers=12,
            queue_size=8000,
            circuit_breaker_config=CircuitBreakerConfig(
                failure_threshold=4, recovery_timeout=60, success_threshold=2
            ),
            retry_config=RetryConfig(max_retries=2, base_delay=0.3, jitter=True),
            batch_size=15,
            batch_timeout=1.0,
        )

        # Odds processing pipeline
        odds_pipeline = await self.pipeline_manager.create_pipeline(
            name="odds_processing",
            processor=self._process_odds_data,
            max_workers=4,
            queue_size=2000,
            circuit_breaker_config=CircuitBreakerConfig(
                failure_threshold=3, recovery_timeout=30
            ),
            retry_config=RetryConfig(max_retries=1, base_delay=0.2),
            batch_size=20,
            batch_timeout=0.5,
        )

        self.pipelines_initialized = True
        logger.info("All processing pipelines initialized")

    async def start_all_pipelines(self):
        """Start all processing pipelines"""
        if not self.pipelines_initialized:
            await self.initialize_pipelines()

        logger.info("Starting all processing pipelines")
        await self.pipeline_manager.start_all()

    async def stop_all_pipelines(self):
        """Stop all processing pipelines"""
        logger.info("Stopping all processing pipelines")
        await self.pipeline_manager.stop_all()

    async def _process_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process game data through enhanced pipeline"""
        try:
            # Enhanced game data processing
            processed_data = {
                "game_id": game_data.get("game_id"),
                "processed_at": datetime.now().isoformat(),
                "status": "processed",
                "enhanced_stats": await self._enhance_game_stats(game_data),
                "real_time_updates": await self._generate_real_time_updates(game_data),
                "analysis_flags": await self._analyze_game_patterns(game_data),
            }

            # Store in Redis for real-time access
            cache_key = f"processed:game:{game_data.get('game_id')}"
            await self.redis_service.set(cache_key, processed_data, ttl=7200)

            return processed_data

        except Exception as e:
            logger.error(f"Game data processing error: {e}")
            raise

    async def _process_analysis_data(
        self, analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process analysis data through enhanced pipeline"""
        try:
            # Enhanced analysis processing
            processed_analysis = {
                "analysis_id": analysis_data.get(
                    "analysis_id", f"analysis_{int(datetime.now().timestamp())}"
                ),
                "processed_at": datetime.now().isoformat(),
                "confidence_score": await self._calculate_enhanced_confidence(
                    analysis_data
                ),
                "risk_assessment": await self._perform_risk_analysis(analysis_data),
                "market_context": await self._analyze_market_context(analysis_data),
                "recommendation": await self._generate_recommendation(analysis_data),
            }

            # Cache analysis results
            cache_key = f"processed:analysis:{processed_analysis['analysis_id']}"
            await self.redis_service.set(cache_key, processed_analysis, ttl=3600)

            return processed_analysis

        except Exception as e:
            logger.error(f"Analysis data processing error: {e}")
            raise

    async def _process_prop_data(self, prop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process prop data through enhanced pipeline"""
        try:
            # Enhanced prop processing
            processed_prop = {
                "prop_id": prop_data.get("prop_id"),
                "processed_at": datetime.now().isoformat(),
                "enhanced_odds": await self._enhance_prop_odds(prop_data),
                "value_analysis": await self._analyze_prop_value(prop_data),
                "trend_analysis": await self._analyze_prop_trends(prop_data),
                "alert_triggers": await self._check_alert_conditions(prop_data),
            }

            # Store with multiple cache keys for different access patterns
            prop_id = prop_data.get("prop_id")
            await asyncio.gather(
                self.redis_service.set(
                    f"processed:prop:{prop_id}", processed_prop, ttl=1800
                ),
                self.redis_service.set(
                    f"prop:value:{prop_id}", processed_prop["value_analysis"], ttl=1800
                ),
                self.redis_service.set(
                    f"prop:trends:{prop_id}", processed_prop["trend_analysis"], ttl=3600
                ),
            )

            return processed_prop

        except Exception as e:
            logger.error(f"Prop data processing error: {e}")
            raise

    async def _process_odds_data(self, odds_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process odds data through enhanced pipeline"""
        try:
            # Enhanced odds processing
            processed_odds = {
                "odds_id": odds_data.get("odds_id"),
                "processed_at": datetime.now().isoformat(),
                "normalized_odds": await self._normalize_odds(odds_data),
                "movement_analysis": await self._analyze_odds_movement(odds_data),
                "arbitrage_opportunities": await self._detect_arbitrage(odds_data),
                "value_indicators": await self._calculate_value_indicators(odds_data),
            }

            # Cache odds with short TTL due to frequent updates
            cache_key = f"processed:odds:{odds_data.get('odds_id')}"
            await self.redis_service.set(cache_key, processed_odds, ttl=300)

            return processed_odds

        except Exception as e:
            logger.error(f"Odds data processing error: {e}")
            raise

    async def _enhance_game_stats(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance game statistics with advanced metrics"""
        return {
            "basic_stats": game_data.get("stats", {}),
            "advanced_metrics": {
                "expected_runs": await self._calculate_expected_runs(game_data),
                "win_probability": await self._calculate_win_probability(game_data),
                "leverage_index": await self._calculate_leverage_index(game_data),
            },
            "contextual_factors": {
                "weather_impact": await self._assess_weather_impact(game_data),
                "ballpark_factors": await self._assess_ballpark_factors(game_data),
                "historical_matchup": await self._get_historical_matchup(game_data),
            },
        }

    async def _generate_real_time_updates(
        self, game_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate real-time update flags"""
        updates = []

        # Check for significant events
        if game_data.get("score_change"):
            updates.append(
                {
                    "type": "score_update",
                    "priority": "high",
                    "data": game_data.get("current_score"),
                }
            )

        if game_data.get("pitcher_change"):
            updates.append(
                {
                    "type": "pitcher_change",
                    "priority": "medium",
                    "data": game_data.get("new_pitcher"),
                }
            )

        return updates

    async def _analyze_game_patterns(self, game_data: Dict[str, Any]) -> List[str]:
        """Analyze game for specific patterns and flags"""
        flags = []

        # Pattern analysis logic
        if game_data.get("runs_scored", 0) > 10:
            flags.append("high_scoring")

        if game_data.get("errors", 0) > 3:
            flags.append("error_prone")

        return flags

    async def _calculate_enhanced_confidence(
        self, analysis_data: Dict[str, Any]
    ) -> float:
        """Calculate enhanced confidence score"""
        base_confidence = analysis_data.get("confidence", 0.5)

        # Apply enhancements based on data quality and market conditions
        data_quality_factor = min(1.0, analysis_data.get("data_points", 0) / 100)
        market_stability_factor = analysis_data.get("market_stability", 0.8)

        enhanced_confidence = (
            base_confidence * data_quality_factor * market_stability_factor
        )
        return min(1.0, max(0.0, enhanced_confidence))

    async def _perform_risk_analysis(
        self, analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform comprehensive risk analysis"""
        return {
            "overall_risk": "medium",  # Placeholder - implement actual risk calculation
            "volatility_risk": analysis_data.get("price_volatility", 0.3),
            "liquidity_risk": analysis_data.get("market_depth", 0.2),
            "model_uncertainty": analysis_data.get("model_confidence", 0.1),
        }

    async def _analyze_market_context(
        self, analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze current market context"""
        return {
            "market_sentiment": await self._get_market_sentiment(),
            "volume_trends": await self._get_volume_trends(),
            "peer_analysis": await self._get_peer_analysis(analysis_data),
        }

    async def _generate_recommendation(
        self, analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate trading recommendation"""
        confidence = analysis_data.get("confidence", 0.5)

        if confidence > 0.75:
            action = (
                "strong_buy"
                if analysis_data.get("expected_value", 0) > 0
                else "strong_sell"
            )
        elif confidence > 0.6:
            action = "buy" if analysis_data.get("expected_value", 0) > 0 else "sell"
        else:
            action = "hold"

        return {
            "action": action,
            "confidence": confidence,
            "reasoning": await self._generate_reasoning(analysis_data),
            "risk_level": await self._assess_risk_level(analysis_data),
        }

    # Placeholder methods for prop processing
    async def _enhance_prop_odds(self, prop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance prop odds with additional data"""
        return prop_data.get("odds", {})

    async def _analyze_prop_value(self, prop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze prop betting value"""
        return {"value_rating": "medium", "expected_return": 0.05}

    async def _analyze_prop_trends(self, prop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze prop betting trends"""
        return {"trend_direction": "up", "momentum": 0.3}

    async def _check_alert_conditions(
        self, prop_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check for alert conditions"""
        return []

    # Placeholder methods for odds processing
    async def _normalize_odds(self, odds_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize odds across different formats"""
        return odds_data.get("odds", {})

    async def _analyze_odds_movement(self, odds_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze odds movement patterns"""
        return {"movement_trend": "stable", "volatility": 0.1}

    async def _detect_arbitrage(
        self, odds_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Detect arbitrage opportunities"""
        return []

    async def _calculate_value_indicators(
        self, odds_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate value betting indicators"""
        return {"value_index": 1.05, "kelly_percentage": 0.02}

    # Placeholder helper methods
    async def _calculate_expected_runs(self, game_data: Dict[str, Any]) -> float:
        return game_data.get("expected_runs", 4.5)

    async def _calculate_win_probability(self, game_data: Dict[str, Any]) -> float:
        return game_data.get("win_prob", 0.5)

    async def _calculate_leverage_index(self, game_data: Dict[str, Any]) -> float:
        return game_data.get("leverage", 1.0)

    async def _assess_weather_impact(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"wind_factor": 0.1, "temperature_factor": 0.05}

    async def _assess_ballpark_factors(
        self, game_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {"park_factor": 1.02, "dimensions_impact": 0.03}

    async def _get_historical_matchup(
        self, game_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {"head_to_head": "5-3", "recent_trend": "home_favored"}

    async def _get_market_sentiment(self) -> str:
        return "neutral"

    async def _get_volume_trends(self) -> Dict[str, Any]:
        return {"trend": "increasing", "volume_change": 0.15}

    async def _get_peer_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"peer_performance": "above_average"}

    async def _generate_reasoning(self, analysis_data: Dict[str, Any]) -> str:
        return "Analysis based on statistical models and market conditions"

    async def _assess_risk_level(self, analysis_data: Dict[str, Any]) -> str:
        confidence = analysis_data.get("confidence", 0.5)
        return "low" if confidence > 0.8 else "medium" if confidence > 0.6 else "high"

    async def submit_game_data(
        self, game_data: Dict[str, Any], priority: int = 1
    ) -> str:
        """Submit game data for processing"""
        pipeline = self.pipeline_manager.pipelines.get("game_processing")
        if not pipeline:
            raise RuntimeError("Game processing pipeline not initialized")

        return await pipeline.submit(game_data, priority)

    async def submit_analysis_data(
        self, analysis_data: Dict[str, Any], priority: int = 1
    ) -> str:
        """Submit analysis data for processing"""
        pipeline = self.pipeline_manager.pipelines.get("analysis_processing")
        if not pipeline:
            raise RuntimeError("Analysis processing pipeline not initialized")

        return await pipeline.submit(analysis_data, priority)

    async def submit_prop_data(
        self, prop_data: Dict[str, Any], priority: int = 1
    ) -> str:
        """Submit prop data for processing"""
        pipeline = self.pipeline_manager.pipelines.get("prop_processing")
        if not pipeline:
            raise RuntimeError("Prop processing pipeline not initialized")

        return await pipeline.submit(prop_data, priority)

    async def submit_odds_data(
        self, odds_data: Dict[str, Any], priority: int = 1
    ) -> str:
        """Submit odds data for processing"""
        pipeline = self.pipeline_manager.pipelines.get("odds_processing")
        if not pipeline:
            raise RuntimeError("Odds processing pipeline not initialized")

        return await pipeline.submit(odds_data, priority)

    async def get_processing_status(self) -> Dict[str, Any]:
        """Get status of all processing pipelines"""
        return await self.pipeline_manager.get_all_metrics()


# Global pipeline integration service
async def get_pipeline_integration_service() -> DataProcessingPipeline:
    """Get initialized pipeline integration service"""
    redis_service = OptimizedRedisService()
    service = DataProcessingPipeline(redis_service)
    await service.initialize_pipelines()
    return service
