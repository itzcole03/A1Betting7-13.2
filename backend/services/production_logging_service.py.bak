"""
Production Logging Service with Structured Error Tracking
Implements comprehensive logging, monitoring, and validation for production stability.
"""

import asyncio
import json
import logging
import time
import traceback
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class LogLevel(Enum):
    """Enhanced log levels for production monitoring"""

    CRITICAL_SYSTEM = "CRITICAL_SYSTEM"  # System-wide critical failures
    ERROR_BACKGROUND_TASKS = "ERROR_BACKGROUND_TASKS"  # Background task failures
    WARNING_PERFORMANCE = "WARNING_PERFORMANCE"  # Performance degradation
    INFO_SYSTEM_HEALTH = "INFO_SYSTEM_HEALTH"  # System health metrics
    DEBUG_ASYNC_OPERATIONS = "DEBUG_ASYNC_OPERATIONS"  # Async operation debugging


@dataclass
class SystemHealthMetrics:
    """Comprehensive system health tracking"""

    timestamp: str
    backend_status: str
    background_tasks_active: int
    background_tasks_failed: int
    connection_pool_size: int
    memory_usage_mb: float
    response_time_ms: float
    error_rate_percent: float


class ProductionLoggingService:
    """Enterprise-grade logging service for production stability monitoring"""

    def __init__(self):
        self.logger = self._setup_structured_logger()
        self.metrics_history: List[SystemHealthMetrics] = []
        self.error_tracking: Dict[str, int] = {}
        self.performance_baselines = {
            "response_time_ms": 100.0,
            "error_rate_percent": 1.0,
            "background_task_failure_rate": 0.1,
        }

    def _setup_structured_logger(self) -> logging.Logger:
        """Setup structured JSON logging for production monitoring"""
        logger = logging.getLogger("A1Betting.Production")
        logger.setLevel(logging.DEBUG)

        # Clear existing handlers
        logger.handlers.clear()

        # Create structured formatter
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        # Console handler for immediate monitoring
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # File handler for persistent logging
        try:
            file_handler = logging.FileHandler("backend/logs/production_stability.log")
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Could not setup file handler: {e}")

        return logger

    def log_system_health(self, metrics: SystemHealthMetrics) -> None:
        """Log comprehensive system health metrics"""
        self.metrics_history.append(metrics)

        # Keep only last 100 metrics to prevent memory bloat
        if len(self.metrics_history) > 100:
            self.metrics_history = self.metrics_history[-100:]

        # Log structured health data
        health_data = {
            "event_type": "system_health_check",
            "metrics": asdict(metrics),
            "performance_status": self._assess_performance(metrics),
        }

        self.logger.info(f"🏥 System Health: {json.dumps(health_data, indent=2)}")

        # Alert on performance degradation
        if (
            metrics.error_rate_percent
            > self.performance_baselines["error_rate_percent"]
        ):
            self.log_performance_alert("ERROR_RATE_HIGH", metrics.error_rate_percent)

        if metrics.response_time_ms > self.performance_baselines["response_time_ms"]:
            self.log_performance_alert("RESPONSE_TIME_HIGH", metrics.response_time_ms)

    def log_background_task_status(
        self, task_name: str, status: str, details: Dict[str, Any]
    ) -> None:
        """Log background task operations with detailed tracking"""
        log_data = {
            "event_type": "background_task_operation",
            "task_name": task_name,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "details": details,
        }

        if status == "SUCCESS":
            self.logger.info(
                f"✅ Background Task Success: {json.dumps(log_data, indent=2)}"
            )
        elif status == "FAILED":
            self.error_tracking[f"background_task_{task_name}"] = (
                self.error_tracking.get(f"background_task_{task_name}", 0) + 1
            )
            self.logger.error(
                f"❌ Background Task Failed: {json.dumps(log_data, indent=2)}"
            )
        elif status == "STARTED":
            self.logger.info(
                f"🚀 Background Task Started: {json.dumps(log_data, indent=2)}"
            )

    def log_async_operation_debug(
        self, operation: str, coroutine_info: Dict[str, Any]
    ) -> None:
        """Debug logging for async operations to prevent coroutine issues"""
        debug_data = {
            "event_type": "async_operation_debug",
            "operation": operation,
            "timestamp": datetime.now().isoformat(),
            "coroutine_info": coroutine_info,
        }

        self.logger.debug(f"🔧 Async Debug: {json.dumps(debug_data, indent=2)}")

    def log_critical_error(
        self,
        error_type: str,
        error_details: Dict[str, Any],
        stack_trace: Optional[str] = None,
    ) -> None:
        """Log critical system errors with full context"""
        error_data = {
            "event_type": "critical_system_error",
            "error_type": error_type,
            "timestamp": datetime.now().isoformat(),
            "details": error_details,
            "stack_trace": stack_trace or traceback.format_exc(),
        }

        # Track error frequency
        self.error_tracking[error_type] = self.error_tracking.get(error_type, 0) + 1

        self.logger.critical(f"🚨 CRITICAL ERROR: {json.dumps(error_data, indent=2)}")

    def log_performance_alert(self, alert_type: str, current_value: float) -> None:
        """Log performance degradation alerts"""
        alert_data = {
            "event_type": "performance_alert",
            "alert_type": alert_type,
            "current_value": current_value,
            "baseline": self.performance_baselines.get(
                alert_type.lower().replace("_", "_").split("_")[0]
                + "_"
                + alert_type.lower().split("_")[1],
                0,
            ),
            "timestamp": datetime.now().isoformat(),
        }

        self.logger.warning(f"⚠️ Performance Alert: {json.dumps(alert_data, indent=2)}")

    def _assess_performance(self, metrics: SystemHealthMetrics) -> str:
        """Assess overall system performance status"""
        if metrics.error_rate_percent > 5.0:
            return "CRITICAL"
        elif metrics.error_rate_percent > 2.0:
            return "DEGRADED"
        elif metrics.response_time_ms > 200:
            return "SLOW"
        else:
            return "HEALTHY"

    def get_error_summary(self) -> Dict[str, Any]:
        """Get comprehensive error tracking summary"""
        return {
            "total_errors": sum(self.error_tracking.values()),
            "error_breakdown": dict(self.error_tracking),
            "most_frequent_error": (
                max(self.error_tracking.items(), key=lambda x: x[1])
                if self.error_tracking
                else None
            ),
            "generated_at": datetime.now().isoformat(),
        }

    async def validate_async_operations(self) -> Dict[str, bool]:
        """Validate that async operations are working correctly"""
        validation_results = {}

        try:
            # Test basic async operation
            test_task = asyncio.create_task(self._test_async_operation())
            result = await asyncio.wait_for(test_task, timeout=1.0)
            validation_results["basic_async"] = result

            # Test multiple concurrent operations
            tasks = [
                asyncio.create_task(self._test_async_operation()) for _ in range(3)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            validation_results["concurrent_async"] = all(
                r is True for r in results if not isinstance(r, Exception)
            )

            # Test async queue operations (like the fixed TaskQueue.get())
            queue = asyncio.Queue()
            await queue.put("test_data")
            get_task = asyncio.create_task(queue.get())
            queue_result = await asyncio.wait_for(get_task, timeout=0.5)
            validation_results["async_queue"] = queue_result == "test_data"

        except Exception as e:
            self.log_critical_error(
                "ASYNC_VALIDATION_FAILED",
                {"error": str(e), "operation": "validate_async_operations"},
            )
            validation_results["validation_failed"] = str(e)

        return validation_results

    async def _test_async_operation(self) -> bool:
        """Simple async operation for testing"""
        await asyncio.sleep(0.01)
        return True


# Global production logging service instance
production_logger = ProductionLoggingService()
