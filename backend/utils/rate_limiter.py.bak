"""Rate limiting utility for API endpoints."""

import asyncio
import time
from collections import defaultdict
from typing import DefaultDict, Dict, Optional


class RateLimiter:
    """Rate limiter implementation using sliding window."""

    def __init__(self, window_seconds: int, max_requests: int):
        """Initialize rate limiter.

        Args:
            window_seconds: Time window in seconds
            max_requests: Maximum requests allowed in window
        """
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self.requests: DefaultDict[str, Dict[float, int]] = defaultdict(dict)
        self.cache_hits = 0
        self.total_requests = 0
        self._cleanup_task = None

        # Cleanup task will be started when needed

    async def check_rate_limit(self, key: str) -> bool:
        """Check if request is within rate limit.

        Args:
            key: Identifier for the client (e.g., IP address)

        Returns:
            bool: True if request is allowed, False if rate limit exceeded
        """
        # Start cleanup task on first use
        if self._cleanup_task is None:
            try:
                self._cleanup_task = asyncio.create_task(self._cleanup_old_requests())
            except RuntimeError:
                # No event loop running, cleanup will happen manually
                pass

        self.total_requests += 1
        current_time = time.time()

        # Remove old timestamps
        self._cleanup_old_timestamps(key, current_time)

        # Count recent requests
        recent_requests = sum(
            count
            for timestamp, count in self.requests[key].items()
            if current_time - timestamp < self.window_seconds
        )

        if recent_requests >= self.max_requests:
            return False

        # Add new request
        self.requests[key][current_time] = self.requests[key].get(current_time, 0) + 1
        return True

    async def time_until_reset(self, key: str) -> float:
        """Get time until rate limit resets.

        Args:
            key: Identifier for the client

        Returns:
            float: Seconds until rate limit resets
        """
        if not self.requests[key]:
            return 0.0

        current_time = time.time()
        oldest_timestamp = min(self.requests[key].keys())
        return max(0.0, self.window_seconds - (current_time - oldest_timestamp))

    def _cleanup_old_timestamps(self, key: str, current_time: float) -> None:
        """Remove timestamps outside the window.

        Args:
            key: Identifier for the client
            current_time: Current timestamp
        """
        cutoff_time = current_time - self.window_seconds
        self.requests[key] = {
            ts: count for ts, count in self.requests[key].items() if ts > cutoff_time
        }

    async def _cleanup_old_requests(self) -> None:
        """Periodically clean up old requests."""
        while True:
            current_time = time.time()
            cutoff_time = current_time - self.window_seconds

            # Clean up each key's timestamps
            for key in list(self.requests.keys()):
                self._cleanup_old_timestamps(key, current_time)

                # Remove empty entries
                if not self.requests[key]:
                    del self.requests[key]

            await asyncio.sleep(60)  # Run every minute

    def record_cache_hit(self) -> None:
        """Record a cache hit."""
        self.cache_hits += 1

    def get_cache_hit_rate(self) -> float:
        """Get the cache hit rate.

        Returns:
            float: Cache hit rate (0-1)
        """
        if self.total_requests == 0:
            return 0.0
        return self.cache_hits / self.total_requests
