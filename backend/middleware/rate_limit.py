"""
Rate Limiting Middleware

Implements token bucket rate limiting with configurable limits per IP address.
Integrates with error taxonomy and metrics collection for monitoring.

Features:
- Token bucket algorithm for smooth rate limiting
- Configurable limits via environment variables  
- Per-IP rate limiting with optional authentication principal support
- Graceful error responses using structured error taxonomy
- Metrics integration for monitoring and alerting
"""

import asyncio
import logging
import time
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


@dataclass
class TokenBucket:
    """Token bucket for rate limiting implementation"""
    capacity: int  # Maximum tokens
    tokens: float  # Current token count
    refill_rate: float  # Tokens per second
    last_refill: float  # Last refill timestamp
    
    def consume(self, tokens_requested: int = 1) -> bool:
        """
        Attempt to consume tokens from the bucket
        
        Args:
            tokens_requested: Number of tokens to consume
            
        Returns:
            True if tokens were consumed, False if insufficient tokens
        """
        # Refill bucket based on time elapsed
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now
        
        # Check if we have enough tokens
        if self.tokens >= tokens_requested:
            self.tokens -= tokens_requested
            return True
        return False
    
    def tokens_remaining(self) -> int:
        """Get current token count"""
        now = time.time()
        elapsed = now - self.last_refill
        current_tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        return int(current_tokens)
    
    def retry_after(self) -> int:
        """Calculate seconds until next token is available"""
        if self.tokens >= 1:
            return 0
        tokens_needed = 1 - self.tokens
        return max(1, int(tokens_needed / self.refill_rate))


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using token bucket algorithm
    """
    
    def __init__(
        self,
        app,
        requests_per_minute: int = 100,
        burst_capacity: Optional[int] = None,
        cleanup_interval: int = 300,  # 5 minutes
        enabled: bool = True,
    ):
        super().__init__(app)
        # Always initialize configuration so middleware can still emit headers
        # even when enforcement is disabled. Tests and monitoring rely on
        # presence of X-RateLimit-* headers for visibility.
        self.enabled = enabled

        # Configuration (always set)
        self.requests_per_minute = requests_per_minute
        self.burst_capacity = burst_capacity or (requests_per_minute * 2)  # 2x burst capacity
        self.refill_rate = requests_per_minute / 60.0  # tokens per second
        self.cleanup_interval = cleanup_interval

        # Storage for token buckets per client
        self.buckets: Dict[str, TokenBucket] = {}
        self.last_cleanup = time.time()

        # Metrics tracking (only attempt when enforcement enabled)
        if self.enabled:
            try:
                self._setup_metrics()
            except Exception:
                # Non-fatal: metrics are optional
                pass

        if not self.enabled:
            logger.info("Rate limiting disabled (no enforcement); headers will still be emitted")
        else:
            logger.info(
                f"Rate limiting enabled: {requests_per_minute}/min, "
                f"burst={self.burst_capacity}, cleanup_interval={cleanup_interval}s"
            )
    
    def _setup_metrics(self):
        """Initialize metrics collectors"""
        try:
            from backend.middleware.prometheus_metrics_middleware import get_metrics_middleware
            
            self.metrics_middleware = get_metrics_middleware()
            if self.metrics_middleware:
                # Try to add rate limit metrics to existing middleware
                # This is a simplified approach - in production you might want dedicated metrics
                logger.info("Rate limit metrics integration enabled")
            else:
                logger.info("No metrics middleware found, rate limit metrics disabled")
        except Exception as e:
            logger.warning(f"Failed to setup rate limit metrics: {e}")
            self.metrics_middleware = None
    
    def _track_rate_limit_metric(self, event_type: str, client_ip: str):
        """Track rate limiting metrics"""
        if not self.metrics_middleware:
            return
            
        try:
            # Use existing error metrics for rate limit drops
            if event_type == "drop" and hasattr(self.metrics_middleware, 'http_errors_total'):
                self.metrics_middleware.http_errors_total.labels(
                    method="unknown",
                    endpoint="rate_limit",
                    error_type="E1200_RATE_LIMIT"
                ).inc()
        except Exception as e:
            logger.warning(f"Failed to track rate limit metric: {e}")
    
    def _get_client_identifier(self, request: Request) -> str:
        """Extract client identifier for rate limiting"""
        # Try to get real IP from forwarded headers
        forwarded_ips = [
            request.headers.get("x-forwarded-for"),
            request.headers.get("x-real-ip"),
            request.headers.get("x-client-ip")
        ]
        
        for ip_header in forwarded_ips:
            # Defensive: tests may mock headers with non-string values (Mock, list, etc.)
            if not ip_header:
                continue

            # If header is a bytes-like or Mock, coerce to str safely
            try:
                # Convert to string representation
                ip_str = str(ip_header)
            except Exception:
                continue

            # Take the first IP if there are multiple
            try:
                return ip_str.split(",")[0].strip()
            except Exception:
                # Fallback to the raw coerced string
                return ip_str.strip()
        
        # Fall back to direct client IP
        if request.client:
            return request.client.host
            
        return "unknown"
    
    def _cleanup_old_buckets(self):
        """Remove old, unused token buckets to prevent memory leaks"""
        if time.time() - self.last_cleanup < self.cleanup_interval:
            return
            
        current_time = time.time()
        expired_keys = []
        
        for client_id, bucket in self.buckets.items():
            # Remove buckets that haven't been used in cleanup_interval
            if current_time - bucket.last_refill > self.cleanup_interval:
                expired_keys.append(client_id)
        
        for key in expired_keys:
            del self.buckets[key]
        
        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired rate limit buckets")
        
        self.last_cleanup = current_time
    
    def _get_or_create_bucket(self, client_id: str) -> TokenBucket:
        """Get existing bucket or create new one for client"""
        if client_id not in self.buckets:
            self.buckets[client_id] = TokenBucket(
                capacity=self.burst_capacity,
                tokens=float(self.burst_capacity),  # Start with full bucket
                refill_rate=self.refill_rate,
                last_refill=time.time()
            )
        
        return self.buckets[client_id]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with rate limiting"""
        # Periodic cleanup
        self._cleanup_old_buckets()

        # If enforcement is disabled, still pass the request through but
        # ensure rate limit headers are added for observability.
        if not self.enabled:
            response = await call_next(request)
            try:
                response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
                # When disabled, present the burst capacity as "remaining" to indicate no enforcement
                response.headers["X-RateLimit-Remaining"] = str(self.burst_capacity)
                response.headers["X-RateLimit-Reset"] = str(int(time.time() + 60))
            except Exception:
                # Best-effort header injection; do not raise if response doesn't support headers
                logger.debug("Failed to inject rate limit headers on disabled middleware (ignored)")
            return response
        # Get client identifier
        client_id = self._get_client_identifier(request)
        
        # Get or create token bucket for this client
        bucket = self._get_or_create_bucket(client_id)
        
    # Try to consume a token
        if not bucket.consume(1):
            # Rate limit exceeded
            logger.warning(
                f"Rate limit exceeded for client {client_id}",
                extra={
                    "client_id": client_id,
                    "path": request.url.path,
                    "method": request.method,
                    "tokens_remaining": bucket.tokens_remaining(),
                    "retry_after": bucket.retry_after()
                }
            )
            
            # Track metrics
            self._track_rate_limit_metric("drop", client_id)
            
            # Return structured rate limit error
            from backend.errors import rate_limit_error
            raise rate_limit_error(
                limit=self.requests_per_minute,
                window=60,
                retry_after=bucket.retry_after()
            )
        
        # Add rate limit info to response headers
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(bucket.tokens_remaining())
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + 60))
        
        return response


def create_rate_limit_middleware(
    requests_per_minute: int = 100,
    burst_capacity: Optional[int] = None,
    cleanup_interval: int = 300,
    enabled: bool = True,
) -> RateLimitMiddleware:
    """
    Factory function to create rate limit middleware with configuration
    
    Args:
        requests_per_minute: Base rate limit (tokens refilled per minute)
        burst_capacity: Maximum burst requests (default: 2x requests_per_minute)
        cleanup_interval: Seconds between bucket cleanup (default: 300)
        enabled: Whether rate limiting is enabled (default: True)
        
    Returns:
        Configured RateLimitMiddleware instance
    """
    return RateLimitMiddleware(
        app=None,  # Will be set by FastAPI
        requests_per_minute=requests_per_minute,
        burst_capacity=burst_capacity,
        cleanup_interval=cleanup_interval,
        enabled=enabled
    )


# Backwards-compatible RateLimiter expected by legacy routes.
# Older modules instantiate RateLimiter(...) without providing `app` and
# then pass the instance as a dependency: `Depends(rate_limiter)`.
# To support that pattern we provide a thin compatibility wrapper that
# preserves configuration attributes but implements an async `__call__`
# so FastAPI can treat it as a dependency. It does not perform actual
# middleware dispatching (the real middleware is still `RateLimitMiddleware`).
class RateLimiter:
    def __init__(
        self,
        requests_per_minute: int = 100,
        burst_capacity: Optional[int] = None,
        cleanup_interval: int = 300,
        enabled: bool = True,
    ):
        self.requests_per_minute = requests_per_minute
        self.burst_capacity = burst_capacity or (requests_per_minute * 2)
        self.cleanup_interval = cleanup_interval
        self.enabled = enabled

    async def __call__(self, request: Request) -> None:
        """FastAPI dependency entrypoint (no-op).

        This compatibility shim intentionally accepts the request and
        returns None so endpoints can declare it as a dependency. The
        active `RateLimitMiddleware` installed on the app continues to
        enforce limits when configured.
        """
        # No-op: legacy code expects this to be a dependency provider.
        return None