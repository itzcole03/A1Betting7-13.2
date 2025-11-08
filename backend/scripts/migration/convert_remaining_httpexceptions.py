#!/usr/bin/env python3
"""
Script to convert remaining HTTPException raises to BusinessLogicException
in priority2_realtime_routes.py
"""

import re
from pathlib import Path

def convert_httpexceptions():
    file_path = Path('backend/routes/priority2_realtime_routes.py')
    content = file_path.read_text(encoding='utf-8')
    
    # Convert all remaining HTTPException raises
    conversions = [
        # Pattern 1: status_code=500
        (
            r'raise HTTPException\(status_code=500, detail=str\(e\)\)',
            'raise BusinessLogicException(\n            message=f"Operation failed: {str(e)}",\n            error_code="OPERATION_FAILED"\n        )'
        ),
        # Pattern 2: status_code=404 
        (
            r'raise HTTPException\(\s*status_code=404, detail=f"Circuit breaker \'{service_name}\' not found"\s*\)',
            'raise BusinessLogicException(\n                message=f"Circuit breaker \'{service_name}\' not found",\n                error_code="RESOURCE_NOT_FOUND"\n            )'
        ),
        # Pattern 3: Generic 500 with details
        (
            r'raise HTTPException\(status_code=500, detail=str\(e\)\)',
            'raise BusinessLogicException(\n            message=f"Operation failed: {str(e)}",\n            error_code="OPERATION_FAILED"\n        )'
        )
    ]
    
    for pattern, replacement in conversions:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    
    file_path.write_text(content, encoding='utf-8')
    print("HTTPException conversions completed")
    
    # Count remaining HTTPExceptions
    remaining = len(re.findall(r'raise\s+HTTPException', content, re.IGNORECASE))
    print(f"Remaining HTTPException raises: {remaining}")
    
if __name__ == "__main__":
    convert_httpexceptions()
