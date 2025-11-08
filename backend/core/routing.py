"""
Router registration for A1Betting FastAPI application.
Extracted from core/app.py to follow Single Responsibility Principle.
"""

import logging
from fastapi import FastAPI, APIRouter

try:
    from backend.utils.structured_logging import app_logger
    logger = app_logger
except ImportError:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    logger = logging.getLogger(__name__)


def register_feature_routers(app: FastAPI) -> None:
    """
    Register feature routers (PropFinder, Analytics, etc.) in a deterministic, idempotent way.
    
    This function safely imports and registers all domain routers without causing
    duplicate route registration or circular import issues.
    
    Args:
        app: The FastAPI application instance
    """
    registered_prefixes = set()
    
    # PropFinder routes
    try:
        from backend.routes.propfinder_routes import router as propfinder_router
        if "/propfinder" not in registered_prefixes:
            app.include_router(propfinder_router, prefix="/propfinder", tags=["propfinder"])
            registered_prefixes.add("/propfinder")
            logger.info("Registered PropFinder routes")
    except Exception as e:
        logger.warning(f"Could not register PropFinder routes: {e}")
    
    # Betting routes
    try:
        from backend.routes.betting_routes import router as betting_router
        if "/betting" not in registered_prefixes:
            app.include_router(betting_router, prefix="/betting", tags=["betting"])
            registered_prefixes.add("/betting")
            logger.info("Registered Betting routes")
    except Exception as e:
        logger.warning(f"Could not register Betting routes: {e}")
    
    # Analytics routes
    try:
        from backend.routes.analytics_routes import router as analytics_router
        if "/analytics" not in registered_prefixes:
            app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
            registered_prefixes.add("/analytics")
            logger.info("Registered Analytics routes")
    except Exception as e:
        logger.warning(f"Could not register Analytics routes: {e}")
    
    # Arbitrage routes
    try:
        from backend.routes.arbitrage_routes import router as arbitrage_router
        if "/arbitrage" not in registered_prefixes:
            app.include_router(arbitrage_router, prefix="/arbitrage", tags=["arbitrage"])
            registered_prefixes.add("/arbitrage")
            logger.info("Registered Arbitrage routes")
    except Exception as e:
        logger.warning(f"Could not register Arbitrage routes: {e}")
    
    # Predictions/ML routes
    try:
        from backend.routes.prediction_routes import router as prediction_router
        if "/predictions" not in registered_prefixes:
            app.include_router(prediction_router, prefix="/predictions", tags=["predictions"])
            registered_prefixes.add("/predictions")
            logger.info("Registered Prediction routes")
    except Exception as e:
        logger.warning(f"Could not register Prediction routes: {e}")
    
    # Auth routes
    try:
        from backend.routes.auth_routes import router as auth_router
        if "/auth" not in registered_prefixes:
            app.include_router(auth_router, prefix="/auth", tags=["auth"])
            registered_prefixes.add("/auth")
            logger.info("Registered Auth routes")
    except Exception as e:
        logger.warning(f"Could not register Auth routes: {e}")
    
    logger.info(f"Total routers registered: {len(registered_prefixes)}")


def register_health_routes(app: FastAPI) -> None:
    """Register health check and status routes."""
    
    @app.get("/health", tags=["system"])
    async def health_check():
        """Basic health check endpoint."""
        return {
            "status": "healthy",
            "service": "a1betting-api"
        }
    
    @app.get("/", tags=["system"])
    async def root():
        """Root endpoint with API information."""
        return {
            "service": "A1Betting API",
            "version": "1.0.0",
            "status": "running"
        }
    
    logger.info("Registered health check routes")


def register_all_routes(app: FastAPI) -> None:
    """Register all application routes."""
    register_health_routes(app)
    register_feature_routers(app)
    logger.info("All routes registered successfully")
