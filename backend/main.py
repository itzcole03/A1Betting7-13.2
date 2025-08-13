# Legacy test compatibility: stub for get_sport_radar_games
def get_sport_radar_games(*args, **kwargs):
    return []


"""
Enhanced A1Betting Backend Main Entry Point
Incorporates Phase 1 optimizations with 2024-2025 FastAPI best practices
"""


import logging
from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
try:
    from dotenv import load_dotenv

    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"Loaded .env from: {env_path}")
except ImportError:
    print("⚠️ python-dotenv not available, using system environment variables")

from fastapi.responses import JSONResponse

# Initialize structured logging for startup
try:
    from backend.utils.structured_logging import app_logger

    logger = app_logger
    logger.info("🚀 Starting A1Betting Enhanced Backend...")
except ImportError:
    # Fallback to basic logging if structured logging not available
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting A1Betting Backend (basic logging)...")


# Try optimized production integration first, then fallback options
try:
    from backend.optimized_production_integration import create_optimized_app

    app = create_optimized_app()
    logger.info("✅ Optimized production integration loaded successfully (Phase 4)")
except ImportError as e:
    logger.warning(
        "⚠️ Optimized integration not available (%s), falling back to enhanced", str(e)
    )
    try:
        from backend.enhanced_production_integration import create_enhanced_app

        app = create_enhanced_app()
        logger.info("✅ Enhanced production integration loaded")
    except ImportError as e2:
        logger.warning(
            "⚠️ Enhanced integration not available (%s), falling back to original",
            str(e2),
        )
        try:
            from backend.production_integration import create_production_app

            app = create_production_app()
            logger.info("✅ Original production integration loaded")
        except ImportError as e3:
            logger.error(
                "❌ All integrations failed: optimized=%s, enhanced=%s, original=%s",
                str(e),
                str(e2),
                str(e3),
            )
            raise RuntimeError("No production integration available") from e3


# --- CORS Middleware ---
origins = [
    "http://localhost:5173",
    "http://localhost:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time

# --- Centralized Exception Mapping ---
try:
    from backend.exceptions.handlers import register_exception_handlers

    register_exception_handlers(app)
    logger.info("✅ Centralized exception handlers registered (exceptions/handlers.py)")
except ImportError as e:
    logger.warning(f"⚠️ Could not import centralized exception handlers: {e}")


# --- Unified Response Envelope Helpers ---
def ok(data=None):
    return {"success": True, "data": data, "error": None}


def fail(error_code="ERROR", message="An error occurred", data=None):
    return {
        "success": False,
        "data": data,
        "error": {"code": error_code, "message": message},
    }


# --- WebSocket Upgrade Headers & Logging ---
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

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


app.include_router(ws_router)

# --- API Routes (Mock/Test Data) ---
from fastapi import Request


@app.get("/api/health")
async def api_health():
    logger.info("[API] /api/health called")
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "uptime_seconds": int(time.time()),
            "error_streak": 0,
            "last_error": None,
            "last_success": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "healing_attempts": 0,
        },
        "error": None,
    }


@app.get("/api/props")
async def api_props():
    logger.info("[API] /api/props called")
    return {
        "success": True,
        "data": [
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
        ],
        "error": None,
    }


@app.post("/api/v2/sports/activate")
async def api_activate(request: Request):
    body = await request.json()
    sport = body.get("sport", "Unknown")
    logger.info(f"[API] /api/v2/sports/activate called for sport: {sport}")
    return {
        "success": True,
        "data": {"sport": sport, "activated": True, "version_used": "v2"},
        "error": None,
    }


@app.get("/api/predictions")
async def api_predictions():
    logger.info("[API] /api/predictions called")
    return {
        "success": True,
        "data": [
            {
                "id": "nba_luka_points_over",
                "player": "Luka Dončić",
                "stat": "Points",
                "line": 28.5,
                "prediction": 30,
                "confidence": 89.3,
            }
        ],
        "error": None,
    }


@app.get("/api/analytics")
async def api_analytics():
    logger.info("[API] /api/analytics called")
    return {
        "success": True,
        "data": {
            "summary": "Analytics mock data",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
        "error": None,
    }


# --- Utility function for error responses (backward compatibility) ---
def error_response(message="Test error response", status_code=400, details=None):
    """Create standardized error response"""
    body = {"error": message}
    if details:
        body["details"] = details
    return JSONResponse(content=body, status_code=status_code)


from datetime import datetime

# --- Global Exception Handlers ---
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


logger.info("f389 A1Betting Backend startup complete!")

# Export the app for uvicorn
__all__ = ["app"]
