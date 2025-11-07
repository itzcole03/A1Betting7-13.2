"""
Rate Limiting Service

In-memory leaky bucket rate limiter for protecting costly endpoints including
rationale generation and optimization API calls.
"""

import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
import threading
from functools import wraps

from backend.services.unified_logging import get_logger

logger = get_logger("rate_limiter")


class RateLimitType(Enum):
    """Types of rate limits"""
    REQUESTS_PER_MINUTE = "requests_per_minute"
    REQUESTS_PER_HOUR = "requests_per_hour"
    REQUESTS_PER_DAY = "requests_per_day"
    TOKENS_PER_MINUTE = "tokens_per_minute"
    COST_PER_HOUR = "cost_per_hour"


class RateLimitExceededException(Exception):
    """Exception raised when rate limit is exceeded"""
    
    def __init__(self, limit_type: str, retry_after: int, current_usage: int, limit: int):
        self.limit_type = limit_type
        self.retry_after = retry_after
        self.current_usage = current_usage
        self.limit = limit
        super().__init__(f"Rate limit exceeded: {current_usage}/{limit} {limit_type}. Retry after {retry_after}s")


@dataclass
class RateLimitRule:
    """Configuration for a rate limit rule"""
    rule_type: RateLimitType
    limit: int
    window_seconds: int
    burst_allowance: int = 0  # Additional requests allowed in burst
    reset_interval_seconds: Optional[int] = None  # For token bucket reset
    cost_per_request: float = 1.0  # Cost multiplier for weighted limits
    
    def __post_init__(self):
        if self.reset_interval_seconds is None:
            self.reset_interval_seconds = self.window_seconds


@dataclass
class TokenBucket:
    """Token bucket for rate limiting"""
    capacity: int
    tokens: float
    refill_rate: float  # tokens per second
    last_refill: float
    burst_tokens: int = 0
    
    def consume(self, tokens: int = 1) -> bool:
        """Try to consume tokens from bucket"""
        now = time.time()
        self._refill(now)
        
        total_available = self.tokens + self.burst_tokens
        if total_available >= tokens:
            if self.tokens >= tokens:
                self.tokens -= tokens
            else:
                remaining_tokens = tokens - self.tokens
                self.tokens = 0
                self.burst_tokens -= remaining_tokens
            return True
        return False
    
    def _refill(self, now: float):
        """Refill bucket based on time elapsed"""
        time_passed = now - self.last_refill
        tokens_to_add = time_passed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        self.last_refill = now
    
    def get_available_tokens(self) -> int:
        """Get currently available tokens"""
        now = time.time()
        self._refill(now)
        return int(self.tokens + self.burst_tokens)
    
    def time_until_tokens_available(self, required_tokens: int) -> int:
        """Calculate seconds until required tokens are available"""
        now = time.time()
        self._refill(now)
        
        available = self.tokens + self.burst_tokens
        if available >= required_tokens:
            return 0
        
        needed_tokens = required_tokens - available
        time_needed = needed_tokens / self.refill_rate
        return max(1, int(time_needed))


@dataclass
class LeakyBucket:
    """Leaky bucket for request rate limiting"""
    capacity: int
    leak_rate: float  # requests per second that "leak out"
    current_level: float
    last_leak: float
    
    def add_request(self, weight: float = 1.0) -> bool:
        """Try to add a request to the bucket"""
        now = time.time()
        self._leak(now)
        
        if self.current_level + weight <= self.capacity:
            self.current_level += weight
            return True
        return False
    
    def _leak(self, now: float):
        """Leak requests from bucket"""
        time_passed = now - self.last_leak
        leaked_amount = time_passed * self.leak_rate
        self.current_level = max(0, self.current_level - leaked_amount)
        self.last_leak = now
    
    def time_until_capacity(self, required_capacity: float) -> int:
        """Calculate seconds until required capacity is available"""
        now = time.time()
        self._leak(now)
        
        if self.capacity - self.current_level >= required_capacity:
            return 0
        
        excess = self.current_level + required_capacity - self.capacity
        time_needed = excess / self.leak_rate
        return max(1, int(time_needed))


@dataclass
class RateLimitBucket:
    """Combined rate limiting bucket with multiple algorithms"""
    identifier: str
    token_bucket: Optional[TokenBucket] = None
    leaky_bucket: Optional[LeakyBucket] = None
    request_history: deque = field(default_factory=deque)  # For sliding window
    daily_usage: Dict[str, int] = field(default_factory=dict)  # For daily limits
    hourly_usage: Dict[str, int] = field(default_factory=dict)  # For hourly limits
    last_cleanup: float = field(default_factory=time.time)
    
    def cleanup_old_data(self):
        """Clean up old usage data"""
        now = time.time()
        if now - self.last_cleanup < 300:  # Cleanup every 5 minutes
            return
        
        # Clean request history older than 24 hours
        cutoff = now - 86400
        while self.request_history and self.request_history[0][0] < cutoff:
            self.request_history.popleft()
        
        # Clean old daily usage (keep last 7 days)
        current_date = datetime.now().date()
        old_dates = [
            date_str for date_str in self.daily_usage.keys()
            if (current_date - datetime.strptime(date_str, '%Y-%m-%d').date()).days > 7
        ]
        for date_str in old_dates:
            del self.daily_usage[date_str]
        
        # Clean old hourly usage (keep last 48 hours)
        current_hour = datetime.now().strftime('%Y-%m-%d-%H')
        current_dt = datetime.strptime(current_hour, '%Y-%m-%d-%H')
        old_hours = [
            hour_str for hour_str in self.hourly_usage.keys()
            if (current_dt - datetime.strptime(hour_str, '%Y-%m-%d-%H')).total_seconds() > 172800
        ]
        for hour_str in old_hours:
            del self.hourly_usage[hour_str]
        
        self.last_cleanup = now


@dataclass
class RateLimitStatus:
    """Status of rate limiting for a user/endpoint"""
    allowed: bool
    retry_after_seconds: int = 0
    current_usage: Dict[str, int] = field(default_factory=dict)
    limits: Dict[str, int] = field(default_factory=dict)
    reset_times: Dict[str, datetime] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class InMemoryRateLimiter:
    """In-memory rate limiter with multiple algorithms and endpoint protection"""
    
    def __init__(self):
        self.logger = logger
        self._buckets: Dict[str, RateLimitBucket] = {}
        self._rules: Dict[str, List[RateLimitRule]] = {}
        self._lock = threading.RLock()
        
        # Default rules for different endpoint types
        self._setup_default_rules()
        
        # Metrics
        self.total_requests = 0
        self.rate_limited_requests = 0
        self.last_cleanup = time.time()
        
        # Start cleanup task
        self._start_cleanup_task()
    
    def _setup_default_rules(self):
        """Setup default rate limiting rules for different endpoint categories"""
        
        # Rationale generation endpoints (expensive LLM calls)
        self.set_endpoint_rules("rationale", [
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_MINUTE,
                limit=5,  # 5 requests per minute
                window_seconds=60,
                burst_allowance=2,
                cost_per_request=1.0
            ),
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_HOUR,
                limit=30,  # 30 requests per hour
                window_seconds=3600,
                cost_per_request=1.0
            ),
            RateLimitRule(
                rule_type=RateLimitType.TOKENS_PER_MINUTE,
                limit=10000,  # 10k tokens per minute (estimated)
                window_seconds=60,
                cost_per_request=1000.0  # Average 1k tokens per rationale
            )
        ])
        
        # Portfolio optimization endpoints (computationally expensive)
        self.set_endpoint_rules("optimization", [
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_MINUTE,
                limit=10,  # 10 requests per minute
                window_seconds=60,
                burst_allowance=3,
                cost_per_request=1.0
            ),
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_HOUR,
                limit=60,  # 60 requests per hour
                window_seconds=3600,
                cost_per_request=1.0
            )
        ])
        
        # Admin endpoints (sensitive operations)
        self.set_endpoint_rules("admin", [
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_MINUTE,
                limit=20,  # 20 requests per minute
                window_seconds=60,
                burst_allowance=5,
                cost_per_request=1.0
            ),
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_HOUR,
                limit=100,  # 100 requests per hour
                window_seconds=3600,
                cost_per_request=1.0
            )
        ])
        
        # Factor rebuild endpoints (very expensive)
        self.set_endpoint_rules("factor_rebuild", [
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_HOUR,
                limit=5,  # Only 5 rebuilds per hour
                window_seconds=3600,
                cost_per_request=1.0
            ),
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_DAY,
                limit=20,  # Max 20 rebuilds per day
                window_seconds=86400,
                cost_per_request=1.0
            )
        ])
        
        # Task trigger endpoints
        self.set_endpoint_rules("task_trigger", [
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_MINUTE,
                limit=10,
                window_seconds=60,
                cost_per_request=1.0
            ),
            RateLimitRule(
                rule_type=RateLimitType.REQUESTS_PER_HOUR,
                limit=50,
                window_seconds=3600,
                cost_per_request=1.0
            )
        ])
    
    def set_endpoint_rules(self, endpoint_category: str, rules: List[RateLimitRule]):
        """Set rate limiting rules for an endpoint category"""
        with self._lock:
            self._rules[endpoint_category] = rules
            self.logger.info(f"Set {len(rules)} rate limiting rules for {endpoint_category}")
    
    def get_bucket(self, identifier: str, endpoint_category: str) -> RateLimitBucket:
        """Get or create rate limiting bucket for identifier + endpoint"""
        bucket_key = f"{endpoint_category}:{identifier}"
        
        with self._lock:
            if bucket_key not in self._buckets:
                # Create new bucket with appropriate limits
                rules = self._rules.get(endpoint_category, [])
                
                # Initialize token bucket for requests per minute
                token_bucket = None
                leaky_bucket = None
                
                for rule in rules:
                    if rule.rule_type == RateLimitType.REQUESTS_PER_MINUTE:
                        # Token bucket: capacity = limit + burst, refill rate = limit/window
                        capacity = rule.limit + rule.burst_allowance
                        refill_rate = rule.limit / rule.window_seconds
                        token_bucket = TokenBucket(
                            capacity=capacity,
                            tokens=capacity,
                            refill_rate=refill_rate,
                            last_refill=time.time(),
                            burst_tokens=rule.burst_allowance
                        )
                    elif rule.rule_type == RateLimitType.REQUESTS_PER_HOUR:
                        # Leaky bucket for longer term limits
                        leak_rate = rule.limit / rule.window_seconds
                        leaky_bucket = LeakyBucket(
                            capacity=rule.limit,
                            leak_rate=leak_rate,
                            current_level=0,
                            last_leak=time.time()
                        )
                
                self._buckets[bucket_key] = RateLimitBucket(
                    identifier=bucket_key,
                    token_bucket=token_bucket,
                    leaky_bucket=leaky_bucket
                )
            
            return self._buckets[bucket_key]
    
    def check_rate_limit(
        self,
        identifier: str,
        endpoint_category: str,
        cost: float = 1.0,
        token_count: Optional[int] = None
    ) -> RateLimitStatus:
        """Check if request is allowed under rate limits"""
        
        self.total_requests += 1
        
        with self._lock:
            bucket = self.get_bucket(identifier, endpoint_category)
            bucket.cleanup_old_data()
            
            rules = self._rules.get(endpoint_category, [])
            if not rules:
                # No rules defined, allow request
                return RateLimitStatus(allowed=True)
            
            current_usage = {}
            limits = {}
            reset_times = {}
            max_retry_after = 0
            
            # Check each rate limit rule
            for rule in rules:
                limit_key = rule.rule_type.value
                limits[limit_key] = rule.limit
                
                if rule.rule_type == RateLimitType.REQUESTS_PER_MINUTE:
                    if bucket.token_bucket:
                        tokens_needed = max(1, int(cost * rule.cost_per_request))
                        if not bucket.token_bucket.consume(tokens_needed):
                            retry_after = bucket.token_bucket.time_until_tokens_available(tokens_needed)
                            max_retry_after = max(max_retry_after, retry_after)
                            current_usage[limit_key] = rule.limit  # At limit
                        else:
                            current_usage[limit_key] = rule.limit - bucket.token_bucket.get_available_tokens()
                        
                        # Reset time is when bucket will be full again
                        reset_times[limit_key] = datetime.now() + timedelta(seconds=rule.window_seconds)
                
                elif rule.rule_type == RateLimitType.REQUESTS_PER_HOUR:
                    if bucket.leaky_bucket:
                        weight = cost * rule.cost_per_request
                        if not bucket.leaky_bucket.add_request(weight):
                            retry_after = bucket.leaky_bucket.time_until_capacity(weight)
                            max_retry_after = max(max_retry_after, retry_after)
                            current_usage[limit_key] = rule.limit  # At limit
                        else:
                            current_usage[limit_key] = int(bucket.leaky_bucket.current_level)
                        
                        reset_times[limit_key] = datetime.now() + timedelta(seconds=rule.window_seconds)
                
                elif rule.rule_type == RateLimitType.REQUESTS_PER_DAY:
                    date_key = datetime.now().strftime('%Y-%m-%d')
                    daily_count = bucket.daily_usage.get(date_key, 0)
                    cost_amount = int(cost * rule.cost_per_request)
                    
                    if daily_count + cost_amount > rule.limit:
                        # Calculate retry after (next day)
                        tomorrow = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                        retry_after = int((tomorrow - datetime.now()).total_seconds())
                        max_retry_after = max(max_retry_after, retry_after)
                        current_usage[limit_key] = daily_count
                    else:
                        bucket.daily_usage[date_key] = daily_count + cost_amount
                        current_usage[limit_key] = daily_count + cost_amount
                    
                    reset_times[limit_key] = tomorrow
                
                elif rule.rule_type == RateLimitType.TOKENS_PER_MINUTE:
                    if token_count is not None:
                        # Track token usage in request history
                        now = time.time()
                        window_start = now - rule.window_seconds
                        
                        # Clean old entries
                        while bucket.request_history and bucket.request_history[0][0] < window_start:
                            bucket.request_history.popleft()
                        
                        # Calculate current token usage
                        current_tokens = sum(entry[2] for entry in bucket.request_history if len(entry) > 2)
                        
                        if current_tokens + token_count > rule.limit:
                            # Find when oldest tokens will expire
                            if bucket.request_history:
                                oldest_time = bucket.request_history[0][0]
                                retry_after = max(1, int(oldest_time + rule.window_seconds - now))
                            else:
                                retry_after = rule.window_seconds
                            max_retry_after = max(max_retry_after, retry_after)
                            current_usage[limit_key] = current_tokens
                        else:
                            # Add this request to history
                            bucket.request_history.append((now, cost, token_count))
                            current_usage[limit_key] = current_tokens + token_count
                        
                        reset_times[limit_key] = datetime.now() + timedelta(seconds=rule.window_seconds)
            
            # Check if any limit was exceeded
            if max_retry_after > 0:
                self.rate_limited_requests += 1
                return RateLimitStatus(
                    allowed=False,
                    retry_after_seconds=max_retry_after,
                    current_usage=current_usage,
                    limits=limits,
                    reset_times=reset_times,
                    metadata={
                        "endpoint_category": endpoint_category,
                        "identifier": identifier,
                        "cost": cost,
                        "token_count": token_count
                    }
                )
            
            return RateLimitStatus(
                allowed=True,
                current_usage=current_usage,
                limits=limits,
                reset_times=reset_times,
                metadata={
                    "endpoint_category": endpoint_category,
                    "identifier": identifier,
                    "cost": cost,
                    "token_count": token_count
                }
            )
    
    def _start_cleanup_task(self):
        """Start background cleanup task"""
        def cleanup_loop():
            while True:
                try:
                    time.sleep(300)  # Clean up every 5 minutes
                    self._cleanup_old_buckets()
                except Exception as e:
                    self.logger.error(f"Error in cleanup task: {e}")
        
        cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
        cleanup_thread.start()
    
    def _cleanup_old_buckets(self):
        """Clean up unused buckets"""
        now = time.time()
        if now - self.last_cleanup < 600:  # Only cleanup every 10 minutes
            return
        
        with self._lock:
            # Remove buckets that haven't been accessed in the last hour
            cutoff = now - 3600
            old_keys = []
            
            for key, bucket in self._buckets.items():
                # Check if bucket has recent activity
                has_recent_activity = False
                
                if bucket.request_history:
                    latest_request = bucket.request_history[-1][0]
                    has_recent_activity = latest_request > cutoff
                
                if bucket.token_bucket and bucket.token_bucket.last_refill > cutoff:
                    has_recent_activity = True
                
                if bucket.leaky_bucket and bucket.leaky_bucket.last_leak > cutoff:
                    has_recent_activity = True
                
                if not has_recent_activity:
                    old_keys.append(key)
            
            # Remove old buckets
            for key in old_keys:
                del self._buckets[key]
            
            if old_keys:
                self.logger.info(f"Cleaned up {len(old_keys)} unused rate limit buckets")
        
        self.last_cleanup = now
    
    def get_stats(self) -> Dict[str, Any]:
        """Get rate limiter statistics"""
        with self._lock:
            return {
                "total_requests": self.total_requests,
                "rate_limited_requests": self.rate_limited_requests,
                "rate_limit_percentage": (self.rate_limited_requests / max(1, self.total_requests)) * 100,
                "active_buckets": len(self._buckets),
                "endpoint_rules": {category: len(rules) for category, rules in self._rules.items()},
                "bucket_details": {
                    key: {
                        "request_history_size": len(bucket.request_history),
                        "daily_usage_entries": len(bucket.daily_usage),
                        "hourly_usage_entries": len(bucket.hourly_usage),
                        "token_bucket_tokens": bucket.token_bucket.get_available_tokens() if bucket.token_bucket else None,
                        "leaky_bucket_level": bucket.leaky_bucket.current_level if bucket.leaky_bucket else None
                    }
                    for key, bucket in list(self._buckets.items())[:10]  # First 10 buckets
                }
            }
    
    def reset_user_limits(self, identifier: str, endpoint_category: str) -> bool:
        """Reset rate limits for a specific user/endpoint (admin function)"""
        bucket_key = f"{endpoint_category}:{identifier}"
        
        with self._lock:
            if bucket_key in self._buckets:
                bucket = self._buckets[bucket_key]
                
                # Reset token bucket
                if bucket.token_bucket:
                    bucket.token_bucket.tokens = bucket.token_bucket.capacity
                    bucket.token_bucket.last_refill = time.time()
                
                # Reset leaky bucket
                if bucket.leaky_bucket:
                    bucket.leaky_bucket.current_level = 0
                    bucket.leaky_bucket.last_leak = time.time()
                
                # Clear history
                bucket.request_history.clear()
                bucket.daily_usage.clear()
                bucket.hourly_usage.clear()
                
                self.logger.info(f"Reset rate limits for {identifier} on {endpoint_category}")
                return True
            
            return False


def rate_limit(endpoint_category: str, cost: float = 1.0, extract_identifier = None, token_estimator = None):
    """
    Decorator for applying rate limiting to endpoints
    
    Args:
        endpoint_category: Category of endpoint (rationale, optimization, admin, etc.)
        cost: Cost multiplier for this request
        extract_identifier: Function to extract user identifier from request
        token_estimator: Function to estimate token count for request
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get user identifier
            if extract_identifier:
                identifier = extract_identifier(*args, **kwargs)
            else:
                # Default: try to extract from request or use 'default'
                identifier = "default"
                for arg in args:
                    if hasattr(arg, 'client') and hasattr(arg.client, 'host'):
                        identifier = arg.client.host
                        break
            
            # Estimate token count if function provided
            token_count = None
            if token_estimator:
                token_count = token_estimator(*args, **kwargs)
            
            # Check rate limit
            rate_limiter = get_rate_limiter()
            status = rate_limiter.check_rate_limit(
                identifier=identifier,
                endpoint_category=endpoint_category,
                cost=cost,
                token_count=token_count
            )
            
            if not status.allowed:
                # Create 429 response with rate limit information
                from fastapi import HTTPException
                
                headers = {
                    "Retry-After": str(status.retry_after_seconds),
                    "X-RateLimit-Limit": str(max(status.limits.values()) if status.limits else "Unknown"),
                    "X-RateLimit-Remaining": str(max(0, max(status.limits.values()) - max(status.current_usage.values())) if status.limits and status.current_usage else "0"),
                    "X-RateLimit-Reset": max(status.reset_times.values()).isoformat() if status.reset_times else datetime.now().isoformat()
                }
                
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "retry_after": status.retry_after_seconds,
                        "current_usage": status.current_usage,
                        "limits": status.limits,
                        "reset_times": {k: v.isoformat() for k, v in status.reset_times.items()},
                        "endpoint_category": endpoint_category,
                        "metadata": status.metadata
                    },
                    headers=headers
                )
            
            # Execute the original function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


# Global rate limiter instance
_rate_limiter: Optional[InMemoryRateLimiter] = None


def get_rate_limiter() -> InMemoryRateLimiter:
    """Get the global rate limiter instance"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = InMemoryRateLimiter()
    return _rate_limiter


# Convenience functions for common identifiers
def get_client_ip(request) -> str:
    """Extract client IP from FastAPI request"""
    if hasattr(request, 'client') and request.client:
        return request.client.host
    return "unknown"


def get_user_id_from_headers(request) -> str:
    """Extract user ID from request headers"""
    user_id = request.headers.get("X-User-Id")
    if user_id:
        return user_id
    return get_client_ip(request)


def estimate_rationale_tokens(request_data: Dict[str, Any]) -> int:
    """Estimate token count for rationale generation request"""
    # Simple estimation based on portfolio data size
    portfolio_data = request_data.get('portfolio_data', {})
    selected_props = portfolio_data.get('selected_props', [])
    
    # Base tokens + tokens per prop
    base_tokens = 500  # Base prompt tokens
    tokens_per_prop = 100  # Average tokens per prop
    
    estimated = base_tokens + (len(selected_props) * tokens_per_prop)
    return min(estimated, 10000)  # Cap at 10k tokens