"""
Routes package for A1Betting Backend

This package contains all API route handlers organized by functionality.
"""

from .admin import router as admin_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .betting import router as betting_router
from .diagnostics import router as diagnostics_router
from .health import router as health_router
from .metrics import router as metrics_router
from .performance import router as performance_router
from .prizepicks import router as prizepicks_router
from .propollama import router as propollama_router
from .user import router as user_router

__all__ = [
    "admin_router",
    "analytics_router",
    "auth_router",
    "betting_router",
    "diagnostics_router",
    "health_router",
    "metrics_router",
    "performance_router",
    "prizepicks_router",
    "propollama_router",
    "user_router",
]
