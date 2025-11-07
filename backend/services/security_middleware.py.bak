"""
Security Tightening PR: Rate Limiting and API Key Authentication

Implements rate limiting for model prediction endpoints and API key authentication
for non-development environments to secure the inference system.
"""

import time
import os
from typing import Dict, Optional, Tuple, Any
from collections import defaultdict, deque
from functools import wraps
import hashlib

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.utils.log_context import get_contextual_logger
from backend.utils.trace_utils import trace_span, add_span_tag, add_span_log

logger = get_contextual_logger(__name__)


class RateLimiter:
    """
    Token bucket rate limiter with per-client tracking.
    
    Features:
    - Token bucket algorithm for smooth rate limiting
    - Per-client IP address tracking
    - Configurable rate and burst limits
    - Automatic token refresh
    - Thread-safe operations
    """

    def __init__(
        self,
        requests_per_minute: int = 60,
        burst_limit: int = 10,
        cleanup_interval: int = 300  # 5 minutes
    ):
        """
        Initialize rate limiter.
        
        Args:
            requests_per_minute: Sustained requests per minute limit
            burst_limit: Maximum burst requests allowed
            cleanup_interval: Cleanup old entries interval in seconds
        """
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit
        self.cleanup_interval = cleanup_interval
        
        # Token bucket storage: client_id -> (tokens, last_refill_time)
        self.buckets: Dict[str, Tuple[float, float]] = {}
        
        # Request history for analysis: client_id -> deque of timestamps
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        
        # Last cleanup time
        self.last_cleanup = time.time()
        
        logger.info(
            "Rate limiter initialized",
            extra={
                "requests_per_minute": requests_per_minute,
                "burst_limit": burst_limit,
                "cleanup_interval": cleanup_interval
            }
        )

    def _get_client_id(self, request: Request) -> str:
        """
        Get client identifier for rate limiting.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Client identifier (IP address or user ID)
        """
        # Try to get real IP from headers (for proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take first IP in the chain
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            # Fall back to direct connection IP
            client_ip = request.client.host if request.client else "unknown"
            
        # Include user agent for more granular tracking
        user_agent = request.headers.get("User-Agent", "")
        user_agent_hash = hashlib.md5(user_agent.encode()).hexdigest()[:8]
        
        return f"{client_ip}:{user_agent_hash}"

    def _refill_tokens(self, client_id: str) -> Tuple[float, float]:
        """
        Refill tokens for a client based on elapsed time.
        
        Args:
            client_id: Client identifier
            
        Returns:
            Tuple of (current_tokens, last_refill_time)
        """
        current_time = time.time()
        
        if client_id not in self.buckets:
            # New client gets full burst allowance
            return float(self.burst_limit), current_time
        
        tokens, last_refill = self.buckets[client_id]
        
        # Calculate tokens to add based on elapsed time
        time_elapsed = current_time - last_refill
        tokens_to_add = time_elapsed * (self.requests_per_minute / 60.0)
        
        # Add tokens but cap at burst limit
        new_tokens = min(self.burst_limit, tokens + tokens_to_add)
        
        return new_tokens, current_time

    def _cleanup_old_entries(self) -> None:
        """Clean up old rate limiting entries."""
        current_time = time.time()
        
        if current_time - self.last_cleanup < self.cleanup_interval:
            return
            
        # Remove clients with no recent activity (older than 1 hour)
        cutoff_time = current_time - 3600
        clients_to_remove = []
        
        for client_id, (tokens, last_refill) in self.buckets.items():
            if last_refill < cutoff_time:
                clients_to_remove.append(client_id)
        
        for client_id in clients_to_remove:
            del self.buckets[client_id]
            if client_id in self.request_history:
                del self.request_history[client_id]
        
        self.last_cleanup = current_time
        
        if clients_to_remove:
            logger.debug(
                f"Cleaned up {len(clients_to_remove)} old rate limit entries"
            )

    def is_allowed(self, request: Request) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if request is allowed based on rate limits.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Tuple of (is_allowed, rate_limit_info)
        """
        with trace_span(
            "rate_limit_check",
            service_name="security",
            operation_name="rate_limiting"
        ) as span_id:
            client_id = self._get_client_id(request)
            current_time = time.time()
            
            add_span_tag(span_id, "client_id", client_id)
            add_span_tag(span_id, "endpoint", str(request.url.path))
            
            # Cleanup old entries periodically
            self._cleanup_old_entries()
            
            # Refill tokens
            tokens, last_refill = self._refill_tokens(client_id)
            
            # Check if request is allowed
            if tokens >= 1.0:
                # Allow request and consume token
                new_tokens = tokens - 1.0
                self.buckets[client_id] = (new_tokens, current_time)
                
                # Record request in history
                self.request_history[client_id].append(current_time)
                
                # Calculate rate limit info for response headers
                rate_info = {
                    "allowed": True,
                    "remaining_tokens": int(new_tokens),
                    "reset_time": int(current_time + 60),  # Next minute
                    "retry_after": None,
                    "requests_per_minute": self.requests_per_minute,
                    "burst_limit": self.burst_limit
                }
                
                add_span_tag(span_id, "allowed", True)
                add_span_tag(span_id, "remaining_tokens", int(new_tokens))
                add_span_log(span_id, "Request allowed", "info")
                
                return True, rate_info
            else:
                # Request denied - calculate retry after
                time_to_next_token = (1.0 / (self.requests_per_minute / 60.0))
                retry_after = max(1, int(time_to_next_token))
                
                rate_info = {
                    "allowed": False,
                    "remaining_tokens": 0,
                    "reset_time": int(current_time + retry_after),
                    "retry_after": retry_after,
                    "requests_per_minute": self.requests_per_minute,
                    "burst_limit": self.burst_limit
                }
                
                add_span_tag(span_id, "allowed", False)
                add_span_tag(span_id, "retry_after", retry_after)
                add_span_log(span_id, "Request rate limited", "warning")
                
                logger.warning(
                    "Request rate limited",
                    extra={
                        "client_id": client_id,
                        "endpoint": request.url.path,
                        "retry_after": retry_after
                    }
                )
                
                return False, rate_info

    def get_client_stats(self, request: Request) -> Dict[str, Any]:
        """
        Get rate limiting stats for a client.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Dictionary with client rate limiting statistics
        """
        client_id = self._get_client_id(request)
        current_time = time.time()
        
        # Get current token state
        tokens, last_refill = self._refill_tokens(client_id)
        
        # Calculate recent request rate
        recent_requests = []
        if client_id in self.request_history:
            recent_cutoff = current_time - 300  # Last 5 minutes
            recent_requests = [
                ts for ts in self.request_history[client_id] 
                if ts > recent_cutoff
            ]
        
        return {
            "client_id": client_id,
            "current_tokens": round(tokens, 2),
            "last_refill": last_refill,
            "requests_in_last_5min": len(recent_requests),
            "total_recorded_requests": len(self.request_history.get(client_id, [])),
            "rate_limit_config": {
                "requests_per_minute": self.requests_per_minute,
                "burst_limit": self.burst_limit
            }
        }


class APIKeyValidator:
    """
    API key authentication validator for secured endpoints.
    
    Features:
    - Environment-based API key configuration
    - Development mode bypass
    - Flexible key validation
    - Request logging and monitoring
    """

    def __init__(self):
        """Initialize API key validator."""
        self.environment = os.getenv("A1_ENVIRONMENT", "development").lower()
        self.api_keys = self._load_api_keys()
        self.require_api_key = self.environment != "development"
        
        logger.info(
            "API key validator initialized",
            extra={
                "environment": self.environment,
                "require_api_key": self.require_api_key,
                "configured_keys": len(self.api_keys)
            }
        )

    def _load_api_keys(self) -> set:
        """
        Load API keys from environment variables.
        
        Returns:
            Set of valid API keys
        """
        keys = set()
        
        # Primary API key
        primary_key = os.getenv("A1_API_KEY")
        if primary_key:
            keys.add(primary_key.strip())
        
        # Additional API keys (comma-separated)
        additional_keys = os.getenv("A1_ADDITIONAL_API_KEYS", "")
        if additional_keys:
            for key in additional_keys.split(","):
                key = key.strip()
                if key:
                    keys.add(key)
        
        # Development fallback key
        if self.environment == "development" and not keys:
            dev_key = "dev-key-12345"
            keys.add(dev_key)
            logger.debug("Using development fallback API key")
        
        return keys

    def validate_api_key(self, request: Request, credentials: Optional[HTTPAuthorizationCredentials]) -> bool:
        """
        Validate API key from request.
        
        Args:
            request: FastAPI request object
            credentials: HTTP authorization credentials
            
        Returns:
            True if API key is valid, False otherwise
        """
        with trace_span(
            "api_key_validation",
            service_name="security",
            operation_name="authenticate"
        ) as span_id:
            client_id = request.client.host if request.client else "unknown"
            add_span_tag(span_id, "client_ip", client_id)
            add_span_tag(span_id, "environment", self.environment)
            add_span_tag(span_id, "require_api_key", self.require_api_key)
            
            # Development mode bypass
            if not self.require_api_key:
                add_span_tag(span_id, "auth_result", "development_bypass")
                add_span_log(span_id, "API key validation bypassed in development", "info")
                return True
            
            # Check if API key is provided
            if not credentials or not credentials.credentials:
                add_span_tag(span_id, "auth_result", "missing_credentials")
                add_span_log(span_id, "Missing API key credentials", "warning")
                return False
            
            # Validate API key
            provided_key = credentials.credentials.strip()
            
            if provided_key in self.api_keys:
                add_span_tag(span_id, "auth_result", "valid_key")
                add_span_log(span_id, "API key validated successfully", "info")
                
                logger.info(
                    "API key authentication successful",
                    extra={"client_ip": client_id, "endpoint": request.url.path}
                )
                
                return True
            else:
                add_span_tag(span_id, "auth_result", "invalid_key")
                add_span_tag(span_id, "key_prefix", provided_key[:8] if len(provided_key) >= 8 else "short")
                add_span_log(span_id, "Invalid API key provided", "warning")
                
                logger.warning(
                    "API key authentication failed",
                    extra={
                        "client_ip": client_id,
                        "endpoint": request.url.path,
                        "key_prefix": provided_key[:8] if len(provided_key) >= 8 else "short"
                    }
                )
                
                return False


# Global instances
_rate_limiter: Optional[RateLimiter] = None
_api_key_validator: Optional[APIKeyValidator] = None
_security_bearer = HTTPBearer(auto_error=False)


def get_rate_limiter() -> RateLimiter:
    """
    Get the global rate limiter instance.
    
    Returns:
        RateLimiter singleton instance
    """
    global _rate_limiter
    if _rate_limiter is None:
        # Configure from environment
        requests_per_min = int(os.getenv("A1_RATE_LIMIT_RPM", "60"))
        burst_limit = int(os.getenv("A1_RATE_LIMIT_BURST", "10"))
        
        _rate_limiter = RateLimiter(
            requests_per_minute=requests_per_min,
            burst_limit=burst_limit
        )
    
    return _rate_limiter


def get_api_key_validator() -> APIKeyValidator:
    """
    Get the global API key validator instance.
    
    Returns:
        APIKeyValidator singleton instance
    """
    global _api_key_validator
    if _api_key_validator is None:
        _api_key_validator = APIKeyValidator()
    
    return _api_key_validator


def rate_limited(
    requests_per_minute: Optional[int] = None,
    burst_limit: Optional[int] = None
):
    """
    Decorator for applying rate limiting to endpoints.
    
    Args:
        requests_per_minute: Override default RPM limit
        burst_limit: Override default burst limit
        
    Usage:
        @rate_limited(requests_per_minute=30, burst_limit=5)
        async def predict_endpoint(request: Request):
            return {"prediction": 0.5}
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Get rate limiter (override limits if specified)
            if requests_per_minute or burst_limit:
                limiter = RateLimiter(
                    requests_per_minute=requests_per_minute or 60,
                    burst_limit=burst_limit or 10
                )
            else:
                limiter = get_rate_limiter()
            
            # Check rate limit
            allowed, rate_info = limiter.is_allowed(request)
            
            if not allowed:
                # Return rate limit error with headers
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "retry_after": rate_info["retry_after"],
                        "requests_per_minute": rate_info["requests_per_minute"],
                        "burst_limit": rate_info["burst_limit"]
                    },
                    headers={
                        "Retry-After": str(rate_info["retry_after"]),
                        "X-RateLimit-Limit": str(rate_info["requests_per_minute"]),
                        "X-RateLimit-Remaining": str(rate_info["remaining_tokens"]),
                        "X-RateLimit-Reset": str(rate_info["reset_time"])
                    }
                )
            
            # Add rate limit headers to successful responses
            response = await func(request, *args, **kwargs)
            
            # If response is a fastapi Response object, add headers
            if hasattr(response, 'headers'):
                response.headers["X-RateLimit-Limit"] = str(rate_info["requests_per_minute"])
                response.headers["X-RateLimit-Remaining"] = str(rate_info["remaining_tokens"])
                response.headers["X-RateLimit-Reset"] = str(rate_info["reset_time"])
            
            return response
            
        return wrapper
    return decorator


def api_key_required(func):
    """
    Decorator for requiring API key authentication.
    
    Usage:
        @api_key_required
        async def secure_endpoint(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
            return {"data": "secure"}
    """
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        validator = get_api_key_validator()
        
        # Get credentials from request
        credentials = await _security_bearer(request)
        
        # Validate API key
        if not validator.validate_api_key(request, credentials):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "Invalid or missing API key",
                    "environment": validator.environment,
                    "require_api_key": validator.require_api_key
                },
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return await func(request, *args, **kwargs)
        
    return wrapper


def secure_endpoint(
    requests_per_minute: Optional[int] = None,
    burst_limit: Optional[int] = None,
    require_api_key: bool = True
):
    """
    Combined decorator for rate limiting and API key authentication.
    
    Args:
        requests_per_minute: Rate limit override
        burst_limit: Burst limit override
        require_api_key: Whether to require API key authentication
        
    Usage:
        @secure_endpoint(requests_per_minute=30, require_api_key=True)
        async def predict_endpoint(request: Request):
            return {"prediction": 0.5}
    """
    def decorator(func):
        # Apply decorators in order: API key first, then rate limiting
        decorated_func = func
        
        if require_api_key:
            decorated_func = api_key_required(decorated_func)
            
        decorated_func = rate_limited(
            requests_per_minute=requests_per_minute,
            burst_limit=burst_limit
        )(decorated_func)
        
        return decorated_func
        
    return decorator