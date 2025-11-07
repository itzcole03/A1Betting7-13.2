"""
Base LLM Adapter - Abstract interface for LLM providers
"""

import hashlib
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, Optional


class UnsupportedProviderError(Exception):
    """Raised when the requested LLM provider is not available"""
    pass


@dataclass
class LLMResult:
    """Result from LLM generation"""
    content: str
    tokens_used: int
    provider: str
    finish_reason: str
    generation_time_ms: Optional[int] = None
    model_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class BaseAdapter(ABC):
    """Abstract base class for LLM adapters"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.provider_name = self.__class__.__name__.replace('Adapter', '').lower()
        
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        *,
        max_tokens: int,
        temperature: float,
        timeout: int
    ) -> LLMResult:
        """Generate text using the LLM provider"""
        pass
    
    def get_provider_name(self) -> str:
        """Get the provider name for this adapter"""
        return self.provider_name
    
    def is_available(self) -> bool:
        """Check if this provider is available"""
        return True
    
    def _calculate_token_estimate(self, text: str) -> int:
        """Rough token estimation (words / 0.75)"""
        words = len(text.split())
        return int(words / 0.75)
    
    def _generate_request_hash(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate a hash for request caching"""
        content = f"{prompt}|{max_tokens}|{temperature}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]