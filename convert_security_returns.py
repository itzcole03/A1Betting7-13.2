#!/usr/bin/env python3
"""
Automated non-standard return conversion for security_routes.py
Converts remaining return patterns to ResponseBuilder.success()
"""

import re

def convert_security_returns():
    with open('backend/routes/security_routes.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Define conversion patterns for return statements
    conversion_patterns = [
        # Logout success message
        (
            r'return \{"success": True, "message": "Logged out successfully"\}',
            'return ResponseBuilder.success(data={"message": "Logged out successfully"})'
        ),
        
        # User info count
        (
            r'return \{"total_users": len\(users\), "users": users\}',
            'return ResponseBuilder.success(data={"total_users": len(users), "users": users})'
        ),
        
        # API key count
        (
            r'return \{"total_keys": len\(user_keys\), "api_keys": user_keys\}',
            'return ResponseBuilder.success(data={"total_keys": len(user_keys), "api_keys": user_keys})'
        ),
        
        # API key deactivation success
        (
            r'return \{"success": True, "message": "API key deactivated"\}',
            'return ResponseBuilder.success(data={"message": "API key deactivated"})'
        ),
        
        # Security events count
        (
            r'return \{"total_events": len\(event_responses\), "events": event_responses\}',
            'return ResponseBuilder.success(data={"total_events": len(event_responses), "events": event_responses})'
        ),
        
        # UserInfoResponse pattern
        (
            r'return UserInfoResponse\(\*\*user_info\)',
            'return ResponseBuilder.success(data=user_info)'
        ),
        
        # Dashboard return
        (
            r'return dashboard(?=\s*except|\s*$)',
            'return ResponseBuilder.success(data=dashboard)'
        ),
    ]
    
    # Apply each conversion pattern
    changes_made = 0
    for pattern, replacement in conversion_patterns:
        old_content = content
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        if content != old_content:
            pattern_changes = len(re.findall(pattern, old_content, flags=re.MULTILINE))
            changes_made += pattern_changes
            print(f"✅ Converted {pattern_changes} instances: {pattern[:50]}...")
    
    # Handle TokenResponse and APIKeyResponse patterns
    token_pattern = r'return TokenResponse\(\s*access_token=([^,]+),\s*expires_in=([^,]+),\s*user_id=([^,]+),\s*user_role=([^)]+)\)'
    token_replacement = r'return ResponseBuilder.success(data={\n            "access_token": \1,\n            "token_type": "bearer",\n            "expires_in": \2,\n            "user_id": \3,\n            "user_role": \4\n        })'
    
    old_content = content
    content = re.sub(token_pattern, token_replacement, content, flags=re.MULTILINE | re.DOTALL)
    if content != old_content:
        token_changes = len(re.findall(token_pattern, old_content, flags=re.MULTILINE | re.DOTALL))
        changes_made += token_changes
        print(f"✅ Converted {token_changes} TokenResponse instances")
    
    # Handle APIKeyResponse pattern
    api_key_pattern = r'return APIKeyResponse\(\s*key=([^,]+),\s*name=([^,]+),\s*permissions=([^,]+),\s*rate_limit=([^,]+),\s*expires_at=([^)]+)\)'
    api_key_replacement = r'return ResponseBuilder.success(data={\n            "key": \1,\n            "name": \2,\n            "permissions": \3,\n            "rate_limit": \4,\n            "expires_at": \5\n        })'
    
    old_content = content
    content = re.sub(api_key_pattern, api_key_replacement, content, flags=re.MULTILINE | re.DOTALL)
    if content != old_content:
        api_key_changes = len(re.findall(api_key_pattern, old_content, flags=re.MULTILINE | re.DOTALL))
        changes_made += api_key_changes
        print(f"✅ Converted {api_key_changes} APIKeyResponse instances")
    
    if content != original_content:
        with open('backend/routes/security_routes.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Security return conversion complete!")
        print(f"📊 Total conversions made: {changes_made}")
        return True
    else:
        print("❌ No return patterns found to convert")
        return False

if __name__ == "__main__":
    convert_security_returns()
