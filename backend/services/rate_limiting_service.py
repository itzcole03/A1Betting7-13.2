"""
Advanced Rate Limiting Service for A1Betting Backend

Implements Redis-based rate limiting with different tiers for users, admins, and guests.
Provides protection against abuse while allowing legitimate usage.
"""

import logging
import time
from typing import Optional

import redis.asyncio as redis
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.config_manager import A1BettingConfig

logger = logging.getLogger(__name__)


class EnhancedRateLimiter:
    """Enhanced rate limiter with Redis backend and user-based limits"""

    def __init__(self, config: A1BettingConfig):
        self.config = config
        self.redis_client: Optional[redis.Redis] = None

        # Rate limits per minute by user type
        self.limits = {
            "guest": int(config.get("A1BETTING_RATE_LIMIT_PER_MINUTE", "60")),
            "user": int(config.get("A1BETTING_RATE_LIMIT_PER_MINUTE", "60")) * 2,
            "admin": int(config.get("A1BETTING_RATE_LIMIT_ADMIN_PER_MINUTE", "300")),
        }

        # Burst allowance for short spikes - increased for batch operations
        self.burst_limits = {
            "guest": int(
                config.get("A1BETTING_RATE_LIMIT_BURST", "50")
            ),  # Increased from 10 to 50
            "user": int(config.get("A1BETTING_RATE_LIMIT_BURST", "50"))
            * 2,  # 100 for users
            "admin": int(config.get("A1BETTING_RATE_LIMIT_BURST", "50"))
            * 3,  # 150 for admins
        }

        # Endpoint-specific exemptions for batch operations
        self.batch_endpoints = {
            "/api/unified/batch-predictions",
            "/api/mlb/odds-comparison/",
            "/api/sports/activate/",
        }

    async def init_redis(self):
        """Initialize Redis connection for rate limiting"""
        try:
            redis_url = self.config.get(
                "A1BETTING_REDIS_URL", "redis://localhost:6379/0"
            )
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            await self.redis_client.ping()
            logger.info("Rate limiter Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis for rate limiting: {e}")
            self.redis_client = None

    async def is_rate_limited(
        self, identifier: str, user_type: str = "guest", endpoint: Optional[str] = None
    ) -> tuple[bool, dict]:
        """
        Check if request should be rate limited

        Returns:
            tuple: (is_limited, rate_limit_info)
        """
        if not self.redis_client:
            # If Redis is unavailable, allow requests but log warning
            logger.warning("Redis unavailable for rate limiting, allowing request")
            return False, {"remaining": 999, "reset_time": time.time() + 60}

        # Check if this is a development environment (localhost)
        if identifier.startswith("ip:127.0.0.1") or identifier.startswith("ip:::1"):
            logger.debug(f"Allowing localhost request for {endpoint}")
            return False, {"remaining": 999, "reset_time": time.time() + 60}

        try:
            current_time = int(time.time())
            window = 60  # 1 minute window

            # Create unique keys for different time windows
            minute_key = f"rate_limit:{identifier}:{current_time // window}"
            burst_key = f"rate_limit_burst:{identifier}:{current_time // 10}"  # 10-second burst window

            # Get current counts
            async with self.redis_client.pipeline() as pipe:
                pipe.get(minute_key)
                pipe.get(burst_key)
                results = await pipe.execute()

            minute_count = int(results[0] or 0)
            burst_count = int(results[1] or 0)

            # Check limits
            minute_limit = self.limits.get(user_type, self.limits["guest"])
            burst_limit = self.burst_limits.get(user_type, self.burst_limits["guest"])

            # Apply higher limits for batch endpoints
            if endpoint and any(
                batch_ep in endpoint for batch_ep in self.batch_endpoints
            ):
                burst_limit = (
                    burst_limit * 3
                )  # Triple the burst limit for batch operations
                minute_limit = (
                    minute_limit * 2
                )  # Double the minute limit for batch operations
                logger.debug(
                    f"Applied batch endpoint limits: burst={burst_limit}, minute={minute_limit}"
                )

            if burst_count >= burst_limit:
                return True, {
                    "error": "Rate limit exceeded (burst)",
                    "limit": burst_limit,
                    "remaining": 0,
                    "reset_time": ((current_time // 10) + 1) * 10,
                    "window": "10 seconds",
                }

            if minute_count >= minute_limit:
                return True, {
                    "error": "Rate limit exceeded (minute)",
                    "limit": minute_limit,
                    "remaining": 0,
                    "reset_time": ((current_time // window) + 1) * window,
                    "window": "1 minute",
                }

            # Increment counters
            async with self.redis_client.pipeline() as pipe:
                pipe.incr(minute_key)
                pipe.expire(minute_key, window)
                pipe.incr(burst_key)
                pipe.expire(burst_key, 10)
                await pipe.execute()

            return False, {
                "limit": minute_limit,
                "remaining": minute_limit - minute_count - 1,
                "reset_time": ((current_time // window) + 1) * window,
                "window": "1 minute",
            }

        except Exception as e:
            logger.error(f"Rate limiting error for {identifier}: {e}")
            # On error, allow the request
            return False, {"remaining": 999, "reset_time": time.time() + 60}

    async def get_user_type(self, request: Request) -> str:
        """Determine user type from request (guest, user, admin)"""
        try:
            # Check for admin privileges
            if hasattr(request.state, "user") and getattr(
                request.state.user, "is_admin", False
            ):
                return "admin"

            # Check for authenticated user
            if hasattr(request.state, "user") and request.state.user:
                return "user"

            # Default to guest
            return "guest"

        except Exception:
            return "guest"

    def get_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting"""
        try:
            # Use user ID if authenticated
            if hasattr(request.state, "user") and request.state.user:
                user_id = getattr(request.state.user, "id", None)
                if user_id:
                    return f"user:{user_id}"

            # Fall back to IP address
            return f"ip:{get_remote_address(request)}"

        except Exception:
            return f"ip:{get_remote_address(request)}"


# Initialize rate limiter
from backend.config_manager import config

enhanced_rate_limiter = EnhancedRateLimiter(config)

# Create slowapi limiter for basic rate limiting
limiter = Limiter(key_func=get_remote_address)
limiter.enabled = config.get("A1BETTING_ENABLE_RATE_LIMITING", "true").lower() == "true"


async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    if not enhanced_rate_limiter.redis_client:
        await enhanced_rate_limiter.init_redis()

    if limiter.enabled:
        identifier = enhanced_rate_limiter.get_identifier(request)
        user_type = await enhanced_rate_limiter.get_user_type(request)
        endpoint = str(request.url.path)

        is_limited, rate_info = await enhanced_rate_limiter.is_rate_limited(
            identifier, user_type, endpoint
        )

        if is_limited:
            logger.warning(
                f"Rate limit exceeded for {identifier} ({user_type}) on {endpoint}"
            )
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Try again in a few seconds.",
                    **rate_info,
                },
                headers={
                    "X-RateLimit-Limit": str(rate_info.get("limit", 60)),
                    "X-RateLimit-Remaining": str(rate_info.get("remaining", 0)),
                    "X-RateLimit-Reset": str(
                        rate_info.get("reset_time", time.time() + 60)
                    ),
                    "Retry-After": str(
                        max(
                            1,
                            rate_info.get("reset_time", time.time() + 60) - time.time(),
                        )
                    ),
                },
            )

        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(rate_info.get("limit", 60))
        response.headers["X-RateLimit-Remaining"] = str(rate_info.get("remaining", 59))
        response.headers["X-RateLimit-Reset"] = str(
            rate_info.get("reset_time", time.time() + 60)
        )

        return response

    return await call_next(request)


# Rate limit exceeded handler
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    logger.warning(f"Rate limit exceeded for {get_remote_address(request)}")
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": 60,
        },
        headers={
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
        },
    )


# Export for use in main app
__all__ = [
    "limiter",
    "enhanced_rate_limiter",
    "rate_limit_middleware",
    "custom_rate_limit_handler",
]
