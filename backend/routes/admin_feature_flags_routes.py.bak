import os

from fastapi import APIRouter, Body, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.core.exceptions import BusinessLogicException
from backend.core.response_models import ResponseBuilder
from backend.services.feature_flags_service import get_feature_flags_service

router = APIRouter(prefix="/api/admin/feature-flags", tags=["Admin Feature Flags"])


def require_admin_if_enabled(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
):
    """Conditionally enforce admin authentication based on env flag.

    If `ADMIN_FEATURE_FLAGS_REQUIRE_AUTH` is truthy, require Authorization bearer token
    to equal the dummy admin token used elsewhere ("admin-token"). If the project's
    AuthorizationException is available, raise it for consistent error envelopes.
    Otherwise, raise an HTTPException 403.
    """
    require = os.getenv("ADMIN_FEATURE_FLAGS_REQUIRE_AUTH", "false").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )
    if not require:
        return True

    token = credentials.credentials if credentials else None
    if token == "admin-token":
        return True
    # Accept real JWT with admin scope when available
    if token:
        try:
            from backend.auth.security import security_manager  # type: ignore

            payload = security_manager.verify_token(token)
            scopes = payload.get("scopes", []) or []
            if isinstance(scopes, list) and "admin" in scopes:
                return True
        except Exception:
            pass

    try:
        # Prefer project-specific exception for standardized response contract
        from backend.exceptions.api_exceptions import (
            AuthorizationException,
        )  # type: ignore

        raise AuthorizationException(
            detail="Not authorized", error_code="not_authorized"
        )
    except Exception:
        from fastapi import HTTPException, status

        raise BusinessLogicException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )


@router.get("")
async def list_feature_flags(_: bool = Depends(require_admin_if_enabled)):
    svc = get_feature_flags_service()
    flags = svc.list_flags()
    return ResponseBuilder.success({"flags": flags})


@router.get("/audit")
async def list_feature_flags_audit(_: bool = Depends(require_admin_if_enabled)):
    svc = get_feature_flags_service()
    audit = svc.list_audit()
    return ResponseBuilder.success({"audit": audit})


@router.post("/{flag_name}")
async def set_feature_flag(
    flag_name: str,
    payload: dict = Body(...),
    _: bool = Depends(require_admin_if_enabled),
):
    if not isinstance(payload, dict) or "enabled" not in payload:
        return ResponseBuilder.validation_error("'enabled' field is required")

    enabled = bool(payload.get("enabled"))
    toggler = payload.get("toggler") or "admin-system"

    svc = get_feature_flags_service()
    try:
        updated = svc.set_flag(flag_name, enabled=enabled, toggler=toggler)
        return ResponseBuilder.success({"flag": updated})
    except KeyError:
        return ResponseBuilder.not_found(resource="feature_flag", resource_id=flag_name)
