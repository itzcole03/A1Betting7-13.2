#!/usr/bin/env python3
"""
Convert response_model annotations from DataResponse/APIResponse to StandardAPIResponse[Dict[str, Any]]
in priority2_realtime_routes.py for API contract compliance.
"""

import re
import sys
from pathlib import Path

def convert_response_models(file_path):
    """Convert response_model annotations to StandardAPIResponse[Dict[str, Any]]"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Track conversions
    conversions = 0
    
    # Add Dict import at the top if not present
    if "from typing import Dict" not in content and "from typing import Any, Dict" not in content:
        # Find the typing import line and add Dict to it
        typing_pattern = r'(from typing import [^)]+)(\))'
        if re.search(typing_pattern, content):
            content = re.sub(typing_pattern, r'\1, Dict, Any\2', content)
            conversions += 1
        else:
            # Add new typing import
            import_section = re.search(r'(from typing import [^\n]+)', content)
            if import_section:
                content = content.replace(import_section.group(1), import_section.group(1) + ", Dict, Any")
                conversions += 1
    
    # Pattern for response_model=DataResponse
    dataresponse_model_pattern = r'response_model=DataResponse'
    content = re.sub(dataresponse_model_pattern, 'response_model=StandardAPIResponse[Dict[str, Any]]', content)
    dataresponse_conversions = len(re.findall(dataresponse_model_pattern, content))
    
    # Pattern for response_model=APIResponse
    apiresponse_model_pattern = r'response_model=APIResponse'
    content = re.sub(apiresponse_model_pattern, 'response_model=StandardAPIResponse[Dict[str, Any]]', content)
    apiresponse_conversions = len(re.findall(apiresponse_model_pattern, content))
    
    conversions += dataresponse_conversions + apiresponse_conversions
    
    # Write back the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Converted {conversions} response_model annotations in {file_path}")
    return conversions

if __name__ == "__main__":
    file_path = Path("backend/routes/priority2_realtime_routes.py")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    print("🔄 Converting response_model annotations to StandardAPIResponse[Dict[str, Any]]...")
    conversions = convert_response_models(file_path)
    
    print(f"✅ Conversion complete! {conversions} response_model annotations converted.")
