"""
Valuation Delta Handler

Handles market data changes and updates valuation calculations
for affected props and related entities.
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

from .base_handler import BaseDeltaHandler, DeltaContext, ProcessingResult
from backend.services.unified_logging import get_logger


class ValuationDeltaHandler(BaseDeltaHandler):
    """Handles valuation updates when market data changes"""
    
    def __init__(self):
        super().__init__(
            name="valuation_delta",
            dependencies=[]  # No dependencies for valuation handler
        )
        
    async def can_process(self, context: DeltaContext) -> bool:
        """Check if we should process this delta for valuations"""
        
        # Process all market data events for valuations
        relevant_events = {
            "PROP_ADDED",
            "PROP_UPDATED", 
            "PROP_REMOVED"
        }
        
        if context.event_type not in relevant_events:
            return False
            
        # Skip if no meaningful data changes for valuations
        if context.event_type == "PROP_UPDATED":
            if not context.current_data or not context.previous_data:
                return False
                
            # Check if valuation-relevant fields changed
            valuation_fields = {
                "line_value", "odds_value", "status", 
                "player_name", "market_type", "prop_category"
            }
            
            has_relevant_changes = False
            for field in valuation_fields:
                if context.current_data.get(field) != context.previous_data.get(field):
                    has_relevant_changes = True
                    break
                    
            if not has_relevant_changes:
                self.logger.debug(f"No valuation-relevant changes in {context.prop_id}")
                return False
                
        return True
        
    async def process_delta(self, context: DeltaContext) -> ProcessingResult:
        """Process valuation updates for the delta"""
        
        affected_entities = []
        errors = []
        dependencies_triggered = []
        
        try:
            if context.event_type == "PROP_ADDED":
                affected_entities.extend(await self._handle_prop_added(context))
                dependencies_triggered.append("edge_delta")  # Trigger edge calculations
                
            elif context.event_type == "PROP_UPDATED":
                affected_entities.extend(await self._handle_prop_updated(context))
                dependencies_triggered.append("edge_delta")  # Trigger edge recalculation
                
            elif context.event_type == "PROP_REMOVED":
                affected_entities.extend(await self._handle_prop_removed(context))
                dependencies_triggered.append("edge_delta")  # Clean up edges
                
            self.logger.info(
                f"Valuation processing complete for {context.prop_id}, "
                f"affected {len(affected_entities)} entities"
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
            errors.append(f"Valuation processing error: {str(e)}")
            self.logger.error(f"Error in valuation processing: {e}")
            
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
        """Handle new prop addition - create initial valuations"""
        affected = []
        
        if not context.current_data:
            return affected
            
        prop_data = context.current_data
        
        try:
            # TODO: Integrate with actual valuation service
            # For now, simulate valuation calculation
            
            # Create base valuation
            valuation_id = f"val_{context.prop_id}_{context.provider}"
            
            self.logger.debug(
                f"Creating valuation {valuation_id} for new prop {context.prop_id}"
            )
            
            # Simulate valuation calculation based on prop data
            calculated_value = self._calculate_mock_valuation(prop_data)
            
            # TODO: Store in database
            # valuation = Valuation(
            #     prop_id=context.prop_id,
            #     provider=context.provider, 
            #     calculated_value=calculated_value,
            #     calculation_timestamp=datetime.utcnow(),
            #     confidence=0.75,
            #     metadata={
            #         "line_value": prop_data.get("line_value"),
            #         "market_type": prop_data.get("market_type"),
            #         "player_name": prop_data.get("player_name")
            #     }
            # )
            
            affected.append(valuation_id)
            
            # Check for related player/market valuations to update
            related_valuations = await self._find_related_valuations(prop_data)
            affected.extend(related_valuations)
            
        except Exception as e:
            self.logger.error(f"Error creating valuation for {context.prop_id}: {e}")
            
        return affected
        
    async def _handle_prop_updated(self, context: DeltaContext) -> List[str]:
        """Handle prop updates - recalculate affected valuations"""
        affected = []
        
        if not context.current_data or not context.previous_data:
            return affected
            
        try:
            # Recalculate primary valuation
            valuation_id = f"val_{context.prop_id}_{context.provider}"
            
            old_value = self._calculate_mock_valuation(context.previous_data)
            new_value = self._calculate_mock_valuation(context.current_data)
            
            if abs(new_value - old_value) > 0.01:  # Significant change threshold
                self.logger.debug(
                    f"Updating valuation {valuation_id}: {old_value:.3f} -> {new_value:.3f}"
                )
                
                # TODO: Update database
                affected.append(valuation_id)
                
                # Check for cascade updates to related valuations
                related_valuations = await self._find_related_valuations(context.current_data)
                affected.extend(related_valuations)
            
        except Exception as e:
            self.logger.error(f"Error updating valuation for {context.prop_id}: {e}")
            
        return affected
        
    async def _handle_prop_removed(self, context: DeltaContext) -> List[str]:
        """Handle prop removal - archive or remove valuations"""
        affected = []
        
        try:
            valuation_id = f"val_{context.prop_id}_{context.provider}"
            
            self.logger.debug(f"Archiving valuation {valuation_id}")
            
            # TODO: Archive valuation in database instead of deleting
            # This preserves historical data for analysis
            
            affected.append(valuation_id)
            
        except Exception as e:
            self.logger.error(f"Error archiving valuation for {context.prop_id}: {e}")
            
        return affected
        
    def _calculate_mock_valuation(self, prop_data: Dict[str, Any]) -> float:
        """Mock valuation calculation for testing"""
        # Simple mock calculation based on line and odds
        line_value = float(prop_data.get("line_value", 0))
        odds_value = float(prop_data.get("odds_value", 100))
        
        # Convert American odds to implied probability
        if odds_value > 0:
            implied_prob = 100 / (odds_value + 100)
        else:
            implied_prob = abs(odds_value) / (abs(odds_value) + 100)
            
        # Mock EV calculation
        mock_true_prob = implied_prob * (1 + (hash(prop_data.get("player_name", "")) % 20 - 10) / 100)
        mock_true_prob = max(0.01, min(0.99, mock_true_prob))  # Clamp to valid range
        
        # Expected value calculation
        if odds_value > 0:
            ev = (mock_true_prob * odds_value) - ((1 - mock_true_prob) * 100)
        else:
            ev = (mock_true_prob * 100) - ((1 - mock_true_prob) * abs(odds_value))
            
        return ev / 100.0  # Normalize to decimal
        
    async def _find_related_valuations(self, prop_data: Dict[str, Any]) -> List[str]:
        """Find related valuations that might be affected"""
        related = []
        
        # Mock related valuation logic
        player_name = prop_data.get("player_name")
        market_type = prop_data.get("market_type") 
        
        if player_name:
            # Same player, different markets might be correlated
            related.append(f"player_correlation_{player_name}")
            
        if market_type:
            # Same market type trends
            related.append(f"market_trend_{market_type}")
            
        return related