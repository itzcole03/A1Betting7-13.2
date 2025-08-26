from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware

import json

# Use canonical ResponseBuilder from core response models
from backend.core.response_models import ResponseBuilder

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Global exception handler to normalize error responses for tests and clients
@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = getattr(exc, "detail", None)
    msg = detail if isinstance(detail, str) else str(detail)
    return ResponseBuilder.error(message=msg or "HTTP error", code="HTTP_ERROR", details=None, status_code=exc.status_code)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return ResponseBuilder.validation_error(message=str(exc), details=None)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Preserve HTTPException status when possible
    if isinstance(exc, FastAPIHTTPException):
        detail = getattr(exc, "detail", None)
        msg = detail if isinstance(detail, str) else str(detail)
        # Use ResponseBuilder.error which returns a JSONResponse
        return ResponseBuilder.error(message=msg or "HTTP error", code="HTTP_ERROR", details=None, status_code=exc.status_code)

    # Generic exceptions -> internal server error
    return ResponseBuilder.error(message=str(exc), code="INTERNAL_SERVER_ERROR", details=None, status_code=500)

class StandardResponseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        content_type = response.headers.get("content-type", "")
        if content_type.startswith("application/json"):
            # consume existing body robustly (support StreamingResponse or already-rendered body)
            body_bytes = b""
            body_iter = getattr(response, "body_iterator", None)
            if body_iter is not None:
                try:
                    async for chunk in body_iter:
                        if isinstance(chunk, memoryview):
                            body_bytes += bytes(chunk)
                        else:
                            body_bytes += chunk
                except TypeError:
                    # body_iterator was not async-iterable - fall back
                    pass
            else:
                # Try direct body attribute
                body_attr = getattr(response, "body", None)
                if isinstance(body_attr, (bytes, bytearray, memoryview)):
                    body_bytes = bytes(body_attr)
                elif isinstance(body_attr, str):
                    body_bytes = body_attr.encode("utf-8")
                else:
                    # No body available; leave empty
                    body_bytes = b""

            try:
                parsed = json.loads(body_bytes.decode("utf-8")) if body_bytes else None
            except Exception:
                # Not JSON-decodable; return original response
                return Response(content=body_bytes, status_code=response.status_code, media_type=content_type)

            # Normalize success responses (2xx)
            wrapped = None
            if 200 <= response.status_code < 400:
                if isinstance(parsed, dict) and parsed.get("success") is not None:
                    wrapped = parsed
                else:
                    wrapped = ResponseBuilder.success(data=parsed, message=None)
            else:
                # Error path: ensure structure
                msg = None
                detail = None
                if isinstance(parsed, dict):
                    msg = parsed.get("message") or parsed.get("error") or parsed.get("detail")
                    detail = parsed if isinstance(parsed, dict) else None

                # If parsed already matches the contract, return it
                if isinstance(parsed, dict) and parsed.get("success") is False:
                    wrapped = parsed
                else:
                    # Build a JSONResponse using the canonical ResponseBuilder.
                    wrapped_response = ResponseBuilder.error(message=msg or "Error", details=detail, status_code=response.status_code)

                    # If ResponseBuilder.error returned a JSONResponse, extract its content for consistent middleware behavior
                    if isinstance(wrapped_response, JSONResponse):
                        try:
                            body_obj = wrapped_response.body
                            if isinstance(body_obj, (bytes, bytearray, memoryview)):
                                content = bytes(body_obj).decode("utf-8")
                            else:
                                content = None

                            if content:
                                wrapped = json.loads(content)
                            else:
                                wrapped = {
                                    "success": False,
                                    "data": None,
                                    "error": {"code": "OPERATION_FAILED", "message": msg or "Error", "details": detail},
                                }
                        except Exception:
                            wrapped = {
                                "success": False,
                                "data": None,
                                "error": {"code": "OPERATION_FAILED", "message": msg or "Error", "details": detail},
                            }
                    else:
                        # If the builder returned a plain dict, use it directly.
                        wrapped = wrapped_response if isinstance(wrapped_response, dict) else {
                            "success": False,
                            "data": None,
                            "error": {"code": "OPERATION_FAILED", "message": msg or "Error", "details": detail},
                        }

            # If for some reason wrapped is still None, fallback to a generic error JSONResponse
            if wrapped is None:
                return ResponseBuilder.error(message="Unexpected response", code="INTERNAL_SERVER_ERROR", details=None, status_code=500)

            return JSONResponse(status_code=response.status_code, content=wrapped)

        return response

# add middleware
app.add_middleware(StandardResponseMiddleware)

"""
DEPRECATED: This entry point is deprecated in favor of backend.core.app
Please use the canonical app factory from backend.core.app.create_app() instead.

This file remains only for backward compatibility and will be removed in a future version.
All new features should be added to the canonical app factory.
"""

# Legacy test compatibility: stub for get_sport_radar_games
def get_sport_radar_games(*args, **kwargs):
    return []


import logging

# Initialize structured logging for startup
try:
    from backend.utils.structured_logging import app_logger

    logger = app_logger
    logger.warning("⚠️ Using DEPRECATED backend/main.py entry point")
    logger.info("🔄 Please migrate to backend.core.app.create_app()")
except ImportError:
    # Fallback to basic logging if structured logging not available
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ Using DEPRECATED backend/main.py entry point")


# Use the canonical app factory
try:
    from backend.core.app import app
    logger.info("✅ Using canonical app from backend.core.app")
except ImportError as e:
    logger.error(f"❌ Cannot import canonical app: {e}")
    raise RuntimeError("Canonical app not available") from e


logger.info("⚠️ DEPRECATED: A1Betting Backend loaded via deprecated main.py")
logger.info("🔄 Migrate to: from backend.core.app import app")

# Export the app for uvicorn (backward compatibility)
__all__ = ["app"]
