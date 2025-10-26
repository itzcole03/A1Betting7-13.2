"""
Enterprise Security API Routes
API endpoints for authentication, authorization, and security management.
Part of Phase 3: Advanced AI Enhancement and Multi-Sport Expansion
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Set
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import logging

from ..services.enterprise_security_service import (
    get_security_service,
    UserRole,
    SecurityEventType,
    PermissionLevel
)

# Standardized imports for API contract compliance
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/security", tags=["Enterprise Security"])

# Security scheme
security = HTTPBearer()

# Request/Response Models
class UserRegistrationRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8)
    role: str = Field(default="viewer", description="User role")

class LoginRequest(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")

class APIKeyRequest(BaseModel):
    name: str = Field(..., description="Descriptive name for the API key")
    permissions: List[str] = Field(..., description="List of permissions")
    rate_limit: int = Field(default=1000, description="Requests per minute")
    expires_days: int = Field(default=90, description="Expiration in days (0 = no expiration)")
    allowed_ips: Optional[List[str]] = Field(default=None, description="Allowed IP addresses")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    role: str
    permissions: List[str]

class APIKeyResponse(BaseModel):
    key_id: str
    api_key: str  # Only returned on creation
    name: str
    permissions: List[str]
    rate_limit: int
    expires_at: Optional[str]
    created_at: str

class UserInfoResponse(BaseModel):
    user_id: str
    username: str
    email: str
    role: str
    permissions: List[str]
    is_active: bool
    is_verified: bool
    created_at: str
    last_login: Optional[str]

class SecurityEventResponse(BaseModel):
    event_id: str
    event_type: str
    user_id: Optional[str]
    ip_address: str
    endpoint: str
    method: str
    success: bool
    risk_score: float
    timestamp: str

# Dependency functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from token"""
    try:
        security_service = await get_security_service()
        
        valid, payload, message = await security_service.verify_token(credentials.credentials)
        
        if not valid:
            raise AuthenticationException(message)
        
        return ResponseBuilder.success(payload)
        
    except Exception as e:
        logger.error(f"User authentication failed: {str(e)}")
        raise AuthenticationException("Authentication failed")

async def get_current_user_optional(authorization: Optional[str] = Header(None)):
    """Get current user (optional for public endpoints)"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        token = authorization.split(" ")[1]
        security_service = await get_security_service()
        
        valid, payload, _ = await security_service.verify_token(token)
        return ResponseBuilder.success(payload) if valid else None
        
    except:
        return None

async def require_permission(required_permission: str):
    """Create dependency that requires specific permission"""
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        security_service = await get_security_service()
        user_permissions = set(current_user.get('permissions', []))
        
        if not await security_service.check_permission(user_permissions, required_permission):
            raise BusinessLogicException(
                message="Insufficient permissions",
                error_code="ACCESS_DENIED"
            )
        
        return ResponseBuilder.success(current_user)
    
    return ResponseBuilder.success(permission_checker)

async def require_admin():
    """Dependency that requires admin role"""
    async def admin_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get('role') != UserRole.ADMIN.value:
            raise BusinessLogicException(
                message="Admin access required",
                error_code="ADMIN_REQUIRED"
            )
        
        return ResponseBuilder.success(current_user)
    
    return ResponseBuilder.success(admin_checker)

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return ResponseBuilder.success(forwarded.split(","))[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return ResponseBuilder.success(real_ip)
    
    return ResponseBuilder.success(request.client.host) if request.client else "127.0.0.1"

# Authentication endpoints
@router.post("/register", response_model=StandardAPIResponse[Dict[str, Any]], summary="Register a new user")
async def register_user(request: UserRegistrationRequest, req: Request):
    """Register a new user account"""
    try:
        security_service = await get_security_service()
        
        # Validate role
        try:
            role = UserRole(request.role.lower())
        except ValueError:
            raise BusinessLogicException(
                message="Invalid role specified",
                error_code="INVALID_ROLE"
            )
        
        success, message = await security_service.register_user(
            username=request.username,
            email=request.email,
            password=request.password,
            role=role
        )
        
        if success:
            return ResponseBuilder.success(data={"message": message})
        else:
            raise BusinessLogicException(
                message=message,
                error_code="VALIDATION_ERROR"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise BusinessLogicException(
                message="User registration failed",
                error_code="REGISTRATION_FAILED"
            )

@router.post("/login", response_model=StandardAPIResponse[Dict[str, Any]], summary="User login")
async def login(request: LoginRequest, req: Request):
    """Authenticate user and return ResponseBuilder.success(access) token"""
    try:
        security_service = await get_security_service()
        client_ip = get_client_ip(req)
        
        success, access_token, message = await security_service.authenticate_user(
            username=request.username,
            password=request.password,
            ip_address=client_ip
        )
        
        if success and access_token:
            expires_in = int((access_token.expires_at - access_token.issued_at).total_seconds())
            
            token_data = {
                "access_token": access_token.token,
                "token_type": "bearer",
                "expires_in": expires_in,
                "user_id": access_token.user_id,
                "role": access_token.role.value,
                "permissions": list(access_token.permissions)
            }
            
            return ResponseBuilder.success(data=token_data)
        else:
            raise AuthenticationException(message)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise BusinessLogicException(
                message="Login operation failed",
                error_code="LOGIN_FAILED"
            )

@router.post("/logout", response_model=StandardAPIResponse[Dict[str, Any]], summary="User logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user and revoke token"""
    try:
        # In a full implementation, we would revoke the token
        # For now, just return ResponseBuilder.success(success)
        return ResponseBuilder.success(data={"message": "Logged out successfully"})
        
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise BusinessLogicException(
                message="Logout operation failed",
                error_code="LOGOUT_FAILED"
            )

# User management endpoints
@router.get("/user/me", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get current user info")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get information about the currently authenticated user"""
    try:
        security_service = await get_security_service()
        
        user_info = await security_service.get_user_info(current_user['user_id'])
        
        if not user_info:
            raise BusinessLogicException(
                message="User not found",
                error_code="USER_NOT_FOUND"
            )
        
        return ResponseBuilder.success(data=user_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user info: {str(e)}")
        raise BusinessLogicException(
                message="Failed to retrieve user information",
                error_code="USER_INFO_FAILED"
            )

@router.get("/users", response_model=StandardAPIResponse[Dict[str, Any]], summary="List all users (admin only)")
async def list_users(admin_user: dict = Depends(require_admin())):
    """List all users (admin only)"""
    try:
        security_service = await get_security_service()
        
        users = []
        for user_id, user in security_service.users.items():
            user_info = await security_service.get_user_info(user_id)
            if user_info:
                users.append(user_info)
        
        return ResponseBuilder.success(data={"total_users": len(users), "users": users})
        
    except Exception as e:
        logger.error(f"Failed to list users: {str(e)}")
        raise BusinessLogicException(
                message="Failed to list users",
                error_code="USER_LIST_FAILED"
            )

# API Key management endpoints
@router.post("/api-keys", response_model=StandardAPIResponse[Dict[str, Any]], summary="Create API key")
async def create_api_key(request: APIKeyRequest, current_user: dict = Depends(get_current_user)):
    """Create a new API key for the current user"""
    try:
        security_service = await get_security_service()
        
        # Validate permissions
        user_permissions = set(current_user.get('permissions', []))
        requested_permissions = set(request.permissions)
        
        # Check if user has all requested permissions
        for perm in requested_permissions:
            if not await security_service.check_permission(user_permissions, perm):
                raise BusinessLogicException(
                message=f"Permission '{{perm}}' not available to user",
                error_code="PERMISSION_DENIED"
            )
        
        success, api_key, message = await security_service.create_api_key(
            user_id=current_user['user_id'],
            name=request.name,
            permissions=requested_permissions,
            rate_limit=request.rate_limit,
            expires_days=request.expires_days,
            allowed_ips=set(request.allowed_ips) if request.allowed_ips else None
        )
        
        if success and api_key:
            api_key_data = {
                "key_id": api_key.key_id,
                "api_key": api_key.api_key,  # Only shown on creation
                "name": api_key.name,
                "permissions": list(api_key.permissions),
                "rate_limit": api_key.rate_limit,
                "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
                "created_at": api_key.created_at.isoformat()
            }
            
            return ResponseBuilder.success(data=api_key_data)
        else:
            raise BusinessLogicException(
                message=message,
                error_code="VALIDATION_ERROR"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create API key: {str(e)}")
        raise BusinessLogicException(
                message="Failed to create API key",
                error_code="API_KEY_CREATE_FAILED"
            )

@router.get("/api-keys", response_model=StandardAPIResponse[Dict[str, Any]], summary="List user's API keys")
async def list_api_keys(current_user: dict = Depends(get_current_user)):
    """List API keys for the current user"""
    try:
        security_service = await get_security_service()
        
        user_keys = []
        for key_id, api_key in security_service.api_keys.items():
            if api_key.user_id == current_user['user_id']:
                key_dict = api_key.to_dict()
                user_keys.append(key_dict)
        
        return ResponseBuilder.success(data={"total_keys": len(user_keys), "api_keys": user_keys})
        
    except Exception as e:
        logger.error(f"Failed to list API keys: {str(e)}")
        raise BusinessLogicException(
                message="Failed to list API keys",
                error_code="API_KEY_LIST_FAILED"
            )

@router.delete("/api-keys/{key_id}", response_model=StandardAPIResponse[Dict[str, Any]], summary="Deactivate API key")
async def deactivate_api_key(key_id: str, current_user: dict = Depends(get_current_user)):
    """Deactivate an API key"""
    try:
        security_service = await get_security_service()
        
        success = await security_service.deactivate_api_key(key_id, current_user['user_id'])
        
        if success:
            return ResponseBuilder.success(data={"message": "API key deactivated"})
        else:
            raise BusinessLogicException(
                message="API key not found or access denied",
                error_code="API_KEY_NOT_FOUND"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deactivate API key: {str(e)}")
        raise BusinessLogicException(
                message="Failed to deactivate API key",
                error_code="API_KEY_DEACTIVATE_FAILED"
            )

# Security monitoring endpoints
@router.get("/events", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get security events")
async def get_security_events(
    limit: int = 100,
    event_type: Optional[str] = None,
    current_user: dict = Depends(require_permission("system:read"))
):
    """Get security events (requires system:read permission)"""
    try:
        security_service = await get_security_service()
        
        # Parse event type if provided
        event_type_enum = None
        if event_type:
            try:
                event_type_enum = SecurityEventType(event_type)
            except ValueError:
                raise BusinessLogicException(
                message="Invalid event type",
                error_code="INVALID_EVENT_TYPE"
            )
        
        events = await security_service.get_security_events(
            event_type=event_type_enum,
            limit=limit
        )
        
        event_responses = []
        for event in events:
            event_responses.append(SecurityEventResponse(
                event_id=event.event_id,
                event_type=event.event_type.value,
                user_id=event.user_id,
                ip_address=event.ip_address,
                endpoint=event.endpoint,
                method=event.method,
                success=event.success,
                risk_score=event.risk_score,
                timestamp=event.timestamp.isoformat()
            ))
        
        return ResponseBuilder.success(data={"total_events": len(event_responses), "events": event_responses})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get security events: {str(e)}")
        raise BusinessLogicException(
                message="Failed to retrieve security events",
                error_code="SECURITY_EVENTS_FAILED"
            )

@router.get("/dashboard", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get security dashboard")
async def get_security_dashboard(admin_user: dict = Depends(require_admin())):
    """Get security dashboard overview (admin only)"""
    try:
        security_service = await get_security_service()
        
        dashboard = await security_service.get_security_dashboard()
        
        return ResponseBuilder.success(data=dashboard)
        
    except Exception as e:
        logger.error(f"Failed to get security dashboard: {str(e)}")
        raise BusinessLogicException(
                message="Failed to retrieve security dashboard",
                error_code="DASHBOARD_FAILED"
            )

# Permission checking endpoint
@router.post("/check-permission", response_model=StandardAPIResponse[Dict[str, Any]], summary="Check if user has permission")
async def check_permission(
    permission: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if the current user has a specific permission"""
    try:
        security_service = await get_security_service()
        user_permissions = set(current_user.get('permissions', []))
        
        has_permission = await security_service.check_permission(user_permissions, permission)
        
        permission_data = {
            "user_id": current_user['user_id'],
            "permission": permission,
            "has_permission": has_permission
        }
        
        return ResponseBuilder.success(data=permission_data)
        
    except Exception as e:
        logger.error(f"Permission check failed: {str(e)}")
        raise BusinessLogicException(
                message="Permission check failed",
                error_code="PERMISSION_CHECK_FAILED"
            )

# Token validation endpoint (for other services)
@router.post("/validate-token", response_model=StandardAPIResponse[Dict[str, Any]], summary="Validate token")
async def validate_token(token: str):
    """Validate a token (internal use)"""
    try:
        security_service = await get_security_service()
        
        valid, payload, message = await security_service.verify_token(token)
        
        return ResponseBuilder.success({
            "valid": valid,
            "payload": payload if valid else None,
            "message": message
        })
        
    except Exception as e:
        logger.error(f"Token validation failed: {str(e)}")
        raise BusinessLogicException(
                message="Token validation failed",
                error_code="TOKEN_VALIDATION_FAILED"
            )

# Health check endpoint
@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]], summary="Security service health check")
async def health_check():
    """Health check for the security service"""
    try:
        security_service = await get_security_service()
        
        health_data = {
            "status": "healthy",
            "total_users": len(security_service.users),
            "active_sessions": len(security_service.active_sessions),
            "total_api_keys": len(security_service.api_keys),
            "timestamp": datetime.now().isoformat()
        }
        
        return ResponseBuilder.success(data=health_data)
        
    except Exception as e:
        logger.error(f"Security health check failed: {str(e)}")
        raise BusinessLogicException(
                message="Security service is unhealthy",
                error_code="SERVICE_UNHEALTHY"
            )

# System status endpoint
@router.get("/status", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get system security status")
async def get_system_status(current_user: dict = Depends(require_permission("system:read"))):
    """Get overall system security status"""
    try:
        security_service = await get_security_service()
        
        # Calculate security metrics
        total_users = len(security_service.users)
        active_users = len([u for u in security_service.users.values() if u.is_active])
        
        # Recent security events (last 24 hours)
        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        recent_events = [e for e in security_service.security_events if e.timestamp > last_24h]
        high_risk_events = [e for e in recent_events if e.risk_score > 0.7]
        
        # Failed login attempts
        failed_logins = [e for e in recent_events if e.event_type == SecurityEventType.LOGIN_FAILURE]
        
        system_status_data = {
            "system_status": "secure",
            "security_level": "high" if len(high_risk_events) == 0 else "medium" if len(high_risk_events) < 5 else "low",
            "total_users": total_users,
            "active_users": active_users,
            "recent_events_24h": len(recent_events),
            "high_risk_events_24h": len(high_risk_events),
            "failed_logins_24h": len(failed_logins),
            "blacklisted_tokens": len(security_service.blacklisted_tokens),
            "active_sessions": len(security_service.active_sessions),
            "timestamp": now.isoformat()
        }
        
        return ResponseBuilder.success(data=system_status_data)
        
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        raise BusinessLogicException(
                message="Failed to retrieve system status",
                error_code="SYSTEM_STATUS_FAILED"
            )
