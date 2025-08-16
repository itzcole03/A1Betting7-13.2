#!/usr/bin/env python3
"""
OpenAPI Schema Diff Generator
Compares two OpenAPI schemas and generates a comprehensive diff report
"""

import json
import argparse
from typing import Dict, List, Set, Any, Tuple
from pathlib import Path
from dataclasses import dataclass
from enum import Enum

class ChangeType(Enum):
    ADDED = "added"
    REMOVED = "removed"
    MODIFIED = "modified"
    DEPRECATED = "deprecated"

@dataclass
class Change:
    type: ChangeType
    path: str
    description: str
    impact_level: str  # low, medium, high, breaking
    old_value: Any = None
    new_value: Any = None

class OpenAPIComparator:
    """Compares OpenAPI schemas and identifies changes"""
    
    def __init__(self):
        self.changes: List[Change] = []
        
    def compare_schemas(self, base_schema: Dict, current_schema: Dict) -> List[Change]:
        """Compare two OpenAPI schemas and return list of changes"""
        self.changes = []
        
        # Compare paths (endpoints)
        self._compare_paths(
            base_schema.get('paths', {}), 
            current_schema.get('paths', {})
        )
        
        # Compare components (models)
        self._compare_components(
            base_schema.get('components', {}), 
            current_schema.get('components', {})
        )
        
        # Compare info section
        self._compare_info(
            base_schema.get('info', {}), 
            current_schema.get('info', {})
        )
        
        # Compare security schemes
        self._compare_security(
            base_schema.get('components', {}).get('securitySchemes', {}),
            current_schema.get('components', {}).get('securitySchemes', {})
        )
        
        return self.changes
    
    def _compare_paths(self, base_paths: Dict, current_paths: Dict):
        """Compare API paths/endpoints"""
        base_paths_set = set(base_paths.keys())
        current_paths_set = set(current_paths.keys())
        
        # Added paths
        for path in current_paths_set - base_paths_set:
            methods = list(current_paths[path].keys())
            self.changes.append(Change(
                type=ChangeType.ADDED,
                path=f"paths.{path}",
                description=f"New endpoint: {path} ({', '.join(methods)})",
                impact_level="medium"
            ))
        
        # Removed paths
        for path in base_paths_set - current_paths_set:
            methods = list(base_paths[path].keys())
            self.changes.append(Change(
                type=ChangeType.REMOVED,
                path=f"paths.{path}",
                description=f"Removed endpoint: {path} ({', '.join(methods)})",
                impact_level="breaking"
            ))
        
        # Compare existing paths
        for path in base_paths_set & current_paths_set:
            self._compare_path_methods(path, base_paths[path], current_paths[path])
    
    def _compare_path_methods(self, path: str, base_methods: Dict, current_methods: Dict):
        """Compare HTTP methods for a specific path"""
        base_methods_set = set(base_methods.keys())
        current_methods_set = set(current_methods.keys())
        
        # Added methods
        for method in current_methods_set - base_methods_set:
            if method not in ['parameters', 'summary', 'description']:
                self.changes.append(Change(
                    type=ChangeType.ADDED,
                    path=f"paths.{path}.{method}",
                    description=f"New method {method.upper()} for {path}",
                    impact_level="medium"
                ))
        
        # Removed methods
        for method in base_methods_set - current_methods_set:
            if method not in ['parameters', 'summary', 'description']:
                self.changes.append(Change(
                    type=ChangeType.REMOVED,
                    path=f"paths.{path}.{method}",
                    description=f"Removed method {method.upper()} for {path}",
                    impact_level="breaking"
                ))
        
        # Compare existing methods
        for method in base_methods_set & current_methods_set:
            if method not in ['parameters', 'summary', 'description']:
                self._compare_operation(path, method, base_methods[method], current_methods[method])
    
    def _compare_operation(self, path: str, method: str, base_op: Dict, current_op: Dict):
        """Compare a specific operation (path + method)"""
        # Compare parameters
        base_params = {p.get('name'): p for p in base_op.get('parameters', [])}
        current_params = {p.get('name'): p for p in current_op.get('parameters', [])}
        
        for param_name in set(current_params.keys()) - set(base_params.keys()):
            param = current_params[param_name]
            required = param.get('required', False)
            impact = "breaking" if required else "medium"
            self.changes.append(Change(
                type=ChangeType.ADDED,
                path=f"paths.{path}.{method}.parameters.{param_name}",
                description=f"New {'required' if required else 'optional'} parameter: {param_name}",
                impact_level=impact
            ))
        
        for param_name in set(base_params.keys()) - set(current_params.keys()):
            self.changes.append(Change(
                type=ChangeType.REMOVED,
                path=f"paths.{path}.{method}.parameters.{param_name}",
                description=f"Removed parameter: {param_name}",
                impact_level="breaking"
            ))
        
        # Compare responses
        self._compare_responses(path, method, base_op.get('responses', {}), current_op.get('responses', {}))
        
        # Check for deprecated operations
        if current_op.get('deprecated', False) and not base_op.get('deprecated', False):
            self.changes.append(Change(
                type=ChangeType.DEPRECATED,
                path=f"paths.{path}.{method}",
                description=f"Operation {method.upper()} {path} is now deprecated",
                impact_level="high"
            ))
    
    def _compare_responses(self, path: str, method: str, base_responses: Dict, current_responses: Dict):
        """Compare response definitions"""
        base_codes = set(base_responses.keys())
        current_codes = set(current_responses.keys())
        
        # New response codes
        for code in current_codes - base_codes:
            self.changes.append(Change(
                type=ChangeType.ADDED,
                path=f"paths.{path}.{method}.responses.{code}",
                description=f"New response code {code}",
                impact_level="low"
            ))
        
        # Removed response codes
        for code in base_codes - current_codes:
            self.changes.append(Change(
                type=ChangeType.REMOVED,
                path=f"paths.{path}.{method}.responses.{code}",
                description=f"Removed response code {code}",
                impact_level="medium"
            ))
    
    def _compare_components(self, base_components: Dict, current_components: Dict):
        """Compare component definitions (schemas, etc.)"""
        # Compare schemas
        base_schemas = base_components.get('schemas', {})
        current_schemas = current_components.get('schemas', {})
        
        base_schema_names = set(base_schemas.keys())
        current_schema_names = set(current_schemas.keys())
        
        # New schemas
        for schema_name in current_schema_names - base_schema_names:
            self.changes.append(Change(
                type=ChangeType.ADDED,
                path=f"components.schemas.{schema_name}",
                description=f"New schema: {schema_name}",
                impact_level="low"
            ))
        
        # Removed schemas
        for schema_name in base_schema_names - current_schema_names:
            self.changes.append(Change(
                type=ChangeType.REMOVED,
                path=f"components.schemas.{schema_name}",
                description=f"Removed schema: {schema_name}",
                impact_level="breaking"
            ))
        
        # Compare existing schemas
        for schema_name in base_schema_names & current_schema_names:
            self._compare_schema_properties(schema_name, base_schemas[schema_name], current_schemas[schema_name])
    
    def _compare_schema_properties(self, schema_name: str, base_schema: Dict, current_schema: Dict):
        """Compare properties of a schema"""
        base_props = base_schema.get('properties', {})
        current_props = current_schema.get('properties', {})
        
        base_required = set(base_schema.get('required', []))
        current_required = set(current_schema.get('required', []))
        
        # New properties
        for prop_name in set(current_props.keys()) - set(base_props.keys()):
            is_required = prop_name in current_required
            impact = "breaking" if is_required else "low"
            self.changes.append(Change(
                type=ChangeType.ADDED,
                path=f"components.schemas.{schema_name}.properties.{prop_name}",
                description=f"New {'required' if is_required else 'optional'} property: {prop_name}",
                impact_level=impact
            ))
        
        # Removed properties
        for prop_name in set(base_props.keys()) - set(current_props.keys()):
            self.changes.append(Change(
                type=ChangeType.REMOVED,
                path=f"components.schemas.{schema_name}.properties.{prop_name}",
                description=f"Removed property: {prop_name}",
                impact_level="breaking"
            ))
        
        # Changed required status
        for prop_name in current_required - base_required:
            self.changes.append(Change(
                type=ChangeType.MODIFIED,
                path=f"components.schemas.{schema_name}.required.{prop_name}",
                description=f"Property {prop_name} is now required",
                impact_level="breaking"
            ))
        
        for prop_name in base_required - current_required:
            self.changes.append(Change(
                type=ChangeType.MODIFIED,
                path=f"components.schemas.{schema_name}.required.{prop_name}",
                description=f"Property {prop_name} is no longer required",
                impact_level="low"
            ))
    
    def _compare_info(self, base_info: Dict, current_info: Dict):
        """Compare API info section"""
        if base_info.get('version') != current_info.get('version'):
            self.changes.append(Change(
                type=ChangeType.MODIFIED,
                path="info.version",
                description=f"Version changed from {base_info.get('version')} to {current_info.get('version')}",
                impact_level="low",
                old_value=base_info.get('version'),
                new_value=current_info.get('version')
            ))
    
    def _compare_security(self, base_security: Dict, current_security: Dict):
        """Compare security schemes"""
        base_schemes = set(base_security.keys())
        current_schemes = set(current_security.keys())
        
        for scheme in current_schemes - base_schemes:
            self.changes.append(Change(
                type=ChangeType.ADDED,
                path=f"components.securitySchemes.{scheme}",
                description=f"New security scheme: {scheme}",
                impact_level="medium"
            ))
        
        for scheme in base_schemes - current_schemes:
            self.changes.append(Change(
                type=ChangeType.REMOVED,
                path=f"components.securitySchemes.{scheme}",
                description=f"Removed security scheme: {scheme}",
                impact_level="breaking"
            ))

def generate_markdown_report(changes: List[Change]) -> str:
    """Generate a markdown report from changes"""
    if not changes:
        return "✅ **No changes detected in the OpenAPI schema.**"
    
    # Group changes by impact level
    breaking_changes = [c for c in changes if c.impact_level == "breaking"]
    high_impact = [c for c in changes if c.impact_level == "high"]
    medium_impact = [c for c in changes if c.impact_level == "medium"]
    low_impact = [c for c in changes if c.impact_level == "low"]
    
    report = []
    
    # Summary
    report.append("## 📊 Summary")
    report.append("")
    report.append(f"- **Total changes**: {len(changes)}")
    report.append(f"- **Breaking changes**: {len(breaking_changes)}")
    report.append(f"- **High impact**: {len(high_impact)}")
    report.append(f"- **Medium impact**: {len(medium_impact)}")
    report.append(f"- **Low impact**: {len(low_impact)}")
    report.append("")
    
    # Breaking changes (most important)
    if breaking_changes:
        report.append("## 🚨 Breaking Changes")
        report.append("")
        for change in breaking_changes:
            icon = _get_change_icon(change.type)
            report.append(f"- {icon} **{change.description}**")
            report.append(f"  - Path: `{change.path}`")
            if change.old_value and change.new_value:
                report.append(f"  - Changed from: `{change.old_value}` to `{change.new_value}`")
            report.append("")
    
    # High impact changes
    if high_impact:
        report.append("## ⚠️ High Impact Changes")
        report.append("")
        for change in high_impact:
            icon = _get_change_icon(change.type)
            report.append(f"- {icon} {change.description}")
            report.append(f"  - Path: `{change.path}`")
            report.append("")
    
    # Medium impact changes
    if medium_impact:
        report.append("## 📋 Medium Impact Changes")
        report.append("")
        for change in medium_impact:
            icon = _get_change_icon(change.type)
            report.append(f"- {icon} {change.description}")
            report.append("")
    
    # Low impact changes (collapsible)
    if low_impact:
        report.append("<details>")
        report.append("<summary>📝 Low Impact Changes (click to expand)</summary>")
        report.append("")
        for change in low_impact:
            icon = _get_change_icon(change.type)
            report.append(f"- {icon} {change.description}")
        report.append("")
        report.append("</details>")
    
    return "\n".join(report)

def _get_change_icon(change_type: ChangeType) -> str:
    """Get emoji icon for change type"""
    icons = {
        ChangeType.ADDED: "✅",
        ChangeType.REMOVED: "❌", 
        ChangeType.MODIFIED: "🔄",
        ChangeType.DEPRECATED: "⚠️"
    }
    return icons.get(change_type, "📝")

def main():
    parser = argparse.ArgumentParser(description='Generate OpenAPI schema diff report')
    parser.add_argument('--base', required=True, help='Base schema JSON file')
    parser.add_argument('--current', required=True, help='Current schema JSON file')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--format', choices=['markdown', 'json'], default='markdown', help='Output format')
    
    args = parser.parse_args()
    
    # Load schemas
    try:
        with open(args.base, 'r') as f:
            base_schema = json.load(f)
        with open(args.current, 'r') as f:
            current_schema = json.load(f)
    except Exception as e:
        print(f"Error loading schema files: {e}")
        return 1
    
    # Compare schemas
    comparator = OpenAPIComparator()
    changes = comparator.compare_schemas(base_schema, current_schema)
    
    # Generate report
    if args.format == 'markdown':
        report = generate_markdown_report(changes)
    else:  # json
        report = json.dumps([{
            'type': change.type.value,
            'path': change.path,
            'description': change.description,
            'impact_level': change.impact_level,
            'old_value': change.old_value,
            'new_value': change.new_value
        } for change in changes], indent=2)
    
    # Write report
    with open(args.output, 'w') as f:
        f.write(report)
    
    print(f"Generated diff report with {len(changes)} changes")
    return 0

if __name__ == '__main__':
    exit(main())