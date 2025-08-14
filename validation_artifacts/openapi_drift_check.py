"""
OpenAPI Schema Drift Check for Phase 1 Error & Security Hardening

This script validates that the OpenAPI schema reflects the implemented
error taxonomy, rate limiting, and structured response formats.

Usage:
    python validation_artifacts/openapi_drift_check.py
"""

import requests
import json
import sys
from typing import Dict, Any, List, Set
from pathlib import Path


class OpenAPIDriftChecker:
    """
    Validates OpenAPI schema compliance with Phase 1 implementations
    """
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.schema = None
        self.validation_errors = []
        self.validation_warnings = []
        
    def fetch_openapi_schema(self) -> bool:
        """
        Fetch OpenAPI schema from /docs/openapi.json or /openapi.json
        
        Returns:
            True if schema fetched successfully
        """
        endpoints = ["/docs/openapi.json", "/openapi.json"]
        
        for endpoint in endpoints:
            try:
                print(f"Attempting to fetch schema from: {self.base_url}{endpoint}")
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    self.schema = response.json()
                    print(f"✓ Successfully fetched OpenAPI schema from {endpoint}")
                    return True
                else:
                    print(f"  Response: {response.status_code}")
                    
            except requests.RequestException as e:
                print(f"  Error: {e}")
        
        self.validation_errors.append("Unable to fetch OpenAPI schema from any endpoint")
        return False
        
    def validate_error_response_schemas(self):
        """
        Validate that error response schemas include proper error taxonomy structure
        """
        print("\n=== Validating Error Response Schemas ===")
        
        if not self.schema or 'components' not in self.schema:
            self.validation_errors.append("No components section found in OpenAPI schema")
            return
            
        components = self.schema['components']
        schemas = components.get('schemas', {})
        
        # Check for error response schema
        error_schemas = [name for name in schemas.keys() if 'error' in name.lower()]
        
        if not error_schemas:
            self.validation_errors.append("No error response schemas found in OpenAPI spec")
            return
            
        print(f"Found error schemas: {error_schemas}")
        
        # Expected error taxonomy codes from our implementation
        expected_error_codes = [
            "E1000_VALIDATION", "E1100_AUTH", "E1200_RATE_LIMIT", 
            "E1300_PAYLOAD_TOO_LARGE", "E1400_UNSUPPORTED_MEDIA_TYPE",
            "E1404_NOT_FOUND", "E4040_NOT_FOUND", 
            "E2000_DEPENDENCY", "E2100_DATABASE", "E2200_EXTERNAL_API",
            "E2300_CACHE", "E2400_TIMEOUT",
            "E5000_INTERNAL", "E5100_CONFIGURATION", "E5200_RESOURCE_EXHAUSTED"
        ]
        
        # Validate error response structure
        for schema_name in error_schemas:
            schema_def = schemas[schema_name]
            self.validate_error_schema_structure(schema_name, schema_def)
            
        print(f"✓ Validated {len(error_schemas)} error schema(s)")
        
    def validate_error_schema_structure(self, schema_name: str, schema_def: Dict[str, Any]):
        """
        Validate individual error schema structure
        """
        required_fields = ['success', 'error', 'meta']
        error_required_fields = ['code', 'message']
        meta_required_fields = ['request_id', 'timestamp']
        
        # Check if it's a proper object schema
        if schema_def.get('type') != 'object':
            self.validation_warnings.append(f"Schema {schema_name} is not an object type")
            return
            
        properties = schema_def.get('properties', {})
        
        # Validate top-level fields
        for field in required_fields:
            if field not in properties:
                self.validation_errors.append(
                    f"Schema {schema_name} missing required field: {field}"
                )
        
        # Validate error object structure
        if 'error' in properties:
            error_props = properties['error'].get('properties', {})
            for field in error_required_fields:
                if field not in error_props:
                    self.validation_errors.append(
                        f"Schema {schema_name}.error missing field: {field}"
                    )
                    
        # Validate meta object structure  
        if 'meta' in properties:
            meta_props = properties['meta'].get('properties', {})
            for field in meta_required_fields:
                if field not in meta_props:
                    self.validation_errors.append(
                        f"Schema {schema_name}.meta missing field: {field}"
                    )
                    
    def validate_rate_limiting_headers(self):
        """
        Validate that rate limiting headers are documented in responses
        """
        print("\n=== Validating Rate Limiting Headers ===")
        
        if 'paths' not in self.schema:
            self.validation_errors.append("No paths section found in OpenAPI schema")
            return
            
        paths = self.schema['paths']
        rate_limit_headers = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset']
        headers_found = False
        
        # Check a few key endpoints for rate limiting headers
        sample_endpoints = ['/api/health', '/health', '/api/games', '/games']
        
        for endpoint_pattern in sample_endpoints:
            for path, methods in paths.items():
                if endpoint_pattern in path:
                    for method, operation in methods.items():
                        if isinstance(operation, dict) and 'responses' in operation:
                            responses = operation['responses']
                            
                            for status_code, response_def in responses.items():
                                if 'headers' in response_def:
                                    headers = response_def['headers']
                                    
                                    for rl_header in rate_limit_headers:
                                        if rl_header in headers or rl_header.upper() in headers:
                                            headers_found = True
                                            print(f"✓ Found rate limiting header {rl_header} in {path} {method} {status_code}")
                                            
        if not headers_found:
            self.validation_warnings.append(
                "No rate limiting headers found in OpenAPI responses. "
                "Consider documenting X-RateLimit-* headers."
            )
        else:
            print("✓ Rate limiting headers documented")
            
    def validate_error_status_codes(self):
        """
        Validate that appropriate HTTP status codes are documented
        """
        print("\n=== Validating Error Status Codes ===")
        
        if 'paths' not in self.schema:
            return
            
        expected_status_codes = ['400', '401', '403', '404', '422', '429', '500', '503']
        found_status_codes = set()
        
        for path, methods in self.schema['paths'].items():
            for method, operation in methods.items():
                if isinstance(operation, dict) and 'responses' in operation:
                    responses = operation['responses']
                    
                    for status_code in responses.keys():
                        if status_code in expected_status_codes:
                            found_status_codes.add(status_code)
                            
        missing_codes = set(expected_status_codes) - found_status_codes
        
        if missing_codes:
            self.validation_warnings.append(
                f"Missing error status codes in OpenAPI spec: {sorted(missing_codes)}"
            )
        
        print(f"✓ Found error status codes: {sorted(found_status_codes)}")
        if missing_codes:
            print(f"⚠ Missing status codes: {sorted(missing_codes)}")
            
    def validate_response_consistency(self):
        """
        Validate that response schemas are consistently structured
        """
        print("\n=== Validating Response Consistency ===")
        
        if 'components' not in self.schema or 'schemas' not in self.schema['components']:
            return
            
        schemas = self.schema['components']['schemas']
        
        # Look for response schemas
        success_schemas = []
        error_schemas = []
        
        for schema_name, schema_def in schemas.items():
            if schema_def.get('type') == 'object' and 'properties' in schema_def:
                properties = schema_def['properties']
                
                if 'success' in properties:
                    if properties.get('success', {}).get('default') is True:
                        success_schemas.append(schema_name)
                    elif properties.get('success', {}).get('default') is False:
                        error_schemas.append(schema_name)
                        
        print(f"Found success schemas: {success_schemas}")
        print(f"Found error schemas: {error_schemas}")
        
        # Validate consistency
        consistent_structure = True
        
        for schema_name in success_schemas + error_schemas:
            schema_def = schemas[schema_name]
            properties = schema_def.get('properties', {})
            
            required_base_fields = ['success', 'meta']
            for field in required_base_fields:
                if field not in properties:
                    self.validation_errors.append(
                        f"Inconsistent structure in {schema_name}: missing {field}"
                    )
                    consistent_structure = False
                    
        if consistent_structure:
            print("✓ Response schemas have consistent structure")
        else:
            print("✗ Response schemas have inconsistent structure")
            
    def validate_security_schemes(self):
        """
        Validate security schemes documentation
        """
        print("\n=== Validating Security Schemes ===")
        
        if 'components' not in self.schema:
            self.validation_warnings.append("No security schemes documented")
            return
            
        components = self.schema['components']
        security_schemes = components.get('securitySchemes', {})
        
        if not security_schemes:
            self.validation_warnings.append(
                "No security schemes documented. Consider documenting API key/token requirements."
            )
        else:
            print(f"✓ Found security schemes: {list(security_schemes.keys())}")
            
        # Check for rate limiting documentation
        rate_limit_documented = False
        for path, methods in self.schema.get('paths', {}).items():
            for method, operation in methods.items():
                if isinstance(operation, dict):
                    description = operation.get('description', '').lower()
                    summary = operation.get('summary', '').lower()
                    
                    if 'rate limit' in description or 'rate limit' in summary:
                        rate_limit_documented = True
                        break
                        
        if rate_limit_documented:
            print("✓ Rate limiting documented in operation descriptions")
        else:
            self.validation_warnings.append(
                "Rate limiting not documented in operation descriptions"
            )
            
    def check_schema_examples(self):
        """
        Check if schemas include examples for better API documentation
        """
        print("\n=== Checking Schema Examples ===")
        
        if 'components' not in self.schema or 'schemas' not in self.schema['components']:
            return
            
        schemas = self.schema['components']['schemas']
        schemas_with_examples = 0
        total_schemas = len(schemas)
        
        for schema_name, schema_def in schemas.items():
            if 'example' in schema_def or 'examples' in schema_def:
                schemas_with_examples += 1
                
        example_coverage = (schemas_with_examples / total_schemas * 100) if total_schemas > 0 else 0
        
        print(f"Schemas with examples: {schemas_with_examples}/{total_schemas} ({example_coverage:.1f}%)")
        
        if example_coverage < 50:
            self.validation_warnings.append(
                f"Low example coverage ({example_coverage:.1f}%). "
                "Consider adding examples to response schemas."
            )
        else:
            print("✓ Good example coverage in schemas")
            
    def generate_drift_report(self) -> str:
        """
        Generate comprehensive drift analysis report
        """
        report_lines = []
        report_lines.append("# OpenAPI Schema Drift Check Report")
        report_lines.append("=" * 50)
        report_lines.append("")
        
        # Summary
        report_lines.append("## Summary")
        report_lines.append(f"- Validation Errors: {len(self.validation_errors)}")
        report_lines.append(f"- Validation Warnings: {len(self.validation_warnings)}")
        
        if self.schema:
            paths_count = len(self.schema.get('paths', {}))
            schemas_count = len(self.schema.get('components', {}).get('schemas', {}))
            report_lines.append(f"- API Endpoints: {paths_count}")
            report_lines.append(f"- Schema Components: {schemas_count}")
            
        report_lines.append("")
        
        # Errors
        if self.validation_errors:
            report_lines.append("## Validation Errors")
            for i, error in enumerate(self.validation_errors, 1):
                report_lines.append(f"{i}. {error}")
            report_lines.append("")
            
        # Warnings
        if self.validation_warnings:
            report_lines.append("## Validation Warnings")
            for i, warning in enumerate(self.validation_warnings, 1):
                report_lines.append(f"{i}. {warning}")
            report_lines.append("")
            
        # Recommendations
        report_lines.append("## Recommendations")
        
        if self.validation_errors:
            report_lines.append("### Critical Issues (Must Fix)")
            report_lines.append("- Address validation errors to ensure API compliance")
            report_lines.append("- Update OpenAPI schema to reflect implemented error taxonomy")
            report_lines.append("- Document structured response formats")
            
        if self.validation_warnings:
            report_lines.append("### Improvements (Should Consider)")
            report_lines.append("- Add rate limiting headers documentation")
            report_lines.append("- Include schema examples for better developer experience")
            report_lines.append("- Document security schemes and authentication")
            
        if not self.validation_errors and not self.validation_warnings:
            report_lines.append("✓ No issues found. OpenAPI schema is compliant with Phase 1 implementations.")
            
        return "\n".join(report_lines)
        
    def run_full_validation(self) -> bool:
        """
        Run complete OpenAPI drift validation
        
        Returns:
            True if no critical errors found
        """
        print("Phase 1 OpenAPI Schema Drift Check")
        print("=" * 40)
        
        # Fetch schema
        if not self.fetch_openapi_schema():
            print("\n✗ Cannot proceed with validation - schema not accessible")
            return False
            
        # Run validations
        self.validate_error_response_schemas()
        self.validate_rate_limiting_headers() 
        self.validate_error_status_codes()
        self.validate_response_consistency()
        self.validate_security_schemes()
        self.check_schema_examples()
        
        # Generate report
        report = self.generate_drift_report()
        print(f"\n{report}")
        
        # Save report
        report_file = Path("validation_artifacts/openapi_drift_report.md")
        report_file.parent.mkdir(exist_ok=True)
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
            
        print(f"\n📄 Drift report saved to: {report_file}")
        
        # Return success status
        has_critical_errors = len(self.validation_errors) > 0
        
        if has_critical_errors:
            print(f"\n✗ Validation failed with {len(self.validation_errors)} error(s)")
            return False
        else:
            print(f"\n✓ Validation passed with {len(self.validation_warnings)} warning(s)")
            return True


def main():
    """
    Run OpenAPI drift check with command line options
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="OpenAPI Schema Drift Check")
    parser.add_argument(
        "--base-url", 
        default="http://localhost:8000",
        help="Base URL for the API server"
    )
    parser.add_argument(
        "--save-schema",
        action="store_true",
        help="Save fetched schema to file"
    )
    
    args = parser.parse_args()
    
    # Initialize checker
    checker = OpenAPIDriftChecker(base_url=args.base_url)
    
    # Run validation
    success = checker.run_full_validation()
    
    # Save schema if requested
    if args.save_schema and checker.schema:
        schema_file = Path("validation_artifacts/openapi_schema.json")
        with open(schema_file, 'w', encoding='utf-8') as f:
            json.dump(checker.schema, f, indent=2)
        print(f"\n📄 Schema saved to: {schema_file}")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
