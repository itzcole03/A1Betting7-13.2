#!/usr/bin/env python
"""
PostgreSQL Development Environment Setup

Sets up a PostgreSQL instance for development and testing of the database
migration service. Uses Docker for easy setup and teardown.
"""

import asyncio
import logging
import os
import subprocess
import time
from pathlib import Path

import asyncpg
import psycopg2
from psycopg2 import sql

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("postgres_setup")

# PostgreSQL configuration
POSTGRES_CONFIG = {
    "host": "localhost",
    "port": "5432",
    "database": "a1betting_dev",
    "username": "a1betting_user",
    "password": "dev_password_123",
    "container_name": "a1betting_postgres_dev",
}


def setup_docker_postgres():
    """Setup PostgreSQL using Docker"""
    logger.info("🐳 Setting up PostgreSQL Docker container...")

    # Check if Docker is available
    try:
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            logger.error("❌ Docker not available. Please install Docker Desktop.")
            return False
        logger.info(f"✅ Docker available: {result.stdout.strip()}")
    except FileNotFoundError:
        logger.error("❌ Docker command not found. Please install Docker Desktop.")
        return False

    # Stop existing container if it exists
    logger.info(
        f"🔄 Stopping existing container '{POSTGRES_CONFIG['container_name']}'..."
    )
    subprocess.run(
        ["docker", "stop", POSTGRES_CONFIG["container_name"]], capture_output=True
    )

    subprocess.run(
        ["docker", "rm", POSTGRES_CONFIG["container_name"]], capture_output=True
    )

    # Start new PostgreSQL container
    logger.info("🚀 Starting PostgreSQL container...")
    cmd = [
        "docker",
        "run",
        "-d",
        "--name",
        POSTGRES_CONFIG["container_name"],
        "-p",
        f"{POSTGRES_CONFIG['port']}:5432",
        "-e",
        f"POSTGRES_DB={POSTGRES_CONFIG['database']}",
        "-e",
        f"POSTGRES_USER={POSTGRES_CONFIG['username']}",
        "-e",
        f"POSTGRES_PASSWORD={POSTGRES_CONFIG['password']}",
        "postgres:15-alpine",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"❌ Failed to start PostgreSQL container: {result.stderr}")
        return False

    logger.info("✅ PostgreSQL container started successfully!")

    # Wait for PostgreSQL to be ready
    logger.info("⏳ Waiting for PostgreSQL to be ready...")
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            conn = psycopg2.connect(
                host=POSTGRES_CONFIG["host"],
                port=POSTGRES_CONFIG["port"],
                database=POSTGRES_CONFIG["database"],
                user=POSTGRES_CONFIG["username"],
                password=POSTGRES_CONFIG["password"],
            )
            conn.close()
            logger.info("✅ PostgreSQL is ready!")
            return True
        except psycopg2.OperationalError:
            if attempt < max_attempts - 1:
                time.sleep(2)
            else:
                logger.error("❌ PostgreSQL failed to become ready within timeout")
                return False

    return False


def create_database_structure():
    """Create basic database structure for testing"""
    logger.info("🏗️ Creating database structure...")

    try:
        conn = psycopg2.connect(
            host=POSTGRES_CONFIG["host"],
            port=POSTGRES_CONFIG["port"],
            database=POSTGRES_CONFIG["database"],
            user=POSTGRES_CONFIG["username"],
            password=POSTGRES_CONFIG["password"],
        )

        cursor = conn.cursor()

        # Create test tables matching SQLite structure
        test_tables = [
            """
            CREATE TABLE IF NOT EXISTS test_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS test_teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                abbreviation VARCHAR(10) NOT NULL,
                league VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS test_games (
                id SERIAL PRIMARY KEY,
                home_team_id INTEGER REFERENCES test_teams(id),
                away_team_id INTEGER REFERENCES test_teams(id),
                game_date TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
        ]

        for table_sql in test_tables:
            cursor.execute(table_sql)
            logger.info(f"✅ Created table")

        # Insert test data
        cursor.execute(
            """
            INSERT INTO test_teams (name, abbreviation, league) 
            VALUES 
                ('New York Yankees', 'NYY', 'MLB'),
                ('Boston Red Sox', 'BOS', 'MLB'),
                ('Los Angeles Dodgers', 'LAD', 'MLB')
            ON CONFLICT DO NOTHING
        """
        )

        cursor.execute(
            """
            INSERT INTO test_users (username, email) 
            VALUES 
                ('testuser1', 'test1@example.com'),
                ('testuser2', 'test2@example.com')
            ON CONFLICT DO NOTHING
        """
        )

        conn.commit()
        cursor.close()
        conn.close()

        logger.info("✅ Database structure created successfully!")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to create database structure: {e}")
        return False


async def test_async_connectivity():
    """Test async PostgreSQL connectivity"""
    logger.info("🔗 Testing async PostgreSQL connectivity...")

    try:
        conn = await asyncpg.connect(
            host=POSTGRES_CONFIG["host"],
            port=POSTGRES_CONFIG["port"],
            database=POSTGRES_CONFIG["database"],
            user=POSTGRES_CONFIG["username"],
            password=POSTGRES_CONFIG["password"],
        )

        # Test query
        result = await conn.fetchval("SELECT COUNT(*) FROM test_teams")
        logger.info(
            f"✅ Async connectivity successful! Found {result} teams in test table"
        )

        await conn.close()
        return True

    except Exception as e:
        logger.error(f"❌ Async connectivity test failed: {e}")
        return False


def set_environment_variables():
    """Set PostgreSQL environment variables for the application"""
    postgres_url = f"postgresql://{POSTGRES_CONFIG['username']}:{POSTGRES_CONFIG['password']}@{POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}/{POSTGRES_CONFIG['database']}"

    # Create .env file
    env_file = Path("postgres_dev.env")
    with open(env_file, "w") as f:
        f.write(f"POSTGRESQL_URL={postgres_url}\n")
        f.write(f"POSTGRES_URL={postgres_url}\n")
        f.write(f"POSTGRES_HOST={POSTGRES_CONFIG['host']}\n")
        f.write(f"POSTGRES_PORT={POSTGRES_CONFIG['port']}\n")
        f.write(f"POSTGRES_DB={POSTGRES_CONFIG['database']}\n")
        f.write(f"POSTGRES_USER={POSTGRES_CONFIG['username']}\n")
        f.write(f"POSTGRES_PASSWORD={POSTGRES_CONFIG['password']}\n")

    logger.info(f"✅ Environment variables written to {env_file}")
    logger.info(
        f"💡 To use: source postgres_dev.env or set POSTGRESQL_URL={postgres_url}"
    )

    return postgres_url


def cleanup_docker_postgres():
    """Clean up PostgreSQL Docker container"""
    logger.info("🧹 Cleaning up PostgreSQL container...")

    subprocess.run(
        ["docker", "stop", POSTGRES_CONFIG["container_name"]], capture_output=True
    )

    subprocess.run(
        ["docker", "rm", POSTGRES_CONFIG["container_name"]], capture_output=True
    )

    logger.info("✅ PostgreSQL container cleaned up")


async def main():
    """Main setup function"""
    logger.info("🚀 PostgreSQL Development Environment Setup")
    logger.info("=" * 50)

    try:
        # Setup Docker PostgreSQL
        if not setup_docker_postgres():
            return False

        # Create database structure
        if not create_database_structure():
            return False

        # Test async connectivity
        if not await test_async_connectivity():
            return False

        # Set environment variables
        postgres_url = set_environment_variables()

        logger.info("\n🎉 PostgreSQL Development Environment Setup Complete!")
        logger.info("=" * 50)
        logger.info(f"📊 Database: {POSTGRES_CONFIG['database']}")
        logger.info(f"🌐 Host: {POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}")
        logger.info(f"👤 User: {POSTGRES_CONFIG['username']}")
        logger.info(f"🔗 URL: {postgres_url}")
        logger.info("\n🔧 Next Steps:")
        logger.info("1. Set environment: export POSTGRESQL_URL=<url>")
        logger.info("2. Test migration service with PostgreSQL")
        logger.info("3. Run database migration tests")

        return True

    except Exception as e:
        logger.error(f"❌ Setup failed: {e}")
        return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="PostgreSQL Development Environment Setup"
    )
    parser.add_argument(
        "--cleanup", action="store_true", help="Clean up existing PostgreSQL container"
    )
    args = parser.parse_args()

    if args.cleanup:
        cleanup_docker_postgres()
    else:
        success = asyncio.run(main())
        if not success:
            exit(1)
