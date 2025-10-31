"""Shim for top-level 'agent_planner' expected by some modules.

Proxies to `backend.agent_planner` when available, otherwise provides a
minimal placeholder to keep imports working in tests.
"""

try:
    from backend import agent_planner as _backend_agent_planner  # type: ignore

    for _name in dir(_backend_agent_planner):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_backend_agent_planner, _name)
except Exception:
    # Minimal placeholder
    class AgentPlanner:  # pragma: no cover - shim
        def plan(self, *a, **k):
            return None

    agent_planner = AgentPlanner()
    __all__ = ["agent_planner", "AgentPlanner"]
