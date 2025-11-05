"""Compatibility shim exposing the optimized data engine via the unified service."""

from typing import Any, Dict, List, Optional

from backend.services.core.unified_data_service import get_data_service


class OptimizedDataServiceFacade:
    async def initialize(self) -> None:
        service = await get_data_service()
        await service.ensure_optimized_ready()

    async def get_player_data_optimized(
        self, player_name: str, stat_types: List[str], force_refresh: bool = False
    ) -> Optional[Dict[str, Any]]:
        service = await get_data_service()
        return await service.get_player_data_optimized(
            player_name, stat_types, force_refresh
        )

    async def get_performance_metrics(self) -> Dict[str, Any]:
        service = await get_data_service()
        return await service.get_optimized_performance_metrics()

    async def warm_cache(self, player_names: List[str], stat_types: List[str]) -> None:
        service = await get_data_service()
        await service.warm_cache(player_names, stat_types)


optimized_data_service = OptimizedDataServiceFacade()

__all__ = ["optimized_data_service", "OptimizedDataServiceFacade"]
