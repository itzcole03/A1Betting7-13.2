#!/usr/bin/env python3
"""
HTTP Contract Cleanup Script
Automates the conversion of contract violations in Python files
"""

import os
import re
import sys
from pathlib import Path

def convert_file_contract_violations(file_path):
    """Convert all contract violations in a single file"""
    print(f"\nProcessing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    original_content = content
    changes_made = []
    
    # 1. Add necessary imports if not present
    if 'from ..core.response_models import' not in content:
        # Find the import section
        lines = content.split('\n')
        insert_index = -1
        
        for i, line in enumerate(lines):
            if line.strip().startswith('from fastapi import'):
                insert_index = i + 1
                break
        
        if insert_index > 0:
            # Insert the contract imports
            lines.insert(insert_index, "")
            lines.insert(insert_index + 1, "# Contract compliance imports")
            lines.insert(insert_index + 2, "from ..core.response_models import ResponseBuilder, StandardAPIResponse")
            lines.insert(insert_index + 3, "from ..core.exceptions import BusinessLogicException, AuthenticationException")
            content = '\n'.join(lines)
            changes_made.append("Added contract imports")
    
    # 2. Add response_model to router endpoints
    router_pattern = r'@router\.(get|post|put|delete|patch)\([^)]*\)'
    
    def add_response_model(match):
        route_decorator = match.group(0)
        if 'response_model=' in route_decorator:
            return route_decorator  # Already has response_model
        
        # Add response_model parameter
        if route_decorator.endswith(')'):
            new_decorator = route_decorator[:-1] + ', response_model=StandardAPIResponse[Dict[str, Any]])'
        else:
            new_decorator = route_decorator + ', response_model=StandardAPIResponse[Dict[str, Any]]'
        
        return new_decorator
    
    content = re.sub(router_pattern, add_response_model, content)
    
    # 3. Replace HTTPException with BusinessLogicException
    # Handle raise HTTPException patterns
    def replace_http_exception(match):
        status_code = match.group(1) if match.group(1) else "500"
        detail = match.group(2) if match.group(2) else "Internal server error"
        
        # Remove quotes if present
        detail = detail.strip('"').strip("'")
        
        # Determine exception type based on status code
        if status_code in ["401", "403"]:
            return f'raise AuthenticationException("{detail}")'
        else:
            return f'raise BusinessLogicException("{detail}")'
    
    # Pattern for raise HTTPException(...) 
    http_exception_pattern = r'raise HTTPException\(\s*status_code=(\d+),\s*detail=([^)]+)\)'
    content = re.sub(http_exception_pattern, replace_http_exception, content)
    
    # 4. Wrap direct returns with ResponseBuilder.success
    def wrap_return(match):
        return_value = match.group(1)
        
        # Skip if already using ResponseBuilder
        if 'ResponseBuilder.success' in return_value or 'JSONResponse' in return_value:
            return match.group(0)
        
        # Skip if it's just a simple value or empty
        if return_value.strip() in ['None', 'True', 'False'] or not return_value.strip():
            return match.group(0)
        
        return f'return ResponseBuilder.success({return_value})'
    
    # Pattern for return statements with dict/list/complex objects
    return_pattern = r'return (\{[^}]*\}|\[[^\]]*\]|[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*(?:\([^)]*\))?)'
    content = re.sub(return_pattern, wrap_return, content)
    
    # 5. Add Any import to typing if needed
    if 'StandardAPIResponse[Dict[str, Any]]' in content and 'Any' not in content:
        content = re.sub(
            r'from typing import (.+)',
            r'from typing import \1, Any',
            content
        )
    
    # Write the file if changes were made
    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Converted {file_path}")
            if changes_made:
                print(f"   Changes: {', '.join(changes_made)}")
            return True
        except Exception as e:
            print(f"❌ Error writing {file_path}: {e}")
            return False
    else:
        print(f"⏭️  No changes needed for {file_path}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python contract_converter.py <file1> [file2] ...")
        sys.exit(1)
    
    files_to_convert = sys.argv[1:]
    converted_count = 0
    
    print("Starting HTTP Contract Cleanup...")
    print("=" * 60)
    
    for file_path in files_to_convert:
        if Path(file_path).exists():
            if convert_file_contract_violations(file_path):
                converted_count += 1
        else:
            print(f"❌ File not found: {file_path}")
    
    print("\n" + "=" * 60)
    print(f"Conversion complete! {converted_count}/{len(files_to_convert)} files converted.")

if __name__ == "__main__":
    main()
