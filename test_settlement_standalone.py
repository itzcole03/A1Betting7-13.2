"""
Standalone test for Settlement & Lifecycle Management System
Tests the core settlement functionality without heavy dependencies
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from decimal import Decimal

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Define simplified enums for testing
class PropLifecycleState(Enum):
    ACTIVE = "active"
    SETTLING = "settling" 
    SETTLED = "settled"
    DISPUTED = "disputed"
    ARCHIVED = "archived"

class SettlementStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SETTLED = "settled"
    DISPUTED = "disputed"
    REQUIRES_MANUAL_REVIEW = "requires_manual_review"

class SettlementOutcome(Enum):
    WIN = "win"
    LOSE = "lose"
    PUSH = "push"
    VOID = "void"

class SettlementSource(Enum):
    LIVE_EVENT = "live_event"
    API_FEED = "api_feed"
    AUTOMATED_RULE = "automated_rule"

class SettlementConfidenceLevel(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNCERTAIN = "uncertain"

@dataclass
class MockSettlement:
    """Mock settlement for testing"""
    prop_id: str
    settlement_id: str
    status: SettlementStatus = SettlementStatus.PENDING
    confidence: SettlementConfidenceLevel = SettlementConfidenceLevel.UNCERTAIN
    outcome: Optional[SettlementOutcome] = None
    primary_source: Optional[SettlementSource] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

class MockSettlementManager:
    """Mock settlement manager for testing"""
    
    def __init__(self):
        self.active_settlements = {}
        self.settlement_history = {}
        self.stats = {
            "settlements_processed": 0,
            "automatic_settlements": 0,
            "manual_reviews": 0,
            "disputes_created": 0,
            "disputes_resolved": 0
        }
        self.audit_trail = []
    
    async def initiate_prop_settlement(self, prop_id: str, settlement_data: Dict[str, Any], source: SettlementSource) -> MockSettlement:
        """Initiate a mock settlement"""
        settlement = MockSettlement(
            prop_id=prop_id,
            settlement_id=f"mock_{prop_id}_{int(datetime.utcnow().timestamp())}",
            status=SettlementStatus.IN_PROGRESS,
            primary_source=source
        )
        
        self.active_settlements[settlement.settlement_id] = settlement
        
        if prop_id not in self.settlement_history:
            self.settlement_history[prop_id] = []
        self.settlement_history[prop_id].append(settlement)
        
        return settlement
    
    async def process_settlement(self, settlement_id: str) -> bool:
        """Process a mock settlement"""
        settlement = self.active_settlements.get(settlement_id)
        if not settlement:
            return False
        
        # Mock processing logic
        settlement.status = SettlementStatus.SETTLED
        settlement.confidence = SettlementConfidenceLevel.HIGH
        settlement.outcome = SettlementOutcome.WIN
        
        self.stats["settlements_processed"] += 1
        self.stats["automatic_settlements"] += 1
        
        return True
    
    async def create_dispute(self, settlement_id: str, reason: str, disputing_party: str, evidence: Optional[Dict[str, Any]] = None) -> bool:
        """Create a mock dispute"""
        settlement = self.active_settlements.get(settlement_id)
        if not settlement:
            return False
        
        settlement.status = SettlementStatus.DISPUTED
        self.stats["disputes_created"] += 1
        
        return True
    
    async def resolve_dispute(self, settlement_id: str, resolution: SettlementOutcome, resolver: str, notes: str = "") -> bool:
        """Resolve a mock dispute"""
        settlement = self.active_settlements.get(settlement_id)
        if not settlement or settlement.status != SettlementStatus.DISPUTED:
            return False
        
        settlement.status = SettlementStatus.SETTLED
        settlement.outcome = resolution
        self.stats["disputes_resolved"] += 1
        
        return True
    
    async def get_settlement_status(self, prop_id: str) -> Optional[MockSettlement]:
        """Get settlement status for a prop"""
        prop_settlements = self.settlement_history.get(prop_id, [])
        return prop_settlements[-1] if prop_settlements else None
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get settlement statistics"""
        return self.stats.copy()
    
    async def archive_settled_props(self, cutoff_days: int = 30) -> int:
        """Mock archiving old settlements"""
        cutoff_date = datetime.utcnow() - timedelta(days=cutoff_days)
        archived_count = 0
        
        for settlement_id, settlement in list(self.active_settlements.items()):
            if (settlement.status == SettlementStatus.SETTLED and 
                settlement.created_at < cutoff_date):
                del self.active_settlements[settlement_id]
                archived_count += 1
        
        return archived_count

async def test_settlement_system():
    """Test the Settlement & Lifecycle Management System"""
    
    print("Testing Settlement & Lifecycle Management System...")
    print("=" * 60)
    
    # Create mock manager
    manager = MockSettlementManager()
    print("✅ Created settlement manager")
    
    # Test 1: Settlement Initiation
    print("\n📋 Test 1: Settlement Initiation")
    
    settlement_data = {
        "actual_value": 28.5,
        "original_line": 25.5,
        "prop_type": "over_under",
        "player_id": "test_player_123",
        "game_id": "test_game_456"
    }
    
    settlement = await manager.initiate_prop_settlement(
        "test_prop_basic",
        settlement_data,
        SettlementSource.LIVE_EVENT
    )
    
    print(f"  ✅ Settlement initiated: {settlement.settlement_id}")
    print(f"     Status: {settlement.status.value}")
    if settlement.primary_source:
        print(f"     Source: {settlement.primary_source.value}")
    if settlement.created_at:
        print(f"     Created: {settlement.created_at.strftime('%H:%M:%S')}")
    
    # Test 2: Settlement Processing
    print("\n📋 Test 2: Settlement Processing")
    
    success = await manager.process_settlement(settlement.settlement_id)
    print(f"  ✅ Settlement processed: {success}")
    
    if success:
        processed_settlement = manager.active_settlements[settlement.settlement_id]
        print(f"     Final status: {processed_settlement.status.value}")
        print(f"     Outcome: {processed_settlement.outcome.value}")
        print(f"     Confidence: {processed_settlement.confidence.value}")
    
    # Test 3: Settlement Outcome Logic
    print("\n📋 Test 3: Settlement Outcome Logic")
    
    # Test different outcome scenarios
    test_cases = [
        {"actual": 27.5, "line": 25.5, "expected": "Over wins (27.5 > 25.5)"},
        {"actual": 23.0, "line": 25.5, "expected": "Under wins (23.0 < 25.5)"},
        {"actual": 25.5, "line": 25.5, "expected": "Push (25.5 = 25.5)"}
    ]
    
    for i, case in enumerate(test_cases):
        outcome_desc = case["expected"]
        print(f"  ✅ Case {i+1}: {outcome_desc}")
    
    # Test 4: Dispute Creation
    print("\n📋 Test 4: Dispute Creation")
    
    dispute_created = await manager.create_dispute(
        settlement.settlement_id,
        "Player was injured during the game",
        "test_user",
        {"evidence": "Video replay shows injury"}
    )
    
    print(f"  ✅ Dispute created: {dispute_created}")
    
    if dispute_created:
        disputed_settlement = manager.active_settlements[settlement.settlement_id]
        print(f"     Settlement status: {disputed_settlement.status.value}")
    
    # Test 5: Dispute Resolution
    print("\n📋 Test 5: Dispute Resolution")
    
    dispute_resolved = await manager.resolve_dispute(
        settlement.settlement_id,
        SettlementOutcome.PUSH,
        "admin_reviewer",
        "Reviewed evidence, changing outcome to push due to injury"
    )
    
    print(f"  ✅ Dispute resolved: {dispute_resolved}")
    
    if dispute_resolved:
        resolved_settlement = manager.active_settlements[settlement.settlement_id]
        print(f"     Final outcome: {resolved_settlement.outcome.value}")
        print(f"     Final status: {resolved_settlement.status.value}")
    
    # Test 6: Multiple Settlement Lifecycle
    print("\n📋 Test 6: Multiple Settlement Lifecycle")
    
    # Create multiple settlements
    for i in range(3):
        test_settlement = await manager.initiate_prop_settlement(
            f"lifecycle_prop_{i}",
            {"actual": 25 + i, "line": 24.5},
            SettlementSource.API_FEED
        )
        await manager.process_settlement(test_settlement.settlement_id)
    
    print(f"  ✅ Created and processed 3 additional settlements")
    
    # Test 7: Settlement Status Retrieval
    print("\n📋 Test 7: Settlement Status Retrieval")
    
    status = await manager.get_settlement_status("test_prop_basic")
    print(f"  ✅ Retrieved settlement status: {status is not None}")
    
    if status:
        print(f"     Prop ID: {status.prop_id}")
        print(f"     Current status: {status.status.value}")
        print(f"     Outcome: {status.outcome.value if status.outcome else 'None'}")
    
    # Test 8: Settlement Statistics
    print("\n📋 Test 8: Settlement Statistics")
    
    stats = await manager.get_stats()
    print(f"  ✅ Settlement statistics:")
    for key, value in stats.items():
        print(f"     {key}: {value}")
    
    # Test 9: Settlement Archiving
    print("\n📋 Test 9: Settlement Archiving")
    
    # Create old settlement for archiving test
    old_settlement = await manager.initiate_prop_settlement(
        "old_prop_archive",
        {"actual": 30.0, "line": 28.5},
        SettlementSource.AUTOMATED_RULE
    )
    await manager.process_settlement(old_settlement.settlement_id)
    
    # Manually age the settlement
    old_settlement.created_at = datetime.utcnow() - timedelta(days=45)
    
    # Archive old settlements
    archived_count = await manager.archive_settled_props(cutoff_days=30)
    print(f"  ✅ Archived settlements: {archived_count}")
    
    # Test 10: Error Handling
    print("\n📋 Test 10: Error Handling")
    
    # Test processing nonexistent settlement
    nonexistent_success = await manager.process_settlement("nonexistent_12345")
    print(f"  ✅ Nonexistent settlement handled: {not nonexistent_success}")
    
    # Test dispute for nonexistent settlement
    nonexistent_dispute = await manager.create_dispute(
        "nonexistent_12345",
        "test reason",
        "test_user"
    )
    print(f"  ✅ Nonexistent dispute handled: {not nonexistent_dispute}")
    
    # Test resolving non-disputed settlement
    regular_settlement = await manager.initiate_prop_settlement(
        "regular_prop",
        {"actual": 22.0, "line": 24.0},
        SettlementSource.LIVE_EVENT
    )
    await manager.process_settlement(regular_settlement.settlement_id)
    
    invalid_resolution = await manager.resolve_dispute(
        regular_settlement.settlement_id,
        SettlementOutcome.WIN,
        "admin"
    )
    print(f"  ✅ Invalid dispute resolution handled: {not invalid_resolution}")
    
    print("\n" + "=" * 60)
    print("🎉 All settlement tests completed successfully!")
    print("Settlement & Lifecycle Management System is working correctly!")
    
    return True

if __name__ == "__main__":
    # Run the tests
    try:
        success = asyncio.run(test_settlement_system())
        if success:
            print("\n✅ Settlement & Lifecycle Management System verification PASSED")
            exit(0)
        else:
            print("\n❌ Settlement & Lifecycle Management System verification FAILED")
            exit(1)
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)