#!/usr/bin/env python3
"""
Sport Defaults Migration Script

Migrates existing single-sport records to have default NBA sport values.
This ensures backward compatibility when adding multi-sport support.

Usage:
    python migrate_sport_defaults.py [--dry-run] [--verbose]
"""

import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

try:
    from backend.services.database_service import DatabaseService
    from backend.services.unified_logging import get_logger
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)


logger = get_logger("sport_migration")


class SportMigrationStats:
    """Track migration statistics"""
    
    def __init__(self):
        self.tables_processed = 0
        self.records_migrated = 0
        self.records_skipped = 0
        self.errors = 0
        self.start_time = datetime.now(timezone.utc)
    
    def record_table_processed(self, table_name: str, migrated: int, skipped: int, errors: int):
        """Record statistics for a processed table"""
        self.tables_processed += 1
        self.records_migrated += migrated
        self.records_skipped += skipped
        self.errors += errors
        
        logger.info(
            f"Table {table_name}: {migrated} migrated, {skipped} skipped, {errors} errors"
        )
    
    def get_summary(self) -> Dict[str, Any]:
        """Get migration summary"""
        duration = datetime.now(timezone.utc) - self.start_time
        
        return {
            "tables_processed": self.tables_processed,
            "total_records_migrated": self.records_migrated,
            "total_records_skipped": self.records_skipped,
            "total_errors": self.errors,
            "duration_seconds": duration.total_seconds(),
            "success_rate": (
                (self.records_migrated / (self.records_migrated + self.errors)) * 100
                if (self.records_migrated + self.errors) > 0 else 100.0
            )
        }


async def migrate_match_sports(session, dry_run: bool = True) -> tuple[int, int, int]:
    """Migrate Match table sport values"""
    migrated = 0
    skipped = 0
    errors = 0
    
    try:
        # For matches table, we'll set null/empty sport values to "NBA"
        if dry_run:
            # Check how many records need migration
            result = session.execute(
                "SELECT COUNT(*) FROM matches WHERE sport IS NULL OR sport = ''"
            )
            count = result.scalar()
            logger.info(f"DRY RUN: Would migrate {count} matches with missing sport")
            migrated = count
        else:
            # Actually perform the migration
            result = session.execute(
                "UPDATE matches SET sport = 'NBA' WHERE sport IS NULL OR sport = ''"
            )
            migrated = result.rowcount
            session.commit()
            logger.info(f"Migrated {migrated} matches to NBA sport")
            
    except Exception as e:
        logger.error(f"Error migrating matches table: {e}")
        errors = 1
        
    return migrated, skipped, errors


async def migrate_correlation_sports(session, dry_run: bool = True) -> tuple[int, int, int]:
    """Migrate correlation tables sport values"""
    migrated = 0
    skipped = 0 
    errors = 0
    
    correlation_tables = [
        "prop_correlation_stats",
        "correlation_clusters", 
        "correlation_factor_models"
    ]
    
    for table_name in correlation_tables:
        try:
            if dry_run:
                # Check how many records need migration
                result = session.execute(
                    f"SELECT COUNT(*) FROM {table_name} WHERE sport IS NULL OR sport = ''"
                )
                count = result.scalar()
                logger.info(f"DRY RUN: Would migrate {count} records in {table_name}")
                migrated += count
            else:
                # Set missing sport values to NBA (these were NBA-only previously)
                result = session.execute(
                    f"UPDATE {table_name} SET sport = 'NBA' WHERE sport IS NULL OR sport = ''"
                )
                count = result.rowcount
                migrated += count
                logger.info(f"Migrated {count} records in {table_name} to NBA sport")
                
        except Exception as e:
            logger.error(f"Error migrating {table_name}: {e}")
            errors += 1
    
    if not dry_run and migrated > 0:
        session.commit()
        
    return migrated, skipped, errors


async def migrate_provider_states(session, dry_run: bool = True) -> tuple[int, int, int]:
    """Migrate provider states if they exist"""
    migrated = 0
    skipped = 0
    errors = 0
    
    try:
        # Check if provider_states table exists
        result = session.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='provider_states'"
        )
        table_exists = result.fetchone() is not None
        
        if not table_exists:
            logger.info("provider_states table does not exist, skipping")
            return migrated, skipped, errors
            
        if dry_run:
            result = session.execute(
                "SELECT COUNT(*) FROM provider_states WHERE sport IS NULL OR sport = ''"
            )
            count = result.scalar()
            logger.info(f"DRY RUN: Would migrate {count} provider states")
            migrated = count
        else:
            result = session.execute(
                "UPDATE provider_states SET sport = 'NBA' WHERE sport IS NULL OR sport = ''"
            )
            migrated = result.rowcount
            session.commit()
            logger.info(f"Migrated {migrated} provider states to NBA sport")
            
    except Exception as e:
        logger.error(f"Error migrating provider_states: {e}")
        errors = 1
        
    return migrated, skipped, errors


async def migrate_market_events(session, dry_run: bool = True) -> tuple[int, int, int]:
    """Migrate market events if they exist"""
    migrated = 0
    skipped = 0
    errors = 0
    
    try:
        # Check if market_events table exists  
        result = session.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='market_events'"
        )
        table_exists = result.fetchone() is not None
        
        if not table_exists:
            logger.info("market_events table does not exist, skipping")
            return migrated, skipped, errors
            
        if dry_run:
            result = session.execute(
                "SELECT COUNT(*) FROM market_events WHERE sport IS NULL OR sport = ''"
            )
            count = result.scalar()
            logger.info(f"DRY RUN: Would migrate {count} market events")
            migrated = count
        else:
            result = session.execute(
                "UPDATE market_events SET sport = 'NBA' WHERE sport IS NULL OR sport = ''"
            )
            migrated = result.rowcount
            session.commit()
            logger.info(f"Migrated {migrated} market events to NBA sport")
            
    except Exception as e:
        logger.error(f"Error migrating market_events: {e}")
        errors = 1
        
    return migrated, skipped, errors


async def run_migration(dry_run: bool = True, verbose: bool = False) -> SportMigrationStats:
    """Run the complete sport migration"""
    
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        
    logger.info("=" * 60)
    logger.info("SPORT DEFAULTS MIGRATION")
    logger.info("=" * 60)
    logger.info(f"Mode: {'DRY RUN' if dry_run else 'LIVE MIGRATION'}")
    logger.info(f"Default sport: NBA")
    logger.info("")
    
    stats = SportMigrationStats()
    
    try:
        # Use a simpler database approach for migration
        db_service = DatabaseService()
        session = db_service.get_session()()
        
        try:
            # Migrate matches table
            migrated, skipped, errors = await migrate_match_sports(session, dry_run)
            stats.record_table_processed("matches", migrated, skipped, errors)
            
            # Migrate correlation tables
            migrated, skipped, errors = await migrate_correlation_sports(session, dry_run)
            stats.record_table_processed("correlation_tables", migrated, skipped, errors)
            
            # Migrate provider states (if exists)
            migrated, skipped, errors = await migrate_provider_states(session, dry_run)
            stats.record_table_processed("provider_states", migrated, skipped, errors)
            
            # Migrate market events (if exists)
            migrated, skipped, errors = await migrate_market_events(session, dry_run)
            stats.record_table_processed("market_events", migrated, skipped, errors)
            
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        stats.errors += 1
        return stats
    
    # Print summary
    summary = stats.get_summary()
    logger.info("")
    logger.info("=" * 60)
    logger.info("MIGRATION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Tables processed: {summary['tables_processed']}")
    logger.info(f"Records migrated: {summary['total_records_migrated']}")
    logger.info(f"Records skipped: {summary['total_records_skipped']}")
    logger.info(f"Errors: {summary['total_errors']}")
    logger.info(f"Duration: {summary['duration_seconds']:.2f} seconds")
    logger.info(f"Success rate: {summary['success_rate']:.1f}%")
    logger.info("")
    
    if dry_run:
        logger.info("This was a DRY RUN. No changes were made.")
        logger.info("Run with --live to perform actual migration.")
    else:
        logger.info("Migration completed successfully!")
    
    logger.info("=" * 60)
    
    return stats


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Migrate existing records to have default NBA sport values"
    )
    parser.add_argument(
        "--dry-run", 
        action="store_true", 
        default=True,
        help="Show what would be migrated without making changes (default)"
    )
    parser.add_argument(
        "--live", 
        action="store_true", 
        help="Perform actual migration (overrides --dry-run)"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true", 
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # If --live is specified, disable dry run
    dry_run = not args.live
    
    try:
        stats = asyncio.run(run_migration(dry_run=dry_run, verbose=args.verbose))
        
        # Exit with appropriate code
        if stats.errors > 0:
            sys.exit(1)
        else:
            sys.exit(0)
            
    except KeyboardInterrupt:
        logger.info("Migration cancelled by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Migration failed with unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()