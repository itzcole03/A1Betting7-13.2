#!/usr/bin/env python3
"""
Script to convert remaining JSONResponse patterns to ResponseBuilder.success() in modern_ml_routes.py
"""

import re

def convert_jsonresponse_patterns(content):
    """Convert all JSONResponse patterns to ResponseBuilder.success()"""
    
    # Pattern 1: Simple JSONResponse with content
    pattern1 = r'return JSONResponse\(\s*content=([^,]+),?\s*(?:status_code=\d+)?\s*\)'
    
    def replace_simple_json(match):
        content_var = match.group(1).strip()
        if content_var.startswith('{') and content_var.endswith('}'):
            # It's an inline dict
            return f'return ResponseBuilder.success(data={content_var})'
        else:
            # It's a variable
            return f'return ResponseBuilder.success(data={content_var})'
    
    content = re.sub(pattern1, replace_simple_json, content, flags=re.MULTILINE | re.DOTALL)
    
    # Pattern 2: Multi-line JSONResponse
    pattern2 = r'return JSONResponse\(\s*content=\{([^}]+)\},?\s*(?:status_code=\d+)?\s*\)'
    
    def replace_multiline_json(match):
        dict_content = match.group(1).strip()
        return f'return ResponseBuilder.success(data={{{dict_content}}})'
    
    content = re.sub(pattern2, replace_multiline_json, content, flags=re.MULTILINE | re.DOTALL)
    
    return content

def add_response_models(content):
    """Add response_model=StandardAPIResponse[Dict[str, Any]] to functions that need it"""
    
    # Find functions that return JSONResponse but don't have response_model
    pattern = r'(@router\.[a-z]+\([^)]*)\)\s*\nasync def ([^(]+)\([^)]*\)\s*(?:-> JSONResponse)?:'
    
    def replace_decorator(match):
        decorator = match.group(1)
        func_name = match.group(2)
        
        if 'response_model=' not in decorator:
            # Add response_model
            if decorator.endswith('"'):
                # Has other parameters
                decorator = decorator[:-1] + ', response_model=StandardAPIResponse[Dict[str, Any]])'
            else:
                # No other parameters or ends with )
                decorator = decorator + ', response_model=StandardAPIResponse[Dict[str, Any]])'
        
        return f'{decorator})\nasync def {func_name}('
    
    content = re.sub(pattern, replace_decorator, content, flags=re.MULTILINE)
    
    return content

if __name__ == '__main__':
    # Read the file
    with open('backend/routes/modern_ml_routes.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Convert JSONResponse patterns
    content = convert_jsonresponse_patterns(content)
    
    # Fix function signatures (remove -> JSONResponse)
    content = re.sub(r'\) -> JSONResponse:', '):', content)
    
    # Write back
    with open('backend/routes/modern_ml_routes.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("JSONResponse conversion completed!")
