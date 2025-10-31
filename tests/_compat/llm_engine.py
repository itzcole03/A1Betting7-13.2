"""Minimal shim used for tests: a tiny LLM-like placeholder.

This is a copy of the safe shim that was previously located in
`utils/llm_engine.py`. Centralizing it here makes test-only code easier to
find and remove later.
"""


def load_llm(*args, **kwargs):
    """Return a dummy LLM-like object with a `generate` coroutine."""

    class _DummyLLM:
        async def generate(self, *a, **k):
            return {"text": ""}

    return _DummyLLM()


# Backwards-compatible symbol: some modules import `llm_engine` directly.
# Provide a default instance to satisfy those imports at import-time.
llm_engine = load_llm()
