"""
Unified Integration Service Domain

This module consolidates all external API integrations and third-party service connections
into a comprehensive service that provides consistent interfaces for accessing external 
data and services.

Consolidates the following services:
- Sportsbook API integrations (BetMGM, DraftKings, Caesars, FanDuel)
- External data provider APIs (Sportradar, ESPN, etc.)
- Third-party service connections
- OAuth and authentication integrations
- Webhook and notification integrations
"""

from .service import UnifiedIntegrationService
from .models import (
    IntegrationRequest,
    IntegrationResponse,
    SportsbookOdds,
    ExternalDataResponse,
    WebhookEvent,
    AuthenticationResult,
)
from .router import integration_router

__all__ = [
    "UnifiedIntegrationService",
    "IntegrationRequest",
    "IntegrationResponse",
    "SportsbookOdds",
    "ExternalDataResponse", 
    "WebhookEvent",
    "AuthenticationResult",
    "integration_router",
]
