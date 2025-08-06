#!/usr/bin/env python
"""
Test Database Migration Service with Both SQLite and PostgreSQL

This script tests the database migration service with both databases
to validate connectivity and basic operations.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Setup path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from backend.config_manager import DatabaseConfig
from backend.services.database_migration_service import (
    DatabaseMigrationService,
    DatabaseType,
)

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("migration_test")


async def test_migration_service():
    """Test database migration service with both databases"""
    logger.info("🚀 Testing Database Migration Service - Multi-Database")
    logger.info("=" * 60)

    # Test SQLite configuration
    logger.info("\n📊 Testing SQLite Configuration...")
    sqlite_config = DatabaseConfig(url="sqlite:///a1betting.db")
    sqlite_service = DatabaseMigrationService(sqlite_config)

    # Test SQLite connectivity
    connectivity = await sqlite_service.check_database_connectivity()
    for db_type, result in connectivity.items():
        status = (
            "✅ Available"
            if result["available"]
            else f"❌ Unavailable: {result['error']}"
        )
        logger.info(f"  {db_type.upper()}: {status}")

    # Test PostgreSQL configuration
    logger.info("\n🐘 Testing PostgreSQL Configuration...")
    postgres_url = (
        "postgresql://a1betting_user:dev_password_123@localhost:5432/a1betting_dev"
    )

    # Create a service that can handle both databases
    # We'll need to test PostgreSQL separately since the service is designed for one DB at a time
    try:
        # Test PostgreSQL connectivity manually
        import asyncpg

        conn = await asyncpg.connect(postgres_url)

        # Test basic operations
        result = await conn.fetchval("SELECT COUNT(*) FROM test_teams")
        logger.info(f"✅ PostgreSQL connectivity successful! Found {result} teams")

        # Get table list
        tables = await conn.fetch(
            """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """
        )
        table_names = [row["table_name"] for row in tables]
        logger.info(f"📋 PostgreSQL tables: {table_names}")

        await conn.close()

    except Exception as e:
        logger.error(f"❌ PostgreSQL connectivity failed: {e}")

    # Test migration simulation (table comparison)
    logger.info("\n🔄 Testing Migration Simulation...")

    try:
        if connectivity.get("sqlite", {}).get("available", False):
            sqlite_tables = await sqlite_service.get_table_list(DatabaseType.SQLITE)
            logger.info(f"📋 SQLite has {len(sqlite_tables)} tables")

            # Show table row counts for comparison
            logger.info("\n📊 SQLite Table Analysis:")
            for table in sqlite_tables[:5]:  # Show first 5 tables
                try:
                    count = await sqlite_service.get_table_row_count(
                        table, DatabaseType.SQLITE
                    )
                    logger.info(f"  - {table}: {count:,} rows")
                except Exception as e:
                    logger.info(f"  - {table}: Error getting count ({e})")

            if len(sqlite_tables) > 5:
                logger.info(f"  ... and {len(sqlite_tables) - 5} more tables")

    except Exception as e:
        logger.error(f"❌ Migration simulation failed: {e}")
        import traceback

        traceback.print_exc()

    logger.info("\n🎉 Database Migration Service Multi-Database Test Complete!")


async def test_table_migration():
    """Test actual table migration between databases"""
    logger.info("\n🚀 Testing Table Migration...")

    try:
        # Create a small test table in SQLite
        import aiosqlite

        async with aiosqlite.connect("test_migration.db") as db:
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS migration_test (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    value INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """
            )

            # Insert test data
            await db.executemany(
                "INSERT INTO migration_test (name, value) VALUES (?, ?)",
                [("test1", 100), ("test2", 200), ("test3", 300)],
            )
            await db.commit()

            # Verify data
            cursor = await db.execute("SELECT COUNT(*) FROM migration_test")
            count = await cursor.fetchone()
            logger.info(f"✅ Created test table with {count[0]} rows")

        # Test migration to PostgreSQL
        import asyncpg

        postgres_url = (
            "postgresql://a1betting_user:dev_password_123@localhost:5432/a1betting_dev"
        )

        conn = await asyncpg.connect(postgres_url)

        # Create target table in PostgreSQL
        await conn.execute(
            """
            DROP TABLE IF EXISTS migration_test;
            CREATE TABLE migration_test (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                value INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )

        # Read data from SQLite and insert into PostgreSQL
        async with aiosqlite.connect("test_migration.db") as db:
            cursor = await db.execute(
                "SELECT name, value FROM migration_test ORDER BY id"
            )
            rows = await cursor.fetchall()

            # Insert into PostgreSQL
            for row in rows:
                await conn.execute(
                    "INSERT INTO migration_test (name, value) VALUES ($1, $2)",
                    row[0],
                    row[1],
                )

        # Verify migration
        result = await conn.fetchval("SELECT COUNT(*) FROM migration_test")
        logger.info(f"✅ Migration successful! PostgreSQL now has {result} rows")

        await conn.close()

        # Cleanup test database
        import os

        if os.path.exists("test_migration.db"):
            os.remove("test_migration.db")

        logger.info("✅ Table migration test completed successfully!")

    except Exception as e:
        logger.error(f"❌ Table migration test failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_migration_service())
    asyncio.run(test_table_migration())
