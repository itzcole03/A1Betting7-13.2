"""
Query Optimizer for FastAPI Database Operations
Implements 2024-2025 best practices for database query optimization and monitoring.
"""

import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config.settings import get_settings

try:
    from backend.services.advanced_caching_system import advanced_caching_system
    from backend.utils.structured_logging import app_logger, performance_logger
except ImportError:
    import logging

    app_logger = logging.getLogger("query_optimizer")
    performance_logger = logging.getLogger("performance")
    advanced_caching_system = None


class QueryType(Enum):
    """Types of database queries"""

    SELECT = "select"
    INSERT = "insert"
    UPDATE = "update"
    DELETE = "delete"
    BULK = "bulk"


class OptimizationStrategy(Enum):
    """Query optimization strategies"""

    CACHE = "cache"
    BATCH = "batch"
    INDEX = "index"
    REWRITE = "rewrite"
    PAGINATION = "pagination"


@dataclass
class QueryMetrics:
    """Query performance metrics"""

    query_hash: str
    query_type: QueryType
    execution_count: int = 0
    total_time: float = 0.0
    avg_time: float = 0.0
    min_time: float = float("inf")
    max_time: float = 0.0
    last_executed: float = 0.0
    params_hash: Optional[str] = None
    table_names: Set[str] = field(default_factory=set)

    def update(self, execution_time: float):
        """Update metrics with new execution"""
        self.execution_count += 1
        self.total_time += execution_time
        self.avg_time = self.total_time / self.execution_count
        self.min_time = min(self.min_time, execution_time)
        self.max_time = max(self.max_time, execution_time)
        self.last_executed = time.time()


@dataclass
class QueryOptimization:
    """Query optimization recommendation"""

    query_hash: str
    strategy: OptimizationStrategy
    description: str
    estimated_improvement: float  # Percentage
    implementation_complexity: str  # low, medium, high
    sql_suggestion: Optional[str] = None


class QueryAnalyzer:
    """Analyzes SQL queries for optimization opportunities"""

    def __init__(self):
        self.slow_query_threshold = 1.0  # seconds
        self.frequent_query_threshold = 10  # executions

    def analyze_query(self, query: str, params: Dict = None) -> Dict[str, Any]:
        """Analyze query structure and identify optimization opportunities"""
        query_lower = query.lower().strip()

        analysis = {
            "query_type": self._identify_query_type(query_lower),
            "table_names": self._extract_table_names(query_lower),
            "has_where_clause": "where" in query_lower,
            "has_joins": any(
                join in query_lower
                for join in ["join", "inner join", "left join", "right join"]
            ),
            "has_subqueries": "(" in query_lower and "select" in query_lower,
            "has_aggregations": any(
                agg in query_lower for agg in ["count(", "sum(", "avg(", "min(", "max("]
            ),
            "has_order_by": "order by" in query_lower,
            "has_group_by": "group by" in query_lower,
            "has_limit": "limit" in query_lower,
            "estimated_complexity": self._estimate_complexity(query_lower),
        }

        return analysis

    def _identify_query_type(self, query: str) -> QueryType:
        """Identify the type of SQL query"""
        if query.startswith("select"):
            return QueryType.SELECT
        elif query.startswith("insert"):
            return QueryType.INSERT
        elif query.startswith("update"):
            return QueryType.UPDATE
        elif query.startswith("delete"):
            return QueryType.DELETE
        else:
            return QueryType.BULK

    def _extract_table_names(self, query: str) -> Set[str]:
        """Extract table names from query (simplified)"""
        tables = set()

        # Simple pattern matching for common cases
        words = query.split()

        # Look for FROM clauses
        if "from" in words:
            from_idx = words.index("from")
            if from_idx + 1 < len(words):
                table_name = words[from_idx + 1].strip(",();")
                tables.add(table_name)

        # Look for JOIN clauses
        for i, word in enumerate(words):
            if "join" in word and i + 1 < len(words):
                table_name = words[i + 1].strip(",();")
                tables.add(table_name)

        return tables

    def _estimate_complexity(self, query: str) -> str:
        """Estimate query complexity"""
        complexity_score = 0

        # Factors that increase complexity
        if "join" in query:
            complexity_score += query.count("join") * 2
        if "subquery" in query or query.count("(") > 2:
            complexity_score += 3
        if "group by" in query:
            complexity_score += 2
        if "order by" in query:
            complexity_score += 1
        if "having" in query:
            complexity_score += 2

        if complexity_score <= 2:
            return "low"
        elif complexity_score <= 5:
            return "medium"
        else:
            return "high"


class QueryOptimizer:
    """
    Advanced query optimizer with caching, batching, and performance monitoring
    """

    def __init__(self):
        self.settings = get_settings()
        self.analyzer = QueryAnalyzer()
        self.query_metrics: Dict[str, QueryMetrics] = {}
        self.query_cache: Dict[str, Tuple[Any, float]] = {}
        self.slow_query_log: deque = deque(maxlen=100)
        self.optimization_suggestions: List[QueryOptimization] = []
        self._monitoring_enabled = True

    def _generate_query_hash(self, query: str, params: Dict = None) -> str:
        """Generate hash for query caching"""
        import hashlib

        # Normalize query
        normalized = " ".join(query.split()).lower()

        # Include parameters in hash
        if params:
            param_str = str(sorted(params.items()))
            normalized += param_str

        return hashlib.md5(normalized.encode()).hexdigest()

    async def execute_optimized_query(
        self,
        session: AsyncSession,
        query: Union[str, sa.sql.Selectable],
        params: Optional[Dict] = None,
        cache_ttl: Optional[int] = None,
        use_cache: bool = True,
    ) -> Any:
        """
        Execute query with optimization strategies applied
        """
        start_time = time.time()

        # Convert to string if needed
        if hasattr(query, "compile"):
            query_str = str(query.compile(compile_kwargs={"literal_binds": True}))
        else:
            query_str = str(query)

        query_hash = self._generate_query_hash(query_str, params)

        # Try cache first
        if use_cache and advanced_caching_system:
            cached_result = await self._try_cache(query_hash)
            if cached_result is not None:
                self._record_cache_hit(query_hash)
                return cached_result

        # Analyze query
        analysis = self.analyzer.analyze_query(query_str, params)

        # Apply optimizations
        optimized_query = await self._apply_optimizations(query, analysis)

        # Execute query
        try:
            if isinstance(optimized_query, str):
                if params:
                    result = await session.execute(text(optimized_query), params)
                else:
                    result = await session.execute(text(optimized_query))
            else:
                result = await session.execute(optimized_query)

            # Fetch results based on query type
            if analysis["query_type"] == QueryType.SELECT:
                data = result.fetchall()
            else:
                data = result.rowcount

            execution_time = time.time() - start_time

            # Record metrics
            await self._record_query_metrics(
                query_hash, query_str, analysis, execution_time
            )

            # Cache result if appropriate
            if (
                use_cache
                and advanced_caching_system
                and analysis["query_type"] == QueryType.SELECT
            ):
                await self._cache_result(query_hash, data, cache_ttl)

            return data

        except Exception as e:
            execution_time = time.time() - start_time
            await self._record_query_error(
                query_hash, query_str, str(e), execution_time
            )
            raise

    async def _try_cache(self, query_hash: str) -> Any:
        """Try to get result from cache"""
        if advanced_caching_system:
            return await advanced_caching_system.get(f"query:{query_hash}")
        return None

    async def _cache_result(
        self, query_hash: str, result: Any, ttl: Optional[int] = None
    ):
        """Cache query result"""
        if advanced_caching_system:
            cache_key = f"query:{query_hash}"
            await advanced_caching_system.set(
                cache_key, result, ttl or 300
            )  # 5 min default

    def _record_cache_hit(self, query_hash: str):
        """Record cache hit"""
        if query_hash in self.query_metrics:
            performance_logger.debug(f"Query cache hit: {query_hash[:8]}")

    async def _apply_optimizations(self, query: Any, analysis: Dict[str, Any]) -> Any:
        """Apply query optimizations based on analysis"""

        # For now, return original query
        # In a full implementation, this would:
        # - Add LIMIT clauses for large result sets
        # - Rewrite subqueries as JOINs where beneficial
        # - Add appropriate indexes suggestions
        # - Batch multiple similar queries

        return query

    async def _record_query_metrics(
        self,
        query_hash: str,
        query_str: str,
        analysis: Dict[str, Any],
        execution_time: float,
    ):
        """Record query execution metrics"""

        if query_hash not in self.query_metrics:
            self.query_metrics[query_hash] = QueryMetrics(
                query_hash=query_hash,
                query_type=analysis["query_type"],
                table_names=analysis["table_names"],
            )

        metrics = self.query_metrics[query_hash]
        metrics.update(execution_time)

        # Check for slow queries
        if execution_time > self.analyzer.slow_query_threshold:
            await self._record_slow_query(
                query_hash, query_str, execution_time, analysis
            )

        # Generate optimization suggestions
        await self._generate_optimization_suggestions(
            query_hash, query_str, metrics, analysis
        )

        # Log performance info
        performance_logger.info(
            f"Query executed: {execution_time:.3f}s "
            f"(type: {analysis['query_type'].value}, "
            f"complexity: {analysis['estimated_complexity']})"
        )

    async def _record_slow_query(
        self,
        query_hash: str,
        query_str: str,
        execution_time: float,
        analysis: Dict[str, Any],
    ):
        """Record slow query for analysis"""
        slow_query_entry = {
            "query_hash": query_hash,
            "query": query_str[:500],  # Truncate for logging
            "execution_time": execution_time,
            "timestamp": time.time(),
            "analysis": analysis,
        }

        self.slow_query_log.append(slow_query_entry)

        app_logger.warning(
            f"Slow query detected: {execution_time:.3f}s - "
            f"Hash: {query_hash[:8]} - "
            f"Tables: {', '.join(analysis['table_names'])}"
        )

    async def _record_query_error(
        self, query_hash: str, query_str: str, error: str, execution_time: float
    ):
        """Record query execution error"""
        app_logger.error(
            f"Query error after {execution_time:.3f}s - "
            f"Hash: {query_hash[:8]} - "
            f"Error: {error}"
        )

    async def _generate_optimization_suggestions(
        self,
        query_hash: str,
        query_str: str,
        metrics: QueryMetrics,
        analysis: Dict[str, Any],
    ):
        """Generate optimization suggestions for queries"""

        suggestions = []

        # Frequent slow queries should be cached
        if (
            metrics.avg_time > self.analyzer.slow_query_threshold
            and metrics.execution_count > self.analyzer.frequent_query_threshold
        ):
            suggestions.append(
                QueryOptimization(
                    query_hash=query_hash,
                    strategy=OptimizationStrategy.CACHE,
                    description="Cache results for frequently executed slow query",
                    estimated_improvement=50.0,
                    implementation_complexity="low",
                )
            )

        # Queries without LIMIT on large tables
        if (
            analysis["query_type"] == QueryType.SELECT
            and not analysis["has_limit"]
            and analysis["estimated_complexity"] in ["medium", "high"]
        ):
            suggestions.append(
                QueryOptimization(
                    query_hash=query_hash,
                    strategy=OptimizationStrategy.PAGINATION,
                    description="Add LIMIT clause to prevent large result sets",
                    estimated_improvement=30.0,
                    implementation_complexity="low",
                    sql_suggestion="Add LIMIT clause to your SELECT statement",
                )
            )

        # Queries without WHERE clause on frequent operations
        if (
            not analysis["has_where_clause"]
            and analysis["query_type"] == QueryType.SELECT
            and metrics.execution_count > 20
        ):
            suggestions.append(
                QueryOptimization(
                    query_hash=query_hash,
                    strategy=OptimizationStrategy.INDEX,
                    description="Consider adding WHERE clause and appropriate indexes",
                    estimated_improvement=40.0,
                    implementation_complexity="medium",
                )
            )

        # Add unique suggestions to global list
        existing_hashes = {opt.query_hash for opt in self.optimization_suggestions}
        new_suggestions = [
            s for s in suggestions if s.query_hash not in existing_hashes
        ]
        self.optimization_suggestions.extend(new_suggestions)

        # Limit suggestions list size
        if len(self.optimization_suggestions) > 50:
            self.optimization_suggestions = self.optimization_suggestions[-50:]

    def get_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report"""

        if not self.query_metrics:
            return {"message": "No query metrics available"}

        # Calculate summary statistics
        total_queries = sum(m.execution_count for m in self.query_metrics.values())
        total_time = sum(m.total_time for m in self.query_metrics.values())
        avg_query_time = total_time / total_queries if total_queries > 0 else 0

        # Find slowest queries
        slowest_queries = sorted(
            self.query_metrics.values(), key=lambda m: m.avg_time, reverse=True
        )[:10]

        # Find most frequent queries
        most_frequent = sorted(
            self.query_metrics.values(), key=lambda m: m.execution_count, reverse=True
        )[:10]

        # Query type distribution
        type_distribution = defaultdict(int)
        for metrics in self.query_metrics.values():
            type_distribution[metrics.query_type.value] += metrics.execution_count

        return {
            "summary": {
                "total_unique_queries": len(self.query_metrics),
                "total_executions": total_queries,
                "total_time": round(total_time, 3),
                "avg_query_time": round(avg_query_time, 3),
                "slow_queries_count": len(self.slow_query_log),
            },
            "slowest_queries": [
                {
                    "hash": m.query_hash[:8],
                    "avg_time": round(m.avg_time, 3),
                    "execution_count": m.execution_count,
                    "query_type": m.query_type.value,
                    "tables": list(m.table_names),
                }
                for m in slowest_queries
            ],
            "most_frequent": [
                {
                    "hash": m.query_hash[:8],
                    "execution_count": m.execution_count,
                    "avg_time": round(m.avg_time, 3),
                    "query_type": m.query_type.value,
                }
                for m in most_frequent
            ],
            "query_type_distribution": dict(type_distribution),
            "optimization_suggestions": [
                {
                    "query_hash": opt.query_hash[:8],
                    "strategy": opt.strategy.value,
                    "description": opt.description,
                    "estimated_improvement": opt.estimated_improvement,
                    "complexity": opt.implementation_complexity,
                    "sql_suggestion": opt.sql_suggestion,
                }
                for opt in self.optimization_suggestions[-10:]  # Latest 10
            ],
        }

    def get_slow_queries(self) -> List[Dict[str, Any]]:
        """Get recent slow queries"""
        return list(self.slow_query_log)

    async def health_check(self) -> Dict[str, Any]:
        """Perform query optimizer health check"""

        slow_query_ratio = len(self.slow_query_log) / max(len(self.query_metrics), 1)

        health = {
            "status": "healthy",
            "metrics_count": len(self.query_metrics),
            "slow_queries": len(self.slow_query_log),
            "slow_query_ratio": round(slow_query_ratio, 3),
            "optimization_suggestions": len(self.optimization_suggestions),
        }

        # Determine health status
        if slow_query_ratio > 0.2:  # More than 20% slow queries
            health["status"] = "degraded"
        elif slow_query_ratio > 0.5:  # More than 50% slow queries
            health["status"] = "unhealthy"

        return health


# Global instance
query_optimizer = QueryOptimizer()


# Convenience functions
async def execute_optimized_query(
    session: AsyncSession,
    query: Union[str, sa.sql.Selectable],
    params: Optional[Dict] = None,
    cache_ttl: Optional[int] = None,
    use_cache: bool = True,
) -> Any:
    """Execute query with optimization"""
    return await query_optimizer.execute_optimized_query(
        session, query, params, cache_ttl, use_cache
    )
