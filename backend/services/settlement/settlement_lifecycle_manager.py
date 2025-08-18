"""
Settlement & Lifecycle Management System

This module provides comprehensive prop settlement automation with live event integration,
settlement validation, dispute handling, and proper lifecycle state transitions.

Key Features:
- Automated settlement based on live events
- Multi-source settlement validation
- Comprehensive audit trails
- Lifecycle state management (active -> settled -> archived)
- Dispute handling and manual override capabilities
- Settlement confidence scoring
- Batch settlement processing
- Real-time settlement notifications

Integration Points:
- Live event processing from Section 4 components
- Hook manager for settlement event triggers
- Cache system for settlement state management
- Logging system for comprehensive audit trails
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable, Set, Union, Tuple
import logging
import json
import hashlib
from decimal import Decimal
from uuid import uuid4

from backend.services.unified_config import unified_config
from backend.services.unified_logging import unified_logging
from backend.services.hooks.data_flow_hook_manager import (
    DataFlowHookManager, HookEvent, HookEventData, get_hook_manager, 
    emit_prop_lifecycle_event
)
from backend.services.cache.enhanced_prop_state_cache import get_prop_cache


logger = unified_logging.get_logger("settlement_lifecycle_manager")


class PropLifecycleState(Enum):
    """Prop lifecycle states"""
    DRAFT = "draft"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    SETTLING = "settling"
    SETTLED = "settled"
    DISPUTED = "disputed"
    ARCHIVED = "archived"
    VOIDED = "voided"


class SettlementStatus(Enum):
    """Settlement status values"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SETTLED = "settled"
    DISPUTED = "disputed"
    REQUIRES_MANUAL_REVIEW = "requires_manual_review"
    VOIDED = "voided"


class SettlementOutcome(Enum):
    """Settlement outcomes"""
    WIN = "win"
    LOSE = "lose"
    PUSH = "push"
    VOID = "void"
    PARTIAL = "partial"


class SettlementConfidenceLevel(Enum):
    """Settlement confidence levels"""
    HIGH = "high"         # > 95% confidence
    MEDIUM = "medium"     # 80-95% confidence
    LOW = "low"          # 60-80% confidence
    UNCERTAIN = "uncertain"  # < 60% confidence


class SettlementSource(Enum):
    """Settlement data sources"""
    LIVE_EVENT = "live_event"
    API_FEED = "api_feed"
    MANUAL_REVIEW = "manual_review"
    AUTOMATED_RULE = "automated_rule"
    THIRD_PARTY_VALIDATOR = "third_party_validator"


@dataclass
class SettlementValidation:
    """Settlement validation result"""
    is_valid: bool
    confidence_score: float
    validation_sources: List[SettlementSource] = field(default_factory=list)
    validation_data: Dict[str, Any] = field(default_factory=dict)
    validation_timestamp: datetime = field(default_factory=datetime.utcnow)
    validation_errors: List[str] = field(default_factory=list)
    requires_manual_review: bool = False


@dataclass
class SettlementAuditEntry:
    """Audit entry for settlement activities"""
    audit_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)
    action: str = ""
    actor: str = "system"
    prop_id: str = ""
    old_state: Optional[PropLifecycleState] = None
    new_state: Optional[PropLifecycleState] = None
    settlement_data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    confidence_score: Optional[float] = None
    validation_sources: List[SettlementSource] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "audit_id": self.audit_id,
            "timestamp": self.timestamp.isoformat(),
            "action": self.action,
            "actor": self.actor,
            "prop_id": self.prop_id,
            "old_state": self.old_state.value if self.old_state else None,
            "new_state": self.new_state.value if self.new_state else None,
            "settlement_data": self.settlement_data,
            "metadata": self.metadata,
            "confidence_score": self.confidence_score,
            "validation_sources": [source.value for source in self.validation_sources]
        }


@dataclass
class PropSettlement:
    """Comprehensive prop settlement record"""
    prop_id: str
    settlement_id: str = field(default_factory=lambda: str(uuid4()))
    outcome: Optional[SettlementOutcome] = None
    status: SettlementStatus = SettlementStatus.PENDING
    confidence: SettlementConfidenceLevel = SettlementConfidenceLevel.UNCERTAIN
    settlement_value: Optional[Decimal] = None
    settlement_timestamp: Optional[datetime] = None
    
    # Validation and sources
    validation_result: Optional[SettlementValidation] = None
    primary_source: Optional[SettlementSource] = None
    supporting_sources: List[SettlementSource] = field(default_factory=list)
    
    # Settlement data
    actual_result: Optional[Any] = None
    original_line: Optional[float] = None
    settlement_line: Optional[float] = None
    
    # Audit and tracking
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    settled_by: str = "system"
    reviewed_by: Optional[str] = None
    review_timestamp: Optional[datetime] = None
    
    # Metadata
    game_completed: bool = False
    manual_override: bool = False
    dispute_reason: Optional[str] = None
    notes: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "prop_id": self.prop_id,
            "settlement_id": self.settlement_id,
            "outcome": self.outcome.value if self.outcome else None,
            "status": self.status.value,
            "confidence": self.confidence.value,
            "settlement_value": str(self.settlement_value) if self.settlement_value else None,
            "settlement_timestamp": self.settlement_timestamp.isoformat() if self.settlement_timestamp else None,
            "actual_result": self.actual_result,
            "original_line": self.original_line,
            "settlement_line": self.settlement_line,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "settled_by": self.settled_by,
            "reviewed_by": self.reviewed_by,
            "review_timestamp": self.review_timestamp.isoformat() if self.review_timestamp else None,
            "game_completed": self.game_completed,
            "manual_override": self.manual_override,
            "dispute_reason": self.dispute_reason,
            "notes": self.notes,
            "metadata": self.metadata
        }


class SettlementLifecycleManager:
    """
    Advanced settlement and lifecycle management system
    
    Handles automated prop settlement based on live events, validation,
    dispute resolution, and comprehensive lifecycle state management.
    """
    
    def __init__(self):
        self.config = unified_config.get_section("live_data")
        self.settlement_config = self.config.get("settlement", {})
        
        # Settlement tracking
        self.active_settlements: Dict[str, PropSettlement] = {}
        self.settlement_history: Dict[str, List[PropSettlement]] = {}
        self.audit_trail: List[SettlementAuditEntry] = []
        
        # Settlement rules and validators
        self.settlement_rules: Dict[str, Callable] = {}
        self.validators: Dict[SettlementSource, Callable] = {}
        
        # Processing queues
        self.settlement_queue: asyncio.Queue = asyncio.Queue()
        self.validation_queue: asyncio.Queue = asyncio.Queue()
        self.dispute_queue: asyncio.Queue = asyncio.Queue()
        
        # Performance tracking
        self.stats = {
            "settlements_processed": 0,
            "automatic_settlements": 0,
            "manual_reviews": 0,
            "disputes_created": 0,
            "disputes_resolved": 0,
            "validation_errors": 0,
            "average_confidence": 0.0,
            "processing_times": [],
            "settlement_accuracy": 0.0
        }
        
        # Configuration
        self.batch_size = self.settlement_config.get("batch_size", 50)
        self.settlement_timeout = self.settlement_config.get("timeout_minutes", 30)
        self.confidence_threshold = self.settlement_config.get("confidence_threshold", 0.8)
        self.auto_settle_enabled = self.settlement_config.get("auto_settle_enabled", True)
        self.dispute_enabled = self.settlement_config.get("dispute_enabled", True)
        
        # Event handling
        self.hook_manager = get_hook_manager()
        
        logger.info("SettlementLifecycleManager initialized")
        logger.debug(f"Settlement config: batch_size={self.batch_size}, timeout={self.settlement_timeout}min")
        
        # Register event hooks
        self._register_event_hooks()
    
    def _register_event_hooks(self):
        """Register hooks for settlement-triggering events"""
        try:
            # Game completion events
            self.hook_manager.register_hook(
                "settlement_game_completed",
                [HookEvent.GAME_COMPLETED, HookEvent.GAME_FINAL],
                self._handle_game_completion
            )
            
            # Live event updates that might trigger settlements
            self.hook_manager.register_hook(
                "settlement_live_update",
                [HookEvent.LIVE_EVENT_UPDATED, HookEvent.PLAY_BY_PLAY_EVENT],
                self._handle_live_settlement_event
            )
            
            # Statistical updates that might affect settlements
            self.hook_manager.register_hook(
                "settlement_stats_update",
                [HookEvent.PLAYER_STATS_UPDATED, HookEvent.TEAM_STATS_UPDATED],
                self._handle_stats_settlement_event
            )
            
            logger.debug("Settlement event hooks registered")
            
        except Exception as e:
            logger.error(f"Failed to register settlement hooks: {e}")
    
    async def _handle_game_completion(self, event_data: HookEventData):
        """Handle game completion events for settlement"""
        try:
            game_id = event_data.data.get("game_id")
            if not game_id:
                logger.warning("Game completion event missing game_id")
                return
            
            logger.info(f"Processing game completion for settlements: {game_id}")
            
            # Queue all props from this game for settlement
            await self._queue_game_props_for_settlement(game_id, event_data.data)
            
        except Exception as e:
            logger.error(f"Error handling game completion for settlement: {e}")
    
    async def _handle_live_settlement_event(self, event_data: HookEventData):
        """Handle live events that might trigger settlements"""
        try:
            # Check if this event might complete any props
            await self._check_for_immediate_settlements(event_data)
            
        except Exception as e:
            logger.error(f"Error handling live settlement event: {e}")
    
    async def _handle_stats_settlement_event(self, event_data: HookEventData):
        """Handle statistical updates that might trigger settlements"""
        try:
            player_id = event_data.data.get("player_id")
            stats = event_data.data.get("stats", {})
            
            if player_id and stats:
                await self._check_player_prop_settlements(player_id, stats)
                
        except Exception as e:
            logger.error(f"Error handling stats settlement event: {e}")
    
    async def initiate_prop_settlement(self, 
                                     prop_id: str, 
                                     settlement_data: Dict[str, Any],
                                     source: SettlementSource = SettlementSource.AUTOMATED_RULE) -> PropSettlement:
        """
        Initiate settlement for a specific prop
        
        Args:
            prop_id: Prop identifier
            settlement_data: Data for settlement calculation
            source: Primary settlement data source
            
        Returns:
            PropSettlement object
        """
        try:
            logger.info(f"Initiating settlement for prop {prop_id}")
            
            # Create settlement record
            settlement = PropSettlement(
                prop_id=prop_id,
                primary_source=source,
                status=SettlementStatus.IN_PROGRESS
            )
            
            # Store settlement
            self.active_settlements[settlement.settlement_id] = settlement
            
            # Add to settlement history
            if prop_id not in self.settlement_history:
                self.settlement_history[prop_id] = []
            self.settlement_history[prop_id].append(settlement)
            
            # Create audit entry
            audit_entry = SettlementAuditEntry(
                action="settlement_initiated",
                prop_id=prop_id,
                new_state=PropLifecycleState.SETTLING,
                settlement_data=settlement_data,
                metadata={"source": source.value}
            )
            await self._add_audit_entry(audit_entry)
            
            # Queue for processing
            await self.settlement_queue.put({
                "settlement_id": settlement.settlement_id,
                "prop_id": prop_id,
                "settlement_data": settlement_data,
                "source": source,
                "timestamp": datetime.utcnow()
            })
            
            # Emit settlement event
            await hook_emitter.emit(
                HookEvent.SETTLEMENT_INITIATED,
                {
                    "settlement_id": settlement.settlement_id,
                    "prop_id": prop_id,
                    "source": source.value,
                    "timestamp": settlement.created_at.isoformat()
                }
            )
            
            logger.debug(f"Settlement {settlement.settlement_id} queued for processing")
            return settlement
            
        except Exception as e:
            logger.error(f"Failed to initiate settlement for prop {prop_id}: {e}")
            raise
    
    async def validate_settlement(self, 
                                settlement: PropSettlement, 
                                settlement_data: Dict[str, Any]) -> SettlementValidation:
        """
        Validate settlement using multiple sources and confidence scoring
        
        Args:
            settlement: Settlement to validate
            settlement_data: Settlement data for validation
            
        Returns:
            SettlementValidation result
        """
        try:
            validation_sources = []
            validation_data = {}
            validation_errors = []
            confidence_scores = []
            
            # Primary source validation
            if settlement.primary_source in self.validators:
                try:
                    primary_result = await self.validators[settlement.primary_source](
                        settlement.prop_id, settlement_data
                    )
                    validation_sources.append(settlement.primary_source)
                    validation_data[settlement.primary_source.value] = primary_result
                    confidence_scores.append(primary_result.get("confidence", 0.5))
                except Exception as e:
                    validation_errors.append(f"Primary validation failed: {e}")
            
            # Supporting source validation
            for source in settlement.supporting_sources:
                if source in self.validators:
                    try:
                        result = await self.validators[source](settlement.prop_id, settlement_data)
                        validation_sources.append(source)
                        validation_data[source.value] = result
                        confidence_scores.append(result.get("confidence", 0.5))
                    except Exception as e:
                        validation_errors.append(f"Supporting validation ({source.value}) failed: {e}")
            
            # Calculate overall confidence
            if confidence_scores:
                # Weighted average with primary source having more weight
                weights = [2.0] + [1.0] * (len(confidence_scores) - 1)
                overall_confidence = sum(score * weight for score, weight in zip(confidence_scores, weights)) / sum(weights)
            else:
                overall_confidence = 0.0
            
            # Determine if manual review is required
            requires_manual_review = (
                overall_confidence < self.confidence_threshold or
                len(validation_errors) > 0 or
                len(validation_sources) == 0
            )
            
            validation = SettlementValidation(
                is_valid=overall_confidence >= self.confidence_threshold and len(validation_errors) == 0,
                confidence_score=overall_confidence,
                validation_sources=validation_sources,
                validation_data=validation_data,
                validation_errors=validation_errors,
                requires_manual_review=requires_manual_review
            )
            
            logger.debug(f"Settlement validation complete: confidence={overall_confidence:.3f}, sources={len(validation_sources)}")
            return validation
            
        except Exception as e:
            logger.error(f"Settlement validation failed: {e}")
            return SettlementValidation(
                is_valid=False,
                confidence_score=0.0,
                validation_errors=[f"Validation system error: {e}"],
                requires_manual_review=True
            )
    
    async def process_settlement(self, settlement_id: str) -> bool:
        """
        Process a settlement through validation, calculation, and finalization
        
        Args:
            settlement_id: Settlement identifier
            
        Returns:
            True if settlement was processed successfully
        """
        try:
            settlement = self.active_settlements.get(settlement_id)
            if not settlement:
                logger.error(f"Settlement {settlement_id} not found")
                return False
            
            start_time = datetime.utcnow()
            logger.info(f"Processing settlement {settlement_id} for prop {settlement.prop_id}")
            
            # Get settlement data from queue
            settlement_data = {}  # This would come from the queue item
            
            # Validate settlement
            validation = await self.validate_settlement(settlement, settlement_data)
            settlement.validation_result = validation
            
            # Update confidence level
            if validation.confidence_score >= 0.95:
                settlement.confidence = SettlementConfidenceLevel.HIGH
            elif validation.confidence_score >= 0.80:
                settlement.confidence = SettlementConfidenceLevel.MEDIUM
            elif validation.confidence_score >= 0.60:
                settlement.confidence = SettlementConfidenceLevel.LOW
            else:
                settlement.confidence = SettlementConfidenceLevel.UNCERTAIN
            
            # Determine settlement outcome
            if validation.is_valid and not validation.requires_manual_review:
                # Calculate settlement outcome
                outcome = await self._calculate_settlement_outcome(settlement, settlement_data)
                settlement.outcome = outcome
                settlement.status = SettlementStatus.SETTLED
                settlement.settlement_timestamp = datetime.utcnow()
                settlement.settled_by = "system"
                
                # Update prop lifecycle state
                await self._transition_prop_state(
                    settlement.prop_id,
                    PropLifecycleState.ACTIVE,
                    PropLifecycleState.SETTLED,
                    settlement_id
                )
                
                self.stats["automatic_settlements"] += 1
                
                # Emit settlement completed event
                await hook_emitter.emit(
                    HookEvent.SETTLEMENT_COMPLETED,
                    {
                        "settlement_id": settlement_id,
                        "prop_id": settlement.prop_id,
                        "outcome": outcome.value,
                        "confidence": settlement.confidence.value,
                        "timestamp": settlement.settlement_timestamp.isoformat()
                    }
                )
                
                logger.info(f"Settlement {settlement_id} completed: {outcome.value}")
                
            else:
                # Requires manual review
                settlement.status = SettlementStatus.REQUIRES_MANUAL_REVIEW
                await self._queue_for_manual_review(settlement, validation.validation_errors)
                self.stats["manual_reviews"] += 1
                
                logger.info(f"Settlement {settlement_id} queued for manual review")
            
            # Update tracking
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            self.stats["processing_times"].append(processing_time)
            self.stats["settlements_processed"] += 1
            self.stats["validation_errors"] += len(validation.validation_errors)
            
            # Update average confidence
            if self.stats["settlements_processed"] > 0:
                total_confidence = self.stats["average_confidence"] * (self.stats["settlements_processed"] - 1) + validation.confidence_score
                self.stats["average_confidence"] = total_confidence / self.stats["settlements_processed"]
            
            settlement.updated_at = datetime.utcnow()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to process settlement {settlement_id}: {e}")
            return False
    
    async def _calculate_settlement_outcome(self, 
                                          settlement: PropSettlement, 
                                          settlement_data: Dict[str, Any]) -> SettlementOutcome:
        """Calculate the settlement outcome based on data and rules"""
        try:
            # This would contain complex settlement calculation logic
            # For now, simplified example based on settlement data
            
            actual_value = settlement_data.get("actual_value")
            original_line = settlement_data.get("original_line")
            prop_type = settlement_data.get("prop_type", "over_under")
            
            if actual_value is None or original_line is None:
                return SettlementOutcome.VOID
            
            if prop_type == "over_under":
                if actual_value > original_line:
                    return SettlementOutcome.WIN  # Over wins
                elif actual_value < original_line:
                    return SettlementOutcome.LOSE  # Over loses (Under wins)
                else:
                    return SettlementOutcome.PUSH  # Exact match
            
            # Add more complex settlement logic for other prop types
            return SettlementOutcome.VOID
            
        except Exception as e:
            logger.error(f"Failed to calculate settlement outcome: {e}")
            return SettlementOutcome.VOID
    
    async def _transition_prop_state(self, 
                                   prop_id: str, 
                                   from_state: PropLifecycleState, 
                                   to_state: PropLifecycleState,
                                   settlement_id: Optional[str] = None):
        """Transition prop lifecycle state with audit trail"""
        try:
            # Create audit entry
            audit_entry = SettlementAuditEntry(
                action="state_transition",
                prop_id=prop_id,
                old_state=from_state,
                new_state=to_state,
                metadata={
                    "settlement_id": settlement_id,
                    "transition_timestamp": datetime.utcnow().isoformat()
                }
            )
            
            await self._add_audit_entry(audit_entry)
            
            # Update cache if available
            cache = get_prop_cache()
            if cache:
                await cache.invalidate(
                    prop_id=prop_id,
                    reason=f"state_transition_{to_state.value}"
                )
            
            logger.debug(f"Prop {prop_id} transitioned: {from_state.value} -> {to_state.value}")
            
        except Exception as e:
            logger.error(f"Failed to transition prop state: {e}")
    
    async def _add_audit_entry(self, entry: SettlementAuditEntry):
        """Add entry to audit trail"""
        try:
            self.audit_trail.append(entry)
            
            # Log audit entry
            logger.info(f"Audit: {entry.action} for prop {entry.prop_id}")
            logger.debug(f"Audit entry: {entry.to_dict()}")
            
            # Emit audit event
            await hook_emitter.emit(
                HookEvent.SETTLEMENT_AUDIT,
                entry.to_dict()
            )
            
        except Exception as e:
            logger.error(f"Failed to add audit entry: {e}")
    
    async def create_dispute(self, 
                           settlement_id: str, 
                           reason: str, 
                           disputing_party: str,
                           evidence: Dict[str, Any] = None) -> bool:
        """
        Create a dispute for a settlement
        
        Args:
            settlement_id: Settlement to dispute
            reason: Reason for dispute
            disputing_party: Who is creating the dispute
            evidence: Supporting evidence for dispute
            
        Returns:
            True if dispute was created successfully
        """
        try:
            if not self.dispute_enabled:
                logger.warning("Dispute creation disabled")
                return False
            
            settlement = self.active_settlements.get(settlement_id)
            if not settlement:
                logger.error(f"Settlement {settlement_id} not found for dispute")
                return False
            
            logger.info(f"Creating dispute for settlement {settlement_id}")
            
            # Update settlement status
            settlement.status = SettlementStatus.DISPUTED
            settlement.dispute_reason = reason
            settlement.updated_at = datetime.utcnow()
            
            # Create audit entry
            audit_entry = SettlementAuditEntry(
                action="dispute_created",
                actor=disputing_party,
                prop_id=settlement.prop_id,
                settlement_data=evidence or {},
                metadata={
                    "settlement_id": settlement_id,
                    "dispute_reason": reason
                }
            )
            await self._add_audit_entry(audit_entry)
            
            # Queue for dispute resolution
            await self.dispute_queue.put({
                "settlement_id": settlement_id,
                "dispute_reason": reason,
                "disputing_party": disputing_party,
                "evidence": evidence,
                "timestamp": datetime.utcnow()
            })
            
            # Update prop state
            await self._transition_prop_state(
                settlement.prop_id,
                PropLifecycleState.SETTLED,
                PropLifecycleState.DISPUTED,
                settlement_id
            )
            
            # Emit dispute event
            await hook_emitter.emit(
                HookEvent.SETTLEMENT_DISPUTED,
                {
                    "settlement_id": settlement_id,
                    "prop_id": settlement.prop_id,
                    "dispute_reason": reason,
                    "disputing_party": disputing_party,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            self.stats["disputes_created"] += 1
            
            logger.info(f"Dispute created for settlement {settlement_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create dispute for settlement {settlement_id}: {e}")
            return False
    
    async def resolve_dispute(self, 
                            settlement_id: str, 
                            resolution: SettlementOutcome,
                            resolver: str,
                            resolution_notes: str = "") -> bool:
        """
        Resolve a disputed settlement
        
        Args:
            settlement_id: Settlement to resolve
            resolution: Final settlement outcome
            resolver: Who resolved the dispute
            resolution_notes: Notes about resolution
            
        Returns:
            True if dispute was resolved successfully
        """
        try:
            settlement = self.active_settlements.get(settlement_id)
            if not settlement:
                logger.error(f"Settlement {settlement_id} not found for resolution")
                return False
            
            if settlement.status != SettlementStatus.DISPUTED:
                logger.error(f"Settlement {settlement_id} is not disputed")
                return False
            
            logger.info(f"Resolving dispute for settlement {settlement_id}")
            
            # Update settlement
            settlement.outcome = resolution
            settlement.status = SettlementStatus.SETTLED
            settlement.settlement_timestamp = datetime.utcnow()
            settlement.reviewed_by = resolver
            settlement.review_timestamp = datetime.utcnow()
            settlement.manual_override = True
            settlement.notes.append(f"Dispute resolved: {resolution_notes}")
            
            # Create audit entry
            audit_entry = SettlementAuditEntry(
                action="dispute_resolved",
                actor=resolver,
                prop_id=settlement.prop_id,
                new_state=PropLifecycleState.SETTLED,
                metadata={
                    "settlement_id": settlement_id,
                    "resolution": resolution.value,
                    "resolution_notes": resolution_notes
                }
            )
            await self._add_audit_entry(audit_entry)
            
            # Update prop state
            await self._transition_prop_state(
                settlement.prop_id,
                PropLifecycleState.DISPUTED,
                PropLifecycleState.SETTLED,
                settlement_id
            )
            
            # Emit resolution event
            await hook_emitter.emit(
                HookEvent.DISPUTE_RESOLVED,
                {
                    "settlement_id": settlement_id,
                    "prop_id": settlement.prop_id,
                    "resolution": resolution.value,
                    "resolver": resolver,
                    "timestamp": settlement.review_timestamp.isoformat()
                }
            )
            
            self.stats["disputes_resolved"] += 1
            
            logger.info(f"Dispute resolved for settlement {settlement_id}: {resolution.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to resolve dispute for settlement {settlement_id}: {e}")
            return False
    
    async def archive_settled_props(self, cutoff_days: int = 30) -> int:
        """
        Archive props that have been settled for the specified period
        
        Args:
            cutoff_days: Days since settlement to archive
            
        Returns:
            Number of props archived
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=cutoff_days)
            archived_count = 0
            
            logger.info(f"Starting archive process for props settled before {cutoff_date}")
            
            for settlement_id, settlement in list(self.active_settlements.items()):
                if (settlement.status == SettlementStatus.SETTLED and 
                    settlement.settlement_timestamp and 
                    settlement.settlement_timestamp < cutoff_date):
                    
                    # Transition to archived
                    await self._transition_prop_state(
                        settlement.prop_id,
                        PropLifecycleState.SETTLED,
                        PropLifecycleState.ARCHIVED,
                        settlement_id
                    )
                    
                    # Move to archive (would typically be database operation)
                    del self.active_settlements[settlement_id]
                    archived_count += 1
                    
                    logger.debug(f"Archived settlement {settlement_id}")
            
            logger.info(f"Archived {archived_count} settled props")
            return archived_count
            
        except Exception as e:
            logger.error(f"Failed to archive settled props: {e}")
            return 0
    
    async def get_settlement_status(self, prop_id: str) -> Optional[PropSettlement]:
        """Get current settlement status for a prop"""
        try:
            # Find most recent settlement for prop
            prop_settlements = self.settlement_history.get(prop_id, [])
            if prop_settlements:
                return prop_settlements[-1]  # Most recent
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get settlement status for prop {prop_id}: {e}")
            return None
    
    async def get_audit_trail(self, prop_id: str) -> List[SettlementAuditEntry]:
        """Get audit trail for a prop"""
        try:
            return [entry for entry in self.audit_trail if entry.prop_id == prop_id]
        except Exception as e:
            logger.error(f"Failed to get audit trail for prop {prop_id}: {e}")
            return []
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get settlement system statistics"""
        try:
            stats = self.stats.copy()
            
            # Calculate additional metrics
            if self.stats["processing_times"]:
                stats["average_processing_time"] = sum(self.stats["processing_times"]) / len(self.stats["processing_times"])
                stats["max_processing_time"] = max(self.stats["processing_times"])
                stats["min_processing_time"] = min(self.stats["processing_times"])
            
            stats["active_settlements"] = len(self.active_settlements)
            stats["pending_disputes"] = self.dispute_queue.qsize()
            stats["pending_validations"] = self.validation_queue.qsize()
            stats["pending_settlements"] = self.settlement_queue.qsize()
            
            # Calculate settlement rates
            total_settlements = self.stats["settlements_processed"]
            if total_settlements > 0:
                stats["automatic_settlement_rate"] = self.stats["automatic_settlements"] / total_settlements
                stats["manual_review_rate"] = self.stats["manual_reviews"] / total_settlements
                stats["dispute_rate"] = self.stats["disputes_created"] / total_settlements
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get settlement stats: {e}")
            return {}
    
    async def _queue_game_props_for_settlement(self, game_id: str, game_data: Dict[str, Any]):
        """Queue all props from a completed game for settlement"""
        try:
            # This would typically query the database for all active props for this game
            # For now, this is a placeholder
            logger.debug(f"Queuing props from game {game_id} for settlement")
            
            # Example: props = await get_active_props_for_game(game_id)
            # for prop in props:
            #     await self.initiate_prop_settlement(prop.id, game_data)
            
        except Exception as e:
            logger.error(f"Failed to queue game props for settlement: {e}")
    
    async def _check_for_immediate_settlements(self, event_data: HookEventData):
        """Check if live event triggers immediate prop settlements"""
        try:
            # This would contain logic to check if the event immediately settles any props
            # For example, a player injury might immediately settle certain props
            logger.debug("Checking for immediate settlements from live event")
            
        except Exception as e:
            logger.error(f"Failed to check for immediate settlements: {e}")
    
    async def _check_player_prop_settlements(self, player_id: str, stats: Dict[str, Any]):
        """Check if player stat updates trigger prop settlements"""
        try:
            # This would check if the player's current stats have crossed any prop lines
            logger.debug(f"Checking prop settlements for player {player_id} stats update")
            
        except Exception as e:
            logger.error(f"Failed to check player prop settlements: {e}")
    
    async def _queue_for_manual_review(self, settlement: PropSettlement, errors: List[str]):
        """Queue settlement for manual review"""
        try:
            logger.info(f"Queuing settlement {settlement.settlement_id} for manual review")
            
            # Add to validation queue with errors
            await self.validation_queue.put({
                "settlement_id": settlement.settlement_id,
                "prop_id": settlement.prop_id,
                "errors": errors,
                "timestamp": datetime.utcnow(),
                "priority": "high" if settlement.confidence == SettlementConfidenceLevel.UNCERTAIN else "medium"
            })
            
        except Exception as e:
            logger.error(f"Failed to queue settlement for manual review: {e}")


# Global settlement manager instance
_settlement_manager: Optional[SettlementLifecycleManager] = None


def get_settlement_manager() -> SettlementLifecycleManager:
    """Get global settlement manager instance"""
    global _settlement_manager
    if _settlement_manager is None:
        _settlement_manager = SettlementLifecycleManager()
    return _settlement_manager


# Convenience functions for settlement operations
async def initiate_settlement(prop_id: str, settlement_data: Dict[str, Any], source: SettlementSource = SettlementSource.AUTOMATED_RULE) -> PropSettlement:
    """Convenience function to initiate prop settlement"""
    manager = get_settlement_manager()
    return await manager.initiate_prop_settlement(prop_id, settlement_data, source)


async def create_settlement_dispute(settlement_id: str, reason: str, disputing_party: str, evidence: Dict[str, Any] = None) -> bool:
    """Convenience function to create settlement dispute"""
    manager = get_settlement_manager()
    return await manager.create_dispute(settlement_id, reason, disputing_party, evidence)


async def resolve_settlement_dispute(settlement_id: str, resolution: SettlementOutcome, resolver: str, notes: str = "") -> bool:
    """Convenience function to resolve settlement dispute"""
    manager = get_settlement_manager()
    return await manager.resolve_dispute(settlement_id, resolution, resolver, notes)


async def get_prop_settlement_status(prop_id: str) -> Optional[PropSettlement]:
    """Convenience function to get prop settlement status"""
    manager = get_settlement_manager()
    return await manager.get_settlement_status(prop_id)


async def get_prop_audit_trail(prop_id: str) -> List[SettlementAuditEntry]:
    """Convenience function to get prop audit trail"""
    manager = get_settlement_manager()
    return await manager.get_audit_trail(prop_id)


async def archive_old_settlements(days: int = 30) -> int:
    """Convenience function to archive old settlements"""
    manager = get_settlement_manager()
    return await manager.archive_settled_props(days)


async def get_settlement_stats() -> Dict[str, Any]:
    """Convenience function to get settlement statistics"""
    manager = get_settlement_manager()
    return await manager.get_stats()


if __name__ == "__main__":
    # Example usage and testing
    async def demo_settlement_lifecycle():
        """Demonstrate settlement lifecycle management"""
        print("Settlement & Lifecycle Management System Demo")
        print("=" * 60)
        
        manager = get_settlement_manager()
        
        # Demo 1: Initiate a settlement
        print("📋 Demo 1: Initiating Settlement")
        settlement_data = {
            "actual_value": 27.5,
            "original_line": 25.5,
            "prop_type": "over_under",
            "player_id": "player_123",
            "game_id": "game_456"
        }
        
        settlement = await manager.initiate_prop_settlement(
            "demo_prop_1",
            settlement_data,
            SettlementSource.LIVE_EVENT
        )
        print(f"  ✅ Settlement initiated: {settlement.settlement_id}")
        print(f"     Status: {settlement.status.value}")
        
        # Demo 2: Process settlement
        print("\n📋 Demo 2: Processing Settlement")
        success = await manager.process_settlement(settlement.settlement_id)
        print(f"  ✅ Settlement processed: {success}")
        
        if success:
            updated_settlement = manager.active_settlements[settlement.settlement_id]
            print(f"     Final status: {updated_settlement.status.value}")
            if updated_settlement.outcome:
                print(f"     Outcome: {updated_settlement.outcome.value}")
            print(f"     Confidence: {updated_settlement.confidence.value}")
        
        # Demo 3: Create a dispute
        print("\n📋 Demo 3: Creating Dispute")
        dispute_created = await manager.create_dispute(
            settlement.settlement_id,
            "Disputed player statistics",
            "user_123",
            {"evidence": "Player was injured during play"}
        )
        print(f"  ✅ Dispute created: {dispute_created}")
        
        # Demo 4: Resolve dispute
        print("\n📋 Demo 4: Resolving Dispute")
        dispute_resolved = await manager.resolve_dispute(
            settlement.settlement_id,
            SettlementOutcome.PUSH,
            "admin_reviewer",
            "Reviewed evidence, changing to push due to injury"
        )
        print(f"  ✅ Dispute resolved: {dispute_resolved}")
        
        # Demo 5: Get audit trail
        print("\n📋 Demo 5: Audit Trail")
        audit_trail = await manager.get_audit_trail("demo_prop_1")
        print(f"  ✅ Audit entries: {len(audit_trail)}")
        for entry in audit_trail:
            print(f"     - {entry.action} by {entry.actor} at {entry.timestamp.strftime('%H:%M:%S')}")
        
        # Demo 6: Statistics
        print("\n📋 Demo 6: Settlement Statistics")
        stats = await manager.get_stats()
        print("  ✅ Settlement statistics:")
        for key, value in stats.items():
            if isinstance(value, float):
                print(f"     {key}: {value:.3f}")
            else:
                print(f"     {key}: {value}")
        
        print("\n🎉 Settlement & Lifecycle Management Demo Complete!")
    
    # Run the demo
    asyncio.run(demo_settlement_lifecycle())