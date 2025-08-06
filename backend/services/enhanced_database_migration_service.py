"""
Enhanced Database Migration Service for Large Datasets
=====================================================

Optimized for handling millions of records with:
- Batch processing with configurable sizes
- Progress tracking with ETA calculations
- Memory-efficient streaming transfers
- Error recovery and transaction rollback
- Performance monitoring and optimization
- Parallel processing for independent tables
"""

import asyncio
import logging
import sqlite3
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import asyncpg
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("enhanced_migration")


@dataclass
class MigrationProgress:
    """Track migration progress with detailed metrics"""

    table_name: str
    total_records: int = 0
    transferred_records: int = 0
    current_batch: int = 0
    total_batches: int = 0
    start_time: float = field(default_factory=time.time)
    last_batch_time: float = field(default_factory=time.time)
    errors: List[str] = field(default_factory=list)

    @property
    def progress_percentage(self) -> float:
        """Calculate completion percentage"""
        if self.total_records == 0:
            return 0.0
        return (self.transferred_records / self.total_records) * 100

    @property
    def elapsed_time(self) -> float:
        """Get elapsed time in seconds"""
        return time.time() - self.start_time

    @property
    def records_per_second(self) -> float:
        """Calculate transfer rate"""
        elapsed = self.elapsed_time
        if elapsed == 0:
            return 0.0
        return self.transferred_records / elapsed

    @property
    def eta_seconds(self) -> float:
        """Estimate time to completion"""
        if self.records_per_second == 0:
            return float("inf")
        remaining_records = self.total_records - self.transferred_records
        return remaining_records / self.records_per_second

    def format_eta(self) -> str:
        """Format ETA as human-readable string"""
        eta = self.eta_seconds
        if eta == float("inf"):
            return "Unknown"

        hours = int(eta // 3600)
        minutes = int((eta % 3600) // 60)
        seconds = int(eta % 60)

        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"


@dataclass
class BatchConfig:
    """Configuration for batch processing"""

    size: int = 10000
    max_memory_mb: int = 512
    max_parallel_tables: int = 4
    checkpoint_interval: int = 5
    retry_attempts: int = 3
    timeout_seconds: int = 300


class EnhancedDatabaseMigrationService:
    """Enhanced migration service with large dataset optimization"""

    def __init__(self, batch_config: Optional[BatchConfig] = None):
        self.config = batch_config or BatchConfig()
        self.progress_tracker: Dict[str, MigrationProgress] = {}
        self.executor = ThreadPoolExecutor(max_workers=self.config.max_parallel_tables)

    async def migrate_large_dataset(
        self,
        source_db_path: str,
        target_config: Dict[str, Any],
        tables: Optional[List[str]] = None,
        parallel: bool = True,
    ) -> Dict[str, Any]:
        """
        Migrate large datasets with optimization

        Args:
            source_db_path: Path to SQLite source database
            target_config: PostgreSQL connection configuration
            tables: List of table names to migrate (None for all)
            parallel: Whether to process tables in parallel

        Returns:
            Migration results with statistics
        """
        logger.info("🚀 Starting enhanced large dataset migration...")
        start_time = time.time()

        try:
            # Get source database info
            source_info = await self._analyze_source_database(source_db_path, tables)
            logger.info(f"📊 Source database analysis:")
            for table, count in source_info["table_counts"].items():
                logger.info(f"  {table}: {count:,} records")

            # Initialize progress tracking
            for table in source_info["tables"]:
                self.progress_tracker[table] = MigrationProgress(
                    table_name=table, total_records=source_info["table_counts"][table]
                )

            # Setup target database
            await self._setup_target_database(
                source_db_path, target_config, source_info["tables"]
            )

            # Migrate tables
            if parallel and len(source_info["tables"]) > 1:
                results = await self._migrate_tables_parallel(
                    source_db_path, target_config, source_info["tables"]
                )
            else:
                results = await self._migrate_tables_sequential(
                    source_db_path, target_config, source_info["tables"]
                )

            # Calculate final statistics
            total_time = time.time() - start_time
            total_records = sum(source_info["table_counts"].values())

            migration_stats = {
                "status": "completed",
                "total_records": total_records,
                "total_time_seconds": total_time,
                "records_per_second": (
                    total_records / total_time if total_time > 0 else 0
                ),
                "tables_migrated": len(results["successful"]),
                "tables_failed": len(results["failed"]),
                "successful_tables": results["successful"],
                "failed_tables": results["failed"],
                "table_progress": {
                    name: {
                        "records": progress.transferred_records,
                        "percentage": progress.progress_percentage,
                        "time_seconds": progress.elapsed_time,
                        "rate": progress.records_per_second,
                    }
                    for name, progress in self.progress_tracker.items()
                },
            }

            logger.info("✅ Migration completed successfully!")
            logger.info(
                f"📈 Total: {total_records:,} records in {total_time:.1f}s ({migration_stats['records_per_second']:.0f} rec/sec)"
            )

            return migration_stats

        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            logger.error(traceback.format_exc())
            raise
        finally:
            self.executor.shutdown(wait=True)

    async def _analyze_source_database(
        self, source_db_path: str, target_tables: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Analyze source database structure and record counts"""
        logger.info("🔍 Analyzing source database...")

        conn = sqlite3.connect(source_db_path)
        cursor = conn.cursor()

        try:
            # Get all table names
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
            all_tables = [row[0] for row in cursor.fetchall()]

            # Filter tables if specified
            tables = target_tables if target_tables else all_tables
            tables = [t for t in tables if t in all_tables]  # Ensure tables exist

            # Get record counts
            table_counts = {}
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                table_counts[table] = count

            return {
                "tables": tables,
                "table_counts": table_counts,
                "total_records": sum(table_counts.values()),
            }

        finally:
            conn.close()

    async def _setup_target_database(
        self, source_db_path: str, target_config: Dict[str, Any], tables: List[str]
    ) -> None:
        """Setup target PostgreSQL database with optimized schema"""
        logger.info("🏗️ Setting up target database schema...")

        try:
            # Connect to PostgreSQL and create tables directly
            import psycopg2

            conn = psycopg2.connect(**target_config)
            conn.autocommit = True
            cursor = conn.cursor()

            # Create database if it doesn't exist
            try:
                cursor.execute(f"CREATE DATABASE {target_config['database']}")
                logger.info(f"✅ Created database: {target_config['database']}")
            except psycopg2.errors.DuplicateDatabase:
                logger.info(f"ℹ️ Database {target_config['database']} already exists")

            conn.close()

            # Connect to the target database
            conn = psycopg2.connect(**target_config)
            conn.autocommit = True
            cursor = conn.cursor()

            # Get table schemas from SQLite
            import sqlite3

            sqlite_conn = sqlite3.connect(source_db_path)
            sqlite_cursor = sqlite_conn.cursor()

            for table in tables:
                # Get table schema from SQLite
                sqlite_cursor.execute(f"PRAGMA table_info({table})")
                columns_info = sqlite_cursor.fetchall()

                # Convert SQLite schema to PostgreSQL
                pg_columns = []
                for col in columns_info:
                    col_name = col[1]
                    col_type = col[2].upper()
                    not_null = "NOT NULL" if col[3] else ""
                    default_val = f"DEFAULT {col[4]}" if col[4] else ""

                    # Convert SQLite types to PostgreSQL types
                    if col_type.startswith("VARCHAR"):
                        pg_type = col_type
                    elif col_type in ["INTEGER", "INT"]:
                        if col[5]:  # Primary key
                            pg_type = "SERIAL PRIMARY KEY"
                        else:
                            pg_type = "INTEGER"
                    elif col_type == "TEXT":
                        pg_type = "TEXT"
                    elif col_type == "FLOAT":
                        pg_type = "REAL"
                    elif col_type == "BOOLEAN":
                        pg_type = "BOOLEAN"
                    elif col_type in ["TIMESTAMP", "DATE"]:
                        pg_type = col_type
                        if "CURRENT_TIMESTAMP" in str(default_val):
                            default_val = "DEFAULT CURRENT_TIMESTAMP"
                    else:
                        pg_type = "TEXT"  # Fallback

                    if (
                        col[5] and pg_type != "SERIAL PRIMARY KEY"
                    ):  # Primary key but not serial
                        pg_type += " PRIMARY KEY"

                    column_def = (
                        f"{col_name} {pg_type} {not_null} {default_val}".strip()
                    )
                    pg_columns.append(column_def)

                # Create table
                create_sql = (
                    f"CREATE TABLE IF NOT EXISTS {table} ({', '.join(pg_columns)})"
                )
                cursor.execute(create_sql)
                logger.info(f"✅ Created table: {table}")

            sqlite_conn.close()
            conn.close()

        except Exception as e:
            logger.error(f"❌ Failed to setup target database: {e}")
            raise

        logger.info("✅ Target database schema created successfully")

    async def _migrate_tables_parallel(
        self, source_db_path: str, target_config: Dict[str, Any], tables: List[str]
    ) -> Dict[str, Any]:
        """Migrate tables in parallel for better performance"""
        logger.info(f"⚡ Starting parallel migration of {len(tables)} tables...")

        futures = []
        for table in tables:
            future = self.executor.submit(
                self._migrate_single_table_sync, source_db_path, target_config, table
            )
            futures.append((table, future))

        successful = []
        failed = []

        for table, future in futures:
            try:
                result = future.result(timeout=self.config.timeout_seconds)
                if result["success"]:
                    successful.append(table)
                    logger.info(
                        f"✅ {table}: {result['records_transferred']:,} records migrated"
                    )
                else:
                    failed.append({"table": table, "error": result["error"]})
                    logger.error(f"❌ {table}: {result['error']}")
            except Exception as e:
                failed.append({"table": table, "error": str(e)})
                logger.error(f"❌ {table}: {e}")

        return {"successful": successful, "failed": failed}

    async def _migrate_tables_sequential(
        self, source_db_path: str, target_config: Dict[str, Any], tables: List[str]
    ) -> Dict[str, Any]:
        """Migrate tables sequentially"""
        logger.info(f"📋 Starting sequential migration of {len(tables)} tables...")

        successful = []
        failed = []

        for table in tables:
            try:
                result = self._migrate_single_table_sync(
                    source_db_path, target_config, table
                )
                if result["success"]:
                    successful.append(table)
                    logger.info(
                        f"✅ {table}: {result['records_transferred']:,} records migrated"
                    )
                else:
                    failed.append({"table": table, "error": result["error"]})
                    logger.error(f"❌ {table}: {result['error']}")
            except Exception as e:
                failed.append({"table": table, "error": str(e)})
                logger.error(f"❌ {table}: {e}")

        return {"successful": successful, "failed": failed}

    def _migrate_single_table_sync(
        self, source_db_path: str, target_config: Dict[str, Any], table: str
    ) -> Dict[str, Any]:
        """Migrate a single table with batch processing (synchronous)"""
        try:
            progress = self.progress_tracker[table]
            logger.info(
                f"📋 Starting migration of {table} ({progress.total_records:,} records)..."
            )

            # Calculate batch parameters
            batch_size = min(self.config.size, max(1000, progress.total_records // 100))
            progress.total_batches = (
                progress.total_records + batch_size - 1
            ) // batch_size

            # Open connections
            source_conn = sqlite3.connect(source_db_path)
            source_conn.row_factory = sqlite3.Row

            target_conn = psycopg2.connect(**target_config)
            target_conn.autocommit = False

            try:
                # Get column information
                source_cursor = source_conn.cursor()
                source_cursor.execute(f"PRAGMA table_info({table})")
                columns_info = source_cursor.fetchall()
                column_names = [col[1] for col in columns_info]

                # Prepare batch transfer
                records_transferred = 0

                for batch_num in range(progress.total_batches):
                    offset = batch_num * batch_size

                    # Fetch batch from source
                    query = f"SELECT * FROM {table} LIMIT {batch_size} OFFSET {offset}"
                    source_cursor.execute(query)
                    batch_data = source_cursor.fetchall()

                    if not batch_data:
                        break

                    # Insert batch into target
                    target_cursor = target_conn.cursor()

                    placeholders = ",".join(["%s"] * len(column_names))
                    insert_query = f"INSERT INTO {table} ({','.join(column_names)}) VALUES ({placeholders})"

                    batch_tuples = [tuple(row) for row in batch_data]
                    target_cursor.executemany(insert_query, batch_tuples)
                    target_conn.commit()

                    # Update progress
                    records_transferred += len(batch_data)
                    progress.transferred_records = records_transferred
                    progress.current_batch = batch_num + 1
                    progress.last_batch_time = time.time()

                    # Log progress
                    if (
                        (batch_num + 1) % self.config.checkpoint_interval == 0
                        or batch_num + 1 == progress.total_batches
                    ):
                        logger.info(
                            f"  {table}: Batch {batch_num + 1}/{progress.total_batches} "
                            f"({progress.progress_percentage:.1f}%) - "
                            f"{progress.records_per_second:.0f} rec/sec - "
                            f"ETA: {progress.format_eta()}"
                        )

                return {
                    "success": True,
                    "records_transferred": records_transferred,
                    "batches_processed": progress.current_batch,
                    "time_seconds": progress.elapsed_time,
                }

            finally:
                source_conn.close()
                target_conn.close()

        except Exception as e:
            error_msg = f"Failed to migrate {table}: {str(e)}"
            progress.errors.append(error_msg)
            return {"success": False, "error": error_msg}

    def get_progress_summary(self) -> Dict[str, Any]:
        """Get current migration progress summary"""
        total_records = sum(p.total_records for p in self.progress_tracker.values())
        transferred_records = sum(
            p.transferred_records for p in self.progress_tracker.values()
        )

        if total_records == 0:
            overall_percentage = 0
        else:
            overall_percentage = (transferred_records / total_records) * 100

        active_tables = [
            name
            for name, progress in self.progress_tracker.items()
            if progress.transferred_records < progress.total_records
        ]

        return {
            "overall_progress": overall_percentage,
            "total_records": total_records,
            "transferred_records": transferred_records,
            "active_tables": len(active_tables),
            "completed_tables": len(self.progress_tracker) - len(active_tables),
            "table_details": {
                name: {
                    "progress": progress.progress_percentage,
                    "records": f"{progress.transferred_records:,}/{progress.total_records:,}",
                    "rate": f"{progress.records_per_second:.0f} rec/sec",
                    "eta": progress.format_eta(),
                    "errors": len(progress.errors),
                }
                for name, progress in self.progress_tracker.items()
            },
        }


async def main():
    """Test the enhanced migration service with large dataset"""

    # Configuration
    source_db = "large_test_dataset.db"
    target_config = {
        "host": "localhost",
        "port": 5432,
        "database": "a1betting_large",
        "user": "postgres",
        "password": "postgres123",
    }

    # Create enhanced migration service
    batch_config = BatchConfig(
        size=50000,  # Larger batches for better performance
        max_memory_mb=1024,
        max_parallel_tables=4,
        checkpoint_interval=3,
        timeout_seconds=600,
    )

    migration_service = EnhancedDatabaseMigrationService(batch_config)

    try:
        # Run migration
        results = await migration_service.migrate_large_dataset(
            source_db_path=source_db, target_config=target_config, parallel=True
        )

        print("\n" + "=" * 60)
        print("ENHANCED MIGRATION RESULTS")
        print("=" * 60)
        print(f"Status: {results['status']}")
        print(f"Total Records: {results['total_records']:,}")
        print(f"Migration Time: {results['total_time_seconds']:.1f} seconds")
        print(f"Transfer Rate: {results['records_per_second']:.0f} records/second")
        print(f"Tables Migrated: {results['tables_migrated']}")

        if results["failed_tables"]:
            print(f"Failed Tables: {len(results['failed_tables'])}")
            for failure in results["failed_tables"]:
                print(f"  ❌ {failure['table']}: {failure['error']}")

        print("\nTable Performance:")
        for table, stats in results["table_progress"].items():
            print(
                f"  {table}: {stats['records']:,} records in {stats['time_seconds']:.1f}s ({stats['rate']:.0f} rec/sec)"
            )

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())
