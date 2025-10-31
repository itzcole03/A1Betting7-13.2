"""Minimal circuit breaker shim to satisfy imports in archived modules.

This provides a very small CircuitBreaker class used by some legacy code
paths. It's intentionally permissive and only intended to prevent import
errors during tests and import-smoke runs.
"""


class CircuitBreaker:  # pragma: no cover - shim
    def __init__(self, *args, **kwargs):
        self._open = False

    def call(self, fn, *args, **kwargs):
        return fn(*args, **kwargs)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def circuit_breaker(func=None, **kwargs):  # pragma: no cover - shim
    if func is None:

        def _decorator(f):
            return f

        return _decorator
    return func


__all__ = ["CircuitBreaker", "circuit_breaker"]
