#!/usr/bin/env python3
"""
Response Model Fixer
Adds missing response_model parameters to router endpoints
"""

import os
import re
import sys
from pathlib import Path

def fix_response_models(file_path):
    """Fix missing response_model parameters"""
    print(f"\nProcessing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    original_content = content
    changes_made = []
    
    # Find all router decorators without response_model
    def add_response_model(match):
        route_decorator = match.group(0)
        if 'response_model=' in route_decorator:
            return route_decorator  # Already has response_model
        
        # Add response_model parameter
        if route_decorator.endswith(')'):
            # Check if there are any parameters by looking for content between parentheses
            paren_content = route_decorator[route_decorator.find('(') + 1:-1].strip()
            if paren_content:
                # Has parameters, add comma and response_model
                new_decorator = route_decorator[:-1] + ', response_model=StandardAPIResponse[Dict[str, Any]])'
            else:
                # No parameters, just add response_model
                new_decorator = route_decorator[:-1] + 'response_model=StandardAPIResponse[Dict[str, Any]])'
        else:
            new_decorator = route_decorator + ', response_model=StandardAPIResponse[Dict[str, Any]]'
        
        return new_decorator
    
    # Pattern to match all router method decorators
    router_pattern = r'@router\.(get|post|put|delete|patch|head|options|trace)\([^)]*\)'
    
    content = re.sub(router_pattern, add_response_model, content)
    
    # Check if we need to ensure imports are present
    if 'response_model=StandardAPIResponse[Dict[str, Any]]' in content:
        # Ensure proper imports
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
        
        # Ensure Any is imported
        if 'Dict[str, Any]' in content and 'Any' not in re.findall(r'from typing import ([^\n]+)', content)[0] if re.findall(r'from typing import ([^\n]+)', content) else True:
            # Add Any to existing typing import
            content = re.sub(
                r'from typing import ([^\n]+)',
                lambda m: f'from typing import {m.group(1)}, Any' if 'Any' not in m.group(1) else m.group(0),
                content
            )
            changes_made.append("Added Any to typing imports")
    
    if content != original_content:
        changes_made.append("Added response_model parameters")
    
    # Write the file if changes were made
    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Fixed response models in {file_path}")
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
        print("Usage: python response_model_fixer.py <file1> [file2] ...")
        sys.exit(1)
    
    files_to_fix = sys.argv[1:]
    fixed_count = 0
    
    print("Starting Response Model Fixer...")
    print("=" * 50)
    
    for file_path in files_to_fix:
        if Path(file_path).exists():
            if fix_response_models(file_path):
                fixed_count += 1
        else:
            print(f"❌ File not found: {file_path}")
    
    print("\n" + "=" * 50)
    print(f"Response model fixing complete! {fixed_count}/{len(files_to_fix)} files fixed.")

if __name__ == "__main__":
    main()
