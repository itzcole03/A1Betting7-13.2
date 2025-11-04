#!/usr/bin/env python3
"""
Comprehensive Contract Integration Script
Tests both HTTP and WebSocket contract compliance
"""

import sys
import os
from pathlib import Path

def run_http_contract_scan():
    """Run HTTP contract compliance scan"""
    print("🔍 Running HTTP Contract Compliance Scan...")
    print("-" * 50)
    
    try:
        from ci_contract_scanner import CIContractScanner
        
        scanner = CIContractScanner(fail_on_violations=False)
        scanner.scan_routes_directory()
        
        report = scanner.generate_ci_report()
        print(report)
        
        return scanner.results['total_violations'] == 0
    except Exception as e:
        print(f"❌ HTTP scan failed: {e}")
        return False

def run_websocket_contract_scan():
    """Run WebSocket contract compliance scan"""
    print("\n🔍 Running WebSocket Contract Compliance Scan...")
    print("-" * 50)
    
    try:
        from websocket_contract_scanner import WebSocketContractScanner
        
        scanner = WebSocketContractScanner()
        scanner.scan_websocket_routes()
        
        report = scanner.generate_report()
        print(report)
        
        return scanner.results['total_violations'] == 0
    except Exception as e:
        print(f"❌ WebSocket scan failed: {e}")
        return False

def main():
    """Main integration test"""
    print("="*80)
    print("COMPREHENSIVE CONTRACT COMPLIANCE INTEGRATION TEST")
    print("="*80)
    
    # Run both scans
    http_passed = run_http_contract_scan()
    websocket_passed = run_websocket_contract_scan()
    
    # Summary
    print("\n" + "="*80)
    print("FINAL COMPLIANCE SUMMARY")
    print("="*80)
    
    http_status = "✅ PASS" if http_passed else "❌ FAIL"
    ws_status = "✅ PASS" if websocket_passed else "❌ FAIL" 
    overall_status = "✅ PASS" if (http_passed and websocket_passed) else "❌ FAIL"
    
    print(f"HTTP Contract Compliance:      {http_status}")
    print(f"WebSocket Contract Compliance: {ws_status}")
    print(f"Overall Status:                {overall_status}")
    
    if http_passed and websocket_passed:
        print("\n🎉 ALL CONTRACT COMPLIANCE CHECKS PASSED!")
        print("The system is ready for production deployment.")
    else:
        print("\n⚠️  Some compliance issues remain.")
        print("Review the scan results above for details.")
    
    # CI Integration Test
    print("\n📋 CI Integration Status:")
    ci_files = [
        ".github/workflows/contract-compliance.yml",
        "ci_contract_scanner.py", 
        "websocket_contract_scanner.py"
    ]
    
    for file_path in ci_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} (missing)")
    
    return 0 if (http_passed and websocket_passed) else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
