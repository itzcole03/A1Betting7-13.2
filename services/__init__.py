"""Top-level shim for `services` imports used by archived/legacy modules.

This module proxies to `backend.services` when possible, otherwise exposes a
lightweight empty namespace so legacy importers don't error at import-time.
"""

try:
    from backend import services as _backend_services  # type: ignore

    for _name in dir(_backend_services):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_backend_services, _name)

except Exception:
    # Provide an empty namespace with a helpful attribute
    class _EmptyServices:  # pragma: no cover - shim
        pass

    services = _EmptyServices()
    __all__ = ["services"]
