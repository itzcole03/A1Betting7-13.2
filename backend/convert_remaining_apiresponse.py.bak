#!/usr/bin/env python3
"""
Convert remaining APIResponse returns to ResponseBuilder.success() pattern
in priority2_realtime_routes.py.
"""

import re
import sys
from pathlib import Path

def convert_remaining_apiresponse_returns(file_path):
    """Convert remaining APIResponse returns to ResponseBuilder.success()"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Track conversions
    conversions = 0
    
    # Pattern 1: APIResponse with just message (no data)
    apiresponse_message_pattern = r'return APIResponse\(\s*success=True,\s*message=([^,\)]+)\s*,?\s*\)'
    
    def replace_apiresponse_message(match):
        nonlocal conversions
        message_content = match.group(1).strip()
        conversions += 1
        return f'return ResponseBuilder.success(\n            data={{"message": {message_content}}}\n        )'
    
    # Apply APIResponse message-only conversions
    content = re.sub(apiresponse_message_pattern, replace_apiresponse_message, content, flags=re.MULTILINE | re.DOTALL)
    
    # Write back the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Converted {conversions} APIResponse returns in {file_path}")
    return conversions

if __name__ == "__main__":
    file_path = Path("backend/routes/priority2_realtime_routes.py")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    print("🔄 Converting remaining APIResponse returns to ResponseBuilder.success()...")
    conversions = convert_remaining_apiresponse_returns(file_path)
    
    print(f"✅ Conversion complete! {conversions} APIResponse returns converted.")
