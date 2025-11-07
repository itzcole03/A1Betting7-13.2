#!/usr/bin/env python
"""
Database Analysis Tool

Analyzes the structure and content of the a1betting.db database
to prepare for migration to PostgreSQL.
"""

import asyncio
import logging
import sqlite3
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("db_analysis")


def analyze_sqlite_database(db_path: str = "a1betting.db"):
    """Analyze SQLite database structure and content"""
    logger.info(f"🔍 Analyzing SQLite database: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get all table names
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        tables = [row[0] for row in cursor.fetchall()]

        logger.info(f"📋 Found {len(tables)} tables")
        print("\n" + "=" * 60)
        print("📊 A1BETTING DATABASE ANALYSIS")
        print("=" * 60)

        total_rows = 0
        migration_plan = []

        for table in tables:
            try:
                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                total_rows += count

                # Get table schema
                cursor.execute(f"PRAGMA table_info({table})")
                columns = cursor.fetchall()

                # Get sample data for non-empty tables
                sample_data = None
                if count > 0:
                    cursor.execute(f"SELECT * FROM {table} LIMIT 3")
                    sample_data = cursor.fetchall()

                print(f"\n🏷️  TABLE: {table}")
                print(f"   📊 Rows: {count:,}")
                print(f"   📝 Columns: {len(columns)}")

                if columns:
                    print("   🔧 Schema:")
                    for col in columns:
                        col_id, col_name, col_type, not_null, default, pk = col
                        nullable = "NOT NULL" if not_null else "NULL"
                        primary = " (PRIMARY KEY)" if pk else ""
                        default_val = f" DEFAULT {default}" if default else ""
                        print(
                            f"      {col_id+1:2d}. {col_name:20s} {col_type:15s} {nullable:8s}{default_val}{primary}"
                        )

                if sample_data and count > 0:
                    print("   📄 Sample Data:")
                    col_names = [col[1] for col in columns]
                    for i, row in enumerate(sample_data):
                        print(
                            f"      Row {i+1}: {dict(zip(col_names[:len(row)], row))}"
                        )

                # Migration priority based on row count and importance
                priority = "HIGH" if count > 1000 else "MEDIUM" if count > 0 else "LOW"
                migration_plan.append(
                    {
                        "table": table,
                        "rows": count,
                        "columns": len(columns),
                        "priority": priority,
                    }
                )

            except Exception as e:
                print(f"\n❌ Error analyzing table {table}: {e}")

        print(f"\n" + "=" * 60)
        print(f"📈 SUMMARY")
        print("=" * 60)
        print(f"Total Tables: {len(tables)}")
        print(f"Total Rows: {total_rows:,}")

        print(f"\n🚀 MIGRATION PLAN")
        print("-" * 40)

        # Sort by priority and row count
        priority_order = {"HIGH": 1, "MEDIUM": 2, "LOW": 3}
        migration_plan.sort(key=lambda x: (priority_order[x["priority"]], -x["rows"]))

        for plan in migration_plan:
            print(
                f"{plan['priority']:6s} | {plan['table']:20s} | {plan['rows']:8,} rows | {plan['columns']:2d} cols"
            )

        conn.close()
        return migration_plan

    except Exception as e:
        logger.error(f"❌ Database analysis failed: {e}")
        return []


async def test_migration_readiness():
    """Test if we're ready for migration"""
    logger.info("🔬 Testing Migration Readiness")

    try:
        # Test PostgreSQL connectivity
        import asyncpg

        postgres_url = (
            "postgresql://a1betting_user:dev_password_123@localhost:5432/a1betting_dev"
        )

        conn = await asyncpg.connect(postgres_url)
        result = await conn.fetchval("SELECT version()")
        logger.info(f"✅ PostgreSQL ready: {result}")
        await conn.close()

        return True

    except Exception as e:
        logger.error(f"❌ PostgreSQL not ready: {e}")
        return False


if __name__ == "__main__":
    print("🔍 Starting Database Analysis...")

    # Analyze SQLite database
    migration_plan = analyze_sqlite_database()

    # Test migration readiness
    ready = asyncio.run(test_migration_readiness())

    if ready and migration_plan:
        print(
            f"\n✅ Ready for migration! Found {len(migration_plan)} tables to migrate."
        )
    else:
        print(f"\n⚠️ Migration preparation needed.")
