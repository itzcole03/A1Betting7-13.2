"""
LLM Adapters Package

Provides pluggable adapters for different LLM providers with factory pattern.
"""

import os
from typing import Dict, Any, Optional

from .base_adapter import BaseAdapter, LLMResult, UnsupportedProviderError
from .openai_adapter import OpenAIAdapter
from .local_stub_adapter import LocalStubAdapter

from backend.services.unified_config import get_config
from backend.services.unified_logging import get_logger

logger = get_logger("llm_adapters")


def get_llm_adapter(provider: Optional[str] = None, config: Optional[Dict[str, Any]] = None) -> BaseAdapter:
    """
    Factory function to get LLM adapter based on configuration
    
    Args:
        provider: Override provider selection ("openai" | "local_stub")
        config: Override configuration
        
    Returns:
        BaseAdapter: Configured LLM adapter
        
    Raises:
        UnsupportedProviderError: When requested provider is not available
    """
    unified_config = get_config()
    
    # Determine provider from config or parameter
    if not provider:
        provider = getattr(unified_config, 'LLM_PROVIDER', 'local_stub')
    
    # Get configuration
    adapter_config = config or {}
    if hasattr(unified_config, 'llm'):
        # Merge with unified config if available
        adapter_config = {**unified_config.llm.__dict__, **adapter_config}
    
    logger.info(f"Initializing LLM adapter: {provider}")
    
    try:
        if provider == "openai":
            adapter = OpenAIAdapter(adapter_config)
            if not adapter.is_available():
                logger.warning("OpenAI adapter not available, falling back to local stub")
                adapter = LocalStubAdapter(adapter_config)
        elif provider == "local_stub":
            adapter = LocalStubAdapter(adapter_config)
        else:
            raise UnsupportedProviderError(f"Unknown LLM provider: {provider}")
        
        logger.info(f"LLM adapter initialized: {adapter.get_provider_name()}")
        return adapter
        
    except Exception as e:
        logger.error(f"Failed to initialize LLM adapter {provider}: {e}")
        # Fallback to local stub on any error
        logger.info("Falling back to local stub adapter")
        return LocalStubAdapter(adapter_config)


__all__ = [
    "BaseAdapter",
    "LLMResult", 
    "UnsupportedProviderError",
    "OpenAIAdapter",
    "LocalStubAdapter",
    "get_llm_adapter"
]