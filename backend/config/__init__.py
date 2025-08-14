"""
Backend Configuration Package

Provides centralized configuration management for the A1Betting platform.
"""

from .settings import get_settings, Settings

__all__ = ["get_settings", "Settings"]
