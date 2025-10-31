"""Shim for optional top-level `feature_flags` module.

This proxies to `backend.feature_flags` if available, otherwise exposes a
minimal FeatureFlags object with permissive defaults to avoid import-time
failures in tests.
"""

try:
    from backend import feature_flags as _backend_feature_flags  # type: ignore

    for _name in dir(_backend_feature_flags):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_backend_feature_flags, _name)

except Exception:

    class FeatureFlags:  # pragma: no cover - shim
        def __init__(self):
            self.enable_live_betting = True
            self.enable_prop_betting = True

        def is_enabled(self, name):
            return True

    feature_flags = FeatureFlags()
    __all__ = ["FeatureFlags", "feature_flags"]
