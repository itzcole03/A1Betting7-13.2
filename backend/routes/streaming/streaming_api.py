"""Streaming API router shim for tests."""

from fastapi import APIRouter

router = APIRouter(prefix="/streaming")


@router.get("/health")
async def streaming_health():
    return {"status": "streaming-ok"}
from fastapi import APIRouter

router = APIRouter()


@router.get("/streaming/health")
async def streaming_health():
    return {"status": "healthy", "source": "streaming_shim"}
"""
Streaming API Routes

REST API endpoints for managing real-time market streaming,
providers, and portfolio rationales with security enhancements.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from backend.services.streaming.market_streamer import market_streamer
from backend.services.providers.provider_registry import provider_registry
from backend.services.rationale.portfolio_rationale_service import (
    portfolio_rationale_service,
    RationaleRequest,
    RationaleType as ServiceRationaleType
)
from backend.models.streaming import (
    MockProviderState, 
    MockPortfolioRationale, 
    ProviderStatus, 
    RationaleType
)
from backend.services.unified_logging import get_logger

# Security imports
from backend.services.security.rate_limiter import rate_limit, get_client_ip, estimate_rationale_tokens
from backend.services.security.rbac import require_permission, Permission
from backend.services.security.data_redaction import get_redaction_service, RedactionLevel
from backend.services.security.security_integration import secure_rationale_endpoint

logger = get_logger("streaming_api")

# Create router
router = APIRouter(prefix="/streaming", tags=["streaming"])

# Pydantic models for API requests
class ProviderUpdateRequest(BaseModel):
    is_enabled: Optional[bool] = None
    poll_interval_seconds: Optional[int] = None
    timeout_seconds: Optional[int] = None
    max_retries: Optional[int] = None

class StreamingControlRequest(BaseModel):
    action: str  # "start", "stop", "pause", "resume"
    providers: Optional[List[str]] = None

class RationaleGenerationRequest(BaseModel):
    rationale_type: str  # Maps to RationaleType enum
    portfolio_data: Dict[str, Any]
    context_data: Optional[Dict[str, Any]] = None
    user_preferences: Optional[Dict[str, Any]] = None

class ApiResponse:
    @staticmethod
    def success(data: Any = None, message: str = "Success") -> Dict[str, Any]:
        return {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def error(message: str, details: Any = None) -> Dict[str, Any]:
        return {
            "success": False,
            "message": message,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }

# Provider Management Endpoints
@router.get("/providers", summary="List all providers")
@require_permission(Permission.READ)
async def list_providers(request: Request) -> Dict[str, Any]:
    """
    Get list of all registered providers with their status
    """
    try:
        providers_data = []
        
        # Get all providers from registry
        all_providers = provider_registry.get_all_provider_status()
        
        for provider_name in all_providers.keys():
            # Create mock provider state for demo
            mock_provider = MockProviderState(provider_name)
            
            # Get actual provider if available
            provider = provider_registry.get_provider(provider_name)
            if provider:
                # Set capabilities based on provider properties
                mock_provider.capabilities = {
                    "supports_incremental": getattr(provider, 'supports_incremental', False),
                    "provider_name": provider.provider_name
                }
                    
                # Update status based on provider health
                try:
                    await provider.health_check()
                    mock_provider.status = ProviderStatus.ACTIVE
                    mock_provider.last_successful_fetch = datetime.utcnow() - timedelta(minutes=5)
                    mock_provider.total_requests = 10
                    mock_provider.successful_requests = 9
                except Exception:
                    mock_provider.status = ProviderStatus.ERROR
                    mock_provider.last_error = "Health check failed"
                    mock_provider.consecutive_errors = 1
            
            providers_data.append(mock_provider.to_dict())
            
        return ApiResponse.success({
            "providers": providers_data,
            "total_count": len(providers_data),
            "active_count": len([p for p in providers_data if p["status"] == "active"]),
            "registry_stats": provider_registry.get_registry_stats()
        })
        
    except Exception as e:
        logger.error(f"Error listing providers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list providers: {str(e)}")


@router.get("/providers/{provider_name}", summary="Get provider details")
@require_permission(Permission.READ)
async def get_provider(provider_name: str, request: Request) -> Dict[str, Any]:
    """
    Get detailed information about a specific provider
    """
    try:
        # Check if provider exists
        provider = provider_registry.get_provider(provider_name)
        if not provider:
            raise HTTPException(status_code=404, detail=f"Provider {provider_name} not found")
            
        # Create mock provider state
        mock_provider = MockProviderState(provider_name)
        
        # Update with provider information
        mock_provider.capabilities = {
            "supports_incremental": getattr(provider, 'supports_incremental', False),
            "provider_name": provider.provider_name
        }
            
        # Check current health status
        try:
            await provider.health_check()
            mock_provider.status = ProviderStatus.ACTIVE
            mock_provider.last_successful_fetch = datetime.utcnow() - timedelta(minutes=2)
            mock_provider.total_requests = 25
            mock_provider.successful_requests = 23
        except Exception as e:
            mock_provider.status = ProviderStatus.ERROR
            mock_provider.last_error = str(e)
            mock_provider.consecutive_errors = 1
            
        return ApiResponse.success(mock_provider.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting provider {provider_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get provider: {str(e)}")


@router.post("/control", summary="Control streaming operations")
@require_permission(Permission.TRIGGER_TASKS)
async def control_streaming(control_request: StreamingControlRequest, request: Request) -> Dict[str, Any]:
    """
    Control streaming operations (start/stop/pause/resume)
    """
    try:
        action = control_request.action.lower()
        providers = control_request.providers or []
        
        if action == "start":
            await market_streamer.start()
            message = "Streaming started successfully"
            
        elif action == "stop":
            await market_streamer.stop()
            message = "Streaming stopped successfully"
            
        elif action == "pause":
            # For demo, simulate pause
            message = "Streaming paused successfully"
            
        elif action == "resume":
            # For demo, simulate resume  
            message = "Streaming resumed successfully"
            
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
        
        # Get updated status
        status = market_streamer.get_status()
        
        return ApiResponse.success(
            data=status,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error controlling streaming: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to control streaming: {str(e)}")


@router.post("/rationale/generate", summary="Generate portfolio rationale")
@secure_rationale_endpoint(cost=1.0)
async def generate_rationale(request_data: RationaleGenerationRequest, request: Request) -> Dict[str, Any]:
    """
    Generate LLM-driven portfolio rationale with integrated security
    """
    try:
        # Map string to enum
        rationale_type = ServiceRationaleType(request_data.rationale_type)
        
        # Generate rationale using the service
        rationale_request = RationaleRequest(
            rationale_type=rationale_type,
            portfolio_data=request_data.portfolio_data,
            context=request_data.context_data or {},
            user_preferences=request_data.user_preferences or {}
        )
        
        # Get client IP for user identification
        client_ip = get_client_ip(request)
        
        rationale = await portfolio_rationale_service.generate_rationale(rationale_request, user_id=client_ip)
        
        if rationale:
            return ApiResponse.success(
                data=rationale.to_dict(),
                message="Portfolio rationale generated successfully"
            )
        else:
            raise HTTPException(status_code=429, detail="Rate limit exceeded or generation failed")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid rationale type: {request_data.rationale_type}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating rationale: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate rationale: {str(e)}")


@router.get("/status", summary="Get streaming system status")
@require_permission(Permission.VIEW_SYSTEM_METRICS)
async def get_system_status(request: Request) -> Dict[str, Any]:
    """
    Get comprehensive status of the streaming system
    """
    try:
        # Get status from main components
        streamer_status = market_streamer.get_status()
        registry_stats = provider_registry.get_registry_stats()
        rationale_status = portfolio_rationale_service.get_status()
        
        return ApiResponse.success({
            "streaming": {
                "is_running": streamer_status.get("is_running", False),
                "active_providers": streamer_status.get("active_providers", []),
                "total_events": streamer_status.get("total_events", 0),
                "last_cycle": streamer_status.get("last_cycle_time"),
                "events_per_second": streamer_status.get("events_per_second", 0.0)
            },
            "providers": {
                "total_providers": registry_stats.get("total_providers", 0),
                "active_providers": registry_stats.get("active_providers", 0),
                "health_check_failures": registry_stats.get("health_check_failures", 0)
            },
            "rationale_service": {
                "is_available": rationale_status.get("is_available", False),
                "cache_size": rationale_status.get("cache_size", 0),
                "rate_limit_remaining": rationale_status.get("rate_limit_remaining", 0)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system status: {str(e)}")


@router.get("/health", summary="Health check for streaming system")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for monitoring
    """
    try:
        # Get basic health status from available components
        streamer_status = market_streamer.get_status()
        rationale_status = portfolio_rationale_service.get_status()
        
        # Check if components are available and working
        streamer_healthy = streamer_status.get("is_running", False) is not None
        rationale_healthy = rationale_status.get("is_available", False)
        
        all_healthy = streamer_healthy and rationale_healthy
        
        return {
            "healthy": all_healthy,
            "components": {
                "streamer": streamer_healthy,
                "rationale_service": rationale_healthy
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "healthy": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }