"""
Authentication Routes

This module contains all authentication-related endpoints including login, register, and user profile.
"""

import logging
from datetime import timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.auth.security import (
    create_access_token,
    create_refresh_token,
    extract_user_from_token,
    security_manager,
    verify_token,
)
from backend.auth.user_service import UserProfile, user_service
from backend.models.api_models import (
    TokenResponse,
    UserLogin,
    UserProfileResponse,
    UserRegistration,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserProfile:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        token_data = extract_user_from_token(token)

        user = user_service.get_user_by_id(token_data.user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Register a new user"""
    try:
        # Create user in database
        user_profile = user_service.create_user(user_data)

        # Create access and refresh tokens
        token_data = {
            "sub": user_profile.username,
            "user_id": user_profile.user_id,
            "scopes": ["user"],
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Convert user profile to response format
        user_dict = {
            "id": user_profile.user_id,
            "username": user_profile.username,
            "email": user_profile.email,
            "first_name": user_profile.first_name,
            "last_name": user_profile.last_name,
        }

        logger.info(f"User registered successfully: {user_data.username}")

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_dict,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin) -> Dict[str, Any]:
    """Authenticate user and return access token"""
    try:
        # Authenticate user
        user_profile = user_service.authenticate_user(
            login_data.username, login_data.password
        )

        if user_profile is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        # Create access and refresh tokens
        token_data = {
            "sub": user_profile.username,
            "user_id": user_profile.user_id,
            "scopes": ["user"],
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Convert user profile to response format
        user_dict = {
            "id": user_profile.user_id,
            "username": user_profile.username,
            "email": user_profile.email,
            "first_name": user_profile.first_name,
            "last_name": user_profile.last_name,
        }

        logger.info(f"User logged in successfully: {login_data.username}")

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_dict,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed"
        )


@router.post("/refresh")
async def refresh_token(refresh_token: str) -> TokenResponse:
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        payload = verify_token(refresh_token, token_type="refresh")

        username = payload.get("sub")
        user_id = payload.get("user_id")

        if not username or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )

        # Get user to ensure they still exist and are active
        user_profile = user_service.get_user_by_id(user_id)
        if user_profile is None or not user_profile.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # Create new access token
        token_data = {
            "sub": username,
            "user_id": user_id,
            "scopes": payload.get("scopes", ["user"]),
        }

        new_access_token = create_access_token(token_data)

        # Convert user profile to response format
        user_dict = {
            "id": user_profile.user_id,
            "username": user_profile.username,
            "email": user_profile.email,
            "first_name": user_profile.first_name,
            "last_name": user_profile.last_name,
        }

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=refresh_token,  # Keep the same refresh token
            token_type="bearer",
            user=user_dict,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token refresh failed"
        )


@router.get("/me")
async def get_current_user_info(
    current_user: UserProfile = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get current user information"""
    try:
        return {
            "id": current_user.user_id,
            "username": current_user.username,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at.isoformat(),
            "last_login": (
                current_user.last_login.isoformat() if current_user.last_login else None
            ),
        }

    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information",
        )


@router.get("/api/user/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfileResponse:
    """Get user profile information"""
    try:
        return UserProfileResponse(
            user_id=current_user.user_id,
            risk_tolerance=current_user.risk_tolerance,
            preferred_stake=current_user.preferred_stake,
            bookmakers=current_user.bookmakers,
        )

    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile",
        )


@router.put("/api/user/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileResponse,
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfileResponse:
    """Update user profile information"""
    try:
        # Convert profile data to dict
        update_data = {
            "risk_tolerance": profile_data.risk_tolerance,
            "preferred_stake": profile_data.preferred_stake,
            "bookmakers": profile_data.bookmakers,
        }

        # Update user profile
        updated_profile = user_service.update_user_profile(
            current_user.user_id, update_data
        )

        if updated_profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return UserProfileResponse(
            user_id=updated_profile.user_id,
            risk_tolerance=updated_profile.risk_tolerance,
            preferred_stake=updated_profile.preferred_stake,
            bookmakers=updated_profile.bookmakers,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile",
        )


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: UserProfile = Depends(get_current_user),
) -> Dict[str, str]:
    """Change user password"""
    try:
        success = user_service.change_password(
            current_user.user_id, old_password, new_password
        )

        if success:
            return {"message": "Password changed successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Password change failed"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed",
        )


@router.post("/logout")
async def logout_user(
    current_user: UserProfile = Depends(get_current_user),
) -> Dict[str, str]:
    """Logout user (client should discard tokens)"""
    try:
        logger.info(f"User logged out: {current_user.username}")

        return {"message": "Logged out successfully"}

    except Exception as e:
        logger.error(f"Error during logout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Logout failed"
        )
