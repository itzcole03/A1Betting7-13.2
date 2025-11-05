"""Compatibility shim for top-level `database` imports used in some modules.

This file attempts to proxy to `backend.database` when available. If the
real implementation is not present in the running environment, it provides
minimal no-op placeholders so importing modules won't fail at import-time.
"""

import sys

try:
    # Prefer the backend implementation if available
    from backend import database as _backend_database  # type: ignore

    # Export everything non-private from backend.database
    for _name in dir(_backend_database):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_backend_database, _name)

except Exception:
    # Minimal safe fallbacks
    def get_engine(*args, **kwargs):
        raise RuntimeError(
            "database shim: backend.database not available in this environment"
        )

    class Session:  # pragma: no cover - shim
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    __all__ = ["get_engine", "Session"]
