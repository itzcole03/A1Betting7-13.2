"""
Ingestion Models Module

Provides database models and DTOs for the ingestion pipeline.
"""

from .database_models import Player, Prop, MarketQuote, IngestRun
from .dto import (
    RawExternalPropDTO,
    NormalizedPropDTO, 
    IngestResult,
    ErrorDetail,
    PayoutSchema,
    PayoutType,
    PropTypeEnum,
    ProviderHealth
)

__all__ = [
    # Database models
    "Player",
    "Prop", 
    "MarketQuote",
    "IngestRun",
    
    # DTOs
    "RawExternalPropDTO",
    "NormalizedPropDTO",
    "IngestResult",
    "ErrorDetail",
    "PayoutSchema",
    
    # Enums
    "PayoutType",
    "PropTypeEnum",
    
    # Health
    "ProviderHealth"
]