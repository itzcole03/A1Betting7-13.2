"""
Unified Optimization Service Domain

This module consolidates all optimization and risk management capabilities
into a comprehensive service that provides portfolio optimization, risk assessment,
and strategic recommendations.

Consolidates the following services:
- Quantum optimization algorithms
- Kelly criterion calculations
- Arbitrage detection and optimization
- Risk management and assessment
- Portfolio construction and rebalancing
- Strategic betting recommendations
"""

from .service import UnifiedOptimizationService
from .models import (
    OptimizationRequest,
    OptimizationResponse,
    PortfolioOptimization,
    RiskAssessment,
    KellyRecommendation,
    ArbitrageAnalysis,
)
from .router import optimization_router

__all__ = [
    "UnifiedOptimizationService",
    "OptimizationRequest",
    "OptimizationResponse",
    "PortfolioOptimization",
    "RiskAssessment",
    "KellyRecommendation", 
    "ArbitrageAnalysis",
    "optimization_router",
]
