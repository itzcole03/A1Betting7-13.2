#!/usr/bin/env python3
"""
Advanced Rate Limiting System

Implements comprehensive rate limiting for API endpoints with:
- Multiple rate limiting strategies
- User-based and IP-based limits
- Dynamic rate adjustment
- Distributed rate limiting support
"""

import time
import redis
import hashlib
import logging
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass
from enum import Enum
from functools import wraps
import json
from datetime import datetime, timedelta

class RateLimitStrategy(Enum):
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    LEAKY_BUCKET = "leaky_bucket"

@dataclass
class RateLimit:
    requests: int
    window_seconds: int
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW
    burst_limit: Optional[int] = None

@dataclass
class RateLimitResult:
    allowed: bool
    requests_remaining: int
    reset_time: float
    retry_after: Optional[int] = None

class AdvancedRateLimiter:
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client or self._create_redis_client()
        self.logger = self.setup_logging()
        
        # Default rate limits for different endpoint types
        self.default_limits = {
            'public': RateLimit(100, 3600),  # 100 requests per hour
            'authenticated': RateLimit(1000, 3600),  # 1000 requests per hour
            'premium': RateLimit(5000, 3600),  # 5000 requests per hour
            'admin': RateLimit(10000, 3600),  # 10000 requests per hour
            'prediction': RateLimit(50, 300),  # 50 predictions per 5 minutes
            'heavy_compute': RateLimit(10, 300),  # 10 heavy operations per 5 minutes
        }
        
        # Endpoint-specific rate limits
        self.endpoint_limits = {
            '/api/predictions/prizepicks': RateLimit(100, 3600, RateLimitStrategy.SLIDING_WINDOW),
            '/api/predictions/prizepicks/batch': RateLimit(10, 3600, RateLimitStrategy.TOKEN_BUCKET, burst_limit=20),
            '/api/auth/login': RateLimit(5, 300, RateLimitStrategy.FIXED_WINDOW),  # Login attempts
            '/api/auth/register': RateLimit(3, 3600, RateLimitStrategy.FIXED_WINDOW),
            '/api/admin/*': RateLimit(500, 3600, RateLimitStrategy.SLIDING_WINDOW),
            '/api/health': RateLimit(1000, 60, RateLimitStrategy.SLIDING_WINDOW),  # Health checks
        }
        
        # IP-based rate limits for additional security
        self.ip_limits = {
            'default': RateLimit(1000, 3600),  # 1000 requests per hour per IP
            'suspicious': RateLimit(10, 3600),  # Reduced limit for suspicious IPs
        }
    
    def _create_redis_client(self) -> redis.Redis:
        """Create Redis client for distributed rate limiting"""
        try:
            return redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
        except Exception as e:
            self.logger.warning(f"Redis connection failed, using in-memory storage: {e}")
            return None
    
    def setup_logging(self) -> logging.Logger:
        """Setup rate limiting logging"""
        logger = logging.getLogger('rate_limiter')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.FileHandler('rate_limiting.log')
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def get_rate_limit_key(self, identifier: str, endpoint: str, limit_type: str = "user") -> str:
        """Generate rate limit key for storage"""
        key_parts = [
            "rate_limit",
            limit_type,
            hashlib.md5(f"{identifier}:{endpoint}".encode()).hexdigest()
        ]
        return ":".join(key_parts)
    
    def check_rate_limit(
        self, 
        identifier: str, 
        endpoint: str, 
        user_tier: str = 'public',
        ip_address: str = None
    ) -> RateLimitResult:
        """Check if request is within rate limits"""
        
        # Get applicable rate limit
        rate_limit = self.get_applicable_limit(endpoint, user_tier)
        
        # Check user-based rate limit
        user_result = self._check_limit(identifier, endpoint, rate_limit, "user")
        
        # Check IP-based rate limit if IP provided
        if ip_address:
            ip_limit = self.ip_limits.get('default')
            ip_result = self._check_limit(ip_address, endpoint, ip_limit, "ip")
            
            # Return the most restrictive result
            if not ip_result.allowed:
                return ip_result
        
        return user_result
    
    def get_applicable_limit(self, endpoint: str, user_tier: str) -> RateLimit:
        """Get the applicable rate limit for endpoint and user tier"""
        
        # Check for exact endpoint match
        if endpoint in self.endpoint_limits:
            return self.endpoint_limits[endpoint]
        
        # Check for wildcard matches
        for pattern, limit in self.endpoint_limits.items():
            if pattern.endswith('*') and endpoint.startswith(pattern[:-1]):
                return limit
        
        # Fall back to user tier default
        return self.default_limits.get(user_tier, self.default_limits['public'])
    
    def _check_limit(
        self, 
        identifier: str, 
        endpoint: str, 
        rate_limit: RateLimit, 
        limit_type: str
    ) -> RateLimitResult:
        """Check specific rate limit using the configured strategy"""
        
        if rate_limit.strategy == RateLimitStrategy.SLIDING_WINDOW:
            return self._check_sliding_window(identifier, endpoint, rate_limit, limit_type)
        elif rate_limit.strategy == RateLimitStrategy.FIXED_WINDOW:
            return self._check_fixed_window(identifier, endpoint, rate_limit, limit_type)
        elif rate_limit.strategy == RateLimitStrategy.TOKEN_BUCKET:
            return self._check_token_bucket(identifier, endpoint, rate_limit, limit_type)
        else:
            # Default to sliding window
            return self._check_sliding_window(identifier, endpoint, rate_limit, limit_type)
    
    def _check_sliding_window(
        self, 
        identifier: str, 
        endpoint: str, 
        rate_limit: RateLimit, 
        limit_type: str
    ) -> RateLimitResult:
        """Implement sliding window rate limiting"""
        key = self.get_rate_limit_key(identifier, endpoint, limit_type)
        current_time = time.time()
        window_start = current_time - rate_limit.window_seconds
        
        if self.redis_client:
            try:
                # Use Redis for distributed rate limiting
                pipe = self.redis_client.pipeline()
                
                # Remove old entries
                pipe.zremrangebyscore(key, 0, window_start)
                
                # Count current requests
                pipe.zcard(key)
                
                # Add current request
                pipe.zadd(key, {str(current_time): current_time})
                
                # Set expiration
                pipe.expire(key, rate_limit.window_seconds)
                
                results = pipe.execute()
                request_count = results[1] + 1  # +1 for current request
                
            except Exception as e:
                self.logger.error(f"Redis error in sliding window check: {e}")
                # Fall back to allowing the request
                return RateLimitResult(True, rate_limit.requests - 1, current_time + rate_limit.window_seconds)
        else:
            # In-memory fallback (not recommended for production)
            request_count = 1  # Simplified for demo
        
        allowed = request_count <= rate_limit.requests
        requests_remaining = max(0, rate_limit.requests - request_count)
        reset_time = current_time + rate_limit.window_seconds
        
        retry_after = None
        if not allowed:
            retry_after = int(rate_limit.window_seconds)
        
        return RateLimitResult(allowed, requests_remaining, reset_time, retry_after)
    
    def _check_fixed_window(
        self, 
        identifier: str, 
        endpoint: str, 
        rate_limit: RateLimit, 
        limit_type: str
    ) -> RateLimitResult:
        """Implement fixed window rate limiting"""
        current_time = time.time()
        window_start = int(current_time // rate_limit.window_seconds) * rate_limit.window_seconds
        
        key = f"{self.get_rate_limit_key(identifier, endpoint, limit_type)}:{window_start}"
        
        if self.redis_client:
            try:
                # Increment counter
                current_count = self.redis_client.incr(key)
                
                # Set expiration on first request
                if current_count == 1:
                    self.redis_client.expire(key, rate_limit.window_seconds)
                
            except Exception as e:
                self.logger.error(f"Redis error in fixed window check: {e}")
                return RateLimitResult(True, rate_limit.requests - 1, window_start + rate_limit.window_seconds)
        else:
            current_count = 1  # Simplified for demo
        
        allowed = current_count <= rate_limit.requests
        requests_remaining = max(0, rate_limit.requests - current_count)
        reset_time = window_start + rate_limit.window_seconds
        
        retry_after = None
        if not allowed:
            retry_after = int(reset_time - current_time)
        
        return RateLimitResult(allowed, requests_remaining, reset_time, retry_after)
    
    def _check_token_bucket(
        self, 
        identifier: str, 
        endpoint: str, 
        rate_limit: RateLimit, 
        limit_type: str
    ) -> RateLimitResult:
        """Implement token bucket rate limiting"""
        key = self.get_rate_limit_key(identifier, endpoint, limit_type)
        current_time = time.time()
        
        bucket_size = rate_limit.burst_limit or rate_limit.requests
        refill_rate = rate_limit.requests / rate_limit.window_seconds
        
        if self.redis_client:
            try:
                # Get current bucket state
                bucket_data = self.redis_client.hgetall(key)
                
                if bucket_data:
                    tokens = float(bucket_data.get('tokens', bucket_size))
                    last_refill = float(bucket_data.get('last_refill', current_time))
                else:
                    tokens = bucket_size
                    last_refill = current_time
                
                # Calculate tokens to add
                time_passed = current_time - last_refill
                tokens_to_add = time_passed * refill_rate
                tokens = min(bucket_size, tokens + tokens_to_add)
                
                # Check if request can be served
                if tokens >= 1:
                    tokens -= 1
                    allowed = True
                else:
                    allowed = False
                
                # Update bucket state
                self.redis_client.hset(key, mapping={
                    'tokens': str(tokens),
                    'last_refill': str(current_time)
                })
                self.redis_client.expire(key, rate_limit.window_seconds * 2)
                
            except Exception as e:
                self.logger.error(f"Redis error in token bucket check: {e}")
                return RateLimitResult(True, rate_limit.requests - 1, current_time + rate_limit.window_seconds)
        else:
            # Simplified in-memory version
            allowed = True
            tokens = bucket_size - 1
        
        requests_remaining = int(tokens)
        reset_time = current_time + rate_limit.window_seconds
        
        retry_after = None
        if not allowed:
            retry_after = int(1 / refill_rate)  # Time to get next token
        
        return RateLimitResult(allowed, requests_remaining, reset_time, retry_after)
    
    def record_request(self, identifier: str, endpoint: str, success: bool = True):
        """Record request for analytics and monitoring"""
        try:
            request_data = {
                'identifier': identifier,
                'endpoint': endpoint,
                'timestamp': time.time(),
                'success': success
            }
            
            # Store in Redis for analytics
            if self.redis_client:
                analytics_key = f"rate_limit_analytics:{datetime.now().strftime('%Y%m%d')}"
                self.redis_client.lpush(analytics_key, json.dumps(request_data))
                self.redis_client.expire(analytics_key, 86400 * 7)  # Keep for 7 days
            
        except Exception as e:
            self.logger.error(f"Error recording request: {e}")
    
    def get_rate_limit_status(self, identifier: str, endpoint: str, user_tier: str = 'public') -> Dict:
        """Get current rate limit status for identifier and endpoint"""
        rate_limit = self.get_applicable_limit(endpoint, user_tier)
        result = self._check_limit(identifier, endpoint, rate_limit, "user")
        
        return {
            'endpoint': endpoint,
            'user_tier': user_tier,
            'rate_limit': {
                'requests': rate_limit.requests,
                'window_seconds': rate_limit.window_seconds,
                'strategy': rate_limit.strategy.value
            },
            'current_status': {
                'allowed': result.allowed,
                'requests_remaining': result.requests_remaining,
                'reset_time': result.reset_time,
                'retry_after': result.retry_after
            }
        }
    
    def clear_rate_limit(self, identifier: str, endpoint: str = None):
        """Clear rate limit for identifier (admin function)"""
        if not self.redis_client:
            return
        
        try:
            if endpoint:
                # Clear specific endpoint
                key = self.get_rate_limit_key(identifier, endpoint, "user")
                self.redis_client.delete(key)
            else:
                # Clear all endpoints for identifier
                pattern = f"rate_limit:user:*{identifier}*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            
            self.logger.info(f"Cleared rate limits for {identifier}")
            
        except Exception as e:
            self.logger.error(f"Error clearing rate limits: {e}")

# Decorator for easy rate limiting
def rate_limit(
    endpoint: str = None, 
    user_tier: str = 'public', 
    identifier_func: callable = None
):
    """Decorator to apply rate limiting to functions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get identifier (this would need to be adapted based on your framework)
            if identifier_func:
                identifier = identifier_func(*args, **kwargs)
            else:
                identifier = "anonymous"  # Default identifier
            
            # Use function name as endpoint if not specified
            endpoint_name = endpoint or f"/{func.__name__}"
            
            # Check rate limit
            limiter = AdvancedRateLimiter()
            result = limiter.check_rate_limit(identifier, endpoint_name, user_tier)
            
            if not result.allowed:
                # This would raise an appropriate HTTP exception in a web framework
                raise Exception(f"Rate limit exceeded. Retry after {result.retry_after} seconds")
            
            # Record the request
            try:
                response = func(*args, **kwargs)
                limiter.record_request(identifier, endpoint_name, True)
                return response
            except Exception as e:
                limiter.record_request(identifier, endpoint_name, False)
                raise
        
        return wrapper
    return decorator

def main():
    """Demo the rate limiting system"""
    print("🔒 Advanced Rate Limiting System")
    print("=" * 40)
    
    limiter = AdvancedRateLimiter()
    
    # Test rate limiting
    test_user = "user123"
    test_endpoint = "/api/predictions/prizepicks"
    
    print(f"Testing rate limits for {test_user} on {test_endpoint}")
    
    for i in range(5):
        result = limiter.check_rate_limit(test_user, test_endpoint, "authenticated")
        print(f"Request {i+1}: Allowed={result.allowed}, Remaining={result.requests_remaining}")
        
        if result.allowed:
            limiter.record_request(test_user, test_endpoint, True)
        else:
            print(f"Rate limited! Retry after {result.retry_after} seconds")
            break
    
    # Show status
    status = limiter.get_rate_limit_status(test_user, test_endpoint, "authenticated")
    print(f"\nRate Limit Status:")
    print(f"  • Requests remaining: {status['current_status']['requests_remaining']}")
    print(f"  • Reset time: {datetime.fromtimestamp(status['current_status']['reset_time'])}")

if __name__ == "__main__":
    main() 