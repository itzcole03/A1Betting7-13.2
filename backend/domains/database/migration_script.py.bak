"""
Database Migration Script - Migrate from legacy schema to optimized consolidated schema
"""

import asyncio
import logging
import sys
from datetime import datetime
from typing import Dict, Any
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend/logs/migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

from .schema_manager import SchemaManager, get_schema_manager
from .cache_service import UnifiedCacheService, cache_service

async def run_complete_migration(database_url: str = None):
    """Run complete database migration and optimization process"""
    
    if not database_url:
        database_url = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/a1betting')
    
    logger.info("="*80)
    logger.info("STARTING A1BETTING DATABASE OPTIMIZATION & CONSOLIDATION")
    logger.info("="*80)
    
    migration_start = datetime.now()
    
    try:
        # Initialize services
        schema_manager = get_schema_manager(database_url)
        await cache_service.initialize()
        
        # Step 1: Backup existing data (safety measure)
        logger.info("Step 1: Creating data backup...")
        backup_stats = await create_data_backup(schema_manager)
        logger.info(f"Backup completed: {backup_stats}")
        
        # Step 2: Create optimized schema
        logger.info("Step 2: Creating optimized database schema...")
        schema_manager.create_optimized_schema()
        logger.info("Optimized schema created successfully")
        
        # Step 3: Migrate legacy data
        logger.info("Step 3: Migrating legacy data to optimized schema...")
        migration_stats = await migrate_legacy_data(schema_manager)
        logger.info(f"Data migration completed: {migration_stats}")
        
        # Step 4: Create performance optimizations
        logger.info("Step 4: Applying performance optimizations...")
        schema_manager.optimize_database()
        logger.info("Performance optimizations applied")
        
        # Step 5: Validate migration
        logger.info("Step 5: Validating migration...")
        validation_results = await validate_migration(schema_manager)
        logger.info(f"Migration validation: {validation_results}")
        
        # Step 6: Warm cache with essential data
        logger.info("Step 6: Warming cache with essential data...")
        cache_stats = await warm_essential_cache(schema_manager)
        logger.info(f"Cache warming completed: {cache_stats}")
        
        # Step 7: Generate performance report
        logger.info("Step 7: Generating performance analysis...")
        performance_report = schema_manager.analyze_performance()
        await save_performance_report(performance_report)
        
        migration_duration = datetime.now() - migration_start
        
        logger.info("="*80)
        logger.info("MIGRATION COMPLETED SUCCESSFULLY")
        logger.info(f"Total Duration: {migration_duration}")
        logger.info("="*80)
        
        return {
            "success": True,
            "duration": str(migration_duration),
            "backup_stats": backup_stats,
            "migration_stats": migration_stats,
            "validation_results": validation_results,
            "cache_stats": cache_stats,
            "performance_report": performance_report
        }
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "duration": str(datetime.now() - migration_start)
        }
    
    finally:
        await cache_service.shutdown()

async def create_data_backup(schema_manager: SchemaManager) -> Dict[str, Any]:
    """Create backup of existing data before migration"""
    backup_stats = {
        "tables_backed_up": 0,
        "total_rows_backed_up": 0,
        "backup_timestamp": datetime.now().isoformat()
    }
    
    backup_tables = ["users", "matches", "predictions", "bets"]
    
    with schema_manager.engine.begin() as conn:
        for table in backup_tables:
            try:
                # Check if table exists
                result = conn.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{table}'")
                if result.scalar() > 0:
                    # Create backup table
                    backup_table_name = f"{table}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    conn.execute(f"CREATE TABLE {backup_table_name} AS SELECT * FROM {table}")
                    
                    # Get row count
                    result = conn.execute(f"SELECT COUNT(*) FROM {backup_table_name}")
                    row_count = result.scalar()
                    
                    backup_stats["tables_backed_up"] += 1
                    backup_stats["total_rows_backed_up"] += row_count
                    
                    logger.info(f"Backed up {table}: {row_count} rows")
                    
            except Exception as e:
                logger.warning(f"Could not backup table {table}: {e}")
    
    return backup_stats

async def migrate_legacy_data(schema_manager: SchemaManager) -> Dict[str, Any]:
    """Migrate data from legacy tables to optimized schema"""
    migration_stats = {
        "tables_migrated": 0,
        "total_rows_migrated": 0,
        "migration_errors": []
    }
    
    try:
        schema_manager.migrate_legacy_data()
        
        # Count migrated rows
        with schema_manager.engine.begin() as conn:
            optimized_tables = [
                "users_optimized", "matches_optimized", 
                "predictions_optimized", "bets_optimized"
            ]
            
            for table in optimized_tables:
                try:
                    result = conn.execute(f"SELECT COUNT(*) FROM {table}")
                    row_count = result.scalar()
                    migration_stats["total_rows_migrated"] += row_count
                    migration_stats["tables_migrated"] += 1
                    logger.info(f"Migrated to {table}: {row_count} rows")
                except Exception as e:
                    migration_stats["migration_errors"].append(f"{table}: {str(e)}")
        
    except Exception as e:
        migration_stats["migration_errors"].append(f"General migration error: {str(e)}")
    
    return migration_stats

async def validate_migration(schema_manager: SchemaManager) -> Dict[str, Any]:
    """Validate the migration was successful"""
    validation_results = {
        "schema_valid": True,
        "data_integrity_checks": {},
        "performance_indexes": {},
        "validation_errors": []
    }
    
    try:
        # Check schema info
        schema_info = schema_manager.get_schema_info()
        validation_results["schema_info"] = schema_info
        
        # Validate data integrity
        with schema_manager.engine.begin() as conn:
            integrity_checks = [
                ("users_count", "SELECT COUNT(*) FROM users_optimized"),
                ("matches_count", "SELECT COUNT(*) FROM matches_optimized"),
                ("predictions_count", "SELECT COUNT(*) FROM predictions_optimized"),
                ("bets_count", "SELECT COUNT(*) FROM bets_optimized"),
                ("user_bet_integrity", """
                    SELECT COUNT(*) FROM bets_optimized b 
                    LEFT JOIN users_optimized u ON b.user_id = u.id 
                    WHERE u.id IS NULL
                """),
                ("match_prediction_integrity", """
                    SELECT COUNT(*) FROM predictions_optimized p 
                    LEFT JOIN matches_optimized m ON p.match_id = m.id 
                    WHERE m.id IS NULL
                """)
            ]
            
            for check_name, query in integrity_checks:
                try:
                    result = conn.execute(query)
                    count = result.scalar()
                    validation_results["data_integrity_checks"][check_name] = count
                    
                    # Flag integrity issues
                    if "integrity" in check_name and count > 0:
                        validation_results["validation_errors"].append(
                            f"Data integrity issue: {check_name} = {count}"
                        )
                        
                except Exception as e:
                    validation_results["validation_errors"].append(
                        f"Could not run check {check_name}: {str(e)}"
                    )
        
        # Check if any validation errors occurred
        if validation_results["validation_errors"]:
            validation_results["schema_valid"] = False
            
        logger.info(f"Migration validation completed: {'PASSED' if validation_results['schema_valid'] else 'FAILED'}")
        
    except Exception as e:
        validation_results["schema_valid"] = False
        validation_results["validation_errors"].append(f"Validation failed: {str(e)}")
    
    return validation_results

async def warm_essential_cache(schema_manager: SchemaManager) -> Dict[str, Any]:
    """Warm cache with essential data for optimal performance"""
    cache_stats = {
        "cache_entries_created": 0,
        "cache_warming_errors": [],
        "categories_warmed": []
    }
    
    try:
        # Warm cache with active users
        with schema_manager.engine.begin() as conn:
            # Cache active users
            result = conn.execute("""
                SELECT id, username, email, bankroll, total_profit_loss, risk_tolerance
                FROM users_optimized 
                WHERE is_active = true 
                ORDER BY last_login DESC NULLS LAST
                LIMIT 1000
            """)
            
            active_users = result.fetchall()
            for user in active_users:
                user_data = dict(user)
                await cache_service.cache_user_data(user_data["id"], user_data, ttl=3600)
                cache_stats["cache_entries_created"] += 1
            
            cache_stats["categories_warmed"].append(f"active_users_{len(active_users)}")
            
            # Cache upcoming matches
            result = conn.execute("""
                SELECT * FROM matches_optimized 
                WHERE status IN ('scheduled', 'live') 
                AND start_time > NOW() - INTERVAL '1 day'
                ORDER BY start_time ASC
                LIMIT 500
            """)
            
            upcoming_matches = result.fetchall()
            for match in upcoming_matches:
                match_data = dict(match)
                await cache_service.cache_match(match_data["id"], match_data, ttl=1800)
                cache_stats["cache_entries_created"] += 1
            
            cache_stats["categories_warmed"].append(f"upcoming_matches_{len(upcoming_matches)}")
            
            # Cache recent predictions
            result = conn.execute("""
                SELECT * FROM predictions_optimized 
                WHERE created_at > NOW() - INTERVAL '24 hours'
                AND confidence_score > 0.7
                ORDER BY confidence_score DESC
                LIMIT 200
            """)
            
            recent_predictions = result.fetchall()
            for pred in recent_predictions:
                pred_data = dict(pred)
                await cache_service.cache_prediction(pred_data["match_id"], pred_data, ttl=1800)
                cache_stats["cache_entries_created"] += 1
            
            cache_stats["categories_warmed"].append(f"recent_predictions_{len(recent_predictions)}")
            
    except Exception as e:
        cache_stats["cache_warming_errors"].append(str(e))
        logger.error(f"Cache warming error: {e}")
    
    return cache_stats

async def save_performance_report(performance_report: Dict[str, Any]):
    """Save performance analysis report"""
    try:
        import json
        report_file = f"backend/logs/performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(report_file, 'w') as f:
            json.dump(performance_report, f, indent=2, default=str)
        
        logger.info(f"Performance report saved to: {report_file}")
        
    except Exception as e:
        logger.error(f"Could not save performance report: {e}")

def print_migration_summary(results: Dict[str, Any]):
    """Print a human-readable migration summary"""
    print("\n" + "="*80)
    print("DATABASE OPTIMIZATION & CONSOLIDATION SUMMARY")
    print("="*80)
    
    if results["success"]:
        print("✅ Migration Status: SUCCESS")
        print(f"⏱️  Duration: {results['duration']}")
        print(f"📊 Backed up: {results['backup_stats']['total_rows_backed_up']} rows from {results['backup_stats']['tables_backed_up']} tables")
        print(f"🔄 Migrated: {results['migration_stats']['total_rows_migrated']} rows to {results['migration_stats']['tables_migrated']} optimized tables")
        print(f"🚀 Cache entries: {results['cache_stats']['cache_entries_created']} warmed")
        print(f"📈 Performance optimizations: Applied")
        
        if results['validation_results']['schema_valid']:
            print("✅ Validation: PASSED")
        else:
            print("⚠️  Validation: Some issues detected")
            for error in results['validation_results']['validation_errors']:
                print(f"   - {error}")
    else:
        print("❌ Migration Status: FAILED")
        print(f"⏱️  Duration: {results['duration']}")
        print(f"❌ Error: {results['error']}")
    
    print("="*80)

if __name__ == "__main__":
    """Run migration script directly"""
    import os
    
    # Get database URL from environment or use default
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        # Default for development
        database_url = 'postgresql://postgres:password@localhost:5432/a1betting_dev'
        print(f"Using default database URL: {database_url}")
    
    # Run migration
    results = asyncio.run(run_complete_migration(database_url))
    
    # Print summary
    print_migration_summary(results)
    
    # Exit with appropriate code
    sys.exit(0 if results["success"] else 1)
