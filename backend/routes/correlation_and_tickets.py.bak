"""
Correlation and Tickets API Routes - REST endpoints for correlation analysis and parlay ticketing

Provides endpoints for:
1. Correlation matrix computation and retrieval
2. Correlation clustering analysis
3. Ticket creation, submission, and management
4. Parlay EV simulation and analysis

All endpoints include structured logging and instrumentation for monitoring.
"""

from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

from backend.services.correlation.correlation_engine import correlation_engine
from backend.services.ticketing.ticket_service import (
    ticket_service, TicketValidationError
)
from backend.services.unified_logging import get_logger
from backend.services.unified_error_handler import unified_error_handler, ErrorContext


logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["correlation", "tickets"])


# Request/Response Models
class CorrelationMatrixRequest(BaseModel):
    """Request for correlation matrix computation"""
    prop_ids: List[int] = Field(..., description="List of prop IDs (2-50 items)")
    context: Optional[Dict[str, Any]] = None
    
    @validator('prop_ids')
    def validate_prop_ids(cls, v):
        if len(v) < 2:
            raise ValueError('At least 2 prop IDs required')
        if len(v) > 50:
            raise ValueError('Maximum 50 prop IDs allowed')
        return v


class CorrelationMatrixResponse(BaseModel):
    """Response for correlation matrix"""
    matrix: Dict[int, Dict[int, float]]
    sample_size_map: Dict[str, int]
    prop_ids_count: int
    computed_pairs: int


class CorrelationClustersRequest(BaseModel):
    """Request for correlation clustering"""
    prop_ids: List[int] = Field(..., description="List of prop IDs (2-50 items)")
    threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    context: Optional[Dict[str, Any]] = None
    
    @validator('prop_ids')
    def validate_prop_ids(cls, v):
        if len(v) < 2:
            raise ValueError('At least 2 prop IDs required')
        if len(v) > 50:
            raise ValueError('Maximum 50 prop IDs allowed')
        return v


class CorrelationCluster(BaseModel):
    """Cluster information"""
    member_prop_ids: List[int]
    average_internal_r: float


class CorrelationClustersResponse(BaseModel):
    """Response for correlation clustering"""
    clusters: List[CorrelationCluster]
    prop_ids_count: int
    threshold_used: float
    clusters_found: int


class TicketDraftRequest(BaseModel):
    """Request for creating draft ticket"""
    user_id: Optional[int] = None
    stake: float = Field(..., gt=0, description="Stake amount (must be positive)")
    edge_ids: List[int] = Field(..., description="List of edge IDs (1-10 items)")
    
    @validator('edge_ids')
    def validate_edge_ids(cls, v):
        if len(v) < 1:
            raise ValueError('At least 1 edge ID required')
        if len(v) > 10:
            raise ValueError('Maximum 10 edge IDs allowed')
        if len(set(v)) != len(v):
            raise ValueError('Duplicate edge IDs not allowed')
        return v


class TicketResponse(BaseModel):
    """Response for ticket operations"""
    ticket_id: int
    user_id: Optional[int]
    status: str
    stake: float
    potential_payout: float
    estimated_ev: float
    legs_count: int
    legs: List[Dict[str, Any]]
    simulation_result: Optional[Dict[str, Any]] = None
    created_at: str
    submitted_at: Optional[str] = None


class TicketSubmitRequest(BaseModel):
    """Request for submitting ticket (currently no additional fields needed)"""
    pass


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    error_code: str
    details: Optional[Dict[str, Any]] = None


# Helper function for route instrumentation
def instrument_route(route_name: str):
    """Decorator for route instrumentation"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            logger.info(
                f"Route called: {route_name}",
                extra={
                    "route": route_name,
                    "action": "route_start",
                    "category": "correlation" if "correlation" in route_name else "ticketing"
                }
            )
            try:
                result = await func(*args, **kwargs)
                logger.info(
                    f"Route completed: {route_name}",
                    extra={
                        "route": route_name,
                        "action": "route_success",
                        "category": "correlation" if "correlation" in route_name else "ticketing"
                    }
                )
                return result
            except Exception as e:
                logger.error(
                    f"Route failed: {route_name}",
                    extra={
                        "route": route_name,
                        "error": str(e),
                        "action": "route_error",
                        "category": "correlation" if "correlation" in route_name else "ticketing"
                    }
                )
                raise
        return wrapper
    return decorator


# Correlation Endpoints

@router.post("/correlation/matrix", response_model=CorrelationMatrixResponse)
@instrument_route("correlation_matrix")
async def get_correlation_matrix(request: CorrelationMatrixRequest):
    """
    Compute correlation matrix for a set of props.
    
    Returns pairwise correlations with sample sizes for analysis.
    Missing pairs are filled with 0.0 correlation.
    """
    try:
        # Compute correlation matrix
        correlation_matrix = correlation_engine.build_correlation_matrix(
            request.prop_ids, request.context
        )
        
        # Get sample sizes
        sample_size_map = correlation_engine.get_correlation_matrix_sample_sizes(
            request.prop_ids, request.context
        )
        
        # Count computed pairs (non-diagonal, non-zero)
        computed_pairs = 0
        for prop_id_a in request.prop_ids:
            for prop_id_b in request.prop_ids:
                if prop_id_a != prop_id_b and correlation_matrix.get(prop_id_a, {}).get(prop_id_b, 0.0) != 0.0:
                    computed_pairs += 1
        
        computed_pairs //= 2  # Each pair counted twice
        
        return CorrelationMatrixResponse(
            matrix=correlation_matrix,
            sample_size_map=sample_size_map,
            prop_ids_count=len(request.prop_ids),
            computed_pairs=computed_pairs
        )
        
    except Exception as e:
        error_info = unified_error_handler.handle_error(
            error=e,
            context=ErrorContext(
                endpoint="correlation_matrix",
                additional_data={"prop_ids_count": len(request.prop_ids)}
            )
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=error_info.user_message or "Failed to compute correlation matrix",
                error_code="CORRELATION_MATRIX_ERROR",
                details={"error_id": error_info.error_id}
            ).dict()
        )


@router.post("/correlation/clusters", response_model=CorrelationClustersResponse)
@instrument_route("correlation_clusters")
async def get_correlation_clusters(request: CorrelationClustersRequest):
    """
    Identify clusters of highly correlated props.
    
    Uses graph-based clustering where props are connected if their
    absolute correlation exceeds the threshold.
    """
    try:
        # Compute clusters
        clusters = correlation_engine.compute_clusters(
            request.prop_ids, request.threshold, request.context
        )
        
        # Get effective threshold
        from backend.services.unified_config import get_correlation_config
        threshold_used = request.threshold or get_correlation_config().threshold_cluster
        
        # Convert to response format
        cluster_responses = [
            CorrelationCluster(
                member_prop_ids=cluster.member_prop_ids,
                average_internal_r=cluster.average_internal_r
            )
            for cluster in clusters
        ]
        
        return CorrelationClustersResponse(
            clusters=cluster_responses,
            prop_ids_count=len(request.prop_ids),
            threshold_used=threshold_used,
            clusters_found=len(clusters)
        )
        
    except Exception as e:
        error_info = unified_error_handler.handle_error(
            error=e,
            context=ErrorContext(
                endpoint="correlation_clusters",
                additional_data={
                    "prop_ids_count": len(request.prop_ids),
                    "threshold": request.threshold
                }
            )
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=error_info.user_message or "Failed to compute correlation clusters",
                error_code="CORRELATION_CLUSTERS_ERROR",
                details={"error_id": error_info.error_id}
            ).dict()
        )


# Ticketing Endpoints

@router.post("/tickets/draft", response_model=TicketResponse)
@instrument_route("ticket_draft")
async def create_draft_ticket(request: TicketDraftRequest):
    """
    Create a draft parlay ticket.
    
    Validates edges, enforces constraints (max legs, max correlation),
    and computes expected value with correlation adjustments.
    """
    try:
        # Create draft ticket
        ticket_dto = ticket_service.create_draft_ticket(
            user_id=request.user_id,
            stake=request.stake,
            edge_ids=request.edge_ids
        )
        
        # Convert DTO to response model
        return TicketResponse(**ticket_dto.__dict__)
        
    except TicketValidationError as e:
        # Handle validation errors with appropriate status codes
        status_code_map = {
            "INVALID_STAKE": status.HTTP_400_BAD_REQUEST,
            "NO_EDGES": status.HTTP_400_BAD_REQUEST,
            "TOO_MANY_LEGS": status.HTTP_400_BAD_REQUEST,
            "TOO_FEW_LEGS": status.HTTP_400_BAD_REQUEST,
            "EDGES_NOT_FOUND": status.HTTP_404_NOT_FOUND,
            "INACTIVE_EDGES": status.HTTP_409_CONFLICT,
            "CORRELATION_TOO_HIGH": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "VALUATION_NOT_FOUND": status.HTTP_404_NOT_FOUND
        }
        
        status_code = status_code_map.get(e.error_code, status.HTTP_400_BAD_REQUEST)
        
        raise HTTPException(
            status_code=status_code,
            detail=ErrorResponse(
                error=e.message,
                error_code=e.error_code,
                details={"stake": request.stake, "edge_ids": request.edge_ids}
            ).dict()
        )
        
    except Exception as e:
        error_info = unified_error_handler.handle_error(
            error=e,
            context=ErrorContext(
                endpoint="ticket_draft",
                additional_data={
                    "user_id": request.user_id,
                    "stake": request.stake,
                    "edge_ids_count": len(request.edge_ids)
                }
            )
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=error_info.user_message or "Failed to create draft ticket",
                error_code="TICKET_CREATION_ERROR",
                details={"error_id": error_info.error_id}
            ).dict()
        )


@router.post("/tickets/{ticket_id}/submit", response_model=TicketResponse)
@instrument_route("ticket_submit")
async def submit_ticket(ticket_id: int, request: TicketSubmitRequest):
    """
    Submit a draft ticket for execution.
    
    Validates that all edges are still active and valuations haven't changed
    since ticket creation.
    """
    try:
        # Submit ticket
        ticket_dto = ticket_service.submit_ticket(ticket_id)
        
        # Convert DTO to response model
        return TicketResponse(**ticket_dto.__dict__)
        
    except TicketValidationError as e:
        # Handle validation errors
        status_code_map = {
            "TICKET_NOT_FOUND": status.HTTP_404_NOT_FOUND,
            "INVALID_STATUS": status.HTTP_409_CONFLICT,
            "EDGE_NOT_FOUND": status.HTTP_404_NOT_FOUND,
            "EDGE_STATE_CHANGED": status.HTTP_409_CONFLICT
        }
        
        status_code = status_code_map.get(e.error_code, status.HTTP_400_BAD_REQUEST)
        
        raise HTTPException(
            status_code=status_code,
            detail=ErrorResponse(
                error=e.message,
                error_code=e.error_code,
                details={"ticket_id": ticket_id}
            ).dict()
        )
        
    except Exception as e:
        error_info = unified_error_handler.handle_error(
            error=e,
            context=ErrorContext(
                endpoint="ticket_submit",
                additional_data={"ticket_id": ticket_id}
            )
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=error_info.user_message or "Failed to submit ticket",
                error_code="TICKET_SUBMISSION_ERROR",
                details={"error_id": error_info.error_id}
            ).dict()
        )


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
@instrument_route("ticket_get")
async def get_ticket(ticket_id: int):
    """
    Get ticket information.
    
    Returns current ticket state including legs and simulation results if available.
    """
    try:
        # Get ticket
        ticket_dto = ticket_service.get_ticket(ticket_id)
        
        # Convert DTO to response model
        return TicketResponse(**ticket_dto.__dict__)
        
    except TicketValidationError as e:
        if e.error_code == "TICKET_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorResponse(
                    error=e.message,
                    error_code=e.error_code,
                    details={"ticket_id": ticket_id}
                ).dict()
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error=e.message,
                error_code=e.error_code,
                details={"ticket_id": ticket_id}
            ).dict()
        )
        
    except Exception as e:
        error_info = unified_error_handler.handle_error(
            error=e,
            context=ErrorContext(
                endpoint="ticket_get",
                additional_data={"ticket_id": ticket_id}
            )
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=error_info.user_message or "Failed to get ticket",
                error_code="TICKET_GET_ERROR",
                details={"error_id": error_info.error_id}
            ).dict()
        )


@router.post("/tickets/{ticket_id}/recalc", response_model=TicketResponse)
@instrument_route("ticket_recalc")
async def recalc_ticket(ticket_id: int):
    """
    Recalculate ticket expected value with current market conditions.
    
    Only works for draft tickets. Updates EV based on current edge states
    and correlation analysis.
    """
    try:
        # Recalculate ticket
        ticket_dto = ticket_service.recalc_ticket(ticket_id)
        
        # Convert DTO to response model
        return TicketResponse(**ticket_dto.__dict__)
        
    except TicketValidationError as e:
        if e.error_code == "TICKET_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorResponse(
                    error=e.message,
                    error_code=e.error_code,
                    details={"ticket_id": ticket_id}
                ).dict()
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error=e.message,
                error_code=e.error_code,
                details={"ticket_id": ticket_id}
            ).dict()
        )
        
    except Exception as e:
        error_info = unified_error_handler.handle_error(
            error=e,
            context=ErrorContext(
                endpoint="ticket_recalc",
                additional_data={"ticket_id": ticket_id}
            )
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=error_info.user_message or "Failed to recalculate ticket",
                error_code="TICKET_RECALC_ERROR",
                details={"error_id": error_info.error_id}
            ).dict()
        )


# Optional: Ticket listing endpoint (placeholder for future user system)
@router.get("/tickets", response_model=List[TicketResponse])
@instrument_route("tickets_list")
async def list_tickets(user_id: Optional[int] = None, limit: int = 50):
    """
    List tickets for a user (placeholder endpoint for future user system).
    
    TODO: Implement once user system is available
    """
    # Placeholder response
    return []


# Health check endpoint for correlation and ticketing services
@router.get("/correlation/health")
async def correlation_health():
    """Health check for correlation services"""
    try:
        # Quick test of correlation engine
        test_matrix = correlation_engine.build_correlation_matrix([1, 2])
        
        return {
            "status": "healthy",
            "services": {
                "correlation_engine": "available",
                "historical_data_provider": "available"
            },
            "test_result": "correlation_matrix_computed"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "error": str(e)
            }
        )


@router.get("/tickets/health")
async def ticketing_health():
    """Health check for ticketing services"""
    try:
        # Quick test of ticket service (without actual database operations)
        from backend.services.unified_config import get_ticketing_config
        config = get_ticketing_config()
        
        return {
            "status": "healthy",
            "services": {
                "ticket_service": "available",
                "parlay_simulator": "available"
            },
            "config": {
                "max_legs": config.max_legs,
                "min_legs": config.min_legs,
                "max_avg_correlation": config.max_avg_correlation
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "error": str(e)
            }
        )


# Export router for inclusion in main app
__all__ = ["router"]