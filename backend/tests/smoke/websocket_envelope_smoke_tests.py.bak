"""
WebSocket Envelope Pattern Compliance Smoke Tests

Comprehensive automated testing to verify that all WebSocket endpoints
follow the standardized envelope pattern: {type, status, data, timestamp, error}
"""

import asyncio
import json
import time
import websockets
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import pytest
import aiohttp
from pathlib import Path


@dataclass
class EnvelopeTestResult:
    """Result of an envelope compliance test"""
    endpoint: str
    test_type: str
    success: bool
    message: str
    received_data: Optional[Dict[str, Any]] = None
    expected_fields: Optional[List[str]] = None
    missing_fields: Optional[List[str]] = None
    extra_info: Optional[Dict[str, Any]] = None


class WebSocketEnvelopeValidator:
    """Validator for WebSocket envelope pattern compliance"""

    REQUIRED_ENVELOPE_FIELDS = ["type", "status", "data", "timestamp"]
    OPTIONAL_ENVELOPE_FIELDS = ["error"]
    VALID_STATUS_VALUES = ["success", "error", "pending", "info"]

    @classmethod
    def validate_envelope(cls, message: Dict[str, Any]) -> EnvelopeTestResult:
        """Validate a single WebSocket message for envelope compliance"""
        
        # Check if all required fields are present
        missing_fields = [
            field for field in cls.REQUIRED_ENVELOPE_FIELDS 
            if field not in message
        ]
        
        if missing_fields:
            return EnvelopeTestResult(
                endpoint="unknown",
                test_type="envelope_structure",
                success=False,
                message=f"Missing required envelope fields: {missing_fields}",
                received_data=message,
                missing_fields=missing_fields
            )
        
        # Validate status field values
        status = message.get("status")
        if status not in cls.VALID_STATUS_VALUES:
            return EnvelopeTestResult(
                endpoint="unknown",
                test_type="status_validation",
                success=False,
                message=f"Invalid status value: '{status}'. Must be one of {cls.VALID_STATUS_VALUES}",
                received_data=message
            )
        
        # Validate timestamp format
        timestamp = message.get("timestamp")
        try:
            if timestamp:
                # Try to parse the timestamp
                datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except (ValueError, AttributeError) as e:
            return EnvelopeTestResult(
                endpoint="unknown",
                test_type="timestamp_validation",
                success=False,
                message=f"Invalid timestamp format: {timestamp}. Error: {e}",
                received_data=message
            )
        
        # Validate type field is a string
        msg_type = message.get("type")
        if not isinstance(msg_type, str) or not msg_type.strip():
            return EnvelopeTestResult(
                endpoint="unknown",
                test_type="type_validation",
                success=False,
                message=f"Type field must be a non-empty string, got: {type(msg_type).__name__}",
                received_data=message
            )
        
        return EnvelopeTestResult(
            endpoint="unknown",
            test_type="envelope_structure",
            success=True,
            message="Envelope structure is valid",
            received_data=message
        )


class WebSocketEnvelopeSmokeTester:
    """Comprehensive smoke tester for WebSocket envelope compliance"""

    def __init__(self, base_url: str = "ws://localhost:8000"):
        self.base_url = base_url
        self.test_results: List[EnvelopeTestResult] = []
        self.validator = WebSocketEnvelopeValidator()

    async def run_all_tests(self) -> List[EnvelopeTestResult]:
        """Run all envelope compliance smoke tests"""
        print("🧪 Starting WebSocket Envelope Compliance Smoke Tests...")
        
        # Test different WebSocket endpoints
        endpoints_to_test = [
            "/ws/realtime",
            "/ws/game_updates", 
            "/ws/notifications",
            "/ws/betting_updates",
            "/ws/live_odds"
        ]
        
        for endpoint in endpoints_to_test:
            print(f"\n📡 Testing endpoint: {endpoint}")
            await self._test_endpoint_envelope_compliance(endpoint)
        
        # Test specific scenarios
        await self._test_connection_establishment()
        await self._test_error_scenarios()
        await self._test_subscription_messages()
        await self._test_heartbeat_messages()
        
        return self.test_results

    async def _test_endpoint_envelope_compliance(self, endpoint: str):
        """Test envelope compliance for a specific endpoint"""
        uri = f"{self.base_url}{endpoint}"
        
        try:
            # Test connection and basic message exchange
            async with websockets.connect(uri, timeout=5) as websocket:
                print(f"  ✅ Connected to {endpoint}")
                
                # Wait for initial connection message
                try:
                    initial_message = await asyncio.wait_for(websocket.recv(), timeout=2)
                    result = await self._validate_message(initial_message, endpoint, "connection")
                    self.test_results.append(result)
                except asyncio.TimeoutError:
                    print(f"  ⚠️ No initial message received from {endpoint}")
                
                # Send a test subscription message
                test_message = {
                    "type": "subscribe",
                    "data": {"gameId": 12345, "markets": ["player_props"]}
                }
                
                await websocket.send(json.dumps(test_message))
                print(f"  📤 Sent test subscription to {endpoint}")
                
                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=3)
                    result = await self._validate_message(response, endpoint, "subscription_response")
                    self.test_results.append(result)
                except asyncio.TimeoutError:
                    self.test_results.append(EnvelopeTestResult(
                        endpoint=endpoint,
                        test_type="subscription_response",
                        success=False,
                        message="No response received to subscription message"
                    ))
        
        except websockets.exceptions.ConnectionClosedError:
            print(f"  ❌ Connection to {endpoint} was closed unexpectedly")
            self.test_results.append(EnvelopeTestResult(
                endpoint=endpoint,
                test_type="connection",
                success=False,
                message="Connection closed unexpectedly"
            ))
        except Exception as e:
            print(f"  ❌ Failed to connect to {endpoint}: {e}")
            self.test_results.append(EnvelopeTestResult(
                endpoint=endpoint,
                test_type="connection",
                success=False,
                message=f"Connection failed: {e}"
            ))

    async def _test_connection_establishment(self):
        """Test that connection establishment messages follow envelope pattern"""
        print(f"\n🔗 Testing connection establishment patterns...")
        
        # This should test the basic WebSocket endpoint that's likely to exist
        uri = f"{self.base_url}/ws/test"
        
        try:
            async with websockets.connect(uri, timeout=5) as websocket:
                # Connection establishment should send a proper envelope
                initial_message = await asyncio.wait_for(websocket.recv(), timeout=2)
                result = await self._validate_message(initial_message, "/ws/test", "connection_established")
                self.test_results.append(result)
                
                # Check that the message type indicates connection
                message_data = json.loads(initial_message)
                if message_data.get("type") not in ["connection_established", "connected", "welcome"]:
                    self.test_results.append(EnvelopeTestResult(
                        endpoint="/ws/test",
                        test_type="connection_message_type",
                        success=False,
                        message=f"Connection message should have appropriate type, got: {message_data.get('type')}",
                        received_data=message_data
                    ))
                else:
                    self.test_results.append(EnvelopeTestResult(
                        endpoint="/ws/test",
                        test_type="connection_message_type",
                        success=True,
                        message="Connection message type is appropriate",
                        received_data=message_data
                    ))
                    
        except Exception as e:
            print(f"  ⚠️ Could not test connection establishment: {e}")

    async def _test_error_scenarios(self):
        """Test that error responses follow envelope pattern"""
        print(f"\n❌ Testing error scenario envelope compliance...")
        
        # Try to connect to a non-existent endpoint to trigger errors
        uri = f"{self.base_url}/ws/nonexistent"
        
        try:
            async with websockets.connect(uri, timeout=5) as websocket:
                # Send an invalid message to trigger an error response
                await websocket.send("invalid json")
                
                try:
                    error_response = await asyncio.wait_for(websocket.recv(), timeout=2)
                    result = await self._validate_message(error_response, "/ws/nonexistent", "error_response")
                    result.test_type = "error_envelope"
                    self.test_results.append(result)
                    
                    # Verify it's actually an error message
                    message_data = json.loads(error_response)
                    if message_data.get("status") != "error":
                        self.test_results.append(EnvelopeTestResult(
                            endpoint="/ws/nonexistent", 
                            test_type="error_status_check",
                            success=False,
                            message="Error response should have status='error'",
                            received_data=message_data
                        ))
                        
                except asyncio.TimeoutError:
                    print(f"  ⚠️ No error response received")
                    
        except Exception as e:
            print(f"  ℹ️ Error scenario test completed with exception (expected): {e}")

    async def _test_subscription_messages(self):
        """Test subscription/unsubscription message compliance"""
        print(f"\n📋 Testing subscription message envelope compliance...")
        
        uri = f"{self.base_url}/ws/realtime"
        
        try:
            async with websockets.connect(uri, timeout=5) as websocket:
                # Test subscription
                subscribe_msg = {
                    "type": "subscribe",
                    "data": {"player_id": "aaron_judge", "game_id": 12345}
                }
                
                await websocket.send(json.dumps(subscribe_msg))
                
                try:
                    sub_response = await asyncio.wait_for(websocket.recv(), timeout=2)
                    result = await self._validate_message(sub_response, "/ws/realtime", "subscription")
                    self.test_results.append(result)
                except asyncio.TimeoutError:
                    pass
                
                # Test unsubscription  
                unsubscribe_msg = {
                    "type": "unsubscribe",
                    "data": {"player_id": "aaron_judge"}
                }
                
                await websocket.send(json.dumps(unsubscribe_msg))
                
                try:
                    unsub_response = await asyncio.wait_for(websocket.recv(), timeout=2)
                    result = await self._validate_message(unsub_response, "/ws/realtime", "unsubscription")
                    self.test_results.append(result)
                except asyncio.TimeoutError:
                    pass
                    
        except Exception as e:
            print(f"  ⚠️ Could not test subscription messages: {e}")

    async def _test_heartbeat_messages(self):
        """Test heartbeat/ping-pong message compliance"""
        print(f"\n💓 Testing heartbeat message envelope compliance...")
        
        uri = f"{self.base_url}/ws/realtime"
        
        try:
            async with websockets.connect(uri, timeout=5) as websocket:
                # Send ping
                ping_msg = {
                    "type": "ping",
                    "data": {"timestamp": datetime.now().isoformat()}
                }
                
                await websocket.send(json.dumps(ping_msg))
                
                try:
                    pong_response = await asyncio.wait_for(websocket.recv(), timeout=2)
                    result = await self._validate_message(pong_response, "/ws/realtime", "pong")
                    self.test_results.append(result)
                    
                    # Verify it's a pong message
                    message_data = json.loads(pong_response)
                    if message_data.get("type") != "pong":
                        self.test_results.append(EnvelopeTestResult(
                            endpoint="/ws/realtime",
                            test_type="pong_type_check",
                            success=False,
                            message="Response to ping should be type='pong'",
                            received_data=message_data
                        ))
                        
                except asyncio.TimeoutError:
                    print(f"  ⚠️ No pong response received")
                    
        except Exception as e:
            print(f"  ⚠️ Could not test heartbeat messages: {e}")

    async def _validate_message(self, message: str, endpoint: str, test_type: str) -> EnvelopeTestResult:
        """Validate a WebSocket message for envelope compliance"""
        try:
            message_data = json.loads(message)
            result = self.validator.validate_envelope(message_data)
            result.endpoint = endpoint
            result.test_type = test_type
            
            if result.success:
                print(f"    ✅ {test_type}: Envelope compliant")
            else:
                print(f"    ❌ {test_type}: {result.message}")
            
            return result
            
        except json.JSONDecodeError as e:
            return EnvelopeTestResult(
                endpoint=endpoint,
                test_type=test_type,
                success=False,
                message=f"Message is not valid JSON: {e}",
                received_data={"raw_message": message}
            )

    def generate_report(self) -> Dict[str, Any]:
        """Generate a comprehensive test report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r.success])
        failed_tests = total_tests - passed_tests
        
        # Group failures by type
        failures_by_type = {}
        for result in self.test_results:
            if not result.success:
                failure_type = result.test_type
                if failure_type not in failures_by_type:
                    failures_by_type[failure_type] = []
                failures_by_type[failure_type].append(result)
        
        # Group successes by endpoint
        successes_by_endpoint = {}
        for result in self.test_results:
            if result.success:
                endpoint = result.endpoint
                if endpoint not in successes_by_endpoint:
                    successes_by_endpoint[endpoint] = []
                successes_by_endpoint[endpoint].append(result)
        
        return {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0
            },
            "failures_by_type": {
                failure_type: [
                    {
                        "endpoint": r.endpoint,
                        "message": r.message,
                        "received_data": r.received_data
                    } for r in results
                ] for failure_type, results in failures_by_type.items()
            },
            "successes_by_endpoint": {
                endpoint: len(results) for endpoint, results in successes_by_endpoint.items()
            },
            "detailed_results": [
                {
                    "endpoint": r.endpoint,
                    "test_type": r.test_type,
                    "success": r.success,
                    "message": r.message,
                    "received_data": r.received_data
                } for r in self.test_results
            ]
        }


async def run_websocket_envelope_smoke_tests():
    """Main function to run WebSocket envelope smoke tests"""
    print("🚀 Starting WebSocket Envelope Pattern Compliance Smoke Tests")
    print("=" * 70)
    
    tester = WebSocketEnvelopeSmokeTester()
    results = await tester.run_all_tests()
    
    print("\n" + "=" * 70)
    print("📊 SMOKE TEST RESULTS")
    print("=" * 70)
    
    report = tester.generate_report()
    
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"✅ Passed: {report['summary']['passed']}")
    print(f"❌ Failed: {report['summary']['failed']}")
    print(f"📈 Success Rate: {report['summary']['success_rate']:.1f}%")
    
    if report['summary']['failed'] > 0:
        print(f"\n❌ FAILURES BY TYPE:")
        for failure_type, failures in report['failures_by_type'].items():
            print(f"  {failure_type}: {len(failures)} failures")
            for failure in failures:
                print(f"    - {failure['endpoint']}: {failure['message']}")
    
    if report['successes_by_endpoint']:
        print(f"\n✅ SUCCESSES BY ENDPOINT:")
        for endpoint, count in report['successes_by_endpoint'].items():
            print(f"  {endpoint}: {count} tests passed")
    
    return report


if __name__ == "__main__":
    import asyncio
    
    # Run the smoke tests
    asyncio.run(run_websocket_envelope_smoke_tests())
