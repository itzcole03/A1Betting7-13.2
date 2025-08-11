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
from .analytics import analytics_router, UnifiedAnalyticsService
from .integration import integration_router, UnifiedIntegrationService
from .optimization import optimization_router, UnifiedOptimizationService

# Domain registry for centralized management
DOMAIN_ROUTERS = {
    "prediction": prediction_router,
    "data": data_router,
    "analytics": analytics_router,
    "integration": integration_router,
    "optimization": optimization_router,
}

DOMAIN_SERVICES = {
    "prediction": UnifiedPredictionService,
    "data": UnifiedDataService,
    "analytics": UnifiedAnalyticsService,
    "integration": UnifiedIntegrationService,
    "optimization": UnifiedOptimizationService,
}

__all__ = [
    "DOMAIN_ROUTERS",
    "DOMAIN_SERVICES",
    "prediction_router",
    "UnifiedPredictionService",
    "data_router",
    "UnifiedDataService",
    "analytics_router",
    "UnifiedAnalyticsService",
    "integration_router",
    "UnifiedIntegrationService",
    "optimization_router",
    "UnifiedOptimizationService",
]
