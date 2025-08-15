"""
Routes package for A1Betting Backend

This package contains all API route handlers organized by functionality.
"""

# Also import the module itself for backward compatibility
from . import mlb_extras
from .admin import router as admin_router
# from .analytics_routes import router as analytics_router  # Temporarily disabled due to syntax errors
from .auth import router as auth_router
from .betting import router as betting_router
from .diagnostics import router as diagnostics_router
from .health import router as health_router
from .metrics import router as metrics_router
from .mlb_extras import router as mlb_extras_router
from .modern_ml_routes import router as modern_ml_router
from .optimized_routes import router as optimized_router
from .performance import router as performance_router
from .prizepicks import router as prizepicks_router
from .propollama import router as propollama_router
from .user import router as user_router
from .enhanced_search_routes import router as enhanced_search_router

__all__ = [
    "admin_router",
    # "analytics_router",  # Temporarily disabled
    "auth_router",
    "betting_router",
    "diagnostics_router",
    "health_router",
    "metrics_router",
    "mlb_extras_router",
    "mlb_extras",
    "modern_ml_router",
    "optimized_router",
    "performance_router",
    "prizepicks_router",
    "propollama_router",
    "user_router",
    "enhanced_search_router",
]
