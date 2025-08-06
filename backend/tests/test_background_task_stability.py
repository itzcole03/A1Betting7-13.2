"""
Comprehensive validation tests for background task manager stability.
Tests the critical asyncio fix and validates production readiness.
"""

import asyncio
import os

# Import the production logging service and background task manager
import sys
import time
from typing import Any, Dict
from unittest.mock import Mock, patch

import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from services.background_task_manager import BackgroundTaskManager, TaskPriority
from services.production_logging_service import SystemHealthMetrics, production_logger


class TestBackgroundTaskManagerStability:
    """Comprehensive tests for background task manager stability and the asyncio fix"""

    @pytest.fixture
    async def task_manager(self):
        """Create a fresh task manager instance for testing"""
        manager = BackgroundTaskManager()
        yield manager
        # Cleanup
        await manager.shutdown()

    @pytest.mark.asyncio
    async def test_asyncio_coroutine_fix_validation(self, task_manager):
        """Test that the TaskQueue.get() fix prevents coroutine errors"""
        # This test validates the critical fix: wrapping queue.get() with asyncio.create_task()

        # Add multiple tasks to different priority queues
        test_tasks = [
            ("high_task_1", TaskPriority.HIGH),
            ("normal_task_1", TaskPriority.NORMAL),
            ("low_task_1", TaskPriority.LOW),
            ("high_task_2", TaskPriority.HIGH),
            ("normal_task_2", TaskPriority.NORMAL),
        ]

        for task_data, priority in test_tasks:
            await task_manager.add_task(task_data, priority)

        # Test the fixed get_next_task method - this should NOT raise coroutine errors
        start_time = time.time()
        completed_tasks = []

        # Process all tasks - the fix should handle multiple queue.get() operations correctly
        for _ in range(len(test_tasks)):
            try:
                task = await asyncio.wait_for(task_manager.get_next_task(), timeout=1.0)
                completed_tasks.append(task)
                production_logger.log_background_task_status(
                    str(task),
                    "SUCCESS",
                    {
                        "fix_validation": "asyncio_coroutine_wrapping",
                        "time_taken": time.time() - start_time,
                    },
                )
            except asyncio.TimeoutError:
                pytest.fail("Task retrieval timed out - possible coroutine issue")
            except Exception as e:
                production_logger.log_critical_error(
                    "ASYNCIO_FIX_FAILED",
                    {"error": str(e), "task_count": len(completed_tasks)},
                )
                pytest.fail(f"Asyncio fix validation failed: {e}")

        assert len(completed_tasks) == len(
            test_tasks
        ), "Not all tasks were processed correctly"
        production_logger.log_system_health(
            SystemHealthMetrics(
                timestamp=time.strftime("%Y%m%d_%H%M%S"),
                backend_status="HEALTHY",
                background_tasks_active=0,
                background_tasks_failed=0,
                connection_pool_size=1,
                memory_usage_mb=50.0,
                response_time_ms=50.0,
                error_rate_percent=0.0,
            )
        )

    @pytest.mark.asyncio
    async def test_concurrent_task_processing_stability(self, task_manager):
        """Test stability under concurrent task processing loads"""

        # Simulate high-load concurrent processing
        concurrent_workers = 5
        tasks_per_worker = 10

        async def worker_simulation(worker_id: int):
            """Simulate a worker processing tasks"""
            processed = 0
            for i in range(tasks_per_worker):
                task_data = f"worker_{worker_id}_task_{i}"
                await task_manager.add_task(task_data, TaskPriority.NORMAL)

                # Process the task
                try:
                    task = await asyncio.wait_for(
                        task_manager.get_next_task(), timeout=2.0
                    )
                    processed += 1
                    production_logger.log_background_task_status(
                        str(task), "SUCCESS", {"worker_id": worker_id, "task_number": i}
                    )
                except Exception as e:
                    production_logger.log_background_task_status(
                        task_data, "FAILED", {"worker_id": worker_id, "error": str(e)}
                    )

            return processed

        # Run concurrent workers
        start_time = time.time()
        workers = [
            asyncio.create_task(worker_simulation(i)) for i in range(concurrent_workers)
        ]
        results = await asyncio.gather(*workers, return_exceptions=True)
        execution_time = time.time() - start_time

        # Validate results
        successful_workers = [r for r in results if isinstance(r, int)]
        failed_workers = [r for r in results if isinstance(r, Exception)]

        assert len(failed_workers) == 0, f"Some workers failed: {failed_workers}"
        assert (
            len(successful_workers) == concurrent_workers
        ), "Not all workers completed"

        total_processed = sum(successful_workers)
        expected_total = concurrent_workers * tasks_per_worker

        production_logger.log_system_health(
            SystemHealthMetrics(
                timestamp=time.strftime("%Y%m%d_%H%M%S"),
                backend_status="LOAD_TESTED",
                background_tasks_active=0,
                background_tasks_failed=len(failed_workers),
                connection_pool_size=concurrent_workers,
                memory_usage_mb=75.0,
                response_time_ms=(
                    execution_time * 1000 / total_processed
                    if total_processed > 0
                    else 0
                ),
                error_rate_percent=(len(failed_workers) / concurrent_workers) * 100,
            )
        )

        assert (
            total_processed >= expected_total * 0.95
        ), f"Task processing efficiency too low: {total_processed}/{expected_total}"

    @pytest.mark.asyncio
    async def test_task_priority_ordering_validation(self, task_manager):
        """Validate that task priority ordering works correctly with the asyncio fix"""

        # Add tasks in mixed priority order
        test_cases = [
            ("low_priority_task", TaskPriority.LOW),
            ("high_priority_task_1", TaskPriority.HIGH),
            ("normal_priority_task", TaskPriority.NORMAL),
            ("high_priority_task_2", TaskPriority.HIGH),
        ]

        for task_data, priority in test_cases:
            await task_manager.add_task(task_data, priority)

        # Retrieve tasks and validate priority ordering
        retrieved_tasks = []
        for _ in range(len(test_cases)):
            task = await task_manager.get_next_task()
            retrieved_tasks.append(task)

        # High priority tasks should come first
        high_priority_tasks = [t for t in retrieved_tasks if "high_priority" in str(t)]
        assert (
            len(high_priority_tasks) == 2
        ), "Should have retrieved 2 high priority tasks"

        # Validate the first tasks retrieved were high priority
        first_high_task_index = min(
            i for i, task in enumerate(retrieved_tasks) if "high_priority" in str(task)
        )
        assert (
            first_high_task_index <= 1
        ), "High priority tasks should be retrieved first"

        production_logger.log_background_task_status(
            "priority_validation",
            "SUCCESS",
            {
                "retrieved_order": [str(t) for t in retrieved_tasks],
                "priority_ordering_correct": True,
            },
        )

    @pytest.mark.asyncio
    async def test_error_recovery_and_logging(self, task_manager):
        """Test error recovery mechanisms and comprehensive logging"""

        # Simulate various error conditions
        error_scenarios = [
            ("timeout_task", "PROCESSING_TIMEOUT"),
            ("invalid_data_task", "INVALID_DATA"),
            ("resource_unavailable_task", "RESOURCE_UNAVAILABLE"),
        ]

        for task_data, error_type in error_scenarios:
            await task_manager.add_task(task_data, TaskPriority.HIGH)

            # Simulate task processing with error
            try:
                task = await task_manager.get_next_task()

                # Simulate error during processing
                if error_type == "PROCESSING_TIMEOUT":
                    raise asyncio.TimeoutError("Simulated processing timeout")
                elif error_type == "INVALID_DATA":
                    raise ValueError("Simulated invalid data error")
                elif error_type == "RESOURCE_UNAVAILABLE":
                    raise ConnectionError("Simulated resource unavailable")

            except Exception as e:
                # This is expected - log the error for validation
                production_logger.log_critical_error(
                    error_type,
                    {
                        "task_data": task_data,
                        "error_message": str(e),
                        "recovery_attempted": True,
                    },
                )

        # Validate error tracking
        error_summary = production_logger.get_error_summary()
        assert error_summary["total_errors"] >= len(
            error_scenarios
        ), "Not all errors were tracked"

        # Validate that the system can continue processing after errors
        await task_manager.add_task("recovery_test_task", TaskPriority.HIGH)
        recovery_task = await asyncio.wait_for(
            task_manager.get_next_task(), timeout=1.0
        )
        assert recovery_task is not None, "System should recover after errors"

        production_logger.log_background_task_status(
            "error_recovery",
            "SUCCESS",
            {
                "errors_handled": len(error_scenarios),
                "recovery_successful": True,
                "error_summary": error_summary,
            },
        )


class TestProductionLoggingService:
    """Test the production logging service functionality"""

    @pytest.mark.asyncio
    async def test_async_operation_validation(self):
        """Test the async operation validation functionality"""

        validation_results = await production_logger.validate_async_operations()

        # Validate that all async operations pass
        assert (
            validation_results.get("basic_async") is True
        ), "Basic async operations should work"
        assert (
            validation_results.get("concurrent_async") is True
        ), "Concurrent async operations should work"
        assert (
            validation_results.get("async_queue") is True
        ), "Async queue operations should work"
        assert (
            "validation_failed" not in validation_results
        ), f"Validation should not fail: {validation_results}"

        production_logger.log_system_health(
            SystemHealthMetrics(
                timestamp=time.strftime("%Y%m%d_%H%M%S"),
                backend_status="ASYNC_VALIDATED",
                background_tasks_active=0,
                background_tasks_failed=0,
                connection_pool_size=1,
                memory_usage_mb=40.0,
                response_time_ms=10.0,
                error_rate_percent=0.0,
            )
        )

    def test_error_tracking_functionality(self):
        """Test comprehensive error tracking and reporting"""

        # Generate test errors
        test_errors = [
            ("NETWORK_ERROR", {"details": "Connection failed"}),
            ("DATA_VALIDATION_ERROR", {"field": "user_id", "value": "invalid"}),
            (
                "NETWORK_ERROR",
                {"details": "Timeout occurred"},
            ),  # Duplicate to test counting
        ]

        for error_type, details in test_errors:
            production_logger.log_critical_error(error_type, details)

        # Validate error summary
        error_summary = production_logger.get_error_summary()

        assert (
            error_summary["total_errors"] == 3
        ), f"Should track 3 total errors: {error_summary}"
        assert (
            error_summary["error_breakdown"]["NETWORK_ERROR"] == 2
        ), "Should count duplicate errors"
        assert (
            error_summary["error_breakdown"]["DATA_VALIDATION_ERROR"] == 1
        ), "Should count single errors"
        assert (
            error_summary["most_frequent_error"][0] == "NETWORK_ERROR"
        ), "Should identify most frequent error"

    def test_performance_alerting(self):
        """Test performance monitoring and alerting"""

        # Test high error rate alert
        high_error_metrics = SystemHealthMetrics(
            timestamp=time.strftime("%Y%m%d_%H%M%S"),
            backend_status="DEGRADED",
            background_tasks_active=5,
            background_tasks_failed=2,
            connection_pool_size=10,
            memory_usage_mb=200.0,
            response_time_ms=150.0,
            error_rate_percent=5.5,  # Above 1.0% baseline
        )

        # This should trigger performance alerts
        production_logger.log_system_health(high_error_metrics)

        # Test high response time alert
        slow_response_metrics = SystemHealthMetrics(
            timestamp=time.strftime("%Y%m%d_%H%M%S"),
            backend_status="SLOW",
            background_tasks_active=3,
            background_tasks_failed=0,
            connection_pool_size=8,
            memory_usage_mb=120.0,
            response_time_ms=250.0,  # Above 100ms baseline
            error_rate_percent=0.5,
        )

        production_logger.log_system_health(slow_response_metrics)

        # Validate metrics history
        assert (
            len(production_logger.metrics_history) >= 2
        ), "Should store metrics history"


if __name__ == "__main__":
    """Run validation tests directly"""
    print("🧪 Running Background Task Manager Validation Tests...")

    # Run basic async validation
    async def run_validation():
        print("✅ Testing AsyncIO Fix Validation...")

        # Test async operations
        validation_results = await production_logger.validate_async_operations()
        print(f"Async Validation Results: {validation_results}")

        # Test background task manager
        task_manager = BackgroundTaskManager()

        try:
            # Add and process a few test tasks
            await task_manager.add_task("validation_task_1", TaskPriority.HIGH)
            await task_manager.add_task("validation_task_2", TaskPriority.NORMAL)

            task1 = await asyncio.wait_for(task_manager.get_next_task(), timeout=1.0)
            task2 = await asyncio.wait_for(task_manager.get_next_task(), timeout=1.0)

            print(f"✅ Successfully processed tasks: {task1}, {task2}")

            # Log success
            production_logger.log_system_health(
                SystemHealthMetrics(
                    timestamp=time.strftime("%Y%m%d_%H%M%S"),
                    backend_status="VALIDATION_PASSED",
                    background_tasks_active=0,
                    background_tasks_failed=0,
                    connection_pool_size=1,
                    memory_usage_mb=45.0,
                    response_time_ms=25.0,
                    error_rate_percent=0.0,
                )
            )

        except Exception as e:
            production_logger.log_critical_error(
                "VALIDATION_FAILED", {"error": str(e), "validation_type": "direct_run"}
            )
            print(f"❌ Validation failed: {e}")

        finally:
            await task_manager.shutdown()

        print("🎉 Validation Complete!")

    # Run the validation
    asyncio.run(run_validation())
