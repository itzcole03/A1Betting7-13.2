"""Top-level shim for legacy imports of `background_agents`.

This module will prefer the real `backend.background_agents` implementation if
available; otherwise it exposes small no-op functions used by other modules so
imports succeed during tests and import-smoke runs.
"""

try:
    # prefer the packaged implementation
    from backend.background_agents import *  # type: ignore
except Exception:  # pragma: no cover - shim fallback
    import logging

    logging.getLogger(__name__).warning(
        "Using background_agents shim fallback (backend.background_agents missing)"
    )

    def launch_typescript_repair(*args, **kwargs):
        logging.getLogger(__name__).info("shim: launch_typescript_repair called")

    def launch_testing(*args, **kwargs):
        logging.getLogger(__name__).info("shim: launch_testing called")

    def launch_documentation_update(*args, **kwargs):
        logging.getLogger(__name__).info("shim: launch_documentation_update called")

    def launch_analytics_monitoring(*args, **kwargs):
        logging.getLogger(__name__).info("shim: launch_analytics_monitoring called")

    def launch_performance_security_monitoring(*args, **kwargs):
        logging.getLogger(__name__).info(
            "shim: launch_performance_security_monitoring called"
        )
