"""
Modern Async Routes - Phase 2.5 Implementation
Demonstrates FastAPI async patterns with dependency injection and background tasks
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.modern_async_architecture import (
    AsyncAnalyticsService,
    AsyncBettingService,
    RequestContext,
    TaskStatus,
    example_data_refresh_task,
    example_ml_analysis_task,
    get_analytics_service,
    get_async_database,
    get_betting_service,
    get_request_context,
    task_manager,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/modern", tags=["Modern Async API"])

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class BetPlacementRequest(BaseModel):
    """Request model for bet placement"""

    bet_id: Optional[str] = None
    game_id: str
    player_id: str
    stat_type: str
    line: float
    odds: float
    amount: float
    bet_type: str  # "over" | "under"


class BetPlacementResponse(BaseModel):
    """Response model for bet placement"""

    bet_id: str
    status: str
    timestamp: str
    request_id: str
    amount: float
    odds: float
    expected_payout: float


class AnalysisRequest(BaseModel):
    """Request model for game analysis"""

    game_id: str
    analysis_type: str = "comprehensive"
    priority: str = "normal"  # "low" | "normal" | "high"


class TaskResponse(BaseModel):
    """Response model for background tasks"""

    task_id: str
    status: str
    message: str
    estimated_completion: Optional[str] = None


# =============================================================================
# MODERN ASYNC ENDPOINTS WITH DEPENDENCY INJECTION
# =============================================================================


@router.post("/betting/place-bet", response_model=BetPlacementResponse)
async def place_bet_modern(
    bet_request: BetPlacementRequest,
    context: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_async_database),
    betting_service: AsyncBettingService = Depends(get_betting_service),
) -> BetPlacementResponse:
    """
    Modern async bet placement with dependency injection
    """
    try:
        logger.info(f"Processing bet placement request: {context.request_id}")

        # Convert request to dict for service
        bet_data = bet_request.dict()

        # Process bet with async service
        result = await betting_service.process_bet_placement(bet_data, context, db)

        return ResponseBuilder.success(BetPlacementResponse(**result))

    except ValueError as e:
        logger.warning(f"Bet validation failed: {e}")
        raise BusinessLogicException("str(e"))
    except Exception as e:
        logger.error(f"Bet placement failed: {e}")
        raise BusinessLogicException("Internal server error during bet placement")


@router.post("/analytics/analyze-game", response_model=Dict[str, Any])
async def analyze_game_sync(
    analysis_request: AnalysisRequest,
    context: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_async_database),
    analytics_service: AsyncAnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Synchronous game analysis with async processing
    """
    try:
        logger.info(f"Starting synchronous game analysis: {analysis_request.game_id}")

        # Perform async analysis
        result = await analytics_service.analyze_predictions(
            analysis_request.game_id, context, db
        )

        return ResponseBuilder.success({"success": True, "analysis": result, "request_id": context.request_id})

    except Exception as e:
        logger.error(f"Game analysis failed: {e}")
        raise BusinessLogicException("Internal server error during game analysis")


@router.post("/analytics/analyze-game-async", response_model=TaskResponse)
async def analyze_game_async(
    analysis_request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    context: RequestContext = Depends(get_request_context),
) -> TaskResponse:
    """
    Asynchronous game analysis with background task processing
    """
    try:
        logger.info(f"Starting background game analysis: {analysis_request.game_id}")

        # Create background task
        task_id = await task_manager.create_task(
            example_ml_analysis_task,
            context=context,
            game_id=analysis_request.game_id,
            analysis_type=analysis_request.analysis_type,
        )

        return ResponseBuilder.success(TaskResponse(
            task_id=task_id,
            status="pending",
            message="Game analysis started in background",
            estimated_completion="30-60 seconds",
        ))

    except Exception as e:
        logger.error(f"Failed to start background analysis: {e}")
        raise BusinessLogicException("Failed to start background analysis")


@router.post("/data/refresh-async", response_model=TaskResponse)
async def refresh_data_async(
    data_source: str = Query(..., description="Data source to refresh"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    context: RequestContext = Depends(get_request_context),
) -> TaskResponse:
    """
    Asynchronous data refresh with background task processing
    """
    try:
        logger.info(f"Starting background data refresh: {data_source}")

        # Create background task
        task_id = await task_manager.create_task(
            example_data_refresh_task, context=context, data_source=data_source
        )

        return ResponseBuilder.success(TaskResponse(
            task_id=task_id,
            status="pending",
            message=f"Data refresh started for {data_source}",
            estimated_completion="10-30 seconds",
        ))

    except Exception as e:
        logger.error(f"Failed to start data refresh: {e}")
        raise BusinessLogicException("Failed to start data refresh")


# =============================================================================
# TASK MANAGEMENT ENDPOINTS
# =============================================================================


@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(
    task_id: str, context: RequestContext = Depends(get_request_context)
) -> TaskStatus:
    """
    Get status of a background task
    """
    try:
        status = task_manager.get_task_status(task_id)
        if not status:
            raise BusinessLogicException("f"Task not found: {task_id}")

        return ResponseBuilder.success(status)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task status: {e}")
        raise BusinessLogicException("Failed to retrieve task status")


@router.get("/tasks/{task_id}/wait", response_model=StandardAPIResponse[Dict[str, Any]])
async def wait_for_task(
    task_id: str,
    timeout: Optional[int] = Query(30, description="Timeout in seconds"),
    context: RequestContext = Depends(get_request_context),
) -> Dict[str, Any]:
    """
    Wait for a background task to complete
    """
    try:
        logger.info(f"Waiting for task completion: {task_id}")

        # Wait for task with timeout
        result = await task_manager.wait_for_task(task_id, timeout=timeout)

        return ResponseBuilder.success({
            "success": True,
            "task_id": task_id,
            "result": result,
            "request_id": context.request_id,
        })

    except asyncio.TimeoutError:
        raise BusinessLogicException("f"Task timeout after {timeout} seconds")
    except ValueError as e:
        raise BusinessLogicException("str(e"))
    except RuntimeError as e:
        raise BusinessLogicException("str(e")
        )
    except Exception as e:
        logger.error(f"Failed to wait for task: {e}")
        raise BusinessLogicException("Failed to wait for task completion")


@router.get("/tasks", response_model=List[TaskStatus])
async def list_tasks(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, description="Maximum number of tasks to return"),
    context: RequestContext = Depends(get_request_context),
) -> List[TaskStatus]:
    """
    List background tasks with optional filtering
    """
    try:
        tasks = task_manager.list_tasks(status_filter=status_filter)

        # Apply limit
        if limit > 0:
            tasks = tasks[:limit]

        return ResponseBuilder.success(tasks)

    except Exception as e:
        logger.error(f"Failed to list tasks: {e}")
        raise BusinessLogicException("Failed to list tasks")


# =============================================================================
# CONCURRENT PROCESSING EXAMPLES
# =============================================================================


@router.post("/analytics/batch-analyze", response_model=StandardAPIResponse[Dict[str, Any]])
async def batch_analyze_games(
    game_ids: List[str],
    context: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_async_database),
    analytics_service: AsyncAnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Concurrent batch processing of multiple games
    """
    try:
        logger.info(f"Starting batch analysis for {len(game_ids)} games")

        # Create concurrent tasks for all games
        async def analyze_single_game(game_id: str):
            try:
                return ResponseBuilder.success(await) analytics_service.analyze_predictions(game_id, context, db)
            except Exception as e:
                logger.error(f"Failed to analyze game {game_id}: {e}")
                return ResponseBuilder.success({"game_id": game_id, "error": str(e)})

        # Run all analyses concurrently
        start_time = asyncio.get_event_loop().time()
        results = await asyncio.gather(
            *[analyze_single_game(game_id) for game_id in game_ids],
            return_exceptions=True,
        )
        end_time = asyncio.get_event_loop().time()

        # Process results
        successful_analyses = []
        failed_analyses = []

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                failed_analyses.append({"game_id": game_ids[i], "error": str(result)})
            elif "error" in result:
                failed_analyses.append(result)
            else:
                successful_analyses.append(result)

        return ResponseBuilder.success({
            "success": True,
            "request_id": context.request_id,
            "processing_time": end_time - start_time,
            "total_games": len(game_ids),
            "successful_analyses": len(successful_analyses),
            "failed_analyses": len(failed_analyses),
            "results": successful_analyses,
            "errors": failed_analyses,
        })

    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise BusinessLogicException("Internal server error during batch analysis")


# =============================================================================
# HEALTH AND MONITORING
# =============================================================================


@router.get("/health/async", response_model=StandardAPIResponse[Dict[str, Any]])
async def async_health_check(
    context: RequestContext = Depends(get_request_context),
) -> Dict[str, Any]:
    """
    Async health check with service validation
    """
    try:
        start_time = asyncio.get_event_loop().time()

        # Test async database connection
        async with get_async_database() as db:
            await db.execute("SELECT 1")

        # Test service initialization
        analytics_service = await get_analytics_service()
        betting_service = await get_betting_service()

        end_time = asyncio.get_event_loop().time()

        return ResponseBuilder.success({
            "status": "healthy",
            "request_id": context.request_id,
            "response_time": end_time - start_time,
            "services": {
                "database": "connected",
                "analytics_service": "initialized",
                "betting_service": "initialized",
                "task_manager": "running",
            }),
            "active_tasks": len(task_manager.running_tasks),
            "total_tasks": len(task_manager.tasks),
            "timestamp": context.timestamp.isoformat(),
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise BusinessLogicException("f"Service unhealthy: {str(e")}",
        )
