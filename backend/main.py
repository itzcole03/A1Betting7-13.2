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

# Add CORS middleware for frontend-backend connectivity
origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    # Add deployed frontend URLs if needed
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request correlation middleware
try:
    from backend.middleware.request_correlation import correlation_middleware

    app.middleware("http")(correlation_middleware)
    logger.info("✅ Request correlation middleware enabled")
except Exception as e:
    logger.warning(f"⚠️ Could not enable request correlation middleware: {e}")


# Utility function for error responses (backward compatibility)
def error_response(message="Test error response", status_code=400, details=None):
    """Create standardized error response"""
    body = {"error": message}
    if details:
        body["details"] = details
    return JSONResponse(content=body, status_code=status_code)


logger.info("🎉 A1Betting Backend startup complete!")

# Export the app for uvicorn
__all__ = ["app"]
