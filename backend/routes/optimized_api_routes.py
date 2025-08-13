"""
Optimized API Routes - Phase 4 Performance Enhancement
High-performance endpoints with caching, error handling, and monitoring
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, Dict, Any

from backend.services.enhanced_api_service import get_api_service, EnhancedAPIService, APIResponse
from backend.utils.enhanced_logging import get_logger
from backend.utils.standard_responses import StandardAPIResponse, ResponseBuilder, BusinessLogicException, ResponseMeta

logger = get_logger("optimized_routes")

router = APIRouter()


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def health_check(
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Enhanced health check with performance metrics"""
    result = await api_service.get_health_status()
    # Convert APIResponse to dict data if needed
    if hasattr(result, 'data'):
        data = result.data if isinstance(result.data, dict) else {"result": result.data}
    elif isinstance(result, dict):
        data = result
    else:
        data = {"result": result}
    
    return StandardAPIResponse[Dict[str, Any]](
        success=True,
        data=data,
        error=None,
        meta=ResponseMeta()
    )


@router.get("/mlb/todays-games", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_mlb_games(
    use_cache: bool = Query(True, description="Use cached data if available"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get today's MLB games with performance optimization"""
    try:
        result = await api_service.get_mlb_games(use_cache=use_cache)
        # Convert APIResponse to dict data if needed
        if hasattr(result, 'data'):
            data = result.data if isinstance(result.data, dict) else {"result": result.data}
        elif isinstance(result, dict):
            data = result
        else:
            data = {"result": result}
        
        return StandardAPIResponse[Dict[str, Any]](
            success=True,
            data=data,
            error=None,
            meta=ResponseMeta()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_mlb_games: {e}")
        raise BusinessLogicException("Failed to retrieve MLB games", {"error": str(e)})


@router.get("/mlb/comprehensive-props/{game_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_comprehensive_props(
    game_id: str,
    use_cache: bool = Query(True, description="Use cached data if available"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get comprehensive props for a specific game"""
    try:
        result = await api_service.get_game_props(game_id, use_cache=use_cache)
        # Convert APIResponse to dict data if needed
        if hasattr(result, 'data'):
            data = result.data if isinstance(result.data, dict) else {"result": result.data}
        elif isinstance(result, dict):
            data = result
        else:
            data = {"result": result}
        
        return StandardAPIResponse[Dict[str, Any]](
            success=True,
            data=data,
            error=None,
            meta=ResponseMeta()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_comprehensive_props: {e}")
        raise BusinessLogicException("Failed to retrieve comprehensive props", {"game_id": game_id, "error": str(e)})


@router.get("/ml/predict", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_ml_prediction(
    player: str = Query(..., description="Player name"),
    prop_type: str = Query(..., description="Type of prop (hits, runs, rbis, etc.)"),
    line: float = Query(..., description="Betting line"),
    use_cache: bool = Query(True, description="Use cached predictions if available"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get AI/ML prediction for player prop"""
    try:
        result = await api_service.get_player_predictions(player, prop_type, line, use_cache=use_cache)
        # Convert APIResponse to dict data if needed
        if hasattr(result, 'data'):
            data = result.data if isinstance(result.data, dict) else {"result": result.data}
        elif isinstance(result, dict):
            data = result
        else:
            data = {"result": result}
        
        return StandardAPIResponse[Dict[str, Any]](
            success=True,
            data=data,
            error=None,
            meta=ResponseMeta()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_ml_prediction: {e}")
        raise BusinessLogicException("Failed to generate ML prediction", {"player": player, "prop_type": prop_type, "error": str(e)})


@router.get("/api/v1/odds/{event_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_odds_detail(
    event_id: str,
    trigger: Optional[str] = Query(None, description="Trigger parameter"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get odds detail for specific event (backward compatibility)"""
    try:
        # For backward compatibility, treat as game props
        result = await api_service.get_game_props(event_id, use_cache=True)
        # Convert APIResponse to dict data if needed
        if hasattr(result, 'data'):
            data = result.data if isinstance(result.data, dict) else {"result": result.data}
        elif isinstance(result, dict):
            data = result
        else:
            data = {"result": result}
        
        return StandardAPIResponse[Dict[str, Any]](
            success=True,
            data=data,
            error=None,
            meta=ResponseMeta()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_odds_detail: {e}")
        raise BusinessLogicException("Failed to retrieve odds details", {"event_id": event_id, "error": str(e)})


@router.get("/mlb/ml-performance-analytics", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_ml_performance_analytics(
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get ML model performance analytics"""
    try:
        # Return mock ML performance data
        performance_data = {
            "model_performance": {
                "accuracy": 0.847,
                "precision": 0.832,
                "recall": 0.865,
                "f1_score": 0.848
            },
            "ensemble_metrics": {
                "xgboost_weight": 0.35,
                "random_forest_weight": 0.30,
                "lstm_weight": 0.25,
                "fallback_weight": 0.10
            },
            "uncertainty_quantification": {
                "confidence_calibration": 0.91,
                "prediction_intervals": "95%",
                "epistemic_uncertainty": 0.08,
                "aleatoric_uncertainty": 0.12
            },
            "system_health": {
                "api_uptime": "99.8%",
                "cache_hit_rate": "87.3%",
                "avg_response_time_ms": 45.2,
                "error_rate": "0.2%"
            }
        }
        
        return StandardAPIResponse[Dict[str, Any]](
            success=True,
            data=performance_data,
            error=None,
            meta=ResponseMeta()
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in get_ml_performance_analytics: {e}")
        raise BusinessLogicException("Failed to retrieve ML performance analytics", {"error": str(e)})


@router.get("/performance/stats", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_performance_stats(
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get detailed performance statistics"""
    try:
        from backend.services.enhanced_api_service import performance_monitor
        from backend.services.optimized_cache_service import get_cache_service
        
        # Get cache stats
        cache_service = await get_cache_service()
        cache_stats = await cache_service.get_stats()
        
        # Get API performance stats
        api_stats = performance_monitor.get_stats()
        
        stats_data = {
            "cache_performance": cache_stats,
            "api_performance": api_stats,
            "system_info": {
                "optimization_level": "Phase 4 Enhanced",
                "caching_strategy": "Redis with Memory Fallback",
                "monitoring": "Real-time Performance Tracking"
            }
        }
        
        return StandardAPIResponse[Dict[str, Any]](
            success=True,
            data=stats_data,
            error=None,
            meta=ResponseMeta()
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in get_performance_stats: {e}")
        raise BusinessLogicException("Failed to retrieve performance statistics", {"error": str(e)})


@router.get("/api/v1/dashboard/layouts", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_dashboard_layouts(
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get dashboard layouts (backward compatibility)"""
    layouts_data = {
        "layouts": [
            {
                "id": "default",
                "name": "Default Dashboard",
                "widgets": ["performance_card", "props_list", "ai_insights"],
                "grid_cols": 6,
                "created_at": "2025-01-08T00:00:00Z"
            },
            {
                "id": "advanced",
                "name": "Advanced Analytics",
                "widgets": ["ml_models", "performance_metrics", "optimization_panel"],
                "grid_cols": 8,
                "created_at": "2025-01-08T00:00:00Z"
            }
        ]
    }
    
    return StandardAPIResponse[Dict[str, Any]](
        success=True,
        data=layouts_data,
        error=None,
        meta=ResponseMeta()
    )


@router.get("/cheatsheets/{sport}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_cheatsheets(
    sport: str,
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get cheatsheets for specific sport (backward compatibility)"""
    cheatsheets_data = {
        "sport": sport,
        "cheatsheets": [
            {
                "title": f"{sport.upper()} Player Prop Guide",
                "description": "Comprehensive analysis of player prop betting",
                "updated": "2025-01-08T12:00:00Z"
            }
        ]
    }
    
    return StandardAPIResponse[Dict[str, Any]](
        success=True,
        data=cheatsheets_data,
        error=None,
        meta=ResponseMeta()
    )
