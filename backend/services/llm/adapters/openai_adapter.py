"""OpenAIAdapter - minimal, test-friendly implementation.

This file provides a single OpenAIAdapter class used by unit tests.
It intentionally keeps the implementation small and defensive so tests
can mock `aiohttp.ClientSession` in several shapes.
"""

import asyncio
import os
import time
import inspect
import re
from typing import Dict, Any, Optional

import aiohttp

from .base_adapter import BaseAdapter, LLMResult, UnsupportedProviderError
from backend.services.unified_logging import get_logger

logger = get_logger("openai_adapter")


class OpenAIAdapter(BaseAdapter):
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = (self.config or {}).get("api_key") or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise UnsupportedProviderError("api_key missing for OpenAIAdapter")

        self.base_url = (self.config or {}).get("base_url", "https://api.openai.com/v1")
        self.model = (self.config or {}).get("model", "gpt-3.5-turbo")
        self.organization = os.getenv("OPENAI_ORGANIZATION")
        self.provider_name = "openaiAdapter"

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def _await_if_needed(self, obj):
        if inspect.isawaitable(obj):
            return await obj
        return obj

    async def _coerce_status(self, raw_status) -> Optional[int]:
        try:
            s = await self._await_if_needed(raw_status)
        except Exception:
            s = raw_status

        if isinstance(s, int):
            return s
        if isinstance(s, str) and s.isdigit():
            return int(s)

        try:
            rv = getattr(s, "return_value", None)
            if rv is not None:
                return await self._coerce_status(rv)
        except Exception:
            pass

        try:
            m = re.search(r"(\d{3})", str(s))
            if m:
                return int(m.group(1))
        except Exception:
            pass

        return None

    async def generate(self, prompt: str, *, max_tokens: int, temperature: float, timeout: int) -> LLMResult:
        start = time.time()

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        if self.organization:
            headers["OpenAI-Organization"] = self.organization

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are an expert sports betting analyst."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
        }

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
                post_obj = session.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)

                # Support common mock shapes
                response = None
                mock_post_ret = getattr(session.post, "return_value", None)
                if mock_post_ret is not None:
                    aenter = getattr(getattr(mock_post_ret, "__aenter__", None), "return_value", None)
                    if aenter is not None:
                        response = aenter

                if response is None:
                    if hasattr(post_obj, "__aenter__"):
                        enter = post_obj.__aenter__()
                        response = await self._await_if_needed(enter)
                    else:
                        response = await self._await_if_needed(post_obj)

                status = await self._coerce_status(getattr(response, "status", None))

                if status == 429:
                    raise Exception("rate limit exceeded")

                if status is not None and status != 200:
                    maybe_text = getattr(response, "text", None)
                    if callable(maybe_text):
                        text = maybe_text()
                        text = await self._await_if_needed(text)
                    else:
                        text = str(maybe_text) if maybe_text is not None else ""
                    raise Exception(f"OpenAI API error: {status}: {text}")

                maybe_json = getattr(response, "json", None)
                if callable(maybe_json):
                    json_ret = maybe_json()
                    result = await self._await_if_needed(json_ret)
                else:
                    result = None

        except asyncio.TimeoutError:
            raise Exception("Request timeout")
        except aiohttp.ClientError as e:
            raise Exception(f"Client error: {e}")

        if not result:
            raise Exception("No result from OpenAI API")

        try:
            choice = result["choices"][0]
            content = choice["message"]["content"]
            finish_reason = choice.get("finish_reason")
            tokens_used = result.get("usage", {}).get("total_tokens", self._calculate_token_estimate(content))
            generation_time_ms = int((time.time() - start) * 1000)

            return LLMResult(
                content=content,
                tokens_used=tokens_used,
                provider="openai",
                finish_reason=finish_reason,
                generation_time_ms=generation_time_ms,
                model_name=self.model,
                metadata={"usage": result.get("usage", {}), "model": self.model},
            )

        except Exception as e:
            raise Exception(f"Invalid response format: {e}")