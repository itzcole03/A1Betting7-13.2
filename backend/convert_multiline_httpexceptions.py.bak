#!/usr/bin/env python3
"""
Manual HTTPException cleanup for propollama.py multi-line patterns
"""

import re

def convert_multiline_httpexceptions():
    with open('backend/routes/propollama.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = 0
    
    # Multi-line HTTPException patterns
    multiline_patterns = [
        # 415 Unsupported Media Type
        (
            r'raise HTTPException\(\s*status_code=415,\s*detail=\{\s*"error": "Unsupported Media Type",\s*"message": "[^"]+",?\s*\},?\s*\)',
            'raise BusinessLogicException(\n                message="Content-Type must be application/json",\n                error_code="UNSUPPORTED_MEDIA_TYPE"\n            )'
        ),
        
        # 429 Rate limit exceeded
        (
            r'raise HTTPException\(\s*status_code=429,\s*detail="[^"]*rate[^"]*"[^)]*\)',
            'raise BusinessLogicException(\n                message="Rate limit exceeded",\n                error_code="RATE_LIMIT_EXCEEDED"\n            )'
        ),
        
        # 400 Bad Request patterns
        (
            r'raise HTTPException\(\s*status_code=400,\s*detail=[^)]+\)',
            'raise BusinessLogicException(\n                message="Invalid request",\n                error_code="INVALID_REQUEST"\n            )'
        ),
        
        # 422 Unprocessable Entity
        (
            r'raise HTTPException\(\s*status_code=422,\s*detail=[^)]+\)',
            'raise BusinessLogicException(\n                message="Validation failed",\n                error_code="VALIDATION_ERROR"\n            )'
        ),
        
        # 500 Internal Server Error
        (
            r'raise HTTPException\(\s*status_code=500,\s*detail=[^)]+\)',
            'raise BusinessLogicException(\n                message="Internal server error",\n                error_code="OPERATION_FAILED"\n            )'
        ),
        
        # Generic HTTPException cleanup
        (
            r'raise HTTPException\(\s*status_code=(\d+),\s*detail=([^)]+)\)',
            r'raise BusinessLogicException(\n                message=\2,\n                error_code="OPERATION_FAILED"\n            )'
        ),
    ]
    
    # Apply patterns
    for i, (pattern, replacement) in enumerate(multiline_patterns):
        old_content = content
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
        
        if content != old_content:
            changes_made += 1
            print(f"✅ Pattern {i+1}: Multi-line HTTPException converted")
    
    if content != original_content:
        with open('backend/routes/propollama.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n🎉 Multi-line HTTPException cleanup complete!")
        print(f"📊 Patterns converted: {changes_made}")
        return True
    else:
        print("❌ No multi-line patterns found to convert")
        return False

if __name__ == "__main__":
    convert_multiline_httpexceptions()
