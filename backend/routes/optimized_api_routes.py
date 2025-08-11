"""
Optimized API Routes - Phase 4 Performance Enhancement
High-performance endpoints with caching, error handling, and monitoring
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional

from backend.services.enhanced_api_service import get_api_service, EnhancedAPIService, APIResponse
from backend.utils.enhanced_logging import get_logger

logger = get_logger("optimized_routes")

router = APIRouter()


@router.get("/health", response_model=APIResponse)
async def health_check(
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> APIResponse:
    """Enhanced health check with performance metrics"""
    return await api_service.get_health_status()


@router.get("/mlb/todays-games", response_model=APIResponse)
async def get_mlb_games(
    use_cache: bool = Query(True, description="Use cached data if available"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> APIResponse:
    """Get today's MLB games with performance optimization"""
    try:
        return await api_service.get_mlb_games(use_cache=use_cache)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_mlb_games: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/mlb/comprehensive-props/{game_id}", response_model=APIResponse)
async def get_comprehensive_props(
    game_id: str,
    use_cache: bool = Query(True, description="Use cached data if available"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> APIResponse:
    """Get comprehensive props for a specific game"""
    try:
        return await api_service.get_game_props(game_id, use_cache=use_cache)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_comprehensive_props: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/ml/predict", response_model=APIResponse)
async def get_ml_prediction(
    player: str = Query(..., description="Player name"),
    prop_type: str = Query(..., description="Type of prop (hits, runs, rbis, etc.)"),
    line: float = Query(..., description="Betting line"),
    use_cache: bool = Query(True, description="Use cached predictions if available"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> APIResponse:
    """Get AI/ML prediction for player prop"""
    try:
        return await api_service.get_player_predictions(player, prop_type, line, use_cache=use_cache)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_ml_prediction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/api/v1/odds/{event_id}", response_model=APIResponse)
async def get_odds_detail(
    event_id: str,
    trigger: Optional[str] = Query(None, description="Trigger parameter"),
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> APIResponse:
    """Get odds detail for specific event (backward compatibility)"""
    try:
        # For backward compatibility, treat as game props
        return await api_service.get_game_props(event_id, use_cache=True)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_odds_detail: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/mlb/ml-performance-analytics", response_model=APIResponse)
async def get_ml_performance_analytics(
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> APIResponse:
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
        
        return APIResponse(
            data=performance_data,
            message="ML performance analytics retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in get_ml_performance_analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/performance/stats", response_model=APIResponse)
async def get_performance_stats(
    api_service: EnhancedAPIService = Depends(get_api_service)
) -> APIResponse:
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
        
        return APIResponse(
            data=stats_data,
            message="Performance statistics retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in get_performance_stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Include additional backward compatibility routes
@router.get("/api/v1/dashboard/layouts")
async def get_dashboard_layouts(api_service: EnhancedAPIService = Depends(get_api_service)):
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
    
    return APIResponse(
        data=layouts_data,
        message="Dashboard layouts retrieved successfully"
    )


@router.get("/cheatsheets/{sport}")
async def get_cheatsheets(
    sport: str,
    api_service: EnhancedAPIService = Depends(get_api_service)
):
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
    
    return APIResponse(
        data=cheatsheets_data,
        message=f"{sport} cheatsheets retrieved successfully"
    )
