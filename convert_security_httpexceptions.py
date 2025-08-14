#!/usr/bin/env python3
"""
Automated HTTPException → BusinessLogicException conversion for security_routes.py
Converts remaining HTTPException patterns to standardized exception handling
"""

import re

def convert_security_httpexceptions():
    with open('backend/routes/security_routes.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Define conversion patterns for security-specific errors
    conversion_patterns = [
        # Admin access required
        (
            r'raise HTTPException\(status_code=403, detail="Admin access required"\)',
            'raise BusinessLogicException(\n                message="Admin access required",\n                error_code="ADMIN_REQUIRED"\n            )'
        ),
        
        # Role validation errors
        (
            r'raise HTTPException\(status_code=400, detail="Invalid role"\)',
            'raise BusinessLogicException(\n                message="Invalid role specified",\n                error_code="INVALID_ROLE"\n            )'
        ),
        
        # User not found
        (
            r'raise HTTPException\(status_code=404, detail="User not found"\)',
            'raise BusinessLogicException(\n                message="User not found",\n                error_code="USER_NOT_FOUND"\n            )'
        ),
        
        # API key not found
        (
            r'raise HTTPException\(status_code=404, detail="API key not found or access denied"\)',
            'raise BusinessLogicException(\n                message="API key not found or access denied",\n                error_code="API_KEY_NOT_FOUND"\n            )'
        ),
        
        # Invalid event type
        (
            r'raise HTTPException\(status_code=400, detail="Invalid event type"\)',
            'raise BusinessLogicException(\n                message="Invalid event type",\n                error_code="INVALID_EVENT_TYPE"\n            )'
        ),
        
        # Generic operation failed patterns
        (
            r'raise HTTPException\(status_code=500, detail="Registration failed"\)',
            'raise BusinessLogicException(\n                message="User registration failed",\n                error_code="REGISTRATION_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Login failed"\)',
            'raise BusinessLogicException(\n                message="Login operation failed",\n                error_code="LOGIN_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Logout failed"\)',
            'raise BusinessLogicException(\n                message="Logout operation failed",\n                error_code="LOGOUT_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to get user info"\)',
            'raise BusinessLogicException(\n                message="Failed to retrieve user information",\n                error_code="USER_INFO_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to list users"\)',
            'raise BusinessLogicException(\n                message="Failed to list users",\n                error_code="USER_LIST_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to create API key"\)',
            'raise BusinessLogicException(\n                message="Failed to create API key",\n                error_code="API_KEY_CREATE_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to list API keys"\)',
            'raise BusinessLogicException(\n                message="Failed to list API keys",\n                error_code="API_KEY_LIST_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to deactivate API key"\)',
            'raise BusinessLogicException(\n                message="Failed to deactivate API key",\n                error_code="API_KEY_DEACTIVATE_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to get security events"\)',
            'raise BusinessLogicException(\n                message="Failed to retrieve security events",\n                error_code="SECURITY_EVENTS_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to get security dashboard"\)',
            'raise BusinessLogicException(\n                message="Failed to retrieve security dashboard",\n                error_code="DASHBOARD_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Permission check failed"\)',
            'raise BusinessLogicException(\n                message="Permission check failed",\n                error_code="PERMISSION_CHECK_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Token validation failed"\)',
            'raise BusinessLogicException(\n                message="Token validation failed",\n                error_code="TOKEN_VALIDATION_FAILED"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Service unhealthy"\)',
            'raise BusinessLogicException(\n                message="Security service is unhealthy",\n                error_code="SERVICE_UNHEALTHY"\n            )'
        ),
        
        (
            r'raise HTTPException\(status_code=500, detail="Failed to get system status"\)',
            'raise BusinessLogicException(\n                message="Failed to retrieve system status",\n                error_code="SYSTEM_STATUS_FAILED"\n            )'
        ),
        
        # Authentication patterns with variable messages
        (
            r'raise HTTPException\(status_code=401, detail=message\)',
            'raise AuthenticationException(message)'
        ),
        
        (
            r'raise HTTPException\(status_code=400, detail=message\)',
            'raise BusinessLogicException(\n                message=message,\n                error_code="VALIDATION_ERROR"\n            )'
        ),
        
        # Permission check failures
        (
            r'raise HTTPException\(status_code=403, detail=f"Permission \'{perm}\' not available to user"\)',
            'raise BusinessLogicException(\n                message=f"Permission \'{{perm}}\' not available to user",\n                error_code="PERMISSION_DENIED"\n            )'
        ),
    ]
    
    # Apply each conversion pattern
    changes_made = 0
    for pattern, replacement in conversion_patterns:
        old_content = content
        content = re.sub(pattern, replacement, content)
        if content != old_content:
            pattern_changes = len(re.findall(pattern, old_content))
            changes_made += pattern_changes
            print(f"✅ Converted {pattern_changes} instances: {pattern[:50]}...")
    
    if content != original_content:
        with open('backend/routes/security_routes.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Security HTTPException conversion complete!")
        print(f"📊 Total conversions made: {changes_made}")
        return True
    else:
        print("❌ No HTTPException patterns found to convert")
        return False

if __name__ == "__main__":
    convert_security_httpexceptions()
