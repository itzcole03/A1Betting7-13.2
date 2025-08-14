"""
Real-Time Analysis API Routes
============================

API endpoints for triggering and monitoring comprehensive
multi-sport betting analysis
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field

# Import BetAnalysisResponse from models.api_models
from backend.models.api_models import BetAnalysisResponse
from backend.services.real_time_analysis_engine import (
    AnalysisProgress,
    OptimalLineup,
    RealTimeBet,
    SportCategory,
    real_time_engine,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analysis", tags=["Real-Time Analysis"])


class AnalysisRequest(BaseModel):
    """Request model for starting analysis"""

    sports: Optional[List[str]] = Field(
        None, description="Specific sports to analyze (default: all)"
    )
    min_confidence: float = Field(
        75.0, ge=50.0, le=99.0, description="Minimum confidence threshold"
    )
    max_results: int = Field(50, ge=1, le=500, description="Maximum results to return")
    lineup_sizes: List[int] = Field([6], description="Lineup sizes to optimize for")


class AnalysisResponse(BaseModel):
    """Response model for analysis status"""

    analysis_id: str
    status: str
    message: str
    estimated_duration_seconds: Optional[int] = None


class ProgressResponse(BaseModel):
    """Response model for analysis progress"""

    analysis_id: str
    progress_percentage: float
    total_bets: int
    analyzed_bets: int
    current_sport: str
    current_sportsbook: str
    estimated_completion: Optional[str] = None
    status: str


@router.post("/start", response_model=AnalysisResponse)
async def start_comprehensive_analysis(
    request: AnalysisRequest, background_tasks: BackgroundTasks
) -> AnalysisResponse:
    """
    Start comprehensive real-time analysis across all sports and sportsbooks

    This endpoint:
    1. Triggers data collection from all major sportsbooks
    2. Analyzes thousands of bets with ML ensemble
    3. Optimizes cross-sport lineups
    4. Returns analysis ID for progress tracking
    """
    try:
        logger.info("🚀 Starting comprehensive multi-sport analysis")

        # Start the analysis engine
        analysis_id = await real_time_engine.start_comprehensive_analysis()

        return ResponseBuilder.success(AnalysisResponse(
            analysis_id=analysis_id,
            status="started",
            message="Comprehensive analysis started. Analyzing thousands of bets across all sports.",
            estimated_duration_seconds=180,  # 3 minutes estimated
        ))

    except Exception as e:
        logger.error(f"❌ Failed to start analysis: {str(e)}")
        raise BusinessLogicException("f"Failed to start analysis: {str(e")}",
        )


@router.get("/progress/{analysis_id}", response_model=ProgressResponse)
async def get_analysis_progress(analysis_id: str) -> ProgressResponse:
    """
    Get real-time progress of ongoing analysis

    Used by frontend to show progress bar and current status
    """
    try:
        progress = real_time_engine.get_analysis_progress(analysis_id)
        if not progress:
            raise BusinessLogicException("Analysis not found or completed")
        # Determine status
        if progress.analyzed_bets == progress.total_bets and progress.total_bets > 0:
            status_msg = "completed"
        elif progress.analyzed_bets > 0:
            status_msg = "analyzing"
        else:
            status_msg = "collecting_data"
        return ResponseBuilder.success(ProgressResponse(
            analysis_id=analysis_id,
            progress_percentage=progress.progress_percentage,
            total_bets=progress.total_bets,
            analyzed_bets=progress.analyzed_bets,
            current_sport=progress.current_sport,
            current_sportsbook=progress.current_sportsbook,
            estimated_completion=(
                progress.estimated_completion.isoformat())
                if progress.estimated_completion
                else None
            ),
            status=status_msg,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get progress: {str(e)}")
        raise BusinessLogicException("f"Failed to get analysis progress: {str(e")}",
        )


@router.get(
    "/results/{analysis_id}/opportunities", response_model=List[BetAnalysisResponse]
)
async def get_betting_opportunities(
    analysis_id: str, limit: int = 50, min_confidence: float = 80.0
) -> List[BetAnalysisResponse]:
    """
    Get the best betting opportunities from completed analysis
    Returns the highest-confidence, most profitable bets identified, wrapped in BetAnalysisResponse
    """
    try:
        logger = logging.getLogger("real_time_analysis.opportunities")
        logger.info(f"Fetching betting opportunities for analysis_id={analysis_id}")
        results = real_time_engine.get_results(analysis_id)
        if not results or "opportunities" not in results:
            raise BusinessLogicException("No betting opportunities found for this analysis_id")
        return ResponseBuilder.success(results)["opportunities"][:limit]
    except HTTPException:
        raise
    except Exception as e:
        logger = logging.getLogger("real_time_analysis.opportunities")
        logger.error(f"❌ Failed to get opportunities: {str(e)}")
        raise BusinessLogicException("f"Failed to get betting opportunities: {str(e")}",
        )


@router.get("/results/{analysis_id}/lineups", response_model=List[BetAnalysisResponse])
async def get_optimal_lineups(
    analysis_id: str, lineup_sizes: List[int] = [6, 10]
) -> List[BetAnalysisResponse]:
    """
    Get optimal cross-sport lineups from completed analysis
    Returns optimized lineups for maximum win probability, wrapped in BetAnalysisResponse
    """
    try:
        logger = logging.getLogger("real_time_analysis.lineups")
        logger.info(f"Fetching optimal lineups for analysis_id={analysis_id}")
        results = real_time_engine.get_results(analysis_id)
        if not results or "lineups" not in results:
            raise BusinessLogicException("No optimal lineups found for this analysis_id")
        return ResponseBuilder.success(results)["lineups"]
    except HTTPException:
        raise
    except Exception as e:
        logger = logging.getLogger("real_time_analysis.lineups")
        logger.error(f"❌ Failed to get lineups: {str(e)}")
        raise BusinessLogicException("f"Failed to get optimal lineups: {str(e")}",
        )


@router.get("/sports", response_model=List[str])
async def get_supported_sports() -> List[str]:
    """Get list of all supported sports for analysis"""
    return ResponseBuilder.success([sport.value for sport in SportCategory])


@router.get("/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_system_status() -> Dict[str, Any]:
    """Get real-time analysis system status, including business rules version info"""
    rules = getattr(real_time_engine, "business_rules", {})
    return ResponseBuilder.success({
        "status": "operational",
        "supported_sports": len(SportCategory),
        "supported_sportsbooks": 10,
        "ml_models_active": 47,
        "last_health_check": "2024-12-19T23:45:00Z",
        "ruleset_version": rules.get("ruleset_version", "unknown"),
        "rules_last_updated": rules.get("last_updated", "unknown"),
    })
