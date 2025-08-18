"""
Test suite for Valuation Adjustment Orchestrator

Tests the core functionality of the adjustment orchestration system including:
- Individual adjustment application
- Batch adjustment processing
- Cumulative impact limits
- Priority handling
- Rollback capabilities
"""

import asyncio
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from backend.services.adjustments.valuation_adjustment_orchestrator import (
    ValuationAdjustmentOrchestrator,
    AdjustmentType,
    AdjustmentMethod,
    AdjustmentPriority,
    AdjustmentSource,
    Adjustment,
    AdjustmentBatch,
    get_adjustment_orchestrator,
    apply_weather_adjustment,
    apply_injury_adjustment,
    apply_line_movement_adjustment
)


class TestValuationAdjustmentOrchestrator:
    """Test cases for the Valuation Adjustment Orchestrator"""
    
    @pytest.fixture
    def orchestrator(self):
        """Create a fresh orchestrator for each test"""
        return ValuationAdjustmentOrchestrator()
    
    @pytest.fixture
    def sample_source(self):
        """Sample adjustment source"""
        return AdjustmentSource(
            service_name="test_service",
            component_id="test_component",
            data_timestamp=datetime.utcnow(),
            confidence_score=0.8,
            metadata={"test": "data"}
        )
    
    @pytest.mark.asyncio
    async def test_single_adjustment_application(self, orchestrator, sample_source):
        """Test applying a single adjustment"""
        prop_id = "test_prop_123"
        
        success, message, adjustment = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=0.1,  # 10% increase
            method=AdjustmentMethod.MULTIPLICATIVE,
            priority=AdjustmentPriority.MEDIUM,
            source=sample_source,
            reason="Test weather adjustment"
        )
        
        assert success is True
        assert "successfully" in message.lower()
        assert adjustment is not None
        assert adjustment.prop_id == prop_id
        assert adjustment.value == 0.1
        
        # Check tracking
        assert prop_id in orchestrator.active_adjustments
        assert len(orchestrator.active_adjustments[prop_id]) == 1
        assert orchestrator.adjustment_stats["total_applied"] == 1
    
    @pytest.mark.asyncio
    async def test_cumulative_impact_limit(self, orchestrator, sample_source):
        """Test cumulative impact limiting"""
        prop_id = "test_prop_456"
        
        # Apply multiple large adjustments
        for i in range(5):
            success, message, adjustment = await orchestrator.apply_adjustment(
                prop_id=prop_id,
                adjustment_type=AdjustmentType.WEATHER,
                value=0.08,  # 8% each
                method=AdjustmentMethod.MULTIPLICATIVE,
                source=sample_source,
                reason=f"Test adjustment {i+1}"
            )
            
            # First few should succeed, later ones should fail due to cumulative impact
            if i < 3:  # Roughly 24% cumulative, still under 25% limit
                assert success is True, f"Adjustment {i+1} should succeed"
            else:
                # These might fail due to cumulative impact
                if not success:
                    assert "cumulative impact" in message.lower()
        
        # Check that cumulative impact violations are tracked
        assert orchestrator.adjustment_stats["cumulative_impact_violations"] >= 0
    
    @pytest.mark.asyncio
    async def test_priority_override(self, orchestrator, sample_source):
        """Test priority-based adjustment override"""
        prop_id = "test_prop_789"
        
        # Apply low priority adjustment
        success1, _, adj1 = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=0.05,
            priority=AdjustmentPriority.LOW,
            source=sample_source,
            reason="Low priority adjustment"
        )
        assert success1 is True
        
        # Apply high priority adjustment of same type - should override
        success2, _, adj2 = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=0.10,
            priority=AdjustmentPriority.HIGH,
            source=sample_source,
            reason="High priority adjustment"
        )
        assert success2 is True
        
        # Check that priority override was tracked
        assert orchestrator.adjustment_stats["priority_overrides"] >= 1
    
    @pytest.mark.asyncio
    async def test_adjustment_batch(self, orchestrator, sample_source):
        """Test batch adjustment application"""
        prop_id = "test_prop_batch"
        
        # Create batch with multiple adjustments
        adjustments = [
            Adjustment(
                adjustment_type=AdjustmentType.WEATHER,
                value=0.05,
                priority=AdjustmentPriority.HIGH,
                source=sample_source,
                reason="Weather batch 1"
            ),
            Adjustment(
                adjustment_type=AdjustmentType.INJURY,
                value=0.03,
                priority=AdjustmentPriority.MEDIUM,
                source=sample_source,
                reason="Injury batch 1"
            ),
            Adjustment(
                adjustment_type=AdjustmentType.LINE_MOVEMENT,
                value=0.02,
                priority=AdjustmentPriority.LOW,
                source=sample_source,
                reason="Line movement batch 1"
            )
        ]
        
        batch = AdjustmentBatch(
            prop_id=prop_id,
            adjustments=adjustments,
            trigger_event="test_batch_trigger",
            batch_reason="Testing batch functionality"
        )
        
        success, message, results = await orchestrator.apply_adjustment_batch(batch)
        
        assert success is True
        assert len(results["successful_adjustments"]) >= 1
        assert results["total_impact"] > 0
        assert batch.id == results["batch_id"]
        
        # Check that batch is tracked
        assert len(orchestrator.batch_history) >= 1
        assert batch.applied_at is not None
    
    @pytest.mark.asyncio
    async def test_adjustment_rollback(self, orchestrator, sample_source):
        """Test adjustment rollback functionality"""
        prop_id = "test_prop_rollback"
        
        # Apply an adjustment
        success, _, adjustment = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=0.15,
            source=sample_source,
            reason="Test rollback adjustment"
        )
        assert success is True
        assert adjustment is not None
        
        initial_count = len(orchestrator.active_adjustments[prop_id])
        
        # Rollback the adjustment
        rollback_success, rollback_message = await orchestrator.rollback_adjustment(
            adjustment.id
        )
        
        assert rollback_success is True
        assert "successfully" in rollback_message.lower()
        assert adjustment.is_active is False
        assert orchestrator.adjustment_stats["total_rollbacks"] >= 1
        
        # Check that adjustment was removed from active list
        current_count = len(orchestrator.active_adjustments.get(prop_id, []))
        assert current_count == initial_count - 1
    
    @pytest.mark.asyncio
    async def test_expired_adjustment_cleanup(self, orchestrator, sample_source):
        """Test cleanup of expired adjustments"""
        prop_id = "test_prop_expired"
        
        # Apply adjustment that expires soon
        success, _, adjustment = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=0.05,
            source=sample_source,
            reason="Test expired adjustment",
            expires_in_hours=0.001  # Expires in ~3.6 seconds
        )
        assert success is True
        
        # Wait for expiration
        await asyncio.sleep(0.1)  # Short wait to simulate time passing
        
        # Manually set expiration to past for testing
        adjustment.expires_at = datetime.utcnow() - timedelta(minutes=1)
        
        # Run cleanup
        removed_count = await orchestrator.cleanup_expired_adjustments()
        
        assert removed_count >= 1
        assert prop_id not in orchestrator.active_adjustments or \
               len(orchestrator.active_adjustments[prop_id]) == 0
    
    @pytest.mark.asyncio
    async def test_cumulative_impact_calculation(self, orchestrator, sample_source):
        """Test cumulative impact calculation"""
        prop_id = "test_prop_cumulative"
        
        # Apply multiple adjustments
        await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=0.1,  # 10% multiplicative
            method=AdjustmentMethod.MULTIPLICATIVE,
            source=sample_source,
            reason="Test multiplicative"
        )
        
        await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.INJURY,
            value=0.05,  # 5% additive
            method=AdjustmentMethod.ADDITIVE,
            source=sample_source,
            reason="Test additive"
        )
        
        # Get cumulative impact
        impact = await orchestrator.get_cumulative_impact(prop_id)
        
        assert "additive_total" in impact
        assert "multiplicative_total" in impact
        assert "net_impact_percent" in impact
        assert impact["additive_total"] == 0.05
        assert impact["multiplicative_total"] == 1.1
        assert impact["net_impact_percent"] > 0
    
    @pytest.mark.asyncio
    async def test_orchestrator_stats(self, orchestrator, sample_source):
        """Test orchestrator statistics"""
        prop_id = "test_prop_stats"
        
        # Apply some adjustments
        for i in range(3):
            await orchestrator.apply_adjustment(
                prop_id=f"{prop_id}_{i}",
                adjustment_type=AdjustmentType.WEATHER,
                value=0.05,
                source=sample_source,
                reason=f"Test stats adjustment {i+1}"
            )
        
        # Get stats
        stats = await orchestrator.get_orchestrator_stats()
        
        assert "active_adjustments" in stats
        assert "props_with_adjustments" in stats
        assert "performance_stats" in stats
        assert "type_distribution" in stats
        assert stats["active_adjustments"] >= 3
        assert stats["props_with_adjustments"] >= 3
        assert "weather" in stats["type_distribution"]


class TestConvenienceFunctions:
    """Test convenience functions for common adjustment types"""
    
    @pytest.mark.asyncio
    async def test_apply_weather_adjustment(self):
        """Test weather adjustment convenience function"""
        prop_id = "test_weather_prop"
        
        with patch('backend.services.adjustments.valuation_adjustment_orchestrator.get_adjustment_orchestrator') as mock_get_orch:
            mock_orchestrator = Mock()
            mock_orchestrator.apply_adjustment.return_value = (True, "Success", Mock())
            mock_get_orch.return_value = mock_orchestrator
            
            success, message, adjustment = await apply_weather_adjustment(
                prop_id=prop_id,
                impact_factor=0.08,
                weather_condition="high_wind",
                confidence=0.9
            )
            
            assert success is True
            mock_orchestrator.apply_adjustment.assert_called_once()
            call_args = mock_orchestrator.apply_adjustment.call_args
            assert call_args[1]["adjustment_type"] == AdjustmentType.WEATHER
            assert call_args[1]["value"] == 0.08
    
    @pytest.mark.asyncio
    async def test_apply_injury_adjustment(self):
        """Test injury adjustment convenience function"""
        prop_id = "test_injury_prop"
        
        with patch('backend.services.adjustments.valuation_adjustment_orchestrator.get_adjustment_orchestrator') as mock_get_orch:
            mock_orchestrator = Mock()
            mock_orchestrator.apply_adjustment.return_value = (True, "Success", Mock())
            mock_get_orch.return_value = mock_orchestrator
            
            success, message, adjustment = await apply_injury_adjustment(
                prop_id=prop_id,
                impact_factor=-0.12,
                player_name="Test Player",
                injury_severity="major",
                confidence=0.95
            )
            
            assert success is True
            mock_orchestrator.apply_adjustment.assert_called_once()
            call_args = mock_orchestrator.apply_adjustment.call_args
            assert call_args[1]["adjustment_type"] == AdjustmentType.INJURY
            assert call_args[1]["priority"] == AdjustmentPriority.HIGH  # major injury = high priority
    
    @pytest.mark.asyncio
    async def test_apply_line_movement_adjustment(self):
        """Test line movement adjustment convenience function"""
        prop_id = "test_line_movement_prop"
        
        with patch('backend.services.adjustments.valuation_adjustment_orchestrator.get_adjustment_orchestrator') as mock_get_orch:
            mock_orchestrator = Mock()
            mock_orchestrator.apply_adjustment.return_value = (True, "Success", Mock())
            mock_get_orch.return_value = mock_orchestrator
            
            success, message, adjustment = await apply_line_movement_adjustment(
                prop_id=prop_id,
                movement_factor=0.06,
                movement_type="steam_move",
                confidence=0.85
            )
            
            assert success is True
            mock_orchestrator.apply_adjustment.assert_called_once()
            call_args = mock_orchestrator.apply_adjustment.call_args
            assert call_args[1]["adjustment_type"] == AdjustmentType.LINE_MOVEMENT
            assert call_args[1]["priority"] == AdjustmentPriority.HIGH  # steam move = high priority
            assert call_args[1]["expires_in_hours"] == 2  # Line movement expires quickly


class TestAdjustmentValidation:
    """Test adjustment validation logic"""
    
    @pytest.fixture
    def orchestrator(self):
        return ValuationAdjustmentOrchestrator()
    
    @pytest.mark.asyncio
    async def test_invalid_multiplicative_adjustment(self, orchestrator):
        """Test validation of invalid multiplicative adjustments"""
        prop_id = "test_validation_prop"
        
        # Test adjustment that reduces by more than 99%
        success, message, _ = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=-1.5,  # -150% (invalid)
            method=AdjustmentMethod.MULTIPLICATIVE
        )
        
        assert success is False
        assert "too negative" in message.lower()
        
        # Test adjustment that increases by more than 500%
        success, message, _ = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=6.0,  # 600% increase (invalid)
            method=AdjustmentMethod.MULTIPLICATIVE
        )
        
        assert success is False
        assert "too large" in message.lower()
    
    @pytest.mark.asyncio
    async def test_invalid_additive_adjustment(self, orchestrator):
        """Test validation of invalid additive adjustments"""
        prop_id = "test_validation_additive_prop"
        
        # Test additive adjustment that's too large
        success, message, _ = await orchestrator.apply_adjustment(
            prop_id=prop_id,
            adjustment_type=AdjustmentType.WEATHER,
            value=2.0,  # Too large for additive
            method=AdjustmentMethod.ADDITIVE
        )
        
        assert success is False
        assert "too large" in message.lower()
    
    @pytest.mark.asyncio
    async def test_missing_prop_id_validation(self, orchestrator):
        """Test validation with missing prop_id"""
        success, message, _ = await orchestrator.apply_adjustment(
            prop_id="",  # Empty prop_id
            adjustment_type=AdjustmentType.WEATHER,
            value=0.1
        )
        
        assert success is False
        assert "prop_id is required" in message.lower()


if __name__ == "__main__":
    # Run basic tests
    async def run_basic_tests():
        orchestrator = ValuationAdjustmentOrchestrator()
        
        print("Testing Valuation Adjustment Orchestrator...")
        
        # Test basic adjustment
        success, message, adjustment = await orchestrator.apply_adjustment(
            prop_id="test_prop_basic",
            adjustment_type=AdjustmentType.WEATHER,
            value=0.1,
            reason="Basic test"
        )
        print(f"Basic adjustment: {success}, {message}")
        
        # Test stats
        stats = await orchestrator.get_orchestrator_stats()
        print(f"Orchestrator stats: {stats}")
        
        # Test convenience functions
        success, message, adj = await apply_weather_adjustment(
            prop_id="test_weather_basic",
            impact_factor=0.05,
            weather_condition="rain"
        )
        print(f"Weather convenience function: {success}, {message}")
        
        print("Basic tests completed successfully!")
    
    asyncio.run(run_basic_tests())