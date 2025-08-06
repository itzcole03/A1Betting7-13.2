"""
Background Task Manager for FastAPI
Implements 2024-2025 best practices for background processing and task queues.
"""

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set

try:
    from backend.services.advanced_caching_system import advanced_caching_system
    from backend.services.production_logging_service import (
        SystemHealthMetrics,
        production_logger,
    )
    from backend.utils.structured_logging import app_logger, task_logger
except ImportError:
    import logging

    app_logger = logging.getLogger("background_tasks")
    task_logger = logging.getLogger("tasks")
    advanced_caching_system = None
    production_logger = None


class TaskStatus(Enum):
    """Task execution status"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class TaskPriority(Enum):
    """Task priority levels"""

    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class TaskResult:
    """Task execution result"""

    task_id: str
    status: TaskStatus
    result: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0


@dataclass
class TaskConfig:
    """Task configuration"""

    max_retries: int = 3
    retry_delay: float = 1.0  # seconds
    retry_backoff: float = 2.0  # exponential backoff multiplier
    timeout: Optional[float] = None  # seconds
    priority: TaskPriority = TaskPriority.NORMAL
    cache_result: bool = False
    cache_ttl: int = 300  # seconds


@dataclass
class BackgroundTask:
    """Background task definition"""

    id: str
    name: str
    func: Callable
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    config: TaskConfig = field(default_factory=TaskConfig)
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Any = None
    error: Optional[str] = None
    retry_count: int = 0
    execution_time: float = 0.0


class TaskQueue:
    """Priority-based task queue"""

    def __init__(self):
        self._queues = {
            TaskPriority.CRITICAL: asyncio.Queue(),
            TaskPriority.HIGH: asyncio.Queue(),
            TaskPriority.NORMAL: asyncio.Queue(),
            TaskPriority.LOW: asyncio.Queue(),
        }
        self._task_count = 0

    async def put(self, task: BackgroundTask):
        """Add task to appropriate priority queue"""
        await self._queues[task.config.priority].put(task)
        self._task_count += 1

    async def get(self) -> BackgroundTask:
        """Get next task by priority with comprehensive logging"""
        start_time = time.time()

        # Log the attempt to get next task
        if production_logger:
            production_logger.log_async_operation_debug(
                "task_queue_get",
                {
                    "queue_sizes": {
                        priority.name: queue.qsize()
                        for priority, queue in self._queues.items()
                    },
                    "total_tasks": self._task_count,
                },
            )

        # Check queues in priority order
        for priority in [
            TaskPriority.CRITICAL,
            TaskPriority.HIGH,
            TaskPriority.NORMAL,
            TaskPriority.LOW,
        ]:
            queue = self._queues[priority]
            if not queue.empty():
                task = await queue.get()
                self._task_count -= 1

                # Log successful task retrieval
                if production_logger:
                    production_logger.log_background_task_status(
                        str(task.task_id),
                        "RETRIEVED",
                        {
                            "priority": priority.name,
                            "queue_method": "priority_order",
                            "retrieval_time_ms": (time.time() - start_time) * 1000,
                            "remaining_tasks": self._task_count,
                        },
                    )

                return task

        # If all queues are empty, wait for any task using the FIXED asyncio pattern
        try:
            # 🔧 CRITICAL FIX: Wrap coroutines with asyncio.create_task()
            tasks = [
                asyncio.create_task(queue.get()) for queue in self._queues.values()
            ]

            if production_logger:
                production_logger.log_async_operation_debug(
                    "waiting_for_tasks",
                    {
                        "created_tasks": len(tasks),
                        "coroutine_wrapping": "FIXED_WITH_CREATE_TASK",
                        "previous_issue": "passing_naked_coroutines_forbidden",
                    },
                )

            done, pending = await asyncio.wait(
                tasks, return_when=asyncio.FIRST_COMPLETED
            )

        except Exception as e:
            if production_logger:
                production_logger.log_critical_error(
                    "TASK_QUEUE_GET_FAILED",
                    {
                        "error": str(e),
                        "queue_sizes": {
                            priority.name: queue.qsize()
                            for priority, queue in self._queues.items()
                        },
                        "operation": "asyncio_wait_with_create_task",
                    },
                )
            raise

        # Cancel pending tasks
        for task in pending:
            task.cancel()

        # Return the completed task
        result = done.pop().result()
        self._task_count -= 1

        # Log successful task retrieval from wait operation
        if production_logger:
            production_logger.log_background_task_status(
                str(result.task_id),
                "RETRIEVED",
                {
                    "queue_method": "asyncio_wait",
                    "retrieval_time_ms": (time.time() - start_time) * 1000,
                    "remaining_tasks": self._task_count,
                    "cancelled_pending": len(pending),
                },
            )

        return result

    def qsize(self) -> int:
        """Get total queue size"""
        return self._task_count

    def empty(self) -> bool:
        """Check if all queues are empty"""
        return self._task_count == 0


class WorkerPool:
    """Pool of background task workers"""

    def __init__(self, size: int = 4):
        self.size = size
        self.workers: List[asyncio.Task] = []
        self._shutdown = False

    async def start(self, task_queue: TaskQueue, task_manager: "BackgroundTaskManager"):
        """Start worker pool"""
        self.workers = [
            asyncio.create_task(self._worker(task_queue, task_manager, i))
            for i in range(self.size)
        ]
        app_logger.info(f"Started {self.size} background task workers")

    async def stop(self):
        """Stop worker pool gracefully"""
        self._shutdown = True

        # Cancel all workers
        for worker in self.workers:
            worker.cancel()

        # Wait for workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        app_logger.info("Background task workers stopped")

    async def _worker(
        self,
        task_queue: TaskQueue,
        task_manager: "BackgroundTaskManager",
        worker_id: int,
    ):
        """Worker coroutine"""
        app_logger.info(f"Background worker {worker_id} started")

        while not self._shutdown:
            try:
                # Get next task
                task = await asyncio.wait_for(task_queue.get(), timeout=1.0)
                await task_manager._execute_task(task)

            except asyncio.TimeoutError:
                # No tasks available, continue
                continue
            except asyncio.CancelledError:
                # Worker was cancelled
                break
            except Exception as e:
                app_logger.error(f"Worker {worker_id} error: {e}")

        app_logger.info(f"Background worker {worker_id} stopped")


class BackgroundTaskManager:
    """
    Advanced background task manager with priority queues, retries, and monitoring
    """

    def __init__(self, worker_pool_size: int = 4):
        self.task_queue = TaskQueue()
        self.worker_pool = WorkerPool(worker_pool_size)
        self.tasks: Dict[str, BackgroundTask] = {}
        self.scheduled_tasks: Dict[str, asyncio.Task] = {}
        self._running = False
        self._stats = {
            "total_tasks": 0,
            "completed_tasks": 0,
            "failed_tasks": 0,
            "cancelled_tasks": 0,
            "total_execution_time": 0.0,
        }

    async def start(self):
        """Start the task manager"""
        if self._running:
            return

        self._running = True
        await self.worker_pool.start(self.task_queue, self)
        app_logger.info("Background task manager started")

    async def stop(self):
        """Stop the task manager gracefully"""
        if not self._running:
            return

        self._running = False

        # Cancel all scheduled tasks
        for task_id, scheduled_task in self.scheduled_tasks.items():
            scheduled_task.cancel()
            if task_id in self.tasks:
                self.tasks[task_id].status = TaskStatus.CANCELLED

        # Stop worker pool
        await self.worker_pool.stop()
        app_logger.info("Background task manager stopped")

    def add_task(
        self,
        func: Callable,
        *args,
        name: Optional[str] = None,
        config: Optional[TaskConfig] = None,
        delay: Optional[float] = None,
        **kwargs,
    ) -> str:
        """Add a background task"""

        task_id = str(uuid.uuid4())
        task_name = name or func.__name__
        task_config = config or TaskConfig()

        task = BackgroundTask(
            id=task_id,
            name=task_name,
            func=func,
            args=args,
            kwargs=kwargs,
            config=task_config,
        )

        self.tasks[task_id] = task
        self._stats["total_tasks"] += 1

        # Log task addition with production logging
        if production_logger:
            production_logger.log_background_task_status(
                task_name,
                "ADDED",
                {
                    "task_id": task_id[:8],
                    "priority": task_config.priority.name,
                    "delay_seconds": delay,
                    "total_tasks": self._stats["total_tasks"],
                    "queue_size": self.task_queue.qsize(),
                },
            )

        if delay:
            # Schedule task for later execution
            task.scheduled_at = datetime.now() + timedelta(seconds=delay)
            scheduled_task = asyncio.create_task(self._schedule_task(task, delay))
            self.scheduled_tasks[task_id] = scheduled_task

            if production_logger:
                production_logger.log_background_task_status(
                    task_name,
                    "SCHEDULED",
                    {
                        "task_id": task_id[:8],
                        "delay_seconds": delay,
                        "scheduled_at": task.scheduled_at.isoformat(),
                    },
                )
        else:
            # Add to queue immediately
            asyncio.create_task(self.task_queue.put(task))

            if production_logger:
                production_logger.log_background_task_status(
                    task_name,
                    "QUEUED",
                    {
                        "task_id": task_id[:8],
                        "queue_priority": task_config.priority.name,
                    },
                )

        task_logger.info(f"Task added: {task_name} ({task_id[:8]})")
        return task_id

    async def _schedule_task(self, task: BackgroundTask, delay: float):
        """Schedule a task for delayed execution"""
        try:
            await asyncio.sleep(delay)
            await self.task_queue.put(task)

            # Remove from scheduled tasks
            if task.id in self.scheduled_tasks:
                del self.scheduled_tasks[task.id]

        except asyncio.CancelledError:
            task.status = TaskStatus.CANCELLED
            self._stats["cancelled_tasks"] += 1

    async def _execute_task(self, task: BackgroundTask):
        """Execute a background task"""

        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now()
        start_time = time.time()

        task_logger.info(f"Executing task: {task.name} ({task.id[:8]})")

        try:
            # Set timeout if specified
            if task.config.timeout:
                result = await asyncio.wait_for(
                    self._run_task_function(task), timeout=task.config.timeout
                )
            else:
                result = await self._run_task_function(task)

            # Task completed successfully
            execution_time = time.time() - start_time
            task.status = TaskStatus.COMPLETED
            task.result = result
            task.completed_at = datetime.now()
            task.execution_time = execution_time

            self._stats["completed_tasks"] += 1
            self._stats["total_execution_time"] += execution_time

            # Cache result if enabled
            if task.config.cache_result and advanced_caching_system:
                cache_key = f"task_result:{task.id}"
                await advanced_caching_system.set(
                    cache_key, result, task.config.cache_ttl
                )

            task_logger.info(
                f"Task completed: {task.name} ({task.id[:8]}) "
                f"in {execution_time:.3f}s"
            )

        except asyncio.TimeoutError:
            await self._handle_task_timeout(task, start_time)
        except Exception as e:
            await self._handle_task_error(task, e, start_time)

    async def _run_task_function(self, task: BackgroundTask) -> Any:
        """Run the actual task function"""

        if asyncio.iscoroutinefunction(task.func):
            return await task.func(*task.args, **task.kwargs)
        else:
            # Run sync function in thread pool
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None, lambda: task.func(*task.args, **task.kwargs)
            )

    async def _handle_task_timeout(self, task: BackgroundTask, start_time: float):
        """Handle task timeout"""
        execution_time = time.time() - start_time
        error_msg = f"Task timed out after {task.config.timeout}s"

        if task.retry_count < task.config.max_retries:
            await self._retry_task(task, error_msg)
        else:
            task.status = TaskStatus.FAILED
            task.error = error_msg
            task.completed_at = datetime.now()
            task.execution_time = execution_time

            self._stats["failed_tasks"] += 1
            self._stats["total_execution_time"] += execution_time

            task_logger.error(f"Task failed (timeout): {task.name} ({task.id[:8]})")

    async def _handle_task_error(
        self, task: BackgroundTask, error: Exception, start_time: float
    ):
        """Handle task execution error"""
        execution_time = time.time() - start_time
        error_msg = str(error)

        if task.retry_count < task.config.max_retries:
            await self._retry_task(task, error_msg)
        else:
            task.status = TaskStatus.FAILED
            task.error = error_msg
            task.completed_at = datetime.now()
            task.execution_time = execution_time

            self._stats["failed_tasks"] += 1
            self._stats["total_execution_time"] += execution_time

            task_logger.error(f"Task failed: {task.name} ({task.id[:8]}) - {error_msg}")

    async def _retry_task(self, task: BackgroundTask, error_msg: str):
        """Retry a failed task"""
        task.retry_count += 1
        task.status = TaskStatus.RETRYING
        task.error = error_msg

        # Calculate retry delay with exponential backoff
        delay = task.config.retry_delay * (
            task.config.retry_backoff ** (task.retry_count - 1)
        )

        task_logger.warning(
            f"Retrying task: {task.name} ({task.id[:8]}) "
            f"- attempt {task.retry_count}/{task.config.max_retries} "
            f"in {delay:.1f}s"
        )

        # Schedule retry
        scheduled_task = asyncio.create_task(self._schedule_task(task, delay))
        self.scheduled_tasks[task.id] = scheduled_task

    def get_task_status(self, task_id: str) -> Optional[TaskResult]:
        """Get task status and result"""

        if task_id not in self.tasks:
            return None

        task = self.tasks[task_id]

        return TaskResult(
            task_id=task.id,
            status=task.status,
            result=task.result,
            error=task.error,
            execution_time=task.execution_time,
            started_at=task.started_at,
            completed_at=task.completed_at,
            retry_count=task.retry_count,
        )

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending or scheduled task"""

        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]

        if task.status in [
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.CANCELLED,
        ]:
            return False

        # Cancel scheduled task if exists
        if task_id in self.scheduled_tasks:
            self.scheduled_tasks[task_id].cancel()
            del self.scheduled_tasks[task_id]

        task.status = TaskStatus.CANCELLED
        task.completed_at = datetime.now()
        self._stats["cancelled_tasks"] += 1

        task_logger.info(f"Task cancelled: {task.name} ({task_id[:8]})")
        return True

    def get_queue_status(self) -> Dict[str, Any]:
        """Get task queue status"""

        # Count tasks by status
        status_counts = {}
        for status in TaskStatus:
            status_counts[status.value] = sum(
                1 for task in self.tasks.values() if task.status == status
            )

        # Count tasks by priority in queue
        priority_counts = {}
        for priority in TaskPriority:
            priority_counts[priority.value] = self.task_queue._queues[priority].qsize()

        return {
            "queue_size": self.task_queue.qsize(),
            "worker_pool_size": self.worker_pool.size,
            "running": self._running,
            "total_tasks": len(self.tasks),
            "scheduled_tasks": len(self.scheduled_tasks),
            "status_distribution": status_counts,
            "priority_distribution": priority_counts,
            "statistics": self._stats.copy(),
        }

    def get_task_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent task history"""

        # Sort tasks by creation time (most recent first)
        sorted_tasks = sorted(
            self.tasks.values(), key=lambda t: t.created_at, reverse=True
        )

        return [
            {
                "id": task.id[:8],
                "name": task.name,
                "status": task.status.value,
                "created_at": task.created_at.isoformat(),
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": (
                    task.completed_at.isoformat() if task.completed_at else None
                ),
                "execution_time": round(task.execution_time, 3),
                "retry_count": task.retry_count,
                "priority": task.config.priority.value,
                "error": task.error[:100] if task.error else None,  # Truncate error
            }
            for task in sorted_tasks[:limit]
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Perform background task manager health check"""

        queue_size = self.task_queue.qsize()

        # Calculate success rate
        total_completed = self._stats["completed_tasks"] + self._stats["failed_tasks"]
        success_rate = (
            self._stats["completed_tasks"] / total_completed
            if total_completed > 0
            else 1.0
        )

        # Calculate average execution time
        avg_execution_time = (
            self._stats["total_execution_time"] / self._stats["completed_tasks"]
            if self._stats["completed_tasks"] > 0
            else 0.0
        )

        health = {
            "status": "healthy",
            "running": self._running,
            "queue_size": queue_size,
            "worker_count": len(self.worker_pool.workers),
            "success_rate": round(success_rate, 3),
            "avg_execution_time": round(avg_execution_time, 3),
            "statistics": self._stats.copy(),
        }

        # Determine health status
        if queue_size > 100:  # Queue getting backed up
            health["status"] = "degraded"
        elif not self._running or success_rate < 0.8:  # Not running or low success rate
            health["status"] = "unhealthy"

        return health


# Global instance
background_task_manager = BackgroundTaskManager()


# Convenience functions
def add_background_task(
    func: Callable,
    *args,
    name: Optional[str] = None,
    config: Optional[TaskConfig] = None,
    delay: Optional[float] = None,
    **kwargs,
) -> str:
    """Add a background task"""
    return background_task_manager.add_task(
        func, *args, name=name, config=config, delay=delay, **kwargs
    )


async def start_background_tasks():
    """Start background task processing"""
    await background_task_manager.start()


async def stop_background_tasks():
    """Stop background task processing"""
    await background_task_manager.stop()
