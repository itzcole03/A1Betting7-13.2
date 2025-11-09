"""Legacy real data service compatibility shim."""

from backend.services.data_fetchers import LiveOddsSchema, fetch_live_odds_from_api


async def get_validated_live_odds(api_url: str) -> list[LiveOddsSchema]:
    """Fetch live odds using centralized odds fetcher."""
    return await fetch_live_odds_from_api(api_url)


# Legacy implementation replaced by UnifiedDataService facade.
from typing import Any, Dict, List, Optional

from backend.models.api_models import BettingOpportunity, PerformanceStats
from backend.services.core.unified_data_service import (
    UnifiedDataService,
    get_data_service,
)


class RealDataService:
    """Compatibility facade forwarding to UnifiedDataService."""

    def __init__(self) -> None:
        self._service: Optional[UnifiedDataService] = None

    async def _get_service(self) -> UnifiedDataService:
        if self._service is None:
            self._service = await get_data_service()
        return self._service

    async def fetch_real_betting_opportunities(self) -> List[BettingOpportunity]:
        service = await self._get_service()
        return await service.fetch_real_betting_opportunities()

    async def fetch_real_performance_stats(
        self, user_id: Optional[int] = None
    ) -> PerformanceStats:
        service = await self._get_service()
        return await service.fetch_real_performance_stats(user_id)

    async def fetch_real_prizepicks_props(self) -> List[Dict[str, Any]]:
        service = await self._get_service()
        return await service.fetch_real_prizepicks_props()


real_data_service = RealDataService()

__all__ = [
    "RealDataService",
    "real_data_service",
    "get_validated_live_odds",
]
