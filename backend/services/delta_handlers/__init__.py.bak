"""
Delta Handlers Package

Provides handlers for market data changes that trigger updates to
valuations, edges, and portfolio optimization.

The delta handlers work in a dependency chain:
1. ValuationDeltaHandler - Updates prop valuations
2. EdgeDeltaHandler - Calculates betting edges (depends on valuations)  
3. PortfolioRefreshHandler - Optimizes portfolio (depends on edges)

All handlers are coordinated by DeltaHandlerManager which subscribes
to market events and routes them to appropriate handlers.
"""

from .base_handler import BaseDeltaHandler, DeltaContext, ProcessingResult
from .valuation_handler import ValuationDeltaHandler
from .edge_handler import EdgeDeltaHandler
from .portfolio_handler import PortfolioRefreshHandler
from .handler_manager import DeltaHandlerManager, delta_handler_manager

__all__ = [
    "BaseDeltaHandler",
    "DeltaContext", 
    "ProcessingResult",
    "ValuationDeltaHandler",
    "EdgeDeltaHandler",
    "PortfolioRefreshHandler",
    "DeltaHandlerManager",
    "delta_handler_manager"
]