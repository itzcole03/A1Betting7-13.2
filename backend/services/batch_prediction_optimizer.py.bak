"""
Optimized Batch Prediction Service for Multi-Bet Requests

This service optimizes model prediction batching to reduce API latency with:
- Intelligent request batching and queueing
- Model-specific batch processing
- Prediction result caching
- Parallel processing optimization
- Request deduplication
- Performance monitoring
"""

import asyncio
import hashlib
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from cachetools import TTLCache

logger = logging.getLogger(__name__)

# Mock imports for development
try:
    from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
    CONCURRENT_AVAILABLE = True
except ImportError:
    CONCURRENT_AVAILABLE = False
    logger.warning("Concurrent processing not available")


@dataclass
class BatchPredictionRequest:
    """Individual prediction request in a batch"""
    request_id: str
    event_id: str
    sport: str
    features: Dict[str, float]
    models: Optional[List[str]] = None
    priority: int = 1  # 1=low, 2=medium, 3=high
    timeout: float = 10.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


@dataclass
class BatchPredictionResponse:
    """Response for batch prediction request"""
    request_id: str
    prediction: float
    confidence: float
    shap_values: Dict[str, float]
    model_breakdown: Dict[str, Any]
    processing_time: float
    cache_hit: bool = False
    error: Optional[str] = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class BatchProcessingStats:
    """Statistics for batch processing performance"""
    total_requests: int = 0
    total_batches: int = 0
    avg_batch_size: float = 0.0
    avg_processing_time: float = 0.0
    cache_hit_rate: float = 0.0
    error_rate: float = 0.0
    throughput_per_second: float = 0.0
    last_reset: float = field(default_factory=time.time)


class BatchPredictionOptimizer:
    """Optimized batch prediction service with intelligent queueing and caching"""
    
    def __init__(self, 
                 max_batch_size: int = 50,
                 batch_timeout: float = 0.1,  # 100ms
                 cache_ttl: int = 300,  # 5 minutes
                 max_workers: int = 4):
        
        self.max_batch_size = max_batch_size
        self.batch_timeout = batch_timeout
        self.cache_ttl = cache_ttl
        self.max_workers = max_workers
        
        # Request queues by priority
        self.high_priority_queue: deque = deque()
        self.medium_priority_queue: deque = deque()
        self.low_priority_queue: deque = deque()
        
        # Caching
        self.prediction_cache: TTLCache = TTLCache(maxsize=10000, ttl=cache_ttl)
        self.feature_hash_cache: Dict[str, str] = {}
        
        # Processing state
        self.processing_lock = asyncio.Lock()
        self.is_processing = False
        self.pending_requests: Dict[str, asyncio.Future] = {}
        
        # Statistics
        self.stats = BatchProcessingStats()
        self.detailed_stats: Dict[str, List[float]] = defaultdict(list)
        
        # Model registry and performance tracking
        self.registered_models: Dict[str, Any] = {}
        self.model_performance: Dict[str, Dict[str, float]] = defaultdict(dict)
        
        # Background batch processor
        self.batch_processor_task: Optional[asyncio.Task] = None
        self.should_stop = False
        
        logger.info(f"Batch prediction optimizer initialized: batch_size={max_batch_size}, timeout={batch_timeout}s")
    
    async def start_batch_processor(self):
        """Start the background batch processor"""
        if self.batch_processor_task is None or self.batch_processor_task.done():
            self.batch_processor_task = asyncio.create_task(self._batch_processor_loop())
            logger.info("Batch processor started")
    
    async def stop_batch_processor(self):
        """Stop the background batch processor"""
        self.should_stop = True
        if self.batch_processor_task and not self.batch_processor_task.done():
            self.batch_processor_task.cancel()
            try:
                await self.batch_processor_task
            except asyncio.CancelledError:
                pass
        logger.info("Batch processor stopped")
    
    def register_model(self, model_name: str, model: Any, batch_predict_fn: Optional[callable] = None):
        """Register a model for batch prediction"""
        self.registered_models[model_name] = {
            'model': model,
            'batch_predict_fn': batch_predict_fn or getattr(model, 'predict', None),
            'registered_at': datetime.now(timezone.utc),
            'prediction_count': 0,
            'total_time': 0.0
        }
        logger.info(f"Registered model: {model_name}")
    
    async def predict_batch(self, requests: List[BatchPredictionRequest]) -> List[BatchPredictionResponse]:
        """Submit batch prediction requests and wait for results"""
        if not requests:
            return []
        
        # Create futures for all requests
        futures = []
        for request in requests:
            future = asyncio.Future()
            self.pending_requests[request.request_id] = future
            futures.append(future)
            
            # Add to appropriate queue based on priority
            if request.priority >= 3:
                self.high_priority_queue.append(request)
            elif request.priority == 2:
                self.medium_priority_queue.append(request)
            else:
                self.low_priority_queue.append(request)
        
        # Start processor if not running
        await self.start_batch_processor()
        
        # Wait for all predictions with timeout
        try:
            responses = await asyncio.wait_for(
                asyncio.gather(*futures, return_exceptions=True),
                timeout=max(req.timeout for req in requests)
            )
            
            # Convert exceptions to error responses
            results = []
            for i, response in enumerate(responses):
                if isinstance(response, Exception):
                    error_response = BatchPredictionResponse(
                        request_id=requests[i].request_id,
                        prediction=0.0,
                        confidence=0.0,
                        shap_values={},
                        model_breakdown={},
                        processing_time=0.0,
                        error=str(response)
                    )
                    results.append(error_response)
                else:
                    results.append(response)
            
            return results
            
        except asyncio.TimeoutError:
            # Handle timeout - return partial results
            logger.warning(f"Batch prediction timeout for {len(requests)} requests")
            
            error_responses = []
            for request in requests:
                if request.request_id in self.pending_requests:
                    future = self.pending_requests[request.request_id]
                    if not future.done():
                        future.cancel()
                    del self.pending_requests[request.request_id]
                
                error_response = BatchPredictionResponse(
                    request_id=request.request_id,
                    prediction=0.0,
                    confidence=0.0,
                    shap_values={},
                    model_breakdown={},
                    processing_time=0.0,
                    error="Timeout"
                )
                error_responses.append(error_response)
            
            return error_responses
    
    async def predict_single(self, request: BatchPredictionRequest) -> BatchPredictionResponse:
        """Submit single prediction request"""
        responses = await self.predict_batch([request])
        return responses[0] if responses else BatchPredictionResponse(
            request_id=request.request_id,
            prediction=0.0,
            confidence=0.0,
            shap_values={},
            model_breakdown={},
            processing_time=0.0,
            error="No response"
        )
    
    async def _batch_processor_loop(self):
        """Main batch processing loop"""
        while not self.should_stop:
            try:
                # Collect batch from queues (priority order)
                batch = self._collect_batch()
                
                if batch:
                    await self._process_batch(batch)
                else:
                    # No requests - sleep briefly
                    await asyncio.sleep(0.01)
                    
            except Exception as e:
                logger.error(f"Error in batch processor loop: {e}")
                await asyncio.sleep(0.1)
    
    def _collect_batch(self) -> List[BatchPredictionRequest]:
        """Collect batch from priority queues"""
        batch = []
        
        # Collect from high priority first
        while len(batch) < self.max_batch_size and self.high_priority_queue:
            batch.append(self.high_priority_queue.popleft())
        
        # Then medium priority
        while len(batch) < self.max_batch_size and self.medium_priority_queue:
            batch.append(self.medium_priority_queue.popleft())
        
        # Finally low priority
        while len(batch) < self.max_batch_size and self.low_priority_queue:
            batch.append(self.low_priority_queue.popleft())
        
        return batch
    
    async def _process_batch(self, batch: List[BatchPredictionRequest]):
        """Process a batch of prediction requests"""
        batch_start_time = time.time()
        
        try:
            async with self.processing_lock:
                # Group requests by model requirements
                model_groups = self._group_by_models(batch)
                
                # Process each model group
                all_responses = {}
                
                for models, requests in model_groups.items():
                    responses = await self._process_model_group(models, requests)
                    all_responses.update(responses)
                
                # Resolve futures with responses
                for request in batch:
                    if request.request_id in self.pending_requests:
                        future = self.pending_requests[request.request_id]
                        if not future.done():
                            response = all_responses.get(request.request_id)
                            if response:
                                future.set_result(response)
                            else:
                                error_response = BatchPredictionResponse(
                                    request_id=request.request_id,
                                    prediction=0.0,
                                    confidence=0.0,
                                    shap_values={},
                                    model_breakdown={},
                                    processing_time=0.0,
                                    error="Processing failed"
                                )
                                future.set_result(error_response)
                        
                        del self.pending_requests[request.request_id]
                
                # Update statistics
                batch_time = time.time() - batch_start_time
                self._update_batch_stats(len(batch), batch_time)
                
                logger.debug(f"Processed batch of {len(batch)} requests in {batch_time:.3f}s")
                
        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            
            # Resolve pending futures with errors
            for request in batch:
                if request.request_id in self.pending_requests:
                    future = self.pending_requests[request.request_id]
                    if not future.done():
                        error_response = BatchPredictionResponse(
                            request_id=request.request_id,
                            prediction=0.0,
                            confidence=0.0,
                            shap_values={},
                            model_breakdown={},
                            processing_time=0.0,
                            error=str(e)
                        )
                        future.set_result(error_response)
                    
                    del self.pending_requests[request.request_id]
    
    def _group_by_models(self, batch: List[BatchPredictionRequest]) -> Dict[Tuple[str, ...], List[BatchPredictionRequest]]:
        """Group requests by their required models"""
        groups = defaultdict(list)
        
        for request in batch:
            # Use all registered models if none specified
            models = tuple(request.models or list(self.registered_models.keys()))
            groups[models].append(request)
        
        return dict(groups)
    
    async def _process_model_group(self, 
                                 models: Tuple[str, ...], 
                                 requests: List[BatchPredictionRequest]) -> Dict[str, BatchPredictionResponse]:
        """Process requests for a specific group of models"""
        responses = {}
        
        # Check cache first
        cached_responses, uncached_requests = self._check_cache(requests)
        responses.update(cached_responses)
        
        if not uncached_requests:
            return responses
        
        # Prepare batch features
        batch_features = []
        request_mapping = []
        
        for request in uncached_requests:
            batch_features.append(list(request.features.values()))
            request_mapping.append(request)
        
        if not batch_features:
            return responses
        
        # Convert to numpy array for batch processing
        try:
            feature_array = np.array(batch_features)
        except Exception as e:
            logger.error(f"Error creating feature array: {e}")
            # Return error responses
            for request in uncached_requests:
                responses[request.request_id] = BatchPredictionResponse(
                    request_id=request.request_id,
                    prediction=0.0,
                    confidence=0.0,
                    shap_values={},
                    model_breakdown={},
                    processing_time=0.0,
                    error="Feature array creation failed"
                )
            return responses
        
        # Process with each model
        model_results = {}
        for model_name in models:
            if model_name in self.registered_models:
                start_time = time.time()
                try:
                    model_info = self.registered_models[model_name]
                    batch_predict_fn = model_info['batch_predict_fn']
                    
                    if batch_predict_fn:
                        predictions = batch_predict_fn(feature_array)
                        if hasattr(predictions, 'tolist'):
                            predictions = predictions.tolist()
                        model_results[model_name] = predictions
                    else:
                        # Fallback to individual predictions
                        model = model_info['model']
                        predictions = []
                        for features in batch_features:
                            pred = model.predict([features])[0]
                            predictions.append(float(pred))
                        model_results[model_name] = predictions
                    
                    # Update model performance
                    process_time = time.time() - start_time
                    self._update_model_performance(model_name, len(uncached_requests), process_time)
                    
                except Exception as e:
                    logger.error(f"Error processing model {model_name}: {e}")
                    model_results[model_name] = [0.0] * len(uncached_requests)
        
        # Create responses
        for i, request in enumerate(uncached_requests):
            try:
                # Aggregate model predictions
                model_predictions = {}
                prediction_sum = 0.0
                confidence_sum = 0.0
                valid_models = 0
                
                for model_name in models:
                    if model_name in model_results and i < len(model_results[model_name]):
                        pred = model_results[model_name][i]
                        model_predictions[model_name] = pred
                        prediction_sum += pred
                        confidence_sum += abs(pred - 0.5) * 2  # Simple confidence measure
                        valid_models += 1
                
                if valid_models > 0:
                    final_prediction = prediction_sum / valid_models
                    final_confidence = min(confidence_sum / valid_models, 1.0)
                else:
                    final_prediction = 0.5
                    final_confidence = 0.0
                
                # Mock SHAP values for now
                shap_values = {name: np.random.uniform(-0.05, 0.05) for name in request.features.keys()}
                
                response = BatchPredictionResponse(
                    request_id=request.request_id,
                    prediction=final_prediction,
                    confidence=final_confidence,
                    shap_values=shap_values,
                    model_breakdown=model_predictions,
                    processing_time=time.time() - batch_features[i] if hasattr(batch_features[i], '__time__') else 0.0
                )
                
                responses[request.request_id] = response
                
                # Cache the response
                cache_key = self._create_cache_key(request)
                self.prediction_cache[cache_key] = response
                
            except Exception as e:
                logger.error(f"Error creating response for request {request.request_id}: {e}")
                responses[request.request_id] = BatchPredictionResponse(
                    request_id=request.request_id,
                    prediction=0.0,
                    confidence=0.0,
                    shap_values={},
                    model_breakdown={},
                    processing_time=0.0,
                    error=str(e)
                )
        
        return responses
    
    def _check_cache(self, requests: List[BatchPredictionRequest]) -> Tuple[Dict[str, BatchPredictionResponse], List[BatchPredictionRequest]]:
        """Check cache for existing predictions"""
        cached_responses = {}
        uncached_requests = []
        
        for request in requests:
            cache_key = self._create_cache_key(request)
            
            if cache_key in self.prediction_cache:
                cached_response = self.prediction_cache[cache_key]
                # Update request_id and cache hit flag
                cached_response.request_id = request.request_id
                cached_response.cache_hit = True
                cached_responses[request.request_id] = cached_response
            else:
                uncached_requests.append(request)
        
        return cached_responses, uncached_requests
    
    def _create_cache_key(self, request: BatchPredictionRequest) -> str:
        """Create cache key for prediction request"""
        key_data = {
            'event_id': request.event_id,
            'sport': request.sport,
            'features': sorted(request.features.items()),
            'models': tuple(sorted(request.models or []))
        }
        key_str = str(key_data)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def _update_batch_stats(self, batch_size: int, processing_time: float):
        """Update batch processing statistics"""
        self.stats.total_batches += 1
        self.stats.total_requests += batch_size
        
        # Update averages
        total_batches = self.stats.total_batches
        self.stats.avg_batch_size = (self.stats.avg_batch_size * (total_batches - 1) + batch_size) / total_batches
        self.stats.avg_processing_time = (self.stats.avg_processing_time * (total_batches - 1) + processing_time) / total_batches
        
        # Update throughput
        time_since_reset = time.time() - self.stats.last_reset
        if time_since_reset > 0:
            self.stats.throughput_per_second = self.stats.total_requests / time_since_reset
        
        # Update cache hit rate
        cache_info = getattr(self.prediction_cache, 'info', lambda: {'hits': 0, 'misses': 0})()
        total_cache_requests = cache_info.get('hits', 0) + cache_info.get('misses', 0)
        if total_cache_requests > 0:
            self.stats.cache_hit_rate = cache_info.get('hits', 0) / total_cache_requests
        
        # Store detailed stats for analysis
        self.detailed_stats['batch_sizes'].append(batch_size)
        self.detailed_stats['processing_times'].append(processing_time)
        
        # Keep only recent stats (last 1000 batches)
        for key in self.detailed_stats:
            if len(self.detailed_stats[key]) > 1000:
                self.detailed_stats[key] = self.detailed_stats[key][-1000:]
    
    def _update_model_performance(self, model_name: str, request_count: int, processing_time: float):
        """Update model-specific performance metrics"""
        if model_name in self.registered_models:
            model_info = self.registered_models[model_name]
            model_info['prediction_count'] += request_count
            model_info['total_time'] += processing_time
            
            # Calculate average time per prediction
            avg_time = model_info['total_time'] / model_info['prediction_count']
            self.model_performance[model_name]['avg_time_per_prediction'] = avg_time
            self.model_performance[model_name]['total_predictions'] = model_info['prediction_count']
            self.model_performance[model_name]['throughput'] = request_count / processing_time if processing_time > 0 else 0
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get comprehensive performance statistics"""
        return {
            'batch_stats': {
                'total_requests': self.stats.total_requests,
                'total_batches': self.stats.total_batches,
                'avg_batch_size': self.stats.avg_batch_size,
                'avg_processing_time': self.stats.avg_processing_time,
                'cache_hit_rate': self.stats.cache_hit_rate,
                'throughput_per_second': self.stats.throughput_per_second
            },
            'queue_stats': {
                'high_priority_queue': len(self.high_priority_queue),
                'medium_priority_queue': len(self.medium_priority_queue),
                'low_priority_queue': len(self.low_priority_queue),
                'pending_requests': len(self.pending_requests)
            },
            'cache_stats': {
                'cache_size': len(self.prediction_cache),
                'cache_maxsize': self.prediction_cache.maxsize,
                'cache_ttl': self.cache_ttl
            },
            'model_performance': dict(self.model_performance),
            'detailed_stats': {
                'recent_batch_sizes': self.detailed_stats['batch_sizes'][-10:],
                'recent_processing_times': self.detailed_stats['processing_times'][-10:],
                'avg_batch_size_last_100': np.mean(self.detailed_stats['batch_sizes'][-100:]) if self.detailed_stats['batch_sizes'] else 0,
                'avg_processing_time_last_100': np.mean(self.detailed_stats['processing_times'][-100:]) if self.detailed_stats['processing_times'] else 0
            }
        }
    
    def reset_stats(self):
        """Reset performance statistics"""
        self.stats = BatchProcessingStats()
        self.detailed_stats.clear()
        self.model_performance.clear()
        logger.info("Performance statistics reset")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about registered models"""
        return {
            model_name: {
                'registered_at': info['registered_at'].isoformat(),
                'prediction_count': info['prediction_count'],
                'total_time': info['total_time'],
                'has_batch_predict': info['batch_predict_fn'] is not None
            }
            for model_name, info in self.registered_models.items()
        }


# Global instance
batch_prediction_optimizer = BatchPredictionOptimizer()
