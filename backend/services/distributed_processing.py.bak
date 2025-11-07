"""
Distributed Processing Service using Ray

Implements distributed computing capabilities for modern ML pipeline:
- Parallel model inference
- Distributed feature engineering
- Scalable batch processing
- Load balancing across workers
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import torch

# Optional Ray import
try:
    import ray
    from ray import serve

    RAY_AVAILABLE = True
except ImportError:
    RAY_AVAILABLE = False
    logging.warning("Ray not available. Distributed processing disabled.")

logger = logging.getLogger(__name__)


class DistributedMLService:
    """Distributed ML service using Ray for scalable processing"""

    def __init__(self, num_workers: int = None):
        self.ray_available = RAY_AVAILABLE
        self.num_workers = num_workers or 4
        self.workers = []
        self.is_initialized = False

        if self.ray_available:
            self._initialize_ray()

    def _initialize_ray(self):
        """Initialize Ray cluster"""
        try:
            if not ray.is_initialized():
                # Initialize Ray with configuration
                ray.init(
                    ignore_reinit_error=True,
                    include_dashboard=False,  # Disable dashboard for production
                    num_cpus=self.num_workers,
                )

            self.is_initialized = True
            logger.info(f"Ray initialized with {self.num_workers} workers")

        except Exception as e:
            logger.error(f"Ray initialization failed: {e}")
            self.ray_available = False

    async def distributed_prediction(
        self, model_config: Dict[str, Any], batch_data: List[torch.Tensor]
    ) -> List[torch.Tensor]:
        """Perform distributed prediction across Ray workers"""
        if not self.ray_available or len(batch_data) < 4:
            return await self._local_prediction(model_config, batch_data)

        try:
            # Create remote prediction function
            @ray.remote
            class PredictionWorker:
                def __init__(self):
                    # Initialize model on worker
                    from .modern_ml_service import ModernMLService

                    self.ml_service = ModernMLService()

                def predict_batch(self, config, data_batch):
                    """Predict on a batch of data"""
                    import asyncio

                    return asyncio.run(self._predict_async(config, data_batch))

                async def _predict_async(self, config, data_batch):
                    results = []
                    for data in data_batch:
                        # Create mock prediction request
                        request = type(
                            "Request",
                            (),
                            {
                                "data": {"tensor_input": data.numpy().tolist()},
                                "sport": config.get("sport", "MLB"),
                                "prop_type": config.get("prop_type", "hits"),
                            },
                        )()

                        result = await self.ml_service.predict(request)
                        results.append(torch.tensor([result.prediction]))

                    return results

            # Create workers
            workers = [PredictionWorker.remote() for _ in range(self.num_workers)]

            # Split data among workers
            chunk_size = max(1, len(batch_data) // self.num_workers)
            data_chunks = [
                batch_data[i : i + chunk_size]
                for i in range(0, len(batch_data), chunk_size)
            ]

            # Distribute work
            futures = [
                workers[i % len(workers)].predict_batch.remote(model_config, chunk)
                for i, chunk in enumerate(data_chunks)
            ]

            # Gather results
            chunk_results = ray.get(futures)

            # Flatten results
            all_results = []
            for chunk_result in chunk_results:
                all_results.extend(chunk_result)

            return all_results

        except Exception as e:
            logger.error(f"Distributed prediction failed: {e}. Using local processing.")
            return await self._local_prediction(model_config, batch_data)

    async def _local_prediction(
        self, model_config: Dict[str, Any], batch_data: List[torch.Tensor]
    ) -> List[torch.Tensor]:
        """Fallback local prediction when distributed processing fails"""
        from .modern_ml_service import modern_ml_service

        results = []
        for data in batch_data:
            # Create mock request
            request = type(
                "Request",
                (),
                {
                    "data": {"tensor_input": data.numpy().tolist()},
                    "sport": model_config.get("sport", "MLB"),
                    "prop_type": model_config.get("prop_type", "hits"),
                },
            )()

            try:
                result = await modern_ml_service.predict(request)
                results.append(torch.tensor([result.prediction]))
            except Exception as e:
                logger.warning(f"Local prediction failed: {e}")
                results.append(torch.tensor([0.5]))  # Default prediction

        return results

    async def distributed_feature_engineering(
        self, raw_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Distribute feature engineering across workers"""
        if not self.ray_available or len(raw_data) < 10:
            return await self._local_feature_engineering(raw_data)

        try:

            @ray.remote
            def feature_engineering_worker(data_batch):
                import pandas as pd

                from .automated_feature_engineering import AutomatedFeatureEngineering

                feature_engineer = AutomatedFeatureEngineering()
                results = []

                for data in data_batch:
                    try:
                        # Convert to DataFrame
                        df = pd.DataFrame([data])

                        # Engineer features
                        features = feature_engineer.engineer_features(df, sport="MLB")

                        if isinstance(features, pd.DataFrame) and not features.empty:
                            results.append(features.iloc[0].to_dict())
                        else:
                            results.append(data)
                    except Exception:
                        results.append(data)

                return results

            # Split data for parallel processing
            chunk_size = max(1, len(raw_data) // self.num_workers)
            data_chunks = [
                raw_data[i : i + chunk_size]
                for i in range(0, len(raw_data), chunk_size)
            ]

            # Process in parallel
            futures = [
                feature_engineering_worker.remote(chunk) for chunk in data_chunks
            ]

            # Gather results
            chunk_results = ray.get(futures)

            # Flatten results
            all_results = []
            for chunk_result in chunk_results:
                all_results.extend(chunk_result)

            return all_results

        except Exception as e:
            logger.error(f"Distributed feature engineering failed: {e}")
            return await self._local_feature_engineering(raw_data)

    async def _local_feature_engineering(
        self, raw_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Local feature engineering fallback"""
        import pandas as pd

        from .automated_feature_engineering import automated_feature_engineering

        results = []
        for data in raw_data:
            try:
                df = pd.DataFrame([data])
                features = await automated_feature_engineering.engineer_features(
                    df, sport="MLB"
                )

                if isinstance(features, pd.DataFrame) and not features.empty:
                    results.append(features.iloc[0].to_dict())
                else:
                    results.append(data)
            except Exception:
                results.append(data)

        return results

    def get_cluster_info(self) -> Dict[str, Any]:
        """Get Ray cluster information"""
        if not self.ray_available:
            return {"status": "unavailable", "reason": "Ray not installed"}

        try:
            cluster_resources = ray.cluster_resources()
            return {
                "status": "available",
                "nodes": len(ray.nodes()),
                "cpus": cluster_resources.get("CPU", 0),
                "memory": cluster_resources.get("memory", 0),
                "gpus": cluster_resources.get("GPU", 0),
                "initialized": self.is_initialized,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def shutdown(self):
        """Shutdown Ray cluster"""
        if self.ray_available and ray.is_initialized():
            ray.shutdown()
            logger.info("Ray cluster shut down")


class ParallelBatchProcessor:
    """High-performance parallel batch processor"""

    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.processing_queue = asyncio.Queue()
        self.workers_active = False

    async def start_workers(self):
        """Start background workers for batch processing"""
        if self.workers_active:
            return

        self.workers_active = True

        # Start worker tasks
        worker_tasks = [
            asyncio.create_task(self._worker(f"worker_{i}"))
            for i in range(self.max_workers)
        ]

        logger.info(f"Started {self.max_workers} parallel batch workers")
        return worker_tasks

    async def _worker(self, worker_id: str):
        """Background worker for processing batches"""
        logger.info(f"Batch worker {worker_id} started")

        while self.workers_active:
            try:
                # Get batch from queue
                batch_item = await asyncio.wait_for(
                    self.processing_queue.get(), timeout=1.0
                )

                # Process batch
                await self._process_batch_item(batch_item, worker_id)

                # Mark task done
                self.processing_queue.task_done()

            except asyncio.TimeoutError:
                # No work available, continue polling
                continue
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")

    async def _process_batch_item(self, batch_item: Dict[str, Any], worker_id: str):
        """Process a single batch item"""
        try:
            batch_type = batch_item.get("type")
            data = batch_item.get("data")
            callback = batch_item.get("callback")

            start_time = time.time()

            if batch_type == "prediction":
                result = await self._process_prediction_batch(data)
            elif batch_type == "feature_engineering":
                result = await self._process_feature_batch(data)
            else:
                result = {"error": f"Unknown batch type: {batch_type}"}

            processing_time = time.time() - start_time

            # Call callback with result
            if callback:
                await callback(
                    {
                        "result": result,
                        "processing_time": processing_time,
                        "worker_id": worker_id,
                    }
                )

        except Exception as e:
            logger.error(f"Batch processing error in {worker_id}: {e}")

    async def _process_prediction_batch(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process prediction batch"""
        # Implement batch prediction logic
        return {"predictions": [], "batch_size": 0}

    async def _process_feature_batch(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process feature engineering batch"""
        # Implement batch feature engineering logic
        return {"features": [], "batch_size": 0}

    async def submit_batch(
        self, batch_type: str, data: Dict[str, Any], callback: Optional[callable] = None
    ):
        """Submit batch for processing"""
        batch_item = {
            "type": batch_type,
            "data": data,
            "callback": callback,
            "timestamp": time.time(),
        }

        await self.processing_queue.put(batch_item)

    def stop_workers(self):
        """Stop all workers"""
        self.workers_active = False
        logger.info("Batch workers stopped")

    def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        return {
            "queue_size": self.processing_queue.qsize(),
            "workers_active": self.workers_active,
            "max_workers": self.max_workers,
        }


class LoadBalancer:
    """Simple load balancer for distributing requests"""

    def __init__(self, workers: List[str]):
        self.workers = workers
        self.current_index = 0
        self.worker_loads = {worker: 0 for worker in workers}

    def get_next_worker(self) -> str:
        """Get next worker using round-robin"""
        if not self.workers:
            raise ValueError("No workers available")

        worker = self.workers[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.workers)
        return worker

    def get_least_loaded_worker(self) -> str:
        """Get worker with least load"""
        if not self.workers:
            raise ValueError("No workers available")

        return min(self.worker_loads.items(), key=lambda x: x[1])[0]

    def record_request(self, worker: str):
        """Record request for load tracking"""
        if worker in self.worker_loads:
            self.worker_loads[worker] += 1

    def record_completion(self, worker: str):
        """Record request completion"""
        if worker in self.worker_loads and self.worker_loads[worker] > 0:
            self.worker_loads[worker] -= 1

    def get_load_stats(self) -> Dict[str, Any]:
        """Get load balancing statistics"""
        return {
            "workers": self.workers,
            "current_loads": self.worker_loads.copy(),
            "total_load": sum(self.worker_loads.values()),
        }


# Global instances
distributed_ml_service = DistributedMLService()
parallel_batch_processor = ParallelBatchProcessor()

logger.info("Distributed processing service initialized")
logger.info(f"Ray available: {RAY_AVAILABLE}")
if RAY_AVAILABLE:
    logger.info("Distributed computing capabilities enabled")
else:
    logger.info("Using local parallel processing")
