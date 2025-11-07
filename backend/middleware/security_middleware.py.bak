"""
Enhanced Security Middleware for A1Betting Backend

Implements comprehensive security headers, input validation, and protection
against common web vulnerabilities.
"""

import logging
import re
from typing import Dict, List, Optional
from urllib.parse import urlparse

from fastapi import HTTPException, Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.config_manager import config

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced security middleware with comprehensive protection"""

    def __init__(self, app, config_obj=None):
        super().__init__(app)
        self.config = config_obj or config

        # Security headers configuration
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": config.get("A1BETTING_X_FRAME_OPTIONS", "DENY"),
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": config.get(
                "A1BETTING_REFERRER_POLICY", "strict-origin-when-cross-origin"
            ),
            "Content-Security-Policy": config.get(
                "A1BETTING_CONTENT_SECURITY_POLICY",
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; report-uri /api/security/csp-report",
            ),
            "Permissions-Policy": config.get(
                "A1BETTING_PERMISSIONS_POLICY",
                "camera=(), microphone=(), geolocation=(), autoplay=()",
            ),
            # Cross-origin policies
            "Cross-Origin-Opener-Policy": config.get(
                "A1BETTING_COOP", "same-origin-allow-popups"
            ),
            "Cross-Origin-Embedder-Policy": config.get(
                "A1BETTING_COEP", "require-corp"
            ),
            "Cross-Origin-Resource-Policy": config.get(
                "A1BETTING_CORP", "same-site"
            ),
        }

        # HSTS configuration
        self.hsts_max_age = int(config.get("A1BETTING_HSTS_MAX_AGE", "31536000"))
        self.enable_ssl_redirect = (
            config.get("A1BETTING_ENABLE_SSL_REDIRECT", "false").lower() == "true"
        )

        # Input validation patterns
        self.dangerous_patterns = [
            r"<script[^>]*>.*?</script>",  # Script tags
            r"javascript:",  # JavaScript URLs
            r"on\w+\s*=",  # Event handlers
            r"expression\s*\(",  # CSS expressions
            r"@import",  # CSS imports
            r"<iframe",  # Iframes
            r"<object",  # Objects
            r"<embed",  # Embeds
            r"vbscript:",  # VBScript
            r"data:text/html",  # Data URLs
        ]

        # Compile patterns for performance
        self.compiled_patterns = [
            re.compile(pattern, re.IGNORECASE) for pattern in self.dangerous_patterns
        ]

        # Trusted origins for CORS
        cors_origins = config.get(
            "A1BETTING_CORS_ORIGINS",
            "http://localhost:8173,http://localhost:8174,http://localhost:8175,http://localhost:3000,http://localhost:5173",
        )
        self.trusted_origins = [origin.strip() for origin in cors_origins.split(",")]

        # Snapshot of static headers for unit tests / verification
        try:
            # shallow copy to allow tests to inspect expected static headers
            self._static_headers = dict(self.security_headers)
            # HSTS and Server header are added per-request so provide expected defaults here
            self._static_headers.setdefault("Strict-Transport-Security", f"max-age={self.hsts_max_age}; includeSubDomains")
            self._static_headers.setdefault("Server", "A1Betting/2.0")
        except Exception:
            self._static_headers = {}

    async def dispatch(self, request: Request, call_next):
        """Main security middleware dispatch"""
        try:
            # 1. SSL Redirect Check
            if self.enable_ssl_redirect and not self._is_secure_request(request):
                return self._redirect_to_https(request)

            # 2. Origin Validation
            if not self._validate_origin(request):
                raise HTTPException(status_code=403, detail="Invalid origin")

            # 3. Input Validation
            await self._validate_request_input(request)

            # 4. Process request
            response = await call_next(request)

            # 5. Add security headers
            self._add_security_headers(response, request)

            return response

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Security middleware error: {e}")
            raise HTTPException(status_code=500, detail="Internal security error")

    def _is_secure_request(self, request: Request) -> bool:
        """Check if request is using HTTPS"""
        return (
            request.url.scheme == "https"
            or request.headers.get("x-forwarded-proto") == "https"
            or request.headers.get("x-forwarded-ssl") == "on"
        )

    def _redirect_to_https(self, request: Request) -> Response:
        """Redirect HTTP requests to HTTPS"""
        https_url = request.url.replace(scheme="https")
        return Response(status_code=301, headers={"Location": str(https_url)})

    def _validate_origin(self, request: Request) -> bool:
        """Validate request origin against trusted origins"""
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")

        # Allow requests without origin/referer (e.g., direct API calls)
        if not origin and not referer:
            return True

        # Check origin
        if origin:
            return origin in self.trusted_origins

        # Check referer as fallback
        if referer:
            parsed_referer = urlparse(referer)
            referer_origin = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
            return referer_origin in self.trusted_origins

        return True

    async def _validate_request_input(self, request: Request):
        """Validate request input for XSS and injection attempts"""
        try:
            # Validate query parameters
            for key, value in request.query_params.items():
                if self._contains_dangerous_content(str(value)):
                    logger.warning(
                        f"Dangerous content detected in query param {key}: {value}"
                    )
                    raise HTTPException(
                        status_code=400, detail="Invalid input detected"
                    )

            # Validate headers
            for key, value in request.headers.items():
                if self._contains_dangerous_content(str(value)):
                    logger.warning(f"Dangerous content detected in header {key}")
                    raise HTTPException(
                        status_code=400, detail="Invalid request headers"
                    )

            # Validate request body if present
            if request.method in ["POST", "PUT", "PATCH"]:
                content_type = request.headers.get("content-type", "")
                if "application/json" in content_type:
                    # Note: We don't read the body here to avoid consuming it
                    # JSON validation should be handled by Pydantic models
                    pass
                elif "application/x-www-form-urlencoded" in content_type:
                    # Form data validation would go here
                    pass

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Input validation error: {e}")
            # Don't raise here to avoid blocking legitimate requests

    def _contains_dangerous_content(self, content: str) -> bool:
        """Check if content contains dangerous patterns"""
        if not content:
            return False

        # Check against compiled patterns
        for pattern in self.compiled_patterns:
            if pattern.search(content):
                return True

        return False

    def _add_security_headers(self, response: Response, request: Request):
        """Add security headers to response"""
        # Add standard security headers
        for header, value in self.security_headers.items():
            response.headers[header] = value

        # Add HSTS header for HTTPS requests OR in test environments
        if self._is_secure_request(request) or self.config.environment.value in [
            "development",
            "testing",
        ]:
            response.headers["Strict-Transport-Security"] = (
                f"max-age={self.hsts_max_age}; includeSubDomains"
            )

        # Add server header obfuscation
        response.headers["Server"] = "A1Betting/2.0"

        # Remove potentially sensitive headers
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]


class InputSanitizer:
    """Utility class for input sanitization"""

    @staticmethod
    def sanitize_string(input_str: str, max_length: int = 1000) -> str:
        """Sanitize string input"""
        if not input_str:
            return ""

        # Truncate if too long
        if len(input_str) > max_length:
            input_str = input_str[:max_length]

        # Remove dangerous characters
        sanitized = re.sub(r'[<>"\']', "", input_str)

        # Normalize whitespace
        sanitized = re.sub(r"\s+", " ", sanitized).strip()

        return sanitized

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal"""
        if not filename:
            return ""

        # Remove path components
        filename = filename.split("/")[-1].split("\\")[-1]

        # Remove dangerous characters
        filename = re.sub(r"[^\w\-_\.]", "", filename)

        # Prevent hidden files
        if filename.startswith("."):
            filename = filename[1:]

        return filename or "untitled"

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not email:
            return False

        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email)) and len(email) <= 254

    @staticmethod
    def validate_url(url: str, allowed_schemes: Optional[List[str]] = None) -> bool:
        """Validate URL format and scheme"""
        if not url:
            return False

        if allowed_schemes is None:
            allowed_schemes = ["http", "https"]

        try:
            parsed = urlparse(url)
            return (
                bool(parsed.scheme in allowed_schemes)
                and bool(parsed.netloc)
                and len(url) <= 2048
            )
        except (ValueError, TypeError):
            return False


# Export for use in main app
__all__ = ["SecurityMiddleware", "InputSanitizer"]
