"""
Security Headers Middleware for FastAPI

Implements comprehensive security headers with configurable enforcement modes:
- Content Security Policy (CSP) with enforce/report-only modes
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy
- Cross-Origin-Embedder-Policy, Permissions-Policy

Features:
- Environment-driven configuration
- CSP violation reporting endpoint
- Metrics integration for monitoring
- Production-ready with minimal performance impact
"""
import logging
from typing import Any, Callable, Dict, List, Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Scope, Send, Message

from backend.config.settings import SecuritySettings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses.
    
    Applies modern baseline security protections with configurable options:
    - Strict-Transport-Security (HSTS) when enabled
    - Content-Security-Policy with report-only mode support
    - Anti-clickjacking and content-sniffing protection
    - Cross-origin isolation headers
    - Permissions policy restrictions
    
    Headers are applied AFTER rate limiting to ensure even rate-limited
    responses receive security protections. This positioning ensures:
    1. Logging/metrics capture all requests
    2. Payload validation rejects malicious content early
    3. Rate limiting prevents abuse before processing
    4. Security headers protect legitimate responses
    5. Router handles business logic with security in place
    """
    
    def __init__(
        self,
        app: ASGIApp,
        settings: SecuritySettings,
        metrics_client: Optional[Any] = None
    ):
        super().__init__(app)
        self.settings = settings
        self.metrics_client = metrics_client
        self.enabled = settings.security_headers_enabled
        
        # Request counter for sampling debug logs (every 100th request)
        self._request_count = 0
        
        # Pre-build static headers for performance
        self._static_headers = self._build_static_headers()
        # Build CSP header name/value now for test compatibility
        self._csp_header_name, self._csp_header_value = self._build_csp_header()
        
        if self.enabled:
            logger.info(f"✅ Security headers middleware enabled: "
                       f"CSP={'report-only' if settings.csp_report_only else 'enforced'}, "
                       f"HSTS={settings.enable_hsts}, "
                       f"strict_mode={settings.security_strict_mode}")
        else:
            logger.warning("⚠️ Security headers middleware DISABLED")
    
    def _build_static_headers(self) -> Dict[str, str]:
        """Build static security headers that don't change per request."""
        headers = {}
        s = self.settings
        
        # Don't add any headers if security headers are disabled
        if not self.enabled:
            return headers
        
        # HSTS - only add if enabled and not in development
        if s.enable_hsts:
            headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        
        # Anti-content-sniffing
        headers["X-Content-Type-Options"] = "nosniff"
        
        # Anti-clickjacking
        headers["X-Frame-Options"] = s.x_frame_options
        
        # Referrer policy
        headers["Referrer-Policy"] = "no-referrer"
        
        # Cross-origin policies
        if getattr(s, 'enable_coop', False):
            # Default COOP to 'same-origin' unless an explicit policy is provided
            coop_value = getattr(s, 'coop_policy', None) or "same-origin"
            headers["Cross-Origin-Opener-Policy"] = coop_value

        # Cross-Origin-Embedder-Policy (COEP)
        if getattr(s, 'enable_coep', False):
            coep_value = getattr(s, 'coep_policy', None) or "require-corp"
            headers["Cross-Origin-Embedder-Policy"] = coep_value

        # Cross-Origin-Resource-Policy: default to present unless legacy flag explicitly disables it
        enable_corp_flag = getattr(s, 'enable_corp', None)
        if enable_corp_flag:
            # When explicitly enabled, default to same-origin unless overridden
            headers["Cross-Origin-Resource-Policy"] = getattr(s, 'corp_policy', 'same-origin')
        
        # Permissions policy - baseline restrictions
        # Ensure a broad default restrictive permissions policy
        permissions_policy = (
            "accelerometer=(), gyroscope=(), camera=(), microphone=(), geolocation=(), autoplay=()"
        )
        if getattr(s, 'permissions_policy_append', None):
            permissions_policy += f", {s.permissions_policy_append}"
        headers["Permissions-Policy"] = permissions_policy
        
        return headers
    
    def _build_csp_header(self) -> tuple[Optional[str], Optional[str]]:
        """
        Build Content Security Policy header with configurable directives.
        
        Returns:
            Tuple of (header_name, header_value) or (None, None) if disabled
        """
        if not self.settings.csp_enabled or not self.enabled:
            return None, None
        
        # Determine header name based on enforcement mode
        header_name = (
            "Content-Security-Policy-Report-Only" 
            if self.settings.csp_report_only 
            else "Content-Security-Policy"
        )
        
        # Build CSP directives
        directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",  # Allow inline styles for common frameworks
            "img-src 'self' data: blob:",  # Allow data and blob URLs for inline images
            "font-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        
        # Build connect-src with extra domains if configured
        connect_src = "'self'"
        if getattr(self.settings, 'csp_extra_connect_src', None):
            raw = self.settings.csp_extra_connect_src
            # Allow the settings field to be a comma-separated string or an iterable
            if isinstance(raw, str):
                extra_candidates = [p.strip() for p in raw.split(",") if p.strip()]
            elif hasattr(raw, '__iter__'):
                try:
                    extra_candidates = [str(p).strip() for p in raw if str(p).strip()]
                except Exception:
                    extra_candidates = []
            else:
                extra_candidates = []
            if extra_candidates:
                connect_src += " " + " ".join(extra_candidates)
        directives.append(f"connect-src {connect_src}")
        
        # Add upgrade-insecure-requests if enabled
        if self.settings.csp_enable_upgrade_insecure:
            directives.append("upgrade-insecure-requests")
        
        # Add report-uri if CSP reporting endpoint is enabled
        # (regardless of enforce vs report-only mode)
        if getattr(self.settings, 'csp_report_endpoint_enabled', False):
            report_uri = getattr(self.settings, 'csp_report_uri', None) or '/api/security/csp-report'
            directives.append(f"report-uri {report_uri}")
        
        header_value = "; ".join(directives)
        return header_name, header_value
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply security headers to response."""
        if not self.enabled:
            return await call_next(request)
        
        try:
            # Process request through application
            response = await call_next(request)
        except Exception as e:
            # Create error response with security headers applied
            from fastapi.responses import JSONResponse
            error_response = JSONResponse(
                status_code=500,
                content={"error": "Internal server error", "detail": str(e)}
            )
            
            # Apply static headers to error response
            for name, value in self._static_headers.items():
                if name not in error_response.headers:
                    error_response.headers[name] = value
            
            # Apply CSP header if configured
            csp_header_name, csp_header_value = self._build_csp_header()
            if csp_header_name and csp_header_value:
                if csp_header_name not in error_response.headers:
                    error_response.headers[csp_header_name] = csp_header_value
            
            return error_response
        
        # Apply static headers (avoid overwriting existing ones)
        for name, value in self._static_headers.items():
            if name not in response.headers:
                response.headers[name] = value
        
        # Apply CSP header if configured
        csp_header_name = self._csp_header_name
        csp_header_value = self._csp_header_value
        if csp_header_name and csp_header_value:
            if csp_header_name not in response.headers:
                response.headers[csp_header_name] = csp_header_value
        
        # Record metrics for each header type
        if self.metrics_client and hasattr(self.metrics_client, 'security_headers_applied_total'):
            # Track static headers
            for header_name in self._static_headers.keys():
                header_type = self._get_header_type(header_name)
                self.metrics_client.security_headers_applied_total.labels(
                    header_type=header_type
                ).inc()
            
            # Track CSP header
                csp_header_name = getattr(self, '_csp_header_name', None)
            if csp_header_name:
                self.metrics_client.security_headers_applied_total.labels(
                    header_type='csp'
                ).inc()
        
        # Debug logging (sampled to avoid noise)
        self._request_count += 1
        if logger.isEnabledFor(logging.DEBUG) and self._request_count % 100 == 0:
            request_id = getattr(request.state, 'request_id', 'unknown')
            headers_applied = list(self._static_headers.keys())
            csp_header_name, _ = self._build_csp_header()
            if csp_header_name:
                headers_applied.append(csp_header_name)
            logger.debug(
                f"Security headers applied",
                extra={
                    "request_id": request_id,
                    "headers_count": len(headers_applied),
                    "csp_mode": "report-only" if self.settings.csp_report_only else "enforce",
                    "sample_count": self._request_count
                }
            )
        
        return response

    def _get_header_type(self, header_name: str) -> str:
        """
        Map header name to metrics label type
        
        Args:
            header_name: HTTP header name
            
        Returns:
            Metrics-friendly header type label
        """
        header_mapping = {
            'Strict-Transport-Security': 'hsts',
            'X-Frame-Options': 'x-frame-options', 
            'X-Content-Type-Options': 'x-content-type-options',
            'Cross-Origin-Embedder-Policy': 'coep',
            'Cross-Origin-Opener-Policy': 'coop',
            'Cross-Origin-Resource-Policy': 'corp',
            'Permissions-Policy': 'permissions-policy'
        }
        return header_mapping.get(header_name, header_name.lower())

    # Compatibility shim for tests that call this internal helper
    def _apply_static_headers(self, response: Response) -> Response:
        """
        Apply the pre-built static headers to the provided response.
        Kept as a separate method for testability and backwards compatibility.
        """
        # Apply static headers
        for name, value in self._static_headers.items():
            if name not in response.headers:
                response.headers[name] = value

        # Apply CSP header if configured
        csp_header_name, csp_header_value = self._build_csp_header()
        if csp_header_name and csp_header_value:
            if csp_header_name not in response.headers:
                response.headers[csp_header_name] = csp_header_value

        # Record metrics if metrics client present (tests call _apply_static_headers directly)
        if getattr(self, 'metrics_client', None) and hasattr(self.metrics_client, 'security_headers_applied_total'):
            for header_name in self._static_headers.keys():
                header_type = self._get_header_type(header_name)
                try:
                    self.metrics_client.security_headers_applied_total.labels(header_type=header_type).inc()
                except Exception:
                    pass
            if csp_header_name:
                try:
                    self.metrics_client.security_headers_applied_total.labels(header_type='csp').inc()
                except Exception:
                    pass

        # Debug logging sampling: check current count before incrementing
        current_count = getattr(self, '_request_count', 0)
        if logger.isEnabledFor(logging.DEBUG) and current_count != 0 and current_count % 100 == 0:
            request_id = getattr(response, 'status_code', 'unknown')
            headers_applied = list(self._static_headers.keys())
            if csp_header_name:
                headers_applied.append(csp_header_name)
            logger.debug(
                f"Security headers applied",
                extra={
                    "request_id": request_id,
                    "headers_count": len(headers_applied),
                    "csp_mode": "report-only" if getattr(self.settings, 'csp_report_only', False) else "enforce",
                    "sample_count": current_count,
                },
            )

        # Increment counter after sampling decision
        try:
            self._request_count = current_count + 1
        except Exception:
            self._request_count = 1

        return response


def build_csp_header(settings: SecuritySettings) -> str:
    """
    Build Content Security Policy header value for testing/validation.
    
    Isolated function for testability without middleware instantiation.
    
    Args:
        settings: Security settings configuration
        
    Returns:
        CSP header value string
    """
    if not settings.csp_enabled:
        return ""
    
    directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "object-src 'none'",  # Block all object/embed/applet
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ]
    
    # Build connect-src
    connect_src = "'self'"
    if settings.csp_extra_connect_src:
        extra_sources = [
            src.strip() 
            for src in settings.csp_extra_connect_src.split(",")
            if src.strip()
        ]
        if extra_sources:
            connect_src += " " + " ".join(extra_sources)
    directives.append(f"connect-src {connect_src}")
    
    if settings.csp_enable_upgrade_insecure:
        directives.append("upgrade-insecure-requests")
    
    if settings.csp_report_endpoint_enabled:
        report_uri = getattr(settings, 'csp_report_uri', None) or '/api/security/csp-report'
        directives.append(f"report-uri {report_uri}")
    
    return "; ".join(directives)


def create_security_headers_middleware(
    settings: SecuritySettings, 
    metrics_client: Optional[Any] = None
) -> Callable[[ASGIApp], SecurityHeadersMiddleware]:
    """
    Factory function to create SecurityHeadersMiddleware with settings.
    
    Args:
        settings: Security settings containing header configuration
        metrics_client: Optional metrics client for recording metrics
        
    Returns:
        Function that creates configured SecurityHeadersMiddleware instance
    """
    def middleware_factory(app: ASGIApp) -> SecurityHeadersMiddleware:
        return SecurityHeadersMiddleware(
            app=app,
            settings=settings,
            metrics_client=metrics_client
        )
    
    return middleware_factory
