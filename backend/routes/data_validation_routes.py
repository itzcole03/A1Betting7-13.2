"""
Data Validation API Routes

API endpoints for data validation and cross-checking capabilities.
Provides real-time data quality metrics, validation reports, and health monitoring.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field

# Import validation services with fallback
try:
    from backend.services.data_validation_integration import (
        ValidationConfig,
        validation_integration_service,
    )
    from backend.services.data_validation_orchestrator import (
        DataSource,
        ValidationStatus,
        data_validation_orchestrator,
    )

    VALIDATION_AVAILABLE = True
except ImportError:
    VALIDATION_AVAILABLE = False

logger = logging.getLogger("validation_api")

router = APIRouter(prefix="/api/validation", tags=["data-validation"])


class ValidationConfigUpdate(BaseModel):
    """Model for updating validation configuration"""

    enable_validation: Optional[bool] = None
    enable_cross_validation: Optional[bool] = None
    validation_timeout: Optional[float] = Field(None, ge=1.0, le=60.0)
    min_confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    enable_fallback_on_failure: Optional[bool] = None
    cache_validation_results: Optional[bool] = None
    alert_on_conflicts: Optional[bool] = None


class PlayerValidationRequest(BaseModel):
    """Model for player data validation request"""

    player_id: int
    mlb_stats_data: Optional[Dict[str, Any]] = None
    baseball_savant_data: Optional[Dict[str, Any]] = None
    statsapi_data: Optional[Dict[str, Any]] = None
    external_data: Optional[Dict[str, Any]] = None


class GameValidationRequest(BaseModel):
    """Model for game data validation request"""

    game_id: int
    mlb_stats_data: Optional[Dict[str, Any]] = None
    baseball_savant_data: Optional[Dict[str, Any]] = None
    statsapi_data: Optional[Dict[str, Any]] = None
    external_data: Optional[Dict[str, Any]] = None


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def validation_health():
    """Get data validation system health status"""
    if not VALIDATION_AVAILABLE:
        return ResponseBuilder.success({
            "status": "unavailable",
            "message": "Data validation services not available",
            "available_features": [],
        })

    try:
        health_status = await validation_integration_service.health_check()

        return ResponseBuilder.success({
            "status": "healthy",
            "validation_available": True,
            "health_check": health_status,
            "available_features": [
                "cross_validation",
                "schema_validation",
                "statistical_validation",
                "consensus_algorithms",
                "performance_metrics",
            ],
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return ResponseBuilder.success({"status": "unhealthy", "error": str(e), "validation_available": False})


@router.get("/metrics", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_validation_metrics():
    """Get comprehensive data validation metrics"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        # Get integration service metrics
        integration_metrics = validation_integration_service.get_performance_metrics()

        # Get orchestrator metrics
        orchestrator_metrics = data_validation_orchestrator.get_data_quality_metrics()

        return ResponseBuilder.success({
            "integration_metrics": integration_metrics,
            "quality_metrics": orchestrator_metrics,
            "generated_at": datetime.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Error retrieving validation metrics: {e}")
        raise BusinessLogicException("f"Metrics retrieval failed: {e}")


@router.post("/validate/player", response_model=StandardAPIResponse[Dict[str, Any]])
async def validate_player_data(request: PlayerValidationRequest):
    """Validate player data from multiple sources"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        enhanced_data, validation_report = (
            await validation_integration_service.validate_and_enhance_player_data(
                player_id=request.player_id,
                mlb_stats_data=request.mlb_stats_data,
                baseball_savant_data=request.baseball_savant_data,
                statsapi_data=request.statsapi_data,
                external_data=request.external_data,
            )
        )

        response = {
            "player_id": request.player_id,
            "enhanced_data": enhanced_data,
            "status": "success",
        }

        if validation_report:
            response["validation_report"] = validation_report.to_dict()

        return ResponseBuilder.success(response)

    except Exception as e:
        logger.error(f"Player validation failed for {request.player_id}: {e}")
        raise BusinessLogicException("f"Player validation failed: {e}")


@router.post("/validate/game", response_model=StandardAPIResponse[Dict[str, Any]])
async def validate_game_data(request: GameValidationRequest):
    """Validate game data from multiple sources"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        enhanced_data, validation_report = (
            await validation_integration_service.validate_and_enhance_game_data(
                game_id=request.game_id,
                mlb_stats_data=request.mlb_stats_data,
                baseball_savant_data=request.baseball_savant_data,
                statsapi_data=request.statsapi_data,
                external_data=request.external_data,
            )
        )

        response = {
            "game_id": request.game_id,
            "enhanced_data": enhanced_data,
            "status": "success",
        }

        if validation_report:
            response["validation_report"] = validation_report.to_dict()

        return ResponseBuilder.success(response)

    except Exception as e:
        logger.error(f"Game validation failed for {request.game_id}: {e}")
        raise BusinessLogicException("f"Game validation failed: {e}")


@router.get("/validate/comprehensive/{game_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def validate_comprehensive_props_data(
    game_id: int,
    include_validation_report: bool = Query(
        False, description="Include detailed validation report"
    ),
):
    """Validate comprehensive props generation data for a game"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        # Import the comprehensive prop generator
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        # Create temporary instance for data collection
        generator = ComprehensivePropGenerator()

        # Collect data from multiple sources
        collected_data, warnings = await generator._collect_and_validate_data_sources(
            game_id
        )

        response = {
            "game_id": game_id,
            "status": "success",
            "data_sources": collected_data.get("validation_metadata", {}).get(
                "sources_successful", []
            ),
            "warnings": warnings,
            "validation_performed": collected_data.get("validation_metadata", {}).get(
                "validation_performed", False
            ),
        }

        if include_validation_report and collected_data.get(
            "validation_metadata", {}
        ).get("validation_performed"):
            response["detailed_validation"] = collected_data.get(
                "validation_metadata", {}
            )

        return ResponseBuilder.success(response)

    except Exception as e:
        logger.error(f"Comprehensive validation failed for game {game_id}: {e}")
        raise BusinessLogicException("f"Comprehensive validation failed: {e}"
        ")


@router.post("/config", response_model=StandardAPIResponse[Dict[str, Any]])
async def update_validation_config(config_update: ValidationConfigUpdate):
    """Update validation configuration"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        # Get current config
        current_config = validation_integration_service.config

        # Update configuration
        updates_applied = []

        if config_update.enable_validation is not None:
            current_config.enable_validation = config_update.enable_validation
            updates_applied.append("enable_validation")

        if config_update.enable_cross_validation is not None:
            current_config.enable_cross_validation = (
                config_update.enable_cross_validation
            )
            updates_applied.append("enable_cross_validation")

        if config_update.validation_timeout is not None:
            current_config.validation_timeout = config_update.validation_timeout
            updates_applied.append("validation_timeout")

        if config_update.min_confidence_threshold is not None:
            current_config.min_confidence_threshold = (
                config_update.min_confidence_threshold
            )
            updates_applied.append("min_confidence_threshold")

        if config_update.enable_fallback_on_failure is not None:
            current_config.enable_fallback_on_failure = (
                config_update.enable_fallback_on_failure
            )
            updates_applied.append("enable_fallback_on_failure")

        if config_update.cache_validation_results is not None:
            current_config.cache_validation_results = (
                config_update.cache_validation_results
            )
            updates_applied.append("cache_validation_results")

        if config_update.alert_on_conflicts is not None:
            current_config.alert_on_conflicts = config_update.alert_on_conflicts
            updates_applied.append("alert_on_conflicts")

        logger.info(f"Validation configuration updated: {updates_applied}")

        return ResponseBuilder.success({
            "status": "success",
            "updates_applied": updates_applied,
            "current_config": {
                "enable_validation": current_config.enable_validation,
                "enable_cross_validation": current_config.enable_cross_validation,
                "validation_timeout": current_config.validation_timeout,
                "min_confidence_threshold": current_config.min_confidence_threshold,
                "enable_fallback_on_failure": current_config.enable_fallback_on_failure,
                "cache_validation_results": current_config.cache_validation_results,
                "alert_on_conflicts": current_config.alert_on_conflicts,
            }),
        }

    except Exception as e:
        logger.error(f"Configuration update failed: {e}")
        raise BusinessLogicException("f"Configuration update failed: {e}")


@router.post("/cache/clear", response_model=StandardAPIResponse[Dict[str, Any]])
async def clear_validation_cache():
    """Clear validation cache"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        validation_integration_service.clear_cache()

        return ResponseBuilder.success({
            "status": "success",
            "message": "Validation cache cleared successfully",
            "timestamp": datetime.now().isoformat(),
        })

    except Exception as e:
        logger.error(f"Cache clear failed: {e}")
        raise BusinessLogicException("f"Cache clear failed: {e}")


@router.get("/sources", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_supported_data_sources():
    """Get list of supported data sources for validation"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        sources = [
            {
                "name": "MLB Stats API",
                "key": "mlb_stats_api",
                "description": "Official MLB statistics API",
            },
            {
                "name": "Baseball Savant",
                "key": "baseball_savant",
                "description": "Statcast advanced analytics data",
            },
            {
                "name": "statsapi",
                "key": "statsapi",
                "description": "Python MLB statistics API wrapper",
            },
            {
                "name": "External API",
                "key": "external_api",
                "description": "External sports data providers",
            },
        ]

        return ResponseBuilder.success({
            "supported_sources": sources,
            "total_sources": len(sources),
            "validation_available": True,
        })

    except Exception as e:
        logger.error(f"Error retrieving data sources: {e}")
        raise BusinessLogicException("f"Failed to retrieve data sources: {e}"
        ")


@router.get("/schemas", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_validation_schemas():
    """Get available validation schemas"""
    if not VALIDATION_AVAILABLE:
        raise BusinessLogicException("Data validation services not available"
        ")

    try:
        schemas = {
            "player_stats": {
                "description": "Schema for player statistics validation",
                "fields": [
                    "player_id",
                    "player_name",
                    "team",
                    "games_played",
                    "hits",
                    "home_runs",
                    "rbis",
                    "runs",
                    "avg",
                    "obp",
                    "slg",
                ],
            },
            "game_data": {
                "description": "Schema for game data validation",
                "fields": [
                    "game_id",
                    "home_team",
                    "away_team",
                    "home_score",
                    "away_score",
                    "inning",
                    "game_state",
                ],
            },
        }

        return ResponseBuilder.success({"available_schemas": schemas, "schema_validation_available": True})

    except Exception as e:
        logger.error(f"Error retrieving validation schemas: {e}")
        raise BusinessLogicException("f"Failed to retrieve schemas: {e}")
