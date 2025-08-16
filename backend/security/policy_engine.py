"""
Role-Based Access Control Policy Engine

This module provides a declarative policy engine for role-based access control
using YAML configuration files. It supports hierarchical roles, route-based
permissions, and advanced security features.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import re
import yaml
from datetime import datetime, timedelta
from dataclasses import dataclass, field

from fastapi import HTTPException, Request, status
from pydantic import BaseModel

from backend.services.unified_config import unified_config
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import unified_logging
from backend.security.enhanced_auth_service import TokenClaims

logger = unified_logging.get_logger("policy_engine")

@dataclass
class Role:
    """Role definition with permissions and constraints"""
    name: str
    description: str
    permissions: Set[str] = field(default_factory=set)
    inherits: List[str] = field(default_factory=list)
    max_requests_per_minute: int = 60
    requires_service_key: bool = False

@dataclass
class RoutePolicy:
    """Route-specific access policy"""
    paths: List[str]
    authentication: bool = True
    roles: List[str] = field(default_factory=list)
    permissions: List[str] = field(default_factory=list)
    methods: Dict[str, List[str]] = field(default_factory=dict)
    rate_limit: Optional[Dict[str, int]] = None
    audit: bool = False
    require_service_key: bool = False

@dataclass
class PolicyDecision:
    """Result of policy evaluation"""
    allowed: bool
    reason: str
    required_role: Optional[str] = None
    required_permissions: List[str] = field(default_factory=list)
    rate_limit: Optional[int] = None

class SecurityPolicyEngine:
    """
    Declarative security policy engine with YAML configuration
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize the policy engine
        
        Args:
            config_path: Path to policies.yaml file
        """
        self.config_path = config_path or Path(__file__).parent.parent / "config" / "policies.yaml"
        self.error_handler = unified_error_handler
        
        # Policy data structures
        self.roles: Dict[str, Role] = {}
        self.route_policies: Dict[str, RoutePolicy] = {}
        self.security_config: Dict[str, Any] = {}
        
        # Compiled path patterns for efficient matching
        self._compiled_patterns: Dict[str, re.Pattern] = {}
        
        # Rate limiting tracking
        self._rate_limit_cache: Dict[str, List[float]] = {}
        
        # Load policies
        self.load_policies()
        
        logger.info(f"Security policy engine initialized with {len(self.roles)} roles and {len(self.route_policies)} route policies")
    
    def load_policies(self) -> None:
        """Load policies from YAML configuration file"""
        try:
            if not self.config_path.exists():
                logger.error(f"Policy file not found: {self.config_path}")
                raise FileNotFoundError(f"Policy file not found: {self.config_path}")
            
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            self._load_security_config(config.get('security', {}))
            self._load_roles(config.get('roles', {}))
            self._load_route_policies(config.get('routes', {}))
            self._compile_path_patterns()
            
            logger.info("Security policies loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load security policies: {str(e)}")
            raise
    
    def _load_security_config(self, security_config: Dict[str, Any]) -> None:
        """Load global security configuration"""
        self.security_config = {
            'default_deny': security_config.get('default_deny', True),
            'require_authentication': security_config.get('require_authentication', True),
            'session_timeout_minutes': security_config.get('session_timeout_minutes', 60),
            'max_failed_attempts': security_config.get('max_failed_attempts', 5)
        }
    
    def _load_roles(self, roles_config: Dict[str, Any]) -> None:
        """Load role definitions with inheritance"""
        # First pass: create basic roles
        for role_name, role_data in roles_config.items():
            role = Role(
                name=role_name,
                description=role_data.get('description', ''),
                permissions=set(role_data.get('permissions', [])),
                inherits=role_data.get('inherits', []),
                max_requests_per_minute=role_data.get('max_requests_per_minute', 60),
                requires_service_key=role_data.get('requires_service_key', False)
            )
            self.roles[role_name] = role
        
        # Second pass: resolve inheritance
        for role_name, role in self.roles.items():
            role.permissions.update(self._resolve_inherited_permissions(role_name, set()))
    
    def _resolve_inherited_permissions(self, role_name: str, visited: Set[str]) -> Set[str]:
        """Recursively resolve inherited permissions"""
        if role_name in visited:
            logger.warning(f"Circular inheritance detected for role: {role_name}")
            return set()
        
        if role_name not in self.roles:
            logger.warning(f"Referenced role not found: {role_name}")
            return set()
        
        role = self.roles[role_name]
        visited.add(role_name)
        
        # Start with role's own permissions
        all_permissions = set(role.permissions)
        
        # Add inherited permissions
        for inherited_role in role.inherits:
            inherited_permissions = self._resolve_inherited_permissions(inherited_role, visited.copy())
            all_permissions.update(inherited_permissions)
        
        return all_permissions
    
    def _load_route_policies(self, routes_config: Dict[str, Any]) -> None:
        """Load route-specific policies"""
        for policy_name, policy_data in routes_config.items():
            policy = RoutePolicy(
                paths=policy_data.get('paths', []),
                authentication=policy_data.get('authentication', True),
                roles=policy_data.get('roles', []),
                permissions=policy_data.get('permissions', []),
                methods=policy_data.get('methods', {}),
                rate_limit=policy_data.get('rate_limit'),
                audit=policy_data.get('audit', False),
                require_service_key=policy_data.get('require_service_key', False)
            )
            self.route_policies[policy_name] = policy
    
    def _compile_path_patterns(self) -> None:
        """Compile path patterns for efficient matching"""
        self._compiled_patterns.clear()
        
        for policy_name, policy in self.route_policies.items():
            for path in policy.paths:
                # Convert path pattern to regex
                # Convert wildcards: /api/v2/ml/* -> /api/v2/ml/.*
                pattern = path.replace('*', '.*')
                # Escape special regex characters except our wildcards
                pattern = re.escape(pattern).replace(r'\.\*', '.*')
                # Anchor the pattern
                pattern = f'^{pattern}$'
                
                try:
                    compiled_pattern = re.compile(pattern)
                    self._compiled_patterns[f"{policy_name}:{path}"] = compiled_pattern
                except re.error as e:
                    logger.warning(f"Invalid path pattern '{path}': {e}")
    
    def get_role_permissions(self, role_name: str) -> Set[str]:
        """Get all permissions for a role (including inherited)"""
        if role_name not in self.roles:
            return set()
        
        return self.roles[role_name].permissions.copy()
    
    def has_permission(self, role_name: str, permission: str) -> bool:
        """Check if a role has a specific permission"""
        role_permissions = self.get_role_permissions(role_name)
        return permission in role_permissions
    
    def match_route_policy(self, path: str) -> Optional[Tuple[str, RoutePolicy]]:
        """Find the route policy that matches the given path"""
        for policy_name, policy in self.route_policies.items():
            for policy_path in policy.paths:
                pattern_key = f"{policy_name}:{policy_path}"
                if pattern_key in self._compiled_patterns:
                    if self._compiled_patterns[pattern_key].match(path):
                        return policy_name, policy
        
        return None
    
    def check_rate_limit(self, identifier: str, limit: int, window_seconds: int = 60) -> bool:
        """Check if identifier is within rate limits"""
        import time
        
        now = time.time()
        window_start = now - window_seconds
        
        # Clean old entries
        if identifier in self._rate_limit_cache:
            self._rate_limit_cache[identifier] = [
                timestamp for timestamp in self._rate_limit_cache[identifier]
                if timestamp > window_start
            ]
        else:
            self._rate_limit_cache[identifier] = []
        
        # Check current count
        current_count = len(self._rate_limit_cache[identifier])
        if current_count >= limit:
            return False
        
        # Record this request
        self._rate_limit_cache[identifier].append(now)
        return True
    
    def evaluate_request_policy(
        self,
        request: Request,
        user_claims: Optional[TokenClaims] = None
    ) -> PolicyDecision:
        """
        Evaluate if a request should be allowed based on policies
        
        Args:
            request: FastAPI request object
            user_claims: JWT token claims (if authenticated)
            
        Returns:
            PolicyDecision indicating if request is allowed
        """
        path = request.url.path
        method = request.method
        
        # Find matching route policy
        policy_match = self.match_route_policy(path)
        
        if not policy_match:
            # No specific policy found - apply default security
            if self.security_config['default_deny']:
                return PolicyDecision(
                    allowed=False,
                    reason="No matching policy found and default_deny is enabled"
                )
            else:
                return PolicyDecision(allowed=True, reason="No policy restriction")
        
        policy_name, policy = policy_match
        
        # Check authentication requirement
        if policy.authentication and not user_claims:
            return PolicyDecision(
                allowed=False,
                reason="Authentication required but no valid token provided"
            )
        
        # For unauthenticated requests to public routes
        if not policy.authentication:
            return self._check_public_route_access(request, policy)
        
        # Check role-based access
        user_role = user_claims.role if user_claims else "guest"
        if user_role not in policy.roles:
            return PolicyDecision(
                allowed=False,
                reason=f"Role '{user_role}' not allowed for this endpoint",
                required_role=policy.roles[0] if policy.roles else None
            )
        
        # Check permissions
        if policy.permissions:
            user_permissions = self.get_role_permissions(user_role)
            missing_permissions = []
            
            for required_permission in policy.permissions:
                if not self.has_permission(user_role, required_permission):
                    missing_permissions.append(required_permission)
            
            if missing_permissions:
                return PolicyDecision(
                    allowed=False,
                    reason=f"Missing required permissions: {', '.join(missing_permissions)}",
                    required_permissions=missing_permissions
                )
        
        # Check method-specific permissions
        if method in policy.methods:
            method_permissions = policy.methods[method]
            user_permissions = self.get_role_permissions(user_role)
            
            for required_permission in method_permissions:
                if not self.has_permission(user_role, required_permission):
                    return PolicyDecision(
                        allowed=False,
                        reason=f"Missing permission '{required_permission}' for {method} method"
                    )
        
        # Check rate limiting
        if policy.rate_limit:
            user_id = user_claims.sub if user_claims else "anonymous"
            rate_limit_id = f"user:{user_id}:{policy_name}"
            
            requests_per_minute = policy.rate_limit.get('requests_per_minute', 60)
            if not self.check_rate_limit(rate_limit_id, requests_per_minute):
                return PolicyDecision(
                    allowed=False,
                    reason=f"Rate limit exceeded: {requests_per_minute} requests per minute",
                    rate_limit=requests_per_minute
                )
        
        # Check service key requirement
        if policy.require_service_key:
            service_key = request.headers.get('X-Service-Key')
            if not service_key:
                return PolicyDecision(
                    allowed=False,
                    reason="Service key required but not provided"
                )
            # TODO: Implement service key validation
        
        # All checks passed
        return PolicyDecision(allowed=True, reason="Access granted")
    
    def _check_public_route_access(self, request: Request, policy: RoutePolicy) -> PolicyDecision:
        """Check access for public (unauthenticated) routes"""
        client_ip = self._get_client_ip(request)
        
        # Check IP-based rate limiting for public routes
        if policy.rate_limit:
            ip_rate_limit_id = f"ip:{client_ip}:public"
            requests_per_minute = policy.rate_limit.get('requests_per_minute', 10)
            
            if not self.check_rate_limit(ip_rate_limit_id, requests_per_minute):
                return PolicyDecision(
                    allowed=False,
                    reason=f"Rate limit exceeded for IP: {requests_per_minute} requests per minute",
                    rate_limit=requests_per_minute
                )
        
        return PolicyDecision(allowed=True, reason="Public route access granted")
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request"""
        # Check for forwarded IP headers (from proxy/load balancer)
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        if request.client:
            return request.client.host
        
        return 'unknown'
    
    def get_policy_summary(self) -> Dict[str, Any]:
        """Get summary of loaded policies for debugging"""
        return {
            'roles': {
                name: {
                    'description': role.description,
                    'permissions_count': len(role.permissions),
                    'inherits': role.inherits,
                    'max_requests_per_minute': role.max_requests_per_minute
                }
                for name, role in self.roles.items()
            },
            'route_policies': {
                name: {
                    'paths': policy.paths,
                    'authentication': policy.authentication,
                    'roles': policy.roles,
                    'audit': policy.audit
                }
                for name, policy in self.route_policies.items()
            },
            'security_config': self.security_config
        }
    
    def reload_policies(self) -> None:
        """Reload policies from configuration file"""
        logger.info("Reloading security policies...")
        self.load_policies()

# Global instance
security_policy_engine = SecurityPolicyEngine()

# Export for easy imports
__all__ = ["security_policy_engine", "SecurityPolicyEngine", "PolicyDecision", "Role", "RoutePolicy"]