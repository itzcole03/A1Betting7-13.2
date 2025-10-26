"""
Optimized Real-Time Data Routes
API endpoints for the optimized real-time data service addressing all 7 critical bottlenecks
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Create router for optimized real-time data
router = APIRouter(prefix="/api/optimized-realtime", tags=["Optimized Real-Time Data"])

# Global service instance (will be initialized lazily)
optimized_service = None


async def get_optimized_service():
    """Get or create the optimized real-time data service"""
    global optimized_service
    if optimized_service is None:
        try:
            from ..services.optimized_real_time_data_service import OptimizedRealTimeDataService
            
            # Initialize with default configuration
            config = {
                "redis_url": "redis://localhost:6379",
                "rate_limits": {
                    "api_calls_per_minute": 60,
                    "api_calls_per_second": 2
                },
                "circuit_breaker": {
                    "failure_threshold": 5,
                    "recovery_timeout": 60
                },
                "cache_ttl": {
                    "player_data": 300,  # 5 minutes
                    "game_data": 180,    # 3 minutes
                    "stats_data": 600    # 10 minutes
                },
                "websocket": {
                    "port": 8765,
                    "heartbeat_interval": 30
                }
            }
            
            optimized_service = OptimizedRealTimeDataService(config)
            await optimized_service.initialize()
            logger.info("Optimized real-time data service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize optimized service: {e}")
            raise BusinessLogicException("f"Service initialization failed: {str(e")}")
    
    return ResponseBuilder.success(optimized_service)


class PlayerDataRequest(BaseModel):
    """Request model for player data"""
    player_id: str
    sport: str = "MLB"
    force_refresh: bool = False
    include_advanced_metrics: bool = True


class PlayerSearchRequest(BaseModel):
    """Request model for player search"""
    query: str
    sport: str = "MLB"
    limit: int = 10


class HealthMetricsResponse(BaseModel):
    """Response model for health metrics"""
    overall_health: str
    service_metrics: Dict[str, Any]
    circuit_breaker_status: Dict[str, Any]
    cache_metrics: Dict[str, Any]
    rate_limit_status: Dict[str, Any]
    timestamp: str


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def health_check():
    """Health check endpoint for optimized real-time service"""
    try:
        service = await get_optimized_service()
        health_data = await service.get_health_status()
        
        return ResponseBuilder.success({
            "status": "healthy",
            "service": "optimized_real_time_data",
            "health_data": health_data,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return ResponseBuilder.success({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })


@router.get("/metrics", response_model=HealthMetricsResponse)
async def get_comprehensive_metrics():
    """Get comprehensive system metrics and health information"""
    try:
        service = await get_optimized_service()
        
        # Get all metrics
        health_metrics = await service.get_health_metrics()
        circuit_breaker_status = await service.get_circuit_breaker_status()
        cache_metrics = await service.get_cache_metrics()
        rate_limit_status = await service.get_rate_limit_status()
        
        # Determine overall health
        overall_health = "healthy"
        for metric in health_metrics.values():
            if metric.get("consecutive_failures", 0) > 3:
                overall_health = "degraded"
                break
        
        return ResponseBuilder.success(HealthMetricsResponse(
            overall_health=overall_health,
            service_metrics=health_metrics,
            circuit_breaker_status=circuit_breaker_status,
            cache_metrics=cache_metrics,
            rate_limit_status=rate_limit_status,
            timestamp=datetime.now()).isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise BusinessLogicException("f"Metrics unavailable: {str(e")}")


@router.post("/player-data", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_optimized_player_data(request: PlayerDataRequest):
    """Get optimized player data with intelligent caching and real-time updates"""
    try:
        service = await get_optimized_service()
        
        start_time = datetime.now()
        
        # Get player data through optimized service
        player_data = await service.get_player_data(
            request.player_id,
            request.sport,
            force_refresh=request.force_refresh
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        if not player_data:
            raise BusinessLogicException("f"Player data not found for ID: {request.player_id}"
            ")
        
        # Get metadata about the response
        metadata = {
            "processing_time_ms": round(processing_time * 1000, 2),
            "data_sources": player_data.get("_sources", []),
            "cache_hit": processing_time < 0.1,  # Assume cache hit if very fast
            "data_quality": await service.assess_data_quality(player_data),
            "last_updated": player_data.get("_fetched_at"),
            "real_time_enabled": True
        }
        
        return ResponseBuilder.success({
            "player_data": player_data,
            "metadata": metadata,
            "status": "success"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get player data: {e}")
        raise BusinessLogicException("f"Data retrieval failed: {str(e")}")


@router.post("/search-players", response_model=StandardAPIResponse[Dict[str, Any]])
async def search_optimized_players(request: PlayerSearchRequest):
    """Search for players with optimized performance and caching"""
    try:
        service = await get_optimized_service()
        
        start_time = datetime.now()
        
        # Search players through optimized service
        search_results = await service.search_players(
            request.query,
            request.sport,
            request.limit
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ResponseBuilder.success({
            "results": search_results,
            "query": request.query,
            "sport": request.sport,
            "total_results": len(search_results),
            "processing_time_ms": round(processing_time * 1000, 2),
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Player search failed: {e}")
        raise BusinessLogicException("f"Search failed: {str(e")}")


@router.post("/cache/warm", response_model=StandardAPIResponse[Dict[str, Any]])
async def warm_cache(
    player_ids: List[str],
    sport: str = Query(default="MLB"),
    include_advanced: bool = Query(default=True)
):
    """Warm cache for multiple players to improve response times"""
    try:
        service = await get_optimized_service()
        
        start_time = datetime.now()
        
        # Warm cache for all players
        results = await service.warm_cache(player_ids, sport, include_advanced)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ResponseBuilder.success({
            "cache_warming": {
                "players_processed": len(player_ids),
                "successful": results.get("successful", 0),
                "failed": results.get("failed", 0),
                "processing_time_seconds": processing_time,
                "status": "completed"
            })
        }
        
    except Exception as e:
        logger.error(f"Cache warming failed: {e}")
        raise BusinessLogicException("f"Cache warming failed: {str(e")}")


@router.post("/cache/clear", response_model=StandardAPIResponse[Dict[str, Any]])
async def clear_cache(
    player_id: Optional[str] = Query(None),
    sport: str = Query(default="MLB"),
    clear_all: bool = Query(default=False)
):
    """Clear cache for specific player or all cached data"""
    try:
        service = await get_optimized_service()
        
        if clear_all:
            cleared_count = await service.clear_all_cache()
            return ResponseBuilder.success({
                "cache_clear": {
                    "scope": "all",
                    "cleared_entries": cleared_count,
                    "status": "completed"
                })
            }
        elif player_id:
            success = await service.clear_player_cache(player_id, sport)
            return ResponseBuilder.success({
                "cache_clear": {
                    "scope": "player",
                    "player_id": player_id,
                    "sport": sport,
                    "success": success,
                    "status": "completed"
                })
            }
        else:
            raise BusinessLogicException("Must specify player_id or set clear_all=true")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cache clear failed: {e}")
        raise BusinessLogicException("f"Cache clear failed: {str(e")}")


@router.get("/circuit-breaker/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_circuit_breaker_status():
    """Get status of all circuit breakers"""
    try:
        service = await get_optimized_service()
        status = await service.get_circuit_breaker_status()
        
        return ResponseBuilder.success({
            "circuit_breakers": status,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get circuit breaker status: {e}")
        raise BusinessLogicException("f"Status unavailable: {str(e")}")


@router.post("/circuit-breaker/reset", response_model=StandardAPIResponse[Dict[str, Any]])
async def reset_circuit_breaker(service_name: str):
    """Reset a specific circuit breaker"""
    try:
        service = await get_optimized_service()
        success = await service.reset_circuit_breaker(service_name)
        
        return ResponseBuilder.success({
            "circuit_breaker_reset": {
                "service": service_name,
                "success": success,
                "timestamp": datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Failed to reset circuit breaker: {e}")
        raise BusinessLogicException("f"Reset failed: {str(e")}")


@router.get("/rate-limits/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_rate_limit_status():
    """Get current rate limiting status"""
    try:
        service = await get_optimized_service()
        status = await service.get_rate_limit_status()
        
        return ResponseBuilder.success({
            "rate_limits": status,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get rate limit status: {e}")
        raise BusinessLogicException("f"Status unavailable: {str(e")}")


@router.get("/performance/benchmark", response_model=StandardAPIResponse[Dict[str, Any]])
async def run_performance_benchmark(
    iterations: int = Query(default=5, ge=1, le=20),
    include_cache_test: bool = Query(default=True)
):
    """Run performance benchmark to test optimization effectiveness"""
    try:
        service = await get_optimized_service()
        
        # Sample player IDs for testing
        test_players = ["aaron-judge", "mookie-betts", "shohei-ohtani", "vladimir-guerrero-jr", "ronald-acuna-jr"]
        
        benchmark_results = {
            "iterations": iterations,
            "test_players": test_players,
            "results": {
                "response_times": [],
                "cache_performance": {},
                "error_count": 0
            }
        }
        
        # Run benchmark iterations
        for i in range(iterations):
            start_time = datetime.now()
            
            try:
                # Test multiple player data requests
                tasks = []
                for player_id in test_players:
                    task = service.get_player_data(player_id, "MLB")
                    tasks.append(task)
                
                # Execute all requests concurrently
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Count errors
                errors = sum(1 for result in results if isinstance(result, Exception))
                benchmark_results["results"]["error_count"] += errors
                
                processing_time = (datetime.now() - start_time).total_seconds()
                benchmark_results["results"]["response_times"].append(processing_time)
                
            except Exception as e:
                logger.error(f"Benchmark iteration {i} failed: {e}")
                benchmark_results["results"]["error_count"] += 1
        
        # Get final performance metrics
        if include_cache_test:
            cache_metrics = await service.get_cache_metrics()
            benchmark_results["results"]["cache_performance"] = cache_metrics
        
        # Calculate summary statistics
        response_times = benchmark_results["results"]["response_times"]
        if response_times:
            benchmark_results["summary"] = {
                "average_response_time": sum(response_times) / len(response_times),
                "min_response_time": min(response_times),
                "max_response_time": max(response_times),
                "total_requests": len(test_players) * iterations,
                "error_rate": benchmark_results["results"]["error_count"] / (len(test_players) * iterations),
                "performance_grade": "excellent" if sum(response_times) / len(response_times) < 2.0 else "good"
            }
        
        return ResponseBuilder.success(benchmark_results)
        
    except Exception as e:
        logger.error(f"Performance benchmark failed: {e}")
        raise BusinessLogicException("f"Benchmark failed: {str(e")}")


# WebSocket endpoint for real-time updates
@router.websocket("/ws/player-updates")
async def websocket_player_updates(websocket: WebSocket):
    """WebSocket endpoint for real-time player data updates"""
    await websocket.accept()
    
    try:
        service = await get_optimized_service()
        
        # Register this websocket connection
        connection_id = f"ws_{datetime.now().timestamp()}"
        
        await websocket.send_json({
            "type": "connection_established",
            "connection_id": connection_id,
            "message": "Real-time updates active"
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_json()
                
                if data.get("type") == "subscribe":
                    player_id = data.get("player_id")
                    if player_id:
                        # Subscribe to player updates
                        await service.subscribe_to_player_updates(player_id, websocket)
                        await websocket.send_json({
                            "type": "subscribed",
                            "player_id": player_id,
                            "message": f"Subscribed to updates for {player_id}"
                        })
                
                elif data.get("type") == "unsubscribe":
                    player_id = data.get("player_id")
                    if player_id:
                        # Unsubscribe from player updates
                        await service.unsubscribe_from_player_updates(player_id, websocket)
                        await websocket.send_json({
                            "type": "unsubscribed",
                            "player_id": player_id,
                            "message": f"Unsubscribed from updates for {player_id}"
                        })
                
                elif data.get("type") == "ping":
                    # Respond to ping with pong
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket {connection_id} disconnected")
                break
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    finally:
        # Clean up subscriptions
        try:
            if 'service' in locals():
                await service.cleanup_websocket_subscriptions(websocket)
        except:
            pass


@router.get("/websocket/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_websocket_status():
    """Get WebSocket server status and connection count"""
    try:
        service = await get_optimized_service()
        status = await service.get_websocket_status()
        
        return ResponseBuilder.success({
            "websocket_server": status,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get WebSocket status: {e}")
        raise BusinessLogicException("f"Status unavailable: {str(e")}")


# Export router
__all__ = ["router"]
