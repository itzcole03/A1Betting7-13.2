"""Backend package initializer for test environment."""

import warnings

warnings.filterwarnings(
    "ignore",
    category=UserWarning,
    message="pkg_resources is deprecated as an API.*",
)
warnings.filterwarnings(
    "ignore",
    category=UserWarning,
    module=r"woodwork\.__init__",
)

__all__ = ["services", "routes"]

"""Backend package initializer for test shim compatibility.

Expose common submodules as package attributes to support unittest.mock.patch
targets that reference `backend.<module>` during tests (e.g.,
`backend.system_monitor.SystemMonitor`). This keeps imports flexible for
test-time patching without changing runtime import semantics.
"""

# Export `system_monitor` if present so tests can patch `backend.system_monitor`
try:
    import importlib
    import importlib.util
    from pathlib import Path

    try:
        system_monitor = importlib.import_module("backend.system_monitor")
    except Exception:
        # Fallback: load backend/system_monitor.py directly from the package
        try:
            pkg_dir = Path(__file__).resolve().parent
            sm_path = pkg_dir / "system_monitor.py"
            if sm_path.exists():
                spec = importlib.util.spec_from_file_location(
                    "backend.system_monitor",
                    str(sm_path),
                )
                system_monitor = importlib.util.module_from_spec(spec)
                # Execute module in its own namespace
                spec.loader.exec_module(system_monitor)  # type: ignore
            else:
                raise
        except Exception:
            # Could not load shim; let outer except handle gracefully
            raise

    globals()["system_monitor"] = system_monitor
    __all__.append("system_monitor")
except (
    Exception
):  # pragma: no cover - best-effort compatibility  # pylint: disable=broad-exception-caught
    # If the shim is not available or import fails, silently continue; tests
    # that require it will fail and the shim can be added as needed.
    pass

# Backwards-compatibility module aliases for relocated shims
try:
    import sys

    from . import aioredis as _aioredis  # type: ignore

    sys.modules.setdefault("aioredis", _aioredis)

    from . import background_agents as _background_agents  # type: ignore

    sys.modules.setdefault("background_agents", _background_agents)

    from . import enhanced_propollama_engine as _enhanced_engine  # type: ignore

    sys.modules.setdefault("enhanced_propollama_engine", _enhanced_engine)

    from . import feature_cache as _feature_cache  # type: ignore

    sys.modules.setdefault("feature_cache", _feature_cache)

    from . import config as _config_module  # type: ignore

    sys.modules.setdefault("config", _config_module)

    from . import services as _services_module  # type: ignore

    sys.modules.setdefault("services", _services_module)

    from . import utils as _utils_module  # type: ignore

    sys.modules.setdefault("utils", _utils_module)
except (
    Exception
):  # pragma: no cover - best-effort compatibility  # pylint: disable=broad-exception-caught
    # Best-effort registration; missing optional shims should not break runtime
    pass
