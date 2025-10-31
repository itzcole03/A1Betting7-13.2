"""Thin re-export of the test-only compat shim.

This module forwards to `tests._compat.llm_engine` so the consolidated
compat package is the single place to maintain lightweight shims used in
tests and import-time guarded codepaths.

Note: This file intentionally remains tiny and import-time safe.
"""

try:
    # Import and re-export the small compat shim symbols explicitly.
    from tests._compat.llm_engine import llm_engine, load_llm  # type: ignore

    __all__ = ["llm_engine", "load_llm"]
except (
    Exception
) as _exc:  # pragma: no cover - fallback for non-test environments  # pylint: disable=broad-except
    # If for some reason the compat package is unavailable, provide a
    # minimal fallback to avoid import-time failures in archive codepaths.
    def load_llm(*args, **kwargs):
        class _DummyLLM:
            async def generate(self, *a, **k):
                return {"text": ""}

        return _DummyLLM()

    llm_engine = load_llm()
