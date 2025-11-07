from __future__ import annotations

import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from jose import JWTError  # type: ignore[import]
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlmodel import select

from backend.auth.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    security_manager,
    verify_password,
    verify_token,
)

try:
    from backend.database import async_engine
except ImportError:  # pragma: no cover - defensive fallback for test harnesses
    async_engine = None  # type: ignore

try:
    from backend.models.user import User as UserModel
except (
    ImportError
):  # pragma: no cover - database model may be absent in slim environments
    UserModel = None  # type: ignore


class UserProfile(BaseModel):
    """Lightweight representation of a user returned by the auth service."""

    id: str
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        orm_mode = True


class AuthService:
    """Unified authentication service backing both production and test flows."""

    def __init__(self) -> None:
        self._logger = logging.getLogger(__name__)
        self._session_factory = self._create_session_factory()
        self._users: Dict[str, Dict[str, Any]] = {}
        self._reset_tokens: Dict[str, str] = {}
        self._verification_tokens: Dict[str, str] = {}
        self._lock = asyncio.Lock()
        self._seed_in_memory_default()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    async def register(
        self,
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
    ) -> Dict[str, Any]:
        email = self._normalize_email(email)
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if self._db_enabled:
            async with self._session() as session:
                if session:
                    try:
                        existing = await session.exec(  # type: ignore[attr-defined]
                            select(UserModel).where(UserModel.email == email)
                        )
                        if existing.first():
                            raise ValueError("User already exists")

                        user = UserModel(
                            id=str(uuid.uuid4()),
                            email=email,
                            username=self._derive_username(email),
                            hashed_password=get_password_hash(password),
                            first_name=first_name or None,
                            last_name=last_name or None,
                            is_active=True,
                            is_verified=False,
                        )
                        session.add(user)
                        await session.commit()
                        await session.refresh(user)

                        profile = self._profile_from_db(user)
                        return self._build_auth_response(profile, str(user.id), email)
                    except SQLAlchemyError as exc:
                        await session.rollback()
                        self._logger.error(
                            "Database error while registering %s: %s", email, exc
                        )
                        raise

        return await self._register_in_memory(email, password, first_name, last_name)

    async def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        email = self._normalize_email(email)

        if self._db_enabled:
            async with self._session() as session:
                if session:
                    user = await self._get_user_by_email(session, email)
                    if not user or not verify_password(password, user.hashed_password):
                        raise ValueError("Invalid credentials")
                    if not getattr(user, "is_active", True):
                        raise ValueError("Account is inactive")

                    user.last_login = datetime.now(timezone.utc)
                    await session.commit()
                    profile = self._profile_from_db(user)
                    return self._build_auth_response(profile, str(user.id), email)

        return await self._authenticate_in_memory(email, password)

    async def refresh(self, refresh_token: str) -> Dict[str, Any]:
        payload = self._decode_token(refresh_token, expected_type="refresh")
        email = self._normalize_email(payload.get("sub") or payload.get("email"))
        if not email:
            raise ValueError("Invalid refresh token")

        user_id = payload.get("user_id")
        profile, resolved_id = await self._resolve_profile(email, user_id)
        return self._build_auth_response(profile, resolved_id, email)

    async def me(self, access_token: str) -> Dict[str, Any]:
        payload = self._decode_token(access_token, expected_type="access")
        email = self._normalize_email(payload.get("sub") or payload.get("email"))
        if not email:
            raise ValueError("Invalid token")

        user_id = payload.get("user_id")
        profile, _ = await self._resolve_profile(email, user_id)
        return profile.model_dump(exclude_none=True)

    async def change_password(
        self,
        token: str,
        current_password: Optional[str],
        new_password: str,
    ) -> None:
        payload = self._decode_token(token, expected_type="access")
        email = self._normalize_email(payload.get("sub") or payload.get("email"))
        if not email:
            raise ValueError("Invalid token")
        await self._update_password(
            email, payload.get("user_id"), current_password, new_password
        )

    async def change_password_by_credentials(
        self, email: str, current_password: str, new_password: str
    ) -> None:
        email = self._normalize_email(email)
        await self._update_password(email, None, current_password, new_password)

    async def reset_password(self, email: str) -> bool:
        email = self._normalize_email(email)
        if not email:
            return False

        try:
            _, user_id = await self._resolve_profile(email, None)
        except ValueError:
            # Return True to avoid leaking which emails exist
            return True

        token = security_manager.generate_password_reset_token(user_id)
        self._reset_tokens[token] = email
        self._logger.info("Password reset token generated for %s", email)
        return True

    async def verify_email(self, token: str) -> bool:
        if not token:
            return False

        email = self._verification_tokens.pop(token, None)
        if not email:
            email = self._normalize_email(token)
        if not email:
            return False

        updated = await self._mark_email_verified(email)
        return updated

    async def update_profile(
        self, token: str, first_name: Optional[str], last_name: Optional[str]
    ) -> Dict[str, Any]:
        payload = self._decode_token(token, expected_type="access")
        email = self._normalize_email(payload.get("sub") or payload.get("email"))
        if not email:
            raise ValueError("Invalid token")

        user_id = payload.get("user_id")

        if self._db_enabled:
            async with self._session() as session:
                if session:
                    user = await self._get_user(session, email, user_id)
                    if user:
                        if first_name is not None:
                            user.first_name = first_name
                        if last_name is not None:
                            user.last_name = last_name
                        user.updated_at = datetime.now(timezone.utc)
                        await session.commit()
                        await session.refresh(user)
                        profile = self._profile_from_db(user)
                        return profile.model_dump(exclude_none=True)

        async with self._lock:
            record = self._users.get(email)
            if not record:
                raise ValueError("User not found")
            if first_name is not None:
                record["first_name"] = first_name
            if last_name is not None:
                record["last_name"] = last_name
            profile = self._profile_from_dict(record)
            return profile.model_dump(exclude_none=True)

    async def list_known_users(self) -> List[str]:
        emails: set[str] = set()
        async with self._lock:
            emails.update(self._users.keys())

        if self._db_enabled:
            async with self._session() as session:
                if session:
                    try:
                        result = await session.exec(  # type: ignore[attr-defined]
                            select(UserModel.email)
                        )
                        emails.update(filter(None, result.all()))
                    except SQLAlchemyError as exc:
                        self._logger.warning(
                            "Failed to enumerate database users: %s", exc
                        )

        return sorted(emails)

    async def dev_set_password(self, email: str, new_password: str) -> None:
        email = self._normalize_email(email)
        await self._update_password(
            email, None, None, new_password, skip_current_check=True
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    async def _register_in_memory(
        self, email: str, password: str, first_name: str, last_name: str
    ) -> Dict[str, Any]:
        async with self._lock:
            if email in self._users:
                raise ValueError("User already exists")
            record = self._new_memory_user(email, password, first_name, last_name)
            self._users[email] = record

        profile = self._profile_from_dict(record)
        return self._build_auth_response(profile, record["id"], email)

    async def _authenticate_in_memory(
        self, email: str, password: str
    ) -> Dict[str, Any]:
        async with self._lock:
            user = self._users.get(email)
            if not user or not verify_password(password, user["password_hash"]):
                raise ValueError("Invalid credentials")
            if not user.get("is_active", True):
                raise ValueError("Account is inactive")
            user["last_login"] = datetime.now(timezone.utc)
            profile = self._profile_from_dict(user)

        return self._build_auth_response(profile, user["id"], email)

    async def _update_password(
        self,
        email: str,
        user_id: Optional[str],
        current_password: Optional[str],
        new_password: str,
        *,
        skip_current_check: bool = False,
    ) -> None:
        if not new_password or len(new_password) < 8:
            raise ValueError("New password must be at least 8 characters long")

        hashed = get_password_hash(new_password)

        if self._db_enabled:
            async with self._session() as session:
                if session:
                    user = await self._get_user(session, email, user_id)
                    if user:
                        if not skip_current_check and current_password:
                            if not verify_password(
                                current_password, user.hashed_password
                            ):
                                raise ValueError("Invalid current password")
                        user.hashed_password = hashed
                        await session.commit()
                        return

        async with self._lock:
            record = self._users.get(email)
            if not record:
                raise ValueError("User not found")
            if not skip_current_check and current_password:
                if not verify_password(current_password, record["password_hash"]):
                    raise ValueError("Invalid current password")
            record["password_hash"] = hashed

    async def _mark_email_verified(self, email: str) -> bool:
        if self._db_enabled:
            async with self._session() as session:
                if session:
                    user = await self._get_user(session, email, None)
                    if user:
                        user.is_verified = True
                        await session.commit()
                        return True

        async with self._lock:
            record = self._users.get(email)
            if record:
                record["is_verified"] = True
                return True
        return False

    async def _resolve_profile(
        self, email: str, user_id: Optional[str]
    ) -> Tuple[UserProfile, str]:
        if self._db_enabled:
            async with self._session() as session:
                if session:
                    user = await self._get_user(session, email, user_id)
                    if user:
                        profile = self._profile_from_db(user)
                        return profile, str(user.id)

        async with self._lock:
            record = self._users.get(email)
            if not record:
                raise ValueError("User not found")
            profile = self._profile_from_dict(record)
            return profile, record["id"]

    def _build_auth_response(
        self, profile: UserProfile, user_id: str, email: str
    ) -> Dict[str, Any]:
        access_token = create_access_token({"sub": email, "user_id": user_id})
        refresh_token = create_refresh_token({"sub": email, "user_id": user_id})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": profile.model_dump(exclude_none=True),
        }

    def _profile_from_db(self, user: Any) -> UserProfile:
        return UserProfile(
            id=str(user.id),
            email=user.email,
            username=getattr(user, "username", user.email),
            first_name=getattr(user, "first_name", None),
            last_name=getattr(user, "last_name", None),
            is_active=getattr(user, "is_active", True),
            is_verified=getattr(user, "is_verified", False),
            created_at=getattr(user, "created_at", None),
            last_login=getattr(user, "last_login", None),
        )

    def _profile_from_dict(self, record: Dict[str, Any]) -> UserProfile:
        return UserProfile(
            id=str(record["id"]),
            email=record["email"],
            username=record.get("username", record["email"]),
            first_name=record.get("first_name"),
            last_name=record.get("last_name"),
            is_active=record.get("is_active", True),
            is_verified=record.get("is_verified", False),
            created_at=record.get("created_at"),
            last_login=record.get("last_login"),
        )

    def _new_memory_user(
        self, email: str, password: str, first_name: str, last_name: str
    ) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "email": email,
            "username": self._derive_username(email),
            "password_hash": get_password_hash(password),
            "first_name": first_name or None,
            "last_name": last_name or None,
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.now(timezone.utc),
            "last_login": None,
        }

    async def _get_user(
        self, session: AsyncSession, email: str, user_id: Optional[str]
    ) -> Optional[Any]:
        if user_id:
            result = await session.exec(  # type: ignore[attr-defined]
                select(UserModel).where(UserModel.id == user_id)
            )
            user = result.first()
            if user:
                return user
        result = await session.exec(  # type: ignore[attr-defined]
            select(UserModel).where(UserModel.email == email)
        )
        return result.first()

    async def _get_user_by_email(
        self, session: AsyncSession, email: str
    ) -> Optional[Any]:
        result = await session.exec(  # type: ignore[attr-defined]
            select(UserModel).where(UserModel.email == email)
        )
        return result.first()

    def _decode_token(self, token: str, *, expected_type: str) -> Dict[str, Any]:
        if not token:
            raise ValueError("Missing token")
        try:
            return verify_token(token, token_type=expected_type)
        except (
            HTTPException
        ) as exc:  # normalize FastAPI errors into ValueError for routes
            raise ValueError(exc.detail or "Invalid token") from exc
        except JWTError as exc:
            raise ValueError("Invalid token") from exc

    def _create_session_factory(self):
        if async_engine is None or UserModel is None:
            return None
        try:
            return async_sessionmaker(async_engine, expire_on_commit=False)
        except (SQLAlchemyError, RuntimeError) as exc:  # pragma: no cover - defensive
            self._logger.warning("Falling back to in-memory auth service: %s", exc)
            return None

    @property
    def _db_enabled(self) -> bool:
        return self._session_factory is not None and UserModel is not None

    @asynccontextmanager
    async def _session(self):
        if not self._db_enabled:
            yield None
            return
        session = self._session_factory()
        # SQLModel's AsyncSession exposes an `exec` helper; some test
        # environments or SQLAlchemy-only sessions may not. Provide a
        # small compatibility shim so code that calls `await session.exec(...)`
        # continues to work by delegating to `session.execute(...)`.
        if not hasattr(session, "exec"):

            async def _exec(statement, *args, **kwargs):
                # SQLModel's AsyncSession.exec returns a ScalarResult for ORM
                # selects so that callers can call `.first()` / `.all()` and
                # get model instances. Prefer `scalars` to mimic that behavior.
                return await session.scalars(statement, *args, **kwargs)

            # Attach the coroutine as an attribute on the session instance.
            setattr(session, "exec", _exec)
        try:
            yield session
        finally:
            await session.close()

    def _seed_in_memory_default(self) -> None:
        email = "ncr@a1betting.com"
        if email in self._users:
            return
        record = self._new_memory_user(email, "A1Betting1337!", "NCR", "User")
        record["is_verified"] = True
        self._users[email] = record

    @staticmethod
    def _normalize_email(email: Optional[str]) -> str:
        return (email or "").strip().lower()

    @staticmethod
    def _derive_username(email: str) -> str:
        base = email.split("@", 1)[0]
        return base or email


_auth_service = AuthService()


def get_auth_service() -> AuthService:
    return _auth_service


__all__ = ["AuthService", "UserProfile", "get_auth_service"]
