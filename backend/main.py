"""
DEPRECATED: This entry point is deprecated in favor of backend.core.app
Please use the canonical app factory from backend.core.app.create_app() instead.

This file remains only for backward compatibility and will be removed in a future version.
All new features should be added to the canonical app factory.
"""

# Legacy test compatibility: stub for get_sport_radar_games
def get_sport_radar_games(*args, **kwargs):
    return []


import logging

# Initialize structured logging for startup
try:
    from backend.utils.structured_logging import app_logger

    logger = app_logger
    logger.warning("⚠️ Using DEPRECATED backend/main.py entry point")
    logger.info("🔄 Please migrate to backend.core.app.create_app()")
except ImportError:
    # Fallback to basic logging if structured logging not available
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ Using DEPRECATED backend/main.py entry point")


# Use the canonical app factory
try:
    from backend.core.app import app
    logger.info("✅ Using canonical app from backend.core.app")
except ImportError as e:
    logger.error(f"❌ Cannot import canonical app: {e}")
    raise RuntimeError("Canonical app not available") from e


logger.info("⚠️ DEPRECATED: A1Betting Backend loaded via deprecated main.py")
logger.info("🔄 Migrate to: from backend.core.app import app")

# Export the app for uvicorn (backward compatibility)
__all__ = ["app"]
