"""
Enhanced A1Betting Backend Main Entry Point
Incorporates Phase 1 optimizations with 2024-2025 FastAPI best practices
"""

import logging
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv

    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"✅ Loaded .env from: {env_path}")
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

# Try enhanced production integration first, fallback to original
try:
    from backend.enhanced_production_integration import create_enhanced_app

    app = create_enhanced_app()
    logger.info("✅ Enhanced production integration loaded successfully")
except ImportError as e:
    logger.warning(
        "⚠️ Enhanced integration not available (%s), falling back to original",
        error=str(e),
    )
    try:
        from backend.production_integration import create_production_app

        app = create_production_app()
        logger.info("✅ Original production integration loaded")
    except ImportError as e2:
        logger.error(
            "❌ Both integrations failed: enhanced=%s, original=%s", str(e), str(e2)
        )
        raise RuntimeError("No production integration available") from e2


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
