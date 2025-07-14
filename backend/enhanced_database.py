"""
Enhanced Database Connection Manager with Retry Logic and Fallback

This module provides a robust database connection system with:
- Automatic retry with exponential backoff
- PostgreSQL primary with SQLite fallback
- Health monitoring and diagnostics
- Connection pooling optimization
- Error recovery mechanisms
"""

import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import QueuePool
from sqlalchemy import text  # Ensure this import is present for 'text' usage

logger = logging.getLogger(__name__)


@dataclass
class DatabaseConfig:
    """Database configuration"""

    primary_url: str
    fallback_url: str
    max_retries: int = 3
    retry_delay: float = 1.0
    max_retry_delay: float = 30.0
    connection_timeout: float = 10.0
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: float = 30.0
    pool_recycle: int = 3600


@dataclass
class DatabaseHealth:
    """Database health status"""

    is_healthy: bool
    primary_available: bool
    fallback_available: bool
    active_connections: int
    total_connections: int
    last_error: Optional[str]
    response_time: float
    uptime: float


class DatabaseConnectionManager:
    """Enhanced database connection manager with retry and fallback"""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.start_time = time.time()
        self.is_initialized = False
        self.using_fallback = False
        self.last_health_check = datetime.now()
        self.health_status = DatabaseHealth(
            is_healthy=False,
            primary_available=False,
            fallback_available=False,
            active_connections=0,
            total_connections=0,
            last_error=None,
            response_time=0.0,
            uptime=0.0,
        )

        # Engines
        self.primary_engine = None
        self.fallback_engine = None
        self.current_engine = None

        # Session makers
        self.primary_session_maker = None
        self.fallback_session_maker = None
        self.current_session_maker = None

        # Connection pools
        self.primary_pool = None
        self.fallback_pool = None

        # Health monitoring
        self.connection_attempts = 0
        self.successful_connections = 0
        self.failed_connections = 0
        self.last_error_time = None
        self.consecutive_failures = 0

    async def initialize(self) -> bool:
        """Initialize database connections with retry logic"""
        logger.info("🔄 Initializing Enhanced Database Connection Manager...")

        # Try primary database first
        if await self._initialize_primary():
            logger.info("✅ Primary database connected successfully")
            self.using_fallback = False
            self.is_initialized = True
            return True

        # Fall back to SQLite
        logger.warning("⚠️ Primary database unavailable, falling back to SQLite")
        if await self._initialize_fallback():
            logger.info("✅ Fallback database connected successfully")
            self.using_fallback = True
            self.is_initialized = True
            return True

        logger.error("❌ Both primary and fallback databases failed to initialize")
        return False

    async def _initialize_primary(self) -> bool:
        """Initialize primary database with retry logic"""
        for attempt in range(self.config.max_retries):
            try:
                logger.info(
                    f"Attempting primary database connection (attempt {attempt + 1}/{self.config.max_retries})"
                )

                # Create async engine with connection pooling
                self.primary_engine = create_async_engine(
                    self.config.primary_url,
                    poolclass=QueuePool,
                    pool_size=self.config.pool_size,
                    max_overflow=self.config.max_overflow,
                    pool_timeout=self.config.pool_timeout,
                    pool_recycle=self.config.pool_recycle,
                    connect_args=(
                        {
                            "command_timeout": self.config.connection_timeout,
                            "server_settings": {
                                "jit": "off",
                                "application_name": "A1Betting_Backend",
                            },
                        }
                        if "postgresql" in self.config.primary_url
                        else {}
                    ),
                )

                # Test connection
                async with self.primary_engine.begin() as conn:
                    result = await conn.execute(text("SELECT 1"))
                    await result.fetchone()

                # Create session maker
                self.primary_session_maker = async_sessionmaker(
                    self.primary_engine, class_=AsyncSession, expire_on_commit=False
                )

                self.current_engine = self.primary_engine
                self.current_session_maker = self.primary_session_maker
                self.health_status.primary_available = True
                self.successful_connections += 1
                self.consecutive_failures = 0

                return True

            except Exception as e:
                self.failed_connections += 1
                self.consecutive_failures += 1
                self.last_error_time = datetime.now()
                self.health_status.last_error = str(e)

                logger.warning(
                    f"Primary database connection attempt {attempt + 1} failed: {e}"
                )

                if attempt < self.config.max_retries - 1:
                    retry_delay = min(
                        self.config.retry_delay * (2**attempt),
                        self.config.max_retry_delay,
                    )
                    logger.info(f"Retrying in {retry_delay:.1f} seconds...")
                    await asyncio.sleep(retry_delay)

        self.health_status.primary_available = False
        return False

    async def _initialize_fallback(self) -> bool:
        """Initialize fallback SQLite database"""
        try:
            logger.info("Initializing fallback SQLite database...")

            # Create async SQLite engine
            self.fallback_engine = create_async_engine(
                self.config.fallback_url,
                poolclass=QueuePool,
                pool_size=5,  # Smaller pool for SQLite
                max_overflow=10,
                pool_timeout=10.0,
                pool_recycle=3600,
                connect_args={"check_same_thread": False},
            )

            # Test connection
            async with self.fallback_engine.begin() as conn:
                result = await conn.execute(text("SELECT 1"))
                _ = await result.scalar()  # Correct async usage for SQLAlchemy async

            # Create session maker
            self.fallback_session_maker = async_sessionmaker(
                self.fallback_engine, class_=AsyncSession, expire_on_commit=False
            )

            self.current_engine = self.fallback_engine
            self.current_session_maker = self.fallback_session_maker
            self.health_status.fallback_available = True

            return True

        except Exception as e:
            logger.error(f"Fallback database initialization failed: {e}")
            self.health_status.fallback_available = False
            self.health_status.last_error = str(e)
            return False

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session with automatic retry and fallback"""
        if not self.is_initialized:
            await self.initialize()

        session = None
        max_attempts = 3

        for attempt in range(max_attempts):
            try:
                if not self.current_session_maker:
                    raise Exception("No database session maker available")

                session = self.current_session_maker()

                # Test the connection
                await session.execute(text("SELECT 1"))

                self.connection_attempts += 1
                self.successful_connections += 1
                self.consecutive_failures = 0

                yield session

                # Commit if no exception occurred
                await session.commit()
                return

            except Exception as e:
                self.failed_connections += 1
                self.consecutive_failures += 1
                self.last_error_time = datetime.now()
                self.health_status.last_error = str(e)

                if session:
                    await session.rollback()

                logger.warning(f"Database session error (attempt {attempt + 1}): {e}")

                # Try to recover by switching to fallback
                if not self.using_fallback and self.health_status.fallback_available:
                    logger.info("Switching to fallback database...")
                    self.using_fallback = True
                    self.current_engine = self.fallback_engine
                    self.current_session_maker = self.fallback_session_maker
                    continue

                # If this is the last attempt, re-raise the exception
                if attempt == max_attempts - 1:
                    raise

                # Wait before retry
                await asyncio.sleep(0.5 * (attempt + 1))

            finally:
                if session:
                    await session.close()

    async def health_check(self) -> DatabaseHealth:
        """Perform comprehensive health check"""
        start_time = time.time()

        try:
            # Check primary database
            if self.primary_engine:
                try:
                    async with self.primary_engine.begin() as conn:
                        await conn.execute(text("SELECT 1"))
                    self.health_status.primary_available = True
                except:
                    self.health_status.primary_available = False

            # Check fallback database
            if self.fallback_engine:
                try:
                    async with self.fallback_engine.begin() as conn:
                        await conn.execute(text("SELECT 1"))
                    self.health_status.fallback_available = True
                except:
                    self.health_status.fallback_available = False

            # Update health status
            self.health_status.is_healthy = (
                self.health_status.primary_available
                or self.health_status.fallback_available
            )

            # Get connection pool stats
            if self.current_engine and hasattr(self.current_engine.pool, "size"):
                pool = self.current_engine.pool
                self.health_status.active_connections = pool.checkedout()
                self.health_status.total_connections = pool.size()

            response_time = time.time() - start_time
            self.health_status.response_time = response_time
            self.health_status.uptime = time.time() - self.start_time

            self.last_health_check = datetime.now()

            return self.health_status

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            self.health_status.is_healthy = False
            self.health_status.last_error = str(e)
            return self.health_status

    async def attempt_recovery(self) -> bool:
        """Attempt to recover from database connection issues"""
        logger.info("🔄 Attempting database connection recovery...")

        try:
            # If using fallback, try to reconnect to primary
            if self.using_fallback and not self.health_status.primary_available:
                if await self._initialize_primary():
                    logger.info("✅ Recovered connection to primary database")
                    self.using_fallback = False
                    self.current_engine = self.primary_engine
                    self.current_session_maker = self.primary_session_maker
                    return True

            # If primary is down, ensure fallback is working
            if not self.health_status.primary_available:
                if not self.health_status.fallback_available:
                    if await self._initialize_fallback():
                        logger.info("✅ Recovered connection to fallback database")
                        self.using_fallback = True
                        self.current_engine = self.fallback_engine
                        self.current_session_maker = self.fallback_session_maker
                        return True

            return False

        except Exception as e:
            logger.error(f"Database recovery failed: {e}")
            return False

    async def close(self):
        """Close all database connections"""
        logger.info("🔄 Closing database connections...")

        try:
            if self.primary_engine:
                await self.primary_engine.dispose()
            if self.fallback_engine:
                await self.fallback_engine.dispose()

            logger.info("✅ Database connections closed")

        except Exception as e:
            logger.error(f"Error closing database connections: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            "is_initialized": self.is_initialized,
            "using_fallback": self.using_fallback,
            "connection_attempts": self.connection_attempts,
            "successful_connections": self.successful_connections,
            "failed_connections": self.failed_connections,
            "consecutive_failures": self.consecutive_failures,
            "success_rate": (
                self.successful_connections / max(self.connection_attempts, 1) * 100
            ),
            "last_error_time": (
                self.last_error_time.isoformat() if self.last_error_time else None
            ),
            "uptime": time.time() - self.start_time,
            "health_status": self.health_status.__dict__,
        }


# Create global database configuration
database_config = DatabaseConfig(
    primary_url=os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/a1betting"
    ),
    fallback_url="sqlite+aiosqlite:///./a1betting_fallback.db",
    max_retries=3,
    retry_delay=1.0,
    max_retry_delay=30.0,
    connection_timeout=10.0,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30.0,
    pool_recycle=3600,
)

# Create global database manager
db_manager = DatabaseConnectionManager(database_config)


# Convenience function for getting database session
async def get_db_session():
    """Get database session - convenience function"""
    async with db_manager.get_session() as session:
        yield session


# Health check function
async def check_database_health():
    """Check database health - convenience function"""
    return await db_manager.health_check()


# Recovery function
async def recover_database():
    """Attempt database recovery - convenience function"""
    return await db_manager.attempt_recovery()
