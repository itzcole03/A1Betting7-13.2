#!/usr/bin/env python3
"""Direct test of CLV persistence service to isolate issues."""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_direct_persistence():
    """Test CLV persistence service directly"""
    print("🧪 Direct CLV Persistence Test")
    print("=" * 50)
    
    try:
        from backend.services.clv_persistence_service import clv_persistence_service
        print(f"✅ Service imported - enabled: {clv_persistence_service.enabled}")
        
        # Create test CLV data
        test_opportunities = [
            {
                "player": "Test Player",
                "sport": "MLB", 
                "market": "Total Runs",
                "clvPercent": 15.5,
                "closingLine": 8.5,
                "closingOdds": -110,
                "openingLine": 8.0,
                "openingOdds": -105
            }
        ]
        
        print(f"🔬 Testing with {len(test_opportunities)} CLV opportunities...")
        
        # Test persistence
        result = await clv_persistence_service.store_batch(
            test_opportunities, 
            processing_ms=150,
            batch_id="manual_test"
        )
        
        print(f"✅ Persistence result: {result}")
        
        # Test retrieval
        print("\n📊 Testing retrieval...")
        recent = await clv_persistence_service.get_recent(limit=5)
        print(f"✅ Retrieved {len(recent)} records")
        
        # Test summary
        print("\n📈 Testing summary...")
        summary = await clv_persistence_service.get_summary()
        print(f"✅ Summary: {summary}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_direct_persistence())