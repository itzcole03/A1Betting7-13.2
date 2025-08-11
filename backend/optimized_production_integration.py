"""
Optimized Production Integration - Phase 4 Performance Enhancement
Enhanced FastAPI app with optimized services, caching, and error handling
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from backend.config_manager import A1BettingConfig
from backend.routes.comprehensive_sportradar_routes import router as sportradar_router
from backend.routes.optimized_api_routes import router as optimized_router
from backend.services.optimized_cache_service import get_cache_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("optimized_production")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Enhanced application lifespan with service initialization"""
    start_time = time.time()
    logger.info("🚀 Starting A1Betting Optimized Backend...")

    try:
        # Initialize cache service
        cache_service = await get_cache_service()
        logger.info("✅ Cache service initialized")

        # Initialize other services
        startup_time = time.time() - start_time
        logger.info(f"✅ Backend startup completed in {startup_time:.2f}s")

        yield

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🛑 Shutting down services...")
        try:
            cache_service = await get_cache_service()
            await cache_service.close()
            logger.info("✅ Services shutdown completed")
        except Exception as e:
            logger.error(f"⚠️ Shutdown error: {e}")


def create_optimized_app() -> FastAPI:
    """Create optimized FastAPI application with Phase 4 enhancements"""

    # Load configuration
    config = A1BettingConfig()

    # Create FastAPI app with optimized settings
    app = FastAPI(
        title="A1Betting Optimized API",
        description="Phase 4 Optimized Sports Betting Intelligence Platform",
        version="8.4.0",
        lifespan=lifespan,
        # Performance optimizations
        generate_unique_id_function=lambda route: (
            f"{route.tags[0]}-{route.name}" if route.tags else route.name
        ),
        swagger_ui_parameters={"defaultModelsExpandDepth": 1},
    )

    # Add security middleware
    if config.security.enable_ssl_redirect:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

    # Add CORS middleware with optimized settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.security.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        max_age=86400,  # Cache preflight requests for 24 hours
    )

    # Add performance monitoring middleware
    @app.middleware("http")
    async def performance_middleware(request: Request, call_next):
        """Monitor API performance"""
        start_time = time.time()

        try:
            response = await call_next(request)

            # Add performance headers
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
            response.headers["X-Timestamp"] = datetime.utcnow().isoformat()

            # Log slow requests
            if process_time > 1.0:  # Log requests taking more than 1 second
                logger.warning(
                    f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s"
                )

            return response

        except Exception as e:
            logger.error(f"Request failed: {request.method} {request.url.path} - {e}")
            raise

    # Add error handling middleware
    @app.middleware("http")
    async def error_handling_middleware(request: Request, call_next):
        """Enhanced error handling"""
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(f"Unhandled error in {request.method} {request.url.path}: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred",
                    "timestamp": datetime.utcnow().isoformat(),
                    "path": str(request.url.path),
                },
            )

    # Include optimized routes
    app.include_router(optimized_router, prefix="", tags=["Optimized API"])

    # Include comprehensive SportRadar routes
    app.include_router(sportradar_router, tags=["SportRadar API"])

    # Add health check endpoints
    @app.get("/")
    async def root():
        """Root endpoint with basic info"""
        return {
            "name": "A1Betting Optimized API",
            "version": "8.4.0",
            "status": "operational",
            "phase": "Phase 4 - Performance Optimization",
            "features": [
                "Enhanced Caching",
                "Performance Monitoring",
                "Error Recovery",
                "Optimized Response Times",
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }

    @app.get("/api/health")
    async def api_health():
        """Detailed health check"""
        try:
            cache_service = await get_cache_service()
            cache_stats = await cache_service.get_stats()

            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "services": {
                    "api": "operational",
                    "cache": (
                        "operational"
                        if cache_stats["total_requests"] >= 0
                        else "degraded"
                    ),
                },
                "performance": {
                    "cache_hit_rate": cache_stats.get("hit_rate", 0),
                    "cache_type": cache_stats.get("cache_type", "unknown"),
                },
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

    # Exception handlers
    # Include sports routes for /api/v2/sports/activate endpoint
    try:
        from backend.routes import sports_routes

        app.include_router(sports_routes.router)
        logger.info("✅ Sports routes included successfully (/api/v2/sports/activate)")
    except ImportError:
        logger.warning("⚠️ Could not import sports_routes router")
    except Exception as e:
        logger.error(f"Error including sports_routes router: {e}")

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "status_code": exc.status_code,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
            },
        )

    @app.exception_handler(500)
    async def internal_server_error_handler(request: Request, exc: Exception):
        """Handle 500 errors"""
        logger.error(f"Internal server error: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred. Please try again later.",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
            },
        )

    logger.info("✅ Optimized FastAPI application created successfully")
    return app


# Create the app instance
app = create_optimized_app()

# Export for external usage
__all__ = ["app", "create_optimized_app"]
