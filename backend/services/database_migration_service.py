"""
Database Migration and Abstraction Layer

This module provides a unified interface for database operations supporting both
SQLite (development/fallback) and PostgreSQL (production) databases with
seamless migration capabilities.
"""

import asyncio
import logging
import os

# Import with proper path handling
import sys
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session, SQLModel, select

backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from config_manager import DatabaseConfig

logger = logging.getLogger("database_migration")


class DatabaseType(str, Enum):
    """Supported database types"""

    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"


class DatabaseMigrationService:
    """
    Service for managing database migrations between SQLite and PostgreSQL
    """

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.sqlite_engine = None
        self.postgres_engine = None
        self.sqlite_async_engine = None
        self.postgres_async_engine = None

        # Initialize engines based on configuration
        self._setup_engines()

        logger.info("🗄️ Database Migration Service initialized")

    def _setup_engines(self):
        """Setup database engines for both SQLite and PostgreSQL"""
        try:
            # Setup SQLite engine (current default)
            if "sqlite" in self.config.url:
                # Create proper sync SQLite URL
                if "sqlite+aiosqlite:" in self.config.url:
                    sync_sqlite_url = self.config.url.replace(
                        "sqlite+aiosqlite:", "sqlite:"
                    )
                elif "sqlite+aiosqlite://" in self.config.url:
                    sync_sqlite_url = self.config.url.replace(
                        "sqlite+aiosqlite://", "sqlite:///"
                    )
                else:
                    sync_sqlite_url = self.config.url

                self.sqlite_engine = create_engine(
                    sync_sqlite_url,
                    pool_timeout=self.config.connection_timeout,
                    connect_args={"check_same_thread": False},
                )

                # Create proper async SQLite URL
                if "aiosqlite" not in self.config.url:
                    if "sqlite:///" in self.config.url:
                        async_sqlite_url = self.config.url.replace(
                            "sqlite:///", "sqlite+aiosqlite:///"
                        )
                    elif "sqlite:" in self.config.url:
                        async_sqlite_url = self.config.url.replace(
                            "sqlite:", "sqlite+aiosqlite:"
                        )
                    else:
                        async_sqlite_url = self.config.url
                else:
                    async_sqlite_url = self.config.url

                self.sqlite_async_engine = create_async_engine(
                    async_sqlite_url, pool_timeout=self.config.connection_timeout
                )
                logger.info(
                    f"✅ SQLite engines initialized (sync: {sync_sqlite_url}, async: {async_sqlite_url})"
                )

            # Setup PostgreSQL engine if configured
            postgres_url = os.getenv("POSTGRESQL_URL") or os.getenv("POSTGRES_URL")
            if postgres_url:
                self.postgres_engine = create_engine(
                    postgres_url,
                    pool_size=self.config.pool_size,
                    max_overflow=self.config.max_overflow,
                    pool_timeout=self.config.connection_timeout,
                )

                # Convert to async URL for PostgreSQL
                async_postgres_url = postgres_url.replace(
                    "postgresql://", "postgresql+asyncpg://"
                )
                self.postgres_async_engine = create_async_engine(
                    async_postgres_url,
                    pool_size=self.config.pool_size,
                    max_overflow=self.config.max_overflow,
                    pool_timeout=self.config.connection_timeout,
                )
                logger.info("✅ PostgreSQL engines initialized")
            else:
                logger.info("ℹ️ PostgreSQL URL not configured - SQLite only mode")

        except Exception as e:
            logger.error(f"❌ Failed to setup database engines: {e}")
            raise

    def get_database_type(self, url: str) -> DatabaseType:
        """Determine database type from URL"""
        if "postgresql" in url:
            return DatabaseType.POSTGRESQL
        elif "sqlite" in url:
            return DatabaseType.SQLITE
        else:
            raise ValueError(f"Unsupported database URL: {url}")

    async def check_database_connectivity(self) -> Dict[str, Any]:
        """Check connectivity to all configured databases"""
        results = {
            "sqlite": {"available": False, "error": None},
            "postgresql": {"available": False, "error": None},
        }

        # Test SQLite
        if self.sqlite_async_engine:
            try:
                async with AsyncSession(self.sqlite_async_engine) as session:
                    result = await session.execute(text("SELECT 1"))
                    if result.fetchone():
                        results["sqlite"]["available"] = True
                        logger.info("✅ SQLite connectivity confirmed")
            except Exception as e:
                results["sqlite"]["error"] = str(e)
                logger.warning(f"⚠️ SQLite connectivity failed: {e}")

        # Test PostgreSQL
        if self.postgres_async_engine:
            try:
                async with AsyncSession(self.postgres_async_engine) as session:
                    result = await session.execute(text("SELECT 1"))
                    if result.fetchone():
                        results["postgresql"]["available"] = True
                        logger.info("✅ PostgreSQL connectivity confirmed")
            except Exception as e:
                results["postgresql"]["error"] = str(e)
                logger.warning(f"⚠️ PostgreSQL connectivity failed: {e}")

        return results

    async def get_table_list(self, database_type: DatabaseType) -> List[str]:
        """Get list of tables in the specified database"""
        try:
            if database_type == DatabaseType.SQLITE:
                engine = self.sqlite_async_engine
                query = text("SELECT name FROM sqlite_master WHERE type='table'")
            elif database_type == DatabaseType.POSTGRESQL:
                engine = self.postgres_async_engine
                query = text(
                    "SELECT tablename FROM pg_tables WHERE schemaname='public'"
                )
            else:
                raise ValueError(f"Unsupported database type: {database_type}")

            if not engine:
                raise ValueError(f"{database_type} engine not available")

            async with AsyncSession(engine) as session:
                result = await session.execute(query)
                tables = [row[0] for row in result.fetchall()]

            logger.info(f"📋 Found {len(tables)} tables in {database_type} database")
            return tables

        except Exception as e:
            logger.error(f"❌ Failed to get table list from {database_type}: {e}")
            return []

    async def get_table_row_count(
        self, table_name: str, database_type: DatabaseType
    ) -> int:
        """Get row count for a specific table"""
        try:
            if database_type == DatabaseType.SQLITE:
                engine = self.sqlite_async_engine
            elif database_type == DatabaseType.POSTGRESQL:
                engine = self.postgres_async_engine
            else:
                raise ValueError(f"Unsupported database type: {database_type}")

            if not engine:
                raise ValueError(f"{database_type} engine not available")

            query = text(f"SELECT COUNT(*) FROM {table_name}")

            async with AsyncSession(engine) as session:
                result = await session.execute(query)
                count = result.scalar()

            return count or 0

        except Exception as e:
            logger.error(
                f"❌ Failed to get row count for {table_name} in {database_type}: {e}"
            )
            return 0

    async def export_table_data(
        self, table_name: str, database_type: DatabaseType, limit: Optional[int] = None
    ) -> pd.DataFrame:
        """Export table data to pandas DataFrame"""
        try:
            if database_type == DatabaseType.SQLITE:
                engine = self.sqlite_engine
            elif database_type == DatabaseType.POSTGRESQL:
                engine = self.postgres_engine
            else:
                raise ValueError(f"Unsupported database type: {database_type}")

            if not engine:
                raise ValueError(f"{database_type} engine not available")

            # Build query with optional limit
            query = f"SELECT * FROM {table_name}"
            if limit:
                query += f" LIMIT {limit}"

            # Use pandas to read data
            df = pd.read_sql(query, engine)

            logger.info(
                f"📊 Exported {len(df)} rows from {table_name} ({database_type})"
            )
            return df

        except Exception as e:
            logger.error(f"❌ Failed to export {table_name} from {database_type}: {e}")
            return pd.DataFrame()

    async def import_table_data(
        self,
        table_name: str,
        data: pd.DataFrame,
        database_type: DatabaseType,
        if_exists: str = "append",
    ) -> bool:
        """Import pandas DataFrame to database table"""
        try:
            if database_type == DatabaseType.SQLITE:
                engine = self.sqlite_engine
            elif database_type == DatabaseType.POSTGRESQL:
                engine = self.postgres_engine
            else:
                raise ValueError(f"Unsupported database type: {database_type}")

            if not engine:
                raise ValueError(f"{database_type} engine not available")

            # Import data using pandas
            data.to_sql(table_name, engine, if_exists=if_exists, index=False)

            logger.info(
                f"✅ Imported {len(data)} rows to {table_name} ({database_type})"
            )
            return True

        except Exception as e:
            logger.error(
                f"❌ Failed to import data to {table_name} in {database_type}: {e}"
            )
            return False

    async def migrate_table(
        self,
        table_name: str,
        source_type: DatabaseType,
        target_type: DatabaseType,
        batch_size: int = 1000,
    ) -> Dict[str, Any]:
        """Migrate a single table from source to target database"""
        migration_result = {
            "table_name": table_name,
            "source_type": source_type,
            "target_type": target_type,
            "rows_migrated": 0,
            "success": False,
            "error": None,
            "start_time": datetime.now(),
            "end_time": None,
        }

        try:
            logger.info(
                f"🚀 Starting migration: {table_name} ({source_type} → {target_type})"
            )

            # Get total row count
            total_rows = await self.get_table_row_count(table_name, source_type)
            if total_rows == 0:
                logger.warning(f"⚠️ Table {table_name} is empty, skipping migration")
                migration_result["success"] = True
                migration_result["end_time"] = datetime.now()
                return migration_result

            # Migrate in batches
            rows_migrated = 0
            offset = 0

            while offset < total_rows:
                # Export batch from source
                batch_data = await self.export_table_data(
                    table_name, source_type, batch_size
                )
                if batch_data.empty:
                    break

                # Import batch to target
                success = await self.import_table_data(
                    table_name, batch_data, target_type, "append"
                )
                if not success:
                    raise Exception(f"Failed to import batch at offset {offset}")

                rows_migrated += len(batch_data)
                offset += batch_size

                logger.info(
                    f"📈 Migrated {rows_migrated}/{total_rows} rows for {table_name}"
                )

            migration_result["rows_migrated"] = rows_migrated
            migration_result["success"] = True
            logger.info(f"✅ Successfully migrated {table_name}: {rows_migrated} rows")

        except Exception as e:
            migration_result["error"] = str(e)
            logger.error(f"❌ Migration failed for {table_name}: {e}")

        migration_result["end_time"] = datetime.now()
        return migration_result

    async def migrate_database(
        self,
        source_type: DatabaseType,
        target_type: DatabaseType,
        tables: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Migrate entire database from source to target"""
        migration_summary = {
            "source_type": source_type,
            "target_type": target_type,
            "start_time": datetime.now(),
            "end_time": None,
            "tables_migrated": 0,
            "total_rows_migrated": 0,
            "successful_tables": [],
            "failed_tables": [],
            "migration_results": [],
        }

        try:
            logger.info(
                f"🚀 Starting full database migration: {source_type} → {target_type}"
            )

            # Get list of tables to migrate
            if not tables:
                tables = await self.get_table_list(source_type)

            if not tables:
                logger.warning("⚠️ No tables found to migrate")
                migration_summary["end_time"] = datetime.now()
                return migration_summary

            logger.info(f"📋 Migrating {len(tables)} tables: {', '.join(tables)}")

            # Migrate each table
            for table_name in tables:
                result = await self.migrate_table(table_name, source_type, target_type)
                migration_summary["migration_results"].append(result)

                if result["success"]:
                    migration_summary["successful_tables"].append(table_name)
                    migration_summary["total_rows_migrated"] += result["rows_migrated"]
                    migration_summary["tables_migrated"] += 1
                else:
                    migration_summary["failed_tables"].append(table_name)

            success_rate = (migration_summary["tables_migrated"] / len(tables)) * 100
            logger.info(
                f"✅ Database migration complete: {success_rate:.1f}% success rate"
            )

        except Exception as e:
            logger.error(f"❌ Database migration failed: {e}")

        migration_summary["end_time"] = datetime.now()
        return migration_summary

    async def create_migration_report(self, migration_summary: Dict[str, Any]) -> str:
        """Generate a detailed migration report"""
        report_lines = [
            "# Database Migration Report",
            f"**Migration**: {migration_summary['source_type']} → {migration_summary['target_type']}",
            f"**Start Time**: {migration_summary['start_time']}",
            f"**End Time**: {migration_summary['end_time']}",
            f"**Duration**: {migration_summary['end_time'] - migration_summary['start_time']}",
            "",
            "## Summary",
            f"- **Tables Migrated**: {migration_summary['tables_migrated']}",
            f"- **Total Rows Migrated**: {migration_summary['total_rows_migrated']:,}",
            f"- **Successful Tables**: {len(migration_summary['successful_tables'])}",
            f"- **Failed Tables**: {len(migration_summary['failed_tables'])}",
            "",
        ]

        if migration_summary["successful_tables"]:
            report_lines.extend(["## ✅ Successful Migrations", ""])
            for table in migration_summary["successful_tables"]:
                result = next(
                    r
                    for r in migration_summary["migration_results"]
                    if r["table_name"] == table
                )
                report_lines.append(f"- **{table}**: {result['rows_migrated']:,} rows")

        if migration_summary["failed_tables"]:
            report_lines.extend(["", "## ❌ Failed Migrations", ""])
            for table in migration_summary["failed_tables"]:
                result = next(
                    r
                    for r in migration_summary["migration_results"]
                    if r["table_name"] == table
                )
                report_lines.append(f"- **{table}**: {result['error']}")

        return "\n".join(report_lines)


def main():
    """Test the database migration service"""
    print("🚀 Testing Database Migration Service")
    print("=" * 50)

    async def run_tests():
        try:
            # Initialize service with DatabaseConfig
            config = DatabaseConfig(url="sqlite:///a1betting.db")
            migration_service = DatabaseMigrationService(config)

            # Test connectivity
            print("\n🔌 Testing Database Connectivity...")
            connectivity = await migration_service.check_database_connectivity()

            for db_type, result in connectivity.items():
                status = (
                    "✅ Available"
                    if result["available"]
                    else f"❌ Unavailable: {result['error']}"
                )
                print(f"  {db_type.upper()}: {status}")

            # Get table information
            if connectivity.get("sqlite", {}).get("available", False):
                print("\n📋 SQLite Tables:")
                sqlite_tables = await migration_service.get_table_list(
                    DatabaseType.SQLITE
                )
                for table in sqlite_tables[:10]:  # Show first 10 tables
                    try:
                        count = await migration_service.get_table_row_count(
                            table, DatabaseType.SQLITE
                        )
                        print(f"  - {table}: {count:,} rows")
                    except Exception as e:
                        print(f"  - {table}: Error getting count ({e})")

                if len(sqlite_tables) > 10:
                    print(f"  ... and {len(sqlite_tables) - 10} more tables")

        except Exception as e:
            print(f"❌ Error testing service: {e}")
            import traceback

            traceback.print_exc()

    # Run async tests
    asyncio.run(run_tests())
    print("\n🎉 Database Migration Service test complete!")


if __name__ == "__main__":
    main()
