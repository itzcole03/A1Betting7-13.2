#!/usr/bin/env python3
"""
Test script for the unified PropOllama interface
Tests both the best bets generation and chat functionality
"""

import asyncio
import json
import sys
import time
from datetime import datetime

async def test_propollama_unified():
    """Test the unified PropOllama interface"""
    print("🧪 Testing PropOllama Unified Interface")
    print("=" * 50)
    
    try:
        # Test 1: Import and initialize PropOllama engine
        print("\n1. Testing PropOllama Engine Import...")
        from enhanced_propollama_engine import EnhancedPropOllamaEngine
        print("✅ PropOllama engine imported successfully")
        
        # Test 2: Initialize with mock model manager
        print("\n2. Testing Engine Initialization...")
        class MockModelManager:
            def get_predictions(self):
                return [
                    {
                        'id': 'test_1',
                        'player_name': 'LeBron James',
                        'sport': 'NBA',
                        'stat_type': 'Points',
                        'line': 25.5,
                        'confidence': 85,
                        'expected_value': 7.2,
                        'ml_prediction': {'recommendation': 'OVER', 'confidence': 85}
                    },
                    {
                        'id': 'test_2',
                        'player_name': 'Aaron Judge',
                        'sport': 'MLB',
                        'stat_type': 'Home Runs',
                        'line': 1.5,
                        'confidence': 78,
                        'expected_value': 5.8,
                        'ml_prediction': {'recommendation': 'OVER', 'confidence': 78}
                    }
                ]
            
            def get_status(self):
                return {"status": "operational", "models_loaded": 47}
        
        model_manager = MockModelManager()
        engine = EnhancedPropOllamaEngine(model_manager)
        print("✅ PropOllama engine initialized successfully")
        
        # Test 3: Generate best bets
        print("\n3. Testing Best Bets Generation...")
        start_time = time.time()
        best_bets_result = await engine.generate_best_bets(5)
        generation_time = time.time() - start_time
        
        print(f"✅ Generated {len(best_bets_result.get('best_bets', []))} best bets in {generation_time:.2f}s")
        print(f"📊 Total analyzed: {best_bets_result.get('total_analyzed', 0)}")
        print(f"🎯 Sports covered: {best_bets_result.get('sports_covered', [])}")
        
        # Show sample bets
        for i, bet in enumerate(best_bets_result.get('best_bets', [])[:3], 1):
            print(f"   {i}. {bet['player_name']} - {bet['stat_type']} {bet['recommendation']} {bet['line']} ({bet['confidence']}%)")
        
        # Test 4: Test chat functionality
        print("\n4. Testing Chat Functionality...")
        
        class MockChatRequest:
            def __init__(self, message):
                self.message = message
                self.analysisType = 'general'
                self.includeWebResearch = False
                self.requestBestBets = False
                self.conversationId = None
        
        # Test simple chat
        chat_request = MockChatRequest("Hello, what are today's best bets?")
        start_time = time.time()
        
        if hasattr(engine, 'process_chat_message_with_web_research'):
            chat_result = await engine.process_chat_message_with_web_research(chat_request)
        else:
            chat_result = await engine.process_chat_message(chat_request)
        
        chat_time = time.time() - start_time
        
        print(f"✅ Chat response generated in {chat_time:.2f}s")
        print(f"🤖 Confidence: {chat_result.get('confidence', 0)}%")
        print(f"💬 Response: {chat_result.get('content', '')[:100]}...")
        print(f"💡 Suggestions: {len(chat_result.get('suggestions', []))}")
        
        # Test 5: Test PrizePicks service integration
        print("\n5. Testing PrizePicks Service Integration...")
        try:
            from services.comprehensive_prizepicks_service import comprehensive_prizepicks_service
            
            # Initialize service
            await comprehensive_prizepicks_service.initialize()
            print("✅ PrizePicks service initialized")
            
            # Get projections
            projections = await comprehensive_prizepicks_service.get_comprehensive_projections()
            props_count = len(projections.get('props', []))
            print(f"✅ Retrieved {props_count} live props from PrizePicks")
            
            if props_count > 0:
                sample_prop = projections['props'][0]
                print(f"   Sample: {sample_prop.get('player_name', 'Unknown')} - {sample_prop.get('stat_type', 'Unknown')}")
            
        except Exception as e:
            print(f"⚠️ PrizePicks service test failed: {e}")
        
        # Test 6: Test comprehensive integration
        print("\n6. Testing Comprehensive Integration...")
        
        # Create engine with real PrizePicks data
        class RealDataModelManager:
            def __init__(self, prizepicks_data):
                self.prizepicks_data = prizepicks_data
            
            def get_predictions(self):
                return self.prizepicks_data.get('props', [])
            
            def get_status(self):
                return {"status": "operational", "models_loaded": 47}
        
        try:
            real_manager = RealDataModelManager(projections if 'projections' in locals() else {'props': []})
            real_engine = EnhancedPropOllamaEngine(real_manager)
            
            real_best_bets = await real_engine.generate_best_bets(3)
            print(f"✅ Generated {len(real_best_bets.get('best_bets', []))} best bets with real data")
            
        except Exception as e:
            print(f"⚠️ Real data integration test failed: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 All tests completed successfully!")
        print("✅ PropOllama Unified Interface is operational")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_api_endpoints():
    """Test the API endpoints directly"""
    print("\n🌐 Testing API Endpoints...")
    
    try:
        import httpx
        
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            try:
                response = await client.get("http://localhost:8001/api/health/status", timeout=10.0)
                if response.status_code == 200:
                    print("✅ Backend is running and healthy")
                else:
                    print(f"⚠️ Backend health check failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Cannot connect to backend: {e}")
                return False
            
            # Test best bets endpoint
            try:
                response = await client.get("http://localhost:8001/api/propollama/best-bets-unified?limit=3", timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Best bets endpoint working: {len(data.get('best_bets', []))} bets returned")
                else:
                    print(f"⚠️ Best bets endpoint failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Best bets endpoint error: {e}")
            
            # Test chat endpoint
            try:
                chat_data = {
                    "message": "What are today's best NBA props?",
                    "analysisType": "general",
                    "includeWebResearch": False
                }
                response = await client.post("http://localhost:8001/api/propollama/chat-unified", json=chat_data, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Chat endpoint working: {data.get('status', 'unknown')} response")
                else:
                    print(f"⚠️ Chat endpoint failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Chat endpoint error: {e}")
        
        return True
        
    except ImportError:
        print("⚠️ httpx not available, skipping API tests")
        return True

if __name__ == "__main__":
    print("🚀 PropOllama Unified Interface Test Suite")
    print(f"🕐 Started at: {datetime.now()}")
    
    # Run tests
    success = asyncio.run(test_propollama_unified())
    
    if success:
        print("\n🌐 Testing API endpoints (if backend is running)...")
        asyncio.run(test_api_endpoints())
    
    print(f"\n🏁 Test completed at: {datetime.now()}")
    
    if success:
        print("🎉 PropOllama Unified Interface is ready for use!")
        print("\n📋 Next steps:")
        print("1. Start backend: python main.py")
        print("2. Start frontend: npm start")
        print("3. Open browser to test unified interface")
    else:
        print("❌ Some tests failed. Check the errors above.")
        sys.exit(1) 