"""
Enhanced Connection Pool Manager - Priority 2 Implementation
Advanced connection pooling with health monitoring, load balancing, and automatic scaling
"""

import asyncio
import logging
import time
import weakref
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, AsyncIterator, Dict, List, Optional, Protocol, Set, Union

import aiohttp
import asyncpg
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_connection_pool")


class ConnectionState(Enum):
    """Connection states"""

    ACTIVE = "active"
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    CLOSED = "closed"


class PoolStrategy(Enum):
    """Pool scaling strategies"""

    FIXED = "fixed"
    DYNAMIC = "dynamic"
    ADAPTIVE = "adaptive"


@dataclass
class ConnectionMetrics:
    """Connection performance metrics"""

    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    busy_connections: int = 0
    error_connections: int = 0

    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0

    average_response_time: float = 0.0
    min_response_time: float = float("inf")
    max_response_time: float = 0.0

    pool_utilization: float = 0.0
    error_rate: float = 0.0

    connection_wait_time: float = 0.0
    queue_size: int = 0


@dataclass
class PoolConfiguration:
    """Pool configuration settings"""

    name: str
    min_connections: int = 5
    max_connections: int = 50
    target_utilization: float = 0.7
    idle_timeout: int = 300
    max_lifetime: int = 3600
    health_check_interval: int = 60
    retry_attempts: int = 3
    retry_delay: float = 1.0
    connection_timeout: float = 30.0
    strategy: PoolStrategy = PoolStrategy.DYNAMIC


class ConnectionWrapper:
    """Wrapper for tracking connection state and metrics"""

    def __init__(self, connection: Any, pool_name: str):
        self.connection = connection
        self.pool_name = pool_name
        self.state = ConnectionState.IDLE
        self.created_at = datetime.now()
        self.last_used = datetime.now()
        self.use_count = 0
        self.error_count = 0
        self.total_time = 0.0
        self.in_use = False

    async def execute(self, operation, *args, **kwargs):
        """Execute operation on connection"""
        start_time = time.time()

        try:
            self.state = ConnectionState.BUSY
            self.in_use = True

            result = await operation(self.connection, *args, **kwargs)

            self.use_count += 1
            self.last_used = datetime.now()
            execution_time = time.time() - start_time
            self.total_time += execution_time

            self.state = ConnectionState.IDLE
            return result

        except Exception as e:
            self.error_count += 1
            self.state = ConnectionState.ERROR
            logger.error(f"Connection execution error in pool {self.pool_name}: {e}")
            raise
        finally:
            self.in_use = False

    @property
    def age(self) -> timedelta:
        """Get connection age"""
        return datetime.now() - self.created_at

    @property
    def idle_time(self) -> timedelta:
        """Get idle time"""
        return datetime.now() - self.last_used

    @property
    def average_execution_time(self) -> float:
        """Get average execution time"""
        return self.total_time / self.use_count if self.use_count > 0 else 0.0

    def is_healthy(self) -> bool:
        """Check if connection is healthy"""
        return (
            self.state not in [ConnectionState.ERROR, ConnectionState.CLOSED]
            and self.error_count < 5
            and hasattr(self.connection, "ping")
            and asyncio.iscoroutinefunction(getattr(self.connection, "ping", None))
        )


class BaseConnectionPool:
    """Base class for connection pools"""

    def __init__(self, config: PoolConfiguration):
        self.config = config
        self.connections: Dict[str, ConnectionWrapper] = {}
        self.waiting_queue: asyncio.Queue = asyncio.Queue()
        self.metrics = ConnectionMetrics()
        self.is_running = False
        self.health_check_task: Optional[asyncio.Task] = None
        self.scaling_task: Optional[asyncio.Task] = None
        self.response_times = deque(maxlen=1000)

    async def start(self):
        """Start the connection pool"""
        if self.is_running:
            return

        logger.info(f"Starting connection pool: {self.config.name}")
        self.is_running = True

        # Create initial connections
        await self._create_initial_connections()

        # Start background tasks
        self.health_check_task = asyncio.create_task(self._health_check_loop())
        self.scaling_task = asyncio.create_task(self._scaling_loop())

        logger.info(
            f"Connection pool {self.config.name} started with {len(self.connections)} connections"
        )

    async def stop(self):
        """Stop the connection pool"""
        if not self.is_running:
            return

        logger.info(f"Stopping connection pool: {self.config.name}")
        self.is_running = False

        # Cancel background tasks
        if self.health_check_task:
            self.health_check_task.cancel()
        if self.scaling_task:
            self.scaling_task.cancel()

        # Close all connections
        await self._close_all_connections()

        logger.info(f"Connection pool {self.config.name} stopped")

    async def _create_initial_connections(self):
        """Create initial pool connections"""
        tasks = []
        for i in range(self.config.min_connections):
            task = asyncio.create_task(self._create_connection(f"initial-{i}"))
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        success_count = sum(
            1 for result in results if not isinstance(result, Exception)
        )
        logger.info(
            f"Created {success_count}/{self.config.min_connections} initial connections"
        )

    async def _create_connection(
        self, connection_id: str
    ) -> Optional[ConnectionWrapper]:
        """Create new connection - to be implemented by subclasses"""
        raise NotImplementedError

    async def _close_connection(self, wrapper: ConnectionWrapper):
        """Close connection - to be implemented by subclasses"""
        raise NotImplementedError

    async def _close_all_connections(self):
        """Close all connections"""
        tasks = []
        for wrapper in list(self.connections.values()):
            task = asyncio.create_task(self._close_connection(wrapper))
            tasks.append(task)

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        self.connections.clear()

    @asynccontextmanager
    async def acquire(self) -> AsyncIterator[ConnectionWrapper]:
        """Acquire connection from pool"""
        start_time = time.time()
        wrapper = None

        try:
            # Get connection from pool
            wrapper = await self._get_connection()

            # Record wait time
            wait_time = time.time() - start_time
            self.metrics.connection_wait_time = wait_time

            # Update metrics
            self.metrics.active_connections += 1
            self.metrics.idle_connections -= 1

            yield wrapper

        except Exception as e:
            self.metrics.failed_requests += 1
            logger.error(f"Error acquiring connection: {e}")
            raise
        finally:
            if wrapper:
                # Return connection to pool
                self.metrics.active_connections -= 1
                self.metrics.idle_connections += 1

                # Record response time
                response_time = time.time() - start_time
                self.response_times.append(response_time)

                # Update response time metrics
                self.metrics.min_response_time = min(
                    self.metrics.min_response_time, response_time
                )
                self.metrics.max_response_time = max(
                    self.metrics.max_response_time, response_time
                )

                if self.response_times:
                    self.metrics.average_response_time = sum(self.response_times) / len(
                        self.response_times
                    )

    async def _get_connection(self) -> ConnectionWrapper:
        """Get available connection"""
        # Try to find idle connection
        for wrapper in self.connections.values():
            if wrapper.state == ConnectionState.IDLE and not wrapper.in_use:
                return wrapper

        # Try to create new connection if under limit
        if len(self.connections) < self.config.max_connections:
            connection_id = f"dynamic-{len(self.connections)}"
            wrapper = await self._create_connection(connection_id)
            if wrapper:
                return wrapper

        # Wait for connection to become available
        timeout = self.config.connection_timeout
        try:
            return await asyncio.wait_for(self.waiting_queue.get(), timeout=timeout)
        except asyncio.TimeoutError:
            raise Exception(f"Connection timeout after {timeout}s")

    async def _health_check_loop(self):
        """Background health check loop"""
        while self.is_running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.config.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(self.config.health_check_interval)

    async def _perform_health_checks(self):
        """Perform health checks on connections"""
        unhealthy_connections = []

        for conn_id, wrapper in list(self.connections.items()):
            try:
                # Check connection age and idle time
                if wrapper.age.total_seconds() > self.config.max_lifetime:
                    unhealthy_connections.append((conn_id, "max_lifetime_exceeded"))
                    continue

                if wrapper.idle_time.total_seconds() > self.config.idle_timeout:
                    unhealthy_connections.append((conn_id, "idle_timeout"))
                    continue

                # Perform health check if available
                if hasattr(wrapper.connection, "ping"):
                    await wrapper.connection.ping()

            except Exception as e:
                unhealthy_connections.append((conn_id, f"health_check_failed: {e}"))

        # Remove unhealthy connections
        for conn_id, reason in unhealthy_connections:
            logger.info(f"Removing unhealthy connection {conn_id}: {reason}")
            wrapper = self.connections.pop(conn_id, None)
            if wrapper:
                await self._close_connection(wrapper)

        # Update connection counts
        self._update_connection_metrics()

    async def _scaling_loop(self):
        """Background scaling loop"""
        while self.is_running:
            try:
                await self._perform_scaling()
                await asyncio.sleep(30)  # Check scaling every 30 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scaling error: {e}")
                await asyncio.sleep(30)

    async def _perform_scaling(self):
        """Perform pool scaling based on utilization"""
        if self.config.strategy == PoolStrategy.FIXED:
            return

        current_connections = len(self.connections)
        utilization = self.metrics.pool_utilization

        # Scale up if utilization is high
        if (
            utilization > self.config.target_utilization
            and current_connections < self.config.max_connections
        ):
            needed = min(
                int(
                    (utilization - self.config.target_utilization) * current_connections
                )
                + 1,
                self.config.max_connections - current_connections,
            )

            tasks = []
            for i in range(needed):
                connection_id = f"scaled-{int(time.time())}-{i}"
                task = asyncio.create_task(self._create_connection(connection_id))
                tasks.append(task)

            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                success_count = sum(
                    1 for result in results if not isinstance(result, Exception)
                )
                logger.info(
                    f"Scaled up by {success_count} connections (utilization: {utilization:.2%})"
                )

        # Scale down if utilization is low
        elif (
            utilization < (self.config.target_utilization * 0.5)
            and current_connections > self.config.min_connections
        ):
            excess = min(
                int(
                    (self.config.target_utilization - utilization) * current_connections
                ),
                current_connections - self.config.min_connections,
            )

            # Remove idle connections
            removed = 0
            for conn_id, wrapper in list(self.connections.items()):
                if removed >= excess:
                    break

                if wrapper.state == ConnectionState.IDLE and not wrapper.in_use:
                    self.connections.pop(conn_id)
                    await self._close_connection(wrapper)
                    removed += 1

            if removed > 0:
                logger.info(
                    f"Scaled down by {removed} connections (utilization: {utilization:.2%})"
                )

    def _update_connection_metrics(self):
        """Update connection metrics"""
        total = len(self.connections)
        active = sum(
            1
            for w in self.connections.values()
            if w.state == ConnectionState.ACTIVE or w.in_use
        )
        idle = sum(
            1
            for w in self.connections.values()
            if w.state == ConnectionState.IDLE and not w.in_use
        )
        busy = sum(
            1 for w in self.connections.values() if w.state == ConnectionState.BUSY
        )
        error = sum(
            1 for w in self.connections.values() if w.state == ConnectionState.ERROR
        )

        self.metrics.total_connections = total
        self.metrics.active_connections = active
        self.metrics.idle_connections = idle
        self.metrics.busy_connections = busy
        self.metrics.error_connections = error

        # Calculate utilization
        if total > 0:
            self.metrics.pool_utilization = (active + busy) / total
        else:
            self.metrics.pool_utilization = 0.0

        # Calculate error rate
        total_requests = self.metrics.successful_requests + self.metrics.failed_requests
        if total_requests > 0:
            self.metrics.error_rate = self.metrics.failed_requests / total_requests
        else:
            self.metrics.error_rate = 0.0

    async def get_metrics(self) -> Dict[str, Any]:
        """Get pool metrics"""
        self._update_connection_metrics()

        return {
            "pool_name": self.config.name,
            "total_connections": self.metrics.total_connections,
            "active_connections": self.metrics.active_connections,
            "idle_connections": self.metrics.idle_connections,
            "busy_connections": self.metrics.busy_connections,
            "error_connections": self.metrics.error_connections,
            "pool_utilization": self.metrics.pool_utilization,
            "error_rate": self.metrics.error_rate,
            "average_response_time": self.metrics.average_response_time,
            "min_response_time": (
                self.metrics.min_response_time
                if self.metrics.min_response_time != float("inf")
                else 0.0
            ),
            "max_response_time": self.metrics.max_response_time,
            "connection_wait_time": self.metrics.connection_wait_time,
            "queue_size": self.waiting_queue.qsize(),
            "strategy": self.config.strategy.value,
        }


class DatabaseConnectionPool(BaseConnectionPool):
    """Database connection pool using asyncpg"""

    def __init__(self, config: PoolConfiguration, database_url: str):
        super().__init__(config)
        self.database_url = database_url

    async def _create_connection(
        self, connection_id: str
    ) -> Optional[ConnectionWrapper]:
        """Create new database connection"""
        try:
            connection = await asyncpg.connect(
                self.database_url, timeout=self.config.connection_timeout
            )

            wrapper = ConnectionWrapper(connection, self.config.name)
            self.connections[connection_id] = wrapper

            logger.debug(f"Created database connection: {connection_id}")
            return wrapper

        except Exception as e:
            logger.error(f"Failed to create database connection {connection_id}: {e}")
            return None

    async def _close_connection(self, wrapper: ConnectionWrapper):
        """Close database connection"""
        try:
            if hasattr(wrapper.connection, "close"):
                await wrapper.connection.close()
            wrapper.state = ConnectionState.CLOSED
        except Exception as e:
            logger.error(f"Error closing database connection: {e}")


class RedisConnectionPool(BaseConnectionPool):
    """Redis connection pool"""

    def __init__(self, config: PoolConfiguration, redis_url: str):
        super().__init__(config)
        self.redis_url = redis_url

    async def _create_connection(
        self, connection_id: str
    ) -> Optional[ConnectionWrapper]:
        """Create new Redis connection"""
        try:
            connection = redis.from_url(
                self.redis_url,
                socket_timeout=self.config.connection_timeout,
                socket_connect_timeout=self.config.connection_timeout,
            )

            # Test connection
            await connection.ping()

            wrapper = ConnectionWrapper(connection, self.config.name)
            self.connections[connection_id] = wrapper

            logger.debug(f"Created Redis connection: {connection_id}")
            return wrapper

        except Exception as e:
            logger.error(f"Failed to create Redis connection {connection_id}: {e}")
            return None

    async def _close_connection(self, wrapper: ConnectionWrapper):
        """Close Redis connection"""
        try:
            if hasattr(wrapper.connection, "close"):
                await wrapper.connection.close()
            wrapper.state = ConnectionState.CLOSED
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")


class HTTPConnectionPool(BaseConnectionPool):
    """HTTP connection pool using aiohttp"""

    def __init__(self, config: PoolConfiguration, connector_limit: int = 100):
        super().__init__(config)
        self.connector_limit = connector_limit
        self.connector: Optional[aiohttp.TCPConnector] = None

    async def start(self):
        """Start HTTP connection pool"""
        self.connector = aiohttp.TCPConnector(
            limit=self.connector_limit,
            limit_per_host=self.config.max_connections,
            ttl_dns_cache=300,
            use_dns_cache=True,
            keepalive_timeout=self.config.idle_timeout,
            enable_cleanup_closed=True,
        )

        await super().start()

    async def _create_connection(
        self, connection_id: str
    ) -> Optional[ConnectionWrapper]:
        """Create new HTTP session"""
        try:
            session = aiohttp.ClientSession(
                connector=self.connector,
                timeout=aiohttp.ClientTimeout(total=self.config.connection_timeout),
            )

            wrapper = ConnectionWrapper(session, self.config.name)
            self.connections[connection_id] = wrapper

            logger.debug(f"Created HTTP session: {connection_id}")
            return wrapper

        except Exception as e:
            logger.error(f"Failed to create HTTP session {connection_id}: {e}")
            return None

    async def _close_connection(self, wrapper: ConnectionWrapper):
        """Close HTTP session"""
        try:
            if hasattr(wrapper.connection, "close"):
                await wrapper.connection.close()
            wrapper.state = ConnectionState.CLOSED
        except Exception as e:
            logger.error(f"Error closing HTTP session: {e}")

    async def stop(self):
        """Stop HTTP connection pool"""
        await super().stop()

        if self.connector:
            await self.connector.close()


class EnhancedConnectionPoolManager:
    """Manager for multiple connection pools"""

    def __init__(self):
        self.pools: Dict[str, BaseConnectionPool] = {}
        self.is_running = False

    async def create_database_pool(
        self, name: str, database_url: str, config: Optional[PoolConfiguration] = None
    ) -> DatabaseConnectionPool:
        """Create database connection pool"""
        if name in self.pools:
            raise ValueError(f"Pool {name} already exists")

        if config is None:
            config = PoolConfiguration(name=name)

        pool = DatabaseConnectionPool(config, database_url)
        self.pools[name] = pool

        if self.is_running:
            await pool.start()

        return pool

    async def create_redis_pool(
        self, name: str, redis_url: str, config: Optional[PoolConfiguration] = None
    ) -> RedisConnectionPool:
        """Create Redis connection pool"""
        if name in self.pools:
            raise ValueError(f"Pool {name} already exists")

        if config is None:
            config = PoolConfiguration(name=name)

        pool = RedisConnectionPool(config, redis_url)
        self.pools[name] = pool

        if self.is_running:
            await pool.start()

        return pool

    async def create_http_pool(
        self,
        name: str,
        config: Optional[PoolConfiguration] = None,
        connector_limit: int = 100,
    ) -> HTTPConnectionPool:
        """Create HTTP connection pool"""
        if name in self.pools:
            raise ValueError(f"Pool {name} already exists")

        if config is None:
            config = PoolConfiguration(name=name)

        pool = HTTPConnectionPool(config, connector_limit)
        self.pools[name] = pool

        if self.is_running:
            await pool.start()

        return pool

    async def start_all(self):
        """Start all connection pools"""
        if self.is_running:
            return

        logger.info("Starting all connection pools")
        self.is_running = True

        tasks = []
        for pool in self.pools.values():
            task = asyncio.create_task(pool.start())
            tasks.append(task)

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.info(f"Started {len(self.pools)} connection pools")

    async def stop_all(self):
        """Stop all connection pools"""
        if not self.is_running:
            return

        logger.info("Stopping all connection pools")
        self.is_running = False

        tasks = []
        for pool in self.pools.values():
            task = asyncio.create_task(pool.stop())
            tasks.append(task)

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.info("All connection pools stopped")

    def get_pool(self, name: str) -> Optional[BaseConnectionPool]:
        """Get connection pool by name"""
        return self.pools.get(name)

    async def get_all_metrics(self) -> Dict[str, Any]:
        """Get metrics for all connection pools"""
        metrics = {}
        for name, pool in self.pools.items():
            metrics[name] = await pool.get_metrics()
        return metrics


# Global connection pool manager
connection_pool_manager = EnhancedConnectionPoolManager()
