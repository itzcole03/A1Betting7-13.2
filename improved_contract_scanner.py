#!/usr/bin/env python3
"""
Improved Contract Violation Scanner
More accurate detection of actual violations
"""

import os
import re
from pathlib import Path

def count_violations_accurately(file_path):
    """Count contract violations in a single file with improved accuracy"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []
    
    violations = []
    lines = content.split('\n')
    
    # Count HTTPException usages (both direct and raise)
    httpexception_direct = re.findall(r'HTTPException\(', content)
    violations.extend(['HTTPException usage'] * len(httpexception_direct))
    
    # Count raise HTTPException patterns
    raise_http_matches = re.findall(r'raise\s+HTTPException\(', content)
    violations.extend(['raise HTTPException'] * len(raise_http_matches))
    
    # Track multi-line router decorators
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Check for router decorator start
        if line.startswith('@router.') and any(method in line for method in ['get(', 'post(', 'put(', 'delete(', 'patch(']):
            # Collect full decorator (might span multiple lines)
            decorator_lines = [line]
            j = i + 1
            
            # Keep reading lines until we find the complete decorator
            while j < len(lines) and not lines[j].strip().startswith('def ') and not lines[j].strip().startswith('async def '):
                next_line = lines[j].strip()
                if next_line:  # Skip empty lines
                    decorator_lines.append(next_line)
                    if ')' in next_line and next_line.count(')') >= line.count('('):
                        break
                j += 1
            
            # Combine all decorator lines
            full_decorator = ' '.join(decorator_lines)
            
            # Check if response_model is present
            if 'response_model=' not in full_decorator:
                violations.append(f'Missing response_model at line {i+1}')
            
            i = j
        else:
            # Check for direct dict/list returns (not wrapped in ResponseBuilder.success)
            if (line.startswith('return {') or line.startswith('return [')) and \
               'ResponseBuilder.success' not in line and \
               'JSONResponse' not in line:
                violations.append(f'Non-standard return at line {i+1}')
            
            # Check for JSONResponse without StandardAPIResponse
            if 'JSONResponse(' in line and 'StandardAPIResponse' not in content:
                violations.append(f'JSONResponse without StandardAPIResponse at line {i+1}')
        
        i += 1
    
    return violations

def scan_routes_directory():
    """Scan all Python files in backend/routes with improved accuracy"""
    routes_dir = Path("backend/routes")
    
    if not routes_dir.exists():
        print(f"Directory {routes_dir} does not exist!")
        return []
    
    results = []
    
    for py_file in routes_dir.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
            
        violations = count_violations_accurately(py_file)
        
        if violations:
            results.append({
                'file': py_file.name,
                'path': str(py_file),
                'violations': violations,
                'count': len(violations)
            })
    
    return results

def print_results_table(results):
    """Print a sorted table of results"""
    print("\n" + "="*80)
    print("IMPROVED HTTP CONTRACT VIOLATION SCANNER RESULTS")
    print("="*80)
    
    if not results:
        print("🎉 ZERO VIOLATIONS FOUND! All files are contract compliant!")
        return
    
    # Sort by violation count (descending)
    results_sorted = sorted(results, key=lambda x: x['count'], reverse=True)
    
    print(f"{'File':<30} {'Violations':<12} {'Details'}")
    print("-" * 80)
    
    total_violations = 0
    for result in results_sorted:
        total_violations += result['count']
        
        # Group violations by type for summary
        violation_types = {}
        for v in result['violations']:
            vtype = v.split(' at line')[0] if ' at line' in v else v
            violation_types[vtype] = violation_types.get(vtype, 0) + 1
        
        # Create summary string
        summary_parts = []
        for vtype, count in violation_types.items():
            summary_parts.append(f"{vtype}: {count}")
        summary = "; ".join(summary_parts)
        
        print(f"{result['file']:<30} {result['count']:<12} {summary}")
    
    print("-" * 80)
    print(f"Total files with violations: {len(results_sorted)}")
    print(f"Total violations: {total_violations}")
    
    return results_sorted

if __name__ == "__main__":
    print("Starting improved contract violation scan...")
    results = scan_routes_directory()
    sorted_results = print_results_table(results)
    
    if sorted_results:
        print(f"\n🔧 FILES THAT STILL NEED ATTENTION:")
        for i, result in enumerate(sorted_results[:10], 1):
            print(f"{i}. {result['file']} ({result['count']} violations)")
