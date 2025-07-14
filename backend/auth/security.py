"""
Real Authentication Security Module

This module provides production-ready authentication components including:
- JWT token generation and validation
- Password hashing with bcrypt
- Secure token management
- Session handling
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


class TokenData(BaseModel):
    """Token data structure"""
    username: Optional[str] = None
    user_id: Optional[str] = None
    scopes: List[str] = []


class SecurityManager:
    """Production-ready security manager for authentication"""
    
    def __init__(self):
        self.pwd_context = pwd_context
        
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        try:
            return self.pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Error hashing password: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password hashing failed"
            )
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False
    
    def create_access_token(
        self, 
        data: Dict[str, Any], 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT access token"""
        try:
            to_encode = data.copy()
            
            if expires_delta:
                expire = datetime.now(timezone.utc) + expires_delta
            else:
                expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
            to_encode.update({
                "exp": expire,
                "iat": datetime.now(timezone.utc),
                "type": "access"
            })
            
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
            
        except Exception as e:
            logger.error(f"Error creating access token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token creation failed"
            )
    
    def create_refresh_token(
        self, 
        data: Dict[str, Any], 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT refresh token"""
        try:
            to_encode = data.copy()
            
            if expires_delta:
                expire = datetime.now(timezone.utc) + expires_delta
            else:
                expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            to_encode.update({
                "exp": expire,
                "iat": datetime.now(timezone.utc),
                "type": "refresh"
            })
            
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
            
        except Exception as e:
            logger.error(f"Error creating refresh token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Refresh token creation failed"
            )
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Verify token type
            if payload.get("type") != token_type:
                logger.warning(f"Invalid token type. Expected: {token_type}, Got: {payload.get('type')}")
                raise credentials_exception
            
            # Check expiration
            exp_timestamp = payload.get("exp")
            if exp_timestamp is None:
                logger.warning("Token missing expiration")
                raise credentials_exception
            
            if datetime.now(timezone.utc) > datetime.fromtimestamp(exp_timestamp, timezone.utc):
                logger.warning("Token has expired")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT decode error: {e}")
            raise credentials_exception
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise credentials_exception
    
    def extract_user_from_token(self, token: str) -> TokenData:
        """Extract user data from a JWT token"""
        payload = self.verify_token(token)
        
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        scopes: list = payload.get("scopes", [])
        
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing username",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return TokenData(username=username, user_id=user_id, scopes=scopes)
    
    def generate_password_reset_token(self, user_id: str) -> str:
        """Generate a password reset token"""
        try:
            data = {
                "sub": user_id,
                "type": "password_reset",
                "exp": datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour expiry
            }
            
            return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
            
        except Exception as e:
            logger.error(f"Error generating password reset token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password reset token generation failed"
            )
    
    def verify_password_reset_token(self, token: str) -> str:
        """Verify a password reset token and return user ID"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            if payload.get("type") != "password_reset":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid token type"
                )
            
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid token: missing user ID"
                )
            
            return user_id
            
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token"
            )


# Global security manager instance
security_manager = SecurityManager()


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return security_manager.hash_password(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password"""
    return security_manager.verify_password(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create an access token"""
    return security_manager.create_access_token(data, expires_delta)


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a refresh token"""
    return security_manager.create_refresh_token(data, expires_delta)


def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """Verify a token"""
    return security_manager.verify_token(token, token_type)


def extract_user_from_token(token: str) -> TokenData:
    """Extract user data from token"""
    return security_manager.extract_user_from_token(token)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security_manager.verify_token(token)
        username: Optional[str] = payload.get("sub")
        user_id: Optional[str] = payload.get("user_id")
        scopes: List[str] = payload.get("scopes", [])

        # Ensure username and user_id are not None
        if username is None:
            logger.warning("Token missing username (sub) claim.")
            raise credentials_exception
        if user_id is None:
            logger.warning("Token missing user_id claim.")
            raise credentials_exception

        # Ensure scopes is a list of strings, default to empty list if not
        if not isinstance(scopes, list) or not all(isinstance(s, str) for s in scopes):
            logger.warning("Token scopes are not a list of strings; defaulting to empty list.")
            scopes = [] # Default to empty list if invalid type or content

        token_data = TokenData(username=username, user_id=user_id, scopes=scopes)
    except JWTError as e:
        logger.warning(f"JWT verification failed in get_current_user: {e}")
        raise credentials_exception from e
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {e}")
        raise credentials_exception from e
    return token_data

async def get_current_admin_user(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    if "admin" not in current_user.scopes:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user 