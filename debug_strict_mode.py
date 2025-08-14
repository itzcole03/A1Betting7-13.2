#!/usr/bin/env python3

import os
from backend.config.settings import SecuritySettings

# Test 1: Direct instantiation with security_strict_mode=True
print("=== Test 1: Direct instantiation ===")
settings1 = SecuritySettings(security_strict_mode=True, csp_report_only=True)
print(f"security_strict_mode: {settings1.security_strict_mode}")
print(f"csp_report_only: {settings1.csp_report_only}")
print()

# Test 2: Environment variable
print("=== Test 2: Environment variable ===")
os.environ['SECURITY_STRICT_MODE'] = 'true'
os.environ['CSP_REPORT_ONLY'] = 'true'
settings2 = SecuritySettings()
print(f"security_strict_mode: {settings2.security_strict_mode}")
print(f"csp_report_only: {settings2.csp_report_only}")
print()

# Test 3: Check what values are passed to model_validator
print("=== Test 3: Debug the model_validator ===")

# Let's add some debug prints to the actual model_validator temporarily
import backend.config.settings

# Monkey patch to add debug
original_validate = backend.config.settings.SecuritySettings.validate_security_strict_mode.__func__

def debug_validate_security_strict_mode(cls, values):
    print(f"model_validator received values keys: {list(values.keys()) if hasattr(values, 'keys') else 'not a dict'}")
    print(f"security_strict_mode type: {type(values.get('security_strict_mode', 'NOT_FOUND'))}")
    print(f"security_strict_mode value: {repr(values.get('security_strict_mode', 'NOT_FOUND'))}")
    result = original_validate(cls, values)
    print(f"model_validator returning values: {result}")
    return result

backend.config.settings.SecuritySettings.validate_security_strict_mode = classmethod(debug_validate_security_strict_mode)

debug_settings = SecuritySettings()
print(f"Final security_strict_mode: {debug_settings.security_strict_mode}")
print(f"Final csp_report_only: {debug_settings.csp_report_only}")
