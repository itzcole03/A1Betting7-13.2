"""
Unified Data Service Domain

This module consolidates all data acquisition, processing, and validation capabilities
into a cohesive service that ensures high-quality, consistent data across all platform components.

Consolidates the following services:
- Data fetchers and orchestrators
- ETL and pipeline services  
- Database and validation services
- Sport-specific data services
- External API integrations (Sportradar, Baseball Savant, etc.)
- Sportsbook data aggregation
- Data quality monitoring and validation
"""

from .service import UnifiedDataService
from .models import (
    DataRequest,
    DataResponse,
    DataQualityMetrics,
    GameData,
    PlayerData,
    TeamData,
    OddsData,
)
from .router import data_router

__all__ = [
    "UnifiedDataService",
    "DataRequest",
    "DataResponse", 
    "DataQualityMetrics",
    "GameData",
    "PlayerData",
    "TeamData",
    "OddsData",
    "data_router",
]
