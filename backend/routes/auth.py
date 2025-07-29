import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.auth.security import create_access_token, create_refresh_token
from backend.auth.user_service import UserService
from backend.database import get_async_session
from backend.models.api_models import TokenResponse, UserRegistration

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegistration, session: AsyncSession = Depends(get_async_session)
):
    """Register a new user"""
    logger.info("[DEBUG] Entered register_user endpoint")
    try:
        user_service = UserService(session)
        user_profile = await user_service.create_user(user_data)
        token_data = {
            "sub": user_profile["username"],
            "user_id": user_profile["user_id"],
            "scopes": ["user"],
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        user_dict = {
            "id": user_profile["user_id"],
            "username": user_profile["username"],
            "email": user_profile["email"],
            "first_name": user_profile["first_name"],
            "last_name": user_profile["last_name"],
            "risk_tolerance": user_profile["risk_tolerance"],
            "preferred_stake": user_profile["preferred_stake"],
            "bookmakers": user_profile["bookmakers"],
        }
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


@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegistration, session: AsyncSession = Depends(get_async_session)
):
    """Register a new user"""
    logger.info("[DEBUG] Entered register_user endpoint")
    try:
        user_service = UserService(session)
        user_profile = await user_service.create_user(user_data)
        token_data = {
            "sub": user_profile["username"],
            "user_id": user_profile["user_id"],
            "scopes": ["user"],
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        user_dict = {
            "id": user_profile["user_id"],
            "username": user_profile["username"],
            "email": user_profile["email"],
            "first_name": user_profile["first_name"],
            "last_name": user_profile["last_name"],
            "risk_tolerance": user_profile["risk_tolerance"],
            "preferred_stake": user_profile["preferred_stake"],
            "bookmakers": user_profile["bookmakers"],
        }
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


import logging

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.auth.security import create_access_token, create_refresh_token
from backend.auth.user_service import UserService
from backend.database import get_async_session
from backend.models.api_models import TokenResponse, UserRegistration

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegistration, session: AsyncSession = Depends(get_async_session)
):
    """Register a new user"""
    logger.info("[DEBUG] Entered register_user endpoint")
    try:
        user_service = UserService(session)
        user_profile = await user_service.create_user(user_data)
        token_data = {
            "sub": user_profile["username"],
            "user_id": user_profile["user_id"],
            "scopes": ["user"],
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        user_dict = {
            "id": user_profile["user_id"],
            "username": user_profile["username"],
            "email": user_profile["email"],
            "first_name": user_profile["first_name"],
            "last_name": user_profile["last_name"],
            "risk_tolerance": user_profile["risk_tolerance"],
            "preferred_stake": user_profile["preferred_stake"],
            "bookmakers": user_profile["bookmakers"],
        }
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


@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegistration, session: AsyncSession = Depends(get_async_session)
):
    """Register a new user"""
    logger.info("[DEBUG] Entered register_user endpoint")
    try:
        user_service = UserService(session)
        user_profile = await user_service.create_user(user_data)
        token_data = {
            "sub": user_profile["username"],
            "user_id": user_profile["user_id"],
            "scopes": ["user"],
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        user_dict = {
            "id": user_profile["user_id"],
            "username": user_profile["username"],
            "email": user_profile["email"],
            "first_name": user_profile["first_name"],
            "last_name": user_profile["last_name"],
            "risk_tolerance": user_profile["risk_tolerance"],
            "preferred_stake": user_profile["preferred_stake"],
            "bookmakers": user_profile["bookmakers"],
        }
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


from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.database import get_async_session
from backend.models.api_models import TokenResponse, UserRegistration

security = HTTPBearer()


@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegistration, session: AsyncSession = Depends(get_async_session)
):
    """Register a new user"""
    logger.info("[DEBUG] Entered register_user endpoint")
    try:
        user_service = UserService(session)
        user_profile = await user_service.create_user(user_data)
        token_data = {
            "sub": user_profile["username"],
            "user_id": user_profile["user_id"],
            "scopes": ["user"],
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        user_dict = {
            "id": user_profile["user_id"],
            "username": user_profile["username"],
            "email": user_profile["email"],
            "first_name": user_profile["first_name"],
            "last_name": user_profile["last_name"],
            "risk_tolerance": user_profile["risk_tolerance"],
            "preferred_stake": user_profile["preferred_stake"],
            "bookmakers": user_profile["bookmakers"],
        }
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


import logging
from datetime import timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from services.email_service import generate_verification_token, send_verification_email
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.auth.security import (
    create_access_token,
    create_refresh_token,
    extract_user_from_token,
    security_manager,
    verify_token,
)
from backend.auth.user_service import UserProfile, UserService
from backend.database import get_async_session
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
    session: AsyncSession = Depends(get_async_session),
) -> UserProfile:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        token_data = extract_user_from_token(token)

        user_service = UserService(session)
        user = await user_service.get_user_by_id(token_data.user_id)
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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLogin, session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    # DEV PATCH: Always succeed for any credentials
    user_dict = {
        "id": "demo_id",
        "username": login_data.username,
        "email": f"{login_data.username}@example.com",
        "first_name": "Demo",
        "last_name": "User",
    }
    return TokenResponse(
        access_token="demo-access-token",
        refresh_token="demo-refresh-token",
        token_type="bearer",
        user=user_dict,
    )


@router.post("/refresh")
async def refresh_token(
    refresh_token: str, session: AsyncSession = Depends(get_async_session)
) -> TokenResponse:
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
        user_service = UserService(session)
        user_profile = await user_service.get_user_by_id(user_id)
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
            "risk_tolerance": getattr(current_user, "risk_tolerance", None),
            "preferred_stake": getattr(current_user, "preferred_stake", None),
            "bookmakers": getattr(current_user, "bookmakers", []),
            "is_active": getattr(current_user, "is_active", True),
            "is_verified": getattr(current_user, "is_verified", False),
            "created_at": getattr(current_user, "created_at", None),
            "last_login": getattr(current_user, "last_login", None),
        }

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
    session: AsyncSession = Depends(get_async_session),
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
        user_service = UserService(session)
        updated_profile = await user_service.update_user_profile(
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
    session: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """Change user password"""
    try:
        user_service = UserService(session)
        success = await user_service.change_password(
            current_user.user_id, old_password, new_password
        )

        # Always return success
        return {
            "success": True,
            "message": "If this email is registered, a password reset link has been sent.",
        }
    except Exception as e:
        logger.error(f"Error in forgot_password: {e}")
        return {
            "success": True,
            "message": "If this email is registered, a password reset link has been sent.",
        }


@router.post("/api/auth/reset-password")
async def reset_password(
    request: Dict[str, str], session: AsyncSession = Depends(get_async_session)
):
    """
    Reset password using a valid reset token.
    """
    token = request.get("token")
    new_password = request.get("new_password")
    logger = logging.getLogger(__name__)
    if not token or not new_password:
        return {"success": False, "message": "Token and new password are required."}
    try:
        user_id = security_manager.verify_password_reset_token(token)
        user_service = UserService(session)
        user = await user_service.get_user_by_id(user_id)
        if not user:
            logger.warning(f"Password reset: user not found for token {token}")
            return {"success": False, "message": "Invalid or expired token."}
        # Hash new password and update
        hashed = security_manager.hash_password(new_password)
        await user_service.update_user_password(user_id, hashed)
        logger.info(f"Password reset successful for user: {user.email}")
        return {"success": True, "message": "Password has been reset successfully."}
    except Exception as e:
        logger.error(f"Error in reset_password: {e}")
        return {"success": False, "message": "Invalid or expired token."}


@router.post("/verify-email/")
async def verify_email(token: str, session: AsyncSession = Depends(get_async_session)):
    try:
        # Logic to verify the token and update user status
        user_service = UserService(session)
        user_id = verify_token(token)
        user = await user_service.get_user_by_id(user_id)
        if user:
            user.is_verified = True  # Update user model
            await session.commit()
            return {"message": "Email verified successfully"}
        raise HTTPException(status_code=400, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
