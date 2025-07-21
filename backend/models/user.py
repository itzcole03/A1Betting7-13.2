import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func
from werkzeug.security import check_password_hash, generate_password_hash

from .base import Base

logger = logging.getLogger(__name__)


class User(Base):
    """User model for authentication and user management."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    api_key_encrypted = Column(String(512), unique=True, index=True, nullable=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def set_password(self, password: str) -> None:
        """Set password hash using Argon2 (recommended) or fallback to bcrypt/PBKDF2."""
        try:
            from passlib.context import CryptContext

            pwd_context = CryptContext(
                schemes=["argon2", "bcrypt", "pbkdf2_sha256"], deprecated="auto"
            )
            self.password_hash = pwd_context.hash(password)
        except ImportError:
            self.password_hash = generate_password_hash(password)
        except Exception as e:
            logger.error(
                "Password hashing failed for user %s: %s", self.username, str(e)
            )
            raise

    def check_password(self, password: str) -> bool:
        """Check if provided password matches hash using Argon2/bcrypt/PBKDF2."""
        hash_value = getattr(self, "password_hash", None)
        if not isinstance(hash_value, str):
            logger.warning("Password hash is not a string for user %s", self.username)
            return False
        try:
            from passlib.context import CryptContext

            pwd_context = CryptContext(
                schemes=["argon2", "bcrypt", "pbkdf2_sha256"], deprecated="auto"
            )
            result = pwd_context.verify(password, hash_value)
        except ImportError:
            result = check_password_hash(hash_value, password)
        except Exception as e:
            logger.error(
                "Password verification error for user %s: %s", self.username, str(e)
            )
            return False
        if not result:
            logger.warning("Password verification failed for user %s", self.username)
        return result

    def generate_api_key(self) -> str:
        """Generate a secure random API key and store its hash."""
        import hashlib
        import secrets

        api_key = secrets.token_urlsafe(32)
        self.api_key_encrypted = hashlib.sha256(api_key.encode()).hexdigest()
        return api_key

    def verify_api_key(self, api_key: str) -> bool:
        """Verify a provided API key against the stored hash."""
        import hashlib

        key_hash = getattr(self, "api_key_encrypted", None)
        if not isinstance(key_hash, str):
            logger.warning("API key hash is not a string for user %s", self.username)
            return False
        result = key_hash == hashlib.sha256(api_key.encode()).hexdigest()
        if not result:
            logger.warning("API key verification failed for user %s", self.username)
        return result

    def generate_token(
        self,
        secret_key: str,
        expires_delta: Optional[timedelta] = None,
        refresh: bool = False,
    ) -> str:
        """Generate JWT access or refresh token for user."""
        now = datetime.now(timezone.utc)
        if refresh:
            expire = now + timedelta(days=7)  # Refresh token: 7 days
        elif expires_delta:
            expire = now + expires_delta
        else:
            expire = now + timedelta(minutes=15)  # Access token: 15 min

        payload: dict[str, object] = {
            "user_id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "exp": expire,
            "iat": now,
            "type": "refresh" if refresh else "access",
        }
        return jwt.encode(payload, secret_key, algorithm="HS256")

    @staticmethod
    def verify_token(token: str, secret_key: str) -> Optional[dict[str, object]]:
        """Verify JWT token and return payload."""
        try:
            payload: dict[str, object] = jwt.decode(
                token, secret_key, algorithms=["HS256"]
            )
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired.")
            return None
        except jwt.InvalidTokenError:
            logger.warning("JWT token invalid.")
            return None

    def to_dict(
        self,
        include_fields: Optional[list[str]] = None,
        exclude_fields: Optional[list[str]] = None,
    ) -> dict[str, object]:
        """
        Convert user object to dictionary, excluding sensitive fields by default.
        Optionally include or exclude specific fields.
        """
        created = getattr(self, "created_at", None)
        updated = getattr(self, "updated_at", None)
        base_dict = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": (
                created.isoformat() if isinstance(created, datetime) else None
            ),
            "updated_at": (
                updated.isoformat() if isinstance(updated, datetime) else None
            ),
        }
        # Remove sensitive fields
        sensitive = {"password_hash", "api_key_encrypted"}
        for field in sensitive:
            base_dict.pop(field, None)
        # Handle include/exclude
        if include_fields:
            return {k: v for k, v in base_dict.items() if k in include_fields}
        if exclude_fields:
            for field in exclude_fields:
                base_dict.pop(field, None)
        return base_dict
