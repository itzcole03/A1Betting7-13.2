"""
Phase 2 Performance API Routes
Provides endpoints for Phase 2 performance optimization services.
"""

from typing import Dict, List, Optional, Any

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

try:
    from backend.utils.structured_logging import app_logger, performance_logger
except ImportError:
    import logging

    app_logger = logging.getLogger("phase2_routes")
    performance_logger = logging.getLogger("performance")

# Phase 2 service imports with graceful fallbacks
try:
    from backend.services.async_connection_pool import async_connection_pool_manager

    CONNECTION_POOL_AVAILABLE = True
except ImportError:
    CONNECTION_POOL_AVAILABLE = False

try:
    from backend.services.advanced_caching_system import advanced_caching_system

    ADVANCED_CACHE_AVAILABLE = True
except ImportError:
    ADVANCED_CACHE_AVAILABLE = False

try:
    from backend.services.query_optimizer import query_optimizer

    QUERY_OPTIMIZER_AVAILABLE = True
except ImportError:
    QUERY_OPTIMIZER_AVAILABLE = False

try:
    from backend.services.background_task_manager import background_task_manager

    BACKGROUND_TASKS_AVAILABLE = True
except ImportError:
    BACKGROUND_TASKS_AVAILABLE = False

try:
    from backend.services.response_optimizer import response_optimizer

    RESPONSE_OPTIMIZER_AVAILABLE = True
except ImportError:
    RESPONSE_OPTIMIZER_AVAILABLE = False


router = APIRouter(prefix="/api/phase2", tags=["Phase 2 Performance"])


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def phase2_health_check():
    """
    Comprehensive health check for all Phase 2 services
    """
    health_status = {
        "status": "healthy",
        "services": {},
        "summary": {
            "total_services": 5,
            "healthy_services": 0,
            "degraded_services": 0,
            "unhealthy_services": 0,
            "unavailable_services": 0,
        },
    }

    # Check connection pool
    if CONNECTION_POOL_AVAILABLE:
        try:
            pool_health = await async_connection_pool_manager.health_check()
            health_status["services"]["connection_pool"] = pool_health

            if pool_health["status"] == "healthy":
                health_status["summary"]["healthy_services"] += 1
            elif pool_health["status"] == "degraded":
                health_status["summary"]["degraded_services"] += 1
            else:
                health_status["summary"]["unhealthy_services"] += 1

        except Exception as e:
            health_status["services"]["connection_pool"] = {
                "status": "unhealthy",
                "error": str(e),
            }
            health_status["summary"]["unhealthy_services"] += 1
    else:
        health_status["services"]["connection_pool"] = {
            "status": "unavailable",
            "error": "Service not installed",
        }
        health_status["summary"]["unavailable_services"] += 1

    # Check advanced caching
    if ADVANCED_CACHE_AVAILABLE:
        try:
            cache_health = await advanced_caching_system.health_check()
            health_status["services"]["advanced_cache"] = cache_health

            if cache_health["status"] == "healthy":
                health_status["summary"]["healthy_services"] += 1
            elif cache_health["status"] == "degraded":
                health_status["summary"]["degraded_services"] += 1
            else:
                health_status["summary"]["unhealthy_services"] += 1

        except Exception as e:
            health_status["services"]["advanced_cache"] = {
                "status": "unhealthy",
                "error": str(e),
            }
            health_status["summary"]["unhealthy_services"] += 1
    else:
        health_status["services"]["advanced_cache"] = {
            "status": "unavailable",
            "error": "Service not installed",
        }
        health_status["summary"]["unavailable_services"] += 1

    # Check query optimizer
    if QUERY_OPTIMIZER_AVAILABLE:
        try:
            optimizer_health = await query_optimizer.health_check()
            health_status["services"]["query_optimizer"] = optimizer_health

            if optimizer_health["status"] == "healthy":
                health_status["summary"]["healthy_services"] += 1
            elif optimizer_health["status"] == "degraded":
                health_status["summary"]["degraded_services"] += 1
            else:
                health_status["summary"]["unhealthy_services"] += 1

        except Exception as e:
            health_status["services"]["query_optimizer"] = {
                "status": "unhealthy",
                "error": str(e),
            }
            health_status["summary"]["unhealthy_services"] += 1
    else:
        health_status["services"]["query_optimizer"] = {
            "status": "unavailable",
            "error": "Service not installed",
        }
        health_status["summary"]["unavailable_services"] += 1

    # Check background task manager
    if BACKGROUND_TASKS_AVAILABLE:
        try:
            task_health = await background_task_manager.health_check()
            health_status["services"]["background_tasks"] = task_health

            if task_health["status"] == "healthy":
                health_status["summary"]["healthy_services"] += 1
            elif task_health["status"] == "degraded":
                health_status["summary"]["degraded_services"] += 1
            else:
                health_status["summary"]["unhealthy_services"] += 1

        except Exception as e:
            health_status["services"]["background_tasks"] = {
                "status": "unhealthy",
                "error": str(e),
            }
            health_status["summary"]["unhealthy_services"] += 1
    else:
        health_status["services"]["background_tasks"] = {
            "status": "unavailable",
            "error": "Service not installed",
        }
        health_status["summary"]["unavailable_services"] += 1

    # Check response optimizer
    if RESPONSE_OPTIMIZER_AVAILABLE:
        try:
            response_health = await response_optimizer.health_check()
            health_status["services"]["response_optimizer"] = response_health

            if response_health["status"] == "healthy":
                health_status["summary"]["healthy_services"] += 1
            elif response_health["status"] == "degraded":
                health_status["summary"]["degraded_services"] += 1
            else:
                health_status["summary"]["unhealthy_services"] += 1

        except Exception as e:
            health_status["services"]["response_optimizer"] = {
                "status": "unhealthy",
                "error": str(e),
            }
            health_status["summary"]["unhealthy_services"] += 1
    else:
        health_status["services"]["response_optimizer"] = {
            "status": "unavailable",
            "error": "Service not installed",
        }
        health_status["summary"]["unavailable_services"] += 1

    # Determine overall status
    if health_status["summary"]["unhealthy_services"] > 0:
        health_status["status"] = "unhealthy"
    elif health_status["summary"]["degraded_services"] > 0:
        health_status["status"] = "degraded"

    return ResponseBuilder.success(health_status)


@router.get("/connection-pool/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_connection_pool_status():
    """Get async connection pool status and metrics"""

    if not CONNECTION_POOL_AVAILABLE:
        raise BusinessLogicException(
            "Connection pool service not available", 
            business_rule="service_availability"
        )

    try:
        status = await async_connection_pool_manager.get_pool_status()
        return ResponseBuilder.success(status)
    except Exception as e:
        app_logger.error(f"Error getting connection pool status: {e}")
        raise BusinessLogicException(
            "Failed to get connection pool status",
            business_rule="connection_pool_status_error"
        )


@router.get("/cache/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_cache_status():
    """Get advanced caching system status and metrics"""

    if not ADVANCED_CACHE_AVAILABLE:
        raise BusinessLogicException("Advanced cache service not available"
        ")

    try:
        status = await advanced_caching_system.get_cache_stats()
        return ResponseBuilder.success(status)
    except Exception as e:
        app_logger.error(f"Error getting cache status: {e}")
        raise BusinessLogicException("Failed to get cache status")


@router.delete("/cache/clear", response_model=StandardAPIResponse[Dict[str, Any]])
async def clear_cache(
    pattern: Optional[str] = Query(None, description="Pattern to match cache keys")
):
    """Clear cache entries"""

    if not ADVANCED_CACHE_AVAILABLE:
        raise BusinessLogicException("Advanced cache service not available"
        ")

    try:
        if pattern:
            result = await advanced_caching_system.delete_pattern(pattern)
        else:
            result = await advanced_caching_system.clear()

        return ResponseBuilder.success({"message": "Cache cleared successfully", "result": result})
    except Exception as e:
        app_logger.error(f"Error clearing cache: {e}")
        raise BusinessLogicException("Failed to clear cache")


@router.get("/query-optimizer/report", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_query_performance_report():
    """Get query optimizer performance report"""

    if not QUERY_OPTIMIZER_AVAILABLE:
        raise BusinessLogicException("Query optimizer service not available"
        ")

    try:
        report = query_optimizer.get_performance_report()
        return ResponseBuilder.success(report)
    except Exception as e:
        app_logger.error(f"Error getting query report: {e}")
        raise BusinessLogicException("Failed to get query performance report"
        ")


@router.get("/query-optimizer/slow-queries", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_slow_queries():
    """Get recent slow queries"""

    if not QUERY_OPTIMIZER_AVAILABLE:
        raise BusinessLogicException("Query optimizer service not available"
        ")

    try:
        slow_queries = query_optimizer.get_slow_queries()
        return ResponseBuilder.success({"slow_queries": slow_queries})
    except Exception as e:
        app_logger.error(f"Error getting slow queries: {e}")
        raise BusinessLogicException("Failed to get slow queries")


@router.get("/background-tasks/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_background_tasks_status():
    """Get background task manager status"""

    if not BACKGROUND_TASKS_AVAILABLE:
        raise BusinessLogicException("Background task service not available"
        ")

    try:
        status = background_task_manager.get_queue_status()
        return ResponseBuilder.success(status)
    except Exception as e:
        app_logger.error(f"Error getting background tasks status: {e}")
        raise BusinessLogicException("Failed to get background tasks status"
        ")


@router.get("/background-tasks/history", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_background_tasks_history(
    limit: int = Query(50, ge=1, le=200, description="Number of tasks to return")
):
    """Get background task execution history"""

    if not BACKGROUND_TASKS_AVAILABLE:
        raise BusinessLogicException("Background task service not available"
        ")

    try:
        history = background_task_manager.get_task_history(limit)
        return ResponseBuilder.success({"tasks": history})
    except Exception as e:
        app_logger.error(f"Error getting task history: {e}")
        raise BusinessLogicException("Failed to get task history")


@router.get("/background-tasks/{task_id}/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_task_status(task_id: str):
    """Get specific background task status"""

    if not BACKGROUND_TASKS_AVAILABLE:
        raise BusinessLogicException("Background task service not available"
        ")

    try:
        task_result = background_task_manager.get_task_status(task_id)
        if not task_result:
            raise BusinessLogicException("Task not found")

        return ResponseBuilder.success({
            "task_id": task_result.task_id,
            "status": task_result.status.value,
            "result": task_result.result,
            "error": task_result.error,
            "execution_time": task_result.execution_time,
            "started_at": (
                task_result.started_at.isoformat() if task_result.started_at else None
            ),
            "completed_at": (
                task_result.completed_at.isoformat()
                if task_result.completed_at
                else None
            ),
            "retry_count": task_result.retry_count,
        })
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error getting task status: {e}")
        raise BusinessLogicException("Failed to get task status")


@router.delete("/background-tasks/{task_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def cancel_background_task(task_id: str):
    """Cancel a background task"""

    if not BACKGROUND_TASKS_AVAILABLE:
        raise BusinessLogicException("Background task service not available"
        ")

    try:
        cancelled = background_task_manager.cancel_task(task_id)
        if not cancelled:
            raise BusinessLogicException("Task not found or cannot be cancelled"
            ")

        return ResponseBuilder.success({"message": "Task cancelled successfully", "task_id": task_id})
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error cancelling task: {e}")
        raise BusinessLogicException("Failed to cancel task")


@router.get("/response-optimizer/report", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_response_performance_report():
    """Get response optimizer performance report"""

    if not RESPONSE_OPTIMIZER_AVAILABLE:
        raise BusinessLogicException("Response optimizer service not available"
        ")

    try:
        report = response_optimizer.get_performance_report()
        return ResponseBuilder.success(report)
    except Exception as e:
        app_logger.error(f"Error getting response report: {e}")
        raise BusinessLogicException("Failed to get response performance report"
        ")


@router.get("/performance/summary", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_performance_summary():
    """Get comprehensive Phase 2 performance summary"""

    summary = {
        "timestamp": __import__("time").time(),
        "phase2_services": {
            "connection_pool": CONNECTION_POOL_AVAILABLE,
            "advanced_cache": ADVANCED_CACHE_AVAILABLE,
            "query_optimizer": QUERY_OPTIMIZER_AVAILABLE,
            "background_tasks": BACKGROUND_TASKS_AVAILABLE,
            "response_optimizer": RESPONSE_OPTIMIZER_AVAILABLE,
        },
        "performance_metrics": {},
    }

    # Collect performance metrics from available services
    if CONNECTION_POOL_AVAILABLE:
        try:
            pool_status = await async_connection_pool_manager.get_pool_status()
            summary["performance_metrics"]["connection_pool"] = {
                "active_connections": pool_status.get("active_connections", 0),
                "pool_size": pool_status.get("pool_size", 0),
                "circuit_breaker_state": pool_status.get("circuit_breaker", {}).get(
                    "state", "unknown"
                ),
            }
        except Exception as e:
            summary["performance_metrics"]["connection_pool"] = {"error": str(e)}

    if ADVANCED_CACHE_AVAILABLE:
        try:
            cache_stats = await advanced_caching_system.get_cache_stats()
            summary["performance_metrics"]["cache"] = {
                "hit_rate": cache_stats.get("hit_rate", 0),
                "total_operations": cache_stats.get("total_operations", 0),
                "l1_size": cache_stats.get("l1_cache", {}).get("size", 0),
                "l2_size": cache_stats.get("l2_cache", {}).get("size", 0),
            }
        except Exception as e:
            summary["performance_metrics"]["cache"] = {"error": str(e)}

    if QUERY_OPTIMIZER_AVAILABLE:
        try:
            query_report = query_optimizer.get_performance_report()
            if "summary" in query_report:
                summary["performance_metrics"]["queries"] = {
                    "total_queries": query_report["summary"].get(
                        "total_unique_queries", 0
                    ),
                    "avg_query_time": query_report["summary"].get("avg_query_time", 0),
                    "slow_queries": query_report["summary"].get(
                        "slow_queries_count", 0
                    ),
                }
        except Exception as e:
            summary["performance_metrics"]["queries"] = {"error": str(e)}

    if BACKGROUND_TASKS_AVAILABLE:
        try:
            task_status = background_task_manager.get_queue_status()
            summary["performance_metrics"]["background_tasks"] = {
                "queue_size": task_status.get("queue_size", 0),
                "total_tasks": task_status.get("total_tasks", 0),
                "success_rate": task_status.get("statistics", {}).get(
                    "completed_tasks", 0
                )
                / max(task_status.get("statistics", {}).get("total_tasks", 1), 1),
            }
        except Exception as e:
            summary["performance_metrics"]["background_tasks"] = {"error": str(e)}

    if RESPONSE_OPTIMIZER_AVAILABLE:
        try:
            response_report = response_optimizer.get_performance_report()
            if "summary" in response_report:
                summary["performance_metrics"]["responses"] = {
                    "total_responses": response_report["summary"].get(
                        "total_responses", 0
                    ),
                    "avg_response_time": response_report["summary"].get(
                        "avg_response_time", 0
                    ),
                    "compression_ratio": response_report["summary"].get(
                        "overall_compression_ratio", 1.0
                    ),
                    "cache_hit_rate": response_report["summary"].get(
                        "cache_hit_rate", 0
                    ),
                }
        except Exception as e:
            summary["performance_metrics"]["responses"] = {"error": str(e)}

    return ResponseBuilder.success(summary)
