"""
Caching Middleware

This module provides caching functionality with TTL and retry logic.
"""

import asyncio
import functools
import os
import inspect
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
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Create cache key from function name and arguments
            # Only include primitive-serializable args to avoid non-deterministic
            # representations (like service objects or ASGI app instances).
            def _primitives(obj):
                if isinstance(obj, (str, int, float, bool, type(None))):
                    return obj
                # Lists/tuples -> tuple of primitives
                if isinstance(obj, (list, tuple)):
                    return tuple(_primitives(x) for x in obj)
                if isinstance(obj, dict):
                    return tuple(sorted((k, _primitives(v)) for k, v in obj.items()))
                # Fallback to a stable identifier for complex objects
                # Use the class name rather than the instance repr to avoid
                # memory-address variability between calls which breaks cache keys.
                try:
                    return obj.__class__.__name__
                except Exception:
                    return str(type(obj))

            try:
                # Include TESTING flag in cache key so test runs that patch
                # dependencies won't collide with previously cached results.
                testing_flag = os.getenv("TESTING", "false").lower()
                key_parts = [f"TESTING={testing_flag}", func.__name__]
                for a in args:
                    key_parts.append(str(_primitives(a)))
                for k, v in sorted(kwargs.items()):
                    key_parts.append(f"{k}={_primitives(v)}")
                cache_key = ":".join(key_parts)
            except Exception:
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
            
        # Preserve original signature so FastAPI sees the correct parameters
        try:
            wrapper.__signature__ = inspect.signature(func)
        except Exception:
            pass

        return wrapper
    return decorator 


def cache_response(cache_or_func=None, max_retries: int = 3, base_delay: float = 1.0, expire_time: int | None = None, **kwargs) -> Any:
    """Flexible decorator to support legacy usage patterns.

    Usage patterns supported:
    - `@cache_response` (no args)
    - `@cache_response(expire_time=30)` (with kwargs)
    - `@cache_response(cache_instance)` (explicit cache instance)

    When called without an explicit `TTLCache`, a new `TTLCache` is
    created per-decorator with `ttl=expire_time` (or default 300s).
    """

    # Case: used as `@cache_response` without args
    if callable(cache_or_func) and not isinstance(cache_or_func, TTLCache):
        cache = TTLCache(ttl=expire_time or 300)
        return retry_and_cache(cache=cache, max_retries=max_retries, base_delay=base_delay)(cache_or_func)

    # Case: explicitly passed a TTLCache instance: `@cache_response(cache_instance)`
    if isinstance(cache_or_func, TTLCache):
        return retry_and_cache(cache=cache_or_func, max_retries=max_retries, base_delay=base_delay)

    # Case: used as `@cache_response(expire_time=30)` -> return decorator factory
    def decorator_factory(func: Any) -> Any:
        cache = TTLCache(ttl=expire_time or 300)
        wrapped = retry_and_cache(cache=cache, max_retries=max_retries, base_delay=base_delay)(func)
        try:
            wrapped.__signature__ = inspect.signature(func)
        except Exception:
            pass
        return wrapped

    return decorator_factory