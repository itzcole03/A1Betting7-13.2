#!/usr/bin/env python3
"""
Convert DataResponse and APIResponse returns to ResponseBuilder.success() pattern
in priority2_realtime_routes.py for API contract compliance.
"""

import re
import sys
from pathlib import Path

def convert_data_response_returns(file_path):
    """Convert DataResponse returns to ResponseBuilder.success()"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Track conversions
    conversions = 0
    
    # Pattern for DataResponse returns - handle multiline cases
    data_response_pattern = r'return DataResponse\(\s*success=True,\s*message="[^"]*",\s*data=([^}]+}[^}]*}?)\s*,?\s*\)'
    
    def replace_data_response(match):
        nonlocal conversions
        data_content = match.group(1).strip()
        # Remove trailing comma if present
        data_content = data_content.rstrip(',')
        
        conversions += 1
        return f'return ResponseBuilder.success(\n            data={data_content}\n        )'
    
    # Apply DataResponse conversions
    content = re.sub(data_response_pattern, replace_data_response, content, flags=re.MULTILINE | re.DOTALL)
    
    # Pattern for APIResponse returns
    api_response_pattern = r'return APIResponse\(\s*success=True,\s*(?:message="[^"]*",\s*)?data=([^}]+}[^}]*}?)\s*,?\s*\)'
    
    def replace_api_response(match):
        nonlocal conversions
        data_content = match.group(1).strip()
        # Remove trailing comma if present
        data_content = data_content.rstrip(',')
        
        conversions += 1
        return f'return ResponseBuilder.success(\n            data={data_content}\n        )'
    
    # Apply APIResponse conversions
    content = re.sub(api_response_pattern, replace_api_response, content, flags=re.MULTILINE | re.DOTALL)
    
    # Write back the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Converted {conversions} DataResponse/APIResponse returns in {file_path}")
    return conversions

if __name__ == "__main__":
    file_path = Path("backend/routes/priority2_realtime_routes.py")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    print("🔄 Converting DataResponse/APIResponse returns to ResponseBuilder.success()...")
    conversions = convert_data_response_returns(file_path)
    
    print(f"✅ Conversion complete! {conversions} returns converted.")
