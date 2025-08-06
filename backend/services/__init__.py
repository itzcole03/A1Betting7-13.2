"""
Services package for A1Betting Backend

This package contains all business logic services used by the application.
"""

from .batch_prop_analysis_service import BatchPropAnalysisService
from .calculations import (
    calculate_prop_confidence,
    calculate_prop_edge,
    calculate_prop_projection,
)

# Import optimized services
from .optimized_data_service import OptimizedDataService

# Temporarily commenting out corrupted data_fetchers
# from .data_fetchers import (
#     fetch_betting_opportunities_internal,
#     fetch_performance_stats_internal,
#     fetch_prizepicks_props_internal,
#     fetch_historical_internal,
#     fetch_news_internal,
#     fetch_injuries_internal,
# )

__all__ = [
    "calculate_prop_confidence",
    "calculate_prop_edge",
    "calculate_prop_projection",
    "OptimizedDataService",
    "BatchPropAnalysisService",
    # Temporarily removing corrupted data_fetchers functions
    # "fetch_betting_opportunities_internal",
    # "fetch_performance_stats_internal",
    # "fetch_prizepicks_props_internal",
    # "fetch_historical_internal",
    # "fetch_news_internal",
    # "fetch_injuries_internal",
]
