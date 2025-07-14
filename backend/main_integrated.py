"""A1Betting Main Application
Complete FastAPI application with full frontend integration.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    logger.info(
        "🚀 Starting A1Betting Backend Server..."
    )  # Initialize scheduler and background jobs
    try:
        # Temporarily disabled due to sports expert api issues
        # from sports_expert_api import intelligent_scheduler
        # intelligent_scheduler.start()
        # logger.info("✅ Background job scheduler started")
        logger.info("⚠️ Background job scheduler temporarily disabled")
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("❌ Failed to start scheduler: {e}")

    # Initialize betting service
    try:

        logger.info("✅ Betting opportunity service initialized")
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("❌ Failed to initialize betting service: {e}")

    yield  # Cleanup on shutdown
    logger.info("🛑 Shutting down A1Betting Backend Server...")
    try:
        # Temporarily disabled due to sports expert api issues
        # from sports_expert_api import intelligent_scheduler
        # intelligent_scheduler.shutdown()
        # logger.info("✅ Background job scheduler stopped")
        logger.info("⚠️ Background job scheduler cleanup skipped")
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("❌ Failed to stop scheduler: {e}")


# Create main FastAPI application
app = FastAPI(
    title="A1Betting Complete API",
    description=("Complete backend for A1Betting frontend with PrizePicks integration, ML predictions, and"
            "PropOllama AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for cloud frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all for development
        "https://7fb6bf6978914ca48f089e6151180b03-a1b171efc67d4aea943f921a9.fly.dev",  # Cloud frontend
        "${process.env.REACT_APP_API_URL || "http://localhost:8000"}",  # Vite dev server
        "${process.env.REACT_APP_API_URL || "http://localhost:8000"}",  # Alternative React dev server
        "${process.env.REACT_APP_API_URL || "http://localhost:8000"}",  # Another common dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://192.168.1.125:5173",  # Local network access
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Include all API routers
try:
    # Import and include the complete API integration
    from api_integration import api_router

    app.include_router(api_router)
    logger.info("✅ API integration routes loaded")
except ImportError as e:
    logger.error("❌ Failed to load API integration: {e}")

try:
    # Import and include existing sports expert routes
    # Temporarily disabled due to agent variable issue
    # from sports_expert_api import router as sports_expert_router
    # if sports_expert_router:
    #     app.include_router(sports_expert_router)
    #     logger.info("✅ Sports expert routes loaded")
    logger.info("⚠️ Sports expert routes temporarily disabled")
except ImportError as e:
    logger.error("❌ Failed to load sports expert routes: {e}")

try:
    # Import and include betting opportunity routes
    from betting_opportunity_service import router as betting_router

    if betting_router:
        app.include_router(betting_router)
        logger.info("✅ Betting opportunity routes loaded")
except ImportError as e:
    logger.error("❌ Failed to load betting routes: {e}")


# Health check endpoints
@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "service": "A1Betting Backend", "version": "1.0.0"}


@app.get("/api/health")
async def api_health_check():
    """API health check endpoint."""
    services = {}  # Check betting service
    try:
        from betting_opportunity_service import betting_opportunity_service

        services["betting_service"] = "healthy"
    except Exception:  # pylint: disable=broad-exception-caught
        services["betting_service"] = "unavailable"

    # Check sports expert agent
    try:
        from betting_opportunity_service import betting_opportunity_service

        agent = getattr(betting_opportunity_service, "sports_expert_agent", None)
        services["sports_expert_agent"] = "healthy" if agent else "unavailable"
    except Exception:  # pylint: disable=broad-exception-caught
        services["sports_expert_agent"] = "unavailable"

    # Check scheduler
    try:
        from sports_expert_api import intelligent_scheduler

        services["scheduler"] = "healthy" if intelligent_scheduler else "unavailable"
    except Exception:  # pylint: disable=broad-exception-caught
        services["scheduler"] = "unavailable"

    return {
        "status": "healthy",
        "services": services,
        "timestamp": "2024-01-20T10:00:00Z",
    }


# Static file serving for frontend (if needed)
# Uncomment if you want to serve the built frontend from the backend
# static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
# if os.path.exists(static_dir):
#     app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
#     logger.info("✅ Frontend static files mounted")


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors."""
    return {
        "status": "error",
        "code": "NOT_FOUND",
        "message": "The requested resource was not found",
        "path": str(request.url.path),
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors."""
    logger.error("Internal server error: {exc}")
    return {
        "status": "error",
        "code": "INTERNAL_ERROR",
        "message": "An internal server error occurred",
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "🎯 A1Betting Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "api_health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn  # Development server configuration

    uvicorn.run(
        "main_integrated:app",  # Changed from "backend.main_integrated:app"
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
