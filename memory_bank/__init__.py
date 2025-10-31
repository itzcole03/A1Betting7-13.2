"""Shim for optional `memory_bank` module used in autonomous components.

This attempts to proxy to `backend.memory_bank` if present. Otherwise it
provides minimal placeholders so import-time does not fail.
"""

try:
    from backend import memory_bank as _backend_memory_bank  # type: ignore

    for _name in dir(_backend_memory_bank):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_backend_memory_bank, _name)

except Exception:
    # Minimal no-op placeholders
    class MemoryStore:  # pragma: no cover - shim
        def get(self, *a, **k):
            return None

        def set(self, *a, **k):
            return True

    memory_store = MemoryStore()

    __all__ = ["MemoryStore", "memory_store"]
