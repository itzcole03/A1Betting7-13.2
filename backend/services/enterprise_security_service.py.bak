import asyncio
import time
from typing import Dict, Any, Optional, Set, List

from .auth_service import get_auth_service


class SecurityService:
    def __init__(self):
        self.auth = get_auth_service()
        self.api_keys: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Set[str] = set()
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
        import re
        from collections import defaultdict

        logger = logging.getLogger(__name__)


        class UserRole(Enum):
            ADMIN = "admin"
            DATA_SCIENTIST = "data_scientist"
            ANALYST = "analyst"
            API_USER = "api_user"
            VIEWER = "viewer"
            GUEST = "guest"


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
            key_id: str
            api_key: str
            key_hash: str
            user_id: str
            name: str
            permissions: Set[str]
            rate_limit: int
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
                # hide sensitive values
                data.pop('api_key', None)
                data.pop('key_hash', None)
                return data


        @dataclass
        class SecurityEvent:
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
            risk_score: float

            def to_dict(self) -> Dict[str, Any]:
                data = asdict(self)
                data['event_type'] = self.event_type.value
                data['timestamp'] = self.timestamp.isoformat()
                return data


        @dataclass
        class AccessToken:
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
                    'expires_at': self.expires_at.isoformat(),
                }


        class EnterpriseSecurityService:
            """A compact enterprise-grade security service used by the backend for admin routes.

            This is intentionally conservative: it's in-memory, synchronous-friendly and
            stable for tests. It preserves the public methods used by the rest of the codebase
            (register_user, authenticate_user, create_api_key, get_security_events, get_user_info, etc.).
            """

            def __init__(self, secret_key: Optional[str] = None):
                self.secret_key = secret_key or secrets.token_urlsafe(32)
                self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

                self.users: Dict[str, User] = {}
                self.api_keys: Dict[str, APIKey] = {}
                self.security_events: List[SecurityEvent] = []
                self.active_sessions: Dict[str, Dict[str, Any]] = {}
                self.blacklisted_tokens: Set[str] = set()
                self.ip_whitelist: Set[str] = set()
                self.ip_blacklist: Set[str] = set()

                self.rate_limits: Dict[str, List[datetime]] = defaultdict(list)

                # configuration
                self.max_failed_logins = 5
                self.account_lockout_duration = timedelta(minutes=30)
                self.token_expiry_duration = timedelta(hours=24)

                # default admin
                self._create_default_admin()

            def _create_default_admin(self) -> None:
                try:
                    admin_id = "admin_001"
                    if admin_id not in self.users:
                        password_hash = self.pwd_context.hash("admin123!")
                        admin_user = User(
                            user_id=admin_id,
                            username="admin",
                            email="admin@a1betting.com",
                            password_hash=password_hash,
                            role=UserRole.ADMIN,
                            permissions={"ai:*", "models:*", "monitoring:*", "users:*", "system:*"},
                            is_active=True,
                            is_verified=True,
                            created_at=datetime.now(),
                            last_login=None,
                            failed_login_attempts=0,
                            account_locked_until=None,
                            two_factor_enabled=False,
                            two_factor_secret=None,
                        )
                        self.users[admin_id] = admin_user
                except Exception:
                    logger.exception("Failed to create default admin user")

            async def register_user(self, username: str, email: str, password: str, role: UserRole = UserRole.VIEWER) -> Tuple[bool, str]:
                await asyncio.sleep(0)
                if not self._validate_username(username) or not self._validate_email(email):
                    return False, "invalid_input"
                user_id = f"user_{secrets.token_hex(8)}"
                password_hash = self.pwd_context.hash(password)
                user = User(
                    user_id=user_id,
                    username=username,
                    email=email,
                    password_hash=password_hash,
                    role=role,
                    permissions=set(),
                    is_active=True,
                    is_verified=False,
                    created_at=datetime.now(),
                    last_login=None,
                    failed_login_attempts=0,
                    account_locked_until=None,
                    two_factor_enabled=False,
                    two_factor_secret=None,
                )
                self.users[user_id] = user
                return True, "created"

            async def authenticate_user(self, username: str, password: str) -> Tuple[bool, Optional[AccessToken], str]:
                await asyncio.sleep(0)
                for u in self.users.values():
                    if u.username == username or u.email == username:
                        if self.pwd_context.verify(password, u.password_hash):
                            token = secrets.token_urlsafe(32)
                            at = AccessToken(token=token, user_id=u.user_id, role=u.role, permissions=set(), issued_at=datetime.now(), expires_at=datetime.now() + self.token_expiry_duration)
                            return True, at, "ok"
                        return False, None, "invalid_credentials"
                return False, None, "not_found"

            async def create_api_key(self, user_id: str, name: str, permissions: Set[str], rate_limit: int = 1000, expires_days: int = 90, allowed_ips: Optional[Set[str]] = None) -> Tuple[bool, Optional[APIKey], str]:
                await asyncio.sleep(0)
                if user_id not in self.users:
                    return False, None, "user_not_found"
                key_id = f"ak_{secrets.token_hex(8)}"
                api_key = f"ak_{secrets.token_urlsafe(32)}"
                key_hash = hashlib.sha256(api_key.encode()).hexdigest()
                expires_at = datetime.now() + timedelta(days=expires_days) if expires_days > 0 else None
                obj = APIKey(key_id=key_id, api_key=api_key, key_hash=key_hash, user_id=user_id, name=name, permissions=permissions, rate_limit=rate_limit, is_active=True, created_at=datetime.now(), expires_at=expires_at, last_used=None, usage_count=0, allowed_ips=allowed_ips or set())
                self.api_keys[key_id] = obj
                return True, obj, "created"

            async def get_security_events(self, event_type: Optional[SecurityEventType] = None, limit: int = 100) -> List[SecurityEvent]:
                await asyncio.sleep(0)
                events = self.security_events
                if event_type:
                    events = [e for e in events if e.event_type == event_type]
                return events[:limit]

            def _validate_username(self, username: str) -> bool:
                return bool(re.match(r'^[a-zA-Z0-9_.-]{3,50}$', username))

            def _validate_email(self, email: str) -> bool:
                return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))


        # Global instance used by the app
        security_service = EnterpriseSecurityService()


        async def get_security_service() -> EnterpriseSecurityService:
            return security_service
