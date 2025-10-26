"""
Ingestion API Routes

FastAPI routes for triggering and monitoring data ingestion pipelines.
Provides endpoints for manual execution and status monitoring.
"""

import logging
import time
from typing import Optional, Union

from fastapi import APIRouter, BackgroundTasks, Body, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ..models.dto import IngestResult
from ..pipeline import run_nba_ingestion

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/ingestion", tags=["Data Ingestion"])

# Simple in-memory task registry for background ingestion tasks (dev-only)
TASKS = {}


class IngestionRequest(BaseModel):
    """Request body for ingestion endpoints."""

    limit: Optional[int] = Field(
        None, ge=1, le=1000, description="Maximum number of props to process"
    )
    allow_upsert: bool = Field(True, description="Whether to allow upsert operations")


class IngestionResponse(BaseModel):
    """Response wrapper for ingestion results."""

    success: bool
    message: str
    result: Optional[IngestResult] = None
    error: Optional[str] = None


@router.post(
    "/nba/run",
    response_model=None,
    summary="Run NBA Data Ingestion",
    description="""
    Execute the NBA data ingestion pipeline to fetch, normalize, and persist
    proposition betting data from external providers.
    
    The pipeline includes:
    - Fetching raw data from NBA provider
    - Normalizing to canonical taxonomy  
    - Upserting players and props
    - Detecting and persisting line changes
    - Comprehensive error handling and metrics
    
    Returns execution results with counts, timing, and error details.
    """,
)
async def run_nba_ingestion_endpoint(
    request: IngestionRequest = Body(
        default=IngestionRequest(limit=None, allow_upsert=True)
    )
) -> Union[dict, JSONResponse]:
    """
    Run NBA ingestion pipeline.

    This endpoint executes the ingestion pipeline inline and returns
    the complete results. For long-running ingestions, consider using
    the background task version.

    Args:
        request: Ingestion parameters

    Returns:
        IngestionResponse with execution results

    Raises:
        HTTPException: If ingestion fails catastrophically
    """
    logger.info(
        f"NBA ingestion requested with limit={request.limit}, allow_upsert={request.allow_upsert}"
    )

    try:
        # Execute ingestion pipeline
        result = await run_nba_ingestion(
            limit=request.limit, allow_upsert=request.allow_upsert
        )

        # Return the raw IngestResult dictionary so tests and clients
        # receive the full result payload at top-level.
        logger.info(
            f"NBA ingestion completed with status={result.status}: {result.total_raw} props, {result.total_line_changes} changes"
        )
        return result.dict()

    except Exception as e:
        logger.error(f"NBA ingestion endpoint error: {e}", exc_info=True)
        # Return error payload matching test expectations with HTTP 500
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "message": f"NBA ingestion failed with unexpected error: {str(e)}",
            },
        )


@router.post(
    "/nba/run-async",
    response_model=None,
    summary="Run NBA Data Ingestion (Background)",
    description="""
    Execute the NBA data ingestion pipeline as a background task.
    
    Returns immediately with a task ID for monitoring progress.
    Use this endpoint for long-running ingestions to avoid timeouts.
    
    TODO: Implement proper background task tracking and status endpoints.
    """,
)
async def run_nba_ingestion_async(
    background_tasks: BackgroundTasks,
    request: IngestionRequest = Body(
        default=IngestionRequest(limit=None, allow_upsert=True)
    ),
) -> dict:
    """
    Run NBA ingestion pipeline as background task.

    Args:
        background_tasks: FastAPI background tasks
        request: Ingestion parameters

    Returns:
        Task tracking information
    """
    # TODO: Implement proper task tracking with database storage
    import uuid

    task_id = str(uuid.uuid4())

    logger.info(f"NBA ingestion background task {task_id} requested")

    # Register task initial status
    TASKS[task_id] = {
        "task_id": task_id,
        "status": "queued",
        "created_at": time.time(),
        "started_at": None,
        "finished_at": None,
        "result": None,
        "error": None,
    }

    # Add background task
    background_tasks.add_task(
        _run_ingestion_background,
        task_id=task_id,
        limit=request.limit,
        allow_upsert=request.allow_upsert,
    )

    return {
        "success": True,
        "message": "NBA ingestion started as background task",
        "task_id": task_id,
        "status": "queued",
    }


async def _run_ingestion_background(
    task_id: str, limit: Optional[int], allow_upsert: bool
):
    """Execute ingestion in background with error handling."""
    try:
        logger.info(f"Background task {task_id} starting NBA ingestion")
        TASKS.setdefault(task_id, {})
        TASKS[task_id]["status"] = "running"
        TASKS[task_id]["started_at"] = time.time()

        result = await run_nba_ingestion(limit=limit, allow_upsert=allow_upsert)

        TASKS[task_id]["status"] = "completed"
        TASKS[task_id]["finished_at"] = time.time()
        # store serializable result (attempt dict() where possible)
        try:
            TASKS[task_id]["result"] = (
                result.dict() if hasattr(result, "dict") else result
            )
        except Exception:
            TASKS[task_id]["result"] = str(result)

        logger.info(
            f"Background task {task_id} completed: {TASKS[task_id].get('result')}"
        )

        # TODO: Store result in database for later retrieval

    except Exception as e:
        logger.error(f"Background task {task_id} failed: {e}", exc_info=True)
        TASKS.setdefault(task_id, {})
        TASKS[task_id]["status"] = "failed"
        TASKS[task_id]["finished_at"] = time.time()
        TASKS[task_id]["error"] = str(e)
        # TODO: Store error in database for later retrieval


@router.get(
    "/health",
    summary="Check Ingestion System Health",
    description="Validate that all ingestion components are healthy and ready.",
)
async def ingestion_health_check() -> dict:
    """
    Check health of ingestion system components.

    Returns:
        Health status of ingestion components
    """
    health_status = {"status": "healthy", "components": {}}

    try:
        # Check NBA provider health
        from ..sources import default_nba_provider

        nba_health = await default_nba_provider.health_check()
        health_status["components"]["nba_provider"] = {
            "status": "healthy" if nba_health else "unhealthy",
            "provider_name": default_nba_provider.provider_name,
        }

        # Check taxonomy service health
        from ..normalization import taxonomy_service

        taxonomy_health = {
            "status": "healthy",
            "prop_mappings": taxonomy_service.prop_mapping_count,
            "team_mappings": taxonomy_service.team_mapping_count,
            "last_reload": taxonomy_service.last_reload_timestamp,
        }
        health_status["components"]["taxonomy_service"] = taxonomy_health

        # Overall health based on components
        if not nba_health:
            health_status["status"] = "degraded"

        return health_status

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "components": health_status.get("components", {}),
        }


@router.get(
    "/stats",
    summary="Get Ingestion Statistics",
    description="Retrieve statistics about recent ingestion runs and system performance.",
)
async def get_ingestion_stats() -> dict:
    """
    Get ingestion statistics and performance metrics.

    TODO: Implement database queries for historical statistics.

    Returns:
        Ingestion statistics and metrics
    """
    # TODO: Query database for:
    # - Recent ingest run counts by status
    # - Average processing times
    # - Error rates by category
    # - Data freshness metrics

    return {
        "message": "Ingestion statistics endpoint - TODO: implement database queries",
        "recent_runs": "Not implemented",
        "performance_metrics": "Not implemented",
        "error_analytics": "Not implemented",
    }


# Export router
__all__ = ["router"]


@router.get("/nba/tasks/{task_id}", summary="Get ingestion background task status")
async def get_nba_task_status(task_id: str) -> dict:
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/nba/tasks", summary="List ingestion background tasks")
async def list_nba_tasks() -> dict:
    # Return a summarized list of tasks
    return {
        tid: {"status": v.get("status"), "created_at": v.get("created_at")}
        for tid, v in TASKS.items()
    }
