"""
Database Health Checker

Advanced health monitoring system for database connections and operations.
"""

import asyncio
import logging
import sqlite3
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiosqlite
import psutil
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class DatabaseHealthChecker:
    """Advanced database health monitoring and diagnostics"""

    def __init__(self, db_manager=None):
        self.db_manager = db_manager
        self.health_history = []
        self.max_history = 100
        self.last_check = None
        self.connection_pool_stats = {}

    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """Perform comprehensive database health check"""
        start_time = time.time()
        health_status: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "overall_status": "healthy",
            "checks": {},
            "metrics": {},
            "recommendations": [],
        }

        try:
            # 1. Connection Test
            connection_result = await self._test_connection()
            health_status["checks"]["connection"] = connection_result

            # 2. Query Performance Test
            query_result = await self._test_query_performance()
            health_status["checks"]["query_performance"] = query_result

            # 3. Database Size and Storage
            storage_result = await self._check_storage_metrics()
            health_status["checks"]["storage"] = storage_result

            # 4. Connection Pool Status
            pool_result = await self._check_connection_pool()
            health_status["checks"]["connection_pool"] = pool_result

            # 5. Table Schema Validation
            schema_result = await self._validate_schema()
            health_status["checks"]["schema"] = schema_result

            # 6. Transaction Log Health
            transaction_result = await self._check_transaction_health()
            health_status["checks"]["transactions"] = transaction_result

            # Calculate overall metrics
            total_time = time.time() - start_time
            health_status["metrics"] = {
                "total_check_time": round(total_time, 3),
                "connection_latency": connection_result.get("latency_ms", 0),
                "query_performance": query_result.get("avg_response_time", 0),
                "storage_usage": storage_result.get("usage_percentage", 0),
                "active_connections": pool_result.get("active_connections", 0),
            }

            # Determine overall status
            failed_checks = [
                check
                for check, result in health_status["checks"].items()
                if result.get("status") == "failed"
            ]

            if failed_checks:
                health_status["overall_status"] = "unhealthy"
                health_status["recommendations"].append(
                    f"Critical issues found in: {', '.join(failed_checks)}"
                )
            elif any(
                result.get("status") == "warning"
                for result in health_status["checks"].values()
            ):
                health_status["overall_status"] = "warning"
                health_status["recommendations"].append(
                    "Some components need attention"
                )

            # Add performance recommendations
            if health_status["metrics"]["connection_latency"] > 100:
                health_status["recommendations"].append(
                    "High connection latency detected"
                )

            if health_status["metrics"]["query_performance"] > 50:
                health_status["recommendations"].append(
                    "Slow query performance detected"
                )

            # Store in history
            self._store_health_history(health_status)

            return health_status

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            health_status["overall_status"] = "error"
            health_status["error"] = str(e)
            return health_status

    async def _test_connection(self) -> Dict[str, Any]:
        """Test database connection"""
        start_time = time.time()

        try:
            if self.db_manager:
                # Test enhanced database manager
                connection = await self.db_manager.get_connection()
                if connection:
                    await connection.close()
                    latency = round((time.time() - start_time) * 1000, 2)
                    return {
                        "status": "healthy",
                        "latency_ms": latency,
                        "connection_type": "enhanced_manager",
                        "message": "Connection successful",
                    }

            # Fallback to direct SQLite test
            async with aiosqlite.connect("a1betting.db") as conn:
                await conn.execute("SELECT 1")
                latency = round((time.time() - start_time) * 1000, 2)
                return {
                    "status": "healthy",
                    "latency_ms": latency,
                    "connection_type": "direct_sqlite",
                    "message": "Connection successful",
                }

        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
                "latency_ms": round((time.time() - start_time) * 1000, 2),
            }

    async def _test_query_performance(self) -> Dict[str, Any]:
        """Test query performance with common operations"""
        try:
            queries = [
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table'",
                "SELECT name FROM sqlite_master WHERE type='table'",
                "SELECT datetime('now')",
            ]

            response_times = []

            for query in queries:
                start_time = time.time()
                try:
                    async with aiosqlite.connect("a1betting.db") as conn:
                        await conn.execute(query)
                        response_times.append(time.time() - start_time)
                except Exception as e:
                    logger.warning(f"Query failed: {query} - {e}")

            if response_times:
                avg_time = sum(response_times) / len(response_times) * 1000
                max_time = max(response_times) * 1000

                status = (
                    "healthy"
                    if avg_time < 50
                    else "warning" if avg_time < 100 else "failed"
                )

                return {
                    "status": status,
                    "avg_response_time": round(avg_time, 2),
                    "max_response_time": round(max_time, 2),
                    "queries_tested": len(queries),
                    "successful_queries": len(response_times),
                }

            return {"status": "failed", "error": "No queries executed successfully"}

        except Exception as e:
            return {"status": "failed", "error": str(e)}

    async def _check_storage_metrics(self) -> Dict[str, Any]:
        """Check database storage metrics"""
        try:
            import os

            db_path = "a1betting.db"
            if os.path.exists(db_path):
                # Get database file size
                db_size = os.path.getsize(db_path)

                # Get available disk space
                disk_usage = psutil.disk_usage(".")
                available_space = disk_usage.free
                total_space = disk_usage.total

                usage_percentage = (db_size / total_space) * 100

                return {
                    "status": "healthy",
                    "db_size_mb": round(db_size / (1024 * 1024), 2),
                    "available_space_gb": round(
                        available_space / (1024 * 1024 * 1024), 2
                    ),
                    "total_space_gb": round(total_space / (1024 * 1024 * 1024), 2),
                    "usage_percentage": round(usage_percentage, 4),
                }

            return {"status": "warning", "message": "Database file not found"}

        except Exception as e:
            return {"status": "failed", "error": str(e)}

    async def _check_connection_pool(self) -> Dict[str, Any]:
        """Check connection pool status"""
        try:
            if self.db_manager and hasattr(self.db_manager, "connection_pool"):
                # Check enhanced database manager pool
                pool = self.db_manager.connection_pool
                return {
                    "status": "healthy",
                    "pool_type": "enhanced_manager",
                    "active_connections": getattr(pool, "active_connections", 0),
                    "max_connections": getattr(pool, "max_connections", 10),
                }

            # For SQLite, connections are typically direct
            return {
                "status": "healthy",
                "pool_type": "direct_sqlite",
                "active_connections": 0,
                "max_connections": 1,
                "message": "SQLite uses direct connections",
            }

        except Exception as e:
            return {"status": "failed", "error": str(e)}

    async def _validate_schema(self) -> Dict[str, Any]:
        """Validate database schema"""
        try:
            expected_tables = ["users", "matches", "bets"]
            found_tables = []

            async with aiosqlite.connect("a1betting.db") as conn:
                async with conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ) as cursor:
                    rows = await cursor.fetchall()
                    found_tables = [row[0] for row in rows]

            missing_tables = [
                table for table in expected_tables if table not in found_tables
            ]

            if missing_tables:
                return {
                    "status": "warning",
                    "found_tables": found_tables,
                    "missing_tables": missing_tables,
                    "message": f"Missing tables: {', '.join(missing_tables)}",
                }

            return {
                "status": "healthy",
                "found_tables": found_tables,
                "expected_tables": expected_tables,
                "message": "All expected tables found",
            }

        except Exception as e:
            return {"status": "failed", "error": str(e)}

    async def _check_transaction_health(self) -> Dict[str, Any]:
        """Check transaction log health"""
        try:
            # For SQLite, check WAL mode and journal
            async with aiosqlite.connect("a1betting.db") as conn:
                # Check journal mode
                async with conn.execute("PRAGMA journal_mode") as cursor:
                    journal_mode = await cursor.fetchone()

                # Check integrity
                async with conn.execute("PRAGMA integrity_check") as cursor:
                    integrity = await cursor.fetchone()

                return {
                    "status": "healthy",
                    "journal_mode": journal_mode[0] if journal_mode else "unknown",
                    "integrity_check": integrity[0] if integrity else "unknown",
                    "message": "Transaction log healthy",
                }

        except Exception as e:
            return {"status": "failed", "error": str(e)}

    def _store_health_history(self, health_status: Dict[str, Any]):
        """Store health check results in history"""
        self.health_history.append(health_status)

        # Keep only recent history
        if len(self.health_history) > self.max_history:
            self.health_history = self.health_history[-self.max_history :]

        self.last_check = datetime.now(timezone.utc)

    def get_health_history(self) -> List[Dict[str, Any]]:
        """Get health check history"""
        return self.health_history

    def get_health_summary(self) -> Dict[str, Any]:
        """Get summary of recent health checks"""
        if not self.health_history:
            return {"status": "no_data", "message": "No health checks performed yet"}

        recent_checks = self.health_history[-10:]  # Last 10 checks

        healthy_count = sum(
            1 for check in recent_checks if check.get("overall_status") == "healthy"
        )
        warning_count = sum(
            1 for check in recent_checks if check.get("overall_status") == "warning"
        )
        error_count = sum(
            1 for check in recent_checks if check.get("overall_status") == "error"
        )

        return {
            "total_checks": len(recent_checks),
            "healthy_count": healthy_count,
            "warning_count": warning_count,
            "error_count": error_count,
            "success_rate": round((healthy_count / len(recent_checks)) * 100, 2),
            "last_check": self.last_check.isoformat() if self.last_check else None,
        }


# Global instance
database_health_checker = DatabaseHealthChecker()
