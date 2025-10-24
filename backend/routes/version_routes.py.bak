"""
Version API Routes

Provides version information endpoints for frontend-backend compatibility checking
and system version monitoring.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Header
from datetime import datetime

from backend.version_coherence import (
    get_version_info,
    check_version_compatibility,
    get_build_info,
    APP_VERSION,
    API_VERSION,
    CURRENT_VERSION
)
from backend.services.unified_logging import unified_logger, LogContext, LogComponent

router = APIRouter(prefix="/api/version", tags=["Version & Compatibility"])
logger = unified_logger


@router.get("/info")
async def get_application_version_info():
    """
    Get comprehensive application version information
    
    Returns detailed version data including app version, API version,
    build information, feature compatibility matrix, and metadata.
    """
    try:
        version_info = get_version_info()
        
        context = LogContext(
            component=LogComponent.API,
            operation="version_info_request",
            additional_data={
                "app_version": APP_VERSION,
                "api_version": API_VERSION,
                "client_requested": True
            }
        )
        
        logger.info(f"Version info requested: {APP_VERSION}", context)
        
        return {
            "success": True,
            "data": version_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="version_info_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error retrieving version info: {e}", context, exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve version information: {str(e)}"
        )


@router.get("/check")
async def check_compatibility(
    frontend_version: str = Query(..., description="Frontend version to check"),
    user_agent: Optional[str] = Header(None, alias="User-Agent")
):
    """
    Check version compatibility between frontend and backend
    
    Parameters:
    - frontend_version: The frontend application version to check compatibility for
    - user_agent: Client User-Agent header (automatically captured)
    
    Returns compatibility status, recommendations, and feature availability.
    """
    try:
        # Perform compatibility check
        compatibility_result = check_version_compatibility(
            frontend_version=frontend_version,
            backend_version=APP_VERSION
        )
        
        # Log compatibility check
        context = LogContext(
            component=LogComponent.API,
            operation="version_compatibility_check",
            additional_data={
                "frontend_version": frontend_version,
                "backend_version": APP_VERSION,
                "compatible": compatibility_result["compatible"],
                "user_agent": user_agent,
                "features_compatible": len(compatibility_result["features"]["compatible"]),
                "features_incompatible": len(compatibility_result["features"]["incompatible"])
            }
        )
        
        log_level = "info" if compatibility_result["compatible"] else "warning"
        log_message = f"Version compatibility check: {frontend_version} vs {APP_VERSION} - {'COMPATIBLE' if compatibility_result['compatible'] else 'INCOMPATIBLE'}"
        
        if log_level == "warning":
            logger.warning(log_message, context)
        else:
            logger.info(log_message, context)
        
        return {
            "success": True,
            "data": compatibility_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except ValueError as e:
        context = LogContext(
            component=LogComponent.API,
            operation="version_compatibility_error",
            additional_data={
                "frontend_version": frontend_version,
                "error_type": "invalid_version",
                "error": str(e)
            }
        )
        
        logger.error(f"Invalid version format in compatibility check: {e}", context)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid version format: {str(e)}"
        )
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="version_compatibility_error",
            additional_data={
                "frontend_version": frontend_version,
                "error": str(e)
            }
        )
        
        logger.error(f"Error checking version compatibility: {e}", context, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check version compatibility: {str(e)}"
        )


@router.get("/build")
async def get_build_information():
    """
    Get detailed build information
    
    Returns build-specific data including version, build date, build number,
    commit hash, and feature availability matrix.
    """
    try:
        build_info = get_build_info()
        
        context = LogContext(
            component=LogComponent.API,
            operation="build_info_request",
            additional_data={
                "version": build_info["version"],
                "build_number": build_info["build_number"],
                "features_count": len(build_info["features"])
            }
        )
        
        logger.info(f"Build info requested: {build_info['version']} (build {build_info['build_number']})", context)
        
        return {
            "success": True,
            "data": build_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="build_info_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error retrieving build info: {e}", context, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve build information: {str(e)}"
        )


@router.get("/health")
async def get_version_health():
    """
    Get version system health status
    
    Returns health information about the version management system,
    including version coherence status and compatibility monitoring.
    """
    try:
        # Basic health checks
        health_issues = []
        
        # Check if version info is accessible
        try:
            version_info = get_version_info()
            if not version_info.get("app", {}).get("version"):
                health_issues.append("App version not properly configured")
        except Exception as e:
            health_issues.append(f"Version info retrieval failed: {str(e)}")
        
        # Check version format validity
        try:
            test_compatibility = check_version_compatibility("7.13.2", APP_VERSION)
            if not test_compatibility.get("compatible"):
                health_issues.append("Version compatibility check system issue")
        except Exception as e:
            health_issues.append(f"Compatibility check system failed: {str(e)}")
        
        is_healthy = len(health_issues) == 0
        health_status = "healthy" if is_healthy else "degraded"
        
        health_data = {
            "status": health_status,
            "is_healthy": is_healthy,
            "issues": health_issues,
            "current_version": APP_VERSION,
            "api_version": API_VERSION,
            "version_info_accessible": "version_info" in locals(),
            "compatibility_system_functional": len(health_issues) < 2
        }
        
        context = LogContext(
            component=LogComponent.SYSTEM,
            operation="version_health_check",
            additional_data={
                "health_status": health_status,
                "issues_count": len(health_issues)
            }
        )
        
        logger.info(f"Version system health check: {health_status}", context)
        
        return {
            "success": True,
            "data": health_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="version_health_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error in version health check: {e}", context, exc_info=True)
        
        return {
            "success": False,
            "data": {
                "status": "unhealthy",
                "is_healthy": False,
                "issues": [f"Health check failed: {str(e)}"],
                "current_version": APP_VERSION,
                "api_version": API_VERSION
            },
            "timestamp": datetime.utcnow().isoformat()
        }


@router.post("/report")
async def report_version_usage(
    frontend_version: str = Query(..., description="Frontend version being used"),
    user_agent: Optional[str] = Header(None, alias="User-Agent"),
    features_used: Optional[list[str]] = Query(None, description="List of features being used"),
    client_metadata: Optional[Dict[str, Any]] = None
):
    """
    Report frontend version usage for analytics and monitoring
    
    Allows frontend clients to report their version and feature usage
    for compatibility monitoring and analytics purposes.
    
    Parameters:
    - frontend_version: The frontend application version in use
    - user_agent: Client User-Agent header (automatically captured)  
    - features_used: List of features currently being used by the client
    - client_metadata: Additional client information
    """
    try:
        # Validate version format
        compatibility_result = check_version_compatibility(
            frontend_version=frontend_version,
            backend_version=APP_VERSION
        )
        
        # Log version usage report
        context = LogContext(
            component=LogComponent.SYSTEM,
            operation="version_usage_report",
            additional_data={
                "frontend_version": frontend_version,
                "backend_version": APP_VERSION,
                "compatible": compatibility_result["compatible"],
                "user_agent": user_agent,
                "features_used": features_used or [],
                "features_count": len(features_used) if features_used else 0,
                "client_metadata": client_metadata or {}
            }
        )
        
        logger.info(
            f"Version usage report: Frontend {frontend_version} using {len(features_used) if features_used else 0} features",
            context
        )
        
        # Generate response with compatibility info and recommendations
        response_data = {
            "report_received": True,
            "frontend_version": frontend_version,
            "backend_version": APP_VERSION,
            "compatibility": compatibility_result,
            "usage_logged": True
        }
        
        return {
            "success": True,
            "data": response_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except ValueError as e:
        context = LogContext(
            component=LogComponent.API,
            operation="version_report_error",
            additional_data={
                "frontend_version": frontend_version,
                "error_type": "invalid_version",
                "error": str(e)
            }
        )
        
        logger.error(f"Invalid version in usage report: {e}", context)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid version format: {str(e)}"
        )
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="version_report_error",
            additional_data={
                "frontend_version": frontend_version,
                "error": str(e)
            }
        )
        
        logger.error(f"Error processing version usage report: {e}", context, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process version usage report: {str(e)}"
        )


@router.get("/features")
async def get_feature_compatibility():
    """
    Get feature compatibility matrix
    
    Returns information about which features are available in different versions
    and the minimum version requirements for each feature.
    """
    try:
        version_info = get_version_info()
        features_data = version_info["compatibility"]["features"]
        
        # Enhance with additional metadata
        enhanced_features = {}
        for feature, required_version in features_data.items():
            enhanced_features[feature] = {
                "required_version": required_version,
                "available_in_current": CURRENT_VERSION.is_compatible_with(required_version),
                "description": _get_feature_description(feature)
            }
        
        context = LogContext(
            component=LogComponent.API,
            operation="feature_compatibility_request",
            additional_data={
                "features_count": len(enhanced_features),
                "current_version": APP_VERSION
            }
        )
        
        logger.info(f"Feature compatibility matrix requested ({len(enhanced_features)} features)", context)
        
        return {
            "success": True,
            "data": {
                "current_version": APP_VERSION,
                "features": enhanced_features,
                "total_features": len(enhanced_features)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="feature_compatibility_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error retrieving feature compatibility: {e}", context, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve feature compatibility: {str(e)}"
        )


def _get_feature_description(feature: str) -> str:
    """Get human-readable description for features"""
    feature_descriptions = {
        "websocket_v2": "Enhanced WebSocket connections with room-based subscriptions",
        "realtime_enhancements": "Real-time data updates with SSE fallback and status monitoring",
        "unified_logging": "Comprehensive structured logging with performance tracking",
        "comprehensive_props": "Universal prop generation with Baseball Savant integration",
        "modern_ml": "Advanced ML models with transformer architectures and uncertainty quantification"
    }
    
    return feature_descriptions.get(feature, f"Feature: {feature}")


# Health check endpoint specifically for version system
@router.head("/health")
async def version_health_check():
    """
    HEAD endpoint for version system health check
    Used by monitoring systems for quick health verification.
    """
    try:
        # Quick health check - just verify version info is accessible
        get_version_info()
        return {"status": "healthy"}
    except Exception:
        raise HTTPException(status_code=503, detail="Version system unhealthy")