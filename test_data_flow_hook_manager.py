"""
Test suite for Data Flow Hook Manager

Tests the comprehensive hook system including:
- Hook registration and lifecycle
- Event emission and processing
- Batching and debouncing
- Priority handling
- Performance monitoring
"""

import asyncio
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock

from backend.services.hooks.data_flow_hook_manager import (
    DataFlowHookManager,
    HookEvent,
    HookPriority,
    BatchingStrategy,
    HookEventData,
    get_hook_manager,
    hook,
    emit_weather_update,
    emit_injury_report,
    emit_line_movement,
    emit_prop_lifecycle_event
)


class TestDataFlowHookManager:
    """Test cases for the Data Flow Hook Manager"""
    
    @pytest.fixture
    async def hook_manager(self):
        """Create a fresh hook manager for each test"""
        manager = DataFlowHookManager()
        await manager.start_processing()
        yield manager
        await manager.stop_processing()
    
    @pytest.mark.asyncio
    async def test_hook_registration(self, hook_manager):
        """Test basic hook registration"""
        callback_called = False
        
        def test_callback(event: HookEventData):
            nonlocal callback_called
            callback_called = True
            return f"Processed {event.event_type.value}"
        
        # Register hook
        hook_id = hook_manager.register_hook(
            name="test_hook",
            events=HookEvent.WEATHER_UPDATED,
            callback=test_callback,
            description="Test hook for weather updates"
        )
        
        assert hook_id is not None
        assert len(hook_id) > 0
        assert hook_id in hook_manager.registered_hooks
        
        # Check hook is in event mapping
        assert HookEvent.WEATHER_UPDATED in hook_manager.event_hooks
        assert hook_id in hook_manager.event_hooks[HookEvent.WEATHER_UPDATED]
    
    @pytest.mark.asyncio
    async def test_hook_unregistration(self, hook_manager):
        """Test hook unregistration"""
        def test_callback(event: HookEventData):
            pass
        
        hook_id = hook_manager.register_hook(
            name="test_unregister_hook",
            events=HookEvent.INJURY_REPORTED,
            callback=test_callback
        )
        
        # Verify hook exists
        assert hook_id in hook_manager.registered_hooks
        
        # Unregister hook
        success = hook_manager.unregister_hook(hook_id)
        assert success is True
        
        # Verify hook is removed
        assert hook_id not in hook_manager.registered_hooks
        assert hook_id not in hook_manager.event_hooks[HookEvent.INJURY_REPORTED]
    
    @pytest.mark.asyncio
    async def test_event_emission_and_processing(self, hook_manager):
        """Test event emission and hook execution"""
        results = []
        
        async def test_callback(event: HookEventData):
            results.append({
                "event_type": event.event_type.value,
                "data": event.data,
                "timestamp": event.timestamp
            })
        
        # Register hook
        hook_id = hook_manager.register_hook(
            name="test_processing_hook",
            events=HookEvent.WEATHER_UPDATED,
            callback=test_callback
        )
        
        # Emit event
        test_data = {"temperature": 75, "wind_speed": 10}
        event_id = await hook_manager.emit_event(
            event_type=HookEvent.WEATHER_UPDATED,
            data=test_data,
            source_service="test_service"
        )
        
        assert event_id is not None
        
        # Wait for processing
        await asyncio.sleep(0.1)  # Allow time for processing
        
        # Check results
        assert len(results) == 1
        assert results[0]["event_type"] == "weather_updated"
        assert results[0]["data"] == test_data
    
    @pytest.mark.asyncio
    async def test_multiple_hooks_same_event(self, hook_manager):
        """Test multiple hooks registered for the same event"""
        results = []
        
        async def hook1_callback(event: HookEventData):
            results.append("hook1")
        
        async def hook2_callback(event: HookEventData):
            results.append("hook2")
        
        # Register multiple hooks for same event
        hook_manager.register_hook(
            name="hook1",
            events=HookEvent.LINE_MOVEMENT,
            callback=hook1_callback,
            priority=HookPriority.HIGH
        )
        
        hook_manager.register_hook(
            name="hook2",
            events=HookEvent.LINE_MOVEMENT,
            callback=hook2_callback,
            priority=HookPriority.LOW
        )
        
        # Emit event
        await hook_manager.emit_event(
            event_type=HookEvent.LINE_MOVEMENT,
            data={"prop_id": "test_prop", "movement": 0.05}
        )
        
        # Wait for processing
        await asyncio.sleep(0.1)
        
        # Both hooks should have executed
        assert len(results) == 2
        assert "hook1" in results
        assert "hook2" in results
    
    @pytest.mark.asyncio
    async def test_event_filtering(self, hook_manager):
        """Test event filtering functionality"""
        results = []
        
        async def filtered_callback(event: HookEventData):
            results.append(event.data)
        
        def event_filter(event: HookEventData) -> bool:
            # Only process events with high temperature
            return event.data.get("temperature", 0) > 80
        
        # Register hook with filter
        hook_manager.register_hook(
            name="filtered_hook",
            events=HookEvent.WEATHER_UPDATED,
            callback=filtered_callback,
            event_filter=event_filter
        )
        
        # Emit events - one should pass filter, one should not
        await hook_manager.emit_event(
            event_type=HookEvent.WEATHER_UPDATED,
            data={"temperature": 75}  # Should be filtered out
        )
        
        await hook_manager.emit_event(
            event_type=HookEvent.WEATHER_UPDATED,
            data={"temperature": 85}  # Should pass filter
        )
        
        # Wait for processing
        await asyncio.sleep(0.1)
        
        # Only one event should have been processed
        assert len(results) == 1
        assert results[0]["temperature"] == 85
    
    @pytest.mark.asyncio
    async def test_batching_count_based(self, hook_manager):
        """Test count-based batching"""
        batch_results = []
        
        async def batch_callback(events: list):
            batch_results.append({
                "event_count": len(events),
                "events": events
            })
        
        # Register hook with count-based batching
        hook_manager.register_hook(
            name="batch_hook",
            events=HookEvent.INJURY_REPORTED,
            callback=batch_callback,
            batching_strategy=BatchingStrategy.COUNT_BASED,
            batch_size=3
        )
        
        # Emit multiple events
        for i in range(5):
            await hook_manager.emit_event(
                event_type=HookEvent.INJURY_REPORTED,
                data={"player": f"player_{i}", "severity": "minor"}
            )
        
        # Wait for processing
        await asyncio.sleep(0.2)
        
        # Should have at least one batch of 3
        assert len(batch_results) >= 1
        # First batch should have 3 events
        assert batch_results[0]["event_count"] == 3
    
    @pytest.mark.asyncio
    async def test_debouncing(self, hook_manager):
        """Test debouncing functionality"""
        execution_count = 0
        last_event_data = None
        
        async def debounced_callback(events: list):
            nonlocal execution_count, last_event_data
            execution_count += 1
            last_event_data = events[-1].data if events else None
        
        # Register hook with debouncing
        hook_manager.register_hook(
            name="debounced_hook",
            events=HookEvent.LINE_MOVEMENT,
            callback=debounced_callback,
            debounce_ms=100  # 100ms debounce
        )
        
        # Emit multiple events rapidly
        for i in range(5):
            await hook_manager.emit_event(
                event_type=HookEvent.LINE_MOVEMENT,
                data={"prop_id": f"prop_{i}", "movement": 0.01 * i}
            )
            await asyncio.sleep(0.01)  # Small delay between events
        
        # Wait for debounce to complete
        await asyncio.sleep(0.2)
        
        # Should have executed only once due to debouncing
        assert execution_count == 1
        # Should have processed all events in the batch
        assert last_event_data is not None and last_event_data["prop_id"] == "prop_4"  # Last event
    
    @pytest.mark.asyncio
    async def test_hook_statistics(self, hook_manager):
        """Test hook performance statistics"""
        async def stats_callback(event: HookEventData):
            await asyncio.sleep(0.01)  # Simulate some processing time
            return "processed"
        
        # Register hook
        hook_id = hook_manager.register_hook(
            name="stats_hook",
            events=HookEvent.WEATHER_UPDATED,
            callback=stats_callback
        )
        
        # Emit several events
        for i in range(3):
            await hook_manager.emit_event(
                event_type=HookEvent.WEATHER_UPDATED,
                data={"test": i}
            )
        
        # Wait for processing
        await asyncio.sleep(0.1)
        
        # Get hook stats
        stats = await hook_manager.get_hook_stats(hook_id)
        
        assert stats["execution_count"] == 3
        assert stats["total_execution_time_ms"] > 0
        assert stats["average_execution_time_ms"] > 0
        assert stats["error_count"] == 0
        assert stats["last_executed"] is not None
    
    @pytest.mark.asyncio
    async def test_system_statistics(self, hook_manager):
        """Test system-wide statistics"""
        def simple_callback(event: HookEventData):
            pass
        
        # Register a hook and emit some events
        hook_manager.register_hook(
            name="system_stats_hook",
            events=HookEvent.GAME_STARTED,
            callback=simple_callback
        )
        
        await hook_manager.emit_event(
            event_type=HookEvent.GAME_STARTED,
            data={"game_id": "test_game"}
        )
        
        # Wait for processing
        await asyncio.sleep(0.1)
        
        # Get system stats
        stats = await hook_manager.get_hook_stats()
        
        assert "system_stats" in stats
        assert stats["system_stats"]["events_processed"] >= 1
        assert stats["system_stats"]["hooks_executed"] >= 1
        assert stats["registered_hooks"] >= 1
        assert stats["processing_active"] is True


class TestConvenienceFunctions:
    """Test convenience functions and decorators"""
    
    @pytest.mark.asyncio
    async def test_hook_decorator(self):
        """Test the @hook decorator"""
        execution_results = []
        
        @hook(HookEvent.WEATHER_UPDATED, name="decorated_hook")
        async def decorated_callback(event: HookEventData):
            execution_results.append(event.data)
        
        # The decorator should have registered the hook
        assert hasattr(decorated_callback, '_hook_id')
        
        # Get the hook manager and emit an event
        hook_manager = get_hook_manager()
        await hook_manager.start_processing()
        
        try:
            await emit_weather_update(
                weather_data={"temperature": 72},
                ballpark="test_ballpark"
            )
            
            # Wait for processing
            await asyncio.sleep(0.1)
            
            # Check if hook was executed
            assert len(execution_results) == 1
            assert execution_results[0]["temperature"] == 72
            
        finally:
            await hook_manager.stop_processing()
    
    @pytest.mark.asyncio
    async def test_convenience_emitters(self):
        """Test convenience event emitters"""
        hook_manager = get_hook_manager()
        await hook_manager.start_processing()
        
        try:
            # Test weather update emission
            event_id = await emit_weather_update(
                weather_data={"temp": 75, "humidity": 0.6},
                ballpark="yankee_stadium",
                game_id="game_123"
            )
            assert event_id is not None
            
            # Test injury report emission
            event_id = await emit_injury_report(
                injury_data={"type": "hamstring", "severity": "minor"},
                player_id="player_456",
                severity="minor"
            )
            assert event_id is not None
            
            # Test line movement emission
            event_id = await emit_line_movement(
                movement_data={"old_line": 1.5, "new_line": 1.3},
                prop_id="prop_789",
                movement_type="steam_move"
            )
            assert event_id is not None
            
            # Test prop lifecycle emission
            event_id = await emit_prop_lifecycle_event(
                event_type=HookEvent.PROP_CREATED,
                prop_id="new_prop_123",
                prop_data={"sport": "MLB", "player": "Test Player"}
            )
            assert event_id is not None
            
        finally:
            await hook_manager.stop_processing()


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    @pytest.mark.asyncio
    async def test_hook_execution_error(self):
        """Test handling of errors in hook execution"""
        hook_manager = DataFlowHookManager()
        await hook_manager.start_processing()
        
        try:
            error_count = 0
            
            async def error_callback(event: HookEventData):
                nonlocal error_count
                error_count += 1
                raise ValueError("Test error")
            
            # Register hook that throws error
            hook_id = hook_manager.register_hook(
                name="error_hook",
                events=HookEvent.WEATHER_UPDATED,
                callback=error_callback
            )
            
            # Emit event
            await hook_manager.emit_event(
                event_type=HookEvent.WEATHER_UPDATED,
                data={"test": "error"}
            )
            
            # Wait for processing
            await asyncio.sleep(0.1)
            
            # Check error was handled
            registration = hook_manager.registered_hooks[hook_id]
            assert registration.error_count == 1
            assert registration.last_error is not None and "Test error" in registration.last_error
            
            # System should still be running
            assert hook_manager.processing_active is True
            
        finally:
            await hook_manager.stop_processing()
    
    @pytest.mark.asyncio
    async def test_invalid_hook_unregistration(self):
        """Test unregistering non-existent hook"""
        hook_manager = DataFlowHookManager()
        
        # Try to unregister non-existent hook
        success = hook_manager.unregister_hook("non_existent_hook")
        assert success is False
    
    @pytest.mark.asyncio
    async def test_disabled_hook_execution(self):
        """Test that disabled hooks don't execute"""
        hook_manager = DataFlowHookManager()
        await hook_manager.start_processing()
        
        try:
            execution_count = 0
            
            def disabled_callback(event: HookEventData):
                nonlocal execution_count
                execution_count += 1
            
            # Register hook
            hook_id = hook_manager.register_hook(
                name="disabled_hook",
                events=HookEvent.WEATHER_UPDATED,
                callback=disabled_callback
            )
            
            # Disable hook
            hook_manager.registered_hooks[hook_id].enabled = False
            
            # Emit event
            await hook_manager.emit_event(
                event_type=HookEvent.WEATHER_UPDATED,
                data={"test": "disabled"}
            )
            
            # Wait for processing
            await asyncio.sleep(0.1)
            
            # Hook should not have executed
            assert execution_count == 0
            
        finally:
            await hook_manager.stop_processing()


if __name__ == "__main__":
    # Run basic tests
    async def run_basic_tests():
        print("Testing Data Flow Hook Manager...")
        
        manager = DataFlowHookManager()
        await manager.start_processing()
        
        try:
            # Test basic registration and execution
            results = []
            
            async def test_callback(event: HookEventData):
                results.append(f"Processed {event.event_type.value} with data: {event.data}")
            
            hook_id = manager.register_hook(
                name="basic_test_hook",
                events=[HookEvent.WEATHER_UPDATED, HookEvent.INJURY_REPORTED],
                callback=test_callback,
                description="Basic test hook"
            )
            
            print(f"Registered hook: {hook_id}")
            
            # Emit some events
            await manager.emit_event(
                event_type=HookEvent.WEATHER_UPDATED,
                data={"temperature": 75, "wind": 10}
            )
            
            await manager.emit_event(
                event_type=HookEvent.INJURY_REPORTED,
                data={"player": "Test Player", "severity": "minor"}
            )
            
            # Wait for processing
            await asyncio.sleep(0.2)
            
            print(f"Hook executions: {len(results)}")
            for result in results:
                print(f"  - {result}")
            
            # Get statistics
            stats = await manager.get_hook_stats()
            print(f"System stats: {stats}")
            
            hook_stats = await manager.get_hook_stats(hook_id)
            print(f"Hook stats: {hook_stats}")
            
            # Test convenience functions
            await emit_weather_update({"temp": 80}, "test_ballpark")
            await emit_injury_report({"type": "ankle"}, "player_123")
            
            await asyncio.sleep(0.1)
            
            print(f"Total executions after convenience functions: {len(results)}")
            
        finally:
            await manager.stop_processing()
        
        print("Basic tests completed successfully!")
    
    asyncio.run(run_basic_tests())