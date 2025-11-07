#!/usr/bin/env python3
"""
Test script to verify WebSocket implementation works correctly
"""
import asyncio
import json
import websockets
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_websocket_connection():
    """Test basic WebSocket connection and subscription functionality"""
    
    # Test basic connection
    try:
        logger.info("Testing basic WebSocket connection...")
        uri = "ws://localhost:8000/ws/v2/connect/"
        
        async with websockets.connect(uri) as websocket:
            logger.info("✅ Successfully connected to WebSocket")
            
            # Send authentication message
            auth_message = {
                "type": "authenticate",
                "token": "test-token",  # In a real app, this would be a valid JWT
                "anonymous": True
            }
            await websocket.send(json.dumps(auth_message))
            logger.info("📤 Sent authentication message")
            
            # Wait for auth response
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            auth_response = json.loads(response)
            logger.info(f"📥 Authentication response: {auth_response}")
            
            # Subscribe to MLB data
            subscribe_message = {
                "type": "subscribe",
                "rooms": ["sport:MLB", "odds:general"]
            }
            await websocket.send(json.dumps(subscribe_message))
            logger.info("📤 Sent subscription message")
            
            # Wait for subscription confirmation
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            sub_response = json.loads(response)
            logger.info(f"📥 Subscription response: {sub_response}")
            
            # Test heartbeat
            ping_message = {"type": "ping"}
            await websocket.send(json.dumps(ping_message))
            logger.info("📤 Sent ping message")
            
            # Wait for pong
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            pong_response = json.loads(response)
            logger.info(f"📥 Pong response: {pong_response}")
            
            # Wait for some data broadcasts (if any)
            logger.info("⏳ Waiting for data broadcasts...")
            try:
                for i in range(3):
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(response)
                    logger.info(f"📥 Received broadcast: {data.get('type', 'unknown')} - {data}")
            except asyncio.TimeoutError:
                logger.info("⌛ No broadcasts received within timeout (this is expected for new implementation)")
            
            logger.info("✅ WebSocket test completed successfully")
            
    except Exception as e:
        logger.error(f"❌ WebSocket test failed: {e}")
        return False
    
    return True

async def test_sport_specific_connection():
    """Test sport-specific WebSocket endpoint"""
    
    try:
        logger.info("Testing sport-specific WebSocket connection...")
        uri = "ws://localhost:8000/ws/v2/sport/MLB"
        
        async with websockets.connect(uri) as websocket:
            logger.info("✅ Successfully connected to sport-specific WebSocket")
            
            # Send authentication
            auth_message = {
                "type": "authenticate",
                "anonymous": True
            }
            await websocket.send(json.dumps(auth_message))
            
            # Wait for auth response
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            logger.info(f"📥 Sport-specific auth response: {json.loads(response)}")
            
            logger.info("✅ Sport-specific WebSocket test completed successfully")
            
    except Exception as e:
        logger.error(f"❌ Sport-specific WebSocket test failed: {e}")
        return False
    
    return True

async def main():
    """Run all WebSocket tests"""
    logger.info("🚀 Starting WebSocket implementation tests...")
    
    # Check if server is running first
    try:
        import requests
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        if response.status_code != 200:
            logger.error("❌ Backend server is not responding properly")
            return
        logger.info("✅ Backend server is running")
    except Exception as e:
        logger.error(f"❌ Cannot connect to backend server: {e}")
        logger.info("Please make sure the backend server is running with: python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload")
        return
    
    # Run WebSocket tests
    tests_passed = 0
    total_tests = 2
    
    if await test_websocket_connection():
        tests_passed += 1
    
    if await test_sport_specific_connection():
        tests_passed += 1
    
    logger.info(f"🏁 Tests completed: {tests_passed}/{total_tests} passed")
    
    if tests_passed == total_tests:
        logger.info("🎉 All WebSocket tests passed! Implementation is working correctly.")
    else:
        logger.warning("⚠️ Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    asyncio.run(main())
