"""
LLM Service Package

Provides unified LLM services for edge explanations with pluggable adapters,
caching, rate limiting, and comprehensive error handling.
"""

# Import order is important to avoid circular dependencies
try:
    from .adapters import get_llm_adapter
    from .adapters.base_adapter import BaseAdapter, LLMResult, UnsupportedProviderError
    from .llm_cache import llm_cache
    from .prompt_templates import build_edge_explanation_prompt, EdgeContext
    from .explanation_service import explanation_service
except ImportError as e:
    # Fallback imports for development
    get_llm_adapter = None
    BaseAdapter = None
    LLMResult = None
    UnsupportedProviderError = Exception
    llm_cache = None
    build_edge_explanation_prompt = None
    EdgeContext = None
    explanation_service = None
    print(f"LLM service import warning: {e}")

__all__ = [
    "explanation_service",
    "BaseAdapter", 
    "LLMResult",
    "UnsupportedProviderError",
    "get_llm_adapter",
    "llm_cache",
    "build_edge_explanation_prompt",
    "EdgeContext",
]