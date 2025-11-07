"""
Comprehensive Security Integration Middleware

This middleware integrates all security components:
- Enhanced JWT authentication with clock skew tolerance
- Role-based access control with policy engine
- Advanced rate limiting with token bucket algorithm
- Security headers and CORS protection
- Audit logging for security events

This is the main security entry point that should be added to the FastAPI app.
"""

import logging
import time
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from backend.services.unified_config import unified_config
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import unified_logging
from backend.security.enhanced_auth_service import enhanced_auth_service, TokenClaims
from backend.security.policy_engine import security_policy_engine, PolicyDecision
from backend.security.advanced_rate_limiter import advanced_rate_limiter, RateLimitResult

logger = unified_logging.logger

class ComprehensiveSecurityMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security middleware integrating all security components
    """
    
    def __init__(self, app, config_obj=None):
        super().__init__(app)
        self.config = config_obj or unified_config
        self.error_handler = unified_error_handler
        
        # Security configuration
        self.enabled = True
        self.enforce_authentication = True
        self.enforce_authorization = True
        self.enforce_rate_limiting = True
        
        # Public endpoints that bypass authentication
        self.public_endpoints = {
            "/api/health",
            "/api/v2/diagnostics/health", 
            "/health",
            "/metrics",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/auth/login",
            "/api/auth/register"
        }
        
        # HEAD method endpoints (always allowed for monitoring)
        self.head_allowed_patterns = [
            r"^/api/auth/.*",
            r"^/api/health.*",
            r"^/api/v2/diagnostics/.*",
            r"^/mlb/.*",
            r"^/sports/.*"
        ]
        
        logger.info("Comprehensive security middleware initialized")
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch with comprehensive security checks"""
        start_time = time.time()
        
        try:
            # Skip security for certain conditions
            if not self._should_apply_security(request):
                response = await call_next(request)
                self._add_security_headers(response, request)
                return response
            
            # 1. Rate Limiting Check (first to prevent abuse)
            if self.enforce_rate_limiting:
                rate_limit_result = await self._check_rate_limiting(request)
                if not rate_limit_result.allowed:
                    return self._create_rate_limit_response(rate_limit_result)
            
            # 2. Authentication Check
            user_claims = None
            if self.enforce_authentication:
                user_claims = await self._check_authentication(request)
            
            # 3. Authorization Check
            if self.enforce_authorization:
                authz_result = await self._check_authorization(request, user_claims)
                if not authz_result.allowed:
                    return self._create_authorization_error_response(authz_result)
            
            # 4. Add user context to request state
            if user_claims:
                request.state.user = user_claims
                request.state.user_id = user_claims.sub
                request.state.user_role = user_claims.role
            
            # 5. Process request
            response = await call_next(request)
            
            # 6. Post-processing
            self._add_security_headers(response, request)
            self._log_security_event(request, response, user_claims)
            
            # Add timing header for security monitoring
            processing_time = time.time() - start_time
            response.headers["X-Processing-Time"] = f"{processing_time:.3f}s"
            
            return response
            
        except HTTPException as e:
            # Log security-related HTTP exceptions
            await self._log_security_exception(request, e)
            raise
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Security middleware error: {str(e)}")
            await self._log_security_exception(request, e)
            
            return JSONResponse(
                status_code=500,
                content={"error": "Internal security error", "message": "Request could not be processed"}
            )
    
    def _should_apply_security(self, request: Request) -> bool:
        """Determine if security should be applied to this request"""
        path = request.url.path
        method = request.method
        
        # Skip security for health checks via HEAD method
        if method == "HEAD":
            import re
            for pattern in self.head_allowed_patterns:
                if re.match(pattern, path):
                    return False
        
        # Always apply security unless specifically exempted
        return True
    
    async def _check_rate_limiting(self, request: Request) -> RateLimitResult:
        """Check rate limiting for the request"""
        try:
            return advanced_rate_limiter.check_rate_limit(request)
        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            # On error, allow request but log the issue
            return RateLimitResult(allowed=True, reason="Rate limiter error")
    
    async def _check_authentication(self, request: Request) -> Optional[TokenClaims]:
        """Check authentication for the request"""
        path = request.url.path
        
        # Skip authentication for public endpoints
        if path in self.public_endpoints:
            return None
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )
        
        if not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        try:
            # Verify token with clock skew tolerance
            user_claims = enhanced_auth_service.verify_token_with_skew(token)
            return user_claims
        except HTTPException:
            # Re-raise authentication errors
            raise
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token validation failed"
            )
    
    async def _check_authorization(self, request: Request, user_claims: Optional[TokenClaims]) -> PolicyDecision:
        """Check authorization using policy engine"""
        try:
            return security_policy_engine.evaluate_request_policy(request, user_claims)
        except Exception as e:
            logger.error(f"Authorization error: {str(e)}")
            # On error, default to deny
            return PolicyDecision(allowed=False, reason="Authorization check failed")
    
    def _create_rate_limit_response(self, rate_limit_result: RateLimitResult) -> Response:
        """Create rate limit error response"""
        headers = {}
        
        if rate_limit_result.retry_after:
            headers["Retry-After"] = str(rate_limit_result.retry_after)
        
        if rate_limit_result.remaining is not None:
            headers["X-RateLimit-Remaining"] = str(rate_limit_result.remaining)
        
        if rate_limit_result.limit is not None:
            headers["X-RateLimit-Limit"] = str(rate_limit_result.limit)
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate limit exceeded",
                "message": rate_limit_result.reason,
                "retry_after": rate_limit_result.retry_after
            },
            headers=headers
        )
    
    def _create_authorization_error_response(self, authz_result: PolicyDecision) -> Response:
        """Create authorization error response"""
        status_code = status.HTTP_403_FORBIDDEN if authz_result.required_role else status.HTTP_401_UNAUTHORIZED
        
        error_detail = {
            "error": "Access denied",
            "message": authz_result.reason
        }
        
        if authz_result.required_role:
            error_detail["required_role"] = authz_result.required_role
        
        if authz_result.required_permissions:
            error_detail["required_permissions"] = ", ".join(authz_result.required_permissions)
        
        return JSONResponse(
            status_code=status_code,
            content=error_detail
        )
    
    def _add_security_headers(self, response: Response, request: Request) -> None:
        """Add security headers to response"""
        # Basic security headers
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }
        
        # Add CSP header
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' wss: ws:; "
            "frame-ancestors 'none'"
        )
        security_headers["Content-Security-Policy"] = csp_policy
        
        # Add HSTS for HTTPS requests
        if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
            security_headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Apply headers
        for header, value in security_headers.items():
            response.headers[header] = value
        
        # Remove potentially sensitive headers
        if "Server" in response.headers:
            del response.headers["Server"]
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]
    
    def _log_security_event(self, request: Request, response: Response, user_claims: Optional[TokenClaims]) -> None:
        """Log security-relevant events"""
        # Only log security-sensitive operations
        sensitive_paths = ["/api/auth/", "/api/admin/", "/api/security/"]
        
        path = request.url.path
        is_sensitive = any(sensitive_path in path for sensitive_path in sensitive_paths)
        
        if is_sensitive or response.status_code >= 400:
            client_ip = self._get_client_ip(request)
            user_id = user_claims.sub if user_claims else "anonymous"
            
            log_data = {
                "event": "security_request",
                "path": path,
                "method": request.method,
                "status_code": response.status_code,
                "client_ip": client_ip,
                "user_id": user_id,
                "user_role": user_claims.role if user_claims else None,
                "user_agent": request.headers.get("user-agent", "unknown")[:100],
                "is_sensitive": is_sensitive
            }
            
            if response.status_code >= 400:
                logger.warning(f"Security event: {log_data}")
            else:
                logger.info(f"Security access: {log_data}")
    
    async def _log_security_exception(self, request: Request, exception: Exception) -> None:
        """Log security exceptions"""
        client_ip = self._get_client_ip(request)
        
        log_data = {
            "event": "security_exception",
            "path": request.url.path,
            "method": request.method,
            "client_ip": client_ip,
            "exception_type": type(exception).__name__,
            "exception_message": str(exception),
            "user_agent": request.headers.get("user-agent", "unknown")[:100]
        }
        
        if isinstance(exception, HTTPException):
            log_data["status_code"] = str(exception.status_code)
            log_data["detail"] = str(exception.detail)
        
        logger.error(f"Security exception: {log_data}")
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request"""
        # Check forwarded headers first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct client IP
        if request.client:
            return request.client.host
        
        return "unknown"

# Factory function for easy integration
def create_comprehensive_security_middleware(app, config=None):
    """
    Factory function to create and configure comprehensive security middleware
    
    Usage in app.py:
        from backend.security.comprehensive_middleware import create_comprehensive_security_middleware
        
        security_middleware = create_comprehensive_security_middleware(app)
        app.add_middleware(type(security_middleware))
    """
    return ComprehensiveSecurityMiddleware(app, config)

# Export for easy imports
__all__ = ["ComprehensiveSecurityMiddleware", "create_comprehensive_security_middleware"]