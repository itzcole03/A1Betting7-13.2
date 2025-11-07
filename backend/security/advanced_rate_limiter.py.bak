"""
Advanced Rate Limiting System with Token Bucket Algorithm

This module implements sophisticated rate limiting using token bucket algorithm
with per-IP and per-user tracking, burst capacity, and sliding windows.
Designed for high-performance scenarios with minimal memory footprint.
"""

import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple
from enum import Enum
import json
import hashlib

from fastapi import Request
from pydantic import BaseModel

from backend.services.unified_config import unified_config
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import unified_logging

logger = unified_logging.logger

class RateLimitType(Enum):
    """Types of rate limiting"""
    IP = "ip"
    USER = "user"
    ENDPOINT = "endpoint"
    GLOBAL = "global"

@dataclass
class TokenBucket:
    """Token bucket for rate limiting with burst capacity"""
    capacity: int  # Maximum tokens in bucket
    refill_rate: float  # Tokens per second refill rate
    current_tokens: float  # Current tokens available
    last_refill: float  # Timestamp of last refill
    burst_capacity: int  # Additional burst tokens allowed
    burst_tokens: int  # Current burst tokens used
    
    def __post_init__(self):
        """Initialize bucket with full capacity"""
        if self.current_tokens is None:
            self.current_tokens = self.capacity
        if not hasattr(self, 'burst_tokens'):
            self.burst_tokens = 0
    
    def refill(self) -> None:
        """Refill tokens based on elapsed time"""
        now = time.time()
        elapsed = now - self.last_refill
        
        if elapsed > 0:
            # Calculate tokens to add
            tokens_to_add = elapsed * self.refill_rate
            self.current_tokens = min(self.capacity, self.current_tokens + tokens_to_add)
            
            # Reset burst tokens periodically (every minute)
            if elapsed > 60:
                self.burst_tokens = 0
            
            self.last_refill = now
    
    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens from bucket
        
        Args:
            tokens: Number of tokens to consume
            
        Returns:
            True if tokens were consumed, False if insufficient tokens
        """
        self.refill()
        
        # Try to consume from regular capacity first
        if self.current_tokens >= tokens:
            self.current_tokens -= tokens
            return True
        
        # Try to use burst capacity if available
        burst_needed = tokens - self.current_tokens
        if (self.burst_tokens + int(burst_needed)) <= self.burst_capacity:
            self.burst_tokens += int(burst_needed)
            self.current_tokens = 0
            return True
        
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current bucket status"""
        self.refill()
        return {
            "capacity": self.capacity,
            "current_tokens": self.current_tokens,
            "refill_rate": self.refill_rate,
            "burst_capacity": self.burst_capacity,
            "burst_tokens_used": self.burst_tokens,
            "utilization_percent": ((self.capacity - self.current_tokens) / self.capacity) * 100
        }

@dataclass 
class RateLimitRule:
    """Rate limiting rule configuration"""
    requests_per_minute: int
    burst_capacity: int
    window_seconds: int = 60
    enabled: bool = True
    priority: int = 0  # Higher priority rules override lower priority
    
class RateLimitResult:
    """Result of rate limit check"""
    
    def __init__(self, allowed: bool, reason: str = "", retry_after: Optional[int] = None,
                 remaining: Optional[int] = None, limit: Optional[int] = None):
        self.allowed = allowed
        self.reason = reason
        self.retry_after = retry_after  # Seconds to wait before retrying
        self.remaining = remaining  # Remaining requests in window
        self.limit = limit  # Total limit for this window
        
class AdvancedRateLimiter:
    """
    Advanced rate limiting system with token bucket algorithm and sliding windows
    """
    
    def __init__(self):
        """Initialize the rate limiter"""
        self.config = unified_config
        self.error_handler = unified_error_handler
        
        # Token buckets for different limit types
        self._ip_buckets: Dict[str, TokenBucket] = {}
        self._user_buckets: Dict[str, TokenBucket] = {}
        self._endpoint_buckets: Dict[str, TokenBucket] = {}
        self._global_bucket: Optional[TokenBucket] = None
        
        # Rate limit rules by endpoint pattern
        self._endpoint_rules: Dict[str, RateLimitRule] = {}
        
        # Sliding window tracking for additional metrics
        self._request_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        
        # Default configurations
        self.default_ip_limit = 60  # requests per minute
        self.default_user_limit = 120  # requests per minute  
        self.default_burst_multiplier = 2.0  # burst = limit * multiplier
        
        # Cleanup tracking
        self._last_cleanup = time.time()
        self._cleanup_interval = 300  # 5 minutes
        
        # Initialize default rules
        self._init_default_rules()
        
        # Start background cleanup task if an event loop is running.
        try:
            asyncio.create_task(self._periodic_cleanup())
        except RuntimeError:
            # No running event loop (likely during test collection); skip background task.
            logger.debug("No running event loop; background cleanup task not started")
        
        logger.info("Advanced rate limiter initialized")
    
    def _init_default_rules(self) -> None:
        """Initialize default rate limiting rules"""
        # Authentication endpoints (stricter limits)
        self.add_endpoint_rule(
            "/api/auth/*",
            RateLimitRule(
                requests_per_minute=10,
                burst_capacity=20,
                priority=10
            )
        )
        
        # Admin endpoints (moderate limits)
        self.add_endpoint_rule(
            "/api/admin/*",
            RateLimitRule(
                requests_per_minute=30,
                burst_capacity=50,
                priority=9
            )
        )
        
        # Security endpoints (strict limits)
        self.add_endpoint_rule(
            "/api/security/*",
            RateLimitRule(
                requests_per_minute=20,
                burst_capacity=30,
                priority=9
            )
        )
        
        # ML/AI endpoints (moderate limits due to computational cost)
        self.add_endpoint_rule(
            "/api/v2/ml/*",
            RateLimitRule(
                requests_per_minute=50,
                burst_capacity=100,
                priority=7
            )
        )
        
        # Data endpoints (higher limits)
        self.add_endpoint_rule(
            "/api/v2/sports/*",
            RateLimitRule(
                requests_per_minute=100,
                burst_capacity=200,
                priority=5
            )
        )
        
        # Public health endpoints (very high limits)
        self.add_endpoint_rule(
            "/api/health",
            RateLimitRule(
                requests_per_minute=300,
                burst_capacity=500,
                priority=1
            )
        )
    
    def add_endpoint_rule(self, pattern: str, rule: RateLimitRule) -> None:
        """Add rate limiting rule for endpoint pattern"""
        self._endpoint_rules[pattern] = rule
        logger.info(f"Added rate limit rule for {pattern}: {rule.requests_per_minute}/min")
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request with proxy header support"""
        # Check X-Forwarded-For header (proxy/load balancer)
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            # Take the first IP (original client)
            return forwarded_for.split(',')[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        
        # Check CF-Connecting-IP (Cloudflare)
        cf_ip = request.headers.get('CF-Connecting-IP')
        if cf_ip:
            return cf_ip.strip()
        
        # Fallback to direct connection IP
        if request.client:
            return request.client.host
        
        return 'unknown'
    
    def _get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from request (from JWT token or session)"""
        # Try to get from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                # This is a simplified extraction - in practice you'd
                # properly decode the JWT token
                token = auth_header[7:]  # Remove 'Bearer ' prefix
                # For now, return a hash of the token as user identifier
                return hashlib.sha256(token.encode()).hexdigest()[:16]
            except Exception:
                pass
        
        # Try to get from session cookie
        session_cookie = request.cookies.get('session_id')
        if session_cookie:
            return hashlib.sha256(session_cookie.encode()).hexdigest()[:16]
        
        return None
    
    def _find_matching_rule(self, path: str) -> Optional[RateLimitRule]:
        """Find the highest priority matching rule for a path"""
        matching_rules = []
        
        for pattern, rule in self._endpoint_rules.items():
            if self._path_matches_pattern(path, pattern):
                matching_rules.append(rule)
        
        if not matching_rules:
            return None
        
        # Return highest priority rule
        return max(matching_rules, key=lambda r: r.priority)
    
    def _path_matches_pattern(self, path: str, pattern: str) -> bool:
        """Check if path matches pattern (supports wildcards)"""
        import re
        
        # Convert pattern to regex
        # Replace * with .* and escape other regex chars
        regex_pattern = re.escape(pattern).replace(r'\*', '.*')
        regex_pattern = f'^{regex_pattern}$'
        
        try:
            return bool(re.match(regex_pattern, path))
        except re.error:
            return False
    
    def _get_or_create_ip_bucket(self, ip: str, rule: RateLimitRule) -> TokenBucket:
        """Get or create token bucket for IP address"""
        if ip not in self._ip_buckets:
            self._ip_buckets[ip] = TokenBucket(
                capacity=rule.requests_per_minute,
                refill_rate=rule.requests_per_minute / 60.0,  # tokens per second
                current_tokens=rule.requests_per_minute,
                last_refill=time.time(),
                burst_capacity=rule.burst_capacity,
                burst_tokens=0
            )
        return self._ip_buckets[ip]
    
    def _get_or_create_user_bucket(self, user_id: str, rule: RateLimitRule) -> TokenBucket:
        """Get or create token bucket for user"""
        if user_id not in self._user_buckets:
            # Users typically get higher limits than IPs
            user_limit = max(rule.requests_per_minute, self.default_user_limit)
            user_burst = max(rule.burst_capacity, int(user_limit * self.default_burst_multiplier))
            
            self._user_buckets[user_id] = TokenBucket(
                capacity=user_limit,
                refill_rate=user_limit / 60.0,
                current_tokens=user_limit,
                last_refill=time.time(),
                burst_capacity=user_burst,
                burst_tokens=0
            )
        return self._user_buckets[user_id]
    
    def _get_or_create_endpoint_bucket(self, endpoint: str, rule: RateLimitRule) -> TokenBucket:
        """Get or create token bucket for endpoint"""
        if endpoint not in self._endpoint_buckets:
            # Endpoint buckets are shared across all clients
            endpoint_limit = rule.requests_per_minute * 10  # Higher global limit
            
            self._endpoint_buckets[endpoint] = TokenBucket(
                capacity=endpoint_limit,
                refill_rate=endpoint_limit / 60.0,
                current_tokens=endpoint_limit,
                last_refill=time.time(),
                burst_capacity=rule.burst_capacity * 5,
                burst_tokens=0
            )
        return self._endpoint_buckets[endpoint]
    
    def check_rate_limit(self, request: Request, user_id: Optional[str] = None) -> RateLimitResult:
        """
        Check if request should be rate limited
        
        Args:
            request: FastAPI request object
            user_id: Optional user identifier (overrides extraction from request)
            
        Returns:
            RateLimitResult indicating if request is allowed
        """
        path = request.url.path
        client_ip = self._get_client_ip(request)
        
        if user_id is None:
            user_id = self._get_user_id(request)
        
        # Find applicable rate limiting rule
        rule = self._find_matching_rule(path)
        if not rule or not rule.enabled:
            # No specific rule and no default enforcement
            return RateLimitResult(allowed=True, reason="No rate limit rule")
        
        # Record request in history for metrics
        timestamp = time.time()
        history_key = f"{client_ip}:{path}"
        self._request_history[history_key].append(timestamp)
        
        # Check IP-based rate limiting
        ip_bucket = self._get_or_create_ip_bucket(client_ip, rule)
        if not ip_bucket.consume(1):
            retry_after = int((1 - ip_bucket.current_tokens) / ip_bucket.refill_rate)
            return RateLimitResult(
                allowed=False,
                reason=f"IP rate limit exceeded: {rule.requests_per_minute}/min",
                retry_after=max(1, retry_after),
                remaining=0,
                limit=rule.requests_per_minute
            )
        
        # Check user-based rate limiting (if authenticated)
        user_bucket = None
        if user_id:
            user_bucket = self._get_or_create_user_bucket(user_id, rule)
            if not user_bucket.consume(1):
                retry_after = int((1 - user_bucket.current_tokens) / user_bucket.refill_rate)
                return RateLimitResult(
                    allowed=False,
                    reason=f"User rate limit exceeded",
                    retry_after=max(1, retry_after),
                    remaining=0,
                    limit=user_bucket.capacity
                )
        
        # Check endpoint-specific rate limiting (global protection)
        endpoint_bucket = self._get_or_create_endpoint_bucket(path, rule)
        if not endpoint_bucket.consume(1):
            return RateLimitResult(
                allowed=False,
                reason="Endpoint rate limit exceeded (global protection)",
                retry_after=60,  # Standard retry for global limits
                remaining=0,
                limit=endpoint_bucket.capacity
            )
        
        # Calculate remaining requests
        user_remaining = user_bucket.current_tokens if user_bucket else rule.requests_per_minute
        remaining = int(min(ip_bucket.current_tokens, user_remaining))
        
        return RateLimitResult(
            allowed=True,
            reason="Within rate limits",
            remaining=remaining,
            limit=rule.requests_per_minute
        )
    
    def get_rate_limit_status(self, request: Request, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get detailed rate limit status for request"""
        path = request.url.path
        client_ip = self._get_client_ip(request)
        
        if user_id is None:
            user_id = self._get_user_id(request)
        
        rule = self._find_matching_rule(path)
        
        status = {
            "path": path,
            "client_ip": client_ip,
            "user_id": user_id,
            "rule_found": rule is not None
        }
        
        if rule:
            status["rule"] = {
                "requests_per_minute": rule.requests_per_minute,
                "burst_capacity": rule.burst_capacity,
                "enabled": rule.enabled,
                "priority": rule.priority
            }
            
            # IP bucket status
            if client_ip in self._ip_buckets:
                status["ip_bucket"] = self._ip_buckets[client_ip].get_status()
            
            # User bucket status
            if user_id and user_id in self._user_buckets:
                status["user_bucket"] = self._user_buckets[user_id].get_status()
            
            # Endpoint bucket status
            if path in self._endpoint_buckets:
                status["endpoint_bucket"] = self._endpoint_buckets[path].get_status()
        
        return status
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get rate limiting metrics and statistics"""
        now = time.time()
        hour_ago = now - 3600
        
        # Count active buckets
        active_ip_buckets = len(self._ip_buckets)
        active_user_buckets = len(self._user_buckets)
        active_endpoint_buckets = len(self._endpoint_buckets)
        
        # Calculate request rates from history
        total_requests_last_hour = 0
        for history in self._request_history.values():
            total_requests_last_hour += sum(1 for ts in history if ts > hour_ago)
        
        # Top IP addresses by request count
        ip_request_counts = defaultdict(int)
        for key, history in self._request_history.items():
            ip = key.split(':')[0]
            ip_request_counts[ip] += sum(1 for ts in history if ts > hour_ago)
        
        top_ips = sorted(ip_request_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "active_buckets": {
                "ip": active_ip_buckets,
                "user": active_user_buckets, 
                "endpoint": active_endpoint_buckets
            },
            "requests_last_hour": total_requests_last_hour,
            "top_ips_last_hour": top_ips,
            "rules_count": len(self._endpoint_rules),
            "cleanup_stats": {
                "last_cleanup": self._last_cleanup,
                "next_cleanup_in_seconds": max(0, (self._last_cleanup + self._cleanup_interval) - now)
            }
        }
    
    async def _periodic_cleanup(self) -> None:
        """Background task to clean up old buckets and history"""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                await self._cleanup_old_data()
            except Exception as e:
                logger.error(f"Error in rate limiter cleanup: {str(e)}")
    
    async def _cleanup_old_data(self) -> None:
        """Clean up old rate limiting data"""
        now = time.time()
        cutoff_time = now - 3600  # Remove data older than 1 hour
        
        # Clean up request history
        for key in list(self._request_history.keys()):
            history = self._request_history[key]
            # Remove old entries
            while history and history[0] < cutoff_time:
                history.popleft()
            
            # Remove empty histories
            if not history:
                del self._request_history[key]
        
        # Clean up idle buckets (no activity for 30 minutes)
        idle_cutoff = now - 1800
        
        # IP buckets
        idle_ip_buckets = [
            ip for ip, bucket in self._ip_buckets.items()
            if bucket.last_refill < idle_cutoff
        ]
        for ip in idle_ip_buckets:
            del self._ip_buckets[ip]
        
        # User buckets
        idle_user_buckets = [
            user_id for user_id, bucket in self._user_buckets.items()
            if bucket.last_refill < idle_cutoff
        ]
        for user_id in idle_user_buckets:
            del self._user_buckets[user_id]
        
        # Endpoint buckets (keep these longer as they're shared)
        very_idle_cutoff = now - 7200  # 2 hours
        idle_endpoint_buckets = [
            endpoint for endpoint, bucket in self._endpoint_buckets.items()
            if bucket.last_refill < very_idle_cutoff
        ]
        for endpoint in idle_endpoint_buckets:
            del self._endpoint_buckets[endpoint]
        
        cleaned_buckets = len(idle_ip_buckets) + len(idle_user_buckets) + len(idle_endpoint_buckets)
        cleaned_history = len([k for k in self._request_history.keys() if not self._request_history[k]])
        
        if cleaned_buckets > 0 or cleaned_history > 0:
            logger.info(f"Rate limiter cleanup: removed {cleaned_buckets} idle buckets, {cleaned_history} empty histories")
        
        self._last_cleanup = now

# Global instance
advanced_rate_limiter = AdvancedRateLimiter()

# Export for easy imports
__all__ = ["advanced_rate_limiter", "AdvancedRateLimiter", "RateLimitResult", "RateLimitRule", "TokenBucket"]