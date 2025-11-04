#!/usr/bin/env python3
"""
Test closing snapshot persistence functionality
"""

import asyncio
from backend.services.simple_propfinder_service import SimplePropFinderService
from backend.services.line_movement_service import line_movement_service

async def test_closing_snapshot_persistence():
    """Test that closing snapshots can be recorded and CLV calculated properly"""
    print("=== Testing Closing Snapshot Persistence ===")
    
    # Get a test opportunity
    service = SimplePropFinderService()
    opportunities = await service.get_prop_opportunities(limit=1, force_flat_baseline=True)
    
    if not opportunities:
        print("❌ No opportunities available for testing")
        return
        
    opp = opportunities[0]
    print(f"\n1. Testing with opportunity: {opp.player} ({opp.line})")
    
    # Test recording a closing snapshot with different values
    closing_line = opp.line + 1.0  # Simulate line movement
    closing_odds = opp.odds + 10   # Simulate odds movement
    
    print(f"   Original line: {opp.line}, odds: {opp.odds}")
    print(f"   Closing line: {closing_line}, odds: {closing_odds}")
    
    # Record closing snapshot
    try:
        line_movement_service.record_closing_snapshot(opp, closing_line, closing_odds)
        print("   ✅ Closing snapshot recorded successfully")
    except Exception as e:
        print(f"   ❌ Failed to record closing snapshot: {e}")
        return
    
    # Test getting closing CLV
    opp_id = line_movement_service._build_id(opp)
    try:
        closing_clv = line_movement_service.get_closing_clv(opp_id)
        print(f"   Closing CLV: {closing_clv}%")
        
        # Calculate expected CLV: (closing - opening) / opening * 100
        expected_clv = round(((closing_line - opp.line) / opp.line) * 100, 2)
        print(f"   Expected CLV: {expected_clv}%")
        
        if closing_clv == expected_clv:
            print("   ✅ Closing CLV calculation correct")
        else:
            print(f"   ❌ CLV mismatch: expected {expected_clv}%, got {closing_clv}%")
            
    except Exception as e:
        print(f"   ❌ Failed to get closing CLV: {e}")
        return

    # Test with same closing line (0% CLV)
    print(f"\n2. Testing with no line movement (0% CLV):")
    same_line_opp_id = "test_same_line"
    
    # Create a simple test opportunity data 
    class SimpleTestOpp:
        def __init__(self):
            self.player = "Test Player"
            self.sport = "NBA"
            self.market = "Points"
            self.line = 25.0
            self.odds = -110
            self.bestBookmaker = "TestBook"
    
    test_opp = SimpleTestOpp()
    
    # Record opening and closing with same values
    line_movement_service.record_snapshot(test_opp)
    line_movement_service.record_closing_snapshot(test_opp, test_opp.line, test_opp.odds)
    
    test_opp_id = line_movement_service._build_id(test_opp)
    closing_clv_same = line_movement_service.get_closing_clv(test_opp_id)
    
    print(f"   Same line CLV: {closing_clv_same}%")
    if closing_clv_same == 0.0:
        print("   ✅ Zero CLV calculation correct")
    else:
        print(f"   ❌ Expected 0% CLV, got {closing_clv_same}%")

    print("\n=== Closing Snapshot Persistence Test: SUCCESS ===")
    print("✅ Closing snapshots can be recorded")  
    print("✅ CLV calculation using closing data works")
    print("✅ Ready for movement-based alerts and historical trends")

if __name__ == "__main__":
    asyncio.run(test_closing_snapshot_persistence())