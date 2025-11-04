#!/usr/bin/env python3
"""
PropOllama API Contract Conversion Verification Script

This script verifies that propollama.py has been successfully converted to
use the standardized API contract patterns.

Checks:
1. No HTTPException raises (should use BusinessLogicException)
2. No JSONResponse usage (should use ResponseBuilder or proper response models)
3. All endpoints use proper response models
4. BusinessLogicException calls are properly formatted
"""

import ast
import re
from pathlib import Path


def analyze_propollama_file():
    """Analyze the propollama.py file for API contract compliance."""
    
    file_path = Path("backend/routes/propollama.py")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    print(f"🔍 Analyzing {file_path}")
    content = file_path.read_text(encoding='utf-8')
    
    violations = []
    warnings = []
    
    # Check 1: HTTPException raises
    httpexception_pattern = r'raise\s+HTTPException'
    httpexceptions = re.findall(httpexception_pattern, content, re.IGNORECASE)
    if httpexceptions:
        violations.append(f"Found {len(httpexceptions)} HTTPException raises")
        for i, line in enumerate(content.split('\n'), 1):
            if re.search(httpexception_pattern, line, re.IGNORECASE):
                violations.append(f"  Line {i}: {line.strip()}")
    else:
        print("✅ No HTTPException raises found")
    
    # Check 2: JSONResponse usage
    jsonresponse_pattern = r'JSONResponse\s*\('
    jsonresponses = re.findall(jsonresponse_pattern, content)
    if jsonresponses:
        violations.append(f"Found {len(jsonresponses)} JSONResponse uses")
        for i, line in enumerate(content.split('\n'), 1):
            if re.search(jsonresponse_pattern, line):
                violations.append(f"  Line {i}: {line.strip()}")
    else:
        print("✅ No JSONResponse usage found")
    
    # Check 3: BusinessLogicException format
    business_exception_pattern = r'BusinessLogicException\s*\('
    matches = list(re.finditer(business_exception_pattern, content))
    
    malformed_business_exceptions = 0
    for match in matches:
        # Get the line number
        line_num = content[:match.start()].count('\n') + 1
        
        # Extract a reasonable chunk around the match to check format
        start = max(0, match.start() - 100)
        end = min(len(content), match.end() + 500)
        chunk = content[start:end]
        
        # Check for malformed patterns
        if re.search(r'message\s*=\s*\{', chunk) or re.search(r'message.*str\(.*error_code', chunk):
            malformed_business_exceptions += 1
            violations.append(f"  Line {line_num}: Malformed BusinessLogicException")
    
    if malformed_business_exceptions > 0:
        violations.append(f"Found {malformed_business_exceptions} malformed BusinessLogicException calls")
    else:
        print("✅ All BusinessLogicException calls appear properly formatted")
    
    # Check 4: Response model usage
    response_model_pattern = r'response_model\s*=\s*(\w+)'
    response_models = re.findall(response_model_pattern, content)
    if response_models:
        print(f"✅ Found {len(response_models)} endpoints with response models:")
        for model in set(response_models):
            print(f"   - {model}")
    else:
        warnings.append("No response_model annotations found")
    
    # Check 5: Import statements
    required_imports = [
        'ResponseBuilder',
        'StandardAPIResponse', 
        'BusinessLogicException'
    ]
    
    missing_imports = []
    for required_import in required_imports:
        if required_import not in content:
            missing_imports.append(required_import)
    
    if missing_imports:
        violations.append(f"Missing required imports: {missing_imports}")
    else:
        print("✅ All required imports present")
    
    # Check 6: Return statement patterns
    dict_return_pattern = r'return\s+\{'
    dict_returns = len(re.findall(dict_return_pattern, content))
    
    # Check if these are in endpoints that should use ResponseBuilder
    endpoint_function_pattern = r'@router\.(get|post|put|delete)\s*\([^)]*\)\s*async\s+def\s+(\w+)'
    endpoints = re.findall(endpoint_function_pattern, content, re.MULTILINE | re.DOTALL)
    
    if dict_returns > 0:
        if endpoints:
            warnings.append(f"Found {dict_returns} direct dictionary returns - verify these are appropriate")
            print(f"⚠️  Found {dict_returns} direct dictionary returns (may be appropriate for some endpoints)")
        
    # Summary
    print(f"\n📊 Analysis Summary:")
    print(f"   - Endpoints found: {len(endpoints)}")
    print(f"   - HTTPException violations: {len(httpexceptions)}")
    print(f"   - JSONResponse violations: {len(jsonresponses)}")
    print(f"   - BusinessLogicException malformed: {malformed_business_exceptions}")
    print(f"   - Response models used: {len(set(response_models))}")
    
    if violations:
        print(f"\n❌ {len(violations)} violations found:")
        for violation in violations:
            print(f"   {violation}")
    
    if warnings:
        print(f"\n⚠️  {len(warnings)} warnings:")
        for warning in warnings:
            print(f"   {warning}")
    
    if not violations:
        print("\n🎉 All critical API contract violations have been resolved!")
        return True
    else:
        print(f"\n❌ {len(violations)} violations still need to be fixed")
        return False


if __name__ == "__main__":
    print("PropOllama API Contract Conversion Verification")
    print("=" * 50)
    
    success = analyze_propollama_file()
    
    if success:
        print("\n✅ Conversion completed successfully!")
        exit(0)
    else:
        print("\n❌ Conversion incomplete - violations remain")
        exit(1)
