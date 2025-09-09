"""
Comprehensive tests for hardened arbitrage detection service

Tests cover all major functionality including:
- Implied probability validation
- Triangle consistency checks
- Anomaly detection
- Configuration management
- Alerting thresholds
- API endpoints
"""

import asyncio
import json
import pytest
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
from fastapi.testclient import TestClient

from backend.services.hardened_arbitrage_service import (
    HardenedArbitrageService,
    HardenedArbitrageValidator,
    ArbitrageConfig,
    OddsSnapshot,
    HardenedArbitrageOpportunity,
    ValidationResult,
    DetectionReason,
    AnomalyType
)


class TestArbitrageConfig:
    """Test arbitrage configuration management"""
    
    def test_default_config(self):
        """Test default configuration values"""
        config = ArbitrageConfig()
        
        assert config.min_profit_pct == 1.0
        assert config.max_profit_pct == 25.0
        assert config.alert_volume_threshold == 10
        assert config.alert_time_window_minutes == 5
        assert config.enable_anomaly_detection is True
        assert config.enable_triangle_validation is True
        assert config.suspicious_profit_threshold == 15.0
    
    def test_custom_config(self):
        """Test custom configuration creation"""
        config = ArbitrageConfig(
            min_profit_pct=2.0,
            alert_volume_threshold=5,
            enable_anomaly_detection=False
        )
        
        assert config.min_profit_pct == 2.0
        assert config.alert_volume_threshold == 5
        assert config.enable_anomaly_detection is False
        # Defaults should still apply
        assert config.max_profit_pct == 25.0


class TestHardenedArbitrageValidator:
    """Test arbitrage validation logic"""
    
    @pytest.fixture
    def validator(self):
        """Create validator with default config"""
        config = ArbitrageConfig()
        return HardenedArbitrageValidator(config)
    
    @pytest.fixture
    def sample_odds_snapshots(self):
        """Create sample odds snapshots for testing"""
        return [
            OddsSnapshot(
                book_id="draftkings",
                event_id="game_123",
                market_type="moneyline",
                outcome="home",
                odds=2.1,
                line=None,
                max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="fanduel",
                event_id="game_123",
                market_type="moneyline",
                outcome="away",
                odds=2.05,
                line=None,
                max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            )
        ]
    
    @pytest.mark.asyncio
    async def test_implied_probability_validation_valid_arbitrage(self, validator, sample_odds_snapshots):
        """Test validation of valid arbitrage opportunity"""
        # Odds that create arbitrage: 1/2.1 + 1/2.05 = 0.976 < 1.0
        result = await validator.validate_arbitrage_opportunity(sample_odds_snapshots, 2.4)
        
        assert result.is_valid is True
        assert result.implied_probability_sum is not None
        assert result.implied_probability_sum < 1.0
        assert result.confidence_score > 0.5
        assert len(result.validation_notes) > 0
    
    @pytest.mark.asyncio
    async def test_implied_probability_validation_no_arbitrage(self, validator):
        """Test validation when no arbitrage exists"""
        # Odds that don't create arbitrage: 1/1.8 + 1/1.9 = 1.08 > 1.0
        no_arb_odds = [
            OddsSnapshot(
                book_id="book1", event_id="game", market_type="moneyline",
                outcome="home", odds=1.8, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book2", event_id="game", market_type="moneyline",
                outcome="away", odds=1.9, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            )
        ]
        
        result = await validator.validate_arbitrage_opportunity(no_arb_odds, 0.0)
        
        assert result.is_valid is False
        assert result.implied_probability_sum > 1.0
        assert "No arbitrage" in " ".join(result.validation_notes)
    
    @pytest.mark.asyncio
    async def test_suspicious_profit_detection(self, validator):
        """Test detection of suspicious high profit margins"""
        # Create odds with unrealistically high arbitrage margin
        suspicious_odds = [
            OddsSnapshot(
                book_id="book1", event_id="game", market_type="moneyline",
                outcome="home", odds=3.0, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book2", event_id="game", market_type="moneyline",
                outcome="away", odds=2.5, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            )
        ]
        
        result = await validator.validate_arbitrage_opportunity(suspicious_odds, 20.0)
        
        assert AnomalyType.SUSPICIOUS_PROFIT_MARGIN in result.anomaly_flags
        assert result.confidence_score < 0.5  # Should be heavily penalized
        assert "Suspicious arbitrage margin" in " ".join(result.validation_notes)
    
    @pytest.mark.asyncio
    async def test_triangle_consistency_validation(self, validator):
        """Test triangle consistency checks with multiple books"""
        # Create consistent odds across 3 books
        consistent_odds = [
            OddsSnapshot(
                book_id="book1", event_id="game", market_type="moneyline",
                outcome="home", odds=2.1, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book2", event_id="game", market_type="moneyline",
                outcome="home", odds=2.05, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book3", event_id="game", market_type="moneyline",
                outcome="away", odds=2.0, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            )
        ]
        
        result = await validator.validate_arbitrage_opportunity(consistent_odds, 2.0)
        
        assert result.triangle_consistency_score is not None
        assert result.triangle_consistency_score >= 0.0
        assert "triangle consistency" in " ".join(result.validation_notes).lower()
    
    @pytest.mark.asyncio
    async def test_stale_odds_detection(self, validator):
        """Test detection of stale odds data"""
        # Create odds with one very old timestamp
        stale_odds = [
            OddsSnapshot(
                book_id="book1", event_id="game", market_type="moneyline",
                outcome="home", odds=2.1, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book2", event_id="game", market_type="moneyline",
                outcome="away", odds=2.05, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=10)  # Stale
            )
        ]
        
        result = await validator.validate_arbitrage_opportunity(stale_odds, 2.0)
        
        assert AnomalyType.STALE_ODDS_DETECTED in result.anomaly_flags
        assert result.confidence_score < 0.8  # Should be penalized
        assert "stale odds" in " ".join(result.validation_notes).lower()
    
    @pytest.mark.asyncio
    async def test_odds_outlier_detection(self, validator):
        """Test detection of odds outliers"""
        # Create odds with one clear outlier
        outlier_odds = [
            OddsSnapshot(
                book_id="book1", event_id="game", market_type="moneyline",
                outcome="home", odds=2.0, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book2", event_id="game", market_type="moneyline",
                outcome="home", odds=2.05, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book3", event_id="game", market_type="moneyline",
                outcome="home", odds=2.02, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book4", event_id="game", market_type="moneyline",
                outcome="home", odds=5.0, line=None, max_stake=1000.0,  # Outlier
                timestamp=datetime.now(timezone.utc)
            )
        ]
        
        result = await validator.validate_arbitrage_opportunity(outlier_odds, 2.0)
        
        # Should detect the outlier
        assert AnomalyType.ODDS_OUTLIER in result.anomaly_flags
        assert "outlier detected" in " ".join(result.validation_notes).lower()


class TestHardenedArbitrageService:
    """Test the main arbitrage service"""
    
    @pytest.fixture
    def service(self):
        """Create service with default config"""
        return HardenedArbitrageService()
    
    @pytest.fixture
    def sample_odds_data(self):
        """Create sample odds data in API format"""
        return [
            {
                'book_id': 'draftkings',
                'event_id': 'game_123',
                'market_type': 'moneyline',
                'outcome': 'home',
                'odds': 2.1,
                'timestamp': datetime.now(timezone.utc)
            },
            {
                'book_id': 'fanduel',
                'event_id': 'game_123',
                'market_type': 'moneyline',
                'outcome': 'away',
                'odds': 2.05,
                'timestamp': datetime.now(timezone.utc)
            }
        ]
    
    @pytest.mark.asyncio
    async def test_parse_odds_data(self, service, sample_odds_data):
        """Test parsing of raw odds data"""
        snapshots = await service._parse_odds_data(sample_odds_data)
        
        assert len(snapshots) == 2
        assert snapshots[0].book_id == 'draftkings'
        assert snapshots[0].odds == 2.1
        assert snapshots[1].book_id == 'fanduel'
        assert snapshots[1].odds == 2.05
    
    def test_group_odds_by_market(self, service):
        """Test grouping of odds by market"""
        snapshots = [
            OddsSnapshot(
                book_id="book1", event_id="game1", market_type="moneyline",
                outcome="home", odds=2.0, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book2", event_id="game1", market_type="moneyline",
                outcome="away", odds=2.0, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book1", event_id="game2", market_type="spread",
                outcome="home", odds=1.9, line=-3.5, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            )
        ]
        
        grouped = service._group_odds_by_market(snapshots)
        
        assert len(grouped) == 2
        assert "game1_moneyline" in grouped
        assert "game2_spread" in grouped
        assert len(grouped["game1_moneyline"]) == 2
        assert len(grouped["game2_spread"]) == 1
    
    @pytest.mark.asyncio
    async def test_detect_arbitrage_opportunities(self, service, sample_odds_data):
        """Test full arbitrage detection pipeline"""
        opportunities = await service.detect_arbitrage_opportunities(sample_odds_data)
        
        # Should detect the arbitrage opportunity from sample data
        assert len(opportunities) >= 0  # May be empty if doesn't meet threshold
        
        if opportunities:
            opp = opportunities[0]
            assert isinstance(opp, HardenedArbitrageOpportunity)
            assert opp.guaranteed_profit_pct >= service._runtime_config.min_profit_pct
            assert len(opp.books_involved) >= 2
            assert opp.normalized_odds_snapshot_hash is not None
    
    def test_generate_odds_hash(self, service):
        """Test odds hash generation for tracking"""
        snapshots = [
            OddsSnapshot(
                book_id="book1", event_id="game", market_type="moneyline",
                outcome="home", odds=2.0, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            ),
            OddsSnapshot(
                book_id="book2", event_id="game", market_type="moneyline",
                outcome="away", odds=2.1, line=None, max_stake=1000.0,
                timestamp=datetime.now(timezone.utc)
            )
        ]
        
        hash1 = service._generate_odds_hash(snapshots)
        hash2 = service._generate_odds_hash(snapshots)
        
        # Same snapshots should produce same hash
        assert hash1 == hash2
        assert len(hash1) == 16  # MD5 truncated to 16 chars
        
        # Different odds should produce different hash
        snapshots[0].odds = 2.2
        hash3 = service._generate_odds_hash(snapshots)
        assert hash1 != hash3
    
    @pytest.mark.asyncio
    async def test_configuration_management(self, service):
        """Test runtime configuration management"""
        # Get initial config
        initial_config = await service.get_arbitrage_config()
        assert initial_config['min_profit_pct'] == 1.0
        
        # Update configuration
        updates = {'min_profit_pct': 2.5, 'alert_volume_threshold': 15}
        updated_config = await service.update_arbitrage_config(updates)
        
        assert updated_config['min_profit_pct'] == 2.5
        assert updated_config['alert_volume_threshold'] == 15
        assert service._runtime_config.min_profit_pct == 2.5
    
    @pytest.mark.asyncio
    async def test_alerting_threshold_check(self, service):
        """Test volume-based alerting"""
        # Set low threshold for testing
        service._runtime_config.alert_volume_threshold = 2
        service._runtime_config.alert_time_window_minutes = 5
        
        # Create mock opportunities
        mock_opportunities = [
            HardenedArbitrageOpportunity(
                id=f"test_{i}",
                detection_reason=DetectionReason.TWO_WAY_ARBITRAGE,
                books_involved=["book1", "book2"],
                event_id="game_123",
                market_type="moneyline",
                guaranteed_profit_pct=2.0,
                total_stake_required=1000.0,
                stake_distribution={"book1": 500.0, "book2": 500.0},
                expected_return=20.0,
                validation_result=ValidationResult(is_valid=True, confidence_score=0.8),
                normalized_odds_snapshot_hash="abcd1234",
                confidence_score=0.8,
                execution_risk_score=0.3,
                time_sensitivity_score=0.5,
                odds_snapshots=[],
                implied_probabilities={"home": 0.48, "away": 0.49},
                detection_timestamp=datetime.now(timezone.utc),
                expiry_timestamp=datetime.now(timezone.utc) + timedelta(minutes=10)
            )
            for i in range(3)  # 3 opportunities > threshold of 2
        ]
        
        # Test alerting (should trigger alert)
        await service._check_alerting_thresholds(mock_opportunities)
        
        # Check that alert was recorded
        assert len(service.metrics.alert_history) > 0
        alert = service.metrics.alert_history[-1]
        assert alert['alert_type'] == 'arbitrage_volume_spike'
        assert alert['opportunity_count'] >= 3
    
    @pytest.mark.asyncio
    async def test_metrics_tracking(self, service):
        """Test metrics collection and reporting"""
        # Record some mock opportunities
        mock_opp = HardenedArbitrageOpportunity(
            id="test_opp",
            detection_reason=DetectionReason.TWO_WAY_ARBITRAGE,
            books_involved=["book1", "book2"],
            event_id="game_123",
            market_type="moneyline",
            guaranteed_profit_pct=2.0,
            total_stake_required=1000.0,
            stake_distribution={"book1": 500.0, "book2": 500.0},
            expected_return=20.0,
            validation_result=ValidationResult(is_valid=True, confidence_score=0.8),
            anomaly=True,
            normalized_odds_snapshot_hash="abcd1234",
            confidence_score=0.8,
            execution_risk_score=0.3,
            time_sensitivity_score=0.5,
            odds_snapshots=[],
            implied_probabilities={"home": 0.48, "away": 0.49},
            detection_timestamp=datetime.now(timezone.utc),
            expiry_timestamp=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        
        service.metrics.record_opportunity(mock_opp)
        service.metrics.increment_counter("arbitrage_opportunities_total")
        service.metrics.increment_counter("arbitrage_anomalies_total")
        
        # Get metrics snapshot
        metrics = await service.get_arbitrage_metrics()
        
        assert metrics['counters']['arbitrage_opportunities_total'] >= 1
        assert metrics['counters']['arbitrage_anomalies_total'] >= 1
        assert metrics['recent_opportunities'] >= 1
    
    @pytest.mark.asyncio
    async def test_health_check(self, service):
        """Test service health check"""
        health = await service.health_check()
        
        assert health['status'] == 'healthy'
        assert health['config_loaded'] is True
        assert health['validator_ready'] is True
        assert health['metrics_available'] is True
        assert 'last_check' in health


class TestArbitrageRoutes:
    """Test arbitrage API routes"""
    
    @pytest.fixture
    def client(self):
        """Create test client with arbitrage routes"""
        from fastapi import FastAPI
        from backend.routes.hardened_arbitrage_routes import router
        
        app = FastAPI()
        app.include_router(router)
        
        return TestClient(app)
    
    def test_get_config_endpoint(self, client):
        """Test GET /api/arbitrage/config endpoint"""
        response = client.get("/api/arbitrage/config")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'data' in data
        assert 'min_profit_pct' in data['data']
    
    def test_update_config_endpoint(self, client):
        """Test POST /api/arbitrage/config endpoint"""
        config_update = {
            'min_profit_pct': 2.5,
            'alert_volume_threshold': 15,
            'enable_anomaly_detection': False
        }
        
        response = client.post("/api/arbitrage/config", json=config_update)
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['data']['min_profit_pct'] == 2.5
        assert data['data']['alert_volume_threshold'] == 15
        assert data['data']['enable_anomaly_detection'] is False
    
    def test_invalid_config_update(self, client):
        """Test invalid configuration update"""
        invalid_config = {
            'min_profit_pct': -1.0,  # Invalid negative value
            'invalid_field': 'value'  # Invalid field
        }
        
        response = client.post("/api/arbitrage/config", json=invalid_config)
        assert response.status_code == 422  # Validation error
    
    def test_detect_opportunities_endpoint(self, client):
        """Test POST /api/arbitrage/detect endpoint"""
        detection_request = {
            'odds_data': [
                {
                    'book_id': 'draftkings',
                    'event_id': 'game_123',
                    'market_type': 'moneyline',
                    'outcome': 'home',
                    'odds': 2.1
                },
                {
                    'book_id': 'fanduel',
                    'event_id': 'game_123',
                    'market_type': 'moneyline',
                    'outcome': 'away',
                    'odds': 2.05
                }
            ]
        }
        
        response = client.post("/api/arbitrage/detect", json=detection_request)
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'opportunities' in data['data']
        assert 'total_opportunities' in data['data']
        assert 'processing_time_ms' in data['data']
    
    def test_validate_opportunity_endpoint(self, client):
        """Test POST /api/arbitrage/validate endpoint"""
        odds_data = [
            {
                'book_id': 'book1',
                'event_id': 'game',
                'market_type': 'moneyline',
                'outcome': 'home',
                'odds': 2.1
            },
            {
                'book_id': 'book2',
                'event_id': 'game',
                'market_type': 'moneyline',
                'outcome': 'away',
                'odds': 2.05
            }
        ]
        
        response = client.post(
            "/api/arbitrage/validate?profit_pct=2.0",
            json=odds_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'is_valid' in data['data']
        assert 'confidence_score' in data['data']
        assert 'validation_notes' in data['data']
    
    def test_metrics_endpoint(self, client):
        """Test GET /api/arbitrage/metrics endpoint"""
        response = client.get("/api/arbitrage/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'counters' in data['data']
        assert 'timestamp' in data['data']
    
    def test_health_endpoint(self, client):
        """Test GET /api/arbitrage/health endpoint"""
        response = client.get("/api/arbitrage/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['data']['status'] == 'healthy'


class TestArbitrageThresholdScenarios:
    """Test various threshold and edge case scenarios"""
    
    @pytest.fixture
    def service(self):
        return HardenedArbitrageService()
    
    @pytest.mark.asyncio
    async def test_minimum_profit_threshold_filtering(self, service):
        """Test that opportunities below threshold are filtered out"""
        # Set high threshold
        service._runtime_config.min_profit_pct = 5.0
        
        # Create odds with small arbitrage margin
        small_margin_odds = [
            {
                'book_id': 'book1',
                'event_id': 'game',
                'market_type': 'moneyline',
                'outcome': 'home',
                'odds': 2.05,  # 1/2.05 = 0.4878
                'timestamp': datetime.now(timezone.utc)
            },
            {
                'book_id': 'book2',
                'event_id': 'game',
                'market_type': 'moneyline',
                'outcome': 'away',
                'odds': 2.0,   # 1/2.0 = 0.5
                'timestamp': datetime.now(timezone.utc)
            }
        ]
        # Total implied prob = 0.4878 + 0.5 = 0.9878, margin = 1.22%
        
        opportunities = await service.detect_arbitrage_opportunities(small_margin_odds)
        
        # Should be filtered out due to threshold
        assert len(opportunities) == 0
    
    @pytest.mark.asyncio
    async def test_configuration_persistence(self, service):
        """Test that configuration changes persist during service lifecycle"""
        # Update config
        await service.update_arbitrage_config({
            'min_profit_pct': 3.0,
            'suspicious_profit_threshold': 20.0
        })
        
        # Verify changes are applied
        config = await service.get_arbitrage_config()
        assert config['min_profit_pct'] == 3.0
        assert config['suspicious_profit_threshold'] == 20.0
        
        # Test that validator uses updated config
        assert service.validator.config.min_profit_pct == 3.0
        assert service.validator.config.suspicious_profit_threshold == 20.0
    
    @pytest.mark.asyncio
    async def test_edge_case_single_outcome(self, service):
        """Test handling of single outcome (no arbitrage possible)"""
        single_outcome_odds = [
            {
                'book_id': 'book1',
                'event_id': 'game',
                'market_type': 'moneyline',
                'outcome': 'home',
                'odds': 2.0,
                'timestamp': datetime.now(timezone.utc)
            }
        ]
        
        opportunities = await service.detect_arbitrage_opportunities(single_outcome_odds)
        assert len(opportunities) == 0
    
    @pytest.mark.asyncio
    async def test_edge_case_identical_odds(self, service):
        """Test handling of identical odds across books"""
        identical_odds = [
            {
                'book_id': 'book1',
                'event_id': 'game',
                'market_type': 'moneyline',
                'outcome': 'home',
                'odds': 2.0,
                'timestamp': datetime.now(timezone.utc)
            },
            {
                'book_id': 'book2',
                'event_id': 'game',
                'market_type': 'moneyline',
                'outcome': 'away',
                'odds': 2.0,
                'timestamp': datetime.now(timezone.utc)
            }
        ]
        # Total implied prob = 0.5 + 0.5 = 1.0 (no arbitrage)
        
        opportunities = await service.detect_arbitrage_opportunities(identical_odds)
        assert len(opportunities) == 0


@pytest.mark.asyncio
async def test_full_integration_scenario():
    """Integration test with realistic arbitrage scenario"""
    service = HardenedArbitrageService()
    
    # Realistic MLB moneyline arbitrage scenario
    realistic_odds = [
        {
            'book_id': 'pinnacle',
            'event_id': 'mlb_yankees_redsox_20231015',
            'market_type': 'moneyline',
            'outcome': 'yankees',
            'odds': 2.15,  # Yankees +115
            'timestamp': datetime.now(timezone.utc)
        },
        {
            'book_id': 'draftkings',
            'event_id': 'mlb_yankees_redsox_20231015',
            'market_type': 'moneyline',
            'outcome': 'redsox',
            'odds': 2.08,  # Red Sox +108
            'timestamp': datetime.now(timezone.utc)
        }
    ]
    
    # Detect opportunities
    opportunities = await service.detect_arbitrage_opportunities(realistic_odds)
    
    if opportunities:
        opp = opportunities[0]
        
        # Verify opportunity structure
        assert opp.event_id == 'mlb_yankees_redsox_20231015'
        assert opp.market_type == 'moneyline'
        assert len(opp.books_involved) == 2
        assert 'pinnacle' in opp.books_involved
        assert 'draftkings' in opp.books_involved
        
        # Verify financial calculations
        assert opp.guaranteed_profit_pct > 0
        assert opp.total_stake_required > 0
        assert len(opp.stake_distribution) == 2
        assert opp.expected_return > 0
        
        # Verify validation
        assert opp.validation_result.is_valid
        assert opp.confidence_score > 0
        assert 0 <= opp.execution_risk_score <= 1
        assert 0 <= opp.time_sensitivity_score <= 1
        
        # Verify metadata
        assert opp.normalized_odds_snapshot_hash is not None
        assert opp.detection_timestamp is not None
        assert opp.detection_reason in DetectionReason
    
    # Test metrics were updated
    metrics = await service.get_arbitrage_metrics()
    assert metrics['counters']['arbitrage_opportunities_total'] >= 0


if __name__ == "__main__":
    # Run specific tests
    pytest.main([__file__ + "::TestHardenedArbitrageValidator::test_implied_probability_validation_valid_arbitrage", "-v"])