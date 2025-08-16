"""
Caching Middleware - HTTP Caching Headers & ETag Support
Provides caching headers, ETag generation, and conditional request handling
for static configuration endpoints and cacheable resources.
"""

import hashlib
import json
import time
from typing import Callable, Dict, Any, Optional, Union
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
import logging

logger = logging.getLogger(__name__)


class CachingMiddleware(BaseHTTPMiddleware):
    """Middleware to add caching headers and ETag support to API responses"""
    
    def __init__(
        self, 
        app,
        cache_config: Optional[Dict[str, Dict[str, Any]]] = None,
        default_max_age: int = 300,  # 5 minutes default
        enable_etag: bool = True
    ):
        super().__init__(app)
        self.cache_config = cache_config or self._get_default_cache_config()
        self.default_max_age = default_max_age
        self.enable_etag = enable_etag
        self._etag_cache: Dict[str, str] = {}
        
    def _get_default_cache_config(self) -> Dict[str, Dict[str, Any]]:
        """Default cache configuration for common endpoints"""
        return {
            # Static configuration endpoints - high cache duration
            "/api/models/enterprise/types": {
                "max_age": 3600,  # 1 hour
                "must_revalidate": True,
                "public": True,
                "etag": True
            },
            "/api/sports/types": {
                "max_age": 3600,
                "must_revalidate": True,
                "public": True,
                "etag": True
            },
            "/api/config": {
                "max_age": 1800,  # 30 minutes
                "must_revalidate": True,
                "public": False,
                "etag": True
            },
            # Model registry endpoints - moderate caching
            "/api/models/enterprise/registry": {
                "max_age": 300,  # 5 minutes
                "must_revalidate": True,
                "public": False,
                "etag": True,
                "vary": "Authorization"
            },
            # Sports data endpoints - short caching for dynamic content
            "/api/sports": {
                "max_age": 60,  # 1 minute
                "must_revalidate": True,
                "public": False,
                "etag": False
            }
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with caching logic"""
        
        # Get cache configuration for this path
        cache_settings = self._get_cache_settings(request.url.path)
        
        if not cache_settings:
            # No caching for this endpoint
            return await call_next(request)
        
        # Handle conditional requests (If-None-Match)
        if_none_match = request.headers.get("if-none-match")
        
        # Generate cache key for ETag lookup
        cache_key = self._generate_cache_key(request)
        
        # Check for existing ETag
        existing_etag = self._etag_cache.get(cache_key) if self.enable_etag else None
        
        # Handle 304 Not Modified
        if (if_none_match and existing_etag and 
            if_none_match.strip('"') == existing_etag.strip('"')):
            
            logger.debug(f"Returning 304 Not Modified for {request.url.path}")
            return Response(status_code=304)
        
        # Process the request
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add caching headers to successful responses
        if 200 <= response.status_code < 300:
            self._add_caching_headers(response, cache_settings, request)
            
            # Add ETag if enabled and content is present
            if cache_settings.get("etag", False) and self.enable_etag:
                etag = await self._generate_etag(response, cache_key)
                if etag:
                    response.headers["etag"] = f'"{etag}"'
                    self._etag_cache[cache_key] = etag
        
        # Add performance headers
        response.headers["x-process-time"] = f"{process_time:.3f}s"
        
        return response
    
    def _get_cache_settings(self, path: str) -> Optional[Dict[str, Any]]:
        """Get cache settings for a specific path"""
        
        # Direct match
        if path in self.cache_config:
            return self.cache_config[path]
        
        # Pattern matching for dynamic paths
        for pattern, settings in self.cache_config.items():
            if self._path_matches_pattern(path, pattern):
                return settings
        
        return None
    
    def _path_matches_pattern(self, path: str, pattern: str) -> bool:
        """Check if path matches a pattern (supports wildcards)"""
        
        if "*" not in pattern:
            return path == pattern
        
        # Simple wildcard matching
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return path.startswith(prefix)
        
        if pattern.startswith("*"):
            suffix = pattern[1:]
            return path.endswith(suffix)
        
        # More complex pattern matching could be added here
        return False
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate a unique cache key for the request"""
        
        # Include path, query params, and relevant headers
        key_parts = [
            request.url.path,
            str(sorted(request.query_params.items())),
        ]
        
        # Include user context for non-public caches
        authorization = request.headers.get("authorization")
        if authorization:
            # Hash the authorization for privacy
            auth_hash = hashlib.md5(authorization.encode()).hexdigest()[:8]
            key_parts.append(f"auth:{auth_hash}")
        
        cache_key = "|".join(key_parts)
        return hashlib.md5(cache_key.encode()).hexdigest()
    
    async def _generate_etag(self, response: Response, cache_key: str) -> Optional[str]:
        """Generate ETag for response content"""
        
        try:
            # Get response body
            if hasattr(response, 'body') and response.body:
                content = response.body
            else:
                return None
            
            # Generate ETag from content hash
            if isinstance(content, bytes):
                content_hash = hashlib.md5(content).hexdigest()
            else:
                content_hash = hashlib.md5(str(content).encode()).hexdigest()
            
            # Include cache key in ETag for uniqueness
            etag_content = f"{cache_key}:{content_hash}"
            etag = hashlib.md5(etag_content.encode()).hexdigest()[:16]
            
            return etag
            
        except Exception as e:
            logger.warning(f"Failed to generate ETag: {e}")
            return None
    
    def _add_caching_headers(
        self, 
        response: Response, 
        cache_settings: Dict[str, Any],
        request: Request
    ) -> None:
        """Add appropriate caching headers to response"""
        
        # Cache-Control header
        cache_control_parts = []
        
        # Max age
        max_age = cache_settings.get("max_age", self.default_max_age)
        cache_control_parts.append(f"max-age={max_age}")
        
        # Public/Private
        if cache_settings.get("public", False):
            cache_control_parts.append("public")
        else:
            cache_control_parts.append("private")
        
        # Must revalidate
        if cache_settings.get("must_revalidate", True):
            cache_control_parts.append("must-revalidate")
        
        # No transform
        if cache_settings.get("no_transform", True):
            cache_control_parts.append("no-transform")
        
        response.headers["cache-control"] = ", ".join(cache_control_parts)
        
        # Expires header (for HTTP/1.0 compatibility)
        expires_timestamp = int(time.time()) + max_age
        response.headers["expires"] = time.strftime(
            "%a, %d %b %Y %H:%M:%S GMT",
            time.gmtime(expires_timestamp)
        )
        
        # Vary header
        vary_header = cache_settings.get("vary")
        if vary_header:
            response.headers["vary"] = vary_header
        
        # Last-Modified header
        if cache_settings.get("last_modified", True):
            response.headers["last-modified"] = time.strftime(
                "%a, %d %b %Y %H:%M:%S GMT",
                time.gmtime()
            )


def create_caching_middleware(
    cache_config: Optional[Dict[str, Dict[str, Any]]] = None,
    default_max_age: int = 300,
    enable_etag: bool = True
) -> Callable:
    """Factory function to create caching middleware with custom configuration"""
    
    def middleware_factory(app):
        return CachingMiddleware(
            app=app,
            cache_config=cache_config,
            default_max_age=default_max_age,
            enable_etag=enable_etag
        )
    
    return middleware_factory


def get_enterprise_cache_config() -> Dict[str, Dict[str, Any]]:
    """Get optimized cache configuration for enterprise endpoints"""
    
    return {
        # Static configuration - aggressive caching
        "/api/models/enterprise/types": {
            "max_age": 7200,  # 2 hours
            "must_revalidate": True,
            "public": True,
            "etag": True,
            "no_transform": True
        },
        
        # Sports configuration
        "/api/sports/types": {
            "max_age": 3600,  # 1 hour
            "must_revalidate": True,
            "public": True,
            "etag": True
        },
        
        # Model registry list - moderate caching
        "/api/models/enterprise/registry": {
            "max_age": 300,  # 5 minutes
            "must_revalidate": True,
            "public": False,
            "etag": True,
            "vary": "Authorization"
        },
        
        # Individual model details - short caching
        "/api/models/enterprise/registry/*": {
            "max_age": 180,  # 3 minutes
            "must_revalidate": True,
            "public": False,
            "etag": True,
            "vary": "Authorization"
        },
        
        # Performance metrics - very short caching
        "/api/models/enterprise/registry/*/metrics": {
            "max_age": 60,  # 1 minute
            "must_revalidate": True,
            "public": False,
            "etag": False,  # Metrics change frequently
            "vary": "Authorization"
        },
        
        # Health endpoints - no caching
        "/api/models/enterprise/registry/*/health": {
            "max_age": 0,
            "must_revalidate": True,
            "public": False,
            "etag": False
        },
        
        # Configuration endpoints
        "/api/config/*": {
            "max_age": 1800,  # 30 minutes
            "must_revalidate": True,
            "public": False,
            "etag": True
        }
    }


# Enhanced response decorator for manual cache control
def cacheable(
    max_age: int = 300,
    public: bool = False,
    etag: bool = True,
    vary: Optional[str] = None
):
    """Decorator to mark endpoints as cacheable with specific settings"""
    
    def decorator(func):
        # Store cache metadata on function
        func._cache_settings = {
            "max_age": max_age,
            "public": public,
            "etag": etag,
            "vary": vary,
            "must_revalidate": True
        }
        return func
    
    return decorator


class ETagger:
    """Utility class for ETag generation and validation"""
    
    @staticmethod
    def generate_etag(data: Union[str, bytes, dict]) -> str:
        """Generate ETag for any data type"""
        
        if isinstance(data, dict):
            # Sort keys for consistent hashing
            content = json.dumps(data, sort_keys=True, separators=(',', ':'))
        elif isinstance(data, str):
            content = data
        elif isinstance(data, bytes):
            content = data.decode('utf-8', errors='ignore')
        else:
            content = str(data)
        
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    @staticmethod
    def validate_etag(request_etag: str, current_etag: str) -> bool:
        """Validate if request ETag matches current ETag"""
        
        # Remove quotes if present
        request_etag = request_etag.strip('"')
        current_etag = current_etag.strip('"')
        
        return request_etag == current_etag
    
    @staticmethod
    def create_conditional_response(
        data: Any, 
        request: Request,
        max_age: int = 300
    ) -> Response:
        """Create response with conditional request handling"""
        
        # Generate ETag for current data
        current_etag = ETagger.generate_etag(data)
        
        # Check If-None-Match header
        if_none_match = request.headers.get("if-none-match")
        
        if if_none_match and ETagger.validate_etag(if_none_match, current_etag):
            # Return 304 Not Modified
            response = Response(status_code=304)
        else:
            # Return full response
            response = JSONResponse(content=data)
        
        # Add caching headers
        response.headers.update({
            "etag": f'"{current_etag}"',
            "cache-control": f"max-age={max_age}, must-revalidate",
            "last-modified": time.strftime(
                "%a, %d %b %Y %H:%M:%S GMT",
                time.gmtime()
            )
        })
        
        return response