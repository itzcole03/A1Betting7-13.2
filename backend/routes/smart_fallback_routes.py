"""
Smart Fallback Priority API Routes

REST API endpoints for monitoring and managing the smart fallback priority
system, including provider priorities, fallback analytics, and configuration.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from backend.core.exceptions import BusinessLogicException

from ..services.smart_fallback_priority_service import (
    FallbackConfiguration,
    FallbackReason,
    FallbackStrategy,
    ProviderPriority,
    SmartFallbackPriorityService,
    get_smart_fallback_service,
)

router = APIRouter(prefix="/api/fallback", tags=["Smart Fallback Priority"])
logger = logging.getLogger(__name__)


# Pydantic models for API responses
class ProviderPriorityResponse(BaseModel):
    """Response model for provider priority information"""

    provider_id: str
    priority_score: float
    confidence_score: float
    is_primary: bool
    circuit_state: str
    last_successful_request: float
    estimated_latency_ms: float
    staleness_seconds: float


class FallbackAnalyticsResponse(BaseModel):
    """Response model for fallback analytics"""

    performance: Dict[str, Any]
    recent_hour: Dict[str, Any]
    provider_reliability: Dict[str, float]
    active_fallbacks: int
    cache_hit_rate: float


class FallbackConfigurationResponse(BaseModel):
    """Response model for fallback configuration"""

    max_staleness_seconds: int
    min_confidence_threshold: float
    max_fallback_attempts: int
    fallback_timeout_seconds: int
    strategy: str
    primary_provider_priority_boost: float
    enable_circuit_breaker_fallback: bool
    enable_performance_fallback: bool
    manual_provider_order: Optional[List[str]]


class SetPrimaryProviderRequest(BaseModel):
    """Request model for setting primary provider"""

    context: str = Field(
        ..., description="Context identifier (e.g., 'odds_aggregation')"
    )
    provider_id: str = Field(..., description="Provider identifier to set as primary")


class SelectProviderRequest(BaseModel):
    """Request model for provider selection"""

    context: str = Field(..., description="Context identifier")
    available_providers: List[str] = Field(
        ..., description="List of available provider IDs"
    )
    current_provider: Optional[str] = Field(
        None, description="Currently selected provider ID"
    )


class ProviderSelectionResponse(BaseModel):
    """Response model for provider selection"""

    selected_provider: str
    fallback_reason: Optional[str]
    priorities: List[ProviderPriorityResponse]
    selection_time_ms: float


def get_fallback_service() -> SmartFallbackPriorityService:
    """Dependency to get the smart fallback service instance"""
    return get_smart_fallback_service()


@router.get("/health")
async def health_check():
    """Health check endpoint for smart fallback service"""
    try:
        service = get_fallback_service()
        return {
            "status": "healthy",
            "service": "Smart Fallback Priority Service",
            "version": "1.0.0",
            "active_contexts": len(service.primary_providers),
            "cached_priorities": len(service.priority_cache),
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        # Normalize error message for tests that assert on canonical text
        raise BusinessLogicException("Service unhealthy", status_code=503)


@router.get("/priorities/{context}")
async def get_provider_priorities(
    context: str,
    available_providers: str = Query(
        ..., description="Comma-separated list of provider IDs"
    ),
    force_refresh: bool = Query(
        False, description="Force refresh of cached priorities"
    ),
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
) -> List[ProviderPriorityResponse]:
    """
    Get provider priorities for a given context.

    Returns providers ordered by priority (highest first).
    """
    provider_list = [p.strip() for p in available_providers.split(",") if p.strip()]

    if not provider_list:
        raise BusinessLogicException("No providers specified", status_code=400)

    try:
        priorities = await service.get_provider_priorities(
            context, provider_list, force_refresh
        )

        return [
            ProviderPriorityResponse(
                provider_id=p.provider_id,
                priority_score=p.priority_score,
                confidence_score=p.confidence_score,
                is_primary=p.is_primary,
                circuit_state=p.circuit_state.value,
                last_successful_request=p.last_successful_request,
                estimated_latency_ms=p.estimated_latency_ms,
                staleness_seconds=p.staleness_seconds,
            )
            for p in priorities
        ]

    except Exception as e:
        logger.error(f"Error getting provider priorities for {context}: {e}")
        # Map underlying errors to a test-expected canonical message while
        # preserving the original error in logs.
        raise BusinessLogicException("Failed to get priorities", status_code=500)


@router.post("/primary-provider")
async def set_primary_provider(
    request: SetPrimaryProviderRequest,
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
):
    """Set the primary provider for a given context"""
    try:
        await service.set_primary_provider(request.context, request.provider_id)

        return {
            "success": True,
            "context": request.context,
            "primary_provider": request.provider_id,
            "message": f"Primary provider set to {request.provider_id} for context {request.context},",
        }

    except Exception as e:
        logger.error(f"Error setting primary provider: {e}")
        # Tests expect a canonical error message for this flow.
        raise BusinessLogicException("Failed to set primary provider", status_code=500)


@router.post("/select-provider")
async def select_optimal_provider(
    request: SelectProviderRequest,
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
) -> ProviderSelectionResponse:
    """
    Select the optimal provider based on current conditions.

    Returns the selected provider ID and reason for selection/fallback.
    """
    try:
        import time

        start_time = time.time()

        selected_provider, fallback_reason = await service.select_optimal_provider(
            request.context, request.available_providers, request.current_provider
        )

        # Get priorities for additional context
        priorities = await service.get_provider_priorities(
            request.context, request.available_providers
        )

        selection_time_ms = (time.time() - start_time) * 1000

        return ProviderSelectionResponse(
            selected_provider=selected_provider,
            fallback_reason=fallback_reason.value.lower() if fallback_reason else None,
            priorities=[
                ProviderPriorityResponse(
                    provider_id=p.provider_id,
                    priority_score=p.priority_score,
                    confidence_score=p.confidence_score,
                    is_primary=p.is_primary,
                    circuit_state=p.circuit_state.value,
                    last_successful_request=p.last_successful_request,
                    estimated_latency_ms=p.estimated_latency_ms,
                    staleness_seconds=p.staleness_seconds,
                )
                for p in priorities
            ],
            selection_time_ms=selection_time_ms,
        )

    except Exception as e:
        logger.error(f"Error selecting optimal provider: {e}")
        raise BusinessLogicException(str(e), status_code=500)


@router.get("/analytics")
async def get_fallback_analytics(
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
) -> FallbackAnalyticsResponse:
    """Get comprehensive fallback analytics and performance metrics"""
    try:
        analytics = service.get_fallback_analytics()

        return FallbackAnalyticsResponse(
            performance=analytics["performance"],
            recent_hour=analytics["recent_hour"],
            provider_reliability=analytics["provider_reliability"],
            active_fallbacks=analytics["active_fallbacks"],
            cache_hit_rate=analytics["cache_hit_rate"],
        )

    except Exception as e:
        logger.error(f"Error getting fallback analytics: {e}")
        raise BusinessLogicException(str(e), status_code=500)


@router.get("/configuration")
async def get_fallback_configuration(
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
) -> FallbackConfigurationResponse:
    """Get current fallback configuration"""
    try:
        config = service.config

        return FallbackConfigurationResponse(
            max_staleness_seconds=config.max_staleness_seconds,
            min_confidence_threshold=config.min_confidence_threshold,
            max_fallback_attempts=config.max_fallback_attempts,
            fallback_timeout_seconds=config.fallback_timeout_seconds,
            strategy=config.strategy.value.lower(),
            primary_provider_priority_boost=config.primary_provider_priority_boost,
            enable_circuit_breaker_fallback=config.enable_circuit_breaker_fallback,
            enable_performance_fallback=config.enable_performance_fallback,
            manual_provider_order=config.manual_provider_order,
        )

    except Exception as e:
        logger.error(f"Error getting fallback configuration: {e}")
        raise BusinessLogicException(str(e), status_code=500)


@router.get("/contexts")
async def get_active_contexts(
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
) -> Dict[str, str]:
    """Get all active contexts and their primary providers"""
    try:
        return service.primary_providers.copy()

    except Exception as e:
        logger.error(f"Error getting active contexts: {e}")
        raise BusinessLogicException(str(e), status_code=500)


@router.delete("/cache")
async def clear_priority_cache(
    context: Optional[str] = Query(
        None, description="Specific context to clear, or all if not specified"
    ),
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
):
    """Clear priority cache for specific context or all contexts"""
    try:
        if context:
            # Clear cache for specific context
            keys_to_remove = [
                key
                for key in service.priority_cache.keys()
                if key.startswith(f"{context}:")
            ]
            for key in keys_to_remove:
                del service.priority_cache[key]

            return {
                "success": True,
                "context": context,
                "cleared_entries": len(keys_to_remove),
                "message": f"Cache cleared for context: {context},",
            }
        else:
            # Clear all cache
            cache_size = len(service.priority_cache)
            service.priority_cache.clear()

            return {
                "success": True,
                "cleared_entries": cache_size,
                "message": "All priority cache cleared",
            }

    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise BusinessLogicException(str(e), status_code=500)


@router.post("/cleanup")
async def cleanup_old_data(
    max_age_hours: int = Query(24, description="Maximum age in hours for data to keep"),
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
):
    """Clean up old fallback events and cache entries"""
    if max_age_hours <= 0:
        raise BusinessLogicException("max_age_hours must be positive", status_code=400)

    try:
        history_count_before = len(service.fallback_history)
        cache_count_before = len(service.priority_cache)

        await service.cleanup_old_data(max_age_hours)

        history_count_after = len(service.fallback_history)
        cache_count_after = len(service.priority_cache)

        return {
            "success": True,
            "max_age_hours": max_age_hours,
            "fallback_events": {
                "before": history_count_before,
                "after": history_count_after,
                "removed": history_count_before - history_count_after,
            },
            "cache_entries": {
                "before": cache_count_before,
                "after": cache_count_after,
                "removed": cache_count_before - cache_count_after,
            },
        }

    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise BusinessLogicException(str(e), status_code=500)


@router.get("/status")
async def get_system_status(
    service: SmartFallbackPriorityService = Depends(get_fallback_service),
) -> Dict[str, Any]:
    """Get comprehensive system status including recent activity"""
    try:
        import time

        current_time = time.time()

        # Get recent events (last hour)
        recent_events = [
            e for e in service.fallback_history if current_time - e.timestamp < 3600
        ]

        status = {
            "system": "Smart Fallback Priority Service",
            "status": "active",
            "uptime_info": {
                "primary_providers": len(service.primary_providers),
                "active_contexts": list(service.primary_providers.keys()),
                "cached_priorities": len(service.priority_cache),
            },
            "recent_activity": {
                "fallback_events_last_hour": len(recent_events),
                "successful_fallbacks": len([e for e in recent_events if e.success]),
                "failed_fallbacks": len([e for e in recent_events if not e.success]),
                "unique_providers_used": len(
                    set(e.fallback_provider for e in recent_events)
                ),
            },
            "configuration": {
                "strategy": service.config.strategy.value.lower(),
                "max_staleness_seconds": service.config.max_staleness_seconds,
                "min_confidence_threshold": service.config.min_confidence_threshold,
                "max_fallback_attempts": service.config.max_fallback_attempts,
            },
            "performance": service.fallback_performance,
        }

        return status

    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise BusinessLogicException(str(e), status_code=500)


# Add router to the main application
def setup_fallback_routes(app):
    """Setup fallback priority routes in the FastAPI application"""
    app.include_router(router)
