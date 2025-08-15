"""
Legacy Middleware

Intercepts requests to legacy (non-/api/v2/*) endpoints to provide usage tracking
and optional deprecation enforcement. Implements feature flag controls for
gradual migration and sunset planning.

Middleware is applied early in the request lifecycle to capture all legacy
endpoint access before routing to handlers.
"""

import time
import logging
from typing import Callable, Dict, Any
from datetime import datetime, timezone

from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from backend.services.legacy_registry import get_legacy_registry, is_legacy_enabled

logger = logging.getLogger(__name__)


class LegacyMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track and optionally disable legacy endpoint usage.
    
    Features:
    - Usage tracking for all legacy endpoints
    - Feature flag control (A1_LEGACY_ENABLED)
    - Automatic 410 Gone responses when disabled
    - Request annotation for downstream logging
    """
    
    def __init__(self, app, **kwargs):
        super().__init__(app)
        self.registry = get_legacy_registry()
        
        # Pre-register known legacy endpoints with forwarding information
        self._register_known_legacy_endpoints()
        
        logger.info("Legacy middleware initialized")

    def _register_known_legacy_endpoints(self):
        """Register known legacy endpoints with their modern equivalents"""
        # Health endpoints
        self.registry.register_legacy("/api/health", "/api/v2/diagnostics/health")
        self.registry.register_legacy("/health", "/api/v2/diagnostics/health")
        
        # Metrics and monitoring
        self.registry.register_legacy("/api/metrics/summary", "/api/v2/meta/cache-stats")
        self.registry.register_legacy("/metrics", "/api/v2/meta/cache-stats")
        self.registry.register_legacy("/performance/stats", "/api/v2/diagnostics/system")
        
        # Legacy API endpoints  
        self.registry.register_legacy("/api/props", "/api/v2/ml/predictions")
        self.registry.register_legacy("/api/predictions", "/api/v2/ml/predictions")
        self.registry.register_legacy("/api/analytics", "/api/v2/ml/analytics")
        
        # Enhanced ML routes (prefix-based)
        self.registry.register_legacy("/api/enhanced-ml", "/api/v2/ml")
        
        # Development endpoints
        self.registry.register_legacy("/dev/mode", "/api/v2/diagnostics/system")
        
        logger.info("Registered known legacy endpoints with forwarding paths")

    def _is_legacy_endpoint(self, path: str) -> bool:
        """
        Determine if a path is a legacy endpoint.
        
        Logic:
        - /api/v2/* are NOT legacy (current standard)
        - All other /api/* paths are legacy
        - Specific non-API paths like /health, /metrics are legacy
        - WebSocket endpoints are NOT legacy
        """
        # Skip WebSocket upgrades
        if path.startswith("/ws"):
            return False
            
        # V2 API endpoints are current standard
        if path.startswith("/api/v2/"):
            return False
        
        # All other /api/* paths are legacy
        if path.startswith("/api/"):
            return True
        
        # Specific legacy non-API endpoints
        legacy_paths = {
            "/health", "/metrics", "/performance/stats", "/dev/mode",
            "/healthz", "/ready", "/cache/health", "/cache/stats"
        }
        
        if path in legacy_paths:
            return True
            
        # Check for legacy path prefixes (like enhanced-ml)
        legacy_prefixes = [
            "/api/enhanced-ml", "/api/propollama", "/api/prizepicks",
            "/api/betting-opportunities", "/api/arbitrage-opportunities",
            "/debug/", "/v1/", "/cache/"
        ]
        
        for prefix in legacy_prefixes:
            if path.startswith(prefix):
                return True
        
        return False

    def _create_410_response(self, path: str) -> JSONResponse:
        """Create a 410 Gone response for disabled legacy endpoints"""
        registry_data = self.registry._data.get(path)
        forward_path = registry_data.forward if registry_data else None
        sunset_date = self.registry.get_sunset_date()
        
        response_data = {
            "error": "deprecated",
            "message": f"Legacy endpoint {path} has been deprecated and disabled",
            "forward": forward_path,
            "sunset": sunset_date,
            "docs": "/docs/migration/legacy_deprecation_plan.md",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        logger.warning(f"Blocked disabled legacy endpoint: {path} -> {forward_path}")
        
        return JSONResponse(
            status_code=410,
            content=response_data,
            headers={
                "X-Legacy-Endpoint": "true",
                "X-Deprecated": "true",
                "X-Forward-To": forward_path or "unknown"
            }
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request through legacy middleware.
        
        Flow:
        1. Check if endpoint is legacy
        2. If legacy and disabled -> return 410 Gone
        3. If legacy and enabled -> increment counter and annotate request
        4. Continue to next middleware/handler
        """
        path = request.url.path
        method = request.method
        
        # Skip non-HTTP methods or internal paths
        if method == "OPTIONS" or path.startswith("/_"):
            return await call_next(request)
        
        # Check if this is a legacy endpoint
        if self._is_legacy_endpoint(path):
            # Check if legacy endpoints are disabled
            if not self.registry.is_enabled():
                return self._create_410_response(path)
            
            # Track usage for enabled legacy endpoints
            self.registry.increment_usage(path)
            
            # Annotate request for downstream logging
            request.state.legacy = True
            request.state.legacy_path = path
            
            # Get forwarding path safely
            endpoint_data = self.registry._data.get(path)
            request.state.legacy_forward = endpoint_data.forward if endpoint_data else None
            
            # Log usage with safe count access
            count = endpoint_data.count if endpoint_data else 0
            logger.info(f"Legacy endpoint accessed: {method} {path} (count: {count})")
        else:
            # Mark as non-legacy for logging consistency
            request.state.legacy = False
        
        # Continue to next middleware/handler
        response = await call_next(request)
        
        # Add legacy headers to response if applicable
        if getattr(request.state, 'legacy', False):
            response.headers["X-Legacy-Endpoint"] = "true"
            if hasattr(request.state, 'legacy_forward') and request.state.legacy_forward:
                response.headers["X-Forward-To"] = request.state.legacy_forward
                response.headers["X-Deprecated-Warning"] = f"Use {request.state.legacy_forward} instead"
        
        return response


def create_legacy_middleware() -> type:
    """
    Factory function to create legacy middleware class.
    
    Returns configured middleware class for FastAPI app.add_middleware()
    """
    return LegacyMiddleware


# Middleware factory for app integration
def get_legacy_middleware_factory():
    """Get legacy middleware factory for app setup"""
    return create_legacy_middleware()