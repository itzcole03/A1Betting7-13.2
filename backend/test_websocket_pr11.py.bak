#!/usr/bin/env python3
"""
Test script for PR11 WebSocket Envelope System

Tests the enhanced WebSocket client route with envelope system
and checks if events are published to the observability event bus.
"""

import asyncio
import json
import websockets
import requests
from datetime import datetime


async def test_websocket_envelope():
    """Test WebSocket connection with envelope system"""
    
    print("🧪 Testing PR11 WebSocket Envelope System...")
    
    try:
        # Connect to the enhanced WebSocket endpoint
        uri = "ws://127.0.0.1:8000/ws/client?client_id=test-client-123&version=1&role=frontend"
        
        print(f"📡 Connecting to {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection established")
            
            # Listen for initial messages
            try:
                # Wait for potential hello message or connection confirmation
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Received: {message}")
                
                # Try to parse as envelope
                try:
                    envelope = json.loads(message)
                    print("📝 Message structure:")
                    for key, value in envelope.items():
                        print(f"  {key}: {value}")
                        
                    # Check if it's a valid envelope
                    if "envelope_version" in envelope:
                        print("✅ Valid PR11 envelope detected!")
                    else:
                        print("⚠️ Message does not appear to be in envelope format")
                        
                except json.JSONDecodeError:
                    print("⚠️ Received non-JSON message")
                    
            except asyncio.TimeoutError:
                print("⏰ No initial message received (this is okay)")
            
            # Send a test message
            test_msg = {"action": "ping", "data": "test"}
            print(f"📤 Sending test message: {test_msg}")
            await websocket.send(json.dumps(test_msg))
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Response: {response}")
                
                # Parse response envelope
                try:
                    envelope = json.loads(response)
                    if "envelope_version" in envelope:
                        print("✅ Response in envelope format!")
                        print(f"  Type: {envelope.get('type', 'unknown')}")
                        print(f"  Request ID: {envelope.get('request_id', 'none')}")
                    else:
                        print("⚠️ Response not in envelope format")
                except json.JSONDecodeError:
                    print("⚠️ Response is not JSON")
                    
            except asyncio.TimeoutError:
                print("⏰ No response received")
                
        print("🔌 WebSocket connection closed")
        
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")


def test_observability_api():
    """Test the observability API endpoints"""
    
    print("\n🔍 Testing Observability API...")
    
    base_url = "http://127.0.0.1:8000"
    
    # Test events endpoint
    print("📊 Testing events endpoint...")
    response = requests.get(f"{base_url}/api/v2/observability/events")
    if response.status_code == 200:
        data = response.json()
        events = data.get("data", {}).get("events", [])
        print(f"✅ Events endpoint working: {len(events)} events found")
        
        if events:
            print("📋 Recent events:")
            for event in events[:3]:  # Show first 3 events
                print(f"  - {event.get('event_type')} at {event.get('timestamp')}")
    else:
        print(f"❌ Events endpoint failed: {response.status_code}")
    
    # Test stats endpoint  
    print("📈 Testing stats endpoint...")
    response = requests.get(f"{base_url}/api/v2/observability/stats")
    if response.status_code == 200:
        data = response.json()
        stats = data.get("data", {})
        print("✅ Stats endpoint working:")
        print(f"  - WebSocket connections: {stats.get('websockets', {}).get('active_connections', 0)}")
        print(f"  - Event bus size: {stats.get('event_bus', {}).get('current_buffer_size', 0)}")
    else:
        print(f"❌ Stats endpoint failed: {response.status_code}")
        
    # Test health endpoint
    print("🏥 Testing health endpoint...")
    response = requests.get(f"{base_url}/api/v2/observability/health")
    if response.status_code == 200:
        data = response.json()
        status = data.get("data", {}).get("status", "unknown")
        print(f"✅ Health endpoint working: {status}")
    else:
        print(f"❌ Health endpoint failed: {response.status_code}")


async def main():
    """Main test function"""
    
    print("🚀 PR11 WebSocket Envelope & Observability Test Suite")
    print("=" * 60)
    
    # Test observability API first
    test_observability_api()
    
    # Test WebSocket with envelope system
    await test_websocket_envelope()
    
    # Check if WebSocket generated events
    print("\n🔍 Checking for WebSocket events after connection test...")
    response = requests.get("http://127.0.0.1:8000/api/v2/observability/events")
    if response.status_code == 200:
        data = response.json()
        events = data.get("data", {}).get("events", [])
        websocket_events = [e for e in events if "ws." in e.get("event_type", "")]
        
        if websocket_events:
            print(f"✅ Found {len(websocket_events)} WebSocket events!")
            for event in websocket_events:
                print(f"  - {event.get('event_type')} at {event.get('timestamp')}")
        else:
            print("ℹ️ No WebSocket events found (this might be expected if events aren't fully wired up yet)")
    
    print("\n" + "=" * 60)
    print("✅ PR11 test suite completed!")


if __name__ == "__main__":
    asyncio.run(main())