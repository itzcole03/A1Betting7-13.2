"""
Rate Limiting Middleware with Retry-After Headers

Implements sliding window rate limiting with proper HTTP status codes
and Retry-After headers for client guidance.

Acceptance Criteria:
- Sliding window rate limiting per IP/user
- 429 status with Retry-After header in seconds
- Different limits for authenticated vs anonymous users
- Graceful degradation during high load
"""

from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Optional, Tuple, Any
import time
import asyncio
from collections import defaultdict, deque
from datetime import datetime, timedelta
import logging

from ..services.unified_logging import unified_logging
from ..services.unified_cache_service import unified_cache_service
from ..services.unified_error_handler import unified_error_handler, ErrorContext

logger = unified_logging.logger


class RateLimitConfig:
    """Rate limiting configuration"""
    
    def __init__(self):
        # Anonymous user limits (per IP)
        self.anonymous_requests_per_minute = 60
        self.anonymous_requests_per_hour = 500
        self.anonymous_burst_limit = 10  # Burst allowance
        
        # Authenticated user limits (per user_id)
        self.authenticated_requests_per_minute = 120
        self.authenticated_requests_per_hour = 2000
        self.authenticated_burst_limit = 20
        
        # API-specific limits
        self.ml_prediction_requests_per_minute = 30
        self.comprehensive_props_requests_per_minute = 20
        self.live_data_requests_per_minute = 100
        
        # Window sizes
        self.minute_window_seconds = 60
        self.hour_window_seconds = 3600
        
        # Rate limit headers
        self.include_rate_limit_headers = True
        self.retry_after_header = True


class SlidingWindowCounter:
    """Sliding window rate limit counter"""
    
    def __init__(self, window_size_seconds: int):
        self.window_size = window_size_seconds
        self.requests = deque()
        self.lock = asyncio.Lock()
    
    async def add_request(self, timestamp: Optional[float] = None) -> int:
        """Add a request and return current count"""
        if timestamp is None:
            timestamp = time.time()
            
        async with self.lock:
            # Remove old requests outside the window
            cutoff = timestamp - self.window_size
            while self.requests and self.requests[0] <= cutoff:
                self.requests.popleft()
            
            # Add new request
            self.requests.append(timestamp)
            return len(self.requests)
    
    async def get_count(self, timestamp: Optional[float] = None) -> int:
        """Get current count without adding a request"""
        if timestamp is None:
            timestamp = time.time()
            
        async with self.lock:
            # Remove old requests outside the window
            cutoff = timestamp - self.window_size
            while self.requests and self.requests[0] <= cutoff:
                self.requests.popleft()
                
            return len(self.requests)
    
    def get_reset_time(self, timestamp: Optional[float] = None) -> float:
        """Get when the oldest request in window will expire"""
        if timestamp is None:
            timestamp = time.time()
            
        if not self.requests:
            return timestamp
            
        return self.requests[0] + self.window_size


class RateLimitTracker:
    """Tracks rate limits for different clients"""
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        
        # Sliding window counters per client
        self.minute_counters: Dict[str, SlidingWindowCounter] = {}
        self.hour_counters: Dict[str, SlidingWindowCounter] = {}
        
        # Endpoint-specific counters
        self.endpoint_counters: Dict[str, SlidingWindowCounter] = {}
        
        # Last cleanup time
        self.last_cleanup = time.time()
        self.cleanup_interval = 300  # 5 minutes
    
    def _get_client_key(self, request: Request) -> Tuple[str, bool]:
        """Get client identifier and authentication status"""
        
        # Check for authenticated user
        auth_header = request.headers.get("authorization", "")
        user_id = None
        
        if auth_header.startswith("Bearer "):
            # Extract user from JWT token (simplified)
            user_id = self._extract_user_from_token(auth_header[7:])
        
        if user_id:
            return f"user:{user_id}", True
        else:
            # Use IP address for anonymous users
            client_ip = request.client.host if request.client else "unknown"
            return f"ip:{client_ip}", False
    
    def _extract_user_from_token(self, token: str) -> Optional[str]:
        """Extract user ID from JWT token (simplified implementation)"""
        try:
            # This would use proper JWT validation in production
            # For now, return a placeholder
            if len(token) > 10:
                return f"user_{hash(token) % 10000}"
            return None
        except Exception:
            return None
    
    def _get_endpoint_key(self, request: Request) -> str:
        """Get endpoint-specific rate limit key"""
        path = request.url.path
        
        if "/api/modern-ml/" in path:
            return "ml_predictions"
        elif "/mlb/comprehensive-props/" in path:
            return "comprehensive_props" 
        elif "/mlb/live-" in path:
            return "live_data"
        else:
            return "general"
    
    async def _cleanup_old_counters(self):
        """Remove unused counters to prevent memory leaks"""
        current_time = time.time()
        
        if current_time - self.last_cleanup < self.cleanup_interval:
            return
            
        self.last_cleanup = current_time
        
        # Remove counters with no recent activity
        cutoff = current_time - self.config.hour_window_seconds
        
        for counters in [self.minute_counters, self.hour_counters, self.endpoint_counters]:
            keys_to_remove = []
            
            for key, counter in counters.items():
                if not counter.requests or counter.requests[-1] < cutoff:
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del counters[key]
    
    async def check_rate_limit(self, request: Request) -> Tuple[bool, Dict[str, Any]]:
        """Check if request should be rate limited"""
        
        await self._cleanup_old_counters()
        
        client_key, is_authenticated = self._get_client_key(request)
        endpoint_key = self._get_endpoint_key(request)
        current_time = time.time()
        
        # Get or create counters
        if client_key not in self.minute_counters:
            self.minute_counters[client_key] = SlidingWindowCounter(
                self.config.minute_window_seconds
            )
        
        if client_key not in self.hour_counters:
            self.hour_counters[client_key] = SlidingWindowCounter(
                self.config.hour_window_seconds
            )
        
        endpoint_counter_key = f"{client_key}:{endpoint_key}"
        if endpoint_counter_key not in self.endpoint_counters:
            self.endpoint_counters[endpoint_counter_key] = SlidingWindowCounter(
                self.config.minute_window_seconds
            )
        
        # Get current counts
        minute_count = await self.minute_counters[client_key].get_count(current_time)
        hour_count = await self.hour_counters[client_key].get_count(current_time)
        endpoint_count = await self.endpoint_counters[endpoint_counter_key].get_count(current_time)
        
        # Determine limits based on authentication
        if is_authenticated:
            minute_limit = self.config.authenticated_requests_per_minute
            hour_limit = self.config.authenticated_requests_per_hour
        else:
            minute_limit = self.config.anonymous_requests_per_minute
            hour_limit = self.config.anonymous_requests_per_hour
        
        # Check endpoint-specific limits
        endpoint_limit = self._get_endpoint_limit(endpoint_key)
        
        # Check all limits
        rate_limit_info = {
            "client_key": client_key,
            "is_authenticated": is_authenticated,
            "minute_count": minute_count,
            "minute_limit": minute_limit,
            "hour_count": hour_count, 
            "hour_limit": hour_limit,
            "endpoint_count": endpoint_count,
            "endpoint_limit": endpoint_limit,
            "endpoint_key": endpoint_key
        }
        
        # Check for violations
        if minute_count >= minute_limit:
            rate_limit_info["violation"] = "minute_limit"
            rate_limit_info["retry_after"] = int(
                self.minute_counters[client_key].get_reset_time(current_time) - current_time + 1
            )
            return False, rate_limit_info
        
        if hour_count >= hour_limit:
            rate_limit_info["violation"] = "hour_limit"  
            rate_limit_info["retry_after"] = int(
                self.hour_counters[client_key].get_reset_time(current_time) - current_time + 1
            )
            return False, rate_limit_info
        
        if endpoint_count >= endpoint_limit:
            rate_limit_info["violation"] = "endpoint_limit"
            rate_limit_info["retry_after"] = int(
                self.endpoint_counters[endpoint_counter_key].get_reset_time(current_time) - current_time + 1
            )
            return False, rate_limit_info
        
        # No violations - record the request
        await self.minute_counters[client_key].add_request(current_time)
        await self.hour_counters[client_key].add_request(current_time)
        await self.endpoint_counters[endpoint_counter_key].add_request(current_time)
        
        rate_limit_info["retry_after"] = None
        return True, rate_limit_info
    
    def _get_endpoint_limit(self, endpoint_key: str) -> int:
        """Get rate limit for specific endpoint"""
        limits = {
            "ml_predictions": self.config.ml_prediction_requests_per_minute,
            "comprehensive_props": self.config.comprehensive_props_requests_per_minute,
            "live_data": self.config.live_data_requests_per_minute,
            "general": 120  # Default limit
        }
        return limits.get(endpoint_key, 120)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, app, config: Optional[RateLimitConfig] = None):
        super().__init__(app)
        self.config = config or RateLimitConfig()
        self.tracker = RateLimitTracker(self.config)
        self.logger = logger
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        
        try:
            # Check rate limit
            allowed, rate_info = await self.tracker.check_rate_limit(request)
            
            if not allowed:
                # Rate limit exceeded
                retry_after = rate_info.get("retry_after", 60)
                
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Rate limit exceeded",
                        "message": f"Too many requests. Try again in {retry_after} seconds.",
                        "violation_type": rate_info.get("violation", "unknown"),
                        "retry_after_seconds": retry_after
                    }
                )
                
                # Add rate limit headers
                if self.config.include_rate_limit_headers:
                    self._add_rate_limit_headers(response, rate_info, allowed=False)
                
                # Add Retry-After header
                if self.config.retry_after_header:
                    response.headers["Retry-After"] = str(retry_after)
                
                # Log rate limit violation
                self.logger.warning(f"Rate limit exceeded", extra={
                    "client_key": rate_info.get("client_key"),
                    "violation": rate_info.get("violation"),
                    "retry_after": retry_after,
                    "path": request.url.path,
                    "method": request.method
                })
                
                return response
            
            # Process request normally
            response = await call_next(request)
            
            # Add rate limit headers to successful responses
            if self.config.include_rate_limit_headers:
                self._add_rate_limit_headers(response, rate_info, allowed=True)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Rate limiting error: {e}")
            unified_error_handler.handle_error(
                e, 
                ErrorContext(endpoint="rate_limiting_middleware", method="dispatch")
            )
            
            # Continue without rate limiting on error
            return await call_next(request)
    
    def _add_rate_limit_headers(self, response: Response, rate_info: Dict, allowed: bool):
        """Add rate limiting headers to response"""
        
        if allowed:
            # Add current usage headers
            response.headers["X-RateLimit-Limit-Minute"] = str(rate_info.get("minute_limit", 0))
            response.headers["X-RateLimit-Remaining-Minute"] = str(
                max(0, rate_info.get("minute_limit", 0) - rate_info.get("minute_count", 0))
            )
            response.headers["X-RateLimit-Limit-Hour"] = str(rate_info.get("hour_limit", 0))
            response.headers["X-RateLimit-Remaining-Hour"] = str(
                max(0, rate_info.get("hour_limit", 0) - rate_info.get("hour_count", 0))
            )
            
            # Reset times
            reset_time = int(time.time()) + 60  # Next minute reset
            response.headers["X-RateLimit-Reset"] = str(reset_time)
            
        response.headers["X-RateLimit-Policy"] = "sliding-window"