"""Compatibility shim for `feature_cache` used in some legacy imports.
This module exposes a minimal Cache class and fallback functions so import
time references succeed in a trimmed environment.
"""

try:
    from backend.feature_cache import *  # type: ignore
except Exception:  # pragma: no cover - shim fallback
    import logging

    logging.getLogger(__name__).warning("Using feature_cache shim fallback")

    class SimpleFeatureCache:
        def __init__(self):
            self._store = {}

        def get(self, key, default=None):
            return self._store.get(key, default)

        def set(self, key, value):
            self._store[key] = value

    cache = SimpleFeatureCache()

__all__ = ["cache", "SimpleFeatureCache"]
