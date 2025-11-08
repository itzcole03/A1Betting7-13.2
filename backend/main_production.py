"""
Production-ready FastAPI application entry point.

Implements all best practices:
- Proper configuration management
- Structured logging
- Comprehensive error handling
- Middleware stack
- Dependency injection
- Health checks
- Graceful shutdown
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

from backend.core.settings import get_settings
from backend.core.logging_config import setup_logging
from backend.core.middleware import setup_middleware
from backend.core.exceptions import register_exception_handlers
from backend.core.dependencies import db_manager, redis_manager

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events:
    - Initialize database connections
    - Initialize Redis connections
    - Setup background tasks
    - Graceful shutdown
    """
    settings = get_settings()
    
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    
    try:
        # Initialize database
        logger.info("Initializing database connection pool...")
        db_manager.init(
            database_url=settings.database_url_async,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            echo=settings.database_echo,
        )
        logger.info("Database connection pool initialized")
        
        # Initialize Redis
        logger.info("Initializing Redis connection pool...")
        await redis_manager.init(
            redis_url=settings.redis_url,
            max_connections=settings.redis_max_connections
        )
        logger.info("Redis connection pool initialized")
        
        logger.info("Application startup complete")
        
        yield
        
    finally:
        # Shutdown
        logger.info("Shutting down application...")
        
        # Close database connections
        logger.info("Closing database connections...")
        await db_manager.close()
        logger.info("Database connections closed")
        
        # Close Redis connections
        logger.info("Closing Redis connections...")
        await redis_manager.close()
        logger.info("Redis connections closed")
        
        logger.info("Application shutdown complete")


def create_application() -> FastAPI:
    """
    Create and configure FastAPI application.
    
    Factory pattern for application creation.
    
    Returns:
        FastAPI: Configured application instance
    """
    settings = get_settings()
    
    # Create FastAPI app
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="A1Betting API - Sports betting analytics and predictions",
        docs_url="/docs" if not settings.is_production else None,  # Disable docs in prod
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )
    
    # Setup middleware
    setup_middleware(app)
    
    # Register exception handlers
    register_exception_handlers(app)
    
    # Register routes
    register_routes(app)
    
    logger.info("FastAPI application created and configured")
    
    return app


def register_routes(app: FastAPI):
    """
    Register all API routes.
    
    Args:
        app: FastAPI application instance
    """
    settings = get_settings()
    
    # Health check endpoints
    @app.get("/health", tags=["Health"])
    async def health_check():
        """
        Health check endpoint.
        
        Returns basic health status.
        """
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
        }
    
    @app.get("/ready", tags=["Health"])
    async def readiness_check():
        """
        Readiness check endpoint.
        
        Checks if application is ready to serve traffic.
        Validates database and Redis connections.
        """
        try:
            # Check database
            async with db_manager.session() as db:
                await db.execute("SELECT 1")
            
            # Check Redis
            redis = await redis_manager()
            await redis.ping()
            
            return {
                "status": "ready",
                "database": "connected",
                "redis": "connected",
            }
        except Exception as e:
            logger.error(f"Readiness check failed: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=503,
                content={
                    "status": "not ready",
                    "error": str(e),
                }
            )
    
    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint with API information."""
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs" if not settings.is_production else "disabled",
            "health": "/health",
            "ready": "/ready",
        }
    
    # Import and register API routes
    # TODO: Import your actual routers here
    # from backend.routes import auth, users, bets, predictions
    # app.include_router(auth.router, prefix=f"{settings.api_v1_prefix}/auth", tags=["Auth"])
    # app.include_router(users.router, prefix=f"{settings.api_v1_prefix}/users", tags=["Users"])
    # app.include_router(bets.router, prefix=f"{settings.api_v1_prefix}/bets", tags=["Bets"])
    # app.include_router(predictions.router, prefix=f"{settings.api_v1_prefix}/predictions", tags=["Predictions"])
    
    logger.info("Routes registered successfully")


# Create application instance
app = create_application()


if __name__ == "__main__":
    """
    Run application with Uvicorn.
    
    For production, use Gunicorn with Uvicorn workers:
    gunicorn backend.main_production:app \
        --workers 4 \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:8000 \
        --access-logfile - \
        --error-logfile -
    """
    import uvicorn
    
    settings = get_settings()
    
    uvicorn.run(
        "backend.main_production:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
        access_log=True,
    )
