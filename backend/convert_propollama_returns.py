#!/usr/bin/env python3
"""
Convert non-standard returns in propollama.py to ResponseBuilder patterns
"""

import re

def convert_propollama_returns():
    with open('backend/routes/propollama.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = 0
    
    # Return conversion patterns for endpoint functions
    return_patterns = [
        # Simple variable returns in endpoint functions
        (
            r'(\s+)return ([a-zA-Z_][a-zA-Z0-9_]+)(?=\s*$|\s*\n)',
            r'\1return ResponseBuilder.success(data=\2)'
        ),
        
        # Dictionary returns with mixed patterns
        (
            r'return \{([^}]+)\}',
            lambda m: f'return ResponseBuilder.success(data={{{m.group(1)}}})'
        ),
        
        # List returns
        (
            r'(\s+)return \[([^\]]+)\]',
            r'\1return ResponseBuilder.success(data=[\2])'
        ),
        
        # String returns in endpoints (but not error handling)
        (
            r'(\s+)return "([^"]+)"(?=\s*$|\s*\n)',
            r'\1return ResponseBuilder.success(data="\2")'
        ),
        
        # None returns in endpoints
        (
            r'(\s+)return None(?=\s*$|\s*\n)',
            r'\1return ResponseBuilder.success(data=None)'
        ),
    ]
    
    # Convert patterns one by one
    for i, (pattern, replacement) in enumerate(return_patterns):
        old_content = content
        if callable(replacement):
            # Skip callable patterns for now - too complex
            continue
        else:
            # Only convert returns that are likely in endpoint functions
            # Look for function context with @router decorator
            lines = content.split('\n')
            new_lines = []
            
            for j, line in enumerate(lines):
                if re.match(r'\s*return\s+(?!ResponseBuilder)', line) and not any(x in line for x in ['def _', 'def get_', 'except:', 'if __name__']):
                    # Check if we're in an endpoint function (look back for @router)
                    context_start = max(0, j-20)
                    context = '\n'.join(lines[context_start:j])
                    
                    if '@router.' in context:
                        # This is likely an endpoint return
                        new_line = re.sub(pattern, replacement, line)
                        if new_line != line:
                            changes_made += 1
                            new_lines.append(new_line)
                        else:
                            new_lines.append(line)
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
            
            content = '\n'.join(new_lines)
    
    if content != original_content:
        with open('backend/routes/propollama.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Return conversion complete!")
        print(f"📊 Returns converted: {changes_made}")
        return True
    else:
        print("❌ No return patterns found to convert")
        return False

if __name__ == "__main__":
    convert_propollama_returns()
