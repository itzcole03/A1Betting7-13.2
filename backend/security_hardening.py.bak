#!/usr/bin/env python3
"""
Security Hardening System - Addresses Critical Vulnerabilities
"""

import os
import re
import json
import logging
from pathlib import Path
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class SecurityVulnerability:
    file_path: str
    line_number: int
    vulnerability_type: str
    severity: str
    description: str

class SecurityHardeningSystem:
    def __init__(self):
        self.vulnerabilities: List[SecurityVulnerability] = []
        
        # Security patterns to detect
        self.security_patterns = {
            'hardcoded_credentials': [
                r'password\s*=\s*["\'][^"\']+["\']',
                r'api_key\s*=\s*["\'][^"\']+["\']',
                r'secret\s*=\s*["\'][^"\']+["\']',
                r'token\s*=\s*["\'][^"\']+["\']'
            ],
            'sql_injection': [
                r'execute\s*\(\s*["\'].*%s.*["\']',
                r'query\s*\(\s*["\'].*%s.*["\']'
            ],
            'dynamic_execution': [
                r'eval\s*\(',
                r'exec\s*\(',
                r'subprocess\.call\s*\([^)]*shell\s*=\s*True'
            ]
        }
    
    def scan_for_vulnerabilities(self, directory: str = ".") -> List[SecurityVulnerability]:
        """Scan codebase for security vulnerabilities"""
        vulnerabilities = []
        
        for file_path in Path(directory).glob("**/*.py"):
            if 'venv' in str(file_path) or '__pycache__' in str(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    file_vulnerabilities = self.scan_file_content(str(file_path), content)
                    vulnerabilities.extend(file_vulnerabilities)
            except Exception:
                continue
        
        return vulnerabilities
    
    def scan_file_content(self, file_path: str, content: str) -> List[SecurityVulnerability]:
        """Scan file content for security vulnerabilities"""
        vulnerabilities = []
        lines = content.split('\n')
        
        for vuln_type, patterns in self.security_patterns.items():
            for pattern in patterns:
                for line_num, line in enumerate(lines, 1):
                    if re.search(pattern, line, re.IGNORECASE):
                        vulnerability = SecurityVulnerability(
                            file_path=file_path,
                            line_number=line_num,
                            vulnerability_type=vuln_type,
                            severity='HIGH',
                            description=f"{vuln_type} detected: {line.strip()[:50]}..."
                        )
                        vulnerabilities.append(vulnerability)
        
        return vulnerabilities
    
    def generate_security_report(self) -> Dict:
        """Generate security report"""
        vulnerabilities = self.scan_for_vulnerabilities()
        
        report = {
            'scan_timestamp': datetime.now().isoformat(),
            'total_vulnerabilities': len(vulnerabilities),
            'vulnerabilities_by_type': {},
            'critical_files': []
        }
        
        # Count by type
        for vuln in vulnerabilities:
            vuln_type = vuln.vulnerability_type
            if vuln_type not in report['vulnerabilities_by_type']:
                report['vulnerabilities_by_type'][vuln_type] = 0
            report['vulnerabilities_by_type'][vuln_type] += 1
        
        # Critical files
        critical_files = set()
        for vuln in vulnerabilities:
            if vuln.severity == 'HIGH':
                critical_files.add(vuln.file_path)
        
        report['critical_files'] = list(critical_files)
        
        return report

def main():
    """Main security hardening execution"""
    print("🛡️ Security Hardening System")
    print("=" * 40)
    
    hardening = SecurityHardeningSystem()
    report = hardening.generate_security_report()
    
    print(f"📊 Security Scan Results:")
    print(f"  • Total vulnerabilities: {report['total_vulnerabilities']}")
    print(f"  • Critical files: {len(report['critical_files'])}")
    
    # Save report
    with open('security_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print("✅ Security report saved to security_report.json")
    
    return report

if __name__ == "__main__":
    main() 