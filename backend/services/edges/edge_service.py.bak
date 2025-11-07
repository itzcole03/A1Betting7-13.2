"""
Edge Service - Detection and management of betting edges
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from ..valuation.valuation_engine import ValuationResult, valuation_engine

# Try to import database and websocket dependencies gracefully
try:
    from backend.enhanced_database import get_db_session
    from backend.models.modeling import Edge, EdgeStatus
    DB_AVAILABLE = True
except ImportError:
    logging.warning("Database dependencies not available for EdgeService")
    DB_AVAILABLE = False
    get_db_session = None
    Edge = None
    EdgeStatus = None

logger = logging.getLogger(__name__)


@dataclass
class EdgeThresholds:
    """Configuration thresholds for edge detection"""
    ev_min: float = 0.05
    prob_over_min: float = 0.52
    prob_over_max: float = 0.75
    volatility_max: float = 2.0


class EdgeData(BaseModel):
    """Edge detection result"""
    id: Optional[int]
    prop_id: int
    model_version_id: int
    edge_score: float
    ev: float
    prob_over: float
    offered_line: float
    fair_line: float
    status: str
    created_at: datetime


class EdgeService:
    """Service for detecting and managing betting edges"""
    
    def __init__(self, thresholds: Optional[EdgeThresholds] = None):
        self.thresholds = thresholds or EdgeThresholds()
        self.valuation_engine = valuation_engine
        self._recompute_lock = asyncio.Lock()
    
    async def detect_edge(self, valuation: ValuationResult) -> Optional[EdgeData]:
        """
        Detect if a valuation qualifies as an edge.
        
        Args:
            valuation: Valuation result to evaluate
            
        Returns:
            EdgeData: Edge data if qualifies, None otherwise
        """
        try:
            # Check edge qualification criteria
            if not self._qualifies_as_edge(valuation):
                logger.debug(f"Valuation for prop {valuation.prop_id} does not qualify as edge")
                return None
            
            # Calculate edge score
            edge_score = self._calculate_edge_score(valuation)
            
            # Check for existing active edge with same valuation hash
            existing_edge = await self._get_existing_edge(valuation)
            
            if existing_edge:
                logger.debug(f"Existing edge found for prop {valuation.prop_id}: {existing_edge.id}")
                return existing_edge
            
            # Create new edge
            edge_data = EdgeData(
                id=None,  # Will be set when stored
                prop_id=valuation.prop_id,
                model_version_id=valuation.model_version_id,
                edge_score=edge_score,
                ev=valuation.expected_value,
                prob_over=valuation.prob_over,
                offered_line=valuation.offered_line,
                fair_line=valuation.fair_line,
                status="ACTIVE",
                created_at=datetime.now(timezone.utc)
            )
            
            # Store edge in database
            edge_id = await self._store_edge(valuation, edge_score)
            if edge_id:
                edge_data.id = edge_id
                
                # Emit websocket event
                await self._emit_edge_event(edge_data)
                
                logger.info(f"Detected new edge for prop {valuation.prop_id}: EV={valuation.expected_value:.4f}, score={edge_score:.4f}")
                return edge_data
            else:
                logger.error(f"Failed to store edge for prop {valuation.prop_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error detecting edge for prop {valuation.prop_id}: {e}")
            return None
    
    async def recompute_edges_for_sport(self, sport: str = "NBA") -> Dict[str, int]:
        """
        Recompute edges for all active props in a sport.
        
        Args:
            sport: Sport to recompute edges for
            
        Returns:
            dict: Summary statistics of recomputation
        """
        async with self._recompute_lock:
            logger.info(f"Starting edge recomputation for sport: {sport}")
            
            stats = {
                "evaluated": 0,
                "new_edges": 0,
                "updated_edges": 0,
                "retired_edges": 0,
                "duration_ms": 0
            }
            
            start_time = datetime.now()
            
            try:
                # Get active prop IDs for the sport
                prop_ids = await self._get_active_prop_ids(sport)
                logger.info(f"Found {len(prop_ids)} active props for {sport}")
                
                for prop_id in prop_ids:
                    try:
                        stats["evaluated"] += 1
                        
                        # Run valuation
                        valuation = await self.valuation_engine.valuate(prop_id)
                        if not valuation:
                            logger.warning(f"Valuation failed for prop {prop_id}")
                            continue
                        
                        # Detect edge
                        edge = await self.detect_edge(valuation)
                        if edge:
                            if edge.id is None:
                                # Would be a new edge if successfully stored
                                stats["new_edges"] += 1
                            else:
                                stats["updated_edges"] += 1
                        
                        # Small delay to avoid overwhelming the system
                        await asyncio.sleep(0.1)
                        
                    except Exception as e:
                        logger.error(f"Error processing prop {prop_id}: {e}")
                        continue
                
                # Calculate duration
                end_time = datetime.now()
                stats["duration_ms"] = int((end_time - start_time).total_seconds() * 1000)
                
                logger.info(f"Edge recomputation completed for {sport}: {stats}")
                return stats
                
            except Exception as e:
                logger.error(f"Error in edge recomputation for {sport}: {e}")
                stats["duration_ms"] = int((datetime.now() - start_time).total_seconds() * 1000)
                return stats
    
    async def retire_edges_for_prop(self, prop_id: int) -> int:
        """
        Retire all active edges for a prop (when line changes).
        
        Args:
            prop_id: Prop to retire edges for
            
        Returns:
            int: Number of edges retired
        """
        if not DB_AVAILABLE:
            logger.warning("Database not available, cannot retire edges")
            return 0
        
        try:
            async with get_db_session() as session:
                # Update all active edges for the prop to retired
                result = await session.execute(
                    """
                    UPDATE edges 
                    SET status = :retired_status, retired_at = :retired_at
                    WHERE prop_id = :prop_id AND status = :active_status
                    """,
                    {
                        "retired_status": EdgeStatus.RETIRED,
                        "active_status": EdgeStatus.ACTIVE,
                        "prop_id": prop_id,
                        "retired_at": datetime.now(timezone.utc)
                    }
                )
                
                await session.commit()
                retired_count = result.rowcount
                
                logger.info(f"Retired {retired_count} edges for prop {prop_id}")
                return retired_count
                
        except Exception as e:
            logger.error(f"Error retiring edges for prop {prop_id}: {e}")
            return 0
    
    async def get_active_edges(
        self,
        sport: Optional[str] = None,
        prop_type: Optional[str] = None,
        min_ev: Optional[float] = None,
        limit: int = 100
    ) -> List[EdgeData]:
        """
        Get active edges with optional filters.
        
        Args:
            sport: Sport filter (TODO: implement)
            prop_type: Prop type filter (TODO: implement)
            min_ev: Minimum expected value filter
            limit: Maximum number of results
            
        Returns:
            List[EdgeData]: Active edges
        """
        if not DB_AVAILABLE:
            logger.warning("Database not available, returning empty edge list")
            return []
        
        try:
            async with get_db_session() as session:
                # Build query with filters
                where_conditions = ["status = :active_status"]
                params = {"active_status": EdgeStatus.ACTIVE}
                
                if min_ev is not None:
                    where_conditions.append("ev >= :min_ev")
                    params["min_ev"] = min_ev
                
                # TODO: Add sport and prop_type filters when prop table available
                
                where_clause = " AND ".join(where_conditions)
                
                query = f"""
                    SELECT id, prop_id, model_version_id, edge_score, ev, 
                           prob_over, offered_line, fair_line, status, created_at
                    FROM edges 
                    WHERE {where_clause}
                    ORDER BY edge_score DESC 
                    LIMIT :limit
                """
                
                params["limit"] = limit
                result = await session.execute(query, params)
                
                edges = []
                for row in result:
                    edge = EdgeData(
                        id=row[0],
                        prop_id=row[1],
                        model_version_id=row[2],
                        edge_score=row[3],
                        ev=row[4],
                        prob_over=row[5],
                        offered_line=row[6],
                        fair_line=row[7],
                        status=row[8],
                        created_at=row[9]
                    )
                    edges.append(edge)
                
                logger.info(f"Retrieved {len(edges)} active edges")
                return edges
                
        except Exception as e:
            logger.error(f"Error getting active edges: {e}")
            return []
    
    async def get_edge_by_id(self, edge_id: int) -> Optional[EdgeData]:
        """
        Get a specific edge by ID.
        
        Args:
            edge_id: Edge identifier
            
        Returns:
            EdgeData: Edge data or None if not found
        """
        if not DB_AVAILABLE:
            logger.warning("Database not available, cannot get edge")
            return None
        
        try:
            async with get_db_session() as session:
                result = await session.execute(
                    """
                    SELECT id, prop_id, model_version_id, edge_score, ev, 
                           prob_over, offered_line, fair_line, status, created_at
                    FROM edges 
                    WHERE id = :edge_id
                    """,
                    {"edge_id": edge_id}
                )
                
                row = result.fetchone()
                if not row:
                    return None
                
                return EdgeData(
                    id=row[0],
                    prop_id=row[1],
                    model_version_id=row[2],
                    edge_score=row[3],
                    ev=row[4],
                    prob_over=row[5],
                    offered_line=row[6],
                    fair_line=row[7],
                    status=row[8],
                    created_at=row[9]
                )
                
        except Exception as e:
            logger.error(f"Error getting edge {edge_id}: {e}")
            return None
    
    def _qualifies_as_edge(self, valuation: ValuationResult) -> bool:
        """
        Check if a valuation qualifies as an edge based on thresholds.
        
        Args:
            valuation: Valuation to check
            
        Returns:
            bool: True if qualifies as edge
        """
        # Check expected value threshold
        if valuation.expected_value < self.thresholds.ev_min:
            return False
        
        # Check probability range (avoid extremes)
        if (valuation.prob_over < self.thresholds.prob_over_min or 
            valuation.prob_over > self.thresholds.prob_over_max):
            return False
        
        # Check volatility threshold
        if valuation.volatility_score > self.thresholds.volatility_max:
            return False
        
        return True
    
    def _calculate_edge_score(self, valuation: ValuationResult) -> float:
        """
        Calculate edge score combining EV and volatility.
        
        Args:
            valuation: Valuation result
            
        Returns:
            float: Edge score
        """
        # Edge score = EV * (1 / (1 + volatility))
        # This rewards high EV and penalizes high volatility
        return valuation.expected_value * (1.0 / (1.0 + valuation.volatility_score))
    
    async def _get_existing_edge(self, valuation: ValuationResult) -> Optional[EdgeData]:
        """
        Check for existing active edge with the same valuation hash.
        
        Args:
            valuation: Valuation to check
            
        Returns:
            EdgeData: Existing edge or None
        """
        if not DB_AVAILABLE:
            return None
        
        try:
            async with get_db_session() as session:
                # Find edge with same valuation
                result = await session.execute(
                    """
                    SELECT e.id, e.prop_id, e.model_version_id, e.edge_score, e.ev,
                           e.prob_over, e.offered_line, e.fair_line, e.status, e.created_at
                    FROM edges e
                    JOIN valuations v ON e.valuation_id = v.id
                    WHERE v.valuation_hash = :valuation_hash 
                    AND e.status = :active_status
                    ORDER BY e.created_at DESC
                    LIMIT 1
                    """,
                    {
                        "valuation_hash": valuation.valuation_hash,
                        "active_status": EdgeStatus.ACTIVE
                    }
                )
                
                row = result.fetchone()
                if not row:
                    return None
                
                return EdgeData(
                    id=row[0],
                    prop_id=row[1],
                    model_version_id=row[2],
                    edge_score=row[3],
                    ev=row[4],
                    prob_over=row[5],
                    offered_line=row[6],
                    fair_line=row[7],
                    status=row[8],
                    created_at=row[9]
                )
                
        except Exception as e:
            logger.error(f"Error checking for existing edge: {e}")
            return None
    
    async def _store_edge(self, valuation: ValuationResult, edge_score: float) -> Optional[int]:
        """
        Store edge in database.
        
        Args:
            valuation: Valuation result
            edge_score: Calculated edge score
            
        Returns:
            int: Edge ID or None if failed
        """
        if not DB_AVAILABLE or not valuation.valuation_id:
            logger.warning("Database not available or no valuation_id, cannot store edge")
            return None
        
        try:
            async with get_db_session() as session:
                edge = Edge(
                    valuation_id=valuation.valuation_id,
                    prop_id=valuation.prop_id,
                    model_version_id=valuation.model_version_id,
                    edge_score=edge_score,
                    ev=valuation.expected_value,
                    prob_over=valuation.prob_over,
                    offered_line=valuation.offered_line,
                    fair_line=valuation.fair_line,
                    status=EdgeStatus.ACTIVE,
                    correlation_cluster_id=None  # TODO: Implement correlation analysis
                )
                
                session.add(edge)
                await session.flush()
                edge_id = edge.id
                await session.commit()
                
                logger.debug(f"Stored new edge: {edge_id}")
                return edge_id
                
        except Exception as e:
            logger.error(f"Failed to store edge: {e}")
            return None
    
    async def _get_active_prop_ids(self, sport: str) -> List[int]:
        """
        Get active prop IDs for a sport.
        
        TODO: Integrate with real prop data source
        
        Args:
            sport: Sport to get props for
            
        Returns:
            List[int]: Active prop IDs
        """
        # Placeholder implementation
        logger.warning(f"TODO: Get real active prop IDs for sport {sport}")
        
        # Mock data for development
        return [1, 2, 3, 4, 5]  # Mock prop IDs
    
    async def _emit_edge_event(self, edge: EdgeData):
        """
        Emit websocket event for new edge.
        
        TODO: Integrate with websocket system
        
        Args:
            edge: Edge data to emit
        """
        # Placeholder implementation
        event_data = {
            "type": "edge_update",
            "edge": {
                "id": edge.id,
                "prop_id": edge.prop_id,
                "player_id": None,  # TODO: Get from prop data
                "prop_type": None,  # TODO: Get from prop data
                "offered_line": edge.offered_line,
                "fair_line": edge.fair_line,
                "ev": edge.ev,
                "prob_over": edge.prob_over,
                "edge_score": edge.edge_score,
                "created_at": edge.created_at.isoformat()
            }
        }
        
        logger.info(f"TODO: Emit websocket event for edge {edge.id}: {event_data}")


# Global edge service instance
edge_service = EdgeService()