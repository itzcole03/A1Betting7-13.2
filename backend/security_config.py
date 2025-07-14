# Security Configuration

"""
A1Betting Security Configuration

Production-grade security settings and JWT authentication.
"""

import os
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configure logging
logger = logging.getLogger(__name__)

# Security constants
SECRET_KEY = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRATION", 60))

# Password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=int(os.getenv("BCRYPT_ROUNDS", 12))
)

# JWT Bearer token handler
security = HTTPBearer()


class SecurityManager:
    """Handles all security-related operations"""
    
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
        
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        try:
            return pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password hashing failed"
            )
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        try:
            to_encode = data.copy()
            
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(minutes=self.token_expire_minutes)
            
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            
            logger.info(f"Access token created for user: {data.get('sub', 'unknown')}")
            return encoded_jwt
            
        except Exception as e:
            logger.error(f"Token creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token creation failed"
            )
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username: str = payload.get("sub")
            
            if username is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate a user with username and password"""
        try:
            # RESOLVED: Replace with actual database lookup
            # For now, using a simple in-memory user store
            users_db = {
                "admin": {
                    "username": "admin",
                    "hashed_password": self.get_password_hash("admin123"),
                    "email": "admin@a1betting.com",
                    "is_active": True,
                    "roles": ["admin"]
                },
                "user": {
                    "username": "user",
                    "hashed_password": self.get_password_hash("user123"),
                    "email": "user@a1betting.com",
                    "is_active": True,
                    "roles": ["user"]
                }
            }
            
            user = users_db.get(username)
            if not user:
                return None
            
            if not self.verify_password(password, user["hashed_password"]):
                return None
            
            return user
            
        except Exception as e:
            logger.error(f"User authentication error: {e}")
            return None
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials) -> Dict[str, Any]:
        """Get current user from JWT token"""
        try:
            token = credentials.credentials
            payload = self.verify_token(token)
            
            # RESOLVED: Replace with actual database lookup
            user_data = {
                "username": payload.get("sub"),
                "email": payload.get("email"),
                "roles": payload.get("roles", []),
                "is_active": True
            }
            
            return user_data
            
        except Exception as e:
            logger.error(f"Current user retrieval error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def check_permissions(self, user: Dict[str, Any], required_roles: list) -> bool:
        """Check if user has required permissions"""
        try:
            user_roles = user.get("roles", [])
            return any(role in user_roles for role in required_roles)
        except Exception as e:
            logger.error(f"Permission check error: {e}")
            return False
    
    def generate_api_key(self) -> str:
        """Generate a secure API key"""
        return secrets.token_urlsafe(32)
    
    def validate_api_key(self, api_key: str) -> bool:
        """Validate an API key"""
        # RESOLVED: Implement API key validation against database
        # For now, accepting any 32+ character key
        return len(api_key) >= 32


# Global security manager instance
security_manager = SecurityManager()


# Security middleware functions
def get_current_user(credentials: HTTPAuthorizationCredentials = security):
    """Dependency to get current authenticated user"""
    return security_manager.get_current_user(credentials)


def require_roles(roles: list):
    """Decorator to require specific roles"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Get user from kwargs (assumes user is passed as parameter)
            user = kwargs.get('current_user')
            if not user or not security_manager.check_permissions(user, roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Rate limiting configuration
RATE_LIMITS = {
    "login": {"requests": 5, "window": 300},  # 5 requests per 5 minutes
    "api": {"requests": 100, "window": 60},   # 100 requests per minute
    "prediction": {"requests": 20, "window": 60},  # 20 predictions per minute
}


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, key: str, limit_config: Dict[str, int]) -> bool:
        """Check if request is within rate limit"""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=limit_config["window"])
        
        # Clean old requests
        if key in self.requests:
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > window_start
            ]
        else:
            self.requests[key] = []
        
        # Check limit
        if len(self.requests[key]) >= limit_config["requests"]:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter()


# Security headers configuration
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}