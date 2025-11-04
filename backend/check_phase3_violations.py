#!/usr/bin/env python3
"""
Quick violation check for phase3_routes.py
"""

import ast
import os

def count_violations(file_path):
    """Count contract violations in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    violations = []
    
    # Count HTTPException usages
    httpexception_count = content.count('HTTPException(')
    violations.extend(['HTTPException usage'] * httpexception_count)
    
    # Count non-standard return patterns (rough heuristic)
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Check for direct dict returns
        if (stripped.startswith('return {') and 
            'ResponseBuilder.success' not in stripped):
            violations.append(f'Non-standard return at line {i}')
        
        # Check for missing response_model
        if (stripped.startswith('@router.') and 
            'response_model=' not in stripped and
            'GET' in stripped or 'POST' in stripped):
            violations.append(f'Missing response_model at line {i}')
    
    return violations

if __name__ == "__main__":
    file_path = "backend/routes/phase3_routes.py"
    violations = count_violations(file_path)
    
    print(f"Phase 3 Routes Violations: {len(violations)}")
    
    # Group by type
    violation_types = {}
    for v in violations:
        vtype = v.split(' at line')[0] if ' at line' in v else v
        violation_types[vtype] = violation_types.get(vtype, 0) + 1
    
    print("\nBreakdown:")
    for vtype, count in violation_types.items():
        print(f"  {vtype}: {count}")
