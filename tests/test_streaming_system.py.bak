"""
Comprehensive Test Suite for Streaming System

Unit tests, integration tests, and performance tests for the entire 
real-time market streaming architecture.
"""

import pytest
import asyncio
import time
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List

# Import streaming components
from backend.services.streaming.market_streamer import MarketStreamer
from backend.services.streaming.event_bus import EventBus
from backend.services.providers.provider_registry import ProviderRegistry
from backend.services.providers.base_provider import BaseMarketDataProvider, ExternalPropRecord
from backend.services.rationale.portfolio_rationale_service import (
    PortfolioRationaleService, 
    RationaleRequest, 
    RationaleType
)
from backend.models.streaming import MockProviderState, ProviderStatus


# ============================================================================
# UNIT TESTS
# ============================================================================

class TestMarketStreamer:
    """Unit tests for MarketStreamer"""
    
    @pytest.fixture
    def mock_provider_registry(self):
        registry = Mock(spec=ProviderRegistry)
        registry.get_all_providers.return_value = {
            "test_provider": Mock(spec=BaseMarketDataProvider)
        }
        registry.get_provider.return_value = Mock(spec=BaseMarketDataProvider)
        return registry
    
    @pytest.fixture
    def mock_event_bus(self):
        event_bus = Mock(spec=EventBus)
        event_bus.publish = AsyncMock()
        return event_bus
    
    @pytest.fixture
    def streamer(self, mock_provider_registry, mock_event_bus):
        with patch('backend.services.streaming.market_streamer.provider_registry', mock_provider_registry):
            with patch('backend.services.streaming.market_streamer.event_bus', mock_event_bus):
                return MarketStreamer()
    
    def test_streamer_initialization(self, streamer):
        """Test streamer initializes correctly"""
        assert streamer.is_running == False
        assert streamer.active_providers == []
        assert streamer.total_events == 0
        assert isinstance(streamer.cycle_duration, (int, float))
    
    @pytest.mark.asyncio
    async def test_start_streaming(self, streamer):
        """Test starting the streaming process"""
        # Mock the streaming loop to avoid infinite running
        with patch.object(streamer, '_streaming_loop', new_callable=AsyncMock) as mock_loop:
            await streamer.start()
            assert streamer.is_running == True
            mock_loop.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_stop_streaming(self, streamer):
        """Test stopping the streaming process"""
        streamer.is_running = True
        await streamer.stop()
        assert streamer.is_running == False
    
    def test_get_status(self, streamer):
        """Test status reporting"""
        status = streamer.get_status()
        assert isinstance(status, dict)
        assert "is_running" in status
        assert "active_providers" in status
        assert "total_events" in status
        assert "last_cycle_time" in status
        assert "events_per_second" in status


class TestEventBus:
    """Unit tests for EventBus"""
    
    @pytest.fixture
    def event_bus(self):
        return EventBus()
    
    def test_event_bus_initialization(self, event_bus):
        """Test event bus initializes correctly"""
        assert hasattr(event_bus, 'subscribers')
        assert hasattr(event_bus, 'event_history')
        assert hasattr(event_bus, 'total_events')
    
    def test_subscribe_to_events(self, event_bus):
        """Test subscribing to event types"""
        handler = Mock()
        event_bus.subscribe("test_event", handler)
        assert "test_event" in event_bus.subscribers
        assert handler in event_bus.subscribers["test_event"]
    
    def test_unsubscribe_from_events(self, event_bus):
        """Test unsubscribing from event types"""
        handler = Mock()
        event_bus.subscribe("test_event", handler)
        event_bus.unsubscribe("test_event", handler)
        assert handler not in event_bus.subscribers.get("test_event", [])
    
    @pytest.mark.asyncio
    async def test_publish_events(self, event_bus):
        """Test publishing events to subscribers"""
        handler = AsyncMock()
        event_bus.subscribe("test_event", handler)
        
        test_data = {"key": "value"}
        await event_bus.publish("test_event", test_data)
        
        handler.assert_called_once_with(test_data)
        assert event_bus.total_events == 1


class TestProviderRegistry:
    """Unit tests for ProviderRegistry"""
    
    @pytest.fixture
    def provider_registry(self):
        return ProviderRegistry()
    
    @pytest.fixture
    def mock_provider(self):
        provider = Mock(spec=BaseMarketDataProvider)
        provider.provider_name = "test_provider"
        provider.supports_incremental = True
        provider.health_check = AsyncMock(return_value=True)
        return provider
    
    def test_registry_initialization(self, provider_registry):
        """Test registry initializes correctly"""
        assert hasattr(provider_registry, '_providers')
        assert hasattr(provider_registry, '_provider_health')
        assert hasattr(provider_registry, '_provider_states')
    
    def test_register_provider(self, provider_registry, mock_provider):
        """Test registering a new provider"""
        provider_registry.register_provider("test_provider", mock_provider)
        assert "test_provider" in provider_registry._providers
        assert provider_registry.get_provider("test_provider") == mock_provider
    
    def test_unregister_provider(self, provider_registry, mock_provider):
        """Test unregistering a provider"""
        provider_registry.register_provider("test_provider", mock_provider)
        provider_registry.unregister_provider("test_provider")
        assert "test_provider" not in provider_registry._providers
    
    def test_get_all_providers(self, provider_registry, mock_provider):
        """Test getting all registered providers"""
        provider_registry.register_provider("test_provider", mock_provider)
        all_providers = provider_registry.get_all_providers()
        assert isinstance(all_providers, dict)
        assert "test_provider" in all_providers
    
    @pytest.mark.asyncio
    async def test_health_check_provider(self, provider_registry, mock_provider):
        """Test health checking a provider"""
        provider_registry.register_provider("test_provider", mock_provider)
        is_healthy = await provider_registry.health_check_provider("test_provider")
        assert is_healthy == True
        mock_provider.health_check.assert_called_once()


class TestPortfolioRationaleService:
    """Unit tests for Portfolio Rationale Service"""
    
    @pytest.fixture
    def rationale_service(self):
        return PortfolioRationaleService()
    
    @pytest.fixture
    def sample_request(self):
        return RationaleRequest(
            rationale_type=RationaleType.PORTFOLIO_SUMMARY,
            portfolio_data={"total_value": 10000, "positions": 5},
            context={"market_trend": "bullish"},
            user_preferences={"risk_tolerance": "moderate"}
        )
    
    def test_service_initialization(self, rationale_service):
        """Test service initializes correctly"""
        assert hasattr(rationale_service, 'cache')
        assert hasattr(rationale_service, 'rate_limiter')
        assert hasattr(rationale_service, 'total_requests')
        assert hasattr(rationale_service, 'cache_hits')
    
    @pytest.mark.asyncio
    async def test_generate_rationale(self, rationale_service, sample_request):
        """Test rationale generation"""
        with patch.object(rationale_service, '_call_llm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = {
                "narrative": "Test narrative",
                "key_points": ["Point 1", "Point 2"],
                "confidence": 0.8
            }
            
            result = await rationale_service.generate_rationale(sample_request)
            
            assert result is not None
            assert result.narrative == "Test narrative"
            assert result.confidence == 0.8
            assert len(result.key_points) == 2
    
    def test_get_status(self, rationale_service):
        """Test status reporting"""
        status = rationale_service.get_status()
        assert isinstance(status, dict)
        assert "is_available" in status
        assert "cache_size" in status
        assert "total_requests" in status
        assert "cache_hits" in status
    
    def test_health_check(self, rationale_service):
        """Test health check"""
        is_healthy = rationale_service.health_check()
        assert isinstance(is_healthy, bool)


class TestMockProviderState:
    """Unit tests for MockProviderState"""
    
    def test_mock_state_initialization(self):
        """Test mock state initializes correctly"""
        mock_state = MockProviderState("test_provider")
        assert mock_state.provider_name == "test_provider"
        assert mock_state.status == ProviderStatus.INACTIVE
        assert mock_state.is_enabled == True
        assert isinstance(mock_state.capabilities, dict)
    
    def test_to_dict_conversion(self):
        """Test converting mock state to dictionary"""
        mock_state = MockProviderState("test_provider")
        state_dict = mock_state.to_dict()
        
        assert isinstance(state_dict, dict)
        assert "provider_name" in state_dict
        assert "status" in state_dict
        assert "capabilities" in state_dict
        assert "performance_metrics" in state_dict
        assert "data_metrics" in state_dict


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestStreamingIntegration:
    """Integration tests for end-to-end streaming workflow"""
    
    @pytest.fixture
    def integration_setup(self):
        """Set up components for integration testing"""
        # Create mock provider
        provider = Mock(spec=BaseMarketDataProvider)
        provider.provider_name = "integration_provider"
        provider.supports_incremental = True
        provider.health_check = AsyncMock(return_value=True)
        provider.fetch_data = AsyncMock(return_value=[
            ExternalPropRecord(
                provider_prop_id="test_1",
                external_player_id="player_1",
                player_name="Test Player",
                team_code="TST",
                prop_category="over",
                line_value=50.5,
                updated_ts=datetime.utcnow(),
                payout_type="decimal",
                status="active"
            )
        ])
        
        # Create registry and register provider
        registry = ProviderRegistry()
        registry.register_provider("integration_provider", provider)
        
        # Create event bus
        event_bus = EventBus()
        
        return {
            "provider": provider,
            "registry": registry,
            "event_bus": event_bus
        }
    
    @pytest.mark.asyncio
    async def test_provider_to_streamer_integration(self, integration_setup):
        """Test data flow from provider through streamer"""
        provider = integration_setup["provider"]
        registry = integration_setup["registry"]
        
        with patch('backend.services.streaming.market_streamer.provider_registry', registry):
            streamer = MarketStreamer()
            
            # Test that streamer can access registered provider
            await streamer._process_provider_data("integration_provider")
            provider.fetch_data.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_event_bus_integration(self, integration_setup):
        """Test event publishing and subscription integration"""
        event_bus = integration_setup["event_bus"]
        
        # Set up event handler
        received_events = []
        async def test_handler(data):
            received_events.append(data)
        
        event_bus.subscribe("test_integration", test_handler)
        
        # Publish test event
        test_data = {"integration": "test", "timestamp": datetime.utcnow().isoformat()}
        await event_bus.publish("test_integration", test_data)
        
        # Verify event was received
        assert len(received_events) == 1
        assert received_events[0]["integration"] == "test"
    
    @pytest.mark.asyncio
    async def test_full_streaming_workflow(self, integration_setup):
        """Test complete streaming workflow"""
        provider = integration_setup["provider"]
        registry = integration_setup["registry"]
        event_bus = integration_setup["event_bus"]
        
        # Track published events
        published_events = []
        original_publish = event_bus.publish
        
        async def track_publish(event_type, data):
            published_events.append({"type": event_type, "data": data})
            return await original_publish(event_type, data)
        
        event_bus.publish = track_publish
        
        with patch('backend.services.streaming.market_streamer.provider_registry', registry):
            with patch('backend.services.streaming.market_streamer.event_bus', event_bus):
                streamer = MarketStreamer()
                
                # Process one cycle
                await streamer._process_provider_data("integration_provider")
                
                # Verify data was fetched and events published
                provider.fetch_data.assert_called_once()
                assert len(published_events) > 0


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

class TestStreamingPerformance:
    """Performance tests for streaming system"""
    
    @pytest.mark.asyncio
    async def test_high_volume_event_processing(self):
        """Test processing high volume of events"""
        event_bus = EventBus()
        
        # Track processing times
        start_time = time.time()
        
        # Process 1000 events
        tasks = []
        for i in range(1000):
            task = event_bus.publish("performance_test", {"event_id": i})
            tasks.append(task)
        
        await asyncio.gather(*tasks)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Performance assertions
        assert processing_time < 5.0  # Should process 1000 events in < 5 seconds
        assert event_bus.total_events == 1000
        
        print(f"Processed 1000 events in {processing_time:.3f} seconds")
        print(f"Events per second: {1000 / processing_time:.1f}")
    
    @pytest.mark.asyncio
    async def test_concurrent_provider_processing(self):
        """Test concurrent processing of multiple providers"""
        registry = ProviderRegistry()
        
        # Create multiple mock providers
        providers = {}
        for i in range(10):
            provider = Mock(spec=BaseMarketDataProvider)
            provider.provider_name = f"provider_{i}"
            provider.health_check = AsyncMock(return_value=True)
            provider.fetch_data = AsyncMock(return_value=[])
            
            providers[f"provider_{i}"] = provider
            registry.register_provider(f"provider_{i}", provider)
        
        start_time = time.time()
        
        # Health check all providers concurrently
        health_results = await registry.health_check_all_providers()
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Performance assertions
        assert len(health_results) == 10
        assert all(health_results.values())  # All should be healthy
        assert processing_time < 2.0  # Should complete in < 2 seconds
        
        print(f"Health checked 10 providers in {processing_time:.3f} seconds")
    
    @pytest.mark.asyncio
    async def test_rationale_service_performance(self):
        """Test rationale service performance under load"""
        service = PortfolioRationaleService()
        
        # Mock the LLM service for consistent timing
        with patch.object(service, '_call_llm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = {
                "narrative": "Performance test narrative",
                "key_points": ["Point 1", "Point 2"],
                "confidence": 0.8
            }
            
            start_time = time.time()
            
            # Generate 50 rationales concurrently
            tasks = []
            for i in range(50):
                request = RationaleRequest(
                    rationale_type=RationaleType.PORTFOLIO_SUMMARY,
                    portfolio_data={"request_id": i, "value": 1000 * i}
                )
                task = service.generate_rationale(request)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Performance assertions
            successful_results = [r for r in results if not isinstance(r, Exception)]
            assert len(successful_results) > 0  # At least some should succeed
            assert processing_time < 10.0  # Should complete in < 10 seconds
            
            print(f"Generated {len(successful_results)} rationales in {processing_time:.3f} seconds")
            print(f"Rationales per second: {len(successful_results) / processing_time:.1f}")
    
    def test_memory_usage_under_load(self):
        """Test memory usage during high-load scenarios"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create many mock objects to simulate load
        mock_states = []
        for i in range(10000):
            mock_state = MockProviderState(f"provider_{i}")
            mock_states.append(mock_state)
        
        peak_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = peak_memory - initial_memory
        
        # Clean up
        del mock_states
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        print(f"Initial memory: {initial_memory:.1f} MB")
        print(f"Peak memory: {peak_memory:.1f} MB")
        print(f"Final memory: {final_memory:.1f} MB")
        print(f"Memory increase: {memory_increase:.1f} MB")
        
        # Performance assertions
        assert memory_increase < 100  # Should not increase by more than 100 MB
        assert final_memory < initial_memory + 50  # Should clean up most memory


# ============================================================================
# TEST CONFIGURATION AND FIXTURES
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


def pytest_configure(config):
    """Configure pytest for streaming tests"""
    config.addinivalue_line(
        "markers", "asyncio: mark test as async"
    )
    config.addinivalue_line(
        "markers", "performance: mark test as performance test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )


if __name__ == "__main__":
    # Run tests with coverage
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--asyncio-mode=auto",
        "-m", "not performance",  # Skip performance tests by default
        "--cov=backend.services.streaming",
        "--cov=backend.services.providers", 
        "--cov=backend.services.rationale",
        "--cov-report=html",
        "--cov-report=term-missing"
    ])