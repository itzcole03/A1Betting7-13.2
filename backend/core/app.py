"""
A1Betting Core App Factory - Single Source of Truth
Contains canonical FastAPI app creation, centralized exception handling, and standardized response patterns.
This is the ONLY entry point for creating the A1Betting application.
"""

import logging
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

    # Create the FastAPI app
    _app = FastAPI(
        title="A1Betting API",
        version="1.0.0",
        description="A1Betting Sports Analysis Platform - Canonical Entry Point"
    )

    # --- CORS Middleware ---
    origins = [
        "http://localhost:5173",
        "http://localhost:8000",
    ]
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Structured Logging Middleware ---
    try:
        from backend.middleware import StructuredLoggingMiddleware
        _app.add_middleware(StructuredLoggingMiddleware)
        logger.info("✅ Structured logging middleware added")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import structured logging middleware: {e}")

    # --- Prometheus Metrics Middleware ---
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

    # --- Centralized Exception Handling ---
    try:
        from backend.exceptions.handlers import register_exception_handlers
        register_exception_handlers(_app)
        logger.info("✅ Centralized exception handlers registered")
    except ImportError as e:
        logger.warning(f"⚠️ Could not import centralized exception handlers: {e}")

    # --- WebSocket Routes ---
    ws_router = APIRouter()

    @ws_router.websocket("/ws/{client_id}")
    async def websocket_endpoint(websocket: WebSocket, client_id: str):
        logger.info(f"[WS] Client {client_id} attempting connection...")
        await websocket.accept()
        logger.info(f"[WS] Client {client_id} connected.")
        try:
            while True:
                data = await websocket.receive_text()
                logger.info(f"[WS] Received from {client_id}: {data}")
                await websocket.send_text(f"Echo: {data}")
        except WebSocketDisconnect:
            logger.info(f"[WS] Client {client_id} disconnected.")
        except Exception as e:
            logger.error(f"[WS] Error for {client_id}: {e}")

    _app.include_router(ws_router)

    # --- Core API Routes ---
    @_app.get("/api/health")
    async def api_health():
        logger.info("[API] /api/health called")
        return ok({
            "status": "healthy",
            "uptime_seconds": int(time.time()),
            "error_streak": 0,
            "last_error": None,
            "last_success": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "healing_attempts": 0,
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
        logger.info("[API] /api/props called")
        return ok([
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
        ])

    @_app.post("/api/v2/sports/activate")
    async def api_activate(request: Request):
        body = await request.json()
        sport = body.get("sport", "Unknown")
        logger.info(f"[API] /api/v2/sports/activate called for sport: {sport}")
        return ok({
            "sport": sport,
            "activated": True,
            "version_used": "v2"
        })

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

    # DB and config setup can be added here as modules are refactored in
    logger.info("✅ A1Betting canonical app created successfully")
    return _app


# Create the canonical app instance - this is THE app
app = create_app()

# Legacy compatibility
core_app = app
