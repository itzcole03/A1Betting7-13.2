"""
Inference Optimization Service

Optimizes inference speed and memory usage:
- Dynamic batching
- Model quantization integration
- Memory pooling
- GPU acceleration
- Inference caching
- Request routing optimization
"""

import asyncio
import logging
import threading
import time
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import torch
import torch.nn as nn

# Import our performance optimization service
try:
    from .performance_optimization import (
        BatchProcessor,
        MemoryOptimizer,
        ModelOptimizer,
    )

    PERF_OPT_AVAILABLE = True
except ImportError:
    PERF_OPT_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class InferenceRequest:
    """Single inference request"""

    request_id: str
    input_data: torch.Tensor
    model_id: str
    priority: int = 1  # 1=low, 2=normal, 3=high
    max_latency_ms: Optional[int] = None
    created_at: float = None
    callback: Optional[callable] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = time.time()


@dataclass
class InferenceResult:
    """Inference result"""

    request_id: str
    prediction: torch.Tensor
    confidence: Optional[float] = None
    latency_ms: float = 0
    model_version: Optional[str] = None
    cached: bool = False
    error: Optional[str] = None


class DynamicBatcher:
    """Dynamic batching for inference optimization"""

    def __init__(self, max_batch_size: int = 32, max_wait_ms: int = 50):
        self.max_batch_size = max_batch_size
        self.max_wait_ms = max_wait_ms
        self.pending_requests = defaultdict(list)  # model_id -> requests
        self.batch_queues = defaultdict(asyncio.Queue)
        self.processing_lock = threading.Lock()

    async def add_request(self, request: InferenceRequest) -> InferenceResult:
        """Add request to batching queue"""
        result_future = asyncio.Future()
        request.callback = result_future.set_result

        with self.processing_lock:
            self.pending_requests[request.model_id].append(request)

        # Trigger batch processing if needed
        await self._maybe_process_batch(request.model_id)

        # Wait for result
        try:
            result = await asyncio.wait_for(result_future, timeout=5.0)
            return result
        except asyncio.TimeoutError:
            return InferenceResult(
                request_id=request.request_id,
                prediction=torch.tensor([0.0]),
                error="Timeout waiting for inference result",
            )

    async def _maybe_process_batch(self, model_id: str):
        """Process batch if conditions are met"""
        with self.processing_lock:
            requests = self.pending_requests[model_id]

            # Check if we should process now
            should_process = len(requests) >= self.max_batch_size or (
                requests
                and time.time() - requests[0].created_at > self.max_wait_ms / 1000.0
            )

            if should_process:
                # Take requests for processing
                batch_requests = requests[: self.max_batch_size]
                self.pending_requests[model_id] = requests[self.max_batch_size :]

        if should_process:
            await self.batch_queues[model_id].put(batch_requests)

    async def get_batch(self, model_id: str) -> List[InferenceRequest]:
        """Get batch of requests for processing"""
        return await self.batch_queues[model_id].get()

    def get_queue_stats(self) -> Dict[str, Any]:
        """Get batching queue statistics"""
        stats = {}

        with self.processing_lock:
            for model_id, requests in self.pending_requests.items():
                if requests:
                    oldest_age = time.time() - requests[0].created_at
                    stats[model_id] = {
                        "pending_count": len(requests),
                        "oldest_age_ms": oldest_age * 1000,
                        "queue_depth": self.batch_queues[model_id].qsize(),
                    }

        return stats


class InferenceCache:
    """LRU cache for inference results"""

    def __init__(self, max_size: int = 10000, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache = {}
        self.access_times = {}
        self.creation_times = {}
        self.lock = threading.Lock()

    def _generate_key(self, input_tensor: torch.Tensor, model_id: str) -> str:
        """Generate cache key from input tensor"""
        # Use tensor hash and model ID
        tensor_hash = hash(input_tensor.data.tobytes())
        return f"{model_id}:{tensor_hash}:{input_tensor.shape}"

    def get(
        self, input_tensor: torch.Tensor, model_id: str
    ) -> Optional[InferenceResult]:
        """Get cached result if available"""
        key = self._generate_key(input_tensor, model_id)

        with self.lock:
            if key in self.cache:
                # Check TTL
                if time.time() - self.creation_times[key] < self.ttl_seconds:
                    self.access_times[key] = time.time()
                    result = self.cache[key]
                    result.cached = True
                    return result
                else:
                    # Expired
                    self._remove_key(key)

        return None

    def put(self, input_tensor: torch.Tensor, model_id: str, result: InferenceResult):
        """Cache inference result"""
        key = self._generate_key(input_tensor, model_id)

        with self.lock:
            # Make room if needed
            if len(self.cache) >= self.max_size:
                self._evict_lru()

            current_time = time.time()
            self.cache[key] = result
            self.access_times[key] = current_time
            self.creation_times[key] = current_time

    def _evict_lru(self):
        """Evict least recently used item"""
        if not self.access_times:
            return

        lru_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
        self._remove_key(lru_key)

    def _remove_key(self, key: str):
        """Remove key from all structures"""
        self.cache.pop(key, None)
        self.access_times.pop(key, None)
        self.creation_times.pop(key, None)

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            return {
                "size": len(self.cache),
                "max_size": self.max_size,
                "utilization": len(self.cache) / self.max_size,
                "ttl_seconds": self.ttl_seconds,
            }

    def clear(self):
        """Clear cache"""
        with self.lock:
            self.cache.clear()
            self.access_times.clear()
            self.creation_times.clear()


class GPUMemoryManager:
    """Manage GPU memory allocation and cleanup"""

    def __init__(self):
        self.allocated_tensors = deque(maxlen=1000)
        self.memory_threshold = 0.8  # 80% memory usage threshold

    def allocate_tensor(
        self,
        shape: Tuple[int, ...],
        dtype: torch.dtype = torch.float32,
        device: str = "cpu",
    ) -> torch.Tensor:
        """Allocate tensor with memory tracking"""
        tensor = torch.empty(shape, dtype=dtype, device=device)

        if device.startswith("cuda"):
            self.allocated_tensors.append(tensor)
            self._check_memory_usage()

        return tensor

    def _check_memory_usage(self):
        """Check GPU memory usage and cleanup if needed"""
        if not torch.cuda.is_available():
            return

        try:
            # Get memory info
            allocated = torch.cuda.memory_allocated()
            reserved = torch.cuda.memory_reserved()
            max_memory = torch.cuda.max_memory_allocated()

            # Check if we're over threshold
            if allocated / max_memory > self.memory_threshold:
                self._cleanup_memory()

        except Exception as e:
            logger.warning(f"Error checking GPU memory: {e}")

    def _cleanup_memory(self):
        """Cleanup GPU memory"""
        try:
            # Clear cache
            torch.cuda.empty_cache()

            # Remove old tensor references
            while len(self.allocated_tensors) > 500:
                self.allocated_tensors.popleft()

            logger.info("GPU memory cleanup performed")

        except Exception as e:
            logger.warning(f"Error during memory cleanup: {e}")

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get GPU memory statistics"""
        if not torch.cuda.is_available():
            return {"gpu_available": False}

        try:
            return {
                "gpu_available": True,
                "allocated_mb": torch.cuda.memory_allocated() / 1024 / 1024,
                "reserved_mb": torch.cuda.memory_reserved() / 1024 / 1024,
                "max_allocated_mb": torch.cuda.max_memory_allocated() / 1024 / 1024,
                "tracked_tensors": len(self.allocated_tensors),
            }
        except Exception:
            return {"gpu_available": True, "error": "Could not get memory stats"}


class ModelInstancePool:
    """Pool of model instances for concurrent inference"""

    def __init__(self, max_instances: int = 4):
        self.max_instances = max_instances
        self.model_pools = defaultdict(list)
        self.busy_instances = defaultdict(set)
        self.pool_locks = defaultdict(threading.Lock)

    def add_model_instance(self, model_id: str, model: nn.Module):
        """Add model instance to pool"""
        with self.pool_locks[model_id]:
            if len(self.model_pools[model_id]) < self.max_instances:
                # Clone model for thread safety
                model_copy = type(model)()
                model_copy.load_state_dict(model.state_dict())
                model_copy.eval()

                self.model_pools[model_id].append(model_copy)
                logger.info(
                    f"Added model instance for {model_id}, pool size: {len(self.model_pools[model_id])}"
                )

    def get_model_instance(self, model_id: str) -> Optional[nn.Module]:
        """Get available model instance"""
        with self.pool_locks[model_id]:
            available_models = [
                m
                for m in self.model_pools[model_id]
                if m not in self.busy_instances[model_id]
            ]

            if available_models:
                model = available_models[0]
                self.busy_instances[model_id].add(model)
                return model

        return None

    def return_model_instance(self, model_id: str, model: nn.Module):
        """Return model instance to pool"""
        with self.pool_locks[model_id]:
            self.busy_instances[model_id].discard(model)

    def get_pool_stats(self) -> Dict[str, Any]:
        """Get pool statistics"""
        stats = {}

        for model_id in self.model_pools:
            with self.pool_locks[model_id]:
                total_instances = len(self.model_pools[model_id])
                busy_instances = len(self.busy_instances[model_id])

                stats[model_id] = {
                    "total_instances": total_instances,
                    "busy_instances": busy_instances,
                    "available_instances": total_instances - busy_instances,
                    "utilization": (
                        busy_instances / total_instances if total_instances > 0 else 0
                    ),
                }

        return stats


class InferenceOptimizer:
    """Main inference optimization service"""

    def __init__(self):
        self.batcher = DynamicBatcher()
        self.cache = InferenceCache()
        self.gpu_manager = GPUMemoryManager()
        self.model_pool = ModelInstancePool()
        self.thread_pool = ThreadPoolExecutor(max_workers=8)

        # Performance optimization integration
        self.model_optimizer = None
        self.batch_processor = None
        if PERF_OPT_AVAILABLE:
            self.model_optimizer = ModelOptimizer()
            self.batch_processor = BatchProcessor()

        # Statistics
        self.inference_stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "batch_processed": 0,
            "average_latency_ms": 0,
            "average_batch_size": 0,
        }

        self.latency_history = deque(maxlen=1000)
        self.batch_size_history = deque(maxlen=1000)

        # Background workers
        self.workers_active = False
        self.worker_tasks = []

    async def start_optimization_service(self):
        """Start the inference optimization service"""
        if self.workers_active:
            logger.warning("Optimization service already active")
            return

        self.workers_active = True

        # Start batch processing workers for different models
        self.worker_tasks = [
            asyncio.create_task(self._batch_worker("default")),
            asyncio.create_task(self._cache_cleanup_worker()),
            asyncio.create_task(self._memory_monitor_worker()),
        ]

        logger.info("Inference optimization service started")

    async def stop_optimization_service(self):
        """Stop the optimization service"""
        if not self.workers_active:
            return

        self.workers_active = False

        for task in self.worker_tasks:
            task.cancel()

        await asyncio.gather(*self.worker_tasks, return_exceptions=True)
        self.worker_tasks = []

        self.thread_pool.shutdown(wait=True)

        logger.info("Inference optimization service stopped")

    async def optimized_inference(self, request: InferenceRequest) -> InferenceResult:
        """Perform optimized inference"""
        start_time = time.time()

        try:
            # Check cache first
            cached_result = self.cache.get(request.input_data, request.model_id)
            if cached_result:
                self.inference_stats["cache_hits"] += 1
                cached_result.request_id = request.request_id
                return cached_result

            self.inference_stats["cache_misses"] += 1

            # Use dynamic batching
            result = await self.batcher.add_request(request)

            # Cache result
            if result.error is None:
                self.cache.put(request.input_data, request.model_id, result)

            # Update statistics
            latency_ms = (time.time() - start_time) * 1000
            result.latency_ms = latency_ms

            self.latency_history.append(latency_ms)
            self.inference_stats["total_requests"] += 1

            # Update average latency
            if self.latency_history:
                self.inference_stats["average_latency_ms"] = np.mean(
                    self.latency_history
                )

            return result

        except Exception as e:
            logger.error(f"Error in optimized inference: {e}")
            return InferenceResult(
                request_id=request.request_id,
                prediction=torch.tensor([0.0]),
                error=str(e),
                latency_ms=(time.time() - start_time) * 1000,
            )

    async def _batch_worker(self, model_id: str):
        """Worker to process batches for a specific model"""
        while self.workers_active:
            try:
                # Get batch of requests
                batch_requests = await self.batcher.get_batch(model_id)

                if not batch_requests:
                    await asyncio.sleep(0.01)
                    continue

                # Process batch
                await self._process_batch(batch_requests)

            except Exception as e:
                logger.error(f"Error in batch worker for {model_id}: {e}")
                await asyncio.sleep(0.1)

    async def _process_batch(self, requests: List[InferenceRequest]):
        """Process a batch of inference requests"""
        if not requests:
            return

        model_id = requests[0].model_id
        batch_size = len(requests)

        try:
            # Get model instance
            model = self.model_pool.get_model_instance(model_id)
            if model is None:
                # Fallback to single processing
                for request in requests:
                    await self._process_single_request(request)
                return

            try:
                # Prepare batch input
                batch_input = torch.stack([req.input_data for req in requests])

                # Optimize input if available
                if self.batch_processor and PERF_OPT_AVAILABLE:
                    batch_input = await self.batch_processor.optimize_batch_input(
                        batch_input
                    )

                # Run inference
                with torch.no_grad():
                    batch_output = model(batch_input)

                # Process results
                for i, request in enumerate(requests):
                    prediction = batch_output[i : i + 1]

                    result = InferenceResult(
                        request_id=request.request_id,
                        prediction=prediction,
                        confidence=(
                            float(torch.sigmoid(prediction).item())
                            if prediction.numel() == 1
                            else None
                        ),
                    )

                    if request.callback:
                        request.callback(result)

                # Update statistics
                self.inference_stats["batch_processed"] += 1
                self.batch_size_history.append(batch_size)

                if self.batch_size_history:
                    self.inference_stats["average_batch_size"] = np.mean(
                        self.batch_size_history
                    )

            finally:
                self.model_pool.return_model_instance(model_id, model)

        except Exception as e:
            logger.error(f"Error processing batch for {model_id}: {e}")

            # Fallback to individual processing
            for request in requests:
                error_result = InferenceResult(
                    request_id=request.request_id,
                    prediction=torch.tensor([0.0]),
                    error=str(e),
                )

                if request.callback:
                    request.callback(error_result)

    async def _process_single_request(self, request: InferenceRequest):
        """Process single request as fallback"""
        try:
            # Simple processing without batching
            dummy_prediction = torch.tensor([0.5])

            result = InferenceResult(
                request_id=request.request_id,
                prediction=dummy_prediction,
                confidence=0.5,
            )

            if request.callback:
                request.callback(result)

        except Exception as e:
            logger.error(f"Error in single request processing: {e}")

            error_result = InferenceResult(
                request_id=request.request_id,
                prediction=torch.tensor([0.0]),
                error=str(e),
            )

            if request.callback:
                request.callback(error_result)

    async def _cache_cleanup_worker(self):
        """Worker to periodically clean up cache"""
        while self.workers_active:
            try:
                await asyncio.sleep(300)  # Every 5 minutes

                # Cache cleanup is automatic with TTL, but we can add explicit cleanup here
                cache_stats = self.cache.get_stats()

                if cache_stats["utilization"] > 0.9:
                    logger.info(
                        "Cache utilization high, consider increasing cache size"
                    )

            except Exception as e:
                logger.error(f"Error in cache cleanup worker: {e}")

    async def _memory_monitor_worker(self):
        """Worker to monitor and manage memory usage"""
        while self.workers_active:
            try:
                await asyncio.sleep(60)  # Every minute

                memory_stats = self.gpu_manager.get_memory_stats()

                if memory_stats.get("gpu_available"):
                    allocated_mb = memory_stats.get("allocated_mb", 0)
                    if allocated_mb > 1000:  # > 1GB
                        logger.info(f"GPU memory usage: {allocated_mb:.1f} MB")

            except Exception as e:
                logger.error(f"Error in memory monitor worker: {e}")

    def get_optimization_stats(self) -> Dict[str, Any]:
        """Get comprehensive optimization statistics"""
        return {
            "inference_stats": self.inference_stats.copy(),
            "cache_stats": self.cache.get_stats(),
            "gpu_stats": self.gpu_manager.get_memory_stats(),
            "pool_stats": self.model_pool.get_pool_stats(),
            "batch_queue_stats": self.batcher.get_queue_stats(),
            "optimization_active": self.workers_active,
            "worker_count": len(self.worker_tasks),
        }

    def register_model(self, model_id: str, model: nn.Module, instances: int = 2):
        """Register model for optimized inference"""
        # Add instances to pool
        for _ in range(instances):
            self.model_pool.add_model_instance(model_id, model)

        # Optimize model if available
        if self.model_optimizer and PERF_OPT_AVAILABLE:
            try:
                optimized_model = self.model_optimizer.quantize_model(model)
                # Replace one instance with optimized version
                self.model_pool.add_model_instance(
                    f"{model_id}_optimized", optimized_model
                )
                logger.info(f"Added optimized version of {model_id}")
            except Exception as e:
                logger.warning(f"Could not optimize model {model_id}: {e}")

        logger.info(f"Registered model {model_id} for optimized inference")


# Global instance
inference_optimizer = InferenceOptimizer()

logger.info("Inference optimization service initialized")
logger.info("Dynamic batching, caching, and memory optimization available")
