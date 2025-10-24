"""Minimal aioredis.client shim used for tests.

Provides placeholder Redis and StrictRedis classes and a TimeoutError alias
to avoid import-time errors from the real aioredis package in this test
environment.
"""
import asyncio

class Redis:
    """Placeholder Redis client."""
    def __init__(self, *args, **kwargs):
        pass

class StrictRedis(Redis):
    """Placeholder StrictRedis client alias."""
    pass

# Provide a TimeoutError that doesn't duplicate asyncio.TimeoutError bases.
class RedisError(Exception):
    pass

class TimeoutError(RedisError):
    pass

__all__ = ["Redis", "StrictRedis", "RedisError", "TimeoutError"]
