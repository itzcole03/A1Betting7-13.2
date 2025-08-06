"""
User Service Module

This module provides real user management functionality including:
"""

import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..models.api_models import UserLogin, UserRegistration
from .security import get_password_hash, verify_password

logger = logging.getLogger(__name__)


from sqlmodel import Session as SQLModelSession

from backend.database import get_async_session
from backend.models.user import User

# Module exports for external use
__all__ = ["User", "UserService"]


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
    async def get_user_by_id(self, user_id: str) -> Optional[UserProfile]:
        """Get user by ID (async version)"""
        async for session in get_async_session():
            statement = select(User).where(User.id == user_id)
            result = await session.exec(statement)
            user = result.first()
            if not user:
                return None
            return self._user_to_profile(user)

    """Real user service for managing users"""

    def __init__(self, session):
        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"[DEBUG] UserService.__init__ session type: {type(session)}")
        self.session = session

    async def get_user_by_id(self, user_id: str) -> Optional[UserProfile]:
        """Get user by ID (async)"""
        from sqlmodel.ext.asyncio.session import AsyncSession

        if not isinstance(self.session, AsyncSession):
            raise TypeError(
                f"get_user_by_id requires an AsyncSession, got {type(self.session)}"
            )
        statement = select(User).where(User.id == user_id)
        result = await self.session.exec(statement)
        user = result.first()
        if not user:
            return None
        return self._user_to_profile(user)

    async def get_user_by_username(self, username: str) -> Optional[UserProfile]:
        """Get user by username"""
        statement = select(User).where(User.username == username)
        result = await self.session.exec(statement)
        user = result.first()
        if not user:
            return None

        return self._user_to_profile(user)

    async def create_user(self, user_data: UserRegistration) -> UserProfile:
        """Create a new user"""
        try:
            logger.info("[DEBUG] Entered create_user")
            # Check if username already exists
            logger.info("[DEBUG] Before await self.session.exec for username")
            existing_user = await self.session.exec(
                select(User).where(User.username == user_data.username)
            )
            logger.info("[DEBUG] After await self.session.exec for username")
            if existing_user.first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already registered",
                )

            # Check if email already exists
            logger.info("[DEBUG] Before await self.session.exec for email")
            existing_email = await self.session.exec(
                select(User).where(User.email == user_data.email)
            )
            logger.info("[DEBUG] After await self.session.exec for email")
            if existing_email.first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

            # Create new user
            user_id = str(uuid.uuid4())
            hashed_password = get_password_hash(user_data.password)

            bookmakers_val = getattr(user_data, "bookmakers", [])
            settings_val = getattr(user_data, "settings", {})
            logger.info(
                f"[DEBUG] bookmakers type: {type(bookmakers_val)}, value: {bookmakers_val}"
            )
            logger.info(
                f"[DEBUG] settings type: {type(settings_val)}, value: {settings_val}"
            )
            db_user = User(
                id=user_id,
                username=user_data.username,
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                hashed_password=hashed_password,
                risk_tolerance=getattr(user_data, "risk_tolerance", "moderate"),
                preferred_stake=getattr(user_data, "preferred_stake", 50.0),
                bookmakers=bookmakers_val,
                settings=settings_val,
            )

            logger.info("[DEBUG] Before self.session.add(db_user)")
            self.session.add(db_user)
            logger.info("[DEBUG] After self.session.add(db_user)")
            logger.info("[DEBUG] Before await self.session.commit()")
            await self.session.commit()
            logger.info("[DEBUG] After await self.session.commit()")
            logger.info("[DEBUG] Before await self.session.refresh(db_user)")
            await self.session.refresh(db_user)
            logger.info("[DEBUG] After await self.session.refresh(db_user)")

            logger.info(f"Created new user: {user_data.username}")

            logger.info("[DEBUG] Before return user profile object")
            user_profile = self._user_to_profile(db_user)
            return user_profile

        except HTTPException:
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error creating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User creation failed",
            )

    async def update_last_login(self, user_id: str):
        """Update last login"""
        statement = select(User).where(User.id == user_id)
        result = await self.session.exec(statement)
        user = result.first()
        if user:
            user.last_login = datetime.now(timezone.utc)
            await self.session.commit()
        return user

    async def get_db(self) -> AsyncSession:
        """Get async database session"""
        async for session in get_async_session():
            return session

    # Removed duplicate create_user method that returned HTTP 409 for duplicate username. All duplicate registration errors now return HTTP 400 as required by tests.

    async def authenticate_user(
        self, username: str, password: str
    ) -> Optional[UserProfile]:
        """Authenticate a user with username and password (async)"""
        session = self.session
        try:
            statement = select(User).where(
                (User.username == username) | (User.email == username)
            )
            result = await session.exec(statement)
            user = result.first()
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
            await session.commit()
            logger.info(f"User authenticated: {username}")
            return self._user_to_profile(user)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None

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
