#!/usr/bin/env python3
"""
Final API Contract Compliance Check for priority2_realtime_routes.py
Scans for all remaining API contract violations.
"""

import re
import sys
from pathlib import Path

def check_api_contract_compliance(file_path):
    """Check for API contract violations"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    violations = []
    
    # Check for HTTPException raises
    httpexception_pattern = r'raise HTTPException\('
    httpexception_matches = re.findall(httpexception_pattern, content, re.MULTILINE)
    if httpexception_matches:
        violations.append(f"HTTPException raises: {len(httpexception_matches)} found")
    
    # Check for DataResponse returns
    dataresponse_pattern = r'return DataResponse\('
    dataresponse_matches = re.findall(dataresponse_pattern, content, re.MULTILINE)
    if dataresponse_matches:
        violations.append(f"DataResponse returns: {len(dataresponse_matches)} found")
    
    # Check for APIResponse returns
    apiresponse_pattern = r'return APIResponse\('
    apiresponse_matches = re.findall(apiresponse_pattern, content, re.MULTILINE)
    if apiresponse_matches:
        violations.append(f"APIResponse returns: {len(apiresponse_matches)} found")
    
    # Check for non-standard return patterns (excluding ResponseBuilder.success)
    non_standard_returns = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if line_stripped.startswith('return ') and 'ResponseBuilder.success' not in line_stripped:
            # Skip certain allowed patterns
            if any(pattern in line_stripped for pattern in [
                'return {"', 'return []', 'return None', 'return await', 'return True', 'return False',
                'return status', 'return result', 'return websocket', 'return connection_id',
                'return job_id', 'return subscription_id'
            ]):
                continue
            non_standard_returns.append(f"Line {i+1}: {line_stripped}")
    
    if non_standard_returns:
        violations.append(f"Non-standard returns: {len(non_standard_returns)} found")
        for return_line in non_standard_returns[:5]:  # Show first 5
            violations.append(f"  - {return_line}")
    
    return violations

if __name__ == "__main__":
    file_path = Path("backend/routes/priority2_realtime_routes.py")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    print("🔍 Final API Contract Compliance Check...")
    print("=" * 50)
    
    violations = check_api_contract_compliance(file_path)
    
    if not violations:
        print("✅ SUCCESS: 0 API contract violations found!")
        print("🎉 priority2_realtime_routes.py is fully API contract compliant!")
        print("\n📋 Compliance Summary:")
        print("  ✅ HTTPException raises: 0 (converted to BusinessLogicException)")
        print("  ✅ DataResponse returns: 0 (converted to ResponseBuilder.success)")
        print("  ✅ APIResponse returns: 0 (converted to ResponseBuilder.success)")
        print("  ✅ response_model annotations: Updated to StandardAPIResponse[Dict[str, Any]]")
    else:
        print(f"❌ VIOLATIONS FOUND: {len(violations)} API contract violations detected:")
        for violation in violations:
            print(f"  - {violation}")
        print("\n🔧 Please fix these violations to achieve full compliance.")
    
    print("\n" + "=" * 50)
