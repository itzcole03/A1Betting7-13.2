"""
Optimized Redis Service - A1Betting7-13.2
High-performance Redis operations with pipeline batching for 5-10x performance improvement.
Implements industry best practices for Redis batch operations and connection pooling.
"""

import asyncio
import json
import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import redis.asyncio as redis

from backend.config import config_manager

logger = logging.getLogger("propollama.redis_service")


@dataclass
class RedisOperation:
    """Single Redis operation definition"""

    operation_type: str  # 'get', 'set', 'setex', 'delete', 'exists', 'mget', 'mset'
    key: str
    value: Any = None
    ttl: Optional[int] = None
    hash_field: Optional[str] = None
    operation_id: Optional[str] = None  # For tracking results


@dataclass
class BatchResult:
    """Result of batch operation"""

    operation_id: str
    success: bool
    result: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0


@dataclass
class RedisMetrics:
    """Redis performance metrics"""

    total_operations: int = 0
    batch_operations: int = 0
    pipeline_operations: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    avg_operation_time: float = 0.0
    batch_efficiency: float = 0.0  # Operations per batch
    connection_pool_usage: float = 0.0
    error_count: int = 0
    last_update: Optional[datetime] = None


class OptimizedRedisService:
    """High-performance Redis service with pipeline batching"""

    def __init__(self, redis_url: str = None, max_connections: int = 20):
        self.redis_url = redis_url or config_manager.get(
            "REDIS_URL", "redis://localhost:6379/0"
        )
        self.max_connections = max_connections
        self._pool = None
        self.metrics = RedisMetrics()

        # Batch processing configuration
        self.batch_queue = asyncio.Queue(maxsize=1000)
        self.batch_window_ms = 100  # 100ms batch collection window
        self.max_batch_size = 100  # Maximum operations per batch
        self.batch_processor_task = None

        # Operation tracking
        self.pending_operations = {}
        self.operation_futures = {}

        # Connection pool monitoring
        self.pool_stats = {
            "created_connections": 0,
            "in_use_connections": 0,
            "available_connections": 0,
        }

    async def initialize(self):
        """Initialize Redis service and connection pool"""
        logger.info("Initializing Optimized Redis Service...")

        # Create connection pool with optimized settings
        self._pool = redis.ConnectionPool.from_url(
            self.redis_url,
            max_connections=self.max_connections,
            retry_on_timeout=True,
            retry_on_error=[redis.ConnectionError, redis.TimeoutError],
            health_check_interval=30,
            socket_keepalive=True,
            socket_keepalive_options={},
        )

        # Test connection
        try:
            async with self.get_redis() as client:
                await client.ping()
                logger.info("Redis connection established successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise

        # Start batch processor
        self.batch_processor_task = asyncio.create_task(self._batch_processor())
        logger.info("Redis batch processor started")

        logger.info("Optimized Redis Service initialized")

    async def cleanup(self):
        """Cleanup Redis service"""
        logger.info("Cleaning up Optimized Redis Service...")

        # Cancel batch processor
        if self.batch_processor_task:
            self.batch_processor_task.cancel()
            try:
                await self.batch_processor_task
            except asyncio.CancelledError:
                pass

        # Close connection pool
        if self._pool:
            await self._pool.disconnect()

        logger.info("Redis service cleanup complete")

    @asynccontextmanager
    async def get_redis(self):
        """Get Redis client with connection pooling"""
        if not self._pool:
            raise RuntimeError("Redis service not initialized")

        client = redis.Redis(connection_pool=self._pool)
        try:
            yield client
        finally:
            await client.close()

    @asynccontextmanager
    async def get_pipeline(self):
        """Get Redis pipeline for batch operations"""
        async with self.get_redis() as client:
            pipeline = client.pipeline()
            try:
                yield pipeline
            finally:
                pass  # Pipeline cleanup handled automatically

    async def get(self, key: str) -> Optional[Any]:
        """Get single value with automatic JSON deserialization"""
        start_time = time.time()
        self.metrics.total_operations += 1

        try:
            async with self.get_redis() as client:
                result = await client.get(key)

                # Update metrics
                execution_time = time.time() - start_time
                self._update_metrics(
                    execution_time, success=True, cache_hit=result is not None
                )

                if result is None:
                    return None

                # Try to deserialize JSON
                try:
                    return json.loads(result)
                except (json.JSONDecodeError, TypeError):
                    # Return raw value if not JSON
                    return (
                        result.decode("utf-8") if isinstance(result, bytes) else result
                    )

        except Exception as e:
            execution_time = time.time() - start_time
            self._update_metrics(execution_time, success=False)
            logger.error(f"Redis GET error for key {key}: {str(e)}")
            raise

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set single value with automatic JSON serialization"""
        start_time = time.time()
        self.metrics.total_operations += 1

        try:
            # Serialize value
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value, default=str)
            else:
                serialized_value = str(value)

            async with self.get_redis() as client:
                if ttl:
                    result = await client.setex(key, ttl, serialized_value)
                else:
                    result = await client.set(key, serialized_value)

                # Update metrics
                execution_time = time.time() - start_time
                self._update_metrics(execution_time, success=True)

                return bool(result)

        except Exception as e:
            execution_time = time.time() - start_time
            self._update_metrics(execution_time, success=False)
            logger.error(f"Redis SET error for key {key}: {str(e)}")
            raise

    async def mget(self, keys: List[str]) -> List[Optional[Any]]:
        """Get multiple values efficiently"""
        if not keys:
            return []

        start_time = time.time()
        self.metrics.total_operations += len(keys)

        try:
            async with self.get_redis() as client:
                results = await client.mget(keys)

                # Update metrics
                execution_time = time.time() - start_time
                cache_hits = sum(1 for r in results if r is not None)
                for _ in range(len(keys)):
                    self._update_metrics(
                        execution_time / len(keys),
                        success=True,
                        cache_hit=cache_hits > 0,
                    )

                # Deserialize results
                deserialized_results = []
                for result in results:
                    if result is None:
                        deserialized_results.append(None)
                    else:
                        try:
                            deserialized_results.append(json.loads(result))
                        except (json.JSONDecodeError, TypeError):
                            deserialized_results.append(
                                result.decode("utf-8")
                                if isinstance(result, bytes)
                                else result
                            )

                return deserialized_results

        except Exception as e:
            execution_time = time.time() - start_time
            for _ in range(len(keys)):
                self._update_metrics(execution_time / len(keys), success=False)
            logger.error(f"Redis MGET error for {len(keys)} keys: {str(e)}")
            raise

    async def mset(self, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values efficiently"""
        if not mapping:
            return True

        start_time = time.time()
        self.metrics.total_operations += len(mapping)

        try:
            # Serialize all values
            serialized_mapping = {}
            for key, value in mapping.items():
                if isinstance(value, (dict, list)):
                    serialized_mapping[key] = json.dumps(value, default=str)
                else:
                    serialized_mapping[key] = str(value)

            async with self.get_redis() as client:
                if ttl:
                    # Use pipeline for MSET with TTL
                    async with self.get_pipeline() as pipeline:
                        for key, value in serialized_mapping.items():
                            pipeline.setex(key, ttl, value)
                        results = await pipeline.execute()
                        success = all(results)
                else:
                    result = await client.mset(serialized_mapping)
                    success = bool(result)

                # Update metrics
                execution_time = time.time() - start_time
                for _ in range(len(mapping)):
                    self._update_metrics(execution_time / len(mapping), success=True)

                return success

        except Exception as e:
            execution_time = time.time() - start_time
            for _ in range(len(mapping)):
                self._update_metrics(execution_time / len(mapping), success=False)
            logger.error(f"Redis MSET error for {len(mapping)} keys: {str(e)}")
            raise

    async def batch_operations(
        self, operations: List[RedisOperation]
    ) -> List[BatchResult]:
        """Execute multiple Redis operations in a single pipeline"""
        if not operations:
            return []

        start_time = time.time()
        self.metrics.total_operations += len(operations)
        self.metrics.batch_operations += 1
        self.metrics.pipeline_operations += len(operations)

        try:
            async with self.get_pipeline() as pipeline:
                # Add all operations to pipeline
                for op in operations:
                    await self._add_operation_to_pipeline(pipeline, op)

                # Execute all operations atomically
                results = await pipeline.execute()

                # Process results
                batch_results = []
                for i, (op, result) in enumerate(zip(operations, results)):
                    execution_time = time.time() - start_time

                    # Handle exceptions in results
                    if isinstance(result, Exception):
                        batch_results.append(
                            BatchResult(
                                operation_id=op.operation_id or f"op_{i}",
                                success=False,
                                error=str(result),
                                execution_time=execution_time,
                            )
                        )
                        self._update_metrics(
                            execution_time / len(operations), success=False
                        )
                    else:
                        # Deserialize result if needed
                        processed_result = self._process_pipeline_result(op, result)
                        batch_results.append(
                            BatchResult(
                                operation_id=op.operation_id or f"op_{i}",
                                success=True,
                                result=processed_result,
                                execution_time=execution_time,
                            )
                        )
                        self._update_metrics(
                            execution_time / len(operations),
                            success=True,
                            cache_hit=op.operation_type == "get" and result is not None,
                        )

                # Update batch efficiency metric
                total_time = time.time() - start_time
                self.metrics.batch_efficiency = (
                    len(operations) / total_time if total_time > 0 else 0
                )

                return batch_results

        except Exception as e:
            execution_time = time.time() - start_time
            for _ in range(len(operations)):
                self._update_metrics(execution_time / len(operations), success=False)
            logger.error(f"Redis batch operation error: {str(e)}")
            raise

    async def _add_operation_to_pipeline(self, pipeline, operation: RedisOperation):
        """Add single operation to Redis pipeline"""
        op_type = operation.operation_type.lower()

        if op_type == "get":
            pipeline.get(operation.key)
        elif op_type == "set":
            if operation.value is None:
                raise ValueError("SET operation requires value")
            serialized_value = self._serialize_value(operation.value)
            pipeline.set(operation.key, serialized_value)
        elif op_type == "setex":
            if operation.value is None or operation.ttl is None:
                raise ValueError("SETEX operation requires value and TTL")
            serialized_value = self._serialize_value(operation.value)
            pipeline.setex(operation.key, operation.ttl, serialized_value)
        elif op_type == "delete":
            pipeline.delete(operation.key)
        elif op_type == "exists":
            pipeline.exists(operation.key)
        elif op_type == "hget":
            if operation.hash_field is None:
                raise ValueError("HGET operation requires hash_field")
            pipeline.hget(operation.key, operation.hash_field)
        elif op_type == "hset":
            if operation.hash_field is None or operation.value is None:
                raise ValueError("HSET operation requires hash_field and value")
            serialized_value = self._serialize_value(operation.value)
            pipeline.hset(operation.key, operation.hash_field, serialized_value)
        else:
            raise ValueError(f"Unsupported operation type: {op_type}")

    def _serialize_value(self, value: Any) -> str:
        """Serialize value for Redis storage"""
        if isinstance(value, (dict, list)):
            return json.dumps(value, default=str)
        else:
            return str(value)

    def _process_pipeline_result(self, operation: RedisOperation, result: Any) -> Any:
        """Process result from pipeline execution"""
        if result is None:
            return None

        # For GET operations, try to deserialize
        if operation.operation_type.lower() in ["get", "hget"]:
            try:
                return json.loads(result)
            except (json.JSONDecodeError, TypeError):
                return result.decode("utf-8") if isinstance(result, bytes) else result

        # For other operations, return as-is
        return result

    async def _batch_processor(self):
        """Background batch processor for queued operations"""
        logger.info("Starting Redis batch processor...")

        while True:
            try:
                operations = []
                start_time = time.time()

                # Collect operations within batch window
                try:
                    # Wait for first operation
                    first_op = await asyncio.wait_for(
                        self.batch_queue.get(), timeout=1.0
                    )
                    operations.append(first_op)

                    # Collect additional operations within window
                    while (time.time() - start_time) < (
                        self.batch_window_ms / 1000
                    ) and len(operations) < self.max_batch_size:
                        try:
                            additional_op = await asyncio.wait_for(
                                self.batch_queue.get(),
                                timeout=(self.batch_window_ms / 1000),
                            )
                            operations.append(additional_op)
                        except asyncio.TimeoutError:
                            break

                    # Process batch if we have operations
                    if operations:
                        await self.batch_operations(operations)

                except asyncio.TimeoutError:
                    # No operations to process
                    continue

            except Exception as e:
                logger.error(f"Batch processor error: {str(e)}")
                await asyncio.sleep(0.1)

    def _update_metrics(
        self, execution_time: float, success: bool, cache_hit: bool = False
    ):
        """Update performance metrics"""
        if success:
            # Update average execution time
            if self.metrics.avg_operation_time == 0:
                self.metrics.avg_operation_time = execution_time
            else:
                # Exponential moving average
                alpha = 0.1
                self.metrics.avg_operation_time = (
                    alpha * execution_time
                    + (1 - alpha) * self.metrics.avg_operation_time
                )

            # Update cache metrics
            if cache_hit:
                self.metrics.cache_hits += 1
            else:
                self.metrics.cache_misses += 1
        else:
            self.metrics.error_count += 1

        self.metrics.last_update = datetime.now()

    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive Redis health check"""
        health_status = {
            "redis_connected": False,
            "connection_pool_status": {},
            "metrics": {},
            "batch_processor_running": False,
        }

        # Test Redis connection
        try:
            async with self.get_redis() as client:
                latency_start = time.time()
                await client.ping()
                ping_latency = (time.time() - latency_start) * 1000  # ms

                health_status["redis_connected"] = True
                health_status["ping_latency_ms"] = ping_latency

                # Get Redis info
                info = await client.info()
                health_status["redis_info"] = {
                    "redis_version": info.get("redis_version"),
                    "used_memory_human": info.get("used_memory_human"),
                    "connected_clients": info.get("connected_clients"),
                    "total_commands_processed": info.get("total_commands_processed"),
                }

        except Exception as e:
            health_status["redis_error"] = str(e)

        # Connection pool status
        if self._pool:
            health_status["connection_pool_status"] = {
                "max_connections": self.max_connections,
                "created_connections": self._pool.created_connections,
                "available_connections": self._pool.available_connections,
                "in_use_connections": self._pool.in_use_connections,
            }

        # Performance metrics
        total_operations = self.metrics.cache_hits + self.metrics.cache_misses
        cache_hit_rate = (
            (self.metrics.cache_hits / total_operations * 100)
            if total_operations > 0
            else 0
        )

        health_status["metrics"] = {
            "total_operations": self.metrics.total_operations,
            "batch_operations": self.metrics.batch_operations,
            "cache_hit_rate_percent": round(cache_hit_rate, 2),
            "avg_operation_time_ms": round(self.metrics.avg_operation_time * 1000, 2),
            "batch_efficiency": round(self.metrics.batch_efficiency, 2),
            "error_count": self.metrics.error_count,
            "last_update": (
                self.metrics.last_update.isoformat()
                if self.metrics.last_update
                else None
            ),
        }

        # Batch processor status
        health_status["batch_processor_running"] = (
            self.batch_processor_task and not self.batch_processor_task.done()
        )
        health_status["batch_queue_size"] = self.batch_queue.qsize()

        return health_status


# Global Redis service instance
optimized_redis_service = OptimizedRedisService()


# Convenience functions
async def redis_get(key: str) -> Optional[Any]:
    """Get value from Redis"""
    return await optimized_redis_service.get(key)


async def redis_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set value in Redis"""
    return await optimized_redis_service.set(key, value, ttl)


async def redis_mget(keys: List[str]) -> List[Optional[Any]]:
    """Get multiple values from Redis"""
    return await optimized_redis_service.mget(keys)


async def redis_mset(mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
    """Set multiple values in Redis"""
    return await optimized_redis_service.mset(mapping, ttl)


async def redis_batch(operations: List[RedisOperation]) -> List[BatchResult]:
    """Execute batch Redis operations"""
    return await optimized_redis_service.batch_operations(operations)
