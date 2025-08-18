"""
Edge Persistence Model
======================

Tracks edge quality over time and implements decay scoring to remove stale edges.
Core component for maintaining reliable edge detection in the Model Integrity Phase.

Key Features:
- Edge persistence scoring (tracks how long edges remain valid)
- Decay models for different edge types
- False positive detection and filtering
- Edge retirement based on volatility and time
- Real-time edge quality metrics

Focus: Reduce edge churn and improve signal-to-noise ratio
"""

import asyncio
import time
import math
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any, Set
from collections import defaultdict, deque
import statistics
import logging

from ..services.unified_cache_service import unified_cache_service

logger = logging.getLogger("edge_persistence")


class EdgeType(Enum):
    """Types of betting edges"""
    PLAYER_PROP = "player_prop"
    TEAM_PROP = "team_prop"
    GAME_TOTAL = "game_total"
    SPREAD = "spread"
    MONEYLINE = "moneyline"


class EdgeStatus(Enum):
    """Current status of an edge"""
    ACTIVE = "active"           # Currently valid edge
    DECAYING = "decaying"       # Edge weakening but still valid
    RETIRED = "retired"         # Edge no longer valid
    FALSE_POSITIVE = "false_positive"  # Detected as false positive


class DecayReason(Enum):
    """Reasons for edge decay"""
    TIME_BASED = "time_based"           # Natural time decay
    LINE_MOVEMENT = "line_movement"     # Line moved against edge
    VOLUME_INCREASE = "volume_increase" # High betting volume
    MODEL_CONFIDENCE_DROP = "confidence_drop"  # Model less confident
    VOLATILITY_HIGH = "volatility_high" # High market volatility
    MANUAL_RETIREMENT = "manual"        # Manually retired
    FALSE_POSITIVE = "false_positive"   # Detected as false positive


@dataclass
class EdgeSnapshot:
    """Point-in-time snapshot of an edge"""
    timestamp: float
    expected_value: float
    confidence_score: float
    line_value: float
    market_volume: Optional[int] = None
    volatility: Optional[float] = None
    
    
@dataclass
class Edge:
    """Individual betting edge with persistence tracking"""
    id: str
    game_id: str
    prop_id: str
    edge_type: EdgeType
    initial_ev: float           # Expected value when edge was created
    current_ev: float           # Current expected value
    confidence_score: float     # Model confidence (0-1)
    line_when_created: float    # Original line value
    current_line: float         # Current line value
    
    # Persistence tracking
    created_at: float
    last_updated: float
    status: EdgeStatus = EdgeStatus.ACTIVE
    persistence_score: float = 1.0    # 1.0 = fresh, 0.0 = fully decayed
    decay_rate: float = 0.1            # Decay rate per hour
    
    # History and metrics
    snapshots: Optional[List[EdgeSnapshot]] = None
    false_positive_signals: int = 0
    line_movement_against: float = 0.0  # How much line moved against us
    retirement_reason: Optional[DecayReason] = None
    retired_at: Optional[float] = None
    
    # Context
    context: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.snapshots is None:
            self.snapshots = []
        if self.context is None:
            self.context = {}
        
        # Add initial snapshot
        self.snapshots.append(EdgeSnapshot(
            timestamp=self.created_at,
            expected_value=self.initial_ev,
            confidence_score=self.confidence_score,
            line_value=self.line_when_created
        ))
    
    @property
    def age_hours(self) -> float:
        """Age of the edge in hours"""
        return (time.time() - self.created_at) / 3600
    
    @property
    def is_active(self) -> bool:
        """Check if edge is still active"""
        return self.status == EdgeStatus.ACTIVE
    
    @property
    def ev_change(self) -> float:
        """Change in expected value since creation"""
        return self.current_ev - self.initial_ev
    
    @property
    def line_movement(self) -> float:
        """Total line movement since creation"""
        return abs(self.current_line - self.line_when_created)
    
    def add_snapshot(self, ev: float, confidence: float, line: float, volume: Optional[int] = None, volatility: Optional[float] = None):
        """Add a new snapshot of edge state"""
        if self.snapshots is None:
            self.snapshots = []
            
        snapshot = EdgeSnapshot(
            timestamp=time.time(),
            expected_value=ev,
            confidence_score=confidence,
            line_value=line,
            market_volume=volume,
            volatility=volatility
        )
        self.snapshots.append(snapshot)
        
        # Update current values
        self.current_ev = ev
        self.confidence_score = confidence
        self.current_line = line
        self.last_updated = time.time()
    
    def get_ev_trend(self, lookback_minutes: int = 60) -> Optional[float]:
        """Get EV trend over the last N minutes (positive = improving)"""
        if not self.snapshots:
            return None
            
        cutoff_time = time.time() - (lookback_minutes * 60)
        recent_snapshots = [s for s in self.snapshots if s.timestamp >= cutoff_time]
        
        if len(recent_snapshots) < 2:
            return None
            
        # Simple linear trend
        evs = [s.expected_value for s in recent_snapshots]
        return evs[-1] - evs[0]  # Change from first to last
    
    def get_volatility_score(self) -> float:
        """Calculate volatility score based on EV fluctuations"""
        if not self.snapshots or len(self.snapshots) < 3:
            return 0.0
            
        evs = [s.expected_value for s in self.snapshots[-10:]]  # Last 10 snapshots
        return statistics.stdev(evs) if len(evs) > 1 else 0.0


@dataclass
class EdgeRetirementRule:
    """Rules for when to retire edges"""
    edge_type: EdgeType
    max_age_hours: float = 24.0           # Retire after 24 hours
    min_ev_threshold: float = 0.02        # Retire if EV drops below 2%
    min_confidence: float = 0.3           # Retire if confidence drops below 30%
    max_line_movement: float = 1.0        # Retire if line moves more than 1.0
    max_volatility: float = 0.1           # Retire if volatility too high
    false_positive_threshold: int = 3     # Retire after 3 false positive signals


class EdgePersistenceModel:
    """
    Manages edge lifecycle and persistence scoring
    
    Core functionality:
    1. Track edge quality over time
    2. Apply decay models based on edge type and conditions
    3. Detect and retire false positives
    4. Maintain edge quality metrics
    5. Provide persistence scoring for ranking
    """
    
    def __init__(self):
        self.edges: Dict[str, Edge] = {}
        self.retired_edges: Dict[str, Edge] = {}
        
        # Configuration: decay rates by edge type (per hour)
        self.decay_rates = {
            EdgeType.PLAYER_PROP: 0.08,    # Player props decay slower
            EdgeType.TEAM_PROP: 0.12,      # Team props decay faster
            EdgeType.GAME_TOTAL: 0.15,     # Totals decay quickly
            EdgeType.SPREAD: 0.10,         # Spreads moderate decay
            EdgeType.MONEYLINE: 0.20       # Moneylines decay fastest
        }
        
        # Retirement rules by edge type
        self.retirement_rules = {
            EdgeType.PLAYER_PROP: EdgeRetirementRule(
                edge_type=EdgeType.PLAYER_PROP,
                max_age_hours=12.0,
                min_ev_threshold=0.03,
                min_confidence=0.4,
                max_line_movement=0.5
            ),
            EdgeType.TEAM_PROP: EdgeRetirementRule(
                edge_type=EdgeType.TEAM_PROP,
                max_age_hours=8.0,
                min_ev_threshold=0.025,
                min_confidence=0.35,
                max_line_movement=0.75
            ),
            EdgeType.GAME_TOTAL: EdgeRetirementRule(
                edge_type=EdgeType.GAME_TOTAL,
                max_age_hours=6.0,
                min_ev_threshold=0.02,
                min_confidence=0.3,
                max_line_movement=1.0
            ),
            EdgeType.SPREAD: EdgeRetirementRule(
                edge_type=EdgeType.SPREAD,
                max_age_hours=8.0,
                min_ev_threshold=0.025,
                min_confidence=0.35,
                max_line_movement=1.5
            ),
            EdgeType.MONEYLINE: EdgeRetirementRule(
                edge_type=EdgeType.MONEYLINE,
                max_age_hours=4.0,
                min_ev_threshold=0.02,
                min_confidence=0.3,
                max_line_movement=0.1  # Moneyline movement in decimal odds
            )
        }
        
        # Metrics tracking
        self.metrics = {
            "edges_created": 0,
            "edges_retired": 0,
            "false_positives_detected": 0,
            "average_edge_lifespan_hours": 0.0,
            "active_edges": 0,
            "persistence_score_avg": 0.0
        }
        
        # Performance tracking
        self.edge_history: deque = deque(maxlen=1000)  # Track retired edges for analysis
        
        logger.info("EdgePersistenceModel initialized")

    async def create_edge(
        self,
        edge_id: str,
        game_id: str,
        prop_id: str,
        edge_type: EdgeType,
        expected_value: float,
        confidence_score: float,
        line_value: float,
        context: Optional[Dict[str, Any]] = None
    ) -> Edge:
        """Create a new edge for tracking"""
        
        edge = Edge(
            id=edge_id,
            game_id=game_id,
            prop_id=prop_id,
            edge_type=edge_type,
            initial_ev=expected_value,
            current_ev=expected_value,
            confidence_score=confidence_score,
            line_when_created=line_value,
            current_line=line_value,
            created_at=time.time(),
            last_updated=time.time(),
            decay_rate=self.decay_rates.get(edge_type, 0.1),
            context=context or {}
        )
        
        self.edges[edge_id] = edge
        self.metrics["edges_created"] += 1
        self.metrics["active_edges"] += 1
        
        logger.info(f"Created edge {edge_id} - type: {edge_type.value}, "
                   f"EV: {expected_value:.3f}, confidence: {confidence_score:.3f}, "
                   f"line: {line_value}")
        
        return edge

    async def update_edge(
        self,
        edge_id: str,
        expected_value: float,
        confidence_score: float,
        line_value: float,
        market_volume: Optional[int] = None,
        volatility: Optional[float] = None
    ) -> Optional[Edge]:
        """Update an existing edge with new values"""
        
        if edge_id not in self.edges:
            logger.warning(f"Cannot update unknown edge: {edge_id}")
            return None
            
        edge = self.edges[edge_id]
        
        if edge.status != EdgeStatus.ACTIVE:
            logger.debug(f"Cannot update inactive edge: {edge_id}")
            return None
            
        # Add snapshot with new values
        edge.add_snapshot(expected_value, confidence_score, line_value, market_volume, volatility)
        
        # Update line movement tracking
        line_movement = abs(line_value - edge.line_when_created)
        if line_value > edge.line_when_created and expected_value < edge.initial_ev:
            edge.line_movement_against += line_movement * 0.5  # Weight line movement against us
        
        # Recalculate persistence score
        await self._update_persistence_score(edge)
        
        # Check for retirement conditions
        await self._check_retirement_conditions(edge)
        
        logger.debug(f"Updated edge {edge_id} - EV: {expected_value:.3f} -> "
                    f"persistence: {edge.persistence_score:.3f}")
        
        return edge

    async def _update_persistence_score(self, edge: Edge) -> None:
        """Update the persistence score for an edge"""
        
        base_score = 1.0
        
        # Time-based decay
        time_decay = math.exp(-edge.decay_rate * edge.age_hours)
        
        # EV change factor (penalize declining EV)
        ev_factor = 1.0
        if edge.ev_change < 0:
            ev_factor = max(0.2, 1.0 + (edge.ev_change / edge.initial_ev))  # Proportional penalty
            
        # Confidence factor
        confidence_factor = edge.confidence_score
        
        # Line movement penalty
        movement_factor = 1.0
        retirement_rule = self.retirement_rules.get(edge.edge_type)
        if retirement_rule and edge.line_movement > 0:
            movement_ratio = edge.line_movement / retirement_rule.max_line_movement
            movement_factor = max(0.1, 1.0 - (movement_ratio * 0.5))
            
        # Volatility penalty
        volatility_factor = 1.0
        volatility = edge.get_volatility_score()
        if volatility > 0.05:  # High volatility threshold
            volatility_factor = max(0.3, 1.0 - volatility)
            
        # Combine factors
        persistence_score = (
            base_score * 
            time_decay * 
            ev_factor * 
            confidence_factor * 
            movement_factor * 
            volatility_factor
        )
        
        edge.persistence_score = max(0.0, min(1.0, persistence_score))
        
        # Update status based on persistence score
        if edge.persistence_score < 0.2:
            edge.status = EdgeStatus.DECAYING
        elif edge.persistence_score < 0.1:
            await self._retire_edge(edge, DecayReason.TIME_BASED)

    async def _check_retirement_conditions(self, edge: Edge) -> None:
        """Check if an edge should be retired based on rules"""
        
        retirement_rule = self.retirement_rules.get(edge.edge_type)
        if not retirement_rule:
            return
            
        # Check age limit
        if edge.age_hours > retirement_rule.max_age_hours:
            await self._retire_edge(edge, DecayReason.TIME_BASED)
            return
            
        # Check minimum EV
        if edge.current_ev < retirement_rule.min_ev_threshold:
            await self._retire_edge(edge, DecayReason.MODEL_CONFIDENCE_DROP)
            return
            
        # Check minimum confidence
        if edge.confidence_score < retirement_rule.min_confidence:
            await self._retire_edge(edge, DecayReason.MODEL_CONFIDENCE_DROP)
            return
            
        # Check line movement
        if edge.line_movement > retirement_rule.max_line_movement:
            await self._retire_edge(edge, DecayReason.LINE_MOVEMENT)
            return
            
        # Check volatility
        volatility = edge.get_volatility_score()
        if volatility > retirement_rule.max_volatility:
            await self._retire_edge(edge, DecayReason.VOLATILITY_HIGH)
            return
            
        # Check false positive count
        if edge.false_positive_signals >= retirement_rule.false_positive_threshold:
            await self._retire_edge(edge, DecayReason.FALSE_POSITIVE)

    async def _retire_edge(self, edge: Edge, reason: DecayReason) -> None:
        """Retire an edge and move it to retired collection"""
        
        edge.status = EdgeStatus.RETIRED
        edge.retirement_reason = reason
        edge.retired_at = time.time()
        
        # Move to retired collection
        self.retired_edges[edge.id] = edge
        del self.edges[edge.id]
        
        # Update metrics
        self.metrics["edges_retired"] += 1
        self.metrics["active_edges"] -= 1
        
        if reason == DecayReason.FALSE_POSITIVE:
            self.metrics["false_positives_detected"] += 1
            
        # Add to history for analysis
        self.edge_history.append({
            "edge_id": edge.id,
            "edge_type": edge.edge_type.value,
            "lifespan_hours": edge.age_hours,
            "initial_ev": edge.initial_ev,
            "final_ev": edge.current_ev,
            "retirement_reason": reason.value,
            "retired_at": edge.retired_at
        })
        
        # Update average lifespan
        lifespans = [e["lifespan_hours"] for e in self.edge_history]
        self.metrics["average_edge_lifespan_hours"] = statistics.mean(lifespans) if lifespans else 0.0
        
        logger.info(f"Retired edge {edge.id} - reason: {reason.value}, "
                   f"age: {edge.age_hours:.1f}h, final_EV: {edge.current_ev:.3f}")

    async def flag_false_positive(self, edge_id: str, reason: str = "") -> None:
        """Flag an edge as potentially false positive"""
        
        if edge_id not in self.edges:
            return
            
        edge = self.edges[edge_id]
        edge.false_positive_signals += 1
        
        logger.warning(f"False positive signal for edge {edge_id} - "
                      f"count: {edge.false_positive_signals}, reason: {reason}")
        
        # Check if we should retire based on false positive threshold
        await self._check_retirement_conditions(edge)

    async def get_active_edges(self, min_persistence_score: float = 0.1) -> List[Edge]:
        """Get all active edges above a minimum persistence threshold"""
        
        return [
            edge for edge in self.edges.values()
            if edge.status == EdgeStatus.ACTIVE and edge.persistence_score >= min_persistence_score
        ]

    async def get_edges_by_game(self, game_id: str) -> List[Edge]:
        """Get all active edges for a specific game"""
        
        return [
            edge for edge in self.edges.values()
            if edge.game_id == game_id and edge.status == EdgeStatus.ACTIVE
        ]

    async def get_edges_by_type(self, edge_type: EdgeType) -> List[Edge]:
        """Get all active edges of a specific type"""
        
        return [
            edge for edge in self.edges.values()
            if edge.edge_type == edge_type and edge.status == EdgeStatus.ACTIVE
        ]

    async def cleanup_stale_edges(self) -> int:
        """Clean up edges that should be retired - returns count cleaned"""
        
        edges_to_check = list(self.edges.values())
        cleaned_count = 0
        
        for edge in edges_to_check:
            if edge.status == EdgeStatus.ACTIVE:
                await self._update_persistence_score(edge)
                await self._check_retirement_conditions(edge)
                
                if edge.id not in self.edges:  # Was retired
                    cleaned_count += 1
                    
        logger.info(f"Cleaned up {cleaned_count} stale edges")
        return cleaned_count

    def get_edge_quality_summary(self) -> Dict[str, Any]:
        """Get summary of edge quality metrics"""
        
        active_edges = list(self.edges.values())
        
        if not active_edges:
            return {
                "active_edges": 0,
                "average_persistence": 0.0,
                "average_ev": 0.0,
                "average_confidence": 0.0,
                "edge_types": {}
            }
        
        # Calculate averages
        persistence_scores = [e.persistence_score for e in active_edges]
        evs = [e.current_ev for e in active_edges]
        confidences = [e.confidence_score for e in active_edges]
        
        # Group by type
        type_counts = defaultdict(int)
        type_persistence = defaultdict(list)
        
        for edge in active_edges:
            type_counts[edge.edge_type.value] += 1
            type_persistence[edge.edge_type.value].append(edge.persistence_score)
        
        type_stats = {}
        for edge_type, count in type_counts.items():
            type_stats[edge_type] = {
                "count": count,
                "avg_persistence": statistics.mean(type_persistence[edge_type])
            }
        
        return {
            "active_edges": len(active_edges),
            "average_persistence": statistics.mean(persistence_scores),
            "average_ev": statistics.mean(evs),
            "average_confidence": statistics.mean(confidences),
            "edge_types": type_stats,
            "metrics": self.metrics.copy()
        }

    async def export_metrics(self) -> Dict[str, Any]:
        """Export edge persistence metrics for monitoring"""
        
        quality_summary = self.get_edge_quality_summary()
        
        metrics = {
            "timestamp": time.time(),
            "quality_summary": quality_summary,
            "retirement_reasons": {},
            "edge_type_breakdown": {},
            "persistence_distribution": {}
        }
        
        # Analyze retirement reasons
        retirement_counts = defaultdict(int)
        for edge_data in self.edge_history:
            retirement_counts[edge_data["retirement_reason"]] += 1
        metrics["retirement_reasons"] = dict(retirement_counts)
        
        # Analyze by edge type
        for edge_type in EdgeType:
            type_edges = [e for e in self.edges.values() if e.edge_type == edge_type]
            if type_edges:
                metrics["edge_type_breakdown"][edge_type.value] = {
                    "active_count": len(type_edges),
                    "avg_persistence": statistics.mean([e.persistence_score for e in type_edges]),
                    "avg_age_hours": statistics.mean([e.age_hours for e in type_edges])
                }
        
        # Persistence score distribution
        if self.edges:
            persistence_scores = [e.persistence_score for e in self.edges.values()]
            metrics["persistence_distribution"] = {
                "high": len([s for s in persistence_scores if s >= 0.7]),
                "medium": len([s for s in persistence_scores if 0.3 <= s < 0.7]),
                "low": len([s for s in persistence_scores if s < 0.3])
            }
        
        # Store in cache for API access
        await unified_cache_service.set("edge_persistence_metrics", metrics, ttl=300)  # 5 minute TTL
        
        return metrics

    def get_edge(self, edge_id: str) -> Optional[Edge]:
        """Get a specific edge by ID"""
        return self.edges.get(edge_id) or self.retired_edges.get(edge_id)


# Global edge persistence model instance
edge_persistence_model = EdgePersistenceModel()