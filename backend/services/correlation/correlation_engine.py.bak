"""
Correlation Engine - Computes pairwise correlations and clustering for props

This service handles:
1. Computing pairwise Pearson correlations between props
2. Building correlation matrices
3. Identifying clusters of highly correlated props
4. Persisting correlation statistics for caching

The correlation analysis helps identify relationships between different player props
to improve parlay EV calculations and risk management.
"""

import hashlib
import logging
import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass

import numpy as np
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models.correlation_ticketing import PropCorrelationStat, CorrelationCluster
from backend.services.correlation.historical_data_provider import historical_data_provider
from backend.services.unified_config import get_correlation_config
from backend.services.unified_logging import get_logger


logger = get_logger(__name__)


@dataclass
class CorrelationRecord:
    """Represents a pairwise correlation result"""
    prop_id_a: int
    prop_id_b: int
    pearson_r: float
    sample_size: int
    
    def __post_init__(self):
        # Ensure prop_id_a <= prop_id_b for consistent ordering
        if self.prop_id_a > self.prop_id_b:
            self.prop_id_a, self.prop_id_b = self.prop_id_b, self.prop_id_a


@dataclass
class CorrelationClusterResult:
    """Represents a cluster of correlated props"""
    cluster_id: str
    member_prop_ids: List[int]
    average_internal_r: float


class CorrelationEngine:
    """
    Computes and manages prop correlations for parlay analysis.
    
    This engine computes Pearson correlations between prop historical outcomes,
    builds correlation matrices, and identifies clusters of highly correlated
    props for risk management.
    """

    def __init__(self):
        self.config = get_correlation_config()
        self._cache = {}  # Simple in-memory cache for computed correlations

    def compute_pairwise_correlations(
        self,
        prop_ids: List[int],
        context: Optional[Dict] = None
    ) -> List[CorrelationRecord]:
        """
        Compute pairwise correlations for a list of props.
        
        Args:
            prop_ids: List of prop IDs to compute correlations for
            context: Optional context for correlation (e.g., game_id)
            
        Returns:
            List of CorrelationRecord objects
            
        TODO: Add support for game-specific context alignment
        """
        if len(prop_ids) < 2:
            logger.warning(
                "Need at least 2 props for correlation computation",
                extra={"prop_ids_count": len(prop_ids), "action": "compute_pairwise_correlations"}
            )
            return []

        context_hash = self._compute_context_hash(context or {})
        
        # Get aligned historical data
        valid_prop_ids, aligned_data = historical_data_provider.get_aligned_history(
            prop_ids, self.config.min_samples
        )

        if len(valid_prop_ids) < 2:
            logger.warning(
                "Insufficient valid props for correlation computation",
                extra={
                    "requested_props": len(prop_ids),
                    "valid_props": len(valid_prop_ids),
                    "action": "compute_pairwise_correlations"
                }
            )
            return []

        correlations = []
        session = SessionLocal()
        
        try:
            # Compute all pairwise correlations
            for i in range(len(valid_prop_ids)):
                for j in range(i + 1, len(valid_prop_ids)):
                    prop_id_a, prop_id_b = valid_prop_ids[i], valid_prop_ids[j]
                    data_a, data_b = aligned_data[i], aligned_data[j]
                    
                    # Compute Pearson correlation
                    correlation_result = self._compute_pearson_correlation(
                        data_a, data_b, prop_id_a, prop_id_b
                    )
                    
                    if correlation_result:
                        correlations.append(correlation_result)
                        
                        # Persist to database for caching
                        self._persist_correlation_stat(
                            session, correlation_result, context_hash
                        )

            session.commit()
            
            logger.info(
                "Computed pairwise correlations",
                extra={
                    "prop_ids_count": len(valid_prop_ids),
                    "correlations_computed": len(correlations),
                    "context_hash": context_hash,
                    "action": "compute_pairwise_correlations"
                }
            )

        except Exception as e:
            session.rollback()
            logger.error(
                "Failed to compute pairwise correlations",
                extra={
                    "error": str(e),
                    "prop_ids_count": len(prop_ids),
                    "action": "compute_pairwise_correlations"
                }
            )
        finally:
            session.close()

        return correlations

    def _compute_pearson_correlation(
        self,
        data_a: List[float],
        data_b: List[float],
        prop_id_a: int,
        prop_id_b: int
    ) -> Optional[CorrelationRecord]:
        """
        Compute Pearson correlation coefficient between two data series.
        
        Args:
            data_a: First data series
            data_b: Second data series
            prop_id_a: First prop ID
            prop_id_b: Second prop ID
            
        Returns:
            CorrelationRecord or None if computation fails
        """
        if len(data_a) != len(data_b) or len(data_a) < 2:
            return None

        try:
            # Convert to numpy arrays for computation
            arr_a = np.array(data_a, dtype=float)
            arr_b = np.array(data_b, dtype=float)
            
            # Check for sufficient variance
            if np.var(arr_a) == 0 or np.var(arr_b) == 0:
                # Zero variance - correlation undefined, treat as 0
                pearson_r = 0.0
            else:
                # Compute Pearson correlation
                correlation_matrix = np.corrcoef(arr_a, arr_b)
                pearson_r = correlation_matrix[0, 1]
                
                # Handle NaN cases
                if np.isnan(pearson_r) or np.isinf(pearson_r):
                    pearson_r = 0.0

            return CorrelationRecord(
                prop_id_a=prop_id_a,
                prop_id_b=prop_id_b,
                pearson_r=float(pearson_r),
                sample_size=len(data_a)
            )

        except Exception as e:
            logger.warning(
                "Failed to compute correlation",
                extra={
                    "prop_id_a": prop_id_a,
                    "prop_id_b": prop_id_b,
                    "error": str(e),
                    "action": "compute_pearson_correlation"
                }
            )
            return None

    def build_correlation_matrix(
        self,
        prop_ids: List[int],
        context: Optional[Dict] = None
    ) -> Dict[int, Dict[int, float]]:
        """
        Build correlation matrix for a set of props.
        
        Args:
            prop_ids: List of prop IDs
            context: Optional context for correlations
            
        Returns:
            Nested dict representing correlation matrix
            matrix[prop_id_a][prop_id_b] = correlation_coefficient
        """
        # Try to load from cache/database first
        cached_matrix = self._load_cached_correlations(prop_ids, context)
        if cached_matrix:
            return cached_matrix

        # Compute new correlations
        correlations = self.compute_pairwise_correlations(prop_ids, context)
        
        # Build matrix
        matrix = {}
        for prop_id in prop_ids:
            matrix[prop_id] = {}
            # Diagonal is always 1.0
            matrix[prop_id][prop_id] = 1.0

        # Fill in computed correlations (symmetric)
        for corr in correlations:
            if corr.prop_id_a in matrix and corr.prop_id_b in matrix:
                matrix[corr.prop_id_a][corr.prop_id_b] = corr.pearson_r
                matrix[corr.prop_id_b][corr.prop_id_a] = corr.pearson_r

        # Fill missing pairs with 0.0
        for prop_id_a in prop_ids:
            for prop_id_b in prop_ids:
                if prop_id_a != prop_id_b and prop_id_b not in matrix[prop_id_a]:
                    matrix[prop_id_a][prop_id_b] = 0.0

        logger.info(
            "Built correlation matrix",
            extra={
                "prop_ids_count": len(prop_ids),
                "correlations_used": len(correlations),
                "action": "build_correlation_matrix"
            }
        )

        return matrix

    def compute_clusters(
        self,
        prop_ids: List[int],
        threshold: Optional[float] = None,
        context: Optional[Dict] = None
    ) -> List[CorrelationClusterResult]:
        """
        Identify clusters of highly correlated props.
        
        Uses graph-based clustering: props are nodes, edges exist where
        |correlation| >= threshold. Connected components form clusters.
        
        Args:
            prop_ids: List of prop IDs to cluster
            threshold: Correlation threshold (defaults to config)
            context: Optional context for correlations
            
        Returns:
            List of CorrelationClusterResult objects
        """
        if threshold is None:
            threshold = self.config.threshold_cluster

        if len(prop_ids) < 2:
            return []

        # Get correlation matrix
        correlation_matrix = self.build_correlation_matrix(prop_ids, context)
        
        # Build adjacency graph
        adjacency = {}
        for prop_id in prop_ids:
            adjacency[prop_id] = set()

        for prop_id_a in prop_ids:
            for prop_id_b in prop_ids:
                if prop_id_a != prop_id_b:
                    correlation = correlation_matrix.get(prop_id_a, {}).get(prop_id_b, 0.0)
                    if abs(correlation) >= threshold:
                        adjacency[prop_id_a].add(prop_id_b)

        # Find connected components using DFS
        visited = set()
        clusters = []
        
        for prop_id in prop_ids:
            if prop_id not in visited:
                cluster_members = self._dfs_cluster(prop_id, adjacency, visited)
                if len(cluster_members) > 1:  # Only clusters with 2+ members
                    # Compute average internal correlation
                    avg_r = self._compute_average_internal_correlation(
                        cluster_members, correlation_matrix
                    )
                    
                    cluster_result = CorrelationClusterResult(
                        cluster_id=self._generate_cluster_id(cluster_members, context),
                        member_prop_ids=cluster_members,
                        average_internal_r=avg_r
                    )
                    clusters.append(cluster_result)

        # Persist clusters to database
        if clusters:
            self._persist_clusters(clusters, context)

        logger.info(
            "Computed correlation clusters",
            extra={
                "prop_ids_count": len(prop_ids),
                "clusters_found": len(clusters),
                "threshold": threshold,
                "action": "compute_clusters"
            }
        )

        return clusters

    def _dfs_cluster(
        self,
        start_prop: int,
        adjacency: Dict[int, set],
        visited: set
    ) -> List[int]:
        """DFS to find connected component (cluster)"""
        stack = [start_prop]
        cluster = []
        
        while stack:
            prop_id = stack.pop()
            if prop_id not in visited:
                visited.add(prop_id)
                cluster.append(prop_id)
                
                # Add unvisited neighbors to stack
                for neighbor in adjacency.get(prop_id, []):
                    if neighbor not in visited:
                        stack.append(neighbor)

        return sorted(cluster)  # Sort for consistent ordering

    def _compute_average_internal_correlation(
        self,
        cluster_members: List[int],
        correlation_matrix: Dict[int, Dict[int, float]]
    ) -> float:
        """Compute average absolute correlation within cluster"""
        correlations = []
        
        for i, prop_a in enumerate(cluster_members):
            for j in range(i + 1, len(cluster_members)):
                prop_b = cluster_members[j]
                corr = correlation_matrix.get(prop_a, {}).get(prop_b, 0.0)
                correlations.append(abs(corr))

        return float(np.mean(correlations)) if correlations else 0.0

    def _generate_cluster_id(
        self,
        member_prop_ids: List[int],
        context: Optional[Dict] = None
    ) -> str:
        """Generate unique cluster ID"""
        context_hash = self._compute_context_hash(context or {})
        members_str = "_".join(map(str, sorted(member_prop_ids)))
        timestamp_bucket = datetime.now(timezone.utc).strftime("%Y%m%d_%H")
        
        cluster_key = f"{context_hash}_{members_str}_{timestamp_bucket}"
        return hashlib.md5(cluster_key.encode()).hexdigest()[:16]

    def _compute_context_hash(self, context: Dict) -> str:
        """Compute hash for context dictionary"""
        if not context:
            return "global"
        
        # Sort keys for consistent hashing
        context_str = "_".join(f"{k}:{v}" for k, v in sorted(context.items()))
        return hashlib.md5(context_str.encode()).hexdigest()[:12]

    def _persist_correlation_stat(
        self,
        session: Session,
        correlation: CorrelationRecord,
        context_hash: str
    ):
        """Persist correlation statistic to database"""
        try:
            # Check if already exists
            existing = session.query(PropCorrelationStat).filter(
                and_(
                    PropCorrelationStat.prop_id_a == correlation.prop_id_a,
                    PropCorrelationStat.prop_id_b == correlation.prop_id_b,
                    PropCorrelationStat.context_hash == context_hash
                )
            ).first()

            if existing:
                # Update existing record
                existing.pearson_r = correlation.pearson_r
                existing.sample_size = correlation.sample_size
                existing.last_computed_at = datetime.now(timezone.utc)
            else:
                # Create new record
                stat = PropCorrelationStat(
                    prop_id_a=correlation.prop_id_a,
                    prop_id_b=correlation.prop_id_b,
                    pearson_r=correlation.pearson_r,
                    sample_size=correlation.sample_size,
                    context_hash=context_hash
                )
                session.add(stat)

        except Exception as e:
            logger.warning(
                "Failed to persist correlation stat",
                extra={
                    "prop_id_a": correlation.prop_id_a,
                    "prop_id_b": correlation.prop_id_b,
                    "error": str(e),
                    "action": "persist_correlation_stat"
                }
            )

    def _persist_clusters(
        self,
        clusters: List[CorrelationClusterResult],
        context: Optional[Dict] = None
    ):
        """Persist clusters to database"""
        session = SessionLocal()
        
        try:
            for cluster in clusters:
                cluster_record = CorrelationCluster(
                    cluster_key=cluster.cluster_id,
                    member_prop_ids=cluster.member_prop_ids,
                    average_internal_r=cluster.average_internal_r
                )
                session.add(cluster_record)
            
            session.commit()
            
        except Exception as e:
            session.rollback()
            logger.error(
                "Failed to persist clusters",
                extra={
                    "clusters_count": len(clusters),
                    "error": str(e),
                    "action": "persist_clusters"
                }
            )
        finally:
            session.close()

    def _load_cached_correlations(
        self,
        prop_ids: List[int],
        context: Optional[Dict] = None
    ) -> Optional[Dict[int, Dict[int, float]]]:
        """
        Try to load correlations from cache/database.
        
        TODO: Implement cache loading with TTL checking
        """
        # For now, always compute fresh
        # In production, this would check database cache and TTL
        return None

    def get_correlation_matrix_sample_sizes(
        self,
        prop_ids: List[int],
        context: Optional[Dict] = None
    ) -> Dict[str, int]:
        """
        Get sample sizes for correlation pairs.
        
        Returns:
            Dict mapping "prop_id_a:prop_id_b" to sample_size
        """
        correlations = self.compute_pairwise_correlations(prop_ids, context)
        
        sample_size_map = {}
        for corr in correlations:
            pair_key = f"{corr.prop_id_a}:{corr.prop_id_b}"
            sample_size_map[pair_key] = corr.sample_size

        return sample_size_map


# Global instance
correlation_engine = CorrelationEngine()


# Convenience functions
def compute_pairwise_correlations(
    prop_ids: List[int],
    context: Optional[Dict] = None
) -> List[CorrelationRecord]:
    """Convenience function for computing pairwise correlations"""
    return correlation_engine.compute_pairwise_correlations(prop_ids, context)


def build_correlation_matrix(
    prop_ids: List[int],
    context: Optional[Dict] = None
) -> Dict[int, Dict[int, float]]:
    """Convenience function for building correlation matrix"""
    return correlation_engine.build_correlation_matrix(prop_ids, context)


def compute_clusters(
    prop_ids: List[int],
    threshold: Optional[float] = None,
    context: Optional[Dict] = None
) -> List[CorrelationClusterResult]:
    """Convenience function for computing clusters"""
    return correlation_engine.compute_clusters(prop_ids, threshold, context)