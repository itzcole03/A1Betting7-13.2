from sqlalchemy import JSON, Column, DateTime, Float, Integer, String

from backend.models.base import Base


class UserORM(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    api_key_encrypted = Column(String(512), unique=True, index=True, nullable=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    is_active = Column(Integer, default=1)
    is_verified = Column(Integer, default=0)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    risk_tolerance = Column(String(20), default="moderate")
    preferred_stake = Column(Float, default=50.0)
    bookmakers = Column(JSON, default=list)
    settings = Column(JSON, default=dict)
    last_login = Column(DateTime(timezone=True), nullable=True)


from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import JSON
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    @classmethod
    def verify_token(cls, token: str, secret: str):
        import jwt

        return jwt.decode(token, secret, algorithms=["HS256"])

    @property
    def password_hash(self):
        return self.hashed_password

    @password_hash.setter
    def password_hash(self, value):
        self.hashed_password = value

    def generate_api_key(self):
        # Dummy implementation for test compatibility
        import secrets

        api_key = secrets.token_urlsafe(32)
        self.api_key_encrypted = api_key  # Not actually encrypted here
        return api_key

    def verify_api_key(self, api_key: str) -> bool:
        # Dummy implementation for test compatibility
        return self.api_key_encrypted == api_key

    def generate_token(self, secret: str, refresh: bool = False) -> str:
        # Dummy JWT for test compatibility
        import jwt

        payload = {
            "user_id": self.id,
            "username": self.username,
            "type": "refresh" if refresh else "access",
        }
        return jwt.encode(payload, secret, algorithm="HS256")

    def to_dict(self):
        # Exclude sensitive fields for test compatibility
        d = self.model_dump()
        d.pop("api_key_encrypted", None)
        d.pop("hashed_password", None)
        d.pop("password_hash", None)
        return d

    last_login: Optional[datetime] = Field(default=None)
    """User model for authentication and user management."""

    id: str = Field(primary_key=True)
    username: str = Field(index=True, nullable=False, unique=True, max_length=50)
    email: str = Field(index=True, nullable=False, unique=True, max_length=100)
    hashed_password: str = Field(nullable=False, max_length=255)
    api_key_encrypted: Optional[str] = Field(
        default=None, index=True, unique=True, max_length=512
    )
    first_name: Optional[str] = Field(default=None, max_length=50)
    last_name: Optional[str] = Field(default=None, max_length=50)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    # Profile information
    risk_tolerance: Optional[str] = Field(default="moderate", max_length=20)
    preferred_stake: Optional[float] = Field(default=50.0)
    bookmakers: Optional[list] = Field(default_factory=list, sa_type=JSON)
    # Settings
    settings: Optional[dict] = Field(default_factory=dict, sa_type=JSON)

    def set_password(self, password: str):
        from backend.auth.security import get_password_hash

        self.hashed_password = get_password_hash(password)

    def check_password(self, password: str) -> bool:
        from backend.auth.security import verify_password

        return verify_password(password, self.hashed_password)
