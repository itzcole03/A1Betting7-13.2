#!/usr/bin/env python3
"""
CI Contract Compliance Scanner
Integrates with CI/CD pipeline and fails build on contract violations
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Any

class CIContractScanner:
    """CI-integrated contract compliance scanner"""
    
    def __init__(self, fail_on_violations: bool = True):
        self.fail_on_violations = fail_on_violations
        self.results = {}
        self.total_violations = 0
        
    def scan_file(self, file_path: Path) -> Dict[str, Any]:
        """Scan a single file for contract violations"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return {
                'file': str(file_path),
                'error': f"Failed to read file: {e}",
                'violations': [],
                'count': 0
            }
        
        violations = []
        lines = content.split('\n')
        
        # Check for HTTPException usage
        httpexception_matches = re.findall(r'HTTPException\(', content)
        violations.extend([{'type': 'HTTPException usage', 'line': None}] * len(httpexception_matches))
        
        # Check for raise HTTPException patterns
        raise_http_matches = re.findall(r'raise\s+HTTPException\(', content)
        violations.extend([{'type': 'raise HTTPException', 'line': None}] * len(raise_http_matches))
        
        # Track multi-line router decorators for missing response_model
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if line.startswith('@router.') and any(method in line for method in ['get(', 'post(', 'put(', 'delete(', 'patch(']):
                # Collect full decorator (might span multiple lines)
                decorator_lines = [line]
                j = i + 1
                
                while j < len(lines) and not lines[j].strip().startswith('def ') and not lines[j].strip().startswith('async def '):
                    next_line = lines[j].strip()
                    if next_line:
                        decorator_lines.append(next_line)
                        if ')' in next_line and next_line.count(')') >= line.count('('):
                            break
                    j += 1
                
                full_decorator = ' '.join(decorator_lines)
                
                if 'response_model=' not in full_decorator:
                    violations.append({
                        'type': 'Missing response_model',
                        'line': i + 1,
                        'context': line[:80] + '...' if len(line) > 80 else line
                    })
                
                i = j
            else:
                # Check for non-standard returns
                if (line.startswith('return {') or line.startswith('return [')) and \
                   'ResponseBuilder.success' not in line and \
                   'JSONResponse' not in line:
                    violations.append({
                        'type': 'Non-standard return',
                        'line': i + 1,
                        'context': line[:80] + '...' if len(line) > 80 else line
                    })
                
                # Check for JSONResponse without StandardAPIResponse
                if 'JSONResponse(' in line and 'StandardAPIResponse' not in content:
                    violations.append({
                        'type': 'JSONResponse without StandardAPIResponse',
                        'line': i + 1,
                        'context': line[:80] + '...' if len(line) > 80 else line
                    })
            
            i += 1
        
        return {
            'file': str(file_path.name),  # Just use filename for cleaner output
            'violations': violations,
            'count': len(violations),
            'status': 'compliant' if len(violations) == 0 else 'violations_found'
        }
    
    def scan_routes_directory(self) -> Dict[str, Any]:
        """Scan all route files for violations"""
        routes_dir = Path("backend/routes")
        
        if not routes_dir.exists():
            return {
                'error': f"Directory {routes_dir} does not exist!",
                'total_files': 0,
                'compliant_files': 0,
                'violation_files': 0,
                'total_violations': 0,
                'files': []
            }
        
        files_results = []
        violation_files = 0
        
        for py_file in routes_dir.glob("*.py"):
            if py_file.name == "__init__.py":
                continue
                
            result = self.scan_file(py_file)
            files_results.append(result)
            
            if result['count'] > 0:
                violation_files += 1
                self.total_violations += result['count']
        
        self.results = {
            'scan_date': '2025-08-13',
            'total_files': len(files_results),
            'compliant_files': len(files_results) - violation_files,
            'violation_files': violation_files,
            'total_violations': self.total_violations,
            'status': 'PASS' if self.total_violations == 0 else 'FAIL',
            'files': sorted(files_results, key=lambda x: x['count'], reverse=True)
        }
        
        return self.results
    
    def generate_ci_report(self) -> str:
        """Generate CI-friendly report"""
        if not self.results:
            return "❌ No scan results available"
        
        report = []
        report.append("="*80)
        report.append("CI CONTRACT COMPLIANCE SCAN REPORT")
        report.append("="*80)
        
        status_emoji = "✅" if self.results['status'] == 'PASS' else "❌"
        report.append(f"STATUS: {status_emoji} {self.results['status']}")
        report.append(f"TOTAL FILES: {self.results['total_files']}")
        report.append(f"COMPLIANT FILES: {self.results['compliant_files']}")
        report.append(f"FILES WITH VIOLATIONS: {self.results['violation_files']}")
        report.append(f"TOTAL VIOLATIONS: {self.results['total_violations']}")
        report.append("")
        
        if self.results['total_violations'] > 0:
            report.append("FILES WITH VIOLATIONS:")
            report.append("-" * 40)
            
            for file_result in self.results['files']:
                if file_result['count'] > 0:
                    report.append(f"📁 {file_result['file']} ({file_result['count']} violations)")
                    
                    # Group violations by type
                    violation_types = {}
                    for violation in file_result['violations']:
                        vtype = violation['type']
                        violation_types[vtype] = violation_types.get(vtype, 0) + 1
                    
                    for vtype, count in violation_types.items():
                        report.append(f"   • {vtype}: {count}")
                    report.append("")
        else:
            report.append("🎉 ALL FILES ARE COMPLIANT!")
        
        report.append("="*80)
        
        return "\n".join(report)
    
    def save_json_report(self, output_path: str = "contract_compliance_report.json"):
        """Save detailed JSON report for CI artifacts"""
        if self.results:
            with open(output_path, 'w') as f:
                json.dump(self.results, f, indent=2)
            print(f"📄 Detailed JSON report saved to: {output_path}")
    
    def run_ci_scan(self) -> int:
        """Run the scan and return appropriate exit code for CI"""
        print("🔍 Starting CI Contract Compliance Scan...")
        
        # Perform the scan
        self.scan_routes_directory()
        
        # Generate and print report
        report = self.generate_ci_report()
        print(report)
        
        # Save JSON report
        self.save_json_report()
        
        # Return exit code
        if self.results['status'] == 'PASS':
            print("✅ CI Contract Compliance: PASSED")
            return 0  # Success
        else:
            print("❌ CI Contract Compliance: FAILED")
            if self.fail_on_violations:
                print("🚨 Build will fail due to contract violations")
                return 1  # Failure
            else:
                print("⚠️  Violations found but build will continue (fail_on_violations=False)")
                return 0

def main():
    """Main entry point for CI integration"""
    import argparse
    
    parser = argparse.ArgumentParser(description='CI Contract Compliance Scanner')
    parser.add_argument('--fail-on-violations', action='store_true', default=True,
                       help='Fail build on contract violations (default: True)')
    parser.add_argument('--no-fail', action='store_true', default=False,
                       help='Do not fail build on violations (warning only)')
    parser.add_argument('--output', default='contract_compliance_report.json',
                       help='JSON report output file')
    
    args = parser.parse_args()
    
    fail_on_violations = args.fail_on_violations and not args.no_fail
    
    scanner = CIContractScanner(fail_on_violations=fail_on_violations)
    exit_code = scanner.run_ci_scan()
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
