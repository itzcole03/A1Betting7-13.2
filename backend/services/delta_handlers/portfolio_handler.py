"""
Portfolio Refresh Handler

Handles market data changes and triggers portfolio optimization
when edges and valuations are updated.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set

from .base_handler import BaseDeltaHandler, DeltaContext, ProcessingResult
from backend.services.unified_logging import get_logger


class PortfolioRefreshHandler(BaseDeltaHandler):
    """Handles portfolio optimization refresh when edges change"""
    
    def __init__(self):
        super().__init__(
            name="portfolio_refresh",
            dependencies=["valuation_delta", "edge_delta"]  # Depends on valuations and edges
        )
        
        # Rate limiting for portfolio optimization (expensive operation)
        self.last_optimization = None
        self.min_optimization_interval = timedelta(seconds=30)  # At most every 30 seconds
        self.pending_refresh = False
        
        # Batch processing
        self.affected_props: Set[str] = set()
        self.batch_timer_task = None
        self.batch_delay = 5  # seconds to wait for batching
        
    async def can_process(self, context: DeltaContext) -> bool:
        """Check if we should process this delta for portfolio refresh"""
        
        # Only process events that affect portfolio composition
        relevant_events = {
            "PROP_ADDED",
            "PROP_UPDATED", 
            "PROP_REMOVED"
        }
        
        if context.event_type not in relevant_events:
            return False
            
        # Always interested in portfolio-affecting events
        return True
        
    async def process_delta(self, context: DeltaContext) -> ProcessingResult:
        """Process portfolio refresh for the delta"""
        
        affected_entities = []
        errors = []
        dependencies_triggered = []
        
        try:
            # Add to batch of affected props
            self.affected_props.add(context.prop_id)
            
            # Check rate limiting
            now = datetime.utcnow()
            if (self.last_optimization and 
                now - self.last_optimization < self.min_optimization_interval):
                
                self.logger.debug(
                    f"Portfolio optimization rate limited, batching {context.prop_id}"
                )
                
                # Schedule batched optimization if not already scheduled
                if not self.batch_timer_task:
                    self.batch_timer_task = asyncio.create_task(
                        self._schedule_batched_optimization()
                    )
                
                return ProcessingResult(
                    success=True,
                    handler_name=self.name,
                    processing_time_ms=0,
                    affected_entities=[f"batched_optimization_pending"],
                    errors=[],
                    dependencies_triggered=[],
                    context=context
                )
            
            # Execute immediate optimization
            affected_entities.extend(await self._execute_portfolio_optimization(context))
            
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
            errors.append(f"Portfolio refresh error: {str(e)}")
            self.logger.error(f"Error in portfolio refresh: {e}")
            
            return ProcessingResult(
                success=False,
                handler_name=self.name,
                processing_time_ms=0,
                affected_entities=affected_entities,
                errors=errors,
                dependencies_triggered=[],
                context=context
            )
            
    async def _execute_portfolio_optimization(self, context: DeltaContext) -> List[str]:
        """Execute portfolio optimization"""
        affected = []
        
        try:
            self.logger.info(
                f"Starting portfolio optimization for {len(self.affected_props)} affected props"
            )
            
            # Get current edges and valuations
            optimization_data = await self._gather_optimization_data()
            
            if not optimization_data:
                self.logger.warning("No optimization data available")
                return affected
                
            # Run portfolio optimization
            optimization_result = await self._run_portfolio_optimization(optimization_data)
            
            if optimization_result:
                # TODO: Store optimization result in database
                optimization_id = f"opt_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
                
                affected.append(optimization_id)
                
                self.logger.info(
                    f"Portfolio optimization complete: {optimization_id}, "
                    f"selected {len(optimization_result.get('selected_props', []))} props"
                )
                
                # Update timing
                self.last_optimization = datetime.utcnow()
                self.affected_props.clear()
                
            return affected
            
        except Exception as e:
            self.logger.error(f"Error in portfolio optimization: {e}")
            return affected
            
    async def _schedule_batched_optimization(self):
        """Schedule batched optimization after delay"""
        try:
            await asyncio.sleep(self.batch_delay)
            
            if self.affected_props:
                self.logger.info(
                    f"Executing batched portfolio optimization for {len(self.affected_props)} props"
                )
                
                # Create synthetic context for batch optimization
                batch_context = DeltaContext(
                    event_id=f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                    provider="batch",
                    prop_id="batch",
                    event_type="BATCH_OPTIMIZATION",
                    timestamp=datetime.utcnow(),
                    metadata={"affected_props": list(self.affected_props)}
                )
                
                await self._execute_portfolio_optimization(batch_context)
                
        except Exception as e:
            self.logger.error(f"Error in batched optimization: {e}")
            
        finally:
            self.batch_timer_task = None
            
    async def _gather_optimization_data(self) -> Optional[Dict[str, Any]]:
        """Gather current edges and valuations for optimization"""
        
        # Mock data gathering - in production would query database
        try:
            optimization_data = {
                "edges": [],
                "valuations": [],
                "constraints": {
                    "max_props": 10,
                    "max_exposure": 1000.0,
                    "min_edge": 0.02,
                    "max_correlation": 0.5
                },
                "timestamp": datetime.utcnow()
            }
            
            # Simulate gathering edge data
            for prop_id in self.affected_props:
                # Mock edge data
                edge_data = {
                    "prop_id": prop_id,
                    "edge_value": 0.05 + (hash(prop_id) % 10) / 100,  # Mock edge
                    "confidence": 0.8,
                    "market_type": "points",
                    "player_name": f"Player_{hash(prop_id) % 100}",
                    "odds_value": -110 + (hash(prop_id) % 40) - 20
                }
                
                optimization_data["edges"].append(edge_data)
                
            # Only return data if we have edges to optimize
            if optimization_data["edges"]:
                return optimization_data
                
            return None
            
        except Exception as e:
            self.logger.error(f"Error gathering optimization data: {e}")
            return None
            
    async def _run_portfolio_optimization(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Run portfolio optimization algorithm"""
        
        try:
            edges = data["edges"]
            constraints = data["constraints"]
            
            # Simple greedy optimization for demonstration
            # In production, would use sophisticated optimization algorithms
            
            # Sort by edge value
            sorted_edges = sorted(edges, key=lambda x: x["edge_value"], reverse=True)
            
            selected_props = []
            total_exposure = 0.0
            max_exposure = constraints["max_exposure"]
            max_props = constraints["max_props"]
            min_edge = constraints["min_edge"]
            
            for edge in sorted_edges:
                if len(selected_props) >= max_props:
                    break
                    
                if edge["edge_value"] < min_edge:
                    break
                    
                # Mock position size calculation
                edge_value = edge["edge_value"]
                position_size = min(100.0, max_exposure * 0.1 * edge_value)
                
                if total_exposure + position_size <= max_exposure:
                    selected_props.append({
                        "prop_id": edge["prop_id"],
                        "edge_value": edge_value,
                        "position_size": position_size,
                        "expected_return": position_size * edge_value
                    })
                    
                    total_exposure += position_size
                    
            optimization_result = {
                "selected_props": selected_props,
                "total_exposure": total_exposure,
                "expected_return": sum(prop["expected_return"] for prop in selected_props),
                "optimization_timestamp": datetime.utcnow(),
                "algorithm": "greedy_edge_sort"
            }
            
            return optimization_result
            
        except Exception as e:
            self.logger.error(f"Error in portfolio optimization: {e}")
            return None
            
    def get_status(self) -> Dict[str, Any]:
        """Get portfolio handler status with additional info"""
        base_status = super().get_status()
        
        base_status.update({
            "last_optimization": self.last_optimization.isoformat() if self.last_optimization else None,
            "pending_refresh": self.pending_refresh,
            "affected_props_count": len(self.affected_props),
            "batch_timer_active": self.batch_timer_task is not None,
            "rate_limit_seconds": self.min_optimization_interval.total_seconds()
        })
        
        return base_status