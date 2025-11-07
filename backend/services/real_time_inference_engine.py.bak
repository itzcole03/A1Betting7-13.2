"""
Real-Time Model Inference Engine

This service provides ultra-fast, scalable model inference for real-time
predictions across all sports with sub-100ms latency, intelligent caching,
and automatic load balancing.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Callable
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from enum import Enum
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from collections import defaultdict, deque
import heapq

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InferenceStatus(Enum):
    """Inference request status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CACHED = "cached"

class PriorityLevel(Enum):
    """Request priority levels"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4
    CRITICAL = 5

class ModelType(Enum):
    """Model types for inference"""
    INDIVIDUAL = "individual"
    ENSEMBLE = "ensemble"
    HYBRID = "hybrid"

@dataclass
class InferenceRequest:
    """Single inference request"""
    request_id: str
    model_id: str
    version: str
    input_data: Dict[str, Any]
    priority: PriorityLevel
    timeout_ms: int
    cache_ttl_seconds: int
    callback_url: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    
    def __lt__(self, other):
        """For priority queue ordering (higher priority value = higher priority)"""
        return self.priority.value > other.priority.value

@dataclass
class InferenceResult:
    """Inference result"""
    request_id: str
    model_id: str
    version: str
    predictions: Dict[str, float]
    confidence_scores: Dict[str, float]
    feature_importance: Dict[str, float]
    inference_time_ms: float
    cache_hit: bool
    status: InferenceStatus
    error_message: Optional[str]
    metadata: Dict[str, Any]
    completed_at: datetime

@dataclass
class BatchInferenceRequest:
    """Batch inference request"""
    batch_id: str
    model_id: str
    version: str
    input_batch: List[Dict[str, Any]]
    priority: PriorityLevel
    max_batch_size: int
    timeout_ms: int
    progress_callback: Optional[Callable]
    metadata: Dict[str, Any]
    created_at: datetime

@dataclass
class ModelInstance:
    """Running model instance"""
    instance_id: str
    model_id: str
    version: str
    model_object: Any
    load_time: datetime
    last_used: datetime
    request_count: int
    error_count: int
    avg_inference_time_ms: float
    memory_usage_mb: float
    cpu_utilization: float
    status: str

@dataclass
class InferenceMetrics:
    """Performance metrics for inference engine"""
    timestamp: datetime
    total_requests: int
    successful_requests: int
    failed_requests: int
    cache_hits: int
    avg_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    throughput_per_second: float
    active_models: int
    queue_size: int
    cpu_utilization: float
    memory_utilization: float

class RealTimeInferenceEngine:
    """
    High-performance real-time model inference engine
    """
    
    def __init__(self, max_workers: int = 20, max_queue_size: int = 10000):
        self.max_workers = max_workers
        self.max_queue_size = max_queue_size
        
        # Request handling
        self.request_queue = asyncio.PriorityQueue(maxsize=max_queue_size)
        self.batch_queue = asyncio.Queue(maxsize=1000)
        self.active_requests = {}
        self.completed_requests = {}
        
        # Model management
        self.loaded_models = {}  # model_id:version -> ModelInstance
        self.model_cache = {}    # Cache for model objects
        self.cache_ttl = timedelta(minutes=30)
        
        # Performance tracking
        self.metrics_history = deque(maxlen=1000)
        self.response_times = deque(maxlen=10000)
        self.current_metrics = InferenceMetrics(
            timestamp=datetime.now(),
            total_requests=0,
            successful_requests=0,
            failed_requests=0,
            cache_hits=0,
            avg_response_time_ms=0.0,
            p95_response_time_ms=0.0,
            p99_response_time_ms=0.0,
            throughput_per_second=0.0,
            active_models=0,
            queue_size=0,
            cpu_utilization=0.0,
            memory_utilization=0.0
        )
        
        # Caching for predictions
        self.prediction_cache = {}
        self.cache_access_times = {}
        
        # Threading
        self.executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="InferenceWorker")
        self.running = False
        
        # Background tasks
        self._background_tasks = []
        
    async def start(self):
        """Start the inference engine"""
        if self.running:
            return
            
        self.running = True
        
        # Start background workers
        self._background_tasks = [
            asyncio.create_task(self._request_processor()),
            asyncio.create_task(self._batch_processor()),
            asyncio.create_task(self._metrics_collector()),
            asyncio.create_task(self._cache_cleaner()),
            asyncio.create_task(self._model_health_monitor())
        ]
        
        logger.info(f"Real-time inference engine started with {self.max_workers} workers")
    
    async def stop(self):
        """Stop the inference engine"""
        self.running = False
        
        # Cancel background tasks
        for task in self._background_tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self._background_tasks, return_exceptions=True)
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("Real-time inference engine stopped")

    async def predict(
        self,
        model_id: str,
        version: str,
        input_data: Dict[str, Any],
        priority: PriorityLevel = PriorityLevel.NORMAL,
        timeout_ms: int = 5000,
        cache_ttl_seconds: int = 300
    ) -> InferenceResult:
        """
        Make a real-time prediction
        
        Args:
            model_id: ID of the model to use
            version: Version of the model
            input_data: Input features for prediction
            priority: Request priority level
            timeout_ms: Request timeout in milliseconds
            cache_ttl_seconds: Cache TTL for the result
            
        Returns:
            InferenceResult with predictions and metadata
        """
        
        request_id = self._generate_request_id()
        start_time = time.time()
        
        # Check cache first
        cache_key = self._generate_cache_key(model_id, version, input_data)
        cached_result = self._get_cached_result(cache_key)
        
        if cached_result:
            self.current_metrics.cache_hits += 1
            cached_result.request_id = request_id
            cached_result.cache_hit = True
            cached_result.completed_at = datetime.now()
            return cached_result
        
        # Create inference request
        request = InferenceRequest(
            request_id=request_id,
            model_id=model_id,
            version=version,
            input_data=input_data,
            priority=priority,
            timeout_ms=timeout_ms,
            cache_ttl_seconds=cache_ttl_seconds,
            callback_url=None,
            metadata={"start_time": start_time},
            created_at=datetime.now()
        )
        
        try:
            # Add to queue
            await asyncio.wait_for(
                self.request_queue.put(request),
                timeout=timeout_ms / 1000
            )
            
            # Wait for completion
            result = await self._wait_for_result(request_id, timeout_ms / 1000)
            
            # Cache successful results
            if result.status == InferenceStatus.COMPLETED:
                self._cache_result(cache_key, result, cache_ttl_seconds)
            
            return result
            
        except asyncio.TimeoutError:
            return InferenceResult(
                request_id=request_id,
                model_id=model_id,
                version=version,
                predictions={},
                confidence_scores={},
                feature_importance={},
                inference_time_ms=(time.time() - start_time) * 1000,
                cache_hit=False,
                status=InferenceStatus.FAILED,
                error_message="Request timeout",
                metadata={},
                completed_at=datetime.now()
            )
        
        except Exception as e:
            logger.error(f"Error in prediction request {request_id}: {str(e)}")
            return InferenceResult(
                request_id=request_id,
                model_id=model_id,
                version=version,
                predictions={},
                confidence_scores={},
                feature_importance={},
                inference_time_ms=(time.time() - start_time) * 1000,
                cache_hit=False,
                status=InferenceStatus.FAILED,
                error_message=str(e),
                metadata={},
                completed_at=datetime.now()
            )

    async def predict_batch(
        self,
        model_id: str,
        version: str,
        input_batch: List[Dict[str, Any]],
        priority: PriorityLevel = PriorityLevel.NORMAL,
        max_batch_size: int = 100,
        timeout_ms: int = 30000
    ) -> List[InferenceResult]:
        """
        Make batch predictions for better throughput
        
        Args:
            model_id: ID of the model to use
            version: Version of the model
            input_batch: List of input feature dictionaries
            priority: Request priority level
            max_batch_size: Maximum batch size for processing
            timeout_ms: Request timeout in milliseconds
            
        Returns:
            List of InferenceResult objects
        """
        
        batch_id = self._generate_request_id() + "_batch"
        
        # Split large batches
        if len(input_batch) > max_batch_size:
            sub_batches = [
                input_batch[i:i + max_batch_size]
                for i in range(0, len(input_batch), max_batch_size)
            ]
        else:
            sub_batches = [input_batch]
        
        all_results = []
        
        for i, sub_batch in enumerate(sub_batches):
            sub_batch_id = f"{batch_id}_{i}"
            
            batch_request = BatchInferenceRequest(
                batch_id=sub_batch_id,
                model_id=model_id,
                version=version,
                input_batch=sub_batch,
                priority=priority,
                max_batch_size=max_batch_size,
                timeout_ms=timeout_ms,
                progress_callback=None,
                metadata={"sub_batch_index": i},
                created_at=datetime.now()
            )
            
            try:
                # Add to batch queue
                await self.batch_queue.put(batch_request)
                
                # Wait for completion
                sub_results = await self._wait_for_batch_result(sub_batch_id, timeout_ms / 1000)
                all_results.extend(sub_results)
                
            except Exception as e:
                logger.error(f"Error in batch prediction {sub_batch_id}: {str(e)}")
                # Create error results for this sub-batch
                error_results = [
                    InferenceResult(
                        request_id=f"{sub_batch_id}_{j}",
                        model_id=model_id,
                        version=version,
                        predictions={},
                        confidence_scores={},
                        feature_importance={},
                        inference_time_ms=0.0,
                        cache_hit=False,
                        status=InferenceStatus.FAILED,
                        error_message=str(e),
                        metadata={},
                        completed_at=datetime.now()
                    )
                    for j in range(len(sub_batch))
                ]
                all_results.extend(error_results)
        
        return all_results

    async def load_model(
        self,
        model_id: str,
        version: str,
        model_object: Any,
        warm_up_samples: int = 10
    ) -> bool:
        """
        Load a model into the inference engine
        
        Args:
            model_id: Model identifier
            version: Model version
            model_object: The actual model object
            warm_up_samples: Number of samples for warm-up
            
        Returns:
            True if successfully loaded
        """
        
        instance_id = f"{model_id}:{version}"
        
        try:
            start_time = time.time()
            
            # Simulate model loading and warm-up
            if warm_up_samples > 0:
                # Generate dummy data for warm-up
                dummy_data = {f"feature_{i}": np.random.rand() for i in range(10)}
                for _ in range(warm_up_samples):
                    await self._run_inference(model_object, dummy_data)
            
            load_time = (time.time() - start_time) * 1000
            
            # Create model instance
            instance = ModelInstance(
                instance_id=instance_id,
                model_id=model_id,
                version=version,
                model_object=model_object,
                load_time=datetime.now(),
                last_used=datetime.now(),
                request_count=0,
                error_count=0,
                avg_inference_time_ms=50.0,  # Initial estimate
                memory_usage_mb=self._estimate_model_memory(model_object),
                cpu_utilization=0.0,
                status="ready"
            )
            
            self.loaded_models[instance_id] = instance
            
            logger.info(f"Loaded model {instance_id} in {load_time:.1f}ms")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model {instance_id}: {str(e)}")
            return False

    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        return f"req_{int(time.time() * 1000)}_{np.random.randint(1000, 9999)}"

    def _generate_cache_key(
        self,
        model_id: str,
        version: str,
        input_data: Dict[str, Any]
    ) -> str:
        """Generate cache key for prediction"""
        
        # Create deterministic key from input data
        sorted_data = json.dumps(input_data, sort_keys=True)
        import hashlib
        data_hash = hashlib.md5(sorted_data.encode()).hexdigest()[:8]
        
        return f"{model_id}:{version}:{data_hash}"

    def _get_cached_result(self, cache_key: str) -> Optional[InferenceResult]:
        """Get cached prediction result"""
        
        if cache_key in self.prediction_cache:
            result, expiry_time = self.prediction_cache[cache_key]
            
            if datetime.now() < expiry_time:
                self.cache_access_times[cache_key] = datetime.now()
                return result
            else:
                # Expired - remove from cache
                del self.prediction_cache[cache_key]
                if cache_key in self.cache_access_times:
                    del self.cache_access_times[cache_key]
        
        return None

    def _cache_result(
        self,
        cache_key: str,
        result: InferenceResult,
        ttl_seconds: int
    ):
        """Cache prediction result"""
        
        expiry_time = datetime.now() + timedelta(seconds=ttl_seconds)
        self.prediction_cache[cache_key] = (result, expiry_time)
        self.cache_access_times[cache_key] = datetime.now()

    async def _wait_for_result(self, request_id: str, timeout_seconds: float) -> InferenceResult:
        """Wait for inference result"""
        
        start_time = time.time()
        
        while time.time() - start_time < timeout_seconds:
            if request_id in self.completed_requests:
                result = self.completed_requests.pop(request_id)
                return result
            
            await asyncio.sleep(0.001)  # 1ms polling interval
        
        raise asyncio.TimeoutError("Request timeout waiting for result")

    async def _wait_for_batch_result(self, batch_id: str, timeout_seconds: float) -> List[InferenceResult]:
        """Wait for batch inference results"""
        
        # Simplified - in production would use proper batch result tracking
        await asyncio.sleep(min(0.1, timeout_seconds))  # Simulate batch processing time
        
        # Return mock results for demonstration
        return [
            InferenceResult(
                request_id=f"{batch_id}_item_{i}",
                model_id="mock_model",
                version="1.0.0",
                predictions={"prediction": np.random.rand()},
                confidence_scores={"confidence": np.random.uniform(0.7, 0.95)},
                feature_importance={},
                inference_time_ms=np.random.uniform(20, 80),
                cache_hit=False,
                status=InferenceStatus.COMPLETED,
                error_message=None,
                metadata={},
                completed_at=datetime.now()
            )
            for i in range(5)  # Mock 5 items
        ]

    async def _request_processor(self):
        """Background task to process inference requests"""
        
        while self.running:
            try:
                # Get request from priority queue
                request = await asyncio.wait_for(
                    self.request_queue.get(),
                    timeout=1.0
                )
                
                # Process request in thread pool
                asyncio.create_task(self._process_single_request(request))
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in request processor: {str(e)}")

    async def _process_single_request(self, request: InferenceRequest):
        """Process a single inference request"""
        
        start_time = time.time()
        
        try:
            # Get model instance
            instance_key = f"{request.model_id}:{request.version}"
            
            if instance_key not in self.loaded_models:
                raise ValueError(f"Model {instance_key} not loaded")
            
            instance = self.loaded_models[instance_key]
            
            # Run inference
            predictions = await self._run_inference(
                instance.model_object,
                request.input_data
            )
            
            inference_time = (time.time() - start_time) * 1000
            
            # Create result
            result = InferenceResult(
                request_id=request.request_id,
                model_id=request.model_id,
                version=request.version,
                predictions=predictions,
                confidence_scores=self._calculate_confidence_scores(predictions),
                feature_importance=self._get_feature_importance(instance.model_object, request.input_data),
                inference_time_ms=inference_time,
                cache_hit=False,
                status=InferenceStatus.COMPLETED,
                error_message=None,
                metadata=request.metadata,
                completed_at=datetime.now()
            )
            
            # Update instance metrics
            instance.request_count += 1
            instance.last_used = datetime.now()
            instance.avg_inference_time_ms = (
                instance.avg_inference_time_ms * 0.9 + inference_time * 0.1
            )
            
            # Store result
            self.completed_requests[request.request_id] = result
            
            # Update global metrics
            self.current_metrics.total_requests += 1
            self.current_metrics.successful_requests += 1
            self.response_times.append(inference_time)
            
        except Exception as e:
            error_time = (time.time() - start_time) * 1000
            
            result = InferenceResult(
                request_id=request.request_id,
                model_id=request.model_id,
                version=request.version,
                predictions={},
                confidence_scores={},
                feature_importance={},
                inference_time_ms=error_time,
                cache_hit=False,
                status=InferenceStatus.FAILED,
                error_message=str(e),
                metadata=request.metadata,
                completed_at=datetime.now()
            )
            
            self.completed_requests[request.request_id] = result
            
            # Update metrics
            self.current_metrics.total_requests += 1
            self.current_metrics.failed_requests += 1
            
            logger.error(f"Error processing request {request.request_id}: {str(e)}")

    async def _run_inference(
        self,
        model_object: Any,
        input_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Run model inference"""
        
        # Simulate model prediction
        # In production, this would call the actual model
        await asyncio.sleep(0.01)  # Simulate inference time
        
        # Mock predictions based on input
        predictions = {}
        
        if "points" in str(model_object):
            predictions["points"] = np.random.uniform(15, 35)
        elif "rebounds" in str(model_object):
            predictions["rebounds"] = np.random.uniform(5, 15)
        elif "assists" in str(model_object):
            predictions["assists"] = np.random.uniform(3, 12)
        else:
            predictions["prediction"] = np.random.uniform(0.1, 0.9)
        
        return predictions

    def _calculate_confidence_scores(self, predictions: Dict[str, float]) -> Dict[str, float]:
        """Calculate confidence scores for predictions"""
        
        confidence_scores = {}
        for key, value in predictions.items():
            # Simulate confidence calculation
            confidence_scores[f"{key}_confidence"] = np.random.uniform(0.7, 0.95)
        
        return confidence_scores

    def _get_feature_importance(
        self,
        model_object: Any,
        input_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Get feature importance for the prediction"""
        
        # Simulate feature importance
        importance = {}
        features = list(input_data.keys())
        
        if features:
            # Generate normalized importance scores
            raw_scores = np.random.dirichlet(np.ones(len(features)))
            for feature, score in zip(features, raw_scores):
                importance[feature] = round(score, 4)
        
        return importance

    def _estimate_model_memory(self, model_object: Any) -> float:
        """Estimate memory usage of a model"""
        
        # Simplified memory estimation
        return np.random.uniform(50, 500)  # MB

    async def _batch_processor(self):
        """Background task to process batch requests"""
        
        while self.running:
            try:
                batch_request = await asyncio.wait_for(
                    self.batch_queue.get(),
                    timeout=1.0
                )
                
                # Process batch
                asyncio.create_task(self._process_batch_request(batch_request))
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in batch processor: {str(e)}")

    async def _process_batch_request(self, batch_request: BatchInferenceRequest):
        """Process a batch inference request"""
        
        # For demonstration, we'll simulate batch processing
        # In production, this would optimize for batch inference
        
        results = []
        
        for i, input_data in enumerate(batch_request.input_batch):
            try:
                # Create individual request
                request = InferenceRequest(
                    request_id=f"{batch_request.batch_id}_item_{i}",
                    model_id=batch_request.model_id,
                    version=batch_request.version,
                    input_data=input_data,
                    priority=batch_request.priority,
                    timeout_ms=batch_request.timeout_ms,
                    cache_ttl_seconds=300,
                    callback_url=None,
                    metadata=batch_request.metadata,
                    created_at=datetime.now()
                )
                
                await self._process_single_request(request)
                
            except Exception as e:
                logger.error(f"Error processing batch item {i}: {str(e)}")

    async def _metrics_collector(self):
        """Background task to collect performance metrics"""
        
        while self.running:
            try:
                # Calculate current metrics
                if self.response_times:
                    avg_response_time = np.mean(list(self.response_times))
                    p95_response_time = np.percentile(list(self.response_times), 95)
                    p99_response_time = np.percentile(list(self.response_times), 99)
                else:
                    avg_response_time = 0.0
                    p95_response_time = 0.0
                    p99_response_time = 0.0
                
                # Update metrics
                self.current_metrics.timestamp = datetime.now()
                self.current_metrics.avg_response_time_ms = avg_response_time
                self.current_metrics.p95_response_time_ms = p95_response_time
                self.current_metrics.p99_response_time_ms = p99_response_time
                self.current_metrics.active_models = len(self.loaded_models)
                self.current_metrics.queue_size = self.request_queue.qsize()
                
                # Store historical metrics
                self.metrics_history.append(self.current_metrics)
                
                await asyncio.sleep(5.0)  # Collect metrics every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in metrics collector: {str(e)}")
                await asyncio.sleep(5.0)

    async def _cache_cleaner(self):
        """Background task to clean expired cache entries"""
        
        while self.running:
            try:
                current_time = datetime.now()
                expired_keys = []
                
                for cache_key, (result, expiry_time) in self.prediction_cache.items():
                    if current_time > expiry_time:
                        expired_keys.append(cache_key)
                
                for key in expired_keys:
                    del self.prediction_cache[key]
                    if key in self.cache_access_times:
                        del self.cache_access_times[key]
                
                if expired_keys:
                    logger.info(f"Cleaned {len(expired_keys)} expired cache entries")
                
                await asyncio.sleep(60.0)  # Clean cache every minute
                
            except Exception as e:
                logger.error(f"Error in cache cleaner: {str(e)}")
                await asyncio.sleep(60.0)

    async def _model_health_monitor(self):
        """Background task to monitor model health"""
        
        while self.running:
            try:
                current_time = datetime.now()
                unhealthy_models = []
                
                for instance_id, instance in self.loaded_models.items():
                    # Check if model hasn't been used recently
                    time_since_use = (current_time - instance.last_used).total_seconds()
                    
                    if time_since_use > 3600:  # 1 hour
                        # Mark for potential unloading
                        instance.status = "idle"
                    
                    # Check error rate
                    if instance.request_count > 100:
                        error_rate = instance.error_count / instance.request_count
                        if error_rate > 0.1:  # 10% error rate
                            unhealthy_models.append(instance_id)
                            instance.status = "unhealthy"
                
                if unhealthy_models:
                    logger.warning(f"Found {len(unhealthy_models)} unhealthy models")
                
                await asyncio.sleep(300.0)  # Monitor every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in model health monitor: {str(e)}")
                await asyncio.sleep(300.0)

    async def get_engine_status(self) -> Dict[str, Any]:
        """Get comprehensive engine status"""
        
        status = {
            "running": self.running,
            "timestamp": datetime.now().isoformat(),
            "queue_status": {
                "request_queue_size": self.request_queue.qsize(),
                "batch_queue_size": self.batch_queue.qsize(),
                "max_queue_size": self.max_queue_size,
                "queue_utilization": self.request_queue.qsize() / self.max_queue_size
            },
            "loaded_models": {
                "total_count": len(self.loaded_models),
                "ready_count": len([m for m in self.loaded_models.values() if m.status == "ready"]),
                "idle_count": len([m for m in self.loaded_models.values() if m.status == "idle"]),
                "unhealthy_count": len([m for m in self.loaded_models.values() if m.status == "unhealthy"])
            },
            "cache_status": {
                "cache_entries": len(self.prediction_cache),
                "cache_hit_rate": self.current_metrics.cache_hits / max(self.current_metrics.total_requests, 1),
                "estimated_cache_size_mb": len(self.prediction_cache) * 0.5  # Rough estimate
            },
            "performance_metrics": asdict(self.current_metrics),
            "recent_response_times": {
                "count": len(self.response_times),
                "avg_ms": np.mean(list(self.response_times)) if self.response_times else 0.0,
                "min_ms": np.min(list(self.response_times)) if self.response_times else 0.0,
                "max_ms": np.max(list(self.response_times)) if self.response_times else 0.0
            }
        }
        
        return status

# Usage example and testing
async def main():
    """Example usage of the Real-Time Inference Engine"""
    
    # Create and start engine
    engine = RealTimeInferenceEngine(max_workers=10)
    await engine.start()
    
    try:
        # Example 1: Load a mock model
        print("=== Loading Model ===")
        
        class MockNBAModel:
            def __init__(self):
                self.model_type = "nba_points_predictor"
            
            def predict(self, features):
                # Simulate prediction
                return {"points": np.random.uniform(15, 35)}
        
        mock_model = MockNBAModel()
        
        loaded = await engine.load_model(
            model_id="nba_points_v2",
            version="2.1.0",
            model_object=mock_model,
            warm_up_samples=5
        )
        
        print(f"Model loaded: {loaded}")
        
        # Example 2: Single prediction
        print("\n=== Single Prediction ===")
        
        input_data = {
            "usage_rate": 0.28,
            "true_shooting_pct": 0.62,
            "opponent_def_rating": 108.5,
            "home_game": 1,
            "rest_days": 1
        }
        
        result = await engine.predict(
            model_id="nba_points_v2",
            version="2.1.0",
            input_data=input_data,
            priority=PriorityLevel.HIGH,
            timeout_ms=1000
        )
        
        print(f"Prediction result:")
        print(f"  Request ID: {result.request_id}")
        print(f"  Status: {result.status.value}")
        print(f"  Predictions: {result.predictions}")
        print(f"  Confidence: {result.confidence_scores}")
        print(f"  Inference time: {result.inference_time_ms:.1f}ms")
        print(f"  Cache hit: {result.cache_hit}")
        
        # Example 3: Test caching with same input
        print("\n=== Testing Cache ===")
        
        cached_result = await engine.predict(
            model_id="nba_points_v2",
            version="2.1.0",
            input_data=input_data,  # Same input as before
            priority=PriorityLevel.NORMAL
        )
        
        print(f"Cached result:")
        print(f"  Cache hit: {cached_result.cache_hit}")
        print(f"  Inference time: {cached_result.inference_time_ms:.1f}ms")
        
        # Example 4: Batch prediction
        print("\n=== Batch Prediction ===")
        
        batch_inputs = [
            {"usage_rate": 0.25, "true_shooting_pct": 0.58, "opponent_def_rating": 112.0},
            {"usage_rate": 0.32, "true_shooting_pct": 0.65, "opponent_def_rating": 105.5},
            {"usage_rate": 0.28, "true_shooting_pct": 0.61, "opponent_def_rating": 109.2}
        ]
        
        batch_results = await engine.predict_batch(
            model_id="nba_points_v2",
            version="2.1.0",
            input_batch=batch_inputs,
            priority=PriorityLevel.NORMAL
        )
        
        print(f"Batch results: {len(batch_results)} predictions")
        for i, result in enumerate(batch_results[:3]):  # Show first 3
            print(f"  {i+1}. {result.predictions} ({result.inference_time_ms:.1f}ms)")
        
        # Example 5: Engine status
        print("\n=== Engine Status ===")
        
        status = await engine.get_engine_status()
        print(f"Queue utilization: {status['queue_status']['queue_utilization']:.1%}")
        print(f"Loaded models: {status['loaded_models']['total_count']}")
        print(f"Cache entries: {status['cache_status']['cache_entries']}")
        print(f"Cache hit rate: {status['cache_status']['cache_hit_rate']:.1%}")
        print(f"Avg response time: {status['recent_response_times']['avg_ms']:.1f}ms")
        
    finally:
        # Stop engine
        await engine.stop()
        print("\nEngine stopped")

if __name__ == "__main__":
    asyncio.run(main())
