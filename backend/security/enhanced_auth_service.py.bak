"""
Enhanced Authentication Service with JWT Exp Skew Handling & Refresh Token Rotation

This service provides enterprise-grade JWT authentication with:
- Clock skew tolerance for JWT expiration validation
- Secure refresh token rotation with revocation tracking
- Enhanced token validation with proper error handling
- Token blacklist management for secure logout
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import uuid4
import time
import json
import hashlib
import hmac

import jwt
from fastapi import HTTPException, status
from pydantic import BaseModel

from backend.services.unified_config import unified_config
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import unified_logging

logger = unified_logging.get_logger("enhanced_auth")

class TokenClaims(BaseModel):
    """Standard JWT claims with custom fields"""
    sub: str  # subject (user_id)
    iat: int  # issued at
    exp: int  # expires at
    nbf: int  # not before
    aud: str  # audience
    iss: str  # issuer
    jti: str  # JWT ID (unique token identifier)
    
    # Custom claims
    role: str = "user"
    permissions: List[str] = []
    session_id: str
    token_type: str = "access"  # access, refresh
    device_id: Optional[str] = None

class RefreshTokenData(BaseModel):
    """Refresh token metadata for rotation tracking"""
    token_id: str
    user_id: str
    device_id: Optional[str]
    created_at: datetime
    expires_at: datetime
    rotation_count: int = 0
    is_revoked: bool = False
    parent_token_id: Optional[str] = None

class EnhancedAuthService:
    """
    Enhanced Authentication Service with enterprise security features
    """
    
    def __init__(self):
        """Initialize the enhanced auth service"""
        # unified_config is a manager; use get_config() to access the ApplicationConfig
        config_obj = unified_config.get_config() if hasattr(unified_config, "get_config") else unified_config
        self.config = config_obj
        self.error_handler = unified_error_handler

        # JWT configuration with defaults
        self.secret_key = (
            getattr(getattr(self.config, "api", object()), "jwt_secret", None)
            or "dev-secret-key-change-in-production"
        )
        self.algorithm = "HS256"
        self.access_token_expire_minutes = (
            getattr(getattr(self.config, "api", object()), "jwt_expire_minutes", None) or 15
        )
        self.refresh_token_expire_days = (
            getattr(getattr(self.config, "api", object()), "jwt_refresh_expire_days", 30)
        )

        # Clock skew tolerance (5 minutes default)
        self.clock_skew_tolerance_seconds = 300

        # Token blacklist for revoked tokens (in-memory for demo, should use Redis in production)
        self._token_blacklist = set()
        self._refresh_tokens = {}

        # Rate limiting for token operations
        self._token_attempts = {}
        self.max_token_attempts_per_minute = 10

        logger.info("Enhanced Auth Service initialized")
    
    def _is_token_blacklisted(self, jti: str) -> bool:
        """Check if token is in blacklist"""
        return jti in self._token_blacklist
    
    def _add_to_blacklist(self, jti: str) -> None:
        """Add token to blacklist"""
        self._token_blacklist.add(jti)
        logger.info(f"Token {jti[:8]}... added to blacklist")
    
    def _check_rate_limit(self, identifier: str) -> bool:
        """Check if identifier is within rate limits"""
        now = time.time()
        minute_ago = now - 60
        
        # Clean old attempts
        if identifier in self._token_attempts:
            self._token_attempts[identifier] = [
                attempt for attempt in self._token_attempts[identifier]
                if attempt > minute_ago
            ]
        else:
            self._token_attempts[identifier] = []
        
        # Check current attempts
        current_attempts = len(self._token_attempts[identifier])
        if current_attempts >= self.max_token_attempts_per_minute:
            return False
        
        # Record this attempt
        self._token_attempts[identifier].append(now)
        return True
    
    def create_access_token(
        self,
        user_id: str,
        role: str = "user",
        permissions: List[str] = None,
        session_id: str = None,
        device_id: str = None
    ) -> str:
        """
        Create JWT access token with enhanced security
        
        Args:
            user_id: User identifier
            role: User role (user, admin, etc.)
            permissions: List of specific permissions
            session_id: Session identifier
            device_id: Device identifier for tracking
            
        Returns:
            Encoded JWT access token
        """
        if not self._check_rate_limit(f"create_token:{user_id}"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many token creation attempts"
            )
        
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=self.access_token_expire_minutes)
        
        claims = TokenClaims(
            sub=user_id,
            iat=int(now.timestamp()),
            exp=int(expires_at.timestamp()),
            nbf=int(now.timestamp()),
            aud="a1betting-api",
            iss="a1betting-auth",
            jti=str(uuid4()),
            role=role,
            permissions=permissions or [],
            session_id=session_id or str(uuid4()),
            token_type="access",
            device_id=device_id
        )
        
        token = jwt.encode(
            claims.dict(),
            self.secret_key,
            algorithm=self.algorithm
        )
        
        logger.info(f"Access token created for user {user_id}, expires at {expires_at}")
        return token
    
    def create_refresh_token(
        self,
        user_id: str,
        device_id: str = None,
        parent_token_id: str = None
    ) -> Tuple[str, RefreshTokenData]:
        """
        Create refresh token with rotation tracking
        
        Args:
            user_id: User identifier
            device_id: Device identifier
            parent_token_id: Previous refresh token ID for rotation chain
            
        Returns:
            Tuple of (refresh_token, token_data)
        """
        if not self._check_rate_limit(f"create_refresh:{user_id}"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many refresh token creation attempts"
            )
        
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=self.refresh_token_expire_days)
        token_id = str(uuid4())
        
        # Calculate rotation count
        rotation_count = 0
        if parent_token_id and parent_token_id in self._refresh_tokens:
            rotation_count = self._refresh_tokens[parent_token_id].rotation_count + 1
        
        # Create token data for tracking
        token_data = RefreshTokenData(
            token_id=token_id,
            user_id=user_id,
            device_id=device_id,
            created_at=now,
            expires_at=expires_at,
            rotation_count=rotation_count,
            parent_token_id=parent_token_id
        )
        
        # Store in tracking system
        self._refresh_tokens[token_id] = token_data
        
        # Create JWT claims
        claims = TokenClaims(
            sub=user_id,
            iat=int(now.timestamp()),
            exp=int(expires_at.timestamp()),
            nbf=int(now.timestamp()),
            aud="a1betting-refresh",
            iss="a1betting-auth",
            jti=token_id,
            role="refresh",
            session_id=str(uuid4()),
            token_type="refresh",
            device_id=device_id
        )
        
        refresh_token = jwt.encode(
            claims.dict(),
            self.secret_key,
            algorithm=self.algorithm
        )
        
        logger.info(f"Refresh token created for user {user_id}, rotation count: {rotation_count}")
        return refresh_token, token_data
    
    def verify_token_with_skew(
        self,
        token: str,
        expected_type: str = "access",
        check_blacklist: bool = True
    ) -> TokenClaims:
        """
        Verify JWT token with clock skew tolerance
        
        Args:
            token: JWT token to verify
            expected_type: Expected token type (access, refresh)
            check_blacklist: Whether to check token blacklist
            
        Returns:
            Verified token claims
            
        Raises:
            HTTPException: If token is invalid, expired, or revoked
        """
        try:
            # First, decode without verification to get claims for logging
            unverified_claims = jwt.decode(token, options={"verify_signature": False})
            jti = unverified_claims.get("jti", "unknown")
            user_id = unverified_claims.get("sub", "unknown")
            
            # Check blacklist first
            if check_blacklist and self._is_token_blacklisted(jti):
                logger.warning(f"Blacklisted token attempted: {jti[:8]}... by user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
            
            # Rate limit token verification attempts
            if not self._check_rate_limit(f"verify_token:{user_id}"):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many token verification attempts"
                )
            
            # Verify with clock skew tolerance
            now = datetime.now(timezone.utc).timestamp()
            
            try:
                # Standard verification
                payload = jwt.decode(
                    token,
                    self.secret_key,
                    algorithms=[self.algorithm],
                    audience=f"a1betting-{expected_type}" if expected_type == "refresh" else "a1betting-api"
                )
            except jwt.ExpiredSignatureError:
                # Check if token is within clock skew tolerance
                payload = jwt.decode(
                    token,
                    self.secret_key,
                    algorithms=[self.algorithm],
                    options={"verify_exp": False}
                )
                
                exp_time = payload.get("exp")
                if exp_time and (now - exp_time) <= self.clock_skew_tolerance_seconds:
                    logger.info(f"Token accepted within clock skew tolerance: {now - exp_time:.1f}s")
                else:
                    logger.warning(f"Token expired beyond skew tolerance: {now - exp_time:.1f}s")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired"
                    )
            
            # Validate token type
            token_type = payload.get("token_type", "access")
            if token_type != expected_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {expected_type}, got {token_type}"
                )
            
            # Create and validate claims object
            claims = TokenClaims(**payload)
            
            logger.info(f"Token verified successfully for user {claims.sub}, type: {token_type}")
            return claims
            
        except HTTPException:
            raise
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token verification failed"
            )
    
    def refresh_access_token(self, refresh_token: str) -> Tuple[str, str]:
        """
        Refresh access token using refresh token with rotation
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            Tuple of (new_access_token, new_refresh_token)
        """
        # Verify refresh token
        refresh_claims = self.verify_token_with_skew(refresh_token, expected_type="refresh")
        
        # Check if refresh token is still valid in our tracking system
        token_data = self._refresh_tokens.get(refresh_claims.jti)
        if not token_data or token_data.is_revoked:
            logger.warning(f"Refresh token not found or revoked: {refresh_claims.jti[:8]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or revoked"
            )
        
        # Check rotation limits (prevent excessive rotation)
        if token_data.rotation_count >= 10:
            logger.warning(f"Refresh token rotation limit exceeded: {refresh_claims.jti[:8]}...")
            self.revoke_refresh_token(refresh_claims.jti)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token rotation limit exceeded"
            )
        
        # Revoke old refresh token
        self.revoke_refresh_token(refresh_claims.jti)
        
        # Create new access token
        new_access_token = self.create_access_token(
            user_id=refresh_claims.sub,
            role=refresh_claims.role,
            permissions=refresh_claims.permissions,
            device_id=refresh_claims.device_id
        )
        
        # Create new refresh token (rotation)
        new_refresh_token, _ = self.create_refresh_token(
            user_id=refresh_claims.sub,
            device_id=refresh_claims.device_id,
            parent_token_id=refresh_claims.jti
        )
        
        logger.info(f"Token refreshed for user {refresh_claims.sub}")
        return new_access_token, new_refresh_token
    
    def revoke_token(self, token: str) -> None:
        """
        Revoke a token (add to blacklist)
        
        Args:
            token: Token to revoke
        """
        try:
            # Decode to get JTI
            payload = jwt.decode(token, options={"verify_signature": False})
            jti = payload.get("jti")
            
            if jti:
                self._add_to_blacklist(jti)
                
                # If it's a refresh token, mark as revoked in tracking
                if jti in self._refresh_tokens:
                    self._refresh_tokens[jti].is_revoked = True
                    
        except Exception as e:
            logger.error(f"Error revoking token: {str(e)}")
    
    def revoke_refresh_token(self, token_id: str) -> None:
        """
        Revoke a specific refresh token
        
        Args:
            token_id: Refresh token ID to revoke
        """
        if token_id in self._refresh_tokens:
            self._refresh_tokens[token_id].is_revoked = True
            self._add_to_blacklist(token_id)
            logger.info(f"Refresh token revoked: {token_id[:8]}...")
    
    def revoke_user_tokens(self, user_id: str, exclude_session: str = None) -> int:
        """
        Revoke all tokens for a user (except optionally one session)
        
        Args:
            user_id: User whose tokens to revoke
            exclude_session: Session ID to exclude from revocation
            
        Returns:
            Number of tokens revoked
        """
        revoked_count = 0
        
        # Revoke all refresh tokens for user
        for token_id, token_data in self._refresh_tokens.items():
            if (token_data.user_id == user_id and 
                not token_data.is_revoked and 
                token_id != exclude_session):
                
                token_data.is_revoked = True
                self._add_to_blacklist(token_id)
                revoked_count += 1
        
        logger.info(f"Revoked {revoked_count} tokens for user {user_id}")
        return revoked_count
    
    def get_token_info(self, token: str) -> Dict[str, Any]:
        """
        Get information about a token (for debugging/admin purposes)
        
        Args:
            token: Token to analyze
            
        Returns:
            Token information
        """
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            
            exp_time = payload.get("exp")
            exp_datetime = datetime.fromtimestamp(exp_time, timezone.utc) if exp_time else None
            
            iat_time = payload.get("iat")
            iat_datetime = datetime.fromtimestamp(iat_time, timezone.utc) if iat_time else None
            
            jti = payload.get("jti", "unknown")
            
            return {
                "jti": jti,
                "user_id": payload.get("sub"),
                "token_type": payload.get("token_type", "access"),
                "role": payload.get("role"),
                "issued_at": iat_datetime.isoformat() if iat_datetime else None,
                "expires_at": exp_datetime.isoformat() if exp_datetime else None,
                "is_expired": exp_datetime < datetime.now(timezone.utc) if exp_datetime else None,
                "is_blacklisted": self._is_token_blacklisted(jti),
                "session_id": payload.get("session_id"),
                "device_id": payload.get("device_id")
            }
        except Exception as e:
            return {"error": str(e)}
    
    def cleanup_expired_tokens(self) -> int:
        """
        Clean up expired refresh tokens from tracking
        
        Returns:
            Number of tokens cleaned up
        """
        now = datetime.now(timezone.utc)
        expired_tokens = []
        
        for token_id, token_data in self._refresh_tokens.items():
            if token_data.expires_at < now:
                expired_tokens.append(token_id)
        
        for token_id in expired_tokens:
            del self._refresh_tokens[token_id]
            self._token_blacklist.discard(token_id)
        
        logger.info(f"Cleaned up {len(expired_tokens)} expired refresh tokens")
        return len(expired_tokens)

# Global instance
enhanced_auth_service = EnhancedAuthService()

# Export for easy imports
__all__ = ["enhanced_auth_service", "EnhancedAuthService", "TokenClaims", "RefreshTokenData"]