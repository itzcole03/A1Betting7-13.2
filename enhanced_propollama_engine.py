"""Top-level shim for `enhanced_propollama_engine` used by legacy imports.

This module attempts to proxy to `backend.enhanced_propollama_engine` if
present; otherwise it provides a small placeholder `EnhancedPropOllamaEngine`
class so import-time references succeed.
"""

try:
    from backend.enhanced_propollama_engine import (
        EnhancedPropOllamaEngine,
    )  # type: ignore
except Exception:  # pragma: no cover - shim fallback
    import logging

    logging.getLogger(__name__).warning(
        "Using enhanced_propollama_engine shim fallback (backend.enhanced_propollama_engine missing)"
    )

    class EnhancedPropOllamaEngine:
        def __init__(self, model_manager=None, *args, **kwargs):
            self.model_manager = model_manager

        async def generate(self, *args, **kwargs):
            """Async placeholder generator.

            Produces an empty result so import-time code paths that call generate()
            won't fail during lightweight test runs.
            """
            return {}
