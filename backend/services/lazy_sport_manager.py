"""
Lazy Sport Service Manager for A1Betting Backend

Manages sport-specific resources on demand for optimal performance.
Only loads models and services when the corresponding sport tab is selected.
"""

import asyncio
import logging
import time
from enum import Enum
from typing import Any, Dict, Optional, Set

from backend.services.sport_service_base import SportServiceBase
from backend.utils.enhanced_logging import get_logger

logger = get_logger("lazy_sport_manager")


class SportStatus(Enum):
    """Status of a sport service"""

    NOT_LOADED = "not_loaded"
    LOADING = "loading"
    READY = "ready"
    ERROR = "error"
    UNLOADING = "unloading"


class SportServiceInfo:
    """Information about a sport service"""

    def __init__(self, sport_name: str):
        self.sport_name = sport_name
        self.status = SportStatus.NOT_LOADED
        self.service_instance: Optional[Any] = None
        self.ml_models: Dict[str, Any] = {}
        self.last_accessed: Optional[float] = None
        self.load_time: Optional[float] = None
        self.error_message: Optional[str] = None
        self.active_requests: int = 0


class LazySportManager:
    """
    Manages sport services with lazy loading based on user tab selection.

    Best Practices Implemented:
    - Lazy Loading: Only load models when sport is selected
    - Resource Management: Unload unused models after timeout
    - Error Handling: Graceful fallback and retry logic
    - Performance Tracking: Monitor load times and usage
    - Memory Optimization: Clean up unused resources
    """

    def __init__(self, inactive_timeout: int = 1800):  # 30 minutes default
        self.services: Dict[str, SportServiceInfo] = {}
        self.active_sport: Optional[str] = None
        self.inactive_timeout = inactive_timeout
        self.cleanup_task: Optional[asyncio.Task] = None
        self.initialization_locks: Dict[str, asyncio.Lock] = {}

        # Supported sports with their initialization functions
        self.sport_initializers = {
            "MLB": self._initialize_mlb_service,
            "NBA": self._initialize_nba_service,
            "NFL": self._initialize_nfl_service,
            "NHL": self._initialize_nhl_service,
        }

        # Initialize service info for all supported sports
        for sport in self.sport_initializers.keys():
            self.services[sport] = SportServiceInfo(sport)
            self.initialization_locks[sport] = asyncio.Lock()

        logger.info(
            f"LazySportManager initialized with {len(self.sport_initializers)} sports"
        )

    async def start_cleanup_service(self):
        """Start the background cleanup service"""
        if not self.cleanup_task:
            self.cleanup_task = asyncio.create_task(self._cleanup_loop())
            logger.info("CLEANUP: Cleanup service started")

    async def stop_cleanup_service(self):
        """Stop the background cleanup service"""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
            self.cleanup_task = None
            logger.info("STOPPED: Cleanup service stopped")

    async def activate_sport(self, sport: str) -> Dict[str, Any]:
        """
        Activate a sport service with lazy loading.

        Args:
            sport: Sport name (e.g., "MLB", "NBA", "NFL", "NHL")

        Returns:
            Dict with status, timing, and error information
        """
        sport = sport.upper()
        start_time = time.time()

        if sport not in self.sport_initializers:
            error_msg = f"Unsupported sport: {sport}. Supported: {list(self.sport_initializers.keys())}"
            logger.warning(error_msg)
            return {
                "status": "error",
                "sport": sport,
                "error": error_msg,
                "load_time": 0,
            }

        service_info = self.services[sport]

        # If already ready, just update access time
        if service_info.status == SportStatus.READY:
            service_info.last_accessed = time.time()
            self.active_sport = sport
            logger.info(f"READY: {sport} service already ready, updated access time")
            return {
                "status": "ready",
                "sport": sport,
                "cached": True,
                "load_time": time.time() - start_time,
            }

        # If currently loading, wait for it
        if service_info.status == SportStatus.LOADING:
            async with self.initialization_locks[sport]:
                # Check again after acquiring lock
                if service_info.status == SportStatus.READY:
                    service_info.last_accessed = time.time()
                    self.active_sport = sport
                    return {
                        "status": "ready",
                        "sport": sport,
                        "waited": True,
                        "load_time": time.time() - start_time,
                    }

        # Load the service
        async with self.initialization_locks[sport]:
            service_info.status = SportStatus.LOADING
            service_info.load_time = time.time()

            try:
                logger.info(f"Loading {sport} service and models...")

                # Initialize the sport service
                service_instance = await self.sport_initializers[sport]()

                service_info.service_instance = service_instance
                service_info.status = SportStatus.READY
                service_info.last_accessed = time.time()
                service_info.error_message = None
                self.active_sport = sport

                # Register the service with unified_sport_service
                try:
                    from backend.services.sport_service_base import unified_sport_service

                    unified_sport_service.register_sport_service(sport, service_instance)
                    logger.info(f"Registered {sport} service with unified_sport_service")
                except ImportError as e:
                    logger.warning(
                        f"Could not import unified_sport_service: {e}"
                    )
                except Exception as e:
                    logger.warning(
                        f"Failed to register {sport} with unified_sport_service: {e}"
                    )

                load_duration = time.time() - (service_info.load_time or time.time())
                logger.info(
                    f"{sport} service loaded successfully in {load_duration:.2f}s"
                )

                return {
                    "status": "ready",
                    "sport": sport,
                    "load_time": load_duration,
                    "newly_loaded": True,
                }

            except Exception as e:
                service_info.status = SportStatus.ERROR
                service_info.error_message = str(e)
                load_duration = time.time() - (service_info.load_time or time.time())

                logger.error(
                    f"Failed to load {sport} service in {load_duration:.2f}s: {e}"
                )

                return {
                    "status": "error",
                    "sport": sport,
                    "error": str(e),
                    "load_time": load_duration,
                }

    async def deactivate_sport(self, sport: str) -> Dict[str, Any]:
        """
        Deactivate a sport service to free resources.

        Args:
            sport: Sport name to deactivate

        Returns:
            Dict with deactivation status
        """
        sport = sport.upper()

        if sport not in self.services:
            return {"status": "error", "error": f"Unknown sport: {sport}"}

        service_info = self.services[sport]

        if service_info.status != SportStatus.READY:
            return {"status": "not_loaded", "sport": sport}

        # Check if there are active requests
        if service_info.active_requests > 0:
            logger.warning(
                f"{sport} has {service_info.active_requests} active requests, delaying deactivation"
            )
            return {
                "status": "delayed",
                "sport": sport,
                "active_requests": service_info.active_requests,
            }

        try:
            service_info.status = SportStatus.UNLOADING

            # Clean up the service
            if service_info.service_instance and hasattr(service_info.service_instance, "close"):
                await service_info.service_instance.close()

            # Clear ML models
            service_info.ml_models.clear()
            service_info.service_instance = None
            service_info.status = SportStatus.NOT_LOADED
            service_info.last_accessed = None

            if self.active_sport == sport:
                self.active_sport = None

            logger.info(f"CLEANUP: {sport} service deactivated and resources freed")

            return {"status": "deactivated", "sport": sport}

        except Exception as e:
            service_info.status = SportStatus.ERROR
            service_info.error_message = str(e)
            logger.error(f"Error deactivating {sport}: {e}")

            return {"status": "error", "sport": sport, "error": str(e)}

    def get_sport_status(self, sport: str) -> Dict[str, Any]:
        """Get the current status of a sport service"""
        sport = sport.upper()

        if sport not in self.services:
            return {"status": "unknown", "sport": sport}

        service_info = self.services[sport]

        return {
            "sport": sport,
            "status": service_info.status.value,
            "last_accessed": service_info.last_accessed,
            "load_time": service_info.load_time,
            "error_message": service_info.error_message,
            "active_requests": service_info.active_requests,
            "is_active": self.active_sport == sport,
        }

    def get_all_statuses(self) -> Dict[str, Any]:
        """Get status of all sport services"""
        statuses = {}
        for sport in self.services:
            statuses[sport] = self.get_sport_status(sport)

        return {
            "active_sport": self.active_sport,
            "services": statuses,
            "total_loaded": len(
                [s for s in self.services.values() if s.status == SportStatus.READY]
            ),
            "total_supported": len(self.services),
        }

    async def _cleanup_loop(self):
        """Background task to cleanup inactive services"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                await self._cleanup_inactive_services()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")

    async def _cleanup_inactive_services(self):
        """Clean up services that haven't been accessed recently"""
        current_time = time.time()

        for sport, service_info in self.services.items():
            if (
                service_info.status == SportStatus.READY
                and service_info.last_accessed
                and current_time - service_info.last_accessed > self.inactive_timeout
                and service_info.active_requests == 0
            ):

                logger.info(
                    f"CLEANUP: Cleaning up inactive {sport} service (last accessed {current_time - service_info.last_accessed:.0f}s ago)"
                )
                await self.deactivate_sport(sport)

    # Sport-specific initialization methods

    async def _initialize_mlb_service(self):
        """Initialize MLB service and models"""
        try:
            from backend.services.mlb_provider_client import MLBProviderClient

            # Create MLB service wrapper that inherits from SportServiceBase
            class MLBServiceWrapper(SportServiceBase):
                def __init__(self):
                    super().__init__("MLB")
                    self.mlb_client = MLBProviderClient()

                async def initialize(self):
                    # Ensure ML service is initialized
                    await self.mlb_client._ensure_ml_service_initialized()

                    # Initialize MLB-specific models only
                    from backend.services.enhanced_ml_service import enhanced_ml_service

                    if not enhanced_ml_service.has_sport_models("MLB"):
                        logger.info("Training MLB models on-demand...")
                        await enhanced_ml_service.initialize_sport_models("MLB")

                async def close(self):
                    # Cleanup if needed
                    pass

                async def get_teams(self):
                    # MLB doesn't have traditional teams endpoint, return empty list
                    return []

                async def get_players(self, team_id=None):
                    # MLB players are handled through props, return empty list
                    return []

                async def get_games(self, start_date=None, end_date=None, team_id=None):
                    # MLB games are handled through props, return empty list
                    return []

                async def get_odds_comparison(self):
                    # Get MLB odds comparison using the MLB provider client
                    odds_data = await self.mlb_client.fetch_odds_comparison()
                    # Wrap the list in a dictionary to match the expected return type
                    return {
                        "status": "ok" if odds_data else "error",
                        "sport": "MLB",
                        "odds": odds_data if isinstance(odds_data, list) else [],
                        "total_games": len(odds_data) if isinstance(odds_data, list) else 0
                    }

                async def health_check(self):
                    # Return basic health status
                    return {
                        "status": "healthy",
                        "service": "MLB",
                        "message": "MLB service operational"
                    }

            mlb_service = MLBServiceWrapper()
            await mlb_service.initialize()

            logger.info("MLB service initialized with ML models")
            return mlb_service

        except Exception as e:
            logger.error(f"Failed to initialize MLB service: {e}")
            raise

    async def _initialize_nba_service(self):
        """Initialize NBA service and models"""
        try:
            from backend.services.nba_service_client import nba_service
            from backend.services.enhanced_ml_service import enhanced_ml_service

            # Initialize NBA-specific models only
            if not enhanced_ml_service.has_sport_models("NBA"):
                logger.info("Training NBA models on-demand...")
                await enhanced_ml_service.initialize_sport_models("NBA")

            await nba_service.initialize()
            logger.info("NBA service initialized with ML models")
            return nba_service

        except Exception as e:
            logger.error(f"Failed to initialize NBA service: {e}")
            raise

    async def _initialize_nfl_service(self):
        """Initialize NFL service and models"""
        try:
            from backend.services.nfl_service_client import nfl_service
            from backend.services.enhanced_ml_service import enhanced_ml_service

            # Initialize NFL-specific models only
            if not enhanced_ml_service.has_sport_models("NFL"):
                logger.info("Training NFL models on-demand...")
                await enhanced_ml_service.initialize_sport_models("NFL")

            await nfl_service.initialize()
            logger.info("NFL service initialized with ML models")
            return nfl_service

        except Exception as e:
            logger.error(f"Failed to initialize NFL service: {e}")
            raise

    async def _initialize_nhl_service(self):
        """Initialize NHL service and models"""
        try:
            from backend.services.nhl_service_client import nhl_service
            from backend.services.enhanced_ml_service import enhanced_ml_service

            # Initialize NHL-specific models only
            if not enhanced_ml_service.has_sport_models("NHL"):
                logger.info("Training NHL models on-demand...")
                await enhanced_ml_service.initialize_sport_models("NHL")

            await nhl_service.initialize()
            logger.info("NHL service initialized with ML models")
            return nhl_service

        except Exception as e:
            logger.error(f"Failed to initialize NHL service: {e}")
            raise


# Global instance
lazy_sport_manager = LazySportManager()
