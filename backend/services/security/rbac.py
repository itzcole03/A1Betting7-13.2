"""
Role-Based Access Control (RBAC) System

Provides role-based gating for admin endpoints including task triggers,
factor rebuilds, and other sensitive operations.
"""

import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Any, Callable, Tuple
from dataclasses import dataclass, field
import secrets
import hashlib

from backend.services.unified_logging import get_logger
from backend.services.unified_config import unified_config

logger = get_logger("rbac")


class Role(Enum):
    """User roles in the system"""
    ANONYMOUS = "anonymous"
    USER = "user"
    PREMIUM_USER = "premium_user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    SYSTEM = "system"


class Permission(Enum):
    """System permissions"""
    # Basic permissions
    READ = "read"
    WRITE = "write"
    
    # Rationale permissions
    GENERATE_RATIONALE = "generate_rationale"
    VIEW_RATIONALE_CACHE = "view_rationale_cache"
    CLEAR_RATIONALE_CACHE = "clear_rationale_cache"
    
    # Optimization permissions
    RUN_OPTIMIZATION = "run_optimization"
    VIEW_OPTIMIZATION_HISTORY = "view_optimization_history"
    
    # Admin permissions
    VIEW_ADMIN_DASHBOARD = "view_admin_dashboard"
    MANAGE_USERS = "manage_users"
    VIEW_SYSTEM_LOGS = "view_system_logs"
    
    # Task and factor permissions
    TRIGGER_TASKS = "trigger_tasks"
    VIEW_TASK_STATUS = "view_task_status"
    CANCEL_TASKS = "cancel_tasks"
    REBUILD_FACTORS = "rebuild_factors"
    VIEW_FACTOR_STATUS = "view_factor_status"
    
    # Security permissions
    MANAGE_API_KEYS = "manage_api_keys"
    VIEW_RATE_LIMITS = "view_rate_limits"
    RESET_RATE_LIMITS = "reset_rate_limits"
    MANAGE_WEBHOOKS = "manage_webhooks"
    
    # System administration
    MANAGE_SHADOW_MODE = "manage_shadow_mode"
    VIEW_SYSTEM_METRICS = "view_system_metrics"
    MANAGE_CACHE = "manage_cache"
    RESTART_SERVICES = "restart_services"


@dataclass
class User:
    """User with role and permissions"""
    user_id: str
    username: str
    role: Role
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    api_key: Optional[str] = None
    custom_permissions: Set[Permission] = field(default_factory=set)
    rate_limit_overrides: Dict[str, int] = field(default_factory=dict)
    session_expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def has_permission(self, permission: Permission) -> bool:
        """Check if user has a specific permission"""
        if not self.is_active:
            return False
        
        # Check custom permissions first
        if permission in self.custom_permissions:
            return True
        
        # Check role-based permissions
        role_permissions = get_role_permissions(self.role)
        return permission in role_permissions
    
    def is_session_valid(self) -> bool:
        """Check if user session is still valid"""
        if not self.session_expires_at:
            return True
        return datetime.utcnow() < self.session_expires_at


@dataclass
class ApiKey:
    """API key for programmatic access"""
    key_id: str
    key_hash: str  # Hashed version of the key
    user_id: str
    role: Role
    permissions: Set[Permission] = field(default_factory=set)
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    is_active: bool = True
    last_used: Optional[datetime] = None
    usage_count: int = 0
    rate_limit_overrides: Dict[str, int] = field(default_factory=dict)
    allowed_ips: Set[str] = field(default_factory=set)  # IP whitelist
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_valid(self) -> bool:
        """Check if API key is valid"""
        if not self.is_active:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True
    
    def has_permission(self, permission: Permission) -> bool:
        """Check if API key has permission"""
        if not self.is_valid():
            return False
        
        # Check explicit permissions
        if permission in self.permissions:
            return True
        
        # Check role-based permissions
        role_permissions = get_role_permissions(self.role)
        return permission in role_permissions
    
    def is_ip_allowed(self, ip_address: str) -> bool:
        """Check if IP address is allowed for this key"""
        if not self.allowed_ips:  # Empty set means all IPs allowed
            return True
        return ip_address in self.allowed_ips


@dataclass
class AccessAttempt:
    """Record of access attempt"""
    timestamp: datetime
    user_id: Optional[str]
    api_key_id: Optional[str]
    permission: Permission
    endpoint: str
    ip_address: str
    success: bool
    reason: Optional[str] = None


class RoleBasedAccessControl:
    """Role-Based Access Control system"""
    
    def __init__(self):
        self.logger = logger
        self._users: Dict[str, User] = {}
        self._api_keys: Dict[str, ApiKey] = {}
        self._access_log: List[AccessAttempt] = []
        self._role_permissions: Dict[Role, Set[Permission]] = {}
        
        # Configuration
        self.session_timeout_hours = unified_config.get_config_value("SESSION_TIMEOUT_HOURS", 24)
        self.api_key_timeout_days = unified_config.get_config_value("API_KEY_TIMEOUT_DAYS", 365)
        self.max_access_log_entries = unified_config.get_config_value("MAX_ACCESS_LOG_ENTRIES", 10000)
        
        # Initialize role permissions
        self._setup_role_permissions()
        
        # Create default users
        self._create_default_users()
    
    def _setup_role_permissions(self):
        """Setup default permissions for each role"""
        
        # Anonymous users - very limited
        self._role_permissions[Role.ANONYMOUS] = {
            Permission.READ
        }
        
        # Regular users - basic functionality
        self._role_permissions[Role.USER] = {
            Permission.READ,
            Permission.GENERATE_RATIONALE,
            Permission.RUN_OPTIMIZATION,
            Permission.VIEW_OPTIMIZATION_HISTORY
        }
        
        # Premium users - enhanced features
        self._role_permissions[Role.PREMIUM_USER] = {
            Permission.READ,
            Permission.WRITE,
            Permission.GENERATE_RATIONALE,
            Permission.VIEW_RATIONALE_CACHE,
            Permission.RUN_OPTIMIZATION,
            Permission.VIEW_OPTIMIZATION_HISTORY
        }
        
        # Admins - management capabilities
        self._role_permissions[Role.ADMIN] = {
            Permission.READ,
            Permission.WRITE,
            Permission.GENERATE_RATIONALE,
            Permission.VIEW_RATIONALE_CACHE,
            Permission.CLEAR_RATIONALE_CACHE,
            Permission.RUN_OPTIMIZATION,
            Permission.VIEW_OPTIMIZATION_HISTORY,
            Permission.VIEW_ADMIN_DASHBOARD,
            Permission.TRIGGER_TASKS,
            Permission.VIEW_TASK_STATUS,
            Permission.CANCEL_TASKS,
            Permission.VIEW_FACTOR_STATUS,
            Permission.VIEW_RATE_LIMITS,
            Permission.VIEW_SYSTEM_METRICS,
            Permission.MANAGE_CACHE
        }
        
        # Super admins - full access except system operations
        self._role_permissions[Role.SUPER_ADMIN] = {
            Permission.READ,
            Permission.WRITE,
            Permission.GENERATE_RATIONALE,
            Permission.VIEW_RATIONALE_CACHE,
            Permission.CLEAR_RATIONALE_CACHE,
            Permission.RUN_OPTIMIZATION,
            Permission.VIEW_OPTIMIZATION_HISTORY,
            Permission.VIEW_ADMIN_DASHBOARD,
            Permission.MANAGE_USERS,
            Permission.VIEW_SYSTEM_LOGS,
            Permission.TRIGGER_TASKS,
            Permission.VIEW_TASK_STATUS,
            Permission.CANCEL_TASKS,
            Permission.REBUILD_FACTORS,
            Permission.VIEW_FACTOR_STATUS,
            Permission.MANAGE_API_KEYS,
            Permission.VIEW_RATE_LIMITS,
            Permission.RESET_RATE_LIMITS,
            Permission.MANAGE_WEBHOOKS,
            Permission.VIEW_SYSTEM_METRICS,
            Permission.MANAGE_CACHE
        }
        
        # System role - complete access
        self._role_permissions[Role.SYSTEM] = set(Permission)
        
        self.logger.info(f"Initialized permissions for {len(self._role_permissions)} roles")
    
    def _create_default_users(self):
        """Create default system users"""
        
        # Create default admin user
        admin_user = User(
            user_id="admin_001",
            username="admin",
            role=Role.ADMIN,
            api_key=self._generate_api_key_value()
        )
        self._users[admin_user.user_id] = admin_user
        
        # Create system user
        system_user = User(
            user_id="system_001",
            username="system",
            role=Role.SYSTEM,
            api_key=self._generate_api_key_value()
        )
        self._users[system_user.user_id] = system_user
        
        # Create corresponding API keys
        self.create_api_key(admin_user.user_id, Role.ADMIN, expires_in_days=365)
        self.create_api_key(system_user.user_id, Role.SYSTEM, expires_in_days=365)
        
        self.logger.info("Created default admin and system users")
    
    def _generate_api_key_value(self) -> str:
        """Generate a secure API key"""
        return f"ak_{secrets.token_urlsafe(32)}"
    
    def _hash_api_key(self, api_key: str) -> str:
        """Hash an API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def create_user(
        self,
        username: str,
        role: Role,
        user_id: Optional[str] = None,
        custom_permissions: Optional[Set[Permission]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> User:
        """Create a new user"""
        
        if user_id is None:
            user_id = f"user_{secrets.token_urlsafe(8)}"
        
        if user_id in self._users:
            raise ValueError(f"User {user_id} already exists")
        
        user = User(
            user_id=user_id,
            username=username,
            role=role,
            custom_permissions=custom_permissions or set(),
            metadata=metadata or {}
        )
        
        self._users[user_id] = user
        self.logger.info(f"Created user {username} ({user_id}) with role {role.value}")
        
        return user
    
    def create_api_key(
        self,
        user_id: str,
        role: Role,
        permissions: Optional[Set[Permission]] = None,
        expires_in_days: Optional[int] = None,
        allowed_ips: Optional[Set[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        """
        Create an API key for a user
        
        Returns:
            Tuple of (key_id, api_key_value)
        """
        
        if user_id not in self._users:
            raise ValueError(f"User {user_id} not found")
        
        # Generate API key
        key_id = f"ak_{secrets.token_urlsafe(8)}"
        api_key_value = self._generate_api_key_value()
        key_hash = self._hash_api_key(api_key_value)
        
        # Calculate expiry
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        api_key = ApiKey(
            key_id=key_id,
            key_hash=key_hash,
            user_id=user_id,
            role=role,
            permissions=permissions or set(),
            expires_at=expires_at,
            allowed_ips=allowed_ips or set(),
            metadata=metadata or {}
        )
        
        self._api_keys[key_id] = api_key
        
        self.logger.info(f"Created API key {key_id} for user {user_id} with role {role.value}")
        
        return key_id, api_key_value
    
    def authenticate_user(self, user_id: str, extend_session: bool = True) -> Optional[User]:
        """Authenticate user by user ID"""
        
        user = self._users.get(user_id)
        if not user or not user.is_active:
            return None
        
        if extend_session:
            user.last_login = datetime.utcnow()
            user.session_expires_at = datetime.utcnow() + timedelta(hours=self.session_timeout_hours)
        
        return user
    
    def authenticate_api_key(self, api_key_value: str, ip_address: Optional[str] = None) -> Optional[ApiKey]:
        """Authenticate using API key"""
        
        key_hash = self._hash_api_key(api_key_value)
        
        for api_key in self._api_keys.values():
            if api_key.key_hash == key_hash and api_key.is_valid():
                # Check IP whitelist if configured
                if ip_address and not api_key.is_ip_allowed(ip_address):
                    self.logger.warning(f"API key {api_key.key_id} rejected due to IP restriction: {ip_address}")
                    return None
                
                # Update usage
                api_key.last_used = datetime.utcnow()
                api_key.usage_count += 1
                
                return api_key
        
        return None
    
    def check_permission(
        self,
        permission: Permission,
        user_id: Optional[str] = None,
        api_key_value: Optional[str] = None,
        ip_address: Optional[str] = None,
        endpoint: str = "unknown"
    ) -> bool:
        """Check if user/API key has permission"""
        
        has_permission = False
        auth_user_id = None
        auth_api_key_id = None
        reason = None
        
        try:
            # Try API key authentication first
            if api_key_value:
                api_key = self.authenticate_api_key(api_key_value, ip_address)
                if api_key:
                    has_permission = api_key.has_permission(permission)
                    auth_api_key_id = api_key.key_id
                    auth_user_id = api_key.user_id
                    if not has_permission:
                        reason = f"API key {api_key.key_id} lacks permission {permission.value}"
                else:
                    reason = "Invalid API key"
            
            # Try user authentication if no API key or API key failed
            elif user_id:
                user = self.authenticate_user(user_id)
                if user and user.is_session_valid():
                    has_permission = user.has_permission(permission)
                    auth_user_id = user.user_id
                    if not has_permission:
                        reason = f"User {user.user_id} lacks permission {permission.value}"
                else:
                    reason = "Invalid user session"
            
            else:
                # Anonymous access - check if permission allows it
                anonymous_permissions = self._role_permissions.get(Role.ANONYMOUS, set())
                has_permission = permission in anonymous_permissions
                if not has_permission:
                    reason = f"Anonymous access denied for {permission.value}"
            
            # Log access attempt
            self._log_access_attempt(
                user_id=auth_user_id,
                api_key_id=auth_api_key_id,
                permission=permission,
                endpoint=endpoint,
                ip_address=ip_address or "unknown",
                success=has_permission,
                reason=reason
            )
            
            return has_permission
            
        except Exception as e:
            self.logger.error(f"Error checking permission {permission.value}: {e}")
            return False
    
    def _log_access_attempt(
        self,
        user_id: Optional[str],
        api_key_id: Optional[str],
        permission: Permission,
        endpoint: str,
        ip_address: str,
        success: bool,
        reason: Optional[str] = None
    ):
        """Log access attempt"""
        
        attempt = AccessAttempt(
            timestamp=datetime.utcnow(),
            user_id=user_id,
            api_key_id=api_key_id,
            permission=permission,
            endpoint=endpoint,
            ip_address=ip_address,
            success=success,
            reason=reason
        )
        
        self._access_log.append(attempt)
        
        # Trim log if too large
        if len(self._access_log) > self.max_access_log_entries:
            self._access_log = self._access_log[-self.max_access_log_entries:]
        
        # Log failed attempts at WARNING level
        if not success:
            self.logger.warning(f"Access denied: {reason}")
    
    def revoke_api_key(self, key_id: str) -> bool:
        """Revoke an API key"""
        
        if key_id not in self._api_keys:
            return False
        
        api_key = self._api_keys[key_id]
        api_key.is_active = False
        api_key.metadata["revoked_at"] = datetime.utcnow().isoformat()
        
        self.logger.info(f"Revoked API key {key_id}")
        return True
    
    def deactivate_user(self, user_id: str) -> bool:
        """Deactivate a user"""
        
        if user_id not in self._users:
            return False
        
        user = self._users[user_id]
        user.is_active = False
        user.metadata["deactivated_at"] = datetime.utcnow().isoformat()
        
        # Revoke all API keys for this user
        for api_key in self._api_keys.values():
            if api_key.user_id == user_id:
                api_key.is_active = False
        
        self.logger.info(f"Deactivated user {user_id}")
        return True
    
    def get_user_permissions(self, user_id: str) -> Set[Permission]:
        """Get all permissions for a user"""
        
        user = self._users.get(user_id)
        if not user or not user.is_active:
            return set()
        
        # Combine role permissions with custom permissions
        role_perms = self._role_permissions.get(user.role, set())
        return role_perms.union(user.custom_permissions)
    
    def get_access_log(
        self,
        limit: int = 100,
        user_id: Optional[str] = None,
        permission: Optional[Permission] = None,
        success_only: Optional[bool] = None
    ) -> List[AccessAttempt]:
        """Get access log entries"""
        
        filtered_log = self._access_log
        
        # Apply filters
        if user_id:
            filtered_log = [entry for entry in filtered_log if entry.user_id == user_id]
        
        if permission:
            filtered_log = [entry for entry in filtered_log if entry.permission == permission]
        
        if success_only is not None:
            filtered_log = [entry for entry in filtered_log if entry.success == success_only]
        
        # Sort by timestamp (newest first) and limit
        filtered_log.sort(key=lambda x: x.timestamp, reverse=True)
        return filtered_log[:limit]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get RBAC system statistics"""
        
        total_users = len(self._users)
        active_users = sum(1 for user in self._users.values() if user.is_active)
        total_api_keys = len(self._api_keys)
        active_api_keys = sum(1 for key in self._api_keys.values() if key.is_valid())
        
        # Access statistics
        total_attempts = len(self._access_log)
        successful_attempts = sum(1 for attempt in self._access_log if attempt.success)
        
        # Recent activity (last 24 hours)
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        recent_attempts = [attempt for attempt in self._access_log if attempt.timestamp > recent_cutoff]
        
        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "by_role": {role.value: sum(1 for user in self._users.values() if user.role == role) 
                           for role in Role}
            },
            "api_keys": {
                "total": total_api_keys,
                "active": active_api_keys,
                "expired": total_api_keys - active_api_keys
            },
            "access_log": {
                "total_attempts": total_attempts,
                "successful_attempts": successful_attempts,
                "success_rate": (successful_attempts / max(1, total_attempts)) * 100,
                "recent_attempts_24h": len(recent_attempts)
            },
            "roles": {
                role.value: len(permissions) for role, permissions in self._role_permissions.items()
            }
        }


def get_role_permissions(role: Role) -> Set[Permission]:
    """Get permissions for a role"""
    rbac = get_rbac_service()
    return rbac._role_permissions.get(role, set())


def require_permission(permission: Permission, extract_user_id: Optional[Callable] = None, extract_api_key: Optional[Callable] = None):
    """
    Decorator for enforcing permissions on endpoints
    
    Args:
        permission: Required permission
        extract_user_id: Function to extract user ID from request
        extract_api_key: Function to extract API key from request
    """
    def decorator(func):
        from functools import wraps
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request object
            request = None
            for arg in args:
                if hasattr(arg, 'headers'):
                    request = arg
                    break
            
            if not request:
                from fastapi import HTTPException
                raise HTTPException(status_code=500, detail="Unable to verify permissions")
            
            # Extract authentication info
            user_id = None
            api_key_value = None
            ip_address = request.client.host if request.client else None
            
            if extract_user_id:
                user_id = extract_user_id(request)
            
            if extract_api_key:
                api_key_value = extract_api_key(request)
            else:
                # Default: try to get API key from headers
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    api_key_value = auth_header[7:]
                else:
                    api_key_value = request.headers.get("X-API-Key")
            
            # Check permission
            rbac = get_rbac_service()
            has_permission = rbac.check_permission(
                permission=permission,
                user_id=user_id,
                api_key_value=api_key_value,
                ip_address=ip_address,
                endpoint=str(request.url.path)
            )
            
            if not has_permission:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Insufficient permissions",
                        "required_permission": permission.value,
                        "endpoint": str(request.url.path)
                    }
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


# Global RBAC service instance
_rbac_service: Optional[RoleBasedAccessControl] = None


def get_rbac_service() -> RoleBasedAccessControl:
    """Get the global RBAC service instance"""
    global _rbac_service
    if _rbac_service is None:
        _rbac_service = RoleBasedAccessControl()
    return _rbac_service