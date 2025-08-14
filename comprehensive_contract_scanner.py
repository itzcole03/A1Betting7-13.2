#!/usr/bin/env python3
"""
Comprehensive HTTP Contract Violation Scanner
Scans all files in backend/routes for contract violations
"""

import os
import re
from pathlib import Path

def count_violations(file_path):
    """Count contract violations in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []
    
    violations = []
    lines = content.split('\n')
    
    # Count HTTPException usages
    httpexception_matches = re.findall(r'HTTPException\(', content)
    violations.extend(['HTTPException usage'] * len(httpexception_matches))
    
    # Count raise HTTPException patterns
    raise_http_matches = re.findall(r'raise\s+HTTPException\(', content)
    violations.extend(['raise HTTPException'] * len(raise_http_matches))
    
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Check for direct dict/list returns (not wrapped in ResponseBuilder.success)
        if (stripped.startswith('return {') or stripped.startswith('return [')) and \
           'ResponseBuilder.success' not in stripped and \
           'JSONResponse' not in stripped:
            violations.append(f'Non-standard return at line {i}')
        
        # Check for missing response_model in router definitions
        if stripped.startswith('@router.') and \
           any(method in stripped for method in ['get(', 'post(', 'put(', 'delete(', 'patch(']) and \
           'response_model=' not in stripped:
            violations.append(f'Missing response_model at line {i}')
        
        # Check for JSONResponse without StandardAPIResponse
        if 'JSONResponse(' in stripped and 'StandardAPIResponse' not in content:
            violations.append(f'JSONResponse without StandardAPIResponse at line {i}')
    
    return violations

def scan_routes_directory():
    """Scan all Python files in backend/routes"""
    routes_dir = Path("backend/routes")
    
    if not routes_dir.exists():
        print(f"Directory {routes_dir} does not exist!")
        return []
    
    results = []
    
    for py_file in routes_dir.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
            
        violations = count_violations(py_file)
        
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
    print("HTTP CONTRACT VIOLATION SCANNER RESULTS")
    print("="*80)
    
    if not results:
        print("✅ No violations found!")
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
    print("Starting comprehensive contract violation scan...")
    results = scan_routes_directory()
    sorted_results = print_results_table(results)
    
    if sorted_results:
        print(f"\n🔧 TOP 5 FILES TO CONVERT:")
        for i, result in enumerate(sorted_results[:5], 1):
            print(f"{i}. {result['file']} ({result['count']} violations)")
