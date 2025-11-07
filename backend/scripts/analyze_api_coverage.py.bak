#!/usr/bin/env python3
"""
API Coverage Analysis Script

Analyzes all backend/routes/ files to identify endpoints for comprehensive test coverage.
Maps out sync/async patterns and identifies test gaps.
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Set

class APIEndpointAnalyzer:
    def __init__(self, routes_dir: str = "backend/routes"):
        self.routes_dir = Path(routes_dir)
        self.endpoints: List[Dict[str, Any]] = []
        
    def scan_endpoints(self) -> List[Dict[str, Any]]:
        """Scan all route files for endpoint definitions"""
        
        # Pattern to match FastAPI route decorators
        route_pattern = r'@(?:router|app)\.(get|post|put|delete|patch|head|options|trace)\s*\(\s*["\']([^"\']+)["\']'
        
        for py_file in self.routes_dir.glob("*.py"):
            if py_file.name.startswith("__"):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')
                    
                for i, line in enumerate(lines):
                    match = re.search(route_pattern, line.strip())
                    if match:
                        method = match.group(1).upper()
                        path = match.group(2)
                        
                        # Look for the function definition
                        func_name = None
                        is_async = False
                        has_response_model = False
                        response_model_type = None
                        
                        # Check current line for response_model
                        if "response_model" in line:
                            has_response_model = True
                            # Extract response model type
                            model_match = re.search(r'response_model\s*=\s*([^,)]+)', line)
                            if model_match:
                                response_model_type = model_match.group(1).strip()
                        
                        # Look ahead for function definition
                        for j in range(i+1, min(i+10, len(lines))):
                            func_match = re.search(r'(?:async\s+)?def\s+(\w+)', lines[j])
                            if func_match:
                                func_name = func_match.group(1)
                                is_async = 'async def' in lines[j]
                                break
                        
                        # Check for StandardAPIResponse usage
                        uses_standard_response = 'StandardAPIResponse' in response_model_type if response_model_type else False
                        
                        # Check for potential test coverage
                        test_complexity = self._assess_test_complexity(path, method)
                        
                        self.endpoints.append({
                            'file': py_file.name,
                            'method': method,
                            'path': path,
                            'function': func_name or 'unknown',
                            'is_async': is_async,
                            'has_response_model': has_response_model,
                            'response_model_type': response_model_type,
                            'uses_standard_response': uses_standard_response,
                            'test_complexity': test_complexity,
                            'line': i + 1
                        })
                        
            except Exception as e:
                print(f"Error scanning {py_file}: {e}")
                
        return self.endpoints
    
    def _assess_test_complexity(self, path: str, method: str) -> str:
        """Assess the complexity of testing this endpoint"""
        # Path parameters make testing more complex
        if '{' in path:
            return 'high'
        # POST/PUT methods need payload testing
        elif method in ['POST', 'PUT', 'PATCH']:
            return 'medium'
        # Simple GET endpoints are easier to test
        else:
            return 'low'
    
    def generate_coverage_report(self) -> Dict[str, Any]:
        """Generate a comprehensive coverage analysis report"""
        if not self.endpoints:
            self.scan_endpoints()
        
        # Group endpoints by file
        files_with_endpoints = {}
        for ep in self.endpoints:
            if ep['file'] not in files_with_endpoints:
                files_with_endpoints[ep['file']] = []
            files_with_endpoints[ep['file']].append(ep)
        
        # Calculate statistics
        total_endpoints = len(self.endpoints)
        async_count = sum(1 for ep in self.endpoints if ep['is_async'])
        sync_count = total_endpoints - async_count
        
        with_response_model = sum(1 for ep in self.endpoints if ep['has_response_model'])
        without_response_model = total_endpoints - with_response_model
        
        standard_response_count = sum(1 for ep in self.endpoints if ep['uses_standard_response'])
        
        method_distribution = {}
        for ep in self.endpoints:
            method_distribution[ep['method']] = method_distribution.get(ep['method'], 0) + 1
        
        complexity_distribution = {}
        for ep in self.endpoints:
            complexity = ep['test_complexity']
            complexity_distribution[complexity] = complexity_distribution.get(complexity, 0) + 1
        
        # Identify testing priorities
        high_priority_files = []
        for filename, endpoints in files_with_endpoints.items():
            non_compliant = sum(1 for ep in endpoints if not ep['uses_standard_response'])
            if non_compliant > 0:
                high_priority_files.append({
                    'file': filename,
                    'total_endpoints': len(endpoints),
                    'non_compliant': non_compliant,
                    'compliance_rate': (len(endpoints) - non_compliant) / len(endpoints) * 100
                })
        
        # Sort by non-compliance count
        high_priority_files.sort(key=lambda x: x['non_compliant'], reverse=True)
        
        report = {
            'summary': {
                'total_files': len(files_with_endpoints),
                'total_endpoints': total_endpoints,
                'async_endpoints': async_count,
                'sync_endpoints': sync_count,
                'with_response_model': with_response_model,
                'without_response_model': without_response_model,
                'using_standard_response': standard_response_count,
                'standard_response_compliance_rate': (standard_response_count / total_endpoints * 100) if total_endpoints > 0 else 0
            },
            'method_distribution': method_distribution,
            'complexity_distribution': complexity_distribution,
            'high_priority_files': high_priority_files[:10],  # Top 10 files needing attention
            'files_with_endpoints': {
                filename: {
                    'endpoint_count': len(endpoints),
                    'async_count': sum(1 for ep in endpoints if ep['is_async']),
                    'response_model_count': sum(1 for ep in endpoints if ep['has_response_model']),
                    'standard_response_count': sum(1 for ep in endpoints if ep['uses_standard_response']),
                    'endpoints': endpoints
                }
                for filename, endpoints in files_with_endpoints.items()
            }
        }
        
        return report
    
    def generate_test_cases(self) -> List[Dict[str, Any]]:
        """Generate comprehensive test case specifications"""
        if not self.endpoints:
            self.scan_endpoints()
        
        test_cases = []
        
        for ep in self.endpoints:
            # Generate happy path test case
            happy_case = {
                'file': ep['file'],
                'method': ep['method'],
                'path': ep['path'],
                'function': ep['function'],
                'test_type': 'happy_path',
                'description': f"Test successful {ep['method']} request to {ep['path']}",
                'expected_status': 200,
                'should_validate_contract': True,
                'complexity': ep['test_complexity'],
                'is_async': ep['is_async']
            }
            
            # Add path parameters if needed
            if '{' in ep['path']:
                happy_case['requires_path_params'] = True
                # Extract parameter names
                params = re.findall(r'\{(\w+)\}', ep['path'])
                happy_case['path_params'] = params
            
            # Add request body for POST/PUT methods
            if ep['method'] in ['POST', 'PUT', 'PATCH']:
                happy_case['requires_request_body'] = True
            
            test_cases.append(happy_case)
            
            # Generate error path test case
            error_case = {
                'file': ep['file'],
                'method': ep['method'],
                'path': ep['path'],
                'function': ep['function'],
                'test_type': 'error_path',
                'description': f"Test error handling for {ep['method']} request to {ep['path']}",
                'expected_status_range': [400, 500],
                'should_validate_contract': True,
                'complexity': ep['test_complexity'],
                'is_async': ep['is_async']
            }
            
            # Customize error scenarios based on endpoint type
            if ep['method'] in ['POST', 'PUT', 'PATCH']:
                error_case['error_scenario'] = 'invalid_request_body'
            elif '{' in ep['path']:
                error_case['error_scenario'] = 'invalid_path_param'
            else:
                error_case['error_scenario'] = 'server_error'
            
            test_cases.append(error_case)
        
        return test_cases

def main():
    """Main analysis function"""
    print("🔍 Analyzing API endpoint coverage...")
    
    analyzer = APIEndpointAnalyzer()
    report = analyzer.generate_coverage_report()
    test_cases = analyzer.generate_test_cases()
    
    # Print summary
    summary = report['summary']
    print(f"\n📊 API Endpoint Coverage Analysis")
    print(f"================================")
    print(f"Total files: {summary['total_files']}")
    print(f"Total endpoints: {summary['total_endpoints']}")
    print(f"Async endpoints: {summary['async_endpoints']}")
    print(f"Sync endpoints: {summary['sync_endpoints']}")
    print(f"With response_model: {summary['with_response_model']}")
    print(f"Without response_model: {summary['without_response_model']}")
    print(f"Using StandardAPIResponse: {summary['using_standard_response']}")
    print(f"Contract compliance rate: {summary['standard_response_compliance_rate']:.1f}%")
    
    # Method distribution
    print(f"\n🔍 HTTP Method Distribution:")
    for method, count in sorted(report['method_distribution'].items()):
        print(f"   {method}: {count} endpoints")
    
    # Complexity distribution
    print(f"\n⚡ Test Complexity Distribution:")
    for complexity, count in report['complexity_distribution'].items():
        print(f"   {complexity.title()}: {count} endpoints")
    
    # High priority files for compliance
    print(f"\n⚠️  Files Needing Contract Compliance (Top 10):")
    for file_info in report['high_priority_files']:
        print(f"   {file_info['file']}: {file_info['non_compliant']}/{file_info['total_endpoints']} non-compliant ({file_info['compliance_rate']:.1f}% compliant)")
    
    # Test case summary
    print(f"\n🧪 Test Case Requirements:")
    print(f"Total test cases needed: {len(test_cases)}")
    happy_cases = sum(1 for tc in test_cases if tc['test_type'] == 'happy_path')
    error_cases = sum(1 for tc in test_cases if tc['test_type'] == 'error_path')
    print(f"Happy path tests: {happy_cases}")
    print(f"Error path tests: {error_cases}")
    
    # Save detailed reports
    with open('api_coverage_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    with open('test_case_specifications.json', 'w') as f:
        json.dump(test_cases, f, indent=2)
    
    print(f"\n💾 Detailed reports saved:")
    print(f"   - api_coverage_report.json")
    print(f"   - test_case_specifications.json")
    
    print(f"\n✅ Analysis complete!")
    return report, test_cases

if __name__ == "__main__":
    main()
