"""
A1Betting Domain Architecture

This module implements the consolidated domain structure for the A1Betting platform,
reducing complexity from 57 route files and 150+ services to 5 logical domains.

Domains:
1. Prediction - ML/AI prediction capabilities
2. Data - Data integration and processing  
3. Analytics - Performance tracking and analytics
4. Integration - External API integrations
5. Optimization - Portfolio optimization and risk management
"""

from .prediction import prediction_router, UnifiedPredictionService
from .data import data_router, UnifiedDataService

# Domain registry for centralized management
DOMAIN_ROUTERS = {
    "prediction": prediction_router,
    "data": data_router,
    # Additional domains will be added here
}

DOMAIN_SERVICES = {
    "prediction": UnifiedPredictionService,
    "data": UnifiedDataService,
    # Additional domains will be added here
}

__all__ = [
    "DOMAIN_ROUTERS",
    "DOMAIN_SERVICES",
    "prediction_router",
    "UnifiedPredictionService",
    "data_router",
    "UnifiedDataService",
]
