#!/usr/bin/env python3
"""
Add response_model annotations to security_routes.py endpoints
"""

import re

def add_response_models():
    with open('backend/routes/security_routes.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Define patterns for endpoints missing response_model
    response_model_patterns = [
        # Endpoints without response_model
        (
            r'(@router\.get\("/users", summary="List all users \(admin only\)"\))',
            r'\1\n# Added response_model annotation\n@router.get("/users", response_model=StandardAPIResponse[Dict[str, Any]], summary="List all users (admin only)")\n# Remove duplicate decorator'
        ),
        (
            r'@router\.post\("/api-keys", response_model=APIKeyResponse, summary="Create API key"\)',
            '@router.post("/api-keys", response_model=StandardAPIResponse[Dict[str, Any]], summary="Create API key")'
        ),
        (
            r'@router\.get\("/api-keys", summary="List user\'s API keys"\)',
            '@router.get("/api-keys", response_model=StandardAPIResponse[Dict[str, Any]], summary="List user\'s API keys")'
        ),
        (
            r'@router\.delete\("/api-keys/\{key_id\}", summary="Deactivate API key"\)',
            '@router.delete("/api-keys/{key_id}", response_model=StandardAPIResponse[Dict[str, Any]], summary="Deactivate API key")'
        ),
        (
            r'@router\.get\("/events", summary="Get security events"\)',
            '@router.get("/events", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get security events")'
        ),
        (
            r'@router\.get\("/dashboard", summary="Get security dashboard"\)',
            '@router.get("/dashboard", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get security dashboard")'
        ),
        (
            r'@router\.post\("/check-permission", summary="Check if user has permission"\)',
            '@router.post("/check-permission", response_model=StandardAPIResponse[Dict[str, Any]], summary="Check if user has permission")'
        ),
        (
            r'@router\.post\("/validate-token", summary="Validate token"\)',
            '@router.post("/validate-token", response_model=StandardAPIResponse[Dict[str, Any]], summary="Validate token")'
        ),
        (
            r'@router\.get\("/health", summary="Security service health check"\)',
            '@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]], summary="Security service health check")'
        ),
        (
            r'@router\.get\("/status", summary="Get system security status"\)',
            '@router.get("/status", response_model=StandardAPIResponse[Dict[str, Any]], summary="Get system security status")'
        ),
    ]
    
    # Apply each pattern
    changes_made = 0
    for pattern, replacement in response_model_patterns:
        old_content = content
        content = re.sub(pattern, replacement, content)
        if content != old_content:
            changes_made += 1
            print(f"✅ Updated response_model: {pattern[:50]}...")
    
    if content != original_content:
        with open('backend/routes/security_routes.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Response model annotation complete!")
        print(f"📊 Total annotations added: {changes_made}")
        return True
    else:
        print("❌ No response_model patterns found to update")
        return False

if __name__ == "__main__":
    add_response_models()
