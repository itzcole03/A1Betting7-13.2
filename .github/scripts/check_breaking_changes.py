#!/usr/bin/env python3
"""
Breaking Changes Checker for OpenAPI Schemas
Detects breaking changes between two OpenAPI schemas and exits with status code 1 if found
"""

import json
import sys
import argparse
from typing import Dict, List, Set, Any

def check_breaking_changes(base_schema: Dict, current_schema: Dict) -> bool:
    """
    Check for breaking changes between two OpenAPI schemas
    Returns True if breaking changes are found
    """
    breaking_changes = []
    
    # Check for removed endpoints
    base_paths = set(base_schema.get('paths', {}).keys())
    current_paths = set(current_schema.get('paths', {}).keys())
    
    removed_paths = base_paths - current_paths
    if removed_paths:
        breaking_changes.extend([f"Removed endpoint: {path}" for path in removed_paths])
    
    # Check for removed HTTP methods
    for path in base_paths & current_paths:
        base_methods = set(base_schema['paths'][path].keys())
        current_methods = set(current_schema['paths'][path].keys())
        
        removed_methods = base_methods - current_methods
        # Filter out non-HTTP methods
        http_methods = {'get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'}
        removed_http_methods = removed_methods & http_methods
        
        if removed_http_methods:
            breaking_changes.extend([f"Removed method {method.upper()} from {path}" for method in removed_http_methods])
        
        # Check for changes within methods
        for method in base_methods & current_methods:
            if method in http_methods:
                method_breaking_changes = check_method_breaking_changes(
                    path, method,
                    base_schema['paths'][path][method],
                    current_schema['paths'][path][method]
                )
                breaking_changes.extend(method_breaking_changes)
    
    # Check for removed schemas
    base_schemas = set(base_schema.get('components', {}).get('schemas', {}).keys())
    current_schemas = set(current_schema.get('components', {}).get('schemas', {}).keys())
    
    removed_schemas = base_schemas - current_schemas
    if removed_schemas:
        breaking_changes.extend([f"Removed schema: {schema}" for schema in removed_schemas])
    
    # Check for schema property changes
    for schema_name in base_schemas & current_schemas:
        schema_breaking_changes = check_schema_breaking_changes(
            schema_name,
            base_schema['components']['schemas'][schema_name],
            current_schema['components']['schemas'][schema_name]
        )
        breaking_changes.extend(schema_breaking_changes)
    
    # Check for removed security schemes
    base_security = set(base_schema.get('components', {}).get('securitySchemes', {}).keys())
    current_security = set(current_schema.get('components', {}).get('securitySchemes', {}).keys())
    
    removed_security = base_security - current_security
    if removed_security:
        breaking_changes.extend([f"Removed security scheme: {scheme}" for scheme in removed_security])
    
    if breaking_changes:
        print("🚨 Breaking changes detected:")
        for change in breaking_changes:
            print(f"  - {change}")
        return True
    
    return False

def check_method_breaking_changes(path: str, method: str, base_method: Dict, current_method: Dict) -> List[str]:
    """Check for breaking changes within a specific HTTP method"""
    breaking_changes = []
    
    # Check for removed parameters
    base_params = {p.get('name'): p for p in base_method.get('parameters', [])}
    current_params = {p.get('name'): p for p in current_method.get('parameters', [])}
    
    removed_params = set(base_params.keys()) - set(current_params.keys())
    if removed_params:
        breaking_changes.extend([f"Removed parameter '{param}' from {method.upper()} {path}" for param in removed_params])
    
    # Check for parameters that became required
    for param_name in set(current_params.keys()) & set(base_params.keys()):
        base_param = base_params[param_name]
        current_param = current_params[param_name]
        
        base_required = base_param.get('required', False)
        current_required = current_param.get('required', False)
        
        if not base_required and current_required:
            breaking_changes.append(f"Parameter '{param_name}' became required in {method.upper()} {path}")
    
    # Check for removed response codes
    base_responses = set(base_method.get('responses', {}).keys())
    current_responses = set(current_method.get('responses', {}).keys())
    
    # Only consider removal of success responses (2xx) as breaking
    removed_success_responses = {code for code in (base_responses - current_responses) if code.startswith('2')}
    if removed_success_responses:
        breaking_changes.extend([f"Removed success response {code} from {method.upper()} {path}" for code in removed_success_responses])
    
    return breaking_changes

def check_schema_breaking_changes(schema_name: str, base_schema: Dict, current_schema: Dict) -> List[str]:
    """Check for breaking changes within a schema definition"""
    breaking_changes = []
    
    # Check for removed properties
    base_props = set(base_schema.get('properties', {}).keys())
    current_props = set(current_schema.get('properties', {}).keys())
    
    removed_props = base_props - current_props
    if removed_props:
        breaking_changes.extend([f"Removed property '{prop}' from schema {schema_name}" for prop in removed_props])
    
    # Check for properties that became required
    base_required = set(base_schema.get('required', []))
    current_required = set(current_schema.get('required', []))
    
    newly_required = current_required - base_required
    if newly_required:
        breaking_changes.extend([f"Property '{prop}' became required in schema {schema_name}" for prop in newly_required])
    
    # Check for type changes in existing properties
    base_properties = base_schema.get('properties', {})
    current_properties = current_schema.get('properties', {})
    
    for prop_name in base_props & current_props:
        base_prop = base_properties[prop_name]
        current_prop = current_properties[prop_name]
        
        base_type = base_prop.get('type')
        current_type = current_prop.get('type')
        
        if base_type and current_type and base_type != current_type:
            breaking_changes.append(f"Property '{prop_name}' type changed from {base_type} to {current_type} in schema {schema_name}")
    
    return breaking_changes

def main():
    """Main function to check for breaking changes"""
    if len(sys.argv) != 3:
        print("Usage: python check_breaking_changes.py <base_schema.json> <current_schema.json>")
        sys.exit(1)
    
    base_file = sys.argv[1]
    current_file = sys.argv[2]
    
    try:
        with open(base_file, 'r') as f:
            base_schema = json.load(f)
        with open(current_file, 'r') as f:
            current_schema = json.load(f)
    except Exception as e:
        print(f"Error loading schema files: {e}")
        sys.exit(1)
    
    has_breaking_changes = check_breaking_changes(base_schema, current_schema)
    
    if has_breaking_changes:
        print("true")  # For GitHub Actions output
        sys.exit(1)
    else:
        print("false")  # For GitHub Actions output
        print("✅ No breaking changes detected")
        sys.exit(0)

if __name__ == '__main__':
    main()