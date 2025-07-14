"""
Rate Limiting Middleware

This module provides rate limiting functionality for the FastAPI application.
"""

import time
from collections import defaultdict
from typing import Any, Awaitable, Callable

from fastapi import Request


class RateLimitMiddleware:
    """Rate limiting middleware for API endpoints"""

    def __init__(self, calls: int = 100, period: int = 60):
        self.calls = calls
        self.period = period
        self.requests = defaultdict(list)

    async def __call__(
        self, request: Request, call_next: Callable[[Request], Awaitable[Any]]
    ) -> Any:
        """Process request with rate limiting"""
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < self.period
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.calls:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )

        # Add current request
        self.requests[client_ip].append(now)

        # Process request
        response = await call_next(request)
        return response 