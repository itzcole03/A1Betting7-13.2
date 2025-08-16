"""
JWT Refresh Token Rotation System

Implements secure JWT token refresh with automatic rotation,
blacklist management, and proper security headers.

Acceptance Criteria:
- JWT refresh token rotation on each use
- Token blacklist for revoked tokens
- Secure cookie options (HttpOnly, Secure, SameSite)
- Automatic token cleanup
"""

from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, Tuple
try:
    import jwt
except ImportError:
    # Fallback if PyJWT not available
    jwt = None
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, asdict
import logging
import asyncio

from ..services.unified_logging import unified_logging
from ..services.unified_cache_service import unified_cache_service
from ..services.unified_error_handler import unified_error_handler, ErrorContext

logger = unified_logging.logger
security = HTTPBearer()
router = APIRouter(prefix="/api/auth", tags=["authentication"])


@dataclass
class TokenPair:
    """JWT token pair with metadata"""
    access_token: str
    refresh_token: str
    access_expires_at: datetime
    refresh_expires_at: datetime
    token_type: str = "bearer"
    

@dataclass
class UserClaims:
    """User claims for JWT tokens"""
    user_id: str
    username: str
    roles: list[str]
    permissions: list[str]
    session_id: str


class JWTConfig:
    """JWT configuration"""
    
    def __init__(self):
        # Token settings
        self.secret_key = self._get_secret_key()
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 15
        self.refresh_token_expire_days = 7
        
        # Cookie settings
        self.access_token_cookie_name = "access_token"
        self.refresh_token_cookie_name = "refresh_token"
        self.cookie_domain = None  # Set in production
        self.cookie_secure = True  # HTTPS only in production
        self.cookie_httponly = True
        self.cookie_samesite = "strict"
        
        # Security settings
        self.token_blacklist_ttl_hours = 24
        self.max_refresh_tokens_per_user = 5
        self.require_token_rotation = True
        
    def _get_secret_key(self) -> str:
        """Get or generate JWT secret key"""
        # In production, this should come from environment variables
        return "your-super-secret-jwt-key-change-in-production"


class TokenBlacklist:
    """Manages blacklisted tokens"""
    
    def __init__(self, config: JWTConfig):
        self.config = config
        
    async def blacklist_token(self, token_jti: str, expires_at: datetime):
        """Add token to blacklist"""
        # Calculate TTL based on token expiration
        ttl_seconds = int((expires_at - datetime.now(timezone.utc)).total_seconds())
        
        if ttl_seconds > 0:
            unified_cache_service.set(
                f"blacklist:{token_jti}",
                {"blacklisted_at": datetime.utcnow().isoformat(), "reason": "revoked"},
                ttl=ttl_seconds
            )
            
    async def is_blacklisted(self, token_jti: str) -> bool:
        """Check if token is blacklisted"""
        return unified_cache_service.get(f"blacklist:{token_jti}") is not None
        
    async def blacklist_user_tokens(self, user_id: str):
        """Blacklist all tokens for a user"""
        # Get user's active tokens
        active_tokens = unified_cache_service.get(f"user_tokens:{user_id}", default_value=[])
        
        for token_info in active_tokens:
            await self.blacklist_token(token_info["jti"], 
                                     datetime.fromisoformat(token_info["expires_at"]))
        
        # Clear user's token list
        unified_cache_service.delete(f"user_tokens:{user_id}")


class JWTManager:
    """Manages JWT token lifecycle"""
    
    def __init__(self, config: Optional[JWTConfig] = None):
        self.config = config or JWTConfig()
        self.blacklist = TokenBlacklist(self.config)
        
    def _generate_jti(self) -> str:
        """Generate unique token ID"""
        return secrets.token_urlsafe(32)
        
    def _hash_token(self, token: str) -> str:
        """Hash token for storage"""
        return hashlib.sha256(token.encode()).hexdigest()
        
    async def create_token_pair(self, user_claims: UserClaims) -> TokenPair:
        """Create new access and refresh token pair"""
        
        now = datetime.now(timezone.utc)
        access_jti = self._generate_jti()
        refresh_jti = self._generate_jti()
        
        # Access token payload
        access_payload = {
            "sub": user_claims.user_id,
            "username": user_claims.username,
            "roles": user_claims.roles,
            "permissions": user_claims.permissions,
            "session_id": user_claims.session_id,
            "type": "access",
            "jti": access_jti,
            "iat": now,
            "exp": now + timedelta(minutes=self.config.access_token_expire_minutes),
        }
        
        # Refresh token payload (minimal claims)
        refresh_payload = {
            "sub": user_claims.user_id,
            "session_id": user_claims.session_id,
            "type": "refresh",
            "jti": refresh_jti,
            "iat": now,
            "exp": now + timedelta(days=self.config.refresh_token_expire_days),
        }
        
        # Create tokens
        access_token = jwt.encode(access_payload, self.config.secret_key, algorithm=self.config.algorithm)
        refresh_token = jwt.encode(refresh_payload, self.config.secret_key, algorithm=self.config.algorithm)
        
        # Store token metadata
        await self._store_token_metadata(user_claims.user_id, refresh_jti, refresh_payload["exp"])
        
        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            access_expires_at=access_payload["exp"],
            refresh_expires_at=refresh_payload["exp"]
        )
        
    async def _store_token_metadata(self, user_id: str, token_jti: str, expires_at: datetime):
        """Store token metadata for management"""
        
        # Get current user tokens
        user_tokens = unified_cache_service.get(f"user_tokens:{user_id}", default_value=[])
        
        # Add new token
        user_tokens.append({
            "jti": token_jti,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.utcnow().isoformat()
        })
        
        # Limit tokens per user
        if len(user_tokens) > self.config.max_refresh_tokens_per_user:
            # Remove oldest token
            oldest_token = user_tokens.pop(0)
            await self.blacklist.blacklist_token(
                oldest_token["jti"],
                datetime.fromisoformat(oldest_token["expires_at"])
            )
        
        # Store updated token list
        unified_cache_service.set(
            f"user_tokens:{user_id}",
            user_tokens,
            ttl=self.config.refresh_token_expire_days * 24 * 3600
        )
        
    async def verify_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Verify JWT token and check blacklist"""
        
        try:
            # Decode token
            payload = jwt.decode(
                token,
                self.config.secret_key,
                algorithms=[self.config.algorithm]
            )
            
            # Check if token is blacklisted
            token_jti = payload.get("jti")
            if token_jti and await self.blacklist.is_blacklisted(token_jti):
                return False, None
                
            return True, payload
            
        except jwt.ExpiredSignatureError:
            return False, None
        except jwt.InvalidTokenError:
            return False, None
            
    async def refresh_token_pair(self, refresh_token: str) -> Optional[TokenPair]:
        """Refresh token pair with rotation"""
        
        # Verify refresh token
        is_valid, payload = await self.verify_token(refresh_token)
        
        if not is_valid or not payload:
            return None
            
        if payload.get("type") != "refresh":
            return None
            
        # Blacklist the used refresh token (rotation)
        if self.config.require_token_rotation:
            await self.blacklist.blacklist_token(
                payload["jti"],
                datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
            )
        
        # Get user information (this would come from database in production)
        user_claims = UserClaims(
            user_id=payload["sub"],
            username=f"user_{payload['sub']}",  # Placeholder
            roles=["user"],  # Would come from database
            permissions=["read"],  # Would come from database
            session_id=payload["session_id"]
        )
        
        # Create new token pair
        return await self.create_token_pair(user_claims)
        
    async def revoke_token(self, token: str):
        """Revoke a specific token"""
        is_valid, payload = await self.verify_token(token)
        
        if is_valid and payload:
            await self.blacklist.blacklist_token(
                payload["jti"],
                datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
            )
            
    async def revoke_user_tokens(self, user_id: str):
        """Revoke all tokens for a user"""
        await self.blacklist.blacklist_user_tokens(user_id)


# Global JWT manager instance
jwt_manager = JWTManager()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    
    token = credentials.credentials
    is_valid, payload = await jwt_manager.verify_token(token)
    
    if not is_valid or not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return payload


@router.post("/refresh", response_model=dict)
async def refresh_tokens(request: Request, response: Response):
    """Refresh JWT token pair"""
    
    try:
        # Get refresh token from cookie or Authorization header
        refresh_token = request.cookies.get(jwt_manager.config.refresh_token_cookie_name)
        
        if not refresh_token:
            # Try Authorization header
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                refresh_token = auth_header[7:]
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not provided"
            )
        
        # Refresh token pair
        new_token_pair = await jwt_manager.refresh_token_pair(refresh_token)
        
        if not new_token_pair:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Set secure cookies
        response.set_cookie(
            jwt_manager.config.access_token_cookie_name,
            new_token_pair.access_token,
            max_age=jwt_manager.config.access_token_expire_minutes * 60,
            httponly=jwt_manager.config.cookie_httponly,
            secure=jwt_manager.config.cookie_secure,
            samesite=jwt_manager.config.cookie_samesite,
            domain=jwt_manager.config.cookie_domain
        )
        
        response.set_cookie(
            jwt_manager.config.refresh_token_cookie_name,
            new_token_pair.refresh_token,
            max_age=jwt_manager.config.refresh_token_expire_days * 24 * 3600,
            httponly=jwt_manager.config.cookie_httponly,
            secure=jwt_manager.config.cookie_secure,
            samesite=jwt_manager.config.cookie_samesite,
            domain=jwt_manager.config.cookie_domain
        )
        
        logger.info("Token pair refreshed successfully", extra={
            "user_id": new_token_pair.access_token and jwt.decode(
                new_token_pair.access_token,
                jwt_manager.config.secret_key,
                algorithms=[jwt_manager.config.algorithm],
                options={"verify_exp": False}
            ).get("sub")
        })
        
        return {
            "access_token": new_token_pair.access_token,
            "token_type": new_token_pair.token_type,
            "expires_in": jwt_manager.config.access_token_expire_minutes * 60,
            "refresh_expires_in": jwt_manager.config.refresh_token_expire_days * 24 * 3600
        }
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint="/api/auth/refresh", method="POST")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/revoke")
async def revoke_token(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Revoke current token"""
    
    try:
        # Get token from Authorization header
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            await jwt_manager.revoke_token(token)
            
        logger.info("Token revoked", extra={
            "user_id": current_user.get("sub")
        })
        
        return {"message": "Token revoked successfully"}
        
    except Exception as e:
        logger.error(f"Token revocation error: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint="/api/auth/revoke", method="POST")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token revocation failed"
        )


@router.post("/revoke-all")
async def revoke_all_tokens(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Revoke all tokens for current user"""
    
    try:
        await jwt_manager.revoke_user_tokens(current_user["sub"])
        
        logger.info("All tokens revoked", extra={
            "user_id": current_user.get("sub")
        })
        
        return {"message": "All tokens revoked successfully"}
        
    except Exception as e:
        logger.error(f"Bulk token revocation error: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint="/api/auth/revoke-all", method="POST")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bulk token revocation failed"
        )