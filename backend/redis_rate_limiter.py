import redis.asyncio as redis
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware


class RedisRateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(
        self, app, redis_url, max_requests: int = 100, window_seconds: int = 60
    ):
        super().__init__(app)
        self.redis_url = redis_url
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.redis = None

    async def dispatch(self, request: Request, call_next):
        if self.redis is None:
            self.redis = await redis.from_url(self.redis_url)
        client_ip = request.client.host
        endpoint = request.url.path
        key = f"rate_limit:{client_ip}:{endpoint}"
        current = await self.redis.incr(key)
        if current == 1:
            await self.redis.expire(key, self.window_seconds)
        if current > self.max_requests:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        response = await call_next(request)
        return response
