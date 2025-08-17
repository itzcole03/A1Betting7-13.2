"""
LLM Explanations API Routes

RESTful endpoints for generating, retrieving, and managing edge explanations
using LLM services with caching and rate limiting.
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Query, Depends, Header
from pydantic import BaseModel, Field

from backend.services.llm.explanation_service import explanation_service, ExplanationDTO, PrefetchSummary

logger = logging.getLogger("llm_explanations_routes")

router = APIRouter(prefix="/api/v1", tags=["llm-explanations"])


# Request/Response Models
class ExplanationGenerateRequest(BaseModel):
    """Request model for explanation generation"""
    force_refresh: bool = Field(default=False, description="Force new generation bypassing cache")


class ExplanationResponse(BaseModel):
    """Response model for explanation endpoints"""
    edge_id: int
    model_version_id: int
    prompt_version: str
    content: str
    provider: str
    tokens_used: int
    cache_hit: bool
    created_at: datetime
    generation_time_ms: Optional[int] = None


class PrefetchRequest(BaseModel):
    """Request model for batch prefetch"""
    edge_ids: List[int] = Field(..., description="List of edge IDs to prefetch")
    concurrency: int = Field(default=4, ge=1, le=10, description="Concurrent generation limit")


class PrefetchResponse(BaseModel):
    """Response model for prefetch operation"""
    requested: int
    generated: int
    cache_hits: int
    failures: int
    duration_ms: int


class CompareRequest(BaseModel):
    """Request model for edge comparison (future feature)"""
    edge_a_id: int
    edge_b_id: int


class CompareResponse(BaseModel):
    """Response model for edge comparison"""
    comparison_text: str
    provider: str
    prompt_version: str


# Dependency for structured logging
def log_request_info(
    user_agent: Optional[str] = Header(None),
    x_request_id: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """Extract request context for structured logging"""
    return {
        "user_agent": user_agent,
        "request_id": x_request_id
    }


# API Endpoints
@router.post("/edges/{edge_id}/explanation", response_model=ExplanationResponse)
async def generate_edge_explanation(
    edge_id: int,
    request: ExplanationGenerateRequest,
    request_context: Dict[str, Any] = Depends(log_request_info)
) -> ExplanationResponse:
    """
    Generate or retrieve explanation for a specific edge
    
    Args:
        edge_id: Edge identifier
        request: Generation options
        
    Returns:
        ExplanationResponse: Generated or cached explanation
        
    Headers:
        X-LLM-Cache: HIT | MISS
        X-LLM-Provider: Provider name
    """
    
    logger.info(
        f"LLM explanation request - edge_id: {edge_id}, force_refresh: {request.force_refresh}, request_id: {request_context.get('request_id')}"
    )
    
    try:
        # Generate or retrieve explanation
        explanation_dto = await explanation_service.generate_or_get_edge_explanation(
            edge_id=edge_id,
            force_refresh=request.force_refresh
        )
        
        # Prepare response with headers
        response = ExplanationResponse(**explanation_dto.__dict__)
        
        # Set custom headers (FastAPI will add these automatically when we return the response)
        cache_status = "HIT" if explanation_dto.cache_hit else "MISS"
        
        logger.info(
            f"LLM explanation complete - edge_id: {edge_id}, cache_hit: {explanation_dto.cache_hit}, provider: {explanation_dto.provider}, tokens: {explanation_dto.tokens_used}"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LLM explanation error - edge_id: {edge_id}, error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal error generating explanation"
        )


@router.get("/edges/{edge_id}/explanation", response_model=ExplanationResponse)
async def get_edge_explanation(
    edge_id: int,
    stale_ok: bool = Query(default=True, description="Allow stale/cached explanations"),
    request_context: Dict[str, Any] = Depends(log_request_info)
) -> ExplanationResponse:
    """
    Retrieve existing explanation for an edge
    
    Args:
        edge_id: Edge identifier
        stale_ok: Allow returning cached/stale explanations
        
    Returns:
        ExplanationResponse: Existing explanation
        
    Raises:
        404: If no explanation exists and stale_ok is False
    """
    
    try:
        # Try to get cached explanation first
        explanation_dto = await explanation_service.generate_or_get_edge_explanation(
            edge_id=edge_id,
            force_refresh=False
        )
        
        response = ExplanationResponse(**explanation_dto.__dict__)
        
        logger.info(f"LLM explanation retrieve - edge_id: {edge_id}, cache_hit: {explanation_dto.cache_hit}")
        
        return response
        
    except HTTPException as e:
        if e.status_code == 404 and not stale_ok:
            raise
        elif e.status_code == 404 and stale_ok:
            # Generate new explanation if none exists
            return await generate_edge_explanation(
                edge_id=edge_id,
                request=ExplanationGenerateRequest(force_refresh=False),
                request_context=request_context
            )
        else:
            raise


@router.post("/edges/explanations/prefetch", response_model=PrefetchResponse)
async def prefetch_explanations(
    request: PrefetchRequest,
    request_context: Dict[str, Any] = Depends(log_request_info)
) -> PrefetchResponse:
    """
    Batch prefetch explanations for multiple edges
    
    Args:
        request: Prefetch parameters
        
    Returns:
        PrefetchResponse: Summary of prefetch operation
    """
    
    if not request.edge_ids:
        raise HTTPException(
            status_code=400,
            detail="edge_ids cannot be empty"
        )
    
    if len(request.edge_ids) > 100:
        raise HTTPException(
            status_code=400,
            detail="Cannot prefetch more than 100 edges at once"
        )
    
    logger.info(f"LLM prefetch start - edge_count: {len(request.edge_ids)}, concurrency: {request.concurrency}")
    
    try:
        # Perform batch prefetch
        summary = await explanation_service.prefetch_explanations_for_edges(
            edge_ids=request.edge_ids,
            concurrency=request.concurrency
        )
        
        response = PrefetchResponse(**summary.__dict__)
        
        logger.info(
            f"LLM prefetch complete - requested: {summary.requested}, generated: {summary.generated}, cache_hits: {summary.cache_hits}, failures: {summary.failures}, duration_ms: {summary.duration_ms}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"LLM prefetch error - edge_count: {len(request.edge_ids)}, error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal error during prefetch"
        )


@router.post("/edges/explanations/compare", response_model=CompareResponse)
async def compare_edges(
    request: CompareRequest,
    request_context: Dict[str, Any] = Depends(log_request_info)
) -> CompareResponse:
    """
    Compare two edges (scaffold for future implementation)
    
    Args:
        request: Comparison parameters
        
    Returns:
        CompareResponse: Comparative analysis
    """
    
    # TODO: Implement comparative analysis using build_comparative_prompt
    logger.info(f"LLM comparison request - edge_a_id: {request.edge_a_id}, edge_b_id: {request.edge_b_id}")
    
    return CompareResponse(
        comparison_text=f"TODO: Comparative analysis between edge {request.edge_a_id} and edge {request.edge_b_id}. This feature will be implemented in a future iteration.",
        provider="placeholder",
        prompt_version="v1"
    )


# Health/Status Endpoints
@router.get("/llm/status")
async def get_llm_status() -> Dict[str, Any]:
    """Get LLM service status and cache information"""
    
    from backend.services.llm.llm_cache import llm_cache
    from backend.services.llm.adapters import get_llm_adapter
    
    try:
        adapter = get_llm_adapter()
        cache_info = llm_cache.get_cache_info()
        
        return {
            "status": "healthy",
            "provider": adapter.get_provider_name(),
            "provider_available": adapter.is_available(),
            "cache_info": cache_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"LLM status check failed: {e}")
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }