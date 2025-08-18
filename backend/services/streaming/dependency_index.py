"""
Sport-Aware Dependency Index

Manages prop dependencies with sport isolation to prevent cross-sport
contamination while enabling efficient dependency lookups and updates.
"""

from __future__ import annotations
from collections import defaultdict
from typing import Dict, Set, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime

from backend.services.streaming.event_models import (
    create_dependency_event, 
    StreamingEventTypes
)
from backend.services.events.event_bus import global_event_bus
from backend.services.unified_logging import get_logger
from backend.config.sport_settings import get_default_sport


@dataclass
class DependencyEdge:
    """Represents a dependency relationship between props"""
    source_prop_id: str
    target_prop_id: str
    sport: str
    strength: float  # Correlation strength [0, 1]
    created_at: datetime
    updated_at: datetime
    dependency_type: str = "correlation"  # correlation, player, team, game
    
    def get_key(self) -> str:
        """Generate unique key for this dependency"""
        return f"{self.sport}:{self.source_prop_id}:{self.target_prop_id}"


class DependencyIndex:
    """
    Sport-aware dependency index for efficient prop relationship management.
    
    Maintains separate dependency graphs per sport to prevent cross-contamination
    while providing fast lookups for streaming delta propagation.
    """
    
    def __init__(self):
        self.logger = get_logger("dependency_index")
        
        # Sport-isolated dependency mappings: sport -> prop_id -> set of dependent prop_ids
        self._forward_deps: Dict[str, Dict[str, Set[str]]] = defaultdict(lambda: defaultdict(set))
        self._reverse_deps: Dict[str, Dict[str, Set[str]]] = defaultdict(lambda: defaultdict(set))
        
        # Detailed edge information: (sport, source, target) -> DependencyEdge
        self._edges: Dict[Tuple[str, str, str], DependencyEdge] = {}
        
        # Sport-specific statistics
        self._stats: Dict[str, Dict[str, Union[int, str, None]]] = defaultdict(lambda: {
            "total_props": 0,
            "total_edges": 0,
            "max_in_degree": 0,
            "max_out_degree": 0,
            "last_update": None
        })
    
    def add_dependency(
        self, 
        source_prop_id: str, 
        target_prop_id: str, 
        sport: str,
        strength: float,
        dependency_type: str = "correlation"
    ) -> bool:
        """
        Add dependency relationship between props in specific sport
        
        Args:
            source_prop_id: Source prop ID
            target_prop_id: Target prop ID  
            sport: Sport context
            strength: Dependency strength [0, 1]
            dependency_type: Type of dependency
            
        Returns:
            True if dependency was added/updated
        """
        sport = sport or get_default_sport()
        
        if source_prop_id == target_prop_id:
            self.logger.warning(f"Attempted to add self-dependency for prop {source_prop_id}")
            return False
            
        if strength < 0 or strength > 1:
            self.logger.warning(f"Invalid dependency strength {strength}, must be [0, 1]")
            return False
        
        now = datetime.utcnow()
        edge_key = (sport, source_prop_id, target_prop_id)
        
        # Check if edge already exists
        existing_edge = self._edges.get(edge_key)
        was_updated = existing_edge is not None
        
        # Create or update edge
        edge = DependencyEdge(
            source_prop_id=source_prop_id,
            target_prop_id=target_prop_id,
            sport=sport,
            strength=strength,
            created_at=existing_edge.created_at if existing_edge else now,
            updated_at=now,
            dependency_type=dependency_type
        )
        
        # Update indexes
        self._forward_deps[sport][source_prop_id].add(target_prop_id)
        self._reverse_deps[sport][target_prop_id].add(source_prop_id)
        self._edges[edge_key] = edge
        
        # Update statistics
        self._update_sport_stats(sport)
        
        # Emit event for dependency change
        event_type = StreamingEventTypes.DEPENDENCY_UPDATED if was_updated else StreamingEventTypes.DEPENDENCY_CREATED
        event = create_dependency_event(
            event_type=event_type,
            sport=sport,
            prop_id=source_prop_id,
            dependent_prop_ids=[target_prop_id],
            correlation_strength=strength
        )
        global_event_bus.publish(f"DEPENDENCY_{event_type}", event)
        
        self.logger.debug(
            f"{'Updated' if was_updated else 'Added'} dependency: {source_prop_id} -> {target_prop_id} "
            f"({sport}) strength={strength:.3f}"
        )
        
        return True
    
    def remove_dependency(self, source_prop_id: str, target_prop_id: str, sport: str) -> bool:
        """
        Remove dependency relationship between props in specific sport
        
        Args:
            source_prop_id: Source prop ID
            target_prop_id: Target prop ID
            sport: Sport context
            
        Returns:
            True if dependency was removed
        """
        sport = sport or get_default_sport()
        edge_key = (sport, source_prop_id, target_prop_id)
        
        if edge_key not in self._edges:
            return False
            
        # Remove from indexes
        self._forward_deps[sport][source_prop_id].discard(target_prop_id)
        self._reverse_deps[sport][target_prop_id].discard(source_prop_id)
        
        # Clean up empty sets
        if not self._forward_deps[sport][source_prop_id]:
            del self._forward_deps[sport][source_prop_id]
        if not self._reverse_deps[sport][target_prop_id]:
            del self._reverse_deps[sport][target_prop_id]
            
        # Remove edge
        del self._edges[edge_key]
        
        # Update statistics
        self._update_sport_stats(sport)
        
        # Emit event
        event = create_dependency_event(
            event_type=StreamingEventTypes.DEPENDENCY_REMOVED,
            sport=sport,
            prop_id=source_prop_id,
            dependent_prop_ids=[target_prop_id]
        )
        global_event_bus.publish("DEPENDENCY_REMOVED", event)
        
        self.logger.debug(f"Removed dependency: {source_prop_id} -> {target_prop_id} ({sport})")
        return True
    
    def get_dependents(self, prop_id: str, sport: str) -> Set[str]:
        """
        Get all props that depend on the given prop in specific sport
        
        Args:
            prop_id: Prop ID to find dependents for
            sport: Sport context
            
        Returns:
            Set of dependent prop IDs
        """
        sport = sport or get_default_sport()
        return self._forward_deps[sport].get(prop_id, set()).copy()
    
    def get_dependencies(self, prop_id: str, sport: str) -> Set[str]:
        """
        Get all props that the given prop depends on in specific sport
        
        Args:
            prop_id: Prop ID to find dependencies for
            sport: Sport context
            
        Returns:
            Set of dependency prop IDs
        """
        sport = sport or get_default_sport()
        return self._reverse_deps[sport].get(prop_id, set()).copy()
    
    def get_dependency_edge(self, source_prop_id: str, target_prop_id: str, sport: str) -> Optional[DependencyEdge]:
        """
        Get detailed edge information for specific dependency
        
        Args:
            source_prop_id: Source prop ID
            target_prop_id: Target prop ID
            sport: Sport context
            
        Returns:
            DependencyEdge if exists, None otherwise
        """
        sport = sport or get_default_sport()
        edge_key = (sport, source_prop_id, target_prop_id)
        return self._edges.get(edge_key)
    
    def get_all_edges_for_sport(self, sport: str) -> List[DependencyEdge]:
        """
        Get all dependency edges for specific sport
        
        Args:
            sport: Sport to get edges for
            
        Returns:
            List of DependencyEdge objects
        """
        sport = sport or get_default_sport()
        return [edge for edge in self._edges.values() if edge.sport == sport]
    
    def has_dependency(self, source_prop_id: str, target_prop_id: str, sport: str) -> bool:
        """
        Check if dependency exists between props in specific sport
        
        Args:
            source_prop_id: Source prop ID
            target_prop_id: Target prop ID
            sport: Sport context
            
        Returns:
            True if dependency exists
        """
        sport = sport or get_default_sport()
        return target_prop_id in self._forward_deps[sport].get(source_prop_id, set())
    
    def remove_prop_dependencies(self, prop_id: str, sport: str) -> int:
        """
        Remove all dependencies involving a specific prop in specific sport
        
        Args:
            prop_id: Prop ID to remove dependencies for
            sport: Sport context
            
        Returns:
            Number of dependencies removed
        """
        sport = sport or get_default_sport()
        removed_count = 0
        
        # Remove outgoing dependencies (where prop is source)
        dependents = self._forward_deps[sport].get(prop_id, set()).copy()
        for target_prop_id in dependents:
            if self.remove_dependency(prop_id, target_prop_id, sport):
                removed_count += 1
        
        # Remove incoming dependencies (where prop is target)
        dependencies = self._reverse_deps[sport].get(prop_id, set()).copy()
        for source_prop_id in dependencies:
            if self.remove_dependency(source_prop_id, prop_id, sport):
                removed_count += 1
        
        self.logger.info(f"Removed {removed_count} dependencies for prop {prop_id} ({sport})")
        return removed_count
    
    def get_transitive_dependents(self, prop_id: str, sport: str, max_depth: int = 3) -> Set[str]:
        """
        Get transitively dependent props (props that depend on props that depend on this prop)
        
        Args:
            prop_id: Starting prop ID
            sport: Sport context  
            max_depth: Maximum traversal depth
            
        Returns:
            Set of transitively dependent prop IDs
        """
        sport = sport or get_default_sport()
        visited = set()
        queue = [(prop_id, 0)]
        transitive_deps = set()
        
        while queue:
            current_prop, depth = queue.pop(0)
            
            if current_prop in visited or depth >= max_depth:
                continue
                
            visited.add(current_prop)
            
            # Get direct dependents
            dependents = self.get_dependents(current_prop, sport)
            
            for dependent in dependents:
                if dependent != prop_id:  # Avoid cycles back to original
                    transitive_deps.add(dependent)
                    if depth + 1 < max_depth:
                        queue.append((dependent, depth + 1))
        
        return transitive_deps
    
    def get_correlation_clusters(self, sport: str, min_strength: float = 0.3) -> List[Set[str]]:
        """
        Find correlation clusters within sport using dependency edges
        
        Args:
            sport: Sport to analyze
            min_strength: Minimum correlation strength to consider
            
        Returns:
            List of prop ID sets representing correlation clusters
        """
        sport = sport or get_default_sport()
        
        # Build adjacency list for strong correlations
        strong_correlations = defaultdict(set)
        
        for edge in self.get_all_edges_for_sport(sport):
            if edge.strength >= min_strength:
                strong_correlations[edge.source_prop_id].add(edge.target_prop_id)
                strong_correlations[edge.target_prop_id].add(edge.source_prop_id)  # Bidirectional
        
        # Find connected components (clusters)
        visited = set()
        clusters = []
        
        for prop_id in strong_correlations:
            if prop_id not in visited:
                cluster = self._dfs_cluster(prop_id, strong_correlations, visited)
                if len(cluster) > 1:  # Only include multi-prop clusters
                    clusters.append(cluster)
        
        return clusters
    
    def _dfs_cluster(self, prop_id: str, correlations: Dict[str, Set[str]], visited: Set[str]) -> Set[str]:
        """Depth-first search to find correlation cluster"""
        cluster = set()
        stack = [prop_id]
        
        while stack:
            current = stack.pop()
            if current in visited:
                continue
                
            visited.add(current)
            cluster.add(current)
            
            # Add unvisited neighbors
            for neighbor in correlations.get(current, set()):
                if neighbor not in visited:
                    stack.append(neighbor)
        
        return cluster
    
    def _update_sport_stats(self, sport: str) -> None:
        """Update statistics for specific sport"""
        stats = self._stats[sport]
        
        # Count props and edges for this sport
        forward_props = set(self._forward_deps[sport].keys())
        reverse_props = set(self._reverse_deps[sport].keys())
        all_props = forward_props.union(reverse_props)
        
        stats["total_props"] = len(all_props)
        stats["total_edges"] = len([e for e in self._edges.values() if e.sport == sport])
        
        # Calculate max in/out degrees
        if self._forward_deps[sport]:
            stats["max_out_degree"] = max(len(deps) for deps in self._forward_deps[sport].values())
        else:
            stats["max_out_degree"] = 0
            
        if self._reverse_deps[sport]:
            stats["max_in_degree"] = max(len(deps) for deps in self._reverse_deps[sport].values())
        else:
            stats["max_in_degree"] = 0
            
        stats["last_update"] = datetime.utcnow().isoformat()
    
    def get_sport_stats(self, sport: str) -> Dict[str, Any]:
        """Get statistics for specific sport"""
        sport = sport or get_default_sport()
        return dict(self._stats[sport])
    
    def get_all_sports(self) -> Set[str]:
        """Get all sports with dependencies"""
        sports = set()
        for edge in self._edges.values():
            sports.add(edge.sport)
        return sports
    
    def clear_sport(self, sport: str) -> int:
        """Clear all dependencies for specific sport"""
        sport = sport or get_default_sport()
        
        # Count edges to remove
        edges_to_remove = [key for key, edge in self._edges.items() if edge.sport == sport]
        removed_count = len(edges_to_remove)
        
        # Remove edges
        for edge_key in edges_to_remove:
            del self._edges[edge_key]
            
        # Clear sport mappings
        if sport in self._forward_deps:
            del self._forward_deps[sport]
        if sport in self._reverse_deps:
            del self._reverse_deps[sport]
        if sport in self._stats:
            del self._stats[sport]
        
        self.logger.info(f"Cleared {removed_count} dependencies for sport {sport}")
        return removed_count
    
    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive dependency index status"""
        return {
            "total_sports": len(self.get_all_sports()),
            "total_edges": len(self._edges),
            "sports": list(self.get_all_sports()),
            "sport_stats": {sport: self.get_sport_stats(sport) for sport in self.get_all_sports()}
        }


# Global dependency index instance  
dependency_index = DependencyIndex()


# Convenience functions
def add_dependency(source_prop_id: str, target_prop_id: str, sport: str, strength: float, dependency_type: str = "correlation") -> bool:
    """Add dependency using global index"""
    return dependency_index.add_dependency(source_prop_id, target_prop_id, sport, strength, dependency_type)


def get_dependents(prop_id: str, sport: str) -> Set[str]:
    """Get dependents using global index"""
    return dependency_index.get_dependents(prop_id, sport)


def get_dependencies(prop_id: str, sport: str) -> Set[str]:
    """Get dependencies using global index"""
    return dependency_index.get_dependencies(prop_id, sport)


def has_dependency(source_prop_id: str, target_prop_id: str, sport: str) -> bool:
    """Check dependency using global index"""
    return dependency_index.has_dependency(source_prop_id, target_prop_id, sport)


def remove_prop_dependencies(prop_id: str, sport: str) -> int:
    """Remove prop dependencies using global index"""
    return dependency_index.remove_prop_dependencies(prop_id, sport)


# Export all public interfaces
__all__ = [
    'DependencyEdge',
    'DependencyIndex',
    'dependency_index',
    'add_dependency',
    'get_dependents', 
    'get_dependencies',
    'has_dependency',
    'remove_prop_dependencies'
]