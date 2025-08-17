"""
Edge Trigger - Integration with ingestion pipeline for automatic edge detection
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from ..services.edges.edge_service import edge_service
from ..services.valuation.valuation_engine import valuation_engine

logger = logging.getLogger(__name__)


class EdgeTrigger:
    """
    Integration component that triggers edge detection when props or lines change.
    This integrates with the NBA ingestion pipeline to automatically detect edges.
    """
    
    def __init__(self):
        self.edge_service = edge_service
        self.valuation_engine = valuation_engine
        self._processing_props: Set[int] = set()
        self._processing_lock = asyncio.Lock()
        
    async def on_prop_line_change(self, prop_id: int, old_line: Optional[float] = None, new_line: Optional[float] = None) -> Dict[str, Any]:
        """
        Triggered when a prop line changes. Retires old edges and detects new ones.
        
        Args:
            prop_id: Prop that changed
            old_line: Previous line value
            new_line: New line value
            
        Returns:
            dict: Processing result
        """
        async with self._processing_lock:
            if prop_id in self._processing_props:
                logger.info(f"Prop {prop_id} already being processed, skipping")
                return {"status": "skipped", "reason": "already_processing"}
            
            self._processing_props.add(prop_id)
        
        try:
            logger.info(f"Processing line change for prop {prop_id}: {old_line} -> {new_line}")
            
            result = {
                "prop_id": prop_id,
                "old_line": old_line,
                "new_line": new_line,
                "edges_retired": 0,
                "new_edge_detected": False,
                "processing_time_ms": 0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            start_time = datetime.now()
            
            # Step 1: Retire old edges for this prop
            if old_line is not None:
                retired_count = await self.edge_service.retire_edges_for_prop(prop_id)
                result["edges_retired"] = retired_count
                logger.info(f"Retired {retired_count} edges for prop {prop_id}")
            
            # Step 2: Run fresh valuation with new line
            valuation = await self.valuation_engine.valuate(prop_id, force_recompute=True)
            
            if not valuation:
                logger.warning(f"Could not compute valuation for prop {prop_id}")
                result["error"] = "valuation_failed"
                return result
            
            # Step 3: Check for new edge
            edge = await self.edge_service.detect_edge(valuation)
            
            if edge:
                result["new_edge_detected"] = True
                result["edge_id"] = edge.id
                result["edge_score"] = edge.edge_score
                result["expected_value"] = edge.ev
                logger.info(f"New edge detected for prop {prop_id}: EV={edge.ev:.4f}, score={edge.edge_score:.4f}")
            else:
                logger.debug(f"No edge detected for prop {prop_id}")
            
            # Calculate processing time
            end_time = datetime.now()
            result["processing_time_ms"] = int((end_time - start_time).total_seconds() * 1000)
            
            logger.info(f"Line change processing completed for prop {prop_id}: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing line change for prop {prop_id}: {e}")
            return {
                "prop_id": prop_id,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        finally:
            async with self._processing_lock:
                self._processing_props.discard(prop_id)
    
    async def on_new_props_available(self, prop_ids: List[int], source: str = "unknown") -> Dict[str, Any]:
        """
        Triggered when new props become available. Runs valuation and edge detection.
        
        Args:
            prop_ids: List of new prop IDs
            source: Source of the props (e.g., "prizepicks", "fanduel")
            
        Returns:
            dict: Processing result summary
        """
        logger.info(f"Processing {len(prop_ids)} new props from source: {source}")
        
        result = {
            "source": source,
            "total_props": len(prop_ids),
            "processed": 0,
            "edges_detected": 0,
            "errors": 0,
            "processing_time_ms": 0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "prop_results": []
        }
        
        start_time = datetime.now()
        
        # Process props in batches to avoid overwhelming the system
        batch_size = 10
        for i in range(0, len(prop_ids), batch_size):
            batch = prop_ids[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self._process_new_prop(prop_id, source) for prop_id in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Aggregate results
            for prop_id, batch_result in zip(batch, batch_results):
                result["processed"] += 1
                
                if isinstance(batch_result, Exception):
                    result["errors"] += 1
                    result["prop_results"].append({
                        "prop_id": prop_id,
                        "status": "error",
                        "error": str(batch_result)
                    })
                    logger.error(f"Error processing new prop {prop_id}: {batch_result}")
                else:
                    if batch_result.get("edge_detected"):
                        result["edges_detected"] += 1
                    result["prop_results"].append(batch_result)
            
            # Small delay between batches
            await asyncio.sleep(0.5)
        
        # Calculate total processing time
        end_time = datetime.now()
        result["processing_time_ms"] = int((end_time - start_time).total_seconds() * 1000)
        
        logger.info(f"New props processing completed: {result['processed']} processed, {result['edges_detected']} edges, {result['errors']} errors")
        return result
    
    async def on_player_news(self, player_id: int, news_type: str, impact: str = "medium") -> Dict[str, Any]:
        """
        Triggered when player news affects prop values. Recomputes edges for player props.
        
        Args:
            player_id: Player affected by news
            news_type: Type of news (injury, trade, etc.)
            impact: Expected impact level (low, medium, high)
            
        Returns:
            dict: Processing result
        """
        logger.info(f"Processing player news: player={player_id}, type={news_type}, impact={impact}")
        
        result = {
            "player_id": player_id,
            "news_type": news_type,
            "impact": impact,
            "affected_props": 0,
            "edges_retired": 0,
            "edges_detected": 0,
            "processing_time_ms": 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        start_time = datetime.now()
        
        try:
            # TODO: Get prop IDs for the player from real data source
            player_prop_ids = await self._get_player_prop_ids(player_id)
            result["affected_props"] = len(player_prop_ids)
            
            if not player_prop_ids:
                logger.info(f"No active props found for player {player_id}")
                return result
            
            # Process each prop
            for prop_id in player_prop_ids:
                try:
                    # Retire existing edges (news invalidates previous analysis)
                    retired_count = await self.edge_service.retire_edges_for_prop(prop_id)
                    result["edges_retired"] += retired_count
                    
                    # Recompute valuation and detect new edges
                    valuation = await self.valuation_engine.valuate(prop_id, force_recompute=True)
                    
                    if valuation:
                        edge = await self.edge_service.detect_edge(valuation)
                        if edge:
                            result["edges_detected"] += 1
                            logger.info(f"New edge detected for player {player_id} prop {prop_id} after news")
                    
                except Exception as e:
                    logger.error(f"Error processing prop {prop_id} for player {player_id}: {e}")
                    continue
            
            # Calculate processing time
            end_time = datetime.now()
            result["processing_time_ms"] = int((end_time - start_time).total_seconds() * 1000)
            
            logger.info(f"Player news processing completed: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing player news for player {player_id}: {e}")
            result["error"] = str(e)
            return result
    
    async def _process_new_prop(self, prop_id: int, source: str) -> Dict[str, Any]:
        """
        Process a single new prop for edge detection.
        
        Args:
            prop_id: Prop to process
            source: Source of the prop
            
        Returns:
            dict: Processing result
        """
        try:
            logger.debug(f"Processing new prop {prop_id} from {source}")
            
            # Run valuation
            valuation = await self.valuation_engine.valuate(prop_id)
            
            if not valuation:
                return {
                    "prop_id": prop_id,
                    "status": "failed",
                    "error": "valuation_failed",
                    "edge_detected": False
                }
            
            # Check for edge
            edge = await self.edge_service.detect_edge(valuation)
            
            result = {
                "prop_id": prop_id,
                "status": "success",
                "edge_detected": edge is not None,
                "valuation": {
                    "expected_value": valuation.expected_value,
                    "prob_over": valuation.prob_over,
                    "fair_line": valuation.fair_line,
                    "offered_line": valuation.offered_line
                }
            }
            
            if edge:
                result["edge"] = {
                    "edge_id": edge.id,
                    "edge_score": edge.edge_score,
                    "ev": edge.ev
                }
                logger.debug(f"Edge detected for new prop {prop_id}: EV={edge.ev:.4f}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing new prop {prop_id}: {e}")
            return {
                "prop_id": prop_id,
                "status": "error",
                "error": str(e),
                "edge_detected": False
            }
    
    async def _get_player_prop_ids(self, player_id: int) -> List[int]:
        """
        Get active prop IDs for a specific player.
        
        TODO: Integrate with real prop data source
        
        Args:
            player_id: Player to get props for
            
        Returns:
            List[int]: Prop IDs for the player
        """
        # Placeholder implementation
        logger.warning(f"TODO: Get real prop IDs for player {player_id}")
        
        # Mock data for development
        return [1, 2, 3] if player_id % 2 == 0 else [4, 5]  # Mock prop IDs


# Global edge trigger instance
edge_trigger = EdgeTrigger()


# Integration functions for the NBA ingestion pipeline
async def trigger_line_change(prop_id: int, old_line: float, new_line: float) -> Dict[str, Any]:
    """
    Convenience function for NBA ingestion pipeline to trigger line change processing.
    
    Args:
        prop_id: Prop that changed
        old_line: Previous line value
        new_line: New line value
        
    Returns:
        dict: Processing result
    """
    return await edge_trigger.on_prop_line_change(prop_id, old_line, new_line)


async def trigger_new_props(prop_ids: List[int], source: str = "nba_ingestion") -> Dict[str, Any]:
    """
    Convenience function for NBA ingestion pipeline to trigger new props processing.
    
    Args:
        prop_ids: New prop IDs to process
        source: Source identifier
        
    Returns:
        dict: Processing result
    """
    return await edge_trigger.on_new_props_available(prop_ids, source)


async def trigger_player_news(player_id: int, news_type: str, impact: str = "medium") -> Dict[str, Any]:
    """
    Convenience function for NBA ingestion pipeline to trigger player news processing.
    
    Args:
        player_id: Affected player
        news_type: Type of news
        impact: Impact level
        
    Returns:
        dict: Processing result
    """
    return await edge_trigger.on_player_news(player_id, news_type, impact)