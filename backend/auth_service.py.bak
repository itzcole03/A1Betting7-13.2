"""
Enhanced Authentication Service with Database Integration
"""

import asyncio
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session, User as UserModel

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "a1betting-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer()


class UserCreate(BaseModel):
    """User creation request model."""
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2)
    phone: Optional[str] = None


class UserLogin(BaseModel):
    """User login request model."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response model."""
    id: str
    email: str
    name: str
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime
    preferences: Dict[str, Any]


class TokenResponse(BaseModel):
    """Token response model."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class AuthService:
    """Enhanced authentication service."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def create_access_token(data: Dict[str, Any]) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """Create JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify JWT token."""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != token_type:
                raise JWTError("Invalid token type")
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    async def create_user(self, user_data: UserCreate, db: AsyncSession) -> UserModel:
        """Create new user."""
        # Check if user exists
        result = await db.execute(
            select(UserModel).where(UserModel.email == user_data.email)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = self.hash_password(user_data.password)
        user = UserModel(
            email=user_data.email,
            name=user_data.name,
            password_hash=hashed_password,
            phone=user_data.phone,
            is_active=True,
            is_verified=False,
            role="user",
            preferences={}
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    async def authenticate_user(self, email: str, password: str, db: AsyncSession) -> Optional[UserModel]:
        """Authenticate user by email and password."""
        result = await db.execute(
            select(UserModel).where(
                and_(UserModel.email == email, UserModel.is_active == True)
            )
        )
        user = result.scalar_one_or_none()
        
        if not user or not self.verify_password(password, user.password_hash):
            return None
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await db.commit()
        
        return user
    
    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security),
                              db: AsyncSession = Depends(get_db_session)) -> UserModel:
        """Get current authenticated user."""
        payload = self.verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        result = await db.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
    
    def create_token_response(self, user: UserModel) -> TokenResponse:
        """Create token response for user."""
        access_token = self.create_access_token({"sub": str(user.id)})
        refresh_token = self.create_refresh_token({"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                name=user.name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                role=user.role,
                created_at=user.created_at,
                preferences=user.preferences or {}
            )
        )


# Global auth service instance
auth_service = AuthService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> UserModel:
    """Dependency to get current authenticated user."""
    return await auth_service.get_current_user(credentials, db)


async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    """Dependency to get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user