#!/usr/bin/env python3
"""
Comprehensive automated conversion for propollama.py
Converts HTTPException raises and non-standard returns to standardized patterns
"""

import re

def convert_propollama_violations():
    with open('backend/routes/propollama.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = 0
    
    print("🚀 Starting PropOllama conversion...")
    
    # Phase 1: HTTPException → BusinessLogicException/AuthenticationException
    httpexception_patterns = [
        # 401 Authentication errors
        (
            r'raise HTTPException\(status_code=401,?\s*detail="([^"]+)"\)',
            r'raise AuthenticationException("\1")'
        ),
        (
            r'raise HTTPException\(status_code=401,?\s*detail=([^)]+)\)',
            r'raise AuthenticationException(\1)'
        ),
        
        # 403 Access denied errors
        (
            r'raise HTTPException\(status_code=403,?\s*detail="([^"]+)"\)',
            r'raise BusinessLogicException(\n                message="\1",\n                error_code="ACCESS_DENIED"\n            )'
        ),
        
        # 404 Not found errors
        (
            r'raise HTTPException\(status_code=404,?\s*detail="([^"]+)"\)',
            r'raise BusinessLogicException(\n                message="\1",\n                error_code="RESOURCE_NOT_FOUND"\n            )'
        ),
        
        # 400 Bad request errors
        (
            r'raise HTTPException\(status_code=400,?\s*detail="([^"]+)"\)',
            r'raise BusinessLogicException(\n                message="\1",\n                error_code="INVALID_REQUEST"\n            )'
        ),
        
        # 500 Internal server errors
        (
            r'raise HTTPException\(status_code=500,?\s*detail="([^"]+)"\)',
            r'raise BusinessLogicException(\n                message="\1",\n                error_code="OPERATION_FAILED"\n            )'
        ),
        
        # Generic HTTPException patterns with variable details
        (
            r'raise HTTPException\(\s*status_code=401,?\s*detail=([^)]+)\)',
            r'raise AuthenticationException(\1)'
        ),
        (
            r'raise HTTPException\(\s*status_code=403,?\s*detail=([^)]+)\)',
            r'raise BusinessLogicException(\n                message=\1,\n                error_code="ACCESS_DENIED"\n            )'
        ),
        (
            r'raise HTTPException\(\s*status_code=404,?\s*detail=([^)]+)\)',
            r'raise BusinessLogicException(\n                message=\1,\n                error_code="RESOURCE_NOT_FOUND"\n            )'
        ),
        (
            r'raise HTTPException\(\s*status_code=400,?\s*detail=([^)]+)\)',
            r'raise BusinessLogicException(\n                message=\1,\n                error_code="INVALID_REQUEST"\n            )'
        ),
        (
            r'raise HTTPException\(\s*status_code=500,?\s*detail=([^)]+)\)',
            r'raise BusinessLogicException(\n                message=\1,\n                error_code="OPERATION_FAILED"\n            )'
        ),
    ]
    
    # Apply HTTPException conversions
    for pattern, replacement in httpexception_patterns:
        old_content = content
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        if content != old_content:
            pattern_changes = len(re.findall(pattern, old_content, flags=re.MULTILINE))
            changes_made += pattern_changes
            print(f"✅ HTTPException: {pattern_changes} instances converted")
    
    # Phase 2: JSONResponse conversions
    jsonresponse_patterns = [
        # JSONResponse with content parameter
        (
            r'return JSONResponse\(content=([^)]+)\)',
            r'return ResponseBuilder.success(data=\1)'
        ),
        (
            r'return JSONResponse\(([^)]+)\)',
            r'return ResponseBuilder.success(data=\1)'
        ),
    ]
    
    # Apply JSONResponse conversions
    for pattern, replacement in jsonresponse_patterns:
        old_content = content
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        if content != old_content:
            pattern_changes = len(re.findall(pattern, old_content, flags=re.MULTILINE))
            changes_made += pattern_changes
            print(f"✅ JSONResponse: {pattern_changes} instances converted")
    
    # Phase 3: Return statement conversions
    return_patterns = [
        # Error patterns
        (
            r'return \{"success": False,\s*"error": "([^"]+)"\}',
            r'return ResponseBuilder.error(\n                error_code="OPERATION_FAILED",\n                message="\1"\n            )'
        ),
        (
            r'return \{"error": "([^"]+)"\}',
            r'return ResponseBuilder.error(\n                error_code="OPERATION_FAILED",\n                message="\1"\n            )'
        ),
        
        # Success patterns with specific messages
        (
            r'return \{"success": True,\s*"message": "([^"]+)"\}',
            r'return ResponseBuilder.success(data={"message": "\1"})'
        ),
        (
            r'return \{"message": "([^"]+)"\}',
            r'return ResponseBuilder.success(data={"message": "\1"})'
        ),
        (
            r'return \{"status": "([^"]+)"\}',
            r'return ResponseBuilder.success(data={"status": "\1"})'
        ),
        
        # Generic success patterns
        (
            r'return \{"success": True\}',
            r'return ResponseBuilder.success(data={"success": True})'
        ),
    ]
    
    # Apply return conversions
    for pattern, replacement in return_patterns:
        old_content = content
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        if content != old_content:
            pattern_changes = len(re.findall(pattern, old_content, flags=re.MULTILINE))
            changes_made += pattern_changes
            print(f"✅ Return patterns: {pattern_changes} instances converted")
    
    if content != original_content:
        with open('backend/routes/propollama.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n🎉 PropOllama bulk conversion complete!")
        print(f"📊 Total automated conversions: {changes_made}")
        return True
    else:
        print("❌ No patterns found to convert")
        return False

if __name__ == "__main__":
    convert_propollama_violations()
