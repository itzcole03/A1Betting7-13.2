"""
Abstract Base Sport Service for A1Betting Backend

Provides a common interface for all sport-specific services (MLB, NBA, NFL, NHL).
Supports unified analytics and data processing across multiple sports.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from backend.utils.enhanced_logging import get_logger

logger = get_logger("sport_service_base")


class SportServiceBase(ABC):
    """Abstract base class for sport-specific services"""

    def __init__(self, sport_name: str):
        self.sport_name = sport_name
        self.session = None

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the service"""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close the service"""
        pass

    @abstractmethod
    async def get_teams(self) -> List[Dict[str, Any]]:
        """Get all teams for this sport"""
        pass

    @abstractmethod
    async def get_players(self, team_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get players, optionally filtered by team"""
        pass

    @abstractmethod
    async def get_games(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        team_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get games for specified criteria"""
        pass

    @abstractmethod
    async def get_odds_comparison(self) -> Dict[str, Any]:
        """Get odds comparison across multiple sportsbooks"""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the service"""
        pass

    # Common utility methods that can be shared across sports
    def get_default_date_range(self) -> tuple[datetime, datetime]:
        """Get default date range (today to tomorrow)"""
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        return start_date, end_date

    def get_week_date_range(self) -> tuple[datetime, datetime]:
        """Get date range for the next week"""
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=7)
        return start_date, end_date

    async def get_todays_games(self) -> List[Dict[str, Any]]:
        """Get today's games (common implementation)"""
        start_date, end_date = self.get_default_date_range()
        return await self.get_games(start_date=start_date, end_date=end_date)

    async def get_team_upcoming_games(
        self, team_id: int, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get upcoming games for a specific team"""
        start_date = datetime.now()
        end_date = start_date + timedelta(days=days)
        return await self.get_games(
            start_date=start_date, end_date=end_date, team_id=team_id
        )


class UnifiedSportService:
    """Unified service for managing multiple sports"""

    def __init__(self):
        self._services: Dict[str, SportServiceBase] = {}
        self._initialized = False

    def register_sport_service(self, sport_name: str, service: SportServiceBase):
        """Register a sport service"""
        self._services[sport_name.lower()] = service
        logger.info(f"Registered {sport_name} service")

    async def initialize_all(self):
        """Initialize all registered sport services"""
        for sport_name, service in self._services.items():
            try:
                await service.initialize()
                logger.info(f"Initialized {sport_name} service")
            except Exception as e:
                logger.error(f"Failed to initialize {sport_name} service: {e}")
        self._initialized = True

    async def close_all(self):
        """Close all registered sport services"""
        for sport_name, service in self._services.items():
            try:
                await service.close()
                logger.info(f"Closed {sport_name} service")
            except Exception as e:
                logger.error(f"Failed to close {sport_name} service: {e}")

    def get_service(self, sport_name: str) -> Optional[SportServiceBase]:
        """Get a specific sport service"""
        return self._services.get(sport_name.lower())

    def get_available_sports(self) -> List[str]:
        """Get list of available sports"""
        return list(self._services.keys())

    async def get_all_sports_health(self) -> Dict[str, Any]:
        """Get health status for all sports services"""
        health_status = {
            "overall_status": "healthy",
            "services_count": len(self._services),
            "services": {},
        }

        unhealthy_count = 0
        for sport_name, service in self._services.items():
            try:
                service_health = await service.health_check()
                health_status["services"][sport_name] = service_health

                if service_health.get("status") != "healthy":
                    unhealthy_count += 1

            except Exception as e:
                health_status["services"][sport_name] = {
                    "status": "error",
                    "error": str(e),
                }
                unhealthy_count += 1

        # Determine overall status
        if unhealthy_count == 0:
            health_status["overall_status"] = "healthy"
        elif unhealthy_count < len(self._services):
            health_status["overall_status"] = "degraded"
        else:
            health_status["overall_status"] = "unhealthy"

        return health_status

    async def get_unified_odds_comparison(self) -> Dict[str, Any]:
        """Get odds comparison across all sports"""
        unified_odds = {
            "status": "ok",
            "sports": {},
            "total_games": 0,
            "last_updated": datetime.now().isoformat(),
        }

        for sport_name, service in self._services.items():
            try:
                sport_odds = await service.get_odds_comparison()
                unified_odds["sports"][sport_name] = sport_odds

                if sport_odds.get("status") == "ok":
                    unified_odds["total_games"] += len(sport_odds.get("odds", []))

            except Exception as e:
                logger.error(f"Failed to get odds for {sport_name}: {e}")
                unified_odds["sports"][sport_name] = {
                    "status": "error",
                    "error": str(e),
                }

        return unified_odds


# Global unified sport service instance
unified_sport_service = UnifiedSportService()
