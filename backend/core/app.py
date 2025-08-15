"""
A1Betting Core App Factory - Single Source of Truth
Contains canonical FastAPI app creation, centralized exception handling, and standardized response patterns.
This is the ONLY entry point for creating the A1Betting application.
"""

import logging
import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

# Load environment variables from .env file
try:
    from dotenv import load_dotenv

    env_path = Path(__file__).parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"Loaded .env from: {env_path}")
except ImportError:
    print("⚠️ python-dotenv not available, using system environment variables")


# Structured logging setup
try:
    from backend.utils.structured_logging import app_logger

    logger = app_logger  # type: ignore
except ImportError:
    logging.basicConfig(
        level=logging.INFO, 
        format="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    logger = logging.getLogger(__name__)


# Standardized response helpers
def ok(data=None, message: Optional[str] = None):
    """Create a standardized success response"""
    response = {"success": True, "data": data, "error": None}
    if message:
        response["message"] = message
    return response


def fail(error_code="ERROR", message="An error occurred", data=None):
    """Create a standardized error response"""
    return {
        "success": False,
        "data": data,
        "error": {"code": error_code, "message": message},
    }


# App factory (can be extended for test/dev/prod)
def create_app() -> FastAPI:
    """
    Canonical app factory - THE ONLY way to create the A1Betting application.
    All production integrations are consolidated here.
    """
    logger.info("🚀 Creating A1Betting canonical app...")

    # Check lean mode early
    from backend.config.settings import get_settings
    settings = get_settings()
    is_lean_mode = settings.app.dev_lean_mode
    
    if is_lean_mode:
        logger.info("[LeanMode] Reduced middleware profile active")

    # Create the FastAPI app
    _app = FastAPI(
        title="A1Betting API",
        version="1.0.0",
        description="A1Betting Sports Analysis Platform - Canonical Entry Point"
    )

    # --- CORS Middleware (FIRST in middleware stack) ---
    # CORS config (dev only) for clean preflight handling
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ]
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- MIDDLEWARE STACK ORDERING (Architect-Specified) ---
    # CORS -> Logging -> Metrics -> PayloadGuard -> RateLimit -> SecurityHeaders -> Router
    
    # --- Structured Logging Middleware ---
    # Skip heavy debug middleware in lean mode
    if not is_lean_mode:
        try:
            from backend.middleware import StructuredLoggingMiddleware
            _app.add_middleware(StructuredLoggingMiddleware)
            logger.info("✅ Structured logging middleware added")
        except ImportError as e:
            logger.warning(f"⚠️ Could not import structured logging middleware: {e}")
    else:
        logger.info("[LeanMode] Skipping heavy structured logging middleware")
        
    # --- Prometheus Metrics Middleware ---
    # Skip metrics decoration in lean mode
    if not is_lean_mode:
        try:
            from backend.middleware import (
                PrometheusMetricsMiddleware, 
                set_metrics_middleware,
                PROMETHEUS_AVAILABLE
            )
            
            if PROMETHEUS_AVAILABLE:
                metrics_middleware = PrometheusMetricsMiddleware(_app)
                _app.add_middleware(PrometheusMetricsMiddleware)
                set_metrics_middleware(metrics_middleware)
                logger.info("✅ Prometheus metrics middleware added")
            else:
                logger.info("ℹ️ Prometheus client not available, metrics collection disabled")
        except ImportError as e:
            logger.warning(f"⚠️ Could not import metrics middleware: {e}")
    else:
        logger.info("[LeanMode] Skipping metrics middleware")

    # --- Payload Guard Middleware (Step 5) ---
    try:
        from backend.middleware.payload_guard import create_payload_guard_middleware
        from backend.middleware.prometheus_metrics_middleware import get_metrics_middleware
        
        metrics_client = None if is_lean_mode else get_metrics_middleware()
        
        payload_guard_factory = create_payload_guard_middleware(
            settings=settings.security,
            metrics_client=metrics_client
        )
        
        _app.add_middleware(payload_guard_factory)
        logger.info(f"✅ Payload guard middleware added: max_size={settings.security.max_json_payload_bytes} bytes, "
                   f"enforce_json={settings.security.enforce_json_content_type}, "
                   f"enabled={settings.security.payload_guard_enabled}")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import payload guard middleware: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to configure payload guard: {e}")

    # --- Rate Limiting Middleware ---
    try:
        import os
        from backend.middleware.rate_limit import create_rate_limit_middleware
        
        # Configuration from environment or defaults
        # In lean mode, set very high limits to effectively disable rate limiting
        if is_lean_mode:
            requests_per_minute = 10000  # Very high limit
            burst_capacity = 20000  # Very high burst
            enabled = False  # Completely disable in lean mode
            logger.info("[LeanMode] Rate limiting disabled")
        else:
            requests_per_minute = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "100"))
            burst_capacity = int(os.getenv("RATE_LIMIT_BURST_CAPACITY", "200"))
            enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
        
        rate_limit_middleware = create_rate_limit_middleware(
            requests_per_minute=requests_per_minute,
            burst_capacity=burst_capacity,
            enabled=enabled
        )
        
        _app.add_middleware(type(rate_limit_middleware), 
                          requests_per_minute=requests_per_minute,
                          burst_capacity=burst_capacity,
                          enabled=enabled)
        logger.info(f"✅ Rate limiting middleware added: {requests_per_minute}/min, burst={burst_capacity}, enabled={enabled}")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import rate limiting middleware: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to configure rate limiting: {e}")

    # --- Security Headers Middleware (Step 6) ---
    # Order: LAST in middleware stack to ensure headers applied to all responses (including errors)
    try:
        from backend.middleware.security_headers import create_security_headers_middleware
        from backend.config.settings import get_settings
        from backend.middleware.prometheus_metrics_middleware import get_metrics_middleware
        
        settings = get_settings()
        
        # Only add metrics client if security headers are enabled
        metrics_client = None
        if settings.security.security_headers_enabled:
            try:
                metrics_client = get_metrics_middleware()
            except Exception as e:
                logger.debug(f"Could not get metrics client for security headers: {e}")
        
        security_headers_factory = create_security_headers_middleware(
            settings=settings.security,
            metrics_client=metrics_client
        )
        
        _app.add_middleware(security_headers_factory)
        
        if settings.security.security_headers_enabled:
            headers_info = []
            if settings.security.enable_hsts:
                headers_info.append("HSTS")
            if settings.security.csp_enabled:
                mode = "report-only" if settings.security.csp_report_only else "enforce"
                headers_info.append(f"CSP({mode})")
            if settings.security.enable_coop:
                headers_info.append("COOP")
            if settings.security.enable_coep:
                headers_info.append("COEP")
            
            logger.info(f"✅ Security headers middleware added: [{', '.join(headers_info)}], "
                       f"x_frame_options={settings.security.x_frame_options}")
        else:
            logger.info("ℹ️ Security headers middleware added but disabled in configuration")
            
    except ImportError as e:
        logger.warning(f"⚠️ Could not import security headers middleware: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to configure security headers: {e}")

    # --- Centralized Exception Handling ---
    try:
        from backend.exceptions.handlers import register_exception_handlers
        register_exception_handlers(_app)
        logger.info("✅ Centralized exception handlers registered")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import centralized exception handlers: {e}")

    # --- WebSocket Routes ---
    ws_router = APIRouter()

    # Legacy WebSocket endpoint (maintain compatibility)
    @ws_router.websocket("/ws/{client_id}")
    async def websocket_endpoint(websocket: WebSocket, client_id: str):
        logger.info(f"[WS] Legacy client {client_id} attempting connection...")
        await websocket.accept()
        logger.info(f"[WS] Legacy client {client_id} connected.")
        try:
            while True:
                data = await websocket.receive_text()
                logger.info(f"[WS] Received from {client_id}: {data}")
                await websocket.send_text(f"Echo: {data}")
        except WebSocketDisconnect:
            logger.info(f"[WS] Legacy client {client_id} disconnected.")
        except Exception as e:
            logger.error(f"[WS] Legacy error for {client_id}: {e}")

    _app.include_router(ws_router)
    
    # --- Canonical WebSocket Client Route ---
    try:
        from backend.routes.ws_client import router as ws_client_router
        _app.include_router(ws_client_router)
        logger.info("✅ Canonical WebSocket client route included (/ws/client)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import canonical WebSocket client route: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register canonical WebSocket client route: {e}")

    # --- Core API Routes ---
    @_app.get("/api/health")
    @_app.head("/api/health")
    async def api_health():
        """
        System health check endpoint with normalized envelope format (LEGACY - DEPRECATED)
        
        This endpoint is deprecated. Use /api/v2/diagnostics/health for structured health information.
        
        Returns:
            Minimal envelope with deprecation notice: {"success": true, "data": {"status": "ok", "deprecated": true}, "error": null}
        """
        logger.info("[API] /api/health called (DEPRECATED)")
        
        return {
            "success": True,
            "data": {
                "status": "ok",
                "deprecated": True,
                "forward": "/api/v2/diagnostics/health",
                "message": "This endpoint is deprecated. Use /api/v2/diagnostics/health for structured health information."
            },
            "error": None,
            "meta": {"request_id": str(uuid.uuid4())}
        }

    # --- Health Endpoint Aliases (Stabilization Fix) ---
    @_app.get("/health")
    @_app.head("/health") 
    async def health_alias():
        """Normalized alias for /health -> /api/health with identical envelope"""
        return await api_health()

    @_app.get("/api/v2/health")
    @_app.head("/api/v2/health")
    async def api_v2_health_alias():
        """Normalized version alias for monitoring systems expecting /api/v2/health"""
        return await api_health()

    @_app.get("/dev/mode")
    @_app.head("/dev/mode")
    async def dev_mode_status():
        """Development mode status endpoint"""
        logger.info("[API] /dev/mode called")
        return ok({
            "lean": is_lean_mode,
            "mode": "lean" if is_lean_mode else "full",
            "features_disabled": [
                "heavy_logging",
                "metrics_middleware", 
                "rate_limiting",
                "high_frequency_background_tasks"
            ] if is_lean_mode else []
        })

    # --- Performance Stats Endpoint (Stabilization Fix) ---
    @_app.get("/performance/stats")
    @_app.head("/performance/stats")
    async def performance_stats():
        """Performance statistics endpoint for monitoring"""
        logger.info("[API] /performance/stats called")
        return ok({
            "memory_usage": 0,
            "cpu_usage": 0,
            "request_count": 0,
            "average_response_time": 0,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        })

    # --- Metrics Endpoints ---
    @_app.get("/metrics")
    async def get_metrics():
        """Prometheus metrics endpoint"""
        try:
            from backend.middleware import get_metrics_middleware, PROMETHEUS_AVAILABLE
            
            if not PROMETHEUS_AVAILABLE:
                return {"error": "Prometheus client not available"}
            
            metrics_middleware = get_metrics_middleware()
            if metrics_middleware:
                from fastapi import Response
                metrics_data = metrics_middleware.get_metrics()
                return Response(
                    content=metrics_data,
                    media_type="text/plain; version=0.0.4; charset=utf-8"
                )
            else:
                return {"error": "Metrics middleware not initialized"}
                
        except Exception as e:
            logger.error(f"Error generating metrics: {e}")
            return {"error": str(e)}

    @_app.get("/api/metrics/summary")
    async def api_metrics_summary():
        """Human-readable metrics summary"""
        try:
            from backend.middleware import get_metrics_middleware, PROMETHEUS_AVAILABLE
            
            if not PROMETHEUS_AVAILABLE:
                return ok({"message": "Prometheus client not available", "metrics_enabled": False})
            
            metrics_middleware = get_metrics_middleware()
            if metrics_middleware:
                return ok({
                    "metrics_enabled": True,
                    "active_websockets": len(metrics_middleware.active_websockets),
                    "prometheus_available": True,
                    "endpoint": "/metrics"
                })
            else:
                return ok({
                    "metrics_enabled": False, 
                    "message": "Metrics middleware not initialized"
                })
                
        except Exception as e:
            logger.error(f"Error getting metrics summary: {e}")
            return fail(message=str(e))

    @_app.get("/api/props")
    async def api_props():
        """
        Fetch sports prop data with external dependency handling
        
        Returns:
            List of prop betting data
            
        Raises:
            ApiError: For dependency failures or data unavailability
        """
        from backend.errors import ApiError, ErrorCode, dependency_error
        
        logger.info("[API] /api/props called")
        
        try:
            # Simulate external data fetching with potential failure
            # In real implementation, this would call external APIs
            # For demonstration, we simulate a dependency check
            
            # Simulate external service health check
            import random
            if random.random() < 0.1:  # 10% chance of simulated failure
                raise dependency_error(
                    "props_data_service",
                    "Props data service temporarily unavailable"
                )
            
            # Return mock data (in production, this would be real external data)
            props_data = [
                {
                    "id": "mock-aaron-judge-hr",
                    "player": "Aaron Judge",
                    "stat": "Home Runs",
                    "line": 1.5,
                    "confidence": 85,
                },
                {
                    "id": "mock-mike-trout-hits",
                    "player": "Mike Trout",
                    "stat": "Hits",
                    "line": 1.5,
                    "confidence": 78,
                },
            ]
            
            logger.info(f"[API] Successfully fetched {len(props_data)} props")
            return ok(props_data)
            
        except ApiError:
            # Re-raise structured API errors
            raise
        except Exception as e:
            # Convert unexpected errors to dependency errors
            logger.exception(f"Unexpected error fetching props: {e}")
            raise ApiError(
                ErrorCode.E2000_DEPENDENCY,
                "Failed to fetch prop data",
                details={"service": "props_api", "error": str(e)}
            )

    @_app.options("/api/v2/sports/activate")
    async def api_activate_preflight():
        """
        Handle CORS preflight for sports activation endpoint
        
        Returns:
            Empty response with proper CORS headers (handled by CORSMiddleware)
        """
        logger.debug("[API] OPTIONS /api/v2/sports/activate preflight handled")
        return Response(status_code=200)

    @_app.post("/api/v2/sports/activate")
    async def api_activate(request: Request):
        """
        Activate sport for analysis with input validation
        
        Args:
            request: FastAPI request containing sport activation data
            
        Returns:
            Sport activation confirmation
            
        Raises:
            ApiError: For validation errors or business logic failures
        """
        from backend.errors import ApiError, ErrorCode, validation_error
        
        logger.info("[API] /api/v2/sports/activate called")
        
        try:
            # Validate request has JSON body
            if request.headers.get("content-type") != "application/json":
                raise ApiError(
                    ErrorCode.E1400_UNSUPPORTED_MEDIA_TYPE,
                    "Content-Type must be application/json"
                )
            
            # Parse JSON body with error handling
            try:
                body = await request.json()
            except Exception as e:
                raise validation_error(
                    "Invalid JSON in request body",
                    field="body"
                )
            
            # Validate required fields
            if not isinstance(body, dict):
                raise validation_error("Request body must be a JSON object")
            
            sport = body.get("sport")
            if not sport:
                raise validation_error("Sport is required", field="sport")
            
            if not isinstance(sport, str):
                raise validation_error("Sport must be a string", field="sport")
            
            # Business logic validation
            valid_sports = ["MLB", "NBA", "NFL", "NHL"]
            if sport.upper() not in valid_sports:
                raise ApiError(
                    ErrorCode.E1000_VALIDATION,
                    f"Invalid sport '{sport}'. Must be one of: {', '.join(valid_sports)}",
                    details={"valid_sports": valid_sports, "provided_sport": sport}
                )
            
            # Simulate successful activation
            logger.info(f"[API] Sport {sport} activated successfully")
            return ok({
                "sport": sport.upper(),
                "activated": True,
                "version_used": "v2"
            })
            
        except ApiError:
            # Re-raise structured API errors
            raise
        except Exception as e:
            # Convert unexpected errors to structured errors
            logger.exception(f"Unexpected error in sport activation: {e}")
            raise ApiError(
                ErrorCode.E5000_INTERNAL,
                "Internal error during sport activation",
                details={"original_error": str(e)}
            )

    @_app.get("/api/predictions")
    async def api_predictions():
        logger.info("[API] /api/predictions called")
        return ok([
            {
                "id": "nba_luka_points_over",
                "player": "Luka Dončić",
                "stat": "Points",
                "line": 28.5,
                "prediction": 30,
                "confidence": 89.3,
            }
        ])

    @_app.get("/api/analytics")
    async def api_analytics():
        logger.info("[API] /api/analytics called")
        return ok({
            "summary": "Analytics mock data",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })

    # Import and mount versioned routers
    try:
        from backend.auth.routes import router as auth_router
        from backend.users.routes import router as users_router

        _app.include_router(auth_router)
        _app.include_router(users_router)
        logger.info("✅ Auth and users routes included")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import auth/users routes: {e}")
    
    # Import and mount diagnostics router (includes new structured health endpoint)
    try:
        from backend.routes.diagnostics import router as diagnostics_router
        _app.include_router(diagnostics_router, prefix="/api/v2/diagnostics", tags=["Diagnostics"])
        logger.info("✅ Diagnostics routes included (/api/v2/diagnostics/health, /api/v2/diagnostics/system)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import diagnostics routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register diagnostics routes: {e}")
    
    # Import and mount meta cache router (PR6: Cache Stats & Observability)
    try:
        from backend.routes.meta_cache import router as meta_cache_router
        _app.include_router(meta_cache_router, prefix="/api/v2/meta", tags=["Cache Observability"])
        logger.info("✅ Meta cache routes included (/api/v2/meta/cache-stats, /api/v2/meta/cache-health)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import meta cache routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register meta cache routes: {e}")
    
    # Import and mount security routes (Step 6: Security Headers)
    try:
        from backend.routes.csp_report import router as csp_report_router
        # Mount CSP routes with canonical /csp/report endpoint + alias for compatibility
        _app.include_router(csp_report_router)
        logger.info("✅ CSP report routes included (/csp/report + /api/security/csp-report alias)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import CSP report routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register CSP report routes: {e}")
    
    # Enhanced WebSocket Routes with Room-based Subscriptions
    try:
        from backend.routes.enhanced_websocket_routes import router as enhanced_ws_router
        _app.include_router(enhanced_ws_router)
        logger.info("✅ Enhanced WebSocket routes included (/ws/v2/* endpoints)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import enhanced WebSocket routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register enhanced WebSocket routes: {e}")
    
    # Enhanced ML Routes with SHAP Explainability, Batch Optimization, Performance Logging
    try:
        from backend.routes.enhanced_ml_routes import router as enhanced_ml_router
        _app.include_router(enhanced_ml_router)
        logger.info("✅ Enhanced ML routes included (/api/enhanced-ml/* endpoints)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import enhanced ML routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register enhanced ML routes: {e}")

    # --- PHASE 5 CONSOLIDATED ROUTES ---
    # Consolidated PrizePicks API (replaces 3 legacy route files)
    try:
        from backend.routes.consolidated_prizepicks import router as consolidated_prizepicks_router
        _app.include_router(consolidated_prizepicks_router, prefix="/api/v2/prizepicks", tags=["PrizePicks API"])
        logger.info("✅ Consolidated PrizePicks routes included (/api/v2/prizepicks/* endpoints)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import consolidated PrizePicks routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register consolidated PrizePicks routes: {e}")

    # Consolidated ML API (replaces enhanced_ml_routes.py and modern_ml_routes.py)
    try:
        from backend.routes.consolidated_ml import router as consolidated_ml_router
        _app.include_router(consolidated_ml_router, prefix="/api/v2/ml", tags=["Machine Learning"])
        logger.info("✅ Consolidated ML routes included (/api/v2/ml/* endpoints)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import consolidated ML routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register consolidated ML routes: {e}")

    # Consolidated Admin API (replaces admin.py, health.py, security_routes.py, auth.py)
    try:
        from backend.routes.consolidated_admin import router as consolidated_admin_router
        _app.include_router(consolidated_admin_router, prefix="/api/v2/admin", tags=["Admin & Security"])
        logger.info("✅ Consolidated Admin routes included (/api/v2/admin/* endpoints)")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import consolidated Admin routes: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to register consolidated Admin routes: {e}")

    # DB and config setup can be added here as modules are refactored in
    
    # Log normalized health endpoints at startup
    logger.info("🏥 Health endpoints normalized: /api/health, /health, /api/v2/health -> identical envelope format")
    logger.info("✅ A1Betting canonical app created successfully")
    return _app


# Create the canonical app instance - this is THE app
app = create_app()

# Legacy compatibility
core_app = app
# Reload trigger
