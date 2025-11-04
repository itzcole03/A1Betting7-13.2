#!/usr/bin/env python3
"""
WebSocket Contract Compliance Scanner
Specialized scanner for WebSocket endpoints and message envelope patterns
"""

import os
import sys
import json
import re
import ast
from pathlib import Path
from typing import Dict, List, Any, Optional

class WebSocketContractScanner:
    """Scanner for WebSocket-specific contract compliance"""
    
    def __init__(self):
        self.results = {}
        self.total_violations = 0
        self.websocket_patterns = {
            'endpoint_decorators': r'@router\.websocket\([\'"]([^\'"]*)[\'"]',
            'websocket_accept': r'await\s+websocket\.accept\(\)',
            'websocket_send': r'await\s+websocket\.send_text\(',
            'websocket_receive': r'await\s+websocket\.receive_text\(\)',
            'json_dumps': r'json\.dumps\(',
            'json_loads': r'json\.loads\(',
            'message_envelope': r'(type|status|data|timestamp|error)',
            'connection_manager': r'class\s+\w*ConnectionManager',
        }
    
    def analyze_websocket_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze a file for WebSocket contract compliance"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return {
                'file': file_path.name,
                'error': f"Failed to read file: {e}",
                'violations': [],
                'websocket_endpoints': [],
                'compliance_score': 0
            }
        
        violations = []
        websocket_endpoints = []
        
        lines = content.split('\n')
        
        # Find WebSocket endpoints
        endpoint_matches = re.findall(self.websocket_patterns['endpoint_decorators'], content)
        websocket_endpoints = endpoint_matches
        
        if not websocket_endpoints:
            # Not a WebSocket file
            return {
                'file': file_path.name,
                'websocket_endpoints': [],
                'violations': [],
                'compliance_score': 100,
                'status': 'not_applicable'
            }
        
        # Analyze WebSocket-specific patterns
        violations.extend(self._check_message_envelope_compliance(content, lines))
        violations.extend(self._check_error_handling_patterns(content, lines))
        violations.extend(self._check_connection_lifecycle(content, lines))
        violations.extend(self._check_authentication_patterns(content, lines))
        violations.extend(self._check_message_typing(content, lines))
        
        # Calculate compliance score
        total_checks = 5 * len(websocket_endpoints)  # 5 categories per endpoint
        passed_checks = max(0, total_checks - len(violations))
        compliance_score = int((passed_checks / total_checks * 100)) if total_checks > 0 else 100
        
        return {
            'file': file_path.name,
            'websocket_endpoints': websocket_endpoints,
            'violations': violations,
            'compliance_score': compliance_score,
            'status': 'compliant' if len(violations) == 0 else 'violations_found'
        }
    
    def _check_message_envelope_compliance(self, content: str, lines: List[str]) -> List[Dict[str, Any]]:
        """Check if messages follow envelope pattern"""
        violations = []
        
        # Look for send_text calls without proper envelope
        send_patterns = re.findall(r'await\s+\w*\.send_text\(([^)]+)\)', content)
        
        for i, pattern in enumerate(send_patterns):
            # Check if it uses json.dumps with proper envelope
            if 'json.dumps' not in pattern:
                violations.append({
                    'type': 'Missing JSON envelope',
                    'category': 'message_envelope',
                    'description': 'WebSocket message should use json.dumps with envelope pattern',
                    'suggestion': 'Use envelope pattern: {"type": "...", "data": {...}, "timestamp": "..."}'
                })
                continue
            
            # Check for envelope fields (type, status, data, timestamp)
            envelope_fields = ['type', 'data', 'timestamp']
            missing_fields = []
            
            for field in envelope_fields:
                if f'"{field}"' not in pattern and f"'{field}'" not in pattern:
                    missing_fields.append(field)
            
            if missing_fields:
                violations.append({
                    'type': 'Incomplete message envelope',
                    'category': 'message_envelope',
                    'description': f'Message envelope missing fields: {", ".join(missing_fields)}',
                    'suggestion': 'Include required envelope fields: type, data, timestamp'
                })
        
        return violations
    
    def _check_error_handling_patterns(self, content: str, lines: List[str]) -> List[Dict[str, Any]]:
        """Check for proper WebSocket error handling"""
        violations = []
        
        # Check for WebSocketDisconnect handling
        if 'WebSocketDisconnect' not in content:
            violations.append({
                'type': 'Missing WebSocketDisconnect handling',
                'category': 'error_handling',
                'description': 'WebSocket endpoints should handle WebSocketDisconnect exceptions',
                'suggestion': 'Add: except WebSocketDisconnect: pass'
            })
        
        # Check for generic exception handling in WebSocket loops
        websocket_while_loops = re.findall(r'while\s+True:\s*\n(.*?)(?=except|finally|\n\S)', content, re.DOTALL)
        
        for loop_content in websocket_while_loops:
            if 'receive_text' in loop_content and 'except' not in content[content.find(loop_content):]:
                violations.append({
                    'type': 'Unhandled exceptions in WebSocket loop',
                    'category': 'error_handling',
                    'description': 'WebSocket message loop should handle exceptions properly',
                    'suggestion': 'Add exception handling for message processing errors'
                })
        
        return violations
    
    def _check_connection_lifecycle(self, content: str, lines: List[str]) -> List[Dict[str, Any]]:
        """Check WebSocket connection lifecycle management"""
        violations = []
        
        # Check for proper accept call
        if 'await websocket.accept()' not in content:
            violations.append({
                'type': 'Missing websocket.accept()',
                'category': 'connection_lifecycle',
                'description': 'WebSocket endpoints should call await websocket.accept()',
                'suggestion': 'Add: await websocket.accept() after connection establishment'
            })
        
        # Check for connection cleanup in finally block
        has_finally = 'finally:' in content
        has_cleanup = any(keyword in content for keyword in ['remove_connection', 'disconnect', 'cleanup'])
        
        if not has_finally or not has_cleanup:
            violations.append({
                'type': 'Missing connection cleanup',
                'category': 'connection_lifecycle',
                'description': 'WebSocket endpoints should clean up connections in finally block',
                'suggestion': 'Add finally block with connection cleanup'
            })
        
        return violations
    
    def _check_authentication_patterns(self, content: str, lines: List[str]) -> List[Dict[str, Any]]:
        """Check WebSocket authentication patterns"""
        violations = []
        
        # Look for endpoints that might need auth but don't have token validation
        endpoints_needing_auth = ['portfolio', 'account', 'private', 'user']
        
        for endpoint in endpoints_needing_auth:
            if endpoint in content.lower() and 'token' not in content.lower():
                violations.append({
                    'type': 'Missing authentication',
                    'category': 'authentication',
                    'description': f'Endpoint appears to need authentication but no token validation found',
                    'suggestion': 'Add token parameter and validation for secure endpoints'
                })
        
        return violations
    
    def _check_message_typing(self, content: str, lines: List[str]) -> List[Dict[str, Any]]:
        """Check message typing and structure"""
        violations = []
        
        # Check for proper message type handling
        if 'message.get(' in content and "'type'" not in content:
            violations.append({
                'type': 'Missing message type handling',
                'category': 'message_typing',
                'description': 'WebSocket message handlers should check message type',
                'suggestion': 'Use message_type = message.get("type") for message routing'
            })
        
        # Check for JSON parsing error handling
        if 'json.loads' in content and 'json.JSONDecodeError' not in content:
            violations.append({
                'type': 'Missing JSON parsing error handling',
                'category': 'message_typing',
                'description': 'JSON parsing should handle JSONDecodeError exceptions',
                'suggestion': 'Add try/except for json.loads with JSONDecodeError handling'
            })
        
        return violations
    
    def scan_websocket_routes(self) -> Dict[str, Any]:
        """Scan all WebSocket-related files"""
        websocket_files = []
        
        # Scan specific WebSocket files
        websocket_patterns = [
            "backend/ws.py",
            "backend/routes/*websocket*.py",
            "backend/services/*websocket*.py"
        ]
        
        for pattern in websocket_patterns:
            for file_path in Path(".").glob(pattern):
                if file_path.is_file() and file_path.suffix == '.py':
                    websocket_files.append(file_path)
        
        results = []
        total_violations = 0
        total_endpoints = 0
        
        for file_path in websocket_files:
            result = self.analyze_websocket_file(file_path)
            if result['status'] != 'not_applicable':
                results.append(result)
                total_violations += len(result['violations'])
                total_endpoints += len(result['websocket_endpoints'])
        
        # Calculate overall compliance
        overall_score = 100
        if results:
            overall_score = sum(r['compliance_score'] for r in results) // len(results)
        
        self.results = {
            'scan_type': 'websocket_compliance',
            'scan_date': '2025-08-13',
            'total_files': len(results),
            'total_endpoints': total_endpoints,
            'total_violations': total_violations,
            'overall_compliance_score': overall_score,
            'status': 'PASS' if total_violations == 0 else 'FAIL',
            'files': sorted(results, key=lambda x: len(x['violations']), reverse=True)
        }
        
        return self.results
    
    def generate_report(self) -> str:
        """Generate WebSocket compliance report"""
        if not self.results:
            return "❌ No WebSocket scan results available"
        
        report = []
        report.append("="*80)
        report.append("WEBSOCKET CONTRACT COMPLIANCE SCAN REPORT")
        report.append("="*80)
        
        status_emoji = "✅" if self.results['status'] == 'PASS' else "❌"
        report.append(f"STATUS: {status_emoji} {self.results['status']}")
        report.append(f"TOTAL FILES SCANNED: {self.results['total_files']}")
        report.append(f"WEBSOCKET ENDPOINTS: {self.results['total_endpoints']}")
        report.append(f"TOTAL VIOLATIONS: {self.results['total_violations']}")
        report.append(f"OVERALL COMPLIANCE SCORE: {self.results['overall_compliance_score']}%")
        report.append("")
        
        if self.results['total_violations'] > 0:
            report.append("FILES WITH VIOLATIONS:")
            report.append("-" * 50)
            
            for file_result in self.results['files']:
                if len(file_result['violations']) > 0:
                    report.append(f"📁 {file_result['file']} (Score: {file_result['compliance_score']}%)")
                    report.append(f"   Endpoints: {', '.join(file_result['websocket_endpoints'])}")
                    report.append(f"   Violations: {len(file_result['violations'])}")
                    
                    # Group violations by category
                    categories = {}
                    for violation in file_result['violations']:
                        cat = violation['category']
                        categories[cat] = categories.get(cat, 0) + 1
                    
                    for category, count in categories.items():
                        report.append(f"   • {category}: {count}")
                    
                    report.append("")
        else:
            report.append("🎉 ALL WEBSOCKET ENDPOINTS ARE COMPLIANT!")
        
        # Add recommendations
        if self.results['total_violations'] > 0:
            report.append("COMPLIANCE RECOMMENDATIONS:")
            report.append("-" * 30)
            report.append("1. Use envelope pattern: {type, data, timestamp}")
            report.append("2. Handle WebSocketDisconnect exceptions")
            report.append("3. Clean up connections in finally blocks")
            report.append("4. Add authentication for sensitive endpoints")
            report.append("5. Handle JSON parsing errors properly")
        
        report.append("="*80)
        
        return "\n".join(report)
    
    def get_top_violating_files(self, limit: int = 3) -> List[Dict[str, Any]]:
        """Get top violating files for conversion"""
        if not self.results:
            return []
        
        violating_files = [f for f in self.results['files'] if len(f['violations']) > 0]
        return sorted(violating_files, key=lambda x: len(x['violations']), reverse=True)[:limit]

def main():
    """Main entry point"""
    print("🔍 Starting WebSocket Contract Compliance Scan...")
    
    scanner = WebSocketContractScanner()
    scanner.scan_websocket_routes()
    
    report = scanner.generate_report()
    print(report)
    
    # Save JSON report
    with open('websocket_compliance_report.json', 'w') as f:
        json.dump(scanner.results, f, indent=2)
    print("📄 Detailed JSON report saved to: websocket_compliance_report.json")
    
    # Show top violating files
    top_files = scanner.get_top_violating_files()
    if top_files:
        print(f"\n🔧 TOP {len(top_files)} FILES FOR ENVELOPE PATTERN CONVERSION:")
        for i, file_result in enumerate(top_files, 1):
            endpoints = ', '.join(file_result['websocket_endpoints'])
            print(f"{i}. {file_result['file']} - {len(file_result['violations'])} violations")
            print(f"   Endpoints: {endpoints}")
    
    return len(scanner.results.get('files', [])) > 0

if __name__ == "__main__":
    has_violations = main()
    sys.exit(1 if has_violations else 0)
