from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware


# --- Diagnostic Middleware for Request Logging ---
def add_request_logging_middleware(app: FastAPI):
    import logging
    import time

    class RequestLoggingMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            logger = logging.getLogger("propollama.middleware")
            start = time.time()
            logger.info(
                f"[MIDDLEWARE] Incoming request: {request.method} {request.url}"
            )
            try:
                response = await call_next(request)
            except Exception as e:
                logger.error(f"[MIDDLEWARE] Exception: {e}")
                raise
            duration = time.time() - start
            logger.info(
                f"[MIDDLEWARE] Completed {request.method} {request.url} in {duration:.2f}s"
            )
            return response

    app.add_middleware(RequestLoggingMiddleware)
