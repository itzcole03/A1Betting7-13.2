"""
System Capabilities API Routes

Provides endpoints to expose service capability matrix and system status information.
"""

import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi import status as http_status
from fastapi.responses import JSONResponse

try:
    from backend.services.service_capability_matrix import (
        get_capability_registry,
        get_capability_registry_sync,
        ServiceStatus,
        ServiceCategory,
        DegradedPolicy
    )
    from backend.services.unified_logging import unified_logger, LogComponent, LogContext
    CAPABILITY_REGISTRY_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Capability registry not available: {e}")
    get_capability_registry = None
    get_capability_registry_sync = None
    ServiceStatus = None
    ServiceCategory = None
    DegradedPolicy = None
    unified_logger = None
    LogComponent = None
    LogContext = None
    CAPABILITY_REGISTRY_AVAILABLE = False

# Create router
router = APIRouter(prefix="/api/system", tags=["system"])

# Logger setup
logger = unified_logger if unified_logger else logging.getLogger(__name__)


@router.get("/capabilities", 
           summary="Get System Capability Matrix",
           description="Returns comprehensive service capability matrix with status, health, and degradation policies")
async def get_capabilities(
    include_metadata: bool = Query(False, description="Include detailed metadata for each service"),
    format: str = Query("full", regex="^(summary|full|minimal)$", description="Response format level")
) -> JSONResponse:
    """
    Get the complete system capability matrix.
    
    Args:
        include_metadata: Whether to include detailed service metadata
        format: Response format (summary, full, minimal)
    
    Returns:
        JSONResponse containing the capability matrix
    """
    start_time = time.time()
    
    if not CAPABILITY_REGISTRY_AVAILABLE or get_capability_registry is None:
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Service capability registry not available",
                "message": "The capability matrix system is not initialized",
                "capabilities": None,
                "timestamp": time.time()
            }
        )
    
    try:
        # Get capability registry
        registry = await get_capability_registry()
        matrix = await registry.get_capabilities_matrix()
        
        # Convert to dictionary
        matrix_dict = matrix.to_dict()
        
        # Apply format filtering
        if format == "summary":
            response_data = {
                "matrix_version": matrix_dict["matrix_version"],
                "last_updated": matrix_dict["last_updated"],
                "global_status": matrix_dict["global_status"],
                "summary": matrix_dict["summary"],
                "demo_mode_services": matrix_dict["demo_mode_services"]
            }
        elif format == "minimal":
            response_data = {
                "global_status": matrix_dict["global_status"],
                "summary": matrix_dict["summary"],
                "service_count": len(matrix_dict["services"])
            }
        else:  # format == "full"
            response_data = matrix_dict
            
            # Optionally filter out metadata
            if not include_metadata:
                for service_name, service_data in response_data.get("services", {}).items():
                    service_data.pop("metadata", None)
        
        # Add response timing
        response_data["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
        
        # Log successful request
        if unified_logger and LogComponent and LogContext:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="capabilities_request",
                additional_data={
                    "format": format,
                    "include_metadata": include_metadata,
                    "service_count": len(matrix_dict.get("services", {})),
                    "global_status": matrix_dict.get("global_status")
                }
            )
            logger.info(f"Capabilities matrix requested (format: {format})", context)
        
        return JSONResponse(
            status_code=http_status.HTTP_200_OK,
            content=response_data
        )
        
    except Exception as e:
        error_message = f"Failed to retrieve capability matrix: {str(e)}"
        
        if unified_logger and LogComponent and LogContext:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="capabilities_error",
                additional_data={"error": str(e)}
            )
            logger.error(error_message, context)
        
        return JSONResponse(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "message": error_message,
                "capabilities": None,
                "timestamp": time.time()
            }
        )


@router.get("/capabilities/{service_name}",
           summary="Get Specific Service Capability",
           description="Returns capability information for a specific service")
async def get_service_capability(service_name: str) -> JSONResponse:
    """
    Get capability information for a specific service.
    
    Args:
        service_name: Name of the service to query
    
    Returns:
        JSONResponse containing service capability information
    """
    if not CAPABILITY_REGISTRY_AVAILABLE or get_capability_registry is None:
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Service capability registry not available",
                "service_name": service_name,
                "capability": None
            }
        )
    
    try:
        registry = await get_capability_registry()
        capability = await registry.get_service_capability(service_name)
        
        if not capability:
            return JSONResponse(
                status_code=http_status.HTTP_404_NOT_FOUND,
                content={
                    "error": "Service not found",
                    "service_name": service_name,
                    "capability": None,
                    "available_services": list((await registry.get_capabilities_matrix()).services.keys())
                }
            )
        
        return JSONResponse(
            status_code=http_status.HTTP_200_OK,
            content={
                "service_name": service_name,
                "capability": capability.to_dict(),
                "timestamp": time.time()
            }
        )
        
    except Exception as e:
        error_message = f"Failed to retrieve capability for service {service_name}: {str(e)}"
        
        if unified_logger and LogComponent and LogContext:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="service_capability_error",
                additional_data={"service_name": service_name, "error": str(e)}
            )
            logger.error(error_message, context)
        
        return JSONResponse(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "message": error_message,
                "service_name": service_name,
                "capability": None
            }
        )


@router.post("/capabilities/{service_name}/status",
            summary="Update Service Status",
            description="Update the status of a specific service (admin only)")
async def update_service_status(
    service_name: str,
    new_status: str,
    response_time_ms: Optional[float] = None
) -> JSONResponse:
    """
    Update the status of a specific service.
    
    Args:
        service_name: Name of the service to update
        new_status: New status (UP, DEGRADED, DOWN, DEMO)
        response_time_ms: Optional response time in milliseconds
    
    Returns:
        JSONResponse confirming the status update
    """
    if not CAPABILITY_REGISTRY_AVAILABLE or get_capability_registry is None or ServiceStatus is None:
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Service capability registry not available",
                "service_name": service_name
            }
        )
    
    # Validate status
    try:
        service_status = ServiceStatus(new_status.upper())
    except ValueError:
        valid_statuses = ["UP", "DEGRADED", "DOWN", "DEMO"]
        return JSONResponse(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            content={
                "error": "Invalid status",
                "message": f"Status must be one of: {valid_statuses}",
                "provided_status": new_status
            }
        )
    
    try:
        registry = await get_capability_registry()
        success = await registry.update_service_status(service_name, service_status, response_time_ms)
        
        if not success:
            return JSONResponse(
                status_code=http_status.HTTP_404_NOT_FOUND,
                content={
                    "error": "Service not found",
                    "service_name": service_name,
                    "available_services": list((await registry.get_capabilities_matrix()).services.keys())
                }
            )
        
        # Get updated capability
        updated_capability = await registry.get_service_capability(service_name)
        
        return JSONResponse(
            status_code=http_status.HTTP_200_OK,
            content={
                "success": True,
                "service_name": service_name,
                "old_status": "unknown",  # We could track this if needed
                "new_status": service_status.value,
                "updated_capability": updated_capability.to_dict() if updated_capability else None,
                "timestamp": time.time()
            }
        )
        
    except Exception as e:
        error_message = f"Failed to update status for service {service_name}: {str(e)}"
        
        if unified_logger and LogComponent and LogContext:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="service_status_update_error",
                additional_data={
                    "service_name": service_name, 
                    "requested_status": new_status,
                    "error": str(e)
                }
            )
            logger.error(error_message, context)
        
        return JSONResponse(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "message": error_message,
                "service_name": service_name
            }
        )


@router.get("/capabilities/summary",
           summary="Get Capability Matrix Summary",
           description="Returns a condensed summary of the capability matrix")
async def get_capabilities_summary() -> JSONResponse:
    """
    Get a summary of the capability matrix.
    
    Returns:
        JSONResponse containing capability matrix summary
    """
    if not CAPABILITY_REGISTRY_AVAILABLE or get_capability_registry is None:
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Service capability registry not available",
                "summary": None
            }
        )
    
    try:
        registry = await get_capability_registry()
        matrix = await registry.get_capabilities_matrix()
        
        return JSONResponse(
            status_code=http_status.HTTP_200_OK,
            content={
                "summary": matrix._generate_summary(),
                "global_status": matrix.global_status.value,
                "demo_mode_services": list(matrix.demo_mode_services),
                "matrix_version": matrix.matrix_version,
                "last_updated": matrix.last_updated.isoformat(),
                "timestamp": time.time()
            }
        )
        
    except Exception as e:
        error_message = f"Failed to retrieve capability summary: {str(e)}"
        
        if unified_logger and LogComponent and LogContext:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="capabilities_summary_error",
                additional_data={"error": str(e)}
            )
            logger.error(error_message, context)
        
        return JSONResponse(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error", 
                "message": error_message,
                "summary": None
            }
        )


@router.get("/health/extended",
           summary="Extended System Health Check",
           description="Comprehensive health check including capability matrix status")
async def extended_health_check() -> JSONResponse:
    """
    Extended health check that includes capability matrix information.
    
    Returns:
        JSONResponse with comprehensive health information
    """
    start_time = time.time()
    
    health_info = {
        "status": "healthy",
        "timestamp": time.time(),
        "uptime_info": "Available",  # Could be enhanced with actual uptime
        "capability_matrix": {
            "available": CAPABILITY_REGISTRY_AVAILABLE,
            "status": None,
            "summary": None
        }
    }
    
    # Add capability matrix information if available
    if CAPABILITY_REGISTRY_AVAILABLE and get_capability_registry is not None:
        try:
            registry = await get_capability_registry()
            matrix = await registry.get_capabilities_matrix()
            
            health_info["capability_matrix"] = {
                "available": True,
                "status": matrix.global_status.value,
                "summary": matrix._generate_summary(),
                "critical_services_down": len([
                    s for s in matrix.services.values() 
                    if s.required and not s.is_healthy
                ])
            }
            
            # Determine overall health based on capability matrix
            global_status = matrix.global_status.value
            if global_status == "DOWN":
                health_info["status"] = "unhealthy"
            elif global_status == "DEGRADED":
                health_info["status"] = "degraded"
            elif global_status == "DEMO":
                health_info["status"] = "demo_mode"
            
        except Exception as e:
            health_info["capability_matrix"]["error"] = str(e)
            health_info["status"] = "degraded"
    
    # Add response timing
    health_info["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
    
    # Determine HTTP status code
    if health_info["status"] in ["healthy", "demo_mode"]:
        status_code = http_status.HTTP_200_OK
    elif health_info["status"] == "degraded":
        status_code = http_status.HTTP_200_OK  # Still operational
    else:  # unhealthy
        status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content=health_info
    )


# Export router
__all__ = ["router"]