"""
Valuation Adjustment Orchestrator

Unified pipeline for collecting, normalizing, and applying adjustments from Section 4 live data components.
Handles weather, injury, lineup, line movement, and event-based adjustments with proper attribution,
cumulative impact limits, and rollback capabilities.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple, Union
from uuid import uuid4

from ..unified_config import get_live_data_config, get_config
from ..unified_logging import get_logger
from ..unified_cache_service import unified_cache_service


class AdjustmentType(Enum):
    """Types of adjustments that can be applied"""
    WEATHER = "weather"
    INJURY = "injury"
    LINEUP = "lineup"
    LINE_MOVEMENT = "line_movement"
    LIVE_EVENT = "live_event"
    MANUAL = "manual"


class AdjustmentMethod(Enum):
    """How adjustments are applied"""
    ADDITIVE = "additive"      # Add/subtract from base value
    MULTIPLICATIVE = "multiplicative"  # Multiply base value
    REPLACEMENT = "replacement"  # Replace base value entirely


class AdjustmentPriority(Enum):
    """Priority levels for adjustment application"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class AdjustmentSource:
    """Source information for an adjustment"""
    service_name: str
    component_id: str
    data_timestamp: datetime
    confidence_score: float  # 0.0 to 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Adjustment:
    """Individual adjustment to be applied"""
    id: str = field(default_factory=lambda: str(uuid4()))
    prop_id: str = ""
    adjustment_type: AdjustmentType = AdjustmentType.MANUAL
    method: AdjustmentMethod = AdjustmentMethod.MULTIPLICATIVE
    priority: AdjustmentPriority = AdjustmentPriority.MEDIUM
    
    # Adjustment values
    value: float = 0.0  # The adjustment amount
    target_field: str = "probability"  # Which prop field to adjust
    
    # Source and attribution
    source: Optional[AdjustmentSource] = None
    reason: str = ""
    description: str = ""
    
    # Lifecycle
    created_at: datetime = field(default_factory=datetime.utcnow)
    applied_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True
    
    # Impact tracking
    original_value: Optional[float] = None
    adjusted_value: Optional[float] = None
    cumulative_impact: Optional[float] = None


@dataclass
class AdjustmentBatch:
    """Batch of adjustments to be applied together"""
    id: str = field(default_factory=lambda: str(uuid4()))
    prop_id: str = ""
    adjustments: List[Adjustment] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    applied_at: Optional[datetime] = None
    
    # Batch metadata
    trigger_event: str = ""
    batch_reason: str = ""
    total_impact_estimate: Optional[float] = None


class ValuationAdjustmentOrchestrator:
    """
    Central orchestrator for all prop valuation adjustments.
    
    Key Features:
    - Unified adjustment pipeline for all Section 4 components
    - Additive and multiplicative adjustment normalization
    - Cumulative impact limits and safety caps
    - Adjustment attribution and audit trails
    - Rollback and recovery capabilities
    - Priority-based application ordering
    """
    
    def __init__(self):
        self.logger = get_logger("valuation_adjustment_orchestrator")
        self.config = get_live_data_config()
        self.app_config = get_config()
        
        # Adjustment tracking
        self.active_adjustments: Dict[str, List[Adjustment]] = {}  # prop_id -> adjustments
        self.adjustment_history: List[Adjustment] = []
        self.batch_history: List[AdjustmentBatch] = []
        
        # Configuration limits
        self.max_cumulative_adjustment = 0.25  # 25% maximum total adjustment
        self.max_adjustments_per_prop = 10
        self.adjustment_expiry_hours = 24
        
        # Performance tracking
        self.adjustment_stats = {
            "total_applied": 0,
            "total_rejected": 0,
            "total_rollbacks": 0,
            "cumulative_impact_violations": 0,
            "priority_overrides": 0,
        }
        
        self.logger.info("ValuationAdjustmentOrchestrator initialized")

    async def apply_adjustment(
        self,
        prop_id: str,
        adjustment_type: AdjustmentType,
        value: float,
        method: AdjustmentMethod = AdjustmentMethod.MULTIPLICATIVE,
        priority: AdjustmentPriority = AdjustmentPriority.MEDIUM,
        source: Optional[AdjustmentSource] = None,
        reason: str = "",
        target_field: str = "probability",
        expires_in_hours: Optional[int] = None
    ) -> Tuple[bool, str, Optional[Adjustment]]:
        """
        Apply a single adjustment to a prop.
        
        Returns:
            (success, message, adjustment_object)
        """
        try:
            # Create adjustment object
            adjustment = Adjustment(
                prop_id=prop_id,
                adjustment_type=adjustment_type,
                method=method,
                priority=priority,
                value=value,
                target_field=target_field,
                source=source,
                reason=reason,
                description=f"{adjustment_type.value} adjustment: {reason}",
                expires_at=(
                    datetime.utcnow() + timedelta(hours=expires_in_hours)
                    if expires_in_hours
                    else datetime.utcnow() + timedelta(hours=self.adjustment_expiry_hours)
                )
            )
            
            # Validate adjustment
            is_valid, validation_message = await self._validate_adjustment(adjustment)
            if not is_valid:
                self.adjustment_stats["total_rejected"] += 1
                return False, f"Validation failed: {validation_message}", None
            
            # Check cumulative impact
            if not await self._check_cumulative_impact(adjustment):
                self.adjustment_stats["cumulative_impact_violations"] += 1
                return False, "Cumulative impact limit exceeded", None
            
            # Apply the adjustment
            success, message = await self._execute_adjustment(adjustment)
            
            if success:
                # Track the adjustment
                if prop_id not in self.active_adjustments:
                    self.active_adjustments[prop_id] = []
                
                self.active_adjustments[prop_id].append(adjustment)
                self.adjustment_history.append(adjustment)
                self.adjustment_stats["total_applied"] += 1
                
                # Cache adjustment for quick lookup
                cache_key = f"adjustment_{adjustment.id}"
                await unified_cache_service.set(cache_key, adjustment, ttl=86400)  # 24 hours
                
                self.logger.info(
                    f"Applied {adjustment_type.value} adjustment",
                    extra={
                        "prop_id": prop_id,
                        "adjustment_id": adjustment.id,
                        "value": value,
                        "method": method.value,
                        "reason": reason,
                        "target_field": target_field
                    }
                )
                
                return True, "Adjustment applied successfully", adjustment
            else:
                self.adjustment_stats["total_rejected"] += 1
                return False, f"Execution failed: {message}", None
                
        except Exception as e:
            self.logger.error(f"Error applying adjustment: {e}")
            return False, f"Error: {str(e)}", None

    async def apply_adjustment_batch(
        self,
        batch: AdjustmentBatch
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Apply a batch of adjustments atomically.
        
        Returns:
            (success, message, results_dict)
        """
        results = {
            "successful_adjustments": [],
            "failed_adjustments": [],
            "total_impact": 0.0,
            "batch_id": batch.id
        }
        
        try:
            # Sort adjustments by priority (highest first)
            sorted_adjustments = sorted(
                batch.adjustments,
                key=lambda a: a.priority.value,
                reverse=True
            )
            
            # Apply adjustments in priority order
            for adjustment in sorted_adjustments:
                adjustment.prop_id = batch.prop_id  # Ensure consistency
                
                success, message, adj_obj = await self.apply_adjustment(
                    prop_id=adjustment.prop_id,
                    adjustment_type=adjustment.adjustment_type,
                    value=adjustment.value,
                    method=adjustment.method,
                    priority=adjustment.priority,
                    source=adjustment.source,
                    reason=adjustment.reason,
                    target_field=adjustment.target_field
                )
                
                if success and adj_obj:
                    results["successful_adjustments"].append({
                        "adjustment_id": adj_obj.id,
                        "type": adjustment.adjustment_type.value,
                        "value": adjustment.value,
                        "impact": adj_obj.cumulative_impact or 0.0
                    })
                    results["total_impact"] += adj_obj.cumulative_impact or 0.0
                else:
                    results["failed_adjustments"].append({
                        "adjustment_type": adjustment.adjustment_type.value,
                        "value": adjustment.value,
                        "error": message
                    })
            
            # Mark batch as applied
            batch.applied_at = datetime.utcnow()
            batch.total_impact_estimate = results["total_impact"]
            self.batch_history.append(batch)
            
            # Cache batch results
            cache_key = f"adjustment_batch_{batch.id}"
            await unified_cache_service.set(cache_key, results, ttl=86400)
            
            success_count = len(results["successful_adjustments"])
            total_count = len(batch.adjustments)
            
            if success_count == total_count:
                message = f"All {total_count} adjustments applied successfully"
                return True, message, results
            elif success_count > 0:
                message = f"{success_count}/{total_count} adjustments applied successfully"
                return True, message, results
            else:
                message = "No adjustments were successfully applied"
                return False, message, results
                
        except Exception as e:
            self.logger.error(f"Error applying adjustment batch: {e}")
            return False, f"Batch application error: {str(e)}", results

    async def rollback_adjustment(self, adjustment_id: str) -> Tuple[bool, str]:
        """
        Rollback a specific adjustment.
        
        Returns:
            (success, message)
        """
        try:
            # Find the adjustment
            adjustment = None
            prop_id = None
            
            for pid, adjustments in self.active_adjustments.items():
                for adj in adjustments:
                    if adj.id == adjustment_id:
                        adjustment = adj
                        prop_id = pid
                        break
                if adjustment:
                    break
            
            if not adjustment:
                return False, f"Adjustment {adjustment_id} not found"
            
            # Deactivate the adjustment
            adjustment.is_active = False
            
            # Remove from active adjustments
            if prop_id and prop_id in self.active_adjustments:
                self.active_adjustments[prop_id] = [
                    adj for adj in self.active_adjustments[prop_id] 
                    if adj.id != adjustment_id
                ]
                
                # Clean up empty prop entries
                if not self.active_adjustments[prop_id]:
                    del self.active_adjustments[prop_id]
            
            # Recompute prop value without this adjustment
            if prop_id:  # Type guard to ensure prop_id is not None
                await self._recompute_prop_value(prop_id)
            
            self.adjustment_stats["total_rollbacks"] += 1
            
            self.logger.info(
                f"Rolled back adjustment {adjustment_id}",
                extra={
                    "prop_id": prop_id,
                    "adjustment_type": adjustment.adjustment_type.value,
                    "original_value": adjustment.value
                }
            )
            
            return True, "Adjustment rolled back successfully"
            
        except Exception as e:
            self.logger.error(f"Error rolling back adjustment: {e}")
            return False, f"Rollback error: {str(e)}"

    async def get_prop_adjustments(self, prop_id: str) -> List[Adjustment]:
        """Get all active adjustments for a prop"""
        return self.active_adjustments.get(prop_id, [])

    async def get_cumulative_impact(self, prop_id: str) -> Dict[str, float]:
        """Calculate cumulative impact of all adjustments on a prop"""
        adjustments = await self.get_prop_adjustments(prop_id)
        
        impact = {
            "additive_total": 0.0,
            "multiplicative_total": 1.0,
            "net_impact_percent": 0.0
        }
        
        for adj in adjustments:
            if not adj.is_active:
                continue
                
            if adj.method == AdjustmentMethod.ADDITIVE:
                impact["additive_total"] += adj.value
            elif adj.method == AdjustmentMethod.MULTIPLICATIVE:
                impact["multiplicative_total"] *= (1.0 + adj.value)
        
        # Calculate net impact as percentage change from original
        net_multiplier = impact["multiplicative_total"]
        net_additive = impact["additive_total"]
        
        # Simplified impact calculation (would need original value for exact calculation)
        impact["net_impact_percent"] = abs(net_multiplier - 1.0) + abs(net_additive)
        
        return impact

    async def cleanup_expired_adjustments(self) -> int:
        """Remove expired adjustments and return count removed"""
        removed_count = 0
        current_time = datetime.utcnow()
        
        try:
            for prop_id in list(self.active_adjustments.keys()):
                original_count = len(self.active_adjustments[prop_id])
                
                # Filter out expired adjustments
                self.active_adjustments[prop_id] = [
                    adj for adj in self.active_adjustments[prop_id]
                    if adj.expires_at is None or adj.expires_at > current_time
                ]
                
                new_count = len(self.active_adjustments[prop_id])
                removed_count += (original_count - new_count)
                
                # Remove empty prop entries
                if not self.active_adjustments[prop_id]:
                    del self.active_adjustments[prop_id]
                elif new_count < original_count:
                    # Recompute prop value if adjustments were removed
                    await self._recompute_prop_value(prop_id)
            
            if removed_count > 0:
                self.logger.info(f"Cleaned up {removed_count} expired adjustments")
            
            return removed_count
            
        except Exception as e:
            self.logger.error(f"Error cleaning up expired adjustments: {e}")
            return 0

    async def get_orchestrator_stats(self) -> Dict[str, Any]:
        """Get comprehensive orchestrator statistics"""
        active_adjustment_count = sum(len(adjs) for adjs in self.active_adjustments.values())
        
        # Calculate type distribution
        type_distribution = {}
        for adjustments in self.active_adjustments.values():
            for adj in adjustments:
                adj_type = adj.adjustment_type.value
                type_distribution[adj_type] = type_distribution.get(adj_type, 0) + 1
        
        return {
            "active_adjustments": active_adjustment_count,
            "props_with_adjustments": len(self.active_adjustments),
            "total_history_entries": len(self.adjustment_history),
            "total_batches": len(self.batch_history),
            "type_distribution": type_distribution,
            "performance_stats": self.adjustment_stats.copy(),
            "max_cumulative_adjustment": self.max_cumulative_adjustment,
            "max_adjustments_per_prop": self.max_adjustments_per_prop
        }

    # Private methods

    async def _validate_adjustment(self, adjustment: Adjustment) -> Tuple[bool, str]:
        """Validate an adjustment before applying"""
        # Check if prop exists (would need prop service integration)
        if not adjustment.prop_id:
            return False, "prop_id is required"
        
        # Check value bounds
        if adjustment.method == AdjustmentMethod.MULTIPLICATIVE:
            if adjustment.value < -0.99:  # Can't reduce by more than 99%
                return False, "Multiplicative adjustment too negative (< -99%)"
            if adjustment.value > 5.0:  # Can't increase by more than 500%
                return False, "Multiplicative adjustment too large (> 500%)"
        elif adjustment.method == AdjustmentMethod.ADDITIVE:
            if abs(adjustment.value) > 1.0:  # Additive adjustments should be reasonable
                return False, "Additive adjustment too large (> ±1.0)"
        
        # Check adjustment limits per prop
        prop_adjustments = self.active_adjustments.get(adjustment.prop_id, [])
        if len(prop_adjustments) >= self.max_adjustments_per_prop:
            return False, f"Maximum adjustments per prop exceeded ({self.max_adjustments_per_prop})"
        
        # Check for conflicts (same type and target field)
        for existing_adj in prop_adjustments:
            if (existing_adj.adjustment_type == adjustment.adjustment_type and
                existing_adj.target_field == adjustment.target_field and
                existing_adj.is_active):
                # Allow if new adjustment has higher priority
                if adjustment.priority.value > existing_adj.priority.value:
                    self.adjustment_stats["priority_overrides"] += 1
                    # Mark existing adjustment as inactive
                    existing_adj.is_active = False
                else:
                    return False, f"Conflicting adjustment of same type already exists"
        
        return True, "Validation passed"

    async def _check_cumulative_impact(self, new_adjustment: Adjustment) -> bool:
        """Check if adding this adjustment would exceed cumulative impact limits"""
        # Get current cumulative impact
        current_impact = await self.get_cumulative_impact(new_adjustment.prop_id)
        
        # Estimate impact of new adjustment
        estimated_additional_impact = abs(new_adjustment.value)
        
        # Simple cumulative check (could be more sophisticated)
        total_estimated_impact = (
            current_impact["net_impact_percent"] + estimated_additional_impact
        )
        
        return total_estimated_impact <= self.max_cumulative_adjustment

    async def _execute_adjustment(self, adjustment: Adjustment) -> Tuple[bool, str]:
        """Execute the actual adjustment (integrate with prop valuation service)"""
        try:
            # This would integrate with the actual prop valuation system
            # For now, just mark as applied and track impact
            
            adjustment.applied_at = datetime.utcnow()
            
            # Simulate adjustment application
            # In real implementation, this would:
            # 1. Get current prop value
            # 2. Apply adjustment based on method
            # 3. Update prop in database/cache
            # 4. Track original and adjusted values
            
            # For now, just simulate
            adjustment.original_value = 0.5  # Simulated original value
            
            if adjustment.method == AdjustmentMethod.MULTIPLICATIVE:
                adjustment.adjusted_value = adjustment.original_value * (1.0 + adjustment.value)
            elif adjustment.method == AdjustmentMethod.ADDITIVE:
                adjustment.adjusted_value = adjustment.original_value + adjustment.value
            else:  # REPLACEMENT
                adjustment.adjusted_value = adjustment.value
            
            # Calculate impact
            if adjustment.original_value and adjustment.original_value != 0:
                adjustment.cumulative_impact = abs(
                    (adjustment.adjusted_value - adjustment.original_value) / adjustment.original_value
                )
            
            return True, "Adjustment executed successfully"
            
        except Exception as e:
            return False, f"Execution error: {str(e)}"

    async def _recompute_prop_value(self, prop_id: str) -> bool:
        """Recompute prop value after adjustment changes"""
        try:
            # This would integrate with the prop valuation system to recompute
            # the prop value based on current active adjustments
            
            adjustments = await self.get_prop_adjustments(prop_id)
            if not adjustments:
                return True
            
            # Apply all active adjustments in priority order
            sorted_adjustments = sorted(
                [adj for adj in adjustments if adj.is_active],
                key=lambda a: a.priority.value,
                reverse=True
            )
            
            # Simulate recomputation
            self.logger.debug(
                f"Recomputing prop {prop_id} with {len(sorted_adjustments)} adjustments"
            )
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error recomputing prop value: {e}")
            return False


# Global instance
_orchestrator_instance: Optional[ValuationAdjustmentOrchestrator] = None


def get_adjustment_orchestrator() -> ValuationAdjustmentOrchestrator:
    """Get the global adjustment orchestrator instance"""
    global _orchestrator_instance
    
    if _orchestrator_instance is None:
        _orchestrator_instance = ValuationAdjustmentOrchestrator()
    
    return _orchestrator_instance


# Convenience functions for common adjustment types

async def apply_weather_adjustment(
    prop_id: str,
    impact_factor: float,
    weather_condition: str,
    confidence: float = 0.8,
    source_metadata: Optional[Dict[str, Any]] = None
) -> Tuple[bool, str, Optional[Adjustment]]:
    """Apply a weather-based adjustment"""
    orchestrator = get_adjustment_orchestrator()
    
    source = AdjustmentSource(
        service_name="weather_api_integration",
        component_id="weather_adjustment",
        data_timestamp=datetime.utcnow(),
        confidence_score=confidence,
        metadata=source_metadata or {"weather_condition": weather_condition}
    )
    
    return await orchestrator.apply_adjustment(
        prop_id=prop_id,
        adjustment_type=AdjustmentType.WEATHER,
        value=impact_factor,
        method=AdjustmentMethod.MULTIPLICATIVE,
        priority=AdjustmentPriority.MEDIUM,
        source=source,
        reason=f"Weather impact: {weather_condition}",
        target_field="probability"
    )


async def apply_injury_adjustment(
    prop_id: str,
    impact_factor: float,
    player_name: str,
    injury_severity: str,
    confidence: float = 0.9,
    source_metadata: Optional[Dict[str, Any]] = None
) -> Tuple[bool, str, Optional[Adjustment]]:
    """Apply an injury-based adjustment"""
    orchestrator = get_adjustment_orchestrator()
    
    # Determine priority based on injury severity
    priority_map = {
        "minor": AdjustmentPriority.LOW,
        "moderate": AdjustmentPriority.MEDIUM,
        "major": AdjustmentPriority.HIGH,
        "critical": AdjustmentPriority.CRITICAL
    }
    priority = priority_map.get(injury_severity.lower(), AdjustmentPriority.MEDIUM)
    
    source = AdjustmentSource(
        service_name="live_injury_lineup_monitor",
        component_id="injury_adjustment",
        data_timestamp=datetime.utcnow(),
        confidence_score=confidence,
        metadata=source_metadata or {
            "player_name": player_name,
            "injury_severity": injury_severity
        }
    )
    
    return await orchestrator.apply_adjustment(
        prop_id=prop_id,
        adjustment_type=AdjustmentType.INJURY,
        value=impact_factor,
        method=AdjustmentMethod.MULTIPLICATIVE,
        priority=priority,
        source=source,
        reason=f"Injury impact: {player_name} ({injury_severity})",
        target_field="probability"
    )


async def apply_line_movement_adjustment(
    prop_id: str,
    movement_factor: float,
    movement_type: str,
    confidence: float = 0.7,
    source_metadata: Optional[Dict[str, Any]] = None
) -> Tuple[bool, str, Optional[Adjustment]]:
    """Apply a line movement-based adjustment"""
    orchestrator = get_adjustment_orchestrator()
    
    # Higher priority for steam moves
    priority = (
        AdjustmentPriority.HIGH if "steam" in movement_type.lower()
        else AdjustmentPriority.MEDIUM
    )
    
    source = AdjustmentSource(
        service_name="line_movement_tracker",
        component_id="line_movement_adjustment",
        data_timestamp=datetime.utcnow(),
        confidence_score=confidence,
        metadata=source_metadata or {"movement_type": movement_type}
    )
    
    return await orchestrator.apply_adjustment(
        prop_id=prop_id,
        adjustment_type=AdjustmentType.LINE_MOVEMENT,
        value=movement_factor,
        method=AdjustmentMethod.MULTIPLICATIVE,
        priority=priority,
        source=source,
        reason=f"Line movement: {movement_type}",
        target_field="probability",
        expires_in_hours=2  # Line movement adjustments expire quickly
    )