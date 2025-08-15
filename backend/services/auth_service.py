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
