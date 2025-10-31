"""Top-level utils shim package for lightweight import compatibility.

This package provides small fallbacks for modules under `utils.*` that are
referenced by archived or optional code paths. Replace these with the real
implementations or remove the shim when running in full prod/dev with
dependencies installed.
"""

__all__ = ["llm_engine", "prediction_utils"]
"""Top-level utils shim that proxies to backend.utils when possible.

This makes imports like `import utils` or `from utils import foo` work in
environments where the repo expects a top-level `utils` package.
"""

try:
    from backend import utils as _backend_utils  # type: ignore

    for _name in dir(_backend_utils):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_backend_utils, _name)
except Exception:
    # Minimal fallbacks
    def safe_dumps(obj):
        import json

        return json.dumps(obj, default=str)

    def safe_loads(s):
        import json

        return json.loads(s)

    __all__ = ["safe_dumps", "safe_loads"]
