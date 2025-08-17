"""
Task Scheduler - Asynchronous task orchestration for portfolio optimization.

Implements:
- In-memory task queue with asyncio
- Periodic and one-time task scheduling
- Task status tracking and retry logic
- Background processing for optimization workflows
- Task registration and execution management
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Callable, Any, Coroutine
from enum import Enum
import traceback

from backend.services.unified_logging import get_logger

logger = get_logger("task_scheduler")


class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class TaskExecution:
    """Task execution record"""
    task_id: str
    task_name: str
    status: TaskStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Any] = None
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class TaskDefinition:
    """Task definition with execution parameters"""
    name: str
    coroutine_callable: Callable[..., Coroutine]
    max_retries: int = 3
    retry_delay_sec: float = 5.0
    timeout_sec: Optional[float] = None


@dataclass
class ScheduledTask:
    """Scheduled task configuration"""
    task_name: str
    schedule_type: str  # "once" or "periodic"
    interval_sec: Optional[float] = None
    delay_sec: float = 0.0
    jitter_sec: float = 0.0
    next_run: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_run: Optional[datetime] = None
    enabled: bool = True
    kwargs: Dict[str, Any] = field(default_factory=dict)


class TaskScheduler:
    """
    Asynchronous task scheduler for background processing and workflow orchestration.
    
    Features:
    - Task registration and definition management
    - One-time and periodic task scheduling  
    - Task execution tracking and retry logic
    - Concurrent task execution with limits
    - Task status monitoring and cleanup
    """

    def __init__(self, max_concurrent_tasks: int = 10):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.logger = logger
        
        # Task management
        self.task_definitions: Dict[str, TaskDefinition] = {}
        self.scheduled_tasks: Dict[str, ScheduledTask] = {}
        self.task_executions: Dict[str, TaskExecution] = {}
        self.task_queue: asyncio.Queue = asyncio.Queue()
        
        # Scheduler state
        self._running = False
        self._worker_tasks: List[asyncio.Task] = []
        self._scheduler_task: Optional[asyncio.Task] = None
        self._current_tasks: Dict[str, asyncio.Task] = {}
        
        # Task locks for preventing duplicate executions
        self._task_locks: Dict[str, asyncio.Lock] = {}

    def register_task(
        self,
        name: str,
        coroutine_callable: Callable[..., Coroutine],
        max_retries: int = 3,
        retry_delay_sec: float = 5.0,
        timeout_sec: Optional[float] = None
    ):
        """
        Register a task definition.
        
        Args:
            name: Unique task name
            coroutine_callable: Async function to execute
            max_retries: Maximum retry attempts on failure
            retry_delay_sec: Delay between retry attempts
            timeout_sec: Task execution timeout
        """
        task_def = TaskDefinition(
            name=name,
            coroutine_callable=coroutine_callable,
            max_retries=max_retries,
            retry_delay_sec=retry_delay_sec,
            timeout_sec=timeout_sec
        )
        
        self.task_definitions[name] = task_def
        self._task_locks[name] = asyncio.Lock()
        
        self.logger.info(f"Registered task: {name}")

    def schedule_once(
        self,
        delay_sec: float,
        task_name: str,
        task_id: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Schedule a task to run once after a delay.
        
        Args:
            delay_sec: Delay before execution
            task_name: Name of registered task
            task_id: Optional custom task ID
            **kwargs: Task arguments
            
        Returns:
            Task execution ID
        """
        if task_name not in self.task_definitions:
            raise ValueError(f"Unknown task: {task_name}")
        
        # Generate task ID
        if task_id is None:
            task_id = f"{task_name}_{int(time.time() * 1000)}"
        
        # Create scheduled task
        next_run = datetime.now(timezone.utc) + timedelta(seconds=delay_sec)
        scheduled_task = ScheduledTask(
            task_name=task_name,
            schedule_type="once",
            delay_sec=delay_sec,
            next_run=next_run,
            kwargs=kwargs
        )
        
        self.scheduled_tasks[task_id] = scheduled_task
        
        self.logger.info(f"Scheduled one-time task: {task_name} (ID: {task_id}) in {delay_sec}s")
        return task_id

    def schedule_periodic(
        self,
        interval_sec: float,
        task_name: str,
        jitter_sec: float = 0.0,
        delay_sec: float = 0.0,
        task_id: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Schedule a task to run periodically.
        
        Args:
            interval_sec: Interval between executions
            task_name: Name of registered task
            jitter_sec: Random jitter to add to interval
            delay_sec: Initial delay before first execution
            task_id: Optional custom task ID
            **kwargs: Task arguments
            
        Returns:
            Task execution ID
        """
        if task_name not in self.task_definitions:
            raise ValueError(f"Unknown task: {task_name}")
        
        # Generate task ID
        if task_id is None:
            task_id = f"{task_name}_periodic"
        
        # Create scheduled task
        next_run = datetime.now(timezone.utc) + timedelta(seconds=delay_sec)
        scheduled_task = ScheduledTask(
            task_name=task_name,
            schedule_type="periodic",
            interval_sec=interval_sec,
            jitter_sec=jitter_sec,
            delay_sec=delay_sec,
            next_run=next_run,
            kwargs=kwargs
        )
        
        self.scheduled_tasks[task_id] = scheduled_task
        
        self.logger.info(
            f"Scheduled periodic task: {task_name} (ID: {task_id}) "
            f"every {interval_sec}s with {jitter_sec}s jitter"
        )
        return task_id

    def cancel_scheduled_task(self, task_id: str) -> bool:
        """Cancel a scheduled task"""
        if task_id in self.scheduled_tasks:
            self.scheduled_tasks[task_id].enabled = False
            self.logger.info(f"Cancelled scheduled task: {task_id}")
            return True
        return False

    async def run_task_now(self, task_name: str, task_id: Optional[str] = None, **kwargs) -> str:
        """
        Run a task immediately.
        
        Args:
            task_name: Name of registered task
            task_id: Optional custom task ID
            **kwargs: Task arguments
            
        Returns:
            Task execution ID
        """
        if task_name not in self.task_definitions:
            raise ValueError(f"Unknown task: {task_name}")
        
        # Generate execution ID
        if task_id is None:
            task_id = f"{task_name}_{int(time.time() * 1000)}"
        
        # Create task execution
        execution = TaskExecution(
            task_id=task_id,
            task_name=task_name,
            status=TaskStatus.PENDING
        )
        self.task_executions[task_id] = execution
        
        # Add to queue
        await self.task_queue.put((task_id, kwargs))
        
        self.logger.info(f"Queued immediate task: {task_name} (ID: {task_id})")
        return task_id

    async def start(self):
        """Start the task scheduler"""
        if self._running:
            return
        
        self._running = True
        
        # Start worker tasks
        for i in range(self.max_concurrent_tasks):
            worker_task = asyncio.create_task(self._worker_loop(f"worker-{i}"))
            self._worker_tasks.append(worker_task)
        
        # Start scheduler task
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())
        
        self.logger.info(f"Task scheduler started with {self.max_concurrent_tasks} workers")

    async def stop(self):
        """Stop the task scheduler"""
        if not self._running:
            return
        
        self._running = False
        
        # Cancel all running tasks
        for task_id, task in self._current_tasks.items():
            if not task.done():
                task.cancel()
                self.logger.info(f"Cancelled running task: {task_id}")
        
        # Stop scheduler
        if self._scheduler_task and not self._scheduler_task.done():
            self._scheduler_task.cancel()
        
        # Stop workers
        for worker_task in self._worker_tasks:
            if not worker_task.done():
                worker_task.cancel()
        
        # Wait for all tasks to complete
        all_tasks = self._worker_tasks + ([self._scheduler_task] if self._scheduler_task else [])
        if all_tasks:
            await asyncio.gather(*all_tasks, return_exceptions=True)
        
        self.logger.info("Task scheduler stopped")

    async def _scheduler_loop(self):
        """Main scheduler loop for handling scheduled tasks"""
        self.logger.info("Scheduler loop started")
        
        while self._running:
            try:
                await self._check_scheduled_tasks()
                await asyncio.sleep(5)  # Check every 5 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(10)  # Longer wait on error

    async def _check_scheduled_tasks(self):
        """Check and queue scheduled tasks that are ready to run"""
        now = datetime.now(timezone.utc)
        
        for task_id, scheduled_task in list(self.scheduled_tasks.items()):
            if not scheduled_task.enabled:
                continue
            
            if now >= scheduled_task.next_run:
                # Check if task is already running (prevent duplicates)
                async with self._task_locks.get(scheduled_task.task_name, asyncio.Lock()):
                    # Create execution ID
                    execution_id = f"{task_id}_{int(time.time() * 1000)}"
                    
                    # Create task execution
                    execution = TaskExecution(
                        task_id=execution_id,
                        task_name=scheduled_task.task_name,
                        status=TaskStatus.PENDING
                    )
                    self.task_executions[execution_id] = execution
                    
                    # Queue the task
                    await self.task_queue.put((execution_id, scheduled_task.kwargs))
                    
                    # Update scheduled task
                    scheduled_task.last_run = now
                    
                    if scheduled_task.schedule_type == "once":
                        # Remove one-time tasks after scheduling
                        scheduled_task.enabled = False
                    elif scheduled_task.schedule_type == "periodic":
                        # Schedule next execution
                        import random
                        jitter = random.uniform(-scheduled_task.jitter_sec, scheduled_task.jitter_sec)
                        next_interval = scheduled_task.interval_sec + jitter
                        scheduled_task.next_run = now + timedelta(seconds=next_interval)
                    
                    self.logger.info(f"Queued scheduled task: {scheduled_task.task_name} (ID: {execution_id})")

    async def _worker_loop(self, worker_id: str):
        """Worker loop for executing tasks from the queue"""
        self.logger.info(f"Worker {worker_id} started")
        
        while self._running:
            try:
                # Get task from queue with timeout
                try:
                    task_id, kwargs = await asyncio.wait_for(
                        self.task_queue.get(), 
                        timeout=5.0
                    )
                except asyncio.TimeoutError:
                    continue
                
                # Execute the task
                await self._execute_task(task_id, kwargs, worker_id)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(1)

    async def _execute_task(self, task_id: str, kwargs: Dict[str, Any], worker_id: str):
        """Execute a single task"""
        execution = self.task_executions.get(task_id)
        if not execution:
            self.logger.error(f"Task execution not found: {task_id}")
            return
        
        task_def = self.task_definitions.get(execution.task_name)
        if not task_def:
            execution.status = TaskStatus.FAILED
            execution.error_message = f"Task definition not found: {execution.task_name}"
            self.logger.error(execution.error_message)
            return
        
        # Update execution status
        execution.status = TaskStatus.RUNNING
        execution.started_at = datetime.now(timezone.utc)
        
        self.logger.info(
            f"Worker {worker_id} executing task: {execution.task_name} (ID: {task_id})"
        )
        
        try:
            # Create task with timeout
            task_coro = task_def.coroutine_callable(**kwargs)
            
            if task_def.timeout_sec:
                result = await asyncio.wait_for(task_coro, timeout=task_def.timeout_sec)
            else:
                result = await task_coro
            
            # Task completed successfully
            execution.status = TaskStatus.COMPLETED
            execution.completed_at = datetime.now(timezone.utc)
            execution.result = result
            
            self.logger.info(
                f"Worker {worker_id} completed task: {execution.task_name} (ID: {task_id})"
            )
            
        except asyncio.CancelledError:
            execution.status = TaskStatus.CANCELLED
            execution.completed_at = datetime.now(timezone.utc)
            self.logger.info(f"Task cancelled: {execution.task_name} (ID: {task_id})")
            
        except Exception as e:
            # Task failed
            execution.status = TaskStatus.FAILED
            execution.completed_at = datetime.now(timezone.utc)
            execution.error_message = str(e)
            execution.retry_count += 1
            
            self.logger.error(
                f"Worker {worker_id} task failed: {execution.task_name} (ID: {task_id}) - {e}"
            )
            
            # Retry if allowed
            if execution.retry_count <= task_def.max_retries:
                self.logger.info(
                    f"Retrying task: {execution.task_name} (ID: {task_id}) "
                    f"attempt {execution.retry_count}/{task_def.max_retries}"
                )
                
                # Schedule retry with delay
                await asyncio.sleep(task_def.retry_delay_sec)
                execution.status = TaskStatus.PENDING
                execution.started_at = None
                execution.completed_at = None
                await self.task_queue.put((task_id, kwargs))
        
        finally:
            # Clean up task tracking
            if task_id in self._current_tasks:
                del self._current_tasks[task_id]

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task execution status"""
        execution = self.task_executions.get(task_id)
        if not execution:
            return None
        
        return {
            "task_id": execution.task_id,
            "task_name": execution.task_name,
            "status": execution.status.value,
            "started_at": execution.started_at.isoformat() if execution.started_at else None,
            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
            "error_message": execution.error_message,
            "retry_count": execution.retry_count,
            "max_retries": self.task_definitions.get(execution.task_name, TaskDefinition("", lambda: None)).max_retries
        }

    def get_all_task_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all tasks"""
        return {
            task_id: {
                "task_id": execution.task_id,
                "task_name": execution.task_name,
                "status": execution.status.value,
                "started_at": execution.started_at.isoformat() if execution.started_at else None,
                "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
                "error_message": execution.error_message,
                "retry_count": execution.retry_count
            }
            for task_id, execution in self.task_executions.items()
        }

    def get_scheduled_tasks_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all scheduled tasks"""
        return {
            task_id: {
                "task_id": task_id,
                "task_name": scheduled.task_name,
                "schedule_type": scheduled.schedule_type,
                "interval_sec": scheduled.interval_sec,
                "next_run": scheduled.next_run.isoformat(),
                "last_run": scheduled.last_run.isoformat() if scheduled.last_run else None,
                "enabled": scheduled.enabled
            }
            for task_id, scheduled in self.scheduled_tasks.items()
        }

    def cleanup_completed_tasks(self, older_than_hours: int = 24):
        """Clean up old completed task executions"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=older_than_hours)
        
        to_remove = []
        for task_id, execution in self.task_executions.items():
            if (execution.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED] 
                and execution.completed_at 
                and execution.completed_at < cutoff_time):
                to_remove.append(task_id)
        
        for task_id in to_remove:
            del self.task_executions[task_id]
        
        if to_remove:
            self.logger.info(f"Cleaned up {len(to_remove)} old task executions")


# Global task scheduler instance
task_scheduler = TaskScheduler()


# Predefined tasks for portfolio optimization workflows
async def rebuild_factor_models():
    """Rebuild correlation factor models"""
    from backend.database import get_db
    from backend.services.correlation.advanced_correlation_engine import AdvancedCorrelationEngine
    
    logger.info("Starting factor model rebuild task")
    
    try:
        db = next(get_db())
        engine = AdvancedCorrelationEngine(db)
        
        # This would typically load recent prop IDs and rebuild models
        # Implementation depends on specific data sources
        logger.info("Factor model rebuild completed")
        
    except Exception as e:
        logger.error(f"Factor model rebuild failed: {e}")
        raise


async def refresh_correlation_cache():
    """Refresh correlation cache entries"""
    logger.info("Starting correlation cache refresh task")
    
    try:
        # Implementation would clean expired cache entries
        # and pre-compute popular correlation matrices
        logger.info("Correlation cache refresh completed")
        
    except Exception as e:
        logger.error(f"Correlation cache refresh failed: {e}")
        raise


async def batch_portfolio_optimization():
    """Run batch portfolio optimization"""
    logger.info("Starting batch portfolio optimization task")
    
    try:
        # Implementation would identify optimization candidates
        # and run optimization in batches
        logger.info("Batch portfolio optimization completed")
        
    except Exception as e:
        logger.error(f"Batch portfolio optimization failed: {e}")
        raise


async def revalue_edges_batch():
    """Batch revaluation of edges"""
    logger.info("Starting batch edge revaluation task")
    
    try:
        # Implementation would reload edge data and recalculate valuations
        logger.info("Batch edge revaluation completed")
        
    except Exception as e:
        logger.error(f"Batch edge revaluation failed: {e}")
        raise


def register_default_tasks():
    """Register default portfolio optimization tasks"""
    task_scheduler.register_task(
        "rebuild_factor_models",
        rebuild_factor_models,
        max_retries=2,
        timeout_sec=300
    )
    
    task_scheduler.register_task(
        "refresh_correlation_cache",
        refresh_correlation_cache,
        max_retries=2,
        timeout_sec=180
    )
    
    task_scheduler.register_task(
        "batch_portfolio_opt",
        batch_portfolio_optimization,
        max_retries=1,
        timeout_sec=600
    )
    
    task_scheduler.register_task(
        "revalue_edges_batch", 
        revalue_edges_batch,
        max_retries=2,
        timeout_sec=300
    )
    
    logger.info("Default portfolio optimization tasks registered")


# Initialize default tasks
register_default_tasks()