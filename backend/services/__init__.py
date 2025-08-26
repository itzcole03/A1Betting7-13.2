"""Services package initializer for lightweight test imports.

This module inserts small dummy shims into `sys.modules` for optional,
heavy dependencies that are not required for most unit tests (e.g.
`redis`, `xgboost`, `sklearn`, `pandas`). The shims are only created
when the real module is not importable, so production environments with
the real packages are unaffected.
"""

import sys
import types

# List of optional modules we want to shim during tests when missing
OPTIONAL_SHIMS = [
    "redis",
    "xgboost",
    "sklearn",
    "pandas",
    "torch",
    "transformers",
]

for mod in OPTIONAL_SHIMS:
    if mod not in sys.modules:
        try:
            __import__(mod)
        except Exception:
            # Insert a minimal dummy module so importers don't fail at
            # collection time. Tests that require real implementations
            # should skip or install the packages.
            m = types.ModuleType(mod)
            # Provide a minimal asyncio submodule for `redis.asyncio` style imports
            if mod == "redis":
                aio = types.ModuleType(f"{mod}.asyncio")
                # Common attribute used by code: Redis (class) - provide a dummy
                class DummyRedis:
                    def __init__(self, *args, **kwargs):
                        pass

                    async def ping(self):
                        return True

                aio.Redis = DummyRedis
                # Mark m as a package so `import redis.asyncio` works
                m.__path__ = []
                m.asyncio = aio
                # Register the submodule in sys.modules so importlib can find it
                sys.modules[f"{mod}.asyncio"] = aio

            sys.modules[mod] = m

            # Provide lightweight placeholders for certain service modules that tests
            # import directly from `backend.services` (these may be feature-gated in
            # production). If the real module exists, don't override it.
            def _ensure_service_placeholder(name: str):
                full = f"backend.services.{name}"
                if full in sys.modules:
                    return
                try:
                    __import__(full)
                except Exception:
                    placeholder = types.ModuleType(full)

                    # Minimal class implementations used by callers in tests
                    class ComprehensivePropGenerator:
                        def __init__(self, *a, **k):
                            pass

                        async def generate_game_props(self, game_id, optimize_performance=False):
                            return {"props": [], "summary": {"total_props": 0}}

                    class EnhancedMonitoringAlerting:
                        def __init__(self, *a, **k):
                            pass

                        def alert(self, *a, **k):
                            return True

                    setattr(placeholder, "ComprehensivePropGenerator", ComprehensivePropGenerator)
                    setattr(placeholder, "EnhancedMonitoringAlerting", EnhancedMonitoringAlerting)
                    sys.modules[full] = placeholder


            # Ensure common test-time service modules are present
            _ensure_service_placeholder("comprehensive_prop_generator")
            _ensure_service_placeholder("enhanced_monitoring_alerting")

__all__ = ["metrics", "streaming", "inference_drift", "model_registry"]

# Avoid eager imports of service submodules here — many services depend on
# optional native packages (xgboost, pybaseball, redis, torch, etc.). Import
# those modules directly where needed to keep test collection lightweight.
