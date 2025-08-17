"""
Rationale Package Initialization

Provides LLM-driven portfolio rationale and narrative generation services.
"""

from .portfolio_rationale_service import (
    PortfolioRationaleService,
    RationaleType,
    RationaleRequest,
    RationaleResponse,
    portfolio_rationale_service
)

__all__ = [
    "PortfolioRationaleService",
    "RationaleType",
    "RationaleRequest", 
    "RationaleResponse",
    "portfolio_rationale_service"
]