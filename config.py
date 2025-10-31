"""Top-level compatibility shim for legacy `config` imports.

Many archived/legacy modules attempt to `from config import config_manager`.
Provide a small compatibility layer that proxies to the modern
`backend.config_manager` when available, otherwise exposes a lightweight
fallback object.
"""

try:
    # Prefer the backend implementation when present
    from backend.config_manager import config as config_manager  # type: ignore
    from backend.config_manager import get_config  # type: ignore
except Exception:  # pragma: no cover - fallback for trimmed test env
    import logging

    logging.getLogger(__name__).warning("Using top-level config shim fallback")

    class _FallbackConfig:
        def get(self, *args, **kwargs):
            return None

    config_manager = _FallbackConfig()

    def get_config():
        return config_manager


__all__ = ["config_manager", "get_config"]
