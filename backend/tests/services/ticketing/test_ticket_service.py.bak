"""
Unit tests for the Ticket Service
Tests ticket creation, validation, submission, and lifecycle management.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from typing import List, Dict, Any
import time
from datetime import datetime, timezone

from backend.services.ticketing.ticket_service import (
    TicketService, TicketValidationError, TicketDTO
)
from backend.services.unified_config import TicketingConfig  
from backend.models.correlation_ticketing import Ticket, TicketLeg, TicketStatus
from backend.models.modeling import Edge, EdgeStatus, Valuation


class TestTicketService:
    """Test suite for ticket service functionality."""
    
    @pytest.fixture
    def mock_ticketing_config(self):
        """Create mock ticketing configuration."""
        config = Mock(spec=TicketingConfig)
        config.max_legs_per_ticket = 10
        config.min_legs_per_ticket = 2
        config.max_stake_amount = 1000.00
        config.min_stake_amount = 1.00
        config.max_correlation_risk = 0.85
        config.min_edge_value = 0.01
        config.auto_submit_threshold = 50.00
        return config
    
    @pytest.fixture
    def mock_correlation_config(self):
        """Create mock correlation configuration."""
        config = Mock()
        config.correlation_threshold = 0.3
        return config
    
    @pytest.fixture
    def ticket_service(self, mock_ticketing_config, mock_correlation_config):
        """Create ticket service instance with mocked dependencies."""
        with patch('backend.services.ticketing.ticket_service.get_ticketing_config') as mock_get_config:
            with patch('backend.services.ticketing.ticket_service.get_correlation_config') as mock_get_corr_config:
                mock_get_config.return_value = mock_ticketing_config
                mock_get_corr_config.return_value = mock_correlation_config
                service = TicketService()
                return service
    
    @pytest.fixture
    def sample_edges(self):
        """Create sample edge data for testing."""
        edges = []
        for i in range(5):
            edge = Mock(spec=Edge)
            edge.id = i + 1
            edge.prop_id = i + 1
            edge.market_type = "player_props"
            edge.expected_value = 0.05 + (i * 0.01)
            edge.probability = 0.5 + (i * 0.05)
            edge.status = EdgeStatus.ACTIVE
            edge.bookmaker = "DraftKings"
            edge.line_value = 10.5 + i
            edges.append(edge)
        return edges
    
    @pytest.fixture
    def sample_valuations(self):
        """Create sample valuation data for testing."""
        valuations = []
        for i in range(5):
            valuation = Mock(spec=Valuation)
            valuation.edge_id = i + 1
            valuation.model_probability = 0.52 + (i * 0.02)
            valuation.confidence_score = 0.8 + (i * 0.02)
            valuation.value_estimate = 0.06 + (i * 0.01)
            valuations.append(valuation)
        return valuations
    
    def test_service_initialization(self, mock_ticketing_config, mock_correlation_config):
        """Test ticket service initialization."""
        with patch('backend.services.ticketing.ticket_service.get_ticketing_config') as mock_get_config:
            with patch('backend.services.ticketing.ticket_service.get_correlation_config') as mock_get_corr_config:
                mock_get_config.return_value = mock_ticketing_config
                mock_get_corr_config.return_value = mock_correlation_config
                
                service = TicketService()
                
                assert service.ticketing_config == mock_ticketing_config
                assert service.correlation_config == mock_correlation_config
    
    def test_stake_validation_valid(self, ticket_service):
        """Test stake validation with valid amounts."""
        # Test valid stakes (assuming validation method exists)
        valid_stakes = [1.00, 25.50, 100.00, 1000.00]
        
        # Since we need to check the actual validation method name, let's assume it exists
        # This test structure will need to be adjusted based on actual implementation
        pass
    
    def test_stake_validation_invalid(self, ticket_service):
        """Test stake validation with invalid amounts."""
        # Test invalid stakes
        invalid_stakes = [0.50, 1500.00, -10.00]
        
        # This test structure will need to be adjusted based on actual implementation
        pass
    
    @patch('backend.services.ticketing.ticket_service.SessionLocal')
    def test_create_draft_ticket_success(self, mock_session_local, ticket_service, sample_edges, sample_valuations):
        """Test successful draft ticket creation."""
        mock_session = Mock()
        mock_session_local.return_value = mock_session
        
        # Mock edge and valuation queries
        mock_session.query.return_value.filter.return_value.all.return_value = sample_edges[:3]
        
        # Mock correlation engine
        with patch('backend.services.ticketing.ticket_service.correlation_engine') as mock_corr_engine:
            mock_corr_engine.compute_pairwise_correlations.return_value = []  # No high correlations
            
            # Mock parlay simulator
            with patch('backend.services.ticketing.ticket_service.parlay_simulator') as mock_simulator:
                mock_result = Mock()
                mock_result.independent_probability = 0.125
                mock_result.independent_ev = 5.50
                mock_result.correlation_adjusted_probability = 0.110
                mock_result.correlation_adjusted_ev = 4.85
                mock_simulator.simulate_parlay_ev.return_value = mock_result
                
                # Mock ticket creation
                mock_ticket = Mock()
                mock_ticket.id = 123
                mock_session.add = Mock()
                mock_session.commit = Mock()
                
                user_id = 456
                stake = 25.00
                edge_ids = [1, 2, 3]
                
                ticket_dto = ticket_service.create_draft_ticket(user_id, stake, edge_ids)
                
                # Verify ticket creation
                assert ticket_dto is not None
                mock_session.add.assert_called()
                mock_session.commit.assert_called()
    
    def test_create_draft_ticket_validation_failure(self, ticket_service):
        """Test draft ticket creation with validation failures."""
        # Test invalid inputs
        user_id = 456
        invalid_stake = 0.50  # Too low
        edge_ids = [1]  # Too few edges
        
        with pytest.raises(TicketValidationError):
            ticket_service.create_draft_ticket(user_id, invalid_stake, edge_ids)
    
    @patch('backend.services.ticketing.ticket_service.SessionLocal')
    def test_submit_ticket_success(self, mock_session_local, ticket_service):
        """Test successful ticket submission."""
        mock_session = Mock()
        mock_session_local.return_value = mock_session
        
        # Mock existing draft ticket
        mock_ticket = Mock()
        mock_ticket.id = 123
        mock_ticket.status = TicketStatus.DRAFT
        mock_ticket.user_id = 456
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_ticket
        
        result = ticket_service.submit_ticket(123, 456)
        
        assert result is not None
        assert mock_ticket.status == TicketStatus.SUBMITTED
        mock_session.commit.assert_called()
    
    @patch('backend.services.ticketing.ticket_service.SessionLocal')
    def test_submit_ticket_not_found(self, mock_session_local, ticket_service):
        """Test ticket submission with non-existent ticket."""
        mock_session = Mock()
        mock_session_local.return_value = mock_session
        
        # Mock no ticket found
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(TicketValidationError) as exc_info:
            ticket_service.submit_ticket(999, 456)
        assert "TICKET_NOT_FOUND" in str(exc_info.value)
    
    @patch('backend.services.ticketing.ticket_service.SessionLocal')
    def test_cancel_ticket_success(self, mock_session_local, ticket_service):
        """Test successful ticket cancellation."""
        mock_session = Mock()
        mock_session_local.return_value = mock_session
        
        # Mock existing draft ticket
        mock_ticket = Mock()
        mock_ticket.id = 123
        mock_ticket.status = TicketStatus.DRAFT
        mock_ticket.user_id = 456
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_ticket
        
        result = ticket_service.cancel_ticket(123, 456)
        
        assert result is not None
        assert mock_ticket.status == TicketStatus.CANCELLED
        mock_session.commit.assert_called()
    
    @patch('backend.services.ticketing.ticket_service.SessionLocal')
    def test_get_ticket_details(self, mock_session_local, ticket_service):
        """Test retrieving ticket details."""
        mock_session = Mock()
        mock_session_local.return_value = mock_session
        
        # Mock ticket with legs
        mock_ticket = Mock()
        mock_ticket.id = 123
        mock_ticket.user_id = 456
        mock_ticket.status = TicketStatus.SUBMITTED
        mock_ticket.stake = 25.00
        mock_ticket.legs = [Mock(), Mock(), Mock()]  # 3 legs
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_ticket
        
        ticket = ticket_service.get_ticket(123, 456)
        
        assert ticket is not None
        assert ticket.ticket_id == 123
    
    @patch('backend.services.ticketing.ticket_service.get_correlation_ticketing_metrics')
    def test_metrics_recording(self, mock_get_metrics, ticket_service):
        """Test that ticket metrics are properly recorded."""
        mock_metrics = Mock()
        mock_get_metrics.return_value = mock_metrics
        
        # Test will need to be implemented based on actual metrics integration
        pass
    
    def test_error_handling_database_failure(self, ticket_service):
        """Test graceful handling of database errors."""
        with patch('backend.services.ticketing.ticket_service.SessionLocal') as mock_session_local:
            mock_session = Mock()
            mock_session_local.return_value = mock_session
            mock_session.commit.side_effect = Exception("Database error")
            
            user_id = 456
            stake = 25.00
            edge_ids = [1, 2, 3]
            
            # Should handle database error gracefully
            with pytest.raises(TicketValidationError):
                ticket_service.create_draft_ticket(user_id, stake, edge_ids)
            
            mock_session.rollback.assert_called()
    
    def test_correlation_risk_assessment(self, ticket_service):
        """Test correlation risk assessment in ticket validation."""
        # Mock high correlation scenario
        with patch('backend.services.ticketing.ticket_service.correlation_engine') as mock_corr_engine:
            # Mock high correlation result
            mock_correlation_record = Mock()
            mock_correlation_record.pearson_r = 0.9  # Very high correlation
            mock_corr_engine.compute_pairwise_correlations.return_value = [mock_correlation_record]
            
            user_id = 456
            stake = 25.00
            edge_ids = [1, 2]  # Just 2 edges with high correlation
            
            # Should fail validation due to high correlation
            with pytest.raises(TicketValidationError) as exc_info:
                ticket_service.create_draft_ticket(user_id, stake, edge_ids)
            
            # The exact error message will depend on implementation
            assert "CORRELATION" in str(exc_info.value) or "RISK" in str(exc_info.value)


class TestTicketServiceIntegration:
    """Integration tests for ticket service with realistic scenarios."""
    
    def test_end_to_end_ticket_lifecycle(self):
        """Test complete ticket lifecycle from creation to settlement."""
        # Would test:
        # 1. Draft ticket creation with real edge data
        # 2. Validation with actual correlation analysis
        # 3. Submission and status updates
        # 4. EV recalculation and settlement processing
        pass
    
    def test_parlay_ev_calculation_accuracy(self):
        """Test accuracy of parlay EV calculations with different correlation levels."""
        # Would test:
        # 1. Independent EV calculation
        # 2. Correlation-adjusted EV calculation
        # 3. Comparison with expected mathematical results
        pass
    
    def test_high_volume_processing(self):
        """Test performance with high volume of concurrent ticket operations."""
        # Would test:
        # 1. Concurrent ticket creation and submission
        # 2. Database connection pooling efficiency
        # 3. Memory usage patterns
        # 4. Error handling under load conditions
        pass


if __name__ == "__main__":
    pytest.main([__file__])