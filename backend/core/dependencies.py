"""
Advanced dependency injection patterns for FastAPI.

Implements best practices from research:
- Context-aware dependencies with yield
- Dependency overrides for testing
- Class-based dependencies for stateful services
- Sub-dependencies with caching control
"""

from typing import AsyncGenerator, Annotated
from contextlib import asynccontextmanager
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
import redis.asyncio as redis

from backend.core.settings import get_settings, Settings


# ============================================================================
# Database Dependencies
# ============================================================================

class DatabaseSessionManager:
    """
    Database session manager using class-based dependency pattern.
    Maintains state and provides async session management.
    """
    
    def __init__(self):
        self.engine = None
        self.session_maker = None
    
    def init(self, database_url: str, **kwargs):
        """Initialize database engine and session maker."""
        self.engine = create_async_engine(
            database_url,
            pool_pre_ping=True,
            pool_size=kwargs.get("pool_size", 20),
            max_overflow=kwargs.get("max_overflow", 10),
            echo=kwargs.get("echo", False),
        )
        self.session_maker = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    
    async def close(self):
        """Close database engine."""
        if self.engine:
            await self.engine.dispose()
    
    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Context manager for database sessions.
        Automatically commits on success, rolls back on error.
        """
        if not self.session_maker:
            raise RuntimeError("DatabaseSessionManager not initialized")
        
        async with self.session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def __call__(self) -> AsyncGenerator[AsyncSession, None]:
        """Make class callable for use with Depends()."""
        async with self.session() as session:
            yield session


# Singleton instance
db_manager = DatabaseSessionManager()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session with automatic transaction management.
    
    Context-aware dependency with yield pattern:
    - Automatically starts transaction
    - Commits on success
    - Rolls back on error
    - Closes session in finally block
    
    Usage:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db_session)):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    async with db_manager.session() as session:
        yield session


# ============================================================================
# Redis Dependencies
# ============================================================================

class RedisManager:
    """Redis connection manager with connection pooling."""
    
    def __init__(self):
        self.pool = None
        self.client = None
    
    async def init(self, redis_url: str, max_connections: int = 50):
        """Initialize Redis connection pool."""
        self.pool = redis.ConnectionPool.from_url(
            redis_url,
            max_connections=max_connections,
            decode_responses=True
        )
        self.client = redis.Redis(connection_pool=self.pool)
    
    async def close(self):
        """Close Redis connections."""
        if self.client:
            await self.client.close()
        if self.pool:
            await self.pool.disconnect()
    
    async def __call__(self) -> redis.Redis:
        """Get Redis client."""
        if not self.client:
            raise RuntimeError("RedisManager not initialized")
        return self.client


# Singleton instance
redis_manager = RedisManager()


async def get_redis() -> redis.Redis:
    """
    Get Redis client.
    
    Usage:
        @app.get("/cache")
        async def get_cache(redis: Redis = Depends(get_redis)):
            value = await redis.get("key")
            return {"value": value}
    """
    return await redis_manager()


# ============================================================================
# Authentication Dependencies
# ============================================================================

async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current authenticated user from JWT token.
    
    Conditional dependency pattern - returns user if authenticated.
    
    Usage:
        @app.get("/profile")
        async def get_profile(user = Depends(get_current_user)):
            return user
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # TODO: Implement JWT token validation
    # For now, placeholder
    return {"user_id": "123", "username": "user"}


async def get_current_active_user(
    current_user = Depends(get_current_user)
):
    """
    Get current active user (sub-dependency pattern).
    
    Builds on get_current_user dependency.
    """
    if not current_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user = Depends(get_current_user)
):
    """
    Get current admin user (conditional dependency).
    
    Only allows admin users to proceed.
    """
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


# ============================================================================
# Request Context Dependencies
# ============================================================================

class RequestContext:
    """
    Request context for tracking request-specific data.
    
    Class-based dependency with state management.
    """
    
    def __init__(self):
        self.request_id: str | None = None
        self.user_id: str | None = None
        self.tenant_id: str | None = None
    
    def set_request_id(self, request_id: str):
        """Set request ID for tracing."""
        self.request_id = request_id
    
    def set_user_id(self, user_id: str):
        """Set user ID."""
        self.user_id = user_id
    
    def set_tenant_id(self, tenant_id: str):
        """Set tenant ID for multi-tenancy."""
        self.tenant_id = tenant_id


def get_request_context() -> RequestContext:
    """
    Get fresh request context for each request.
    
    Uses use_cache=False to ensure isolation between requests.
    
    Usage:
        @app.get("/data")
        async def get_data(
            context: RequestContext = Depends(get_request_context, use_cache=False)
        ):
            return {"request_id": context.request_id}
    """
    return RequestContext()


# ============================================================================
# Service Dependencies (Provider Pattern)
# ============================================================================

class ServiceProvider:
    """
    Service provider factory for complex object graphs.
    
    Provider pattern for building services with dependencies.
    """
    
    def __init__(self, settings: Settings = Depends(get_settings)):
        self.settings = settings
    
    async def get_ml_service(self, db: AsyncSession = Depends(get_db_session)):
        """Get ML service with dependencies."""
        # Import here to avoid circular dependencies
        from backend.services.ml.ml_service import MLService
        return MLService(db=db, settings=self.settings)
    
    async def get_analytics_service(
        self,
        db: AsyncSession = Depends(get_db_session),
        redis: redis.Redis = Depends(get_redis)
    ):
        """Get analytics service with dependencies."""
        from backend.services.analytics_service import AnalyticsService
        return AnalyticsService(db=db, redis=redis, settings=self.settings)


# ============================================================================
# Pagination Dependencies
# ============================================================================

class PaginationParams:
    """
    Pagination parameters.
    
    Class-based dependency for query parameters.
    """
    
    def __init__(
        self,
        skip: int = 0,
        limit: int = 100,
    ):
        self.skip = max(0, skip)
        self.limit = min(100, max(1, limit))  # Cap at 100


def get_pagination_params(
    skip: int = 0,
    limit: int = 100
) -> PaginationParams:
    """Get pagination parameters."""
    return PaginationParams(skip=skip, limit=limit)


# ============================================================================
# Testing Overrides
# ============================================================================

# For testing, you can override dependencies:
# app.dependency_overrides[get_db_session] = override_get_db_session
# app.dependency_overrides[get_redis] = override_get_redis

# Example override for testing:
# async def override_get_db_session():
#     """Override database session for testing."""
#     async with TestingSessionLocal() as session:
#         yield session
