#!/usr/bin/env python3
"""
Phase 3 HTTPException Converter
Converts HTTPException usages to BusinessLogicException with careful parsing
"""

import re

def convert_phase3_routes(content):
    """Convert phase3_routes.py HTTPExceptions to BusinessLogicException"""
    
    # 1. Fix all HTTPException(status_code=500, detail=str(e)) patterns
    content = re.sub(
        r'raise HTTPException\(status_code=500, detail=str\(e\)\)',
        'raise BusinessLogicException(\n            message=f"Operation failed: {str(e)}",\n            error_code="OPERATION_FAILED"\n        )',
        content
    )
    
    # 2. Fix HTTPException(status_code=404, detail=str(e)) patterns  
    content = re.sub(
        r'raise HTTPException\(status_code=404, detail=str\(e\)\)',
        'raise ResourceNotFoundException("Resource", details={"error": str(e)})',
        content
    )
    
    # 3. Fix HTTPException(status_code=403, detail="...") patterns
    content = re.sub(
        r'raise HTTPException\(status_code=403, detail="([^"]+)"\)',
        r'raise AuthorizationException("\1")',
        content
    )
    
    # 4. Update response_model declarations
    content = re.sub(
        r'response_model=Dict\[str, Any\]',
        r'response_model=StandardAPIResponse[Dict[str, Any]]',
        content
    )
    
    content = re.sub(
        r'response_model=List\[Dict\[str, Any\]\]', 
        r'response_model=StandardAPIResponse[List[Dict[str, Any]]]',
        content
    )
    
    # 5. Fix simple return patterns carefully
    lines = content.split('\n')
    in_function = False
    indent_level = 0
    new_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        current_indent = len(line) - len(line.lstrip())
        
        # Track function context
        if stripped.startswith('async def ') or stripped.startswith('def '):
            in_function = True
            indent_level = current_indent
        elif in_function and current_indent <= indent_level and stripped and not stripped.startswith('@'):
            in_function = False
            
        # Only modify return statements inside functions
        if (in_function and 
            stripped.startswith('return ') and 
            not 'ResponseBuilder.success' in stripped and
            not 'raise' in stripped):
            
            # Handle return {"key": "value", ...} patterns
            if stripped.startswith('return {') and stripped.endswith('}'):
                dict_content = stripped[7:]  # Remove 'return '
                space = ' ' * current_indent
                new_line = space + f'return ResponseBuilder.success(data={dict_content})'
                new_lines.append(new_line)
                continue
                
            # Handle return variable patterns (but not complex expressions)
            elif (len(stripped.split()) == 2 and 
                  not '(' in stripped and 
                  not '[' in stripped and
                  not '"' in stripped):
                return_value = stripped.split()[1]
                space = ' ' * current_indent  
                new_line = space + f'return ResponseBuilder.success(data={return_value})'
                new_lines.append(new_line)
                continue
        
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # 6. Fix the client.host issue  
    content = content.replace(
        'ip_address = request.client.host',
        'ip_address = request.client.host if request.client else "unknown"'
    )
    
    return content

# Read and process the file
if __name__ == "__main__":
    import sys
    
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        content = f.read()
    
    converted = convert_phase3_routes(content)
    
    with open(sys.argv[1], 'w', encoding='utf-8') as f:
        f.write(converted)
    
    print(f"Successfully converted {sys.argv[1]}")
    print("Manual fixes may be needed for complex return statements.")
