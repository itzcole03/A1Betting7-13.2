import asyncio
import time
from typing import Dict, Any, Optional, Set, List

from .auth_service import get_auth_service


class SecurityService:
    def __init__(self):
        self.auth = get_auth_service()
        self.api_keys: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Set[str] = set()
        self.blacklisted_tokens: Set[str] = set()
        self.security_events: List[Any] = []

    @property
    def users(self):
        return getattr(self.auth, "_users", {})

    async def register_user(self, username: str, email: str, password: str, role=None):
        await asyncio.sleep(0)
        try:
            await self.auth.register(email, password)
            return True, "User created"
        except Exception as e:
            return False, str(e)

    async def login(self, username_or_email: str, password: str) -> Dict[str, Any]:
        await asyncio.sleep(0)
        result = await self.auth.authenticate(username_or_email, password)
        token = result.get("access_token")
        if token:
            self.active_sessions.add(token)
        return result


_security_service: Optional[SecurityService] = None


async def get_security_service() -> SecurityService:
    global _security_service
    if _security_service is None:
        _security_service = SecurityService()
    return _security_service
    ADMIN = "admin"
    DATA_SCIENTIST = "data_scientist"
    ANALYST = "analyst"
    API_USER = "api_user"
    VIEWER = "viewer"
    GUEST = "guest"


class PermissionLevel(Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    FULL_ACCESS = "full_access"


class SecurityEventType(Enum):
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    API_ACCESS = "api_access"
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    DATA_BREACH_ATTEMPT = "data_breach_attempt"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    TOKEN_EXPIRED = "token_expired"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
        self.api_keys: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Set[str] = set()
        self.blacklisted_tokens: Set[str] = set()
        self.security_events: List[Any] = []

    @property
    def users(self):
        # expose internal user map for compatibility
        return getattr(self.auth, "_users", {})

    async def register_user(self, username: str, email: str, password: str, role=None):
        await asyncio.sleep(0)
        try:
            await self.auth.register(email, password)
            return True, "User created"
        except Exception as e:
            return False, str(e)

    async def login(self, username_or_email: str, password: str) -> Dict[str, Any]:
        await asyncio.sleep(0)
        result = await self.auth.authenticate(username_or_email, password)
        token = result.get("access_token")
        if token:
            self.active_sessions.add(token)
        return result

    async def get_user_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        await asyncio.sleep(0)
        u = self.users.get(user_id)
        if not u:
            # maybe key by email
            for email, user in self.users.items():
                if user.get("id") == user_id or user.get("email") == user_id:
                    return {"user_id": user.get("id"), "email": user.get("email"), "username": user.get("email")}
        return {"user_id": u.get("id"), "email": u.get("email"), "username": u.get("email")} if u else None

    async def check_permission(self, user_permissions: Set[str], perm: str) -> bool:
        await asyncio.sleep(0)
        return perm in user_permissions

    async def create_api_key(self, user_id: str, name: str, permissions: Set[str], rate_limit: int, expires_days: int, allowed_ips: Optional[Set[str]] = None):
        await asyncio.sleep(0)
        key_id = f"key-{int(time.time()*1000)}"
        api_key = {"key_id": key_id, "api_key": f"api_{key_id}", "name": name, "permissions": list(permissions), "rate_limit": rate_limit, "expires_at": None, "created_at": time.time()}
        self.api_keys[key_id] = api_key
        return True, api_key, "API key created"

    async def get_security_events(self, event_type=None, limit=100):
        await asyncio.sleep(0)
        return self.security_events[:limit]


async def get_security_service() -> SecurityService:
    return SecurityService()
"""
Enterprise Security and Authentication Service
Comprehensive security framework for AI services with role-based access control,
API key management, audit logging, and threat detection.
Part of Phase 3: Advanced AI Enhancement and Multi-Sport Expansion
"""

import asyncio
import hashlib
import hmac
import json
import logging
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum
import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt
import ipaddress
import re
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class UserRole(Enum):
    ADMIN = "admin"
    DATA_SCIENTIST = "data_scientist"
    ANALYST = "analyst"
    API_USER = "api_user"
    VIEWER = "viewer"
    GUEST = "guest"

class PermissionLevel(Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    FULL_ACCESS = "full_access"

class SecurityEventType(Enum):
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    API_ACCESS = "api_access"
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    DATA_BREACH_ATTEMPT = "data_breach_attempt"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    TOKEN_EXPIRED = "token_expired"
    UNAUTHORIZED_ACCESS = "unauthorized_access"

@dataclass
class User:
    """User entity with security attributes"""
    user_id: str
    username: str
    email: str
    password_hash: str
    role: UserRole
    permissions: Set[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    failed_login_attempts: int
    account_locked_until: Optional[datetime]
    two_factor_enabled: bool
    two_factor_secret: Optional[str]
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['role'] = self.role.value
        data['permissions'] = list(self.permissions)
        data['created_at'] = self.created_at.isoformat()
        data['last_login'] = self.last_login.isoformat() if self.last_login else None
        data['account_locked_until'] = self.account_locked_until.isoformat() if self.account_locked_until else None
        return data

@dataclass
class APIKey:
    """API Key entity for programmatic access"""
    key_id: str
    api_key: str
    key_hash: str
    user_id: str
    name: str
    permissions: Set[str]
    rate_limit: int  # requests per minute
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]
    last_used: Optional[datetime]
    usage_count: int
    allowed_ips: Set[str]
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['permissions'] = list(self.permissions)
        data['allowed_ips'] = list(self.allowed_ips)
        data['created_at'] = self.created_at.isoformat()
        data['expires_at'] = self.expires_at.isoformat() if self.expires_at else None
        data['last_used'] = self.last_used.isoformat() if self.last_used else None
        # Don't expose actual key or hash
        del data['api_key']
        del data['key_hash']
        return data

@dataclass
class SecurityEvent:
    """Security event for audit logging"""
    event_id: str
    event_type: SecurityEventType
    user_id: Optional[str]
    ip_address: str
    user_agent: str
    endpoint: str
    method: str
    success: bool
    details: Dict[str, Any]
    timestamp: datetime
    risk_score: float  # 0-1, higher = more risky
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['event_type'] = self.event_type.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class AccessToken:
    """JWT access token with claims"""
    token: str
    user_id: str
    role: UserRole
    permissions: Set[str]
    issued_at: datetime
    expires_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'token': self.token,
            'user_id': self.user_id,
            'role': self.role.value,
            'permissions': list(self.permissions),
            'issued_at': self.issued_at.isoformat(),
            'expires_at': self.expires_at.isoformat()
        }

class EnterpriseSecurityService:
    """
    Enterprise-grade security service for AI platform
    
    Features:
    - User authentication and authorization
    - Role-based access control (RBAC)
    - API key management
    - Rate limiting and throttling
    - Audit logging and monitoring
    - Threat detection and prevention
    - IP whitelisting and blacklisting
    - Session management
    - Two-factor authentication
    - Password policies and encryption
    """
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # In-memory storage (would use database in production)
        self.users: Dict[str, User] = {}
        self.api_keys: Dict[str, APIKey] = {}
        self.security_events: List[SecurityEvent] = []
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.blacklisted_tokens: Set[str] = set()
        self.ip_whitelist: Set[str] = set()
        self.ip_blacklist: Set[str] = set()
        
        # Rate limiting
        self.rate_limits: Dict[str, List[datetime]] = defaultdict(list)
        self.failed_login_attempts: Dict[str, List[datetime]] = defaultdict(list)
        
        # Security configuration
        self.max_failed_logins = 5
        self.account_lockout_duration = timedelta(minutes=30)
        self.token_expiry_duration = timedelta(hours=24)
        self.api_key_expiry_duration = timedelta(days=90)
        self.session_timeout = timedelta(hours=8)
        
        # Default permissions by role
        self.role_permissions = {
            UserRole.ADMIN: {
                'ai:*', 'models:*', 'monitoring:*', 'users:*', 'system:*'
            },
            UserRole.DATA_SCIENTIST: {
                'ai:read', 'ai:write', 'models:read', 'models:write', 'monitoring:read'
            },
            UserRole.ANALYST: {
                'ai:read', 'models:read', 'monitoring:read'
            },
            UserRole.API_USER: {
                'ai:read', 'models:read'
            },
            UserRole.VIEWER: {
                'ai:read'
            },
            UserRole.GUEST: set()
        }
        
        # Initialize default admin user
        self._create_default_admin()
        
    def _create_default_admin(self) -> None:
        """Create default admin user for initial setup"""
        try:
            admin_id = "admin_001"
            if admin_id not in self.users:
                password_hash = self.pwd_context.hash("admin123!")  # Change in production
                
                admin_user = User(
                    user_id=admin_id,
                    username="admin",
                    email="admin@a1betting.com",
                    password_hash=password_hash,
                    role=UserRole.ADMIN,
                    permissions=self.role_permissions[UserRole.ADMIN].copy(),
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.now(),
                    last_login=None,
                    failed_login_attempts=0,
                    account_locked_until=None,
                    two_factor_enabled=False,
                    two_factor_secret=None
                )
                
                self.users[admin_id] = admin_user
                logger.info("Default admin user created")
                
        except Exception as e:
            logger.error(f"Failed to create default admin user: {str(e)}")
    
    async def register_user(self, username: str, email: str, password: str, 
                          role: UserRole = UserRole.VIEWER) -> Tuple[bool, str]:
        """Register a new user"""
        try:
            # Validate input
            if not self._validate_username(username):
                return False, "Invalid username format"
            
            if not self._validate_email(email):
                return False, "Invalid email format"
            
            if not self._validate_password(password):
                return False, "Password does not meet security requirements"
            
            # Check if user already exists
            for user in self.users.values():
                if user.username == username or user.email == email:
                    return False, "User already exists"
            
            # Create new user
            user_id = f"user_{secrets.token_hex(8)}"
            password_hash = self.pwd_context.hash(password)
            
            new_user = User(
                user_id=user_id,
                username=username,
                email=email,
                password_hash=password_hash,
                role=role,
                permissions=self.role_permissions[role].copy(),
                is_active=True,
                is_verified=False,  # Require email verification
                created_at=datetime.now(),
                last_login=None,
                failed_login_attempts=0,
                account_locked_until=None,
                two_factor_enabled=False,
                two_factor_secret=None
            )
            
            self.users[user_id] = new_user
            
            # Log security event
            await self._log_security_event(
                SecurityEventType.LOGIN_SUCCESS,
                user_id=user_id,
                ip_address="127.0.0.1",
                user_agent="system",
                endpoint="/register",
                method="POST",
                success=True,
                details={"action": "user_registered", "role": role.value}
            )
            
            return True, f"User {username} registered successfully"
            
        except Exception as e:
            logger.error(f"Failed to register user: {str(e)}")
            return False, "Registration failed"
    
    async def authenticate_user(self, username: str, password: str, 
                              ip_address: str = "127.0.0.1") -> Tuple[bool, Optional[AccessToken], str]:
        """Authenticate user and return access token"""
        try:
            # Check for rate limiting
            if not await self._check_rate_limit(ip_address, "login"):
                await self._log_security_event(
                    SecurityEventType.RATE_LIMIT_EXCEEDED,
                    user_id=None,
                    ip_address=ip_address,
                    user_agent="unknown",
                    endpoint="/login",
                    method="POST",
                    success=False,
                    details={"reason": "rate_limit_exceeded"}
                )
                return False, None, "Rate limit exceeded"
            
            # Find user
            user = None
            for u in self.users.values():
                if u.username == username or u.email == username:
                    user = u
                    break
            
            if not user:
                await self._log_security_event(
                    SecurityEventType.LOGIN_FAILURE,
                    user_id=None,
                    ip_address=ip_address,
                    user_agent="unknown",
                    endpoint="/login",
                    method="POST",
                    success=False,
                    details={"reason": "user_not_found", "username": username}
                )
                return False, None, "Invalid credentials"
            
            # Check if account is locked
            if user.account_locked_until and user.account_locked_until > datetime.now():
                await self._log_security_event(
                    SecurityEventType.LOGIN_FAILURE,
                    user_id=user.user_id,
                    ip_address=ip_address,
                    user_agent="unknown",
                    endpoint="/login",
                    method="POST",
                    success=False,
                    details={"reason": "account_locked"}
                )
                return False, None, "Account is locked"
            
            # Check if account is active
            if not user.is_active:
                return False, None, "Account is deactivated"
            
            # Verify password
            if not self.pwd_context.verify(password, user.password_hash):
                # Track failed login attempt
                user.failed_login_attempts += 1
                
                if user.failed_login_attempts >= self.max_failed_logins:
                    user.account_locked_until = datetime.now() + self.account_lockout_duration
                
                await self._log_security_event(
                    SecurityEventType.LOGIN_FAILURE,
                    user_id=user.user_id,
                    ip_address=ip_address,
                    user_agent="unknown",
                    endpoint="/login",
                    method="POST",
                    success=False,
                    details={"reason": "invalid_password"}
                )
                return False, None, "Invalid credentials"
            
            # Reset failed login attempts on successful login
            user.failed_login_attempts = 0
            user.account_locked_until = None
            user.last_login = datetime.now()
            
            # Generate access token
            access_token = await self._generate_access_token(user)
            
            # Create session
            session_id = secrets.token_urlsafe(32)
            self.active_sessions[session_id] = {
                'user_id': user.user_id,
                'created_at': datetime.now(),
                'last_activity': datetime.now(),
                'ip_address': ip_address
            }
            
            await self._log_security_event(
                SecurityEventType.LOGIN_SUCCESS,
                user_id=user.user_id,
                ip_address=ip_address,
                user_agent="unknown",
                endpoint="/login",
                method="POST",
                success=True,
                details={"session_id": session_id}
            )
            
            return True, access_token, "Authentication successful"
            
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            return False, None, "Authentication failed"
    
    async def _generate_access_token(self, user: User) -> AccessToken:
        """Generate JWT access token for user"""
        now = datetime.now()
        expires_at = now + self.token_expiry_duration
        
        payload = {
            'user_id': user.user_id,
            'username': user.username,
            'role': user.role.value,
            'permissions': list(user.permissions),
            'iat': now.timestamp(),
            'exp': expires_at.timestamp(),
            'iss': 'a1betting-ai-platform'
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        
        return AccessToken(
            token=token,
            user_id=user.user_id,
            role=user.role,
            permissions=user.permissions.copy(),
            issued_at=now,
            expires_at=expires_at
        )
    
    async def verify_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """Verify JWT access token"""
        try:
            # Check if token is blacklisted
            if token in self.blacklisted_tokens:
                return False, None, "Token is blacklisted"
            
            # Decode and verify token
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            
            # Check if user still exists and is active
            user_id = payload.get('user_id')
            if user_id not in self.users:
                return False, None, "User not found"
            
            user = self.users[user_id]
            if not user.is_active:
                return False, None, "User account is deactivated"
            
            return True, payload, "Token is valid"
            
        except jwt.ExpiredSignatureError:
            return False, None, "Token has expired"
        except jwt.InvalidTokenError as e:
            return False, None, f"Invalid token: {str(e)}"
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return False, None, "Token verification failed"
    
    async def create_api_key(self, user_id: str, name: str, permissions: Set[str],
                           rate_limit: int = 1000, expires_days: int = 90,
                           allowed_ips: Set[str] = None) -> Tuple[bool, Optional[APIKey], str]:
        """Create a new API key for a user"""
        try:
            if user_id not in self.users:
                return False, None, "User not found"
            
            user = self.users[user_id]
            
            # Validate permissions
            if not permissions.issubset(user.permissions):
                return False, None, "Insufficient permissions"
            
            # Generate API key
            key_id = f"ak_{secrets.token_hex(8)}"
            api_key = f"ak_{secrets.token_urlsafe(32)}"
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            
            expires_at = datetime.now() + timedelta(days=expires_days) if expires_days > 0 else None
            
            api_key_obj = APIKey(
                key_id=key_id,
                api_key=api_key,
                key_hash=key_hash,
                user_id=user_id,
                name=name,
                permissions=permissions.copy(),
                rate_limit=rate_limit,
                is_active=True,
                created_at=datetime.now(),
                expires_at=expires_at,
                last_used=None,
                usage_count=0,
                allowed_ips=allowed_ips or set()
            )
            
            self.api_keys[key_id] = api_key_obj
            
            # Return the API key object (with the actual key for one-time display)
            return True, api_key_obj, "API key created successfully"
            
        except Exception as e:
            logger.error(f"Failed to create API key: {str(e)}")
            return False, None, "API key creation failed"
    
    async def verify_api_key(self, api_key: str, ip_address: str = "127.0.0.1") -> Tuple[bool, Optional[APIKey], str]:
        """Verify API key and check permissions"""
        try:
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            
            # Find API key by hash
            api_key_obj = None
            for key_obj in self.api_keys.values():
                if key_obj.key_hash == key_hash:
                    api_key_obj = key_obj
                    break
            
            if not api_key_obj:
                return False, None, "Invalid API key"
            
            # Check if key is active
            if not api_key_obj.is_active:
                return False, None, "API key is deactivated"
            
            # Check if key has expired
            if api_key_obj.expires_at and api_key_obj.expires_at < datetime.now():
                return False, None, "API key has expired"
            
            # Check IP restrictions
            if api_key_obj.allowed_ips and ip_address not in api_key_obj.allowed_ips:
                return False, None, "IP address not allowed"
            
            # Check rate limiting
            if not await self._check_api_rate_limit(api_key_obj, ip_address):
                return False, None, "Rate limit exceeded"
            
            # Update usage
            api_key_obj.last_used = datetime.now()
            api_key_obj.usage_count += 1
            
            return True, api_key_obj, "API key is valid"
            
        except Exception as e:
            logger.error(f"API key verification failed: {str(e)}")
            return False, None, "API key verification failed"
    
    async def check_permission(self, user_permissions: Set[str], required_permission: str) -> bool:
        """Check if user has required permission"""
        try:
            # Check for wildcard permissions
            for perm in user_permissions:
                if perm == required_permission:
                    return True
                
                # Check wildcard matches (e.g., 'ai:*' matches 'ai:read')
                if perm.endswith(':*'):
                    permission_prefix = perm[:-1]  # Remove '*'
                    if required_permission.startswith(permission_prefix):
                        return True
            
            return False
            
        except Exception as e:
            logger.error(f"Permission check failed: {str(e)}")
            return False
    
    async def _check_rate_limit(self, identifier: str, action: str, limit: int = 10, 
                              window_minutes: int = 1) -> bool:
        """Check rate limiting for login attempts"""
        try:
            now = datetime.now()
            cutoff = now - timedelta(minutes=window_minutes)
            
            key = f"{identifier}:{action}"
            
            # Clean old attempts
            self.rate_limits[key] = [
                attempt for attempt in self.rate_limits[key] 
                if attempt > cutoff
            ]
            
            # Check if limit exceeded
            if len(self.rate_limits[key]) >= limit:
                return False
            
            # Record this attempt
            self.rate_limits[key].append(now)
            return True
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            return True  # Allow on error
    
    async def _check_api_rate_limit(self, api_key: APIKey, ip_address: str) -> bool:
        """Check API rate limiting"""
        return await self._check_rate_limit(
            f"api:{api_key.key_id}:{ip_address}", 
            "api_call", 
            api_key.rate_limit, 
            1
        )
    
    async def _log_security_event(self, event_type: SecurityEventType, user_id: Optional[str],
                                ip_address: str, user_agent: str, endpoint: str, method: str,
                                success: bool, details: Dict[str, Any]) -> None:
        """Log security events for audit trail"""
        try:
            event_id = f"se_{secrets.token_hex(8)}"
            risk_score = self._calculate_risk_score(event_type, ip_address, details)
            
            security_event = SecurityEvent(
                event_id=event_id,
                event_type=event_type,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint=endpoint,
                method=method,
                success=success,
                details=details,
                timestamp=datetime.now(),
                risk_score=risk_score
            )
            
            self.security_events.append(security_event)
            
            # Keep only last 10000 events (in production, store in database)
            if len(self.security_events) > 10000:
                self.security_events = self.security_events[-10000:]
            
            # Log high-risk events
            if risk_score > 0.7:
                logger.warning(f"High-risk security event: {event_type.value} - {details}")
                
        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}")
    
    def _calculate_risk_score(self, event_type: SecurityEventType, ip_address: str, 
                            details: Dict[str, Any]) -> float:
        """Calculate risk score for security event"""
        try:
            base_scores = {
                SecurityEventType.LOGIN_SUCCESS: 0.1,
                SecurityEventType.LOGIN_FAILURE: 0.4,
                SecurityEventType.API_ACCESS: 0.1,
                SecurityEventType.PERMISSION_DENIED: 0.6,
                SecurityEventType.SUSPICIOUS_ACTIVITY: 0.8,
                SecurityEventType.DATA_BREACH_ATTEMPT: 0.9,
                SecurityEventType.RATE_LIMIT_EXCEEDED: 0.5,
                SecurityEventType.TOKEN_EXPIRED: 0.2,
                SecurityEventType.UNAUTHORIZED_ACCESS: 0.7
            }
            
            score = base_scores.get(event_type, 0.5)
            
            # Increase score for suspicious IPs
            if ip_address in self.ip_blacklist:
                score += 0.3
            
            # Increase score for failed attempts
            if not details.get('success', True):
                score += 0.2
            
            return min(1.0, score)
            
        except Exception as e:
            logger.error(f"Risk score calculation failed: {str(e)}")
            return 0.5
    
    def _validate_username(self, username: str) -> bool:
        """Validate username format"""
        if len(username) < 3 or len(username) > 50:
            return False
        return re.match(r'^[a-zA-Z0-9_.-]+$', username) is not None
    
    def _validate_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _validate_password(self, password: str) -> bool:
        """Validate password strength"""
        if len(password) < 8:
            return False
        
        # Require at least one uppercase, lowercase, digit, and special character
        if not re.search(r'[A-Z]', password):
            return False
        if not re.search(r'[a-z]', password):
            return False
        if not re.search(r'\d', password):
            return False
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False
        
        return True
    
    async def get_security_events(self, user_id: Optional[str] = None, 
                                event_type: Optional[SecurityEventType] = None,
                                limit: int = 100) -> List[SecurityEvent]:
        """Get security events with optional filtering"""
        try:
            events = self.security_events
            
            if user_id:
                events = [e for e in events if e.user_id == user_id]
            
            if event_type:
                events = [e for e in events if e.event_type == event_type]
            
            # Sort by timestamp (most recent first)
            events.sort(key=lambda x: x.timestamp, reverse=True)
            
            return events[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get security events: {str(e)}")
            return []
    
    async def get_user_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user information (without sensitive data)"""
        try:
            if user_id not in self.users:
                return None
            
            user = self.users[user_id]
            user_dict = user.to_dict()
            
            # Remove sensitive information
            del user_dict['password_hash']
            if 'two_factor_secret' in user_dict:
                del user_dict['two_factor_secret']
            
            return user_dict
            
        except Exception as e:
            logger.error(f"Failed to get user info: {str(e)}")
            return None
    
    async def revoke_token(self, token: str) -> bool:
        """Revoke an access token"""
        try:
            self.blacklisted_tokens.add(token)
            return True
        except Exception as e:
            logger.error(f"Failed to revoke token: {str(e)}")
            return False
    
    async def deactivate_api_key(self, key_id: str, user_id: str) -> bool:
        """Deactivate an API key"""
        try:
            if key_id not in self.api_keys:
                return False
            
            api_key = self.api_keys[key_id]
            
            # Check ownership
            if api_key.user_id != user_id:
                # Check if user is admin
                user = self.users.get(user_id)
                if not user or user.role != UserRole.ADMIN:
                    return False
            
            api_key.is_active = False
            return True
            
        except Exception as e:
            logger.error(f"Failed to deactivate API key: {str(e)}")
            return False
    
    async def get_security_dashboard(self) -> Dict[str, Any]:
        """Get security dashboard overview"""
        try:
            now = datetime.now()
            last_24h = now - timedelta(hours=24)
            
            # Count recent events
            recent_events = [e for e in self.security_events if e.timestamp > last_24h]
            
            event_counts = defaultdict(int)
            for event in recent_events:
                event_counts[event.event_type.value] += 1
            
            # Active users
            active_users = len([u for u in self.users.values() if u.is_active])
            
            # Active API keys
            active_api_keys = len([k for k in self.api_keys.values() if k.is_active])
            
            # High-risk events
            high_risk_events = [e for e in recent_events if e.risk_score > 0.7]
            
            return {
                'total_users': len(self.users),
                'active_users': active_users,
                'total_api_keys': len(self.api_keys),
                'active_api_keys': active_api_keys,
                'recent_events_24h': len(recent_events),
                'high_risk_events_24h': len(high_risk_events),
                'event_type_counts': dict(event_counts),
                'blacklisted_tokens': len(self.blacklisted_tokens),
                'active_sessions': len(self.active_sessions),
                'system_status': 'secure',
                'last_updated': now.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get security dashboard: {str(e)}")
            return {}

# Global security service instance
security_service = EnterpriseSecurityService()

async def get_security_service() -> EnterpriseSecurityService:
    """Get the global security service instance"""
    return security_service
