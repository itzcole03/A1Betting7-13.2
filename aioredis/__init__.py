"""Local aioredis shim for test runtime compatibility.

This package provides a tiny, safe shim that satisfies import sites in the
codebase during tests. It intentionally does not implement full Redis
functionality; it's only enough for modules that import aioredis at import
time so tests can run without installing an incompatible upstream package.
"""
from .client import Redis, StrictRedis

__all__ = ["Redis", "StrictRedis"]
