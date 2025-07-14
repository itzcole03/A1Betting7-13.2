"""
Caching Middleware

This module provides caching functionality with TTL and retry logic.
"""

import asyncio
import logging
import time
from typing import Any, Dict

logger = logging.getLogger(__name__)


# Simple TTL Cache implementation
class TTLCache:
    """Time-to-live cache implementation"""

    def __init__(self, maxsize: int = 1000, ttl: int = 300):
        self.maxsize = maxsize
        self.ttl = ttl
        self.cache: Dict[str, Any] = {}
        self.timestamps: Dict[str, float] = {}

    def __contains__(self, key: Any) -> bool:
        key_str = str(key)
        if key_str in self.cache:
            if time.time() - self.timestamps[key_str] < self.ttl:
                return True
            else:
                del self.cache[key_str]
                del self.timestamps[key_str]
        return False

    def __getitem__(self, key: Any) -> Any:
        key_str = str(key)
        if key in self:
            return self.cache[key_str]
        raise KeyError(key)

    def __setitem__(self, key: Any, value: Any) -> None:
        key_str = str(key)
        if len(self.cache) >= self.maxsize:
            # Remove oldest entries
            oldest_key = min(self.timestamps.keys(), key=lambda k: self.timestamps[k])
            del self.cache[oldest_key]
            del self.timestamps[oldest_key]

        self.cache[key_str] = value
        self.timestamps[key_str] = time.time()


def retry_and_cache(
    cache: TTLCache, max_retries: int = 3, base_delay: float = 1.0
) -> Any:
    """Decorator that provides retry logic and caching for async functions"""
    
    def decorator(func: Any) -> Any:
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Check cache first
            if cache_key in cache:
                logger.debug(f"Cache hit for {func.__name__}")
                return cache[cache_key]
            
            # Retry logic
            last_exception = None
            for attempt in range(max_retries):
                try:
                    result = await func(*args, **kwargs)
                    # Cache the successful result
                    cache[cache_key] = result
                    return result
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)  # Exponential backoff
                        logger.warning(
                            f"Attempt {attempt + 1} failed for {func.__name__}: {e}. "
                            f"Retrying in {delay}s..."
                        )
                        await asyncio.sleep(delay)
                    else:
                        logger.error(f"All {max_retries} attempts failed for {func.__name__}: {e}")
            
            # If all retries failed, raise the last exception
            if last_exception:
                raise last_exception
            
        return wrapper
    return decorator 