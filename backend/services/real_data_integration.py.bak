"""Legacy real data integration compatibility shim."""

from typing import Any, Dict, List, Optional

from backend.models.api_models import BettingOpportunity, PerformanceStats
from backend.services.core.unified_data_service import (
    UnifiedDataService,
    get_data_service,
)


def _to_dict(payload: Any) -> Dict[str, Any]:
    """Best-effort conversion of unified payloads into plain dicts."""

    if hasattr(payload, "model_dump"):
        return payload.model_dump()
    if hasattr(payload, "dict"):
        return payload.dict()
    if isinstance(payload, dict):
        return payload
    if hasattr(payload, "_asdict"):
        return payload._asdict()
    return {"value": payload}


class RealDataIntegrationService:
    """Compatibility facade forwarding to UnifiedDataService."""

    def __init__(self) -> None:
        self._service: Optional[UnifiedDataService] = None

    async def _get_service(self) -> UnifiedDataService:
        if self._service is None:
            self._service = await get_data_service()
        return self._service

    async def initialize(self) -> None:
        """Maintain legacy contract; service is lazily initialized."""
        await self._get_service()

    async def close(self) -> None:
        """Unified data service manages its own lifecycle."""

    async def enhance_nfl_service(self) -> List[Dict[str, Any]]:
        """Return live opportunities as NFL enhancement data."""
        opportunities = await self.fetch_real_betting_opportunities()
        return [_to_dict(opp) for opp in opportunities]

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


class EnhancedMLDataPipeline:
    """Minimal legacy pipeline wrapper around unified service."""

    def __init__(self) -> None:
        self._integration = RealDataIntegrationService()

    async def initialize(self) -> None:
        await self._integration.initialize()

    async def close(self) -> None:
        await self._integration.close()

    async def generate_real_training_data(self, sport: str) -> List[Dict[str, Any]]:
        """Return betting opportunities as training-friendly dictionaries."""
        del sport  # Legacy signature kept for compatibility
        opportunities = await self._integration.fetch_real_betting_opportunities()
        return [_to_dict(opp) for opp in opportunities]


real_data_service = RealDataIntegrationService()
ml_data_pipeline = EnhancedMLDataPipeline()

__all__ = [
    "RealDataIntegrationService",
    "EnhancedMLDataPipeline",
    "real_data_service",
    "ml_data_pipeline",
]
