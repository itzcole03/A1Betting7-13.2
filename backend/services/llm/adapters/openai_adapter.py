"""
OpenAI LLM Adapter - Implementation for OpenAI API integration
"""

import asyncio
import json
import os
import time
from typing import Dict, Any, Optional

import aiohttp

from .base_adapter import BaseAdapter, LLMResult, UnsupportedProviderError
from backend.services.unified_logging import get_logger

logger = get_logger("openai_adapter")


class OpenAIAdapter(BaseAdapter):
    """OpenAI API adapter for LLM generation"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise UnsupportedProviderError("OPENAI_API_KEY environment variable not set")
        
        self.base_url = self.config.get("base_url", "https://api.openai.com/v1")
        self.model = self.config.get("model", "gpt-3.5-turbo")
        self.organization = os.getenv("OPENAI_ORGANIZATION")
        
    def is_available(self) -> bool:
        """Check if OpenAI API key is available"""
        return self.api_key is not None
    
    async def generate(
        self,
        prompt: str,
        *,
        max_tokens: int,
        temperature: float,
        timeout: int
    ) -> LLMResult:
        """Generate text using OpenAI API"""
        start_time = time.time()
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        if self.organization:
            headers["OpenAI-Organization"] = self.organization
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert sports betting analyst providing clear, concise explanations for betting opportunities."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 429:
                        logger.warning("OpenAI API rate limit hit")
                        raise Exception("Rate limit exceeded")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"OpenAI API error {response.status}: {error_text}")
                        raise Exception(f"OpenAI API error: {response.status}")
                    
                    result = await response.json()
                    
        except asyncio.TimeoutError:
            logger.error("OpenAI API request timed out")
            raise Exception("Request timeout")
        except aiohttp.ClientError as e:
            logger.error(f"OpenAI API client error: {e}")
            raise Exception(f"Client error: {e}")
        except Exception as e:
            logger.error(f"OpenAI API unexpected error: {e}")
            raise
        
        # Extract result
        try:
            choice = result["choices"][0]
            content = choice["message"]["content"]
            finish_reason = choice["finish_reason"]
            tokens_used = result.get("usage", {}).get("total_tokens", self._calculate_token_estimate(content))
            
            generation_time_ms = int((time.time() - start_time) * 1000)
            
            return LLMResult(
                content=content,
                tokens_used=tokens_used,
                provider="openai",
                finish_reason=finish_reason,
                generation_time_ms=generation_time_ms,
                model_name=self.model,
                metadata={
                    "usage": result.get("usage", {}),
                    "model": self.model
                }
            )
            
        except KeyError as e:
            logger.error(f"Unexpected OpenAI response format: {e}")
            raise Exception(f"Invalid response format: {e}")