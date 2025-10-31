"""
Backend Configuration Package

Provides centralized configuration management for the A1Betting platform.
"""

from .settings import Settings, get_settings

try:
    # Backwards-compatible alias for older modules that import `config_manager`
    from backend.config_manager import config as config_manager  # type: ignore
except Exception:
    # If backend.config_manager is not available at import time, expose a
    # lightweight placeholder so legacy imports don't fail during test runs.
    class _ConfigShim:
        def get(self, *args, **kwargs):
            return None

    config_manager = _ConfigShim()

__all__ = ["get_settings", "Settings", "config_manager"]
