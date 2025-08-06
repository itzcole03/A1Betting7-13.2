"""
Data Validation Integration Service

Integrates the DataValidationOrchestrator with the existing ComprehensivePropGenerator
to provide real-time cross-validation of sports data from multiple sources.

Features:
- Seamless integration with existing async patterns
- Automatic validation during prop generation
- Fallback mechanisms for validation failures
- Performance optimization with caching
- Real-time quality metrics
"""

import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from .data_validation_orchestrator import (
    CrossValidationReport,
    DataSource,
    DataValidationOrchestrator,
    ValidationStatus,
    data_validation_orchestrator,
)

logger = logging.getLogger("validation_integration")


@dataclass
class ValidationConfig:
    """Configuration for data validation integration"""

    enable_validation: bool = True
    enable_cross_validation: bool = True
    validation_timeout: float = 5.0  # seconds
    min_confidence_threshold: float = 0.6
    enable_fallback_on_failure: bool = True
    cache_validation_results: bool = True
    alert_on_conflicts: bool = True


class DataValidationIntegrationService:
    """
    Service for integrating data validation with existing sports data workflows

    Provides:
    - Automatic validation during data collection
    - Cross-source validation and consensus building
    - Fallback mechanisms for reliability
    - Performance metrics and monitoring
    """

    def __init__(self, config: Optional[ValidationConfig] = None):
        self.config = config or ValidationConfig()
        self.orchestrator = data_validation_orchestrator
        self.validation_cache = {}
        self.performance_metrics = {
            "validations_performed": 0,
            "validation_time_total": 0.0,
            "cache_hits": 0,
            "fallbacks_triggered": 0,
            "conflicts_resolved": 0,
        }

        logger.info("🔧 DataValidationIntegrationService initialized")

    async def validate_and_enhance_player_data(
        self,
        player_id: int,
        mlb_stats_data: Optional[Dict[str, Any]] = None,
        baseball_savant_data: Optional[Dict[str, Any]] = None,
        statsapi_data: Optional[Dict[str, Any]] = None,
        external_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], CrossValidationReport]:
        """
        Validate player data from multiple sources and return enhanced data with consensus

        Args:
            player_id: Player ID for context
            mlb_stats_data: Data from MLB Stats API
            baseball_savant_data: Data from Baseball Savant
            statsapi_data: Data from statsapi
            external_data: Data from external sources

        Returns:
            Tuple of (enhanced_data, validation_report)
        """
        if not self.config.enable_validation:
            # Validation disabled - return first available data
            for data in [
                mlb_stats_data,
                baseball_savant_data,
                statsapi_data,
                external_data,
            ]:
                if data:
                    return data, None
            return {}, None

        start_time = time.time()

        # Build data sources dictionary
        data_sources = {}
        if mlb_stats_data:
            data_sources[DataSource.MLB_STATS_API] = mlb_stats_data
        if baseball_savant_data:
            data_sources[DataSource.BASEBALL_SAVANT] = baseball_savant_data
        if statsapi_data:
            data_sources[DataSource.STATSAPI] = statsapi_data
        if external_data:
            data_sources[DataSource.EXTERNAL_API] = external_data

        if not data_sources:
            logger.warning(f"No data sources provided for player {player_id}")
            return {}, None

        try:
            # Check cache first
            cache_key = f"player_{player_id}_{hash(frozenset(data_sources.keys()))}"
            if (
                self.config.cache_validation_results
                and cache_key in self.validation_cache
            ):
                self.performance_metrics["cache_hits"] += 1
                cached_result = self.validation_cache[cache_key]
                logger.debug(f"Using cached validation for player {player_id}")
                return cached_result["data"], cached_result["report"]

            # Perform validation with timeout
            validation_task = self.orchestrator.validate_player_data(
                data_sources, player_id
            )
            validation_report = await asyncio.wait_for(
                validation_task, timeout=self.config.validation_timeout
            )

            # Extract enhanced data
            enhanced_data = await self._extract_enhanced_data(
                validation_report, data_sources
            )

            # Cache results
            if self.config.cache_validation_results:
                self.validation_cache[cache_key] = {
                    "data": enhanced_data,
                    "report": validation_report,
                    "timestamp": datetime.now(),
                }

            # Update metrics
            self.performance_metrics["validations_performed"] += 1
            self.performance_metrics["validation_time_total"] += (
                time.time() - start_time
            )

            if validation_report.conflicts:
                self.performance_metrics["conflicts_resolved"] += len(
                    validation_report.conflicts
                )

                if self.config.alert_on_conflicts:
                    logger.warning(
                        f"Data conflicts detected for player {player_id}: "
                        f"{len(validation_report.conflicts)} conflicts resolved"
                    )

            logger.info(
                f"✅ Player {player_id} validation completed "
                f"(confidence: {validation_report.confidence_score:.2f})"
            )

            return enhanced_data, validation_report

        except asyncio.TimeoutError:
            logger.warning(f"Validation timeout for player {player_id}")
            if self.config.enable_fallback_on_failure:
                return await self._handle_validation_fallback(data_sources, "timeout")
            return {}, None

        except Exception as e:
            logger.error(f"Validation error for player {player_id}: {e}")
            if self.config.enable_fallback_on_failure:
                return await self._handle_validation_fallback(
                    data_sources, f"error: {e}"
                )
            return {}, None

    async def validate_and_enhance_game_data(
        self,
        game_id: int,
        mlb_stats_data: Optional[Dict[str, Any]] = None,
        baseball_savant_data: Optional[Dict[str, Any]] = None,
        statsapi_data: Optional[Dict[str, Any]] = None,
        external_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], CrossValidationReport]:
        """Validate game data from multiple sources and return enhanced data"""
        if not self.config.enable_validation:
            for data in [
                mlb_stats_data,
                baseball_savant_data,
                statsapi_data,
                external_data,
            ]:
                if data:
                    return data, None
            return {}, None

        # Build data sources dictionary
        data_sources = {}
        if mlb_stats_data:
            data_sources[DataSource.MLB_STATS_API] = mlb_stats_data
        if baseball_savant_data:
            data_sources[DataSource.BASEBALL_SAVANT] = baseball_savant_data
        if statsapi_data:
            data_sources[DataSource.STATSAPI] = statsapi_data
        if external_data:
            data_sources[DataSource.EXTERNAL_API] = external_data

        if not data_sources:
            return {}, None

        try:
            validation_report = await asyncio.wait_for(
                self.orchestrator.validate_game_data(data_sources, game_id),
                timeout=self.config.validation_timeout,
            )

            enhanced_data = await self._extract_enhanced_data(
                validation_report, data_sources
            )

            logger.info(
                f"✅ Game {game_id} validation completed "
                f"(confidence: {validation_report.confidence_score:.2f})"
            )

            return enhanced_data, validation_report

        except asyncio.TimeoutError:
            logger.warning(f"Validation timeout for game {game_id}")
            if self.config.enable_fallback_on_failure:
                return await self._handle_validation_fallback(data_sources, "timeout")
            return {}, None

        except Exception as e:
            logger.error(f"Validation error for game {game_id}: {e}")
            if self.config.enable_fallback_on_failure:
                return await self._handle_validation_fallback(
                    data_sources, f"error: {e}"
                )
            return {}, None

    async def validate_prop_generation_data(
        self, game_id: int, collected_data: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Validate data collected for prop generation

        Args:
            game_id: Game ID for context
            collected_data: Combined data from all sources

        Returns:
            Tuple of (validated_data, warnings)
        """
        warnings = []

        if not self.config.enable_validation:
            return collected_data, warnings

        try:
            # Extract player and game data for validation
            players_data = collected_data.get("players", {})
            game_data = collected_data.get("game_info", {})

            validated_players = {}
            validated_game_data = game_data

            # Validate player data if available from multiple sources
            for player_id, player_info in players_data.items():
                if isinstance(player_info, dict) and len(player_info) > 1:
                    # Multiple data sources available - validate
                    enhanced_data, report = await self.validate_and_enhance_player_data(
                        int(player_id) if str(player_id).isdigit() else 0,
                        mlb_stats_data=player_info.get("mlb_stats"),
                        baseball_savant_data=player_info.get("baseball_savant"),
                        statsapi_data=player_info.get("statsapi"),
                    )

                    if (
                        report
                        and report.confidence_score
                        < self.config.min_confidence_threshold
                    ):
                        warnings.append(
                            f"Low confidence ({report.confidence_score:.2f}) for player {player_id}"
                        )

                    validated_players[player_id] = enhanced_data
                else:
                    # Single source or no validation needed
                    validated_players[player_id] = player_info

            # Validate game data if available from multiple sources
            if isinstance(game_data, dict) and len(game_data) > 1:
                enhanced_game_data, game_report = (
                    await self.validate_and_enhance_game_data(
                        game_id,
                        mlb_stats_data=game_data.get("mlb_stats"),
                        baseball_savant_data=game_data.get("baseball_savant"),
                        statsapi_data=game_data.get("statsapi"),
                    )
                )

                if (
                    game_report
                    and game_report.confidence_score
                    < self.config.min_confidence_threshold
                ):
                    warnings.append(
                        f"Low confidence ({game_report.confidence_score:.2f}) for game {game_id}"
                    )

                validated_game_data = enhanced_game_data

            # Rebuild validated data structure
            validated_data = dict(collected_data)
            validated_data["players"] = validated_players
            validated_data["game_info"] = validated_game_data

            # Add validation metadata
            validated_data["validation_metadata"] = {
                "validated_at": datetime.now().isoformat(),
                "validation_enabled": True,
                "warnings": warnings,
                "players_validated": len(validated_players),
                "game_validated": bool(validated_game_data),
            }

            logger.info(
                f"✅ Prop generation data validated for game {game_id} "
                f"({len(validated_players)} players, {len(warnings)} warnings)"
            )

            return validated_data, warnings

        except Exception as e:
            logger.error(f"Prop validation error for game {game_id}: {e}")
            warnings.append(f"Validation error: {e}")
            return collected_data, warnings

    async def _extract_enhanced_data(
        self,
        validation_report: CrossValidationReport,
        original_sources: Dict[DataSource, Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Extract enhanced data from validation report"""
        if validation_report.consensus_data:
            # Use consensus data as primary
            enhanced_data = dict(validation_report.consensus_data)
        else:
            # Fallback to highest confidence source
            best_result = max(
                validation_report.validation_results, key=lambda r: r.confidence_score
            )
            enhanced_data = best_result.data if best_result.data else {}

        # Add validation metadata
        enhanced_data["_validation"] = {
            "confidence_score": validation_report.confidence_score,
            "quality_score": validation_report.get_quality_score(),
            "conflicts_resolved": len(validation_report.conflicts),
            "sources_used": [s.value for s in validation_report.comparison_sources],
            "validated_at": validation_report.generated_at.isoformat(),
        }

        return enhanced_data

    async def _handle_validation_fallback(
        self, data_sources: Dict[DataSource, Dict[str, Any]], reason: str
    ) -> Tuple[Dict[str, Any], None]:
        """Handle validation failure with fallback mechanism"""
        self.performance_metrics["fallbacks_triggered"] += 1

        logger.warning(f"Validation fallback triggered: {reason}")

        # Priority order for fallback
        priority_sources = [
            DataSource.BASEBALL_SAVANT,  # Highest quality
            DataSource.MLB_STATS_API,  # Official data
            DataSource.STATSAPI,  # Reliable alternative
            DataSource.EXTERNAL_API,  # Last resort
        ]

        for source in priority_sources:
            if source in data_sources and data_sources[source]:
                fallback_data = dict(data_sources[source])
                fallback_data["_fallback"] = {
                    "reason": reason,
                    "source": source.value,
                    "timestamp": datetime.now().isoformat(),
                }
                logger.info(f"Using fallback data from {source.value}")
                return fallback_data, None

        # No viable fallback
        logger.error("No viable fallback data source available")
        return {}, None

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get validation integration performance metrics"""
        metrics = dict(self.performance_metrics)

        # Calculate derived metrics
        if metrics["validations_performed"] > 0:
            metrics["average_validation_time"] = (
                metrics["validation_time_total"] / metrics["validations_performed"]
            )
            metrics["cache_hit_rate"] = (
                metrics["cache_hits"] / metrics["validations_performed"]
            )
        else:
            metrics["average_validation_time"] = 0.0
            metrics["cache_hit_rate"] = 0.0

        metrics["cache_size"] = len(self.validation_cache)
        metrics["config"] = {
            "validation_enabled": self.config.enable_validation,
            "cross_validation_enabled": self.config.enable_cross_validation,
            "timeout": self.config.validation_timeout,
            "min_confidence": self.config.min_confidence_threshold,
        }
        metrics["generated_at"] = datetime.now().isoformat()

        return metrics

    def clear_cache(self):
        """Clear validation cache"""
        cache_size = len(self.validation_cache)
        self.validation_cache.clear()
        logger.info(f"🧹 Cleared validation cache ({cache_size} entries)")

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on validation system"""
        try:
            # Test basic validation functionality
            test_data = {DataSource.MLB_STATS_API: {"test": "data", "value": 1}}

            start_time = time.time()
            await asyncio.wait_for(
                self.orchestrator.validate_player_data(test_data, 999999), timeout=2.0
            )
            response_time = time.time() - start_time

            return {
                "status": "healthy",
                "response_time": response_time,
                "validation_enabled": self.config.enable_validation,
                "cache_size": len(self.validation_cache),
                "total_validations": self.performance_metrics["validations_performed"],
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "validation_enabled": self.config.enable_validation,
            }


# Global integration service instance
validation_integration_service = DataValidationIntegrationService()
