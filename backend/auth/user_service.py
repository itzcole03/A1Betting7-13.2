"""
User Service Module

This module provides real user management functionality including:
- User creation and validation
- Database operations
- User authentication
- Profile management
"""

import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from backend.auth.security import get_password_hash, verify_password
from backend.models.api_models import UserLogin, UserRegistration

logger = logging.getLogger(__name__)

# Database setup
Base = declarative_base()

# In-memory database for development (replace with real database in production)
SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    """User database model"""

    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)

    # Profile information
    risk_tolerance = Column(
        String, default="moderate"
    )  # conservative, moderate, aggressive
    preferred_stake = Column(Float, default=50.0)
    bookmakers = Column(JSON, default=list)  # List of preferred bookmakers

    # Settings
    settings = Column(JSON, default=dict)  # User preferences and settings


@dataclass
class UserProfile:
    """User profile data structure"""

    user_id: str
    username: str
    email: str
    first_name: str
    last_name: str
    risk_tolerance: str
    preferred_stake: float
    bookmakers: List[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]


class UserService:
    """Real user service for managing users"""

    def __init__(self):
        # Create tables
        Base.metadata.create_all(bind=engine)

    def get_db(self) -> Session:
        """Get database session"""
        db = SessionLocal()
        try:
            return db
        finally:
            pass  # Session will be closed by caller

    def create_user(self, user_data: UserRegistration) -> UserProfile:
        """Create a new user"""
        db = self.get_db()

        try:
            # Check if username already exists
            existing_user = (
                db.query(User).filter(User.username == user_data.username).first()
            )
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already registered",
                )

            # Check if email already exists
            existing_email = (
                db.query(User).filter(User.email == user_data.email).first()
            )
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

            # Create new user
            user_id = str(uuid.uuid4())
            hashed_password = get_password_hash(user_data.password)

            db_user = User(
                id=user_id,
                username=user_data.username,
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                hashed_password=hashed_password,
                risk_tolerance=getattr(user_data, "risk_tolerance", "moderate"),
                preferred_stake=getattr(user_data, "preferred_stake", 50.0),
                bookmakers=getattr(user_data, "bookmakers", []),
            )

            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            logger.info(f"Created new user: {user_data.username}")

            return self._user_to_profile(db_user)

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User creation failed",
            )
        finally:
            db.close()

    def authenticate_user(self, username: str, password: str) -> Optional[UserProfile]:
        """Authenticate a user with username and password"""
        db = self.get_db()

        try:
            # Find user by username or email
            user = (
                db.query(User)
                .filter((User.username == username) | (User.email == username))
                .first()
            )

            if not user:
                return None

            if not verify_password(password, user.hashed_password):
                return None

            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User account is deactivated",
                )

            # Update last login
            user.last_login = datetime.now(timezone.utc)
            db.commit()

            logger.info(f"User authenticated: {username}")

            return self._user_to_profile(user)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
        finally:
            db.close()

    def get_user_by_id(self, user_id: str) -> Optional[UserProfile]:
        """Get user by ID"""
        db = self.get_db()

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None

            return self._user_to_profile(user)

        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
        finally:
            db.close()

    def get_user_by_username(self, username: str) -> Optional[UserProfile]:
        """Get user by username"""
        db = self.get_db()

        try:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                return None

            return self._user_to_profile(user)

        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None
        finally:
            db.close()

    def update_user_profile(
        self, user_id: str, profile_data: Dict[str, Any]
    ) -> Optional[UserProfile]:
        """Update user profile"""
        db = self.get_db()

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            # Update allowed fields
            allowed_fields = [
                "first_name",
                "last_name",
                "risk_tolerance",
                "preferred_stake",
                "bookmakers",
                "settings",
            ]

            for field, value in profile_data.items():
                if field in allowed_fields and hasattr(user, field):
                    setattr(user, field, value)

            user.updated_at = datetime.now(timezone.utc)

            db.commit()
            db.refresh(user)

            logger.info(f"Updated user profile: {user_id}")

            return self._user_to_profile(user)

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating user profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Profile update failed",
            )
        finally:
            db.close()

    def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> bool:
        """Change user password"""
        db = self.get_db()

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            if not verify_password(old_password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid current password",
                )

            user.hashed_password = get_password_hash(new_password)
            user.updated_at = datetime.now(timezone.utc)

            db.commit()

            logger.info(f"Password changed for user: {user_id}")

            return True

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error changing password: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password change failed",
            )
        finally:
            db.close()

    def reset_password(self, user_id: str, new_password: str) -> bool:
        """Reset user password (for password reset flow)"""
        db = self.get_db()

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            user.hashed_password = get_password_hash(new_password)
            user.updated_at = datetime.now(timezone.utc)

            db.commit()

            logger.info(f"Password reset for user: {user_id}")

            return True

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error resetting password: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password reset failed",
            )
        finally:
            db.close()

    def deactivate_user(self, user_id: str) -> bool:
        """Deactivate a user account"""
        db = self.get_db()

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            user.is_active = False
            user.updated_at = datetime.now(timezone.utc)

            db.commit()

            logger.info(f"Deactivated user: {user_id}")

            return True

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error deactivating user: {e}")
            return False
        finally:
            db.close()

    def _user_to_profile(self, user: User) -> UserProfile:
        """Convert User model to UserProfile"""
        return UserProfile(
            user_id=user.id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            risk_tolerance=user.risk_tolerance,
            preferred_stake=user.preferred_stake,
            bookmakers=user.bookmakers or [],
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login,
        )


# Global user service instance
user_service = UserService()
