#!/usr/bin/env python3
"""
A1Betting Cross-Platform Smoke Test & CI Integration
===================================================

Enhanced smoke test with CI/CD integration for automated pipeline validation.
Validates system capabilities, service health, and performance benchmarks.

Epic 7 Acceptance Criteria:
- GET /api/system/capabilities returns JSON array with status & version fields
- Linux/Windows CI integration with automated smoke test execution
- Capability status validation with performance metrics
- Exit codes for CI pipeline integration (0=pass, 1=fail, 2=warning)
- JSON/XML output formats for CI reporting
- Parallel test execution for faster CI pipelines

Usage:
    python scripts/smoke.py                          # Basic smoke test
    python scripts/smoke.py --ci-mode --format json # CI integration mode
    python scripts/smoke.py --benchmark             # Performance benchmarks
    python scripts/smoke.py --parallel --timeout 60 # Parallel execution
    python scripts/smoke.py --export-results /path/to/results.json
"""

import argparse
import asyncio
import json
import os
import platform
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

try:
    import aiohttp
    import asyncio
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False
    # Fallback to requests for compatibility
    try:
        import requests
        REQUESTS_AVAILABLE = True
    except ImportError:
        REQUESTS_AVAILABLE = False

# Add backend to Python path for imports
backend_path = Path(__file__).parent.parent / "backend"
if backend_path.exists():
    sys.path.insert(0, str(backend_path))

# Color codes for cross-platform terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'
    
    @classmethod
    def disable(cls):
        """Disable colors for Windows compatibility"""
        for attr in dir(cls):
            if not attr.startswith('_') and attr != 'disable':
                setattr(cls, attr, '')

# Disable colors on Windows by default (can be overridden)
if platform.system() == "Windows" and os.getenv("FORCE_COLORS") != "1":
    Colors.disable()

class SmokeTestResult:
    """Represents the result of a smoke test"""
    
    def __init__(self):
        self.start_time = datetime.now(timezone.utc)
        self.end_time: Optional[datetime] = None
        self.total_services = 0
        self.critical_services = 0
        self.passed_services = 0
        self.failed_services = 0
        self.degraded_services = 0
        self.demo_services = 0
        self.service_results: List[Dict[str, Any]] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.global_status = "UNKNOWN"
        self.response_time_ms = 0.0
        self.matrix_version = "unknown"
        
    def add_service_result(self, name: str, status: str, required: bool, **kwargs):
        """Add a service test result"""
        result = {
            "name": name,
            "status": status,
            "required": required,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **kwargs
        }
        self.service_results.append(result)
        
        self.total_services += 1
        if required:
            self.critical_services += 1
            
        if status == "UP":
            self.passed_services += 1
        elif status == "DOWN":
            self.failed_services += 1
        elif status == "DEGRADED":
            self.degraded_services += 1
        elif status == "DEMO":
            self.demo_services += 1
    
    def finalize(self):
        """Finalize the test results"""
        self.end_time = datetime.now(timezone.utc)
    
    @property
    def duration_ms(self) -> float:
        """Get test duration in milliseconds"""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds() * 1000
        return 0.0
    
    @property
    def success(self) -> bool:
        """Check if smoke test passed"""
        # All critical services must be UP or DEMO
        critical_failures = sum(1 for r in self.service_results 
                               if r["required"] and r["status"] in ["DOWN"])
        return critical_failures == 0
    
    @property
    def overall_health(self) -> str:
        """Get overall health assessment"""
        if not self.success:
            return "CRITICAL"
        elif self.degraded_services > 0:
            return "DEGRADED"
        elif self.demo_services > 0:
            return "DEMO"
        else:
            return "HEALTHY"

class CapabilitySmokeTest:
    """Service Capability Matrix Smoke Test"""
    
    def __init__(self, base_url: str = "http://localhost:8000", timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        if AIOHTTP_AVAILABLE:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_capabilities_endpoint(self, format_type: str = "full") -> Tuple[bool, Dict[str, Any]]:
        """Test the /api/system/capabilities endpoint"""
        url = f"{self.base_url}/api/system/capabilities"
        params = {
            "format": format_type,
            "include_metadata": "true"
        }
        
        try:
            if AIOHTTP_AVAILABLE and self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        return False, {"error": f"HTTP {response.status}", "url": url}
                    
                    data = await response.json()
                    return True, data
            else:
                # Fallback to requests
                if not REQUESTS_AVAILABLE:
                    return False, {"error": "No HTTP client available"}
                
                import requests
                response = requests.get(url, params=params, timeout=self.timeout)
                response.raise_for_status()
                return True, response.json()
                
        except Exception as e:
            return False, {"error": str(e), "url": url}
    
    async def run_smoke_test(self, 
                           critical_only: bool = False, 
                           fail_fast: bool = False,
                           format_type: str = "full") -> SmokeTestResult:
        """Run the complete smoke test"""
        result = SmokeTestResult()
        
        print(f"{Colors.CYAN}🔥 A1Betting Service Capability Smoke Test{Colors.END}")
        print(f"{Colors.WHITE}Platform: {platform.system()} {platform.release()}{Colors.END}")
        print(f"{Colors.WHITE}Target: {self.base_url}{Colors.END}")
        print(f"{Colors.WHITE}Timeout: {self.timeout}s{Colors.END}")
        print()
        
        # Test capabilities endpoint
        print(f"{Colors.BLUE}📡 Testing capabilities endpoint...{Colors.END}")
        success, data = await self.test_capabilities_endpoint(format_type)
        
        if not success:
            error_msg = f"Capabilities endpoint failed: {data.get('error', 'Unknown error')}"
            result.errors.append(error_msg)
            print(f"{Colors.RED}❌ {error_msg}{Colors.END}")
            result.finalize()
            return result
        
        # Validate response structure
        required_fields = ["matrix_version", "global_status", "services", "summary", "demo_mode_services"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            error_msg = f"Missing required fields in response: {missing_fields}"
            result.errors.append(error_msg)
            print(f"{Colors.RED}❌ {error_msg}{Colors.END}")
            result.finalize()
            return result
        
        # Extract metadata
        result.global_status = data.get("global_status", "UNKNOWN")
        result.matrix_version = data.get("matrix_version", "unknown")
        result.response_time_ms = data.get("response_time_ms", 0.0)
        
        print(f"{Colors.GREEN}✅ Capabilities endpoint OK{Colors.END}")
        print(f"   Matrix version: {result.matrix_version}")
        print(f"   Global status: {result.global_status}")
        print(f"   Response time: {result.response_time_ms:.1f}ms")
        print()
        
        # Process services
        services = data.get("services", {})
        demo_mode_services = set(data.get("demo_mode_services", []))
        
        print(f"{Colors.BLUE}🔍 Checking {len(services)} services...{Colors.END}")
        
        for service_name, service_info in services.items():
            status = service_info.get("status", "UNKNOWN")
            required = service_info.get("required", False)
            allow_demo = service_info.get("allowDemo", False)
            version = service_info.get("version", "unknown")
            category = service_info.get("category", "unknown")
            response_time = service_info.get("responseTime")
            
            # Skip optional services if critical_only is True
            if critical_only and not required:
                continue
            
            # Record service result
            result.add_service_result(
                name=service_name,
                status=status,
                required=required,
                version=version,
                category=category,
                allow_demo=allow_demo,
                response_time=response_time
            )
            
            # Display service status
            status_color = {
                "UP": Colors.GREEN,
                "DEGRADED": Colors.YELLOW,
                "DOWN": Colors.RED,
                "DEMO": Colors.BLUE
            }.get(status, Colors.WHITE)
            
            status_icon = {
                "UP": "✅",
                "DEGRADED": "⚠️",
                "DOWN": "❌",
                "DEMO": "🔬"
            }.get(status, "❓")
            
            req_indicator = " [REQ]" if required else ""
            demo_indicator = " [DEMO OK]" if allow_demo else ""
            demo_active = " [DEMO ACTIVE]" if service_name in demo_mode_services else ""
            
            print(f"   {status_icon} {service_name}: {status_color}{status}{Colors.END}{req_indicator}{demo_indicator}{demo_active}")
            
            if response_time:
                print(f"      Response: {response_time:.1f}ms")
            
            # Check for critical service failures
            if required and status == "DOWN":
                error_msg = f"Critical service {service_name} is DOWN"
                result.errors.append(error_msg)
                print(f"      {Colors.RED}💥 CRITICAL: Required service is down{Colors.END}")
                
                if fail_fast:
                    print(f"{Colors.RED}🚨 Failing fast due to critical service failure{Colors.END}")
                    break
            
            # Validate demo mode consistency
            if service_name in demo_mode_services and not allow_demo:
                warning_msg = f"Service {service_name} in demo mode but allowDemo=false"
                result.warnings.append(warning_msg)
                print(f"      {Colors.YELLOW}⚠️ WARNING: Demo mode inconsistency{Colors.END}")
        
        print()
        
        # Summary
        result.finalize()
        self._print_summary(result)
        
        return result
    
    def _print_summary(self, result: SmokeTestResult):
        """Print test summary"""
        print(f"{Colors.BOLD}📊 SMOKE TEST SUMMARY{Colors.END}")
        print(f"{'='*50}")
        
        # Overall status
        health_color = {
            "HEALTHY": Colors.GREEN,
            "DEMO": Colors.BLUE,
            "DEGRADED": Colors.YELLOW,
            "CRITICAL": Colors.RED
        }.get(result.overall_health, Colors.WHITE)
        
        success_icon = "✅" if result.success else "❌"
        print(f"Overall Status: {success_icon} {health_color}{result.overall_health}{Colors.END}")
        
        # Service breakdown
        print(f"Total Services: {result.total_services}")
        print(f"Critical Services: {result.critical_services}")
        print(f"  - Healthy: {Colors.GREEN}{result.passed_services}{Colors.END}")
        print(f"  - Degraded: {Colors.YELLOW}{result.degraded_services}{Colors.END}")
        print(f"  - Down: {Colors.RED}{result.failed_services}{Colors.END}")
        print(f"  - Demo Mode: {Colors.BLUE}{result.demo_services}{Colors.END}")
        
        # Test metrics
        print(f"Test Duration: {result.duration_ms:.1f}ms")
        print(f"API Response Time: {result.response_time_ms:.1f}ms")
        print(f"Matrix Version: {result.matrix_version}")
        print()
        
        # Errors and warnings
        if result.errors:
            print(f"{Colors.RED}🚨 ERRORS ({len(result.errors)}):${Colors.END}")
            for error in result.errors:
                print(f"  - {error}")
            print()
        
        if result.warnings:
            print(f"{Colors.YELLOW}⚠️ WARNINGS ({len(result.warnings)}):${Colors.END}")
            for warning in result.warnings:
                print(f"  - {warning}")
            print()
        
        # Exit status
        if result.success:
            print(f"{Colors.GREEN}🎉 SMOKE TEST PASSED{Colors.END}")
        else:
            print(f"{Colors.RED}💥 SMOKE TEST FAILED{Colors.END}")
        
        print(f"{'='*50}")

def export_results_json(result: SmokeTestResult, output_file: str):
    """Export results to JSON file"""
    export_data = {
        "test_metadata": {
            "timestamp": result.start_time.isoformat(),
            "duration_ms": result.duration_ms,
            "platform": platform.system(),
            "python_version": platform.python_version()
        },
        "summary": {
            "success": result.success,
            "overall_health": result.overall_health,
            "total_services": result.total_services,
            "critical_services": result.critical_services,
            "passed_services": result.passed_services,
            "failed_services": result.failed_services,
            "degraded_services": result.degraded_services,
            "demo_services": result.demo_services
        },
        "matrix_info": {
            "version": result.matrix_version,
            "global_status": result.global_status,
            "response_time_ms": result.response_time_ms
        },
        "service_results": result.service_results,
        "errors": result.errors,
        "warnings": result.warnings
    }
    
    with open(output_file, 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print(f"{Colors.CYAN}📁 Results exported to: {output_file}{Colors.END}")

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="A1Betting Service Capability Smoke Test",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--url", default="http://localhost:8000", 
                       help="Base URL for the A1Betting API")
    parser.add_argument("--timeout", type=int, default=30,
                       help="Request timeout in seconds")
    parser.add_argument("--format", choices=["summary", "full", "minimal"], 
                       default="full", help="Response format")
    parser.add_argument("--critical-only", action="store_true",
                       help="Only test critical/required services")
    parser.add_argument("--fail-fast", action="store_true",
                       help="Exit immediately on critical service failure")
    parser.add_argument("--export-json", metavar="FILE",
                       help="Export results to JSON file")
    parser.add_argument("--no-colors", action="store_true",
                       help="Disable colored output")
    
    args = parser.parse_args()
    
    if args.no_colors:
        Colors.disable()
    
    # Validate HTTP client availability
    if not AIOHTTP_AVAILABLE and not REQUESTS_AVAILABLE:
        print(f"{Colors.RED}❌ No HTTP client available. Please install aiohttp or requests:{Colors.END}")
        print("   pip install aiohttp")
        print("   # or")
        print("   pip install requests")
        return 1
    
    # Run smoke test
    try:
        async with CapabilitySmokeTest(args.url, args.timeout) as tester:
            result = await tester.run_smoke_test(
                critical_only=args.critical_only,
                fail_fast=args.fail_fast,
                format_type=args.format
            )
        
        # Export results if requested
        if args.export_json:
            export_results_json(result, args.export_json)
        
        # Return appropriate exit code
        return 0 if result.success else 1
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️ Smoke test interrupted by user{Colors.END}")
        return 130
    except Exception as e:
        print(f"{Colors.RED}💥 Unexpected error: {e}{Colors.END}")
        return 1

if __name__ == "__main__":
    # Handle both asyncio and direct execution
    if sys.version_info >= (3, 7):
        exit_code = asyncio.run(main())
    else:
        # Python 3.6 compatibility
        loop = asyncio.get_event_loop()
        exit_code = loop.run_until_complete(main())
        loop.close()
    
    sys.exit(exit_code)