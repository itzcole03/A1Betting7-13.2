"""
Edge Delta Handler

Handles market data changes and updates edge calculations
(value betting opportunities) based on valuation changes.
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

from .base_handler import BaseDeltaHandler, DeltaContext, ProcessingResult
from backend.services.unified_logging import get_logger


class EdgeDeltaHandler(BaseDeltaHandler):
    """Handles edge calculation updates when valuations change"""
    
    def __init__(self):
        super().__init__(
            name="edge_delta",
            dependencies=["valuation_delta"]  # Depends on valuations
        )
        
    async def can_process(self, context: DeltaContext) -> bool:
        """Check if we should process this delta for edge calculations"""
        
        # Process market events that affect edge calculations
        relevant_events = {
            "PROP_ADDED",
            "PROP_UPDATED", 
            "PROP_REMOVED"
        }
        
        if context.event_type not in relevant_events:
            return False
            
        # For updates, check if edge-relevant fields changed
        if context.event_type == "PROP_UPDATED":
            if not context.current_data or not context.previous_data:
                return False
                
            # Fields that affect edge calculations
            edge_fields = {
                "line_value", "odds_value", "status"
            }
            
            has_edge_changes = False
            for field in edge_fields:
                if context.current_data.get(field) != context.previous_data.get(field):
                    has_edge_changes = True
                    break
                    
            if not has_edge_changes:
                self.logger.debug(f"No edge-relevant changes in {context.prop_id}")
                return False
                
        return True
        
    async def process_delta(self, context: DeltaContext) -> ProcessingResult:
        """Process edge calculations for the delta"""
        
        affected_entities = []
        errors = []
        dependencies_triggered = []
        
        try:
            if context.event_type == "PROP_ADDED":
                affected_entities.extend(await self._handle_prop_added(context))
                dependencies_triggered.append("portfolio_refresh")  # Trigger portfolio optimization
                
            elif context.event_type == "PROP_UPDATED":
                affected_entities.extend(await self._handle_prop_updated(context))
                dependencies_triggered.append("portfolio_refresh")  # Re-optimize portfolio
                
            elif context.event_type == "PROP_REMOVED":
                affected_entities.extend(await self._handle_prop_removed(context))
                dependencies_triggered.append("portfolio_refresh")  # Clean up portfolio
                
            self.logger.info(
                f"Edge processing complete for {context.prop_id}, "
                f"affected {len(affected_entities)} edges"
            )
            
            return ProcessingResult(
                success=True,
                handler_name=self.name,
                processing_time_ms=0,  # Will be set by base class
                affected_entities=affected_entities,
                errors=errors,
                dependencies_triggered=dependencies_triggered,
                context=context
            )
            
        except Exception as e:
            errors.append(f"Edge processing error: {str(e)}")
            self.logger.error(f"Error in edge processing: {e}")
            
            return ProcessingResult(
                success=False,
                handler_name=self.name,
                processing_time_ms=0,
                affected_entities=affected_entities,
                errors=errors,
                dependencies_triggered=[],
                context=context
            )
            
    async def _handle_prop_added(self, context: DeltaContext) -> List[str]:
        """Handle new prop addition - calculate initial edges"""
        affected = []
        
        if not context.current_data:
            return affected
            
        prop_data = context.current_data
        
        try:
            # Calculate edge for new prop
            edge_id = f"edge_{context.prop_id}_{context.provider}"
            
            self.logger.debug(f"Calculating edge {edge_id} for new prop")
            
            edge_value = await self._calculate_edge(prop_data, context)
            
            if edge_value and abs(edge_value) > 0.01:  # Significant edge threshold
                # TODO: Store edge in database
                # edge = Edge(
                #     prop_id=context.prop_id,
                #     provider=context.provider,
                #     edge_value=edge_value,
                #     calculation_timestamp=datetime.utcnow(),
                #     confidence=0.8,
                #     metadata={
                #         "line_value": prop_data.get("line_value"),
                #         "odds_value": prop_data.get("odds_value"),
                #         "market_type": prop_data.get("market_type")
                #     }
                # )
                
                affected.append(edge_id)
                
                self.logger.info(f"Positive edge detected: {edge_value:.3f} for {context.prop_id}")
                
        except Exception as e:
            self.logger.error(f"Error calculating edge for {context.prop_id}: {e}")
            
        return affected
        
    async def _handle_prop_updated(self, context: DeltaContext) -> List[str]:
        """Handle prop updates - recalculate edges"""
        affected = []
        
        if not context.current_data or not context.previous_data:
            return affected
            
        try:
            edge_id = f"edge_{context.prop_id}_{context.provider}"
            
            # Calculate new edge value
            new_edge = await self._calculate_edge(context.current_data, context)
            old_edge = await self._calculate_edge(context.previous_data, context)
            
            if new_edge is not None and old_edge is not None:
                edge_change = abs(new_edge - old_edge)
                
                if edge_change > 0.01:  # Significant change threshold
                    self.logger.debug(
                        f"Edge change for {context.prop_id}: {old_edge:.3f} -> {new_edge:.3f}"
                    )
                    
                    # TODO: Update edge in database
                    affected.append(edge_id)
                    
                    # If edge became significant or lost significance
                    if (abs(old_edge) <= 0.01 < abs(new_edge)) or (abs(new_edge) <= 0.01 < abs(old_edge)):
                        self.logger.info(
                            f"Edge significance changed for {context.prop_id}: "
                            f"{old_edge:.3f} -> {new_edge:.3f}"
                        )
            
        except Exception as e:
            self.logger.error(f"Error updating edge for {context.prop_id}: {e}")
            
        return affected
        
    async def _handle_prop_removed(self, context: DeltaContext) -> List[str]:
        """Handle prop removal - archive edges"""
        affected = []
        
        try:
            edge_id = f"edge_{context.prop_id}_{context.provider}"
            
            self.logger.debug(f"Archiving edge {edge_id}")
            
            # TODO: Archive edge in database
            affected.append(edge_id)
            
        except Exception as e:
            self.logger.error(f"Error archiving edge for {context.prop_id}: {e}")
            
        return affected
        
    async def _calculate_edge(self, prop_data: Dict[str, Any], context: DeltaContext) -> Optional[float]:
        """Calculate edge value for a prop"""
        try:
            # Get market odds
            odds_value = prop_data.get("odds_value")
            if odds_value is None:
                return None
                
            odds_value = float(odds_value)
            
            # Convert American odds to implied probability
            if odds_value > 0:
                implied_prob = 100 / (odds_value + 100)
            else:
                implied_prob = abs(odds_value) / (abs(odds_value) + 100)
                
            # TODO: Get true probability from valuation service
            # For now, use mock calculation
            true_prob = await self._get_estimated_probability(prop_data, context)
            
            if true_prob is None:
                return None
                
            # Calculate edge (expected value)
            if odds_value > 0:
                edge = (true_prob * odds_value / 100) - (1 - true_prob)
            else:
                edge = true_prob - ((1 - true_prob) * abs(odds_value) / 100)
                
            return edge
            
        except Exception as e:
            self.logger.error(f"Error calculating edge: {e}")
            return None
            
    async def _get_estimated_probability(self, prop_data: Dict[str, Any], context: DeltaContext) -> Optional[float]:
        """Get estimated true probability from valuation service"""
        
        # Mock probability estimation
        # In production, this would call the valuation service
        
        try:
            line_value = float(prop_data.get("line_value", 0))
            player_name = prop_data.get("player_name", "")
            market_type = prop_data.get("market_type", "")
            
            # Simple mock model based on prop characteristics
            base_prob = 0.5
            
            # Adjust based on line value (higher lines typically harder to hit)
            if market_type in ["points", "rebounds", "assists"]:
                if line_value > 20:
                    base_prob *= 0.9
                elif line_value > 10:
                    base_prob *= 0.95
                    
            # Add some player-specific variance
            player_hash = hash(player_name) % 21 - 10  # -10 to +10
            adjustment = player_hash / 100.0  # -0.1 to +0.1
            
            estimated_prob = base_prob + adjustment
            
            # Clamp to valid probability range
            estimated_prob = max(0.05, min(0.95, estimated_prob))
            
            return estimated_prob
            
        except Exception as e:
            self.logger.error(f"Error estimating probability: {e}")
            return None