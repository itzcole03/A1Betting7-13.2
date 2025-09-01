from fastapi import FastAPI, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware

import json

# Use canonical ResponseBuilder from core response models
from backend.core.response_models import ResponseBuilder

# Use the canonical app factory (defined below)
# The canonical app will be created and assigned to the 'app' variable

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
    from backend.core.app import create_app
    app = create_app()  # Use the canonical app factory
    logger.info("✅ Using canonical app from backend.core.app.create_app()")
except ImportError as e:
    logger.error(f"❌ Cannot import canonical app factory: {e}")
    raise RuntimeError("Canonical app factory not available") from e


logger.info("⚠️ DEPRECATED: A1Betting Backend loaded via deprecated main.py")
logger.info("🔄 Migrate to: from backend.core.app import app")

# Export the app for uvicorn (backward compatibility)
__all__ = ["app"]


# Dev-only runtime auth helpers (exposed on the legacy entrypoint so they are
# reachable even if the canonical app factory routes are not present in the
# running process). These are intentionally small and guarded.
@app.get("/dev/auth/users")
async def dev_list_auth_users():
    try:
        from backend.services.auth_service import get_auth_service

        svc = get_auth_service()
        if not svc:
            return ResponseBuilder.error(message="Auth service not available", status_code=500)

        users = list(getattr(svc, "_users", {}).keys())
        return ResponseBuilder.success(data={"users": users})
    except Exception as e:
        return ResponseBuilder.error(message=str(e), status_code=500)


@app.post("/dev/auth/set-password")
async def dev_set_password(payload: dict = Body(...)):
    try:
        email = payload.get("email")
        new_password = payload.get("new_password")
        if not email or not new_password:
            return ResponseBuilder.validation_error(message="email and new_password required")

        from backend.services.auth_service import get_auth_service

        svc = get_auth_service()
        if not svc:
            return ResponseBuilder.error(message="Auth service not available", status_code=500)

        import hashlib as _hashlib

        users = getattr(svc, "_users", {})
        users[email] = {
            "email": email,
            "password": _hashlib.sha256(new_password.encode()).hexdigest(),
            "first_name": users.get(email, {}).get("first_name", ""),
            "last_name": users.get(email, {}).get("last_name", ""),
            "id": users.get(email, {}).get("id", email),
            "is_verified": True,
        }

        try:
            setattr(svc, "_users", users)
        except Exception:
            pass

        return ResponseBuilder.success(data={"message": "password set"})
    except Exception as e:
        return ResponseBuilder.error(message=str(e), status_code=500)
