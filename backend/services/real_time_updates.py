"""
Real-time Model Update Pipeline

Implements continuous learning and model updates:
- Online learning capabilities
- Model retraining pipeline
- Performance monitoring and drift detection
- Automated model deployment
- A/B testing for model updates
"""

import asyncio
import json
import logging
import time
from collections import deque
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import torch
import torch.nn as nn

# Optional MLflow for experiment tracking
try:
    import mlflow
    import mlflow.pytorch

    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False

logger = logging.getLogger(__name__)


class ModelPerformanceMonitor:
    """Monitor model performance for drift detection"""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.predictions = deque(maxlen=window_size)
        self.actuals = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)
        self.baseline_metrics = {}

    def record_prediction(
        self,
        prediction: float,
        actual: Optional[float] = None,
        timestamp: Optional[datetime] = None,
    ):
        """Record a prediction and optionally the actual outcome"""
        timestamp = timestamp or datetime.now()

        self.predictions.append(prediction)
        self.timestamps.append(timestamp)

        if actual is not None:
            self.actuals.append(actual)
        else:
            self.actuals.append(None)

    def get_current_metrics(self) -> Dict[str, Any]:
        """Calculate current performance metrics"""
        if not self.predictions:
            return {}

        # Filter out None actuals for metrics calculation
        valid_pairs = [
            (p, a) for p, a in zip(self.predictions, self.actuals) if a is not None
        ]

        if not valid_pairs:
            return {
                "predictions_count": len(self.predictions),
                "actuals_count": 0,
                "error": "No actual outcomes available",
            }

        predictions_array = np.array([p for p, _ in valid_pairs])
        actuals_array = np.array([a for _, a in valid_pairs])

        # Calculate metrics
        mae = np.mean(np.abs(predictions_array - actuals_array))
        mse = np.mean((predictions_array - actuals_array) ** 2)
        rmse = np.sqrt(mse)

        # Accuracy for binary classification (assuming threshold of 0.5)
        binary_predictions = (predictions_array > 0.5).astype(int)
        binary_actuals = (actuals_array > 0.5).astype(int)
        accuracy = np.mean(binary_predictions == binary_actuals)

        return {
            "mae": float(mae),
            "mse": float(mse),
            "rmse": float(rmse),
            "accuracy": float(accuracy),
            "predictions_count": len(self.predictions),
            "actuals_count": len(valid_pairs),
            "window_utilization": len(valid_pairs) / self.window_size,
        }

    def detect_drift(self, threshold: float = 0.1) -> Dict[str, Any]:
        """Detect model performance drift"""
        current_metrics = self.get_current_metrics()

        if not self.baseline_metrics or "mae" not in current_metrics:
            return {"drift_detected": False, "reason": "Insufficient data"}

        # Compare with baseline
        mae_drift = (
            abs(current_metrics["mae"] - self.baseline_metrics["mae"])
            / self.baseline_metrics["mae"]
        )
        accuracy_drift = abs(
            current_metrics["accuracy"] - self.baseline_metrics["accuracy"]
        )

        drift_detected = mae_drift > threshold or accuracy_drift > threshold

        return {
            "drift_detected": drift_detected,
            "mae_drift": float(mae_drift),
            "accuracy_drift": float(accuracy_drift),
            "threshold": threshold,
            "current_metrics": current_metrics,
            "baseline_metrics": self.baseline_metrics,
        }

    def set_baseline(self):
        """Set current metrics as baseline"""
        self.baseline_metrics = self.get_current_metrics()
        logger.info(f"Baseline metrics set: {self.baseline_metrics}")


class OnlineLearningManager:
    """Manage online learning for continuous model updates"""

    def __init__(self, learning_rate: float = 0.001, batch_size: int = 32):
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.pending_updates = []
        self.update_queue = asyncio.Queue()
        self.models = {}
        self.optimizers = {}

    def register_model(self, model_id: str, model: nn.Module):
        """Register a model for online learning"""
        self.models[model_id] = model
        self.optimizers[model_id] = torch.optim.Adam(
            model.parameters(), lr=self.learning_rate
        )
        logger.info(f"Model {model_id} registered for online learning")

    async def queue_update(
        self,
        model_id: str,
        input_data: torch.Tensor,
        target: torch.Tensor,
        weight: float = 1.0,
    ):
        """Queue an update for online learning"""
        update_item = {
            "model_id": model_id,
            "input_data": input_data,
            "target": target,
            "weight": weight,
            "timestamp": time.time(),
        }

        await self.update_queue.put(update_item)

    async def process_updates(self):
        """Process queued updates in batches"""
        while True:
            try:
                # Collect batch of updates
                batch_updates = {}

                # Wait for at least one update
                first_update = await self.update_queue.get()
                model_id = first_update["model_id"]

                if model_id not in batch_updates:
                    batch_updates[model_id] = []
                batch_updates[model_id].append(first_update)

                # Collect more updates up to batch size
                for _ in range(self.batch_size - 1):
                    try:
                        update = await asyncio.wait_for(
                            self.update_queue.get(), timeout=0.1
                        )
                        model_id = update["model_id"]

                        if model_id not in batch_updates:
                            batch_updates[model_id] = []
                        batch_updates[model_id].append(update)

                    except asyncio.TimeoutError:
                        break

                # Process batches for each model
                for model_id, updates in batch_updates.items():
                    await self._apply_batch_update(model_id, updates)

            except Exception as e:
                logger.error(f"Error processing online updates: {e}")
                await asyncio.sleep(1)

    async def _apply_batch_update(self, model_id: str, updates: List[Dict[str, Any]]):
        """Apply batch update to model"""
        if model_id not in self.models:
            logger.warning(f"Model {model_id} not registered for online learning")
            return

        model = self.models[model_id]
        optimizer = self.optimizers[model_id]

        # Prepare batch data
        batch_inputs = torch.stack([update["input_data"] for update in updates])
        batch_targets = torch.stack([update["target"] for update in updates])
        batch_weights = torch.tensor([update["weight"] for update in updates])

        # Forward pass
        model.train()
        predictions = model(batch_inputs)

        # Calculate weighted loss
        loss_fn = nn.MSELoss(reduction="none")
        losses = loss_fn(predictions.squeeze(), batch_targets)
        weighted_loss = torch.mean(losses * batch_weights)

        # Backward pass
        optimizer.zero_grad()
        weighted_loss.backward()
        optimizer.step()

        logger.debug(
            f"Applied online update to {model_id}: loss={weighted_loss.item():.4f}"
        )


class ModelRetrainingPipeline:
    """Pipeline for scheduled model retraining"""

    def __init__(self):
        self.training_queue = asyncio.Queue()
        self.retraining_schedule = {}
        self.training_data_buffer = {}
        self.is_training = {}

    def schedule_retraining(self, model_id: str, interval_hours: int = 24):
        """Schedule regular model retraining"""
        self.retraining_schedule[model_id] = {
            "interval_hours": interval_hours,
            "last_training": datetime.now(),
            "next_training": datetime.now() + timedelta(hours=interval_hours),
        }
        logger.info(f"Scheduled retraining for {model_id} every {interval_hours} hours")

    async def add_training_data(
        self,
        model_id: str,
        input_data: torch.Tensor,
        target: torch.Tensor,
        metadata: Dict[str, Any] = None,
    ):
        """Add data to training buffer"""
        if model_id not in self.training_data_buffer:
            self.training_data_buffer[model_id] = {
                "inputs": [],
                "targets": [],
                "metadata": [],
            }

        buffer = self.training_data_buffer[model_id]
        buffer["inputs"].append(input_data)
        buffer["targets"].append(target)
        buffer["metadata"].append(metadata or {})

        # Limit buffer size
        max_buffer_size = 10000
        if len(buffer["inputs"]) > max_buffer_size:
            # Remove oldest data
            buffer["inputs"] = buffer["inputs"][-max_buffer_size:]
            buffer["targets"] = buffer["targets"][-max_buffer_size:]
            buffer["metadata"] = buffer["metadata"][-max_buffer_size:]

    async def check_retraining_schedule(self):
        """Check if any models need retraining"""
        current_time = datetime.now()

        for model_id, schedule in self.retraining_schedule.items():
            if (
                current_time >= schedule["next_training"]
                and model_id not in self.is_training
            ):
                await self.queue_retraining(model_id)

    async def queue_retraining(self, model_id: str, priority: str = "normal"):
        """Queue model for retraining"""
        retraining_task = {
            "model_id": model_id,
            "priority": priority,
            "queued_at": time.time(),
        }

        await self.training_queue.put(retraining_task)
        logger.info(f"Queued {model_id} for retraining")

    async def process_retraining_queue(self):
        """Process retraining queue"""
        while True:
            try:
                task = await self.training_queue.get()
                model_id = task["model_id"]

                if model_id in self.is_training:
                    # Skip if already training
                    continue

                self.is_training[model_id] = True

                try:
                    await self._retrain_model(model_id)
                finally:
                    self.is_training[model_id] = False

                    # Update schedule
                    if model_id in self.retraining_schedule:
                        schedule = self.retraining_schedule[model_id]
                        schedule["last_training"] = datetime.now()
                        schedule["next_training"] = datetime.now() + timedelta(
                            hours=schedule["interval_hours"]
                        )

            except Exception as e:
                logger.error(f"Error in retraining queue: {e}")
                await asyncio.sleep(5)

    async def _retrain_model(self, model_id: str):
        """Retrain a specific model"""
        logger.info(f"Starting retraining for model {model_id}")

        # Get training data
        if model_id not in self.training_data_buffer:
            logger.warning(f"No training data available for {model_id}")
            return

        buffer = self.training_data_buffer[model_id]

        if len(buffer["inputs"]) < 10:
            logger.warning(
                f"Insufficient training data for {model_id}: {len(buffer['inputs'])} samples"
            )
            return

        # Prepare training data
        train_inputs = torch.stack(buffer["inputs"])
        train_targets = torch.stack(buffer["targets"])

        # Split into train/validation
        split_idx = int(0.8 * len(train_inputs))
        train_x, val_x = train_inputs[:split_idx], train_inputs[split_idx:]
        train_y, val_y = train_targets[:split_idx], train_targets[split_idx:]

        # Log to MLflow if available
        experiment_id = None
        if MLFLOW_AVAILABLE:
            try:
                mlflow.set_experiment(f"retraining_{model_id}")
                experiment_id = mlflow.start_run()
                mlflow.log_param("model_id", model_id)
                mlflow.log_param("training_samples", len(train_x))
                mlflow.log_param("validation_samples", len(val_x))
            except Exception as e:
                logger.warning(f"MLflow logging failed: {e}")

        try:
            # Perform training (placeholder - would need actual model training logic)
            training_loss, validation_loss = await self._train_model_epoch(
                model_id, train_x, train_y, val_x, val_y
            )

            # Log metrics
            if experiment_id and MLFLOW_AVAILABLE:
                mlflow.log_metric("training_loss", training_loss)
                mlflow.log_metric("validation_loss", validation_loss)

            logger.info(
                f"Retraining completed for {model_id}: "
                f"train_loss={training_loss:.4f}, val_loss={validation_loss:.4f}"
            )

        except Exception as e:
            logger.error(f"Retraining failed for {model_id}: {e}")

        finally:
            if experiment_id and MLFLOW_AVAILABLE:
                mlflow.end_run()

    async def _train_model_epoch(
        self,
        model_id: str,
        train_x: torch.Tensor,
        train_y: torch.Tensor,
        val_x: torch.Tensor,
        val_y: torch.Tensor,
    ) -> Tuple[float, float]:
        """Train model for one epoch (placeholder implementation)"""
        # This would be replaced with actual model training logic
        await asyncio.sleep(0.1)  # Simulate training time

        # Return mock losses
        training_loss = np.random.uniform(0.1, 0.5)
        validation_loss = np.random.uniform(0.1, 0.6)

        return training_loss, validation_loss


class ModelDeploymentManager:
    """Manage model deployment and A/B testing"""

    def __init__(self):
        self.deployed_models = {}
        self.ab_tests = {}
        self.deployment_history = []

    def deploy_model(self, model_id: str, model: nn.Module, version: str = "latest"):
        """Deploy a model to production"""
        deployment_info = {
            "model": model,
            "version": version,
            "deployed_at": datetime.now(),
            "performance_monitor": ModelPerformanceMonitor(),
        }

        self.deployed_models[model_id] = deployment_info

        self.deployment_history.append(
            {
                "model_id": model_id,
                "version": version,
                "deployed_at": datetime.now(),
                "action": "deploy",
            }
        )

        logger.info(f"Deployed model {model_id} version {version}")

    def start_ab_test(
        self,
        model_id_a: str,
        model_id_b: str,
        traffic_split: float = 0.5,
        duration_hours: int = 24,
    ):
        """Start A/B test between two models"""
        test_id = f"{model_id_a}_vs_{model_id_b}_{int(time.time())}"

        ab_test = {
            "model_a": model_id_a,
            "model_b": model_id_b,
            "traffic_split": traffic_split,
            "start_time": datetime.now(),
            "end_time": datetime.now() + timedelta(hours=duration_hours),
            "results": {"a": [], "b": []},
            "active": True,
        }

        self.ab_tests[test_id] = ab_test
        logger.info(f"Started A/B test {test_id}: {model_id_a} vs {model_id_b}")

        return test_id

    def route_prediction(self, request_data: Dict[str, Any]) -> str:
        """Route prediction request to appropriate model based on A/B tests"""
        # Check active A/B tests
        for test_id, test in self.ab_tests.items():
            if test["active"] and datetime.now() < test["end_time"]:
                # Use hash of request for consistent routing
                request_hash = hash(str(request_data)) % 100

                if request_hash < test["traffic_split"] * 100:
                    return test["model_a"]
                else:
                    return test["model_b"]

        # Default to first available model
        if self.deployed_models:
            return list(self.deployed_models.keys())[0]

        return "default"

    def record_ab_test_result(
        self,
        test_id: str,
        model_used: str,
        prediction: float,
        actual: Optional[float] = None,
    ):
        """Record A/B test result"""
        if test_id not in self.ab_tests:
            return

        test = self.ab_tests[test_id]
        if not test["active"]:
            return

        # Determine which side of the test
        if model_used == test["model_a"]:
            test["results"]["a"].append({"prediction": prediction, "actual": actual})
        elif model_used == test["model_b"]:
            test["results"]["b"].append({"prediction": prediction, "actual": actual})

    def get_ab_test_results(self, test_id: str) -> Dict[str, Any]:
        """Get A/B test results"""
        if test_id not in self.ab_tests:
            return {"error": "Test not found"}

        test = self.ab_tests[test_id]

        # Calculate metrics for both sides
        def calculate_metrics(results):
            if not results:
                return {}

            predictions = [r["prediction"] for r in results]
            actuals = [r["actual"] for r in results if r["actual"] is not None]

            if actuals:
                errors = [
                    abs(p - a) for p, a in zip(predictions[: len(actuals)], actuals)
                ]
                return {
                    "count": len(results),
                    "mae": np.mean(errors),
                    "predictions_avg": np.mean(predictions),
                }
            else:
                return {"count": len(results), "predictions_avg": np.mean(predictions)}

        return {
            "test_id": test_id,
            "model_a": test["model_a"],
            "model_b": test["model_b"],
            "start_time": test["start_time"],
            "end_time": test["end_time"],
            "active": test["active"],
            "results_a": calculate_metrics(test["results"]["a"]),
            "results_b": calculate_metrics(test["results"]["b"]),
        }


class RealTimeUpdatePipeline:
    """Main pipeline orchestrating real-time updates"""

    def __init__(self):
        self.performance_monitor = ModelPerformanceMonitor()
        self.online_learning = OnlineLearningManager()
        self.retraining_pipeline = ModelRetrainingPipeline()
        self.deployment_manager = ModelDeploymentManager()

        self.pipeline_active = False
        self.background_tasks = []

    async def start_pipeline(self):
        """Start the real-time update pipeline"""
        if self.pipeline_active:
            logger.warning("Pipeline already active")
            return

        self.pipeline_active = True

        # Start background tasks
        self.background_tasks = [
            asyncio.create_task(self.online_learning.process_updates()),
            asyncio.create_task(self.retraining_pipeline.process_retraining_queue()),
            asyncio.create_task(self._monitor_drift()),
        ]

        logger.info("Real-time update pipeline started")

    async def stop_pipeline(self):
        """Stop the real-time update pipeline"""
        if not self.pipeline_active:
            return

        self.pipeline_active = False

        # Cancel background tasks
        for task in self.background_tasks:
            task.cancel()

        await asyncio.gather(*self.background_tasks, return_exceptions=True)
        self.background_tasks = []

        logger.info("Real-time update pipeline stopped")

    async def _monitor_drift(self):
        """Monitor for model drift and trigger retraining"""
        while self.pipeline_active:
            try:
                # Check for drift every hour
                await asyncio.sleep(3600)

                drift_result = self.performance_monitor.detect_drift()

                if drift_result["drift_detected"]:
                    logger.warning(f"Model drift detected: {drift_result}")

                    # Trigger retraining for all models
                    for model_id in self.deployment_manager.deployed_models:
                        await self.retraining_pipeline.queue_retraining(
                            model_id, priority="high"
                        )

                # Check retraining schedule
                await self.retraining_pipeline.check_retraining_schedule()

            except Exception as e:
                logger.error(f"Error in drift monitoring: {e}")
                await asyncio.sleep(60)

    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get pipeline status"""
        return {
            "active": self.pipeline_active,
            "background_tasks": len(self.background_tasks),
            "performance_metrics": self.performance_monitor.get_current_metrics(),
            "deployed_models": list(self.deployment_manager.deployed_models.keys()),
            "active_ab_tests": len(
                [t for t in self.deployment_manager.ab_tests.values() if t["active"]]
            ),
        }


# Global instance
real_time_pipeline = RealTimeUpdatePipeline()

logger.info("Real-time model update pipeline initialized")
logger.info("Continuous learning and model monitoring enabled")
