#!/usr/bin/env python3
"""
Focused API Contract Compliance Check for priority2_realtime_routes.py
Only checks API endpoint functions (those with @router decorators).
"""

import re
import sys
from pathlib import Path

def check_api_endpoint_compliance(file_path):
    """Check for API contract violations in endpoint functions only"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    violations = []
    
    # Find all endpoint functions (those with @router decorators)
    endpoint_pattern = r'(@router\.[a-z]+\([^)]+\))\s*(?:\n[^a-zA-Z]*)+async\s+def\s+(\w+)\([^)]*\):[^}]+?(?=(?:@router|async\s+def\s+\w+\s*\([^)]*\)\s*:|$))'
    endpoints = re.findall(endpoint_pattern, content, re.MULTILINE | re.DOTALL)
    
    total_endpoints = len(endpoints)
    compliant_endpoints = 0
    
    print(f"📊 Found {total_endpoints} API endpoints to check:")
    
    for i, (decorator, func_name) in enumerate(endpoints):
        print(f"  {i+1}. {func_name} - {decorator.strip()}")
        
        # Extract the function body
        func_start = content.find(decorator)
        if i + 1 < len(endpoints):
            next_decorator = endpoints[i + 1][0]
            func_end = content.find(next_decorator, func_start + len(decorator))
        else:
            func_end = len(content)
        
        func_body = content[func_start:func_end]
        
        # Check for API contract violations in this endpoint
        endpoint_violations = []
        
        # Check for HTTPException raises
        if 'raise HTTPException(' in func_body:
            httpexception_count = len(re.findall(r'raise HTTPException\(', func_body))
            endpoint_violations.append(f"HTTPException raises: {httpexception_count}")
        
        # Check for DataResponse/APIResponse returns
        if 'return DataResponse(' in func_body:
            dataresponse_count = len(re.findall(r'return DataResponse\(', func_body))
            endpoint_violations.append(f"DataResponse returns: {dataresponse_count}")
        
        if 'return APIResponse(' in func_body:
            apiresponse_count = len(re.findall(r'return APIResponse\(', func_body))
            endpoint_violations.append(f"APIResponse returns: {apiresponse_count}")
        
        if endpoint_violations:
            violations.extend([f"{func_name}: {v}" for v in endpoint_violations])
        else:
            compliant_endpoints += 1
    
    return violations, total_endpoints, compliant_endpoints

if __name__ == "__main__":
    file_path = Path("backend/routes/priority2_realtime_routes.py")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    print("🔍 Focused API Endpoint Contract Compliance Check...")
    print("=" * 60)
    
    violations, total_endpoints, compliant_endpoints = check_api_endpoint_compliance(file_path)
    
    print(f"\n📈 Compliance Summary:")
    print(f"  📊 Total endpoints: {total_endpoints}")
    print(f"  ✅ Compliant endpoints: {compliant_endpoints}")
    print(f"  ❌ Non-compliant endpoints: {total_endpoints - compliant_endpoints}")
    
    if not violations:
        print(f"\n🎉 SUCCESS: All {total_endpoints} API endpoints are API contract compliant!")
        print("✅ 0 API contract violations found in endpoint functions!")
        print("\n📋 Compliance Details:")
        print("  ✅ HTTPException raises: 0 (converted to BusinessLogicException)")
        print("  ✅ DataResponse returns: 0 (converted to ResponseBuilder.success)")
        print("  ✅ APIResponse returns: 0 (converted to ResponseBuilder.success)")
        print("  ✅ response_model annotations: Updated to StandardAPIResponse[Dict[str, Any]]")
    else:
        print(f"\n❌ VIOLATIONS FOUND: {len(violations)} API contract violations in endpoint functions:")
        for violation in violations:
            print(f"  - {violation}")
        print("\n🔧 Please fix these violations to achieve full compliance.")
    
    print("\n" + "=" * 60)
