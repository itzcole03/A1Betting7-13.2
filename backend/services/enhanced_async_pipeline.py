"""
Enhanced Async Processing Pipeline - Priority 2 Implementation
Advanced async processing with circuit breakers, retry mechanisms, and throughput optimization
"""

import asyncio
import logging
import time
from collections import deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
from typing import Any, AsyncIterator, Callable, Dict, Generic, List, Optional, TypeVar

from backend.services.optimized_redis_service import OptimizedRedisService
from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_async_pipeline")

T = TypeVar("T")
R = TypeVar("R")


class CircuitState(Enum):
    """Circuit breaker states"""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Circuit is open, rejecting calls
    HALF_OPEN = "half_open"  # Testing if service is back


class ProcessingState(Enum):
    """Processing pipeline states"""

    IDLE = "idle"
    PROCESSING = "processing"
    THROTTLED = "throttled"
    ERROR = "error"
    RECOVERING = "recovering"


@dataclass
class PipelineMetrics:
    """Pipeline performance metrics"""

    total_processed: int = 0
    successful_processed: int = 0
    failed_processed: int = 0
    average_processing_time: float = 0.0
    current_throughput: float = 0.0
    queue_size: int = 0
    active_workers: int = 0
    circuit_breaker_state: CircuitState = CircuitState.CLOSED
    last_error: Optional[str] = None
    error_rate: float = 0.0


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""

    failure_threshold: int = 5
    recovery_timeout: int = 60
    success_threshold: int = 3
    timeout: float = 30.0


@dataclass
class RetryConfig:
    """Retry configuration"""

    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_backoff: bool = True
    jitter: bool = True


class CircuitBreaker:
    """Circuit breaker for fault tolerance"""

    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.next_attempt_time = None

    async def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == CircuitState.OPEN:
            if self.next_attempt_time and datetime.now() < self.next_attempt_time:
                raise Exception("Circuit breaker is OPEN")
            else:
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker transitioning to HALF_OPEN")

        try:
            # Execute with timeout
            result = await asyncio.wait_for(
                func(*args, **kwargs), timeout=self.config.timeout
            )
            await self._on_success()
            return result

        except Exception as e:
            await self._on_failure(e)
            raise

    async def _on_success(self):
        """Handle successful execution"""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                logger.info("Circuit breaker CLOSED after recovery")
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    async def _on_failure(self, error: Exception):
        """Handle failed execution"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.config.failure_threshold:
            self.state = CircuitState.OPEN
            self.next_attempt_time = datetime.now() + timedelta(
                seconds=self.config.recovery_timeout
            )
            logger.warning(
                f"Circuit breaker OPENED due to {self.failure_count} failures: {error}"
            )

        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            self.next_attempt_time = datetime.now() + timedelta(
                seconds=self.config.recovery_timeout
            )
            logger.warning("Circuit breaker reopened during recovery")


class RetryHandler:
    """Advanced retry handler with exponential backoff"""

    def __init__(self, config: RetryConfig):
        self.config = config

    async def execute(self, func: Callable, *args, **kwargs):
        """Execute function with retry logic"""
        last_exception = None

        for attempt in range(self.config.max_retries + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e

                if attempt == self.config.max_retries:
                    logger.error(f"All retry attempts failed: {e}")
                    break

                # Calculate delay
                delay = self._calculate_delay(attempt)
                logger.warning(
                    f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.2f}s"
                )
                await asyncio.sleep(delay)

        raise last_exception

    def _calculate_delay(self, attempt: int) -> float:
        """Calculate retry delay with exponential backoff and jitter"""
        if self.config.exponential_backoff:
            delay = self.config.base_delay * (2**attempt)
        else:
            delay = self.config.base_delay

        # Apply maximum delay
        delay = min(delay, self.config.max_delay)

        # Add jitter to prevent thundering herd
        if self.config.jitter:
            import random

            delay = delay * (0.5 + random.random() * 0.5)

        return delay


class AsyncWorkQueue(Generic[T]):
    """High-performance async work queue with priority support"""

    def __init__(self, maxsize: int = 10000, priority_levels: int = 3):
        self.priority_levels = priority_levels
        self.queues = [
            asyncio.Queue(maxsize=maxsize // priority_levels)
            for _ in range(priority_levels)
        ]
        self.total_size = 0
        self._not_full = asyncio.Condition()
        self._not_empty = asyncio.Condition()

    async def put(self, item: T, priority: int = 1) -> None:
        """Add item to queue with priority (0=highest, 2=lowest)"""
        priority = max(0, min(priority, self.priority_levels - 1))

        async with self._not_full:
            while self.full():
                await self._not_full.wait()

            await self.queues[priority].put(item)
            self.total_size += 1
            self._not_empty.notify()

    async def get(self) -> T:
        """Get next item from highest priority queue"""
        async with self._not_empty:
            while self.empty():
                await self._not_empty.wait()

            # Check queues by priority (0=highest)
            for queue in self.queues:
                if not queue.empty():
                    item = await queue.get()
                    self.total_size -= 1
                    self._not_full.notify()
                    return item

    def qsize(self) -> int:
        """Get total queue size"""
        return self.total_size

    def empty(self) -> bool:
        """Check if all queues are empty"""
        return self.total_size == 0

    def full(self) -> bool:
        """Check if any queue is full"""
        return any(queue.full() for queue in self.queues)


@dataclass
class WorkItem(Generic[T]):
    """Work item for processing"""

    id: str
    data: T
    priority: int = 1
    created_at: datetime = field(default_factory=datetime.now)
    attempts: int = 0
    max_attempts: int = 3


class EnhancedAsyncPipeline(Generic[T, R]):
    """Enhanced async processing pipeline with fault tolerance"""

    def __init__(
        self,
        name: str,
        processor: Callable[[T], R],
        redis_service: OptimizedRedisService,
        max_workers: int = 10,
        queue_size: int = 10000,
        circuit_breaker_config: Optional[CircuitBreakerConfig] = None,
        retry_config: Optional[RetryConfig] = None,
        batch_size: int = 1,
        batch_timeout: float = 1.0,
    ):
        self.name = name
        self.processor = processor
        self.redis_service = redis_service
        self.max_workers = max_workers
        self.batch_size = batch_size
        self.batch_timeout = batch_timeout

        # Components
        self.work_queue = AsyncWorkQueue[WorkItem[T]](maxsize=queue_size)
        self.circuit_breaker = CircuitBreaker(
            circuit_breaker_config or CircuitBreakerConfig()
        )
        self.retry_handler = RetryHandler(retry_config or RetryConfig())

        # State
        self.workers: List[asyncio.Task] = []
        self.metrics = PipelineMetrics()
        self.is_running = False
        self.state = ProcessingState.IDLE

        # Monitoring
        self.processing_times = deque(maxlen=1000)
        self.error_history = deque(maxlen=100)

    async def start(self):
        """Start the processing pipeline"""
        if self.is_running:
            return

        logger.info(f"Starting enhanced async pipeline: {self.name}")

        self.is_running = True
        self.state = ProcessingState.PROCESSING

        # Start worker tasks
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)

        # Start monitoring task
        self.monitoring_task = asyncio.create_task(self._monitor())

        logger.info(f"Pipeline {self.name} started with {self.max_workers} workers")

    async def stop(self):
        """Stop the processing pipeline"""
        if not self.is_running:
            return

        logger.info(f"Stopping pipeline: {self.name}")

        self.is_running = False
        self.state = ProcessingState.IDLE

        # Cancel all workers
        for worker in self.workers:
            worker.cancel()

        # Cancel monitoring
        if hasattr(self, "monitoring_task"):
            self.monitoring_task.cancel()

        # Wait for workers to finish
        if self.workers:
            await asyncio.gather(*self.workers, return_exceptions=True)

        self.workers.clear()
        logger.info(f"Pipeline {self.name} stopped")

    async def submit(self, item: T, priority: int = 1, item_id: str = None) -> str:
        """Submit item for processing"""
        if not self.is_running:
            raise RuntimeError("Pipeline is not running")

        work_item = WorkItem(
            id=item_id or f"{self.name}-{int(time.time() * 1000000)}",
            data=item,
            priority=priority,
        )

        await self.work_queue.put(work_item, priority)
        logger.debug(f"Submitted work item {work_item.id} to pipeline {self.name}")

        return work_item.id

    async def _worker(self, worker_id: str):
        """Worker coroutine for processing items"""
        logger.info(f"Worker {worker_id} started for pipeline {self.name}")

        while self.is_running:
            try:
                # Get work batch
                batch = await self._get_work_batch()
                if not batch:
                    continue

                # Process batch
                await self._process_batch(batch, worker_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(1)  # Brief pause on error

        logger.info(f"Worker {worker_id} stopped")

    async def _get_work_batch(self) -> List[WorkItem[T]]:
        """Get batch of work items"""
        batch = []
        start_time = time.time()

        # Collect items until batch_size or timeout
        while (
            len(batch) < self.batch_size
            and (time.time() - start_time) < self.batch_timeout
        ):
            try:
                work_item = await asyncio.wait_for(
                    self.work_queue.get(),
                    timeout=self.batch_timeout - (time.time() - start_time),
                )
                batch.append(work_item)
            except asyncio.TimeoutError:
                break

        return batch

    async def _process_batch(self, batch: List[WorkItem[T]], worker_id: str):
        """Process batch of work items"""
        for work_item in batch:
            start_time = time.time()

            try:
                # Process item with circuit breaker and retry
                result = await self.circuit_breaker.call(
                    self.retry_handler.execute, self._process_single_item, work_item
                )

                # Record success
                processing_time = time.time() - start_time
                self.processing_times.append(processing_time)
                self.metrics.successful_processed += 1

                # Cache result if needed
                await self._cache_result(work_item.id, result)

                logger.debug(f"Processed {work_item.id} in {processing_time:.3f}s")

            except Exception as e:
                # Record failure
                processing_time = time.time() - start_time
                self.error_history.append((datetime.now(), str(e)))
                self.metrics.failed_processed += 1
                self.metrics.last_error = str(e)

                logger.error(f"Failed to process {work_item.id}: {e}")

                # Handle retry logic
                work_item.attempts += 1
                if work_item.attempts < work_item.max_attempts:
                    await self.work_queue.put(
                        work_item, priority=2
                    )  # Lower priority for retries

            finally:
                self.metrics.total_processed += 1

    async def _process_single_item(self, work_item: WorkItem[T]) -> R:
        """Process single work item"""
        return await self.processor(work_item.data)

    async def _cache_result(self, item_id: str, result: R):
        """Cache processing result"""
        try:
            cache_key = f"pipeline:{self.name}:result:{item_id}"
            await self.redis_service.set(cache_key, result, ttl=3600)
        except Exception as e:
            logger.warning(f"Failed to cache result for {item_id}: {e}")

    async def _monitor(self):
        """Monitor pipeline performance"""
        while self.is_running:
            try:
                await self._update_metrics()
                await self._log_performance()
                await asyncio.sleep(30)  # Monitor every 30 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Monitor error: {e}")
                await asyncio.sleep(30)

    async def _update_metrics(self):
        """Update pipeline metrics"""
        # Calculate average processing time
        if self.processing_times:
            self.metrics.average_processing_time = sum(self.processing_times) / len(
                self.processing_times
            )

        # Calculate current throughput (items/second)
        if self.processing_times:
            recent_times = list(self.processing_times)[-100:]  # Last 100 items
            if recent_times:
                total_time = sum(recent_times)
                self.metrics.current_throughput = (
                    len(recent_times) / total_time if total_time > 0 else 0
                )

        # Calculate error rate
        total_ops = self.metrics.successful_processed + self.metrics.failed_processed
        self.metrics.error_rate = (
            self.metrics.failed_processed / total_ops if total_ops > 0 else 0
        )

        # Update queue metrics
        self.metrics.queue_size = self.work_queue.qsize()
        self.metrics.active_workers = len([w for w in self.workers if not w.done()])
        self.metrics.circuit_breaker_state = self.circuit_breaker.state

    async def _log_performance(self):
        """Log pipeline performance"""
        logger.info(
            f"Pipeline {self.name} metrics: "
            f"queue={self.metrics.queue_size}, "
            f"workers={self.metrics.active_workers}, "
            f"throughput={self.metrics.current_throughput:.2f}/s, "
            f"avg_time={self.metrics.average_processing_time:.3f}s, "
            f"error_rate={self.metrics.error_rate:.2%}, "
            f"circuit_state={self.metrics.circuit_breaker_state.value}"
        )

    async def get_metrics(self) -> Dict[str, Any]:
        """Get pipeline metrics"""
        await self._update_metrics()
        return {
            "pipeline_name": self.name,
            "state": self.state.value,
            "total_processed": self.metrics.total_processed,
            "successful_processed": self.metrics.successful_processed,
            "failed_processed": self.metrics.failed_processed,
            "queue_size": self.metrics.queue_size,
            "active_workers": self.metrics.active_workers,
            "average_processing_time": self.metrics.average_processing_time,
            "current_throughput": self.metrics.current_throughput,
            "error_rate": self.metrics.error_rate,
            "circuit_breaker_state": self.metrics.circuit_breaker_state.value,
            "last_error": self.metrics.last_error,
        }


class PipelineManager:
    """Manager for multiple async pipelines"""

    def __init__(self, redis_service: OptimizedRedisService):
        self.redis_service = redis_service
        self.pipelines: Dict[str, EnhancedAsyncPipeline] = {}

    async def create_pipeline(
        self, name: str, processor: Callable, **kwargs
    ) -> EnhancedAsyncPipeline:
        """Create new processing pipeline"""
        if name in self.pipelines:
            raise ValueError(f"Pipeline {name} already exists")

        pipeline = EnhancedAsyncPipeline(
            name=name, processor=processor, redis_service=self.redis_service, **kwargs
        )

        self.pipelines[name] = pipeline
        return pipeline

    async def start_pipeline(self, name: str):
        """Start specific pipeline"""
        if name not in self.pipelines:
            raise ValueError(f"Pipeline {name} not found")

        await self.pipelines[name].start()

    async def stop_pipeline(self, name: str):
        """Stop specific pipeline"""
        if name not in self.pipelines:
            raise ValueError(f"Pipeline {name} not found")

        await self.pipelines[name].stop()

    async def start_all(self):
        """Start all pipelines"""
        for pipeline in self.pipelines.values():
            await pipeline.start()

    async def stop_all(self):
        """Stop all pipelines"""
        for pipeline in self.pipelines.values():
            await pipeline.stop()

    async def get_all_metrics(self) -> Dict[str, Any]:
        """Get metrics for all pipelines"""
        metrics = {}
        for name, pipeline in self.pipelines.items():
            metrics[name] = await pipeline.get_metrics()
        return metrics


# Global pipeline manager
pipeline_manager = PipelineManager(OptimizedRedisService())
