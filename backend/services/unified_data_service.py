"""Convenience re-export for unified data service interfaces."""

from backend.services.core.unified_data_service import (
    UnifiedDataService,
    data_service_context,
    fetch_aggregated_data,
    fetch_data,
    get_data_service,
    register_data_source,
)

__all__ = [
    "UnifiedDataService",
    "data_service_context",
    "fetch_aggregated_data",
    "fetch_data",
    "get_data_service",
    "register_data_source",
]
