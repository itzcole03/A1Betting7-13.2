"""
Batch Processing Service for Enhanced Prop Analysis
High-performance batch processing with intelligent request optimization
"""

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from backend.models.api_models import EnrichedProp
from backend.services.enhanced_prop_analysis_service import EnhancedPropAnalysisService
from backend.services.optimized_data_service import optimized_data_service

logger = logging.getLogger(__name__)


@dataclass
class PropAnalysisRequest:
    """Individual prop analysis request"""

    prop_id: str
    player_name: str
    stat_type: str
    line: float
    team: str
    matchup: str
    priority: int = 1  # 1=high, 2=normal, 3=low


@dataclass
class BatchProcessingResult:
    """Result of batch processing operation"""

    successful: List[EnrichedProp]
    failed: List[Dict[str, Any]]
    total_processed: int
    processing_time: float
    cache_hit_rate: float


class BatchPropAnalysisService:
    """
    High-performance batch processing service for prop analysis

    Features:
    - Intelligent request grouping by player
    - Concurrent processing with controlled resource usage
    - Smart data prefetching and caching
    - Performance monitoring and optimization
    """

    def __init__(self):
        self.prop_analysis_service = EnhancedPropAnalysisService()
        self.max_concurrent_players = 8  # Concurrent player processing limit
        self.max_concurrent_requests = 20  # Overall request limit
        self.batch_size_limit = 50  # Maximum batch size

        # Performance tracking
        self.processing_stats = {
            "total_batches": 0,
            "total_requests": 0,
            "avg_processing_time": 0.0,
            "avg_cache_hit_rate": 0.0,
            "error_rate": 0.0,
        }

    async def initialize(self):
        """Initialize all services"""
        await self.prop_analysis_service.initialize()
        await optimized_data_service.initialize()
        logger.info("BatchPropAnalysisService initialized")

    async def process_batch(
        self,
        requests: List[PropAnalysisRequest],
        use_cache: bool = True,
        warm_cache: bool = True,
    ) -> BatchProcessingResult:
        """
        Process a batch of prop analysis requests with optimization

        Args:
            requests: List of prop analysis requests
            use_cache: Whether to use cached data
            warm_cache: Whether to proactively warm cache

        Returns:
            BatchProcessingResult with processing details
        """
        start_time = datetime.now()

        try:
            # Validate batch size
            if len(requests) > self.batch_size_limit:
                logger.warning(
                    f"Batch size {len(requests)} exceeds limit {self.batch_size_limit}"
                )
                requests = requests[: self.batch_size_limit]

            logger.info(f"Processing batch of {len(requests)} prop analysis requests")

            # Group requests by player for optimization
            player_groups = self._group_requests_by_player(requests)

            # Warm cache if requested
            if warm_cache:
                await self._warm_cache_for_batch(player_groups)

            # Process each player group concurrently
            semaphore = asyncio.Semaphore(self.max_concurrent_players)
            player_tasks = []

            for player_name, player_requests in player_groups.items():
                task = self._process_player_group(
                    player_name, player_requests, semaphore
                )
                player_tasks.append(task)

            # Execute all player groups concurrently
            player_results = await asyncio.gather(*player_tasks, return_exceptions=True)

            # Aggregate results
            successful = []
            failed = []

            for result in player_results:
                if isinstance(result, Exception):
                    logger.error(f"Player group processing failed: {result}")
                    failed.append({"error": str(result), "type": "player_group_error"})
                else:
                    successful.extend(result.get("successful", []))
                    failed.extend(result.get("failed", []))

            # Calculate metrics
            processing_time = (datetime.now() - start_time).total_seconds()
            cache_metrics = await optimized_data_service.get_performance_metrics()
            cache_hit_rate = cache_metrics["cache_metrics"]["hit_rate"]

            # Update processing stats
            self._update_processing_stats(
                len(requests), processing_time, cache_hit_rate, len(failed)
            )

            result = BatchProcessingResult(
                successful=successful,
                failed=failed,
                total_processed=len(requests),
                processing_time=processing_time,
                cache_hit_rate=cache_hit_rate,
            )

            logger.info(
                f"Batch processing completed: {len(successful)} successful, "
                f"{len(failed)} failed, {processing_time:.2f}s, "
                f"{cache_hit_rate:.2%} cache hit rate"
            )

            return result

        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            return BatchProcessingResult(
                successful=[],
                failed=[{"error": str(e), "type": "batch_processing_error"}],
                total_processed=0,
                processing_time=processing_time,
                cache_hit_rate=0.0,
            )

    def _group_requests_by_player(
        self, requests: List[PropAnalysisRequest]
    ) -> Dict[str, List[PropAnalysisRequest]]:
        """Group requests by player for optimized processing"""
        player_groups = defaultdict(list)

        for request in requests:
            player_key = request.player_name.lower().strip()
            player_groups[player_key].append(request)

        # Sort each group by priority (high priority first)
        for player_requests in player_groups.values():
            player_requests.sort(key=lambda r: r.priority)

        logger.debug(
            f"Grouped {len(requests)} requests into {len(player_groups)} player groups"
        )
        return dict(player_groups)

    async def _warm_cache_for_batch(
        self, player_groups: Dict[str, List[PropAnalysisRequest]]
    ):
        """Proactively warm cache for all players in the batch"""
        try:
            player_names = list(player_groups.keys())
            all_stat_types = set()

            # Collect all stat types
            for player_requests in player_groups.values():
                for request in player_requests:
                    all_stat_types.add(request.stat_type)

            # Warm cache for all players and stat types
            await optimized_data_service.warm_cache(player_names, list(all_stat_types))

            logger.debug(
                f"Cache warmed for {len(player_names)} players with {len(all_stat_types)} stat types"
            )

        except Exception as e:
            logger.warning(f"Cache warming failed: {e}")

    async def _process_player_group(
        self,
        player_name: str,
        requests: List[PropAnalysisRequest],
        semaphore: asyncio.Semaphore,
    ) -> Dict[str, Any]:
        """Process all requests for a single player efficiently"""
        async with semaphore:
            try:
                logger.debug(
                    f"Processing {len(requests)} requests for player {player_name}"
                )

                # Extract all stat types for this player
                stat_types = [req.stat_type for req in requests]

                # Get comprehensive player data once for all requests
                player_data = await optimized_data_service.get_player_data_optimized(
                    player_name, stat_types
                )

                if not player_data:
                    logger.warning(f"No data found for player {player_name}")
                    failed = [
                        {
                            "prop_id": req.prop_id,
                            "error": f"No data found for player {player_name}",
                            "type": "player_not_found",
                        }
                        for req in requests
                    ]
                    return {"successful": [], "failed": failed}

                # Process each prop request with the shared player data
                request_semaphore = asyncio.Semaphore(self.max_concurrent_requests)
                prop_tasks = []

                for request in requests:
                    task = self._process_single_prop_with_data(
                        request, player_data, request_semaphore
                    )
                    prop_tasks.append(task)

                # Execute all prop analyses for this player
                prop_results = await asyncio.gather(*prop_tasks, return_exceptions=True)

                # Separate successful and failed results
                successful = []
                failed = []

                for i, result in enumerate(prop_results):
                    if isinstance(result, Exception):
                        failed.append(
                            {
                                "prop_id": requests[i].prop_id,
                                "error": str(result),
                                "type": "prop_processing_error",
                            }
                        )
                    elif result:
                        successful.append(result)
                    else:
                        failed.append(
                            {
                                "prop_id": requests[i].prop_id,
                                "error": "Analysis generation failed",
                                "type": "analysis_failed",
                            }
                        )

                logger.debug(
                    f"Player {player_name}: {len(successful)} successful, {len(failed)} failed"
                )

                return {"successful": successful, "failed": failed}

            except Exception as e:
                logger.error(f"Error processing player group {player_name}: {e}")
                failed = [
                    {
                        "prop_id": req.prop_id,
                        "error": str(e),
                        "type": "player_group_error",
                    }
                    for req in requests
                ]
                return {"successful": [], "failed": failed}

    async def _process_single_prop_with_data(
        self,
        request: PropAnalysisRequest,
        player_data: Dict[str, Any],
        semaphore: asyncio.Semaphore,
    ) -> Optional[EnrichedProp]:
        """Process a single prop with pre-fetched player data"""
        async with semaphore:
            try:
                # Use the enhanced prop analysis service with the pre-fetched data
                enriched_prop = (
                    await self.prop_analysis_service.get_enhanced_prop_analysis(
                        prop_id=request.prop_id,
                        player_name=request.player_name,
                        stat_type=request.stat_type,
                        line=request.line,
                        team=request.team,
                        matchup=request.matchup,
                    )
                )

                return enriched_prop

            except Exception as e:
                logger.error(f"Error processing prop {request.prop_id}: {e}")
                raise

    def _update_processing_stats(
        self,
        total_requests: int,
        processing_time: float,
        cache_hit_rate: float,
        failed_count: int,
    ):
        """Update processing statistics"""
        self.processing_stats["total_batches"] += 1
        self.processing_stats["total_requests"] += total_requests

        # Update running averages
        total_batches = self.processing_stats["total_batches"]

        self.processing_stats["avg_processing_time"] = (
            self.processing_stats["avg_processing_time"] * (total_batches - 1)
            + processing_time
        ) / total_batches

        self.processing_stats["avg_cache_hit_rate"] = (
            self.processing_stats["avg_cache_hit_rate"] * (total_batches - 1)
            + cache_hit_rate
        ) / total_batches

        error_rate = failed_count / max(1, total_requests)
        self.processing_stats["error_rate"] = (
            self.processing_stats["error_rate"] * (total_batches - 1) + error_rate
        ) / total_batches

    async def get_processing_statistics(self) -> Dict[str, Any]:
        """Get comprehensive processing statistics"""
        optimized_metrics = await optimized_data_service.get_performance_metrics()

        return {
            "batch_processing": self.processing_stats,
            "data_service": optimized_metrics,
            "current_limits": {
                "max_concurrent_players": self.max_concurrent_players,
                "max_concurrent_requests": self.max_concurrent_requests,
                "batch_size_limit": self.batch_size_limit,
            },
            "timestamp": datetime.now().isoformat(),
        }

    async def optimize_batch_for_players(
        self, player_names: List[str], stat_types: List[str], lines: List[float]
    ) -> List[PropAnalysisRequest]:
        """
        Create optimized batch requests for multiple players and props

        Args:
            player_names: List of player names
            stat_types: List of stat types to analyze
            lines: List of betting lines

        Returns:
            Optimized list of PropAnalysisRequest objects
        """
        requests = []
        request_id = 0

        for player_name in player_names:
            for stat_type in stat_types:
                for line in lines:
                    request = PropAnalysisRequest(
                        prop_id=f"batch_{request_id}",
                        player_name=player_name,
                        stat_type=stat_type,
                        line=line,
                        team="TBD",  # Would be determined from player data
                        matchup="TBD",  # Would be determined from schedule
                        priority=1,
                    )
                    requests.append(request)
                    request_id += 1

        return requests


# Global instance
batch_prop_analysis_service = BatchPropAnalysisService()
