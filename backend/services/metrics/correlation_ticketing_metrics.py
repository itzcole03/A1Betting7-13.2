"""
Correlation and Ticketing Metrics Extension
Provides specialized metrics collection for correlation analysis and ticketing operations
using the existing unified_metrics_collector infrastructure.
"""

import time
from typing import Dict, Any, Optional
from collections import deque
import statistics
import threading

try:
    from backend.services.metrics.unified_metrics_collector import get_metrics_collector
    from backend.services.unified_logging import get_logger
    
    logger = get_logger("correlation_ticketing_metrics")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    get_metrics_collector = None


class CorrelationTicketingMetrics:
    """
    Specialized metrics collector for correlation analysis and ticketing operations.
    
    Uses the existing unified_metrics_collector for base functionality while providing
    domain-specific metrics aggregation and reporting capabilities.
    """
    
    _instance: Optional["CorrelationTicketingMetrics"] = None
    _lock = threading.Lock()
    
    def __init__(self):
        """Initialize correlation and ticketing metrics collector."""
        self._data_lock = threading.Lock()
        self._metrics_collector = get_metrics_collector() if get_metrics_collector else None
        
        # Correlation-specific metrics
        self._correlation_computation_latencies: deque = deque(maxlen=500)
        self._clustering_computation_latencies: deque = deque(maxlen=200)
        
        # Ticketing-specific metrics  
        self._ticket_operation_latencies: deque = deque(maxlen=1000)
        self._parlay_ev_simulation_latencies: deque = deque(maxlen=500)
        
        # Counters
        self._correlation_matrix_computations = 0
        self._correlation_cache_hits = 0
        self._correlation_cache_misses = 0
        self._clustering_runs = 0
        self._ticket_creations = 0
        self._ticket_submissions = 0
        self._ticket_cancellations = 0
        self._parlay_ev_simulations = 0
        self._historical_data_generations = 0
        
        self._last_prune_time = time.time()
    
    @classmethod
    def get_instance(cls) -> "CorrelationTicketingMetrics":
        """Get singleton instance with thread-safe initialization."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    def record_correlation_matrix_computation(self, latency_ms: float, prop_count: int, from_cache: bool = False) -> None:
        """
        Record correlation matrix computation.
        
        Args:
            latency_ms: Time taken to compute the matrix
            prop_count: Number of props in the matrix
            from_cache: Whether served from cache
        """
        timestamp = time.time()
        
        with self._data_lock:
            self._correlation_matrix_computations += 1
            self._correlation_computation_latencies.append((timestamp, latency_ms, prop_count))
            
            if from_cache:
                self._correlation_cache_hits += 1
            else:
                self._correlation_cache_misses += 1
        
        # Record in unified metrics collector
        # Note: Using logger for now since existing unified_metrics_collector doesn't have record_custom method
        logger.info("Correlation matrix computation metrics", extra={
            "category": "metrics",
            "action": "correlation_matrix_computation",
            "latency_ms": latency_ms,
            "prop_count": prop_count,
            "from_cache": from_cache,
            "cache_hits_total": self._correlation_cache_hits,
            "cache_misses_total": self._correlation_cache_misses,
            "computations_total": self._correlation_matrix_computations
        })
        
        logger.debug("Correlation matrix computation recorded", extra={
            "latency_ms": latency_ms,
            "prop_count": prop_count,
            "from_cache": from_cache,
            "category": "metrics",
            "action": "correlation_matrix"
        })
    
    def record_correlation_clustering(self, latency_ms: float, cluster_count: int, prop_count: int) -> None:
        """
        Record correlation clustering analysis.
        
        Args:
            latency_ms: Time taken for clustering
            cluster_count: Number of clusters identified
            prop_count: Number of props analyzed
        """
        timestamp = time.time()
        
        with self._data_lock:
            self._clustering_runs += 1
            self._clustering_computation_latencies.append((timestamp, latency_ms, cluster_count, prop_count))
        
        # Record metrics via structured logging
        logger.info("Correlation clustering metrics", extra={
            "category": "metrics", 
            "action": "correlation_clustering",
            "latency_ms": latency_ms,
            "cluster_count": cluster_count,
            "prop_count": prop_count,
            "clustering_runs_total": self._clustering_runs
        })
        
        logger.debug("Correlation clustering recorded", extra={
            "latency_ms": latency_ms,
            "cluster_count": cluster_count,
            "prop_count": prop_count,
            "category": "metrics",
            "action": "correlation_clustering"
        })
    
    def record_ticket_operation(self, operation: str, latency_ms: float, success: bool = True, 
                              ticket_id: Optional[int] = None, leg_count: Optional[int] = None) -> None:
        """
        Record ticket lifecycle operation.
        
        Args:
            operation: Operation type ('create', 'submit', 'cancel', 'get', 'recalc')
            latency_ms: Operation latency
            success: Operation success status
            ticket_id: Optional ticket ID
            leg_count: Optional number of legs in ticket
        """
        timestamp = time.time()
        
        with self._data_lock:
            self._ticket_operation_latencies.append((timestamp, operation, latency_ms, success, leg_count or 0))
            
            if operation == 'create':
                self._ticket_creations += 1
            elif operation == 'submit':
                self._ticket_submissions += 1
            elif operation == 'cancel':
                self._ticket_cancellations += 1
        
        # Record metrics via structured logging
        logger.info("Ticket operation metrics", extra={
            "category": "metrics",
            "action": "ticket_operation", 
            "operation": operation,
            "latency_ms": latency_ms,
            "success": success,
            "ticket_id": ticket_id,
            "leg_count": leg_count,
            "ticket_creations": self._ticket_creations,
            "ticket_submissions": self._ticket_submissions,
            "ticket_cancellations": self._ticket_cancellations
        })
        
        logger.debug("Ticket operation recorded", extra={
            "operation": operation,
            "latency_ms": latency_ms,
            "success": success,
            "ticket_id": ticket_id,
            "leg_count": leg_count,
            "category": "metrics",
            "action": "ticket_operation"
        })
    
    def record_parlay_ev_simulation(self, latency_ms: float, simulation_type: str, leg_count: int,
                                  independent_ev: Optional[float] = None, 
                                  correlation_adjusted_ev: Optional[float] = None) -> None:
        """
        Record parlay EV simulation.
        
        Args:
            latency_ms: Simulation time
            simulation_type: Type ('independent', 'correlation_adjusted', 'both')
            leg_count: Number of legs in parlay
            independent_ev: Independent EV result
            correlation_adjusted_ev: Correlation-adjusted EV result
        """
        timestamp = time.time()
        
        with self._data_lock:
            self._parlay_ev_simulations += 1
            self._parlay_ev_simulation_latencies.append((timestamp, simulation_type, latency_ms, leg_count))
        
        # Record metrics via structured logging  
        logger.info("Parlay EV simulation metrics", extra={
            "category": "metrics",
            "action": "parlay_ev_simulation",
            "simulation_type": simulation_type,
            "latency_ms": latency_ms,
            "leg_count": leg_count,
            "independent_ev": independent_ev,
            "correlation_adjusted_ev": correlation_adjusted_ev,
            "parlay_ev_simulations_total": self._parlay_ev_simulations
        })
        
        logger.debug("Parlay EV simulation recorded", extra={
            "simulation_type": simulation_type,
            "latency_ms": latency_ms,
            "leg_count": leg_count,
            "independent_ev": independent_ev,
            "correlation_adjusted_ev": correlation_adjusted_ev,
            "category": "metrics",
            "action": "parlay_ev_simulation"
        })
    
    def record_historical_data_generation(self, prop_count: int, outcomes_generated: int, 
                                        generation_time_ms: float) -> None:
        """
        Record historical data generation.
        
        Args:
            prop_count: Number of props
            outcomes_generated: Total outcomes generated
            generation_time_ms: Time taken for generation
        """
        with self._data_lock:
            self._historical_data_generations += 1
        
        # Record metrics via structured logging
        logger.info("Historical data generation metrics", extra={
            "category": "metrics",
            "action": "historical_data_generation",
            "prop_count": prop_count,
            "outcomes_generated": outcomes_generated,
            "generation_time_ms": generation_time_ms,
            "historical_data_generations_total": self._historical_data_generations
        })
        
        logger.debug("Historical data generation recorded", extra={
            "prop_count": prop_count,
            "outcomes_generated": outcomes_generated,
            "generation_time_ms": generation_time_ms,
            "category": "metrics",
            "action": "historical_data_generation"
        })
    
    def prune_old_samples(self, window_ms: int = 300000) -> None:  # 5 minutes default
        """Remove samples older than the specified window."""
        current_time = time.time()
        cutoff_time = current_time - (window_ms / 1000)
        
        with self._data_lock:
            # Prune correlation samples
            while (self._correlation_computation_latencies and 
                   self._correlation_computation_latencies[0][0] < cutoff_time):
                self._correlation_computation_latencies.popleft()
            
            # Prune clustering samples
            while (self._clustering_computation_latencies and 
                   self._clustering_computation_latencies[0][0] < cutoff_time):
                self._clustering_computation_latencies.popleft()
            
            # Prune ticket operation samples
            while (self._ticket_operation_latencies and 
                   self._ticket_operation_latencies[0][0] < cutoff_time):
                self._ticket_operation_latencies.popleft()
            
            # Prune parlay EV simulation samples
            while (self._parlay_ev_simulation_latencies and 
                   self._parlay_ev_simulation_latencies[0][0] < cutoff_time):
                self._parlay_ev_simulation_latencies.popleft()
        
        self._last_prune_time = current_time
    
    def get_correlation_metrics(self) -> Dict[str, Any]:
        """Get correlation-specific metrics summary."""
        current_time = time.time()
        
        # Prune old samples if needed
        if current_time - self._last_prune_time > 30:
            self.prune_old_samples()
        
        with self._data_lock:
            # Correlation computation metrics
            correlation_latencies = [sample[1] for sample in self._correlation_computation_latencies]
            correlation_prop_counts = [sample[2] for sample in self._correlation_computation_latencies]
            
            # Clustering metrics
            clustering_latencies = [sample[1] for sample in self._clustering_computation_latencies]
            cluster_counts = [sample[2] for sample in self._clustering_computation_latencies if len(sample) > 2]
            
            # Cache metrics
            total_correlation_requests = self._correlation_cache_hits + self._correlation_cache_misses
            cache_hit_rate = (self._correlation_cache_hits / max(1, total_correlation_requests))
            
            return {
                "correlation_matrix": {
                    "total_computations": self._correlation_matrix_computations,
                    "avg_latency_ms": statistics.mean(correlation_latencies) if correlation_latencies else 0.0,
                    "avg_prop_count": statistics.mean(correlation_prop_counts) if correlation_prop_counts else 0.0,
                    "cache_hit_rate": round(cache_hit_rate, 4),
                    "cache_hits": self._correlation_cache_hits,
                    "cache_misses": self._correlation_cache_misses
                },
                "clustering": {
                    "total_runs": self._clustering_runs,
                    "avg_latency_ms": statistics.mean(clustering_latencies) if clustering_latencies else 0.0,
                    "avg_clusters_identified": statistics.mean(cluster_counts) if cluster_counts else 0.0
                },
                "historical_data": {
                    "total_generations": self._historical_data_generations
                }
            }
    
    def get_ticketing_metrics(self) -> Dict[str, Any]:
        """Get ticketing-specific metrics summary."""
        current_time = time.time()
        
        # Prune old samples if needed  
        if current_time - self._last_prune_time > 30:
            self.prune_old_samples()
        
        with self._data_lock:
            # Ticket operation metrics
            ticket_latencies = [sample[2] for sample in self._ticket_operation_latencies]
            ticket_success_count = len([s for s in self._ticket_operation_latencies if s[3]])
            ticket_success_rate = ticket_success_count / max(1, len(self._ticket_operation_latencies))
            
            # Parlay EV simulation metrics
            parlay_latencies = [sample[2] for sample in self._parlay_ev_simulation_latencies]
            parlay_leg_counts = [sample[3] for sample in self._parlay_ev_simulation_latencies]
            
            return {
                "ticket_operations": {
                    "total_creations": self._ticket_creations,
                    "total_submissions": self._ticket_submissions,
                    "total_cancellations": self._ticket_cancellations,
                    "avg_operation_latency_ms": statistics.mean(ticket_latencies) if ticket_latencies else 0.0,
                    "success_rate": round(ticket_success_rate, 4)
                },
                "parlay_ev_simulations": {
                    "total_simulations": self._parlay_ev_simulations,
                    "avg_simulation_latency_ms": statistics.mean(parlay_latencies) if parlay_latencies else 0.0,
                    "avg_leg_count": statistics.mean(parlay_leg_counts) if parlay_leg_counts else 0.0
                }
            }
    
    def get_comprehensive_snapshot(self) -> Dict[str, Any]:
        """Get comprehensive snapshot of all correlation and ticketing metrics."""
        return {
            "correlation": self.get_correlation_metrics(),
            "ticketing": self.get_ticketing_metrics(),
            "timestamp": time.time()
        }


# Global singleton instance
_correlation_ticketing_metrics = None


def get_correlation_ticketing_metrics() -> CorrelationTicketingMetrics:
    """Get the global correlation and ticketing metrics instance."""
    global _correlation_ticketing_metrics
    if _correlation_ticketing_metrics is None:
        _correlation_ticketing_metrics = CorrelationTicketingMetrics.get_instance()
    return _correlation_ticketing_metrics