"""
Advanced Async Connection Pool Manager for FastAPI
Implements 2024-2025 best practices for database connection management.
"""

import asyncio
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from enum import Enum
from typing import Any, AsyncGenerator, Dict, Optional

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import QueuePool, StaticPool

from backend.config.settings import get_settings

try:
    from backend.utils.structured_logging import app_logger, performance_logger
except ImportError:
    import logging

    app_logger = logging.getLogger("async_connection_pool")
    performance_logger = logging.getLogger("performance")


class ConnectionState(Enum):
    """Connection pool states"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    RECONNECTING = "reconnecting"


@dataclass
class ConnectionMetrics:
    """Connection pool metrics"""

    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    checked_out_connections: int = 0
    overflow_connections: int = 0
    failed_connections: int = 0
    total_queries: int = 0
    slow_queries: int = 0
    avg_query_time: float = 0.0
    last_health_check: float = 0.0
    state: ConnectionState = ConnectionState.HEALTHY


class CircuitBreaker:
    """Circuit breaker for database connections"""

    def __init__(self, failure_threshold: int = 5, reset_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "closed"  # closed, open, half-open

    def can_execute(self) -> bool:
        """Check if operation can be executed"""
        if self.state == "closed":
            return True
        elif self.state == "open":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "half-open"
                return True
            return False
        else:  # half-open
            return True

    def record_success(self):
        """Record successful operation"""
        self.failure_count = 0
        self.state = "closed"

    def record_failure(self):
        """Record failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            app_logger.warning(
                f"Circuit breaker opened after {self.failure_count} failures"
            )


class AsyncConnectionPoolManager:
    """
    Advanced async connection pool manager with health monitoring,
    circuit breakers, and performance optimization.
    """

    def __init__(self):
        self.settings = get_settings()
        self.engine: Optional[AsyncEngine] = None
        self.session_factory: Optional[async_sessionmaker] = None
        self.metrics = ConnectionMetrics()
        self.circuit_breaker = CircuitBreaker()
        self._monitoring_task: Optional[asyncio.Task] = None
        self._health_check_interval = 30  # seconds

    async def initialize(self) -> bool:
        """Initialize the connection pool with advanced configuration"""
        try:
            app_logger.info("🔄 Initializing advanced async connection pool...")

            # Create engine with optimized pool settings
            engine_config = self._get_engine_config()
            self.engine = create_async_engine(**engine_config)

            # Create session factory
            self.session_factory = async_sessionmaker(
                bind=self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False,
            )

            # Test initial connection
            await self._test_connection()

            # Start monitoring task
            self._monitoring_task = asyncio.create_task(self._monitoring_loop())

            app_logger.info(
                "✅ Advanced async connection pool initialized successfully"
            )
            return True

        except Exception as e:
            app_logger.error(
                f"❌ Failed to initialize connection pool: {e}", exc_info=True
            )
            return False

    def _get_engine_config(self) -> Dict[str, Any]:
        """Get optimized engine configuration"""

        # Base configuration
        config = {
            "url": self.settings.database.database_url,
            "echo": self.settings.database.echo_sql,
            "future": True,  # Use SQLAlchemy 2.0 style
        }

        # Pool configuration based on database type
        if "sqlite" in self.settings.database.database_url:
            # SQLite configuration
            config.update(
                {
                    "poolclass": StaticPool,
                    "connect_args": {
                        "check_same_thread": False,
                        "timeout": self.settings.database.connection_timeout,
                    },
                }
            )
        else:
            # PostgreSQL/MySQL configuration
            config.update(
                {
                    "poolclass": QueuePool,
                    "pool_size": self.settings.database.pool_size,
                    "max_overflow": self.settings.database.max_overflow,
                    "pool_timeout": self.settings.database.connection_timeout,
                    "pool_recycle": 3600,  # Recycle connections after 1 hour
                    "pool_pre_ping": True,  # Validate connections before use
                    "pool_reset_on_return": "commit",  # Reset connections properly
                }
            )

        return config

    async def _test_connection(self):
        """Test database connection"""
        if not self.engine:
            raise RuntimeError("Engine not initialized")

        async with self.engine.begin() as conn:
            result = await conn.execute(sa.text("SELECT 1"))
            await result.fetchone()

        app_logger.info("✅ Database connection test successful")

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Get database session with automatic cleanup and error handling
        """
        if not self.circuit_breaker.can_execute():
            raise RuntimeError("Circuit breaker is open - database unavailable")

        if not self.session_factory:
            raise RuntimeError("Session factory not initialized")

        session = None
        start_time = time.time()

        try:
            session = self.session_factory()
            self.metrics.active_connections += 1

            yield session

            # Commit any pending transactions
            await session.commit()

            # Record success
            query_time = time.time() - start_time
            self.metrics.total_queries += 1
            self.metrics.avg_query_time = (
                self.metrics.avg_query_time * (self.metrics.total_queries - 1)
                + query_time
            ) / self.metrics.total_queries

            if query_time > 1.0:  # Slow query threshold
                self.metrics.slow_queries += 1
                performance_logger.warning(f"Slow query detected: {query_time:.2f}s")

            self.circuit_breaker.record_success()

        except Exception as e:
            app_logger.error(f"Database session error: {e}", exc_info=True)

            if session:
                try:
                    await session.rollback()
                except Exception:
                    pass

            self.metrics.failed_connections += 1
            self.circuit_breaker.record_failure()
            raise

        finally:
            if session:
                try:
                    await session.close()
                finally:
                    self.metrics.active_connections -= 1

    async def get_connection_metrics(self) -> ConnectionMetrics:
        """Get current connection pool metrics"""
        if self.engine and hasattr(self.engine.pool, "size"):
            pool = self.engine.pool
            self.metrics.total_connections = pool.size()
            self.metrics.checked_out_connections = pool.checkedout()
            self.metrics.overflow_connections = pool.overflow()
            self.metrics.idle_connections = (
                self.metrics.total_connections - self.metrics.checked_out_connections
            )

        self.metrics.last_health_check = time.time()
        return self.metrics

    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        health_data = {
            "status": "unknown",
            "metrics": None,
            "circuit_breaker": {
                "state": self.circuit_breaker.state,
                "failure_count": self.circuit_breaker.failure_count,
            },
            "timestamp": time.time(),
        }

        try:
            # Test connection
            await self._test_connection()

            # Get metrics
            metrics = await self.get_connection_metrics()
            health_data["metrics"] = {
                "total_connections": metrics.total_connections,
                "active_connections": metrics.active_connections,
                "idle_connections": metrics.idle_connections,
                "failed_connections": metrics.failed_connections,
                "total_queries": metrics.total_queries,
                "slow_queries": metrics.slow_queries,
                "avg_query_time": round(metrics.avg_query_time, 3),
            }

            # Determine health status
            if self.circuit_breaker.state == "open":
                health_data["status"] = "unhealthy"
            elif metrics.slow_queries / max(metrics.total_queries, 1) > 0.1:
                health_data["status"] = "degraded"
            elif metrics.failed_connections > 10:
                health_data["status"] = "degraded"
            else:
                health_data["status"] = "healthy"

        except Exception as e:
            health_data["status"] = "unhealthy"
            health_data["error"] = str(e)
            app_logger.error(f"Connection pool health check failed: {e}")

        return health_data

    async def _monitoring_loop(self):
        """Background monitoring loop"""
        while True:
            try:
                await asyncio.sleep(self._health_check_interval)

                health = await self.health_check()

                if health["status"] != "healthy":
                    app_logger.warning(f"Connection pool status: {health['status']}")

                # Log metrics periodically
                if health.get("metrics"):
                    metrics = health["metrics"]
                    performance_logger.info(
                        f"DB Pool: {metrics['active_connections']} active, "
                        f"{metrics['total_queries']} queries, "
                        f"{metrics['avg_query_time']}s avg"
                    )

            except Exception as e:
                app_logger.error(f"Monitoring loop error: {e}", exc_info=True)

    async def close(self):
        """Close connection pool and cleanup resources"""
        app_logger.info("🔄 Closing async connection pool...")

        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass

        if self.engine:
            await self.engine.dispose()

        app_logger.info("✅ Async connection pool closed successfully")

    async def shutdown(self):
        """Alias for close() method for consistency"""
        await self.close()


# Global instance
async_connection_pool_manager = AsyncConnectionPoolManager()

# Also provide alternative name for backward compatibility
async_connection_pool = async_connection_pool_manager


# Convenience functions for backward compatibility
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session"""
    async with async_connection_pool_manager.get_session() as session:
        yield session


async def get_db_health() -> Dict[str, Any]:
    """Get database health status"""
    return await async_connection_pool.health_check()
