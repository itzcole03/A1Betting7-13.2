"""Advanced Background Task Processing Engine
High-performance task queue system with priority scheduling, distributed processing, and failure recovery
"""

import asyncio
import logging
import multiprocessing as mp
import time
import traceback
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, IntEnum
from typing import Any, Callable, Dict, List, Optional

import redis.asyncio as redis
from config import config_manager
from backend.utils.serialization_utils import (
    register_serializable,
    safe_dumps,
    safe_loads,
)

logger = logging.getLogger(__name__)


@register_serializable
class TaskPriority(IntEnum):
    """Task priority levels (higher number = higher priority)"""

    CRITICAL = 100  # Real-time predictions, arbitrage alerts
    HIGH = 80  # Model training, data pipeline failures
    MEDIUM = 60  # Analytics updates, performance monitoring
    LOW = 40  # Cleanup tasks, historical analysis
    BACKGROUND = 20  # Maintenance, optimization


@register_serializable
class TaskStatus(str, Enum):
    """Task execution status"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


@register_serializable
class TaskType(str, Enum):
    """Types of background tasks"""

    MODEL_TRAINING = "model_training"
    DATA_INGESTION = "data_ingestion"
    PREDICTION_BATCH = "prediction_batch"
    RISK_ANALYSIS = "risk_analysis"
    ARBITRAGE_SCAN = "arbitrage_scan"
    PERFORMANCE_ANALYSIS = "performance_analysis"
    DATA_CLEANUP = "data_cleanup"
    BACKUP_CREATION = "backup_creation"
    ALERT_PROCESSING = "alert_processing"
    NOTIFICATION_SENDING = "notification_sending"
    CACHE_WARMING = "cache_warming"
    ANALYTICS_COMPUTATION = "analytics_computation"


@register_serializable
@dataclass
class TaskDefinition:
    """Comprehensive task definition"""

    id: str
    task_type: TaskType
    priority: TaskPriority
    function_name: str
    args: List[Any] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

    # Execution configuration
    max_retries: int = 3
    timeout_seconds: int = 300
    retry_delay: int = 60
    exponential_backoff: bool = True

    # Scheduling
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    recurring: bool = False
    cron_expression: Optional[str] = None

    # Dependencies
    depends_on: List[str] = field(default_factory=list)
    blocks: List[str] = field(default_factory=list)

    # Resource requirements
    cpu_requirement: float = 1.0
    memory_requirement: float = 512.0  # MB
    gpu_requirement: bool = False

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    created_by: str = "system"
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@register_serializable
@dataclass
class TaskResult:
    """Task execution result"""

    task_id: str
    status: TaskStatus
    result: Any = None
    error: Optional[str] = None
    traceback: Optional[str] = None

    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    execution_time: float = 0.0

    # Resource usage
    cpu_usage: float = 0.0
    memory_usage: float = 0.0

    # Retry information
    attempt_number: int = 1
    retry_count: int = 0

    # Worker information
    worker_id: str = ""
    worker_node: str = ""

    metadata: Dict[str, Any] = field(default_factory=dict)


class TaskQueue:
    """High-performance priority task queue with Redis backend"""

    def __init__(self, queue_name: str = "a1betting_tasks"):
        self.queue_name = queue_name
        self.redis_client: Optional[redis.Redis] = None
        self.priority_queues = {
            priority: f"{queue_name}:priority:{priority.value}"
            for priority in TaskPriority
        }
        self.result_store = f"{queue_name}:results"
        self.lock_prefix = f"{queue_name}:locks"

    async def initialize(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                config_manager.get_redis_url(),
                decode_responses=True,  # We are using JSON strings now
            )
            await self.redis_client.ping()
            logger.info("Task queue Redis connection established")
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error(f"Failed to connect to Redis: {e!s}")
            raise

    async def enqueue(self, task: TaskDefinition) -> bool:
        """Add task to appropriate priority queue"""
        try:
            if not self.redis_client:
                await self.initialize()

            # Serialize task using safe JSON
            task_data = safe_dumps(task)

            # Add to priority queue
            queue_key = self.priority_queues[task.priority]

            # Use timestamp as score for FIFO within same priority
            score = time.time()
            if task.scheduled_at:
                score = task.scheduled_at.timestamp()

            await self.redis_client.zadd(queue_key, {task.id: score})

            # Store task data
            task_key = f"{self.queue_name}:task:{task.id}"
            await self.redis_client.setex(task_key, 86400, task_data)  # 24 hours TTL

            # Set expiry if specified
            if task.expires_at:
                expire_key = f"{self.queue_name}:expire:{task.id}"
                await self.redis_client.setex(
                    expire_key,
                    int((task.expires_at - datetime.now(timezone.utc)).total_seconds()),
                    "expired",
                )

            
            return True

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error(f"Failed to enqueue task {task.id}: {e!s}")
            return False

    async def dequeue(self, worker_id: str) -> Optional[TaskDefinition]:
        """Dequeue highest priority task"""
        try:
            if not self.redis_client:
                await self.initialize()

            # Check priority queues from highest to lowest
            for priority in sorted(TaskPriority, reverse=True):
                queue_key = self.priority_queues[priority]

                # Get next task (FIFO within priority)
                now = time.time()
                result = await self.redis_client.zrangebyscore(
                    queue_key, 0, now, start=0, num=1, withscores=True
                )

                if result:
                    task_id, score = result[0]
                    # task_id is already a string with decode_responses=True

                    # Try to acquire lock on this task
                    lock_key = f"{self.lock_prefix}:{task_id}"
                    lock_acquired = await self.redis_client.set(
                        lock_key, worker_id, nx=True, ex=3600  # 1 hour lock
                    )

                    if lock_acquired:
                        # Remove from queue
                        await self.redis_client.zrem(queue_key, task_id)

                        # Get task data
                        task_key = f"{self.queue_name}:task:{task_id}"
                        task_data = await self.redis_client.get(task_key)

                        if task_data:
                            task = safe_loads(task_data)
                            logger.debug(
                                f"Dequeued task {task_id} by worker {worker_id}"
                            )
                            return task
                        else:
                            # Task data not found, release lock
                            await self.redis_client.delete(lock_key)

            return None

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error(f"Failed to dequeue task: {e!s}")
            return None

    async def store_result(self, result: TaskResult):
        """Store task execution result"""
        try:
            if not self.redis_client:
                await self.initialize()

            result_data = safe_dumps(result)
            result_key = f"{self.result_store}:{result.task_id}"

            # Store result with 7 days TTL
            await self.redis_client.setex(result_key, 604800, result_data)

            # Release task lock
            lock_key = f"{self.lock_prefix}:{result.task_id}"
            await self.redis_client.delete(lock_key)

            # Clean up task data if completed successfully
            if result.status == TaskStatus.COMPLETED:
                task_key = f"{self.queue_name}:task:{result.task_id}"
                await self.redis_client.delete(task_key)

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error(f"Failed to store result for task {result.task_id}: {e!s}")

    async def get_result(self, task_id: str) -> Optional[TaskResult]:
        """Get task execution result"""
        try:
            if not self.redis_client:
                await self.initialize()

            result_key = f"{self.result_store}:{task_id}"
            result_data = await self.redis_client.get(result_key)

            if result_data:
                return safe_loads(result_data)
            return None

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error(f"Failed to get result for task {task_id}: {e!s}")
            return None

    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get comprehensive queue statistics"""
        try:
            if not self.redis_client:
                await self.initialize()

            stats = {
                "total_pending": 0,
                "priority_breakdown": {},
                "oldest_task_age": 0,
                "newest_task_age": 0,
                "total_results": 0,
                "active_locks": 0,
            }

            # Get counts for each priority
            for priority in TaskPriority:
                queue_key = self.priority_queues[priority]
                count = await self.redis_client.zcard(queue_key)
                stats["priority_breakdown"][priority.name] = count
                stats["total_pending"] += count

                # Get oldest and newest task times
                if count > 0:
                    oldest = await self.redis_client.zrange(
                        queue_key, 0, 0, withscores=True
                    )
                    newest = await self.redis_client.zrange(
                        queue_key, -1, -1, withscores=True
                    )

                    if oldest:
                        oldest_time = oldest[0][1]
                        stats["oldest_task_age"] = max(
                            stats["oldest_task_age"], time.time() - oldest_time
                        )

                    if newest:
                        newest_time = newest[0][1]
                        stats["newest_task_age"] = min(
                            stats["newest_task_age"], time.time() - newest_time
                        )

            # Count results
            result_keys = await self.redis_client.keys(f"{self.result_store}:*")
            stats["total_results"] = len(result_keys)

            # Count active locks
            lock_keys = await self.redis_client.keys(f"{self.lock_prefix}:*")
            stats["active_locks"] = len(lock_keys)

            return stats

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Failed to get queue stats: {e!s}")
            return {"error": str(e)}


class TaskWorker:
    """High-performance task worker with resource monitoring"""

    def __init__(self, worker_id: str, concurrency: int = 4):
        self.worker_id = worker_id
        self.concurrency = concurrency
        self.is_running = False
        self.task_queue = TaskQueue()
        self.thread_executor = ThreadPoolExecutor(max_workers=concurrency)
        self.process_executor = ProcessPoolExecutor(
            max_workers=max(1, mp.cpu_count() // 2)
        )

        # Performance tracking
        self.tasks_processed = 0
        self.tasks_failed = 0
        self.total_execution_time = 0.0
        self.start_time = None

        # Task registry
        self.task_functions = {}
        self._register_default_tasks()

    def _register_default_tasks(self):
        """Register default task functions"""
        self.task_functions.update(
            {
                "data_ingestion_task": self._data_ingestion_task,
                "model_training_task": self._model_training_task,
                "prediction_batch_task": self._prediction_batch_task,
                "risk_analysis_task": self._risk_analysis_task,
                "arbitrage_scan_task": self._arbitrage_scan_task,
                "performance_analysis_task": self._performance_analysis_task,
                "cleanup_task": self._cleanup_task,
                "backup_task": self._backup_task,
                "cache_warming_task": self._cache_warming_task,
                "analytics_computation_task": self._analytics_computation_task,
            }
        )

    def register_task(self, name: str, function: Callable):
        """Register custom task function"""
        self.task_functions[name] = function
        logger.info("Registered task function: {name}")

    async def start(self):
        """Start the worker"""
        if self.is_running:
            return

        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        await self.task_queue.initialize()

        logger.info(
            f"Starting task worker {self.worker_id} with concurrency {self.concurrency}"
        )

        # Create worker tasks
        worker_tasks = []
        for i in range(self.concurrency):
            task = asyncio.create_task(self._worker_loop(f"{self.worker_id}_{i}"))
            worker_tasks.append(task)

        # Start monitoring task
        monitor_task = asyncio.create_task(self._monitor_loop())
        worker_tasks.append(monitor_task)

        try:
            await asyncio.gather(*worker_tasks)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Worker error: {e!s}")
        finally:
            self.is_running = False

    async def stop(self):
        """Stop the worker gracefully"""
        logger.info("Stopping task worker {self.worker_id}")
        self.is_running = False

        # Shutdown executors
        self.thread_executor.shutdown(wait=True)
        self.process_executor.shutdown(wait=True)

    async def _worker_loop(self, worker_thread_id: str):
        """Main worker processing loop"""
        while self.is_running:
            try:
                # Get next task
                task = await self.task_queue.dequeue(worker_thread_id)

                if task:
                    # Execute task
                    result = await self._execute_task(task, worker_thread_id)

                    # Store result
                    await self.task_queue.store_result(result)

                    # Update stats
                    self.tasks_processed += 1
                    if result.status == TaskStatus.FAILED:
                        self.tasks_failed += 1
                    self.total_execution_time += result.execution_time

                else:
                    # No tasks available, wait before checking again
                    await asyncio.sleep(1)

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Worker loop error: {e!s}")
                await asyncio.sleep(5)  # Wait before retrying

    async def _execute_task(
        self, task: TaskDefinition, worker_thread_id: str
    ) -> TaskResult:
        """Execute a single task"""
        result = TaskResult(
            task_id=task.id,
            status=TaskStatus.RUNNING,
            started_at=datetime.now(timezone.utc),
            worker_id=worker_thread_id,
            worker_node=self.worker_id,
        )

        try:
            # Check if task function exists
            if task.function_name not in self.task_functions:
                raise ValueError(f"Unknown task function: {task.function_name}")

            function = self.task_functions[task.function_name]

            # Execute with timeout
            try:
                if task.cpu_requirement > 2.0:
                    # CPU-intensive task, use process executor
                    loop = asyncio.get_event_loop()
                    task_result = await asyncio.wait_for(
                        loop.run_in_executor(
                            self.process_executor,
                            lambda: function(*task.args, **task.kwargs),
                        ),
                        timeout=task.timeout_seconds,
                    )
                else:
                    # Regular task, use thread executor
                    loop = asyncio.get_event_loop()
                    task_result = await asyncio.wait_for(
                        loop.run_in_executor(
                            self.thread_executor,
                            lambda: function(*task.args, **task.kwargs),
                        ),
                        timeout=task.timeout_seconds,
                    )

                result.result = task_result
                result.status = TaskStatus.COMPLETED

            except asyncio.TimeoutError:
                result.status = TaskStatus.TIMEOUT
                result.error = f"Task timed out after {task.timeout_seconds} seconds"

            except Exception as e:  # pylint: disable=broad-exception-caught
                result.status = TaskStatus.FAILED
                result.error = str(e)
                result.traceback = traceback.format_exc()

        except Exception as e:  # pylint: disable=broad-exception-caught
            result.status = TaskStatus.FAILED
            result.error = str(e)
            result.traceback = traceback.format_exc()

        finally:
            result.completed_at = datetime.now(timezone.utc)
            if result.started_at:
                result.execution_time = (
                    result.completed_at - result.started_at
                ).total_seconds()

        return result

    async def _monitor_loop(self):
        """Monitor worker performance"""
        while self.is_running:
            try:
                await asyncio.sleep(60)  # Monitor every minute

                # Log performance stats
                uptime = (
                    (datetime.now(timezone.utc) - self.start_time).total_seconds()
                    if self.start_time
                    else 0
                )

                logger.info(
                    f"Worker {self.worker_id} stats: "
                    f"Processed: {self.tasks_processed}, "
                    f"Failed: {self.tasks_failed}, "
                    f"Success Rate: {((self.tasks_processed - self.tasks_failed) / max(self.tasks_processed, 1)) * 100:.1f}%, "
                    f"Avg Execution Time: {self.total_execution_time / max(self.tasks_processed, 1):.2f}s, "
                    f"Uptime: {uptime:.0f}s"
                )

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Monitor loop error: {e!s}")

    # Default task implementations
    async def _data_ingestion_task(self, source: str, data_type: str, **kwargs):
        """Data ingestion task"""
        logger.info("Executing data ingestion task for {source}:{data_type}")

        # Import here to avoid circular imports
        from data_sources import ultra_data_manager

        try:
            # This would trigger actual data ingestion
            result = await ultra_data_manager.fetch_multi_source_data(
                data_type=data_type,
                entity_id=kwargs.get("entity_id", "default"),
                max_age_seconds=kwargs.get("max_age_seconds", 300),
            )

            return {
                "status": "success",
                "source": source,
                "data_type": data_type,
                "data_quality": result.quality_metrics.confidence if result else 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Data ingestion task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    def _model_training_task(
        self, model_name: str, training_data: Dict[str, Any], **kwargs
    ):
        """Model training task"""
        logger.info("Executing model training task for {model_name}")

        try:
            # Simulate model training
            time.sleep(kwargs.get("training_duration", 10))  # Simulate training time

            return {
                "status": "success",
                "model_name": model_name,
                "training_samples": training_data.get("sample_count", 0),
                "accuracy": 0.85 + (hash(model_name) % 100) / 1000,  # Mock accuracy
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Model training task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    async def _prediction_batch_task(self, event_ids: List[str], **kwargs):
        """Batch prediction task"""
        logger.info("Executing batch prediction task for {len(event_ids)} events")

        try:
            # Import here to avoid circular imports
            from ensemble_engine import ultra_ensemble_engine

            predictions = []
            for event_id in event_ids:
                # Mock features for batch prediction
                features = {
                    "team_1_rating": 1500 + (hash(event_id) % 200),
                    "team_2_rating": 1500 + (hash(event_id[::-1]) % 200),
                    "home_advantage": 100,
                }

                prediction = await ultra_ensemble_engine.predict(
                    features=features, context=kwargs.get("context", "pre_game")
                )

                predictions.append(
                    {
                        "event_id": event_id,
                        "prediction": prediction.predicted_value,
                        "confidence": prediction.prediction_probability,
                    }
                )

            return {
                "status": "success",
                "predictions": predictions,
                "count": len(predictions),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Batch prediction task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    async def _risk_analysis_task(self, portfolio: Dict[str, Any], **kwargs):
        """Risk analysis task"""
        logger.info("Executing risk analysis task")

        try:
            # Import here to avoid circular imports
            from risk_management import ultra_risk_engine

            risk_metrics = await ultra_risk_engine.risk_assessor.assess_portfolio_risk(
                positions=portfolio.get("positions", []),
                bankroll=portfolio.get("bankroll", 10000),
                historical_returns=portfolio.get("historical_returns", []),
            )

            return {
                "status": "success",
                "risk_score": risk_metrics.risk_score,
                "var_95": risk_metrics.value_at_risk_95,
                "max_drawdown": risk_metrics.max_drawdown,
                "sharpe_ratio": risk_metrics.sharpe_ratio,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Risk analysis task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    async def _arbitrage_scan_task(self, market_data: List[Dict[str, Any]], **kwargs):
        """Arbitrage scanning task"""
        logger.info("Executing arbitrage scan task")

        try:
            # Import here to avoid circular imports
            from arbitrage_engine import ultra_arbitrage_engine

            opportunities = await ultra_arbitrage_engine.scan_for_opportunities(
                market_data=market_data, historical_data=kwargs.get("historical_data")
            )

            return {
                "status": "success",
                "arbitrage_opportunities": len(
                    opportunities["arbitrage_opportunities"]
                ),
                "market_inefficiencies": len(opportunities["market_inefficiencies"]),
                "best_profit": max(
                    [
                        arb.profit_percentage
                        for arb in opportunities["arbitrage_opportunities"]
                    ],
                    default=0,
                ),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Arbitrage scan task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    def _performance_analysis_task(self, analysis_type: str, **kwargs):
        """Performance analysis task"""
        logger.info("Executing performance analysis task: {analysis_type}")

        try:
            # Simulate performance analysis
            time.sleep(kwargs.get("analysis_duration", 5))

            return {
                "status": "success",
                "analysis_type": analysis_type,
                "metrics_computed": kwargs.get("metrics_count", 10),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Performance analysis task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    def _cleanup_task(self, cleanup_type: str, **kwargs):
        """Data cleanup task"""
        logger.info("Executing cleanup task: {cleanup_type}")

        try:
            # Simulate cleanup
            records_cleaned = kwargs.get("records_to_clean", 100)
            time.sleep(records_cleaned / 1000)  # Simulate cleanup time

            return {
                "status": "success",
                "cleanup_type": cleanup_type,
                "records_cleaned": records_cleaned,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Cleanup task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    def _backup_task(self, backup_type: str, **kwargs):
        """Backup creation task"""
        logger.info("Executing backup task: {backup_type}")

        try:
            # Simulate backup
            data_size = kwargs.get("data_size_mb", 1000)
            time.sleep(data_size / 100)  # Simulate backup time

            return {
                "status": "success",
                "backup_type": backup_type,
                "data_size_mb": data_size,
                "backup_location": f"/backups/{backup_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Backup task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    def _cache_warming_task(self, cache_keys: List[str], **kwargs):
        """Cache warming task"""
        logger.info("Executing cache warming task for {len(cache_keys)} keys")

        try:
            # Simulate cache warming
            time.sleep(len(cache_keys) * 0.1)

            return {
                "status": "success",
                "keys_warmed": len(cache_keys),
                "cache_hit_rate": 0.95,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Cache warming task failed: {e!s}")
            return {"status": "failed", "error": str(e)}

    def _analytics_computation_task(self, metrics: List[str], **kwargs):
        """Analytics computation task"""
        logger.info("Executing analytics computation task for {len(metrics)} metrics")

        try:
            # Simulate analytics computation
            computation_time = len(metrics) * kwargs.get("time_per_metric", 1)
            time.sleep(computation_time)

            return {
                "status": "success",
                "metrics_computed": len(metrics),
                "computation_time": computation_time,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Analytics computation task failed: {e!s}")
            return {"status": "failed", "error": str(e)}


class TaskScheduler:
    """Advanced task scheduler with cron-like functionality"""

    def __init__(self):
        self.task_queue = TaskQueue()
        self.scheduled_tasks = {}
        self.is_running = False

    async def initialize(self):
        """Initialize task scheduler"""
        await self.task_queue.initialize()

    async def schedule_task(self, task: TaskDefinition):
        """Schedule a task for future execution"""
        if task.recurring and task.cron_expression:
            self.scheduled_tasks[task.id] = task
            logger.info(
                f"Scheduled recurring task {task.id} with cron: {task.cron_expression}"
            )
        elif task.scheduled_at:
            await self.task_queue.enqueue(task)
            logger.info("Scheduled one-time task {task.id} for {task.scheduled_at}")
        else:
            # Immediate execution
            await self.task_queue.enqueue(task)

    async def start_scheduler(self):
        """Start the task scheduler"""
        self.is_running = True

        while self.is_running:
            try:
                await asyncio.sleep(60)  # Check every minute

                # Check scheduled tasks
                current_time = datetime.now(timezone.utc)

                for task_id, task in list(self.scheduled_tasks.items()):
                    if self._should_run_task(task, current_time):
                        # Create new instance for execution
                        new_task = TaskDefinition(
                            id=f"{task.id}_{int(current_time.timestamp())}",
                            task_type=task.task_type,
                            priority=task.priority,
                            function_name=task.function_name,
                            args=task.args.copy(),
                            kwargs=task.kwargs.copy(),
                            max_retries=task.max_retries,
                            timeout_seconds=task.timeout_seconds,
                            created_at=current_time,
                        )

                        await self.task_queue.enqueue(new_task)
                        logger.info("Triggered scheduled task {new_task.id}")

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Scheduler error: {e!s}")
                await asyncio.sleep(5)

    def _should_run_task(self, task: TaskDefinition, current_time: datetime) -> bool:
        """Check if a scheduled task should run"""
        # Simplified cron check - in production would use proper cron parsing
        if task.cron_expression == "0 */6 * * *":  # Every 6 hours
            return current_time.minute == 0 and current_time.hour % 6 == 0
        elif task.cron_expression == "0 0 * * *":  # Daily at midnight
            return current_time.hour == 0 and current_time.minute == 0
        elif task.cron_expression == "*/15 * * * *":  # Every 15 minutes
            return current_time.minute % 15 == 0

        return False


class UltraTaskProcessor:
    """Ultra-comprehensive task processing system"""

    def __init__(self):
        self.task_queue = TaskQueue()
        self.scheduler = TaskScheduler()
        self.workers = {}
        self.is_running = False

    async def initialize(self):
        """Initialize the task processing system"""
        await self.task_queue.initialize()
        await self.scheduler.initialize()

        # Schedule default recurring tasks
        await self._schedule_default_tasks()

        logger.info("Ultra task processor initialized")

    async def start_workers(self, num_workers: int = 3):
        """Start task workers"""
        self.is_running = True

        # Start workers
        for i in range(num_workers):
            worker_id = f"worker_{i}"
            worker = TaskWorker(worker_id)
            self.workers[worker_id] = worker

            # Start worker in background
            asyncio.create_task(worker.start())

        # Start scheduler
        asyncio.create_task(self.scheduler.start_scheduler())

        logger.info("Started {num_workers} task workers")

    async def submit_task(self, task: TaskDefinition) -> str:
        """Submit a task for processing"""
        await self.task_queue.enqueue(task)
        return task.id

    async def get_task_result(self, task_id: str) -> Optional[TaskResult]:
        """Get task execution result"""
        return await self.task_queue.get_result(task_id)

    async def get_system_stats(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        queue_stats = await self.task_queue.get_queue_stats()

        # Worker stats
        worker_stats = {}
        for worker_id, worker in self.workers.items():
            worker_stats[worker_id] = {
                "tasks_processed": worker.tasks_processed,
                "tasks_failed": worker.tasks_failed,
                "success_rate": (
                    (worker.tasks_processed - worker.tasks_failed)
                    / max(worker.tasks_processed, 1)
                )
                * 100,
                "avg_execution_time": worker.total_execution_time
                / max(worker.tasks_processed, 1),
                "is_running": worker.is_running,
            }

        return {
            "queue_stats": queue_stats,
            "worker_stats": worker_stats,
            "scheduled_tasks": len(self.scheduler.scheduled_tasks),
            "system_running": self.is_running,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def _schedule_default_tasks(self):
        """Schedule default recurring tasks"""
        default_tasks = [
            TaskDefinition(
                id="data_cleanup_daily",
                task_type=TaskType.DATA_CLEANUP,
                priority=TaskPriority.LOW,
                function_name="cleanup_task",
                kwargs={"cleanup_type": "old_predictions", "days_old": 30},
                recurring=True,
                cron_expression="0 0 * * *",  # Daily at midnight
            ),
            TaskDefinition(
                id="backup_daily",
                task_type=TaskType.BACKUP_CREATION,
                priority=TaskPriority.MEDIUM,
                function_name="backup_task",
                kwargs={"backup_type": "incremental", "data_size_mb": 2000},
                recurring=True,
                cron_expression="0 0 * * *",  # Daily at midnight
            ),
            TaskDefinition(
                id="cache_warming_periodic",
                task_type=TaskType.CACHE_WARMING,
                priority=TaskPriority.LOW,
                function_name="cache_warming_task",
                kwargs={"cache_keys": ["popular_predictions", "top_opportunities"]},
                recurring=True,
                cron_expression="*/15 * * * *",  # Every 15 minutes
            ),
            TaskDefinition(
                id="performance_analysis_hourly",
                task_type=TaskType.PERFORMANCE_ANALYSIS,
                priority=TaskPriority.MEDIUM,
                function_name="performance_analysis_task",
                kwargs={"analysis_type": "hourly_metrics", "metrics_count": 25},
                recurring=True,
                cron_expression="0 */6 * * *",  # Every 6 hours
            ),
        ]

        for task in default_tasks:
            await self.scheduler.schedule_task(task)

        logger.info("Scheduled {len(default_tasks)} default recurring tasks")


# Global task processor instance
ultra_task_processor = UltraTaskProcessor()
