"""Tiny Ollama shim for tests.

This shim provides a synchronous and async interface for the minimal methods
used by the codebase: `generate` and `health`.
"""
from typing import Dict, Any
import asyncio


class OllamaShim:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    async def generate(self, model: str, prompt: str, **kwargs) -> Dict[str, Any]:
        # Deterministic, tiny response useful for tests
        await asyncio.sleep(0)
        return {"model": model, "output": f"echo: {prompt}", "usage": {"tokens": 1}}

    async def health(self) -> Dict[str, Any]:
        await asyncio.sleep(0)
        return {"status": "healthy"}

    # sync wrappers
    def generate_sync(self, model: str, prompt: str, **kwargs) -> Dict[str, Any]:
        return asyncio.get_event_loop().run_until_complete(self.generate(model, prompt, **kwargs))
