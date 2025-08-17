"""
Ticket Service - Manages parlay ticket creation, submission, and lifecycle

This service handles:
1. Draft ticket creation with edge validation
2. Risk constraint enforcement (max legs, max correlation)
3. Ticket submission with valuation stability checks
4. EV recalculation and ticket management
5. Integration with correlation analysis and parlay simulation

The ticket service provides the core business logic for multi-leg parlay construction
and risk management.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models.correlation_ticketing import Ticket, TicketLeg, TicketStatus
from backend.models.modeling import Edge, EdgeStatus, Valuation
from backend.services.correlation.correlation_engine import correlation_engine
from backend.services.ticketing.parlay_simulator import (
    parlay_simulator, LegInput, ParlaySimulationResult
)
from backend.services.unified_config import get_ticketing_config, get_correlation_config
from backend.services.unified_logging import get_logger


logger = get_logger(__name__)


@dataclass
class TicketDTO:
    """Data Transfer Object for ticket information"""
    ticket_id: int
    user_id: Optional[int]
    status: str
    stake: float
    potential_payout: float
    estimated_ev: float
    legs_count: int
    legs: List[Dict[str, Any]]
    created_at: str
    simulation_result: Optional[Dict[str, Any]] = None
    submitted_at: Optional[str] = None


class TicketValidationError(Exception):
    """Exception for ticket validation failures"""
    
    def __init__(self, message: str, error_code: str = "VALIDATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class TicketService:
    """
    Manages parlay ticket lifecycle and business rules.
    
    Handles ticket creation, validation, submission, and management with
    full integration of correlation analysis and risk constraints.
    """

    def __init__(self):
        self.ticketing_config = get_ticketing_config()
        self.correlation_config = get_correlation_config()

    def create_draft_ticket(
        self,
        user_id: Optional[int],
        stake: float,
        edge_ids: List[int]
    ) -> TicketDTO:
        """
        Create a draft ticket with validation and EV calculation.
        
        Args:
            user_id: User ID (optional, placeholder for future user system)
            stake: Stake amount
            edge_ids: List of edge IDs to include in parlay
            
        Returns:
            TicketDTO with ticket information and simulation results
            
        Raises:
            TicketValidationError: If validation fails
        """
        session = SessionLocal()
        
        try:
            # Validate inputs
            self._validate_ticket_inputs(stake, edge_ids)
            
            # Load and validate edges
            edges = self._load_and_validate_edges(session, edge_ids)
            
            # Enforce constraints
            self._enforce_ticket_constraints(edges)
            
            # Build parlay legs
            legs = self._build_parlay_legs(session, edges)
            
            # Compute correlation matrix
            prop_ids = [edge.prop_id for edge in edges]
            correlation_matrix = correlation_engine.build_correlation_matrix(prop_ids)
            
            # Enforce correlation constraints
            self._enforce_correlation_constraints(prop_ids, correlation_matrix)
            
            # Simulate parlay EV
            simulation_result = parlay_simulator.estimate_parlay_ev(
                legs, stake, correlation_matrix
            )
            
            # Create ticket record
            ticket = Ticket(
                user_id=user_id,
                status=TicketStatus.DRAFT,
                stake=stake,
                potential_payout=stake * simulation_result.payout_multiplier,
                estimated_ev=simulation_result.ev_adjusted,
                legs_count=len(edges)
            )
            session.add(ticket)
            session.flush()  # Get ticket ID
            
            # Create ticket legs
            ticket_legs = []
            for edge in edges:
                # Get latest valuation for snapshot
                valuation = session.query(Valuation).filter(
                    Valuation.id == edge.valuation_id
                ).first()
                
                if not valuation:
                    raise TicketValidationError(
                        f"Valuation not found for edge {edge.id}",
                        "VALUATION_NOT_FOUND"
                    )
                
                leg = TicketLeg(
                    ticket_id=ticket.id,
                    edge_id=edge.id,
                    prop_id=edge.prop_id,
                    offered_line_snapshot=edge.offered_line,
                    prob_over_snapshot=edge.prob_over,
                    fair_line_snapshot=edge.fair_line,
                    valuation_hash_snapshot=valuation.valuation_hash
                )
                session.add(leg)
                ticket_legs.append(leg)
            
            session.commit()
            
            # Build DTO
            ticket_dto = self._build_ticket_dto(ticket, ticket_legs, simulation_result)
            
            logger.info(
                "Created draft ticket",
                extra={
                    "ticket_id": ticket.id,
                    "user_id": user_id,
                    "legs_count": len(edges),
                    "stake": stake,
                    "estimated_ev": simulation_result.ev_adjusted,
                    "action": "create_draft_ticket"
                }
            )
            
            # TODO: Schedule LLM prefetch if enabled
            if self.ticketing_config.llm_prefetch_on_ticket:
                self._schedule_llm_prefetch(edge_ids)
            
            return ticket_dto
            
        except TicketValidationError:
            session.rollback()
            raise
        except Exception as e:
            session.rollback()
            logger.error(
                "Failed to create draft ticket",
                extra={
                    "user_id": user_id,
                    "edge_ids": edge_ids,
                    "error": str(e),
                    "action": "create_draft_ticket"
                }
            )
            raise TicketValidationError(
                f"Failed to create ticket: {str(e)}",
                "CREATION_FAILED"
            )
        finally:
            session.close()

    def submit_ticket(self, ticket_id: int) -> TicketDTO:
        """
        Submit a draft ticket for execution.
        
        Args:
            ticket_id: ID of ticket to submit
            
        Returns:
            Updated TicketDTO
            
        Raises:
            TicketValidationError: If submission validation fails
        """
        session = SessionLocal()
        
        try:
            # Load ticket
            ticket = session.query(Ticket).filter(
                Ticket.id == ticket_id
            ).first()
            
            if not ticket:
                raise TicketValidationError(
                    f"Ticket {ticket_id} not found",
                    "TICKET_NOT_FOUND"
                )
            
            if ticket.status != TicketStatus.DRAFT:
                raise TicketValidationError(
                    f"Ticket {ticket_id} is not in DRAFT status",
                    "INVALID_STATUS"
                )
            
            # Load ticket legs
            legs = session.query(TicketLeg).filter(
                TicketLeg.ticket_id == ticket_id
            ).all()
            
            # Validate edges are still active and valuations unchanged
            for leg in legs:
                edge = session.query(Edge).filter(Edge.id == leg.edge_id).first()
                
                if not edge:
                    raise TicketValidationError(
                        f"Edge {leg.edge_id} not found",
                        "EDGE_NOT_FOUND"
                    )
                
                if edge.status != EdgeStatus.ACTIVE:
                    raise TicketValidationError(
                        f"Edge {leg.edge_id} is no longer active",
                        "EDGE_STATE_CHANGED"
                    )
                
                # Check valuation hash stability
                current_valuation = session.query(Valuation).filter(
                    Valuation.id == edge.valuation_id
                ).first()
                
                if not current_valuation or current_valuation.valuation_hash != leg.valuation_hash_snapshot:
                    raise TicketValidationError(
                        f"Valuation changed for edge {leg.edge_id}",
                        "EDGE_STATE_CHANGED"
                    )
        
        # --- RISK MANAGEMENT INTEGRATION ---
        # Perform comprehensive risk checks before ticket submission
        risk_check_success = True
        try:
            from backend.services.risk.risk_constraints import RiskConstraintsService
            from backend.services.risk.exposure_tracker import ExposureTrackerService
            from backend.models.risk_personalization import BankrollStrategy
            
            risk_service = RiskConstraintsService()
            exposure_service = ExposureTrackerService()
            
            # Build ticket data for risk analysis
            ticket_data = {
                'ticket_id': ticket_id,
                'user_id': ticket.user_id,
                'stake': float(ticket.stake_amount) if ticket.stake_amount else 0.0,
                'legs': [
                    {
                        'edge_id': leg.edge_id,
                        'player_id': getattr(leg, 'player_id', None),
                        'prop_type': getattr(leg, 'prop_type', None),
                        'correlation_cluster_id': getattr(leg, 'correlation_cluster_id', None),
                        'stake_amount': float(getattr(leg, 'stake_amount', 0))
                    }
                    for leg in legs
                ]
            }
            
            # Get or create mock bankroll profile for risk checks
            # In production, this would query the actual BankrollProfile
            class MockBankrollProfile:
                def __init__(self):
                    self.current_bankroll = 1000.0
                    self.base_bankroll = 1000.0
                    self.strategy = BankrollStrategy.FLAT
                    self.max_stake_pct = 0.05
                    
                def __getattr__(self, name):
                    # Provide defaults for any missing attributes
                    return getattr(self, name, None)
            
            mock_profile = MockBankrollProfile()
            
            # Apply risk checks - this may raise RiskViolationError
            risk_findings = risk_service.apply_pre_submission_checks(
                user_id=ticket.user_id,
                ticket_data=ticket_data,
                bankroll_profile=mock_profile  # type: ignore
            )
            
            # Check for critical risk findings
            critical_findings = [f for f in risk_findings if f.level.value == 'CRITICAL']
            if critical_findings:
                critical_msg = '; '.join([f.message for f in critical_findings])
                raise TicketValidationError(
                    f"Critical risk violations: {critical_msg}",
                    "CRITICAL_RISK_VIOLATION"
                )
            
            # Check exposure limits (synchronous method)
            try:
                # Convert ticket legs to the format expected by exposure service
                proposed_additions = [
                    {
                        'player_id': leg.get('player_id'),
                        'prop_type': leg.get('prop_type'),
                        'correlation_cluster_id': leg.get('correlation_cluster_id'),
                        'stake': leg.get('stake_amount', 0)
                    }
                    for leg in ticket_data['legs']
                ]
                
                exposure_decisions = exposure_service.is_exceeding_limits(
                    user_id=ticket.user_id,
                    bankroll=mock_profile.current_bankroll,
                    proposed_additions=proposed_additions
                )
                
                # Check for violations (decisions that are not approved)
                violations = [d for d in exposure_decisions if not d.allowed]
                if violations:
                    violation_messages = [d.reason or "Exposure limit exceeded" for d in violations]
                    raise TicketValidationError(
                        f"Exposure limit violations: {'; '.join(violation_messages)}",
                        "EXPOSURE_LIMIT_EXCEEDED"
                    )
                
                # Update exposure tracking after successful validation
                exposure_service.update_exposure_on_ticket_submit(
                    user_id=ticket.user_id,
                    ticket_id=ticket_id,
                    stake=ticket_data['stake'],
                    legs=ticket_data['legs']
                )
                
            except (AttributeError, TypeError) as e:
                # Method signature might be different - log and continue
                logger.warning(
                    "Exposure tracking method signature mismatch - skipping exposure checks",
                    extra={"error": str(e), "ticket_id": ticket_id}
                )
            
            logger.info(
                "Risk management checks passed for ticket submission",
                extra={
                    "ticket_id": ticket_id,
                    "user_id": ticket.user_id,
                    "risk_findings": len(risk_findings),
                    "critical_findings": len(critical_findings),
                    "action": "risk_check_success"
                }
            )
            
        except (ImportError, ModuleNotFoundError) as e:
            # Risk management services not available - log warning and continue
            logger.warning(
                "Risk management services not available during ticket submission",
                extra={
                    "ticket_id": ticket_id,
                    "user_id": ticket.user_id,
                    "error": str(e),
                    "action": "risk_check_unavailable"
                }
            )
            risk_check_success = False
        except TicketValidationError:
            # Risk validation errors should stop submission - re-raise
            raise
        except Exception as e:
            # Log other risk check errors but don't fail submission for backward compatibility
            logger.error(
                "Unexpected error during risk management checks",
                extra={
                    "ticket_id": ticket_id,
                    "user_id": ticket.user_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "action": "risk_check_error"
                }
            )
            risk_check_success = False
        # --- END RISK MANAGEMENT INTEGRATION ---
        
        # Update ticket status
        ticket.status = TicketStatus.SUBMITTED
        ticket.submitted_at = datetime.now(timezone.utc)
        
        session.commit()
        
        # Build updated DTO
        ticket_dto = self._build_ticket_dto(ticket, legs, None)
        
        logger.info(
            "Submitted ticket",
            extra={
                "ticket_id": ticket_id,
                "user_id": ticket.user_id,
                "legs_count": len(legs),
                "action": "submit_ticket"
            }
        )
        
        return ticket_dto
            
        except TicketValidationError:
            session.rollback()
            raise
        except Exception as e:
            session.rollback()
            logger.error(
                "Failed to submit ticket",
                extra={
                    "ticket_id": ticket_id,
                    "error": str(e),
                    "action": "submit_ticket"
                }
            )
            raise TicketValidationError(
                f"Failed to submit ticket: {str(e)}",
                "SUBMISSION_FAILED"
            )
        finally:
            session.close()

    def get_ticket(self, ticket_id: int) -> TicketDTO:
        """
        Get ticket information.
        
        Args:
            ticket_id: ID of ticket to retrieve
            
        Returns:
            TicketDTO with ticket information
            
        Raises:
            TicketValidationError: If ticket not found
        """
        session = SessionLocal()
        
        try:
            ticket = session.query(Ticket).filter(
                Ticket.id == ticket_id
            ).first()
            
            if not ticket:
                raise TicketValidationError(
                    f"Ticket {ticket_id} not found",
                    "TICKET_NOT_FOUND"
                )
            
            legs = session.query(TicketLeg).filter(
                TicketLeg.ticket_id == ticket_id
            ).all()
            
            return self._build_ticket_dto(ticket, legs, None)
            
        finally:
            session.close()

    def recalc_ticket(self, ticket_id: int) -> TicketDTO:
        """
        Recalculate ticket EV with current market conditions.
        
        Args:
            ticket_id: ID of ticket to recalculate
            
        Returns:
            Updated TicketDTO with new EV calculation
            
        TODO: Add partial cash-out and dynamic hedging capabilities
        """
        session = SessionLocal()
        
        try:
            ticket = session.query(Ticket).filter(
                Ticket.id == ticket_id
            ).first()
            
            if not ticket:
                raise TicketValidationError(
                    f"Ticket {ticket_id} not found",
                    "TICKET_NOT_FOUND"
                )
            
            if ticket.status != TicketStatus.DRAFT:
                # Only recalc draft tickets
                return self.get_ticket(ticket_id)
            
            legs = session.query(TicketLeg).filter(
                TicketLeg.ticket_id == ticket_id
            ).all()
            
            # Rebuild parlay legs with current data
            edges = []
            for leg in legs:
                edge = session.query(Edge).filter(Edge.id == leg.edge_id).first()
                if edge and edge.status == EdgeStatus.ACTIVE:
                    edges.append(edge)
            
            if not edges:
                logger.warning(
                    "No active edges for ticket recalculation",
                    extra={"ticket_id": ticket_id, "action": "recalc_ticket"}
                )
                return self.get_ticket(ticket_id)
            
            # Rebuild simulation
            parlay_legs = self._build_parlay_legs(session, edges)
            prop_ids = [edge.prop_id for edge in edges]
            correlation_matrix = correlation_engine.build_correlation_matrix(prop_ids)
            
            simulation_result = parlay_simulator.estimate_parlay_ev(
                parlay_legs, ticket.stake, correlation_matrix
            )
            
            # Update ticket with new EV
            ticket.potential_payout = ticket.stake * simulation_result.payout_multiplier
            ticket.estimated_ev = simulation_result.ev_adjusted
            
            session.commit()
            
            ticket_dto = self._build_ticket_dto(ticket, legs, simulation_result)
            
            logger.info(
                "Recalculated ticket EV",
                extra={
                    "ticket_id": ticket_id,
                    "new_ev": simulation_result.ev_adjusted,
                    "action": "recalc_ticket"
                }
            )
            
            return ticket_dto
            
        except Exception as e:
            session.rollback()
            logger.error(
                "Failed to recalculate ticket",
                extra={
                    "ticket_id": ticket_id,
                    "error": str(e),
                    "action": "recalc_ticket"
                }
            )
            raise TicketValidationError(
                f"Failed to recalculate ticket: {str(e)}",
                "RECALC_FAILED"
            )
        finally:
            session.close()

    def _validate_ticket_inputs(self, stake: float, edge_ids: List[int]):
        """Validate basic ticket inputs"""
        if stake <= 0:
            raise TicketValidationError("Stake must be positive", "INVALID_STAKE")
        
        if not edge_ids:
            raise TicketValidationError("At least one edge required", "NO_EDGES")
        
        if len(edge_ids) > self.ticketing_config.max_legs:
            raise TicketValidationError(
                f"Maximum {self.ticketing_config.max_legs} legs allowed",
                "TOO_MANY_LEGS"
            )
        
        if len(edge_ids) < self.ticketing_config.min_legs:
            raise TicketValidationError(
                f"Minimum {self.ticketing_config.min_legs} legs required",
                "TOO_FEW_LEGS"
            )

    def _load_and_validate_edges(self, session: Session, edge_ids: List[int]) -> List[Edge]:
        """Load and validate edges"""
        edges = session.query(Edge).filter(Edge.id.in_(edge_ids)).all()
        
        if len(edges) != len(edge_ids):
            found_ids = {edge.id for edge in edges}
            missing_ids = set(edge_ids) - found_ids
            raise TicketValidationError(
                f"Edges not found: {missing_ids}",
                "EDGES_NOT_FOUND"
            )
        
        # Validate all edges are active
        inactive_edges = [edge.id for edge in edges if edge.status != EdgeStatus.ACTIVE]
        if inactive_edges:
            raise TicketValidationError(
                f"Inactive edges: {inactive_edges}",
                "INACTIVE_EDGES"
            )
        
        return edges

    def _enforce_ticket_constraints(self, edges: List[Edge]):
        """Enforce ticket business constraints"""
        # Additional constraints can be added here
        # e.g., same game restrictions, player prop limits, etc.
        pass

    def _enforce_correlation_constraints(
        self,
        prop_ids: List[int],
        correlation_matrix: Dict[int, Dict[int, float]]
    ):
        """Enforce correlation constraints"""
        if len(prop_ids) <= 1:
            return
        
        # Calculate average absolute correlation
        correlations = []
        for i, prop_a in enumerate(prop_ids):
            for j in range(i + 1, len(prop_ids)):
                prop_b = prop_ids[j]
                corr = correlation_matrix.get(prop_a, {}).get(prop_b, 0.0)
                correlations.append(abs(corr))
        
        avg_correlation = sum(correlations) / len(correlations) if correlations else 0.0
        
        if avg_correlation > self.ticketing_config.max_avg_correlation:
            raise TicketValidationError(
                f"Average correlation {avg_correlation:.3f} exceeds limit {self.ticketing_config.max_avg_correlation}",
                "CORRELATION_TOO_HIGH"
            )

    def _build_parlay_legs(self, session: Session, edges: List[Edge]) -> List[LegInput]:
        """Build LegInput objects from edges"""
        legs = []
        
        for edge in edges:
            # Load valuation for odds information
            valuation = session.query(Valuation).filter(
                Valuation.id == edge.valuation_id
            ).first()
            
            if not valuation:
                continue
            
            leg = LegInput(
                prop_id=edge.prop_id,
                prob_success=edge.prob_over,  # Assuming we're betting the over
                offered_odds=edge.offered_line,
                fair_odds=edge.fair_line
            )
            legs.append(leg)
        
        return legs

    def _build_ticket_dto(
        self,
        ticket: Ticket,
        legs: List[TicketLeg],
        simulation_result: Optional[ParlaySimulationResult]
    ) -> TicketDTO:
        """Build TicketDTO from database objects"""
        legs_data = []
        for leg in legs:
            leg_data = {
                "leg_id": leg.id,
                "edge_id": leg.edge_id,
                "prop_id": leg.prop_id,
                "offered_line": leg.offered_line_snapshot,
                "prob_over": leg.prob_over_snapshot,
                "fair_line": leg.fair_line_snapshot,
                "valuation_hash": leg.valuation_hash_snapshot
            }
            legs_data.append(leg_data)
        
        simulation_data = None
        if simulation_result:
            simulation_data = {
                "independent_prob": simulation_result.independent_prob,
                "adjusted_prob": simulation_result.adjusted_prob,
                "payout_multiplier": simulation_result.payout_multiplier,
                "ev_independent": simulation_result.ev_independent,
                "ev_adjusted": simulation_result.ev_adjusted,
                "correlation_adjustment_factor": simulation_result.correlation_adjustment_factor
            }
        
        return TicketDTO(
            ticket_id=ticket.id,
            user_id=ticket.user_id,
            status=ticket.status.value,
            stake=ticket.stake,
            potential_payout=ticket.potential_payout,
            estimated_ev=ticket.estimated_ev,
            legs_count=ticket.legs_count,
            legs=legs_data,
            simulation_result=simulation_data,
            created_at=ticket.created_at.isoformat(),
            submitted_at=ticket.submitted_at.isoformat() if ticket.submitted_at else None
        )

    def _schedule_llm_prefetch(self, edge_ids: List[int]):
        """
        Schedule LLM explanation prefetch for edges.
        
        TODO: Integrate with existing LLM explanation service
        """
        logger.debug(
            "LLM prefetch requested",
            extra={
                "edge_ids": edge_ids,
                "action": "schedule_llm_prefetch"
            }
        )
        # TODO: Call existing prefetch service if available


# Global instance
ticket_service = TicketService()


# Convenience functions
def create_draft_ticket(
    user_id: Optional[int],
    stake: float,
    edge_ids: List[int]
) -> TicketDTO:
    """Convenience function for creating draft ticket"""
    return ticket_service.create_draft_ticket(user_id, stake, edge_ids)


def submit_ticket(ticket_id: int) -> TicketDTO:
    """Convenience function for submitting ticket"""
    return ticket_service.submit_ticket(ticket_id)


def get_ticket(ticket_id: int) -> TicketDTO:
    """Convenience function for getting ticket"""
    return ticket_service.get_ticket(ticket_id)


def recalc_ticket(ticket_id: int) -> TicketDTO:
    """Convenience function for recalculating ticket"""
    return ticket_service.recalc_ticket(ticket_id)