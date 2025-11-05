#!/usr/bin/env python3
"""
Ollama Integration Test - Verify AI-powered sports analytics functionality
Tests the complete Ollama service integration including streaming responses
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# Add backend to path for imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from backend.services.ollama_service import get_ollama_service, ExplainRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ollama_health():
    """Test Ollama service health check"""
    print("🔍 Testing Ollama Health Check...")
    
    ollama_service = get_ollama_service()
    
    try:
        is_available = await ollama_service.check_availability()
        print(f"✅ Ollama availability: {'Available' if is_available else 'Unavailable'}")
        
        if is_available:
            models = await ollama_service.get_available_models()
            print(f"📋 Available models: {models}")
        else:
            print("⚠️ Ollama service not available - check if running on localhost:11434")
            
        return is_available
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

async def test_streaming_explanation():
    """Test streaming AI explanation"""
    print("\n🧠 Testing Streaming AI Explanation...")
    
    ollama_service = get_ollama_service()
    
    request = ExplainRequest(
        context="""Player: Aaron Judge (OF, New York Yankees)
Season Stats: {"hits": 148, "home_runs": 37, "rbis": 98, "batting_average": 0.267, "ops": 0.889}
Sport: MLB
Recent Form: 3 hits in last 5 games""",
        question="Analyze this player's prop betting opportunities for hits and home runs. What trends should bettors consider?",
        player_ids=["aaron-judge"],
        sport="MLB",
        include_trends=True,
        include_matchups=True
    )
    
    try:
        print("🔄 Generating explanation...")
        full_response = ""
        chunk_count = 0
        
        async for chunk in ollama_service.explain_player_analysis(request):
            full_response += chunk
            chunk_count += 1
            
            # Print first few chunks to show streaming
            if chunk_count <= 3:
                print(f"📝 Chunk {chunk_count}: {chunk[:50]}...")
        
        print(f"\n✅ Explanation complete! Total chunks: {chunk_count}")
        print(f"📊 Response length: {len(full_response)} characters")
        
        if full_response:
            print("\n📄 Sample output:")
            print(full_response[:200] + "..." if len(full_response) > 200 else full_response)
            return True
        else:
            print("⚠️ No response generated")
            return False
            
    except Exception as e:
        print(f"❌ Explanation test failed: {e}")
        return False

async def test_prop_analysis():
    """Test prop betting analysis"""
    print("\n⚾ Testing Prop Analysis...")
    
    ollama_service = get_ollama_service()
    
    prop_data = {
        "player_name": "Aaron Judge",
        "stat_type": "home_runs",
        "line": 0.5,
        "odds": "-110",
        "recent_performance": "2 home runs in last 10 games"
    }
    
    try:
        print("🔄 Analyzing prop opportunity...")
        full_response = ""
        
        async for chunk in ollama_service.analyze_prop_opportunity(prop_data):
            full_response += chunk
        
        if full_response:
            print("✅ Prop analysis complete!")
            print(f"📊 Response length: {len(full_response)} characters")
            print("\n📄 Sample output:")
            print(full_response[:200] + "..." if len(full_response) > 200 else full_response)
            return True
        else:
            print("⚠️ No analysis generated")
            return False
            
    except Exception as e:
        print(f"❌ Prop analysis test failed: {e}")
        return False

async def test_player_summary():
    """Test player research summary"""
    print("\n👤 Testing Player Summary...")
    
    ollama_service = get_ollama_service()
    
    player_stats = {
        "name": "Aaron Judge",
        "position": "OF",
        "team": "New York Yankees",
        "season_stats": {
            "hits": 148,
            "home_runs": 37,
            "rbis": 98,
            "batting_average": 0.267,
            "ops": 0.889,
            "games_played": 158
        },
        "recent_trends": "Strong September performance with 8 home runs"
    }
    
    matchup_data = {
        "opponent": "Toronto Blue Jays",
        "pitcher": "RHP",
        "ballpark": "Yankee Stadium"
    }
    
    try:
        print("🔄 Generating player summary...")
        full_response = ""
        
        async for chunk in ollama_service.generate_research_summary(player_stats, matchup_data):
            full_response += chunk
        
        if full_response:
            print("✅ Player summary complete!")
            print(f"📊 Response length: {len(full_response)} characters")
            print("\n📄 Sample output:")
            print(full_response[:200] + "..." if len(full_response) > 200 else full_response)
            return True
        else:
            print("⚠️ No summary generated")
            return False
            
    except Exception as e:
        print(f"❌ Player summary test failed: {e}")
        return False

async def main():
    """Run all Ollama integration tests"""
    print("🚀 A1Betting Ollama Integration Test Suite")
    print("=" * 50)
    
    # Check environment
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    print(f"🔗 Ollama URL: {ollama_url}")
    
    test_results = []
    
    # Run tests
    test_results.append(await test_ollama_health())
    test_results.append(await test_streaming_explanation())
    test_results.append(await test_prop_analysis())
    test_results.append(await test_player_summary())
    
    # Summary
    print("\n📊 Test Results Summary")
    print("=" * 30)
    
    passed = sum(test_results)
    total = len(test_results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed! Ollama integration is working correctly.")
        return 0
    else:
        print("\n⚠️ Some tests failed. Check Ollama service status.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
