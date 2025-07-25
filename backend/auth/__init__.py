"""
Authentication Module

This module provides production-ready authentication functionality including:
- JWT token management
- Password hashing with bcrypt
- User management and database operations
- Secure authentication endpoints
"""

from .security import (
    SecurityManager,
    TokenData,
    create_access_token,
    create_refresh_token,
    extract_user_from_token,
    get_password_hash,
    security_manager,
    verify_password,
    verify_token,
)
from .user_service import User, UserProfile, UserService

__all__ = [
    "SecurityManager",
    "TokenData",
    "security_manager",
    "get_password_hash",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "verify_token",
    "extract_user_from_token",
    "User",
    "UserProfile",
    "UserService",
]
