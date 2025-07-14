#!/usr/bin/env python3
"""
Security Scanner - Identify Critical Vulnerabilities
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

def scan_security_vulnerabilities():
    """Scan for security vulnerabilities in the codebase"""
    
    print('🛡️ Security Vulnerability Scanner')
    print('=' * 40)
    
    # Security patterns to detect
    patterns = {
        'hardcoded_credentials': [
            r'password\s*=\s*["\'][^"\']+["\']',
            r'api_key\s*=\s*["\'][^"\']+["\']',
            r'secret\s*=\s*["\'][^"\']+["\']',
            r'token\s*=\s*["\'][^"\']+["\']'
        ],
        'sql_injection': [
            r'execute\s*\(\s*["\'].*%s.*["\']',
            r'query\s*\(\s*["\'].*%s.*["\']',
            r'SELECT.*\+.*["\']',
            r'INSERT.*\+.*["\']'
        ],
        'dynamic_execution': [
            r'eval\s*\(',
            r'exec\s*\(',
            r'subprocess\.call.*shell\s*=\s*True',
            r'os\.system\s*\('
        ]
    }
    
    vulnerabilities = []
    files_scanned = 0
    
    # Scan Python files
    for file_path in Path('.').glob('**/*.py'):
        if any(skip in str(file_path) for skip in ['venv', '__pycache__', '.git']):
            continue
        
        files_scanned += 1
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')
                
                for vuln_type, vuln_patterns in patterns.items():
                    for pattern in vuln_patterns:
                        for line_num, line in enumerate(lines, 1):
                            if re.search(pattern, line, re.IGNORECASE):
                                vulnerabilities.append({
                                    'file': str(file_path),
                                    'line': line_num,
                                    'type': vuln_type,
                                    'content': line.strip()[:100],
                                    'severity': 'HIGH' if vuln_type == 'hardcoded_credentials' else 'MEDIUM'
                                })
        except Exception as e:
            continue
    
    print(f'📊 Scan Results:')
    print(f'  • Files scanned: {files_scanned}')
    print(f'  • Vulnerabilities found: {len(vulnerabilities)}')
    
    # Group by type
    vuln_by_type = {}
    for vuln in vulnerabilities:
        vuln_type = vuln['type']
        if vuln_type not in vuln_by_type:
            vuln_by_type[vuln_type] = 0
        vuln_by_type[vuln_type] += 1
    
    if vulnerabilities:
        print('\n⚠️  Security Issues by Type:')
        for vuln_type, count in vuln_by_type.items():
            print(f'  • {vuln_type}: {count} issues')
        
        print('\n🔍 Sample Issues:')
        for vuln in vulnerabilities[:5]:  # Show first 5
            print(f'  • {vuln["type"]} in {vuln["file"]}:{vuln["line"]}')
    
    # Save detailed report
    report = {
        'timestamp': datetime.now().isoformat(),
        'files_scanned': files_scanned,
        'total_vulnerabilities': len(vulnerabilities),
        'vulnerabilities_by_type': vuln_by_type,
        'vulnerabilities': vulnerabilities
    }
    
    with open('security_scan_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f'\n✅ Detailed security report saved to security_scan_report.json')
    
    return report

if __name__ == "__main__":
    scan_security_vulnerabilities() 