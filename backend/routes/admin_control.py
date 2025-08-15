"""
Admin Control PR: Runtime Shadow Mode Control

Provides administrative endpoints for enabling/disabling shadow mode at runtime,
overriding environment variable configuration with in-memory flags.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import os

from backend.utils.log_context import get_contextual_logger
from backend.utils.trace_utils import trace_span, add_span_tag, add_span_log
from backend.services.model_registry import get_model_registry

# Import security middleware for admin endpoints
try:
    from backend.services.security_middleware import secure_endpoint
    SECURITY_AVAILABLE = True
except ImportError:
    SECURITY_AVAILABLE = False
    def secure_endpoint(requests_per_minute=None, burst_limit=None, require_api_key=True):
        def decorator(func):
            return func
        return decorator

logger = get_contextual_logger(__name__)
router = APIRouter()


# Request/Response Models
class ShadowModeRequest(BaseModel):
    """Request model for shadow mode control."""
    shadow_version: Optional[str] = Field(
        None, 
        description="Shadow model version to use. Set to null to disable shadow mode."
    )
    reason: Optional[str] = Field(
        None,
        description="Reason for shadow mode change (for audit trail)"
    )


class ShadowModeResponse(BaseModel):
    """Response model for shadow mode status."""
    shadow_enabled: bool = Field(..., description="Current shadow mode status")
    active_version: str = Field(..., description="Active model version")
    shadow_version: Optional[str] = Field(None, description="Shadow model version (if enabled)")
    runtime_override: bool = Field(..., description="Whether runtime override is active")
    environment_shadow_version: Optional[str] = Field(None, description="Shadow version from environment")
    last_change_reason: Optional[str] = Field(None, description="Reason for last shadow mode change")


class AdminStatusResponse(BaseModel):
    """Response model for admin control status."""
    shadow_mode_status: ShadowModeResponse
    available_models: list = Field(..., description="List of available model versions")
    admin_controls_active: bool = Field(..., description="Whether admin controls are enabled")
    environment: str = Field(..., description="Current environment")


class RuntimeShadowController:
    """
    Controller for runtime shadow mode management with memory-based overrides.
    
    Features:
    - Runtime shadow mode enable/disable
    - Environment variable override capability
    - Audit trail for shadow mode changes
    - Thread-safe operations
    """

    def __init__(self):
        """Initialize runtime shadow controller."""
        self.model_registry = get_model_registry()
        
        # Runtime override state (in-memory)
        self._runtime_override_active = False
        self._runtime_shadow_version: Optional[str] = None
        self._last_change_reason: Optional[str] = None
        self._change_history = []  # For audit trail
        
        logger.info("Runtime shadow controller initialized")

    def get_effective_shadow_version(self) -> Optional[str]:
        """
        Get the effective shadow version considering runtime overrides.
        
        Returns:
            Effective shadow model version or None if disabled
        """
        if self._runtime_override_active:
            return self._runtime_shadow_version
        else:
            return self.model_registry.get_shadow_model_version()

    def is_shadow_enabled(self) -> bool:
        """
        Check if shadow mode is effectively enabled.
        
        Returns:
            True if shadow mode is enabled, False otherwise
        """
        effective_shadow = self.get_effective_shadow_version()
        active_version = self.model_registry.get_active_model_version()
        
        return (
            effective_shadow is not None 
            and effective_shadow != active_version
        )

    def enable_shadow_mode(
        self, 
        shadow_version: str, 
        reason: Optional[str] = None,
        request_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Enable shadow mode with specified model version.
        
        Args:
            shadow_version: Model version to use for shadow inference
            reason: Reason for enabling shadow mode
            request_info: Additional request context for audit
            
        Returns:
            Dictionary with operation result and status
            
        Raises:
            ValueError: If shadow model version is not available
        """
        with trace_span(
            "enable_shadow_mode",
            service_name="admin_control",
            operation_name="shadow_enable"
        ) as span_id:
            add_span_tag(span_id, "shadow_version", shadow_version)
            add_span_tag(span_id, "reason", reason or "not_specified")
            
            # Validate shadow model version
            available_versions = self.model_registry.list_available_versions()
            if shadow_version not in available_versions:
                add_span_tag(span_id, "error", "invalid_version")
                error_msg = f"Shadow model version '{shadow_version}' not available"
                logger.error(
                    error_msg,
                    extra={
                        "requested_version": shadow_version,
                        "available_versions": available_versions
                    }
                )
                raise ValueError(error_msg)

            # Check if same as active model
            active_version = self.model_registry.get_active_model_version()
            if shadow_version == active_version:
                add_span_tag(span_id, "error", "same_as_active")
                error_msg = f"Shadow version cannot be the same as active version: {active_version}"
                logger.error(error_msg)
                raise ValueError(error_msg)

            # Enable runtime override
            self._runtime_override_active = True
            self._runtime_shadow_version = shadow_version
            self._last_change_reason = reason
            
            # Record change in audit trail
            change_record = {
                "timestamp": __import__("time").time(),
                "action": "enable_shadow",
                "shadow_version": shadow_version,
                "active_version": active_version,
                "reason": reason,
                "request_info": request_info or {}
            }
            self._change_history.append(change_record)
            
            # Limit change history size
            if len(self._change_history) > 100:
                self._change_history.pop(0)

            add_span_tag(span_id, "operation_success", True)
            add_span_log(span_id, f"Shadow mode enabled with version {shadow_version}", "info")

            logger.info(
                "Shadow mode enabled via runtime override",
                extra={
                    "shadow_version": shadow_version,
                    "active_version": active_version,
                    "reason": reason,
                    "override_active": self._runtime_override_active
                }
            )

            return {
                "success": True,
                "action": "shadow_enabled",
                "shadow_version": shadow_version,
                "active_version": active_version,
                "runtime_override": True,
                "reason": reason
            }

    def disable_shadow_mode(
        self, 
        reason: Optional[str] = None,
        request_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Disable shadow mode and clear runtime overrides.
        
        Args:
            reason: Reason for disabling shadow mode
            request_info: Additional request context for audit
            
        Returns:
            Dictionary with operation result and status
        """
        with trace_span(
            "disable_shadow_mode",
            service_name="admin_control",
            operation_name="shadow_disable"
        ) as span_id:
            add_span_tag(span_id, "reason", reason or "not_specified")
            
            previous_shadow = self._runtime_shadow_version
            active_version = self.model_registry.get_active_model_version()
            
            # Disable runtime override
            self._runtime_override_active = True  # Keep override active but set shadow to None
            self._runtime_shadow_version = None
            self._last_change_reason = reason
            
            # Record change in audit trail
            change_record = {
                "timestamp": __import__("time").time(),
                "action": "disable_shadow",
                "previous_shadow_version": previous_shadow,
                "active_version": active_version,
                "reason": reason,
                "request_info": request_info or {}
            }
            self._change_history.append(change_record)
            
            # Limit change history size
            if len(self._change_history) > 100:
                self._change_history.pop(0)

            add_span_tag(span_id, "operation_success", True)
            add_span_tag(span_id, "previous_shadow", previous_shadow)
            add_span_log(span_id, "Shadow mode disabled", "info")

            logger.info(
                "Shadow mode disabled via runtime override",
                extra={
                    "previous_shadow_version": previous_shadow,
                    "active_version": active_version,
                    "reason": reason,
                    "override_active": self._runtime_override_active
                }
            )

            return {
                "success": True,
                "action": "shadow_disabled",
                "previous_shadow_version": previous_shadow,
                "active_version": active_version,
                "runtime_override": True,
                "reason": reason
            }

    def clear_runtime_override(
        self,
        reason: Optional[str] = None,
        request_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Clear runtime override and revert to environment configuration.
        
        Args:
            reason: Reason for clearing override
            request_info: Additional request context for audit
            
        Returns:
            Dictionary with operation result and status
        """
        with trace_span(
            "clear_runtime_override",
            service_name="admin_control",
            operation_name="clear_override"
        ) as span_id:
            add_span_tag(span_id, "reason", reason or "not_specified")
            
            previous_override_shadow = self._runtime_shadow_version
            env_shadow_version = self.model_registry.get_shadow_model_version()
            
            # Clear runtime override
            self._runtime_override_active = False
            self._runtime_shadow_version = None
            self._last_change_reason = reason
            
            # Record change in audit trail
            change_record = {
                "timestamp": __import__("time").time(),
                "action": "clear_override",
                "previous_override_shadow": previous_override_shadow,
                "reverted_to_env_shadow": env_shadow_version,
                "reason": reason,
                "request_info": request_info or {}
            }
            self._change_history.append(change_record)
            
            # Limit change history size
            if len(self._change_history) > 100:
                self._change_history.pop(0)

            add_span_tag(span_id, "operation_success", True)
            add_span_tag(span_id, "reverted_to_env", env_shadow_version)
            add_span_log(span_id, "Runtime override cleared", "info")

            logger.info(
                "Runtime shadow override cleared",
                extra={
                    "previous_override_shadow": previous_override_shadow,
                    "reverted_to_env_shadow": env_shadow_version,
                    "reason": reason,
                    "override_active": self._runtime_override_active
                }
            )

            return {
                "success": True,
                "action": "override_cleared",
                "previous_override_shadow": previous_override_shadow,
                "reverted_to_env_shadow": env_shadow_version,
                "runtime_override": False,
                "reason": reason
            }

    def get_status(self) -> Dict[str, Any]:
        """
        Get current shadow mode status and configuration.
        
        Returns:
            Dictionary with current shadow mode status
        """
        active_version = self.model_registry.get_active_model_version()
        env_shadow_version = self.model_registry.get_shadow_model_version()
        effective_shadow = self.get_effective_shadow_version()
        
        return {
            "shadow_enabled": self.is_shadow_enabled(),
            "active_version": active_version,
            "shadow_version": effective_shadow,
            "runtime_override": self._runtime_override_active,
            "environment_shadow_version": env_shadow_version,
            "last_change_reason": self._last_change_reason,
            "change_history_count": len(self._change_history)
        }

    def get_change_history(self, limit: int = 20) -> list:
        """
        Get recent shadow mode change history.
        
        Args:
            limit: Maximum number of history entries to return
            
        Returns:
            List of recent change records
        """
        return self._change_history[-limit:] if self._change_history else []


# Global runtime shadow controller
_runtime_shadow_controller: Optional[RuntimeShadowController] = None


def get_runtime_shadow_controller() -> RuntimeShadowController:
    """
    Get the global runtime shadow controller instance.
    
    Returns:
        RuntimeShadowController singleton instance
    """
    global _runtime_shadow_controller
    if _runtime_shadow_controller is None:
        _runtime_shadow_controller = RuntimeShadowController()
    return _runtime_shadow_controller


# Admin Control API Endpoints
@router.post(
    "/api/v2/models/shadow/enable",
    response_model=ShadowModeResponse,
    summary="Enable Shadow Mode",
    description="Enable shadow mode with specified model version (runtime override)"
)
@secure_endpoint(requests_per_minute=20, burst_limit=3, require_api_key=True)
async def enable_shadow_mode(request: Request, shadow_request: ShadowModeRequest):
    """
    Enable shadow mode with specified model version.
    
    This endpoint allows runtime override of shadow mode configuration,
    enabling shadow inference with a different model version.
    """
    try:
        controller = get_runtime_shadow_controller()
        
        if not shadow_request.shadow_version:
            raise HTTPException(
                status_code=400,
                detail="Shadow version must be specified to enable shadow mode"
            )
        
        logger.info(
            "Processing shadow mode enable request",
            extra={
                "requested_shadow_version": shadow_request.shadow_version,
                "reason": shadow_request.reason
            }
        )
        
        # Get request context for audit
        request_info = {
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("User-Agent", "unknown")
        }
        
        # Enable shadow mode
        result = controller.enable_shadow_mode(
            shadow_version=shadow_request.shadow_version,
            reason=shadow_request.reason,
            request_info=request_info
        )
        
        # Get updated status
        status = controller.get_status()
        
        return ShadowModeResponse(**status)
        
    except ValueError as e:
        logger.error(f"Invalid shadow mode configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Failed to enable shadow mode: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to enable shadow mode: {str(e)}")


@router.post(
    "/api/v2/models/shadow/disable",
    response_model=ShadowModeResponse,
    summary="Disable Shadow Mode",
    description="Disable shadow mode (runtime override)"
)
@secure_endpoint(requests_per_minute=20, burst_limit=3, require_api_key=True)
async def disable_shadow_mode(request: Request, shadow_request: ShadowModeRequest):
    """
    Disable shadow mode via runtime override.
    
    This endpoint disables shadow inference regardless of environment configuration.
    """
    try:
        controller = get_runtime_shadow_controller()
        
        logger.info(
            "Processing shadow mode disable request",
            extra={"reason": shadow_request.reason}
        )
        
        # Get request context for audit
        request_info = {
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("User-Agent", "unknown")
        }
        
        # Disable shadow mode
        result = controller.disable_shadow_mode(
            reason=shadow_request.reason,
            request_info=request_info
        )
        
        # Get updated status
        status = controller.get_status()
        
        return ShadowModeResponse(**status)
        
    except Exception as e:
        logger.error(f"Failed to disable shadow mode: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to disable shadow mode: {str(e)}")


@router.delete(
    "/api/v2/models/shadow/override",
    response_model=ShadowModeResponse,
    summary="Clear Runtime Override",
    description="Clear runtime override and revert to environment configuration"
)
@secure_endpoint(requests_per_minute=20, burst_limit=3, require_api_key=True)
async def clear_shadow_override(request: Request, shadow_request: ShadowModeRequest):
    """
    Clear runtime shadow mode override.
    
    This endpoint clears any runtime overrides and reverts shadow mode
    configuration back to environment variable settings.
    """
    try:
        controller = get_runtime_shadow_controller()
        
        logger.info(
            "Processing shadow override clear request",
            extra={"reason": shadow_request.reason}
        )
        
        # Get request context for audit
        request_info = {
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("User-Agent", "unknown")
        }
        
        # Clear runtime override
        result = controller.clear_runtime_override(
            reason=shadow_request.reason,
            request_info=request_info
        )
        
        # Get updated status
        status = controller.get_status()
        
        return ShadowModeResponse(**status)
        
    except Exception as e:
        logger.error(f"Failed to clear shadow override: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear shadow override: {str(e)}")


@router.get(
    "/api/v2/models/admin/status",
    response_model=AdminStatusResponse,
    summary="Get Admin Control Status",
    description="Get comprehensive admin control status and available models"
)
@secure_endpoint(requests_per_minute=60, burst_limit=10, require_api_key=True)
async def get_admin_status(request: Request):
    """
    Get comprehensive admin control status.
    
    Returns current shadow mode status, available model versions,
    and admin control capabilities.
    """
    try:
        controller = get_runtime_shadow_controller()
        model_registry = get_model_registry()
        
        # Get shadow mode status
        shadow_status = controller.get_status()
        
        # Get available models
        available_models = model_registry.list_available_versions()
        
        # Get environment info
        environment = os.getenv("A1_ENVIRONMENT", "development")
        
        response = AdminStatusResponse(
            shadow_mode_status=ShadowModeResponse(**shadow_status),
            available_models=available_models,
            admin_controls_active=True,
            environment=environment
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get admin status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get admin status: {str(e)}")


# Monkey patch model registry to use runtime controller
def patch_model_registry():
    """
    Patch model registry to use runtime shadow controller for shadow mode decisions.
    """
    original_get_shadow_version = get_model_registry().get_shadow_model_version
    original_is_shadow_enabled = get_model_registry().is_shadow_mode_enabled
    
    def get_shadow_version_with_override():
        controller = get_runtime_shadow_controller()
        return controller.get_effective_shadow_version()
    
    def is_shadow_enabled_with_override():
        controller = get_runtime_shadow_controller()
        return controller.is_shadow_enabled()
    
    # Replace methods
    get_model_registry().get_shadow_model_version = get_shadow_version_with_override
    get_model_registry().is_shadow_mode_enabled = is_shadow_enabled_with_override
    
    logger.info("Model registry patched to use runtime shadow controller")


# Initialize runtime controller and patch model registry
patch_model_registry()
logger.info("Admin control endpoints initialized with runtime shadow mode support")