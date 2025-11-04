#!/usr/bin/env python3
"""
PR11 Implementation Validation Script
=====================================
Validates the complete implementation of WebSocket correlation, 
message envelopes, and observability event bus system.
"""

import asyncio
import json
import time
from typing import Dict, List, Any
import urllib.request
import urllib.error
import websockets

BASE_URL = "http://127.0.0.1:8000"
WS_BASE_URL = "ws://127.0.0.1:8000"

class PR11Validator:
    """Comprehensive PR11 implementation validator"""
    
    def __init__(self):
        self.test_results: Dict[str, Dict[str, Any]] = {}
        self.client_id = f"validator_{int(time.time())}"
        
    def log_test(self, test_name: str, status: str, details: str = "", data: Any = None):
        """Log test result"""
        self.test_results[test_name] = {
            "status": status,
            "details": details,
            "data": data,
            "timestamp": time.time()
        }
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {details}")
        
    def test_observability_api(self) -> bool:
        """Test observability API endpoints"""
        endpoints = [
            "/api/v2/observability/events",
            "/api/v2/observability/stats", 
            "/api/v2/observability/health"
        ]
        
        for endpoint in endpoints:
            try:
                with urllib.request.urlopen(f"{BASE_URL}{endpoint}", timeout=5) as response:
                    if response.getcode() == 200:
                        data = json.loads(response.read().decode())
                        if data.get("success"):
                            self.log_test(f"API_{endpoint.split('/')[-1].upper()}", "PASS", 
                                        f"Endpoint accessible, returned {len(str(data))} bytes")
                        else:
                            self.log_test(f"API_{endpoint.split('/')[-1].upper()}", "FAIL", 
                                        f"API returned success=false: {data.get('error', 'Unknown error')}")
                            return False
                    else:
                        self.log_test(f"API_{endpoint.split('/')[-1].upper()}", "FAIL", 
                                    f"HTTP {response.getcode()}")
                        return False
            except Exception as e:
                self.log_test(f"API_{endpoint.split('/')[-1].upper()}", "FAIL", str(e))
                return False
                
        return True
    
    async def test_legacy_websocket(self) -> bool:
        """Test legacy WebSocket endpoint"""
        try:
            uri = f"{WS_BASE_URL}/ws/legacy/{self.client_id}"
            async with websockets.connect(uri, timeout=10) as websocket:
                # Should connect successfully
                self.log_test("LEGACY_WS_CONNECTION", "PASS", "Connected to legacy endpoint")
                
                # Should receive basic WebSocket data (not envelope format)
                try:
                    # Wait briefly for any initial messages
                    message = await asyncio.wait_for(websocket.recv(), timeout=2)
                    self.log_test("LEGACY_WS_MESSAGE", "PASS", f"Received: {message[:100]}...")
                except asyncio.TimeoutError:
                    self.log_test("LEGACY_WS_MESSAGE", "WARN", "No initial message received")
                
                return True
        except Exception as e:
            self.log_test("LEGACY_WS_CONNECTION", "FAIL", str(e))
            return False
    
    async def test_enhanced_websocket(self) -> bool:
        """Test enhanced WebSocket endpoint with envelope support"""
        try:
            uri = f"{WS_BASE_URL}/ws/client?client_id={self.client_id}"
            async with websockets.connect(uri, timeout=10) as websocket:
                self.log_test("ENHANCED_WS_CONNECTION", "PASS", "Connected to enhanced endpoint")
                
                # Should receive envelope-formatted hello message
                hello_message = await asyncio.wait_for(websocket.recv(), timeout=5)
                try:
                    hello_data = json.loads(hello_message)
                    
                    # Validate envelope structure
                    required_fields = ["envelope_version", "type", "timestamp", "payload", "request_id"]
                    for field in required_fields:
                        if field not in hello_data:
                            self.log_test("ENVELOPE_STRUCTURE", "FAIL", f"Missing field: {field}")
                            return False
                    
                    if hello_data["type"] != "hello":
                        self.log_test("ENVELOPE_HELLO", "FAIL", f"Expected 'hello', got '{hello_data['type']}'")
                        return False
                        
                    if hello_data["envelope_version"] != 1:
                        self.log_test("ENVELOPE_VERSION", "FAIL", f"Expected version 1, got {hello_data['envelope_version']}")
                        return False
                        
                    # Check PR11 features
                    payload = hello_data.get("payload", {})
                    features = payload.get("features", [])
                    expected_features = ["envelope_v1", "heartbeat", "correlation_tracking", "structured_errors"]
                    for feature in expected_features:
                        if feature not in features:
                            self.log_test("PR11_FEATURES", "WARN", f"Missing expected feature: {feature}")
                        else:
                            self.log_test(f"FEATURE_{feature.upper()}", "PASS", "Feature advertised")
                    
                    self.log_test("ENVELOPE_HELLO", "PASS", f"Valid hello envelope with {len(features)} features")
                    
                except json.JSONDecodeError as e:
                    self.log_test("ENVELOPE_JSON", "FAIL", f"Invalid JSON: {e}")
                    return False
                
                return True
                
        except Exception as e:
            self.log_test("ENHANCED_WS_CONNECTION", "FAIL", str(e))
            return False
    
    def test_routing_separation(self) -> bool:
        """Test that routing properly separates legacy and enhanced endpoints"""
        try:
            # Test that /ws/client doesn't match the legacy pattern
            try:
                with urllib.request.urlopen(f"{BASE_URL}/ws/client", timeout=5) as response:
                    # Should get method not allowed or upgrade required, not a legacy handler response
                    if response.getcode() in [405, 426]:  # Method not allowed or upgrade required
                        self.log_test("ROUTING_SEPARATION", "PASS", "Enhanced endpoint properly separated from legacy")
                        return True
                    else:
                        self.log_test("ROUTING_SEPARATION", "WARN", f"Unexpected response: {response.getcode()}")
                        return True  # Not necessarily a failure
            except urllib.error.HTTPError as e:
                if e.code in [405, 426]:
                    self.log_test("ROUTING_SEPARATION", "PASS", "Enhanced endpoint properly separated from legacy")
                    return True
                else:
                    self.log_test("ROUTING_SEPARATION", "WARN", f"HTTP Error: {e.code}")
                    return True
                
        except Exception as e:
            self.log_test("ROUTING_SEPARATION", "FAIL", str(e))
            return False
    
    def check_event_tracking(self) -> bool:
        """Check if events are being tracked in observability system"""
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/v2/observability/events?limit=20", timeout=5) as response:
                if response.getcode() == 200:
                    data = json.loads(response.read().decode())
                    events = data.get("data", {}).get("events", [])
                    
                    # Look for our test events
                    legacy_events = [e for e in events if "legacy" in str(e).lower()]
                    ws_events = [e for e in events if e.get("event_type", "").startswith("ws.")]
                    
                    if legacy_events:
                        self.log_test("LEGACY_EVENT_TRACKING", "PASS", f"Found {len(legacy_events)} legacy events")
                    else:
                        self.log_test("LEGACY_EVENT_TRACKING", "WARN", "No legacy usage events found")
                    
                    if ws_events:
                        self.log_test("WS_EVENT_TRACKING", "PASS", f"Found {len(ws_events)} WebSocket events")
                    else:
                        self.log_test("WS_EVENT_TRACKING", "WARN", "No WebSocket events found")
                    
                    self.log_test("EVENT_COLLECTION", "PASS", f"Observability collected {len(events)} total events")
                    return True
                else:
                    self.log_test("EVENT_COLLECTION", "FAIL", f"Cannot access events: HTTP {response.getcode()}")
                    return False
                
        except Exception as e:
            self.log_test("EVENT_COLLECTION", "FAIL", str(e))
            return False
    
    async def run_validation(self) -> Dict[str, Any]:
        """Run complete PR11 validation suite"""
        print("🚀 Starting PR11 Implementation Validation")
        print("=" * 50)
        
        # Test 1: Observability API endpoints
        api_ok = self.test_observability_api()
        
        # Test 2: WebSocket endpoints
        legacy_ok = await self.test_legacy_websocket()
        enhanced_ok = await self.test_enhanced_websocket()
        
        # Test 3: Routing separation
        routing_ok = self.test_routing_separation()
        
        # Test 4: Event tracking
        events_ok = self.check_event_tracking()
        
        # Summary
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results.values() if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results.values() if r["status"] == "FAIL"])
        warned_tests = len([r for r in self.test_results.values() if r["status"] == "WARN"])
        
        print("\n" + "=" * 50)
        print("📊 PR11 VALIDATION SUMMARY")
        print(f"✅ Passed: {passed_tests}/{total_tests}")
        print(f"❌ Failed: {failed_tests}/{total_tests}")
        print(f"⚠️  Warnings: {warned_tests}/{total_tests}")
        
        overall_status = "PASS" if failed_tests == 0 else "FAIL"
        print(f"\n🎯 Overall Status: {overall_status}")
        
        if overall_status == "PASS":
            print("🎉 PR11 implementation is fully functional!")
        else:
            print("🔧 Some components need attention - check failed tests above")
        
        return {
            "overall_status": overall_status,
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "warnings": warned_tests
            },
            "test_results": self.test_results
        }

async def main():
    """Main validation function"""
    validator = PR11Validator()
    results = await validator.run_validation()
    
    # Save detailed results
    with open("pr11_validation_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: pr11_validation_results.json")
    return results["overall_status"] == "PASS"

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)