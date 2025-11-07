"""Circuit breaker utility for resilient external service calls."""

import asyncio
import time
from typing import Callable, Any, Optional

class CircuitBreaker:
    """Circuit breaker for external service calls."""
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def _current_time(self) -> float:
        return time.time()

    def _can_attempt(self) -> bool:
        if self.state == "OPEN":
            if self.last_failure_time and (self._current_time() - self.last_failure_time) > self.recovery_timeout:
                self.state = "HALF_OPEN"
                return True
            return False
        return True

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        if not self._can_attempt():
            raise RuntimeError("Circuit breaker is OPEN. Requests are temporarily blocked.")
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e

    def _on_success(self):
        if self.state in ("OPEN", "HALF_OPEN"):
            self.state = "CLOSED"
        self.failure_count = 0
        self.last_failure_time = None

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = self._current_time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"

    def status(self) -> dict:
        return {
            "state": self.state,
            "failure_count": self.failure_count,
            "last_failure_time": self.last_failure_time,
            "recovery_timeout": self.recovery_timeout
        } 