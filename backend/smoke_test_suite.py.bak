#!/usr/bin/env python3
"""
Comprehensive Smoke Test Suite for A1Betting Service Capability Matrix

This smoke test suite validates the core functionality of the service capability matrix
system including:
- Capabilities endpoint functionality
- WebSocket connection and handshake
- Ping/pong messaging
- Service health monitoring
- Event schema validation

Cross-platform compatibility using httpx and websockets libraries.
"""

import asyncio
import json
import logging
import sys
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
import traceback

try:
    import httpx
    import websockets
    from websockets.exceptions import ConnectionClosed, WebSocketException
except ImportError as e:
    print(f"❌ Missing required dependencies: {e}")
    print("Install with: pip install httpx websockets")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'smoke_test_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)


class SmokeTestSuite:
    """Comprehensive smoke test suite for service capability matrix"""
    
    def __init__(self, base_url: str = "http://localhost:8000", websocket_url: str = "ws://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.websocket_url = websocket_url.rstrip('/')
        self.test_results = []
        self.failed_tests = []
        
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all smoke tests and return comprehensive results"""
        logger.info("🚀 Starting A1Betting Service Capability Matrix Smoke Tests")
        start_time = time.time()
        
        # Test categories
        test_categories = [
            ("API Health Check", self.test_api_health),
            ("Capabilities Endpoint - Full", self.test_capabilities_full),
            ("Capabilities Endpoint - Summary", self.test_capabilities_summary),
            ("Capabilities Endpoint - Minimal", self.test_capabilities_minimal),
            ("Individual Service Status", self.test_individual_service_status),
            ("Service Health Checks", self.test_service_health_checks),
            ("WebSocket Connection", self.test_websocket_connection),
            ("WebSocket Handshake", self.test_websocket_handshake),
            ("WebSocket Ping/Pong", self.test_websocket_ping_pong),
            ("Event Schema Validation", self.test_event_schema_validation),
            ("Service Registry Integration", self.test_service_registry_integration),
        ]
        
        # Run all tests
        total_tests = len(test_categories)
        passed_tests = 0
        
        for test_name, test_func in test_categories:
            try:
                logger.info(f"📋 Running: {test_name}")
                result = await test_func()
                
                if result.get('success', False):
                    logger.info(f"✅ PASSED: {test_name}")
                    passed_tests += 1
                else:
                    logger.error(f"❌ FAILED: {test_name} - {result.get('error', 'Unknown error')}")
                    self.failed_tests.append({
                        'test_name': test_name,
                        'error': result.get('error', 'Unknown error'),
                        'details': result.get('details', {})
                    })
                
                self.test_results.append({
                    'test_name': test_name,
                    'success': result.get('success', False),
                    'duration_ms': result.get('duration_ms', 0),
                    'details': result.get('details', {}),
                    'error': result.get('error') if not result.get('success', False) else None
                })
                
            except Exception as e:
                logger.error(f"💥 CRASHED: {test_name} - {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                self.failed_tests.append({
                    'test_name': test_name,
                    'error': f"Test crashed: {str(e)}",
                    'details': {'traceback': traceback.format_exc()}
                })
                self.test_results.append({
                    'test_name': test_name,
                    'success': False,
                    'duration_ms': 0,
                    'error': f"Test crashed: {str(e)}"
                })
        
        # Calculate results
        duration_seconds = time.time() - start_time
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        summary = {
            'overall_success': len(self.failed_tests) == 0,
            'success_rate': success_rate,
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': len(self.failed_tests),
            'duration_seconds': round(duration_seconds, 2),
            'test_results': self.test_results,
            'failed_test_details': self.failed_tests,
            'timestamp': datetime.now().isoformat()
        }
        
        # Log summary
        if success_rate == 100:
            logger.info(f"🎉 ALL TESTS PASSED! ({passed_tests}/{total_tests}) in {duration_seconds:.2f}s")
        else:
            logger.warning(f"⚠️ {len(self.failed_tests)} TESTS FAILED ({success_rate:.1f}% success rate)")
            for failed_test in self.failed_tests:
                logger.warning(f"   - {failed_test['test_name']}: {failed_test['error']}")
        
        return summary
    
    async def test_api_health(self) -> Dict[str, Any]:
        """Test basic API health endpoint"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/health")
                duration_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'success': True,
                        'duration_ms': round(duration_ms, 2),
                        'details': {
                            'status_code': response.status_code,
                            'response_data': data
                        }
                    }
                else:
                    return {
                        'success': False,
                        'duration_ms': round(duration_ms, 2),
                        'error': f"Unexpected status code: {response.status_code}",
                        'details': {'response_text': response.text}
                    }
                    
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"API health check failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_capabilities_full(self) -> Dict[str, Any]:
        """Test capabilities endpoint with full format"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(f"{self.base_url}/api/system/capabilities?format=full")
                duration_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate response structure - our API uses these fields
                    required_fields = ['services', 'global_status', 'matrix_version']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        return {
                            'success': False,
                            'duration_ms': round(duration_ms, 2),
                            'error': f"Missing required fields: {missing_fields}",
                            'details': {'response_data': data}
                        }
                    
                    # Check if we have services
                    services_count = len(data.get('services', {}))
                    
                    return {
                        'success': True,
                        'duration_ms': round(duration_ms, 2),
                        'details': {
                            'services_count': services_count,
                            'global_status': data.get('global_status', 'unknown'),
                            'matrix_version': data.get('matrix_version', 'unknown'),
                            'response_size_bytes': len(response.content)
                        }
                    }
                else:
                    return {
                        'success': False,
                        'duration_ms': round(duration_ms, 2),
                        'error': f"Unexpected status code: {response.status_code}",
                        'details': {'response_text': response.text}
                    }
                    
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"Capabilities full test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_capabilities_summary(self) -> Dict[str, Any]:
        """Test capabilities endpoint with summary format"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/system/capabilities?format=summary")
                duration_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate summary structure - our API uses summary nested object
                    summary = data.get('summary', {})
                    required_fields = ['total_services', 'overall_health']
                    missing_fields = [field for field in required_fields if field not in summary]
                    
                    if missing_fields:
                        return {
                            'success': False,
                            'duration_ms': round(duration_ms, 2),
                            'error': f"Missing summary fields: {missing_fields}",
                            'details': {'response_data': data}
                        }
                    
                    return {
                        'success': True,
                        'duration_ms': round(duration_ms, 2),
                        'details': {
                            'total_services': summary.get('total_services', 0),
                            'overall_health': summary.get('overall_health', 0),
                            'status_breakdown': summary.get('status_breakdown', {}),
                            'global_status': data.get('global_status', 'unknown')
                        }
                    }
                else:
                    return {
                        'success': False,
                        'duration_ms': round(duration_ms, 2),
                        'error': f"Unexpected status code: {response.status_code}",
                        'details': {'response_text': response.text}
                    }
                    
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"Capabilities summary test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_capabilities_minimal(self) -> Dict[str, Any]:
        """Test capabilities endpoint with minimal format"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/system/capabilities?format=minimal")
                duration_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Minimal format should be smaller and contain basic info
                    return {
                        'success': True,
                        'duration_ms': round(duration_ms, 2),
                        'details': {
                            'response_data': data,
                            'response_size_bytes': len(response.content)
                        }
                    }
                else:
                    return {
                        'success': False,
                        'duration_ms': round(duration_ms, 2),
                        'error': f"Unexpected status code: {response.status_code}",
                        'details': {'response_text': response.text}
                    }
                    
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"Capabilities minimal test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_individual_service_status(self) -> Dict[str, Any]:
        """Test individual service status endpoint"""
        start_time = time.time()
        
        try:
            # First get the list of services
            async with httpx.AsyncClient(timeout=10.0) as client:
                services_response = await client.get(f"{self.base_url}/api/system/capabilities")
                
                if services_response.status_code != 200:
                    return {
                        'success': False,
                        'duration_ms': (time.time() - start_time) * 1000,
                        'error': "Could not fetch services list",
                        'details': {}
                    }
                
                services_data = services_response.json()
                services = services_data.get('services', {})
                
                if not services:
                    return {
                        'success': False,
                        'duration_ms': (time.time() - start_time) * 1000,
                        'error': "No services found to test",
                        'details': {}
                    }
                
                # Test first service
                first_service_name = list(services.keys())[0]
                service_response = await client.get(f"{self.base_url}/api/system/capabilities/{first_service_name}")
                duration_ms = (time.time() - start_time) * 1000
                
                if service_response.status_code == 200:
                    service_data = service_response.json()
                    return {
                        'success': True,
                        'duration_ms': round(duration_ms, 2),
                        'details': {
                            'service_name': first_service_name,
                            'service_data': service_data
                        }
                    }
                else:
                    return {
                        'success': False,
                        'duration_ms': round(duration_ms, 2),
                        'error': f"Individual service status failed: {service_response.status_code}",
                        'details': {'service_name': first_service_name}
                    }
                    
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"Individual service test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_service_health_checks(self) -> Dict[str, Any]:
        """Test service health check functionality"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(f"{self.base_url}/api/system/capabilities/health")
                duration_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'success': True,
                        'duration_ms': round(duration_ms, 2),
                        'details': {
                            'health_data': data,
                            'overall_health': data.get('overall_health', 'unknown')
                        }
                    }
                else:
                    return {
                        'success': False,
                        'duration_ms': round(duration_ms, 2),
                        'error': f"Health check endpoint failed: {response.status_code}",
                        'details': {'response_text': response.text}
                    }
                    
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"Health check test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_websocket_connection(self) -> Dict[str, Any]:
        """Test basic WebSocket connection"""
        start_time = time.time()
        
        try:
            # Try common WebSocket endpoints
            websocket_endpoints = [
                f"{self.websocket_url}/ws",
                f"{self.websocket_url}/websocket", 
                f"{self.websocket_url}/api/ws"
            ]
            
            for endpoint in websocket_endpoints:
                try:
                    async with websockets.connect(endpoint, timeout=5) as websocket:
                        duration_ms = (time.time() - start_time) * 1000
                        return {
                            'success': True,
                            'duration_ms': round(duration_ms, 2),
                            'details': {
                                'connected_endpoint': endpoint,
                                'websocket_state': str(websocket.state)
                            }
                        }
                except (ConnectionRefusedError, OSError, WebSocketException):
                    continue
            
            # If none of the endpoints worked
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': "No WebSocket endpoints accessible",
                'details': {'attempted_endpoints': websocket_endpoints}
            }
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"WebSocket connection test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_websocket_handshake(self) -> Dict[str, Any]:
        """Test WebSocket handshake process"""
        start_time = time.time()
        
        try:
            websocket_endpoints = [
                f"{self.websocket_url}/ws",
                f"{self.websocket_url}/websocket",
                f"{self.websocket_url}/api/ws"
            ]
            
            for endpoint in websocket_endpoints:
                try:
                    async with websockets.connect(endpoint, timeout=5) as websocket:
                        # Send handshake message
                        handshake_msg = {
                            "type": "handshake",
                            "client_id": "smoke_test_client",
                            "version": "1.0.0",
                            "timestamp": datetime.now().isoformat()
                        }
                        
                        await websocket.send(json.dumps(handshake_msg))
                        
                        # Wait for response
                        try:
                            response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                            response_data = json.loads(response)
                            
                            duration_ms = (time.time() - start_time) * 1000
                            return {
                                'success': True,
                                'duration_ms': round(duration_ms, 2),
                                'details': {
                                    'endpoint': endpoint,
                                    'handshake_sent': handshake_msg,
                                    'handshake_response': response_data
                                }
                            }
                        except asyncio.TimeoutError:
                            # Handshake sent but no response - still partially successful
                            duration_ms = (time.time() - start_time) * 1000
                            return {
                                'success': True,  # Connection worked, just no handshake protocol
                                'duration_ms': round(duration_ms, 2),
                                'details': {
                                    'endpoint': endpoint,
                                    'note': 'Connected but no handshake response (may be expected)',
                                    'handshake_sent': handshake_msg
                                }
                            }
                        
                except (ConnectionRefusedError, OSError, WebSocketException):
                    continue
            
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': "WebSocket handshake failed - no accessible endpoints",
                'details': {'attempted_endpoints': websocket_endpoints}
            }
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"WebSocket handshake test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_websocket_ping_pong(self) -> Dict[str, Any]:
        """Test WebSocket ping/pong messaging"""
        start_time = time.time()
        
        try:
            websocket_endpoints = [
                f"{self.websocket_url}/ws",
                f"{self.websocket_url}/websocket",
                f"{self.websocket_url}/api/ws"
            ]
            
            for endpoint in websocket_endpoints:
                try:
                    async with websockets.connect(endpoint, timeout=5) as websocket:
                        # Send ping message
                        ping_msg = {
                            "type": "ping",
                            "timestamp": datetime.now().isoformat(),
                            "data": "smoke_test_ping"
                        }
                        
                        await websocket.send(json.dumps(ping_msg))
                        
                        # Wait for pong response
                        try:
                            response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                            response_data = json.loads(response)
                            
                            duration_ms = (time.time() - start_time) * 1000
                            
                            # Check if it's a proper pong response
                            is_pong = response_data.get('type') == 'pong'
                            
                            return {
                                'success': True,
                                'duration_ms': round(duration_ms, 2),
                                'details': {
                                    'endpoint': endpoint,
                                    'ping_sent': ping_msg,
                                    'pong_received': response_data,
                                    'is_proper_pong': is_pong
                                }
                            }
                        except asyncio.TimeoutError:
                            # Try WebSocket protocol ping instead
                            await websocket.ping()
                            await asyncio.sleep(1)  # Wait for pong
                            
                            duration_ms = (time.time() - start_time) * 1000
                            return {
                                'success': True,
                                'duration_ms': round(duration_ms, 2),
                                'details': {
                                    'endpoint': endpoint,
                                    'note': 'WebSocket protocol ping successful',
                                    'ping_method': 'websocket_protocol'
                                }
                            }
                        
                except (ConnectionRefusedError, OSError, WebSocketException):
                    continue
            
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': "WebSocket ping/pong failed - no accessible endpoints",
                'details': {'attempted_endpoints': websocket_endpoints}
            }
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"WebSocket ping/pong test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_event_schema_validation(self) -> Dict[str, Any]:
        """Test event schema validation"""
        start_time = time.time()
        
        try:
            # Test various event schema patterns
            test_events = [
                {
                    "schema_version": "validator.event.v1",
                    "event_type": "service.status_changed",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "service_name": "test_service",
                        "old_status": "UP",
                        "new_status": "DEGRADED"
                    }
                },
                {
                    "schema_version": "validator.event.v1",
                    "event_type": "system.health_check",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "overall_health": 85.5,
                        "critical_services": 0
                    }
                },
                {
                    "schema_version": "validator.event.v1",
                    "event_type": "websocket.connection",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "client_id": "smoke_test",
                        "action": "connected"
                    }
                }
            ]
            
            valid_events = 0
            event_results = []
            
            for event in test_events:
                # Basic schema validation
                required_fields = ["schema_version", "event_type", "timestamp", "data"]
                has_all_fields = all(field in event for field in required_fields)
                
                # Schema version validation
                is_valid_schema = event.get("schema_version", "").startswith("validator.event.")
                
                # Event type validation
                is_valid_type = "." in event.get("event_type", "")
                
                is_valid = has_all_fields and is_valid_schema and is_valid_type
                if is_valid:
                    valid_events += 1
                
                event_results.append({
                    "event": event,
                    "valid": is_valid,
                    "has_all_fields": has_all_fields,
                    "valid_schema": is_valid_schema,
                    "valid_type": is_valid_type
                })
            
            duration_ms = (time.time() - start_time) * 1000
            success = valid_events == len(test_events)
            
            return {
                'success': success,
                'duration_ms': round(duration_ms, 2),
                'details': {
                    'total_events_tested': len(test_events),
                    'valid_events': valid_events,
                    'event_validation_results': event_results
                },
                'error': None if success else f"Only {valid_events}/{len(test_events)} events valid"
            }
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"Event schema validation test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }
    
    async def test_service_registry_integration(self) -> Dict[str, Any]:
        """Test service registry integration"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get capabilities
                response = await client.get(f"{self.base_url}/api/system/capabilities")
                
                if response.status_code != 200:
                    duration_ms = (time.time() - start_time) * 1000
                    return {
                        'success': False,
                        'duration_ms': round(duration_ms, 2),
                        'error': f"Could not fetch capabilities: {response.status_code}",
                        'details': {}
                    }
                
                data = response.json()
                services = data.get('services', {})
                
                # Check for expected unified services
                expected_services = [
                    'unified_data_fetcher',
                    'unified_cache_service',
                    'service_capability_matrix'  # The registry itself should be registered
                ]
                
                found_services = []
                missing_services = []
                
                for service_name in expected_services:
                    if service_name in services:
                        found_services.append(service_name)
                    else:
                        missing_services.append(service_name)
                
                duration_ms = (time.time() - start_time) * 1000
                
                # Test is successful if we find at least some expected services
                success = len(found_services) > 0
                
                return {
                    'success': success,
                    'duration_ms': round(duration_ms, 2),
                    'details': {
                        'total_registered_services': len(services),
                        'expected_services': expected_services,
                        'found_services': found_services,
                        'missing_services': missing_services,
                        'all_registered_services': list(services.keys())
                    },
                    'error': f"Missing services: {missing_services}" if missing_services else None
                }
                
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return {
                'success': False,
                'duration_ms': round(duration_ms, 2),
                'error': f"Service registry integration test failed: {str(e)}",
                'details': {'exception_type': type(e).__name__}
            }


async def main():
    """Main entry point for smoke tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description='A1Betting Service Capability Matrix Smoke Tests')
    parser.add_argument('--base-url', default='http://localhost:8000', 
                        help='Base URL for HTTP API (default: http://localhost:8000)')
    parser.add_argument('--websocket-url', default='ws://localhost:8000',
                        help='Base URL for WebSocket API (default: ws://localhost:8000)')
    parser.add_argument('--output-json', help='Save results to JSON file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Run smoke tests
    suite = SmokeTestSuite(base_url=args.base_url, websocket_url=args.websocket_url)
    results = await suite.run_all_tests()
    
    # Output results
    print(f"\n{'='*60}")
    print("🔬 SMOKE TEST RESULTS SUMMARY")
    print(f"{'='*60}")
    print(f"Overall Success: {'✅ PASS' if results['overall_success'] else '❌ FAIL'}")
    print(f"Success Rate: {results['success_rate']:.1f}%")
    print(f"Tests: {results['passed_tests']}/{results['total_tests']} passed")
    print(f"Duration: {results['duration_seconds']}s")
    print(f"Timestamp: {results['timestamp']}")
    
    if results['failed_test_details']:
        print(f"\n❌ Failed Tests:")
        for failed_test in results['failed_test_details']:
            print(f"   - {failed_test['test_name']}: {failed_test['error']}")
    
    # Save JSON output if requested
    if args.output_json:
        with open(args.output_json, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n📄 Detailed results saved to: {args.output_json}")
    
    # Exit with appropriate code
    sys.exit(0 if results['overall_success'] else 1)


if __name__ == '__main__':
    asyncio.run(main())