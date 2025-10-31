"""Shim module for services.async_performance_optimizer.

Proxies to `backend.services.async_performance_optimizer` when available,
otherwise exposes a minimal AsyncPerformanceOptimizer class used by imports.
"""

try:
    from backend.services import async_performance_optimizer as _mod  # type: ignore

    for _n in dir(_mod):
        if not _n.startswith("_"):
            globals()[_n] = getattr(_mod, _n)
except Exception:

    class AsyncPerformanceOptimizer:  # pragma: no cover - shim
        async def optimize(self, *args, **kwargs):
            return None

    async_performance_optimizer = AsyncPerformanceOptimizer()
    __all__ = ["AsyncPerformanceOptimizer", "async_performance_optimizer"]
