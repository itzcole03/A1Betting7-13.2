"""
Cheatsheets Routes - API endpoints for ranked prop opportunities
Provides filtered and configurable prop research tools
"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from backend.services.cheatsheets_service import (
    get_cheatsheets_service,
    CheatsheetsService,
    CheatsheetFilters,
    PropOpportunity
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/cheatsheets", tags=["Cheatsheets"])

# Pydantic models for API
class OpportunityFiltersModel(BaseModel):
    """Request model for filtering opportunities"""
    min_edge: float = Field(1.0, ge=0.0, le=20.0, description="Minimum edge percentage")
    min_confidence: float = Field(60.0, ge=0.0, le=100.0, description="Minimum confidence percentage")
    min_sample_size: int = Field(10, ge=1, le=100, description="Minimum sample size")
    stat_types: List[str] = Field([], description="Stat types to include")
    books: List[str] = Field([], description="Sportsbooks to include")
    sides: List[str] = Field(['over', 'under'], description="Sides to include")
    sports: List[str] = Field(['MLB'], description="Sports to include")
    search_query: str = Field("", description="Search query for player names")
    max_results: int = Field(50, ge=1, le=200, description="Maximum results to return")

class OpportunityResponse(BaseModel):
    """Single opportunity response model"""
    id: str
    player_name: str
    stat_type: str
    line: float
    recommended_side: str
    edge_percentage: float
    confidence: float
    best_odds: int
    best_book: str
    fair_price: float
    implied_probability: float
    recent_performance: str
    sample_size: int
    last_updated: str
    sport: str
    team: str
    opponent: str
    venue: str
    weather: Optional[str] = None
    injury_concerns: Optional[str] = None
    market_efficiency: float
    volatility_score: float
    trend_direction: str

class OpportunitiesListResponse(BaseModel):
    """List response with metadata"""
    opportunities: List[OpportunityResponse]
    total_count: int
    filtered_count: int
    avg_edge: float
    avg_confidence: float
    filters_applied: dict
    last_updated: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    opportunities_cached: int
    last_refresh: Optional[str]
    available_sports: List[str]
    available_stat_types: List[str]
    timestamp: str

@router.get("/opportunities", response_model=OpportunitiesListResponse)
async def get_opportunities(
    min_edge: float = Query(1.0, ge=0.0, le=20.0, description="Minimum edge percentage"),
    min_confidence: float = Query(60.0, ge=0.0, le=100.0, description="Minimum confidence percentage"),
    min_sample_size: int = Query(10, ge=1, le=100, description="Minimum sample size"),
    stat_types: str = Query("", description="Comma-separated stat types"),
    books: str = Query("", description="Comma-separated sportsbooks"),
    sides: str = Query("over,under", description="Comma-separated sides"),
    sports: str = Query("MLB", description="Comma-separated sports"),
    search: str = Query("", description="Player search query"),
    max_results: int = Query(50, ge=1, le=200, description="Maximum results"),
    cheatsheets_service: CheatsheetsService = Depends(get_cheatsheets_service)
):
    """
    Get ranked prop opportunities with configurable filters
    
    Returns a list of prop betting opportunities ranked by edge percentage,
    confidence, and other factors. Supports extensive filtering options.
    """
    try:
        # Parse filter parameters
        filters = CheatsheetFilters(
            min_edge=min_edge,
            min_confidence=min_confidence,
            min_sample_size=min_sample_size,
            stat_types=[s.strip() for s in stat_types.split(',') if s.strip()],
            books=[b.strip() for b in books.split(',') if b.strip()],
            sides=[s.strip() for s in sides.split(',') if s.strip()],
            sports=[s.strip() for s in sports.split(',') if s.strip()],
            search_query=search_query.strip(),
            max_results=max_results
        )
        
        # Get opportunities
        opportunities = await cheatsheets_service.get_ranked_opportunities(filters)
        
        # Convert to response models
        opportunity_responses = [
            OpportunityResponse(**opp.to_dict()) for opp in opportunities
        ]
        
        # Calculate metadata
        total_count = len(opportunities)
        avg_edge = sum(opp.edge_percentage for opp in opportunities) / max(1, total_count)
        avg_confidence = sum(opp.confidence for opp in opportunities) / max(1, total_count)
        
        return ResponseBuilder.success(OpportunitiesListResponse(
            opportunities=opportunity_responses,
            total_count=total_count,
            filtered_count=total_count,  # Already filtered
            avg_edge=round(avg_edge, 2)),
            avg_confidence=round(avg_confidence, 1),
            filters_applied={
                "min_edge": min_edge,
                "min_confidence": min_confidence,
                "min_sample_size": min_sample_size,
                "stat_types": filters.stat_types,
                "books": filters.books,
                "sides": filters.sides,
                "sports": filters.sports,
                "search_query": search
            },
            last_updated=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Failed to get opportunities: {e}")
        logger.error(f"Full traceback: {error_details}")

        # Return a more specific error message
        if "search" in str(e).lower():
            detail = "Search parameter error"
        elif "filter" in str(e).lower():
            detail = "Filter parameter error"
        else:
            detail = f"Service error: {str(e)}"

        raise BusinessLogicException("detail")

@router.post("/opportunities", response_model=OpportunitiesListResponse)
async def get_opportunities_post(
    filters: OpportunityFiltersModel,
    cheatsheets_service: CheatsheetsService = Depends(get_cheatsheets_service)
):
    """
    Get ranked prop opportunities using POST with detailed filters
    
    Alternative endpoint for complex filter configurations that may
    exceed URL length limits in GET requests.
    """
    try:
        # Convert to service filters
        service_filters = CheatsheetFilters(
            min_edge=filters.min_edge,
            min_confidence=filters.min_confidence,
            min_sample_size=filters.min_sample_size,
            stat_types=filters.stat_types,
            books=filters.books,
            sides=filters.sides,
            sports=filters.sports,
            search_query=filters.search_query,
            max_results=filters.max_results
        )
        
        # Get opportunities
        opportunities = await cheatsheets_service.get_ranked_opportunities(service_filters)
        
        # Convert to response models
        opportunity_responses = [
            OpportunityResponse(**opp.to_dict()) for opp in opportunities
        ]
        
        # Calculate metadata
        total_count = len(opportunities)
        avg_edge = sum(opp.edge_percentage for opp in opportunities) / max(1, total_count)
        avg_confidence = sum(opp.confidence for opp in opportunities) / max(1, total_count)
        
        return ResponseBuilder.success(OpportunitiesListResponse(
            opportunities=opportunity_responses,
            total_count=total_count,
            filtered_count=total_count,
            avg_edge=round(avg_edge, 2)),
            avg_confidence=round(avg_confidence, 1),
            filters_applied=filters.dict(),
            last_updated=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to get opportunities (POST): {e}")
        raise BusinessLogicException("Failed to retrieve opportunities")

@router.get("/export/csv", response_model=StandardAPIResponse[Dict[str, Any]])
async def export_opportunities_csv(
    min_edge: float = Query(1.0, ge=0.0, le=20.0),
    min_confidence: float = Query(60.0, ge=0.0, le=100.0),
    min_sample_size: int = Query(10, ge=1, le=100),
    stat_types: str = Query(""),
    books: str = Query(""),
    sides: str = Query("over,under"),
    sports: str = Query("MLB"),
    search: str = Query(""),
    max_results: int = Query(100, ge=1, le=500),
    cheatsheets_service: CheatsheetsService = Depends(get_cheatsheets_service)
):
    """
    Export opportunities to CSV format
    
    Returns opportunities in CSV format for download and external analysis.
    """
    try:
        # Parse filter parameters
        filters = CheatsheetFilters(
            min_edge=min_edge,
            min_confidence=min_confidence,
            min_sample_size=min_sample_size,
            stat_types=[s.strip() for s in stat_types.split(',') if s.strip()],
            books=[b.strip() for b in books.split(',') if b.strip()],
            sides=[s.strip() for s in sides.split(',') if s.strip()],
            sports=[s.strip() for s in sports.split(',') if s.strip()],
            search_query=search_query.strip(),
            max_results=max_results
        )
        
        # Get opportunities
        opportunities = await cheatsheets_service.get_ranked_opportunities(filters)
        
        # Export to CSV
        csv_content = await cheatsheets_service.export_opportunities_csv(opportunities)
        
        # Return as downloadable file
        headers = {
            'Content-Disposition': f'attachment; filename="cheatsheet-{datetime.now().strftime("%Y%m%d")}.csv"'
        }
        
        return ResponseBuilder.success(Response(
            content=csv_content,
            media_type='text/csv',
            headers=headers
        ))
        
    except Exception as e:
        logger.error(f"Failed to export CSV: {e}")
        raise BusinessLogicException("Failed to export opportunities")

@router.get("/stats/summary", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_summary_stats(
    cheatsheets_service: CheatsheetsService = Depends(get_cheatsheets_service)
):
    """Get summary statistics for the cheatsheets system"""
    try:
        # Get a broad set of opportunities for stats
        filters = CheatsheetFilters(
            min_edge=0.1,  # Very low threshold for stats
            min_confidence=50.0,
            min_sample_size=5,
            max_results=1000
        )
        
        opportunities = await cheatsheets_service.get_ranked_opportunities(filters)
        
        if not opportunities:
            return ResponseBuilder.success({
                "total_opportunities": 0,
                "sports_coverage": [],
                "stat_types_coverage": [],
                "books_coverage": [],
                "edge_distribution": {}),
                "confidence_distribution": {},
                "last_updated": datetime.utcnow().isoformat()
            }
        
        # Calculate distributions
        sports = list(set(opp.sport for opp in opportunities))
        stat_types = list(set(opp.stat_type for opp in opportunities))
        books = list(set(opp.best_book for opp in opportunities))
        
        # Edge distribution
        edge_ranges = {"0-2%": 0, "2-5%": 0, "5-10%": 0, "10%+": 0}
        for opp in opportunities:
            if opp.edge_percentage < 2:
                edge_ranges["0-2%"] += 1
            elif opp.edge_percentage < 5:
                edge_ranges["2-5%"] += 1
            elif opp.edge_percentage < 10:
                edge_ranges["5-10%"] += 1
            else:
                edge_ranges["10%+"] += 1
        
        # Confidence distribution
        conf_ranges = {"50-70%": 0, "70-80%": 0, "80-90%": 0, "90%+": 0}
        for opp in opportunities:
            if opp.confidence < 70:
                conf_ranges["50-70%"] += 1
            elif opp.confidence < 80:
                conf_ranges["70-80%"] += 1
            elif opp.confidence < 90:
                conf_ranges["80-90%"] += 1
            else:
                conf_ranges["90%+"] += 1
        
        return ResponseBuilder.success({
            "total_opportunities": len(opportunities),
            "sports_coverage": sports,
            "stat_types_coverage": stat_types,
            "books_coverage": books,
            "edge_distribution": edge_ranges,
            "confidence_distribution": conf_ranges,
            "avg_edge": round(sum(opp.edge_percentage for opp in opportunities) / len(opportunities), 2),
            "avg_confidence": round(sum(opp.confidence for opp in opportunities) / len(opportunities), 1),
            "last_updated": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get summary stats: {e}")
        raise BusinessLogicException("Failed to get summary statistics")

@router.get("/player/{player_name}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_player_opportunities(
    player_name: str,
    min_edge: float = Query(0.5, ge=0.0, le=20.0),
    cheatsheets_service: CheatsheetsService = Depends(get_cheatsheets_service)
):
    """Get all opportunities for a specific player"""
    try:
        # Set up filters for this player
        filters = CheatsheetFilters(
            min_edge=min_edge,
            min_confidence=50.0,  # Lower threshold for player-specific view
            min_sample_size=5,
            search_query=player_name,
            max_results=50
        )
        
        opportunities = await cheatsheets_service.get_ranked_opportunities(filters)
        
        # Filter to exact player name matches
        player_opportunities = [
            opp for opp in opportunities 
            if player_name.lower() in opp.player_name.lower()
        ]
        
        if not player_opportunities:
            raise BusinessLogicException("f"No opportunities found for player: {player_name}")
        
        # Group by stat type
        by_stat_type = {}
        for opp in player_opportunities:
            if opp.stat_type not in by_stat_type:
                by_stat_type[opp.stat_type] = []
            by_stat_type[opp.stat_type].append(opp.to_dict())
        
        return ResponseBuilder.success({
            "player_name": player_name,
            "total_opportunities": len(player_opportunities),
            "opportunities_by_stat": by_stat_type,
            "best_opportunity": max(player_opportunities, key=lambda x: x.edge_percentage).to_dict(),
            "last_updated": datetime.utcnow().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get player opportunities: {e}")
        raise BusinessLogicException("Failed to get player opportunities")

@router.get("/health", response_model=HealthResponse)
async def cheatsheets_health_check(
    cheatsheets_service: CheatsheetsService = Depends(get_cheatsheets_service)
):
    """Check cheatsheets service health and cache status"""
    try:
        # Get basic stats
        cache_size = len(cheatsheets_service.opportunities_cache)
        
        return ResponseBuilder.success(HealthResponse(
            status="healthy",
            opportunities_cached=cache_size,
            last_refresh=None,  # Could track this if needed
            available_sports=["MLB"],  # Could be dynamic
            available_stat_types=["hits", "home_runs", "rbis", "total_bases", "runs_scored"],
            timestamp=datetime.utcnow()).isoformat()
        )
        
    except Exception as e:
        logger.error(f"Cheatsheets health check failed: {e}")
        return ResponseBuilder.success(HealthResponse(
            status="degraded",
            opportunities_cached=0,
            last_refresh=None,
            available_sports=[],
            available_stat_types=[],
            timestamp=datetime.utcnow()).isoformat()
        )
