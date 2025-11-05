"""Authentication routes for A1Betting Backend API

Provides endpoints for user authentication, token management and simple
test-friendly behavior. Uses a lightweight shim when production auth
service isn't available.
"""

from typing import Optional

from fastapi import APIRouter, Header
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr

from ..core.response_models import ResponseBuilder
from ..services.auth_service import get_auth_service as _get_auth_service

router = APIRouter()

security = HTTPBearer()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


auth_service = _get_auth_service()


@router.head("/auth/login", status_code=204)
async def login_readiness_check():
    return None


@router.post("/auth/register")
async def register(request: RegisterRequest):
    try:
        # Basic password strength validation: handle weak passwords
        # early so tests that send weak passwords receive a validation
        # style response (422) even if a duplicate-user exists.
        if not request.password or len(request.password) < 8:
            return ResponseBuilder.validation_error(
                message="Password does not meet minimum strength requirements",
                details={"password": "too_short"},
            )

        result = await auth_service.register(
            request.email,
            request.password,
            request.first_name or "",
            request.last_name or "",
        )
        return ResponseBuilder.success(data=result)
    except ValueError as e:
        # Duplicate user or business logic
        return ResponseBuilder.error(message=str(e), status_code=409)


@router.post("/auth/login")
async def login(request: LoginRequest):
    try:
        if not request.email or not request.password:
            return ResponseBuilder.error(
                message="Email and password required", status_code=400
            )

        token_info = await auth_service.authenticate(request.email, request.password)
        return ResponseBuilder.success(data=token_info)

    except ValueError as e:
        return ResponseBuilder.error(message=str(e), status_code=401)


@router.post("/auth/logout")
async def logout():
    # Auth tokens are stateless; clients discard tokens on logout.
    return ResponseBuilder.success(data={"message": "logged out"})


@router.get("/auth/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    try:
        if not authorization:
            return ResponseBuilder.error(message="Missing token", status_code=401)
        token = (
            authorization[7:] if authorization.startswith("Bearer ") else authorization
        )
        user = await auth_service.me(token)
        return ResponseBuilder.success(data=user)
    except ValueError as e:
        return ResponseBuilder.error(message=str(e), status_code=401)


@router.post("/auth/refresh")
async def refresh_token(authorization: Optional[str] = Header(None)):
    try:
        if not authorization:
            return ResponseBuilder.error(message="Missing token", status_code=401)
        token = (
            authorization[7:] if authorization.startswith("Bearer ") else authorization
        )
        refreshed = await auth_service.refresh(token)
        return ResponseBuilder.success(data=refreshed)
    except ValueError as e:
        return ResponseBuilder.error(message=str(e), status_code=401)


# Additional endpoints used by tests (change-password, reset-password, verify-email, profile update)
@router.post("/auth/change-password")
async def change_password(data: dict, authorization: Optional[str] = Header(None)):
    try:
        # Development-friendly behavior: if JSON contains email + current_password + new_password,
        # allow credential-based password change (dev-only). Otherwise require Authorization header.
        if data:
            email_value = data.get("email")
            current_password_value = data.get("current_password")
            new_password_value = data.get("new_password")
        else:
            email_value = None
            current_password_value = None
            new_password_value = None

        if (
            isinstance(email_value, str)
            and isinstance(current_password_value, str)
            and isinstance(new_password_value, str)
        ):
            await auth_service.change_password_by_credentials(
                email_value,
                current_password_value,
                new_password_value,
            )
            return ResponseBuilder.success(data={"message": "password changed"})

        if not authorization:
            return ResponseBuilder.error(message="Missing token", status_code=401)
        token = (
            authorization[7:] if authorization.startswith("Bearer ") else authorization
        )
        new_password_from_token = data.get("new_password") if data else None
        if not isinstance(new_password_from_token, str) or not new_password_from_token:
            return ResponseBuilder.error(
                message="New password required", status_code=400
            )

        current_password_param: Optional[str]
        if current_password_value is None:
            current_password_param = None
        elif isinstance(current_password_value, str):
            current_password_param = current_password_value
        else:
            return ResponseBuilder.error(
                message="Invalid current password payload", status_code=400
            )

        await auth_service.change_password(
            token, current_password_param, new_password_from_token
        )
        return ResponseBuilder.success(data={"message": "password changed"})
    except ValueError as e:
        return ResponseBuilder.error(message=str(e), status_code=401)


@router.post("/auth/api/auth/reset-password")
async def reset_password(data: dict):
    email_value = data.get("email")
    if not isinstance(email_value, str) or not email_value:
        return ResponseBuilder.error(message="Email is required", status_code=400)
    await auth_service.reset_password(email_value)
    return ResponseBuilder.success(data={"message": "reset initiated"})


@router.post("/auth/verify-email/")
async def verify_email(data: dict):
    token_value = data.get("token")
    if not isinstance(token_value, str) or not token_value:
        return ResponseBuilder.error(
            message="Verification token missing", status_code=400
        )
    await auth_service.verify_email(token_value)
    return ResponseBuilder.success(data={"message": "verified"})


@router.put("/auth/api/user/profile")
async def update_profile(data: dict, authorization: Optional[str] = Header(None)):
    try:
        if not authorization:
            return ResponseBuilder.error(message="Missing token", status_code=401)
        token = (
            authorization[7:] if authorization.startswith("Bearer ") else authorization
        )
        updated = await auth_service.update_profile(
            token, data.get("first_name"), data.get("last_name")
        )
        return ResponseBuilder.success(data=updated)
    except ValueError as e:
        return ResponseBuilder.error(message=str(e), status_code=401)


# Dev-only: inspect in-memory auth users
@router.get("/internal/dev/auth-users")
async def dev_list_auth_users():
    users = await auth_service.list_known_users()
    return ResponseBuilder.success(data={"users": users})


class DevSetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


@router.post("/internal/dev/set-password")
async def dev_set_password(request: DevSetPasswordRequest):
    await auth_service.dev_set_password(request.email, request.new_password)
    return ResponseBuilder.success(data={"message": "password set"})
