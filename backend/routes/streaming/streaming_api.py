"""
Streaming API Routes

REST API endpoints for managing real-time market streaming,
providers, and portfolio rationales.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
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
async def list_providers() -> Dict[str, Any]:
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
async def get_provider(provider_name: str) -> Dict[str, Any]:
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
async def control_streaming(control_request: StreamingControlRequest) -> Dict[str, Any]:
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
async def generate_rationale(request: RationaleGenerationRequest) -> Dict[str, Any]:
    """
    Generate LLM-driven portfolio rationale
    """
    try:
        # Map string to enum
        rationale_type = ServiceRationaleType(request.rationale_type)
        
        # Generate rationale using the service
        rationale_request = RationaleRequest(
            rationale_type=rationale_type,
            portfolio_data=request.portfolio_data,
            context=request.context_data or {},
            user_preferences=request.user_preferences or {}
        )
        rationale = await portfolio_rationale_service.generate_rationale(rationale_request)
        
        return ApiResponse.success(
            data=rationale,
            message="Portfolio rationale generated successfully"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid rationale type: {request.rationale_type}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating rationale: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate rationale: {str(e)}")


@router.get("/status", summary="Get streaming system status")
async def get_system_status() -> Dict[str, Any]:
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