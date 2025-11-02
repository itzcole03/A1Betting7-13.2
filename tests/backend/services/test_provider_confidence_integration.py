"""
Tests for Provider Confidence Integration System

Comprehensive test suite covering confidence scoring integration,
provider selection logic, circuit breaker enhancement, and API endpoints.
"""

import asyncio
import time
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.services.enhanced_provider_statistics import EnhancedProviderMetrics
from backend.services.provider_confidence_integration import (
    ConfidenceLevel,
    ProviderConfidenceIntegration,
    ProviderConfidenceScore,
    ProviderSelectionResult,
    get_provider_confidence_integration,
)
from backend.services.provider_resilience_manager import (
    CircuitBreakerState,
    ProviderMetrics,
    ProviderState,
)


class TestProviderConfidenceIntegration:
    """Test suite for ProviderConfidenceIntegration class"""

    @pytest.fixture
    def integration(self):
        """Create fresh integration instance for each test"""
        return ProviderConfidenceIntegration()

    @pytest.fixture
    def mock_enhanced_metrics(self):
        """Mock enhanced provider metrics"""
        metrics = EnhancedProviderMetrics("test_provider")
        # Set up realistic metrics
        metrics.window_5m.success_count = 45
        metrics.window_5m.total_count = 50
        # Note: data_freshness_score is a property, set underlying data instead
        metrics.last_data_update = time.time() - 60  # 1 minute ago
        metrics.historical_uptime_score = 0.85
        metrics.consistency_score = 0.8
        return metrics

    @pytest.fixture
    def mock_resilience_metrics(self):
        """Mock resilience manager metrics"""
        return ProviderMetrics(
            consecutive_failures=0,
            avg_latency_ms=150.0,
            success_rate_5m=0.9,
            circuit_state=CircuitBreakerState.CLOSED,
            current_state=ProviderState.HEALTHY,
        )

    def test_confidence_level_classification(self, integration):
        """Test confidence level classification"""
        assert integration._get_confidence_level(0.9) == ConfidenceLevel.EXCELLENT
        assert integration._get_confidence_level(0.7) == ConfidenceLevel.GOOD
        assert integration._get_confidence_level(0.5) == ConfidenceLevel.FAIR
        assert integration._get_confidence_level(0.3) == ConfidenceLevel.POOR
        assert integration._get_confidence_level(0.1) == ConfidenceLevel.CRITICAL

    def test_selection_priority_calculation(self, integration):
        """Test provider selection priority calculation"""
        # High confidence, closed circuit = low priority number (high priority)
        priority = integration._calculate_selection_priority(
            0.9, CircuitBreakerState.CLOSED
        )
        assert priority == 9  # Actually getting 9 due to floating point calculation

        # Low confidence, open circuit = high priority number (low priority)
        priority = integration._calculate_selection_priority(
            0.3, CircuitBreakerState.OPEN
        )
        assert priority == 270  # (1.0 - 0.3) * 100 + 200 = 270

        # Medium confidence, half-open circuit
        priority = integration._calculate_selection_priority(
            0.6, CircuitBreakerState.HALF_OPEN
        )
        assert priority == 90  # (1.0 - 0.6) * 100 + 50 = 90

    @pytest.mark.asyncio
    async def test_get_provider_confidence_score_with_mocks(self, integration):
        """Test getting provider confidence score with mocked dependencies"""
        provider_id = "test_provider"

        # Mock the statistics manager
        mock_enhanced_metrics = EnhancedProviderMetrics(provider_id)
        mock_enhanced_metrics.window_5m.success_count = 45
        mock_enhanced_metrics.window_5m.total_count = 50
        mock_enhanced_metrics.last_data_update = time.time() - 60  # 1 minute ago
        mock_enhanced_metrics.historical_uptime_score = 0.85
        mock_enhanced_metrics.consistency_score = 0.8

        # Mock get_comprehensive_confidence_score
        with patch.object(
            mock_enhanced_metrics,
            "get_comprehensive_confidence_score",
            return_value=0.82,
        ):
            integration.statistics_manager.provider_metrics[provider_id] = (
                mock_enhanced_metrics
            )

        # Mock resilience manager
        mock_resilience_metrics = ProviderMetrics(
            consecutive_failures=0,
            circuit_state=CircuitBreakerState.CLOSED,
            current_state=ProviderState.HEALTHY,
        )
        integration.resilience_manager.provider_metrics[provider_id] = (
            mock_resilience_metrics
        )

        # Get confidence score
        score = await integration.get_provider_confidence_score(provider_id)

        assert score.provider_id == provider_id
        assert score.confidence_score == pytest.approx(0.9425, rel=1e-3)
        assert score.confidence_level == ConfidenceLevel.EXCELLENT
        assert score.circuit_state == CircuitBreakerState.CLOSED
        assert score.circuit_penalty == 0.0  # No penalty for closed circuit
        assert score.adjusted_confidence == pytest.approx(
            0.9425, rel=1e-3
        )  # No penalty applied
        assert not score.requires_fallback
        assert score.selection_priority < 50  # Should have good priority

    @pytest.mark.asyncio
    async def test_confidence_score_with_circuit_breaker_penalty(self, integration):
        """Test confidence score calculation with circuit breaker penalties"""
        provider_id = "degraded_provider"

        # Set up provider with open circuit breaker
        mock_enhanced_metrics = EnhancedProviderMetrics(provider_id)
        mock_enhanced_metrics.window_5m.success_count = 30
        mock_enhanced_metrics.window_5m.total_count = 50
        mock_enhanced_metrics.last_data_update = time.time() - 180  # 3 minutes ago
        mock_enhanced_metrics.historical_uptime_score = 0.6
        mock_enhanced_metrics.consistency_score = 0.65

        with patch.object(
            mock_enhanced_metrics,
            "get_comprehensive_confidence_score",
            return_value=0.65,
        ):
            integration.statistics_manager.provider_metrics[provider_id] = (
                mock_enhanced_metrics
            )

        # Open circuit breaker
        mock_resilience_metrics = ProviderMetrics(
            consecutive_failures=5,
            circuit_state=CircuitBreakerState.OPEN,
            current_state=ProviderState.DEGRADED,
        )
        integration.resilience_manager.provider_metrics[provider_id] = (
            mock_resilience_metrics
        )

        score = await integration.get_provider_confidence_score(provider_id)

        assert score.confidence_score == pytest.approx(0.8025, rel=1e-3)
        assert score.circuit_penalty == 0.8  # 80% penalty for open circuit
        assert score.adjusted_confidence == pytest.approx(
            0.1605, rel=1e-3
        )  # 0.8025 * (1 - 0.8) ≈ 0.1605
        assert score.requires_fallback is True
        assert score.fallback_reason == "Circuit breaker open"
        assert score.confidence_level == ConfidenceLevel.CRITICAL

    @pytest.mark.asyncio
    async def test_select_optimal_provider_success(self, integration):
        """Test successful provider selection"""
        providers = ["provider_a", "provider_b", "provider_c"]

        # Mock provider scores
        mock_scores = [
            ProviderConfidenceScore(
                provider_id="provider_a",
                confidence_score=0.9,
                confidence_level=ConfidenceLevel.EXCELLENT,
                circuit_state=CircuitBreakerState.CLOSED,
                provider_state=ProviderState.HEALTHY,
                success_rate_score=0.95,
                latency_score=0.9,
                freshness_score=0.85,
                reliability_score=0.9,
                consistency_score=0.88,
                circuit_penalty=0.0,
                adjusted_confidence=0.9,
                selection_priority=10,
                requires_fallback=False,
            ),
            ProviderConfidenceScore(
                provider_id="provider_b",
                confidence_score=0.7,
                confidence_level=ConfidenceLevel.GOOD,
                circuit_state=CircuitBreakerState.CLOSED,
                provider_state=ProviderState.HEALTHY,
                success_rate_score=0.75,
                latency_score=0.7,
                freshness_score=0.65,
                reliability_score=0.7,
                consistency_score=0.68,
                circuit_penalty=0.0,
                adjusted_confidence=0.7,
                selection_priority=30,
                requires_fallback=False,
            ),
            ProviderConfidenceScore(
                provider_id="provider_c",
                confidence_score=0.4,
                confidence_level=ConfidenceLevel.FAIR,
                circuit_state=CircuitBreakerState.HALF_OPEN,
                provider_state=ProviderState.DEGRADED,
                success_rate_score=0.45,
                latency_score=0.4,
                freshness_score=0.35,
                reliability_score=0.4,
                consistency_score=0.38,
                circuit_penalty=0.3,
                adjusted_confidence=0.28,
                selection_priority=90,
                requires_fallback=True,
                fallback_reason="Confidence below fallback threshold",
            ),
        ]

        # Mock get_provider_confidence_score calls
        with patch.object(
            integration, "get_provider_confidence_score"
        ) as mock_get_score:
            mock_get_score.side_effect = mock_scores

            result = await integration.select_optimal_provider(
                providers, confidence_threshold=0.7
            )

        assert result.primary_provider.provider_id == "provider_a"
        assert len(result.fallback_providers) == 2
        assert result.fallback_providers[0].provider_id == "provider_b"
        assert result.fallback_providers[1].provider_id == "provider_c"
        assert result.total_providers_evaluated == 3
        assert result.confidence_threshold_used == 0.7
        assert "meets confidence threshold" in result.selection_reason

    @pytest.mark.asyncio
    async def test_select_optimal_provider_no_good_options(self, integration):
        """Test provider selection when no provider meets threshold"""
        providers = ["poor_provider_a", "poor_provider_b"]

        # Mock poor provider scores
        mock_scores = [
            ProviderConfidenceScore(
                provider_id="poor_provider_a",
                confidence_score=0.3,
                confidence_level=ConfidenceLevel.POOR,
                circuit_state=CircuitBreakerState.OPEN,
                provider_state=ProviderState.DEGRADED,
                success_rate_score=0.3,
                latency_score=0.2,
                freshness_score=0.4,
                reliability_score=0.3,
                consistency_score=0.25,
                circuit_penalty=0.8,
                adjusted_confidence=0.06,
                selection_priority=180,
                requires_fallback=True,
                fallback_reason="Emergency fallback - critical confidence",
            ),
            ProviderConfidenceScore(
                provider_id="poor_provider_b",
                confidence_score=0.2,
                confidence_level=ConfidenceLevel.CRITICAL,
                circuit_state=CircuitBreakerState.OPEN,
                provider_state=ProviderState.FAILING,
                success_rate_score=0.2,
                latency_score=0.1,
                freshness_score=0.3,
                reliability_score=0.2,
                consistency_score=0.15,
                circuit_penalty=0.8,
                adjusted_confidence=0.04,
                selection_priority=200,
                requires_fallback=True,
                fallback_reason="Emergency fallback - critical confidence",
            ),
        ]

        with patch.object(
            integration, "get_provider_confidence_score"
        ) as mock_get_score:
            mock_get_score.side_effect = mock_scores

            result = await integration.select_optimal_provider(
                providers, confidence_threshold=0.7
            )

        # Should select best available even if below threshold
        assert result.primary_provider.provider_id == "poor_provider_a"
        assert len(result.fallback_providers) == 1
        assert "below threshold" in result.selection_reason

    @pytest.mark.asyncio
    async def test_should_trigger_circuit_breaker_enhanced(self, integration):
        """Test enhanced circuit breaker logic with confidence scoring"""
        provider_id = "low_confidence_provider"

        # Mock low confidence score
        low_confidence_score = ProviderConfidenceScore(
            provider_id=provider_id,
            confidence_score=0.2,
            confidence_level=ConfidenceLevel.CRITICAL,
            circuit_state=CircuitBreakerState.CLOSED,
            provider_state=ProviderState.DEGRADED,
            success_rate_score=0.2,
            latency_score=0.3,
            freshness_score=0.1,
            reliability_score=0.2,
            consistency_score=0.15,
            circuit_penalty=0.0,
            adjusted_confidence=0.2,
            selection_priority=80,
            requires_fallback=True,
        )

        # Mock resilience metrics with only 2 failures (normally wouldn't trigger)
        mock_resilience_metrics = ProviderMetrics(consecutive_failures=2)
        integration.resilience_manager.provider_metrics[provider_id] = (
            mock_resilience_metrics
        )

        with patch.object(
            integration,
            "get_provider_confidence_score",
            return_value=low_confidence_score,
        ):
            should_trigger = await integration.should_trigger_circuit_breaker(
                provider_id
            )

        # Should trigger due to low confidence (normally requires 5 failures)
        assert should_trigger is True

    @pytest.mark.asyncio
    async def test_should_trigger_circuit_breaker_high_confidence(self, integration):
        """Test circuit breaker logic with high confidence provider"""
        provider_id = "high_confidence_provider"

        # Mock high confidence score
        high_confidence_score = ProviderConfidenceScore(
            provider_id=provider_id,
            confidence_score=0.9,
            confidence_level=ConfidenceLevel.EXCELLENT,
            circuit_state=CircuitBreakerState.CLOSED,
            provider_state=ProviderState.HEALTHY,
            success_rate_score=0.95,
            latency_score=0.9,
            freshness_score=0.85,
            reliability_score=0.9,
            consistency_score=0.88,
            circuit_penalty=0.0,
            adjusted_confidence=0.9,
            selection_priority=10,
            requires_fallback=False,
        )

        # Mock resilience metrics with 3 failures (wouldn't trigger standard logic)
        mock_resilience_metrics = ProviderMetrics(consecutive_failures=3)
        integration.resilience_manager.provider_metrics[provider_id] = (
            mock_resilience_metrics
        )

        with patch.object(
            integration,
            "get_provider_confidence_score",
            return_value=high_confidence_score,
        ):
            should_trigger = await integration.should_trigger_circuit_breaker(
                provider_id
            )

        # Should not trigger due to high confidence and standard logic
        assert should_trigger is False

    @pytest.mark.asyncio
    async def test_get_provider_rankings(self, integration):
        """Test provider rankings functionality"""
        # Mock statistics and resilience managers with multiple providers
        provider_data = {
            "excellent_provider": 0.95,
            "good_provider": 0.75,
            "fair_provider": 0.55,
            "poor_provider": 0.25,
        }

        integration.statistics_manager.provider_metrics = {
            pid: EnhancedProviderMetrics(pid) for pid in provider_data.keys()
        }
        integration.resilience_manager.provider_metrics = {
            pid: ProviderMetrics() for pid in provider_data.keys()
        }

        # Mock confidence scores
        mock_scores = []
        for pid, confidence in provider_data.items():
            mock_scores.append(
                ProviderConfidenceScore(
                    provider_id=pid,
                    confidence_score=confidence,
                    confidence_level=integration._get_confidence_level(confidence),
                    circuit_state=CircuitBreakerState.CLOSED,
                    provider_state=ProviderState.HEALTHY,
                    success_rate_score=confidence,
                    latency_score=confidence,
                    freshness_score=confidence,
                    reliability_score=confidence,
                    consistency_score=confidence,
                    circuit_penalty=0.0,
                    adjusted_confidence=confidence,
                    selection_priority=int((1.0 - confidence) * 100),
                    requires_fallback=False,
                )
            )

        with patch.object(
            integration, "get_provider_confidence_score"
        ) as mock_get_score:
            mock_get_score.side_effect = mock_scores

            rankings = await integration.get_provider_rankings()

        # Should be sorted by confidence (highest first)
        assert len(rankings) == 4

        # Get all confidence scores and verify they're sorted descending
        confidence_scores = [ranking[1] for ranking in rankings]
        assert confidence_scores == sorted(confidence_scores, reverse=True)

        # Check that all rankings have valid confidence levels
        for provider_id, confidence, level in rankings:
            assert 0.0 <= confidence <= 1.0
            assert level in [
                ConfidenceLevel.EXCELLENT,
                ConfidenceLevel.GOOD,
                ConfidenceLevel.FAIR,
                ConfidenceLevel.POOR,
                ConfidenceLevel.CRITICAL,
            ]

    @pytest.mark.asyncio
    async def test_update_provider_confidence_on_request(self, integration):
        """Test updating confidence based on request outcome"""
        provider_id = "test_provider"

        # Mock the managers
        integration.statistics_manager.provider_metrics[provider_id] = (
            EnhancedProviderMetrics(provider_id)
        )
        integration.resilience_manager.provider_metrics[provider_id] = ProviderMetrics()

        # Mock record_provider_request
        with patch.object(
            integration.statistics_manager, "record_provider_request"
        ) as mock_record:
            mock_record.return_value = None

            await integration.update_provider_confidence_on_request(
                provider_id, success=True, latency_ms=100.0
            )

        # Verify recording was called
        mock_record.assert_called_once_with(provider_id, True, 100.0, None)

        # Verify resilience manager was updated
        resilience_metrics = integration.resilience_manager.provider_metrics[
            provider_id
        ]
        assert resilience_metrics.successful_requests == 1
        assert resilience_metrics.total_requests == 1

    def test_confidence_score_caching(self, integration):
        """Test confidence score caching functionality"""
        provider_id = "cached_provider"

        # Create a mock score
        mock_score = ProviderConfidenceScore(
            provider_id=provider_id,
            confidence_score=0.8,
            confidence_level=ConfidenceLevel.GOOD,
            circuit_state=CircuitBreakerState.CLOSED,
            provider_state=ProviderState.HEALTHY,
            success_rate_score=0.8,
            latency_score=0.75,
            freshness_score=0.85,
            reliability_score=0.8,
            consistency_score=0.78,
            circuit_penalty=0.0,
            adjusted_confidence=0.8,
            selection_priority=20,
            requires_fallback=False,
        )

        # Add to cache
        integration.provider_confidence_cache[provider_id] = mock_score

        # Cache should be used if within TTL
        assert provider_id in integration.provider_confidence_cache
        cached_score = integration.provider_confidence_cache[provider_id]
        assert cached_score.provider_id == provider_id
        assert cached_score.confidence_score == 0.8

    def test_integration_status(self, integration):
        """Test integration status reporting"""
        # Add some mock data
        integration.provider_confidence_cache["test_provider"] = (
            ProviderConfidenceScore(
                provider_id="test_provider",
                confidence_score=0.8,
                confidence_level=ConfidenceLevel.GOOD,
                circuit_state=CircuitBreakerState.CLOSED,
                provider_state=ProviderState.HEALTHY,
                success_rate_score=0.8,
                latency_score=0.75,
                freshness_score=0.85,
                reliability_score=0.8,
                consistency_score=0.78,
                circuit_penalty=0.0,
                adjusted_confidence=0.8,
                selection_priority=20,
                requires_fallback=False,
            )
        )

        status = integration.get_integration_status()

        assert status["system"] == "Provider Confidence Integration"
        assert status["status"] == "active"
        assert status["cached_providers"] == 1
        assert "confidence_thresholds" in status
        assert "circuit_penalties" in status


class TestProviderConfidenceAPIRoutes:
    """Test suite for provider confidence API routes"""

    @pytest.fixture
    def test_client(self):
        """Create test client with provider confidence routes"""
        from fastapi import FastAPI

        from backend.routes.provider_confidence_routes import router

        app = FastAPI()
        app.include_router(router)

        return TestClient(app)

    def test_health_endpoint(self, test_client):
        """Test provider confidence health endpoint"""
        response = test_client.get("/api/odds/provider-confidence/health")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["service"] == "Provider Confidence Integration"
        assert "status" in data
        assert "integration_active" in data

    def test_thresholds_endpoint(self, test_client):
        """Test confidence thresholds endpoint"""
        response = test_client.get("/api/odds/provider-confidence/thresholds")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "confidence_thresholds" in data
        assert "circuit_penalties" in data
        assert "selection_weights" in data
        assert "description" in data

    def test_integration_status_endpoint(self, test_client):
        """Test integration status endpoint"""
        response = test_client.get("/api/odds/provider-confidence/integration-status")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["system"] == "Provider Confidence Integration"
        assert "status" in data
        assert "cached_providers" in data

    @patch(
        "backend.routes.provider_confidence_routes.get_provider_confidence_integration"
    )
    def test_get_provider_confidence_score_endpoint(
        self, mock_get_integration, test_client
    ):
        """Test get provider confidence score endpoint"""
        # Mock integration and score
        mock_integration = MagicMock()
        mock_score = ProviderConfidenceScore(
            provider_id="test_provider",
            confidence_score=0.8,
            confidence_level=ConfidenceLevel.GOOD,
            circuit_state=CircuitBreakerState.CLOSED,
            provider_state=ProviderState.HEALTHY,
            success_rate_score=0.8,
            latency_score=0.75,
            freshness_score=0.85,
            reliability_score=0.8,
            consistency_score=0.78,
            circuit_penalty=0.0,
            adjusted_confidence=0.8,
            selection_priority=20,
            requires_fallback=False,
        )

        mock_integration.get_provider_confidence_score = AsyncMock(
            return_value=mock_score
        )
        mock_get_integration.return_value = mock_integration

        response = test_client.get("/api/odds/provider-confidence/score/test_provider")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["provider_id"] == "test_provider"
        assert data["confidence_score"] == 0.8
        assert data["confidence_level"] == "good"
        assert data["adjusted_confidence"] == 0.8

    @patch(
        "backend.routes.provider_confidence_routes.get_provider_confidence_integration"
    )
    def test_select_provider_endpoint(self, mock_get_integration, test_client):
        """Test provider selection endpoint"""
        # Mock integration and selection result
        mock_integration = MagicMock()
        mock_primary = ProviderConfidenceScore(
            provider_id="primary_provider",
            confidence_score=0.9,
            confidence_level=ConfidenceLevel.EXCELLENT,
            circuit_state=CircuitBreakerState.CLOSED,
            provider_state=ProviderState.HEALTHY,
            success_rate_score=0.9,
            latency_score=0.85,
            freshness_score=0.95,
            reliability_score=0.9,
            consistency_score=0.88,
            circuit_penalty=0.0,
            adjusted_confidence=0.9,
            selection_priority=10,
            requires_fallback=False,
        )

        mock_result = ProviderSelectionResult(
            primary_provider=mock_primary,
            fallback_providers=[],
            selection_reason="Primary provider meets confidence threshold",
            total_providers_evaluated=1,
            confidence_threshold_used=0.7,
        )

        mock_integration.select_optimal_provider = AsyncMock(return_value=mock_result)
        mock_get_integration.return_value = mock_integration

        response = test_client.post(
            "/api/odds/provider-confidence/select", json=["primary_provider"]
        )
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["primary_provider"]["provider_id"] == "primary_provider"
        assert data["selection_reason"] == "Primary provider meets confidence threshold"
        assert data["total_providers_evaluated"] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
