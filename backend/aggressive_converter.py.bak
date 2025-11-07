#!/usr/bin/env python3
"""
Aggressive HTTP Contract Cleanup Script
More comprehensive conversion of contract violations
"""

import os
import re
import sys
from pathlib import Path

def convert_file_aggressively(file_path):
    """Aggressively convert all contract violations in a single file"""
    print(f"\nProcessing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    original_content = content
    changes_made = []
    
    # 1. Replace all HTTPException patterns more aggressively
    # Handle all forms of HTTPException
    def replace_http_exception_comprehensive(match):
        full_exception = match.group(0)
        
        # Extract status code if present
        status_match = re.search(r'status_code\s*=\s*(\d+)', full_exception)
        status_code = status_match.group(1) if status_match else "500"
        
        # Extract detail message
        detail_match = re.search(r'detail\s*=\s*([^,)]+)', full_exception)
        if detail_match:
            detail = detail_match.group(1).strip()
            # Clean up quotes
            detail = re.sub(r'^["\']|["\']$', '', detail)
        else:
            detail = "Operation failed"
        
        # Determine exception type based on status code
        if status_code in ["401", "403"]:
            return f'raise AuthenticationException("{detail}")'
        else:
            return f'raise BusinessLogicException("{detail}")'
    
    # More comprehensive HTTPException patterns
    patterns_to_replace = [
        r'raise\s+HTTPException\([^)]*\)',
        r'HTTPException\([^)]*\)',
    ]
    
    for pattern in patterns_to_replace:
        content = re.sub(pattern, replace_http_exception_comprehensive, content)
        if re.search(pattern, original_content):
            changes_made.append("Replaced HTTPException patterns")
    
    # 2. Add response_model to ALL router endpoints
    def add_response_model_comprehensive(match):
        route_decorator = match.group(0)
        if 'response_model=' in route_decorator:
            return route_decorator  # Already has response_model
        
        # Insert before the closing parenthesis
        if route_decorator.endswith(')'):
            # Check if there are existing parameters
            if '(' in route_decorator and route_decorator.index('(') < route_decorator.rindex(')') - 1:
                # Has parameters, add comma
                new_decorator = route_decorator[:-1] + ', response_model=StandardAPIResponse[Dict[str, Any]])'
            else:
                # No parameters, add without comma
                new_decorator = route_decorator[:-1] + 'response_model=StandardAPIResponse[Dict[str, Any]])'
        else:
            new_decorator = route_decorator + ', response_model=StandardAPIResponse[Dict[str, Any]]'
        
        return new_decorator
    
    # Match router decorators more comprehensively
    router_pattern = r'@router\.\w+\([^)]*\)'
    old_content = content
    content = re.sub(router_pattern, add_response_model_comprehensive, content)
    if content != old_content:
        changes_made.append("Added response_model to endpoints")
    
    # 3. Wrap ALL return statements (more aggressive)
    def wrap_return_aggressive(match):
        return_statement = match.group(0)
        return_value = match.group(1)
        
        # Skip if already using ResponseBuilder or JSONResponse
        if any(keyword in return_value for keyword in ['ResponseBuilder', 'JSONResponse', 'FileResponse', 'StreamingResponse']):
            return return_statement
        
        # Skip simple literals
        if return_value.strip() in ['None', 'True', 'False', '""', "''"]:
            return return_statement
            
        # Skip if it's already a function call that likely returns a response
        if re.match(r'^[a-zA-Z_]\w*\([^)]*\)$', return_value.strip()):
            return return_statement
        
        return f'return ResponseBuilder.success({return_value})'
    
    # More comprehensive return pattern - catch all return statements with values
    return_pattern = r'return\s+([^;\n]+)'
    old_content = content
    content = re.sub(return_pattern, wrap_return_aggressive, content)
    if content != old_content:
        changes_made.append("Wrapped returns with ResponseBuilder")
    
    # 4. Ensure proper imports are added
    if 'from ..core.response_models import' not in content:
        lines = content.split('\n')
        insert_index = -1
        
        # Find best insertion point
        for i, line in enumerate(lines):
            if line.strip().startswith('from fastapi import') or line.strip().startswith('from typing import'):
                insert_index = i + 1
                break
        
        if insert_index > 0:
            lines.insert(insert_index, "")
            lines.insert(insert_index + 1, "# Contract compliance imports")
            lines.insert(insert_index + 2, "from ..core.response_models import ResponseBuilder, StandardAPIResponse")
            lines.insert(insert_index + 3, "from ..core.exceptions import BusinessLogicException, AuthenticationException")
            content = '\n'.join(lines)
            changes_made.append("Added contract imports")
    
    # 5. Add Any import if needed
    if 'StandardAPIResponse[Dict[str, Any]]' in content:
        # Check if Any is imported
        if re.search(r'from typing import.*Any', content):
            pass  # Already imported
        elif re.search(r'from typing import', content):
            # Add Any to existing typing import
            content = re.sub(
                r'from typing import ([^\n]+)',
                r'from typing import \1, Any',
                content
            )
            changes_made.append("Added Any to typing imports")
        else:
            # Add new typing import with Any
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.strip().startswith('from fastapi import'):
                    lines.insert(i, "from typing import Dict, Any")
                    break
            content = '\n'.join(lines)
            changes_made.append("Added typing imports with Any")
    
    # Write the file if changes were made
    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Aggressively converted {file_path}")
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
        print("Usage: python aggressive_converter.py <file1> [file2] ...")
        sys.exit(1)
    
    files_to_convert = sys.argv[1:]
    converted_count = 0
    
    print("Starting Aggressive HTTP Contract Cleanup...")
    print("=" * 60)
    
    for file_path in files_to_convert:
        if Path(file_path).exists():
            if convert_file_aggressively(file_path):
                converted_count += 1
        else:
            print(f"❌ File not found: {file_path}")
    
    print("\n" + "=" * 60)
    print(f"Aggressive conversion complete! {converted_count}/{len(files_to_convert)} files converted.")

if __name__ == "__main__":
    main()
