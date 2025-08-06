"""
Sports Service Initialization for A1Betting Backend

UPDATED: Now uses lazy loading - services are registered but not initialized until needed.
Only loads models and services when the corresponding sport tab is selected.
"""

import logging
from typing import Any, Dict

from backend.services.lazy_sport_manager import lazy_sport_manager
from backend.services.sport_service_base import unified_sport_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("sports_init")


async def initialize_sports_services() -> Dict[str, Any]:
    """
    LAZY INITIALIZATION: Register sport services but don't load them until needed.

    This function now only registers service placeholders. Actual initialization
    happens when a sport tab is selected via the lazy_sport_manager.
    """
    initialization_status = {
        "status": "ok",
        "registered_services": [],
        "failed_services": [],
        "total_services": 0,
        "lazy_loading": True,
        "message": "Services registered for lazy loading - will initialize on demand",
    }

    # Start the lazy sport manager cleanup service
    try:
        await lazy_sport_manager.start_cleanup_service()
        logger.info("✅ Lazy sport manager cleanup service started")
    except Exception as e:
        logger.warning(f"⚠️ Failed to start cleanup service: {e}")

    # Register NBA service (lazy)
    try:
        # Create a lazy wrapper that will load the actual service on demand
        class LazyNBAWrapper:
            def __init__(self):
                self.sport_name = "NBA"
                self._loaded_service = None

            async def initialize(self):
                if not self._loaded_service:
                    activation_result = await lazy_sport_manager.activate_sport("NBA")
                    if activation_result["status"] == "ready":
                        self._loaded_service = lazy_sport_manager.services[
                            "NBA"
                        ].service_instance
                    else:
                        raise Exception(
                            f"Failed to activate NBA: {activation_result.get('error', 'Unknown error')}"
                        )

            async def health_check(self):
                status = lazy_sport_manager.get_sport_status("NBA")
                return {
                    "status": "healthy" if status["status"] == "ready" else "loading",
                    "service": "NBA",
                    "lazy_status": status["status"],
                    "message": "NBA service available via lazy loading",
                }

        nba_wrapper = LazyNBAWrapper()
        unified_sport_service.register_sport_service("NBA", nba_wrapper)
        initialization_status["registered_services"].append("NBA")
        logger.info("✅ NBA service registered for lazy loading")
    except Exception as e:
        initialization_status["failed_services"].append(
            {"service": "NBA", "error": str(e)}
        )
        logger.error(f"❌ Failed to register NBA service: {e}")

    # Register MLB service (lazy)
    try:

        class LazyMLBWrapper:
            def __init__(self):
                self.sport_name = "MLB"
                self._loaded_service = None

            async def initialize(self):
                if not self._loaded_service:
                    activation_result = await lazy_sport_manager.activate_sport("MLB")
                    if activation_result["status"] == "ready":
                        self._loaded_service = lazy_sport_manager.services[
                            "MLB"
                        ].service_instance
                    else:
                        raise Exception(
                            f"Failed to activate MLB: {activation_result.get('error', 'Unknown error')}"
                        )

            async def get_odds_comparison(self):
                # Ensure service is loaded
                await self.initialize()
                return {
                    "status": "ok",
                    "sport": "MLB",
                    "odds": [],
                    "message": "MLB odds available via lazy-loaded service",
                }

            async def health_check(self):
                status = lazy_sport_manager.get_sport_status("MLB")
                return {
                    "status": "healthy" if status["status"] == "ready" else "loading",
                    "service": "MLB",
                    "lazy_status": status["status"],
                    "message": "MLB service available via lazy loading",
                }

        mlb_wrapper = LazyMLBWrapper()
        unified_sport_service.register_sport_service("MLB", mlb_wrapper)
        initialization_status["registered_services"].append("MLB")
        logger.info("✅ MLB service registered for lazy loading")

    except Exception as e:
        initialization_status["failed_services"].append(
            {"service": "MLB", "error": str(e)}
        )
        logger.warning(f"⚠️ MLB service not available for lazy loading: {e}")

    # Register NFL service (lazy)
    try:

        class LazyNFLWrapper:
            def __init__(self):
                self.sport_name = "NFL"
                self._loaded_service = None

            async def initialize(self):
                if not self._loaded_service:
                    activation_result = await lazy_sport_manager.activate_sport("NFL")
                    if activation_result["status"] == "ready":
                        self._loaded_service = lazy_sport_manager.services[
                            "NFL"
                        ].service_instance
                    else:
                        raise Exception(
                            f"Failed to activate NFL: {activation_result.get('error', 'Unknown error')}"
                        )

            async def health_check(self):
                status = lazy_sport_manager.get_sport_status("NFL")
                return {
                    "status": "healthy" if status["status"] == "ready" else "loading",
                    "service": "NFL",
                    "lazy_status": status["status"],
                    "message": "NFL service available via lazy loading",
                }

        nfl_wrapper = LazyNFLWrapper()
        unified_sport_service.register_sport_service("NFL", nfl_wrapper)
        initialization_status["registered_services"].append("NFL")
        logger.info("✅ NFL service registered for lazy loading")
    except Exception as e:
        initialization_status["failed_services"].append(
            {"service": "NFL", "error": str(e)}
        )
        logger.error(f"❌ Failed to register NFL service: {e}")

    # Register NHL service (lazy)
    try:

        class LazyNHLWrapper:
            def __init__(self):
                self.sport_name = "NHL"
                self._loaded_service = None

            async def initialize(self):
                if not self._loaded_service:
                    activation_result = await lazy_sport_manager.activate_sport("NHL")
                    if activation_result["status"] == "ready":
                        self._loaded_service = lazy_sport_manager.services[
                            "NHL"
                        ].service_instance
                    else:
                        raise Exception(
                            f"Failed to activate NHL: {activation_result.get('error', 'Unknown error')}"
                        )

            async def health_check(self):
                status = lazy_sport_manager.get_sport_status("NHL")
                return {
                    "status": "healthy" if status["status"] == "ready" else "loading",
                    "service": "NHL",
                    "lazy_status": status["status"],
                    "message": "NHL service available via lazy loading",
                }

        nhl_wrapper = LazyNHLWrapper()
        unified_sport_service.register_sport_service("NHL", nhl_wrapper)
        initialization_status["registered_services"].append("NHL")
        logger.info("✅ NHL service registered for lazy loading")
    except Exception as e:
        initialization_status["failed_services"].append(
            {"service": "NHL", "error": str(e)}
        )
        logger.error(f"❌ Failed to register NHL service: {e}")

    # Don't initialize all services - they will be loaded on demand
    logger.info("🚀 Lazy loading sports services registration completed")
    logger.info(
        "📋 Services will be initialized only when corresponding sport tabs are selected"
    )

    initialization_status["total_services"] = len(
        initialization_status["registered_services"]
    )

    logger.info(
        f"✅ Lazy sports initialization complete: {initialization_status['total_services']} services registered for on-demand loading"
    )
    return initialization_status


async def shutdown_sports_services():
    """Shutdown all sports services and cleanup"""
    try:
        # Stop the lazy sport manager cleanup service
        await lazy_sport_manager.stop_cleanup_service()

        # Deactivate all active services
        all_status = lazy_sport_manager.get_all_statuses()
        for sport, status in all_status["services"].items():
            if status["status"] == "ready":
                await lazy_sport_manager.deactivate_sport(sport)

        await unified_sport_service.close_all()
        logger.info(
            "✅ All sports services shut down successfully with lazy loading cleanup"
        )
    except Exception as e:
        logger.error(f"❌ Error during sports services shutdown: {e}")


# Startup event for sports services
sports_startup_status = None


async def get_sports_startup_status():
    """Get the sports services startup status"""
    global sports_startup_status
    if sports_startup_status is None:
        sports_startup_status = await initialize_sports_services()
    return sports_startup_status
