"""
Optimized Database Service - Phase 4 Performance Enhancement
Enhanced database operations with query optimization, connection pooling, and monitoring
"""

import asyncio
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
import logging

try:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
    from sqlalchemy.orm import selectinload, joinedload
    from sqlalchemy import text, select, func, Index
    from sqlalchemy.pool import QueuePool
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

from backend.config_manager import A1BettingConfig
from backend.utils.enhanced_logging import get_logger

logger = get_logger("optimized_database")


class QueryPerformanceMonitor:
    """Monitor database query performance"""
    
    def __init__(self):
        self.query_metrics: List[Dict[str, Any]] = []
        self.slow_query_threshold = 1000  # 1 second in milliseconds
        self.max_metrics = 1000
    
    def record_query(self, query: str, duration_ms: float, rows_affected: int = 0):
        """Record query execution metrics"""
        metric = {
            'query': query[:200],  # Truncate long queries
            'duration_ms': duration_ms,
            'rows_affected': rows_affected,
            'timestamp': datetime.utcnow(),
            'is_slow': duration_ms > self.slow_query_threshold
        }
        
        self.query_metrics.append(metric)
        
        # Keep only recent metrics
        if len(self.query_metrics) > self.max_metrics:
            self.query_metrics = self.query_metrics[-self.max_metrics:]
        
        # Log slow queries
        if metric['is_slow']:
            logger.warning(f"Slow query detected: {duration_ms:.2f}ms - {query[:100]}...")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get query performance statistics"""
        if not self.query_metrics:
            return {}
        
        recent_metrics = [
            m for m in self.query_metrics 
            if datetime.utcnow() - m['timestamp'] < timedelta(minutes=5)
        ]
        
        if not recent_metrics:
            return {}
        
        total_queries = len(recent_metrics)
        slow_queries = sum(1 for m in recent_metrics if m['is_slow'])
        avg_duration = sum(m['duration_ms'] for m in recent_metrics) / total_queries
        
        return {
            'total_queries': total_queries,
            'slow_queries': slow_queries,
            'slow_query_percentage': (slow_queries / total_queries * 100) if total_queries > 0 else 0,
            'avg_duration_ms': round(avg_duration, 2),
            'max_duration_ms': max(m['duration_ms'] for m in recent_metrics),
            'min_duration_ms': min(m['duration_ms'] for m in recent_metrics)
        }


class OptimizedDatabaseService:
    """
    Enhanced database service with:
    - Connection pooling optimization
    - Query performance monitoring
    - Automatic query optimization
    - Connection health checks
    """
    
    def __init__(self):
        self.config = A1BettingConfig()
        self.engine = None
        self.session_factory = None
        self.performance_monitor = QueryPerformanceMonitor()
        self._connection_pool_stats = {}
        
        # Configuration
        self.pool_size = 20
        self.max_overflow = 30
        self.pool_timeout = 30
        self.pool_recycle = 3600  # 1 hour
        self.enable_monitoring = True
    
    async def initialize(self) -> None:
        """Initialize database connection with optimized settings"""
        if not SQLALCHEMY_AVAILABLE:
            logger.warning("SQLAlchemy not available, database operations disabled")
            return
        
        try:
            # Create optimized async engine
            self.engine = create_async_engine(
                self.config.database.url,
                poolclass=QueuePool,
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_timeout=self.pool_timeout,
                pool_recycle=self.pool_recycle,
                pool_pre_ping=True,  # Verify connections before use
                echo=False,  # Set to True for SQL debugging
                future=True,
                connect_args={
                    "check_same_thread": False,  # For SQLite
                    "timeout": 20
                }
            )
            
            # Create session factory
            self.session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Test connection
            async with self.get_session() as session:
                await session.execute(text("SELECT 1"))
            
            logger.info("✅ Optimized database service initialized")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            raise
    
    @asynccontextmanager
    async def get_session(self):
        """Get database session with automatic cleanup"""
        if not self.session_factory:
            raise RuntimeError("Database not initialized")
        
        async with self.session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def execute_query(
        self, 
        query: Union[str, Any], 
        params: Optional[Dict[str, Any]] = None,
        fetch_results: bool = True
    ) -> Optional[List[Dict[str, Any]]]:
        """Execute optimized query with performance monitoring"""
        start_time = time.time()
        query_str = str(query)
        
        try:
            async with self.get_session() as session:
                if isinstance(query, str):
                    result = await session.execute(text(query), params or {})
                else:
                    result = await session.execute(query, params or {})
                
                await session.commit()
                
                # Fetch results if requested
                data = None
                rows_affected = 0
                
                if fetch_results:
                    try:
                        rows = result.fetchall()
                        data = [dict(row) for row in rows]
                        rows_affected = len(data)
                    except Exception:
                        # Query might not return results (INSERT, UPDATE, DELETE)
                        rows_affected = result.rowcount if hasattr(result, 'rowcount') else 0
                
                # Record performance metrics
                duration_ms = (time.time() - start_time) * 1000
                if self.enable_monitoring:
                    self.performance_monitor.record_query(query_str, duration_ms, rows_affected)
                
                return data
                
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            if self.enable_monitoring:
                self.performance_monitor.record_query(f"FAILED: {query_str}", duration_ms, 0)
            logger.error(f"Query execution failed: {e}")
            raise
    
    async def get_table_stats(self, table_name: str) -> Dict[str, Any]:
        """Get table statistics for optimization"""
        try:
            queries = [
                f"SELECT COUNT(*) as row_count FROM {table_name}",
                f"PRAGMA table_info({table_name})" if "sqlite" in self.config.database.url else f"DESCRIBE {table_name}"
            ]
            
            stats = {}
            
            # Get row count
            result = await self.execute_query(queries[0])
            if result:
                stats['row_count'] = result[0]['row_count']
            
            # Get table structure
            result = await self.execute_query(queries[1])
            if result:
                stats['columns'] = len(result)
                stats['structure'] = result
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get table stats for {table_name}: {e}")
            return {}
    
    async def optimize_table(self, table_name: str) -> bool:
        """Optimize table performance"""
        try:
            if "sqlite" in self.config.database.url:
                # SQLite optimization
                await self.execute_query(f"ANALYZE {table_name}", fetch_results=False)
                await self.execute_query("VACUUM", fetch_results=False)
            elif "postgresql" in self.config.database.url:
                # PostgreSQL optimization
                await self.execute_query(f"ANALYZE {table_name}", fetch_results=False)
                await self.execute_query(f"REINDEX TABLE {table_name}", fetch_results=False)
            elif "mysql" in self.config.database.url:
                # MySQL optimization
                await self.execute_query(f"ANALYZE TABLE {table_name}", fetch_results=False)
                await self.execute_query(f"OPTIMIZE TABLE {table_name}", fetch_results=False)
            
            logger.info(f"✅ Table {table_name} optimized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to optimize table {table_name}: {e}")
            return False
    
    async def get_connection_pool_stats(self) -> Dict[str, Any]:
        """Get connection pool statistics"""
        if not self.engine:
            return {}
        
        pool = self.engine.pool
        
        return {
            'pool_size': pool.size(),
            'checked_in': pool.checkedin(),
            'checked_out': pool.checkedout(),
            'overflow': pool.overflow(),
            'invalid': pool.invalid(),
            'total_connections': pool.size() + pool.overflow()
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform database health check"""
        try:
            start_time = time.time()
            
            # Test basic connectivity
            async with self.get_session() as session:
                await session.execute(text("SELECT 1"))
            
            connection_time = (time.time() - start_time) * 1000
            
            # Get pool stats
            pool_stats = await self.get_connection_pool_stats()
            
            # Get performance stats
            perf_stats = self.performance_monitor.get_stats()
            
            return {
                'status': 'healthy',
                'connection_time_ms': round(connection_time, 2),
                'pool_stats': pool_stats,
                'performance_stats': perf_stats,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def close(self) -> None:
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("✅ Database connections closed")


# Global database service instance
_database_service: Optional[OptimizedDatabaseService] = None


async def get_database_service() -> OptimizedDatabaseService:
    """Get global database service instance"""
    global _database_service
    if _database_service is None:
        _database_service = OptimizedDatabaseService()
        await _database_service.initialize()
    return _database_service


# Enhanced model operations with optimization
class OptimizedModelService:
    """Enhanced model operations with query optimization"""
    
    def __init__(self):
        self.db_service: Optional[OptimizedDatabaseService] = None
    
    async def get_db_service(self) -> OptimizedDatabaseService:
        """Get database service instance"""
        if self.db_service is None:
            self.db_service = await get_database_service()
        return self.db_service
    
    async def get_mlb_games(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get MLB games with optimized query"""
        db = await self.get_db_service()
        
        query = """
        SELECT 
            g.id,
            g.home_team,
            g.away_team,
            g.start_time,
            g.status,
            g.venue
        FROM games g
        WHERE g.sport = 'mlb'
        AND g.start_time >= CURRENT_DATE
        ORDER BY g.start_time ASC
        LIMIT :limit
        """
        
        return await db.execute_query(query, {'limit': limit}) or []
    
    async def get_player_stats(self, player_id: str, days: int = 30) -> Dict[str, Any]:
        """Get player statistics with optimized query"""
        db = await self.get_db_service()
        
        query = """
        SELECT 
            p.name,
            AVG(ps.hits) as avg_hits,
            AVG(ps.runs) as avg_runs,
            AVG(ps.rbis) as avg_rbis,
            COUNT(*) as games_played
        FROM players p
        JOIN player_stats ps ON p.id = ps.player_id
        WHERE p.id = :player_id
        AND ps.game_date >= DATE('now', '-{} days')
        GROUP BY p.id, p.name
        """.format(days)
        
        result = await db.execute_query(query, {'player_id': player_id})
        return result[0] if result else {}
    
    async def cache_predictions(self, predictions: List[Dict[str, Any]]) -> bool:
        """Cache ML predictions with batch insert optimization"""
        db = await self.get_db_service()
        
        try:
            # Use batch insert for better performance
            query = """
            INSERT OR REPLACE INTO ml_predictions 
            (player_id, prop_type, line, confidence, expected_value, timestamp)
            VALUES (:player_id, :prop_type, :line, :confidence, :expected_value, :timestamp)
            """
            
            async with db.get_session() as session:
                for pred in predictions:
                    await session.execute(text(query), pred)
                await session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache predictions: {e}")
            return False


# Global model service instance
model_service = OptimizedModelService()
