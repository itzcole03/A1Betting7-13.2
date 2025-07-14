#!/usr/bin/env python3
"""
Test script for enhanced PrizePicks service
"""

import asyncio
import sys
import os
sys.path.append('backend')

from backend.services.enhanced_prizepicks_service import enhanced_prizepicks_service

async def test_service():
    try:
        print("🔄 Testing enhanced PrizePicks service...")
        
        # Initialize service
        success = await enhanced_prizepicks_service.initialize()
        print(f"Initialization: {'✅ Success' if success else '❌ Failed'}")
        
        if success:
            # Fetch props
            props = await enhanced_prizepicks_service.scrape_prizepicks_props()
            print(f"✅ Enhanced service working! Found {len(props)} props")
            
            # Show sample props
            for i, prop in enumerate(props[:3]):
                print(f"  {i+1}. {prop['player_name']} - {prop['stat_type']} {prop['line_score']} ({prop['sport']})")
            
            # Check health
            health = enhanced_prizepicks_service.get_scraper_health()
            print(f"Health status: {health['status']}")
            
            # Clean up
            await enhanced_prizepicks_service.close()
            
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_service())
    print(f"\n🏆 Test result: {'PASSED' if result else 'FAILED'}")
