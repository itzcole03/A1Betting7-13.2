#!/usr/bin/env python3
"""
Simple Sport Defaults Migration Script

This script directly creates simple SQL migration statements for adding sport defaults.
Run this after updating the schema to add sport columns.

Usage:
    python simple_sport_migration.py
"""

print("=" * 60)
print("SPORT DEFAULTS MIGRATION SQL STATEMENTS")
print("=" * 60)
print()
print("Execute these SQL statements in your database to set default sport values:")
print()

# SQL statements to set default sport values
sql_statements = [
    "-- Set default sport for matches table (if exists and sport column is null)",
    "UPDATE matches SET sport = 'NBA' WHERE sport IS NULL OR sport = '';",
    "",
    "-- Set default sport for correlation tables (if they exist)",
    "UPDATE prop_correlation_stats SET sport = 'NBA' WHERE sport IS NULL OR sport = '' AND sport != 'MLB';",
    "UPDATE correlation_clusters SET sport = 'NBA' WHERE sport IS NULL OR sport = '' AND sport != 'MLB';", 
    "UPDATE correlation_factor_models SET sport = 'NBA' WHERE sport IS NULL OR sport = '' AND sport != 'MLB';",
    "",
    "-- Set default sport for provider states (if table exists)",
    "UPDATE provider_states SET sport = 'NBA' WHERE sport IS NULL OR sport = '';",
    "",
    "-- Set default sport for market events (if table exists)",
    "UPDATE market_events SET sport = 'NBA' WHERE sport IS NULL OR sport = '';",
    "",
    "-- Verify migration results",
    "SELECT 'matches' as table_name, COUNT(*) as nba_records FROM matches WHERE sport = 'NBA';",
    "SELECT 'provider_states' as table_name, COUNT(*) as nba_records FROM provider_states WHERE sport = 'NBA';",
    "SELECT 'market_events' as table_name, COUNT(*) as nba_records FROM market_events WHERE sport = 'NBA';",
    ""
]

for statement in sql_statements:
    print(statement)

print()
print("=" * 60)
print("MIGRATION NOTES")
print("=" * 60)
print()
print("1. This migration sets default sport to 'NBA' for existing records")
print("2. Some correlation tables already default to 'MLB' - those are preserved")
print("3. Run these statements manually in your SQLite/database client")
print("4. Verify the results using the SELECT statements at the end")
print("5. The migration is safe to run multiple times")
print()
print("After migration, all existing records will have sport = 'NBA' by default")
print("New records will use the sport parameter passed explicitly")
print("=" * 60)