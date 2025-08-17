"""
Valuation and Edge API Routes - RESTful endpoints for the modeling system
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..services.edges.edge_service import edge_service, EdgeData
from ..services.valuation.valuation_engine import valuation_engine, ValuationResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["modeling"])


# Response Models
class ValuationResponse(BaseModel):
    """Response model for valuation endpoint"""
    prop_id: int
    model_version_id: int
    prediction: float
    prob_over: float
    prob_under: float
    fair_line: float
    offered_line: float
    expected_value: float
    volatility_score: float
    confidence: float
    created_at: datetime
    valuation_hash: str


class EdgeResponse(BaseModel):
    """Response model for edge endpoint"""
    id: int
    prop_id: int
    model_version_id: int
    edge_score: float
    ev: float
    prob_over: float
    offered_line: float
    fair_line: float
    status: str
    created_at: datetime


class EdgeRecomputeResponse(BaseModel):
    """Response model for edge recomputation"""
    sport: str
    evaluated: int
    new_edges: int
    updated_edges: int
    retired_edges: int
    duration_ms: int
    started_at: datetime


class EdgeListResponse(BaseModel):
    """Response model for edge list endpoint"""
    edges: List[EdgeResponse]
    total_count: int
    filters_applied: Dict[str, Any]


# API Endpoints
@router.get("/valuation/{prop_id}", response_model=ValuationResponse)
async def get_valuation(
    prop_id: int,
    force_recompute: bool = Query(False, description="Force recomputation of valuation")
) -> ValuationResponse:
    """
    Get valuation for a specific prop.
    
    Args:
        prop_id: Prop identifier
        force_recompute: Force fresh computation instead of using cache
        
    Returns:
        ValuationResponse: Valuation data
    """
    try:
        logger.info(f"Getting valuation for prop {prop_id}, force_recompute={force_recompute}")
        
        # Run valuation
        valuation = await valuation_engine.valuate(
            prop_id=prop_id,
            force_recompute=force_recompute
        )
        
        if not valuation:
            raise HTTPException(
                status_code=404,
                detail=f"Could not compute valuation for prop {prop_id}"
            )
        
        # Convert to response model
        response = ValuationResponse(
            prop_id=valuation.prop_id,
            model_version_id=valuation.model_version_id,
            prediction=valuation.prediction,
            prob_over=valuation.prob_over,
            prob_under=valuation.prob_under,
            fair_line=valuation.fair_line,
            offered_line=valuation.offered_line,
            expected_value=valuation.expected_value,
            volatility_score=valuation.volatility_score,
            confidence=valuation.confidence,
            created_at=valuation.created_at,
            valuation_hash=valuation.valuation_hash
        )
        
        logger.info(f"Valuation computed for prop {prop_id}: EV={valuation.expected_value:.4f}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting valuation for prop {prop_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error computing valuation: {str(e)}"
        )


@router.post("/edges/recompute", response_model=EdgeRecomputeResponse)
async def recompute_edges(
    sport: str = Query("NBA", description="Sport to recompute edges for"),
    max_props: Optional[int] = Query(None, description="Maximum number of props to process")
) -> EdgeRecomputeResponse:
    """
    Recompute edges for all active props in a sport.
    
    Args:
        sport: Sport to recompute (default: NBA)
        max_props: Maximum number of props to process (optional)
        
    Returns:
        EdgeRecomputeResponse: Recomputation results
    """
    try:
        logger.info(f"Starting edge recomputation for sport: {sport}")
        start_time = datetime.utcnow()
        
        # Run edge recomputation
        stats = await edge_service.recompute_edges_for_sport(sport)
        
        # TODO: Apply max_props limit if specified
        if max_props is not None:
            logger.info(f"Max props limit ({max_props}) not yet implemented")
        
        response = EdgeRecomputeResponse(
            sport=sport,
            evaluated=stats["evaluated"],
            new_edges=stats["new_edges"],
            updated_edges=stats["updated_edges"],
            retired_edges=stats["retired_edges"],
            duration_ms=stats["duration_ms"],
            started_at=start_time
        )
        
        logger.info(f"Edge recomputation completed for {sport}: {stats}")
        return response
        
    except Exception as e:
        logger.error(f"Error recomputing edges for {sport}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error recomputing edges: {str(e)}"
        )


@router.get("/edges", response_model=EdgeListResponse)
async def get_edges(
    sport: Optional[str] = Query(None, description="Filter by sport"),
    prop_type: Optional[str] = Query(None, description="Filter by prop type"),
    min_ev: Optional[float] = Query(None, description="Minimum expected value"),
    min_edge_score: Optional[float] = Query(None, description="Minimum edge score"),
    status: str = Query("ACTIVE", description="Edge status (ACTIVE, RETIRED)"),
    limit: int = Query(100, description="Maximum results to return", ge=1, le=1000)
) -> EdgeListResponse:
    """
    Get active edges with optional filters.
    
    Args:
        sport: Sport filter
        prop_type: Prop type filter  
        min_ev: Minimum expected value filter
        min_edge_score: Minimum edge score filter
        status: Edge status filter
        limit: Maximum results
        
    Returns:
        EdgeListResponse: Filtered edges
    """
    try:
        logger.info(f"Getting edges with filters: sport={sport}, prop_type={prop_type}, min_ev={min_ev}")
        
        # Get edges from service
        edges = await edge_service.get_active_edges(
            sport=sport,
            prop_type=prop_type,
            min_ev=min_ev,
            limit=limit
        )
        
        # Apply edge score filter (TODO: move to service level)
        if min_edge_score is not None:
            edges = [e for e in edges if e.edge_score >= min_edge_score]
        
        # Convert to response models
        edge_responses = []
        for edge in edges:
            edge_response = EdgeResponse(
                id=edge.id,
                prop_id=edge.prop_id,
                model_version_id=edge.model_version_id,
                edge_score=edge.edge_score,
                ev=edge.ev,
                prob_over=edge.prob_over,
                offered_line=edge.offered_line,
                fair_line=edge.fair_line,
                status=edge.status,
                created_at=edge.created_at
            )
            edge_responses.append(edge_response)
        
        # Track applied filters
        filters_applied = {
            "sport": sport,
            "prop_type": prop_type,
            "min_ev": min_ev,
            "min_edge_score": min_edge_score,
            "status": status,
            "limit": limit
        }
        
        response = EdgeListResponse(
            edges=edge_responses,
            total_count=len(edge_responses),
            filters_applied=filters_applied
        )
        
        logger.info(f"Retrieved {len(edge_responses)} edges")
        return response
        
    except Exception as e:
        logger.error(f"Error getting edges: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error getting edges: {str(e)}"
        )


@router.get("/edges/{edge_id}", response_model=EdgeResponse)
async def get_edge(edge_id: int) -> EdgeResponse:
    """
    Get a specific edge by ID.
    
    Args:
        edge_id: Edge identifier
        
    Returns:
        EdgeResponse: Edge data
    """
    try:
        logger.info(f"Getting edge {edge_id}")
        
        edge = await edge_service.get_edge_by_id(edge_id)
        
        if not edge:
            raise HTTPException(
                status_code=404,
                detail=f"Edge {edge_id} not found"
            )
        
        response = EdgeResponse(
            id=edge.id,
            prop_id=edge.prop_id,
            model_version_id=edge.model_version_id,
            edge_score=edge.edge_score,
            ev=edge.ev,
            prob_over=edge.prob_over,
            offered_line=edge.offered_line,
            fair_line=edge.fair_line,
            status=edge.status,
            created_at=edge.created_at
        )
        
        logger.info(f"Retrieved edge {edge_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting edge {edge_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error getting edge: {str(e)}"
        )


@router.delete("/edges/{edge_id}")
async def retire_edge(edge_id: int) -> Dict[str, Any]:
    """
    Retire a specific edge.
    
    Args:
        edge_id: Edge identifier to retire
        
    Returns:
        dict: Operation result
    """
    try:
        logger.info(f"Retiring edge {edge_id}")
        
        # Get edge first to validate it exists
        edge = await edge_service.get_edge_by_id(edge_id)
        if not edge:
            raise HTTPException(
                status_code=404,
                detail=f"Edge {edge_id} not found"
            )
        
        # Retire edges for the prop (will retire this edge and others)
        retired_count = await edge_service.retire_edges_for_prop(edge.prop_id)
        
        response = {
            "edge_id": edge_id,
            "prop_id": edge.prop_id,
            "retired_count": retired_count,
            "status": "success"
        }
        
        logger.info(f"Retired {retired_count} edges for prop {edge.prop_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retiring edge {edge_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error retiring edge: {str(e)}"
        )


@router.get("/health/modeling")
async def modeling_health() -> Dict[str, Any]:
    """
    Health check for modeling system.
    
    Returns:
        dict: Health status of modeling components
    """
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "valuation_engine": "healthy",
                "edge_service": "healthy",
                "model_registry": "healthy",
                "database": "unknown"  # TODO: Add database health check
            },
            "statistics": {
                "total_model_versions": 0,  # TODO: Get from registry
                "active_edges_count": 0,    # TODO: Get from edge service
                "last_recompute": None      # TODO: Track last recompute time
            }
        }
        
        logger.info("Modeling health check completed")
        return health_status
        
    except Exception as e:
        logger.error(f"Error in modeling health check: {e}")
        return {
            "status": "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "components": {
                "valuation_engine": "unknown",
                "edge_service": "unknown", 
                "model_registry": "unknown",
                "database": "unknown"
            }
        }


# Debug/Admin endpoints
@router.post("/debug/test-valuation")
async def test_valuation() -> Dict[str, Any]:
    """
    Debug endpoint to test valuation with mock data.
    
    Returns:
        dict: Test result
    """
    try:
        logger.info("Running valuation test with mock data")
        
        # Test with mock prop ID
        mock_prop_id = 999999
        
        valuation = await valuation_engine.valuate(mock_prop_id)
        
        if not valuation:
            return {
                "status": "failed",
                "message": f"Valuation failed for mock prop {mock_prop_id}",
                "prop_id": mock_prop_id
            }
        
        # Test edge detection
        edge = await edge_service.detect_edge(valuation)
        
        result = {
            "status": "success",
            "prop_id": mock_prop_id,
            "valuation": {
                "prediction": valuation.prediction,
                "fair_line": valuation.fair_line,
                "offered_line": valuation.offered_line,
                "expected_value": valuation.expected_value,
                "prob_over": valuation.prob_over,
                "confidence": valuation.confidence
            },
            "edge": {
                "detected": edge is not None,
                "edge_score": edge.edge_score if edge else None,
                "qualifies": edge is not None
            }
        }
        
        logger.info(f"Valuation test completed: EV={valuation.expected_value:.4f}, Edge={edge is not None}")
        return result
        
    except Exception as e:
        logger.error(f"Error in valuation test: {e}")
        return {
            "status": "error",
            "message": str(e)
        }