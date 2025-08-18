#!/usr/bin/env python3
"""
Multi-Hour Soak Test Execution Script
Executes comprehensive resilience testing to prove system resilience under adverse conditions
"""

import asyncio
import json
import requests
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional


class SoakTestExecutor:
    """Execute and monitor multi-hour resilience soak tests"""
    
    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.test_id: Optional[str] = None
        self.start_time: Optional[datetime] = None
        
    def start_comprehensive_soak_test(self, duration_hours: int = 4) -> Dict[str, Any]:
        """Start the comprehensive resilience test"""
        print(f"🚀 Starting {duration_hours}-hour comprehensive resilience soak test...")
        
        test_config = {
            "total_duration_hours": duration_hours,
            "enable_chaos_testing": True,
            "enable_circuit_breaker_testing": True,
            "enable_memory_monitoring": True,
            "enable_cascading_failure_testing": True,
            "chaos_intensity": "medium",
            "memory_growth_threshold_percent": 10,
            "memory_sampling_interval_seconds": 30,
            "max_memory_growth_percent": 15.0,
            "max_system_memory_percent": 90.0,
            "min_recovery_success_rate": 0.8
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/resilience/tests/comprehensive",
                json=test_config,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.test_id = result["test_id"]
                self.start_time = datetime.now()
                
                print(f"✅ Test started successfully!")
                print(f"   Test ID: {self.test_id}")
                print(f"   Start Time: {self.start_time}")
                print(f"   Estimated Duration: {duration_hours} hours")
                print(f"   Expected Completion: {self.start_time + timedelta(hours=duration_hours)}")
                
                return result
            else:
                print(f"❌ Failed to start test: {response.status_code}")
                print(f"   Response: {response.text}")
                return {"error": f"HTTP {response.status_code}: {response.text}"}
                
        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to backend server")
            print("   Please ensure the backend is running on http://127.0.0.1:8000")
            return {"error": "Connection failed"}
        except Exception as e:
            print(f"❌ Unexpected error starting test: {e}")
            return {"error": str(e)}
    
    def get_test_status(self) -> Dict[str, Any]:
        """Get current test status"""
        if not self.test_id:
            return {"error": "No active test"}
            
        try:
            response = requests.get(
                f"{self.base_url}/api/resilience/tests/{self.test_id}/status",
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
                
        except Exception as e:
            return {"error": str(e)}
    
    def get_full_report(self) -> Dict[str, Any]:
        """Get full test report"""
        if not self.test_id:
            return {"error": "No active test"}
            
        try:
            response = requests.get(
                f"{self.base_url}/api/resilience/tests/{self.test_id}/report",
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
                
        except Exception as e:
            return {"error": str(e)}
    
    def print_status_update(self):
        """Print formatted status update"""
        status = self.get_test_status()
        
        if "error" in status:
            print(f"⚠️ Error getting status: {status['error']}")
            return
            
        current_time = datetime.now()
        elapsed = current_time - self.start_time if self.start_time else timedelta(0)
        
        print(f"\n📊 Resilience Test Status Update - {current_time.strftime('%H:%M:%S')}")
        print(f"   Test ID: {self.test_id}")
        print(f"   Elapsed Time: {str(elapsed).split('.')[0]}")
        print(f"   Test Status: {status.get('status', 'Unknown')}")
        
        report_preview = status.get('report_preview', {})
        print(f"   Overall Result: {report_preview.get('overall_result', 'In Progress')}")
        print(f"   Phases Completed: {report_preview.get('phases_completed', 0)}/9")
        print(f"   Chaos Events: {report_preview.get('chaos_events_triggered', 0)}")
        print(f"   Memory Leak Detected: {report_preview.get('memory_leak_detected', 'Unknown')}")
        print(f"   Exit Criteria Met: {report_preview.get('exit_criteria_met', 'Unknown')}")
    
    def monitor_test(self, check_interval_minutes: int = 15):
        """Monitor test progress with regular status updates"""
        if not self.test_id:
            print("❌ No active test to monitor")
            return
            
        print(f"🔍 Starting test monitoring (checking every {check_interval_minutes} minutes)")
        print("   Press Ctrl+C to stop monitoring (test will continue running)")
        
        try:
            while True:
                self.print_status_update()
                
                # Check if test is complete
                status = self.get_test_status()
                if "error" in status:
                    break
                    
                # Sleep for check interval
                time.sleep(check_interval_minutes * 60)
                
        except KeyboardInterrupt:
            print("\n⏸️ Monitoring stopped (test continues running)")
            print(f"   To resume monitoring, use: python {__file__} --monitor {self.test_id}")
    
    def print_final_report(self):
        """Print comprehensive final report"""
        report = self.get_full_report()
        
        if "error" in report:
            print(f"⚠️ Error getting final report: {report['error']}")
            return
            
        print(f"\n📋 Final Resilience Test Report")
        print(f"={'='*60}")
        
        test_report = report.get('report', {})
        print(f"Test ID: {self.test_id}")
        print(f"Overall Result: {test_report.get('overall_result', 'Unknown')}")
        print(f"Exit Criteria Met: {test_report.get('exit_criteria_met', 'Unknown')}")
        print(f"Test Duration: {test_report.get('test_duration_hours', 'Unknown')} hours")
        
        print(f"\n🎯 Key Metrics:")
        print(f"   Memory Leak Detected: {test_report.get('memory_leak_detected', 'Unknown')}")
        print(f"   Chaos Events Triggered: {test_report.get('chaos_events_triggered', 0)}")
        print(f"   Successful Recoveries: {test_report.get('successful_recoveries', 0)}")
        print(f"   Recovery Success Rate: {test_report.get('recovery_success_rate', 0):.1%}")
        print(f"   Memory Growth: {test_report.get('memory_growth_percent', 0)}%")
        print(f"   Max Memory Usage: {test_report.get('max_memory_usage_mb', 0)} MB")
        
        phases_completed = test_report.get('phases_completed', [])
        print(f"\n📋 Phases Completed ({len(phases_completed)}/9):")
        for phase in phases_completed:
            print(f"   ✅ {phase}")
            
        print(f"\n{'='*60}")


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Execute multi-hour resilience soak test")
    parser.add_argument("--duration", type=int, default=4, help="Test duration in hours (default: 4)")
    parser.add_argument("--monitor-only", type=str, help="Monitor existing test by ID")
    parser.add_argument("--report-only", type=str, help="Get final report for test ID")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Backend base URL")
    
    args = parser.parse_args()
    
    executor = SoakTestExecutor(args.base_url)
    
    if args.monitor_only:
        executor.test_id = args.monitor_only
        executor.start_time = datetime.now()  # Approximate for monitoring
        executor.monitor_test()
    elif args.report_only:
        executor.test_id = args.report_only
        executor.print_final_report()
    else:
        # Start new test
        result = executor.start_comprehensive_soak_test(args.duration)
        
        if "error" not in result:
            print(f"\n🔍 Starting monitoring phase...")
            time.sleep(5)  # Give test time to initialize
            executor.monitor_test()
            
            print(f"\n📋 Generating final report...")
            executor.print_final_report()
        else:
            print(f"❌ Test failed to start: {result['error']}")


if __name__ == "__main__":
    main()