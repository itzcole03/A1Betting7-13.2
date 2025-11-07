from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr

from backend.services.auth_service import AuthService, get_auth_service


class UserCreateRequest(BaseModel):
    """Payload for creating a new user."""

    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserLoginRequest(BaseModel):
    """Payload for authenticating an existing user."""

    username: EmailStr
    password: str


class UserAuthServiceAdapter:
    """Thin adapter around the canonical AuthService for legacy callers."""

    def __init__(self, auth_service: Optional[AuthService] = None) -> None:
        self._auth = auth_service or get_auth_service()

    async def register_user(self, user_data: UserCreateRequest) -> Dict[str, Any]:
        return await self._auth.register(
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name or "",
            last_name=user_data.last_name or "",
        )

    async def login_user(
        self,
        login_data: UserLoginRequest,
        *,
        ip_address: str = "",
        user_agent: str = "",
    ) -> Dict[str, Any]:
        return await self._auth.authenticate(login_data.username, login_data.password)

    async def logout_user(self, session_id: str) -> bool:
        return True

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        return await self._auth.refresh(refresh_token)

    async def verify_session(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            return await self._auth.me(token)
        except ValueError:
            return None

    async def change_password_by_credentials(
        self, email: str, current_password: str, new_password: str
    ) -> None:
        await self._auth.change_password_by_credentials(
            email=email,
            current_password=current_password,
            new_password=new_password,
        )

    async def update_profile(
        self, token: str, *, first_name: Optional[str], last_name: Optional[str]
    ) -> Dict[str, Any]:
        return await self._auth.update_profile(token, first_name, last_name)

    async def list_known_users(self) -> list[str]:
        return await self._auth.list_known_users()

    async def dev_set_password(self, email: str, new_password: str) -> None:
        await self._auth.dev_set_password(email, new_password)

    @property
    def raw_service(self) -> AuthService:
        return self._auth


user_auth_service = UserAuthServiceAdapter()

__all__ = [
    "UserAuthServiceAdapter",
    "UserCreateRequest",
    "UserLoginRequest",
    "user_auth_service",
]
