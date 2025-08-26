import asyncio
import hashlib
import hmac
import time
from typing import Dict, Optional


class AuthService:
    def __init__(self):
        # In-memory user store: email -> user dict
        self._users: Dict[str, Dict] = {}

    async def register(self, email: str, password: str, first_name: str = "", last_name: str = "") -> Dict:
        await asyncio.sleep(0)
        if email in self._users:
            raise ValueError("User already exists")
        # store simple hashed password
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        user = {
            "email": email,
            "password": pw_hash,
            "first_name": first_name,
            "last_name": last_name,
            "id": email,
            "is_verified": False,
        }
        self._users[email] = user
        return {"user": {"email": email, "first_name": first_name, "last_name": last_name, "id": email}}

    async def authenticate(self, email: str, password: str) -> Dict:
        await asyncio.sleep(0)
        user = self._users.get(email)
        if not user:
            raise ValueError("Invalid credentials")
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        if not hmac.compare_digest(pw_hash, user["password"]):
            raise ValueError("Invalid credentials")
        # Generate deterministic tokens
        ts = int(time.time())
        access = f"access-{email}-{ts}"
        refresh = f"refresh-{email}-{ts}"
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": {"email": email, "id": email, "first_name": user.get("first_name"), "last_name": user.get("last_name")},
        }

    async def refresh(self, token: str) -> Dict:
        await asyncio.sleep(0)
        # Accept refresh tokens that start with 'refresh-'
        if not token or not token.startswith("refresh-"):
            raise ValueError("Invalid refresh token")
        # extract email if possible
        parts = token.split("-")
        if len(parts) < 2:
            raise ValueError("Invalid refresh token")
        email = parts[1]
        if email not in self._users:
            raise ValueError("Unknown user")
        ts = int(time.time())
        new_access = f"access-{email}-{ts}"
        new_refresh = f"refresh-{email}-{ts}"
        return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}

    async def me(self, token: str) -> Dict:
        await asyncio.sleep(0)
        if not token:
            raise ValueError("Missing token")
        # token expected format: access-<email>-<ts>
        parts = token.split("-")
        if len(parts) < 2:
            raise ValueError("Invalid token")
        email = parts[1]
        user = self._users.get(email)
        if not user:
            raise ValueError("User not found")
        # return public user info
        return {"email": user["email"], "first_name": user.get("first_name"), "last_name": user.get("last_name"), "id": user["id"]}


# Singleton instance used by other modules
_auth_service = AuthService()


def get_auth_service() -> AuthService:
    return _auth_service
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

import jwt
from fastapi import HTTPException

from backend.config import config
from backend.services.database_service import User


def get_user_by_id(user_id: str) -> Optional[User]:
    """Get user by ID - placeholder implementation
    
    Args:
        user_id: The unique identifier for the user
        
    Returns:
        User object if found, None otherwise
        
    Note:
        This should be implemented with proper database session handling
    """
    # This should be implemented based on your database service
    # For now, return None as this is a placeholder
    return None


def verify_token(token: str) -> User:
    """Verify JWT token and return user if valid
    
    Args:
        token: JWT token to verify
        
    Returns:
        User object if token is valid and user needs verification
        
    Raises:
        HTTPException: If token is invalid, expired, or user is already verified
    """
    try:
        payload: Dict[str, Any] = jwt.decode(token, config.secret_key, algorithms=["HS256"])
        user_id: Optional[str] = payload.get("sub")
        if user_id:
            user = get_user_by_id(user_id)  # Assuming a function to get user by ID exists
            if user and not user.is_verified:  # Check if user exists and needs verification
                return user  # Return the user object
            raise HTTPException(
                status_code=400, detail="User already verified or not found"
            )
        raise HTTPException(status_code=400, detail="Invalid token payload")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid token")
