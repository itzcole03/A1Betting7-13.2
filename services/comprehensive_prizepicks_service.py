"""Top-level services shim for comprehensive_prizepicks_service.

Proxies to `backend.services.comprehensive_prizepicks_service` when available
otherwise exposes minimal placeholders.
"""

try:
    from backend.services import (
        comprehensive_prizepicks_service as _mod,
    )  # type: ignore

    for _n in dir(_mod):
        if not _n.startswith("_"):
            globals()[_n] = getattr(_mod, _n)
except Exception:

    class ComprehensivePrizePicksService:  # pragma: no cover - shim
        def __init__(self, *a, **k):
            pass

        def initialize(self):
            return None

    comprehensive_prizepicks_service = ComprehensivePrizePicksService()
    __all__ = ["ComprehensivePrizePicksService", "comprehensive_prizepicks_service"]
