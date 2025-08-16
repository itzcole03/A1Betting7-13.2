#!/usr/bin/env python3
"""
Security Impact Analysis for OpenAPI Schema Changes
Analyzes security implications of API changes between schema versions
"""

import json
import argparse
from typing import Dict, List, Any, Set
from dataclasses import dataclass
from enum import Enum

class SecurityImpactLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class SecurityImpact:
    level: SecurityImpactLevel
    category: str
    description: str
    path: str
    recommendation: str

class SecurityAnalyzer:
    """Analyzes security impact of OpenAPI schema changes"""
    
    def __init__(self):
        self.impacts: List[SecurityImpact] = []
    
    def analyze_security_impact(self, base_schema: Dict, current_schema: Dict) -> List[SecurityImpact]:
        """Analyze security implications of schema changes"""
        self.impacts = []
        
        # Analyze authentication changes
        self._analyze_auth_changes(
            base_schema.get('components', {}).get('securitySchemes', {}),
            current_schema.get('components', {}).get('securitySchemes', {})
        )
        
        # Analyze endpoint security requirements
        self._analyze_endpoint_security(
            base_schema.get('paths', {}),
            current_schema.get('paths', {})
        )
        
        # Analyze parameter security
        self._analyze_parameter_security(
            base_schema.get('paths', {}),
            current_schema.get('paths', {})
        )
        
        # Analyze response security
        self._analyze_response_security(
            base_schema.get('paths', {}),
            current_schema.get('paths', {})
        )
        
        # Analyze schema security implications
        self._analyze_schema_security(
            base_schema.get('components', {}).get('schemas', {}),
            current_schema.get('components', {}).get('schemas', {})
        )
        
        return self.impacts
    
    def _analyze_auth_changes(self, base_security: Dict, current_security: Dict):
        """Analyze authentication and authorization changes"""
        base_schemes = set(base_security.keys())
        current_schemes = set(current_security.keys())
        
        # Removed security schemes
        removed_schemes = base_schemes - current_schemes
        for scheme in removed_schemes:
            self.impacts.append(SecurityImpact(
                level=SecurityImpactLevel.CRITICAL,
                category="Authentication",
                description=f"Security scheme '{scheme}' was removed",
                path=f"components.securitySchemes.{scheme}",
                recommendation="Ensure all endpoints using this scheme have alternative authentication methods"
            ))
        
        # New security schemes
        added_schemes = current_schemes - base_schemes
        for scheme in added_schemes:
            scheme_info = current_security[scheme]
            scheme_type = scheme_info.get('type', 'unknown')
            
            self.impacts.append(SecurityImpact(
                level=SecurityImpactLevel.MEDIUM,
                category="Authentication",
                description=f"New security scheme '{scheme}' of type '{scheme_type}' was added",
                path=f"components.securitySchemes.{scheme}",
                recommendation="Review the security configuration and ensure proper implementation"
            ))
        
        # Modified security schemes
        for scheme in base_schemes & current_schemes:
            base_scheme = base_security[scheme]
            current_scheme = current_security[scheme]
            
            if base_scheme.get('type') != current_scheme.get('type'):
                self.impacts.append(SecurityImpact(
                    level=SecurityImpactLevel.HIGH,
                    category="Authentication",
                    description=f"Security scheme '{scheme}' type changed from {base_scheme.get('type')} to {current_scheme.get('type')}",
                    path=f"components.securitySchemes.{scheme}",
                    recommendation="Verify that the new authentication type maintains security requirements"
                ))
    
    def _analyze_endpoint_security(self, base_paths: Dict, current_paths: Dict):
        """Analyze security requirements for endpoints"""
        for path in base_paths:
            if path not in current_paths:
                continue
            
            for method in base_paths[path]:
                if method not in current_paths[path] or method not in ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']:
                    continue
                
                base_method = base_paths[path][method]
                current_method = current_paths[path][method]
                
                base_security = base_method.get('security', [])
                current_security = current_method.get('security', [])
                
                # Check if security requirements were removed
                if base_security and not current_security:
                    self.impacts.append(SecurityImpact(
                        level=SecurityImpactLevel.CRITICAL,
                        category="Authorization",
                        description=f"Security requirements removed from {method.upper()} {path}",
                        path=f"paths.{path}.{method}.security",
                        recommendation="Ensure the endpoint is properly protected by global security or middleware"
                    ))
                
                # Check if security was added to previously open endpoint
                elif not base_security and current_security:
                    self.impacts.append(SecurityImpact(
                        level=SecurityImpactLevel.MEDIUM,
                        category="Authorization",
                        description=f"Security requirements added to {method.upper()} {path}",
                        path=f"paths.{path}.{method}.security",
                        recommendation="Ensure clients are updated to handle authentication requirements"
                    ))
        
        # Check new endpoints for security
        new_paths = set(current_paths.keys()) - set(base_paths.keys())
        for path in new_paths:
            for method in current_paths[path]:
                if method not in ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']:
                    continue
                
                method_info = current_paths[path][method]
                security = method_info.get('security', [])
                
                if not security:
                    # Check if this endpoint handles sensitive operations
                    if self._is_sensitive_endpoint(path, method, method_info):
                        self.impacts.append(SecurityImpact(
                            level=SecurityImpactLevel.HIGH,
                            category="Authorization",
                            description=f"New endpoint {method.upper()} {path} appears to handle sensitive data but has no security requirements",
                            path=f"paths.{path}.{method}",
                            recommendation="Review if this endpoint should require authentication"
                        ))
    
    def _analyze_parameter_security(self, base_paths: Dict, current_paths: Dict):
        """Analyze security implications of parameter changes"""
        for path in current_paths:
            if path not in base_paths:
                continue
            
            for method in current_paths[path]:
                if method not in base_paths[path] or method not in ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']:
                    continue
                
                base_params = {p.get('name'): p for p in base_paths[path][method].get('parameters', [])}
                current_params = {p.get('name'): p for p in current_paths[path][method].get('parameters', [])}
                
                # Check for potentially dangerous new parameters
                new_params = set(current_params.keys()) - set(base_params.keys())
                for param_name in new_params:
                    param = current_params[param_name]
                    if self._is_sensitive_parameter(param_name, param):
                        self.impacts.append(SecurityImpact(
                            level=SecurityImpactLevel.MEDIUM,
                            category="Input Validation",
                            description=f"New potentially sensitive parameter '{param_name}' in {method.upper()} {path}",
                            path=f"paths.{path}.{method}.parameters.{param_name}",
                            recommendation="Ensure proper validation and sanitization is implemented"
                        ))
    
    def _analyze_response_security(self, base_paths: Dict, current_paths: Dict):
        """Analyze security implications of response changes"""
        for path in current_paths:
            if path not in base_paths:
                continue
            
            for method in current_paths[path]:
                if method not in base_paths[path] or method not in ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']:
                    continue
                
                base_responses = base_paths[path][method].get('responses', {})
                current_responses = current_paths[path][method].get('responses', {})
                
                # Check for new response codes that might leak information
                new_codes = set(current_responses.keys()) - set(base_responses.keys())
                for code in new_codes:
                    if code.startswith('4') or code.startswith('5'):
                        response_info = current_responses[code]
                        if self._response_might_leak_info(response_info):
                            self.impacts.append(SecurityImpact(
                                level=SecurityImpactLevel.MEDIUM,
                                category="Information Disclosure",
                                description=f"New error response {code} in {method.upper()} {path} might leak sensitive information",
                                path=f"paths.{path}.{method}.responses.{code}",
                                recommendation="Review response content to ensure no sensitive data is exposed"
                            ))
    
    def _analyze_schema_security(self, base_schemas: Dict, current_schemas: Dict):
        """Analyze security implications of schema changes"""
        for schema_name in current_schemas:
            if schema_name not in base_schemas:
                # New schema - check if it contains sensitive data
                schema = current_schemas[schema_name]
                if self._schema_contains_sensitive_data(schema_name, schema):
                    self.impacts.append(SecurityImpact(
                        level=SecurityImpactLevel.MEDIUM,
                        category="Data Protection",
                        description=f"New schema '{schema_name}' appears to contain sensitive data",
                        path=f"components.schemas.{schema_name}",
                        recommendation="Ensure proper access controls and data handling procedures are in place"
                    ))
                continue
            
            # Existing schema changes
            base_schema = base_schemas[schema_name]
            current_schema = current_schemas[schema_name]
            
            base_props = base_schema.get('properties', {})
            current_props = current_schema.get('properties', {})
            
            # New potentially sensitive properties
            new_props = set(current_props.keys()) - set(base_props.keys())
            for prop_name in new_props:
                if self._is_sensitive_property(prop_name, current_props[prop_name]):
                    self.impacts.append(SecurityImpact(
                        level=SecurityImpactLevel.MEDIUM,
                        category="Data Protection",
                        description=f"New potentially sensitive property '{prop_name}' in schema {schema_name}",
                        path=f"components.schemas.{schema_name}.properties.{prop_name}",
                        recommendation="Ensure proper data protection measures are implemented"
                    ))
    
    def _is_sensitive_endpoint(self, path: str, method: str, method_info: Dict) -> bool:
        """Check if an endpoint appears to handle sensitive operations"""
        sensitive_patterns = [
            'password', 'token', 'auth', 'login', 'admin', 'delete', 'payment',
            'credit', 'personal', 'private', 'confidential', 'secret'
        ]
        
        path_lower = path.lower()
        method_lower = method.lower()
        description = method_info.get('description', '').lower()
        summary = method_info.get('summary', '').lower()
        
        return any(pattern in path_lower or pattern in description or pattern in summary 
                  for pattern in sensitive_patterns) or method_lower in ['post', 'put', 'delete']
    
    def _is_sensitive_parameter(self, param_name: str, param_info: Dict) -> bool:
        """Check if a parameter appears to be security-sensitive"""
        sensitive_names = [
            'password', 'token', 'key', 'secret', 'auth', 'admin', 'id', 'user_id',
            'account', 'credit_card', 'ssn', 'email', 'phone'
        ]
        
        param_name_lower = param_name.lower()
        description = param_info.get('description', '').lower()
        
        return any(sensitive in param_name_lower or sensitive in description 
                  for sensitive in sensitive_names)
    
    def _is_sensitive_property(self, prop_name: str, prop_info: Dict) -> bool:
        """Check if a schema property appears to be security-sensitive"""
        sensitive_names = [
            'password', 'token', 'key', 'secret', 'auth', 'email', 'phone', 'ssn',
            'credit_card', 'account_number', 'personal_info', 'private'
        ]
        
        prop_name_lower = prop_name.lower()
        description = prop_info.get('description', '').lower()
        
        return any(sensitive in prop_name_lower or sensitive in description 
                  for sensitive in sensitive_names)
    
    def _schema_contains_sensitive_data(self, schema_name: str, schema: Dict) -> bool:
        """Check if a schema appears to contain sensitive data"""
        sensitive_schema_names = [
            'user', 'account', 'profile', 'payment', 'credit', 'personal', 'private',
            'auth', 'token', 'credentials', 'admin'
        ]
        
        schema_name_lower = schema_name.lower()
        if any(sensitive in schema_name_lower for sensitive in sensitive_schema_names):
            return True
        
        # Check properties
        properties = schema.get('properties', {})
        return any(self._is_sensitive_property(prop_name, prop_info) 
                  for prop_name, prop_info in properties.items())
    
    def _response_might_leak_info(self, response_info: Dict) -> bool:
        """Check if a response might leak sensitive information"""
        description = response_info.get('description', '').lower()
        
        # Look for detailed error descriptions that might leak internal info
        leak_indicators = [
            'internal', 'database', 'file', 'directory', 'server', 'system',
            'debug', 'trace', 'stack', 'exception', 'sql', 'query'
        ]
        
        return any(indicator in description for indicator in leak_indicators)

def generate_security_report(impacts: List[SecurityImpact]) -> str:
    """Generate a markdown security impact report"""
    if not impacts:
        return ""
    
    # Group by severity level
    critical_impacts = [i for i in impacts if i.level == SecurityImpactLevel.CRITICAL]
    high_impacts = [i for i in impacts if i.level == SecurityImpactLevel.HIGH]
    medium_impacts = [i for i in impacts if i.level == SecurityImpactLevel.MEDIUM]
    low_impacts = [i for i in impacts if i.level == SecurityImpactLevel.LOW]
    
    report = []
    
    if critical_impacts:
        report.append("## 🚨 Critical Security Issues")
        report.append("")
        for impact in critical_impacts:
            report.append(f"**{impact.category}**: {impact.description}")
            report.append(f"- **Path**: `{impact.path}`")
            report.append(f"- **Recommendation**: {impact.recommendation}")
            report.append("")
    
    if high_impacts:
        report.append("## ⚠️ High Risk Security Issues")
        report.append("")
        for impact in high_impacts:
            report.append(f"**{impact.category}**: {impact.description}")
            report.append(f"- **Recommendation**: {impact.recommendation}")
            report.append("")
    
    if medium_impacts:
        report.append("## 🔍 Medium Risk Security Considerations")
        report.append("")
        for impact in medium_impacts:
            report.append(f"- **{impact.category}**: {impact.description}")
            report.append(f"  - Recommendation: {impact.recommendation}")
        report.append("")
    
    if low_impacts:
        report.append("<details>")
        report.append("<summary>📋 Low Risk Items</summary>")
        report.append("")
        for impact in low_impacts:
            report.append(f"- {impact.description}")
        report.append("</details>")
    
    return "\n".join(report)

def main():
    parser = argparse.ArgumentParser(description='Analyze security impact of OpenAPI schema changes')
    parser.add_argument('--base', required=True, help='Base schema JSON file')
    parser.add_argument('--current', required=True, help='Current schema JSON file')
    parser.add_argument('--output', required=True, help='Output markdown file')
    
    args = parser.parse_args()
    
    try:
        with open(args.base, 'r') as f:
            base_schema = json.load(f)
        with open(args.current, 'r') as f:
            current_schema = json.load(f)
    except Exception as e:
        print(f"Error loading schema files: {e}")
        return 1
    
    analyzer = SecurityAnalyzer()
    impacts = analyzer.analyze_security_impact(base_schema, current_schema)
    
    report = generate_security_report(impacts)
    
    with open(args.output, 'w') as f:
        f.write(report)
    
    print(f"Generated security analysis with {len(impacts)} findings")
    return 0

if __name__ == '__main__':
    exit(main())