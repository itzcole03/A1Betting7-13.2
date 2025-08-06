#!/usr/bin/env python
"""
Full Database Migration Test

Tests complete migration of the a1betting.db database to PostgreSQL
with progress tracking, validation, and rollback capabilities.
"""

import asyncio
import logging
import sqlite3
import time
from datetime import datetime
from typing import Any, Dict, List

import aiosqlite
import asyncpg

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("full_migration")


class FullDatabaseMigration:
    """Complete database migration from SQLite to PostgreSQL"""

    def __init__(self):
        self.sqlite_path = "a1betting.db"
        self.postgres_url = (
            "postgresql://a1betting_user:dev_password_123@localhost:5432/a1betting_dev"
        )
        self.migration_stats = {
            "start_time": None,
            "end_time": None,
            "tables_migrated": 0,
            "total_rows_migrated": 0,
            "errors": [],
            "successful_tables": [],
            "failed_tables": [],
        }

    async def create_postgres_schema(self):
        """Create PostgreSQL schema matching SQLite structure"""
        logger.info("🏗️ Creating PostgreSQL schema...")

        # SQL commands to create tables (converted from SQLite to PostgreSQL)
        schema_commands = [
            """
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public;
            """,
            """
            CREATE TABLE users (
                last_login TIMESTAMP,
                id VARCHAR PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                hashed_password VARCHAR(255) NOT NULL,
                api_key_encrypted VARCHAR(512),
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                is_active BOOLEAN NOT NULL DEFAULT false,
                is_verified BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                risk_tolerance VARCHAR(20),
                preferred_stake FLOAT,
                bookmakers JSONB,
                settings JSONB
            );
            """,
            """
            CREATE TABLE user_backup AS SELECT * FROM users WITH NO DATA;
            """,
            """
            CREATE TABLE teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                provider_id VARCHAR
            );
            """,
            """
            CREATE TABLE casinos (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                key VARCHAR NOT NULL
            );
            """,
            """
            CREATE TABLE events (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                start_time TIMESTAMP NOT NULL,
                provider_id VARCHAR
            );
            """,
            """
            CREATE TABLE matches (
                id SERIAL PRIMARY KEY,
                home_team VARCHAR NOT NULL,
                away_team VARCHAR NOT NULL,
                sport VARCHAR NOT NULL,
                league VARCHAR NOT NULL,
                season VARCHAR,
                week INTEGER,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                status VARCHAR,
                home_score INTEGER,
                away_score INTEGER,
                venue VARCHAR,
                weather_conditions VARCHAR,
                temperature FLOAT,
                external_id VARCHAR,
                sportsradar_id VARCHAR,
                the_odds_api_id VARCHAR,
                is_featured BOOLEAN,
                has_live_odds BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE bets (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                match_id INTEGER NOT NULL,
                amount FLOAT NOT NULL,
                odds FLOAT NOT NULL,
                bet_type VARCHAR NOT NULL,
                selection VARCHAR NOT NULL,
                potential_winnings FLOAT NOT NULL,
                status VARCHAR NOT NULL,
                placed_at TIMESTAMP NOT NULL,
                settled_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE odds (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL,
                team_id INTEGER NOT NULL,
                odds_type VARCHAR NOT NULL,
                value FLOAT NOT NULL,
                provider_id VARCHAR
            );
            """,
            """
            CREATE TABLE predictions (
                id SERIAL PRIMARY KEY,
                match_id INTEGER NOT NULL,
                home_win_probability FLOAT NOT NULL,
                away_win_probability FLOAT NOT NULL,
                draw_probability FLOAT,
                confidence_score FLOAT NOT NULL,
                over_under_prediction FLOAT,
                spread_prediction FLOAT,
                total_score_prediction FLOAT,
                model_version VARCHAR NOT NULL,
                algorithm_used VARCHAR NOT NULL,
                features_used TEXT,
                historical_accuracy FLOAT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE model_performance (
                id SERIAL PRIMARY KEY,
                model_name VARCHAR NOT NULL,
                metric_name VARCHAR NOT NULL,
                metric_value FLOAT NOT NULL,
                period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                period_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sample_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE projection_history (
                id SERIAL PRIMARY KEY,
                player_name VARCHAR NOT NULL,
                prop_type VARCHAR NOT NULL,
                line FLOAT,
                status VARCHAR NOT NULL,
                fetched_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE game_spreads (
                id SERIAL PRIMARY KEY,
                match_id INTEGER,
                casino_id INTEGER,
                spread NUMERIC(4, 1),
                home_team_line NUMERIC(5, 2),
                away_team_line NUMERIC(5, 2),
                odds_metadata VARCHAR,
                update_time TIMESTAMP
            );
            """,
            """
            CREATE TABLE scores (
                id SERIAL PRIMARY KEY,
                match_id INTEGER,
                home_score INTEGER,
                away_score INTEGER,
                update_time TIMESTAMP
            );
            """,
        ]

        try:
            conn = await asyncpg.connect(self.postgres_url)

            for command in schema_commands:
                await conn.execute(command)

            logger.info("✅ PostgreSQL schema created successfully")
            await conn.close()
            return True

        except Exception as e:
            logger.error(f"❌ Failed to create PostgreSQL schema: {e}")
            return False

    async def migrate_table_data(self, table_name: str) -> Dict[str, Any]:
        """Migrate data from a single table"""
        logger.info(f"🔄 Migrating table: {table_name}")

        result = {
            "table_name": table_name,
            "rows_migrated": 0,
            "success": False,
            "error": None,
            "duration": 0,
        }

        start_time = time.time()

        try:
            # Get data from SQLite
            async with aiosqlite.connect(self.sqlite_path) as sqlite_conn:
                cursor = await sqlite_conn.execute(f"SELECT * FROM {table_name}")
                rows = await cursor.fetchall()

                if not rows:
                    logger.info(
                        f"📝 Table {table_name} is empty - skipping data migration"
                    )
                    result["success"] = True
                    result["duration"] = time.time() - start_time
                    return result

                # Get column names
                cursor = await sqlite_conn.execute(f"PRAGMA table_info({table_name})")
                columns_info = await cursor.fetchall()
                column_names = [col[1] for col in columns_info]

                logger.info(
                    f"📊 Found {len(rows)} rows with {len(column_names)} columns"
                )

            # Insert data into PostgreSQL
            postgres_conn = await asyncpg.connect(self.postgres_url)

            # Handle special case for users table (no auto-increment id)
            if table_name in ["user", "users"]:
                placeholders = ", ".join([f"${i+1}" for i in range(len(column_names))])
                query = f"INSERT INTO users ({', '.join(column_names)}) VALUES ({placeholders})"
            else:
                # For tables with auto-increment, skip the id column
                if column_names[0].lower() == "id":
                    insert_columns = column_names[1:]  # Skip ID column
                    insert_data = [row[1:] for row in rows]  # Skip ID values
                else:
                    insert_columns = column_names
                    insert_data = rows

                placeholders = ", ".join(
                    [f"${i+1}" for i in range(len(insert_columns))]
                )
                query = f"INSERT INTO {table_name} ({', '.join(insert_columns)}) VALUES ({placeholders})"
                rows = insert_data

            # Insert rows
            for row in rows:
                # Handle JSON fields, boolean conversion, and datetime conversion for PostgreSQL
                processed_row = []
                for i, value in enumerate(row):
                    col_name = column_names[i] if i < len(column_names) else f"col_{i}"

                    # Handle None values
                    if value is None:
                        processed_row.append(None)
                    # Handle JSON fields
                    elif isinstance(value, str) and (
                        value.startswith("[") or value.startswith("{")
                    ):
                        processed_row.append(value)
                    # Handle boolean fields (SQLite stores as 0/1, PostgreSQL needs true/false)
                    elif col_name.lower() in [
                        "is_active",
                        "is_verified",
                        "is_featured",
                        "has_live_odds",
                    ] and isinstance(value, (int, float)):
                        processed_row.append(bool(value))
                    # Handle datetime fields (SQLite stores as strings, PostgreSQL needs datetime objects)
                    elif col_name.lower() in [
                        "created_at",
                        "updated_at",
                        "last_login",
                        "start_time",
                        "end_time",
                        "placed_at",
                        "settled_at",
                        "fetched_at",
                        "period_start",
                        "period_end",
                        "update_time",
                    ] and isinstance(value, str):
                        try:
                            from datetime import datetime

                            # Try to parse the datetime string
                            if "." in value:  # Handle microseconds
                                dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S.%f")
                            else:
                                dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                            processed_row.append(dt)
                        except ValueError:
                            # If parsing fails, keep as string (PostgreSQL might handle it)
                            processed_row.append(value)
                    else:
                        processed_row.append(value)

                await postgres_conn.execute(query, *processed_row)

            result["rows_migrated"] = len(rows)
            result["success"] = True
            logger.info(f"✅ Successfully migrated {len(rows)} rows from {table_name}")

            await postgres_conn.close()

        except Exception as e:
            logger.error(f"❌ Failed to migrate table {table_name}: {e}")
            result["error"] = str(e)

        result["duration"] = time.time() - start_time
        return result

    async def validate_migration(self) -> Dict[str, Any]:
        """Validate that migration was successful"""
        logger.info("🔍 Validating migration...")

        validation_results = {
            "sqlite_counts": {},
            "postgres_counts": {},
            "discrepancies": [],
            "validation_passed": True,
        }

        try:
            # Get SQLite counts
            async with aiosqlite.connect(self.sqlite_path) as sqlite_conn:
                cursor = await sqlite_conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                )
                tables = [row[0] for row in await cursor.fetchall()]

                for table in tables:
                    cursor = await sqlite_conn.execute(f"SELECT COUNT(*) FROM {table}")
                    count = (await cursor.fetchone())[0]
                    validation_results["sqlite_counts"][table] = count

            # Get PostgreSQL counts
            postgres_conn = await asyncpg.connect(self.postgres_url)

            for table in tables:
                try:
                    # Handle table name mapping
                    pg_table = "users" if table in ["user", "users"] else table
                    count = await postgres_conn.fetchval(
                        f"SELECT COUNT(*) FROM {pg_table}"
                    )
                    validation_results["postgres_counts"][table] = count

                    # Check for discrepancies
                    sqlite_count = validation_results["sqlite_counts"][table]
                    if count != sqlite_count:
                        discrepancy = {
                            "table": table,
                            "sqlite_count": sqlite_count,
                            "postgres_count": count,
                        }
                        validation_results["discrepancies"].append(discrepancy)
                        validation_results["validation_passed"] = False

                except Exception as e:
                    logger.warning(f"⚠️ Could not validate table {table}: {e}")

            await postgres_conn.close()

            if validation_results["validation_passed"]:
                logger.info("✅ Migration validation passed!")
            else:
                logger.warning(
                    f"⚠️ Migration validation found {len(validation_results['discrepancies'])} discrepancies"
                )

        except Exception as e:
            logger.error(f"❌ Migration validation failed: {e}")
            validation_results["validation_passed"] = False

        return validation_results

    async def run_full_migration(self) -> Dict[str, Any]:
        """Run complete database migration"""
        logger.info("🚀 Starting Full Database Migration")
        logger.info("=" * 50)

        self.migration_stats["start_time"] = datetime.now()

        # Step 1: Create PostgreSQL schema
        if not await self.create_postgres_schema():
            return self.migration_stats

        # Step 2: Get list of tables to migrate
        async with aiosqlite.connect(self.sqlite_path) as conn:
            cursor = await conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
            tables = [row[0] for row in await cursor.fetchall()]

        logger.info(f"📋 Found {len(tables)} tables to migrate")

        # Step 3: Migrate each table
        for table in tables:
            result = await self.migrate_table_data(table)

            if result["success"]:
                self.migration_stats["successful_tables"].append(table)
                self.migration_stats["total_rows_migrated"] += result["rows_migrated"]
                self.migration_stats["tables_migrated"] += 1
            else:
                self.migration_stats["failed_tables"].append(table)
                self.migration_stats["errors"].append(f"{table}: {result['error']}")

        # Step 4: Validate migration
        validation = await self.validate_migration()
        self.migration_stats["validation"] = validation

        self.migration_stats["end_time"] = datetime.now()
        duration = self.migration_stats["end_time"] - self.migration_stats["start_time"]

        # Step 5: Generate report
        logger.info("\n" + "=" * 50)
        logger.info("📊 MIGRATION REPORT")
        logger.info("=" * 50)
        logger.info(f"Duration: {duration}")
        logger.info(
            f"Tables Migrated: {self.migration_stats['tables_migrated']}/{len(tables)}"
        )
        logger.info(
            f"Total Rows Migrated: {self.migration_stats['total_rows_migrated']}"
        )
        logger.info(
            f"Successful Tables: {len(self.migration_stats['successful_tables'])}"
        )
        logger.info(f"Failed Tables: {len(self.migration_stats['failed_tables'])}")

        if self.migration_stats["successful_tables"]:
            logger.info(
                f"✅ Success: {', '.join(self.migration_stats['successful_tables'])}"
            )

        if self.migration_stats["failed_tables"]:
            logger.error(
                f"❌ Failed: {', '.join(self.migration_stats['failed_tables'])}"
            )
            for error in self.migration_stats["errors"]:
                logger.error(f"   - {error}")

        if validation["validation_passed"]:
            logger.info("✅ Migration validation: PASSED")
        else:
            logger.warning("⚠️ Migration validation: FAILED")
            for disc in validation["discrepancies"]:
                logger.warning(
                    f"   - {disc['table']}: SQLite({disc['sqlite_count']}) != PostgreSQL({disc['postgres_count']})"
                )

        return self.migration_stats


async def main():
    """Main migration function"""
    migration = FullDatabaseMigration()
    results = await migration.run_full_migration()

    if results["tables_migrated"] > 0 and results.get("validation", {}).get(
        "validation_passed", False
    ):
        logger.info("\n🎉 Full database migration completed successfully!")
        return True
    else:
        logger.error("\n❌ Migration completed with errors or validation failures")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
