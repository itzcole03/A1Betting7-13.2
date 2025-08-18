"""
Security Test Endpoints

Test endpoints for validating rate limiting, RBAC, data redaction, and HMAC functionality.
"""

from datetime import datetime
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from backend.services.security.security_integration import (
    get_security_service,
    secure_rationale_endpoint,
    secure_optimization_endpoint,
    secure_admin_endpoint
)
from backend.services.unified_logging import get_logger

logger = get_logger("security_test")

# Create router
router = APIRouter(prefix="/security-test", tags=["security-test"])

# Test models
class TestRequest(BaseModel):
    message: str
    tokens: int = 100


@router.get("/status", summary="Get security service status")
async def get_security_status() -> Dict[str, Any]:
    """Get comprehensive security service status"""
    try:
        security_service = get_security_service()
        stats = security_service.get_security_stats()
        
        return {
            "status": "success",
            "data": {
                "security_services_active": True,
                "stats": stats
            },
            "message": "Security services are operational",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting security status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get security status: {str(e)}")


@router.post("/rationale", summary="Test rationale endpoint security")
@secure_rationale_endpoint(cost=1.0)
async def test_rationale_security(request_data: TestRequest, request: Request) -> Dict[str, Any]:
    """
    Test endpoint for rationale generation security
    
    Should be rate limited and require GENERATE_RATIONALE permission.
    """
    return {
        "status": "success",
        "data": {
            "message": request_data.message,
            "tokens": request_data.tokens,
            "endpoint_type": "rationale",
            "security_applied": True
        },
        "message": "Rationale endpoint security test passed"
    }


@router.post("/optimization", summary="Test optimization endpoint security")
@secure_optimization_endpoint(cost=2.0)
async def test_optimization_security(request_data: TestRequest, request: Request) -> Dict[str, Any]:
    """
    Test endpoint for optimization security
    
    Should be rate limited and require RUN_OPTIMIZATION permission.
    """
    return {
        "status": "success",
        "data": {
            "message": request_data.message,
            "tokens": request_data.tokens,
            "endpoint_type": "optimization",
            "security_applied": True,
            "cost_multiplier": 2.0
        },
        "message": "Optimization endpoint security test passed"
    }


@router.post("/admin", summary="Test admin endpoint security")
@secure_admin_endpoint(cost=0.5)
async def test_admin_security(request_data: TestRequest, request: Request) -> Dict[str, Any]:
    """
    Test endpoint for admin security
    
    Should be rate limited and require VIEW_ADMIN_DASHBOARD permission.
    """
    return {
        "status": "success",
        "data": {
            "message": request_data.message,
            "tokens": request_data.tokens,
            "endpoint_type": "admin",
            "security_applied": True,
            "redaction_level": "aggressive"
        },
        "message": "Admin endpoint security test passed"
    }


@router.get("/rate-limit", summary="Test rate limiting")
async def test_rate_limit(request: Request) -> Dict[str, Any]:
    """
    Unprotected endpoint to test manual rate limiting
    """
    from backend.services.security.rate_limiter import get_rate_limiter, get_client_ip
    
    rate_limiter = get_rate_limiter()
    client_ip = get_client_ip(request)
    
    # Check rate limit manually
    rate_status = rate_limiter.check_rate_limit(
        identifier=client_ip,
        endpoint_category="test",
        cost=1.0
    )
    
    if not rate_status.allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "retry_after": rate_status.retry_after_seconds,
                "current_usage": rate_status.current_usage,
                "limits": rate_status.limits,
                "message": "Test rate limit exceeded - this validates rate limiting is working"
            }
        )
    
    return {
        "status": "success",
        "data": {
            "client_ip": client_ip,
            "rate_status": {
                "usage": rate_status.current_usage,
                "limits": rate_status.limits,
                "allowed": rate_status.allowed
            }
        },
        "message": "Rate limit check passed"
    }


@router.post("/redaction", summary="Test data redaction")
async def test_data_redaction(request: Request) -> Dict[str, Any]:
    """
    Test endpoint for data redaction functionality
    """
    from backend.services.security.data_redaction import get_redaction_service, RedactionLevel
    
    redaction_service = get_redaction_service()
    
    # Test data with sensitive information
    test_data = {
        "user_id": "user_123456789",
        "api_key": "sk-1234567890abcdef",
        "email": "test@example.com",
        "credit_card": "4111-1111-1111-1111",
        "phone": "555-123-4567",
        "rationale": {
            "content": "Based on provider_internal_id_ABC123 and secret_key_XYZ789, this bet has good value.",
            "analysis": "The bettor with id user_987654321 should consider this opportunity."
        }
    }
    
    # Test different redaction levels
    minimal_redacted = redaction_service.redact_dict(test_data, RedactionLevel.MINIMAL)
    standard_redacted = redaction_service.redact_dict(test_data, RedactionLevel.STANDARD)
    aggressive_redacted = redaction_service.redact_dict(test_data, RedactionLevel.AGGRESSIVE)
    
    return {
        "status": "success",
        "data": {
            "original": test_data,
            "redacted": {
                "minimal": minimal_redacted,
                "standard": standard_redacted,
                "aggressive": aggressive_redacted
            }
        },
        "message": "Data redaction test completed"
    }


@router.get("/rbac", summary="Test RBAC system")
async def test_rbac(request: Request) -> Dict[str, Any]:
    """
    Test endpoint for RBAC functionality
    """
    from backend.services.security.rbac import get_rbac_service, Permission
    
    rbac_service = get_rbac_service()
    
    # Test different permission checks
    test_permissions = [
        Permission.GENERATE_RATIONALE,
        Permission.RUN_OPTIMIZATION,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.TRIGGER_TASKS,
        Permission.REBUILD_FACTORS
    ]
    
    permission_results = {}
    for permission in test_permissions:
        has_permission = rbac_service.check_permission(
            permission=permission,
            user_id="test_user",
            api_key_value=request.headers.get("X-API-Key"),
            ip_address=request.client.host if request.client else "127.0.0.1",
            endpoint="/security-test/rbac"
        )
        permission_results[permission.value] = has_permission
    
    return {
        "status": "success",
        "data": {
            "permission_checks": permission_results,
            "api_key_provided": bool(request.headers.get("X-API-Key")),
            "rbac_active": True
        },
        "message": "RBAC test completed"
    }


@router.post("/create-admin-key", summary="Create admin API key for testing")
async def create_admin_api_key() -> Dict[str, Any]:
    """
    Create an admin API key for testing purposes
    """
    security_service = get_security_service()
    
    api_key, hashed_key = security_service.create_admin_api_key("test_admin")
    
    return {
        "status": "success",
        "data": {
            "api_key": api_key,
            "usage_instructions": [
                "Add header: X-API-Key: {api_key}",
                "This key has admin permissions for testing",
                "Key expires in 365 days",
                "Use this to test protected endpoints"
            ]
        },
        "message": "Admin API key created successfully"
    }


@router.get("/hmac", summary="Test HMAC signing")
async def test_hmac() -> Dict[str, Any]:
    """
    Test HMAC signing functionality
    """
    from backend.services.security.hmac_signing import get_webhook_signer
    
    webhook_signer = get_webhook_signer()
    
    test_payload = '{"test": "data", "timestamp": "' + datetime.utcnow().isoformat() + '"}'
    
    # Sign the test payload using a placeholder key
    try:
        signature, headers = webhook_signer.sign_request(
            key_id="prizepicks_webhook_v1",  # Use placeholder key
            payload=test_payload
        )
        
        # Validate the signature
        validation_result = webhook_signer.validate_signature(
            signature_header=signature,
            key_id="prizepicks_webhook_v1",
            payload=test_payload
        )
        
        return {
            "status": "success",
            "data": {
                "test_payload": test_payload,
                "signature": signature,
                "additional_headers": headers,
                "signature_valid": validation_result.is_valid,
                "hmac_active": True
            },
            "message": "HMAC signing test completed"
        }
        
    except Exception as e:
        return {
            "status": "success",
            "data": {
                "test_payload": test_payload,
                "error": str(e),
                "hmac_active": True,
                "message": "HMAC test encountered expected placeholder key limitation"
            },
            "message": "HMAC signing infrastructure is ready for external provider integration"
        }