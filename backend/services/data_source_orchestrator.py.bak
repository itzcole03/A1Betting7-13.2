"""
Data Source Orchestrator - Phase 1.3 Data Source Orchestration
Implements async data source coordination with priority queuing for intelligent resource allocation.

Based on A1Betting Backend Data Optimization Roadmap:
- High-priority: Live games → Medium: Player props → Low: Historical data
- Intelligent resource allocation based on data importance
- Automatic failover between data sources on quality degradation
- Real-time performance monitoring and adaptive scheduling
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum, IntEnum
import time

from backend.services.unified_data_pipeline import (
    UnifiedDataPipeline, 
    DataRequest, 
    DataResponse, 
    DataSourceType,
    DataStatus,
    DataQuality
)
from backend.services.optimized_redis_service import OptimizedRedisService, CacheNamespace
from backend.services.unified_error_handler import unified_error_handler

logger = logging.getLogger(__name__)

class DataPriority(IntEnum):
    """Data priority levels for intelligent scheduling"""
    CRITICAL = 1   # Live games, real-time odds
    HIGH = 2       # Player props, current season data
    MEDIUM = 3     # Recent historical data
    LOW = 4        # Archive data, analytics

class SourceReliability(Enum):
    """Data source reliability tracking"""
    EXCELLENT = "excellent"  # 99%+ uptime, fast response
    GOOD = "good"           # 95-99% uptime, acceptable response
    DEGRADED = "degraded"   # 90-95% uptime, slow response
    POOR = "poor"           # <90% uptime, unreliable
    OFFLINE = "offline"     # Not responding

@dataclass
class DataSourceMetrics:
    """Metrics for tracking data source performance"""
    success_rate: float = 100.0
    avg_response_time: float = 0.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    quality_score: float = 100.0
    reliability: SourceReliability = SourceReliability.EXCELLENT

@dataclass
class ScheduledTask:
    """Scheduled data fetching task"""
    request: DataRequest
    priority: DataPriority
    scheduled_time: datetime
    max_retries: int = 3
    retry_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    last_attempt: Optional[datetime] = None
    
    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        return datetime.now() > self.scheduled_time + timedelta(minutes=5)
    
    @property
    def can_retry(self) -> bool:
        """Check if task can be retried"""
        return self.retry_count < self.max_retries

class DataSourceOrchestrator:
    """
    Advanced Data Source Orchestrator
    
    Features:
    - Priority-based scheduling (CRITICAL > HIGH > MEDIUM > LOW)
    - Intelligent resource allocation based on data importance
    - Automatic failover between data sources on quality degradation
    - Real-time performance monitoring and adaptive scheduling
    - Source reliability tracking with automatic blacklisting
    - Load balancing across healthy sources
    """
    
    def __init__(
        self,
        pipeline: UnifiedDataPipeline,
        redis_service: OptimizedRedisService,
        max_concurrent_requests: int = 20,
        quality_threshold: float = 80.0
    ):
        self.pipeline = pipeline
        self.redis_service = redis_service
        self.max_concurrent_requests = max_concurrent_requests
        self.quality_threshold = quality_threshold
        
        # Priority queues for intelligent scheduling
        self.priority_queues = {
            DataPriority.CRITICAL: asyncio.PriorityQueue(),
            DataPriority.HIGH: asyncio.PriorityQueue(),
            DataPriority.MEDIUM: asyncio.PriorityQueue(),
            DataPriority.LOW: asyncio.PriorityQueue()
        }
        
        # Data source tracking and metrics
        self.source_metrics: Dict[DataSourceType, DataSourceMetrics] = {}
        self.active_sources: Set[DataSourceType] = set()
        self.blacklisted_sources: Set[DataSourceType] = set()
        self.fallback_sources: Dict[DataSourceType, List[DataSourceType]] = {
            DataSourceType.SPORTRADAR: [DataSourceType.ESPN, DataSourceType.ODDS_API],
            DataSourceType.ODDS_API: [DataSourceType.SPORTRADAR],
            DataSourceType.PRIZEPICKS: [DataSourceType.ODDS_API],
            DataSourceType.BASEBALL_SAVANT: [DataSourceType.ESPN],
            DataSourceType.ESPN: [DataSourceType.ODDS_API]
        }
        
        # Worker management
        self.workers_running = False
        self.worker_tasks: List[asyncio.Task] = []
        self.semaphore = asyncio.Semaphore(max_concurrent_requests)
        
        # Performance tracking
        self.orchestrator_metrics = {
            'total_tasks_scheduled': 0,
            'tasks_completed': 0,
            'tasks_failed': 0,
            'failovers_triggered': 0,
            'sources_blacklisted': 0,
            'avg_scheduling_latency': 0.0,
            'last_cleanup': datetime.now()
        }
        
        # Initialize source metrics
        for source in DataSourceType:
            self.source_metrics[source] = DataSourceMetrics()
            self.active_sources.add(source)
    
    async def start_orchestrator(self, num_workers: int = 10):
        """Start the orchestration workers"""
        if self.workers_running:
            return
            
        self.workers_running = True
        
        # Start workers for each priority level
        for priority in DataPriority:
            worker_count = self._get_worker_count_for_priority(priority)
            for i in range(worker_count):
                task = asyncio.create_task(
                    self._priority_worker(priority, f"worker-{priority.name.lower()}-{i}")
                )
                self.worker_tasks.append(task)
        
        # Start maintenance worker
        maintenance_task = asyncio.create_task(self._maintenance_worker())
        self.worker_tasks.append(maintenance_task)
        
        logger.info(f"Data source orchestrator started with {len(self.worker_tasks)} workers")
    
    async def stop_orchestrator(self):
        """Stop all orchestration workers"""
        self.workers_running = False
        
        for task in self.worker_tasks:
            task.cancel()
        
        await asyncio.gather(*self.worker_tasks, return_exceptions=True)
        self.worker_tasks.clear()
        
        logger.info("Data source orchestrator stopped")
    
    def _get_worker_count_for_priority(self, priority: DataPriority) -> int:
        """Get optimal worker count based on priority"""
        if priority == DataPriority.CRITICAL:
            return 4  # Most workers for critical data
        elif priority == DataPriority.HIGH:
            return 3
        elif priority == DataPriority.MEDIUM:
            return 2
        else:
            return 1  # Fewest workers for low priority
    
    async def _priority_worker(self, priority: DataPriority, worker_id: str):
        """Worker for processing tasks by priority"""
        queue = self.priority_queues[priority]
        
        while self.workers_running:
            try:
                # Wait for task with timeout
                _, task = await asyncio.wait_for(queue.get(), timeout=1.0)
                
                async with self.semaphore:  # Rate limiting
                    try:
                        await self._execute_task(task, worker_id)
                    except Exception as e:
                        logger.error(f"Worker {worker_id} task execution error: {e}")
                        await self._handle_task_failure(task, str(e))
                    finally:
                        queue.task_done()
                        
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(1)
    
    async def _maintenance_worker(self):
        """Background maintenance worker"""
        while self.workers_running:
            try:
                await asyncio.sleep(60)  # Run every minute
                
                # Update source reliability
                await self._update_source_reliability()
                
                # Clean up overdue tasks
                await self._cleanup_overdue_tasks()
                
                # Update metrics
                await self._update_orchestrator_metrics()
                
                # Cache metrics for monitoring
                await self._cache_metrics()
                
            except Exception as e:
                logger.error(f"Maintenance worker error: {e}")
    
    async def schedule_data_fetch(
        self,
        request: DataRequest,
        priority: DataPriority = DataPriority.MEDIUM,
        scheduled_time: Optional[datetime] = None
    ) -> str:
        """Schedule a data fetch task with priority"""
        task = ScheduledTask(
            request=request,
            priority=priority,
            scheduled_time=scheduled_time or datetime.now()
        )
        
        # Calculate priority score (lower = higher priority)
        priority_score = self._calculate_priority_score(task)
        
        # Queue the task
        queue = self.priority_queues[priority]
        await queue.put((priority_score, task))
        
        self.orchestrator_metrics['total_tasks_scheduled'] += 1
        
        task_id = f"{request.source}_{int(time.time())}_{id(task)}"
        logger.debug(f"Scheduled task {task_id} with priority {priority}")
        
        return task_id
    
    def _calculate_priority_score(self, task: ScheduledTask) -> float:
        """Calculate priority score for task scheduling"""
        base_score = task.priority.value
        
        # Adjust for data source reliability
        source_metrics = self.source_metrics.get(task.request.source)
        if source_metrics:
            reliability_factor = {
                SourceReliability.EXCELLENT: 0.0,
                SourceReliability.GOOD: 0.1,
                SourceReliability.DEGRADED: 0.3,
                SourceReliability.POOR: 0.5,
                SourceReliability.OFFLINE: 1.0
            }.get(source_metrics.reliability, 0.0)
            
            base_score += reliability_factor
        
        # Adjust for scheduling latency
        time_factor = max(0, (datetime.now() - task.scheduled_time).total_seconds() / 60)
        base_score -= time_factor * 0.1  # Earlier scheduled tasks get higher priority
        
        return base_score
    
    async def _execute_task(self, task: ScheduledTask, worker_id: str):
        """Execute a scheduled task"""
        start_time = time.time()
        task.last_attempt = datetime.now()
        
        try:
            # Check if source is blacklisted
            if task.request.source in self.blacklisted_sources:
                await self._attempt_failover(task)
                return
            
            # Execute the data request
            response = await self.pipeline.fetch_data(task.request)
            
            # Update source metrics
            await self._update_source_metrics(task.request.source, response, start_time)
            
            # Check response quality and trigger failover if needed
            if response.quality in [DataQuality.POOR, DataQuality.INVALID]:
                await self._handle_quality_degradation(task, response)
            else:
                self.orchestrator_metrics['tasks_completed'] += 1
                logger.debug(f"Task completed by {worker_id}: {task.request.source}")
            
        except Exception as e:
            await self._handle_task_failure(task, str(e))
    
    async def _update_source_metrics(
        self, 
        source: DataSourceType, 
        response: DataResponse,
        start_time: float
    ):
        """Update metrics for a data source"""
        metrics = self.source_metrics[source]
        metrics.total_requests += 1
        
        response_time = time.time() - start_time
        
        if response.status == DataStatus.SUCCESS:
            metrics.successful_requests += 1
            metrics.last_success = datetime.now()
            
            # Update average response time
            if metrics.avg_response_time == 0:
                metrics.avg_response_time = response_time
            else:
                metrics.avg_response_time = (metrics.avg_response_time * 0.9) + (response_time * 0.1)
            
            # Update quality score
            quality_scores = {
                DataQuality.EXCELLENT: 100,
                DataQuality.GOOD: 85,
                DataQuality.ACCEPTABLE: 70,
                DataQuality.POOR: 40,
                DataQuality.INVALID: 0
            }
            
            quality_score = quality_scores.get(response.quality, 50)
            metrics.quality_score = (metrics.quality_score * 0.9) + (quality_score * 0.1)
            
        else:
            metrics.failed_requests += 1
            metrics.last_failure = datetime.now()
        
        # Calculate success rate
        metrics.success_rate = (metrics.successful_requests / metrics.total_requests) * 100
    
    async def _update_source_reliability(self):
        """Update reliability status for all sources"""
        for source, metrics in self.source_metrics.items():
            old_reliability = metrics.reliability
            
            # Determine new reliability based on metrics
            if metrics.success_rate >= 99 and metrics.avg_response_time < 2.0:
                metrics.reliability = SourceReliability.EXCELLENT
            elif metrics.success_rate >= 95 and metrics.avg_response_time < 5.0:
                metrics.reliability = SourceReliability.GOOD
            elif metrics.success_rate >= 90:
                metrics.reliability = SourceReliability.DEGRADED
            elif metrics.success_rate >= 80:
                metrics.reliability = SourceReliability.POOR
            else:
                metrics.reliability = SourceReliability.OFFLINE
            
            # Handle reliability changes
            if old_reliability != metrics.reliability:
                await self._handle_reliability_change(source, old_reliability, metrics.reliability)
    
    async def _handle_reliability_change(
        self, 
        source: DataSourceType, 
        old_reliability: SourceReliability,
        new_reliability: SourceReliability
    ):
        """Handle changes in source reliability"""
        logger.info(f"Source {source} reliability changed: {old_reliability} → {new_reliability}")
        
        # Blacklist severely degraded sources
        if new_reliability == SourceReliability.OFFLINE:
            if source not in self.blacklisted_sources:
                self.blacklisted_sources.add(source)
                self.active_sources.discard(source)
                self.orchestrator_metrics['sources_blacklisted'] += 1
                logger.warning(f"Blacklisted source: {source}")
        
        # Restore previously blacklisted sources that have recovered
        elif new_reliability in [SourceReliability.EXCELLENT, SourceReliability.GOOD]:
            if source in self.blacklisted_sources:
                self.blacklisted_sources.remove(source)
                self.active_sources.add(source)
                logger.info(f"Restored source: {source}")
    
    async def _handle_quality_degradation(self, task: ScheduledTask, response: DataResponse):
        """Handle quality degradation by triggering failover"""
        logger.warning(f"Quality degradation detected for {task.request.source}: {response.quality}")
        
        # Try failover to alternative source
        await self._attempt_failover(task)
    
    async def _attempt_failover(self, task: ScheduledTask):
        """Attempt failover to alternative data source"""
        fallback_sources = self.fallback_sources.get(task.request.source, [])
        
        for fallback_source in fallback_sources:
            if fallback_source in self.active_sources:
                # Create new request with fallback source
                fallback_request = DataRequest(
                    source=fallback_source,
                    endpoint=task.request.endpoint,
                    priority=task.request.priority,
                    params=task.request.params,
                    headers=task.request.headers,
                    timeout=task.request.timeout,
                    retry_count=task.request.retry_count,
                    cache_ttl=task.request.cache_ttl
                )
                
                try:
                    response = await self.pipeline.fetch_data(fallback_request)
                    
                    if response.status == DataStatus.SUCCESS:
                        self.orchestrator_metrics['failovers_triggered'] += 1
                        self.orchestrator_metrics['tasks_completed'] += 1
                        logger.info(f"Successful failover: {task.request.source} → {fallback_source}")
                        return
                        
                except Exception as e:
                    logger.warning(f"Failover attempt failed for {fallback_source}: {e}")
                    continue
        
        # All failover attempts failed
        await self._handle_task_failure(task, "All failover sources failed")
    
    async def _handle_task_failure(self, task: ScheduledTask, error: str):
        """Handle task failure with retry logic"""
        task.retry_count += 1
        
        if task.can_retry and not task.is_overdue:
            # Reschedule with exponential backoff
            delay = min(300, 2 ** task.retry_count)  # Max 5 minutes
            new_scheduled_time = datetime.now() + timedelta(seconds=delay)
            
            task.scheduled_time = new_scheduled_time
            
            # Requeue with lower priority
            lower_priority = min(DataPriority.LOW, DataPriority(task.priority.value + 1))
            priority_score = self._calculate_priority_score(task)
            
            await self.priority_queues[lower_priority].put((priority_score, task))
            
            logger.debug(f"Rescheduled failed task with {delay}s delay (attempt {task.retry_count})")
        else:
            self.orchestrator_metrics['tasks_failed'] += 1
            logger.error(f"Task permanently failed: {error}")
    
    async def _cleanup_overdue_tasks(self):
        """Clean up overdue tasks from queues"""
        # This is a simplified version - in practice, you'd need to scan queues
        # and remove overdue tasks, which is complex with asyncio.PriorityQueue
        pass
    
    async def _update_orchestrator_metrics(self):
        """Update overall orchestrator metrics"""
        # Calculate average scheduling latency
        # This would typically involve tracking task creation to execution times
        pass
    
    async def _cache_metrics(self):
        """Cache current metrics for monitoring"""
        metrics_data = {
            'orchestrator_metrics': self.orchestrator_metrics,
            'source_metrics': {
                source.value: {
                    'success_rate': metrics.success_rate,
                    'avg_response_time': metrics.avg_response_time,
                    'quality_score': metrics.quality_score,
                    'reliability': metrics.reliability.value,
                    'total_requests': metrics.total_requests
                }
                for source, metrics in self.source_metrics.items()
            },
            'active_sources': [s.value for s in self.active_sources],
            'blacklisted_sources': [s.value for s in self.blacklisted_sources],
            'queue_sizes': {
                priority.name: queue.qsize() 
                for priority, queue in self.priority_queues.items()
            },
            'timestamp': datetime.now().isoformat()
        }
        
        await self.redis_service.set_cached_data(
            namespace=CacheNamespace.ANALYTICS,
            key_components=['orchestrator_metrics'],
            data=metrics_data,
            ttl=300,  # Cache for 5 minutes
            batch=True
        )
    
    async def get_orchestrator_status(self) -> Dict[str, Any]:
        """Get comprehensive orchestrator status"""
        return {
            'status': 'running' if self.workers_running else 'stopped',
            'workers_active': len([t for t in self.worker_tasks if not t.done()]),
            'orchestrator_metrics': self.orchestrator_metrics,
            'source_metrics': {
                source.value: {
                    'success_rate': metrics.success_rate,
                    'avg_response_time': metrics.avg_response_time,
                    'quality_score': metrics.quality_score,
                    'reliability': metrics.reliability.value
                }
                for source, metrics in self.source_metrics.items()
            },
            'active_sources': [s.value for s in self.active_sources],
            'blacklisted_sources': [s.value for s in self.blacklisted_sources],
            'queue_sizes': {
                priority.name: queue.qsize() 
                for priority, queue in self.priority_queues.items()
            }
        }
    
    async def schedule_live_game_data(self, game_id: str, sport: str = "mlb") -> str:
        """Convenience method for scheduling critical live game data"""
        request = DataRequest(
            source=DataSourceType.SPORTRADAR,
            endpoint=f"/games/{sport}/{game_id}/live",
            priority=1,
            cache_ttl=10  # Very short cache for live data
        )
        
        return await self.schedule_data_fetch(request, DataPriority.CRITICAL)
    
    async def schedule_player_props(self, player_id: str, sport: str = "mlb") -> str:
        """Convenience method for scheduling player prop data"""
        request = DataRequest(
            source=DataSourceType.PRIZEPICKS,
            endpoint=f"/props/{sport}/player/{player_id}",
            priority=2,
            cache_ttl=300  # 5 minute cache for props
        )
        
        return await self.schedule_data_fetch(request, DataPriority.HIGH)
    
    async def schedule_historical_data(self, player_id: str, days: int = 30) -> str:
        """Convenience method for scheduling historical data"""
        request = DataRequest(
            source=DataSourceType.BASEBALL_SAVANT,
            endpoint=f"/player/{player_id}/stats",
            priority=3,
            params={"days": days},
            cache_ttl=3600  # 1 hour cache for historical
        )
        
        return await self.schedule_data_fetch(request, DataPriority.MEDIUM)

# Global instance for application use
data_source_orchestrator = None

async def get_data_source_orchestrator(
    pipeline: UnifiedDataPipeline,
    redis_service: OptimizedRedisService
) -> DataSourceOrchestrator:
    """Get or create data source orchestrator"""
    global data_source_orchestrator
    
    if data_source_orchestrator is None:
        data_source_orchestrator = DataSourceOrchestrator(pipeline, redis_service)
        await data_source_orchestrator.start_orchestrator()
    
    return data_source_orchestrator
