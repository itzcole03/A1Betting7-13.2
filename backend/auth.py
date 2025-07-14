import os
from typing import Optional

try:
    from database import get_db  # type: ignore[import]
except ImportError:
    get_db = None  # type: ignore[misc]

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

try:
    from models.user import User  # type: ignore[import]
except ImportError:
    User = None  # type: ignore[misc]

from sqlalchemy.orm import Session

# Security
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "a1betting-secret-key-change-in-production")


class AuthService:
    """Authentication service for user management."""

    @staticmethod
    def create_user(
        db: Session,
        username: str,
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Optional[object]:  # type: ignore[misc]
        """Create a new user."""
        if not User:
            raise HTTPException(status_code=500, detail="User model not available")

        # Check if user already exists
        existing_user = (
            db.query(User)
            .filter((User.username == username) | (User.email == email))  # type: ignore[misc]
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered",
            )

        # Create new user
        user = User(
            username=username, email=email, first_name=first_name, last_name=last_name
        )
        user.set_password(password)

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[object]:  # type: ignore[misc]
        """Authenticate user with username/email and password."""
        if not User:
            return None

        user = (
            db.query(User)
            .filter((User.username == username) | (User.email == username))  # type: ignore[misc]
            .first()
        )

        if not user or not user.check_password(password):  # type: ignore[misc]
            return None

        if not getattr(user, "is_active", True):  # type: ignore[misc]
            return None

        return user

    @staticmethod
    def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Optional[Session] = Depends(get_db) if get_db else None,  # type: ignore[misc]
    ) -> Optional[object]:  # type: ignore[misc]
        """Get current authenticated user from JWT token."""
        if not User:
            raise HTTPException(status_code=500, detail="User model not available")

        token = credentials.credentials
        payload = getattr(User, "verify_token", lambda t, k: None)(token, SECRET_KEY)  # type: ignore[misc]

        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = db.query(User).filter(getattr(User, "id", None) == payload.get("user_id")).first() if db and User else None  # type: ignore[misc]

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not getattr(user, "is_active", True):  # type: ignore[misc]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    @staticmethod
    def create_access_token(user: object) -> str:  # type: ignore[misc]
        """Create access token for user."""
        return getattr(user, "generate_token", lambda k: "mock-token")(SECRET_KEY)  # type: ignore[misc]
