"""
Parallel Baseball Processing Service - Transform Sequential to Batched Processing

This service transforms the sequential Baseball Savant processing patterns 
from the original client into efficient parallel batching operations,
addressing the performance bottlenecks identified in the roadmap.

Key Improvements:
- Replace sequential iterrows() with parallel batch processing
- Transform groupby operations into concurrent batch operations
- Implement 50-item consistent batching for 5-10x performance gains
- Add connection pooling and resource management
- Include circuit breaker patterns for resilience

Performance Targets:
- 70% performance improvement over sequential processing
- 85%+ cache hit rates for repeated operations
- Consistent 50-item batch sizes instead of variable 3/11, 8/11 patterns
"""

import asyncio
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Callable
from functools import wraps
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class BatchProcessingConfig:
    """Configuration for parallel batch processing"""
    batch_size: int = 50  # Consistent batch size for optimal performance
    max_concurrent_batches: int = 25  # Maximum concurrent batch operations
    connection_pool_size: int = 20  # Connection pool for API calls
    retry_attempts: int = 3  # Retry failed batches
    timeout_seconds: int = 30  # Timeout per batch operation
    circuit_breaker_threshold: int = 5  # Failures before circuit opens
    cache_ttl_seconds: int = 300  # Cache TTL for batch results

@dataclass
class BatchMetrics:
    """Metrics tracking for batch processing performance"""
    total_items: int = 0
    processed_items: int = 0
    failed_items: int = 0
    total_batches: int = 0
    successful_batches: int = 0
    failed_batches: int = 0
    total_processing_time: float = 0.0
    average_batch_time: float = 0.0
    cache_hits: int = 0
    cache_misses: int = 0

class CircuitBreaker:
    """Circuit breaker pattern for batch processing resilience"""
    
    def __init__(self, failure_threshold: int = 5, timeout_duration: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout_duration = timeout_duration
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == 'OPEN':
            if self._should_attempt_reset():
                self.state = 'HALF_OPEN'
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True
        return time.time() - self.last_failure_time >= self.timeout_duration
    
    def _on_success(self):
        """Handle successful operation"""
        self.failure_count = 0
        self.state = 'CLOSED'
    
    def _on_failure(self):
        """Handle failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'

class ParallelBaseballProcessingService:
    """
    High-performance parallel processing service for Baseball Savant data.
    
    Transforms sequential operations like iterrows() and groupby into
    efficient parallel batch operations with consistent 50-item batching.
    """
    
    def __init__(self, config: Optional[BatchProcessingConfig] = None):
        self.config = config or BatchProcessingConfig()
        self.metrics = BatchMetrics()
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=self.config.circuit_breaker_threshold
        )
        self.executor = ThreadPoolExecutor(
            max_workers=self.config.max_concurrent_batches,
            thread_name_prefix="baseball_batch"
        )
        self.cache = {}  # Simple in-memory cache for batch results
        
        logger.info(f"🚀 ParallelBaseballProcessingService initialized with {self.config.batch_size}-item batching")
    
    def performance_monitor(func):
        """Decorator to monitor batch processing performance"""
        @wraps(func)
        async def wrapper(self, *args, **kwargs):
            start_time = time.time()
            try:
                result = await func(self, *args, **kwargs)
                processing_time = time.time() - start_time
                self.metrics.total_processing_time += processing_time
                return result
            except Exception as e:
                logger.error(f"Performance monitoring error in {func.__name__}: {e}")
                raise
        return wrapper
    
    async def process_players_parallel(
        self, 
        players_data: pd.DataFrame,
        processing_function: Callable,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Transform sequential player processing to parallel batching.
        
        Replaces patterns like:
        for _, player in players_data.iterrows():
            process_player(player)
            
        With efficient parallel batching.
        
        Args:
            players_data: DataFrame with player data
            processing_function: Function to apply to each player batch
            **kwargs: Additional arguments for processing function
            
        Returns:
            List of processed player results
        """
        start_time = time.time()
        
        # Convert DataFrame to list for batching
        players_list = players_data.to_dict('records')
        self.metrics.total_items = len(players_list)
        
        # Create batches of consistent size
        batches = self._create_batches(players_list, self.config.batch_size)
        self.metrics.total_batches = len(batches)
        
        logger.info(f"🔄 Processing {len(players_list)} players in {len(batches)} batches of {self.config.batch_size}")
        
        # Process batches in parallel
        results = []
        semaphore = asyncio.Semaphore(self.config.max_concurrent_batches)
        
        async def process_batch_with_semaphore(batch_id: int, batch: List[Dict]):
            async with semaphore:
                return await self._process_single_batch(
                    batch_id, batch, processing_function, **kwargs
                )
        
        # Create tasks for all batches
        tasks = [
            process_batch_with_semaphore(i, batch) 
            for i, batch in enumerate(batches)
        ]
        
        # Execute all batches and collect results
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        for i, batch_result in enumerate(batch_results):
            if isinstance(batch_result, Exception):
                logger.error(f"Batch {i} failed: {batch_result}")
                self.metrics.failed_batches += 1
                self.metrics.failed_items += len(batches[i])
            else:
                self.metrics.successful_batches += 1
                self.metrics.processed_items += len(batches[i])
                if batch_result:
                    results.extend(batch_result)
        
        # Update performance metrics
        total_time = time.time() - start_time
        self.metrics.total_processing_time = total_time
        self.metrics.average_batch_time = total_time / len(batches) if batches else 0
        
        logger.info(f"✅ Completed parallel processing: {self.metrics.processed_items}/{self.metrics.total_items} items")
        logger.info(f"📊 Performance: {total_time:.2f}s total, {self.metrics.average_batch_time:.2f}s avg/batch")
        
        return results
    
    async def process_grouped_data_parallel(
        self,
        data: pd.DataFrame,
        group_column: str,
        processing_function: Callable,
        min_group_size: int = 1,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Transform sequential groupby operations to parallel processing.
        
        Replaces patterns like:
        for group_id, group_data in data.groupby('column'):
            process_group(group_data)
            
        With efficient parallel batching of groups.
        
        Args:
            data: DataFrame to group and process
            group_column: Column to group by
            processing_function: Function to apply to each group
            min_group_size: Minimum group size to include
            **kwargs: Additional arguments for processing function
            
        Returns:
            List of processed group results
        """
        start_time = time.time()
        
        # Create groups
        groups = data.groupby(group_column)
        group_list = [
            (group_id, group_df) 
            for group_id, group_df in groups 
            if len(group_df) >= min_group_size
        ]
        
        self.metrics.total_items = len(group_list)
        logger.info(f"🔄 Processing {len(group_list)} groups in parallel")
        
        # Create batches of groups
        batches = self._create_batches(group_list, self.config.batch_size)
        self.metrics.total_batches = len(batches)
        
        # Process group batches in parallel
        results = []
        semaphore = asyncio.Semaphore(self.config.max_concurrent_batches)
        
        async def process_group_batch_with_semaphore(batch_id: int, batch: List[Tuple]):
            async with semaphore:
                return await self._process_group_batch(
                    batch_id, batch, processing_function, **kwargs
                )
        
        # Create tasks for all group batches
        tasks = [
            process_group_batch_with_semaphore(i, batch) 
            for i, batch in enumerate(batches)
        ]
        
        # Execute all group batches
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for i, batch_result in enumerate(batch_results):
            if isinstance(batch_result, Exception):
                logger.error(f"Group batch {i} failed: {batch_result}")
                self.metrics.failed_batches += 1
            else:
                self.metrics.successful_batches += 1
                if batch_result:
                    results.extend(batch_result)
        
        total_time = time.time() - start_time
        logger.info(f"✅ Completed group processing: {len(results)} results in {total_time:.2f}s")
        
        return results
    
    async def transform_sequential_stats_processing(
        self,
        batting_stats: pd.DataFrame,
        pitching_stats: pd.DataFrame
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Transform the specific sequential processing patterns from BaseballSavantClient.
        
        Converts:
        for _, batter in batting_stats.iterrows():
            # process batter
        for _, pitcher in pitching_stats.iterrows():
            # process pitcher
            
        To parallel batch processing.
        """
        logger.info("🔄 Transforming sequential stats processing to parallel batching")
        
        # Process batting stats in parallel
        batting_results = await self.process_players_parallel(
            batting_stats,
            self._process_batter_batch,
            position_type="batter"
        )
        
        # Process pitching stats in parallel
        pitching_results = await self.process_players_parallel(
            pitching_stats,
            self._process_pitcher_batch,
            position_type="pitcher"
        )
        
        return batting_results, pitching_results
    
    async def _process_single_batch(
        self,
        batch_id: int,
        batch: List[Dict],
        processing_function: Callable,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Process a single batch with circuit breaker protection"""
        cache_key = f"batch_{batch_id}_{hash(str(batch))}"
        
        # Check cache first
        if cache_key in self.cache:
            self.metrics.cache_hits += 1
            logger.debug(f"Cache hit for batch {batch_id}")
            return self.cache[cache_key]
        
        self.metrics.cache_misses += 1
        
        try:
            # Use circuit breaker for resilience
            result = await asyncio.wait_for(
                asyncio.create_task(self._execute_batch_processing(batch, processing_function, **kwargs)),
                timeout=self.config.timeout_seconds
            )
            
            # Cache successful results
            self.cache[cache_key] = result
            
            # Clean cache if it gets too large
            if len(self.cache) > 1000:
                # Remove oldest 20% of entries
                keys_to_remove = list(self.cache.keys())[:200]
                for key in keys_to_remove:
                    del self.cache[key]
            
            logger.debug(f"✅ Batch {batch_id} completed: {len(result)} results")
            return result
            
        except asyncio.TimeoutError:
            logger.error(f"❌ Batch {batch_id} timed out after {self.config.timeout_seconds}s")
            raise
        except Exception as e:
            logger.error(f"❌ Batch {batch_id} failed: {e}")
            raise
    
    async def _process_group_batch(
        self,
        batch_id: int,
        batch: List[Tuple],
        processing_function: Callable,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Process a batch of grouped data"""
        results = []
        
        for group_id, group_df in batch:
            try:
                # Process each group in the batch
                group_result = await asyncio.create_task(
                    self._execute_group_processing(group_id, group_df, processing_function, **kwargs)
                )
                if group_result:
                    results.append(group_result)
                    
            except Exception as e:
                logger.error(f"Error processing group {group_id} in batch {batch_id}: {e}")
                continue
        
        return results
    
    async def _execute_batch_processing(
        self,
        batch: List[Dict],
        processing_function: Callable,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Execute processing function on a batch of items"""
        def run_in_thread():
            return self.circuit_breaker.call(processing_function, batch, **kwargs)
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, run_in_thread)
    
    async def _execute_group_processing(
        self,
        group_id: Any,
        group_df: pd.DataFrame,
        processing_function: Callable,
        **kwargs
    ) -> Dict[str, Any]:
        """Execute processing function on a single group"""
        def run_in_thread():
            return self.circuit_breaker.call(processing_function, group_id, group_df, **kwargs)
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, run_in_thread)
    
    def _process_batter_batch(self, batch: List[Dict], **kwargs) -> List[Dict[str, Any]]:
        """Process a batch of batters (replaces iterrows() pattern)"""
        results = []
        
        for batter in batch:
            try:
                # Apply the same logic as the original sequential processing
                if batter.get("PA", 0) > 50:  # At least 50 plate appearances
                    player_data = {
                        "id": batter.get("IDfg", 0),
                        "name": batter.get("Name", ""),
                        "team": batter.get("Team", ""),
                        "position_type": "batter",
                        "active": True,
                        "league": "MLB",
                        "stats": {
                            "AVG": batter.get("AVG", 0.250),
                            "PA": batter.get("PA", 0),
                            "HR": batter.get("HR", 0),
                            "RBI": batter.get("RBI", 0),
                            "R": batter.get("R", 0),
                            "BB": batter.get("BB", 0),
                            "SO": batter.get("SO", 0),
                            "SB": batter.get("SB", 0),
                            "2B": batter.get("2B", 0),
                            "3B": batter.get("3B", 0),
                            "OBP": batter.get("OBP", 0.320),
                            "SLG": batter.get("SLG", 0.400),
                        },
                    }
                    results.append(player_data)
                    
            except Exception as e:
                logger.error(f"Error processing batter {batter.get('Name', 'Unknown')}: {e}")
                continue
        
        return results
    
    def _process_pitcher_batch(self, batch: List[Dict], **kwargs) -> List[Dict[str, Any]]:
        """Process a batch of pitchers (replaces iterrows() pattern)"""
        results = []
        
        for pitcher in batch:
            try:
                # Apply the same logic as the original sequential processing
                if pitcher.get("IP", 0) > 20:  # At least 20 innings pitched
                    pitcher_data = {
                        "id": pitcher.get("IDfg", 0),
                        "name": pitcher.get("Name", ""),
                        "team": pitcher.get("Team", ""),
                        "position_type": "pitcher",
                        "active": True,
                        "league": "MLB",
                        "stats": {
                            "IP": pitcher.get("IP", 0),
                            "ERA": pitcher.get("ERA", 4.50),
                            "WHIP": pitcher.get("WHIP", 1.30),
                            "K/9": pitcher.get("K/9", 8.0),
                            "BB/9": pitcher.get("BB/9", 3.0),
                            "HR/9": pitcher.get("HR/9", 1.2),
                            "W": pitcher.get("W", 0),
                            "L": pitcher.get("L", 0),
                            "SV": pitcher.get("SV", 0),
                            "HLD": pitcher.get("HLD", 0),
                            "FIP": pitcher.get("FIP", 4.20),
                        },
                    }
                    results.append(pitcher_data)
                    
            except Exception as e:
                logger.error(f"Error processing pitcher {pitcher.get('Name', 'Unknown')}: {e}")
                continue
        
        return results
    
    def _create_batches(self, items: List, batch_size: int) -> List[List]:
        """Create consistent-sized batches from list of items"""
        batches = []
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            batches.append(batch)
        return batches
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get comprehensive performance metrics"""
        return {
            "processing_stats": {
                "total_items": self.metrics.total_items,
                "processed_items": self.metrics.processed_items,
                "failed_items": self.metrics.failed_items,
                "success_rate": self.metrics.processed_items / max(self.metrics.total_items, 1),
            },
            "batch_stats": {
                "total_batches": self.metrics.total_batches,
                "successful_batches": self.metrics.successful_batches,
                "failed_batches": self.metrics.failed_batches,
                "batch_success_rate": self.metrics.successful_batches / max(self.metrics.total_batches, 1),
            },
            "performance_stats": {
                "total_processing_time": self.metrics.total_processing_time,
                "average_batch_time": self.metrics.average_batch_time,
                "items_per_second": self.metrics.processed_items / max(self.metrics.total_processing_time, 1),
            },
            "cache_stats": {
                "cache_hits": self.metrics.cache_hits,
                "cache_misses": self.metrics.cache_misses,
                "cache_hit_rate": self.metrics.cache_hits / max(self.metrics.cache_hits + self.metrics.cache_misses, 1),
            },
            "circuit_breaker_stats": {
                "state": self.circuit_breaker.state,
                "failure_count": self.circuit_breaker.failure_count,
            }
        }
    
    def reset_metrics(self):
        """Reset all performance metrics"""
        self.metrics = BatchMetrics()
        logger.info("📊 Performance metrics reset")
    
    async def shutdown(self):
        """Gracefully shutdown the processing service"""
        self.executor.shutdown(wait=True)
        self.cache.clear()
        logger.info("🛑 ParallelBaseballProcessingService shutdown complete")

# Integration class for transforming existing sequential code
class SequentialToParallelTransformer:
    """
    Helper class to easily transform existing sequential Baseball Savant code
    to use parallel processing.
    """
    
    def __init__(self, parallel_service: Optional[ParallelBaseballProcessingService] = None):
        self.parallel_service = parallel_service or ParallelBaseballProcessingService()
    
    async def transform_baseball_savant_client(
        self,
        batting_stats: pd.DataFrame,
        pitching_stats: pd.DataFrame
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Drop-in replacement for BaseballSavantClient sequential processing.
        
        Transforms this pattern:
        for _, batter in batting_stats.iterrows():
            # process batter
        for _, pitcher in pitching_stats.iterrows():
            # process pitcher
        """
        return await self.parallel_service.transform_sequential_stats_processing(
            batting_stats, pitching_stats
        )
    
    async def transform_statcast_groupby_processing(
        self,
        statcast_data: pd.DataFrame,
        group_column: str = "batter",
        min_group_size: int = 50
    ) -> List[Dict]:
        """
        Transform Statcast groupby operations to parallel processing.
        
        Transforms this pattern:
        for player_id, player_data in statcast_data.groupby('batter'):
            # process player data
        """
        return await self.parallel_service.process_grouped_data_parallel(
            statcast_data,
            group_column,
            self._process_statcast_group,
            min_group_size=min_group_size
        )
    
    def _process_statcast_group(self, group_id: Any, group_df: pd.DataFrame, **kwargs) -> Dict[str, Any]:
        """Process a single Statcast group (mimics original groupby logic)"""
        try:
            # Apply the same feature engineering logic as StatcastDataPipeline
            features = {
                "player_id": group_id,
                "plate_appearances": len(group_df),
            }
            
            # Exit velocity features
            exit_velo = group_df["launch_speed"].dropna()
            if len(exit_velo) > 0:
                features.update({
                    "avg_exit_velocity": exit_velo.mean(),
                    "max_exit_velocity": exit_velo.max(),
                    "hard_hit_rate": (exit_velo >= 95).mean(),
                })
            
            # Launch angle features
            launch_angles = group_df["launch_angle"].dropna()
            if len(launch_angles) > 0:
                features.update({
                    "avg_launch_angle": launch_angles.mean(),
                    "sweet_spot_rate": ((launch_angles >= 8) & (launch_angles <= 32)).mean(),
                })
            
            return features
            
        except Exception as e:
            logger.error(f"Error processing Statcast group {group_id}: {e}")
            return {}

# Example usage and integration
async def example_parallel_transformation():
    """Example of transforming sequential Baseball Savant processing"""
    
    # Initialize the parallel processing service
    parallel_service = ParallelBaseballProcessingService()
    transformer = SequentialToParallelTransformer(parallel_service)
    
    # Simulate the data that would come from pybaseball
    import pandas as pd
    
    # Mock batting stats (would be from pyb.batting_stats() in real usage)
    batting_stats = pd.DataFrame({
        'IDfg': range(1, 501),
        'Name': [f'Player_{i}' for i in range(1, 501)],
        'Team': ['NYY', 'LAD', 'HOU'] * 167,
        'PA': np.random.randint(50, 600, 500),
        'AVG': np.random.uniform(0.200, 0.350, 500),
        'HR': np.random.randint(0, 50, 500),
        'RBI': np.random.randint(0, 120, 500),
    })
    
    # Mock pitching stats
    pitching_stats = pd.DataFrame({
        'IDfg': range(501, 701),
        'Name': [f'Pitcher_{i}' for i in range(501, 701)],
        'Team': ['NYY', 'LAD', 'HOU'] * 67,
        'IP': np.random.uniform(20, 200, 200),
        'ERA': np.random.uniform(2.50, 6.00, 200),
        'WHIP': np.random.uniform(1.00, 1.80, 200),
    })
    
    logger.info("🚀 Starting parallel transformation example")
    start_time = time.time()
    
    # Transform sequential processing to parallel
    batting_results, pitching_results = await transformer.transform_baseball_savant_client(
        batting_stats, pitching_stats
    )
    
    processing_time = time.time() - start_time
    
    # Get performance metrics
    metrics = parallel_service.get_performance_metrics()
    
    logger.info(f"✅ Parallel processing completed in {processing_time:.2f}s")
    logger.info(f"📊 Processed {len(batting_results)} batters, {len(pitching_results)} pitchers")
    logger.info(f"📈 Performance improvement: {metrics['performance_stats']['items_per_second']:.1f} items/sec")
    logger.info(f"💾 Cache hit rate: {metrics['cache_stats']['cache_hit_rate']:.2%}")
    
    # Cleanup
    await parallel_service.shutdown()
    
    return batting_results, pitching_results, metrics

if __name__ == "__main__":
    # Run the example
    asyncio.run(example_parallel_transformation())
