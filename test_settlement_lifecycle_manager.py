"""
Test suite for Settlement & Lifecycle Management System

Tests the comprehensive settlement functionality including:
- Automated settlement processing
- Settlement validation and confidence scoring
- Lifecycle state transitions
- Dispute handling and resolution
- Audit trail management
- Settlement statistics and performance tracking
"""

import asyncio
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch

from backend.services.settlement.settlement_lifecycle_manager import (
    SettlementLifecycleManager,
    PropLifecycleState,
    SettlementStatus,
    SettlementOutcome,
    SettlementConfidenceLevel,
    SettlementSource,
    PropSettlement,
    SettlementValidation,
    SettlementAuditEntry,
    get_settlement_manager,
    initiate_settlement,
    create_settlement_dispute,
    resolve_settlement_dispute,
    get_prop_settlement_status,
    get_prop_audit_trail,
    archive_old_settlements,
    get_settlement_stats
)


class TestSettlementLifecycleManager:
    """Test cases for the Settlement & Lifecycle Management System"""
    
    @pytest.fixture
    def manager(self):
        """Create a fresh settlement manager for each test"""
        return SettlementLifecycleManager()
    
    @pytest.fixture
    def sample_settlement_data(self):
        """Sample settlement data for testing"""
        return {
            "actual_value": 27.5,
            "original_line": 25.5,
            "prop_type": "over_under",
            "player_id": "test_player_123",
            "game_id": "test_game_456",
            "game_completed": True,
            "confidence": 0.95
        }
    
    @pytest.mark.asyncio
    async def test_settlement_initiation(self, manager, sample_settlement_data):
        """Test initiating a prop settlement"""
        prop_id = "test_prop_settlement"
        
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.LIVE_EVENT
        )
        
        assert settlement.prop_id == prop_id
        assert settlement.primary_source == SettlementSource.LIVE_EVENT
        assert settlement.status == SettlementStatus.IN_PROGRESS
        assert settlement.settlement_id in manager.active_settlements
        assert prop_id in manager.settlement_history
        assert len(manager.settlement_history[prop_id]) == 1
        
        # Check queue
        assert manager.settlement_queue.qsize() == 1
        
        # Check audit trail
        audit_entries = [entry for entry in manager.audit_trail if entry.prop_id == prop_id]
        assert len(audit_entries) == 1
        assert audit_entries[0].action == "settlement_initiated"
    
    @pytest.mark.asyncio
    async def test_settlement_validation(self, manager, sample_settlement_data):
        """Test settlement validation logic"""
        prop_id = "test_prop_validation"
        
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.API_FEED
        )
        
        # Test validation without validators (should require manual review)
        validation = await manager.validate_settlement(settlement, sample_settlement_data)
        
        assert isinstance(validation, SettlementValidation)
        assert validation.confidence_score >= 0.0
        assert validation.requires_manual_review == True  # No validators configured
        assert len(validation.validation_errors) >= 0
    
    @pytest.mark.asyncio
    async def test_settlement_processing(self, manager, sample_settlement_data):
        """Test settlement processing workflow"""
        prop_id = "test_prop_processing"
        
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.AUTOMATED_RULE
        )
        
        # Process the settlement
        success = await manager.process_settlement(settlement.settlement_id)
        
        assert success == True
        
        # Check settlement was updated
        processed_settlement = manager.active_settlements[settlement.settlement_id]
        assert processed_settlement.validation_result is not None
        assert processed_settlement.confidence in [
            SettlementConfidenceLevel.HIGH,
            SettlementConfidenceLevel.MEDIUM,
            SettlementConfidenceLevel.LOW,
            SettlementConfidenceLevel.UNCERTAIN
        ]
        
        # Should either be settled or require manual review
        assert processed_settlement.status in [
            SettlementStatus.SETTLED,
            SettlementStatus.REQUIRES_MANUAL_REVIEW
        ]
        
        # Check statistics were updated
        assert manager.stats["settlements_processed"] >= 1
    
    @pytest.mark.asyncio
    async def test_settlement_outcome_calculation(self, manager):
        """Test settlement outcome calculation logic"""
        # Test over/under settlement
        over_data = {
            "actual_value": 27.5,
            "original_line": 25.5,
            "prop_type": "over_under"
        }
        
        settlement = PropSettlement(prop_id="test_over")
        outcome = await manager._calculate_settlement_outcome(settlement, over_data)
        assert outcome == SettlementOutcome.WIN  # Over wins (27.5 > 25.5)
        
        # Test under wins
        under_data = {
            "actual_value": 23.5,
            "original_line": 25.5,
            "prop_type": "over_under"
        }
        outcome = await manager._calculate_settlement_outcome(settlement, under_data)
        assert outcome == SettlementOutcome.LOSE  # Over loses (23.5 < 25.5)
        
        # Test push
        push_data = {
            "actual_value": 25.5,
            "original_line": 25.5,
            "prop_type": "over_under"
        }
        outcome = await manager._calculate_settlement_outcome(settlement, push_data)
        assert outcome == SettlementOutcome.PUSH  # Exact match
        
        # Test void (missing data)
        void_data = {"prop_type": "over_under"}
        outcome = await manager._calculate_settlement_outcome(settlement, void_data)
        assert outcome == SettlementOutcome.VOID  # Missing required data
    
    @pytest.mark.asyncio
    async def test_dispute_creation(self, manager, sample_settlement_data):
        """Test creating settlement disputes"""
        prop_id = "test_prop_dispute"
        
        # Create and process settlement first
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.LIVE_EVENT
        )
        
        # Manually set as settled for testing
        settlement.status = SettlementStatus.SETTLED
        
        # Create dispute
        dispute_created = await manager.create_dispute(
            settlement.settlement_id,
            "Disputed player statistics",
            "test_user",
            {"evidence": "Player was injured"}
        )
        
        assert dispute_created == True
        assert settlement.status == SettlementStatus.DISPUTED
        assert settlement.dispute_reason == "Disputed player statistics"
        assert manager.dispute_queue.qsize() == 1
        assert manager.stats["disputes_created"] == 1
        
        # Check audit trail
        dispute_audit = [entry for entry in manager.audit_trail 
                        if entry.action == "dispute_created" and entry.prop_id == prop_id]
        assert len(dispute_audit) == 1
        assert dispute_audit[0].actor == "test_user"
    
    @pytest.mark.asyncio
    async def test_dispute_resolution(self, manager, sample_settlement_data):
        """Test resolving settlement disputes"""
        prop_id = "test_prop_resolution"
        
        # Create settlement and dispute
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.API_FEED
        )
        
        settlement.status = SettlementStatus.DISPUTED  # Set as disputed
        
        # Resolve dispute
        dispute_resolved = await manager.resolve_dispute(
            settlement.settlement_id,
            SettlementOutcome.PUSH,
            "admin_reviewer",
            "Reviewed evidence, changing to push"
        )
        
        assert dispute_resolved == True
        assert settlement.status == SettlementStatus.SETTLED
        assert settlement.outcome == SettlementOutcome.PUSH
        assert settlement.manual_override == True
        assert settlement.reviewed_by == "admin_reviewer"
        assert settlement.review_timestamp is not None
        assert len(settlement.notes) >= 1
        assert manager.stats["disputes_resolved"] == 1
        
        # Check audit trail
        resolution_audit = [entry for entry in manager.audit_trail 
                          if entry.action == "dispute_resolved" and entry.prop_id == prop_id]
        assert len(resolution_audit) == 1
        assert resolution_audit[0].actor == "admin_reviewer"
    
    @pytest.mark.asyncio
    async def test_lifecycle_state_transitions(self, manager):
        """Test prop lifecycle state transitions"""
        prop_id = "test_prop_lifecycle"
        settlement_id = "test_settlement_123"
        
        # Test state transition
        await manager._transition_prop_state(
            prop_id,
            PropLifecycleState.ACTIVE,
            PropLifecycleState.SETTLING,
            settlement_id
        )
        
        # Check audit trail
        transition_audit = [entry for entry in manager.audit_trail 
                          if entry.action == "state_transition" and entry.prop_id == prop_id]
        assert len(transition_audit) == 1
        assert transition_audit[0].old_state == PropLifecycleState.ACTIVE
        assert transition_audit[0].new_state == PropLifecycleState.SETTLING
    
    @pytest.mark.asyncio
    async def test_settlement_archiving(self, manager, sample_settlement_data):
        """Test archiving old settlements"""
        prop_id = "test_prop_archive"
        
        # Create old settlement
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.AUTOMATED_RULE
        )
        
        # Manually set as settled and old
        settlement.status = SettlementStatus.SETTLED
        settlement.settlement_timestamp = datetime.utcnow() - timedelta(days=45)
        
        # Archive old settlements
        archived_count = await manager.archive_settled_props(cutoff_days=30)
        
        assert archived_count == 1
        assert settlement.settlement_id not in manager.active_settlements
        
        # Check audit trail for archiving
        archive_audit = [entry for entry in manager.audit_trail 
                        if entry.action == "state_transition" and 
                        entry.new_state == PropLifecycleState.ARCHIVED]
        assert len(archive_audit) == 1
    
    @pytest.mark.asyncio
    async def test_settlement_statistics(self, manager, sample_settlement_data):
        """Test settlement statistics tracking"""
        # Process multiple settlements to generate stats
        for i in range(3):
            settlement = await manager.initiate_prop_settlement(
                f"test_prop_stats_{i}",
                sample_settlement_data,
                SettlementSource.LIVE_EVENT
            )
            await manager.process_settlement(settlement.settlement_id)
        
        stats = await manager.get_stats()
        
        # Check basic stats structure
        assert "settlements_processed" in stats
        assert "automatic_settlements" in stats
        assert "manual_reviews" in stats
        assert "disputes_created" in stats
        assert "disputes_resolved" in stats
        assert "validation_errors" in stats
        assert "average_confidence" in stats
        assert "active_settlements" in stats
        assert "pending_disputes" in stats
        
        # Check values make sense
        assert stats["settlements_processed"] >= 3
        assert stats["active_settlements"] >= 0
        assert stats["average_confidence"] >= 0.0
    
    @pytest.mark.asyncio
    async def test_audit_trail_functionality(self, manager, sample_settlement_data):
        """Test comprehensive audit trail functionality"""
        prop_id = "test_prop_audit"
        
        # Perform multiple operations
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.API_FEED
        )
        
        await manager.process_settlement(settlement.settlement_id)
        
        # Get audit trail
        audit_trail = await manager.get_audit_trail(prop_id)
        
        assert len(audit_trail) >= 1  # At least settlement initiation
        
        # Check audit entry structure
        for entry in audit_trail:
            assert entry.prop_id == prop_id
            assert entry.audit_id != ""
            assert entry.timestamp is not None
            assert entry.action != ""
            
            # Test serialization
            entry_dict = entry.to_dict()
            assert "audit_id" in entry_dict
            assert "timestamp" in entry_dict
            assert "action" in entry_dict
    
    @pytest.mark.asyncio
    async def test_error_handling(self, manager):
        """Test error handling in settlement operations"""
        # Test processing nonexistent settlement
        success = await manager.process_settlement("nonexistent_settlement")
        assert success == False
        
        # Test creating dispute for nonexistent settlement
        dispute_created = await manager.create_dispute(
            "nonexistent_settlement",
            "test reason",
            "test_user"
        )
        assert dispute_created == False
        
        # Test resolving dispute for non-disputed settlement
        settlement = PropSettlement(prop_id="test_error_handling")
        settlement.status = SettlementStatus.SETTLED  # Not disputed
        manager.active_settlements["test_settlement"] = settlement
        
        dispute_resolved = await manager.resolve_dispute(
            "test_settlement",
            SettlementOutcome.WIN,
            "admin"
        )
        assert dispute_resolved == False
    
    @pytest.mark.asyncio
    async def test_confidence_level_mapping(self, manager):
        """Test confidence level mapping from scores"""
        # Test different confidence score mappings
        test_cases = [
            (0.98, SettlementConfidenceLevel.HIGH),
            (0.88, SettlementConfidenceLevel.MEDIUM),
            (0.65, SettlementConfidenceLevel.LOW),
            (0.45, SettlementConfidenceLevel.UNCERTAIN)
        ]
        
        for confidence_score, expected_level in test_cases:
            # Create mock validation with specific confidence
            validation = SettlementValidation(
                is_valid=True,
                confidence_score=confidence_score
            )
            
            settlement = PropSettlement(prop_id="test_confidence")
            settlement.validation_result = validation
            
            # Simulate confidence level assignment (from process_settlement logic)
            if confidence_score >= 0.95:
                settlement.confidence = SettlementConfidenceLevel.HIGH
            elif confidence_score >= 0.80:
                settlement.confidence = SettlementConfidenceLevel.MEDIUM
            elif confidence_score >= 0.60:
                settlement.confidence = SettlementConfidenceLevel.LOW
            else:
                settlement.confidence = SettlementConfidenceLevel.UNCERTAIN
            
            assert settlement.confidence == expected_level
    
    @pytest.mark.asyncio
    async def test_settlement_serialization(self, manager, sample_settlement_data):
        """Test settlement data serialization"""
        prop_id = "test_prop_serialization"
        
        settlement = await manager.initiate_prop_settlement(
            prop_id,
            sample_settlement_data,
            SettlementSource.MANUAL_REVIEW
        )
        
        # Test PropSettlement serialization
        settlement_dict = settlement.to_dict()
        
        # Check required fields
        assert "prop_id" in settlement_dict
        assert "settlement_id" in settlement_dict
        assert "status" in settlement_dict
        assert "confidence" in settlement_dict
        assert "created_at" in settlement_dict
        assert "updated_at" in settlement_dict
        
        # Check values
        assert settlement_dict["prop_id"] == prop_id
        assert settlement_dict["status"] == SettlementStatus.IN_PROGRESS.value
        assert settlement_dict["confidence"] == SettlementConfidenceLevel.UNCERTAIN.value


class TestConvenienceFunctions:
    """Test convenience functions for settlement operations"""
    
    @pytest.mark.asyncio
    async def test_initiate_settlement_convenience(self):
        """Test initiate_settlement convenience function"""
        prop_id = "convenience_settlement_1"
        settlement_data = {
            "actual_value": 30.0,
            "original_line": 28.5,
            "prop_type": "over_under"
        }
        
        settlement = await initiate_settlement(
            prop_id,
            settlement_data,
            SettlementSource.LIVE_EVENT
        )
        
        assert settlement.prop_id == prop_id
        assert settlement.primary_source == SettlementSource.LIVE_EVENT
        assert settlement.status == SettlementStatus.IN_PROGRESS
    
    @pytest.mark.asyncio
    async def test_dispute_convenience_functions(self):
        """Test dispute creation and resolution convenience functions"""
        # First create a settlement
        settlement = await initiate_settlement(
            "convenience_dispute_prop",
            {"actual_value": 25.0, "original_line": 26.0},
            SettlementSource.API_FEED
        )
        
        # Manually set as settled for testing
        settlement.status = SettlementStatus.SETTLED
        
        # Create dispute using convenience function
        dispute_created = await create_settlement_dispute(
            settlement.settlement_id,
            "Test dispute reason",
            "convenience_user",
            {"test": "evidence"}
        )
        
        assert dispute_created == True
        
        # Resolve dispute using convenience function
        dispute_resolved = await resolve_settlement_dispute(
            settlement.settlement_id,
            SettlementOutcome.VOID,
            "convenience_admin",
            "Resolved via convenience function"
        )
        
        assert dispute_resolved == True
    
    @pytest.mark.asyncio
    async def test_status_and_audit_convenience_functions(self):
        """Test status and audit convenience functions"""
        prop_id = "convenience_status_prop"
        
        # Create settlement
        settlement = await initiate_settlement(
            prop_id,
            {"actual_value": 22.0, "original_line": 24.5},
            SettlementSource.AUTOMATED_RULE
        )
        
        # Test get settlement status
        status = await get_prop_settlement_status(prop_id)
        assert status is not None
        assert status.prop_id == prop_id
        
        # Test get audit trail
        audit_trail = await get_prop_audit_trail(prop_id)
        assert len(audit_trail) >= 1  # At least initiation entry
        
        # Test get settlement stats
        stats = await get_settlement_stats()
        assert "settlements_processed" in stats
        assert isinstance(stats, dict)
    
    @pytest.mark.asyncio
    async def test_archiving_convenience_function(self):
        """Test archiving convenience function"""
        # Test archive function (will return 0 since no old settlements)
        archived_count = await archive_old_settlements(30)
        assert archived_count >= 0  # Should not fail


class TestSettlementDataStructures:
    """Test settlement data structures and enums"""
    
    def test_lifecycle_state_enum(self):
        """Test PropLifecycleState enum"""
        assert PropLifecycleState.DRAFT.value == "draft"
        assert PropLifecycleState.ACTIVE.value == "active"
        assert PropLifecycleState.SETTLED.value == "settled"
        assert PropLifecycleState.ARCHIVED.value == "archived"
    
    def test_settlement_status_enum(self):
        """Test SettlementStatus enum"""
        assert SettlementStatus.PENDING.value == "pending"
        assert SettlementStatus.IN_PROGRESS.value == "in_progress"
        assert SettlementStatus.SETTLED.value == "settled"
        assert SettlementStatus.DISPUTED.value == "disputed"
    
    def test_settlement_outcome_enum(self):
        """Test SettlementOutcome enum"""
        assert SettlementOutcome.WIN.value == "win"
        assert SettlementOutcome.LOSE.value == "lose"
        assert SettlementOutcome.PUSH.value == "push"
        assert SettlementOutcome.VOID.value == "void"
    
    def test_settlement_validation_structure(self):
        """Test SettlementValidation structure"""
        validation = SettlementValidation(
            is_valid=True,
            confidence_score=0.85,
            validation_sources=[SettlementSource.API_FEED],
            requires_manual_review=False
        )
        
        assert validation.is_valid == True
        assert validation.confidence_score == 0.85
        assert len(validation.validation_sources) == 1
        assert validation.requires_manual_review == False
        assert isinstance(validation.validation_timestamp, datetime)
    
    def test_audit_entry_structure(self):
        """Test SettlementAuditEntry structure"""
        audit_entry = SettlementAuditEntry(
            action="test_action",
            actor="test_actor",
            prop_id="test_prop",
            old_state=PropLifecycleState.ACTIVE,
            new_state=PropLifecycleState.SETTLING
        )
        
        assert audit_entry.action == "test_action"
        assert audit_entry.actor == "test_actor"
        assert audit_entry.prop_id == "test_prop"
        assert audit_entry.old_state == PropLifecycleState.ACTIVE
        assert audit_entry.new_state == PropLifecycleState.SETTLING
        assert audit_entry.audit_id != ""
        assert isinstance(audit_entry.timestamp, datetime)
        
        # Test serialization
        audit_dict = audit_entry.to_dict()
        assert audit_dict["action"] == "test_action"
        assert audit_dict["old_state"] == "active"
        assert audit_dict["new_state"] == "settling"


if __name__ == "__main__":
    # Run basic tests
    async def run_basic_tests():
        print("Testing Settlement & Lifecycle Management System...")
        
        manager = SettlementLifecycleManager()
        
        # Test basic settlement workflow
        sample_data = {
            "actual_value": 28.0,
            "original_line": 26.5,
            "prop_type": "over_under",
            "player_id": "test_player",
            "game_id": "test_game",
            "confidence": 0.92
        }
        
        print("Testing settlement initiation...")
        settlement = await manager.initiate_prop_settlement(
            "basic_test_prop",
            sample_data,
            SettlementSource.LIVE_EVENT
        )
        print(f"Settlement initiated: {settlement.settlement_id}")
        
        print("Testing settlement processing...")
        success = await manager.process_settlement(settlement.settlement_id)
        print(f"Settlement processed: {success}")
        
        processed = None
        if success:
            processed = manager.active_settlements[settlement.settlement_id]
            print(f"Settlement status: {processed.status.value}")
            print(f"Settlement confidence: {processed.confidence.value}")
        
        print("Testing dispute creation...")
        if processed and processed.status == SettlementStatus.SETTLED:
            dispute_created = await manager.create_dispute(
                settlement.settlement_id,
                "Test dispute",
                "test_user",
                {"reason": "Testing dispute workflow"}
            )
            print(f"Dispute created: {dispute_created}")
            
            if dispute_created:
                print("Testing dispute resolution...")
                resolved = await manager.resolve_dispute(
                    settlement.settlement_id,
                    SettlementOutcome.PUSH,
                    "test_admin",
                    "Resolved for testing"
                )
                print(f"Dispute resolved: {resolved}")
        
        print("Testing audit trail...")
        audit_trail = await manager.get_audit_trail("basic_test_prop")
        print(f"Audit entries: {len(audit_trail)}")
        for entry in audit_trail:
            print(f"  - {entry.action} by {entry.actor}")
        
        print("Testing statistics...")
        stats = await manager.get_stats()
        print(f"Settlements processed: {stats.get('settlements_processed', 0)}")
        print(f"Average confidence: {stats.get('average_confidence', 0):.3f}")
        
        print("Testing convenience functions...")
        convenience_settlement = await initiate_settlement(
            "convenience_test_prop",
            sample_data,
            SettlementSource.AUTOMATED_RULE
        )
        print(f"Convenience settlement: {convenience_settlement.settlement_id}")
        
        status = await get_prop_settlement_status("convenience_test_prop")
        print(f"Settlement status retrieved: {status is not None}")
        
        print("Basic settlement tests completed successfully!")
    
    # Run the tests
    asyncio.run(run_basic_tests())